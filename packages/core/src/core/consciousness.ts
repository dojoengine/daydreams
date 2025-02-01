import { Logger } from "./logger";
import { LLMClient } from "./llm-client";
import { Conversation } from "./conversation";
import { ConversationManager } from "./conversation-manager";
import { LogLevel, type Thought } from "./types";
import { validateLLMResponseSchema } from "./utils";
import { z } from "zod";

export class Consciousness {
    private static readonly CONVERSATION_ID = "consciousness_main";

    private logger: Logger;
    private thoughtInterval: NodeJS.Timer | null = null;

    constructor(
        private llmClient: LLMClient,
        private conversationManager: ConversationManager,
        private config: {
            intervalMs?: number;
            minConfidence?: number;
            logLevel?: LogLevel;
        } = {}
    ) {
        this.logger = new Logger({
            level: config.logLevel || LogLevel.INFO,
            enableColors: true,
            enableTimestamp: true,
        });
    }

    public async start(): Promise<Thought> {
        return this.think();
    }

    public async stop(): Promise<void> {
        if (this.thoughtInterval) {
            clearTimeout(this.thoughtInterval as any);
            this.thoughtInterval = null;
        }
        this.logger.info(
            "Consciousness.stop",
            "Internal thought process stopped"
        );
    }

    private async think(): Promise<Thought> {
        try {
            const thought = await this.generateThought();

            if (thought.confidence >= (this.config.minConfidence || 0.7)) {
                return {
                    type: "internal_thought",
                    source: "consciousness",
                    content: thought.content,
                    timestamp: thought.timestamp,
                    confidence: thought.confidence,
                    metadata: {
                        ...thought.context,
                        confidence: thought.confidence,
                        suggestedActions:
                            thought.context?.suggestedActions || [],
                        conversationId: Consciousness.CONVERSATION_ID,
                    },
                };
            } else {
                this.logger.debug(
                    "Consciousness.think",
                    "Thought below confidence threshold",
                    {
                        confidence: thought.confidence,
                        threshold: this.config.minConfidence,
                    }
                );
                // Return a default thought object when confidence is too low
                return {
                    type: "low_confidence",
                    source: "consciousness",
                    content: "Thought was below confidence threshold",
                    timestamp: new Date(),
                    confidence: thought.confidence,
                    metadata: {
                        confidence: thought.confidence,
                        threshold: this.config.minConfidence || 0.7,
                    },
                };
            }
        } catch (error) {
            this.logger.error(
                "Consciousness.think",
                "Error in thought process",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            // Return error thought object
            return {
                type: "error",
                source: "consciousness",
                content: "Error occurred during thought process",
                timestamp: new Date(),
                confidence: 0,
                metadata: {
                    error:
                        error instanceof Error ? error.message : String(error),
                },
            };
        }
    }

    private async generateThought(): Promise<Thought> {
        const recentMemories = this.getRecentMemories(
            await this.conversationManager.listConversations()
        );

        const prompt = `Analyze these recent memories and generate an insightful thought.

    # Recent memories
    ${recentMemories.map((m) => `- ${m.content}`).join("\n")}

    <thinking id="thought_types">
    1. social_share: For generating engaging social media content, observations, or insights worth sharing
    2. research: For identifying topics that need deeper investigation or understanding
    3. analysis: For recognizing patterns, trends, or correlations in data/behavior
    </thinking>

    <thinking id="thought_context">
    - Patterns or trends in the conversations
    - Knowledge gaps that need research
    - Interesting insights worth sharing
    - Complex topics needing analysis
    </thinking>
`;

        const response = await validateLLMResponseSchema({
            prompt,
            systemPrompt: `You are a thoughtful AI assistant that analyzes recent memories and generates meaningful insights. Your role is to:

      1. Carefully evaluate the provided memories and identify key patterns, trends and relationships
      2. Generate relevant thoughts that demonstrate understanding of context and nuance
      3. Assess confidence based on evidence quality and reasoning strength
      4. Consider multiple perspectives and potential implications
      5. Focus on actionable insights that could drive meaningful outcomes

      Base your thoughts on the concrete evidence in the memories while maintaining appropriate epistemic uncertainty.

    .`,
            schema: z.object({
                thoughtType: z.enum([
                    "trade", // new: actually place a trade
                    "notify_owner", // new: send a notification
                    "research_query",
                    "data_analysis",
                    "expert_consult",
                    "alert",
                    "report",
                    "action_recommendation",
                    "social_share",
                ]),
                thought: z.string(),
                confidence: z.number(),
                reasoning: z.string(),
                context: z.object({
                    mood: z.enum([
                        "contemplative",
                        "playful",
                        "analytical",
                        "curious",
                        "skeptical",
                        "excited",
                        "concerned",
                        "neutral",
                        "optimistic",
                        "cautious",
                    ]),
                    platform: z.enum(["twitter", "telegram", "discord"]),
                    topics: z.array(z.string()),
                    urgency: z.enum(["low", "medium", "high"]).optional(),
                    domain: z
                        .enum(["tech", "finance", "science", "other"])
                        .optional(),
                    currentKnowledge: z.string().optional(),
                    dataPoints: z.array(z.any()).optional(),
                    timeframe: z.string().optional(),
                    reliability: z.enum(["low", "medium", "high"]).optional(),
                }),
                suggestedActions: z.array(
                    z.object({
                        type: z.enum([
                            "tweet",
                            "message",
                            "post",
                            "research_query",
                            "data_analysis",
                            "expert_consult",
                            "alert",
                            "report",
                            "action_recommendation",
                        ]),
                        platform: z.string().optional(),
                        priority: z.number(),
                        parameters: z.object({
                            sources: z.array(z.string()).optional(),
                            timeframe: z.string().optional(),
                            specific_questions: z.array(z.string()).optional(),
                            metrics: z.record(z.any()).optional(),
                            recommendations: z.array(z.string()).optional(),
                        }),
                    })
                ),
            }),
            llmClient: this.llmClient,
            logger: this.logger,
        });

        return {
            content: response.thought,
            confidence: response.confidence,
            type: response.thoughtType,
            source: "consciousness",
            context: {
                reasoning: response.reasoning,
                ...response.context,
                type: response.thoughtType,
                suggestedActions: response.suggestedActions,
            },
            timestamp: new Date(),
        };
    }

    private getRecentMemories(
        conversations: Conversation[],
        limit: number = 10
    ): Array<{ content: string; conversationId: string }> {
        const allMemories: Array<{
            content: string;
            conversationId: string;
            timestamp: Date;
        }> = [];

        for (const conversation of conversations) {
            const memories = conversation.getMemories(5); // Get last 5 memories from each conversation
            allMemories.push(
                ...memories.map((m) => ({
                    content: m.content,
                    conversationId: conversation.id,
                    timestamp: m.timestamp,
                }))
            );
        }

        // Sort by timestamp and take the most recent ones
        return allMemories
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit)
            .map(({ content, conversationId }) => ({
                content,
                conversationId,
            }));
    }
}
