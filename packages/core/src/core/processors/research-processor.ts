import { LLMClient } from "../llm-client";
import type { ActionIOHandler, Character, OutputIOHandler } from "../types";
import { LogLevel } from "../types";
import { getTimeContext, validateLLMResponseSchema } from "../utils";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { BaseProcessor } from "../processor";
import { encodingForModel } from "js-tiktoken";

/**
 * Example Research/Quant Processor
 *
 * Responsibilities:
 * 1. Scrape or read inbound content and attempt to extract relevant data for research
 * 2. Summarize and rank key insights
 * 3. (Optionally) produce embeddings or structured data suitable for a vector DB
 * 4. Suggest next steps or tasks (e.g., writing to a vector store, scheduling a scrape, etc.)
 */
export class ResearchQuantProcessor extends BaseProcessor {
    constructor(
        protected llmClient: LLMClient,
        protected character: Character,
        logLevel: LogLevel = LogLevel.ERROR,
        protected contentLimit: number = 1000,
        protected tokenLimit: number = 100000
    ) {
        super(
            {
                name: "research-quant",
                description:
                    "This processor handles scraping, summarizing, ranking, and storing data for research or quantitative tasks.",
            },
            logLevel,
            character,
            llmClient
        );
    }

    /**
     * Logic to decide if this processor can handle the given content.
     * This processor is designed to handle longer-form content like datasets and scraped data.
     */
    public canHandle(content: any): boolean {
        // Convert content to string for length check
        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        const encoding = encodingForModel("gpt-4o");
        const tokens = encoding.encode(contentStr);
        const tokenCount = tokens.length;

        return (
            tokenCount > this.contentLimit ||
            (typeof content === "object" && content !== null) ||
            contentStr.includes("[") ||
            contentStr.includes("{")
        );
    }

    /**
     * Splits content into manageable chunks while trying to maintain context
     */
    private splitContent(content: string): string[] {
        const chunks: string[] = [];
        let currentChunk = "";
        const encoding = encodingForModel("gpt-4");

        // Split by paragraphs or newlines first
        const paragraphs = content.split(/\n\n|\r\n\r\n/);

        for (const paragraph of paragraphs) {
            const combinedChunkTokens = encoding.encode(
                currentChunk + (currentChunk ? "\n\n" : "") + paragraph
            );

            if (combinedChunkTokens.length <= this.tokenLimit) {
                currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                // If a single paragraph exceeds token limit, we need to split it
                if (encoding.encode(paragraph).length > this.tokenLimit) {
                    const words = paragraph.split(" ");
                    currentChunk = "";
                    let tempChunk = "";

                    for (const word of words) {
                        const nextChunk =
                            tempChunk + (tempChunk ? " " : "") + word;
                        if (
                            encoding.encode(nextChunk).length <= this.tokenLimit
                        ) {
                            tempChunk = nextChunk;
                        } else {
                            if (tempChunk) {
                                chunks.push(tempChunk);
                            }
                            tempChunk = word;
                        }
                    }
                    if (tempChunk) {
                        currentChunk = tempChunk;
                    }
                } else {
                    currentChunk = paragraph;
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    /**
     * Process a single chunk of content (renamed from the original process method)
     */
    private async processChunk(
        content: string,
        otherContext: string
    ): Promise<any> {
        this.logger.debug(
            "ResearchQuantProcessor.process",
            "Processing chunk",
            {
                contentLength: content.length,
            }
        );

        const prompt = `
        Analyze this content chunk and extract the key information in a compressed format.
        Focus on extracting and summarizing the raw data - later steps will handle analysis and recommendations.
        
        # Content chunk to process:
        ${content}

        # Context:
        ${otherContext}

        Focus on:
        1. Key facts and data points
        2. Important quotes or references
        3. Numerical data or statistics
        4. Entity mentions (people, organizations, etc.)
        5. Main topics or themes
        
        Be concise and factual in your extraction. Avoid interpretations or recommendations at this stage.
        `;

        const chunkSchema = z.object({
            extractedData: z.object({
                facts: z.array(z.string()),
                quotes: z.array(z.string()),
                numericalData: z.array(z.string()),
                entities: z.array(z.string()),
                topics: z.array(z.string()),
            }),
            rawSummary: z
                .string()
                .describe("Brief factual summary of the chunk content"),
        });

        try {
            const result = await validateLLMResponseSchema({
                prompt,
                systemPrompt:
                    "You are a precise data extraction system. Focus on pulling out key information in a structured format.",
                schema: chunkSchema,
                llmClient: this.llmClient,
                logger: this.logger,
            });

            return {
                content,
                extractedData: result.extractedData,
                rawSummary: result.rawSummary,
            };
        } catch (error) {
            this.logger.error(
                "ResearchQuantProcessor.processChunk",
                "Chunk processing failed",
                { error }
            );
            return {
                content,
                extractedData: {
                    facts: [],
                    quotes: [],
                    numericalData: [],
                    entities: [],
                    topics: [],
                },
                rawSummary: content.slice(0, 200),
            };
        }
    }

    private buildHandlerSchemaPart(
        handlers?: OutputIOHandler[] | ActionIOHandler[]
    ): string {
        if (!handlers || handlers.length === 0) return "None";
        return handlers
            .filter((handler) => handler.outputSchema)
            .map(
                (handler) =>
                    `${handler.name}: ${JSON.stringify(
                        zodToJsonSchema(handler.outputSchema!, handler.name),
                        null,
                        2
                    )}`
            )
            .join("\n");
    }

    private async combineChunkResults(
        results: any[],
        ioContext?: {
            availableOutputs: OutputIOHandler[];
            availableActions: ActionIOHandler[];
        }
    ): Promise<any> {
        const prompt = `
        Analyze and synthesize these separate content analyses into a comprehensive research summary and action plan.
        
        # Extracted Data from All Chunks:
        ${results
            .map(
                (r, i) => `
        Chunk ${i + 1}:
        Summary: ${r.rawSummary}
        Key Facts: ${r.extractedData.facts.join("; ")}
        Numerical Data: ${r.extractedData.numericalData.join("; ")}
        Key Entities: ${r.extractedData.entities.join(", ")}
        Main Topics: ${r.extractedData.topics.join(", ")}
        `
            )
            .join("\n\n")}


        # Available Actions:
        ${this.buildHandlerSchemaPart(ioContext?.availableActions)}

        # Available Outputs:
        ${this.buildHandlerSchemaPart(ioContext?.availableOutputs)}

        <thinking id="research_analysis">
        1. Identify patterns and connections across all chunks
        2. Synthesize the most important insights
        3. Evaluate the overall significance of the findings
        4. Identify any gaps or areas needing further research
        </thinking>

        <thinking id="metadata_extraction">
        1. Consider how this data could be structured for a vector DB
        2. Identify key metadata for classification
        3. Evaluate data quality and completeness
        </thinking>

        <thinking id="action_planning">
        1. What are the most important next steps based on this analysis?
        2. What additional research or data collection might be needed?
        3. How should this information be stored or used?
        </thinking>
        `;

        const combinedSchema = z.object({
            synthesis: z.object({
                overallSummary: z.string(),
                keyInsights: z.array(
                    z.object({
                        insight: z.string(),
                        confidence: z.number().min(0).max(1),
                        supportingEvidence: z.array(z.string()),
                    })
                ),
                patterns: z.array(z.string()),
                gaps: z.array(z.string()),
            }),
            recommendations: z.array(
                z.object({
                    action: z.string(),
                    priority: z.enum(["high", "medium", "low"]),
                    reasoning: z.string(),
                })
            ),
            metadata: z.object({
                primaryTopics: z.array(z.string()),
                keyEntities: z.array(z.string()),
                dataQuality: z.number().min(0).max(1),
                suggestedTags: z.array(z.string()),
            }),
        });

        const finalAnalysis = await validateLLMResponseSchema({
            prompt,
            systemPrompt:
                "You are an expert research analyst synthesizing multiple data extracts into actionable insights.",
            schema: combinedSchema,
            llmClient: this.llmClient,
            logger: this.logger,
        });

        return {
            content: results[0].content,
            metadata: finalAnalysis.metadata,
            enrichedContext: {
                summary: finalAnalysis.synthesis.overallSummary,
                keyInsights: finalAnalysis.synthesis.keyInsights,
                patterns: finalAnalysis.synthesis.patterns,
                gaps: finalAnalysis.synthesis.gaps,
                timeContext: getTimeContext(new Date()),
            },
            recommendations: finalAnalysis.recommendations,
            alreadyProcessed: false,
        };
    }

    async process(
        content: any,
        otherContext: string,
        ioContext?: {
            availableOutputs: OutputIOHandler[];
            availableActions: ActionIOHandler[];
        }
    ): Promise<any> {
        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        // If content is within limit, process normally
        if (contentStr.length <= this.contentLimit) {
            return await this.processChunk(contentStr, otherContext);
        }

        // Split content into chunks
        const chunks = this.splitContent(contentStr);
        this.logger.debug(
            "ResearchQuantProcessor.process",
            "Processing in chunks",
            {
                numberOfChunks: chunks.length,
            }
        );

        // Process each chunk
        const chunkResults = await Promise.all(
            chunks.map(async (chunk, index) => {
                const chunkContext = `${otherContext}\n(This is part ${index + 1} of ${chunks.length})`;
                return await this.processChunk(chunk, chunkContext);
            })
        );

        // Combine results
        return await this.combineChunkResults(chunkResults, ioContext);
    }
}
