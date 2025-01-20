import type { LLMClient } from "./llm-client";
import type {
  ActionHandler,
  ChainOfThoughtContext,
  CoTAction,
  LLMStructuredResponse,
} from "../types";
import { queryValidator } from "./validation";
import { Logger } from "./logger";
import { EventEmitter } from "events";
import {
  GoalManager,
  type HorizonType,
  type GoalStatus,
  type Goal,
} from "./goal-manager";
import { StepManager, type Step, type StepType } from "./step-manager";
import { LogLevel } from "../types";
import { injectTags } from "./utils";
import { systemPromptAction } from "./actions/system-prompt";
import Ajv from "ajv";
import type { VectorDB, EpisodicMemory, Documentation } from "./vector-db";
import { ChromaVectorDB } from "./vector-db";

// Todo: remove these when we bundle
import * as fs from "fs";
import * as path from "path";
import type { AnySchema, JSONSchemaType } from "ajv";

const ajv = new Ajv();

export class ChainOfThought extends EventEmitter {
  private stepManager: StepManager;
  private context: ChainOfThoughtContext;
  private snapshots: ChainOfThoughtContext[];
  private logger: Logger;
  private contextLogPath: string;
  goalManager: GoalManager;
  memory: VectorDB;

  private actionRegistry = new Map<string, ActionHandler>();
  private actionExamples = new Map<
    string,
    { description: string; example: string }
  >();

  private actionSchemas = new Map<string, JSONSchemaType<any>>();

  constructor(
    private llmClient: LLMClient,
    initialContext?: ChainOfThoughtContext,
    config: {
      chromaUrl?: string;
      logLevel?: LogLevel;
    } = {}
  ) {
    super();
    this.stepManager = new StepManager();
    this.context = initialContext ?? {
      worldState: "",
    };
    this.snapshots = [];
    this.logger = new Logger({
      level: LogLevel.ERROR,
      enableColors: true,
      enableTimestamp: true,
    });

    this.contextLogPath = path.join(process.cwd(), "logs", "context.log");
    // Ensure logs directory exists
    const logsDir = path.dirname(this.contextLogPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    // Log initial context
    this.logContext("INITIAL_CONTEXT");

    this.goalManager = new GoalManager();

    this.registerDefaultActions();

    // Initialize single memory system
    this.memory = new ChromaVectorDB("agent_memory", {
      chromaUrl: config.chromaUrl,
      logLevel: config.logLevel,
    });
  }

  private registerDefaultActions() {
    this.actionRegistry.set("SYSTEM_PROMPT", systemPromptAction);
  }

  public async planStrategy(objective: string): Promise<void> {
    this.logger.debug("planStrategy", "Planning strategy for objective", {
      objective,
    });

    const prompt = `
      <objective>
      "${objective}"
      </objective>

      <context>
      ${JSON.stringify(this.context, null, 2)}
      </context>

      <goal_planning_rules>
      1. Break down the objective into hierarchical goals
      2. Each goal must have clear success criteria
      3. Identify dependencies between goals
      4. Prioritize goals (1-10) based on urgency and impact
      5. Ensure goals are achievable given the current context
      
      Return a JSON structure with three arrays:
      - long_term: Strategic goals that might take multiple sessions
      - medium_term: Tactical goals achievable in one session
      - short_term: Immediate actionable goals
      
      Each goal must include:
      - description: Clear goal statement
      - success_criteria: Array of specific conditions for completion
      - dependencies: Array of prerequisite goal IDs (empty for initial goals)
      - priority: Number 1-10 (10 being highest)

      </goal_planning_rules>

    Return as JSON with this <response_structure>, do not include any other text:

    <response_structure>
      {
        "long_term": [{ description, success_criteria[], priority, dependencies[] }],
        "medium_term": [...],
        "short_term": [...]
      }
    </response_structure>

    `;

    try {
      const response = await this.llmClient.analyze(prompt, {
        system:
          "You are a strategic planning system that creates hierarchical goal structures.",
      });

      const goals = JSON.parse(response.toString());

      console.log(goals);

      // Create goals in order: long-term first, then medium, then short
      for (const horizon of [
        "long_term",
        "medium_term",
        "short_term",
      ] as const) {
        for (const goalData of goals[horizon]) {
          const newGoal = this.goalManager.addGoal({
            horizon: horizon.split("_")[0] as HorizonType,
            status: "pending",
            ...goalData,
            created_at: Date.now(),
          });

          this.emit("goal:created", {
            id: newGoal.id,
            description: newGoal.description,
          });
        }
      }

      // Add a planning step
      this.addStep(
        `Strategy planned for objective: ${objective}`,
        "planning",
        ["strategy-planning"],
        { goals }
      );
    } catch (error) {
      this.logger.error("planStrategy", "Failed to plan strategy", { error });
      throw error;
    }
  }

  private getPrioritizedGoals(): Goal[] {
    const readyGoals = this.goalManager.getReadyGoals();

    // Sort first by horizon priority (short > medium > long)
    const horizonPriority = {
      short: 3,
      medium: 2,
      long: 1,
    };

    return readyGoals.sort((a, b) => {
      // First sort by horizon
      const horizonDiff =
        horizonPriority[a.horizon] - horizonPriority[b.horizon];
      if (horizonDiff !== 0) return -horizonDiff;

      // Then by explicit priority
      return (b.priority || 0) - (a.priority || 0);
    });
  }

  private async canExecuteGoal(
    goal: Goal
  ): Promise<{ possible: boolean; reason: string }> {
    const prompt = `
      <goal_execution_check>
      Goal: ${goal.description}
      
      Current Context:
      ${JSON.stringify(this.context, null, 2)}
      
      Required dependencies:
      ${JSON.stringify(goal.dependencies || {}, null, 2)}
      
      Analyze if this goal can be executed right now. Consider:
      1. Are all required resources available?
      2. Are environmental conditions met?
      3. Are there any blocking conditions?
      

      </goal_execution_check>

    Return as JSON with this <response_structure>, do not include any other text:

    <response_structure>
      {
        "possible": boolean,
        "reason": string (explanation why possible/not possible)
      }
      </response_structure>

      Only return the JSON object, do not include any other text, backticks, or comments.
    `;

    try {
      const response = await this.llmClient.analyze(prompt, {
        system:
          "You are a goal feasibility analyzer that checks if goals can be executed given current conditions.",
      });

      console.log(response);

      return JSON.parse(response.toString());
    } catch (error) {
      this.logger.error(
        "canExecuteGoal",
        "Failed to check goal executability",
        { error }
      );
      return { possible: false, reason: "Error checking goal executability" };
    }
  }

  private async refineGoal(goal: any): Promise<void> {
    const prompt = `
      <goal_refinement>
      Goal to Refine: ${goal.description}
      
      Current Context:
      ${JSON.stringify(this.context, null, 2)}
      
      Break this goal down into more specific, immediately actionable sub-goals.
      Each sub-goal must be:
      1. Concrete and measurable
      2. Achievable with current resources
      3. Properly sequenced

      </goal_refinement>
      
      Return as JSON with this <response_structure>, do not include any other text:

      <response_structure>
      {
        "description": string,
        "success_criteria": string[],
        "priority": number,
        "horizon": "short",
        "requirements": object
      }
      </response_structure>

      Only return the JSON object, do not include any other text, backticks, or comments.
    `;

    try {
      const response = await this.llmClient.analyze(prompt, {
        system:
          "You are a goal refinement system that breaks down complex goals into actionable steps.",
      });

      const subGoals = JSON.parse(response.toString());

      // Add sub-goals to goal manager with parent reference
      for (const subGoal of subGoals) {
        this.goalManager.addGoal({
          ...subGoal,
          parentGoal: goal.id,
          status: "pending",
        });
      }

      // Update original goal status
      this.goalManager.updateGoalStatus(goal.id, "active");
    } catch (error) {
      this.logger.error("refineGoal", "Failed to refine goal", { error });
      throw error;
    }
  }

  public async executeNextGoal(): Promise<void> {
    const prioritizedGoals = this.getPrioritizedGoals();

    if (!prioritizedGoals.length) {
      this.logger.debug("executeNextGoal", "No ready goals available");
      return;
    }

    // Try goals in priority order until we find one we can execute
    for (const currentGoal of prioritizedGoals) {
      const { possible, reason } = await this.canExecuteGoal(currentGoal);

      if (!possible) {
        this.logger.debug("executeNextGoal", "Goal cannot be executed", {
          goalId: currentGoal.id,
          reason,
        });

        // If it's a medium/long term goal, try to refine it
        if (currentGoal.horizon !== "short") {
          this.logger.debug("executeNextGoal", "Attempting to refine goal", {
            goalId: currentGoal.id,
          });
          await this.refineGoal(currentGoal);
          continue;
        }

        // Mark as blocked and continue to next goal
        this.goalManager.blockGoalHierarchy(currentGoal.id, reason);
        this.emit("goal:blocked", {
          id: currentGoal.id,
          reason,
        });
        continue;
      }

      // We found an executable goal
      this.emit("goal:started", {
        id: currentGoal.id,
        description: currentGoal.description,
      });

      try {
        // Execute the goal using think()
        await this.think(currentGoal.description);

        // Check success criteria
        const success = await this.validateGoalSuccess(currentGoal);

        if (success) {
          await this.handleGoalCompletion(currentGoal);
        } else {
          // Instead of throwing error, block the goal and continue
          const blockReason = `Goal validation failed: Success criteria not met for ${currentGoal.description}`;
          this.goalManager.blockGoalHierarchy(currentGoal.id, blockReason);
          this.emit("goal:blocked", {
            id: currentGoal.id,
            reason: blockReason,
          });

          // Try the next goal
          continue;
        }

        // Only execute one successful goal per call
        break;
      } catch (error) {
        // Handle unexpected errors during execution
        this.logger.error(
          "executeNextGoal",
          "Unexpected error during goal execution",
          {
            goalId: currentGoal.id,
            error,
          }
        );

        await this.handleGoalFailure(currentGoal, error);

        // Continue with next goal instead of throwing
        continue;
      }
    }
  }

  private async handleGoalCompletion(goal: Goal): Promise<void> {
    this.goalManager.updateGoalStatus(goal.id, "completed");

    // Update context based on goal completion
    const contextUpdate = await this.determineContextUpdates(goal);
    if (contextUpdate) {
      this.mergeContext(contextUpdate);
    }

    // Check parent goals
    if (goal.parentGoal) {
      const parentGoal = this.goalManager.getGoalById(goal.parentGoal);
      if (parentGoal) {
        const siblingGoals = this.goalManager.getChildGoals(parentGoal.id);
        const allCompleted = siblingGoals.every(
          (g) => g.status === "completed"
        );

        if (allCompleted) {
          this.goalManager.updateGoalStatus(parentGoal.id, "ready");
        }
      }
    }

    // Update dependent goals
    const dependentGoals = this.goalManager.getDependentGoals(goal.id);
    for (const depGoal of dependentGoals) {
      if (this.goalManager.arePrerequisitesMet(depGoal.id)) {
        this.goalManager.updateGoalStatus(depGoal.id, "ready");
      }
    }

    this.emit("goal:completed", {
      id: goal.id,
      result: "Goal success criteria met",
    });
  }

  private async determineContextUpdates(
    goal: any
  ): Promise<Partial<ChainOfThoughtContext> | null> {
    const prompt = `
      <context_update_analysis>
      Completed Goal: ${goal.description}
      
      Current Context:
      ${JSON.stringify(this.context, null, 2)}
      
      Recent Steps:
      ${JSON.stringify(this.stepManager.getSteps().slice(-5), null, 2)}
      
      Analyze how the world state has changed after this goal completion.
      Return only a JSON object with updated context fields that have changed.
      </context_update_analysis>
    `;

    try {
      const response = await this.llmClient.analyze(prompt, {
        system:
          "You are a context analysis system that determines state changes after goal completion.",
      });

      return JSON.parse(response.toString());
    } catch (error) {
      this.logger.error(
        "determineContextUpdates",
        "Failed to determine context updates",
        { error }
      );
      return null;
    }
  }

  private async handleGoalFailure(
    goal: Goal,
    error: Error | unknown
  ): Promise<void> {
    this.goalManager.updateGoalStatus(goal.id, "failed");

    // If this was a sub-goal, mark parent as blocked
    if (goal.parentGoal) {
      this.goalManager.updateGoalStatus(goal.parentGoal, "blocked");
    }

    this.emit("goal:failed", {
      id: goal.id,
      error,
    });
  }

  private async validateGoalSuccess(goal: Goal): Promise<boolean> {
    const prompt = `
      <goal_validation>
      Goal: ${goal.description}
      
      Success Criteria:
      ${goal.success_criteria.map((c: string) => `- ${c}`).join("\n")}
      
      Recent Steps:
      ${JSON.stringify(this.stepManager.getSteps().slice(-10), null, 2)}
      
      Based on the goal description, success criteria and recent steps, has this goal been achieved?

      Outcome Score:
      - 0-100 = 0-100% success

      Return only a JSON object with: { "success": boolean, "reason": string, "outcomeScore": number }
      </goal_validation>
    `;

    try {
      const response = await this.llmClient.analyze(prompt, {
        system:
          "You are a goal validation system that carefully checks success criteria against the current context.",
      });

      const result = JSON.parse(response.toString());

      if (result.success) {
        this.addStep(
          `Goal validated as successful: ${result.reason}`,
          "system",
          ["goal-validation"]
        );
      } else {
        this.addStep(`Goal validation failed: ${result.reason}`, "system", [
          "goal-validation",
        ]);
      }

      // Record the outcome score
      this.goalManager.recordGoalOutcome(
        goal.id,
        result.outcomeScore,
        result.reason
      );

      return result.success;
    } catch (error) {
      this.logger.error("validateGoalSuccess", "Goal validation failed", {
        error,
      });
      return false;
    }
  }

  private logContext(trigger: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] Context changed by: ${trigger}\n${JSON.stringify(
      this.context,
      null,
      2
    )}\n${"=".repeat(80)}\n`;

    try {
      fs.appendFileSync(this.contextLogPath, logEntry);
    } catch (error) {
      this.logger.error("logContext", "Failed to write context log", { error });
    }
  }

  /**
   * Add a new step to the end of the chain.
   * @param content Reasoning or textual content of the step.
   * @param type The type of the step.
   * @param tags Optional tags or categories to label the step.
   * @param meta Additional metadata to store in the step.
   */
  public addStep(
    content: string,
    type: StepType = "action",
    tags?: string[],
    meta?: Record<string, any>
  ): Step {
    const newStep: Step = {
      id: this.generateUniqueId(),
      type,
      content,
      timestamp: Date.now(),
      tags,
      meta,
    } as Step;

    const step = this.stepManager.addStep(newStep);
    this.emit("step", step);
    return step;
  }

  /**
   * Insert a new step at a specified index in the chain.
   * Useful if you need to adjust or backtrack the chain of thought.
   * @param index The position where the new step should be inserted.
   * @param content The content of the new step.
   * @param tags Optional tags for the step.
   * @param meta Optional metadata.
   */
  public insertStep(
    index: number,
    content: string,
    tags?: string[],
    meta?: Record<string, any>
  ): Step {
    this.logger.debug("insertStep", "Inserting step at index", {
      index,
      content,
      tags,
      meta,
    });

    if (index < 0 || index > this.stepManager.getSteps().length) {
      const error = `Invalid index: ${index}. Index must be between 0 and ${
        this.stepManager.getSteps().length
      }`;
      this.logger.error("insertStep", error);
      throw new Error(error);
    }

    const newStep: Step = {
      id: this.generateUniqueId(),
      type: "action",
      content,
      timestamp: Date.now(),
      tags,
      meta,
    } as Step;

    this.stepManager.getSteps().splice(index, 0, newStep);
    return newStep;
  }

  /**
   * Update the content of an existing step.
   * @param stepId Unique identifier for the step to be updated.
   * @param newContent The new textual content.
   */
  public updateStepContent(stepId: string, newContent: string): void {
    this.logger.debug("updateStepContent", "Updating step content", {
      stepId,
      newContent,
    });

    const step = this.stepManager.getStepById(stepId);
    if (step && "content" in step) {
      (step as { content: string; timestamp: number }).content = newContent;
      (step as { content: string; timestamp: number }).timestamp = Date.now();
    } else {
      this.logger.warn("updateStepContent", "Step not found or invalid type", {
        stepId,
      });
    }
  }

  /**
   * Retrieve the entire chain of steps.
   */
  public getSteps(): Step[] {
    return this.stepManager.getSteps();
  }

  /**
   * Retrieve the current context.
   */
  public getContext(): ChainOfThoughtContext {
    return this.context;
  }

  /**
   * Merge new data into the current context.
   * @param newContext Partial context to merge into the existing context.
   */
  public mergeContext(newContext: Partial<ChainOfThoughtContext>): void {
    this.logger.debug("mergeContext", "Merging new context", { newContext });

    this.context = {
      ...this.context,
      ...newContext,
    };

    this.logContext("MERGE_CONTEXT");
  }

  /**
   * Add (push) a context snapshot to keep track of changes over time.
   */
  public snapshotContext(): void {
    this.logger.debug("snapshotContext", "Creating context snapshot");

    const snapshot = JSON.parse(JSON.stringify(this.context));
    this.snapshots.push(snapshot);

    this.logContext("SNAPSHOT_CREATED");
  }

  /**
   * Retrieve all snapshots.
   */
  public getSnapshots(): ChainOfThoughtContext[] {
    return this.snapshots;
  }

  public registerAction(
    type: string,
    handler: ActionHandler,
    example?: { description: string; example: string },
    schema?: JSONSchemaType<any>
  ): void {
    this.logger.debug("registerAction", "Registering custom action", { type });
    this.actionRegistry.set(type, handler);

    // Store the example snippet if provided
    if (example) {
      this.actionExamples.set(type, example);
    }

    if (schema) {
      this.actionSchemas.set(type, schema);
    }
  }

  /**
   * A central method to handle CoT actions that might be triggered by the LLM.
   * @param action The action to be executed.
   */
  public async executeAction(action: CoTAction): Promise<string> {
    this.logger.debug("executeAction", "Executing action", { action });
    this.emit("action:start", action);

    const actionStep = this.addStep(
      `Executing action: ${action.type}`,
      "action",
      ["action-execution"],
      { action }
    );

    try {
      // Validate the result against the schema
      if (this.actionSchemas.has(action.type)) {
        const validate = ajv.compile(
          this.actionSchemas.get(action.type) as AnySchema
        );
        if (!validate(action.payload)) {
          return "Invalid action result - try schema validation again";
        }
      }

      const handler = this.actionRegistry.get(action.type);
      if (!handler) {
        return `No handler registered for action type "${action.type}" try again`;
      }

      const result = await handler(action, this);

      // Format the result for better readability
      const formattedResult =
        typeof result === "object"
          ? `${action.type} completed successfully:\n${JSON.stringify(
              result,
              null,
              2
            )}`
          : result;

      // Update the action step
      this.stepManager.updateStep(actionStep.id, {
        content: `Action completed: ${formattedResult}`,
        meta: { ...actionStep.meta, result: formattedResult },
      });

      // Store in context
      this.mergeContext({
        actionHistory: {
          ...(this.context.actionHistory || {}),
          [Date.now()]: {
            action,
            result: formattedResult,
          },
        },
      });

      this.emit("action:complete", { action, result: formattedResult });
      return formattedResult;
    } catch (error) {
      // Update the action step with the error
      this.stepManager.updateStep(actionStep.id, {
        content: `Action failed: ${error}`,
        meta: { ...actionStep.meta, error },
      });
      this.emit("action:error", { action, error });
      throw error;
    }
  }

  /**
   * Generate a unique ID for steps. In a real environment,
   * you might use a library like uuid to ensure uniqueness.
   */
  private generateUniqueId(): string {
    // Quick example ID generator
    return "step-" + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Removes a step from the chain by its ID.
   * @param stepId The unique identifier of the step to remove
   * @throws Error if the step with the given ID doesn't exist
   */
  public removeStep(stepId: string): void {
    this.logger.debug("removeStep", "Removing step", { stepId });

    const index = this.stepManager
      .getSteps()
      .findIndex((step) => step.id === stepId);
    if (index === -1) {
      const error = `Step with ID ${stepId} not found`;
      this.logger.error("removeStep", error);
      throw new Error(error);
    }
    this.stepManager.removeStep(stepId);
  }

  /**
   * High-level method that:
   * 1. Builds a prompt from the chain & context
   * 2. Calls the LLM
   * 3. Validates and parses the response
   * 4. Executes or applies the returned plan & actions
   */
  public async callAndProcess(
    query: string,
    maxRetries: number = 3
  ): Promise<LLMStructuredResponse> {
    this.logger.debug("callAndProcess", "Starting LLM call", {
      maxRetries,
    });

    let attempts = 0;

    while (attempts < maxRetries) {
      // 1. Build the prompt
      const prompt = this.buildPrompt({ query });

      // 2. Send the prompt to the LLM and get a structured response
      try {
        const llmRawResponse = await this.callModel(prompt);

        // Parse the response
        let llmResponse: LLMStructuredResponse;
        try {
          llmResponse = JSON.parse(llmRawResponse) as LLMStructuredResponse;
        } catch (err) {
          this.logger.error(
            "callAndProcess",
            "Failed to parse LLM response as JSON",
            {
              error: err instanceof Error ? err.message : String(err),
              response: llmRawResponse,
            }
          );
          attempts++;
          continue;
        }

        // Validate the response structure
        if (!queryValidator(llmResponse)) {
          this.logger.error(
            "callAndProcess",
            "LLM response failed validation",
            {
              response: llmResponse,
            }
          );
          attempts++;
          continue;
        }

        // 3. Extract the plan and add it as a step
        if (llmResponse.plan) {
          this.addStep(`${llmResponse.plan}`, "planning", ["llm-plan"]);
        }

        // If we get here, everything worked
        return llmResponse;
      } catch (err) {
        this.logger.error("callAndProcess", "Error in LLM processing", {
          error: err instanceof Error ? err.message : String(err),
          attempt: attempts + 1,
        });
        attempts++;
      }
    }

    // If we get here, we've exhausted all retries
    const error = `Failed to get valid LLM response after ${maxRetries} attempts`;
    this.logger.error("callAndProcess", error);
    throw new Error(error);
  }

  /**
   * Returns a formatted string listing all available actions registered in the action registry
   */
  private getAvailableActions(): string {
    const actions = Array.from(this.actionRegistry.keys());
    return `Available actions:\n${actions
      .map((action) => `- ${action}`)
      .join("\n")}`;
  }

  /**
   * Build a prompt that instructs the LLM to produce structured data.
   * You can adapt the instructions, tone, or style as needed.
   */
  private buildPrompt(tags: Record<string, string> = {}): string {
    this.logger.debug("buildPrompt", "Building LLM prompt");

    // You can control how many steps or which steps to send
    // For example, let's just send the last few steps:
    const lastSteps = JSON.stringify(this.stepManager.getSteps());

    const actionExamplesText = Array.from(this.actionExamples.entries())
      .map(([type, { description, example }]) => {
        return `
Action Type: ${type}
Description: ${description}
Example JSON:
${example}
`;
      })
      .join("\n\n");

    // Format memory context
    const pastExperiences = this.context.pastExperiences
      ? this.context.pastExperiences
          .map(
            (exp) => `
Previous Experience:
- Action: ${exp.action}
- Outcome: ${exp.outcome}
- Importance: ${exp.importance || "N/A"}
`
          )
          .join("\n")
      : "No relevant past experiences";

    const relevantKnowledge = this.context.relevantKnowledge
      ? this.context.relevantKnowledge
          .map(
            (doc) => `
Related Knowledge:
- ${doc.title}
- Category: ${doc.category}
- Content: ${doc.content}
- Tags: ${doc.tags.join(", ")}
`
          )
          .join("\n")
      : "No relevant knowledge found";

    const prompt = `
    <global_context>
    <OBJECTIVE>
    
    <GOAL>
    {{query}}
    </GOAL>

You are a Chain of Thought reasoning system. Think through this problem step by step:

1. First, carefully analyze the goal and break it down into logical components
2. For each component, determine the precise actions and information needed
3. Consider dependencies and prerequisites between steps
4. Validate that each step directly contributes to the goal
5. Ensure the sequence is complete and sufficient to achieve the goal

Return a precise sequence of steps that achieves the given goal. Each step must be:
- Actionable and concrete
- Directly contributing to the goal
- Properly ordered in the sequence
- Validated against requirements

Focus solely on the goal you have been given. Do not add extra steps or deviate from the objective.
</OBJECTIVE>

<LAST_STEPS>
${lastSteps}
</LAST_STEPS>

<CONTEXT_SUMMARY>
${this.context.worldState}

{{additional_context}}
</CONTEXT_SUMMARY>

<STEP_VALIDATION_RULES>
1. Each step must have a clear, measurable outcome
2. Maximum 10 steps per sequence
3. Steps must be non-redundant unless explicitly required
4. All dynamic values (marked with <>) must be replaced with actual values
5. Use queries for information gathering, transactions for actions only
{{custom_validation_rules}}
</STEP_VALIDATION_RULES>

<REQUIRED_VALIDATIONS>
1. Resource costs must be verified before action execution
2. Building requirements must be confirmed before construction
3. Entity existence must be validated before interaction
4. If the required amounts are not available, end the sequence.
{{additional_validations}}
</REQUIRED_VALIDATIONS>

<OUTPUT_FORMAT>
Return a JSON array where each step contains:
- plan: A short explanation of what you will do
- meta: A metadata object with requirements for the step. Find this in the context.
- actions: A list of actions to be executed. You can either use ${this.getAvailableActions()}. You must only use these.

<AVAILABLE_ACTIONS>
Below is a list of actions you may use. For each action, 
the "payload" must follow the indicated structure exactly.

${actionExamplesText}
</AVAILABLE_ACTIONS>

{{output_format_details}}

Provide a JSON response with the following structure (this is an example only, use the available actions to determine the structure):

{
  "plan": "A short explanation of what you will do",
      "meta": {
      "requirements": {},
        "actions": [
    {
      "type": "ACTION_TYPE",
      "payload": { ... }
    }
  ]

}

</OUTPUT_FORMAT>

Do NOT include any additional keys outside of "plan" and "actions".
Make sure the JSON is valid. No extra text outside of the JSON.

<memory_context>
${pastExperiences}

${relevantKnowledge}
</memory_context>

</global_context>
`;

    return injectTags(tags, prompt);
  }

  private async callModel(prompt: string): Promise<string> {
    this.logger.debug("callModel", "Sending prompt to LLM");

    const response = await this.llmClient.analyze(prompt, {
      system: `"You are a reasoning system that outputs structured JSON only."`,
    });

    // Make sure we're dealing with a string
    let responseStr: string;

    if (typeof response === "string") {
      responseStr = response;
    } else if (typeof response === "object") {
      responseStr = JSON.stringify(response);
    } else {
      const error = `Unexpected response type from LLM: ${typeof response}`;
      this.logger.error("callModel", error);
      throw new Error(error);
    }

    this.logger.debug("callModel", "Received LLM response", {
      response: JSON.parse(responseStr),
    });

    return responseStr;
  }

  public async think(
    userQuery: string,
    maxIterations: number = 10
  ): Promise<void> {
    this.emit("think:start", { query: userQuery });

    try {
      // Consult single memory instance for both types of memories
      const [similarExperiences, relevantDocs] = await Promise.all([
        this.memory.findSimilarEpisodes(userQuery, 3),
        this.memory.findSimilarDocuments(userQuery, 3),
      ]);

      // Enhance context with memory insights
      this.mergeContext({
        pastExperiences: similarExperiences,
        relevantKnowledge: relevantDocs,
      });

      this.logger.debug("think", "Retrieved memory context", {
        experienceCount: similarExperiences.length,
        docCount: relevantDocs.length,
      });

      this.logger.debug("think", "Beginning to think", {
        userQuery,
        maxIterations,
      });

      // Initialize with user query
      this.addStep(`User  Query: ${userQuery}`, "task", ["user-query"]);

      let currentIteration = 0;
      let isComplete = false;
      const llmResponse = await this.callAndProcess(userQuery);
      let pendingActions: CoTAction[] = [...llmResponse.actions];

      while (
        !isComplete &&
        currentIteration < maxIterations &&
        pendingActions.length > 0
      ) {
        this.logger.debug("think", "Processing iteration", {
          currentIteration,
        });

        // Add new actions to pending queue
        pendingActions.push(...llmResponse.actions);

        // Process one action at a time
        if (pendingActions.length > 0) {
          const currentAction = pendingActions.shift()!;
          this.logger.debug("think", "Processing action", {
            action: currentAction,
            remainingActions: pendingActions.length,
          });

          // Validate action before execution
          if (!currentAction.type || !currentAction.payload) {
            this.logger.error("think", "Invalid action structure", {
              action: currentAction,
            });
            throw new Error(
              `Invalid action structure: ${JSON.stringify(currentAction)}`
            );
          }

          try {
            const result = await this.executeAction(currentAction);

            // Store the experience
            await this.storeExperience(currentAction.type, result);

            // If the result seems important, store as knowledge
            if (this.calculateImportance(result) > 0.7) {
              await this.storeKnowledge(
                `Learning from ${currentAction.type}`,
                result,
                "action_learning",
                [currentAction.type, "automated_learning"]
              );
            }

            const updateContext = this.buildPrompt({
              result,
            });

            // Check completion status
            const completionCheck = await this.llmClient.analyze(
              `
              ${updateContext}

             ${JSON.stringify({
               query: userQuery,
               currentSteps: this.stepManager.getSteps(),
               lastAction: currentAction.toString() + " RESULT:" + result,
             })},
             <verification_rules>
              Analyze using Chain of Verification:
1. The original query/goal - Verify the exact requirements
2. All steps taken so far - Verify each step was completed successfully
3. The current context - Verify the current state matches expectations
4. The result of the last action - Verify the outcome was correct
5. Values will always be in hexadecimal so convert them to decimal for verification

For each verification:
- Check preconditions were met  
- Validate the execution was proper
- Confirm expected postconditions
- Look for any edge cases or errors

Determine through verification:
- Has the goal been achieved OR determined to be impossible? (complete)
- What specific verifications led to your determination? (reason)
- Should the system continue only if resources are available? (shouldContinue)

Only return a JSON object with this exact structure:

{
  "complete": boolean,
  "reason": "detailed explanation of verification results",
  "shouldContinue": boolean,
  "newActions": [] // Only include if continuing and resources are available and search <global_context> for more details
}

Do not include any text outside the JSON object. Do not include backticks, backslashes, markdown formatting, or explanations.

</verification_rules>
                `,
              {
                system: `You are a goal completion analyzer using Chain of Verification. Your task is to carefully evaluate whether a goal has been achieved or is impossible based on the provided context. Use <verification_rules> to guide your analysis.
`,
              }
            );

            console.log(completionCheck);

            try {
              const completion = JSON.parse(completionCheck.toString());
              isComplete = completion.complete;

              if (completion.newActions) {
                // Extract actions from each plan in newActions
                const extractedActions = completion.newActions.flatMap(
                  (plan: any) => plan.actions || []
                );
                pendingActions.unshift(...extractedActions);
              }

              if (isComplete || !completion.shouldContinue) {
                this.addStep(
                  `Goal ${isComplete ? "achieved" : "failed"}: ${
                    completion.reason
                  }`,
                  "system",
                  ["completion"]
                );
                this.emit("think:complete", { query: userQuery });
                return;
              } else {
                this.addStep(
                  `Action completed, continuing execution: ${completion.reason}`,
                  "system",
                  ["continuation"]
                );
              }
            } catch (error) {
              this.logger.error(
                "solveQuery",
                "Error parsing completion check",
                {
                  error: error instanceof Error ? error.message : String(error),
                  completionCheck,
                }
              );
              continue;
            }
          } catch (error) {
            this.emit("think:error", { query: userQuery, error });
            throw error;
          }
        }

        currentIteration++;
      }

      if (currentIteration >= maxIterations) {
        const error = `Failed to solve query "${userQuery}" within ${maxIterations} iterations`;
        this.logger.error("solveQuery", error);
        this.emit("think:timeout", { query: userQuery });
      }
    } catch (error) {
      this.emit("think:error", { query: userQuery, error });
      throw error;
    }
  }

  private async formatActionOutcome(
    action: string,
    result: string | Record<string, any>
  ): Promise<string> {
    const resultStr =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);

    const summary = await this.llmClient.analyze(
      `
      Summarize this action result in a clear, concise way:
      
      Action: ${action}
      Result: ${resultStr}

      Rules for summary:
      1. Be concise but informative (1-2 lines max)
      2. Al values from the result to make the summary more informative
      3. Focus on the key outcomes or findings
      4. Use neutral, factual language
      5. Don't include technical details unless crucial
      6. Make it human-readable
      
      Return only the summary text, no additional formatting or explanation.
      `,
      {
        system:
          "You are a result summarizer. Create clear, concise summaries of action results.",
      }
    );

    return summary.toString().trim();
  }

  private async storeExperience(
    action: string,
    result: string | Record<string, any>,
    importance?: number
  ): Promise<void> {
    try {
      // Get semantic summary of the outcome
      const formattedOutcome = await this.formatActionOutcome(action, result);

      // Calculate importance if not provided
      const calculatedImportance =
        importance ?? this.calculateImportance(formattedOutcome);

      // Store the experience
      await this.memory.storeEpisode({
        timestamp: new Date(),
        action: action + " RESULT: " + result,
        outcome: formattedOutcome,
        context: this.context,
        importance: calculatedImportance,
        emotions: this.determineEmotions(
          action + " RESULT: " + result,
          formattedOutcome,
          calculatedImportance
        ),
      });

      this.emit("memory:experience_stored", {
        experience: {
          id: crypto.randomUUID(),
          action: action + " RESULT: " + result,
          outcome: formattedOutcome,
          timestamp: new Date(),
          context: this.context,
          importance: calculatedImportance,
          emotions: this.determineEmotions(
            action + " RESULT: " + result,
            formattedOutcome,
            calculatedImportance
          ),
        },
      });
    } catch (error) {
      this.logger.error("storeExperience", "Failed to store experience", {
        error,
      });
    }
  }

  private determineEmotions(
    action: string,
    result: string | Record<string, any>,
    importance: number
  ): string[] {
    const emotions: string[] = [];
    const resultStr =
      typeof result === "string" ? result : JSON.stringify(result);

    // Success/failure emotions
    if (
      resultStr.toLowerCase().includes("error") ||
      resultStr.toLowerCase().includes("failed")
    ) {
      emotions.push("frustrated");
      if (importance > 0.7) emotions.push("concerned");
    } else {
      emotions.push("satisfied");
      if (importance > 0.7) emotions.push("excited");
    }

    // Learning emotions
    if (
      resultStr.toLowerCase().includes("learned") ||
      resultStr.toLowerCase().includes("discovered")
    ) {
      emotions.push("curious");
    }

    // Action-specific emotions
    if (action.includes("QUERY") || action.includes("FETCH")) {
      emotions.push("analytical");
    }
    if (action.includes("TRANSACTION") || action.includes("EXECUTE")) {
      emotions.push("focused");
    }

    return emotions;
  }

  private calculateImportance(result: string): number {
    const keyTerms = {
      high: [
        "error",
        "critical",
        "important",
        "success",
        "discovered",
        "learned",
        "achieved",
        "completed",
        "milestone",
      ],
      medium: [
        "updated",
        "modified",
        "changed",
        "progress",
        "partial",
        "attempted",
      ],
      low: ["checked", "verified", "queried", "fetched", "routine", "standard"],
    };

    const resultLower = result.toLowerCase();

    // Calculate term-based score
    let termScore = 0;
    keyTerms.high.forEach((term) => {
      if (resultLower.includes(term)) termScore += 0.3;
    });
    keyTerms.medium.forEach((term) => {
      if (resultLower.includes(term)) termScore += 0.2;
    });
    keyTerms.low.forEach((term) => {
      if (resultLower.includes(term)) termScore += 0.1;
    });

    // Cap term score at 0.7
    termScore = Math.min(termScore, 0.7);

    // Calculate complexity score based on result length and structure
    const complexityScore = Math.min(
      result.length / 1000 +
        result.split("\n").length / 20 +
        (JSON.stringify(result).match(/{/g)?.length || 0) / 10,
      0.3
    );

    // Combine scores
    return Math.min(termScore + complexityScore, 1);
  }

  private async storeKnowledge(
    title: string,
    content: string,
    category: string,
    tags: string[]
  ): Promise<void> {
    try {
      await this.memory.storeDocument({
        title,
        content,
        category,
        tags,
        lastUpdated: new Date(),
      });

      this.emit("memory:knowledge_stored", {
        document: {
          id: crypto.randomUUID(),
          title,
          content,
          category,
          tags,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      this.logger.error("storeKnowledge", "Failed to store knowledge", {
        error,
      });
    }
  }
}

// Add type definitions for the events
export interface ChainOfThoughtEvents {
  step: (step: Step) => void;
  "action:start": (action: CoTAction) => void;
  "action:complete": (data: { action: CoTAction; result: string }) => void;
  "action:error": (data: { action: CoTAction; error: Error | unknown }) => void;
  "think:start": (data: { query: string }) => void;
  "think:complete": (data: { query: string }) => void;
  "think:timeout": (data: { query: string }) => void;
  "think:error": (data: { query: string; error: Error | unknown }) => void;
  "goal:created": (goal: { id: string; description: string }) => void;
  "goal:updated": (goal: { id: string; status: GoalStatus }) => void;
  "goal:completed": (goal: { id: string; result: any }) => void;
  "goal:failed": (goal: { id: string; error: Error | unknown }) => void;
  "goal:started": (goal: { id: string; description: string }) => void;
  "goal:blocked": (goal: { id: string; reason: string }) => void;
  "memory:experience_stored": (data: { experience: EpisodicMemory }) => void;
  "memory:knowledge_stored": (data: { document: Documentation }) => void;
  "memory:experience_retrieved": (data: {
    experiences: EpisodicMemory[];
  }) => void;
  "memory:knowledge_retrieved": (data: { documents: Documentation[] }) => void;
}

// Add type safety to event emitter
export declare interface ChainOfThought {
  on<K extends keyof ChainOfThoughtEvents>(
    event: K,
    listener: ChainOfThoughtEvents[K]
  ): this;
  emit<K extends keyof ChainOfThoughtEvents>(
    event: K,
    ...args: Parameters<ChainOfThoughtEvents[K]>
  ): boolean;
}
