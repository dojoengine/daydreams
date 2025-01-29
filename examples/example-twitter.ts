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

    // Initialize processor with default character personality
    const processor = new MessageProcessor(
        llmClient,
        defaultCharacter,
        loglevel,
    );

    // Initialize core system
    const core = new Orchestrator(
        roomManager,
        vectorDb,
        [processor],
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        },
    );

    // Set up Twitter client with credentials
    const twitter = new TwitterClient(
        {
            username: env.TWITTER_USERNAME,
            password: env.TWITTER_PASSWORD,
            email: env.TWITTER_EMAIL,
        },
        loglevel,
    );

    // Initialize autonomous thought generation
    const consciousness = new Consciousness(llmClient, roomManager, {
        intervalMs: 300000, // Think every 5 minutes
        minConfidence: 0.7,
        logLevel: loglevel,
    });

    // Check Twitter mentions every minute
    const t1 = setInterval(async () => {
        console.log(chalk.blue("🔍 Checking Twitter mentions..."));
        // Create a static mentions input handler
        const mentionsInput = twitter.createMentionsInput(60000);
        const mentions = await mentionsInput.handler();

        if (mentions) {
            const input = mentions.map((mention) => (
                {
                    type: "tweet",
                    room: mention.metadata.conversationId,
                    contentId: mention.metadata.tweetId,
                    user: mention.metadata.username,
                    content: mention.content,
                    metadata: mention,
                }
            ));
            core.runAutonomousFlow(input, "twitter_mentions");
        }
    }, 6000);

    // Think every 5 minutes
    const t2 = setInterval(async () => {
        console.log(chalk.blue("🧠 Generating thoughts..."));
        const thought = await consciousness.start();
        if (thought) {
            core.runAutonomousFlow(thought, "consciousness_thoughts");
        }
    }, 30000);

    // Register output handler for posting thoughts to Twitter
    core.registerIOHandler({
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
                        "No emojis or non-ASCII characters allowed",
                    ),
            })
            .describe(
                "This is the content of the tweet you are posting. It should be a string of text that is 280 characters or less. Use this to post a tweet on the timeline.",
            ),
    });

    // Register output handler for Twitter replies
    core.registerIOHandler({
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
                "If you have been tagged or mentioned in the tweet, use this. This is for replying to tweets.",
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

        clearInterval(t1);
        clearInterval(t2);

        // Clean up resources
        await consciousness.stop();
        core.removeIOHandler("twitter_mentions");
        core.removeIOHandler("consciousness_thoughts");
        core.removeIOHandler("twitter_reply");
        core.removeIOHandler("twitter_thought");
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
