import type { z } from "zod";
import type { LLMClient } from "../../core/llm-client";
import type { Logger } from "../../core/logger";
import type { FilePart, ImagePart } from "ai";

/**
 * ChainOfThoughtContext can hold any relevant data
 * the LLM or game might need to keep track of during reasoning.
 */
export interface ChainOfThoughtContext {
    // For example, a game state might have player info, world state, etc.
    worldState: string;
    actionHistory?: Record<
        number,
        {
            action: CoTAction;
            result: string;
        }
    >;
    pastExperiences?: EpisodicMemory[];
    relevantKnowledge?: Documentation[];
}

/**
 * Data necessary for a particular action type.
 * Extend this to fit your actual logic.
 */
export interface CoTAction {
    type: string;
    context: string;
    payload: Record<string, any>;
}

export interface LLMStructuredResponse {
    plan?: string;
    meta?: {
        requirements?: {
            resources?: Record<string, number>;
            population?: number;
        };
    };
    actions: CoTAction[];
}

export interface SearchResult {
    id: string;
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
}

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

export interface LoggerConfig {
    level: LogLevel;
    enableTimestamp?: boolean;
    enableColors?: boolean;
    logToFile?: boolean;
    logPath?: string;
}

export interface LogEntry {
    level: LogLevel;
    timestamp: Date;
    context: string;
    message: string;
    data?: any;
}

export type StepType = "action" | "planning" | "system" | "task";

export interface BaseStep {
    id: string;
    type: StepType;
    content: string;
    timestamp: number;
    tags?: string[];
    meta?: Record<string, any>;
}

export interface ActionStep extends BaseStep {
    type: "action";
    content: string;
    toolCall?: {
        name: string;
        arguments: any;
        id: string;
    };
    error?: Error;
    observations?: string;
    actionOutput?: any;
    duration?: number;
}

export interface PlanningStep extends BaseStep {
    type: "planning";
    plan: string;
    facts: string;
}

export interface SystemStep extends BaseStep {
    type: "system";
    systemPrompt: string;
}

export interface TaskStep extends BaseStep {
    type: "task";
    task: string;
}

export type Step = ActionStep | PlanningStep | SystemStep | TaskStep;

export type HorizonType = "long" | "medium" | "short";
export type GoalStatus =
    | "pending"
    | "active"
    | "completed"
    | "failed"
    | "ready"
    | "blocked";

// Add new interfaces for goal management
export interface Goal {
    id: string;
    horizon: HorizonType;
    description: string;
    status: GoalStatus;
    priority: number;
    dependencies?: string[]; // IDs of goals that must be completed first
    subgoals?: string[]; // IDs of child goals
    parentGoal?: string; // ID of parent goal
    success_criteria: string[];
    created_at: number;
    completed_at?: number;
    progress?: number; // 0-100 to track partial completion
    meta?: Record<string, any>;

    /**
     * A numeric measure of how successful this goal was completed.
     * You can define any scale you like: e.g. 0-1, or 0-100, or a positive/negative integer.
     */
    outcomeScore?: number;

    /**
     * Optional history of scores over time, if you want to track multiple attempts or partial runs.
     */
    scoreHistory?: Array<{
        timestamp: number;
        score: number;
        comment?: string;
    }>;
}

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
    model?: string;
    maxRetries?: number;
    timeout?: number;
    temperature?: number;
    maxTokens?: number;
    baseDelay?: number;
    maxDelay?: number;
    throttleInterval?: number;
}

export interface AnalysisOptions {
    system?: string;
    role?: string;
    temperature?: number;
    maxTokens?: number;
    formatResponse?: boolean;
}

export interface StructuredAnalysis {
    summary: string;
    reasoning: string;
    conclusion: string;
    confidenceLevel: number;
    caveats: string[];
}

// Add type definitions for the events
export interface ChainOfThoughtEvents {
    step: (step: Step) => void;
    "action:start": (action: CoTAction) => void;
    "action:complete": (data: { action: CoTAction; result: string }) => void;
    "action:error": (data: {
        action: CoTAction;
        error: Error | unknown;
    }) => void;
    "think:start": (data: { query: string }) => void;
    "think:complete": (data: { query: string }) => void;
    "think:timeout": (data: { query: string }) => void;
    "think:error": (data: { query: string; error: Error | unknown }) => void;
    "goal:created": (goal: { id: string; description: string }) => void;
    "goal:updated": (goal: { id: string; status: GoalStatus }) => void;
    "goal:completed": (goal: { id: string; result: any }) => void;
    "goal:failed": (goal: { id: string; error: Error | unknown }) => void;
    "goal:started": (goal: { id: string; description: string }) => void;
    "goal:blocked": (goal: { id: string; reason: string }) => void;
    "memory:experience_stored": (data: { experience: EpisodicMemory }) => void;
    "memory:knowledge_stored": (data: { document: Documentation }) => void;
    "memory:experience_retrieved": (data: {
        experiences: EpisodicMemory[];
    }) => void;
    "memory:knowledge_retrieved": (data: {
        documents: Documentation[];
    }) => void;
    "trace:tokens": (data: { input: number; output: number }) => void;
}

export interface RefinedGoal {
    description: string;
    success_criteria: string[];
    priority: number;
    horizon: "short";
    requirements: Record<string, any>;
}

export interface LLMValidationOptions<T> {
    prompt: string;
    filesAndImages?: Array<ImagePart | FilePart>;
    systemPrompt: string;
    schema: z.ZodSchema<T>;
    maxRetries?: number;
    onRetry?: (error: Error, attempt: number) => void;
    llmClient: LLMClient;
    logger: Logger;
}

export interface CharacterTrait {
    name: string;
    description: string;
    strength: number; // 0-1, how strongly to express this trait
    examples: string[];
}

export interface CharacterVoice {
    tone: string;
    style: string;
    vocabulary: string[];
    commonPhrases: string[];
    emojis: string[];
}

export interface CharacterInstructions {
    goals: string[];
    constraints: string[];
    topics: string[];
    responseStyle: string[];
    contextRules: string[];
}

export interface Character {
    name: string;
    bio: string;
    traits: CharacterTrait[];
    voice: CharacterVoice;
    instructions: CharacterInstructions;
    // Optional custom prompt templates
    templates?: {
        tweetTemplate?: string;
        replyTemplate?: string;
        thoughtTemplate?: string;
    };
}

export interface ProcessedResult {
    content: any;
    metadata: Record<string, any>;
    enrichedContext: EnrichedContext;
    suggestedOutputs: SuggestedOutput<any>[];
    isOutputSuccess?: boolean;
    alreadyProcessed?: boolean;
    nextProcessor?: string;
    updateTasks?: {
        name: string;
        data?: any;
        confidence: number;
        intervalMs: number;
    }[];
}

export interface SuggestedOutput<T> {
    name: string;
    data: T;
    confidence: number;
    reasoning: string;
}

export interface EnrichedContext {
    timeContext: string;
    summary: string;
    topics: string[];
    relatedMemories: string[];
    sentiment?: string;
    entities?: string[];
    intent?: string;
    similarMessages?: any[];
    metadata?: Record<string, any>;
    availableOutputs?: string[]; // Names of available outputs
}

export interface EnrichedContent {
    originalContent: string;
    timestamp: Date;
    context: EnrichedContext;
}

export interface Thought {
    content: string;
    confidence: number;
    context?: Record<string, any>;
    timestamp: Date;
    type: string;
    source: string;
    metadata?: Record<string, any>;
    conversationId?: string;
}

export type ThoughtType =
    | "social_share" // For tweets, posts, etc.
    | "research" // For diving deeper into topics
    | "analysis" // For analyzing patterns or data
    | "alert" // For important notifications
    | "inquiry"; // For asking questions or seeking information

export interface ThoughtTemplate {
    type: ThoughtType;
    description: string;
    prompt: string;
    temperature: number;
}

export interface ConversationMetadata {
    name: string;
    description?: string;
    participants: string[];
    createdAt: Date;
    lastActive: Date;
    metadata?: Record<string, any>;
}

export interface Memory {
    id: string;
    conversationId: string;
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    embedding?: number[];
}

export interface VectorDB {
    findSimilar(
        content: string,
        limit?: number,
        metadata?: Record<string, any>
    ): Promise<SearchResult[]>;

    store(content: string, metadata?: Record<string, any>): Promise<void>;

    delete(id: string): Promise<void>;

    storeInConversation(
        content: string,
        conversationId: string,
        metadata?: Record<string, any>
    ): Promise<void>;

    findSimilarInConversation(
        content: string,
        conversationId: string,
        limit?: number,
        metadata?: Record<string, any>
    ): Promise<SearchResult[]>;

    storeSystemMetadata(key: string, value: Record<string, any>): Promise<void>;
    getSystemMetadata(key: string): Promise<Record<string, any> | null>;

    storeEpisode(memory: Omit<EpisodicMemory, "id">): Promise<string>;
    findSimilarEpisodes(
        action: string,
        limit?: number
    ): Promise<EpisodicMemory[]>;
    getRecentEpisodes(limit?: number): Promise<EpisodicMemory[]>;

    storeDocument(doc: Omit<Documentation, "id">): Promise<string>;
    findSimilarDocuments(
        query: string,
        limit?: number
    ): Promise<Documentation[]>;
    searchDocumentsByTag(
        tags: string[],
        limit?: number
    ): Promise<Documentation[]>;
    updateDocument(id: string, updates: Partial<Documentation>): Promise<void>;

    purge(): Promise<void>;
}

export interface EpisodicMemory {
    id: string;
    timestamp: Date;
    action: string;
    outcome: string;
    context?: Record<string, any>;
    emotions?: string[];
    importance?: number;
}

export interface Documentation {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    lastUpdated: Date;
    source?: string;
    relatedIds?: string[];
}

export interface Cluster {
    id: string;
    name: string;
    description: string;
    centroid?: number[];
    topics: string[];
    documentCount: number;
    lastUpdated: Date;
}

export interface ClusterMetadata {
    clusterId: string;
    confidence: number;
    topics: string[];
}

export interface ClusterStats {
    variance: number;
    memberCount: number;
    averageDistance: number;
}

export interface ClusterUpdate {
    newCentroid?: number[];
    documentCount: number;
    topics: string[];
    variance?: number;
}

export interface DocumentClusterMetadata extends ClusterMetadata {
    category: string;
    commonTags: string[];
}

export interface EpisodeClusterMetadata extends ClusterMetadata {
    commonEmotions: string[];
    averageImportance: number;
}

export interface HierarchicalCluster extends Cluster {
    parentId?: string;
    childIds: string[];
    level: number;
    domain: string;
    subDomain?: string;
}

export interface DomainMetadata {
    domain: string;
    subDomain?: string;
    confidence: number;
}

export interface IChain {
    /**
     * A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)
     */
    chainId: string;

    /**
     * Read (call) a contract or perform a query on this chain.
     * The `call` parameter can be chain-specific data.
     */
    read(call: unknown): Promise<any>;

    /**
     * Write (execute a transaction) on this chain, typically requiring signatures, etc.
     */
    write(call: unknown): Promise<any>;
}

export enum HandlerRole {
    INPUT = "input",
    OUTPUT = "output",
    ACTION = "action",
}

/**
 * A single interface for all Input, Output and Action handlers in the system.
 * This provides a unified way to handle different types of I/O operations.
 *
 * @example
 * ```ts
 * // Register a chat input handler
 * orchestrator.registerIOHandler({
 *   name: "user_chat",
 *   role: HandlerRole.INPUT,
 *   execute: async (message) => {
 *     return message;
 *   }
 * });
 * ```
 */

/**
 * Base interface for all IO handlers in the system
 */
interface BaseIOHandler {
    /** Unique name identifier for this handler */
    name: string;
}

/**
 * Handler for processing input data streams
 * @example
 * ```ts
 * // Register an input handler for chat messages
 * const handler: InputIOHandler = {
 *   name: "chat_input",
 *   role: HandlerRole.INPUT,
 *   execute: async (message) => {
 *     return processMessage(message);
 *   }
 * };
 * ```
 */
export interface InputIOHandler extends BaseIOHandler {
    /** Identifies this as an input handler */
    role: HandlerRole.INPUT;
    /** Function to process input data */
    execute?: (data: any) => Promise<ProcessableContent | ProcessableContent[]>;
    /** Sets up a subscription to receive streaming data */
    subscribe?: (
        onData: (data: ProcessableContent | ProcessableContent[]) => void
    ) => () => void;
}

/**
 * Handler for sending output data
 * @example
 * ```ts
 * // Register an output handler for chat responses
 * const handler: OutputIOHandler = {
 *   name: "chat_output",
 *   role: HandlerRole.OUTPUT,
 *   outputSchema: z.object({
 *     message: z.string()
 *   }),
 *   execute: async (response) => {
 *     await sendResponse(response);
 *   }
 * };
 * ```
 */
export interface OutputIOHandler extends BaseIOHandler {
    /** Identifies this as an output handler */
    role: HandlerRole.OUTPUT;
    /** Required schema to validate output data */
    outputSchema: z.ZodType<any>;
    /** Function to process and send output */
    execute?: (data: any) => any;
    /** Sets up a subscription to handle output streams */
    subscribe?: (onData: (data: any) => void) => () => void;
}

/**
 * Handler for performing actions/side effects
 * @example
 * ```ts
 * // Register an action handler for database operations
 * const handler: ActionIOHandler = {
 *   name: "db_action",
 *   role: HandlerRole.ACTION,
 *   execute: async (query) => {
 *     return await db.execute(query);
 *   }
 * };
 * ```
 */
export interface ActionIOHandler extends BaseIOHandler {
    /** Identifies this as an action handler */
    role: HandlerRole.ACTION;
    /** Optional schema to validate action parameters */
    outputSchema?: z.ZodType<any>;
    /** Function to execute the action */
    execute?: (data: any) => Promise<unknown>;
}

/** Union type of all possible IO handler types */
export type IOHandler = InputIOHandler | OutputIOHandler | ActionIOHandler;

/**
 * Base interface for any content that can be processed
 */
export interface ProcessableContent {
    contentId: string;
    userId: string;
    platformId: string;
    threadId: string;
    data: unknown;
}

export interface Chat {
    _id?: string;
    userId: string; // the user the agent is interacting with  could be an agent or a human
    platformId: string; // e.g., "twitter", "telegram"
    threadId: string; // platform-specific thread/conversation ID
    createdAt: Date;
    updatedAt: Date;
    messages: ChatMessage[];
    metadata?: Record<string, any>; // Platform-specific data
}

export interface ChatMessage {
    role: HandlerRole;
    name: string;
    data: unknown;
    timestamp: Date;
    messageId?: string; // Platform-specific message ID if available
}

// Define interfaces matching MongoDB document shapes
export interface ScheduledTask {
    _id: string;
    userId: string;
    handlerName: string;
    taskData: Record<string, any>;
    nextRunAt: Date;
    intervalMs?: number;
    status: "pending" | "running" | "completed" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

export interface OrchestratorMessage {
    role: HandlerRole;
    name: string;
    data: unknown;
    timestamp: Date;
}

export interface OrchestratorChat {
    _id?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    messages: OrchestratorMessage[];
}

export interface Chat {
    _id?: string;
    userId: string;
    platformId: string; // e.g., "twitter", "telegram"
    threadId: string; // platform-specific thread/conversation ID
    createdAt: Date;
    updatedAt: Date;
    messages: ChatMessage[];
    metadata?: Record<string, any>;
}

export interface ChatMessage {
    role: HandlerRole;
    name: string;
    data: unknown;
    timestamp: Date;
    messageId?: string; // Platform-specific message ID if available
}
