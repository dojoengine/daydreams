import { HandlerRole, type Memory } from "./types";
import type { OrchestratorDb } from "./memory";
import type { ConversationManager } from "./conversation-manager";
import type { Conversation } from "./conversation";

export function makeFlowLifecycle(
    orchestratorDb: OrchestratorDb,
    conversationManager: ConversationManager
): FlowLifecycle {
    return {
        async onFlowStart(
            userId: string,
            platformId: string,
            threadId: string,
            initialData: unknown
        ): Promise<string> {
            return orchestratorDb.getOrCreateChat(userId, platformId, threadId);
        },

        async onFlowStep(
            chatId: string | undefined,
            role: HandlerRole,
            sourceName: string,
            data: unknown
        ): Promise<void> {
            if (!chatId) return;
            await orchestratorDb.addChatMessage(chatId, role, sourceName, data);
        },

        async onTasksScheduled(
            userId: string,
            tasks: { name: string; data: unknown; intervalMs?: number }[]
        ): Promise<void> {
            for (const task of tasks) {
                const now: number = Date.now();
                const nextRunAt: Date = new Date(now + (task.intervalMs ?? 0));
                await orchestratorDb.createTask(
                    userId,
                    task.name,
                    {
                        request: task.name,
                        task_data: JSON.stringify(task.data),
                    },
                    nextRunAt,
                    task.intervalMs
                );
            }
        },

        async onContentProcessed(
            contentId: string,
            threadId: string,
            content: string,
            metadata?: Record<string, unknown>
        ): Promise<void> {
            const hasProcessed =
                await conversationManager.hasProcessedContentInConversation(
                    contentId,
                    threadId
                );
            if (hasProcessed) {
                return;
            }
            await conversationManager.markContentAsProcessed(
                contentId,
                threadId
            );
        },

        async onConversationCreated(
            userId: string,
            threadId: string,
            source: string
        ): Promise<Conversation> {
            return await conversationManager.ensureConversation(
                threadId,
                source,
                userId
            );
        },

        async onConversationUpdated(
            contentId: string,
            threadId: string,
            content: string,
            source: string,
            updates: Record<string, unknown>
        ): Promise<void> {
            await conversationManager.markContentAsProcessed(
                contentId,
                threadId
            );
        },

        async onMemoryAdded(
            chatId: string,
            content: string,
            source: string,
            updates: Record<string, unknown>
        ): Promise<void> {
            await conversationManager.addMemory(chatId, content, {
                source,
                ...updates,
            });

            await orchestratorDb.addChatMessage(
                chatId,
                HandlerRole.INPUT,
                source,
                {
                    content,
                    chatId,
                }
            );
        },

        async onMemoriesRequested(
            chatId: string,
            limit?: number
        ): Promise<{ memories: Memory[] }> {
            // get vector based memories
            // todo, we could base this on a userID so the agent has memories across conversations
            const memories =
                await conversationManager.getMemoriesFromConversation(
                    chatId,
                    limit
                );

            return { memories };
        },

        async onCheckContentProcessed(
            contentId: string,
            chatId: string
        ): Promise<boolean> {
            return await conversationManager.hasProcessedContentInConversation(
                contentId,
                chatId
            );
        },
    };
}

/**
 * A set of lifecycle callbacks for orchestrator events.
 */
export interface FlowLifecycle {
    /**
     * Called when a new flow is started or continued.
     * Allows you to create or fetch an Orchestrator record, returning an ID if relevant.
     */
    onFlowStart(
        userId: string,
        platformId: string,
        threadId: string,
        initialData: unknown
    ): Promise<string>;

    /**
     * Called when new data is processed in the flow (e.g., an input message).
     */
    onFlowStep(
        chatId: string,
        role: HandlerRole,
        sourceName: string,
        data: unknown
    ): Promise<void>;

    /**
     * Called when the Orchestrator wants to schedule tasks (e.g. recurring tasks).
     * You can store them in your DB or in a queue system.
     */
    onTasksScheduled(
        userId: string,
        tasks: {
            name: string;
            data: unknown;
            intervalMs?: number;
        }[]
    ): Promise<void>;

    /**
     * Called when content has been processed in a conversation
     */
    onContentProcessed(
        userId: string,
        threadId: string,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<void>;

    /**
     * Called when a new conversation is created
     */
    onConversationCreated(
        userId: string,
        threadId: string,
        source: string,
        metadata?: Record<string, unknown>
    ): Promise<Conversation>;

    /**
     * Called when a conversation is updated
     */
    onConversationUpdated(
        contentId: string,
        threadId: string,
        content: string,
        source: string,
        updates: Record<string, unknown>
    ): Promise<void>;

    /**
     * Called when a new memory needs to be added to a conversation
     */
    onMemoryAdded(
        chatId: string,
        content: string,
        source: string,
        updates: Record<string, unknown>
    ): Promise<void>;

    /**
     * Called when memories need to be retrieved for a conversation
     */
    onMemoriesRequested(
        chatId: string,
        limit?: number
    ): Promise<{ memories: Memory[] }>;

    /**
     * Called to check if specific content has been processed in a conversation
     */
    onCheckContentProcessed(
        contentId: string,
        chatId: string
    ): Promise<boolean>;
}
