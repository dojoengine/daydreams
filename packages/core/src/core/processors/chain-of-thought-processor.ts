import { BaseProcessor } from "../processor";
import { ChainOfThought } from "../chain-of-thought";
import type { IOHandler, ProcessedResult, VectorDB } from "../types";
import { LogLevel } from "../types";
import type { LLMClient } from "../llm-client";
import type { Character } from "../types";

export class ChainOfThoughtProcessor extends BaseProcessor {
    private chainOfThought: ChainOfThought;

    constructor(
        llmClient: LLMClient,
        memory: VectorDB,
        character: Character,
        logLevel: LogLevel = LogLevel.ERROR
    ) {
        super(
            {
                name: "chain-of-thought",
                description:
                    "Handles complex reasoning tasks using chain of thought processing and goal-based execution. Uses a goal manager to manage goals and a step manager to manage steps.",
            },
            logLevel,
            character,
            llmClient
        );

        this.chainOfThought = new ChainOfThought(llmClient, memory, undefined, {
            logLevel,
        });
    }

    public canHandle(content: any): boolean {
        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        // Chain of thought is best for:
        // 1. Complex queries requiring multiple steps
        // 2. Goal-based reasoning
        // 3. Content requiring planning and execution
        return (
            contentStr.length > 100 &&
            (contentStr.includes("goal") ||
                contentStr.includes("plan") ||
                contentStr.includes("achieve") ||
                contentStr.includes("how to") ||
                contentStr.includes("steps to"))
        );
    }

    public async process(
        content: any,
        otherContext: string,
        ioContext?: {
            availableOutputs?: IOHandler[];
            availableActions?: IOHandler[];
        }
    ): Promise<ProcessedResult> {
        this.logger.debug(
            "ChainOfThoughtProcessor.process",
            "Processing content",
            { content }
        );

        // Register available outputs and actions
        if (ioContext) {
            [
                ...(ioContext.availableOutputs || []),
                ...(ioContext.availableActions || []),
            ].forEach((handler) => {
                this.chainOfThought.registerOutput(handler);
            });
        }

        try {
            // First, decompose the content into goals
            await this.chainOfThought.decomposeObjectiveIntoGoals(
                typeof content === "string" ? content : JSON.stringify(content)
            );

            const stats = {
                completed: 0,
                failed: 0,
                total: 0,
            };

            // Execute goals until completion
            while (true) {
                const readyGoals =
                    this.chainOfThought.goalManager.getReadyGoals();
                const activeGoals = this.chainOfThought.goalManager
                    .getGoalsByHorizon("short")
                    .filter((g) => g.status === "active");
                const pendingGoals = this.chainOfThought.goalManager
                    .getGoalsByHorizon("short")
                    .filter((g) => g.status === "pending");

                // Log progress
                this.logger.debug(
                    "ChainOfThoughtProcessor.process",
                    "Goal execution progress:",
                    JSON.stringify({
                        ready: readyGoals.length,
                        active: activeGoals.length,
                        pending: pendingGoals.length,
                        completed: stats.completed,
                        failed: stats.failed,
                    })
                );

                // Check if all goals are complete
                if (
                    readyGoals.length === 0 &&
                    activeGoals.length === 0 &&
                    pendingGoals.length === 0
                ) {
                    this.logger.debug(
                        "ChainOfThoughtProcessor.process",
                        "All goals completed!",
                        {
                            ready: readyGoals.length,
                            active: activeGoals.length,
                            pending: pendingGoals.length,
                            completed: stats.completed,
                            failed: stats.failed,
                        }
                    );
                    break;
                }

                // Handle blocked goals
                if (readyGoals.length === 0 && activeGoals.length === 0) {
                    this.logger.warn(
                        "ChainOfThoughtProcessor.process",
                        "No ready or active goals, but some goals are pending",
                        {
                            pending: pendingGoals.length,
                        }
                    );
                    pendingGoals.forEach((goal) => {
                        const blockingGoals =
                            this.chainOfThought.goalManager.getBlockingGoals(
                                goal.id
                            );
                        this.logger.warn(
                            "ChainOfThoughtProcessor.process",
                            `Pending Goal: ${goal.description}`,
                            {
                                blockedBy: blockingGoals.length,
                            }
                        );
                    });
                    break;
                }

                // Execute next goal
                try {
                    await this.chainOfThought.processHighestPriorityGoal();
                    stats.completed++;
                } catch (error) {
                    this.logger.error(
                        "ChainOfThoughtProcessor.process",
                        "Goal execution failed:",
                        error
                    );
                    stats.failed++;
                }

                stats.total++;
            }

            // Get final state and create result
            const steps = this.chainOfThought.stepManager.getSteps();
            const context = await this.chainOfThought.getBlackboardState();
            const recentExperiences =
                await this.chainOfThought.memory.getRecentEpisodes(5);

            return {
                content,
                metadata: {
                    processor: "chain-of-thought",
                    steps: steps.length,
                    goalsCompleted: stats.completed,
                    goalsFailed: stats.failed,
                    successRate:
                        stats.total > 0
                            ? (stats.completed / stats.total) * 100
                            : 0,
                    topic: "goal-based-reasoning",
                    urgency: "high",
                },
                enrichedContext: {
                    summary: steps.map((s) => s.content).join("\n"),
                    topics: steps.flatMap((s) => s.tags || []),
                    sentiment: "neutral",
                    entities: [],
                    intent: "goal-execution",
                    timeContext: new Date().toISOString(),
                    relatedMemories: recentExperiences.map(
                        (exp) =>
                            `Action: ${exp.action}, Outcome: ${exp.outcome}, Importance: ${exp.importance}`
                    ),
                    availableOutputs: ioContext?.availableOutputs?.map(
                        (h) => h.name
                    ),
                    ...context,
                },
                suggestedOutputs: [], // Chain of thought handles its own outputs
                alreadyProcessed: true, // Mark as processed since CoT handles execution
            };
        } catch (error) {
            this.logger.error(
                "ChainOfThoughtProcessor.process",
                "Processing failed",
                { error }
            );
            throw error;
        }
    }
}
