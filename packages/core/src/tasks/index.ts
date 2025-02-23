import {
  smoothStream,
  streamText,
  type LanguageModelV1,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import { parse, prompt, resultsPrompt, wrapStream } from "../prompts/main";
import { task, type TaskContext } from "../task";
import { formatContext, formatContexts } from "../formatters";
import { defaultContextRender } from "../context";
import type {
  ActionCall,
  AgentContext,
  AnyAction,
  AnyAgent,
  AnyContext,
  ContextState,
  InferContextMemory,
  Log,
  Output,
  WorkingMemory,
} from "../types";
import type { Logger } from "../logger";

function prepareStreamResponse({
  stream,
  logger,
  contextId,
  step,
  task: { callId, debug },
}: {
  contextId: string;
  step: string;
  stream: StreamTextResult<ToolSet, never>;
  logger: Logger;
  task: TaskContext;
}) {
  const response = new Promise<ReturnType<typeof parse>>(
    async (resolve, reject) => {
      try {
        const result = await stream.text;
        const text = "<think>" + result + "</response>";

        debug(contextId, [step, callId], text);

        logger.debug("agent:response", text, {
          contextId,
          callId,
        });

        resolve(parse(text));
      } catch (error) {
        reject(error);
      }
    }
  );

  return {
    response,
    stream: wrapStream(stream.textStream, "<think>", "</response>"),
  };
}

export const runGenerate = task(
  "agent:run:generate",
  async (
    {
      contexts,
      workingMemory,
      outputs,
      actions,
      logger,
      model,
      contextId,
    }: {
      agent: AnyAgent;
      contexts: ContextState<AnyContext>[];
      contextId: string;
      workingMemory: WorkingMemory;
      outputs: Output[];
      actions: AnyAction[];
      logger: Logger;
      model: LanguageModelV1;
    },
    { callId, debug }: TaskContext
  ) => {
    debug(
      contextId,
      ["workingMemory", callId],
      JSON.stringify(workingMemory, null, 2)
    );

    const mainContext = contexts.find((ctx) => ctx.id === contextId)!;

    const system = prompt({
      context: formatContexts(contextId, contexts, workingMemory),
      outputs,
      actions,
      updates: formatContext({
        type: mainContext.context.type,
        key: mainContext.key,
        content: defaultContextRender({
          memory: {
            inputs: workingMemory.inputs.filter((i) => i.processed !== true),
            results: workingMemory.results.filter((i) => i.processed !== true),
          },
        }),
      }),
    });

    debug(contextId, ["prompt", callId], system);

    logger.debug("agent:system", system);

    const stream = streamText({
      model,
      messages: [
        {
          role: "user",
          content: system,
        },
        {
          role: "assistant",
          content: "<think>",
        },
      ],
      stopSequences: ["</response>"],
      temperature: 0.6,
      experimental_transform: smoothStream({
        chunking: "word",
      }),
    });

    return prepareStreamResponse({
      step: "response",
      contextId,
      logger,
      stream,
      task: { callId, debug },
    });
  }
);

export const runGenerateResults = task(
  "agent:run:generate-results",
  async (
    {
      contexts,
      workingMemory,
      outputs,
      actions,
      logger,
      model,
      contextId,
      chain,
    }: {
      agent: AnyAgent;
      contexts: ContextState<AnyContext>[];
      contextId: string;
      workingMemory: WorkingMemory;
      outputs: Output[];
      actions: AnyAction[];
      logger: Logger;
      model: LanguageModelV1;
      chain: Log[];
    },
    { callId, debug }: TaskContext
  ) => {
    debug(
      contextId,
      ["workingMemory", callId],
      JSON.stringify(workingMemory, null, 2)
    );

    const mainContext = contexts.find((ctx) => ctx.id === contextId)!;

    const system = resultsPrompt({
      context: formatContexts(contextId, contexts, workingMemory),
      outputs,
      actions,
      updates: formatContext({
        type: mainContext.context.type,
        key: mainContext.key,
        content: defaultContextRender({
          memory: {
            inputs: workingMemory.inputs.filter((i) => i.processed !== true),
          },
        }),
      }),
      logs: chain.filter((i) =>
        i.ref === "action_result" ? i.processed === true : true
      ),
      results: workingMemory.results.filter((i) => i.processed !== true),
    });

    workingMemory.results.forEach((i) => {
      i.processed = true;
    });

    debug(contextId, ["prompt-results", callId], system);

    logger.debug("agent:system", system, {
      contextId,
      callId,
    });

    const stream = streamText({
      model,
      messages: [
        {
          role: "user",
          content: system,
        },
        {
          role: "assistant",
          content: "<think>",
        },
      ],
      stopSequences: ["</response>"],
      temperature: 0.6,
      experimental_transform: smoothStream({
        chunking: "word",
      }),
    });

    return prepareStreamResponse({
      step: "results-response",
      contextId,
      logger,
      stream,
      task: { callId, debug },
    });
  }
);

export const runAction = task(
  "agent:run:action",
  async <TContext extends AnyContext>({
    ctx,
    action,
    call,
    agent,
    logger,
  }: {
    ctx: AgentContext<InferContextMemory<TContext>, TContext> & {
      actionMemory: unknown;
      agentMemory?: unknown;
    };
    action: AnyAction;
    call: ActionCall;
    agent: AnyAgent;
    logger: Logger;
  }) => {
    try {
      logger.info(
        "agent:action_call:" + call.id,
        call.name,
        JSON.stringify(call.data)
      );
      const result = await action.handler(call, ctx, agent);
      logger.info("agent:action_resull:" + call.id, call.name, result);
      return result;
    } catch (error) {
      logger.error("agent:action", "ACTION_FAILED", { error });
      throw error;
    }
  }
);
