import Anthropic from "@anthropic-ai/sdk";
import { setTimeout } from "timers/promises";
import { env } from "./env";
import { Logger } from "./logger";
export interface LLMResponse {
  text: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface LLMClientConfig {
  provider: "anthropic";
  model?: string;
  maxRetries?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseDelay?: number;
  maxDelay?: number;
  minTimeBetweenRequestsMs?: number;
}

interface AnalysisOptions {
  system?: string;
  role?: string;
  temperature?: number;
  maxTokens?: number;
  formatResponse?: boolean;
}

interface StructuredAnalysis {
  summary: string;
  reasoning: string;
  conclusion: string;
  confidenceLevel: number;
  caveats: string[];
}

export class LLMClient {
  private anthropic?: Anthropic;
  private readonly config: Required<LLMClientConfig>;
  private lastRequestTimestamp = 0;
  private logger: Logger;
  constructor(config: LLMClientConfig, logger?: Logger) {
    // If no logger passed, create a default
    this.logger = logger || new Logger({ level: 3, enableTimestamp: true });
    this.config = {
      provider: config.provider,
      model: config.model || this.getDefaultModel(config.provider),
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1000,
      apiKey: config.apiKey || this.getApiKeyFromEnv(config.provider),
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 10000,
      // Pull from config if set, otherwise from env if not explicitly provided:
      minTimeBetweenRequestsMs:
        typeof config.minTimeBetweenRequestsMs === "number"
          ? config.minTimeBetweenRequestsMs
          : env.ANTHROPIC_MIN_DELAY_MS, // fallback to env value
    };

    this.initializeClient();
  }

  private initializeClient(): void {
    this.anthropic = new Anthropic({
      apiKey: this.config.apiKey,
    });
  }

  // obfuscate the API key when logging
  toJSON() {
    let maskedApiKey = this.config.apiKey.slice(0, 7) + "*".repeat(3);

    return {
      ...this,
      config: {
        ...this.config,
        apiKey: maskedApiKey,
      },
      anthropic: this.anthropic && {
        ...this.anthropic,
        apiKey: maskedApiKey,
        _options: {
          // @ts-ignore
          ...this.anthropic._options,
          apiKey: maskedApiKey,
        },
      },
    };
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toJSON();
  }

  public async complete(prompt: string): Promise<LLMResponse> {
    // Enforce a minimum delay between requests if configured
    await this.enforceMinDelay();

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeCompletion(prompt);
        this.lastRequestTimestamp = Date.now();
        return result;
      } catch (error) {
        lastError = error as Error;
        if (this.shouldRetry(lastError, attempt)) {
          const delay = this.calculateBackoff(attempt);
          await setTimeout(delay);
          continue;
        }
        throw this.enhanceError(lastError);
      }
    }
    throw this.enhanceError(lastError!);
  }

  private async enforceMinDelay(): Promise<void> {
    if (this.config.minTimeBetweenRequestsMs > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequestTimestamp;
      const remaining = this.config.minTimeBetweenRequestsMs - elapsed;
      if (remaining > 0) {
        this.logger.debug(
          "LLMClient.enforceMinDelay",
          `Waiting ${remaining} ms to respect minTimeBetweenRequestsMs`,
          {
            lastRequestTimestamp: this.lastRequestTimestamp,
            now,
          }
        );
        await setTimeout(remaining);
      }
    }
  }

  public getModelName(): string {
    return this.config.model;
  }

  public getModelVersion(): string {
    const versionMatch = this.config.model.match(/\d+(\.\d+)*/);
    return versionMatch ? versionMatch[0] : "unknown";
  }

  private async executeCompletion(prompt: string): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.config.timeout,
    );

    try {
      return await this.executeAnthropicCompletion(prompt, controller.signal);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeAnthropicCompletion(
    prompt: string,
    signal: AbortSignal
  ): Promise<LLMResponse> {
    if (!this.anthropic) throw new Error("Anthropic client not initialized");

    const response = await this.anthropic.messages.create(
      {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    );

    return {
      text: response.content[0].type === "text" ? response.content[0].text : "",
      model: this.config.model,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens +
          response.usage.output_tokens,
      },
      metadata: {
        stop_reason: response.stop_reason,
      },
    };
  }

  private getDefaultModel(provider: string): string {
    return "claude-3-5-haiku-20241022";
  }

  private getApiKeyFromEnv(provider: string): string {
    if (provider === "anthropic") {
      return env.ANTHROPIC_API_KEY;
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false;

    // Retry on rate limits, timeouts, and temporary server errors
    if (error.name === "AbortError") return true;
    if (error.message.includes("rate limit")) return true;
    if (error.message.includes("timeout")) return true;
    if (error.message.includes("5")) return true; // 5xx errors

    return false;
  }

  private calculateBackoff(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, this.config.maxDelay);
  }

  private enhanceError(error: Error): Error {
    const enhancedError = new Error(
      `LLM Error (${this.config.provider}): ${error.message}`
    );
    enhancedError.cause = error;
    return enhancedError;
  }

  async analyze(
    prompt: string,
    options: AnalysisOptions = {}
  ): Promise<string | StructuredAnalysis> {
    const {
      system,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
      formatResponse = false,
    } = options;

    const response = await this.anthropic?.messages.create({
      model: this.config.model,
      system: system || "",
      messages: [
        {
          role: "user",
          content: formatResponse
            ? prompt + "\n\nProvide response in JSON format."
            : prompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const result =
      response?.content[0]?.type === "text" ? response.content[0].text : "";

    if (formatResponse && result) {
      try {
        return JSON.parse(result) as StructuredAnalysis;
      } catch (e) {
        console.warn("Failed to parse structured response, returning raw text");
        return result;
      }
    }

    return result;
  }
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(provider: string, timeoutMs: number) {
    super(`LLM request timed out after ${timeoutMs}ms`, provider);
    this.name = "LLMTimeoutError";
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: string, retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}s` : ""}`,
      provider
    );
    this.name = "LLMRateLimitError";
  }
}
