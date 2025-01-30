import { WebSocketServer, WebSocket } from "ws";
import chalk from "chalk";
import { z } from "zod";
import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";

// ---- Import your internal classes and functions here ----
import { LLMClient } from "../packages/core/src/core/llm-client";

import { ChromaVectorDB } from "../packages/core/src/core/vector-db";

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { RoomManager } from "../packages/core/src/core/room-manager";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { defaultCharacter } from "../packages/core/src/core/character";

import { LogLevel } from "../packages/core/src/core/types";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { MasterProcessor } from "../packages/core/src/core/processors/master-processor";

const scheduledTaskDb = new MongoDb(
    "mongodb://localhost:27017",
    "myApp",
    "scheduled_tasks"
);

await scheduledTaskDb.connect();
console.log(chalk.green("✅ Scheduled task database connected"));

await scheduledTaskDb.deleteAll();

// ------------------------------------------------------
// 1) CREATE DAYDREAMS AGENT
// ------------------------------------------------------
async function createDaydreamsAgent() {
    const loglevel = LogLevel.INFO;

    // 1.1. LLM Initialization
    const llmClient = new LLMClient({
        model: "anthropic/claude-3-5-sonnet-latest",
        temperature: 0.3,
    });

    // 1.2. Vector memory initialization
    const vectorDb = new ChromaVectorDB("agent_memory", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    // 1.3. Room manager initialization
    const roomManager = new RoomManager(vectorDb);

    const masterProcessor = new MasterProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // Initialize processor with default character personality
    const messageProcessor = new MessageProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    masterProcessor.addProcessor(messageProcessor);

    // 1.5. Initialize core system
    const orchestrator = new Orchestrator(
        roomManager,
        vectorDb,
        masterProcessor,
        scheduledTaskDb,
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    // 1.6. Register handlers
    orchestrator.registerIOHandler({
        name: "user_chat",
        role: HandlerRole.INPUT,
        execute: async (payload) => {
            return payload;
        },
    });

    orchestrator.registerIOHandler({
        name: "chat_reply",
        role: HandlerRole.OUTPUT,
        outputSchema: z.object({
            userId: z.string().optional(),
            message: z.string(),
        }),
        execute: async (payload) => {
            const { userId, message } = payload as {
                userId?: string;
                message: string;
            };
            console.log(`Reply to user ${userId ?? "??"}: ${message}`);
        },
    });

    // Return the orchestrator instance
    return orchestrator;
}

// Create a single "global" instance
const orchestrator = await createDaydreamsAgent();

// ------------------------------------------------------
// 2) WEBSOCKET SERVER
// ------------------------------------------------------
const wss = new WebSocketServer({ port: 8080 });
console.log(
    chalk.green("[WS] WebSocket server listening on ws://localhost:8080")
);

function sendJSON(ws: WebSocket, data: unknown) {
    ws.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {
    console.log(chalk.blue("[WS] New client connected."));

    sendJSON(ws, {
        type: "welcome",
        message: "being human is hard",
    });

    ws.on("message", async (rawData) => {
        try {
            const dataString = rawData.toString();
            console.log(chalk.magenta("[WS] Received message:"), dataString);

            const parsed = JSON.parse(dataString);
            const { userId, goal: userMessage, orchestratorId } = parsed;

            if (!userMessage || typeof userMessage !== "string") {
                throw new Error(
                    "Invalid message format. Expected { goal: string, userId: string }"
                );
            }

            if (!userId || typeof userId !== "string") {
                throw new Error("userId is required");
            }

            // Process the message using the orchestrator with the provided userId
            const outputs = await orchestrator.dispatchToInput(
                "user_chat",
                {
                    headers: {
                        "x-user-id": userId,
                    },
                },
                userMessage,
                orchestratorId ? orchestratorId : undefined
            );

            // Send responses back through WebSocket
            if (outputs && (outputs as any).length > 0) {
                for (const out of outputs as any[]) {
                    if (out.name === "chat_reply") {
                        sendJSON(ws, {
                            type: "response",
                            message: out.data.message,
                        });
                    }
                }
            }
        } catch (error) {
            console.error(chalk.red("[WS] Error processing message:"), error);
            sendJSON(ws, {
                type: "error",
                error: (error as Error).message || String(error),
            });
        }
    });

    ws.on("close", () => {
        console.log(chalk.yellow("[WS] Client disconnected."));
    });
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
    console.log(chalk.yellow("\n\nShutting down..."));

    // Close WebSocket server
    wss.close(() => {
        console.log(chalk.green("✅ WebSocket server closed"));
    });

    process.exit(0);
});

// Create Express app for REST API
const app = express();
app.use(cors());
app.use(express.json());

// Add REST endpoint for chat history
app.get("/api/history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Fetching history for userId:", userId);

        // Get all orchestrator records for this user
        const histories =
            await scheduledTaskDb.getOrchestratorsByUserId(userId);

        if (!histories || histories.length === 0) {
            console.log("No histories found");
            return res.status(404).json({ error: "No history found for user" });
        }

        res.json(histories);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({
            error: "Failed to fetch chat history",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

app.get("/api/history/:userId/:chatId", async (req, res) => {
    try {
        const { userId, chatId } = req.params;

        // Convert string chatId to ObjectId
        let objectId;
        try {
            objectId = new ObjectId(chatId);
        } catch (err) {
            return res.status(400).json({ error: "Invalid chat ID format" });
        }

        const history = await scheduledTaskDb.getOrchestratorById(objectId);

        if (!history) {
            return res.status(404).json({ error: "History not found" });
        }

        res.json(history);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({
            error: "Failed to fetch chat history",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

// Start the Express server
const API_PORT = 8081;
app.listen(API_PORT, () => {
    console.log(
        chalk.green(
            `[API] REST API server listening on http://localhost:${API_PORT}`
        )
    );
});
