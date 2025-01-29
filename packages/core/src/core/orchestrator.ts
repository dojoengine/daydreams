import { Logger } from "./logger";
import { RoomManager } from "./room-manager";
import { TaskScheduler } from "./task-scheduler";
import type { BaseProcessor } from "./processor";
import type { Memory, ProcessedResult, VectorDB } from "./types";
import { HandlerRole, type LoggerConfig, LogLevel } from "./types";
import type { IOHandler } from "./types";

/**
 * Orchestrator system that manages handlers in a unified manner. It passes
 * inputs to processors and deals with outputs.
 */
export class Orchestrator {
    /**
     * Unified collection of IOHandlers (both input & output).
     * Keyed by .name
     */
    private readonly ioHandlers = new Map<string, IOHandler>();

    private processors: Map<string, BaseProcessor> = new Map();

    private readonly logger: Logger;

    /**
     * Other references in your system. Adjust as needed.
     */
    public readonly vectorDb: VectorDB;
    constructor(
        private readonly roomManager: RoomManager,
        vectorDb: VectorDB,
        processors: BaseProcessor[],
        config?: LoggerConfig,
    ) {
        this.vectorDb = vectorDb;
        this.processors = new Map(
            processors.map((p) => {
                return [p.getName(), p];
            }),
        );

        this.logger = new Logger(
            config ?? {
                level: LogLevel.ERROR,
                enableColors: true,
                enableTimestamp: true,
            },
        );
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
                { name: handler.name },
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
                    },
                );
                // Whenever data arrives, pass it into runAutonomousFlow
                await this.runAutonomousFlow(data, handler.name);
            });
            this.unsubscribers.set(handler.name, unsubscribe);
        }

        this.logger.info(
            "Orchestrator.registerIOHandler",
            `Registered ${handler.role}`,
            { name: handler.name },
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
     * Dispatches data to a registered output handler and returns its result.
     *
     * @param name - The name of the registered output handler to dispatch to
     * @param data - The data to pass to the output handler
     * @returns Promise resolving to the output handler's result
     * @throws Error if no handler is found with the given name or if it's not an output handler
     */
    public async dispatchToOutput<T>(name: string, data: T): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }

        if (handler.role !== HandlerRole.OUTPUT) {
            throw new Error(`Handler "${name}" is not an output handler`);
        }

        try {
            this.logger.debug(
                "Orchestrator.dispatchToOutput",
                "Executing output",
                {
                    name,
                    data,
                },
            );

            const result = await handler.execute(data);

            this.logger.debug(
                "Orchestrator.dispatchToOutput",
                "Output result",
                {
                    result,
                },
            );

            return result;
        } catch (error) {
            this.logger.error(
                "Orchestrator.dispatchToOutput",
                "Handler threw an error",
                {
                    name,
                    error,
                },
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
                { handler },
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
                    );
                }
            } else {
                await this.runAutonomousFlow(result, handler.name);
            }
        } catch (error) {
            this.logger.error(
                "Orchestrator.processInputTask",
                "Error processing input",
                {
                    name: handler.name,
                    error: error instanceof Error
                        ? {
                            message: error.message,
                            stack: error.stack,
                            name: error.name,
                        }
                        : error,
                    handlerType: handler.role,
                },
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
        if (!handler) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }
        if (handler.role !== HandlerRole.ACTION) {
            throw new Error(`Handler "${name}" is not an action handler`);
        }
        try {
            this.logger.debug(
                "Orchestrator.dispatchToAction",
                "Executing action",
                {
                    name,
                    data,
                },
            );

            const result = await handler.execute(data);

            this.logger.debug(
                "Orchestrator.dispatchToAction",
                "Action result",
                {
                    result,
                },
            );

            return result;
        } catch (error) {
            this.logger.error(
                "Orchestrator.dispatchToAction",
                "Handler threw an error",
                {
                    name,
                    error,
                },
            );
            throw error;
        }
    }

    /**
     * Takes some incoming piece of data, processes it through the system,
     * and handles any follow-on "action" or "output" suggestions in a chain.
     */
    public async runAutonomousFlow(
        initialData: unknown,
        sourceName: string,
    ) {
        // TODO: this queue is weird, initialData should have a structure, not guessing if it's an array
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

        // Keep processing while there is something in the queue
        while (queue.length > 0) {
            const { data, source } = queue.shift()!;

            // processContent now returns an array of ProcessedResult
            const processedResults = await this.processContent(
                data,
                source,
            );

            // If there's nothing to process further, continue
            if (!processedResults || processedResults.length === 0) {
                continue;
            }

            // Now handle each ProcessedResult
            for (const processed of processedResults) {
                // If the processor says it's already been handled, skip
                if (processed.alreadyProcessed) { // TODO: where is this set to true?
                    continue;
                }

                // For each suggested output
                for (const output of processed.suggestedOutputs ?? []) {
                    const handler = this.ioHandlers.get(output.name);
                    if (!handler) {
                        this.logger.warn(
                            "No handler found for suggested output",
                            output.name,
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
                            },
                        );
                    } else if (handler.role === HandlerRole.ACTION) {
                        // e.g. fetch data from an external API
                        const actionResult = await this.dispatchToAction(
                            output.name,
                            output.data,
                        );

                        this.logger.debug(
                            "Orchestrator.runAutonomousFlow",
                            "Dispatched action",
                            {
                                name: output.name,
                                data: output.data,
                            },
                        );

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
                            handler.role,
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
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }

        if (handler.role !== HandlerRole.INPUT) {
            throw new Error(`Handler "${name}" is not an input handler`);
        }

        try {
            const result = await handler.execute(data);

            if (result) {
                return await this.runAutonomousFlow(
                    result,
                    handler.name,
                );
            }
            return [];
        } catch (error) {
            this.logger.error(
                "dispatchToInput Error",
                `dispatchToInput Error: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }

    public async processContent(
        content: any,
        source: string,
    ): Promise<ProcessedResult[]> {
        if (Array.isArray(content)) {
            const allResults: ProcessedResult[] = [];
            for (const item of content) {
                await new Promise((resolve) => setTimeout(resolve, 5000)); // TODO: why?
                const result = await this.processContentItem(
                    item,
                    source,
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
        );
        return singleResult ? [singleResult] : [];
    }

    private async processContentItem(
        content: any,
        source: string,
    ): Promise<ProcessedResult | null> {
        let memories: Memory[] = [];

        if (content.room) {
            const hasProcessed = await this.roomManager
                .hasProcessedContentInRoom(
                    content.contentId,
                    content.room,
                );

            if (hasProcessed) {
                this.logger.debug(
                    "Orchestrator.processContent",
                    "Content already processed",
                    {
                        contentId: content.contentId,
                        roomId: content.room,
                    },
                );
                return null;
            }
            const room = await this.roomManager.ensureRoom(
                content.room,
                source,
            );
            memories = await this.roomManager.getMemoriesFromRoom(room.id);

            this.logger.debug(
                "Orchestrator.processContent",
                "Processing content with context",
                {
                    content,
                    source,
                    roomId: room.id,
                    relevantMemories: memories,
                },
            );
        }

        const processor = Array.from(this.processors.values()).find((p) =>
            p.canHandle(content)
        );

        if (!processor) {
            this.logger.debug(
                "Orchestrator.processContent",
                "No suitable processor found for content",
                { content },
            );
            return null;
        }

        const availableOutputs = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.OUTPUT,
        );

        const availableActions = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.ACTION,
        );

        const result = await processor.process(
            content,
            JSON.stringify(memories),
            {
                availableOutputs,
                availableActions,
            },
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
                },
            );

            // Mark the content as processed
            await this.roomManager.markContentAsProcessed(
                content.contentId,
                content.room,
            );
        }

        return result;
    }
}
