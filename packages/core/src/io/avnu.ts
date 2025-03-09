import { Logger } from "../logger";
import { LogLevel } from "../types";
import { z } from "zod";

const envSchema = z.object({
    AVNU_API_URL: z.string().default("https://sepolia.api.avnu.fi"),
});

export const env = envSchema.parse(process.env);

export interface AvnuQuoteRequest {
    sellTokenAddress: string;
    buyTokenAddress: string;
    sellAmount?: string;
    buyAmount?: string;
    takerAddress?: string;
    excludeSources?: string[];
    size?: number;
    integratorFees?: string;
    integratorFeeRecipient?: string;
    integratorName?: string;
    onlyDirect?: boolean;
}

export interface AvnuSwapRequest {
    quoteId: string;
    takerAddress?: string;
    slippage?: number;
    includeApprove?: boolean;
}

export interface AvnuTokensRequest {
    search?: string;
    tag?: string[];
    page?: number;
    size?: number;
    sort?: string[];
}

export interface AvnuToken {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    logoUri: string;
    lastDailyVolumeUsd: number;
    extensions: Record<string, string>;
    tags: string[];
}

export interface AvnuTokensResponse {
    content: AvnuToken[];
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

export class AvnuClient {
    private apiUrl: string;
    private logger: Logger;
    private takerAddress: string;

    constructor(
        logLevel: LogLevel = LogLevel.INFO,
        apiUrl: string = env.AVNU_API_URL,
        takerAddress?: string,
    ) {
        this.apiUrl = apiUrl;
        this.logger = new Logger({
            level: logLevel,
            enableColors: true,
            enableTimestamp: true,
        });
        this.takerAddress = takerAddress || "0x052D8E9778D026588a51595E30B0F45609B4F771EecF0E335CdeFeD1d84a9D89";
    }

    public async getQuotes(request: AvnuQuoteRequest) {
        try {
            const params = new URLSearchParams();

            // Add required parameters
            params.append("sellTokenAddress", request.sellTokenAddress);
            params.append("buyTokenAddress", request.buyTokenAddress);

            // Convert decimal amount to hex if sellAmount is provided
            if (request.sellAmount) {
                const hexAmount = `0x${BigInt(request.sellAmount).toString(16)}`;
                params.append("sellAmount", hexAmount);
            }
            if (request.buyAmount) {
                const hexAmount = `0x${BigInt(request.buyAmount).toString(16)}`;
                params.append("buyAmount", hexAmount);
            }

            // Add optional parameters
            if (request.takerAddress) params.append("takerAddress", request.takerAddress);

            const response = await fetch(`${this.apiUrl}/swap/v2/quotes?${params}`);
            if (!response.ok) {
                throw new Error(`Failed to get quotes: ${response.statusText}`);
            }
            const quotes = await response.json();

            // Log quote information for debugging
            if (Array.isArray(quotes) && quotes.length > 0) {
                this.logger.debug("AvnuClient", "Quotes received", {
                    quoteCount: quotes.length,
                    firstQuoteId: quotes[0].quoteId,
                    sellAmount: quotes[0].sellAmount,
                    buyAmount: quotes[0].buyAmount
                });
            } else {
                this.logger.warn("AvnuClient", "No quotes received for request", { request });
            }

            return quotes;
        } catch (error) {
            this.logger.error("AvnuClient", "Failed to get quotes", { error, request });
            throw error;
        }
    }

    public async buildSwap(request: AvnuSwapRequest) {
        try {
            this.logger.debug("AvnuClient", "Building swap", request);

            const response = await fetch(`${this.apiUrl}/swap/v2/build`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quoteId: request.quoteId,
                    takerAddress: request.takerAddress || this.takerAddress,
                    slippage: request.slippage || 0.005,
                    includeApprove: request.includeApprove ?? true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                this.logger.error("AvnuClient", "Failed to build swap", {
                    status: response.status,
                    statusText: response.statusText,
                    errorData,
                    request
                });
                throw new Error(`Failed to build swap: ${response.statusText}`);
            }

            const result = await response.json();
            this.logger.debug("AvnuClient", "Build swap success", { result });
            return result;

        } catch (error) {
            this.logger.error("AvnuClient", "Failed to build swap", {
                error,
                request
            });
            throw error;
        }
    }

    public async executeSwap(quoteId: string) {
        try {
            this.logger.debug("AvnuClient", "Executing swap", { quoteId });

            if (!quoteId) {
                throw new Error("Quote ID is required for executing swap");
            }

            // Build the swap first to ensure we have a valid build state
            await this.buildSwap({
                quoteId,
                takerAddress: this.takerAddress,
                includeApprove: true
            });

            // Execute the swap with the built quote
            const response = await fetch(`${this.apiUrl}/swap/v2/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quoteId,
                    signature: [],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = "Failed to execute swap";
                if (errorData.messages?.[0]) {
                    errorMessage = errorData.messages[0];
                }
                this.logger.error("AvnuClient", "Execute swap failed", {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData.error,
                    errorData,
                    quoteId
                });
                throw new Error(errorMessage);
            }

            const result = await response.json();
            this.logger.debug("AvnuClient", "Execute swap success", { result, quoteId });
            return result;
        } catch (error) {
            this.logger.error("AvnuClient", "Failed to execute swap", {
                error,
                quoteId,
            });
            throw error;
        }
    }

    public async getTokens(request: AvnuTokensRequest = {}): Promise<AvnuTokensResponse> {
        try {
            const params = new URLSearchParams();

            if (request.search) params.append("search", request.search);
            if (request.tag) request.tag.forEach(tag => params.append("tag", tag));
            if (request.page !== undefined) params.append("page", request.page.toString());
            if (request.size !== undefined) params.append("size", request.size.toString());
            if (request.sort) request.sort.forEach(sort => params.append("sort", sort));

            const response = await fetch(`${this.apiUrl}/v1/starknet/tokens?${params}`);
            if (!response.ok) {
                throw new Error(`Failed to get tokens: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            this.logger.error("AvnuClient", "Failed to get tokens", { error, request });
            throw error;
        }
    }
}
