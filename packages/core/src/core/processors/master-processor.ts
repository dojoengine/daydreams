import { LLMClient } from "../llm-client";

import type {
    ActionIOHandler,
    Character,
    OutputIOHandler,
    ProcessableContent,
    ProcessedResult,
    SuggestedOutput,
} from "../types";

import { getTimeContext, validateLLMResponseSchema } from "../utils";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { BaseProcessor } from "../processor";
import { LogLevel } from "../types";

export class MasterProcessor extends BaseProcessor {
    constructor(
        protected llmClient: LLMClient,
        protected character: Character,
        logLevel: LogLevel = LogLevel.ERROR
    ) {
        super(
            {
                name: "master",
                description:
                    "This processor handles messages or short text inputs.",
            },
            logLevel,
            character,
            llmClient
        );
    }

    /**
     * Logic to decide if this processor can handle the given content.
     * This processor is designed to handle shorter messages and text content.
     */
    public canHandle(content: any): boolean {
        // Convert content to string for length check
        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        // Check if content is short enough for message processing (<1000 chars)
        return contentStr.length < this.contentLimit;
    }

    async process(
        content: ProcessableContent,
        otherContext: string,
        ioContext?: {
            availableOutputs: OutputIOHandler[];
            availableActions: ActionIOHandler[];
        }
    ): Promise<ProcessedResult> {
        this.logger.debug("Processor.process", "Processing content", {
            content,
        });

        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        // Add child processors context
        const processorContext = Array.from(this.processors.entries())
            .map(([name, processor]) => {
                return `${name}: ${processor.getDescription()}`;
            })
            .join("\n");

        const outputsSchemaPart = ioContext?.availableOutputs
            .map((handler) => {
                return `${handler.name}: ${JSON.stringify(zodToJsonSchema(handler.outputSchema!, handler.name))}`;
            })
            .join("\n");

        const actionsSchemaPart = ioContext?.availableActions
            .map((handler) => {
                return `${handler.name}: ${JSON.stringify(zodToJsonSchema(handler.outputSchema!, handler.name))}`;
            })
            .join("\n");

        const prompt = `You are a master processor that can delegate to child processors. Decide on what do to with the following content:

        # New Content to process: 
        ${contentStr}

        # Other context:
        ${otherContext}

        # Available Child Processors:
        ${processorContext}

        # Available Outputs:
        ${outputsSchemaPart}

        # Available Actions:
        ${actionsSchemaPart}

        <thinking id="processor_decision">
        1. Decide on what do to with the content. If you an output or action is suggested, you should use it.
        2. If you can't decide, delegate to a child processor or just return.
        </thinking>

        <thinking id="content_classification">
        1. Content classification and type
        2. Content enrichment (summary, topics, sentiment, entities, intent)
        3. Determine if any child processors should handle this content
        </thinking>

        <thinking id="output_suggestion">
        1. Suggested outputs/actions based on the available handlers based on the content and the available handlers. 
        2. If the content is a message, use the personality of the character to determine if the output was successful.
        3. If possible you should include summary of the content in the output for the user to avoid more processing.
        </thinking>
`;

        try {
            const result = await validateLLMResponseSchema({
                prompt,
                systemPrompt:
                    "You are an expert system that analyzes content and provides comprehensive analysis with appropriate automated responses. You can delegate to specialized processors when needed.",
                schema: z.object({
                    classification: z.object({
                        contentType: z.string(),
                        requiresProcessing: z.boolean(),
                        delegateToProcessor: z
                            .string()
                            .optional()
                            .describe(
                                "The name of the processor to delegate to"
                            ),
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

            this.logger.debug("MasterProcessor.process", "Result", {
                result,
            });

            // Check if we should delegate to a child processor
            // @dev maybe this should be elsewhere
            if (result.classification.delegateToProcessor) {
                const childProcessor = this.getProcessor(
                    result.classification.delegateToProcessor
                );
                if (childProcessor && childProcessor.canHandle(content)) {
                    this.logger.debug(
                        "Processor.process",
                        "Delegating to child processor",
                        {
                            processor:
                                result.classification.delegateToProcessor,
                        }
                    );
                    return childProcessor.process(
                        content,
                        otherContext,
                        ioContext
                    );
                }
            }

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
