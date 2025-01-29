import { LLMClient } from "../llm-client";

import type { Character, ProcessedResult, SuggestedOutput } from "../types";
import { LogLevel } from "../types";

import { getTimeContext, validateLLMResponseSchema } from "../utils";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { type IOHandler } from "../types";
import { BaseProcessor } from "../processor";

export class MessageProcessor extends BaseProcessor {
    constructor(
        protected llmClient: LLMClient,
        protected character: Character,
        logLevel: LogLevel = LogLevel.ERROR
    ) {
        super(
            {
                name: "message",
                description:
                    "This processor handles messages or short text inputs.",
            },
            logLevel,
            character,
            llmClient
        );
    }

    // TODO: fix this
    public canHandle(content: any): boolean {
        return true;
    }

    async process(
        content: any,
        otherContext: string,
        ioContext?: {
            availableOutputs: IOHandler[];
            availableActions: IOHandler[];
        }
    ): Promise<ProcessedResult> {
        this.logger.debug("Processor.process", "Processing content", {
            content,
        });

        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        const outputsSchemaPart = ioContext?.availableOutputs
            .map((handler) => {
                return `${handler.name}: ${JSON.stringify(zodToJsonSchema(handler.schema, handler.name))}`;
            })
            .join("\n");

        const actionsSchemaPart = ioContext?.availableActions
            .map((handler) => {
                return `${handler.name}: ${JSON.stringify(zodToJsonSchema(handler.schema, handler.name))}`;
            })
            .join("\n");

        const prompt = `Analyze the following content and provide a complete analysis:

        # New Content to process:
        ${contentStr}

        # Other context:
        ${otherContext}

        # Available Outputs:
        ${outputsSchemaPart}

        # Available Actions:
        ${actionsSchemaPart}

        <thinking id="content_classification">
        1. Content classification and type
        2. Content enrichment (summary, topics, sentiment, entities, intent)
        </thinking>

        <thinking id="output_suggestion">
        1. Suggested outputs/actions based on the available handlers based on the content and the available handlers.
        2. If the content is a message, use the personality of the character to determine if the output was successful.
        3. If possible you should include summary of the content in the output for the user to avoid more processing.
        </thinking>

        <thinking id="task_suggestion">
        1. Suggested tasks based on the available handlers based on the content and the available handlers.
        2. Only make tasks if you have been told, based off what you think is possible.
        </thinking>

        <thinking id="message_personality">
        # Speak in the following voice:
        ${JSON.stringify(this.character.voice)}

        # Use the following traits to define your behavior:
        ${JSON.stringify(this.character.traits)}

        # Use the following examples to guide your behavior:
        ${JSON.stringify(this.character.instructions)}

        # Use the following template to craft your message:
        ${JSON.stringify(this.character.templates?.tweetTemplate)}
        </thinking>
`;

        try {
            const result = await validateLLMResponseSchema({
                prompt,
                systemPrompt:
                    "You are an expert system that analyzes content and provides comprehensive analysis with appropriate automated responses.",
                schema: z.object({
                    classification: z.object({
                        contentType: z.string(),
                        requiresProcessing: z.boolean(),
                        context: z.object({
                            topic: z.string(),
                            urgency: z.enum(["high", "medium", "low"]),
                            additionalContext: z.string(),
                        }),
                    }),
                    enrichment: z.object({
                        summary: z.string().max(1000),
                        topics: z.array(z.string()).max(20),
                        sentiment: z.enum(["positive", "negative", "neutral"]),
                        entities: z.array(z.string()),
                        intent: z
                            .string()
                            .describe("The intent of the content"),
                    }),
                    updateTasks: z
                        .array(
                            z.object({
                                name: z
                                    .string()
                                    .describe(
                                        "The name of the task to schedule. This should be a handler name."
                                    ),
                                confidence: z
                                    .number()
                                    .describe("The confidence score (0-1)"),
                                intervalMs: z
                                    .number()
                                    .describe("The interval in milliseconds"),
                                data: z
                                    .any()
                                    .describe(
                                        "The data that matches the task's schema"
                                    ),
                            })
                        )
                        .describe(
                            "Suggested tasks to schedule based on the content and the available handlers. Making this will mean the handlers will be called in the future."
                        ),
                    suggestedOutputs: z.array(
                        z.object({
                            name: z
                                .string()
                                .describe("The name of the output or action"),
                            data: z
                                .any()
                                .describe(
                                    "The data that matches the output's schema. leave empty if you don't have any data to provide."
                                ),
                            confidence: z
                                .number()
                                .describe("The confidence score (0-1)"),
                            reasoning: z
                                .string()
                                .describe("The reasoning for the suggestion"),
                        })
                    ),
                }),
                llmClient: this.llmClient,
                logger: this.logger,
            });

            this.logger.debug("Processor.process", "Processed content", {
                content,
                result,
            });

            return {
                content,
                metadata: {
                    ...result.classification.context,
                    contentType: result.classification.contentType,
                },
                enrichedContext: {
                    ...result.enrichment,
                    timeContext: getTimeContext(new Date()),
                    relatedMemories: [], // TODO: fix this abstraction
                    availableOutputs: ioContext?.availableOutputs.map(
                        (handler) => handler.name
                    ),
                },
                updateTasks: result.updateTasks,
                suggestedOutputs:
                    result.suggestedOutputs as SuggestedOutput<any>[],
                alreadyProcessed: false,
            };
        } catch (error) {
            this.logger.error("Processor.process", "Processing failed", {
                error,
            });
            return {
                content,
                metadata: {},
                enrichedContext: {
                    timeContext: getTimeContext(new Date()),
                    summary: contentStr.slice(0, 100),
                    topics: [],
                    relatedMemories: [],
                    sentiment: "neutral",
                    entities: [],
                    intent: "unknown",
                    availableOutputs: ioContext?.availableOutputs.map(
                        (handler) => handler.name
                    ),
                },
                suggestedOutputs: [],
                alreadyProcessed: false,
            };
        }
    }
}
