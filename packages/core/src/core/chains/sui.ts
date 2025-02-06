import { getFullnodeUrl, SuiClient, type SuiTransactionBlockResponse } from "@mysten/sui/client";
import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui/faucet';
import type { Signer } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";
import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";
import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import BN from "bignumber.js";
import type { IChain } from "../types";

interface SwapResult {
    success: boolean;
    tx: string;
    message: string;
}

interface TokenMetadata {
    symbol: string;
    decimals: number;
    tokenAddress: string;
}

const parseAccount = (privateKey: string): Signer => {
    if (privateKey.startsWith("suiprivkey")) {
        return loadFromSecretKey(privateKey);
    }
    return loadFromMnemonics(privateKey);
};

const loadFromSecretKey = (privateKey: string) => {
    const keypairClasses = [Ed25519Keypair, Secp256k1Keypair, Secp256r1Keypair];
    for (const KeypairClass of keypairClasses) {
        try {
            return KeypairClass.fromSecretKey(privateKey);
        } catch { }
    }
    throw new Error("Failed to initialize keypair from secret key");
};

const loadFromMnemonics = (mnemonics: string) => {
    const keypairMethods = [
        { Class: Ed25519Keypair, method: "deriveKeypairFromSeed" },
        { Class: Secp256k1Keypair, method: "deriveKeypair" },
        { Class: Secp256r1Keypair, method: "deriveKeypair" },
    ];
    for (const { Class, method } of keypairMethods) {
        try {
            return (Class as any)[method](mnemonics);
        } catch { }
    }
    throw new Error("Failed to derive keypair from mnemonics");
};

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";
export type FaucetNetwork = "testnet" | "devnet" | "localnet";

export const supportedSuiTokens: Map<string, TokenMetadata> = new Map([
    [
        "SUI",
        {
            symbol: "SUI",
            decimals: SUI_DECIMALS,
            tokenAddress: "0x2::sui::SUI",
        },
    ],
    [
        "USDC",
        {
            symbol: "USDC",
            decimals: 6,
            tokenAddress:
                "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        },
    ],
]);

export const getTokenMetadata = (symbol: string) => {
    const metadata = supportedSuiTokens.get(symbol.toUpperCase())
    if (!metadata) throw new Error(`Token ${symbol} not found`);
    return metadata;
};

/**
 * Configuration options for initializing a Sui chain connection
 */
export interface SuiChainConfig {
    /** Private key for signing transactions. Should be managed securely! */
    privateKey: string;
    /** Type of sui network */
    network: SuiNetwork;
}

/**
 * Implementation of the IChain interface for interacting with the Sui L1 blockchain
 *
 * @example
 * ```ts
 * const sui = new SuiChain({
 *   privateKey: process.env.SUI_PRIVATE_KEY,
 *   network: process.env.SUI_NETWORK,
 * });
 * ```
 */
export class SuiChain implements IChain {
    /** Unique identifier for this chain implementation */
    public chainId = "sui";
    /** RPC client instance for connecting to Sui */
    private client: SuiClient;
    /** Type of sui network */
    private network: SuiNetwork;
    /** Account instance for transaction signing */
    private wallet: Signer;

    /**
     * Creates a new SuiChain instance
     * @param config - Configuration options for the Sui connection
     */
    constructor(config: SuiChainConfig) {
        this.client = new SuiClient({
            url: getFullnodeUrl(
                config.network,
            ),
        });
        this.network = config.network;
        this.wallet = parseAccount(config.privateKey);
    }

    /**
     * Performs a read-only call to a Sui contract
     * @param call - The contract call parameters
     * @returns The result of the contract call
     * @throws Error if the call fails
     */
    public async read(call: unknown): Promise<any> {
        const { objectId } = call as {
            objectId: string
        }

        const object = await this.client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showBcs: true,
                showDisplay: true,
                showOwner: true,
                showPreviousTransaction: true,
                showStorageRebate: true,
                showType: true
            }
        })

        return object;
    }

    /**
     * Executes a state-changing transaction on Sui
     * @param call - The transaction parameters
     * @returns The transaction receipt after confirmation
     * @throws Error if the transaction fails
     */
    public async write(call: unknown): Promise<SuiTransactionBlockResponse> {
        const { packageId, moduleName, functionName, params, tx } = call as {
            packageId: string,
            moduleName: string,
            functionName: string,
            params: Array<any>,
            tx: Transaction,
        }

        tx.moveCall({
            target: `${packageId}::${moduleName}::${functionName}`,
            arguments: params,
        });

        const result = await this.client.signAndExecuteTransaction({
            signer: this.wallet,
            transaction: tx,
        });

        return result;
    }

    /**
     * Executes a swap transaction on Sui
     * @param call - The swap transaction parameters
     * @returns The transaction digest and message after confirmation
     * @throws Error if the transaction fails
     */
    public async swapToken(
        call: unknown,
    ): Promise<SwapResult> {
        try {
            const { fromToken, amount, out_min_amount, targetToken } = call as {
                fromToken: string,
                amount: string,
                targetToken: string,
                out_min_amount: number | null,
            }

            const aggregatorURL = "https://api-sui.cetus.zone/router_v2/find_routes";
            const fromMeta = getTokenMetadata(fromToken);
            const toMeta = getTokenMetadata(targetToken);
            const client = new AggregatorClient(
                aggregatorURL,
                this.wallet.toSuiAddress(),
                this.client,
                Env.Mainnet
            );
            // provider list : https://api-sui.cetus.zone/router_v2/status
            const routerRes = await client.findRouters({
                from: fromMeta.tokenAddress,
                target: toMeta.tokenAddress,
                amount: new BN(amount),
                byAmountIn: true, // `true` means fix input amount, `false` means fix output amount
                depth: 3, // max allow 3, means 3 hops
                providers: [
                    "KRIYAV3",
                    "CETUS",
                    "SCALLOP",
                    "KRIYA",
                    "BLUEFIN",
                    "DEEPBOOKV3",
                    "FLOWXV3",
                    "BLUEMOVE",
                    "AFTERMATH",
                    "FLOWX",
                    "TURBOS",
                ],
            });
            if (routerRes === null) {
                console.error("No router found " + JSON.stringify({
                    from: fromMeta.tokenAddress,
                    target: toMeta.tokenAddress,
                    amount: amount,
                }))
                return {
                    success: false,
                    tx: "",
                    message: "No router found",
                };
            }

            if (out_min_amount && routerRes.amountOut.toNumber() < out_min_amount) {
                return {
                    success: false,
                    tx: "",
                    message: "Out amount is less than out_min_amount",
                };
            }

            let coin: TransactionObjectArgument;
            const routerTx = new Transaction();

            if (fromToken.toUpperCase() === "SUI") {
                coin = routerTx.splitCoins(routerTx.gas, [amount]);
            } else {
                const allCoins = await this.client.getCoins({
                    owner: this.wallet.toSuiAddress(),
                    coinType: fromMeta.tokenAddress,
                    limit: 30,
                });

                if (allCoins.data.length === 0) {
                    console.error("No coins found");
                    return {
                        success: false,
                        tx: "",
                        message: "No coins found",
                    };
                }

                const mergeCoins = [];

                for (let i = 1; i < allCoins.data.length; i++) {
                    mergeCoins.push(allCoins.data[i].coinObjectId);
                }

                if (mergeCoins.length > 0) {
                    routerTx.mergeCoins(allCoins.data[0].coinObjectId, mergeCoins);
                }
                coin = routerTx.splitCoins(allCoins.data[0].coinObjectId, [amount]);
            }

            const targetCoin = await client.routerSwap({
                routers: routerRes!.routes,
                byAmountIn: true,
                txb: routerTx,
                inputCoin: coin,
                slippage: 0.5,
            });

            routerTx.transferObjects([targetCoin], this.wallet.toSuiAddress());
            routerTx.setSender(this.wallet.toSuiAddress());
            const result = await client.signAndExecuteTransaction(
                routerTx,
                this.wallet
            );

            await this.client.waitForTransaction({
                digest: result.digest,
            });

            return {
                success: true,
                tx: result.digest,
                message: "Swap successful",
            };
        } catch (e) {
            return {
                success: false,
                tx: 'n/a',
                message: "Swap unsuccessful " + e?.toString(),
            };
        }
    }

    /**
     * Returns testnet sui tokens
     * @param call - The params for faucet
     * @returns Success/Failure message
     */
    public async requestSui(call: unknown): Promise<any> {
        try {
            const { network, recipient } = call as {
                network: FaucetNetwork,
                recipient: string,
            }

            await requestSuiFromFaucetV0({
                host: getFaucetHost(network),
                recipient,
            });

            return {
                message: `Successfully requested SUI to ${recipient} on ${network}`,
            };
        } catch (e) {
            return {
                message: `Failed to request SUI: ${e}`,
            };
        }
    }

    /**
     * Returns the sui address of the connected account
     */
    public getAddress(): string {
        return this.wallet.toSuiAddress();
    }
}
