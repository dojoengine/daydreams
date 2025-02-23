import * as readline from "readline/promises";
import { context } from "../context";
import { z } from "zod";
import { extension, input, output } from "../utils";
import { formatMsg } from "../formatters";
import { service } from "../serviceProvider";

const cliContext = context({
  type: "cli",
  key: ({ user }) => user.toString(),
  schema: z.object({ user: z.string() }),
});

const readlineService = service({
  register(container) {
    container.singleton("readline", () =>
      readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    );
  },
});

export const cli = extension({
  name: "cli",
  services: [readlineService],
  contexts: {
    cli: cliContext,
  },
  inputs: {
    // Handle incoming messages
    "cli:message": input({
      schema: z.object({
        user: z.string(),
        text: z.string(),
      }),
      format: ({ user, text }) =>
        formatMsg({
          role: "user",
          content: text,
          user,
        }),
      // Subscribe to CLI input
      async subscribe(send, { container }) {
        const rl = container.resolve<readline.Interface>("readline");

        const controller = new AbortController();

        new Promise<void>(async (resolve) => {
          while (!controller.signal.aborted) {
            const question = await rl.question("> ");
            if (question === "exit") {
              break;
            }
            console.log("User:", question);
            send(
              cliContext,
              { user: "admin" },
              {
                user: "admin",
                text: question,
              }
            );
          }

          resolve();
        });

        return () => {
          controller.abort();
        };
      },
    }),
  },
  outputs: {
    "cli:message": output({
      description: "Send messages to the user",
      schema: z.object({
        message: z.string().describe("The message to send"),
      }),
      handler(content) {
        console.log("Agent:", content.message);
        return {
          data: content,
          timestamp: Date.now(),
        };
      },
      format: ({ data }) =>
        formatMsg({
          role: "assistant",
          content: data.message,
        }),
    }),
  },
});
