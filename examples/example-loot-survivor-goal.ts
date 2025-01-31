/**
 * Example demonstrating goal-based agent functionality in the Daydreams package.
 * This example creates an agent that can plan and execute hierarchical goals.
 *
 * To customize:
 * 1. Define a new context for the agent (similar to ETERNUM_CONTEXT)
 * 2. Inject the context into the agent initialization
 */

import chalk from "chalk";
import * as readline from "readline";
import { ChainOfThought } from "../packages/core/src/core/chain-of-thought";
import { LLMClient } from "../packages/core/src/core/llm-client";
import {
    BASE_CONTEXT,
    CHARACTER_STATS,
    COMBAT_INFO,
    CONTRACT_INFO,
    CORE_MECHANICS,
    DECISION_RULES,
    EQUIPMENT_INFO,
} from "./loot-survivor-context";

import { z } from "zod";
import { StarknetChain } from "../packages/core/src/core/chains/starknet";
import { env } from "../packages/core/src/core/env";
import {
    GoalStatus,
    HandlerRole,
    LogLevel,
} from "../packages/core/src/core/types";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";

/**
 * Helper function to get user input from CLI
 */
async function getCliInput(prompt: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

/**
 * Helper function to format goal status with colored icons
 */
function printGoalStatus(status: GoalStatus): string {
    const colors: Record<GoalStatus, string> = {
        pending: chalk.yellow("⏳ PENDING"),
        active: chalk.blue("▶️ ACTIVE"),
        completed: chalk.green("✅ COMPLETED"),
        failed: chalk.red("❌ FAILED"),
        ready: chalk.cyan("🎯 READY"),
        blocked: chalk.red("🚫 BLOCKED"),
    };
    return colors[status] || status;
}

async function main() {
    // Initialize core components
    const llmClient = new LLMClient({
        model: "anthropic/claude-3-5-sonnet-latest", // More stable, faster model
        timeout: 30000, // 30 second timeout
        maxRetries: 3, // Increase retries
        temperature: 0.3, // Lower temperature for more consistent outputs
    });

    const starknetChain = new StarknetChain({
        rpcUrl: env.STARKNET_RPC_URL,
        address: env.STARKNET_ADDRESS,
        privateKey: env.STARKNET_PRIVATE_KEY,
    });

    const memory = new ChromaVectorDB("agent_memory");
    await memory.purge(); // Clear previous session data
    // Store modular contexts with specific tags for targeted retrieval

    await memory.storeDocument({
        title: "Core-Game-Mechanics",
        content: CORE_MECHANICS,
        category: "game-mechanics",
        tags: ["mechanics", "rules"],
        lastUpdated: new Date(),
    });

    await memory.storeDocument({
        title: "Equipment-Information",
        content: EQUIPMENT_INFO,
        category: "equipment",
        tags: ["items", "gear", "equipment-ids"],
        lastUpdated: new Date(),
    });

    await memory.storeDocument({
        title: "Combat-Information",
        content: COMBAT_INFO,
        category: "combat",
        tags: ["combat", "strategy", "beasts"],
        lastUpdated: new Date(),
    });

    await memory.storeDocument({
        title: "Character-Stats",
        content: CHARACTER_STATS,
        category: "character",
        tags: ["stats", "attributes"],
        lastUpdated: new Date(),
    });

    await memory.storeDocument({
        title: "Contract-Interface",
        content: CONTRACT_INFO,
        category: "technical",
        tags: ["contract", "functions", "api"],
        lastUpdated: new Date(),
    });

    await memory.storeDocument({
        title: "Decision-Rules",
        content: DECISION_RULES,
        category: "strategy",
        tags: ["decision-making", "principles"],
        lastUpdated: new Date(),
    }); // Initialize the main reasoning engine with minimal base context

    const dreams = new ChainOfThought(
        llmClient,
        memory,
        {
            worldState: BASE_CONTEXT, // Only load the minimal context initially
        },
        {
            logLevel: LogLevel.DEBUG,
        }
    ); // Register available actions

    dreams.registerOutput({
        name: "READ_CONTRACT",
        role: HandlerRole.OUTPUT,
        execute: async (data: any) => {
            const result = await starknetChain.read(data.payload);
            return `Read contract successfully: ${JSON.stringify(result, null, 2)}`;
        },
        outputSchema: z
            .object({
                contractAddress: z
                    .string()
                    .describe(
                        "The address of the contract to read the data from"
                    ),
                entrypoint: z
                    .string()
                    .describe("The entrypoint to call on the contract"),
                calldata: z
                    .array(z.number().or(z.string()))
                    .describe("The calldata to pass to the entrypoint"),
            })
            .describe("The payload to read the data from the contract"),
    });

    dreams.registerOutput({
        name: "EXECUTE_TRANSACTION",
        role: HandlerRole.OUTPUT,
        execute: async (data: any) => {
            // Convert boolean values in calldata to numbers
            if (data.payload.calldata) {
                data.payload.calldata = data.payload.calldata.map(
                    (item: any) => {
                        if (typeof item === "boolean") {
                            return item ? 1 : 0;
                        }
                        return item;
                    }
                );
            }
            const result = await starknetChain.write(data.payload);
            return `Transaction executed successfully: ${JSON.stringify(result, null, 2)}`;
        },
        outputSchema: z
            .object({
                contractAddress: z
                    .string()
                    .describe(
                        "The address of the contract to execute the transaction on"
                    ),
                entrypoint: z
                    .string()
                    .describe("The entrypoint to call on the contract"),
                calldata: z
                    .array(z.number().or(z.string()))
                    .describe("The calldata to pass to the entrypoint"),
            })
            .describe("The payload to execute the transaction"),
    }); // Register data retrieval actions

    dreams.registerOutput({
        name: "RETRIEVE_MEMORY",
        role: HandlerRole.OUTPUT,
        execute: async (data: any) => {
            const { content, limit = 5 } = data.payload;
            const results = await memory.findSimilar(content, limit);
            return `Retrieved memories: ${JSON.stringify(results, null, 2)}`;
        },
        outputSchema: z
            .object({
                content: z.string().describe("The content to search for"),
                limit: z
                    .number()
                    .optional()
                    .describe("Maximum number of results to return"),
            })
            .describe("Parameters for retrieving memories"),
    });

    dreams.registerOutput({
        name: "STORE_MEMORY",
        role: HandlerRole.OUTPUT,
        execute: async (data: any) => {
            const { content, metadata = {} } = data.payload;
            await memory.store(content, metadata);
            return `Memory stored successfully`;
        },
        outputSchema: z
            .object({
                content: z.string().describe("The content to store"),
                metadata: z
                    .record(z.any())
                    .optional()
                    .describe("Additional metadata to store"),
            })
            .describe("Parameters for storing memories"),
    });

    dreams.registerOutput({
        name: "PEEK_RECENT",
        role: HandlerRole.OUTPUT,
        execute: async (data: any) => {
            const { limit = 5 } = data.payload;
            const items = await memory.peek(limit);
            return `Retrieved recent items: ${JSON.stringify(items, null, 2)}`;
        },
        outputSchema: z
            .object({
                limit: z
                    .number()
                    .optional()
                    .describe("Maximum number of items to return"),
            })
            .describe("Parameters for retrieving recent items"),
    });

    dreams.registerOutput({
        name: "GET_RECENT_EPISODES",
        role: HandlerRole.OUTPUT,
        execute: async (data: any) => {
            const { limit } = data.payload;
            const episodes = await memory.getRecentEpisodes(limit);
            return `Retrieved recent episodes: ${JSON.stringify(episodes, null, 2)}`;
        },
        outputSchema: z
            .object({
                limit: z
                    .number()
                    .optional()
                    .describe("Maximum number of episodes to return"),
            })
            .describe("Parameters for retrieving recent episodes"),
    }); // Thought process events

    dreams.on("step", (step) => {
        if (step.type === "system") {
            console.log("\n💭 System prompt:", step.content);
        } else {
            console.log("\n🤔 New thought step:", {
                content: step.content,
                tags: step.tags,
            });
        }
    }); // Uncomment to log token usage
    // llmClient.on("trace:tokens", ({ input, output }) => {
    //   console.log("\n💡 Tokens used:", { input, output });
    // });
    // Action execution events

    dreams.on("action:start", (action) => {
        console.log("\n🎬 Starting action:", {
            type: action.type,
            payload: action.payload,
        });
    });

    dreams.on("action:complete", ({ action, result }) => {
        console.log("\n✅ Action complete:", {
            type: action.type,
            result,
        });
    });

    dreams.on("action:error", ({ action, error }) => {
        console.log("\n❌ Action failed:", {
            type: action.type,
            error,
        });
    }); // Thinking process events

    dreams.on("think:start", ({ query }) => {
        console.log("\n🧠 Starting to think about:", query);
    });

    dreams.on("think:complete", ({ query }) => {
        console.log("\n🎉 Finished thinking about:", query);
    });

    dreams.on("think:timeout", ({ query }) => {
        console.log("\n⏰ Thinking timed out for:", query);
    });

    dreams.on("think:error", ({ query, error }) => {
        console.log("\n💥 Error while thinking about:", query, error);
    }); // Goal management events

    dreams.on("goal:created", ({ id, description }) => {
        console.log(chalk.cyan("\n🎯 New goal created:"), {
            id,
            description,
        });
    });

    dreams.on("goal:updated", ({ id, status }) => {
        console.log(chalk.yellow("\n📝 Goal status updated:"), {
            id,
            status: printGoalStatus(status),
        });
    });

    dreams.on("goal:completed", ({ id, result }) => {
        console.log(chalk.green("\n✨ Goal completed:"), {
            id,
            result,
        });
    });

    dreams.on("goal:failed", ({ id, error }) => {
        console.log(chalk.red("\n💥 Goal failed:"), {
            id,
            error: error instanceof Error ? error.message : String(error),
        });
    }); // Memory management events

    dreams.on("memory:experience_stored", ({ experience }) => {
        console.log(chalk.blue("\n💾 New experience stored:"), {
            action: experience.action,
            outcome: experience.outcome,
            importance: experience.importance,
            timestamp: experience.timestamp,
        });

        if (experience.emotions?.length) {
            console.log(
                chalk.blue("😊 Emotional context:"),
                experience.emotions.join(", ")
            );
        }
    });

    dreams.on("memory:knowledge_stored", ({ document }) => {
        console.log(chalk.magenta("\n📚 New knowledge documented:"), {
            title: document.title,
            category: document.category,
            tags: document.tags,
            lastUpdated: document.lastUpdated,
        });
        console.log(chalk.magenta("📝 Content:"), document.content);
    });

    dreams.on("memory:experience_retrieved", ({ experiences }) => {
        console.log(chalk.yellow("\n🔍 Relevant past experiences found:"));
        experiences.forEach((exp, index) => {
            console.log(chalk.yellow(`\n${index + 1}. Previous Experience:`));
            console.log(`   Action: ${exp.action}`);
            console.log(`   Outcome: ${exp.outcome}`);
            console.log(`   Importance: ${exp.importance || "N/A"}`);
            if (exp.emotions?.length) {
                console.log(`   Emotions: ${exp.emotions.join(", ")}`);
            }
        });
    });

    dreams.on("memory:knowledge_retrieved", ({ documents }) => {
        console.log(chalk.green("\n📖 Relevant knowledge retrieved:"));
        documents.forEach((doc, index) => {
            console.log(chalk.green(`\n${index + 1}. Knowledge Entry:`));
            console.log(`   Title: ${doc.title}`);
            console.log(`   Category: ${doc.category}`);
            console.log(`   Tags: ${doc.tags.join(", ")}`);
            console.log(`   Content: ${doc.content}`);
        });
    }); // Main interaction loop

    while (true) {
        console.log(chalk.cyan("\n🤖 Enter your goal (or 'exit' to quit):"));
        const userInput = await getCliInput("> ");

        if (userInput.toLowerCase() === "exit") {
            console.log(chalk.yellow("Goodbye! 👋"));
            break;
        }

        try {
            // Plan and execute goals
            console.log(chalk.cyan("\n🤔 Planning strategy for goal..."));
            await dreams.decomposeObjectiveIntoGoals(userInput);

            console.log(chalk.cyan("\n🎯 Executing goals..."));

            const stats = {
                completed: 0,
                failed: 0,
                total: 0,
            }; // Execute goals until completion

            while (true) {
                const readyGoals = dreams.goalManager.getReadyGoals();
                const activeGoals = dreams.goalManager
                    .getGoalsByHorizon("short")
                    .filter((g) => g.status === "active");
                const pendingGoals = dreams.goalManager
                    .getGoalsByHorizon("short")
                    .filter((g) => g.status === "pending"); // Status update

                console.log(chalk.cyan("\n📊 Current Progress:"));
                console.log(`Ready goals: ${readyGoals.length}`);
                console.log(`Active goals: ${activeGoals.length}`);
                console.log(`Pending goals: ${pendingGoals.length}`);
                console.log(`Completed: ${stats.completed}`);
                console.log(`Failed: ${stats.failed}`); // Check if all goals are complete

                if (
                    readyGoals.length === 0 &&
                    activeGoals.length === 0 &&
                    pendingGoals.length === 0
                ) {
                    console.log(chalk.green("\n✨ All goals completed!"));
                    break;
                } // Handle blocked goals

                if (readyGoals.length === 0 && activeGoals.length === 0) {
                    console.log(
                        chalk.yellow(
                            "\n⚠️ No ready or active goals, but some goals are pending:"
                        )
                    );
                    pendingGoals.forEach((goal) => {
                        const blockingGoals =
                            dreams.goalManager.getBlockingGoals(goal.id);
                        console.log(
                            chalk.yellow(
                                `\n📌 Pending Goal: ${goal.description}`
                            )
                        );
                        console.log(
                            chalk.yellow(
                                `   Blocked by: ${blockingGoals.length} goals`
                            )
                        );
                        blockingGoals.forEach((blocking) => {
                            console.log(
                                chalk.yellow(
                                    `   - ${blocking.description} (${blocking.status})`
                                )
                            );
                        });
                    });
                    break;
                } // Execute next goal

                try {
                    await dreams.processHighestPriorityGoal();
                    stats.completed++;
                } catch (error) {
                    console.error(
                        chalk.red("\n❌ Goal execution failed:"),
                        error
                    );
                    stats.failed++; // Ask to continue

                    const shouldContinue = await getCliInput(
                        chalk.yellow(
                            "\nContinue executing remaining goals? (y/n): "
                        )
                    );

                    if (shouldContinue.toLowerCase() !== "y") {
                        console.log(chalk.yellow("Stopping goal execution."));
                        break;
                    }
                }

                stats.total++;
            } // Learning summary

            console.log(chalk.cyan("\n📊 Learning Summary:"));

            const recentExperiences = await dreams.memory.getRecentEpisodes(5);
            console.log(chalk.blue("\n🔄 Recent Experiences:"));
            recentExperiences.forEach((exp, index) => {
                console.log(chalk.blue(`\n${index + 1}. Experience:`));
                console.log(`   Action: ${exp.action}`);
                console.log(`   Outcome: ${exp.outcome}`);
                console.log(`   Importance: ${exp.importance || "N/A"}`);
            });

            const relevantDocs = await dreams.memory.findSimilarDocuments(
                userInput,
                3
            );
            console.log(chalk.magenta("\n📚 Accumulated Knowledge:"));
            relevantDocs.forEach((doc, index) => {
                console.log(chalk.magenta(`\n${index + 1}. Knowledge Entry:`));
                console.log(`   Title: ${doc.title}`);
                console.log(`   Category: ${doc.category}`);
                console.log(`   Tags: ${doc.tags.join(", ")}`);
            }); // Final execution summary

            console.log(chalk.cyan("\n📊 Final Execution Summary:"));
            console.log(chalk.green(`✅ Completed Goals: ${stats.completed}`));
            console.log(chalk.red(`❌ Failed Goals: ${stats.failed}`));
            console.log(
                chalk.blue(
                    `📈 Success Rate: ${Math.round(
                        (stats.completed / stats.total) * 100
                    )}%`
                )
            );
            console.log(
                chalk.yellow(
                    `🧠 Learning Progress: ${recentExperiences.length} new experiences, ${relevantDocs.length} relevant knowledge entries`
                )
            );
        } catch (error) {
            console.error(chalk.red("Error processing goal:"), error);
        }
    } // Graceful shutdown handler

    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\nShutting down..."));
        process.exit(0);
    });
}

// Start the application
main().catch((error) => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
