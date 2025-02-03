import { SCHEDULED_TASKS_KIND, ORCHESTRATORS_KIND, CHATS_KIND } from "@daydreamsai/storage";
import type { Storage, Repository } from "@daydreamsai/storage";

import type {
    Chat,
    ChatMessage,
    HandlerRole,
    OrchestratorChat,
    ScheduledTask,
} from "../types";
import type { OrchestratorDb } from "../memory";

// TODO: This class has nothing to do with MongoDB specifically, it should be renamed.
export class MongoDb implements OrchestratorDb {
    private tasks!: Repository;
    private orchestrators!: Repository;
    private chats!: Repository;

    /**
     * @param uri   A MongoDB connection string
     * @param dbName   Name of the database to use
     * @param collectionName  Name of the collection to store tasks in
     */
    constructor(
        private storage: Storage
    ) {
        this.tasks = this.storage.getRepository(SCHEDULED_TASKS_KIND);
        this.orchestrators =
            this.storage.getRepository(ORCHESTRATORS_KIND);
        this.chats = this.storage.getRepository(CHATS_KIND);
    }

    /**
     * Schedules a new task in the DB.
     *
     * @param userId - The user ID to associate with the task
     * @param handlerName - Name of the IOHandler to invoke
     * @param taskData    - Arbitrary JSON data to store with the task
     * @param nextRunAt   - When this task should run
     * @param intervalMs  - If set, the task will be re-scheduled after each run
     */
    public createTask(
        userId: string,
        handlerName: string,
        taskData: Record<string, any> = {},
        nextRunAt: Date,
        intervalMs?: number
    ): Promise<string> {
        const now = new Date();
        const doc: ScheduledTask = {
            userId,
            handlerName,
            taskData,
            nextRunAt,
            intervalMs,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        };

        return this.tasks.insert(doc);
    }

    /**
     * Finds tasks that are due to run right now (status=pending, nextRunAt <= now).
     * This is used by your polling logic to pick up tasks that need to be processed.
     *
     * @param limit - Max number of tasks to fetch at once
     */
    public async findDueTasks(limit = 50): Promise<ScheduledTask[]> {
        const now = new Date();
        const tasks = await this.tasks
            .find<ScheduledTask>({
                status: "pending",
                nextRunAt: { lte: now },
            }, { limit }, { nextRunAt: "asc" });

        return tasks;
    }

    /**
     * Marks a task's status as "running". Typically called right before invoking it.
     */
    public async markRunning(taskId: string): Promise<void> {
        await this.tasks.update(taskId, {
            status: "running",
            updatedAt: new Date(),
        });
    }

    /**
     * Marks a task as completed (or failed).
     */
    public async markCompleted(taskId: string, failed = false): Promise<void> {
        await this.tasks.update(taskId, {
            status: failed ? "failed" : "completed",
            updatedAt: new Date(),
        });
    }

    /**
     * Updates a task to run again in the future (if intervalMs is present).
     */
    public async updateNextRun(
        taskId: string,
        newRunTime: Date
    ): Promise<void> {
        await this.tasks.update(taskId, {
            status: "pending",
            nextRunAt: newRunTime,
            updatedAt: new Date(),
        });
    }

    /**
     * Convenient method to reschedule a task using its own `intervalMs` if present.
     * Typically you'd call this after the task completes, if you want it to repeat.
     */
    public async rescheduleIfRecurring(task: ScheduledTask): Promise<void> {
        // If there's no interval, we do nothing (non-recurring).
        if (!task.intervalMs) {
            await this.markCompleted(task._id!);
            return;
        }
        const now = Date.now();
        const newRunTime = new Date(now + task.intervalMs);
        await this.updateNextRun(task._id!, newRunTime);
    }

    /**
     * Deletes all tasks from the collection.
     */
    public async deleteAll(): Promise<void> {
        await this.tasks.deleteAll();
    }

    public async getOrCreateChat(
        userId: string,
        platformId: string,
        threadId: string,
        metadata?: Record<string, any>
    ): Promise<string> {
        const existingChat = await this.chats.findOne<Chat>({
            userId,
            platformId,
            threadId,
        });

        if (existingChat) {
            return existingChat._id!.toString();
        }

        const chat: Chat = {
            userId,
            platformId,
            threadId,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: [],
            metadata,
        };
        return await this.chats.insert(chat);
    }

    /**
     * Adds a message (input, output, or action) to an existing orchestrator's conversation.
     *
     * @param orchestratorId - The ID of the orchestrator chat.
     * @param role - "input", "output" or "action".
     * @param name - The name/id of the IOHandler.
     * @param data - The data payload to store (e.g., text, JSON from APIs, etc).
     */
    public async addChatMessage(
        chatId: string,
        role: HandlerRole,
        name: string,
        data: unknown
    ): Promise<void> {
        await this.chats.update(
            chatId,
            {
                updatedAt: new Date(),
            },
            {
                messages: {
                    role,
                    name,
                    data,
                    timestamp: new Date(),
                },
            }
        );
    }

    /**
     * Retrieves all messages in a specific orchestrator's conversation.
     */
    public async getChatMessages(chatId: string): Promise<ChatMessage[]> {
        const doc = await this.chats.findOne<OrchestratorChat>({
            _id: chatId,
        });
        return doc?.messages || [];
    }

    /**
     * Retrieves all orchestrators (chats) for a given user.
     */
    public async findOrchestratorsByUser(
        userId: string
    ): Promise<OrchestratorChat[]> {
        return this.orchestrators.find({ userId });
    }

    /**
     * Retrieves a single orchestrator document by its ID.
     */
    public async getOrchestratorById(
        orchestratorId: string
    ): Promise<OrchestratorChat | null> {
        return this.orchestrators.findOne({
            _id: orchestratorId,
        });
    }

    public async getOrchestratorsByUserId(
        userId: string
    ): Promise<OrchestratorChat[]> {
        try {
            const documents = await this.orchestrators
                .find<OrchestratorChat>({ userId }, undefined, { createdAt: "desc" });

            return documents.map((doc) => ({
                _id: doc._id?.toString() || "",
                userId: doc.userId,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                messages: doc.messages,
            }));
        } catch (error) {
            console.error(
                "MongoDb.getOrchestratorsByUserId",
                "Failed to fetch orchestrator records",
                { userId, error }
            );
            throw error;
        }
    }
}
