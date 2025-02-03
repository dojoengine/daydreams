/**
 * Example demonstrating a comprehensive Hyperliquid trading bot using the Daydreams package.
 * This bot provides full trading capabilities including:
 * - Place limit orders (instant-or-cancel & good-til-cancel)
 * - Place market orders with size or USD amount
 * - Get account balances and positions
 * - Monitor open orders
 * - Cancel existing orders
 * - Market sell positions
 * - Interactive console interface for manual trading
 * - Real-time order status monitoring
 */

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { HyperliquidClient } from "../packages/core/src/core/io/hyperliquid";
import { ConversationManager } from "../packages/core/src/core/conversation-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import { LogLevel } from "../packages/core/src/core/types";
import chalk from "chalk";
import { defaultCharacter } from "../packages/core/src/core/characters/character-trading-sage";
import { z } from "zod";
import readline from "readline";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { makeFlowLifecycle } from "../packages/core/src/core/life-cycle";

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

    // Initialize processor with default character personality
    const processor = new MessageProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // Initialize core system
    const scheduledTaskDb = new MongoDb(
        "mongodb://localhost:27017",
        "myApp",
        "scheduled_tasks"
    );

    await scheduledTaskDb.connect();
    console.log(chalk.green("✅ Scheduled task database connected"));

    await scheduledTaskDb.deleteAll();

    const core = new Orchestrator(
        processor,
        makeFlowLifecycle(scheduledTaskDb, conversationManager),
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    // Set up Hyperliquid client with credentials
    const hyperliquid = new HyperliquidClient(
        {
            mainAddress: env.HYPERLIQUID_MAIN_ADDRESS,
            walletAddress: env.HYPERLIQUID_WALLET_ADDRESS,
            privateKey: env.HYPERLIQUID_PRIVATE_KEY,
        },
        loglevel
    );

    // Register handler for placing instant-or-cancel limit orders
    core.registerIOHandler({
        name: "hyperliquid_place_limit_order_instantorcancel",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            ticker: z
                .string()
                .describe(
                    "Ticker must be only the letter of the ticker in uppercase without the -PERP or -SPOT suffix"
                ),
            sz: z.number(),
            limit_px: z.number(),
            is_buy: z.boolean(),
        }),
        execute: async (data: unknown) => {
            const message = data as {
                ticker: string;
                sz: number;
                limit_px: number;
                is_buy: boolean;
            };
            console.log(
                chalk.blue(
                    `🔍 ${message.is_buy ? "Buying" : "Selling"} ${message.sz}x${message.ticker} at ${message.limit_px} (total $${message.limit_px * message.sz})...`
                )
            );
            return await hyperliquid.placeLimitOrderInstantOrCancel(
                message.ticker,
                message.sz,
                message.limit_px,
                message.is_buy
            );
        },
    });

    // Register handler for placing good-til-cancel limit orders
    core.registerIOHandler({
        name: "hyperliquid_place_limit_order_goodtilcancel",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            ticker: z
                .string()
                .describe(
                    "Ticker must be only the letter of the ticker in uppercase without the -PERP or -SPOT suffix"
                ),
            sz: z.number().positive(),
            limit_px: z.number().positive(),
            is_buy: z.boolean(),
        }),
        execute: async (data: unknown) => {
            const message = data as {
                ticker: string;
                sz: number;
                limit_px: number;
                is_buy: boolean;
            };
            console.log(
                chalk.blue(
                    `🔍 ${message.is_buy ? "Buying" : "Selling"} ${message.sz}x${message.ticker} at ${message.limit_px} (total $${message.limit_px * message.sz})...`
                )
            );
            return await hyperliquid.placeLimitOrderGoodTilCancel(
                message.ticker,
                message.sz,
                message.limit_px,
                message.is_buy
            );
        },
    });

    // Register handler for market selling positions
    core.registerIOHandler({
        name: "hyperliquid_market_sell_positions",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            tickers: z.array(z.string()).min(1),
        }),
        execute: async (data: unknown) => {
            const message = data as {
                tickers: string[];
            };
            console.log(
                chalk.blue(
                    `🔍 Selling all positions of ${message.tickers.join(", ")}...`
                )
            );
            return await hyperliquid.marketSellPositions(message.tickers);
        },
    });

    // Register handler for getting open orders
    core.registerIOHandler({
        name: "hyperliquid_get_open_orders",
        role: HandlerRole.ACTION,
        outputSchema: z.object({}),
        execute: async () => {
            console.log(chalk.blue(`🔍 Looking at current open orders...`));
            return await hyperliquid.getOpenOrders();
        },
    });

    // Register handler for getting account balance
    core.registerIOHandler({
        name: "hyperliquid_get_account_balances_and_positions",
        role: HandlerRole.ACTION,
        outputSchema: z.object({}),
        execute: async () => {
            console.log(chalk.blue(`🔍 Looking at balances...`));
            return await hyperliquid.getAccountBalancesAndPositions();
        },
    });

    // Register handler for placing market orders
    core.registerIOHandler({
        name: "hyperliquid_place_market_order",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            ticker: z
                .string()
                .describe(
                    "Ticker must be only the letter of the ticker in uppercase without the -PERP or -SPOT suffix"
                ),
            sz: z.number().positive(),
            is_buy: z.boolean(),
        }),
        execute: async (data: unknown) => {
            const message = data as {
                ticker: string;
                sz: number;
                is_buy: boolean;
            };
            console.log(
                chalk.blue(
                    `🔍 ${message.is_buy ? "Buying" : "Selling"} ${message.sz} of ${message.ticker}...`
                )
            );
            try {
                return await hyperliquid.placeMarketOrder(
                    message.ticker,
                    message.sz,
                    message.is_buy
                );
            } catch (err) {
                console.error(err);
            }
        },
    });

    // Register handler for placing market orders with USDC amount
    core.registerIOHandler({
        name: "hyperliquid_place_market_order_from_total_usdc_amount",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            ticker: z
                .string()
                .describe(
                    "Ticker must be only the letter of the ticker in uppercase without the -PERP or -SPOT suffix"
                ),
            usdtotalprice: z.number().positive(),
            is_buy: z.boolean(),
        }),
        execute: async (data: unknown) => {
            const message = data as {
                ticker: string;
                usdtotalprice: number;
                is_buy: boolean;
            };
            console.log(
                chalk.blue(
                    `🔍 ${message.is_buy ? "Buying" : "Selling"} ${message.ticker} for $${message.usdtotalprice}...`
                )
            );
            try {
                return await hyperliquid.placeMarketOrderUSD(
                    message.ticker,
                    message.usdtotalprice,
                    message.is_buy
                );
            } catch (err) {
                console.error(err);
            }
        },
    });

    // Cancel orders handler
    core.registerIOHandler({
        name: "hyperliquid_cancel_order",
        role: HandlerRole.ACTION,
        outputSchema: z.object({
            ticker: z
                .string()
                .describe(
                    "Ticker must be only the letter of the ticker in uppercase without the -PERP or -SPOT suffix"
                ),
            orderId: z.number(),
        }),
        execute: async (data: unknown) => {
            const order = data as {
                ticker: string;
                orderId: number;
            };
            return await hyperliquid.cancelOrder(order.ticker, order.orderId);
        },
    });

    core.registerIOHandler({
        name: "user_chat",
        role: HandlerRole.INPUT,
        execute: async (payload) => {
            return payload;
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
            console.log(`Reply to user: ${message}`);
        },
    });

    // Set up readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Start the prompt loop
    console.log(chalk.cyan("🤖 Bot is now running and monitoring Discord..."));
    console.log(chalk.cyan("You can type messages in the console."));
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
                        platformId: "console",
                        threadId: "console",
                        data: {},
                    },
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
        core.removeIOHandler("hyperliquid_place_limit_order_instantorcancel");
        core.removeIOHandler("hyperliquid_place_limit_order_goodtilcancel");
        core.removeIOHandler("hyperliquid_market_sell_positions");
        core.removeIOHandler("hyperliquid_get_open_orders");
        core.removeIOHandler("hyperliquid_get_account_balances_and_positions");
        core.removeIOHandler("hyperliquid_place_market_order");
        core.removeIOHandler(
            "hyperliquid_place_market_order_from_total_usdc_amount"
        );
        core.removeIOHandler("hyperliquid_cancel_order");
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
