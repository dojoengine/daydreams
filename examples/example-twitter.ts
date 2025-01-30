/**
 * Example demonstrating a Twitter bot using the Daydreams package.
 * This bot can:
 * - Monitor Twitter mentions and auto-reply
 * - Generate autonomous thoughts and tweet them
 * - Maintain conversation memory using ChromaDB
 * - Process inputs through a character-based personality
 */

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { TwitterClient } from "../packages/core/src/core/io/twitter";
import { RoomManager } from "../packages/core/src/core/room-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import { LogLevel } from "../packages/core/src/core/types";
import chalk from "chalk";
import { defaultCharacter } from "../packages/core/src/core/character";
import { Consciousness } from "../packages/core/src/core/consciousness";
import { z } from "zod";
import readline from "readline";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { SchedulerService } from "../packages/core/src/core/schedule-service";
import { MasterProcessor } from "../packages/core/src/core/processors/master-processor";
import { Logger } from "../packages/core/src/core/logger";

async function main() {
    const loglevel = LogLevel.DEBUG;
    // Initialize core dependencies
    const vectorDb = new ChromaVectorDB("twitter_agent", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    await vectorDb.purge(); // Clear previous session data

    const roomManager = new RoomManager(vectorDb);

    const llmClient = new LLMClient({
        model: "openrouter:deepseek/deepseek-r1-distill-llama-70b",
        temperature: 0.3,
    });

    const masterProcessor = new MasterProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // Initialize processor with default character personality
    const messageProcessor = new MessageProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    masterProcessor.addProcessor(messageProcessor);

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
        roomManager,
        vectorDb,
        masterProcessor,
        scheduledTaskDb,
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
            roomManager: roomManager,
            vectorDb: vectorDb,
        },
        orchestrator,
        10000
    );

    scheduler.start();

    // Set up Twitter client with credentials
    const twitter = new TwitterClient(
        {
            username: env.TWITTER_USERNAME,
            password: env.TWITTER_PASSWORD,
            email: env.TWITTER_EMAIL,
        },
        loglevel
    );

    // Initialize autonomous thought generation
    const consciousness = new Consciousness(llmClient, roomManager, {
        intervalMs: 300000, // Think every 5 minutes
        minConfidence: 0.7,
        logLevel: loglevel,
    });

    //   Register input handler for Twitter mentions
    orchestrator.registerIOHandler({
        name: "twitter_mentions",
        role: HandlerRole.INPUT,
        execute: async () => {
            console.log(chalk.blue("🔍 Checking Twitter mentions..."));
            // Create a static mentions input handler
            const mentionsInput = twitter.createMentionsInput(60000);
            const mentions = await mentionsInput.handler();

            // If no new mentions, return null to skip processing
            if (!mentions || mentions.length === 0) {
                return null;
            }

            return mentions.map((mention) => ({
                type: "tweet",
                room: mention.metadata.conversationId,
                contentId: mention.metadata.tweetId,
                user: mention.metadata.username,
                content: mention.content,
                metadata: mention,
            }));
        },
    });

    // Register input handler for autonomous thoughts
    orchestrator.registerIOHandler({
        name: "consciousness_thoughts",
        role: HandlerRole.INPUT,
        execute: async () => {
            console.log(chalk.blue("🧠 Generating thoughts..."));
            const thought = await consciousness.start();

            // If no thought was generated or it was already processed, skip
            if (!thought || !thought.content) {
                return null;
            }

            return thought;
        },
    });

    // Register output handler for posting thoughts to Twitter
    orchestrator.registerIOHandler({
        name: "twitter_thought",
        role: HandlerRole.OUTPUT,
        execute: async (data: unknown) => {
            const thoughtData = data as { content: string };

            return twitter.createTweetOutput().handler({
                content: thoughtData.content,
            });
        },
        outputSchema: z
            .object({
                content: z
                    .string()
                    .regex(
                        /^[\x20-\x7E]*$/,
                        "No emojis or non-ASCII characters allowed"
                    ),
            })
            .describe(
                "This is the content of the tweet you are posting. It should be a string of text that is 280 characters or less. Use this to post a tweet on the timeline."
            ),
    });

    // Schedule a task to run every minute
    await scheduler.scheduleTaskInDb("sleever", "twitter_mentions", {}, 6000); // Check mentions every minute
    await scheduler.scheduleTaskInDb(
        "sleever",
        "consciousness_thoughts",
        {},
        30000
    ); // Think every 5 minutes

    // Register output handler for Twitter replies
    orchestrator.registerIOHandler({
        name: "twitter_reply",
        role: HandlerRole.OUTPUT,
        execute: async (data: unknown) => {
            const tweetData = data as { content: string; inReplyTo: string };

            return twitter.createTweetOutput().handler(tweetData);
        },
        outputSchema: z
            .object({
                content: z.string(),
                inReplyTo: z
                    .string()
                    .optional()
                    .describe("The tweet ID to reply to, if any"),
            })
            .describe(
                "If you have been tagged or mentioned in the tweet, use this. This is for replying to tweets."
            ),
    });

    // Set up readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Start the prompt loop
    console.log(chalk.cyan("🤖 Bot is now running and monitoring Twitter..."));
    console.log(chalk.cyan("You can type messages in the console."));
    console.log(chalk.cyan('Type "exit" to quit'));

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));

        // Clean up resources
        await consciousness.stop();
        orchestrator.removeIOHandler("twitter_mentions");
        orchestrator.removeIOHandler("consciousness_thoughts");
        orchestrator.removeIOHandler("twitter_reply");
        orchestrator.removeIOHandler("twitter_thought");
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
