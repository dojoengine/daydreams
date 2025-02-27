import {
  LogLevel,
  type ActionCall,
  type ActionResult,
  type Agent,
  type AnyAction,
  type AnyAgent,
  type AnyContext,
  type Config,
  type Context,
  type ContextState,
  type Debugger,
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
import { createEpisodeFromWorkingMemory } from "./memory/utils";

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

  logger.debug("dreams", "Creating agent", {
    hasModel: !!model,
    hasReasoningModel: !!reasoningModel,
    inputsCount: Object.keys(inputs).length,
    outputsCount: Object.keys(outputs).length,
    actionsCount: actions.length,
    servicesCount: services.length,
    extensionsCount: extensions.length,
  });

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
    if (extension.services) {
      for (const service of extension.services) {
        serviceManager.register(service);
      }
    }
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
      logger.debug("agent:event", event, data);
    },

    async getContexts() {
      return Array.from(contexts.entries()).map(([id, { type, args }]) => ({
        id,
        type,
        args,
      }));
    },

    getContext(params) {
      logger.trace("agent:getContext", "Getting context state", params);
      return getContextState(agent, params.context, params.args);
    },

    getContextId(params) {
      logger.trace("agent:getContextId", "Getting context id", params);
      return getContextId(params.context, params.args);
    },

    getWorkingMemory(contextId) {
      logger.trace("agent:getWorkingMemory", "Getting working memory", {
        contextId,
      });
      return getContextWorkingMemory(agent, contextId);
    },

    async start(args) {
      logger.info("agent:start", "Starting agent", { args, booted });
      if (booted) return agent;

      booted = true;

      logger.debug("agent:start", "Booting services");
      await serviceManager.bootAll();

      logger.debug("agent:start", "Installing extensions", {
        count: extensions.length,
      });
      for (const extension of extensions) {
        if (extension.install) await extension.install(agent);
      }

      logger.debug("agent:start", "Setting up inputs", {
        count: Object.keys(agent.inputs).length,
      });

      for (const [type, input] of Object.entries(agent.inputs)) {
        if (input.install) {
          logger.trace("agent:start", "Installing input", { type });
          await Promise.resolve(input.install(agent));
        }

        if (input.subscribe) {
          logger.trace("agent:start", "Subscribing to input", { type });
          let subscription = input.subscribe((context, args, data) => {
            logger.debug("agent", "input", { context, args, data });
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

      logger.debug("agent:start", "Setting up outputs", {
        count: Object.keys(outputs).length,
      });
      for (const [type, output] of Object.entries(outputs)) {
        if (output.install) {
          logger.trace("agent:start", "Installing output", { type });
          await Promise.resolve(output.install(agent));
        }
      }

      logger.debug("agent:start", "Setting up actions", {
        count: actions.length,
      });
      for (const action of actions) {
        if (action.install) {
          logger.trace("agent:start", "Installing action", {
            name: action.name,
          });
          await Promise.resolve(action.install(agent));
        }
      }

      if (agent.context) {
        logger.debug("agent:start", "Setting up agent context", {
          type: agent.context.type,
        });
        const { id } = await getContextState(agent, agent.context, args);
        contexts.set(id, { type: agent.context.type, args });
        contexts.set("agent:context", { type: agent.context.type, args });
      }

      logger.debug("agent:start", "Loading saved contexts");
      const savedContexts =
        await agent.memory.store.get<[string, { type: string; args?: any }][]>(
          "contexts"
        );

      if (savedContexts) {
        logger.trace("agent:start", "Restoring saved contexts", {
          count: savedContexts.length,
        });
        for (const [id, { type, args }] of savedContexts) {
          contexts.set(id, { type, args });
        }
      }

      logger.info("agent:start", "Agent started successfully");
      return agent;
    },

    async stop() {
      logger.info("agent:stop", "Stopping agent");
    },

    run: async ({ context, args, outputs, handlers }) => {
      if (!booted) {
        logger.error("agent:run", "Agent not booted");
        throw new Error("Not booted");
      }

      logger.info("agent:run", "Running context", {
        contextType: context.type,
        hasArgs: !!args,
        hasCustomOutputs: !!outputs,
        hasHandlers: !!handlers,
      });

      const ctxState = await getContextState(agent, context, args);
      logger.debug("agent:run", "Context state retrieved", { id: ctxState.id });

      contexts.set(ctxState.id, { type: context.type, args });

      await agent.memory.store.set<[string, { args?: any }][]>(
        "contexts",
        Array.from(contexts.entries())
      );

      if (contextsRunning.has(ctxState.id)) {
        logger.debug("agent:run", "Context already running", {
          id: ctxState.id,
        });
        return [];
      }

      contextsRunning.add(ctxState.id);
      logger.debug("agent:run", "Added context to running set", {
        id: ctxState.id,
      });

      const workingMemory = await getContextWorkingMemory(agent, ctxState.id);
      logger.trace("agent:run", "Working memory retrieved", {
        id: ctxState.id,
        inputsCount: workingMemory.inputs.length,
        outputsCount: workingMemory.outputs.length,
        thoughtsCount: workingMemory.thoughts.length,
      });

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

      logger.debug("agent:run", "Enabled outputs", {
        count: contextOuputs.length,
      });

      const maxSteps = 10;
      let step = 1;
      const minSteps = 3; // Minimum steps before considering early termination

      logger.debug("agent:run", "Preparing actions");
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

      logger.debug("agent:run", "Enabled actions", {
        count: contextActions.length,
      });

      const agentCtxState = agent.context
        ? await getContextState(
            agent,
            agent.context,
            contexts.get("agent:context")!.args
          )
        : undefined;

      logger.debug("agent:run", "Agent context state", {
        hasAgentContext: !!agentCtxState,
        id: agentCtxState?.id,
      });

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
        logger.info("agent:run", `Starting step ${step}/${maxSteps}`, {
          contextId: ctxState.id,
        });

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

        logger.debug("agent:run", "Processing stream", { step });
        await handleStream(stream, state.index, handler);

        logger.debug("agent:run", "Waiting for action calls to complete", {
          pendingCalls: actionCalls.length,
        });
        await Promise.allSettled(actionCalls);

        actionCalls.length = 0;

        logger.debug("agent:run", "Saving context state", { id: ctxState.id });
        await agent.memory.store.set(ctxState.id, ctxState.memory);

        if (agentCtxState) {
          logger.debug("agent:run", "Saving agent context state", {
            id: agentCtxState.id,
          });
          await agent.memory.store.set(agentCtxState.id, agentCtxState.memory);
        }

        logger.debug("agent:run", "Saving working memory", { id: ctxState.id });
        await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

        step++;

        if (hasError) {
          logger.warn("agent:run", "Continuing despite error", { step });
          continue;
        }

        // Only check for early termination if we've completed the minimum number of steps
        if (step > minSteps) {
          const pendingResults = workingMemory.results.filter(
            (i) => i.processed === false
          ).length;
          logger.debug("agent:run", "Checking for pending results", {
            pendingResults,
          });

          if (pendingResults === 0) {
            const pendingOutputs = workingMemory.outputs.filter(
              (o) => o.processed === false
            ).length;
            logger.debug("agent:run", "Checking for pending outputs", {
              pendingOutputs,
            });

            // Check if there are any action calls that might need follow-up actions
            const pendingActionCalls = workingMemory.calls.filter(
              (c) => !workingMemory.results.some((r) => r.callId === c.id)
            ).length;
            logger.debug("agent:run", "Checking for pending action calls", {
              pendingActionCalls,
            });

            // Check if there are recent action results that haven't been reasoned about yet
            const recentResults = workingMemory.results
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 3);

            // Check if there's been a thought after the most recent action result
            const mostRecentResultTime =
              recentResults.length > 0 ? recentResults[0].timestamp : 0;
            const hasReasonedAfterResults = workingMemory.thoughts.some(
              (t) => t.timestamp > mostRecentResultTime
            );

            logger.debug(
              "agent:run",
              "Checking for reasoning after recent results",
              {
                hasReasonedAfterResults,
                mostRecentResultTime,
                recentThoughtTimes: workingMemory.thoughts
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 3)
                  .map((t) => t.timestamp),
              }
            );

            // Check if there are recent outputs that haven't been reasoned about yet
            const recentOutputs = workingMemory.outputs
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 3);

            // Check if there's been a thought after the most recent output
            const mostRecentOutputTime =
              recentOutputs.length > 0 ? recentOutputs[0].timestamp : 0;
            const hasReasonedAfterOutputs = workingMemory.thoughts.some(
              (t) => t.timestamp > mostRecentOutputTime
            );

            logger.debug(
              "agent:run",
              "Checking for reasoning after recent outputs",
              {
                hasReasonedAfterOutputs,
                mostRecentOutputTime,
                recentOutputsCount: recentOutputs.length,
              }
            );

            // Only break if there are no pending outputs, no pending action calls,
            // AND either there are no recent results/outputs or we've reasoned about them already
            const shouldContinue =
              (recentResults.length > 0 && !hasReasonedAfterResults) ||
              (recentOutputs.length > 0 && !hasReasonedAfterOutputs);

            logger.debug("agent:run", "Checking if should continue", {
              shouldContinue,
              recentResultsCount: recentResults.length,
              hasReasonedAfterResults,
              recentOutputsCount: recentOutputs.length,
              hasReasonedAfterOutputs,
            });

            if (
              pendingOutputs === 0 &&
              pendingActionCalls === 0 &&
              !shouldContinue
            ) {
              logger.info(
                "agent:run",
                "All results and outputs processed, breaking loop",
                {
                  step,
                  pendingOutputs,
                  pendingActionCalls,
                  shouldContinue,
                  recentResultsCount: recentResults.length,
                  hasReasonedAfterResults,
                  recentOutputsCount: recentOutputs.length,
                  hasReasonedAfterOutputs,
                }
              );
              break;
            }
          }
        } else {
          logger.debug("agent:run", "Skipping early termination check", {
            step,
            minSteps,
          });
        }
      }

      logger.debug("agent:run", "Marking all inputs as processed");
      workingMemory.inputs.forEach((i) => {
        i.processed = true;
      });

      await saveContextWorkingMemory(agent, ctxState.id, workingMemory);

      logger.debug("agent:run", "Removing context from running set", {
        id: ctxState.id,
      });
      contextsRunning.delete(ctxState.id);

      logger.info("agent:run", "Run completed", {
        contextId: ctxState.id,
        chainLength: chain.length,
      });
      return chain;
    },

    send: async (params) => {
      logger.info("agent:send", "Sending input", {
        inputType: params.input.type,
        contextType: params.context.type,
      });

      if (params.input.type in agent.inputs === false) {
        logger.error("agent:send", "Invalid input type", {
          type: params.input.type,
        });
        throw new Error("invalid input");
      }

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

      logger.debug("agent:send", "Context state retrieved", {
        id: contextId,
        key,
      });

      const workingMemory = await getContextWorkingMemory(agent, contextId);
      logger.trace("agent:send", "Working memory retrieved", {
        id: contextId,
        inputsCount: workingMemory.inputs.length,
      });

      const input = agent.inputs[params.input.type];
      const data = input.schema.parse(params.input.data);
      logger.debug("agent:send", "Input data parsed", {
        type: params.input.type,
      });

      logger.debug("agent:send", "Querying episodic memory");

      const episodicMemory = await agent.memory.vector.query(
        `${contextId}`,
        JSON.stringify(data)
      );

      logger.trace("agent:send", "Episodic memory retrieved", {
        episodesCount: episodicMemory.length,
      });

      workingMemory.episodicMemory = {
        episodes: episodicMemory,
      };

      if (input.handler) {
        logger.debug("agent:send", "Using custom input handler", {
          type: params.input.type,
        });
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
        logger.debug("agent:send", "Adding input to working memory", {
          type: params.context.type,
        });
        workingMemory.inputs.push({
          id: randomUUIDv7(),
          ref: "input",
          type: params.context.type,
          data,
          timestamp: Date.now(),
          formatted: input.format ? input.format(data) : undefined,
        });
      }

      logger.debug("agent:send", "Running evaluator");
      await agent.evaluator({
        type: params.context.type,
        key,
        memory,
        options,
      } as any);

      logger.debug("agent:send", "Saving context memory", { id: contextId });
      await agent.memory.store.set(contextId, memory);

      logger.debug("agent:send", "Saving working memory");
      await saveContextWorkingMemory(agent, contextId, workingMemory);

      logger.debug("agent:send", "Running run method");
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
  // if (
  //   workingMemory.inputs.some((i) => i.processed) &&
  //   workingMemory.outputs.length > 0
  // ) {
  //   const episode = await createEpisodeFromWorkingMemory(workingMemory, agent);

  //   await agent.memory.vector.upsert(`${contextId}`, [
  //     {
  //       id: episode.id,
  //       text: episode.observation,
  //       metadata: episode,
  //     },
  //   ]);
  // }

  // Store working memory as before
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
    processed: true,
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
    logger.error("agent:output", "OUTPUT_NOT_FOUND", {
      outputRef,
      availableOutputs: outputs.map((o) => o.type),
    });
    return {
      ...outputRef,
      params: { error: "OUTPUT NOT FOUND" },
      timestamp: Date.now(),
      data: { content: outputRef.data, error: "OUTPUT NOT FOUND" },
    };
  }

  logger.debug("agent:output", outputRef.type, outputRef.data);

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
      logger.debug("agent:think", "thought", log.content);
      handlers?.onThinking?.(log);
    }

    if (log.ref === "output" && done) {
      if ("processed" in log) {
        log.processed = true;
      }
      workingMemory.outputs.push(log);
    }

    if (log.ref === "action_call" && done) {
      workingMemory.calls.push(log);
    }
    if (log.ref === "action_result" && done) {
      if ("processed" in log) {
        log.processed = true;
      }
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
      // Only mark simple outputs as processed immediately
      // Complex outputs that might need further reasoning should remain unprocessed
      const output = outputs.find((output) => output.type === ref.type);
      const isSimpleOutput =
        output?.schema?._def?.typeName === "ZodString" ||
        (output?.schema?._def?.typeName === "ZodObject" &&
          Object.keys(output?.schema?._def?.shape() || {}).length <= 2);

      // Mark as processed only if it's a simple output or has an error
      ref.processed = isSimpleOutput || ref.params?.error ? true : false;

      logger.debug("agent:output", "Output processed status", {
        type: ref.type,
        processed: ref.processed,
        isSimpleOutput,
      });

      chain.push(ref);
      workingMemory.outputs.push(ref);
      pushLogStream(ref, true);
    }
  }

  async function handler(el: StackElement) {
    state.index = el.index > state.index ? el.index : state.index;
    // console.log({ index: el.index, lastIndex: state.index });

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

        // Check if the type attribute exists
        if (!el.attributes.type) {
          logger.error("agent:output", "Missing output type attribute", {
            content: el.content.join(""),
            attributes: el.attributes,
          });
          break;
        }

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
