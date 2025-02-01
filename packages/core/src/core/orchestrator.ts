import { Logger } from "./logger";
import type { BaseProcessor } from "./processor";
import type { Memory, ProcessableContent, ProcessedResult } from "./types";
import { HandlerRole, LogLevel, type LoggerConfig } from "./types";
import type { IOHandler } from "./types";
import type { FlowLifecycle } from "./life-cycle";

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
     * Map of unsubscribe functions for various handlers.
     * Keyed by handler name.
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

                await this.runAutonomousFlow(data, handler.name);
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
        data: ProcessableContent
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
        data: ProcessableContent
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
        data: ProcessableContent
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
                return await this.runAutonomousFlow(result, handler.name);
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
     * Processes incoming data through the system and manages any follow-on
     * "action" or "output" suggestions in a queue.
     *
     * @param data    The data payload to be processed
     * @param sourceName     The name of the IOHandler that provided this data
     */
    private async runAutonomousFlow(
        data: ProcessableContent | ProcessableContent[],
        sourceName: string
    ): Promise<Array<{ name: string; data: any }>> {
        // Prepare the processing queue
        const queue: Array<{ data: ProcessableContent; source: string }> =
            Array.isArray(data)
                ? data.map((item) => ({ data: item, source: sourceName }))
                : [{ data: data, source: sourceName }];

        // Initialize an array to collect outputs
        const outputs: Array<{ name: string; data: any }> = [];

        // Process the queue until empty
        while (queue.length > 0) {
            const { data, source } = queue.shift()!;

            // Starts the chat
            const chatId = await this.flowHooks.onFlowStart(
                data.userId,
                data.platformId,
                data.threadId,
                data.data
            );

            // process the input as a step - recording the input
            await this.flowHooks.onFlowStep(
                chatId,
                HandlerRole.INPUT,
                source,
                data
            );

            // Main content processing
            const processedResults = await this.processContent(data, source);

            if (!processedResults?.length) {
                continue;
            }

            // Handle each processed result
            for (const result of processedResults) {
                if (result.alreadyProcessed) {
                    continue;
                }

                // Schedule tasks if present
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

                // Dispatch suggested outputs or actions
                for (const output of result.suggestedOutputs ?? []) {
                    const handler = this.ioHandlers.get(output.name);

                    if (!handler) {
                        this.logger.warn(
                            "Orchestrator.runAutonomousFlow",
                            `No handler found for suggested output: ${output.name}`
                        );
                        continue;
                    }

                    // Depending on the handler role, dispatch appropriately
                    switch (handler.role) {
                        case HandlerRole.OUTPUT:
                            outputs.push({
                                name: output.name,
                                data: output.data,
                            });

                            await this.dispatchToOutput(
                                output.name,
                                output.data
                            );

                            await this.flowHooks.onFlowStep(
                                chatId,
                                HandlerRole.OUTPUT,
                                output.name,
                                output.data
                            );

                            await this.flowHooks.onOutputDispatched(
                                chatId,
                                output.name,
                                output.data
                            );

                            break;

                        case HandlerRole.ACTION:
                            const actionResult = await this.dispatchToAction(
                                output.name,
                                output.data
                            );

                            await this.flowHooks.onFlowStep(
                                chatId,
                                HandlerRole.ACTION,
                                output.name,
                                { input: output.data, result: actionResult }
                            );

                            await this.flowHooks.onActionDispatched(
                                chatId,
                                output.name,
                                output.data,
                                actionResult
                            );

                            // Queue any new data returned from the action
                            if (actionResult) {
                                const newItems = Array.isArray(actionResult)
                                    ? actionResult
                                    : [actionResult];
                                for (const item of newItems) {
                                    queue.push({
                                        data: item,
                                        source: output.name,
                                    });
                                }
                            }
                            break;

                        default:
                            this.logger.warn(
                                "Orchestrator.runAutonomousFlow",
                                "Suggested output has an unrecognized role",
                                handler.role
                            );
                    }
                }
            }
        }

        // Return all collected outputs
        return outputs;
    }

    /**
     * Processes *any* content by splitting it into items (if needed) and
     * calling the single-item processor.
     */
    public async processContent(
        content: ProcessableContent | ProcessableContent[],
        source: string
    ): Promise<ProcessedResult[]> {
        if (Array.isArray(content)) {
            const allResults: ProcessedResult[] = [];
            for (const item of content) {
                // Example delay: remove if not needed
                await new Promise((resolve) => setTimeout(resolve, 5000));
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
     * Process a single item:
     *  - Retrieves prior memories from its conversation
     *  - Passes it to the main (or "master") processor
     *  - Saves result to memory & marks processed if relevant
     */
    private async processContentItem(
        content: ProcessableContent,
        source: string
    ): Promise<ProcessedResult | null> {
        let memories: {
            memories: Memory[];
        } = { memories: [] };

        const conversation = await this.flowHooks.onConversationCreated(
            content.userId,
            content.threadId,
            source
        );

        if (content.threadId && content.userId) {
            // Ensure the conversation exists
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

        // Gather possible outputs & actions
        const availableOutputs = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.OUTPUT
        );
        const availableActions = Array.from(this.ioHandlers.values()).filter(
            (h) => h.role === HandlerRole.ACTION
        );

        // Processor main entry point
        const result = await this.processor.process(
            content,
            JSON.stringify(memories),
            {
                availableOutputs,
                availableActions,
            }
        );

        // Save the memory
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

        // Update the conversation
        await this.flowHooks.onConversationUpdated(
            content.contentId,
            conversation.id,
            JSON.stringify(result.content),
            source,
            result.metadata
        );

        return result;
    }
}
