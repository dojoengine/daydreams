import { createGroq } from "@ai-sdk/groq";
import { twitter } from "@daydreamsai/core/extensions";
import { createDreams, LogLevel, memory } from "@daydreamsai/core";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const agent = createDreams({
  logger: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [twitter],
});

// Start the agent
await agent.start();
