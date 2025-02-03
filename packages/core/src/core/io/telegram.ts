import type { JSONSchemaType } from "ajv";
import { Logger } from "../../core/logger";
import { LogLevel } from "../types";
import { env } from "../../core/env";
import { Api, TelegramClient as GramJSClient } from "telegram";
import { StringSession, Session } from "telegram/sessions";

export interface User {
    /** Unique identifier for this user or bot. */
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
}

export type Chat = PrivateChat | GroupChat | ChannelChat;

export interface PrivateChat {
    id: number;
    type: "private";
    username?: string;
    first_name?: string;
    last_name?: string;
}

export interface GroupChat {
    id: number;
    type: "group";
    title: string;
    members_count?: number;
}

export interface ChannelChat {
    id: number;
    type: "channel";
    title: string;
    username?: string;
    participants_count?: number;
}

// Updated Message Interface
export interface Message {
    message_id: number;
    from?: Api.User;
    date: number;
    chat: Chat;
    text: string;
}

export interface TelegramCredentials {
    bot_token: string; // For bot login

    // For user login
    api_id: number;
    api_hash: string;
    session?: string | Session;

    /** Unique identifier for this user or bot. */
    id?: number;
    is_bot: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
}

export interface MessageData {
    messageId: number;
    content: string;
    from?: User;
}

export interface SendMessageData {
    chatId: number;
    content: string;
    from?: Api.User;
}

export interface GetMessagesData {
    chatId: number;
    limit?: number;
    offset?: number;
}

interface ChatInfo {
    id: number;
    title?: string;
    type: string;
    memberCount?: number;
    username?: string;
}

export class TelegramClient {
    private client: GramJSClient | undefined;
    private logger: Logger;
    private isInitialized: boolean = false;

    constructor(
        private credentials: TelegramCredentials,
        logLevel: LogLevel = LogLevel.INFO
    ) {
        this.credentials = credentials;
        this.logger = new Logger({
            level: logLevel,
            enableColors: true,
            enableTimestamp: true,
        });
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.info(
                "TelegramClient",
                "Already initialized, skipping..."
            );
            return;
        }

        try {
            if (this.credentials.is_bot) {
                this.logger.info("TelegramClient", "Logging in as bot.");
                await this.botLogin();
            } else {
                this.logger.info("TelegramClient", "Logging in as user.");
                await this.userLogin();
            }
            this.isInitialized = true;
        } catch (error) {
            this.logger.error("TelegramClient", "Failed to initialize", {
                error,
            });
            throw error;
        }
    }

    private async botLogin(): Promise<void> {
        if (
            !this.credentials.bot_token ||
            !this.credentials.api_id ||
            !this.credentials.api_hash
        ) {
            throw new Error(
                "Bot token, Api ID and Api hash are required for bot login."
            );
        }
        try {
            this.client = new GramJSClient(
                new StringSession(""),
                this.credentials.api_id as number,
                this.credentials.api_hash as string,
                {
                    connectionRetries: 5,
                }
            );

            await this.client.start({
                botAuthToken: env.TELEGRAM_TOKEN,
            });
            console.log(this.client.session.save());

            const me = await this.client.getMe();
            this.logger.info("TelegramClient", "Bot user:", { client: me });

            // Send startup message
            if (env.TELEGRAM_STARTUP_CHAT_ID) {
                await this.sendMessage({
                    chatId: parseInt(env.TELEGRAM_STARTUP_CHAT_ID),
                    content: `🤖 Bot started successfully!\nBot username: @${(me as Api.User).username}\nTime: ${new Date().toLocaleString()}`,
                });
            }

            this.logger.info("TelegramClient", "Bot login successful.");
        } catch (error) {
            this.logger.error("TelegramClient", "Failed to login as bot", {
                error,
            });
            throw error;
        }
    }
    private async userLogin(): Promise<void> {
        try {
            if (!this.credentials.api_id || !this.credentials.api_hash) {
                throw new Error(
                    "API ID and API hash are required for user login."
                );
            }

            // Try to use session string if provided
            const sessionString = this.credentials.session?.toString();
            if (!sessionString) {
                this.logger.info(
                    "TelegramClient",
                    "No session string provided, starting interactive login"
                );
                await this.handleInteractiveLogin();
                return;
            }

            try {
                // Initialize client with session
                this.client = new GramJSClient(
                    new StringSession(sessionString),
                    this.credentials.api_id,
                    this.credentials.api_hash,
                    {
                        connectionRetries: 5,
                    }
                );

                // Try to connect and validate session
                this.logger.info(
                    "TelegramClient",
                    "Attempting to connect with existing session..."
                );
                await this.client.connect();

                // Verify the session is valid by getting user info
                const me = await this.client.getMe();
                this.logger.info(
                    "TelegramClient",
                    "Successfully connected with session",
                    {
                        id: (me as Api.User).id,
                        username: (me as Api.User).username,
                    }
                );

                // Send startup message
                await this.sendStartupMessage(me as Api.User);
            } catch (error) {
                this.logger.warn(
                    "TelegramClient",
                    "Session invalid or expired, falling back to interactive login",
                    { error }
                );
                // Create new client for interactive login
                this.client = new GramJSClient(
                    new StringSession(""),
                    this.credentials.api_id,
                    this.credentials.api_hash,
                    {
                        connectionRetries: 5,
                    }
                );
                await this.handleInteractiveLogin();
            }
        } catch (error) {
            this.logger.error("TelegramClient", "Failed to login as user", {
                error,
            });
            throw error;
        }
    }

    private async handleInteractiveLogin(): Promise<void> {
        const rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            await this.client!.start({
                phoneNumber: async () => {
                    return await new Promise<string>((resolve) => {
                        rl.question(
                            "Please enter your phone number: ",
                            (phone: string) => {
                                resolve(phone);
                            }
                        );
                    });
                },
                password: async () => {
                    return await new Promise<string>((resolve) => {
                        rl.question(
                            "Please enter your 2FA password (if enabled): ",
                            (password: string) => {
                                resolve(password);
                            }
                        );
                    });
                },
                phoneCode: async () => {
                    return await new Promise<string>((resolve) => {
                        rl.question(
                            "Please enter the code you received: ",
                            (code: string) => {
                                resolve(code);
                            }
                        );
                    });
                },
                onError: (err) => {
                    this.logger.error("TelegramClient", "Error during login", {
                        error: err,
                    });
                },
            });

            // Save and display the new session string
            const newSessionString = await this.client!.session.save();
            console.log("\n⚠️ SAVE THIS SESSION STRING FOR FUTURE USE:");
            console.log(newSessionString);

            // Get user details and send startup message
            const me = await this.client!.getMe();
            await this.sendStartupMessage(me as Api.User);
        } finally {
            rl.close();
        }
    }

    private async sendStartupMessage(user: Api.User): Promise<void> {
        if (!env.TELEGRAM_STARTUP_CHAT_ID) return;

        try {
            const message =
                `🤖 User logged in successfully!\n` +
                `User ID: ${user.id}\n` +
                `Username: @${user.username || "unknown"}\n` +
                `Time: ${new Date().toLocaleString()}`;

            const result = await this.sendMessage({
                chatId: parseInt(env.TELEGRAM_STARTUP_CHAT_ID),
                content: message,
            });

            this.logger.info("TelegramClient", "Startup message sent", {
                result,
            });
        } catch (msgError) {
            this.logger.error(
                "TelegramClient",
                "Failed to send startup message",
                { error: msgError }
            );
        }
    }

    public async logout(): Promise<void> {
        try {
            if (this.client) {
                await this.client.destroy();
                this.logger.info("TelegramClient", "Logged out successfully.");
            }
        } catch (error) {
            this.logger.error("TelegramClient", "Failed to log out", {
                error,
            });
            throw error;
        }
    }

    /**
     * Create an output for sending Telegram message
     */
    public createSendMessageOutput() {
        return {
            name: "telegram_send_message",
            handler: async (data: SendMessageData) => {
                return await this.sendMessage(data);
            },
            response: {
                success: "boolean",
                chatId: "number",
                messageId: "number",
            },
        };
    }

    /**
     * Create a handler for periodic chat list updates
     */
    public createChatListScraper() {
        return {
            name: "telegram_chat_list_scraper",
            handler: async () => {
                try {
                    const chats = await this.getChats();

                    if (env.TELEGRAM_STARTUP_CHAT_ID) {
                        // Limit to first 20 chats and split into chunks
                        const chatChunks = chats
                            .slice(0, 20)
                            .reduce((acc: string[], chat, index) => {
                                const chatInfo =
                                    `${index + 1}. ${chat.type}: ${chat.title || chat.username || chat.id}\n` +
                                    `ID: ${chat.id}\n` +
                                    `Members: ${chat.memberCount || "N/A"}\n`;

                                if (
                                    !acc.length ||
                                    acc[acc.length - 1].length +
                                        chatInfo.length >
                                        4000
                                ) {
                                    acc.push(chatInfo);
                                } else {
                                    acc[acc.length - 1] += "\n" + chatInfo;
                                }
                                return acc;
                            }, []);

                        // Send each chunk as a separate message
                        for (let i = 0; i < chatChunks.length; i++) {
                            const header = `📊 Chat List Update (Part ${i + 1}/${chatChunks.length})\n\n`;
                            await this.sendMessage({
                                chatId: parseInt(env.TELEGRAM_STARTUP_CHAT_ID),
                                content: header + chatChunks[i],
                            });
                        }
                    }

                    return {
                        success: true,
                        chats: chats,
                    };
                } catch (error) {
                    this.logger.error(
                        "TelegramClient.chatListScraper",
                        "Error scraping chats",
                        { error }
                    );
                    return {
                        success: false,
                        error: error,
                    };
                }
            },
            response: {
                success: "boolean",
                chats: "array",
            },
        };
    }

    private async sendMessage(
        data: SendMessageData
    ): Promise<{ success: boolean; chatId?: number; messageId?: number }> {
        try {
            this.logger.info("TelegramClient.sendMessage", "Sending message", {
                chatId: data.chatId,
                contentLength: data.content.length,
            });

            if (!this.client) {
                throw new Error("Client not initialized");
            }

            if (env.DRY_RUN) {
                this.logger.info(
                    "TelegramClient.sendMessage",
                    "DRY_RUN: Would send message",
                    { data }
                );
                return { success: true };
            }

            // Get the entity first
            try {
                const entity = await this.client.getEntity(data.chatId);
                if (!entity) {
                    throw new Error(
                        `No entity found for chat ID: ${data.chatId}`
                    );
                }

                const result = await this.client.sendMessage(entity, {
                    message: data.content,
                });

                this.logger.info(
                    "TelegramClient.sendMessage",
                    "Message sent successfully",
                    {
                        messageId: result.id,
                        chatId: data.chatId,
                    }
                );

                return {
                    success: true,
                    chatId: data.chatId,
                    messageId: result.id,
                };
            } catch (entityError) {
                // If entity not found, try sending directly to chat ID as fallback
                this.logger.warn(
                    "TelegramClient.sendMessage",
                    "Failed to get entity, trying direct send",
                    { error: entityError }
                );
                const result = await this.client.sendMessage(
                    data.chatId.toString(),
                    {
                        message: data.content,
                    }
                );

                return {
                    success: true,
                    chatId: data.chatId,
                    messageId: result.id,
                };
            }
        } catch (error) {
            this.logger.error(
                "TelegramClient.sendMessage",
                "Error sending message",
                { error }
            );
            throw error;
        }
    }

    public async getChats(): Promise<ChatInfo[]> {
        try {
            if (!this.client) {
                throw new Error("Client not initialized");
            }

            this.logger.info(
                "TelegramClient.getChats",
                "Fetching all chats..."
            );

            if (this.credentials.is_bot) {
                // For bots, we need to use getUpdates to get chat information
                const chats = await this.client.invoke(
                    new Api.messages.GetChats({
                        id: [],
                    })
                );

                return (chats.chats || []).map((chat) => ({
                    id: Number(chat.id),
                    title: "title" in chat ? chat.title : undefined,
                    type: chat.className,
                    memberCount:
                        "participantsCount" in chat
                            ? chat.participantsCount
                            : undefined,
                    username: "username" in chat ? chat.username : undefined,
                }));
            } else {
                // For users, we can use getDialogs
                const dialogs = await this.client.getDialogs({});
                const chats: ChatInfo[] = [];

                for (const dialog of dialogs) {
                    if (!dialog.entity) continue;
                    const chat = dialog.entity;
                    chats.push({
                        id: Number(chat.id),
                        title: (chat as any).title || undefined,
                        type: chat.className,
                        memberCount: (chat as any).participantsCount,
                        username: (chat as any).username || undefined,
                    });
                }
                return chats;
            }
        } catch (error) {
            this.logger.error(
                "TelegramClient.getChats",
                "Error fetching chats",
                { error }
            );
            throw error;
        }
    }
}
