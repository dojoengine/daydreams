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
import { ConversationManager } from "../packages/core/src/core/conversation-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import { LogLevel } from "../packages/core/src/core/types";
import chalk from "chalk";
import { defaultCharacter } from "../packages/core/src/core/characters/character";
import { Consciousness } from "../packages/core/src/core/consciousness";
import { z } from "zod";
import readline from "readline";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { SchedulerService } from "../packages/core/src/core/schedule-service";
import { MasterProcessor } from "../packages/core/src/core/processors/master-processor";
import { Logger } from "../packages/core/src/core/logger";
import { makeFlowLifecycle } from "../packages/core/src/core/life-cycle";

async function main() {
    const loglevel = LogLevel.DEBUG;

    // Initialize core dependencies
    const vectorDb = new ChromaVectorDB("twitter_agent", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    // Clear previous session data
    await vectorDb.purge();

    // Initialize room manager
    const conversationManager = new ConversationManager(vectorDb);

    // Initialize LLM client
    const llmClient = new LLMClient({
        model: "anthropic/claude-3-5-sonnet-latest",
        temperature: 0.3,
    });

    // Initialize master processor
    const masterProcessor = new MasterProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // Add message processor to master processor
    masterProcessor.addProcessor([
        new MessageProcessor(llmClient, defaultCharacter, loglevel),
    ]);

    // Initialize MongoDB for scheduled tasks
    const kvDb = new MongoDb(
        "mongodb://localhost:27017",
        "myApp",
        "scheduled_tasks"
    );

    // Connect to MongoDB
    await kvDb.connect();
    console.log(chalk.green("✅ Scheduled task database connected"));

    // Delete previous data for testing
    await kvDb.deleteAll();

    // Initialize core system
    const orchestrator = new Orchestrator(
        masterProcessor,
        makeFlowLifecycle(kvDb, conversationManager),
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    // Initialize scheduler service
    const scheduler = new SchedulerService(
        {
            logger: new Logger({
                level: loglevel,
                enableColors: true,
                enableTimestamp: true,
            }),
            orchestratorDb: kvDb,
            conversationManager: conversationManager,
            vectorDb: vectorDb,
        },
        orchestrator,
        10000
    );

    // Start scheduler service
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
    const consciousness = new Consciousness(llmClient, conversationManager, {
        intervalMs: 300000, // Think every 5 minutes
        minConfidence: 0.7,
        logLevel: loglevel,
    });

    // Register input handler for Twitter mentions
    orchestrator.registerIOHandler({
        name: "twitter_mentions",
        role: HandlerRole.INPUT,
        execute: async () => {
            console.log(chalk.blue("🔍 Checking Twitter mentions..."));
            // Create a static mentions input handler
            const mentionsInput = twitter.createMentionsInput(60000);
            const mentions = await mentionsInput.handler();

            // If no new mentions, return an empty array to skip processing
            if (!mentions || !mentions.length) {
                return [];
            }

            // Filter out mentions that do not have the required non-null properties before mapping
            return mentions
                .filter(
                    (mention) =>
                        mention.metadata.tweetId !== undefined &&
                        mention.metadata.conversationId !== undefined &&
                        mention.metadata.userId !== undefined
                )
                .map((mention) => ({
                    userId: mention.metadata.userId!,
                    threadId: mention.metadata.conversationId!,
                    contentId: mention.metadata.tweetId!,
                    platformId: "twitter",
                    data: mention,
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
                return [];
            }

            return {
                userId: "internal",
                threadId: "internal",
                contentId: "internal",
                platformId: "internal",
                data: thought,
            };
        },
    });

    // Register output handler for posting thoughts to Twitter
    orchestrator.registerIOHandler({
        name: "twitter_thought",
        role: HandlerRole.OUTPUT,
        execute: async (data: unknown) => {
            const thoughtData = data as { content: string };

            // Post thought to Twitter
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

    // Schedule a task to check mentions every minute
    await scheduler.scheduleTaskInDb("sleever", "twitter_mentions", {}, 60000);

    // Schedule a task to generate thoughts every 5 minutes
    await scheduler.scheduleTaskInDb(
        "sleever",
        "consciousness_thoughts",
        {},
        300000
    );

    // Register output handler for Twitter replies
    orchestrator.registerIOHandler({
        name: "twitter_reply",
        role: HandlerRole.OUTPUT,
        execute: async (data: unknown) => {
            const tweetData = data as { content: string; inReplyTo: string };

            // Post reply to Twitter
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
