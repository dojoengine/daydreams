import {
  action,
  context,
  extension,
  formatMsg,
  input,
  output,
} from "@daydreamsai/core";
import { z } from "zod";

const chatContext = context({
  type: "chat",
  schema: z.object({ chatId: z.string() }),
  key: (args) => args.chatId,
  render() {
    const date = new Date();
    return `\
Current ISO time is: ${date.toISOString()}, timestamp: ${date.getTime()}`;
  },
});

export const chat = extension({
  name: "chat",
  contexts: {
    chat: chatContext,
  },
  inputs: {
    message: input({
      schema: z.object({ user: z.string(), content: z.string() }),
      format(params) {
        return formatMsg({
          role: "user",
          user: params.user,
          content: params.content,
        });
      },
    }),
  },
  outputs: {
    message: output({
      schema: z.object({
        user: z.string().describe("the user you are replying to"),
        content: z.string(),
      }),
      handler(params, ctx, agent) {
        return {
          data: params,
          timestamp: Date.now(),
        };
      },
      required: true,
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
