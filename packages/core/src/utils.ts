import { z } from "zod";
import type {
  Action,
  Agent,
  AgentContext,
  AnyAgent,
  AnyContext,
  Config,
  Context,
  Evaluator,
  ExpertConfig,
  Extension,
  InferMemoryData,
  InputConfig,
  Memory,
  OutputConfig,
  OutputResponse,
  OutputSchema,
  TemplateVariables,
  WorkingMemory,
} from "./types";

/**
 * Renders a template string by replacing variables with provided values
 * @template Template - The template string type containing variables in {{var}} format
 * @param str - The template string to render
 * @param data - Object containing values for template variables
 * @returns The rendered string with variables replaced
 */
export function render<Template extends string>(
  str: Template,
  data: TemplateVariables<Template>
) {
  return str
    .trim()
    .replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
      formatValue(data[key as keyof typeof data] ?? "")
    );
}

/**
 * Formats a value for template rendering
 * @param value - The value to format
 * @returns Formatted string representation of the value
 */
export function formatValue(value: any): string {
  if (Array.isArray(value)) return value.map((t) => formatValue(t)).join("\n");
  if (typeof value !== "string") return JSON.stringify(value);
  return value.trim();
}

/**
 * Creates an input configuration
 * @template Schema - Zod schema type for input validation
 * @template Context - Context type for input handling
 * @param config - Input configuration object
 * @returns Typed input configuration
 */
export function input<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  Context extends AgentContext<WorkingMemory, AnyContext> = AgentContext<
    WorkingMemory,
    AnyContext
  >,
  TAgent extends Agent<any, any> = Agent<any, any>,
>(config: InputConfig<Schema, Context, TAgent>) {
  return config;
}

/**
 * Creates an action configuration
 * @template Schema - Zod schema type for action parameters
 * @template Result - Return type of the action
 * @template Context - Context type for action execution
 * @param action - Action configuration object
 * @returns Typed action configuration
 */
export function action<
  Schema extends z.AnyZodObject = z.AnyZodObject,
  Result = any,
  Context extends AgentContext<any, AnyContext> = AgentContext<any, AnyContext>,
  TAgent extends AnyAgent = AnyAgent,
  TMemory extends Memory<any> = never,
>(action: Action<Schema, Result, Context, TAgent, TMemory>) {
  return action;
}

/**
 * Creates an evaluator configuration
 * @template Schema - Zod schema type for evaluator validation
 * @template Context - Context type for evaluator execution
 * @param config - Evaluator configuration object
 * @returns Typed evaluator configuration
 */
export function evaluator<
  Data = any,
  Schema extends z.AnyZodObject = z.AnyZodObject,
  Context extends AgentContext<any, any> = AgentContext<any, any>,
  TAgent extends AnyAgent = AnyAgent,
>(config: Evaluator<Data, Schema, Context, TAgent>) {
  return config;
}

/**
 * Creates an output configuration
 * @template Schema - Zod schema type for output validation
 * @template Context - Context type for output handling
 * @param config - Output configuration object
 * @returns Typed output configuration
 */
export function output<
  Schema extends OutputSchema = OutputSchema,
  Context extends AgentContext<any, any> = AgentContext<any, any>,
  TResponse extends OutputResponse = OutputResponse,
>(config: OutputConfig<Schema, Context, TResponse>) {
  return config;
}

/**
 * Creates an expert configuration
 * @template Context - Context type for expert execution
 * @param config - Expert configuration object
 * @returns Typed expert configuration
 */
export function expert(config: ExpertConfig) {
  return config;
}

/**
 * Options for text chunking
 */
type ChunkOptions = {
  maxChunkSize: number;
};

/**
 * Splits text into chunks based on maximum chunk size
 * @param text - The text to split into chunks
 * @param options - Chunking options including maximum chunk size
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(
  text: string,
  options: ChunkOptions
): string[] {
  const { maxChunkSize } = options;
  const lines = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const line of lines) {
    // If adding this line would exceed maxChunkSize, start a new chunk
    if (currentChunk.length + line.length + 1 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line;
    } else {
      // Add line to current chunk with a newline
      currentChunk = currentChunk ? currentChunk + "\n" + line : line;
    }
  }

  // Don't forget to add the last chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Creates a memory configuration
 * @template Data - Type of data stored in memory
 * @param memory - Memory configuration object
 * @returns Typed memory configuration
 */
export function memory<Data = any>(memory: Memory<Data>) {
  return memory;
}

export function extension<
  Contexts extends Record<string, AnyContext> = Record<string, AnyContext>,
>(config: Extension<AnyContext, Contexts>) {
  return config;
}
