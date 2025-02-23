/**
 * Basic example demonstrating a simple chat interface using Dreams
 * with a command line interface and Groq's LLM.
 */
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  createDreams,
  context,
  render,
  action,
  input,
  output,
  extension,
  LogLevel,
} from "@daydreamsai/core";
import { string, z } from "zod";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function createChat() {
  const thread = context({
    type: "thread",
    schema: z.object({ threadId: z.string() }),
    key: (args) => args.threadId,
    render() {
      const date = new Date();
      return `\
Current ISO time is: ${date.toISOString()}, timestamp: ${date.getTime()}`;
    },
  });

  return extension({
    name: "chat",
    contexts: {
      thread,
    },
    inputs: {
      message: input({
        schema: z.object({ user: z.string(), content: z.string() }),
      }),
    },
    outputs: {
      message: output({
        schema: z.object({ user: z.string(), content: z.string() }),
        handler(params, ctx, agent) {
          return {
            data: params,
            timestamp: Date.now(),
          };
        },
        required: true,
      }),
      "screen:widget:weather": output({
        description: "use this to display the latest weather report",
        instructions:
          "always show some weather report if you havent set one yet, try to keep it updated every 5 mins, if no location the user has set use: Lisbon",
        schema: z.object({ report: z.string(), lastUpdated: z.number() }),
        handler(params, ctx, agent) {
          return {
            data: params,
            timestamp: Date.now(),
          };
        },
        // required: true,
      }),
    },
    actions: [
      action({
        name: "get_weather",
        schema: z.object({ location: z.string() }),
        handler(call, ctx, agent) {
          return "Sunny";
        },
      }),
    ],
  });
}

const chat = createChat();

const agent = await createDreams({
  logger: LogLevel.INFO,
  debugger: async (contextId, keys, data) => {
    const [type, id] = keys;
    await Bun.write(`./logs/chat/${contextId}/${id}-${type}.md`, data);
  },
  // model: groq("deepseek-r1-distill-llama-70b"),
  model: anthropic("claude-3-5-haiku-latest"),
  extensions: [chat] as const,
  inputs: {
    message: input({
      schema: z.object({ user: z.string(), content: z.string() }),
    }),
    button: input({
      schema: z.object({ ze: z.string(), foo: z.string() }),
    }),
  },
}).start();

const res = await agent.send({
  context: chat.contexts!.thread,
  args: { threadId: "test" },
  input: {
    type: "message",
    data: {
      user: "dreamer",
      // content: "hi",
      content:
        "fetch the weather for lisbon, porto, and faro and make me a report in markdown format!",
    },
  },
  outputs: {
    thread: output({
      description: "use this to describe the thread",
      instructions:
        "You must always return this output so we can describe it to the user in the UI",
      schema: z.object({ topic: z.string(), description: z.string() }),
      handler(params, ctx, agent) {
        return {
          data: params,
          timestamp: Date.now(),
        };
      },
      required: true,
    }),
    document: output({
      description:
        "use this to output documents like reports, markdown text, code, structured document",
      schema: z.object({
        id: z.string().describe("use this to reference documents"),
        title: z.string(),
        document: z.string(),
        format: z.string().describe("the content type"),
        language: z.string().optional().describe("the code language"),
      }),
      handler(params, ctx, agent) {
        return {
          data: params,
          timestamp: Date.now(),
        };
      },
    }),
  },
});
