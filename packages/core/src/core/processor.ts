// processor.ts

import { Logger } from "./logger";
import { LogLevel, type Character, type ProcessedResult } from "./types";
import type { IOHandler, ProcessableContent } from "./types";

export abstract class BaseProcessor {
    /** Logger instance for this processor */
    protected logger: Logger;
    /** Map of child processors (sub-processors) that this processor can delegate to */
    public processors: Map<string, BaseProcessor> = new Map();

    constructor(
        protected metadata: { name: string; description: string },
        protected loggerLevel: LogLevel,
        protected character: Character,
        protected llmClient: any, // your LLM client type
        protected contentLimit: number = 1000
    ) {
        this.logger = new Logger({
            level: loggerLevel,
            enableColors: true,
            enableTimestamp: true,
        });
    }

    /**
     * Gets the name of this processor
     */
    public getName(): string {
        return this.metadata.name;
    }

    /**
     * Gets the description of this processor
     */
    public getDescription(): string {
        return this.metadata.description;
    }

    /**
     * Determines if this processor can handle the given content.
     */
    public abstract canHandle(content: any): boolean;

    /**
     * Processes the given content and returns a result.
     */
    public abstract process(
        content: ProcessableContent,
        otherContext: string,
        ioContext?: {
            availableOutputs?: IOHandler[];
            availableActions?: IOHandler[];
        }
    ): Promise<ProcessedResult>;

    /**
     * Adds one or more child processors to this processor
     */
    public addProcessor(processors: BaseProcessor | BaseProcessor[]): this {
        const toAdd = Array.isArray(processors) ? processors : [processors];

        for (const processor of toAdd) {
            const name = processor.getName();
            if (this.processors.has(name)) {
                throw new Error(`Processor with name '${name}' already exists`);
            }
            this.processors.set(name, processor);
        }
        return this;
    }

    /**
     * Gets a child processor by name
     */
    public getProcessor(name: string): BaseProcessor | undefined {
        return this.processors.get(name);
    }
}
