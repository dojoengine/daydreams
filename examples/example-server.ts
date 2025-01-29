import { WebSocketServer, WebSocket } from "ws";
import chalk from "chalk";
import { z } from "zod";
import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import { OrchestratorData } from "./types";
import { LLMClient } from "../packages/core/src/core/llm-client";

import { ChromaVectorDB } from "../packages/core/src/core/vector-db";

import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { RoomManager } from "../packages/core/src/core/room-manager";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { defaultCharacter } from "../packages/core/src/core/character";

import { LogLevel } from "../packages/core/src/core/types";
import { MongoDb } from "../packages/core/src/core/mongo-db";

const scheduledTaskDb = new MongoDb(
    "mongodb://localhost:27017",
    "myApp",
    "scheduled_tasks"
);

await scheduledTaskDb.connect();
console.log(chalk.green("✅ Scheduled task database connected"));


// ------------------------------------------------------
// 1) CREATE DAYDREAMS AGENT
// ------------------------------------------------------
async function createDaydreamsAgent(params?: {
    model?: string;
    temperature?: number;
}) {
    const loglevel = LogLevel.INFO;

    // 1.1. LLM Initialization
    const llmClient = new LLMClient({
        model: params?.model || "anthropic/claude-3-5-sonnet-latest",
        temperature: params?.temperature || 0.3,
    });

    // 1.2. Vector memory initialization
    const vectorDb = new ChromaVectorDB("agent_memory", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    // 1.3. Room manager initialization
    const roomManager = new RoomManager(vectorDb);

    // 1.4. Initialize processor with default character
    const processor = new MessageProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // 1.5. Initialize core system
    const orchestrator = new Orchestrator(
        roomManager,
        vectorDb,
        [processor],
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
        outputSchema: z.object({
            content: z.string(),
            userId: z.string().optional(),
        }),
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


    ws.on("message", async (rawData) => {
        try {
            const dataString = rawData.toString();
            console.log(chalk.magenta("[WS] Received message:"), dataString);

            const parsed = JSON.parse(dataString);
            const { userId, goal: userMessage, orchestratorId } = parsed;

            if (!userMessage || typeof userMessage !== "string") {
                throw new Error("Invalid message format. Expected { goal: string, userId: string }");
            }

            if (!userId || typeof userId !== "string") {
                throw new Error("userId is required");
            }

            let currentOrchestrator;
            if (orchestratorId) {
                const orchestratorData = await scheduledTaskDb.getOrchestratorById(orchestratorId);
                
                if (!orchestratorData) {
                    throw new Error(`Orchestrator not found with ID: ${orchestratorId}`);
                }

                currentOrchestrator = await createOrchestratorFromDb(orchestratorData as OrchestratorData);
            } else {
                const existingOrchestrators = await scheduledTaskDb.getOrchestratorsByUserId(userId);
                
                if (existingOrchestrators.length > 0) {
                    currentOrchestrator = await createOrchestratorFromDb(existingOrchestrators[0]);
                } else {
                    const defaultOrchestratorData = {
                        _id: new ObjectId(),
                        name: "Default Orchestrator",
                        userId: userId.toString(),
                        model: "anthropic/claude-3-5-sonnet-latest",
                        temperature: 0.3,
                        messages: [],
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    
                    await scheduledTaskDb.createOrchestrator(defaultOrchestratorData);
                    currentOrchestrator = await createOrchestratorFromDb(defaultOrchestratorData);
                }
            }

            const outputs = await currentOrchestrator.dispatchToInput(
                "user_chat",
                {
                    content: userMessage,
                    userId: userId,
                },
                userId,
                orchestratorId ? new ObjectId(orchestratorId) : undefined
            );

            if (outputs?.length > 0) {
                for (const out of outputs) {
                    if (out.name === "chat_reply") {
                        sendJSON(ws, {
                            type: "OUTPUT",
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

// Configuration CORS plus détaillée
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Ajoutez vos origines autorisées
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Create Express app for REST API
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Add REST endpoint for chat history
app.get("/api/history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { orchestratorId } = req.query;
        console.log(chalk.blue("[API] Fetching history:"), { userId, orchestratorId });

        let query: any = { userId: userId.toString() };
        if (orchestratorId) {
            query._id = new ObjectId(orchestratorId.toString());
        }

        let histories = await scheduledTaskDb.collection
            .find(query)
            .toArray();

        // Si aucun historique n'est trouvé et qu'aucun orchestratorId n'est spécifié,
        // créer un orchestrateur par défaut
        if (histories.length === 0 && !orchestratorId) {
            console.log(chalk.yellow("[API] No histories found, creating default orchestrator"));
            
            const id = new ObjectId();
            const defaultOrchestrator = {
                _id: id,
                name: "Default Orchestrator",
                userId: userId.toString(),
                messages: [{
                    role: "system",
                    name: "system",
                    data: {
                        content: "Default orchestrator initialized",
                        userId
                    },
                    timestamp: new Date()
                }],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await scheduledTaskDb.collection.insertOne(defaultOrchestrator);
            histories = [defaultOrchestrator];
            console.log(chalk.green("[API] Created default orchestrator:", id.toString()));
        }

        if (histories.length === 0) {
            console.log(chalk.yellow("[API] No histories found after creation attempt"));
            return res.status(404).json({ error: "No history found" });
        }

        console.log(chalk.blue("[API] Returning histories:"), histories);
        res.json(histories);
    } catch (error) {
        console.error(chalk.red("[API] Error fetching chat history:"), error);
        res.status(500).json({
            error: "Failed to fetch chat history",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});


// Récupérer l'historique d'un chat spécifique
app.get("/api/history/:userId/:chatId", async (req, res) => {
    try {
        const { userId, chatId } = req.params;
        const { orchestratorId } = req.query; // Ajout du orchestratorId depuis la query

        console.log("[API] Fetching chat history:", { userId, chatId, orchestratorId });

        // Convert string chatId to ObjectId
        let objectId;
        try {
            objectId = new ObjectId(chatId);
        } catch (err) {
            return res.status(400).json({ error: "Invalid chat ID format" });
        }

        // Récupérer l'historique avec l'orchestratorId
        const history = await scheduledTaskDb.collection.findOne({
            _id: objectId,
            userId: userId,
            ...(orchestratorId && { orchestratorId: orchestratorId })
        });

        if (!history) {
            return res.status(404).json({ error: "History not found" });
        }

        console.log("[API] Found history:", history);
        res.json(history);
    } catch (error) {
        console.error("[API] Error fetching chat history:", error);
        res.status(500).json({
            error: "Failed to fetch chat history",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

// Lister les orchestrateurs
app.get("/api/orchestrators", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        let orchestrators = await scheduledTaskDb.getOrchestratorsByUserId(userId);

        if (!orchestrators || orchestrators.length === 0) {
            console.log(chalk.yellow("[API] No orchestrators found, creating default one"));
            
            const id = new ObjectId();
            const defaultOrchestrator = {
                _id: id,
                name: "Default Orchestrator",
                userId: userId.toString(),
                model: "anthropic/claude-3-5-sonnet-latest",
                temperature: 0.3,
                messages: [{
                    role: "system",
                    name: "system",
                    data: {
                        content: "Default orchestrator initialized",
                        userId
                    },
                    timestamp: new Date()
                }],
                createdAt: new Date(),
                updatedAt: new Date()
            };


            await scheduledTaskDb.createOrchestrator(defaultOrchestrator);
            
            orchestrators = await scheduledTaskDb.getOrchestratorsByUserId(userId);
            console.log(chalk.green("[API] Created default orchestrator"), orchestrators);
        }

        if (!orchestrators || orchestrators.length === 0) {
            console.error(chalk.red("[API] Still no orchestrators after creation attempt"));
            throw new Error("Failed to create or retrieve orchestrators");
        }

        const response = orchestrators.map(orch => ({
            id: orch._id.toString(),
            name: orch.name || `Chat ${new Date(orch.createdAt).toLocaleString()}`,
            userId: orch.userId,
            model: orch.model,
            temperature: orch.temperature,
            messages: orch.messages || [],
            createdAt: orch.createdAt,
            updatedAt: orch.updatedAt
        }));
        res.json(response);
    } catch (error) {
        console.error(chalk.red("[API] Error listing orchestrators:"), error);
        res.status(500).json({
            error: "Failed to list orchestrators",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

// Créer un orchestrateur
app.post("/api/orchestrators", async (req, res) => {
    try {
        const { name, userId, model, temperature } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const id = new ObjectId();

        const initialMessage = {
            role: "system",
            name: "system",
            data: {
                content: "Orchestrator initialized",
                userId
            },
            timestamp: new Date()
        };

        const orchestratorData = {
            _id: id,
            name: name || `Orchestrator ${id}`,
            userId,
            model: model || "anthropic/claude-3-5-sonnet-latest",
            temperature: temperature || 0.3,
            messages: [initialMessage],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log(chalk.blue("[API] Saving orchestrator data:"), orchestratorData);
        await scheduledTaskDb.createOrchestrator(orchestratorData);

        res.json({
            id: id.toString(),
            name: orchestratorData.name,
            userId: orchestratorData.userId,
            model: orchestratorData.model,
            temperature: orchestratorData.temperature
        });
    } catch (error) {
        console.error(chalk.red("[API] Error creating orchestrator:"), error);
        res.status(500).json({
            error: "Failed to create orchestrator",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});

app.get("/api/orchestrators/:orchestratorId", async (req, res) => {
    try {
        const { orchestratorId } = req.params;
        const { userId } = req.query;

        console.log(chalk.blue("[API] Fetching orchestrator:"), { orchestratorId, userId });

        let objectId;
        try {
            objectId = new ObjectId(orchestratorId);
        } catch (err) {
            return res.status(400).json({ error: "Invalid orchestrator ID format" });
        }

        const orchestratorData = await scheduledTaskDb.collection.findOne({
            _id: objectId,
            userId: userId?.toString()
        });

        if (!orchestratorData) {
            return res.status(404).json({ error: "Orchestrator not found" });
        }

        await createOrchestratorFromDb(orchestratorData);

        console.log(chalk.blue("[API] Found orchestrator:"), orchestratorData);

        res.json({
            id: orchestratorData._id.toString(),
            name: orchestratorData.name,
            userId: orchestratorData.userId,
            model: orchestratorData.model,
            temperature: orchestratorData.temperature,
            messages: orchestratorData.messages || [],
            createdAt: orchestratorData.createdAt,
            updatedAt: orchestratorData.updatedAt
        });
    } catch (error) {
        console.error(chalk.red("[API] Error fetching orchestrator:"), error);
        res.status(500).json({
            error: "Failed to fetch orchestrator",
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

async function createOrchestratorFromDb(orchestratorData: OrchestratorData) {
    if (!orchestratorData) {
        throw new Error('Cannot create orchestrator from null data');
    }

    const loglevel = LogLevel.INFO;
    console.log('🔍 Creating orchestrator from data:', orchestratorData);
    
    const llmClient = new LLMClient({
        model: orchestratorData.model || "anthropic/claude-3-5-sonnet-latest",
        temperature: orchestratorData.temperature || 0.3,
    });

    const vectorDb = new ChromaVectorDB("agent_memory", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    const roomManager = new RoomManager(vectorDb);
    const processor = new MessageProcessor(llmClient, defaultCharacter, loglevel);

    const orchestrator = new Orchestrator(
        roomManager,
        vectorDb,
        [processor],
        scheduledTaskDb,
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    orchestrator.registerIOHandler({
        name: "user_chat",
        role: HandlerRole.INPUT,
        schema: z.object({
            content: z.string(),
            userId: z.string().optional(),
        }),
        handler: async (payload) => payload,
    });

    orchestrator.registerIOHandler({
        name: "chat_reply",
        role: HandlerRole.OUTPUT,
        schema: z.object({
            userId: z.string().optional(),
            message: z.string(),
        }),
        handler: async (payload) => {
            const { userId, message } = payload as {
                userId?: string;
                message: string;
            };
            console.log(`Reply to user ${userId ?? "??"}: ${message}`);
        },
    });

    return orchestrator;
}
