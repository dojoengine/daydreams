import { MongoClient, Collection, ObjectId } from "mongodb";
import type { Storage, Repository } from "@daydreamsai/storage";

import type { HandlerRole } from "../types";
import type {
    OrchestratorChat,
    OrchestratorDb,
    OrchestratorMessage,
    ScheduledTask,
} from "../memory";

export class MongoDb implements OrchestratorDb {
    private client: MongoClient;
    private collection!: Collection<ScheduledTask>;
    private orchestratorCollection!: Collection<OrchestratorChat>;

    private tasks!: Repository;
    private orchestrators!: Repository;

    /**
     * @param uri   A MongoDB connection string
     * @param dbName   Name of the database to use
     * @param collectionName  Name of the collection to store tasks in
     */
    constructor(
        private uri: string,
        private dbName: string = "sleever",
        private collectionName: string = "scheduled_tasks",
        private permanentStorage: Storage
    ) {
        this.client = new MongoClient(this.uri);

        this.tasks = this.permanentStorage.getRepository("scheduled_tasks");
        this.orchestrators =
            this.permanentStorage.getRepository("orchestrators");
    }

    /**
     * Connects to the MongoDB server and initializes the tasks collection.
     */
    public async connect(): Promise<void> {
        if (!this.client.listenerCount("connect")) {
            await this.client.connect();
        }

        const db = this.client.db(this.dbName);
        this.collection = db.collection<ScheduledTask>(this.collectionName);

        // Optional: Create indexes
        // - An index on nextRunAt helps find "due" tasks quickly
        // - An index on status helps filter quickly by status
        await this.collection.createIndex({ nextRunAt: 1 });
        await this.collection.createIndex({ status: 1 });

        this.orchestratorCollection =
            db.collection<OrchestratorChat>("orchestrators");

        await this.orchestratorCollection.createIndex({
            userId: 1,
        });
    }

    /**
     * Closes the MongoDB client connection.
     */
    public async close(): Promise<void> {
        await this.client.close();
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
            _id: new ObjectId().toString(),
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
        if (!this.collection) {
            throw new Error("Database collection is not initialized");
        }
        return this.collection
            .find({
                status: "pending",
                nextRunAt: { $lte: now },
            })
            .sort({ nextRunAt: 1 }) // earliest tasks first
            .limit(limit)
            .toArray();
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

    /**
     * Creates a new "orchestrator" document for a user, returning its generated _id.
     * This can represent a "new chat/session" with the agent.
     */
    public async createOrchestrator(userId: string): Promise<string> {
        const chat: OrchestratorChat = {
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: [],
        };
        return await this.orchestrators.insert(chat);
    }

    /**
     * Adds a message (input, output, or action) to an existing orchestrator's conversation.
     *
     * @param orchestratorId - The MongoDB ObjectId of the orchestrator chat.
     * @param role - "input", "output" or "action".
     * @param name - The name/id of the IOHandler.
     * @param data - The data payload to store (e.g., text, JSON from APIs, etc).
     */
    public async addMessage(
        orchestratorId: string,
        role: HandlerRole,
        name: string,
        data: unknown
    ): Promise<void> {
        await this.orchestrators.update(
            orchestratorId,
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
    public async getMessages(
        orchestratorId: string
    ): Promise<OrchestratorMessage[]> {
        const doc = await this.orchestratorCollection.findOne({
            _id: orchestratorId,
        });
        if (!doc) return [];
        return doc.messages;
    }

    /**
     * Retrieves all orchestrators (chats) for a given user.
     */
    public async findOrchestratorsByUser(
        userId: string
    ): Promise<OrchestratorChat[]> {
        return this.orchestratorCollection.find({ userId }).toArray();
    }

    /**
     * Retrieves a single orchestrator document by its ObjectId.
     */
    public async getOrchestratorById(
        orchestratorId: string
    ): Promise<OrchestratorChat | null> {
        return this.orchestratorCollection.findOne({
            _id: orchestratorId,
        });
    }

    public async getOrchestratorsByUserId(
        userId: string
    ): Promise<OrchestratorChat[]> {
        try {
            const documents = await this.orchestratorCollection
                .find({ userId })
                .sort({ createdAt: -1 })
                .toArray();

            return documents.map((doc) => ({
                _id: doc._id.toString(),
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
