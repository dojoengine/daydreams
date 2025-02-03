import type {
    ChatMessage,
    HandlerRole,
    Memory,
    OrchestratorChat,
    ScheduledTask,
} from "./types";
import type { Conversation } from "./conversation";

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
