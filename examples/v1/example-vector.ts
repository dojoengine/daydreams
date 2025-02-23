import { createGroq } from "@ai-sdk/groq";
import {
  createContainer,
  createDreams,
  LogLevel,
  createMemoryStore,
} from "@daydreamsai/core";
import { cli, createChromaVectorStore } from "@daydreamsai/core/extensions";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const agent = createDreams({
  logger: LogLevel.DEBUG,
  container: createContainer(),
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli],
  memory: {
    store: createMemoryStore(),
    vector: createChromaVectorStore("agent", "http://localhost:8000"),
  },
});

// Start the agent
await agent.start();
