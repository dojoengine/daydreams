import { defineConfig } from "tsup";

import { tsupConfig } from "../../tsup.config";

export default defineConfig({
  ...tsupConfig,
  entry: ["./src/index.ts", "src/extensions/index.ts"],
  dts: true,
  external: [
    "readline/promises",
    "telegraf",
    "@telegraf/types",
    "discord.js",
    "hyperliquid",
    "agent-twitter-client",
    "starknet",
    "@mysten/sui",
    "ethers",
    "@solana/web3.js",
    "b58",
    "telegram",
    "@tavily/core",
  ],
});
