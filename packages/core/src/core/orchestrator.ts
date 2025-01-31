import { Logger } from "./logger";
import { RoomManager } from "./room-manager";
import type { BaseProcessor } from "./processor";
import type { AgentRequest, Memory, ProcessedResult, VectorDB } from "./types";
import { HandlerRole, LogLevel, type LoggerConfig } from "./types";
import type { IOHandler } from "./types";

import type { OrchestratorDb } from "./memory";

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

    /**
     * Logger instance for logging messages and errors.
     */
    private readonly logger: Logger;

    /**
     * orchestratorDb instance for database operations.
     */
    private readonly orchestratorDb: OrchestratorDb;

    /**
     * Map of unsubscribe functions for various handlers.
     * Keyed by handler name.
     */
    private unsubscribers = new Map<string, () => void>();

    /**
     * Other references in your system. Adjust as needed.
     */
    public readonly vectorDb: VectorDB;

    constructor(
        private readonly roomManager: RoomManager,
        vectorDb: VectorDB,
        private processor: BaseProcessor,
        orchestratorDb: OrchestratorDb,
        config?: LoggerConfig
    ) {
        this.vectorDb = vectorDb;
        this.orchestratorDb = orchestratorDb;
        this.logger = new Logger(
            config ?? {
                level: LogLevel.ERROR,
                enableColors: true,
                enableTimestamp: true,
            }
        );

        this.logger.info(
            "Orchestrator.constructor",
            "Orchestrator initialized"
        );
    }

    public getHandler(name: string): IOHandler | undefined {
        return this.ioHandlers.get(name);
    }

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
                    { data }
                );
                // Simulate a request-like object here if you want a consistent approach.
                // this will register as an agent request
                const fakeRequest: AgentRequest = { headers: {} };
                // Whenever data arrives, pass it into runAutonomousFlow
                await this.runAutonomousFlow(fakeRequest, data, handler.name);
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

        this.logger.info("Orchestrator.removeIOHandler", "Removed IOHandler", {
            name,
        });
    }

    /**
     * Dispatches data to a registered *output* handler by name, passing in a request plus data.
     */
    public async dispatchToOutput<T>(
        name: string,
        request: AgentRequest,
        data: T
    ): Promise<unknown> {
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
            headers: request.headers,
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
     * Dispatches data to a registered *action* handler by name, passing in a request plus data.
     */
    public async dispatchToAction<T>(
        name: string,
        request: AgentRequest,
        data: T
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler || !handler.execute) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }
        if (handler.role !== "action") {
            throw new Error(`Handler "${name}" is not an action handler`);
        }

        try {
            const result = await handler.execute(data);

            this.logger.debug(
                "Orchestrator.dispatchToAction",
                "Executing action",
                {
                    name,
                    data,
                    headers: request.headers,
                }
            );
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
     * Dispatches data to a registered *input* handler by name, passing in a request plus data.
     * Then continues through the autonomous flow.
     */
    public async dispatchToInput<T>(
        name: string,
        request: AgentRequest,
        data: T,
        orchestratorId?: string
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler) throw new Error(`No IOHandler: ${name}`);
        if (!handler.execute) {
            throw new Error(`Handler "${name}" has no execute method`);
        }
        if (handler.role !== "input") {
            throw new Error(`Handler "${name}" is not role=input`);
        }

        try {
            // Possibly run a transformation or normalizing step inside `handler.execute`
            const result = await handler.execute(data);

            if (result) {
                return await this.runAutonomousFlow(
                    request,
                    result,
                    handler.name,
                    orchestratorId
                );
            }
            return [];
        } catch (error) {
            this.logger.error(
                "Orchestrator.dispatchToInput",
                `dispatchToInput Error: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            throw error;
        }
    }

    /**
     * Takes some incoming piece of data, processes it through the system,
     * and handles any follow-on "action" or "output" suggestions in a queue.
     *
     * @param request        A request-like object (headers, etc.) from which we extract user info
     * @param initialData    The data payload to process
     * @param sourceName     The IOHandler name that provided this data
     * @param orchestratorId An optional existing orchestrator record ID to tie into
     */
    private async runAutonomousFlow(
        request: AgentRequest,
        initialData: unknown,
        sourceName: string,
        orchestratorId?: string
    ) {
        // For illustration, extract userId from headers. Adjust the header name as needed.
        const userId = request.headers["x-user-id"] || "agent";

        const queue: Array<{ data: unknown; source: string }> = [];

        // If the initial data is already an array, enqueue each item
        if (Array.isArray(initialData)) {
            for (const item of initialData) {
                queue.push({ data: item, source: sourceName });
            }
        } else {
            queue.push({ data: initialData, source: sourceName });
        }

        console.log("DEBUG: Queue ============= : ", queue);

        // Optionally store final outputs to return or do something with them
        const outputs: Array<{ name: string; data: any }> = [];

        // If orchestratorId is provided, verify it in the DB or create a new record
        if (orchestratorId) {
            const existing =
                await this.orchestratorDb.getOrchestratorById(orchestratorId);
            if (!existing) {
                orchestratorId =
                    await this.orchestratorDb.createOrchestrator(userId);
            }
        }

        // Otherwise, create a new orchestrator record if needed
        if (!orchestratorId) {
            orchestratorId =
                await this.orchestratorDb.createOrchestrator(userId);
        }

        // Record initial data as an input message
        if (orchestratorId) {
            await this.orchestratorDb.addMessage(
                orchestratorId,
                HandlerRole.INPUT,
                sourceName,
                initialData
            );
            this.logger.debug(
                "Orchestrator.runAutonomousFlow",
                "Created or continued orchestrator record",
                {
                    orchestratorId,
                    userId,
                }
            );
        }

        // Process items in a queue
        while (queue.length > 0) {
            const { data, source } = queue.shift()!;

            // Record each chunk of data if you want
            if (orchestratorId) {
                await this.orchestratorDb.addMessage(
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

            // processContent can return an array of ProcessedResult
            const processedResults = await this.processContent(
                data,
                source,
                userId
            );

            console.log(
                "DEBUG: Processed results ============= : ",
                processedResults
            );

            if (!processedResults || processedResults.length === 0) {
                continue;
            }

            for (const processed of processedResults) {
                // If the item was already processed, skip
                if (processed.alreadyProcessed) continue;

                // Possibly schedule any tasks in the DB
                if (processed.updateTasks) {
                    for (const task of processed.updateTasks) {
                        const now = Date.now();
                        const nextRunAt = new Date(
                            now + (task.intervalMs ?? 0)
                        );
                        this.logger.info(
                            "Orchestrator.runAutonomousFlow",
                            `Scheduling task ${task.name}`,
                            { nextRunAt, intervalMs: task.intervalMs }
                        );

                        await this.orchestratorDb.createTask(
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
                }

                console.log("DEBUG: Processed ============= : ", processed);

                // For each suggested output or action
                for (const output of processed.suggestedOutputs ?? []) {
                    const handler = this.ioHandlers.get(output.name);
                    if (!handler) {
                        this.logger.warn(
                            "Orchestrator.runAutonomousFlow",
                            `No handler found for suggested output: ${output.name}`
                        );
                        continue;
                    }

                    if (handler.role === HandlerRole.OUTPUT) {
                        // e.g. send a Slack message
                        outputs.push({ name: output.name, data: output.data });
                        console.log("DEBUG: Outputs ============= : ", outputs);
                        await this.dispatchToOutput(
                            output.name,
                            request,
                            output.data
                        );

                        this.logger.debug(
                            "Orchestrator.runAutonomousFlow",
                            "Dispatched output",
                            {
                                name: output.name,
                                data: output.data,
                            }
                        );

                        if (orchestratorId) {
                            await this.orchestratorDb.addMessage(
                                orchestratorId,
                                HandlerRole.OUTPUT,
                                output.name,
                                output.data
                            );
                        }
                    } else if (handler.role === HandlerRole.ACTION) {
                        // e.g. fetch data from an external API
                        console.log(
                            "DEBUG: Dispatching action ============= : ",
                            output.name
                        );
                        console.log(
                            "DEBUG: Dispatching action data ============= : ",
                            output.data
                        );
                        const actionResult = await this.dispatchToAction(
                            output.name,
                            request,
                            output.data || { query: processed.content }
                        );

                        this.logger.debug(
                            "Orchestrator.runAutonomousFlow",
                            "Dispatched action",
                            {
                                name: output.name,
                                data: output.data,
                            }
                        );

                        if (orchestratorId) {
                            await this.orchestratorDb.addMessage(
                                orchestratorId,
                                HandlerRole.ACTION,
                                output.name,
                                {
                                    input: output.data,
                                    result: actionResult,
                                }
                            );
                        }

                        // If the action returns new data, queue it up
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
                            "Orchestrator.runAutonomousFlow",
                            "Suggested output has an unrecognized role",
                            handler.role
                        );
                    }
                }
            }
        }

        // Return the final outputs array, or handle them in your own way
        return outputs;
    }

    /**
     * Processes *any* content by splitting it into items (if needed) and
     * calling the single-item processor.
     */
    public async processContent(
        content: any,
        source: string,
        userId?: string
    ): Promise<ProcessedResult[]> {
        console.log("DEBUG: Processing content ============= : ", content);
        if (Array.isArray(content)) {
            const allResults: ProcessedResult[] = [];
            for (const item of content) {
                // Example delay to show chunk processing, remove if not needed
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
        console.log("DEBUG: Single result ============= : ", singleResult);
        return singleResult ? [singleResult] : [];
    }

    /**
     * Processes a single item of content:
     *  - Retrieves prior memories from its room
     *  - Lets the "master" processor handle it
     *  - Optionally saves the result to memory/marks it processed
     */
    private async processContentItem(
        content: any,
        source: string,
        userId?: string
    ): Promise<ProcessedResult | null> {
        let memories: Memory[] = [];

        // If the content indicates a "room" property
        if (content.room) {
            const hasProcessed =
                await this.roomManager.hasProcessedContentInRoom(
                    content.contentId,
                    content.room
                );
            if (hasProcessed) {
                this.logger.debug(
                    "Orchestrator.processContentItem",
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
                "Orchestrator.processContentItem",
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

        // Gather possible outputs & actions to pass to the Processor
        const availableOutputs = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.OUTPUT
        );
        const availableActions = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.ACTION
        );

        // Processor's main entry point
        const result = await this.processor.process(
            content,
            JSON.stringify(memories),
            {
                availableOutputs,
                availableActions,
            }
        );

        // If there's a room, save the memory and mark processed
        if (content.room && result) {
            console.log(
                "DEBUG: Adding memory ============= : ",
                result.content
            );
            await this.roomManager.addMemory(
                content.room,
                JSON.stringify(result.content),
                {
                    source,
                    ...result.metadata,
                    ...result.enrichedContext,
                }
            );
            await this.roomManager.markContentAsProcessed(
                content.contentId,
                content.room
            );
        }

        return result;
    }
}
