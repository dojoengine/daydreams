import { createDreams, action, validateEnv } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { voice } from "./voice-actions";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";

// Validate environment variables
const env = validateEnv(
  z.object({
    ELEVENLABS_API_KEY: z.string().min(1, "ELEVENLABS_API_KEY is required"),
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  })
);

// Initialize Groq client
const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

/**
 * Action to respond to voice input
 */
const respondToVoiceAction = action({
  name: "respondToVoice",
  description: "Respond to voice input from the user",
  schema: z.object({
    response: z.string().describe("The response to the user's voice input"),
  }),
  handler: async (call, ctx) => {
    console.log("\n🤖 Assistant:", call.data.response);
    return { success: true };
  },
});

/**
 * Example demonstrating voice input using Eleven Labs
 */
async function main() {
  console.log("Starting voice assistant example...");
  console.log(
    "This example requires a browser environment with microphone access."
  );
  console.log(
    "Make sure you have set the ELEVENLABS_API_KEY environment variable."
  );

  // Create a new Dreams instance with voice extension
  const agent = await createDreams({
    model: groq("deepseek-r1-distill-llama-70b"),
    extensions: [cli, voice],
    actions: [respondToVoiceAction],
  }).start();

  console.log("\n🎤 Voice assistant is ready!");
  console.log("The assistant will automatically listen for voice input.");
  console.log("You can also type commands using the CLI interface.");
  console.log("Type 'exit' to quit the application.");
}

// Run the example
main().catch(console.error);
