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
  type Log,
  type Output,
  type OutputRef,
  type Subscription,
  type Thought,
  type WorkingMemory,
} from "./types";
import { Logger } from "./logger";
import { formatContext } from "./formatters";
import { generateObject, generateText, type LanguageModelV1 } from "ai";
import { randomUUID } from "crypto";
import createContainer from "./container";
import { createServiceManager } from "./serviceProvider";
import { type InferContextMemory } from "./types";
import { z } from "zod";
import { task, TaskRunner, type TaskContext } from "./task";
import { parse, prompt, resultsPrompt } from "./prompts/main";
import { defaultContextRender, defaultWorkingMemory } from "./context";
import { createMemoryStore } from "./memory";

import { createPrompt } from "./prompt";

import { createMemory } from "./memory";
import { createVectorStore } from "./memory/base";

const taskRunner = new TaskRunner(3);

export function createDreams<
  Memory = any,
  TContext extends Context<Memory, any, any, any> = Context<
    Memory,
    any,
    any,
    any
  >,
>(config: Config<Memory, TContext>): Agent<Memory, TContext> {
  const inputSubscriptions = new Map<string, Subscription>();

  const logger = new Logger({
    level: config.logger ?? LogLevel.INFO,
    enableTimestamp: true,
    enableColors: true,
  });

  const contexts = new Map<string, { args?: any }>();

  const {
    inputs = {},
    outputs = {},
    events = {},
    actions = [],
    experts = {},
    services = [],
    extensions = [],
    memory,
    model,
    reasoningModel,
  } = config;

  const container = config.container ?? createContainer();

  const contextsRunning = new Set<string>();

  const debug: Debugger = (...args) => {
    if (!config.debugger) return;
    try {
      config.debugger(...args);
    } catch {
      console.log("debugger failed");
    }
  };

  let booted = false;

  const serviceManager = createServiceManager(container);

  for (const extension of extensions) {
    if (extension.inputs) Object.assign(inputs, extension.inputs);
    if (extension.outputs) Object.assign(outputs, extension.outputs);
    if (extension.events) Object.assign(events, extension.events);
    if (extension.actions) actions.push(...extension.actions);
    if (extension.services) services.push(...extension.services);
  }

  for (const service of services) {
    serviceManager.register(service);
  }

  async function getContextState<TContext extends AnyContext>(
    context: TContext,
    args: z.infer<TContext["schema"]>
  ): Promise<ContextState<TContext>> {
    const key = context.key(args);
    const contextId = [context.type, key].join(":");

    const options = context.setup ? await context.setup(args, agent) : {};

    const memory =
      (await agent.memory.store.get(contextId)) ??
      (context.create
        ? context.create({ key, args, context, id: contextId, options })
        : {});

    return {
      id: contextId,
      key,
      context,
      args,
      options,
      memory,
    };
  }

  async function getContextWorkingMemory(contextId: string) {
    return (
      (await agent.memory.store.get<WorkingMemory>(
        ["working-memory", contextId].join(":")
      )) ?? (await defaultWorkingMemory.create())
    );
  }

  const agent: Agent<Memory, TContext> = {
    inputs,
    outputs,
    events,
    actions,
    experts,
    memory: memory ?? createMemory(createMemoryStore(), createVectorStore()),
    container,
    model,
    reasoningModel,
    debugger: debug,
    context: config.context ?? undefined,
    emit: (event: string, data: any) => {
      logger.info("agent:event", event, data);
    },

    async start(args) {
      logger.info("agent:start", "booting", { args, booted });
      if (booted) return agent;

      booted = true;

      await serviceManager.bootAll();

      for (const extension of extensions) {
        if (extension.install) await extension.install(agent);
      }

      for (const [key, input] of Object.entries(agent.inputs)) {
        if (input.install) await Promise.resolve(input.install(agent));

        if (input.subscribe) {
          let subscription = input.subscribe((contextHandler, args, data) => {
            logger.info("agent", "input", { contextHandler, args, data });
            agent
              .send(contextHandler, args, { type: key, data })
              .catch((err) => {
                logger.error("agent:input", "error", err);
              });
          }, agent);

          if (typeof subscription === "object") {
            subscription = await Promise.resolve(subscription);
          }

          if (subscription) inputSubscriptions.set(key, subscription);
        }
      }

      for (const output of Object.values(outputs)) {
        if (output.install) await Promise.resolve(output.install(agent));
      }

      for (const action of actions) {
        if (action.install) await Promise.resolve(action.install(agent));
      }

      if (agent.context) {
        const { id } = await getContextState(agent.context, args);
        contexts.set(id, { args });
        contexts.set("agent:context", { args });
      }

      return agent;
    },

    async stop() {},

    run: async (context, args) => {
      if (!booted) throw new Error("Not booted");

      const ctxState = await getContextState(context, args);

      if (contextsRunning.has(ctxState.id)) return;
      contextsRunning.add(ctxState.id);

      const workingMemory = await getContextWorkingMemory(ctxState.id);

      const contextOuputs = Object.entries(agent.outputs)
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
            agent.context,
            contexts.get("agent:context")!.args
          )
        : undefined;

      logger.debug("agent:context", "agentCtxState", agentCtxState);

      const chain: Log[] = [];

      let hasError = false;

      while (maxSteps > step) {
        const data =
          step > 1
            ? await taskRunner.enqueueTask(
                runGenerateResults,
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
              )
            : await taskRunner.enqueueTask(
                runGenerate,
                {
                  agent,
                  model: config.reasoningModel ?? config.model,
                  contexts: [agentCtxState, ctxState].filter((t) => !!t),
                  contextId: ctxState.id,
                  actions: contextActions,
                  outputs: contextOuputs,
                  workingMemory,
                  logger,
                },
                {
                  debug: agent.debugger,
                }
              );

        logger.debug("agent:parsed", "data", data);

        hasError = false;

        workingMemory.results.forEach((i) => {
          i.processed = true;
        });

        for (const content of data.think) {
          const thought: Thought = {
            ref: "thought",
            content,
            timestamp: Date.now(),
          };

          chain.push(thought);
          workingMemory.thoughts.push(thought);
          logger.debug("agent:think", "", thought);
        }

        for (const content of data.reasonings) {
          const thought: Thought = {
            ref: "thought",
            content,
            timestamp: Date.now(),
          };

          chain.push(thought);
          workingMemory.thoughts.push(thought);
          logger.debug("agent:think", "", thought);
        }

        const actionCalls = data.calls.map(async ({ name, data, error }) => {
          const action = actions.find((a) => a.name === name);

          if (!action) {
            logger.error("agent:action", "ACTION_MISMATCH", {
              name,
              data,
            });
            return Promise.reject(new Error("ACTION MISMATCH"));
          }

          if (error) {
            const contexts: ContextState<AnyContext>[] = [
              agentCtxState,
              ctxState,
            ].filter((t) => !!t);

            const response = await generateObject({
              model: agent.model,
              schema: action.schema,
              prompt: actionParseErrorPrompt({
                context: renderContexts(
                  ctxState.id,
                  contexts,
                  workingMemory
                ).join("\n"),
                error: JSON.stringify(error),
              }),
            });

            if (response.object) {
              data = response.object;
            }
          }

          try {
            const call: ActionCall = {
              ref: "action_call",
              id: randomUUID(),
              data: action.schema.parse(data),
              name: name,
              timestamp: Date.now(),
            };

            workingMemory.calls.push(call);

            chain.push(call);

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
                context: {
                  ...ctxState,
                  actionMemory,
                  workingMemory,
                  agentMemory: agentCtxState?.memory,
                },
              },
              {
                debug: agent.debugger,
              }
            );

            const result: ActionResult = {
              ref: "action_result",
              callId: call.id,
              data: resultData,
              name: call.name,
              timestamp: Date.now(),
              processed: false,
            };

            chain.push({
              ...result,
            });

            if (action.format) result.formatted = action.format(result);

            workingMemory.results.push(result);

            if (action.memory) {
              await agent.memory.store.set(action.memory.key, actionMemory);
            }
          } catch (error) {
            logger.error("agent:action", "ACTION_FAILED", { error });
            throw error;
          }
        });

        for (const { type, content } of data.outputs) {
          const output = outputs[type];

          logger.info("agent:output", type, content);
          try {
            let parsedContent = content;
            if (typeof content === "string") {
              try {
                parsedContent = JSON.parse(content);
              } catch {
                parsedContent = content;
              }
            }

            const data = output.schema.parse(parsedContent);

            const response = await output.handler(
              data,
              {
                ...ctxState,
                workingMemory,
              },
              agent
            );

            if (Array.isArray(response)) {
              for (const res of response) {
                const ref: OutputRef = {
                  ref: "output",
                  type,
                  ...res,
                };

                chain.push({
                  ...ref,
                  data: content,
                });

                ref.formatted = output.format
                  ? output.format(response)
                  : undefined;

                workingMemory.outputs.push(ref);
              }
            } else if (response) {
              const ref: OutputRef = {
                ref: "output",
                type,
                ...response,
              };

              chain.push({
                ...ref,
                data: content,
              });

              ref.formatted = output.format
                ? output.format(response)
                : undefined;

              workingMemory.outputs.push(ref);
            }
          } catch (error) {
            const ref: OutputRef = {
              ref: "output",
              type,
              timestamp: Date.now(),
              data: JSON.stringify({ content, error }),
            };

            hasError = true;

            chain.push(ref);

            logger.error("agent:output", type, error);
          }
        }

        await Promise.allSettled(actionCalls);

        await agent.memory.store.set(ctxState.id, memory);
        await agent.memory.vector.upsert(ctxState.id, [memory]);

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

      await agent.memory.store.set(ctxState.id, workingMemory);

      contextsRunning.delete(ctxState.id);
    },

    send: async (contextHandler, args, params: { type: string; data: any }) => {
      if (params.type in agent.inputs === false) return;

      const {
        key,
        id: contextId,
        options,
      } = await getContextState(
        contextHandler,
        contextHandler.schema.parse(args)
      );

      const workingMemory = await getContextWorkingMemory(contextId);

      const input = agent.inputs[params.type];
      const data = input.schema.parse(params.data);

      if (input.handler) {
        const result = await input.handler(
          data,
          {
            type: contextHandler.type,
            key,
            memory,
            workingMemory,
            options,
          } as any,
          agent
        );

        // Handle output evaluation
        const output = agent.outputs[params.type];
        if (output?.evaluator || contextHandler.evaluation?.outputEvaluator) {
          const evaluator =
            output?.evaluator || contextHandler.evaluation?.outputEvaluator;

          if (evaluator) {
            const isValid = await runEvaluation(
              evaluator,
              result,
              {
                type: contextHandler.type,
                key,
                memory,
                workingMemory,
                options,
              } as any,
              agent
            );

            if (!isValid) {
              logger.warn("agent:output", "OUTPUT_EVALUATION_FAILED", {
                type: params.type,
              });
              if (evaluator.onFailure) {
                await evaluator.onFailure(
                  {
                    type: contextHandler.type,
                    key,
                    memory,
                    workingMemory,
                    options,
                  } as any,
                  agent
                );
              }
            }
          }
        }
      } else {
        workingMemory.inputs.push({
          ref: "input",
          type: params.type,
          data,
          timestamp: Date.now(),
          formatted: input.format ? input.format(data) : undefined,
        });
      }

      await agent.evaluator({
        type: contextHandler.type,
        key,
        memory,
        options,
      } as any);

      await agent.memory.store.set(contextId, memory);
      await agent.memory.vector.upsert(contextId, [memory]);

      await agent.memory.store.set(
        ["working-memory", contextId].join(":"),
        workingMemory
      );

      await agent.run(contextHandler, args);
    },

    evaluator: async (ctx) => {
      const { id, memory } = ctx;
      logger.debug("agent:evaluator", "memory", memory);
    },
  };

  container.instance("agent", agent);

  return agent;
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
      context: renderContexts(contextId, contexts, workingMemory).flat(),
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

    const result = await generateText({
      model,
      system,
      messages: [
        {
          role: "assistant",
          content: "<think>",
        },
      ],
      stopSequences: ["</response>"],
    });

    const text = "<think>" + result.text + "</response>";

    debug(contextId, ["response", callId], text);

    logger.debug("agent:response", text);

    return parse(text);
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
      context: renderContexts(contextId, contexts, workingMemory),
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

    debug(contextId, ["prompt-results", callId], system);

    logger.debug("agent:system", system, {
      contextId,
      callId,
    });

    const result = await generateText({
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
    });

    const text = "<think>" + result.text + "</response>";

    debug(contextId, ["results-response", callId], text);

    logger.debug("agent:response", text, {
      contextId,
      callId,
    });

    return parse(text);
  }
);

export const runAction = task(
  "agent:run:action",
  async <TContext extends AnyContext>({
    context,
    action,
    call,
    agent,
    logger,
  }: {
    context: AgentContext<InferContextMemory<TContext>, TContext> & {
      actionMemory: unknown;
      agentMemory: unknown;
    };
    action: AnyAction;
    call: ActionCall;
    agent: AnyAgent;
    logger: Logger;
  }) => {
    try {
      const result = await action.handler(call, context, agent);
      logger.debug("agent:action", "ACTION_SUCCESS", { result });

      // Handle action evaluation
      const shouldEvaluate =
        action.evaluator ||
        (context.context.evaluation?.evaluateActions &&
          context.context.evaluation?.actionEvaluator);

      if (shouldEvaluate) {
        const evaluator =
          action.evaluator || context.context.evaluation?.actionEvaluator;
        if (evaluator) {
          const evaluationContext = {
            result,
            call,
            context,
            action: {
              name: action.name,
              description: action.description,
            },
          };

          const isValid = await runEvaluation(
            evaluator,
            evaluationContext,
            context,
            agent
          );

          if (!isValid) {
            logger.warn("agent:action", "ACTION_EVALUATION_FAILED", {
              action: action.name,
            });
            if (evaluator.onFailure) {
              await evaluator.onFailure(context, agent);
            }
            throw new Error(`Action ${action.name} evaluation failed`);
          }
        }
      }

      return result;
    } catch (error) {
      logger.error("agent:action", "ACTION_FAILED", { error });
      throw error;
    }
  }
);

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

function renderContexts(
  mainContextId: string,
  contexts: ContextState[],
  workingMemory: WorkingMemory
) {
  return contexts.map(({ id, context, key, args, memory, options }) =>
    formatContext({
      type: context.type,
      key: key,
      description:
        typeof context.description === "function"
          ? context.description({
              key,
              args,
              options,
              id,
              context,
              memory,
            })
          : context.description,
      instructions:
        typeof context.instructions === "function"
          ? context.instructions({
              key,
              args,
              options,
              id,
              context,
              memory,
            })
          : context.instructions,
      content: [
        context.render
          ? context.render({ id, context, key, args, memory, options })
          : "",
        mainContextId === id
          ? defaultContextRender({
              memory: {
                ...workingMemory,
                inputs: workingMemory.inputs.filter(
                  (i) => i.processed === true
                ),
                results: workingMemory.results.filter(
                  (i) => i.processed === true
                ),
              },
            })
          : "",
      ]
        .flat()
        .filter((t) => !!t),
    })
  );
}

// Update runEvaluation to handle the enhanced evaluation context
async function runEvaluation<Data = any>(
  evaluator: Evaluator<Data>,
  data: Data,
  context: AgentContext<any>,
  agent: AnyAgent
): Promise<boolean> {
  const evaluationResult = await generateObject({
    model: agent.reasoningModel ?? agent.model,
    schema: evaluator.schema,
    prompt: evaluator.prompt,
    context: {
      data: JSON.stringify(data),
      context: JSON.stringify(context),
      workingMemory: JSON.stringify(context.workingMemory),
      timestamp: Date.now(),
    },
  });

  return evaluator.handler(data, evaluationResult.object, context, agent);
}
