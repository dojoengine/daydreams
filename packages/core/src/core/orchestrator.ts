import { Logger } from "./logger";
import { RoomManager } from "./room-manager";
import { TaskScheduler } from "./task-scheduler";
import type { BaseProcessor } from "./processor";
import type { Memory, ProcessedResult, VectorDB } from "./types";
import { HandlerRole, LogLevel, type LoggerConfig } from "./types";
import type { IOHandler } from "./types";
import type { MongoDb } from "./mongo-db";
import { ObjectId } from "mongodb";

/**
 * Orchestrator system that manages both "input" and "output" handlers
 * in a unified manner, along with scheduling recurring inputs.
 */
export class Orchestrator {
    /**
     * Unified collection of IOHandlers (both input & output).
     * Keyed by .name
     */
    private readonly ioHandlers = new Map<string, IOHandler>();

    private pollIntervalId?: ReturnType<typeof setInterval>;

    private processors: Map<string, BaseProcessor> = new Map();

    /**
     * A TaskScheduler that only schedules and runs input handlers
     */
    private readonly inputScheduler: TaskScheduler<
        IOHandler & { nextRun: number }
    >;

    private readonly logger: Logger;

    private readonly mongoDb: MongoDb;

    public userId: string;

    /**
     * Other references in your system. Adjust as needed.
     */
    public readonly vectorDb: VectorDB;
    constructor(
        private readonly roomManager: RoomManager,
        vectorDb: VectorDB,
        processors: BaseProcessor[],
        mongoDb: MongoDb,
        config?: LoggerConfig
    ) {
        this.vectorDb = vectorDb;
        this.processors = new Map(
            processors.map((p) => {
                return [p.getName(), p];
            })
        );
        this.mongoDb = mongoDb;

        this.logger = new Logger(
            config ?? {
                level: LogLevel.ERROR,
                enableColors: true,
                enableTimestamp: true,
            }
        );

        // Initialize userId to an empty string
        this.userId = "";

        // Our TaskScheduler will handle only input-type IOHandlers
        this.inputScheduler = new TaskScheduler(async (handler) => {
            await this.processInputTask(handler);
        });

        this.startPolling();
    }

    public initializeOrchestrator(userId: string) {
        this.userId = userId;
    }

    private unsubscribers = new Map<string, () => void>();
    /**
     * Primary method to register any IOHandler (input or output).
     * - If it's an input with an interval, schedule it for recurring runs.
     * - Otherwise, just store it in the ioHandlers map.
     */
    public registerIOHandler(handler: IOHandler): void {
        if (this.ioHandlers.has(handler.name)) {
            this.logger.warn(
                "Orchestrator.registerIOHandler",
                "Overwriting handler with same name",
                { name: handler.name }
            );
        }

        this.ioHandlers.set(handler.name, handler);

        if (handler.role === HandlerRole.INPUT && handler.subscribe) {
            const unsubscribe = handler.subscribe(async (data) => {
                this.logger.info(
                    "Orchestrator.registerIOHandler",
                    "Starting stream",
                    {
                        data,
                    }
                );
                // Whenever data arrives, pass it into runAutonomousFlow
                await this.runAutonomousFlow(data, handler.name, this.userId);
            });
            this.unsubscribers.set(handler.name, unsubscribe);
        }

        this.logger.info(
            "Orchestrator.registerIOHandler",
            `Registered ${handler.role}`,
            { name: handler.name }
        );
    }

    /**
     * Removes a handler (input or output) by name, stopping scheduling if needed.
     */
    public removeIOHandler(name: string): void {
        // If we have an unsubscribe function, call it
        const unsub = this.unsubscribers.get(name);
        if (unsub) {
            unsub(); // e.g. remove event listeners, clear intervals, etc.
            this.unsubscribers.delete(name);
        }

        // Remove the handler itself
        this.ioHandlers.delete(name);

        console.log(`Removed IOHandler: ${name}`);
    }

    /**
     * Executes a handler with role="output" by name, passing data to it.
     * This is effectively "dispatchToOutput."
     */
    public async dispatchToOutput<T>(name: string, data: T): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler || !handler.execute) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }

        if (handler.role !== "output") {
            throw new Error(`Handler "${name}" is not an output handler`);
        }

        this.logger.debug("Orchestrator.dispatchToOutput", "Executing output", {
            name,
            data,
        });

        try {
            const result = await handler.execute(data);

            this.logger.info("Orchestrator.dispatchToOutput", "Output result", {
                result,
            });

            return result;
        } catch (error) {
            this.logger.error(
                "Orchestrator.dispatchToOutput",
                "Handler threw an error",
                {
                    name,
                    error,
                }
            );
            throw error;
        }
    }

    /**
     * The method the TaskScheduler calls for each scheduled input.
     * We only schedule inputs in the constructor's scheduler.
     */
    private async processInputTask(handler: IOHandler): Promise<void> {
        if (!handler.execute) {
            this.logger.error(
                "Orchestrator.processInputTask",
                "Handler has no execute method",
                { handler }
            );
            return;
        }
        try {
            // it's undefined because this might be fetching data from an api or something
            const result = await handler.execute(undefined);
            if (!result) return;

            if (Array.isArray(result)) {
                for (const item of result) {
                    await this.runAutonomousFlow(
                        item,
                        handler.name,
                        this.userId
                    );
                }
            } else {
                await this.runAutonomousFlow(result, handler.name, this.userId);
            }
        } catch (error) {
            this.logger.error(
                "Orchestrator.processInputTask",
                "Error processing input",
                {
                    name: handler.name,
                    error:
                        error instanceof Error
                            ? {
                                  message: error.message,
                                  stack: error.stack,
                                  name: error.name,
                              }
                            : error,
                    handlerType: handler.role,
                }
            );
        }
    }
    /**
     * Dispatches data to a registered action handler and returns its result.
     *
     * @param name - The name of the registered action handler to dispatch to
     * @param data - The data to pass to the action handler
     * @returns Promise resolving to the action handler's result
     * @throws Error if no handler is found with the given name or if it's not an action handler
     *
     * @example
     * ```ts
     * // Register an action handler
     * orchestrator.registerIOHandler({
     *   name: "sendEmail",
     *   role: "action",
     *   handler: async (data: {to: string, body: string}) => {
     *     // Send email logic
     *     return {success: true};
     *   }
     * });
     *
     * // Dispatch to the action
     * const result = await orchestrator.dispatchToAction("sendEmail", {
     *   to: "user@example.com",
     *   body: "Hello world"
     * });
     * ```
     */
    public async dispatchToAction<T>(name: string, data: T): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler || !handler.execute) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }
        if (handler.role !== "action") {
            throw new Error(`Handler "${name}" is not an action handler`);
        }
        this.logger.debug("Orchestrator.dispatchToAction", "Executing action", {
            name,
            data,
        });
        try {
            const result = await handler.execute(data);
            return result;
        } catch (error) {
            this.logger.error(
                "Orchestrator.dispatchToAction",
                "Handler threw an error",
                {
                    name,
                    error,
                }
            );
            throw error;
        }
    }

    /**
     * Takes some incoming piece of data, processes it through the system,
     * and handles any follow-on "action" or "output" suggestions in a chain.
     */
    private async runAutonomousFlow(
        initialData: unknown,
        sourceName: string,
        userId: string,
        orchestratorId?: string
    ) {
        const queue: Array<{ data: unknown; source: string }> = [];

        // If the initial data is already an array, enqueue each item
        if (Array.isArray(initialData)) {
            for (const item of initialData) {
                queue.push({ data: item, source: sourceName });
            }
        } else {
            queue.push({ data: initialData, source: sourceName });
        }

        // You can keep track of any "outputs" you need to return or do something with
        const outputs: Array<{ name: string; data: any }> = [];

        // check if we have an orchestratorId
        if (orchestratorId) {
            // check if it exists in the db
            const existingOrchestrator =
                await this.mongoDb.getOrchestratorById(orchestratorId);

            if (!existingOrchestrator) {
                orchestratorId = await this.mongoDb.createOrchestrator(userId);
            }
        }

        // Create a new orchestrator record if we have a userId

        if (orchestratorId) {
            // Record the initial input
            await this.mongoDb.addMessage(
                orchestratorId,
                HandlerRole.INPUT,
                sourceName,
                initialData
            );

            this.logger.debug(
                "Orchestrator.runAutonomousFlow",
                "Created orchestrator record",
                {
                    orchestratorId,
                    userId,
                }
            );
        }

        // Keep processing while there is something in the queue
        while (queue.length > 0) {
            const { data, source } = queue.shift()!;

            // Record any action results if we have an orchestratorId
            if (orchestratorId) {
                await this.mongoDb.addMessage(
                    orchestratorId,
                    HandlerRole.INPUT,
                    source,
                    data
                );

                this.logger.debug(
                    "Orchestrator.runAutonomousFlow",
                    "Added message to orchestrator record",
                    {
                        orchestratorId,
                        message: {
                            role: HandlerRole.INPUT,
                            name: source,
                            data,
                        },
                    }
                );
            }

            // processContent now returns an array of ProcessedResult
            const processedResults = await this.processContent(
                data,
                source,
                userId
            );

            // If there's nothing to process further, continue
            if (!processedResults || processedResults.length === 0) {
                continue;
            }

            // Now handle each ProcessedResult
            for (const processed of processedResults) {
                // If the processor says it's already been handled, skip
                if (processed.alreadyProcessed) {
                    continue;
                }

                // If any tasks need to be scheduled in the DB, do so
                if (processed.updateTasks) {
                    for (const task of processed.updateTasks) {
                        await this.scheduleTaskInDb(
                            userId,
                            task.name,
                            task.data,
                            task.intervalMs
                        );

                        this.logger.debug(
                            "Orchestrator.runAutonomousFlow",
                            "Scheduled task in DB",
                            {
                                task,
                            }
                        );
                    }
                }

                // For each suggested output
                for (const output of processed.suggestedOutputs ?? []) {
                    const handler = this.ioHandlers.get(output.name);
                    if (!handler) {
                        this.logger.warn(
                            "No handler found for suggested output",
                            output.name
                        );
                        continue;
                    }

                    if (handler.role === HandlerRole.OUTPUT) {
                        // e.g. send a Slack message
                        outputs.push({ name: output.name, data: output.data });
                        await this.dispatchToOutput(output.name, output.data);

                        this.logger.debug(
                            "Orchestrator.runAutonomousFlow",
                            "Dispatched output",
                            {
                                name: output.name,
                                data: output.data,
                            }
                        );

                        // Record output in DB
                        if (orchestratorId) {
                            await this.mongoDb.addMessage(
                                orchestratorId,
                                HandlerRole.OUTPUT,
                                output.name,
                                output.data
                            );
                        }
                    } else if (handler.role === HandlerRole.ACTION) {
                        // e.g. fetch data from an external API
                        const actionResult = await this.dispatchToAction(
                            output.name,
                            output.data
                        );

                        this.logger.debug(
                            "Orchestrator.runAutonomousFlow",
                            "Dispatched action",
                            {
                                name: output.name,
                                data: output.data,
                            }
                        );

                        // Record action in DB
                        if (orchestratorId) {
                            await this.mongoDb.addMessage(
                                orchestratorId,
                                HandlerRole.ACTION,
                                output.name,
                                {
                                    input: output.data,
                                    result: actionResult,
                                }
                            );
                        }

                        // If the action returns new data (array or single),
                        // feed it back into the queue to continue the flow
                        if (actionResult) {
                            if (Array.isArray(actionResult)) {
                                for (const item of actionResult) {
                                    queue.push({
                                        data: item,
                                        source: output.name,
                                    });
                                }
                            } else {
                                queue.push({
                                    data: actionResult,
                                    source: output.name,
                                });
                            }
                        }
                    } else {
                        this.logger.warn(
                            "Suggested output has an unrecognized role",
                            handler.role
                        );
                    }
                }
            }
        }

        // If you want, you can return the final outputs array or handle it differently
        return outputs;
    }

    /**
     * Dispatches data to a registered input handler and processes the result through the autonomous flow.
     *
     * @param name - The name of the input handler to dispatch to
     * @param data - The data to pass to the input handler
     * @returns An array of output suggestions generated from processing the input
     *
     * @example
     * ```ts
     * // Register a chat input handler
     * orchestrator.registerIOHandler({
     *   name: "user_chat",
     *   role: "input",
     *   handler: async (message) => {
     *     return {
     *       type: "chat",
     *       content: message.content,
     *       metadata: { userId: message.userId }
     *     };
     *   }
     * });
     *
     * // Dispatch a message to the chat handler
     * const outputs = await orchestrator.dispatchToInput("user_chat", {
     *   content: "Hello AI!",
     *   userId: "user123"
     * });
     * ```
     *
     * @throws {Error} If no handler is found with the given name
     * @throws {Error} If the handler's role is not "input"
     */
    public async dispatchToInput<T>(
        name: string,
        data: T,
        userId: string,
        orchestratorId?: string
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler) throw new Error(`No IOHandler: ${name}`);
        if (!handler.execute)
            throw new Error(`Handler "${name}" has no execute method`);
        if (handler.role !== "input") {
            throw new Error(`Handler "${name}" is not role=input`);
        }

        try {
            const result = await handler.execute(data);

            if (result) {
                return await this.runAutonomousFlow(
                    result,
                    handler.name,
                    userId,
                    orchestratorId
                );
            }
            return [];
        } catch (error) {
            this.logger.error(
                "dispatchToInput Error",
                `dispatchToInput Error: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    public async scheduleTaskInDb(
        userId: string,
        handlerName: string,
        data: Record<string, unknown> = {},
        intervalMs?: number
    ): Promise<string> {
        const now = Date.now();
        const nextRunAt = new Date(now + (intervalMs ?? 0));

        this.logger.info(
            "Orchestrator.scheduleTaskInDb",
            `Scheduling task ${handlerName}`,
            {
                nextRunAt,
                intervalMs,
            }
        );

        return await this.mongoDb.createTask(
            userId,
            handlerName,
            {
                request: handlerName,
                task_data: JSON.stringify(data),
            },
            nextRunAt,
            intervalMs
        );
    }

    public startPolling(everyMs = 10_000): void {
        // Stop existing polling if it exists
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
        }

        this.pollIntervalId = setInterval(() => {
            this.pollScheduledTasks().catch((err) => {
                this.logger.error(
                    "Orchestrator.startPolling",
                    "Error in pollScheduledTasks",
                    err
                );
            });
        }, everyMs);

        this.logger.info(
            "Orchestrator.startPolling",
            "Started polling for scheduled tasks",
            {
                intervalMs: everyMs,
            }
        );
    }

    private async pollScheduledTasks() {
        try {
            // Guard against undefined collection
            if (!this.mongoDb) {
                this.logger.error(
                    "pollScheduledTasks error",
                    "scheduledTaskDb is not initialized"
                );
                return;
            }

            const tasks = await this.mongoDb.findDueTasks();
            if (!tasks) {
                return;
            }

            for (const task of tasks) {
                if (!task._id) {
                    this.logger.error(
                        "pollScheduledTasks error",
                        "Task is missing _id"
                    );
                    continue;
                }

                // 2. Mark them as 'running' (or handle concurrency the way you want)
                await this.mongoDb.markRunning(task._id);

                const handler = this.ioHandlers.get(task.handlerName);
                if (!handler) {
                    throw new Error(`No handler found: ${task.handlerName}`);
                }

                const taskData =
                    typeof task.taskData.task_data === "string"
                        ? JSON.parse(task.taskData.task_data)
                        : task.taskData;

                if (handler.role === HandlerRole.INPUT) {
                    try {
                        await this.dispatchToInput(
                            task.handlerName,
                            taskData,
                            task.userId
                        );
                    } catch (error) {
                        this.logger.error(
                            "Task execution failed",
                            `Task ${task._id}: ${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                } else if (handler.role === HandlerRole.ACTION) {
                    try {
                        const actionResult = await this.dispatchToAction(
                            task.handlerName,
                            taskData
                        );
                        if (actionResult) {
                            await this.runAutonomousFlow(
                                actionResult,
                                task.handlerName,
                                task.userId
                            );
                        }
                    } catch (error) {
                        this.logger.error(
                            "Task execution failed",
                            `Task ${task._id}: ${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                } else if (handler.role === HandlerRole.OUTPUT) {
                    try {
                        await this.dispatchToOutput(task.handlerName, taskData);
                    } catch (error) {
                        this.logger.error(
                            "Task execution failed",
                            `Task ${task._id}: ${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                }

                // 4. If the task is recurring (interval_ms), update next_run_at
                if (task.intervalMs) {
                    const nextRunAt = new Date(Date.now() + task.intervalMs);
                    await this.mongoDb.updateNextRun(task._id, nextRunAt);
                } else {
                    // Otherwise, mark completed
                    await this.mongoDb.markCompleted(task._id);
                }
            }
        } catch (err) {
            this.logger.error(
                "pollScheduledTasks error",
                err instanceof Error ? err.message : String(err)
            );
        }
    }

    public async processContent(
        content: any,
        source: string,
        userId?: string
    ): Promise<ProcessedResult[]> {
        if (Array.isArray(content)) {
            const allResults: ProcessedResult[] = [];
            for (const item of content) {
                await new Promise((resolve) => setTimeout(resolve, 5000));
                const result = await this.processContentItem(
                    item,
                    source,
                    userId
                );
                if (result) {
                    allResults.push(result);
                }
            }
            return allResults;
        }

        const singleResult = await this.processContentItem(
            content,
            source,
            userId
        );
        return singleResult ? [singleResult] : [];
    }

    private async processContentItem(
        content: any,
        source: string,
        userId?: string
    ): Promise<ProcessedResult | null> {
        let memories: Memory[] = [];

        if (content.room) {
            const hasProcessed =
                await this.roomManager.hasProcessedContentInRoom(
                    content.contentId,
                    content.room
                );

            if (hasProcessed) {
                this.logger.debug(
                    "Orchestrator.processContent",
                    "Content already processed",
                    {
                        contentId: content.contentId,
                        roomId: content.room,
                        userId,
                    }
                );
                return null;
            }
            const room = await this.roomManager.ensureRoom(
                content.room,
                source,
                userId
            );
            memories = await this.roomManager.getMemoriesFromRoom(room.id);

            this.logger.debug(
                "Orchestrator.processContent",
                "Processing content with context",
                {
                    content,
                    source,
                    roomId: room.id,
                    userId,
                    relevantMemories: memories,
                }
            );
        }

        const processor = Array.from(this.processors.values()).find((p) =>
            p.canHandle(content)
        );

        if (!processor) {
            this.logger.debug(
                "Orchestrator.processContent",
                "No suitable processor found for content",
                { content }
            );
            return null;
        }

        const availableOutputs = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.OUTPUT
        );

        const availableActions = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.ACTION
        );

        const result = await processor.process(
            content,
            JSON.stringify(memories),
            {
                availableOutputs,
                availableActions,
            }
        );

        if (content.room) {
            // Save the result to memory
            await this.roomManager.addMemory(
                content.room,
                JSON.stringify(result?.content),
                {
                    source,
                    ...result?.metadata,
                    ...result?.enrichedContext,
                }
            );

            // Mark the content as processed
            await this.roomManager.markContentAsProcessed(
                content.contentId,
                content.room
            );
        }

        return result;
    }

    /**
     * Stops all scheduled tasks and shuts down the orchestrator.
     */
    public stop(): void {
        this.inputScheduler.stop();
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
        }
        this.logger.info("Orchestrator.stop", "All scheduled inputs stopped.");
    }
}
