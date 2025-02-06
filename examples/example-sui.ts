/**
 * Example demonstrating Sui interactions using the Daydreams package,
 */

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole, LogLevel } from "../packages/core/src/core/types";
import { ConversationManager } from "../packages/core/src/core/conversation-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import chalk from "chalk";
import { defaultCharacter } from "../packages/core/src/core/characters/character";
import readline from "readline";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { MasterProcessor } from "../packages/core/src/core/processors/master-processor";
import { makeFlowLifecycle } from "../packages/core/src/core/life-cycle";
import { z } from "zod";
import { FaucetNetwork, SuiChain, SuiNetwork, supportedSuiTokens } from "../packages/core/src/core/chains/sui";

async function main() {
    // Set logging level as you see fit
    const loglevel = LogLevel.DEBUG;

    // Initialize core dependencies
    const vectorDb = new ChromaVectorDB("discord_agent", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    // Optional: Purge previous session data if you want a fresh start
    await vectorDb.purge();

    const suiChain = new SuiChain({
        network: env.SUI_NETWORK as SuiNetwork,
        privateKey: env.SUI_PRIVATE_KEY,
    });

    const conversationManager = new ConversationManager(vectorDb);

    const llmClient = new LLMClient({
        model: "openrouter:deepseek/deepseek-r1",
        temperature: 0.3,
    });

    const masterProcessor = new MasterProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    masterProcessor.addProcessor(
        new MessageProcessor(llmClient, defaultCharacter, loglevel)
    );

    // Connect to MongoDB (for scheduled tasks, if you use them)
    const KVDB = new MongoDb(
        "mongodb://localhost:27017",
        "myApp",
        "scheduled_tasks"
    );
    await KVDB.connect();
    console.log(chalk.green("✅ Scheduled task database connected"));

    // Clear any existing tasks if you like
    await KVDB.deleteAll();

    // Create the Orchestrator
    const core = new Orchestrator(
        masterProcessor,
        makeFlowLifecycle(KVDB, conversationManager),
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    core.registerIOHandler({
        name: "SUI_FAUCET",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            network: z
                .string().describe("The network to request SUI from. This should be taken from the input data. Default is testnet if the user does not provide a valid network"),
            recipient: z.string().describe("The account address to receive SUI. This should be taken from the input data"),
        }), execute: async (data: unknown) => {
            const { network, recipient } = data as {
                network: FaucetNetwork,
                recipient: string,
            }

            const result = await suiChain.requestSui({ network, recipient });
            return {
                content: `Transaction: ${JSON.stringify(result, null, 2)}`,
            };
        }
    });

    core.registerIOHandler({
        name: "SUI_SWAP",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            fromToken: z
                .string().describe(`The token name to be swapped. It can be one of these: ${supportedSuiTokens}. This token and target token should not be same.`),
            targetToken: z
                .string().describe(`The token name to be swapped. It can be one of these: ${supportedSuiTokens}. This tokena and from token should not be same.`),
            amount: z.string().describe("The amount of token to be swapped. It should be in MIST. 1 SUI = 10^9 MIST. User mostly doesn't provide the value in mist, if he does, use that. Or else, do the conversation of multiplication and provide the value. However, for the case of USDC, the amount should be provided by multiplying 10^6. If a user says 1 USDC, amount you should add is 10^6. Take note of the amount of the from token."),
            out_min_amount: z.number().optional().describe("This is the minimum expected output token amount. If not provided should be null and will execute the swap anyhow."),
        }), execute: async (data: unknown) => {
            const { fromToken, amount, out_min_amount, targetToken } = data as {
                fromToken: string,
                amount: string,
                targetToken: string,
                out_min_amount: number | null,
            }

            const result = await suiChain.swapToken({ fromToken, amount, out_min_amount, targetToken });
            return {
                content: `Transaction: ${JSON.stringify(result, null, 2)}`,
            };
        }
    });

    core.registerIOHandler({
        name: "user_chat",
        role: HandlerRole.INPUT,
        execute: async (payload) => {
            return payload;
        },
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const promptUser = () => {
        rl.question(
            'Enter your message (or "exit" to quit): ',
            async (userMessage) => {
                if (userMessage.toLowerCase() === "exit") {
                    rl.close();
                    process.exit(0);
                }

                // Dispatch the message
                await core.dispatchToInput(
                    "user_chat",
                    {
                        contentId: userMessage,
                        userId: suiChain.getAddress(),
                        threadId: "console",
                        platformId: "console",
                        data: {
                            content: userMessage,
                        },
                    }
                );

                // Continue prompting
                promptUser();
            }
        );
    };
    promptUser();


    // Handle graceful shutdown (Ctrl-C, etc.)
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));

        core.removeIOHandler("SUI_SWAP");
        core.removeIOHandler("SUI_FAUCET");

        console.log(chalk.green("✅ Shutdown complete"));
        process.exit(0);
    });
}

// Run the example
main().catch((error) => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
