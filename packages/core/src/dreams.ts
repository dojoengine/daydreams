import {
  LogLevel,
  type ActionCall,
  type ActionResult,
  type Agent,
  type AgentContext,
  type AnyAction,
  type AnyAgent,
  type AnyContext,
  type Config,
  type Context,
  type ContextState,
  type Debugger,
  type Evaluator,
  type Handlers,
  type Log,
  type Output,
  type OutputRef,
  type Subscription,
  type WorkingMemory,
} from "./types";
import { Logger } from "./logger";
import createContainer from "./container";
import { createServiceManager } from "./serviceProvider";
import { z } from "zod";
import { TaskRunner } from "./task";
import { handleStream, type StackElement } from "./prompts/main";
import { defaultWorkingMemory } from "./context";
import { createMemoryStore } from "./memory";
import { createPrompt } from "./prompt";
import { createMemory } from "./memory";
import { createVectorStore } from "./memory/base";
import { v7 as randomUUIDv7 } from "uuid";
import { runAction, runGenerate, runGenerateResults } from "./tasks";
import { generateObject } from "ai";

export function createDreams<
  Memory = any,
  TContext extends Context<Memory, any, any, any> = Context<
    Memory,
    any,
    any,
    any
  >,
>(config: Config<Memory, TContext>): Agent<Memory, TContext> {
  let booted = false;

  const inputSubscriptions = new Map<string, Subscription>();
  const contexts = new Map<string, { type: string; args?: any }>();
  const contextsRunning = new Set<string>();

  const {
    inputs = {},
    outputs = {},
    events = {},
    actions = [],
    experts = {},
    services = [],
    extensions = [],
    model,
    reasoningModel,
  } = config;

  const container = config.container ?? createContainer();

  const taskRunner = config.taskRunner ?? new TaskRunner(3);

  const logger = new Logger({
    level: config.logger ?? LogLevel.INFO,
    enableTimestamp: true,
    enableColors: true,
  });

  container.instance("logger", logger);

  const debug: Debugger = (...args) => {
    if (!config.debugger) return;
    try {
      config.debugger(...args);
    } catch {
      console.log("debugger failed");
    }
  };

  const serviceManager = createServiceManager(container);

  for (const service of services) {
    serviceManager.register(service);
  }

  for (const extension of extensions) {
    if (extension.inputs) Object.assign(inputs, extension.inputs);
    if (extension.outputs) Object.assign(outputs, extension.outputs);
    if (extension.events) Object.assign(events, extension.events);
    if (extension.actions) actions.push(...extension.actions);
    if (extension.services) services.push(...extension.services);
  }

  const agent: Agent<Memory, TContext> = {
    inputs,
    outputs,
    events,
    actions,
    experts,
    memory:
      config.memory ?? createMemory(createMemoryStore(), createVectorStore()),
    container,
    model,
    reasoningModel,
    taskRunner,
    debugger: debug,
    context: config.context ?? undefined,
    emit: (event: string, data: any) => {
      logger.info("agent:event", event, data);
    },

    async getContexts() {
      return Array.from(contexts.entries()).map(([id, { type, args }]) => ({
        id,
        type,
        args,
      }));
    },

    getContext(params) {
      return getContextState(agent, params.context, params.args);
    },

    getContextId(params) {
      return getContextId(params.context, params.args);
    },

    getWorkingMemory(contextId) {
      return getContextWorkingMemory(agent, contextId);
    },

    async start(args) {
      logger.info("agent:start", "booting", { args, booted });
      if (booted) return agent;

      booted = true;

      await serviceManager.bootAll();

      for (const extension of extensions) {
        if (extension.install) await extension.install(agent);
      }

      for (const [type, input] of Object.entries(agent.inputs)) {
        if (input.install) await Promise.resolve(input.install(agent));

        if (input.subscribe) {
          let subscription = input.subscribe((context, args, data) => {
            logger.info("agent", "input", { context, args, data });
            agent
              .send({
                context,
                input: { type, data },
                args,
              })
              .catch((err) => {
                logger.error("agent:input", "error", err);
              });
          }, agent);

          if (typeof subscription === "object") {
            subscription = await Promise.resolve(subscription);
          }

          if (subscription) inputSubscriptions.set(type, subscription);
        }
      }

      for (const output of Object.values(outputs)) {
        if (output.install) await Promise.resolve(output.install(agent));
      }

      for (const action of actions) {
        if (action.install) await Promise.resolve(action.install(agent));
      }

      if (agent.context) {
        const { id } = await getContextState(agent, agent.context, args);
        contexts.set(id, { type: agent.context.type, args });
        contexts.set("agent:context", { type: agent.context.type, args });
      }

      const savedContexts =
        await agent.memory.store.get<[string, { type: string; args?: any }][]>(
          "contexts"
        );

      if (savedContexts) {
        for (const [id, { type, args }] of savedContexts) {
          contexts.set(id, { type, args });
        }
      }

      return agent;
    },

    async stop() {},

    run: async ({ context, args, outputs, handlers }) => {
      if (!booted) throw new Error("Not booted");

      const ctxState = await getContextState(agent, context, args);

      contexts.set(ctxState.id, { type: context.type, args });

      await agent.memory.store.set<[string, { args?: any }][]>(
        "contexts",
        Array.from(contexts.entries())
      );

      if (contextsRunning.has(ctxState.id)) return [];
      contextsRunning.add(ctxState.id);

      const workingMemory = await getContextWorkingMemory(agent, ctxState.id);

      const contextOuputs: Output[] = Object.entries({
        ...agent.outputs,
        ...(outputs ?? {}),
      })
        .filter(([_, output]) =>
          output.enabled
            ? output.enabled({
                ...ctxState,
                context,
                workingMemory,
              })
            : true
        )
        .map(([type, output]) => ({
          type,
          ...output,
        }));

      const maxSteps = 5;
      let step = 1;

      const contextActions = await Promise.all(
        actions.map(async (action) => {
          let actionMemory: unknown = {};

          if (action.memory) {
            actionMemory =
              (await agent.memory.store.get(action.memory.key)) ??
              action.memory.create();
          }

          const enabled = action.enabled
            ? action.enabled({
                ...ctxState,
                context,
                workingMemory,
                actionMemory,
              })
            : true;

          return enabled ? action : undefined;
        })
      ).then((r) => r.filter((a) => !!a));

      const agentCtxState = agent.context
        ? await getContextState(
            agent,
            agent.context,
            contexts.get("agent:context")!.args
          )
        : undefined;

      logger.debug("agent:context", "agentCtxState", agentCtxState);

      const chain: Log[] = [];

      let hasError = false;

      let actionCalls: Promise<any>[] = [];

      const { state, handler } = createContextStreamHandler({
        agent,
        chain,
        actions: contextActions,
        actionCalls,
        agentCtxState,
        ctxState,
        handlers,
        logger,
        outputs: contextOuputs,
        taskRunner,
        workingMemory,
      });

      while (maxSteps > step) {
        const { stream, response } = await taskRunner.enqueueTask(
          step > 1 ? runGenerateResults : runGenerate,
          {
            agent,
            model: config.reasoningModel ?? config.model,
            contexts: [agentCtxState, ctxState].filter((t) => !!t),
            contextId: ctxState.id,
            actions: contextActions,
            outputs: contextOuputs,
            workingMemory,
            logger,
            chain,
          },
          {
            debug: agent.debugger,
          }
        );

        await handleStream(stream, state.index, handler);

        // const data = await response;
        // logger.debug("agent:parsed", "data", data);

        await Promise.allSettled(actionCalls);

        actionCalls.length = 0;

        await agent.memory.store.set(ctxState.id, ctxState.memory);
        // await agent.memory.vector.upsert(ctxState.id, []);

        if (agentCtxState) {
          await agent.memory.store.set(agentCtxState.id, agentCtxState.memory);
        }

        await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

        step++;

        if (hasError) continue;

        if (
          workingMemory.results.find((i) => i.processed === false) === undefined
        )
          break;
      }

      workingMemory.inputs.forEach((i) => {
        i.processed = true;
      });

      await agent.memory.store.set(ctxState.id, ctxState.memory);

      await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

      contextsRunning.delete(ctxState.id);

      return chain;
    },

    send: async (params) => {
      if (params.input.type in agent.inputs === false)
        throw new Error("invalid input");

      const {
        key,
        id: contextId,
        options,
        memory,
      } = await getContextState(
        agent,
        params.context,
        params.context.schema.parse(params.args)
      );

      const workingMemory = await getContextWorkingMemory(agent, contextId);

      const input = agent.inputs[params.input.type];
      const data = input.schema.parse(params.input.data);

      if (input.handler) {
        await input.handler(
          data,
          {
            type: params.context.type,
            key,
            memory,
            workingMemory,
            options,
          } as any,
          agent
        );
      } else {
        workingMemory.inputs.push({
          id: randomUUIDv7(),
          ref: "input",
          type: params.context.type,
          data,
          timestamp: Date.now(),
          formatted: input.format ? input.format(data) : undefined,
        });
      }

      await agent.evaluator({
        type: params.context.type,
        key,
        memory,
        options,
      } as any);

      await agent.memory.store.set(contextId, memory);
      await agent.memory.vector.upsert(contextId, [memory]);

      await saveContextWorkingMemory(agent, contextId, workingMemory);

      return await agent.run(params);
    },

    evaluator: async (ctx) => {
      const { id, memory } = ctx;
      logger.debug("agent:evaluator", "memory", memory);
    },
  };

  container.instance("agent", agent);

  return agent;
}

function getContextId<TContext extends AnyContext>(
  context: TContext,
  args: z.infer<TContext["schema"]>
) {
  const key = context.key ? context.key(args) : context.type;
  return context.key ? [context.type, key].join(":") : context.type;
}

async function getContextState<TContext extends AnyContext>(
  agent: AnyAgent,
  context: TContext,
  args: z.infer<TContext["schema"]>
): Promise<ContextState<TContext>> {
  const key = context.key ? context.key(args) : context.type;
  const id = context.key ? [context.type, key].join(":") : context.type;

  const options = context.setup ? await context.setup(args, agent) : {};

  const memory =
    (await agent.memory.store.get(id)) ??
    (context.create
      ? context.create({ key, args, context, id: id, options })
      : {});

  return {
    id,
    key,
    args,
    options,
    context,
    memory,
  };
}

async function getContextWorkingMemory(agent: AnyAgent, contextId: string) {
  return (
    (await agent.memory.store.get<WorkingMemory>(
      [contextId, "working-memory"].join(":")
    )) ?? (await defaultWorkingMemory.create())
  );
}

async function saveContextWorkingMemory(
  agent: AnyAgent,
  contextId: string,
  workingMemory: WorkingMemory
) {
  return await agent.memory.store.set(
    [contextId, "working-memory"].join(":"),
    workingMemory
  );
}

const actionParseErrorPrompt = createPrompt(
  `
You are tasked with fixing an action call arguments parsing error!
Here is the current context:
{{context}}
Here is the error:
{{error}}
`,
  ({ context, error }: { context: string; error: string }) => ({
    context,
    error,
  })
);

class ActionNotFoundError extends Error {
  constructor(public call: ActionCall) {
    super();
  }
}

class ParsingError extends Error {
  constructor(public parsingError: unknown) {
    super();
  }
}

// function handleActionCallParsingError() {
//   const contexts: ContextState<AnyContext>[] = [agentCtxState, ctxState].filter(
//     (t) => !!t
//   );

//   const response = await generateObject({
//     model: agent.model,
//     schema: action.schema,
//     prompt: actionParseErrorPrompt({
//       context: formatContexts(ctxState.id, contexts, workingMemory),
//       error: JSON.stringify(error),
//     }),
//   });

//   if (response.object) {
//     data = response.object;
//   }
// }

async function prepareActionCall({
  call,
  actions,
  logger,
}: {
  call: ActionCall;
  actions: AnyAction[];
  logger: Logger;
}) {
  const action = actions.find((a) => a.name === call.name);

  if (!action) {
    logger.error("agent:action", "ACTION_MISMATCH", {
      name: call.name,
      data: call.content,
    });

    throw new ActionNotFoundError(call);
  }

  try {
    const data = action.schema.parse(JSON.parse(call.content));
    call.data = data;
    return { action, data };
  } catch (error) {
    throw new ParsingError(error);
  }
}

async function handleActionCall({
  state,
  workingMemory,
  action,
  logger,
  call,
  taskRunner,
  agent,
  agentState,
}: {
  state: ContextState<AnyContext>;
  workingMemory: WorkingMemory;
  call: ActionCall;
  action: AnyAction;
  logger: Logger;
  taskRunner: TaskRunner;
  agent: AnyAgent;
  agentState?: ContextState;
}) {
  let actionMemory: unknown = {};

  if (action.memory) {
    actionMemory =
      (await agent.memory.store.get(action.memory.key)) ??
      action.memory.create();
  }

  const resultData = await taskRunner.enqueueTask(
    runAction,
    {
      action,
      call,
      agent,
      logger,
      ctx: {
        ...state,
        workingMemory,
        actionMemory,
        agentMemory: agentState?.memory,
      },
    },
    {
      debug: agent.debugger,
    }
  );

  const result: ActionResult = {
    ref: "action_result",
    id: randomUUIDv7(),
    callId: call.id,
    data: resultData,
    name: call.name,
    timestamp: Date.now(),
    processed: false,
  };

  if (action.format) result.formatted = action.format(result);

  if (action.memory) {
    await agent.memory.store.set(action.memory.key, actionMemory);
  }

  return result;
}

async function handleOutput({
  outputRef,
  outputs,
  logger,
  state,
  workingMemory,
  agent,
}: {
  outputs: Output[];
  outputRef: OutputRef;
  logger: Logger;
  workingMemory: WorkingMemory;
  state: ContextState;
  agent: AnyAgent;
}) {
  const output = outputs.find((output) => output.type === outputRef.type);

  if (!output) {
    console.log({ outputFailed: output });
    throw new Error("OUTPUT NOT FOUND");
  }

  logger.info("agent:output", outputRef.type, outputRef.data);

  try {
    let parsedContent = outputRef.data;
    if (typeof parsedContent === "string") {
      if (output.schema._def.typeName !== "ZodString") {
        try {
          parsedContent = JSON.parse(parsedContent.trim());
        } catch (error) {
          console.log("failed parsing output content", {
            content: parsedContent,
          });
          throw error;
        }
      }
    }
    let data: any;
    try {
      data = output.schema.parse(parsedContent);
    } catch (error) {
      console.log("failed parsing output schema");
      throw error;
    }

    const response = await output.handler(
      data,
      {
        ...state,
        workingMemory,
      },
      agent
    );

    if (Array.isArray(response)) {
      const refs: OutputRef[] = [];
      for (const res of response) {
        const ref: OutputRef = {
          ...outputRef,
          id: randomUUIDv7(),
          ...res,
        };

        ref.formatted = output.format ? output.format(response) : undefined;
        refs.push(ref);
      }
      return refs;
    } else if (response) {
      const ref: OutputRef = {
        ...outputRef,
        ...response,
      };

      ref.formatted = output.format ? output.format(response) : undefined;

      return ref;
    }

    return {
      ...outputRef,
      formatted: output.format ? output.format(data) : undefined,
      data,
    };
  } catch (error) {
    const ref: OutputRef = {
      ...outputRef,
      params: { error: "true" },
      timestamp: Date.now(),
      data: { content: outputRef.data, error },
    };

    logger.error("agent:output", outputRef.type, error);

    return ref;
  }
}

type PartialLog = Partial<Log> & Pick<Log, "ref" | "id" | "timestamp">;

function createContextStreamHandler({
  agent,
  chain,
  ctxState,
  agentCtxState,
  logger,
  handlers,
  taskRunner,
  outputs,
  actions,
  actionCalls,
  workingMemory,
}: {
  agent: AnyAgent;
  taskRunner: TaskRunner;
  ctxState: ContextState<AnyContext>;
  agentCtxState?: ContextState<AnyContext>;
  chain: Log[];
  logger: Logger;
  handlers?: Partial<Handlers>;
  outputs: Output[];
  actions: AnyAction[];
  actionCalls: Promise<any>[];
  workingMemory: WorkingMemory;
}) {
  const state = {
    index: 0,
    logsByIndex: new Map<number, PartialLog>(),
  };

  function getOrCreateRef<TLog extends Omit<PartialLog, "id" | "timestamp">>(
    index: number,
    ref: TLog
  ): TLog & Pick<PartialLog, "id" | "timestamp"> {
    if (!state.logsByIndex.has(index)) {
      state.logsByIndex.set(index, {
        id: randomUUIDv7(),
        timestamp: Date.now(),
        ...ref,
      });
    }

    return state.logsByIndex.get(index)! as TLog &
      Pick<PartialLog, "id" | "timestamp">;
  }

  async function pushLogStream(log: Log, done: boolean) {
    if (done) chain.push(log);

    if (log.ref === "thought" && done) {
      workingMemory.thoughts.push(log);
      logger.info("agent:think", "", log.content);
      handlers?.onThinking?.(log);
    }

    if (log.ref === "output" && done) {
      workingMemory.outputs.push(log);
    }

    if (log.ref === "action_call" && done) {
      workingMemory.calls.push(log);
    }
    if (log.ref === "action_result" && done) {
      workingMemory.results.push(log);
    }

    handlers?.onLogStream?.(log, done);
  }

  async function handleActionCallStream(call: ActionCall, done: boolean) {
    if (!done) {
      return pushLogStream(call, false);
    }

    // todo: handle errors
    const { action } = await prepareActionCall({
      call,
      actions,
      logger,
    });

    pushLogStream(call, true);

    actionCalls.push(
      handleActionCall({
        call,
        action,
        agent,
        logger,
        state: ctxState,
        taskRunner,
        workingMemory,
        agentState: agentCtxState,
      }).then((res) => {
        pushLogStream(res, true);
        return res;
      })
    );
  }

  async function handleOutputStream(outputRef: OutputRef, done: boolean) {
    if (!done) {
      return pushLogStream(outputRef, false);
    }

    const refs = await handleOutput({
      agent,
      logger,
      state: ctxState,
      workingMemory,
      outputs,
      outputRef,
    });

    for (const ref of Array.isArray(refs) ? refs : [refs]) {
      chain.push(ref);
      workingMemory.outputs.push(ref);
      pushLogStream(ref, true);
    }
  }

  async function handler(el: StackElement) {
    state.index = el.index > state.index ? el.index : state.index;
    console.log({ index: el.index, lastIndex: state.index });

    switch (el.tag) {
      case "think":
      case "reasoning": {
        const ref = getOrCreateRef(el.index, {
          ref: "thought",
        });

        pushLogStream(
          {
            ...ref,
            content: el.content.join(""),
          },
          el.done
        );

        break;
      }

      case "action_call": {
        const ref = getOrCreateRef(el.index, {
          ref: "action_call",
        });

        handleActionCallStream(
          {
            ...ref,
            name: el.attributes.name,
            content: el.content.join(""),
            data: undefined,
          },
          el.done
        );

        break;
      }
      case "output": {
        const ref = getOrCreateRef(el.index, {
          ref: "output",
        });

        handleOutputStream(
          {
            ...ref,
            type: el.attributes.type,
            data: el.content.join("").trim(),
          },
          el.done
        );
        break;
      }

      default:
        break;
    }
  }

  return {
    state,
    handler,
  };
}

// Update runEvaluation to handle the enhanced evaluation context
// @dev: TODO: make a render context function for the evaluation prompt
async function runEvaluation<Data = any>(
  evaluator: Evaluator<Data>,
  data: Data,
  context: AgentContext<any>,
  agent: AnyAgent
): Promise<boolean> {
  const evaluationResult = await generateObject({
    model: agent.reasoningModel ?? agent.model,
    schema: evaluator.schema,
    prompt:
      evaluator.prompt +
      {
        data: JSON.stringify(data),
        context: JSON.stringify(context),
        workingMemory: JSON.stringify(context.workingMemory),
        timestamp: Date.now(),
      },
  });

  return evaluator.handler(data, evaluationResult.object, context, agent);
}
