import chalk from "chalk";
import { z } from "zod";
import readline from "readline";

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { TelegramClient } from "../packages/core/src/core/io/telegram";
import { RoomManager } from "../packages/core/src/core/room-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import { LogLevel } from "../packages/core/src/core/types";
import { defaultCharacter } from "../packages/core/src/core/character";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { SchedulerService } from "../packages/core/src/core/schedule-service";
import { Logger } from "../packages/core/src/core/logger";
import { MongoStorage } from "../packages/mongodb-storage/src";
import { ORCHESTRATORS_KIND, SCHEDULED_TASKS_KIND } from '../packages/storage/src';

async function main() {
    const loglevel = LogLevel.DEBUG;

    // Ensure startup chat ID is set
    if (!env.TELEGRAM_STARTUP_CHAT_ID) {
        console.warn(chalk.yellow("⚠️ No TELEGRAM_STARTUP_CHAT_ID set - startup message will be skipped"));
    }

    // Initialize core dependencies
    const vectorDb = new ChromaVectorDB("telegram_agent", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    await vectorDb.purge(); // Clear previous session data

    const roomManager = new RoomManager(vectorDb);

    const llmClient = new LLMClient({
        // model: "openrouter:deepseek/deepseek-r1", // Using a supported model
        model: "openrouter:deepseek/deepseek-r1-distill-llama-70b",
        temperature: 0.3,
    });

    // Initialize processor with default character personality
    const processor = new MessageProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

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
    ]);

    const orchestratorDb = new MongoDb(scheduledTaskDb);


    // Initialize core system
    const orchestrator = new Orchestrator(
        roomManager,
        vectorDb,
        processor,
        orchestratorDb,
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    const scheduler = new SchedulerService(
        {
            logger: new Logger({
                level: loglevel,
                enableColors: true,
                enableTimestamp: true,
            }),
            orchestratorDb,
            roomManager: roomManager,
            vectorDb: vectorDb,
        },
        orchestrator,
        10000
    );

    // Set up Telegram user client with credentials
    const telegram = new TelegramClient(
        {
            session: env.TELEGRAM_USER_SESSION,
            bot_token: env.TELEGRAM_TOKEN,
            api_id: parseInt(env.TELEGRAM_API_ID as string),
            api_hash: env.TELEGRAM_API_HASH,
            is_bot: false,
        },
        loglevel,
    );

    // Set up Telegram bot client with credentials
    // const telegram = new TelegramClient(
    //     {
    //         bot_token: env.TELEGRAM_TOKEN,
    //         api_id: parseInt(env.TELEGRAM_API_ID as string),
    //         api_hash: env.TELEGRAM_API_HASH,
    //         is_bot: true,
    //         session: undefined,
    //     },
    //     loglevel,
    // );

    // Wait for login to complete before setting up handlers
    await telegram.initialize();

    orchestrator.registerIOHandler({
        name: "telegram_send_message",
        role: HandlerRole.OUTPUT,
        execute: async (data: unknown) => {
            const messageData = data as {
                content: string;
                chatId: number;
            };
            return telegram.createSendMessageOutput().handler(messageData);
        },
        outputSchema: z
            .object({
                content: z.string(),
                chatId: z.number().optional().describe("The chat ID for the message"),
            })
            .describe("This is for sending a message."),
    });

    // Register chat list scraper handler
    orchestrator.registerIOHandler({
        name: "telegram_chat_list_scraper",
        role: HandlerRole.INPUT,
        execute: async () => {
            try {
                console.log(chalk.blue("📊 Fetching chat list..."));
                const result = await telegram.createChatListScraper().handler();
                return result;
            } catch (error) {
                console.error(chalk.red("Error in chat list scraper:"), error);
                return null;
            }
        }
    });

    scheduler.start();

    await scheduler.scheduleTaskInDb(
        "sleever",
        "telegram_chat_list_scraper",
        {},
        60000 // 1 minute
    );

    // Set up readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Start the prompt loop
    console.log(chalk.cyan("🤖 Bot is now running and monitoring Telegram..."));
    console.log(chalk.cyan("You can type messages in the console."));
    console.log(chalk.cyan('Type "exit" to quit'));

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));

        // Clean up resources
        telegram.logout();
        orchestrator.removeIOHandler("telegram_send_message");
        orchestrator.removeIOHandler("telegram_chat_list_scraper");
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