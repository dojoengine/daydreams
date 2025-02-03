import { Logger } from "./logger";
import type { BaseProcessor } from "./processor";
import type { Memory, ProcessableContent, ProcessedResult } from "./types";
import { HandlerRole, LogLevel, type LoggerConfig } from "./types";
import type { IOHandler } from "./types";
import type { FlowLifecycle } from "./life-cycle";

export class Orchestrator {
    /**
     * Unified collection of IOHandlers (both input & output), keyed by name.
     */
    private readonly ioHandlers = new Map<string, IOHandler>();

    /**
     * Logger instance for logging messages and errors.
     */
    private readonly logger: Logger;

    /**
     * Map of unsubscribe functions for various handlers, keyed by handler name.
     */
    private unsubscribers = new Map<string, () => void>();

    constructor(
        private processor: BaseProcessor,
        private readonly flowHooks: FlowLifecycle,
        config?: LoggerConfig
    ) {
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
     * Registers an IOHandler (input or output). For input handlers with a subscribe method,
     * registers the subscription and stores its unsubscriber.
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
                await this.run(data, handler.name);
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
     * Removes a handler (input or output) by name and stops its scheduling if needed.
     */
    public removeIOHandler(name: string): void {
        const unsub = this.unsubscribers.get(name);
        if (unsub) {
            unsub(); // E.g. remove event listeners, clear intervals, etc.
            this.unsubscribers.delete(name);
        }

        this.ioHandlers.delete(name);

        this.logger.info("Orchestrator.removeIOHandler", "Removed IOHandler", {
            name,
        });
    }

    /**
     * Dispatches data to a registered *output* handler by name.
     */
    public async dispatchToOutput<T>(
        name: string,
        data: ProcessableContent
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler || !handler.execute) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }
        if (handler.role !== HandlerRole.OUTPUT) {
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
                { name, error }
            );
            throw error;
        }
    }

    /**
     * Dispatches data to a registered *action* handler by name.
     */
    public async dispatchToAction<T>(
        name: string,
        data: ProcessableContent
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler || !handler.execute) {
            throw new Error(`No IOHandler registered with name: ${name}`);
        }
        if (handler.role !== HandlerRole.ACTION) {
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
                }
            );
            return result;
        } catch (error) {
            this.logger.error(
                "Orchestrator.dispatchToAction",
                "Handler threw an error",
                { name, error }
            );
            throw error;
        }
    }

    /**
     * Dispatches data to a registered *input* handler by name, then continues through the autonomous flow.
     */
    public async dispatchToInput<T>(
        name: string,
        data: ProcessableContent
    ): Promise<unknown> {
        const handler = this.ioHandlers.get(name);
        if (!handler) {
            throw new Error(`No IOHandler: ${name}`);
        }
        if (!handler.execute) {
            throw new Error(`Handler "${name}" has no execute method`);
        }
        if (handler.role !== HandlerRole.INPUT) {
            throw new Error(`Handler "${name}" is not role=input`);
        }

        try {
            const result = await handler.execute(data);
            if (result) {
                return await this.run(result, handler.name);
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
     * Main processing loop: feeds incoming data into the processing queue and
     * dispatches any suggested outputs or actions.
     *
     * @param data       The initial data or array of data to process.
     * @param sourceName The name of the IOHandler that provided this data.
     */
    private async run(
        data: ProcessableContent | ProcessableContent[],
        sourceName: string
    ): Promise<Array<{ name: string; data: any }>> {
        // Initialize the processing queue
        const queue: Array<{ data: ProcessableContent; source: string }> =
            Array.isArray(data)
                ? data.map((item) => ({ data: item, source: sourceName }))
                : [{ data, source: sourceName }];

        const collectedOutputs: Array<{ name: string; data: any }> = [];

        while (queue.length > 0) {
            const currentItem = queue.shift()!;
            const outputs = await this.processQueueItem(currentItem, queue);
            collectedOutputs.push(...outputs);
        }

        return collectedOutputs;
    }

    /**
     * Processes one queue item:
     *  - Starts a conversation flow.
     *  - Processes the content.
     *  - Dispatches any suggested outputs or actions.
     *
     * @param item  The queue item containing the data and its source.
     * @param queue The current processing queue (to which new items may be added).
     */
    private async processQueueItem(
        item: { data: ProcessableContent; source: string },
        queue: Array<{ data: ProcessableContent; source: string }>
    ): Promise<Array<{ name: string; data: any }>> {
        const { data, source } = item;
        const outputs: Array<{ name: string; data: any }> = [];

        // Start the conversation/flow.
        const chatId = await this.flowHooks.onFlowStart(
            data.userId,
            data.platformId,
            data.threadId,
            data.data
        );

        await this.flowHooks.onFlowStep(
            chatId,
            HandlerRole.INPUT,
            source,
            data
        );

        // Process the content.
        const processedResults = await this.processContent(data, source);
        if (!processedResults?.length) {
            return outputs;
        }

        // Handle each processed result.
        for (const result of processedResults) {
            if (result.alreadyProcessed) {
                continue;
            }

            // Schedule any tasks if present.
            if (result.updateTasks?.length) {
                await this.flowHooks.onTasksScheduled(
                    data.userId,
                    result.updateTasks.map((task) => ({
                        name: task.name,
                        data: task.data,
                        intervalMs: task.intervalMs,
                    }))
                );
            }

            // Process any suggested outputs or actions.
            for (const suggestion of result.suggestedOutputs ?? []) {
                const handler = this.ioHandlers.get(suggestion.name);
                if (!handler) {
                    this.logger.warn(
                        "Orchestrator.processQueueItem",
                        `No handler found for suggested output: ${suggestion.name}`
                    );
                    continue;
                }

                switch (handler.role) {
                    case HandlerRole.OUTPUT:
                        outputs.push({
                            name: suggestion.name,
                            data: suggestion.data,
                        });
                        await this.dispatchToOutput(
                            suggestion.name,
                            suggestion.data
                        );
                        await this.flowHooks.onFlowStep(
                            chatId,
                            HandlerRole.OUTPUT,
                            suggestion.name,
                            suggestion.data
                        );
                        break;

                    case HandlerRole.ACTION: {
                        const actionResult = await this.dispatchToAction(
                            suggestion.name,
                            suggestion.data
                        );
                        await this.flowHooks.onFlowStep(
                            chatId,
                            HandlerRole.ACTION,
                            suggestion.name,
                            { input: suggestion.data, result: actionResult }
                        );
                        if (actionResult) {
                            const newItems = Array.isArray(actionResult)
                                ? actionResult
                                : [actionResult];
                            for (const newItem of newItems) {
                                queue.push({
                                    data: newItem,
                                    source: suggestion.name,
                                });
                            }
                        }
                        break;
                    }

                    default:
                        this.logger.warn(
                            "Orchestrator.processQueueItem",
                            "Suggested output has an unrecognized role",
                            handler.role
                        );
                }
            }
        }

        return outputs;
    }

    /**
     * Processes content by handling both single items and arrays.
     * A small delay is introduced for each item (if processing an array).
     */
    public async processContent(
        content: ProcessableContent | ProcessableContent[],
        source: string
    ): Promise<ProcessedResult[]> {
        if (Array.isArray(content)) {
            const allResults: ProcessedResult[] = [];
            for (const item of content) {
                await this.delay(5000); // Example delay; remove if not needed.
                const result = await this.processContentItem(item, source);
                if (result) {
                    allResults.push(result);
                }
            }
            return allResults;
        }

        const singleResult = await this.processContentItem(content, source);
        return singleResult ? [singleResult] : [];
    }

    /**
     * Processes a single content item:
     *  - Retrieves conversation context and prior memories.
     *  - Passes the item to the processor.
     *  - Updates conversation and memory.
     */
    private async processContentItem(
        content: ProcessableContent,
        source: string
    ): Promise<ProcessedResult | null> {
        let memories: { memories: Memory[] } = { memories: [] };

        const conversation = await this.flowHooks.onConversationCreated(
            content.userId,
            content.threadId,
            source
        );

        if (content.threadId && content.userId) {
            memories = await this.flowHooks.onMemoriesRequested(
                conversation.id
            );

            this.logger.debug(
                "Orchestrator.processContentItem",
                "Processing content with context",
                {
                    content,
                    source,
                    conversationId: conversation.id,
                    userId: content.userId,
                    relevantMemories: memories,
                }
            );
        }

        // Collect available outputs and actions.
        const availableOutputs = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.OUTPUT
        );
        const availableActions = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.ACTION
        );

        // Process the content.
        const result = await this.processor.process(
            content,
            JSON.stringify(memories),
            {
                availableOutputs,
                availableActions,
            }
        );

        // Save memory and update the conversation.
        await this.flowHooks.onMemoryAdded(
            conversation.id,
            JSON.stringify(result.content),
            source,
            {
                ...result.metadata,
                ...result.enrichedContext,
            }
        );

        this.logger.debug(
            "Orchestrator.processContentItem",
            "Updating conversation",
            {
                conversationId: conversation.id,
                contentId: content.contentId,
                threadId: content.threadId,
                userId: content.userId,
                result,
            }
        );

        await this.flowHooks.onConversationUpdated(
            content.contentId,
            conversation.id,
            JSON.stringify(result.content),
            source,
            result.metadata
        );

        return result;
    }

    /**
     * A helper method to introduce a delay.
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
