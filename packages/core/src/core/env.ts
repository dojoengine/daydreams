import { z } from "zod";

const envSchema = z.object({
    TWITTER_USERNAME: z.string(),
    TWITTER_PASSWORD: z.string(),
    TWITTER_EMAIL: z.string(),
    OPENAI_API_KEY: z.string(),
    CHROMA_URL: z.string().default("http://localhost:8000"),
    STARKNET_RPC_URL: z.string(),
    STARKNET_ADDRESS: z.string(),
    STARKNET_PRIVATE_KEY: z.string(),
    OPENROUTER_API_KEY: z.string(),
    GRAPHQL_URL: z.string(),
    DISCORD_TOKEN: z.string(),
    SUI_NETWORK: z.string().default("testnet"),
    SUI_PRIVATE_KEY: z.string(),
    TELEGRAM_TOKEN: z.string(),
    TELEGRAM_API_ID: z.string(),
    TELEGRAM_API_HASH: z.string(),
    HYPERLIQUID_MAIN_ADDRESS: z.string(),
    HYPERLIQUID_WALLET_ADDRESS: z.string(),
    HYPERLIQUID_PRIVATE_KEY: z.string(),
    WEBSOCKET_URL: z.string().default("ws://localhost:8080"),
    DRY_RUN: z
        .preprocess((val) => val === "1" || val === "true", z.boolean())
        .default(true),
    TELEGRAM_STARTUP_CHAT_ID: z.string().optional(),
    TELEGRAM_USER_SESSION: z.string().optional(),
});
export const env = envSchema.parse(process.env);
