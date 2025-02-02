/**
 * Core LLM client module for interacting with various AI providers
 * @module LLMClient
 */

import { setTimeout } from "timers/promises";
import { EventEmitter } from "events";
import type {
    AnalysisOptions,
    LLMClientConfig,
    LLMResponse,
    StructuredAnalysis,
} from "./types";
import {
    generateText,
    type CoreMessage,
    type FilePart,
    type ImagePart,
} from "ai";

import { openai } from "@ai-sdk/openai";
import { azure } from "@ai-sdk/azure";
import { anthropic } from "@ai-sdk/anthropic";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { google } from "@ai-sdk/google";
import { vertex } from "@ai-sdk/google-vertex";
import { mistral } from "@ai-sdk/mistral";
import { xai } from "@ai-sdk/xai";
import { togetherai } from "@ai-sdk/togetherai";
import { cohere } from "@ai-sdk/cohere";
import { fireworks } from "@ai-sdk/fireworks";
import { deepinfra } from "@ai-sdk/deepinfra";
import { deepseek } from "@ai-sdk/deepseek";
import { cerebras } from "@ai-sdk/cerebras";
import { groq } from "@ai-sdk/groq";
import { openrouter } from "@openrouter/ai-sdk-provider";

/** Mapping of provider names to their implementations */
type ProviderMap = {
    openai: typeof openai;
    azure: typeof azure;
    anthropic: typeof anthropic;
    bedrock: typeof bedrock;
    google: typeof google;
    vertex: typeof vertex;
    mistral: typeof mistral;
    xai: typeof xai;
    togetherai: typeof togetherai;
    cohere: typeof cohere;
    fireworks: typeof fireworks;
    deepinfra: typeof deepinfra;
    deepseek: typeof deepseek;
    cerebras: typeof cerebras;
    groq: typeof groq;
    openrouter: typeof openrouter;
};

const providers: ProviderMap = {
    openai,
    azure,
    anthropic,
    bedrock,
    google,
    vertex,
    mistral,
    xai,
    togetherai,
    cohere,
    fireworks,
    deepinfra,
    deepseek,
    cerebras,
    groq,
    openrouter,
};

/** Function type for provider model initialization */
type ProviderFunction<T> = (modelId: string, config?: any) => T;

/**
 * Main client class for interacting with LLM providers
 * @extends EventEmitter
 */
export class LLMClient extends EventEmitter {
    private readonly config: Required<LLMClientConfig>;
    private lastRunAt = 0;
    private readonly provider: keyof ProviderMap;

    /**
     * Creates a new LLM client instance - supports all major LLM providers
     * @param config - Configuration options for the client
     * @param config.model - Model identifier in format "provider/model" or "openrouter:actual_provider/actual_model"
     * @param config.maxRetries - Maximum number of retry attempts (default: 3)
     * @param config.timeout - Request timeout in milliseconds (default: 30000)
     * @param config.temperature - Sampling temperature between 0-1 (default: 0.3)
     * @param config.maxTokens - Maximum tokens in response (default: 1000)
     * @param config.baseDelay - Base delay for retries in ms (default: 1000)
     * @param config.maxDelay - Maximum delay for retries in ms (default: 10000)
     * @example
     * ```typescript
     * const llm = new LLMClient({
     *   model: "openai/gpt-4-turbo-preview",
     *   temperature: 0.7,
     *   maxTokens: 2000,
     *   maxRetries: 5
     * });
     *
     * // Or using OpenRouter:
     * const llmOpenRouter = new LLMClient({
     *   model: "openrouter:anthropic/claude-2"
     * });
     * ```
     */
    constructor(config: LLMClientConfig) {
        super();
        this.setMaxListeners(50);

        this.provider = this.extractProvider(
            config.model || this.getDefaultModel()
        );

        this.config = {
            model: config.model || this.getDefaultModel(),
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 30000,
            temperature: config.temperature || 0.3,
            maxTokens: config.maxTokens || 8192,
            baseDelay: config.baseDelay || 1000,
            maxDelay: config.maxDelay || 10000,
            // Defaults to 5 calls per second
            throttleInterval: config.throttleInterval || 1000 / 5,
        };

        this.initializeClient();
    }

    private initializeClient(): void {}

    /**
     * Extracts the provider name from a model identifier.
     *
     * - If model starts with `openrouter:`, we'll treat provider as `openrouter`.
     * - Otherwise, we split by `/` and take the first piece as the provider.
     */
    private extractProvider(model: string): keyof ProviderMap {
        // Check explicit "openrouter:" prefix
        if (model.startsWith("openrouter:")) {
            return "openrouter";
        }

        // Otherwise, assume format "provider/model"
        const [provider] = model.split("/");
        if (!(provider in providers)) {
            throw new Error(`Unsupported provider: ${provider}`);
        }
        return provider as keyof ProviderMap;
    }

    /**
     * Gets the model identifier portion from the full model string.
     * - For `openrouter:provider/model`, we return only `provider/model`.
     * - For standard `provider/model`, we strip the first part (`provider`) and return `model`.
     */
    private getModelIdentifier(): string {
        if (this.provider === "openrouter") {
            // Remove "openrouter:" prefix
            return this.config.model.replace(/^openrouter:/, "");
        }

        const [, ...modelParts] = this.config.model.split("/");
        return modelParts.join("/");
    }

    /**
     * Initializes a provider-specific model instance
     */
    private getProviderModel(provider: keyof ProviderMap, modelId: string) {
        const providerFn = providers[provider] as ProviderFunction<any>;

        switch (provider) {
            case "openai":
                return providerFn(modelId, {
                    temperature: this.config.temperature,
                    maxTokens: this.config.maxTokens,
                });
            case "anthropic":
                return providerFn(modelId, {
                    temperature: this.config.temperature,
                    maxTokensToSample: this.config.maxTokens,
                });
            case "azure":
                return providerFn(modelId, {
                    temperature: this.config.temperature,
                    maxTokens: this.config.maxTokens,
                    deploymentName: modelId,
                });
            case "google":
            case "vertex":
                return providerFn(modelId, {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens,
                });
            default:
                // For all other providers (including openrouter), we just pass modelId
                return providerFn(modelId);
        }
    }

    /**
     * Completes a prompt using the configured LLM
     * @param prompt - Input prompt text
     * @returns Promise resolving to the completion response
     */
    public async complete(prompt: string): Promise<LLMResponse> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await this.executeCompletion(prompt);
            } catch (error) {
                lastError = error as Error;

                if (this.shouldRetry(error as Error, attempt)) {
                    const delay = this.calculateBackoff(attempt);
                    await setTimeout(delay);
                    continue;
                }

                throw this.enhanceError(error as Error);
            }
        }

        throw this.enhanceError(lastError!);
    }

    /**
     * Gets the full model name
     */
    public getModelName(): string {
        return this.config.model;
    }

    /**
     * Extracts the version number from the model name
     */
    public getModelVersion(): string {
        const versionMatch = this.config.model.match(/\d+(\.\d+)*/);
        return versionMatch ? versionMatch[0] : "unknown";
    }

    /**
     * Executes a completion request with timeout handling
     */
    private async executeCompletion(prompt: string): Promise<LLMResponse> {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(
            () => controller.abort(),
            this.config.timeout
        );

        try {
            return await this.call(prompt, controller.signal);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Makes the actual API call to the LLM provider
     */
    private async call(
        prompt: string,
        signal: AbortSignal
    ): Promise<LLMResponse> {
        await this.throttle();

        const modelId = this.getModelIdentifier();
        const model = this.getProviderModel(this.provider, modelId);

        let response = await generateText({
            model,
            prompt,
            abortSignal: signal,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
        });

        return {
            text: response.text,
            model: this.config.model,
            usage: {
                prompt_tokens: response.usage.promptTokens,
                completion_tokens: response.usage.completionTokens,
                total_tokens:
                    response.usage.promptTokens +
                    response.usage.completionTokens,
            },
            metadata: {
                stop_reason: response.finishReason,
            },
        };
    }

    /**
     * Gets the default model identifier
     */
    private getDefaultModel(): string {
        return "openai/gpt-4-turbo-preview";
    }

    /**
     * Determines if an error should trigger a retry
     */
    private shouldRetry(error: Error, attempt: number): boolean {
        if (attempt >= this.config.maxRetries) return false;

        if (error.name === "AbortError") return true;
        if (error.message.includes("rate limit")) return true;
        if (error.message.includes("timeout")) return true;
        if (error.message.includes("5")) return true;

        return false;
    }

    /**
     * Calculates exponential backoff with jitter for retries
     */
    private calculateBackoff(attempt: number): number {
        const exponentialDelay =
            this.config.baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        return Math.min(exponentialDelay + jitter, this.config.maxDelay);
    }

    /**
     * Enhances an error with additional context
     */
    private enhanceError(error: Error): Error {
        const enhancedError = new Error(
            `LLM Error (${this.config.model}): ${error.message}`
        );
        (enhancedError as any).cause = error;
        return enhancedError;
    }

    /**
     * Analyzes text using the LLM with optional structured output
     * @param prompt - Input text to analyze
     * @param options - Analysis configuration options
     * @returns Promise resolving to analysis result
     */
    async analyze(
        prompt: string,
        options: AnalysisOptions = {},
        filesAndImages?: Array<ImagePart | FilePart>
    ): Promise<string | StructuredAnalysis> {
        await this.throttle();

        const {
            temperature = this.config.temperature,
            maxTokens = this.config.maxTokens,
            formatResponse = false,
        } = options;

        const modelId = this.getModelIdentifier();
        const model = this.getProviderModel(this.provider, modelId);

        // Initialize messages array with system and user messages
        const messages: CoreMessage[] = [
            {
                role: "system",
                content: "Provide response in JSON format.",
            },
        ];

        // If files/images are provided, add them before the prompt
        if (filesAndImages?.length) {
            messages.push({
                role: "user",
                content: filesAndImages,
            });
        }

        messages.push({
            role: "user",
            content: prompt,
        });

        let response = await generateText({
            model,
            temperature,
            messages,
            maxTokens,
        });

        this.emit("trace:tokens", {
            input: response?.usage.promptTokens,
            output: response?.usage.completionTokens,
        });

        const result = response?.text;

        if (formatResponse && result) {
            try {
                return JSON.parse(result) as StructuredAnalysis;
            } catch (e) {
                console.warn(
                    "Failed to parse structured response, returning raw text"
                );
                return result;
            }
        }

        return result;
    }

    private async throttle() {
        let diff = Date.now() - this.lastRunAt;

        if (diff < this.config.throttleInterval) {
            await setTimeout(this.config.throttleInterval - diff);
        }

        this.lastRunAt = Date.now();
    }
}
