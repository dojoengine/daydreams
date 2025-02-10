import { type LanguageModelV1 } from "ai";
import { z } from "zod";
import type { PlanningSystem } from "./planning";

/** Represents a task with text content and completion status */
export type Task = {
    text: string;
    complete: boolean;
};

/** Represents an execution chain with experts and metadata */
export type Chain = {
    id: string;
    thinking: string;
    purpose: string;
    experts: { name: string; data: string }[];
};

/** Interface for storing and retrieving memory data */
export interface MemoryStore {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

/** Working memory structure containing conversation history and execution state */
export type WorkingMemory = {
    inputs: InputRef[];
    outputs: OutputRef[];
    thoughts: Thought[];
    calls: ActionCall[];
    results: ActionResult[];
    chains: Chain[];
};

/** 
 * Represents an action that can be executed with typed parameters
 * @template Schema - Zod schema defining parameter types
 * @template Result - Return type of the action
 * @template Context - Context type for the action execution
 */
export type Action<
    Schema extends z.AnyZodObject = z.AnyZodObject,
    Result = any,
    Context = any,
> = {
    name: string;
    description?: string;
    params: Schema;
    handler: (params: z.infer<Schema>, ctx: Context) => Promise<Result>;
};

/**
 * Represents an output handler with validation
 * @template Schema - Zod schema for output parameters
 * @template Context - Context type for output handling
 */
export type Output<
    Schema extends z.AnyZodObject = z.AnyZodObject,
    Context = any,
> = {
    type: string;
    description: string;
    params: Schema;
    handler: (
        params: z.infer<Schema>,
        ctx: Context
    ) => Promise<boolean> | boolean;
};

/**
 * Represents an input handler with validation and subscription capability
 * @template Schema - Zod schema for input parameters
 * @template Context - Context type for input handling
 */
export type Input<
    Schema extends z.AnyZodObject = z.AnyZodObject,
    Context = any,
> = {
    type: string;
    description?: string;
    schema: Schema;
    handler: (
        params: z.infer<Schema>,
        ctx: Context
    ) => Promise<boolean> | boolean;
    subscribe?: (
        send: (conversationId: string, data: z.infer<Schema>) => void
    ) => () => void;
};

/** Reference to an input event in the system */
export type InputRef = {
    ref: "input";
    type: string;
    data: any;
    params?: Record<string, string>;
    timestamp: number;
    processed?: boolean;
};

/** Reference to an output event in the system */
export type OutputRef = {
    ref: "output";
    type: string;
    data: any;
    params?: Record<string, string>;
    timestamp: number;
};

/** Represents a call to an action */
export type ActionCall<Data = any> = {
    ref: "action_call";
    id: string;
    name: string;
    data: Data;
    timestamp: number;
};

/** Represents the result of an action execution */
export type ActionResult<Data = any> = {
    ref: "action_result";
    callId: string;
    name: string;
    data: Data;
    timestamp: number;
    processed?: boolean;
};

/** Represents a thought or reasoning step */
export type Thought = {
    ref: "thought";
    content: string;
    timestamp: number;
};

/** Union type of all possible log entries */
type Log = InputRef | OutputRef | Thought | ActionCall | ActionResult;

/** Properties required for Chain-of-Thought execution */
export type COTProps = {
    model: LanguageModelV1;
    plan: string;
    inputs: InputRef[];
    actions: Action[];
    outputs: Output[];
    logs: Log[];
};

/** Response structure from Chain-of-Thought execution */
export type COTResponse = {
    plan: string[];
    actions: ActionCall[];
    outputs: OutputRef[];
    thinking: Thought[];
};

/** Represents an XML element structure */
export type XMLElement = {
    tag: string;
    params?: Record<string, string>;
    content: string | (XMLElement | string)[];
};

/** Utility type to preserve type information */
export type Pretty<type> = { [key in keyof type]: type[key] } & unknown;

/** 
 * Extracts variable names from a template string
 * @template T - Template string type
 */
export type ExtractTemplateVariables<T extends string> =
    T extends `${infer Start}{{${infer Var}}}${infer Rest}`
    ? Var | ExtractTemplateVariables<Rest>
    : never;

/**
 * Creates a type mapping template variables to string values
 * @template T - Template string type
 */
export type TemplateVariables<T extends string> = Pretty<{
    [K in ExtractTemplateVariables<T>]: string;
}>;

/** Represents an expert system with instructions and actions */
export type Expert<Context = any> = {
    type: string;
    description: string;
    instructions: string;
    model?: LanguageModelV1;
    actions?: Action<any, any, Context>[];
};

/** Base context interface for agents */
export interface AgentContext {
    conversationId: string;
    memory: WorkingMemory;
    planning?: PlanningSystem; // Make optional for backward compatibility
}

/** Interface defining an agent's capabilities and structure */
export interface Agent<Context extends AgentContext = AgentContext> {
    memory: MemoryStore;
    inputs: Record<string, InputConfig<any, Context>>;
    outputs: Record<string, Omit<Output<any, Context>, "type">>;
    events: Record<string, z.AnyZodObject>;
    experts: Record<string, ExpertConfig<Context>>;
    actions: Action<any, any, Context>[];
    emit: (...args: any[]) => void;
    run: (conversationId: string) => Promise<void>;
    send: (
        conversationId: string,
        input: { type: string; data: any }
    ) => Promise<void>;
    evaluator: (ctx: Context) => Promise<void>;
}

/** Configuration type for agent initialization */
export type Config<Context extends AgentContext = AgentContext> = {
    memory: MemoryStore;
    inputs: Record<string, InputConfig<any, Context>>;
    outputs: Record<string, OutputConfig<any, Context>>;
    events: Record<string, z.AnyZodObject>;
    experts: Record<string, ExpertConfig<Context>>;
    actions: Action<any, any, Context>[];
    model: LanguageModelV1;
    logger: LogLevel;
};

/** Configuration type for inputs without type field */
export type InputConfig<
    T extends z.AnyZodObject = z.AnyZodObject,
    Context = any,
> = Omit<Input<T, Context>, "type">;

/** Configuration type for outputs without type field */
export type OutputConfig<
    T extends z.AnyZodObject = z.AnyZodObject,
    Context = any,
> = Omit<Output<T, Context>, "type">;

/** Configuration type for experts without type field */
export type ExpertConfig<Context = any> = Omit<Expert<Context>, "type">;

/** Function type for subscription cleanup */
export type Subscription = () => void;

/** Enum defining available log levels */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

/** Interface for custom log writers */
export interface LogWriter {
    init(logPath: string): void;
    write(data: string): void;
}

/** Configuration options for logging */
export interface LoggerConfig {
    level: LogLevel;
    enableTimestamp?: boolean;
    enableColors?: boolean;
    logToFile?: boolean;
    logPath?: string;
    logWriter?: LogWriter;
}

/** Structure of a log entry */
export interface LogEntry {
    level: LogLevel;
    timestamp: Date;
    context: string;
    message: string;
    data?: any;
}

/** Results from a research operation */
export interface ResearchResult {
    learnings: string[];
    visitedUrls: string[];
}

/** Configuration for research operations */
export interface ResearchConfig {
    query: string;
    breadth: number;
    depth: number;
    learnings?: string[];
    visitedUrls?: string[];
}


export interface IChain {
    /**
     * A unique identifier for the chain (e.g., "starknet", "ethereum", "solana", etc.)
     */
    chainId: string;

    /**
     * Read (call) a contract or perform a query on this chain.
     * The `call` parameter can be chain-specific data.
     */
    read(call: unknown): Promise<any>;

    /**
     * Write (execute a transaction) on this chain, typically requiring signatures, etc.
     */
    write(call: unknown): Promise<any>;
}