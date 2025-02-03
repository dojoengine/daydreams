import {
    ChannelType,
    Client,
    Events,
    GatewayIntentBits,
    Partials,
    TextChannel,
    Message,
    type Channel,
} from "discord.js";
import { Logger } from "../../core/logger";
import {
    HandlerRole,
    LogLevel,
    type IOHandler,
    type ProcessableContent,
} from "../types";
import { env } from "../../core/env";
import { z } from "zod";

export interface DiscordCredentials {
    discord_token: string;
    discord_bot_name: string;
}

export interface MessageData {
    content: string;
    channelId: string;
    conversationId?: string;
    sendBy?: string;
}

export const messageSchema = z.object({
    content: z.string().describe("The content of the message"),
    channelId: z.string().describe("The channel ID where the message is sent"),
    sendBy: z.string().optional().describe("The user ID of the sender"),
    conversationId: z
        .string()
        .optional()
        .describe("The conversation ID (if applicable)"),
});
export class DiscordClient {
    private client: Client;
    private logger: Logger;
    private messageListener?: (...args: any[]) => void;

    constructor(
        private credentials: DiscordCredentials,
        logLevel: LogLevel = LogLevel.INFO
    ) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.DirectMessageReactions,
            ],
            partials: [Partials.Channel], // For DM support
        });

        this.logger = new Logger({
            level: logLevel,
            enableColors: true,
            enableTimestamp: true,
        });

        // Handle "ready" event
        this.client.on(Events.ClientReady, () => {
            this.logger.info("DiscordClient", "Initialized successfully");
        });

        // Log in to Discord
        this.client.login(this.credentials.discord_token).catch((error) => {
            this.logger.error("DiscordClient", "Failed to login", { error });
            console.error("Login error:", error);
        });
    }

    /**
     *  Optionally start listening to Discord messages.
     *  The onData callback typically feeds data into Orchestrator or similar.
     */
    public startMessageStream(
        onData: (data: ProcessableContent | ProcessableContent[]) => void
    ) {
        this.logger.info("DiscordClient", "Starting message stream...");

        // If you want to capture the listener reference for removal:
        this.messageListener = (message: Message) => {
            // Here, you could decide what "data" looks like
            // E.g., check if the bot was mentioned, etc.

            if (
                message.author.displayName == this.credentials.discord_bot_name
            ) {
                console.log(
                    `Skipping message from ${this.credentials.discord_bot_name}`
                );
                return;
            }

            onData({
                userId: message.author?.displayName,
                platformId: "discord",
                threadId: message.channel.id,
                contentId: message.id,
                data: {
                    content: message.content,
                },
            });
        };

        this.client.on(Events.MessageCreate, this.messageListener);
    }

    /**
     *  Optionally remove the message listener if you want to stop the stream.
     */
    public stopMessageStream() {
        if (this.messageListener) {
            this.client.removeListener(
                Events.MessageCreate,
                this.messageListener
            );
            this.logger.info("DiscordClient", "Message stream stopped");
        }
    }

    /**
     *  Gracefully destroy the Discord connection
     */
    public destroy() {
        this.stopMessageStream();
        this.client.destroy();
        this.logger.info("DiscordClient", "Client destroyed");
    }

    /**
     *  Create an output for sending messages (useful for Orchestrator OUTPUT handlers).
     */
    public createMessageOutput<T>(): IOHandler {
        return {
            role: HandlerRole.OUTPUT,
            name: "discord_message",
            execute: async (data: T) => {
                // Cast the result to ProcessableContent to satisfy the IOHandler signature.
                return (await this.sendMessage(
                    data as MessageData
                )) as unknown as ProcessableContent;
            },
            outputSchema: messageSchema,
        };
    }

    private getIsValidTextChannel(channel?: Channel): channel is TextChannel {
        return channel?.type === ChannelType.GuildText;
    }

    private async sendMessage(data: MessageData): Promise<{
        success: boolean;
        messageId?: string;
        content?: string;
        error?: string;
    }> {
        try {
            this.logger.info("DiscordClient.sendMessage", "Sending message", {
                data,
            });

            if (env.DRY_RUN) {
                this.logger.info(
                    "DiscordClient.sendMessage",
                    "Dry run enabled",
                    {
                        data,
                    }
                );
                return {
                    success: true,
                    messageId: "DRY_RUN",
                    content: "DRY_RUN",
                    error: "DRY_RUN",
                };
            }
            if (!data?.channelId || !data?.content) {
                return {
                    success: false,
                    error: "Channel ID and content are required",
                };
            }

            const channel = this.client.channels.cache.get(data?.channelId);
            if (!this.getIsValidTextChannel(channel)) {
                const error = new Error(
                    `Invalid or unsupported channel: ${data.channelId}`
                );
                this.logger.error(
                    "DiscordClient.sendMessage",
                    "Error sending message",
                    {
                        error,
                    }
                );
                throw error;
            }

            const sentMessage = await channel.send(data.content);

            return {
                success: true,
                messageId: sentMessage.id,
                content: data.content,
                error: undefined,
            };
        } catch (error) {
            this.logger.error(
                "DiscordClient.sendMessage",
                "Error sending message",
                {
                    error,
                }
            );
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}
