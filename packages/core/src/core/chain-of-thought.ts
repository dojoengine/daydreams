import type { LLMClient } from "./llm-client";
import type {
    ChainOfThoughtContext,
    CoTAction,
    Goal,
    RefinedGoal,
    VectorDB,
    IOHandler,
    OutputIOHandler,
} from "./types";
import { Logger } from "./logger";
import { EventEmitter } from "events";
import { GoalManager } from "./goal-manager";
import { StepManager, type Step, type StepType } from "./step-manager";

import {
    calculateImportance,
    determineEmotions,
    generateUniqueId,
    validateLLMResponseSchema,
    injectTags,
} from "./utils";
import Ajv from "ajv";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { LogLevel } from "./types";

const ajv = new Ajv();

export class ChainOfThought extends EventEmitter {
    stepManager: StepManager;
    private context: ChainOfThoughtContext;
    private snapshots: ChainOfThoughtContext[];
    private logger: Logger;
    goalManager: GoalManager;
    public memory: VectorDB;

    private readonly outputs = new Map<string, IOHandler>();

    constructor(
        private llmClient: LLMClient,
        memory: VectorDB,
        initialContext?: ChainOfThoughtContext,
        config: {
            logLevel?: LogLevel;
        } = {}
    ) {
        super();
        this.setMaxListeners(50);
        this.memory = memory;
        this.stepManager = new StepManager();
        this.snapshots = [];
        this.goalManager = new GoalManager();

        this.context = initialContext ?? {
            worldState: "",
        };

        this.logger = new Logger({
            level: config.logLevel ?? LogLevel.ERROR,
            enableColors: true,
            enableTimestamp: true,
        });
    }

    /**
     * Plans a strategic approach to achieve a given objective by breaking it down into hierarchical goals.
     *
     * This method:
     * 1. Retrieves relevant documents and past experiences from memory
     * 2. Generates a hierarchical goal structure with long-term, medium-term, and short-term goals
     * 3. Creates goals in the goal manager and emits goal creation events
     * 4. Records the planning step
     *
     * @param objective - The high-level objective to plan for
     * @throws Will throw an error if strategy planning fails
     * @emits goal:created - When each new goal is created
     */
    public async decomposeObjectiveIntoGoals(objective: string): Promise<void> {
        this.logger.debug(
            "decomposeObjectiveIntoGoals",
            "Planning strategy for objective",
            {
                objective,
            }
        );

        // Fetch relevant documents and experiences related to the objective
        const [relevantDocs, relevantExperiences] = await Promise.all([
            this.memory.findSimilarDocuments(objective, 5),
            this.memory.findSimilarEpisodes(objective, 3),
        ]);

        this.logger.debug(
            "decomposeObjectiveIntoGoals",
            "Retrieved relevant context",
            {
                docCount: relevantDocs.length,
                expCount: relevantExperiences.length,
            }
        );

        // Build context from relevant documents
        const gameStateContext = relevantDocs
            .map(
                (doc) => `
        Document: ${doc.title}
        Category: ${doc.category}
        Content: ${doc.content}
        Tags: ${doc.tags.join(", ")}
      `
            )
            .join("\n\n");

        // Build context from past experiences
        const experienceContext = relevantExperiences
            .map(
                (exp) => `
        Past Experience:
        Action: ${exp.action}
        Outcome: ${exp.outcome}
        Importance: ${exp.importance}
        Emotions: ${exp.emotions?.join(", ") || "none"}
      `
            )
            .join("\n\n");

        const prompt = `
      <objective>
      "${objective}"
      </objective>

      <context>
      ${gameStateContext}
      
      <past_experiences>
      ${experienceContext}
      </past_experiences>

      </context>

      <goal_planning_rules>
      1. Break down the objective into hierarchical goals
      2. Each goal must have clear success criteria
      3. Identify dependencies between goals
      4. Prioritize goals (1-10) based on urgency and impact
      5. short term goals should be given a priority of 10
      6. Ensure goals are achievable given the current context
      7. Consider past experiences when setting goals
      8. Use available game state information to inform strategy
      
      # Return a JSON structure with three arrays:
      - long_term: Strategic goals that might take multiple sessions
      - medium_term: Tactical goals achievable in one session
      - short_term: Immediate actionable goals
      
      # Each goal must include:
      - id: Unique temporary ID used in dependencies
      - description: Clear goal statement
      - success_criteria: Array of specific conditions for completion
      - dependencies: Array of prerequisite goal IDs (empty for initial goals)
      - priority: Number 1-10 (10 being highest)
      - required_resources: Array of resources needed (based on game state)
      - estimated_difficulty: Number 1-10 based on past experiences
      </goal_planning_rules>
    `;

        const goalSchema = z.object({
            id: z.string(),
            description: z.string(),
            success_criteria: z.array(z.string()),
            dependencies: z.array(z.string()),
            priority: z.number().min(1).max(10),
            required_resources: z.array(z.string()),
            estimated_difficulty: z.number().min(1).max(10),
        });

        const goalPlanningSchema = z.object({
            long_term: z.array(goalSchema),
            medium_term: z.array(goalSchema),
            short_term: z.array(goalSchema),
        });

        try {
            const goals = await validateLLMResponseSchema({
                prompt,
                systemPrompt:
                    "You are a strategic planning system that creates hierarchical goal structures.",
                schema: goalPlanningSchema,
                maxRetries: 3,
                onRetry: (error, attempt) => {
                    this.logger.error(
                        "decomposeObjectiveIntoGoals",
                        `Attempt ${attempt} failed`,
                        {
                            error,
                        }
                    );
                },
                llmClient: this.llmClient,
                logger: this.logger,
            });

            const allLLMGoals = [
                ...goals.long_term.map((g) => ({
                    horizon: "long" as const,
                    ...g,
                })),
                ...goals.medium_term.map((g) => ({
                    horizon: "medium" as const,
                    ...g,
                })),
                ...goals.short_term.map((g) => ({
                    horizon: "short" as const,
                    ...g,
                })),
            ];

            // Link: LLM’s "id" -> goal manager’s "goal-xyz" ID
            const llmIdToRealId = new Map<string, string>();

            // Keep track of newly created goal IDs so we can fetch them after pass #2
            const createdGoalIds: string[] = [];

            // Pass #1: Create each goal (with empty dependencies)
            for (const llmGoal of allLLMGoals) {
                const {
                    id: llmId,
                    horizon,
                    dependencies: _,
                    ...rest
                } = llmGoal;

                // Create a new goal, letting GoalManager generate the random ID
                const newGoal = this.goalManager.addGoal({
                    horizon,
                    status: "pending",
                    created_at: Date.now(),
                    dependencies: [], // empty for now, will fill in pass #2
                    ...rest,
                });

                // Map LLM’s temp ID -> our new random ID
                llmIdToRealId.set(llmId, newGoal.id);
                createdGoalIds.push(newGoal.id);

                this.emit("goal:created", {
                    id: newGoal.id,
                    description: newGoal.description,
                    priority: newGoal.priority,
                });
            }

            // PASS #2: Update dependencies with real IDs
            for (const llmGoal of allLLMGoals) {
                // Grab the real ID for this LLM goal
                const realGoalId = llmIdToRealId.get(llmGoal.id);
                if (!realGoalId) continue;

                // Convert LLM dependencies to our manager IDs
                const realDeps = llmGoal.dependencies
                    .map((dep) => llmIdToRealId.get(dep))
                    .filter((id): id is string => !!id);

                this.goalManager.updateGoalDependencies(realGoalId, realDeps);
            }

            // Get all the goals we just created
            const finalGoals = createdGoalIds
                .map((id) => this.goalManager.getGoalById(id))
                .filter((g): g is Goal => !!g);

            // Update goals with no dependencies to ready
            for (const goal of finalGoals) {
                if (goal.dependencies && goal.dependencies.length === 0) {
                    this.goalManager.updateGoalStatus(goal.id, "ready");
                }
            }

            // Add a planning step
            this.recordReasoningStep(
                `Strategy planned for objective: ${objective}`,
                "planning",
                ["strategy-planning"],
                { goals: finalGoals }
            );
        } catch (error) {
            this.logger.error(
                "decomposeObjectiveIntoGoals",
                "Failed to plan strategy",
                { error }
            );
            throw error;
        }
    }

    /**
     * Checks if a goal can be executed based on current state and requirements.
     *
     * Analyzes the goal against relevant documents, past experiences, and current state
     * to determine if all prerequisites are met for execution.
     *
     * @param goal - The goal to evaluate for execution
     * @returns Object containing:
     *  - possible: Whether the goal can be executed
     *  - reason: Explanation of why the goal can/cannot be executed
     *  - missing_requirements: List of requirements that are not met
     *  - incompleteState: Optional flag indicating if state info is incomplete
     */
    private async validateGoalPrerequisites(goal: Goal): Promise<{
        possible: boolean;
        reason: string;
        missing_requirements: string[];
        incompleteState?: boolean;
    }> {
        const [relevantDocs, relevantExperiences, blackboardState] =
            await Promise.all([
                this.memory.findSimilarDocuments(goal.description, 5),
                this.memory.findSimilarEpisodes(goal.description, 3),
                this.getBlackboardState(),
            ]);

        const prompt = `
    

      <goal>
      ${goal.description}
      </goal>

      <relevant_context>
      ${relevantDocs
          .map((doc) => `Document: ${doc.title}\n${doc.content}`)
          .join("\n\n")}
      </relevant_context>

      <relevant_experiences>
      ${relevantExperiences
          .map((exp) => `Experience: ${exp.action}\n${exp.outcome}`)
          .join("\n\n")}
      </relevant_experiences>

      <current_game_state>
      ${JSON.stringify(blackboardState, null, 2)}
      </current_game_state>
      
      # Required dependencies:
      ${JSON.stringify(goal.dependencies || {}, null, 2)}
      
      # Analyze if this goal can be executed right now. Consider:

      1. Are all required resources available in the current game state?
      2. Are environmental conditions met?
      3. Are there any blocking conditions?
      4. Do we have the necessary game state requirements?

      If you need to query then you could potentially complete the goal.
      
      <thinking>
      Think about this goal and the context here.
      </thinking>
     
    `;

        try {
            const schema = z
                .object({
                    possible: z.boolean(),
                    reason: z.string(),
                    missing_requirements: z.array(z.string()),
                    incompleteState: z
                        .boolean()
                        .optional()
                        .describe(
                            "If the goal is not possible due to incomplete state"
                        ),
                })
                .strict();

            const response = await validateLLMResponseSchema<{
                possible: boolean;
                reason: string;
                missing_requirements: string[];
            }>({
                prompt,
                systemPrompt:
                    "You are a goal feasibility analyzer that checks if goals can be executed given current conditions.",
                schema,
                maxRetries: 3,
                onRetry: (error, attempt) => {
                    this.logger.warn(
                        "validateGoalPrerequisites",
                        `Retry attempt ${attempt}`,
                        {
                            error,
                        }
                    );
                },
                llmClient: this.llmClient,
                logger: this.logger,
            });

            this.logger.debug(
                "validateGoalPrerequisites",
                "Goal validation response",
                { response }
            );

            return response;
        } catch (error) {
            this.logger.error(
                "validateGoalPrerequisites",
                "Failed to check goal executability",
                { error }
            );
            return {
                possible: false,
                reason: "Error checking goal executability",
                missing_requirements: [],
                incompleteState: false,
            };
        }
    }
    /**
     * Refines a high-level goal into more specific, actionable sub-goals by analyzing relevant context.
     *
     * This method:
     * 1. Retrieves relevant documents and past experiences from memory
     * 2. Gets current blackboard state
     * 3. Uses LLM to break down the goal into concrete sub-goals
     * 4. Validates sub-goals match required schema
     *
     * @param goal - The high-level goal to refine into sub-goals
     * @param maxRetries - Maximum number of retries for LLM calls (default: 3)
     * @throws Will throw an error if goal refinement fails after max retries
     * @internal
     */
    private async breakdownGoalIntoSubtasks(
        goal: Goal,
        maxRetries: number = 3
    ): Promise<void> {
        const [relevantDocs, relevantExperiences, blackboardState] =
            await Promise.all([
                this.memory.findSimilarDocuments(goal.description, 5),
                this.memory.findSimilarEpisodes(goal.description, 3),
                this.getBlackboardState(),
            ]);

        const schema = z.array(
            z
                .object({
                    description: z.string(),
                    success_criteria: z.array(z.string()),
                    priority: z.number(),
                    horizon: z.literal("short"),
                    requirements: z.record(z.any()),
                })
                .strict()
        );

        const prompt = `

       <goal_refinement>
      ${goal.description}
      </goal_refinement>
      
      <relevant_context>
      ${relevantDocs
          .map((doc) => `Document: ${doc.title}\n${doc.content}`)
          .join("\n\n")}
      </relevant_context>

      <relevant_experiences>
      ${relevantExperiences
          .map((exp) => `Experience: ${exp.action}\n${exp.outcome}`)
          .join("\n\n")}
      </relevant_experiences>

      <current_game_state>
      ${JSON.stringify(blackboardState, null, 2)}
      </current_game_state>

      # Goal Refinement Rules
      Break this goal down into more specific, immediately actionable sub-goals.
      Each sub-goal must be:
      1. Concrete and measurable
      2. Achievable with current resources
      3. Properly sequenced

      # Goal Refinement Schema
      Return an array of sub-goals, each with:
      - description: Clear goal statement
      - success_criteria: Array of specific conditions for completion
      - priority: Number 1-10 (10 being highest)
      - horizon: Must be "short" for immediate actions
      - requirements: Object containing needed resources/conditions

      <thinking>
      Think about this goal and the context here.
      </thinking>
    `;

        try {
            const subGoals = await validateLLMResponseSchema<RefinedGoal[]>({
                prompt,
                systemPrompt:
                    "You are a goal refinement system that breaks down complex goals into actionable steps. Return only valid JSON array matching the schema.",
                schema,
                maxRetries,
                onRetry: (error, attempt) => {
                    this.logger.error(
                        "breakdownGoalIntoSubtasks",
                        `Attempt ${attempt} failed`,
                        {
                            error,
                        }
                    );
                },
                llmClient: this.llmClient,
                logger: this.logger,
            });

            // Add sub-goals to goal manager with parent reference
            for (const subGoal of subGoals) {
                this.goalManager.addGoal({
                    ...subGoal,
                    parentGoal: goal.id,
                    status: "pending",
                    created_at: Date.now(),
                });
            }

            // Update original goal status
            this.goalManager.updateGoalStatus(goal.id, "active");
        } catch (error) {
            throw new Error(
                `Failed to refine goal after ${maxRetries} attempts: ${error}`
            );
        }
    }

    /**
     * Executes the next highest priority goal that is ready for execution.
     *
     * This method:
     * 1. Gets prioritized list of ready goals
     * 2. For each goal, checks if it can be executed
     * 3. If executable, attempts execution
     * 4. If not executable:
     *    - For short-term goals with incomplete state, attempts anyway
     *    - For non-short-term goals with incomplete state, refines the goal
     *    - Otherwise blocks the goal hierarchy
     *
     * @emits goal:started - When goal execution begins
     * @emits goal:blocked - When a goal cannot be executed
     * @returns Promise that resolves when execution is complete
     */
    public async processHighestPriorityGoal(): Promise<void> {
        const prioritizedGoals = this.goalManager
            .getReadyGoalsByPriority()
            .filter((goal) => goal.status !== "completed");

        if (!prioritizedGoals.length) {
            this.logger.debug(
                "processHighestPriorityGoal",
                "No ready goals available"
            );
            return;
        }

        this.logger.debug(
            "processHighestPriorityGoal",
            "Prioritized goals available",
            { goals: prioritizedGoals }
        );

        for (const currentGoal of prioritizedGoals) {
            this.logger.debug("processHighestPriorityGoal", "Current goal", {
                goal: currentGoal,
            });

            const { possible, reason, incompleteState } =
                await this.validateGoalPrerequisites(currentGoal);

            this.logger.debug("processHighestPriorityGoal", "Goal validation", {
                possible,
                reason,
                incompleteState,
            });

            // ------------------------------------------------------------------
            // Decide how to handle "false" from validateGoalPrerequisites
            // ------------------------------------------------------------------
            if (!possible) {
                // If it's incomplete state and short-term,
                // let's try it anyway.
                if (incompleteState && currentGoal.horizon === "short") {
                    this.logger.warn(
                        "processHighestPriorityGoal",
                        `Requirements are incomplete for short-term goal "${currentGoal.description}". Attempting anyway...`,
                        { goalId: currentGoal.id, reason }
                    );
                }
                // If it's incomplete state but not short-term -> refine
                else if (incompleteState && currentGoal.horizon !== "short") {
                    this.logger.debug(
                        "processHighestPriorityGoal",
                        "Attempting to refine goal",
                        {
                            goalId: currentGoal.id,
                        }
                    );
                    await this.breakdownGoalIntoSubtasks(currentGoal);
                    continue; // move on to the next goal
                }
                // Otherwise, block as usual
                else {
                    this.goalManager.blockGoalHierarchy(currentGoal.id, reason);
                    this.emit("goal:blocked", {
                        id: currentGoal.id,
                        reason,
                    });
                    continue; // move on to the next goal
                }
            }

            // ------------------------------------------------------------------
            // If either possible=true or we decided to attempt with incomplete data:
            // ------------------------------------------------------------------
            this.emit("goal:started", {
                id: currentGoal.id,
                description: currentGoal.description,
            });

            try {
                // Execute the goal using think()
                await this.think(currentGoal.description);

                // Check success criteria
                const success = await this.evaluateGoalCompletion(currentGoal);
                if (success) {
                    await this.processGoalSuccess(currentGoal);
                } else {
                    const blockReason = `Goal validation failed: Success criteria not met for "${currentGoal.description}"`;
                    this.goalManager.blockGoalHierarchy(
                        currentGoal.id,
                        blockReason
                    );
                    this.emit("goal:blocked", {
                        id: currentGoal.id,
                        reason: blockReason,
                    });
                    continue;
                }

                // Only execute one successful goal per call
                break;
            } catch (error) {
                this.logger.error(
                    "processHighestPriorityGoal",
                    "Unexpected error during goal execution",
                    {
                        goalId: currentGoal.id,
                        error,
                    }
                );
                await this.processGoalFailure(currentGoal, error);
                // Go on to the next goal
                continue;
            }
        }
    }

    private async processGoalSuccess(goal: Goal): Promise<void> {
        this.goalManager.updateGoalStatus(goal.id, "completed");

        // Update context based on goal completion
        const contextUpdate = await this.analyzeStateChangesAfterGoal(goal);
        if (contextUpdate) {
            this.updateContextState(contextUpdate);

            // Store relevant state changes in blackboard
            const timestamp = Date.now();
            for (const [key, value] of Object.entries(contextUpdate)) {
                await this.updateBlackboard({
                    type: "state",
                    key,
                    value,
                    timestamp,
                    metadata: {
                        goal_id: goal.id,
                        goal_description: goal.description,
                    },
                });
            }
        }

        // Check parent goals
        if (goal.parentGoal) {
            const parentGoal = this.goalManager.getGoalById(goal.parentGoal);
            if (parentGoal) {
                const siblingGoals = this.goalManager.getChildGoals(
                    parentGoal.id
                );
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

    /**
     * Analyzes how the world state has changed after a goal is completed and determines what context updates are needed.
     *
     * This method:
     * 1. Gets the current blackboard state
     * 2. Analyzes recent steps and the completed goal
     * 3. Uses LLM to determine what context fields need to be updated
     *
     * @param goal - The completed goal to analyze for context changes
     * @returns A partial context object with only the fields that need updating, or null if analysis fails
     * @internal
     */
    private async analyzeStateChangesAfterGoal(
        goal: Goal
    ): Promise<Partial<ChainOfThoughtContext> | null> {
        const blackboardState = await this.getBlackboardState();

        const prompt = `
      <context_update_analysis>
      Completed Goal: ${goal.description}
      
      Current Context:
      ${JSON.stringify(blackboardState, null, 2)}
      
      Recent Steps:
      ${JSON.stringify(this.stepManager.getSteps().slice(-5), null, 2)}
      
      Analyze how the world state has changed after this goal completion.
      Return only a JSON object with updated context fields that have changed.
      </context_update_analysis>
    `;

        try {
            const response = await this.llmClient.analyze(prompt, {
                system: "You are a context analysis system that determines state changes after goal completion.",
            });

            return JSON.parse(response.toString());
        } catch (error) {
            this.logger.error(
                "analyzeStateChangesAfterGoal",
                "Failed to determine context updates",
                { error }
            );
            return null;
        }
    }

    /**
     * Handles the failure of a goal by updating its status and notifying relevant systems.
     *
     * This method:
     * 1. Updates the failed goal's status
     * 2. If the goal has a parent, marks the parent as blocked
     * 3. Emits a goal:failed event
     *
     * @param goal - The goal that failed
     * @param error - The error that caused the failure
     * @internal
     */
    private async processGoalFailure(
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

    /**
     * Validates whether a goal has been successfully achieved by analyzing the current context
     * against the goal's success criteria.
     *
     * This method:
     * 1. Gets the current blackboard state
     * 2. Prompts an LLM to evaluate success criteria against context
     * 3. Returns whether the goal was validated as successful
     *
     * @param goal - The goal to validate
     * @returns A boolean indicating whether the goal was successfully achieved
     * @internal
     */
    private async evaluateGoalCompletion(goal: Goal): Promise<boolean> {
        const blackboardState = await this.getBlackboardState();

        const prompt = `
      <goal_validation>
      Goal: ${goal.description}
      
      Success Criteria:
      ${goal.success_criteria.map((c: string) => `- ${c}`).join("\n")}
      
      Current Context:
      ${JSON.stringify(blackboardState, null, 2)}
      
      Recent Steps:
      ${JSON.stringify(this.stepManager.getSteps().slice(-10), null, 2)}
      
      Based on the success criteria and current context, has this goal been achieved?

      Outcome Score:
      - 0-100 = 0-100% success

      </goal_validation>
    `;

        try {
            const response = await validateLLMResponseSchema({
                prompt,
                systemPrompt:
                    "You are a goal validation system that carefully checks success criteria against the current context.",
                schema: z.object({
                    success: z.boolean(),
                    reason: z.string(),
                    outcomeScore: z.number(),
                }),
                llmClient: this.llmClient,
                logger: this.logger,
            });

            console.log(
                "evaluateGoalCompletion response: =================================",
                response
            );

            if (response.success) {
                this.recordReasoningStep(
                    `Goal validated as successful: ${response.reason}`,
                    "system",
                    ["goal-validation"]
                );
            } else {
                this.recordReasoningStep(
                    `Goal validation failed: ${response.reason}`,
                    "system",
                    ["goal-validation"]
                );
            }

            // Record the outcome score
            this.goalManager.recordGoalOutcome(
                goal.id,
                response.outcomeScore,
                response.reason
            );

            return response.success;
        } catch (error) {
            this.logger.error(
                "evaluateGoalCompletion",
                "Goal validation failed",
                {
                    error,
                }
            );
            return false;
        }
    }

    /**
     * Adds a new step to the chain of thought sequence.
     *
     * @remarks
     * Each step represents a discrete action, reasoning, or decision point in the chain.
     * Steps are stored in chronological order and can be tagged for categorization.
     *
     * @param content - The main content/description of the step
     * @param type - The type of step (e.g. "action", "reasoning", "system", etc)
     * @param tags - Optional array of string tags to categorize the step
     * @param meta - Optional metadata object to store additional step information
     * @returns The newly created Step object
     *
     * @example
     * ```ts
     * chain.recordReasoningStep("Analyzing user request", "reasoning", ["analysis"]);
     * ```
     */
    public recordReasoningStep(
        content: string,
        type: StepType = "action",
        tags?: string[],
        meta?: Record<string, any>
    ): Step {
        const newStep: Step = {
            id: generateUniqueId(),
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
     * Merges new data into the current chain of thought context.
     *
     * @remarks
     * This method performs a shallow merge of the provided partial context into the existing context.
     * Any properties in the new context will overwrite matching properties in the current context.
     * Properties not included in the new context will remain unchanged.
     *
     * @param newContext - Partial context object containing properties to merge into the existing context
     * @throws Will not throw errors, but invalid context properties will be ignored
     *
     * @example
     * ```ts
     * chain.updateContextState({
     *   worldState: "Updated world state",
     *   newProperty: "New value"
     * });
     * ```
     */
    public updateContextState(
        newContext: Partial<ChainOfThoughtContext>
    ): void {
        this.logger.debug("updateContextState", "Merging new context", {
            newContext,
        });

        this.context = {
            ...this.context,
            ...newContext,
        };
    }

    /**
     * Creates and stores a snapshot of the current context state.
     *
     * @remarks
     * This method creates a deep copy of the current context and adds it to the snapshots array.
     * Snapshots provide a historical record of how the context has changed over time.
     * Each snapshot is a complete copy of the context at that point in time.
     *
     * @example
     * ```ts
     * chain.saveContextSnapshot(); // Creates a snapshot of current context state
     * ```
     */
    public saveContextSnapshot(): void {
        this.logger.debug("saveContextSnapshot", "Creating context snapshot");

        const snapshot = JSON.parse(JSON.stringify(this.context));
        this.snapshots.push(snapshot);
    }

    /**
     * Retrieves all context snapshots that have been captured.
     *
     * @remarks
     * Returns an array containing all historical snapshots of the context state,
     * in chronological order. Each snapshot represents the complete context state
     * at the time it was captured using {@link saveContextSnapshot}.
     *
     * @returns An array of {@link ChainOfThoughtContext} objects representing the historical snapshots
     *
     * @example
     * ```ts
     * const snapshots = chain.getContextHistory();
     * console.log(`Number of snapshots: ${snapshots.length}`);
     * ```
     */
    public getContextHistory(): ChainOfThoughtContext[] {
        return this.snapshots;
    }

    /**
     * Registers an output handler for a specific action type.
     *
     * @param output - The output handler configuration containing the name and schema
     * @remarks
     * Output handlers define how different action types should be processed and validated.
     * Each output handler is associated with a specific action type and includes a schema
     * for validating action payloads.
     *
     * @example
     * ```ts
     * chain.registerOutput({
     *   name: "sendMessage",
     *   schema: z.object({
     *     message: z.string()
     *   })
     * });
     * ```
     */
    public registerOutput(output: IOHandler): void {
        this.logger.debug("registerOutput", "Registering output", {
            name: output.name,
        });
        this.outputs.set(output.name, output);
    }

    /**
     * Removes a registered output handler.
     *
     * @param name - The name of the output handler to remove
     * @remarks
     * This method removes a previously registered output handler from the chain.
     * If no handler exists with the given name, this method will do nothing.
     *
     * @example
     * ```ts
     * chain.removeOutput("sendMessage");
     * ```
     */
    public removeOutput(name: string): void {
        if (this.outputs.has(name)) {
            this.outputs.delete(name);
            this.logger.debug("removeOutput", `Removed output: ${name}`);
        }
    }

    /**
     * Executes a Chain of Thought action triggered by the LLM.
     *
     * @param action - The Chain of Thought action to execute
     * @returns A string describing the result of the action execution
     * @throws {Error} If the action handler throws an error during execution
     * @remarks
     * This method handles the execution of actions triggered by the LLM during the Chain of Thought process.
     * It validates the action payload against the registered output handler's schema and executes the
     * corresponding handler function.
     *
     * @example
     * ```ts
     * const result = await chain.executeAction({
     *   type: "sendMessage",
     *   context: "Sending a message to user"
     *   payload: {
     *     message: "Hello world"
     *   }
     * });
     * ```
     */
    public async executeAction(action: CoTAction): Promise<string> {
        this.logger.debug("executeAction", "Executing action", { action });
        this.emit("action:start", action);

        const actionStep = this.recordReasoningStep(
            `Executing action: ${action.type}`,
            "action",
            ["action-execution"],
            { action }
        );

        try {
            // Get the output handler and schema
            const output = this.outputs.get(action.type) as OutputIOHandler;
            if (!output || !output.execute || !output.outputSchema) {
                return `No handler registered for action type "${action.type}" try again`;
            }

            // Convert Zod schema to JSON schema
            const jsonSchema = zodToJsonSchema(
                output.outputSchema,
                action.type
            );
            const validate = ajv.compile(jsonSchema);

            // Validate the payload against the schema
            if (!validate(action.payload)) {
                return "Invalid action payload - schema validation failed";
            }

            const result = await output.execute(action);

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
            this.updateContextState({
                actionHistory: {
                    ...(this.context.actionHistory || {}),
                    [Date.now()]: {
                        action,
                        result: formattedResult || "",
                    },
                } as Record<number, { action: CoTAction; result: string }>,
            });

            this.emit("action:complete", { action, result: formattedResult });
            return JSON.stringify(formattedResult);
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

    private buildPrompt(tags: Record<string, string> = {}): string {
        this.logger.debug("buildPrompt", "Building LLM prompt");

        const lastSteps = JSON.stringify(this.stepManager.getSteps());

        const availableOutputs = Array.from(this.outputs.entries()) as [
            string,
            OutputIOHandler,
        ][];

        const availableOutputsSchema = availableOutputs
            .filter(([_, output]) => output.outputSchema)
            .map(([name, output]) => {
                return `${name}: ${JSON.stringify(zodToJsonSchema(output.outputSchema, name), null, 2)}`;
            })
            .join("\n\n");

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

## Step Validation Rules
1. Each step must have a clear, measurable outcome
2. Maximum 10 steps per sequence
3. Steps must be non-redundant unless explicitly required
4. All dynamic values (marked with <>) must be replaced with actual values
5. Use queries for information gathering, transactions for actions only
{{custom_validation_rules}}


## Required Validations
1. Resource costs must be verified before action execution
2. Building requirements must be confirmed before construction
3. Entity existence must be validated before interaction
4. If the required amounts are not available, end the sequence.
{{additional_validations}}

## Output Format
Return a JSON array where each step contains:
- plan: A short explanation of what you will do
- meta: A metadata object with requirements for the step. Find this in the context.
- actions: A list of actions to be executed. You can either use ${this.getAvailableOutputs()}

<AVAILABLE_ACTIONS>
Below is a list of actions you may use. 
The "payload" must follow the indicated structure exactly. Do not include any markdown formatting, slashes or comments.
Each action must include:
- **payload**: The action data structured as per the available actions.
- **context**: A contextual description or metadata related to the action's execution. This can include statuses, results, or any pertinent information that may influence future actions.

${availableOutputsSchema}

</AVAILABLE_ACTIONS>

</global_context>
`;

        return injectTags(tags, prompt);
    }

    public async think(
        userQuery: string,
        maxIterations: number = 10
    ): Promise<void> {
        this.emit("think:start", { query: userQuery });

        try {
            // Consult single memory instance for both types of memories
            const [similarExperiences, relevantDocs] = await Promise.all([
                this.memory.findSimilarEpisodes(userQuery, 1),
                this.memory.findSimilarDocuments(userQuery, 1),
            ]);

            this.logger.debug("think", "Retrieved memory context", {
                experienceCount: similarExperiences.length,
                docCount: relevantDocs.length,
            });

            this.logger.debug("think", "Beginning to think", {
                userQuery,
                maxIterations,
            });

            // Initialize with user query
            this.recordReasoningStep(`User Query: ${userQuery}`, "task", [
                "user-query",
            ]);

            let currentIteration = 0;
            let isComplete = false;

            // Get initial plan and actions
            const initialResponse = await validateLLMResponseSchema({
                prompt: this.buildPrompt({ query: userQuery }),
                schema: z.object({
                    plan: z.string().optional(),
                    meta: z.any().optional(),
                    actions: z.array(
                        z.object({
                            type: z.string(),
                            context: z.string(),
                            payload: z.any(),
                        })
                    ),
                }),
                systemPrompt:
                    "You are a reasoning system that outputs structured JSON only.",
                maxRetries: 3,
                llmClient: this.llmClient,
                logger: this.logger,
            });

            // Initialize pending actions queue with initial actions
            let pendingActions: CoTAction[] = [
                ...initialResponse.actions,
            ] as CoTAction[];

            // Add initial plan as a step if provided
            if (initialResponse.plan) {
                this.recordReasoningStep(
                    `Initial plan: ${initialResponse.plan}`,
                    "planning",
                    ["initial-plan"]
                );
            }

            while (
                !isComplete &&
                currentIteration < maxIterations &&
                pendingActions.length > 0
            ) {
                this.logger.debug("think", "Processing iteration", {
                    currentIteration,
                    pendingActionsCount: pendingActions.length,
                });

                // Process one action at a time
                const currentAction = pendingActions.shift()!;
                this.logger.debug("think", "Processing action", {
                    action: currentAction,
                    remainingActions: pendingActions.length,
                });

                try {
                    const result = await this.executeAction(currentAction);

                    // Store the experience
                    await this.storeEpisode(currentAction.type, result);

                    // If the result seems important, store as knowledge
                    if (calculateImportance(result) > 0.7) {
                        await this.storeKnowledge(
                            `Learning from ${currentAction.type}`,
                            result,
                            "action_learning",
                            [currentAction.type, "automated_learning"]
                        );
                    }

                    const completion = await validateLLMResponseSchema({
                        prompt: `${this.buildPrompt({ result })}
            ${JSON.stringify({
                query: userQuery,
                currentSteps: this.stepManager.getSteps(),
                lastAction: currentAction.toString() + " RESULT:" + result,
            })}
            <verification_rules>
             # Chain of Verification Analysis

             ## Verification Steps
             1. Original Query/Goal
             - Verify exact requirements
             2. All Steps Taken
             - Verify successful completion of each step
             3. Current Context  
             - Verify state matches expectations
             4. Last Action Result
             - Verify correct outcome
             5. Value Conversions
             - Convert hex values to decimal for verification

             ## Verification Process
             - Check preconditions were met
             - Validate proper execution
             - Confirm expected postconditions  
             - Check for edge cases/errors

             ## Determination Criteria
             - Goal Achievement Status
             - Achieved or impossible? (complete)
             - Supporting verification evidence (reason)
             - Resource Requirements
             - Continue if resources available? (shouldContinue)

             </verification_rules>

             <thinking_process>
             Think in detail here
             </thinking_process>
               `,
                        schema: z.object({
                            complete: z.boolean(),
                            reason: z.string(),
                            shouldContinue: z.boolean(),
                            newActions: z.array(z.any()),
                        }),
                        systemPrompt:
                            "You are a goal completion analyzer using Chain of Verification...",
                        maxRetries: 3,
                        llmClient: this.llmClient,
                        logger: this.logger,
                    });

                    try {
                        isComplete = completion.complete;

                        if (completion.newActions?.length > 0) {
                            // Add new actions to the end of the pending queue
                            const extractedActions =
                                completion.newActions.flatMap(
                                    (plan: any) => plan.actions || []
                                );
                            pendingActions.push(...extractedActions);

                            this.logger.debug("think", "Added new actions", {
                                newActionsCount: extractedActions.length,
                                totalPendingCount: pendingActions.length,
                            });
                        }

                        if (isComplete || !completion.shouldContinue) {
                            this.recordReasoningStep(
                                `Goal ${isComplete ? "achieved" : "failed"}: ${
                                    completion.reason
                                }`,
                                "system",
                                ["completion"]
                            );
                            this.emit("think:complete", { query: userQuery });
                            return;
                        } else {
                            this.recordReasoningStep(
                                `Action completed, continuing execution: ${completion.reason}`,
                                "system",
                                ["continuation"]
                            );
                        }
                    } catch (error) {
                        this.logger.error(
                            "think",
                            "Error parsing completion check",
                            {
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                                completion,
                            }
                        );
                        continue;
                    }
                } catch (error) {
                    this.emit("think:error", { query: userQuery, error });
                    throw error;
                }

                currentIteration++;
            }

            if (currentIteration >= maxIterations) {
                const error = `Failed to solve query "${userQuery}" within ${maxIterations} iterations`;
                this.logger.error("think", error);
                this.emit("think:timeout", { query: userQuery });
            }
        } catch (error) {
            this.emit("think:error", { query: userQuery, error });
            throw error;
        }
    }

    /**
     * Formats the outcome of an action into a human-readable summary using the LLM.
     *
     * @param action - The action that was taken
     * @param result - The result of the action, either as a string or structured data
     * @returns A concise, human-readable summary of the action outcome
     */
    private async summarizeActionResult(
        action: string,
        result: string | Record<string, any>
    ): Promise<string> {
        return await validateLLMResponseSchema({
            prompt: `
    # Action Result Summary
    Summarize this action result in a clear, concise way
    
    # Action taken
    ${action}

    # Result of action
    ${typeof result === "string" ? result : JSON.stringify(result, null, 2)}

    # Rules for summary:
    1. Be concise but informative (1-2 lines max)
    2. All values from the result to make the summary more informative
    3. Focus on the key outcomes or findings
    4. Use neutral, factual language
    5. Don't include technical details unless crucial
    6. Make it human-readable
    
    # Rules for output
    Return only the summary text, no additional formatting.
    `,
            schema: z.any(),
            systemPrompt:
                "You are a result summarizer. Create clear, concise summaries of action results.",
            maxRetries: 3,
            llmClient: this.llmClient,
            logger: this.logger,
        }).toString();
    }

    /**
     * Stores an episode in memory based on an action and its result.
     *
     * @param action - The action that was taken
     * @param result - The result of the action, either as a string or object
     * @param importance - Optional importance score for the episode. If not provided, will be calculated automatically
     * @returns Promise that resolves when the episode is stored
     */
    private async storeEpisode(
        action: string,
        result: string | Record<string, any>,
        importance?: number
    ): Promise<void> {
        try {
            const formattedOutcome = await this.summarizeActionResult(
                action,
                result
            );
            const calculatedImportance =
                importance ?? calculateImportance(formattedOutcome);
            const actionWithResult = `${action} RESULT: ${result}`;
            const emotions = determineEmotions(
                actionWithResult,
                formattedOutcome,
                calculatedImportance
            );

            const experience = {
                timestamp: new Date(),
                action: actionWithResult,
                outcome: formattedOutcome,
                context: this.context,
                importance: calculatedImportance,
                emotions,
            };

            await this.memory.storeEpisode(experience);

            this.emit("memory:experience_stored", {
                experience: {
                    ...experience,
                    id: crypto.randomUUID(),
                },
            });

            this.logger.info("storeEpisode", "Stored experience", {
                experience,
            });
        } catch (error) {
            this.logger.error("storeEpisode", "Failed to store experience", {
                error,
            });
        }
    }

    /**
     * Stores a knowledge document in memory.
     *
     * @param title - The title of the knowledge document
     * @param content - The content/body of the knowledge document
     * @param category - The category to organize this knowledge under
     * @param tags - Array of tags to help classify and search for this knowledge
     * @returns Promise that resolves when the knowledge is stored
     */
    private async storeKnowledge(
        title: string,
        content: string,
        category: string,
        tags: string[]
    ): Promise<void> {
        try {
            const document = {
                id: crypto.randomUUID(),
                title,
                content,
                category,
                tags,
                lastUpdated: new Date(),
            };

            await this.memory.storeDocument(document);

            this.logger.info("storeKnowledge", "Stored knowledge", {
                document,
            });

            this.emit("memory:knowledge_stored", { document });
        } catch (error) {
            this.logger.error("storeKnowledge", "Failed to store knowledge", {
                error,
            });
        }
    }

    private async updateBlackboard(update: {
        type: "resource" | "state" | "event" | "achievement";
        key: string;
        value: any;
        timestamp: number;
        metadata?: Record<string, any>;
    }): Promise<void> {
        try {
            await this.memory.storeDocument({
                title: `Blackboard Update: ${update.type} - ${update.key}`,
                content: JSON.stringify({
                    ...update,
                    value: update.value,
                    timestamp: update.timestamp || Date.now(),
                }),
                category: "blackboard",
                tags: ["blackboard", update.type, update.key],
                lastUpdated: new Date(),
            });

            this.logger.debug("updateBlackboard", "Stored blackboard update", {
                update,
            });
        } catch (error) {
            this.logger.error(
                "updateBlackboard",
                "Failed to store blackboard update",
                {
                    error,
                }
            );
        }
    }

    /**
     * Retrieves the current state of the blackboard by aggregating all stored updates.
     * The blackboard state is built by applying updates in chronological order, organized by type and key.
     *
     * @returns A nested object containing the current blackboard state, where the first level keys are update types
     * and second level keys are the specific keys within each type, with their corresponding values.
     * @example
     * // Returns something like:
     * {
     *   resource: { gold: 100, wood: 50 },
     *   state: { isGameStarted: true },
     *   event: { lastBattle: "won" }
     * }
     */
    async getBlackboardState(): Promise<Record<string, any>> {
        try {
            // Use findDocumentsByCategory to get all blackboard documents
            const blackboardDocs = await this.memory.searchDocumentsByTag([
                "blackboard",
            ]);

            // Build current state by applying updates in order
            const state: Record<string, any> = {};

            blackboardDocs
                .sort((a, b) => {
                    const aContent = JSON.parse(a.content);
                    const bContent = JSON.parse(b.content);
                    return aContent.timestamp - bContent.timestamp;
                })
                .forEach((doc) => {
                    const update = JSON.parse(doc.content);
                    if (!state[update.type]) {
                        state[update.type] = {};
                    }
                    state[update.type][update.key] = update.value;
                });

            this.logger.info("getBlackboardState", "Found blackboard state", {
                state,
            });

            return state;
        } catch (error) {
            this.logger.error(
                "getBlackboardState",
                "Failed to get blackboard state",
                {
                    error,
                }
            );
            return {};
        }
    }

    /**
     * Retrieves the history of blackboard updates, optionally filtered by type and key.
     * Returns updates in reverse chronological order (newest first).
     *
     * @param type - Optional type to filter updates by (e.g. 'resource', 'state', 'event')
     * @param key - Optional key within the type to filter updates by
     * @param limit - Maximum number of history entries to return (defaults to 10)
     * @returns Array of blackboard updates, each containing the update details and metadata
     * @example
     * // Returns something like:
     * [
     *   { type: 'resource', key: 'gold', value: 100, timestamp: 1234567890, id: 'doc1', lastUpdated: '2023-01-01' },
     *   { type: 'resource', key: 'gold', value: 50, timestamp: 1234567880, id: 'doc2', lastUpdated: '2023-01-01' }
     * ]
     */
    async getBlackboardHistory(
        type?: string,
        key?: string,
        limit: number = 10
    ): Promise<any[]> {
        try {
            // Use searchDocumentsByTag to find relevant documents
            const tags = ["blackboard"];
            if (type) tags.push(type);
            if (key) tags.push(key);

            const docs = await this.memory.searchDocumentsByTag(tags, limit);

            this.logger.info(
                "getBlackboardHistory",
                "Found blackboard history",
                {
                    docs,
                }
            );

            return docs
                .map((doc) => ({
                    ...JSON.parse(doc.content),
                    id: doc.id,
                    lastUpdated: doc.lastUpdated,
                }))
                .sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            this.logger.error(
                "getBlackboardHistory",
                "Failed to get blackboard history",
                {
                    error,
                }
            );
            return [];
        }
    }

    /**
     * Returns a formatted string listing all available outputs registered in the outputs registry.
     * The string includes each output name on a new line prefixed with a bullet point.
     * @returns A formatted string containing all registered output names
     * @example
     * ```ts
     * // If outputs contains "console" and "file"
     * getAvailableOutputs() // Returns:
     * // Available outputs:
     * // - console
     * // - file
     * ```
     * @internal
     */
    private getAvailableOutputs(): string {
        const outputs = Array.from(this.outputs.keys());
        return `Available outputs:\n${outputs
            .map((output) => `- ${output}`)
            .join("\n")}`;
    }
}
