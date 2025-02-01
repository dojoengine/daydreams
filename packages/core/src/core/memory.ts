import type { HandlerRole, Memory } from "./types";
import type { Conversation } from "./conversation";

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
    metadata?: Record<string, any>; // Platform-specific data
}

export interface ChatMessage {
    role: HandlerRole;
    name: string;
    data: unknown;
    timestamp: Date;
    messageId?: string; // Platform-specific message ID if available
}

export interface OrchestratorDb {
    connect(): Promise<void>;
    close(): Promise<void>;

    // Orchestrator methods
    getOrchestratorById(id: string): Promise<OrchestratorChat | null>;
    getOrchestratorsByUserId(userId: string): Promise<OrchestratorChat[]>;
    getOrCreateChat(
        userId: string,
        platformId: string,
        threadId: string,
        metadata?: Record<string, any>
    ): Promise<string>;
    addChatMessage(
        chatId: string,
        role: HandlerRole,
        name: string,
        data: unknown
    ): Promise<void>;
    getChatMessages(chatId: string): Promise<ChatMessage[]>;

    // Task management methods
    createTask(
        userId: string,
        handlerName: string,
        taskData: Record<string, any>,
        nextRunAt: Date,
        intervalMs?: number
    ): Promise<string>;
    findDueTasks(limit?: number): Promise<ScheduledTask[]>;
    markRunning(taskId: string): Promise<void>;
    markCompleted(taskId: string, failed?: boolean): Promise<void>;
    updateNextRun(taskId: string, newRunTime: Date): Promise<void>;
    rescheduleIfRecurring(task: ScheduledTask): Promise<void>;
    deleteAll(): Promise<void>;
}

export interface MemoryManager {
    hasProcessedContentInConversation(
        contentId: string,
        conversationId: string
    ): Promise<boolean>;
    ensureConversation(
        conversationId: string,
        source: string,
        userId?: string
    ): Promise<Conversation>;
    getMemoriesFromConversation(conversationId: string): Promise<Memory[]>;
    addMemory(
        conversationId: string,
        content: string,
        metadata?: any
    ): Promise<void>;
    markContentAsProcessed(
        contentId: string,
        conversationId: string
    ): Promise<void>;
}
