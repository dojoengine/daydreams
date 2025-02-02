import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { TelegramClient } from "../packages/core/src/core/io/telegram";
import { ConversationManager } from "../packages/core/src/core/conversation-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import { LogLevel } from "../packages/core/src/core/types";
import chalk from "chalk";
import { defaultCharacter } from "../packages/core/src/core/characters/character-helpful-assistant";
import { z } from "zod";
import readline from "readline";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { SchedulerService } from "../packages/core/src/core/schedule-service";
import { Logger } from "../packages/core/src/core/logger";
import { makeFlowLifecycle } from "../packages/core/src/core/life-cycle";


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

    const conversationManager = new ConversationManager(vectorDb);

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
    const scheduledTaskDb = new MongoDb(
        "mongodb://localhost:27017",
        "myApp",
        "scheduled_tasks"
    );

    await scheduledTaskDb.connect();
    console.log(chalk.green("✅ Scheduled task database connected"));

    await scheduledTaskDb.deleteAll();

    // Initialize core system
    const orchestrator = new Orchestrator(
        processor,
        makeFlowLifecycle(scheduledTaskDb, conversationManager),
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
            orchestratorDb: scheduledTaskDb,
            conversationManager: conversationManager,
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
                // Return default string values for required identifiers since the result object
                // does not include userId, threadId, and contentId.
                return {
                    userId: "telegram_scraper",
                    threadId: "telegram_scraper",
                    contentId: "telegram_scraper",
                    platformId: "telegram",
                    data: result,
                };
            } catch (error) {
                console.error(chalk.red("Error in chat list scraper:"), error);
                // In the error case, provide fallback values with empty strings for the id fields
                // and a default error structure for data.
                return {
                    userId: "telegram_scraper",
                    threadId: "telegram_scraper",
                    contentId: "telegram_scraper",
                    platformId: "telegram",
                    data: { success: false, error, chats: [] },
                };
            }
        },
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