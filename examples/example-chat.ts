// running this example expects ANTHROPIC_API_KEY env to be set

import {
    BaseIO,
    Core,
    Input,
    Output,
    Processor,
    ProcessorFn,
} from "../packages/core/src/core/core";
import * as readline from "readline";
import { Anthropic } from "@anthropic-ai/sdk";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatInput extends BaseIO {
    type: "chat";
    message: string;
    history?: Message[];
}

interface ChatOutput extends BaseIO {
    type: "chat";
    message: string;
}

class MemoryProcessor implements Processor<ChatInput, ChatOutput> {
    private history: Message[] = [];

    async handle(
        input: Input<ChatInput>,
        next: ProcessorFn<ChatInput, ChatOutput>,
    ): Promise<Output<ChatInput, ChatOutput>> {
        // add history
        const inputWithHistory: Input<ChatInput> = {
            ...input,
            content: {
                ...input.content,
                history: this.history,
            },
        };

        // process the input
        const output = await next(inputWithHistory);

        // if we have a successful response, update the history
        if (output.content) {
            this.history.push(
                { role: "user", content: input.content.message },
                { role: "assistant", content: output.content.message },
            );
        }

        return output;
    }
}

class AnthropicProcessor implements Processor<ChatInput, ChatOutput> {
    private client: Anthropic;

    constructor(apiKey: string) {
        this.client = new Anthropic({ apiKey });
    }

    async handle(
        input: Input<ChatInput>,
        next: ProcessorFn<ChatInput, ChatOutput>,
    ): Promise<Output<ChatInput, ChatOutput>> {
        try {
            const messages = input.content.history?.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })) || [];

            // Add the current message
            messages.push({ role: "user", content: input.content.message });

            const response = await this.client.messages.create({
                model: "claude-3-5-sonnet-latest",
                messages,
                max_tokens: 1024,
            });

            return {
                input,
                content: {
                    type: "chat",
                    message: response.content[0].text,
                },
            };
        } catch (error) {
            return {
                input,
                content: null,
                error: error instanceof Error
                    ? error
                    : new Error(String(error)),
            };
        }
    }
}

async function main() {
    const core = new Core<ChatInput, ChatOutput>();

    core.registerProcessor(
        new AnthropicProcessor(process.env.ANTHROPIC_API_KEY!),
    );
    core.registerProcessor(new MemoryProcessor());

    const repl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const chat = () => {
        repl.question("> ", async (line) => {
            if (line.toLowerCase() === "exit") {
                repl.close();
                process.exit(0);
            }

            try {
                const input: Input<ChatInput> = {
                    name: "repl",
                    content: {
                        type: "chat",
                        message: line,
                    },
                };

                const output = await core.process(input);

                if (output.error) {
                    console.error("Error:", output.error);
                } else if (output.content) {
                    console.log("\nA:", output.content.message, "\n");
                }
            } catch (error) {
                console.error("Error:", error);
            }

            chat();
        });
    };

    console.log("You are now chatting with Claude. Type 'exit' to quit.");
    chat();

    // cleanup
    process.on("SIGINT", () => {
        repl.close();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error(console.log("Fatal error:"), error);
    process.exit(1);
});
