import { createGroq } from "@ai-sdk/groq";
import { createDreams, LogLevel, action, validateEnv } from "../../packages/core/src/index";
import { cli } from "../../packages/core/src/extensions";
import { AvnuClient } from "../../packages/core/src/io/avnu";
import { z } from "zod";
import chalk from "chalk";
import { ethers } from "ethers";
import { Account, Provider, CallData } from "starknet";

type EnvConfig = {
    GROQ_API_KEY: string;
    STARKNET_ACCOUNT_ADDRESS: string;
    STARKNET_PRIVATE_KEY: string;
    ANVU_EXCHANGE_ADDRESS: string;
};

const env = validateEnv(
    z.object({
        GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
        STARKNET_ACCOUNT_ADDRESS: z.string().default(""),
        STARKNET_PRIVATE_KEY: z.string().min(1, "STARKNET_PRIVATE_KEY is required"),
        ANVU_EXCHANGE_ADDRESS: z.string().default(""),
    })
) as EnvConfig;

// Initialize Groq client
const groq = createGroq({
    apiKey: env.GROQ_API_KEY,
});

// Initialize Avnu client with the exchange address
const avnu = new AvnuClient(
    LogLevel.DEBUG,
    "https://sepolia.api.avnu.fi",
    env.ANVU_EXCHANGE_ADDRESS // Exchange address is set here
);

// Initialize StarkNet provider and account
const provider = new Provider({ nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno/v0_5" });
const account = new Account(
    provider,
    env.STARKNET_ACCOUNT_ADDRESS,
    env.STARKNET_PRIVATE_KEY
);

// The fixed taker address for quotes
const QUOTE_TAKER_ADDRESS = "0x052D8E9778D026588a51595E30B0F45609B4F771EecF0E335CdeFeD1d84a9D89";

// Create Dreams agent instance
const agent = createDreams({
    model: groq("deepseek-r1-distill-llama-70b"),
    logger: LogLevel.DEBUG,
    extensions: [cli],
    actions: [
        action({
            name: "swap_tokens",
            description: "Swap tokens on Avnu (Sepolia)",
            schema: z.object({
                sellTokenSymbol: z.string().describe("The symbol of the token to sell"),
                buyTokenSymbol: z.string().describe("The symbol of the token to buy"),
                amount: z.string().describe("The amount to sell"),
                slippage: z.number().optional().describe("Slippage tolerance in percentage (default: 1)"),
            }),
            async handler(call) {
                try {
                    const { sellTokenSymbol, buyTokenSymbol, amount, slippage = 1 } = call.data;

                    // Look up tokens
                    console.log(chalk.blue(`🔍 Looking up tokens...`));
                    const [sellTokenResponse, buyTokenResponse] = await Promise.all([
                        avnu.getTokens({ search: sellTokenSymbol }),
                        avnu.getTokens({ search: buyTokenSymbol })
                    ]);

                    const sellTokenInfo = sellTokenResponse.content.find(t => t.symbol.toUpperCase() === sellTokenSymbol.toUpperCase());
                    const buyTokenInfo = buyTokenResponse.content.find(t => t.symbol.toUpperCase() === buyTokenSymbol.toUpperCase());

                    if (!sellTokenInfo || !buyTokenInfo) {
                        throw new Error(`Could not find one or more tokens. Please verify the symbols.`);
                    }

                    // Debug log token addresses
                    console.log(chalk.blue("Found tokens:"));
                    // console.log(`Sell Token (${sellTokenSymbol}):`, sellTokenInfo.address);
                    // console.log(`Buy Token (${buyTokenSymbol}):`, buyTokenInfo.address);

                    // Convert amount to wei
                    const sellAmountWei = ethers.parseUnits(amount, sellTokenInfo.decimals).toString();

                    // 1. Get quotes using the fixed taker address
                    const quotes = await avnu.getQuotes({
                        sellTokenAddress: sellTokenInfo.address,
                        buyTokenAddress: buyTokenInfo.address,
                        sellAmount: sellAmountWei,
                        takerAddress: QUOTE_TAKER_ADDRESS  // Fixed address for quotes
                    });

                    if (!Array.isArray(quotes) || quotes.length === 0) {
                        throw new Error("No quotes available for this swap");
                    }

                    // Find best quote
                    const bestQuote = quotes[0]; // Assuming first quote is best
                    if (!bestQuote || !bestQuote.quoteId) {
                        throw new Error("No valid quotes received");
                    }

                    console.log(chalk.blue("📊 Best quote:"));
                    console.log(`   Sell: ${ethers.formatUnits(bestQuote.sellAmount, sellTokenInfo.decimals)} ${sellTokenInfo.symbol}`);
                    console.log(`   Buy: ${ethers.formatUnits(bestQuote.buyAmount, buyTokenInfo.decimals)} ${buyTokenInfo.symbol}`);

                    // 2. Build swap transaction (still using fixed address)
                    console.log(chalk.blue("🔧 Building swap transaction..."));
                    const buildResult = await avnu.buildSwap({
                        quoteId: bestQuote.quoteId,
                        takerAddress: QUOTE_TAKER_ADDRESS,
                        slippage: slippage,
                        includeApprove: true,
                    });

                    // 3. Execute with real wallet
                    console.log(chalk.blue("💫 Preparing execution..."));

                    // Extract calls from build result
                    const { calls } = buildResult;

                    // Check if we need approval
                    const approvalCall = calls.find((call: { entrypoint: string }) =>
                        call.entrypoint === 'approve'
                    );

                    if (approvalCall) {
                        console.log(chalk.yellow("🔑 Token approval needed"));

                        // Execute approval transaction
                        const { transaction_hash } = await account.execute({
                            contractAddress: approvalCall.contractAddress,
                            entrypoint: 'approve',
                            calldata: CallData.compile(approvalCall.calldata)
                        });

                        console.log(chalk.green("✅ Approval transaction submitted:", transaction_hash));

                        // Wait for approval to be mined
                        await provider.waitForTransaction(transaction_hash);
                    }

                    // Find the swap call
                    const swapCall = calls.find((call: { entrypoint: string }) =>
                        call.entrypoint === 'multi_route_swap'
                    );

                    if (!swapCall) {
                        throw new Error("No swap call found in build result");
                    }

                    // Execute the swap with real account
                    console.log(chalk.blue("🔄 Executing swap..."));
                    const swapTx = await account.execute({
                        contractAddress: swapCall.contractAddress, // Use the contract address from the swap call
                        entrypoint: swapCall.entrypoint,
                        calldata: CallData.compile(swapCall.calldata)
                    });

                    // For approval, use the token contract address
                    if (approvalCall) {
                        await account.execute({
                            contractAddress: approvalCall.contractAddress,
                            entrypoint: 'approve',
                            calldata: CallData.compile(approvalCall.calldata)
                        });
                    }

                    console.log(chalk.green("✅ Swap transaction submitted:", swapTx.transaction_hash));

                    // Wait for transaction confirmation
                    const receipt = await provider.waitForTransaction(swapTx.transaction_hash);

                    return {
                        success: true,
                        quote: bestQuote,
                        buildResult,
                        transactionHash: swapTx.transaction_hash,
                        receipt
                    };

                } catch (error) {
                    console.error(chalk.red("❌ Swap failed:"), error instanceof Error ? error.message : String(error));
                    throw error;
                }
            },
        }),
    ],
});

// Start the agent
await agent.start();

console.log(chalk.cyan("\n🤖 Avnu Swap Agent is ready!"));
console.log(chalk.cyan("Example command:"));
