/**
 * Example demonstrating a Discord bot using the Daydreams package,
 * updated to use a streaming IOHandler so we can handle real-time
 * Discord messages without manual dispatch calls.
 */

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole, LogLevel } from "../packages/core/src/core/types";
import { DiscordClient } from "../packages/core/src/core/io/discord";
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

    const conversationManager = new ConversationManager(vectorDb);

    const llmClient = new LLMClient({
        model: "anthropic/claude-3-5-sonnet-latest",
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

    // Initialize the Discord client
    const discord = new DiscordClient(
        {
            discord_token: env.DISCORD_TOKEN,
            discord_bot_name: "DeepLoaf",
        },
        loglevel
    );

    // 1) REGISTER A STREAMING INPUT
    //    This handler sets up a Discord listener. On mention, it
    //    pipes data into Orchestrator via "onData".
    core.registerIOHandler({
        name: "discord_stream",
        role: HandlerRole.INPUT,
        subscribe: (onData) => {
            discord.startMessageStream(onData);
            return () => {
                discord.stopMessageStream();
            };
        },
    });

    // 2) REGISTER AN OUTPUT HANDLER
    //    This allows your Processor to suggest messages that are posted back to Discord

    core.registerIOHandler(discord.createMessageOutput());

    // (Optional) Set up a console readline for manual input, etc.
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    console.log(chalk.cyan("🤖 Bot is now running and monitoring Discord..."));
    console.log(
        chalk.cyan("You can also type messages in this console for debugging.")
    );
    console.log(chalk.cyan('Type "exit" to quit.'));

    // Handle graceful shutdown (Ctrl-C, etc.)
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));

        // If we want to stop the streaming IO handler:
        core.removeIOHandler("discord_stream");

        // Also remove any other handlers or do cleanup
        core.removeIOHandler("discord_reply");
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
