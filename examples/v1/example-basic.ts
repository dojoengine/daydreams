/**
 * Basic example demonstrating a simple chat interface using Dreams
 * with a command line interface and Groq's LLM.
 */
import { createGroq } from "@ai-sdk/groq";
import { createDreams, context, render, action } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { string, z } from "zod";

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const template = `
Goal: {{goal}} 
Tasks: {{tasks}}
Current Task: {{currentTask}}
`;

type GoalMemory = {
  goal: string;
  tasks: string[];
  currentTask: string;
};

const goalContexts = context({
  type: "goal",
  schema: z.object({
    id: string(),
    initialGoal: z.string(),
    initialTasks: z.array(z.string()),
  }),

  key({ id }) {
    return id;
  },

  create(state) {
    return {
      goal: state.args.initialGoal,
      tasks: state.args.initialTasks ?? [],
      currentTask: state.args.initialTasks?.[0],
    };
  },

  render({ memory }) {
    return render(template, {
      goal: memory.goal,
      tasks: memory.tasks.join("\n"),
      currentTask: memory.currentTask ?? "NONE",
    });
  },
});

// Create Dreams agent instance
const agent = createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli],
  context: goalContexts,
  actions: [
    action({
      name: "addTask",
      schema: z.object({ task: z.string() }),
      // enabled: ({ context }) => context.type === goalContexts.type,
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory as GoalMemory;
        console.log(agentMemory);
        agentMemory.tasks.push(call.data.task);
        return {};
      },
    }),
  ],
}).start({ id: "test", initialGoal: "", initialTasks: [] });
