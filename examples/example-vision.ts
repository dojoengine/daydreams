/**
 * Example demonstrating a console-based chat interface using the Daydreams package.
 * This application provides the following capabilities:
 * - Interactive console interface for messaging
 * - Message history tracking and vector storage
 * - Real-time responses from an AI assistant
 * - Support for images and file attachments
 * - Graceful shutdown and resource cleanup
 * - MongoDB integration for scheduled tasks
 */

import chalk from "chalk";
import { z } from "zod";
import readline from "readline";

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { ConversationManager } from "../packages/core/src/core/conversation-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageAndVisionProcessor } from "../packages/core/src/core/processors/message-and-vision-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { LogLevel } from "../packages/core/src/core/types";
import { defaultCharacter } from "../packages/core/src/core/characters/character-helpful-assistant";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { MasterProcessor } from "../packages/core/src/core/processors/master-processor";
import { makeFlowLifecycle } from "../packages/core/src/core/life-cycle";
import { MongoStorage } from "../packages/mongodb-storage/src";
import { ORCHESTRATORS_KIND, SCHEDULED_TASKS_KIND, CHATS_KIND } from '../packages/storage/src';

async function main() {
    const loglevel = LogLevel.ERROR;

    // Initialize core dependencies
    const vectorDb = new ChromaVectorDB("hyperliquid_agent", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    await vectorDb.purge(); // Clear previous session data

    const conversationManager = new ConversationManager(vectorDb);
    const userId = "console-user";

    const llmClient = new LLMClient({
        model: "anthropic/claude-3-5-sonnet-latest", // Using a known supported model
        temperature: 0.3,
    });

    const masterProcessor = new MasterProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // Initialize processor with default character personality
    const messageProcessor = new MessageAndVisionProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    masterProcessor.addProcessor(messageProcessor);

    // Initialize core system
    const scheduledTaskDb = new MongoStorage(
        "mongodb://localhost:27017",
        "myApp",
    );

    await scheduledTaskDb.connect();
    console.log(chalk.green("✅ Scheduled task database connected"));

    await scheduledTaskDb.migrate();
    console.log(chalk.green("✅ Scheduled task indexes created"));

    await Promise.all([
        scheduledTaskDb.getRepository(SCHEDULED_TASKS_KIND).deleteAll(),
        scheduledTaskDb.getRepository(ORCHESTRATORS_KIND).deleteAll(),
        scheduledTaskDb.getRepository(CHATS_KIND).deleteAll(),
    ]);

    const orchestratorDb = new MongoDb(scheduledTaskDb);

    const core = new Orchestrator(
        masterProcessor,
        makeFlowLifecycle(orchestratorDb, conversationManager),
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );


    core.registerIOHandler({
        name: "user_chat",
        role: HandlerRole.INPUT,
        execute: async (payload) => {
            // Extract image URLs from content using a more robust regex pattern
            const imageRegex = /<IMAGE:([^>]+)>/g;
            const images = Array.from(payload.content.matchAll(imageRegex))
                .map((match) => (match as string[])[1])
                .filter((url) => url.length > 0);

            // Extract file information using regex with proper mime type and data parsing
            const fileRegex = /<FILE:([^:]+):([^>]+)>/g;
            const files = Array.from(payload.content.matchAll(fileRegex))
                .map((match) => ({
                    mimeType: (match as string[])[1].trim(),
                    data: (match as string[])[2].trim(),
                }))
                .filter((file) => file.mimeType && file.data);

            const output = {
                content: payload.content,
                userId: payload.userId,
                images: images.length > 0 ? images : undefined,
                files: files.length > 0 ? files : undefined,
            };
            return {
                userId: payload.userId,
                threadId: payload.threadId,
                contentId: payload.contentId,
                platformId: "console",
                data: output,
            };
        },
    });

    core.registerIOHandler({
        name: "ui_chat_reply",
        role: HandlerRole.OUTPUT,
        outputSchema: z.object({
            message: z.string(),
        }),
        execute: async (payload) => {
            const { message } = payload as {
                message: string;
            };
            console.log(`Reply to user: ${message || payload}`);
        },
    });

    // Set up readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Start the prompt loop
    console.log(chalk.cyan("🤖 Bot is now running..."));
    console.log(chalk.cyan("You can type messages in the console."));
    console.log(
        chalk.cyan(
            "Add <IMAGE:url> to add images (example: What's this? <IMAGE:https://pbs.twimg.com/profile_images/1880732638991863808/_JenDyRk_400x400.jpg>)"
        )
    );
    console.log(
        chalk.cyan(
            "Add <FILE:mimetype:url> to add files (example: <FILE:application/pdf:https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf>)."
        )
    );
    console.log(chalk.cyan('Type "exit" to quit'));

    // Function to prompt for user input
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
                        userId,
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

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));

        // Clean up resources
        core.removeIOHandler("user_chat");
        core.removeIOHandler("ui_chat_reply");
        rl.close();

        console.log(chalk.green("✅ Shutdown complete"));
        process.exit(0);
    });
}

// Run the example
main().catch((error) => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
