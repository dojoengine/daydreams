import {
    Client,
    GatewayIntentBits,
    Events,
    Message,
    ChannelType,
    Partials,
    TextChannel,
    GuildMember,
} from "discord.js";
import type { JSONSchemaType } from "ajv";
import { Logger } from "../../core/logger";
import { LogLevel } from "../types";
import { env } from "../../core/env";

export interface DiscordCredentials {
    discord_token: string;
}

export interface MessageData {
    content: string;
    channelId: string;
    conversationId?: string;
    sendBy?: string;
}

export interface EventCallbacks {
    messageCreate?: (bot: any, message: any) => void;
}

export interface ReactionData {
    emoji: string;
    messageId: string;
    userId: string;
}

export interface GuildMemberData {
    userId: string;
    username: string;
    action: "join" | "leave";
}

export interface VoiceStateData {
    guildId?: string;
    userId: string;
    channelId: string;
    action: "join" | "leave" | "move";
}

export interface RoleData {
    guildId: string;
    userId: string;
    roleId: string;
    action: "add" | "remove";
}

export interface ChannelData {
    guildId: string;
    action: "create" | "delete";
    name?: string;
    type?: ChannelType;
    channelId?: string;
}

// Schema for message output validation
export const messageSchema: JSONSchemaType<MessageData> = {
    type: "object",
    properties: {
        content: { type: "string" },
        channelId: { type: "string" },
        sendBy: { type: "string", nullable: true },
        conversationId: { type: "string", nullable: true },
    },
    required: ["content", "channelId"],
    additionalProperties: false,
};

export class DiscordClient {
    private client: Client;
    private isInitialized: boolean = false;
    private logger: Logger;

    constructor(
        private credentials: DiscordCredentials,
        logLevel: LogLevel = LogLevel.INFO,
        eventCallbacks: EventCallbacks
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
            partials: [Partials.Channel], // Enable DM
        });
        this.credentials = credentials;
        this.logger = new Logger({
            level: logLevel,
            enableColors: true,
            enableTimestamp: true,
        });

        if (eventCallbacks.messageCreate) {
            this.client.on(Events.MessageCreate, (message) => {
                if (eventCallbacks.messageCreate) {
                    if (this.client?.user) {
                        eventCallbacks.messageCreate(this.client.user, message);
                    }
                }
            });
        }

        this.client.on(Events.ClientReady, async () => {
            this.logger.info("DiscordClient", "Initialized successfully");
        });

        this.client.login(this.credentials.discord_token).catch((error) => {
            this.logger.error("DiscordClient", "Failed to login", { error });
            console.error("Login error:", error);
        });
    }

    public destroy() {
        this.client?.destroy();
    }

    /**
     * Create an input that monitors messages
     */
    public createMessageInput(
        interval: number = this.DEFAULT_COLLECTION_TIMEOUT,
        channelId?: string
    ) {
        return {
            name: `discord_messages_${channelId || "all"}`,
            handler: async () => {
                return this.monitorMessages(channelId);
            },
            response: {
                type: "string",
                content: "string",
                metadata: "object",
            },
            interval,
        };
    }

    /**
     * Create an output for monitoring joining or leaving of guild members
     */
    public createGuildMemberInput() {
        return {
            name: "discord_guild_members",
            handler: async () => {
                return this.monitorGuildMembers();
            },
            response: {
                type: "string",
                userId: "string",
                username: "string",
                action: "string",
            },
        };
    }

    /**
     * Create an output for sending messages to a channel
     */
    public createMessageOutput() {
        return {
            name: "discord_message",
            handler: async (data: MessageData) => {
                return await this.sendMessage(data);
            },
            response: {
                success: "boolean",
                channelId: "string",
            },
            schema: messageSchema,
        };
    }

    private readonly DEFAULT_COLLECTION_TIMEOUT = 60000;

    private async monitorMessages(channelId?: string): Promise<MessageData[]> {
        try {
            this.logger.debug(
                "DiscordClient.monitorMessages",
                "Monitoring messages",
                { channelId }
            );

            const messages: Message[] = [];

            if (channelId) {
                const channel = await this.client?.channels.fetch(channelId);
                if (!channel || !channel.isTextBased()) {
                    throw new Error(
                        "Invalid channel or channel is not text-based"
                    );
                }

                const textChannel = channel as TextChannel;

                const collectedMessages = await new Promise<Message[]>(
                    (resolve) => {
                        const messageCollector =
                            textChannel.createMessageCollector({
                                time: this.DEFAULT_COLLECTION_TIMEOUT,
                            });

                        messageCollector.on("collect", (message) => {
                            messages.push(message);
                        });

                        messageCollector.on("end", () => {
                            this.logger.debug(
                                "DiscordClient.monitorMessages",
                                "Collected messages",
                                { count: messages.length }
                            );
                            resolve(messages);
                        });
                    }
                );

                return collectedMessages.map(this.formatMessageData);
            } else {
                return new Promise<MessageData[]>((resolve) => {
                    const messageHandler = (message: Message) => {
                        messages.push(message);
                    };

                    this.client?.on("messageCreate", messageHandler);

                    setTimeout(() => {
                        this.client?.off("messageCreate", messageHandler);
                        resolve(messages.map(this.formatMessageData));
                    }, 60000);
                });
            }
        } catch (error) {
            this.logger.error(
                "DiscordClient.monitorMessages",
                "Error monitoring messages",
                { error }
            );
            throw error;
        }
    }

    private async sendMessage(data: MessageData) {
        try {
            this.logger.info(
                "DiscordClient.sendMessage",
                "Would send message",
                {
                    data,
                }
            );

            if (env.DRY_RUN) {
                return {
                    success: true,
                    channelId: "DRY RUN CHANNEL ID",
                };
            }

            const channel = this.client.channels.cache.get(data.channelId);
            if (!channel?.isTextBased()) {
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
            };
        } catch (error) {
            this.logger.error(
                "DiscordClient.sendMessage",
                "Error sending message",
                {
                    error,
                }
            );
            throw error;
        }
    }

    private async monitorGuildMembers(): Promise<GuildMemberData> {
        return new Promise((resolve, reject) => {
            try {
                this.logger.debug(
                    "DiscordClient.monitorGuildMembers",
                    "Monitoring guild members"
                );

                const handleMemberEvent = (
                    member: GuildMember,
                    action: "join" | "leave"
                ) => {
                    const memberData: GuildMemberData = {
                        userId: member.id,
                        username: member.user.username,
                        action,
                    };
                    resolve(memberData);
                };

                this.client?.on("guildMemberAdd", (member) =>
                    handleMemberEvent(member as GuildMember, "join")
                );
                this.client?.on("guildMemberRemove", (member) =>
                    handleMemberEvent(member as GuildMember, "leave")
                );
            } catch (error) {
                this.logger.error(
                    "DiscordClient.monitorGuildMembers",
                    "Error monitoring guild members",
                    { error }
                );
                reject(error);
            }
        });
    }
    private formatMessageData(message: Message): MessageData {
        return {
            content: message.content,
            channelId: message.channel.id,
            sendBy: message.author.id,
        };
    }
}

// Example usage:
/*
const discord = new DiscordClient({
    discord_token: process.env.DISCORD_TOKEN || "",
});

// Register inputs
core.createMessageInput("CHANNEL_ID");
core.createGuildMemberInput();

// Register output
core.registerOutput(discord.createMessageOutput());
*/
