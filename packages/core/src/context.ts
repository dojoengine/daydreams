import { z } from "zod";
import type { Context, WorkingMemory } from "./types";
import { formatContextLog } from "./formatters";
import { memory } from "./utils";

/**
 * Creates a context configuration
 * @template Memory - Type of working memory
 * @template Args - Zod schema type for context arguments
 * @template Ctx - Type of context data
 * @template Exports - Type of exported data
 * @param ctx - Context configuration object
 * @returns Typed context configuration
 */

export function context<
  Memory = any,
  Args extends z.ZodTypeAny = z.ZodTypeAny,
  Ctx = any,
  Exports = any,
>(
  ctx: Context<Memory, Args, Ctx, Exports>
): Context<Memory, Args, Ctx, Exports> {
  return ctx;
}

export function getWorkingMemoryLogs(
  memory: Partial<WorkingMemory>,
  includeThoughts = true
) {
  return [
    ...(memory.inputs ?? []),
    ...(memory.outputs ?? []),
    ...(memory.calls ?? []),
    ...((includeThoughts ? memory.thoughts : undefined) ?? []),
    ...(memory.results ?? []),
  ].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
}

export function defaultContextRender({
  memory,
}: {
  memory: Partial<WorkingMemory>;
}) {
  return getWorkingMemoryLogs(memory, false)
    .map((i) => formatContextLog(i))
    .flat();
}

export function createDefaultContextMemory(): WorkingMemory {
  return {
    inputs: [],
    outputs: [],
    thoughts: [],
    calls: [],
    results: [],
  };
}

export const defaultWorkingMemory = memory<WorkingMemory>({
  key: "working-memory",
  create: createDefaultContextMemory,
});

export const defaultContext = context({
  type: "default",
  schema: z.string(),
  key: (key) => key,
  create(state) {
    return {
      test: true,
    };
  },
  // render: defaultContextRender,
});
