/**
 * Basic example demonstrating a simple chat interface using Dreams
 * with a command line interface and Groq's LLM.
 */
import { createGroq } from "@ai-sdk/groq";
import {
  createDreams,
  cli,
  context,
  render,
  action,
  LogLevel,
  evaluator,
  output,
  createContainer,
  createChromaVectorStore,
  createMemoryStore,
} from "@daydreamsai/core/v1";
import { deepResearch } from "./deep-research/research";
import { string, z } from "zod";
import { tavily } from "@tavily/core";
import { ETERNUM_CONTEXT } from "../v0/eternum-context";

const taskSchema = z.object({
  plan: z.string().optional(),
  meta: z.any().optional(),
  actions: z.array(
    z.object({
      type: z.string(),
      context: z.string(),
      payload: z.any(),
    })
  ),
});

export const goalSchema = z
  .object({
    id: z.string(),
    description: z.string().describe("A description of the goal"),
    success_criteria: z.array(z.string()).describe("The criteria for success"),
    dependencies: z.array(z.string()).describe("The dependencies of the goal"),
    priority: z.number().min(1).max(10).describe("The priority of the goal"),
    required_resources: z
      .array(z.string())
      .describe("The resources needed to achieve the goal"),
    estimated_difficulty: z
      .number()
      .min(1)
      .max(10)
      .describe("The estimated difficulty of the goal"),
    tasks: z
      .array(taskSchema)
      .describe(
        "The tasks to achieve the goal. This is where you build potential tasks you need todo, based on your understanding of what you can do. These are actions."
      ),
  })
  .describe("A goal to be achieved");

export const goalPlanningSchema = z.object({
  long_term: z
    .array(goalSchema)
    .describe("Strategic goals that are the main goals you want to achieve"),
  medium_term: z
    .array(goalSchema)
    .describe(
      "Tactical goals that will require many short term goals to achieve"
    ),
  short_term: z
    .array(goalSchema)
    .describe(
      "Immediate actionable goals that will require a few tasks to achieve"
    ),
});

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const template = `
Goal: {{goal}} 
Tasks: {{tasks}}
Current Task: {{currentTask}}

<goal_planning_rules>
1. Break down the objective into hierarchical goals
2. Each goal must have clear success criteria
3. Identify dependencies between goals
4. Prioritize goals (1-10) based on urgency and impact
5. short term goals should be given a priority of 10
6. Ensure goals are achievable given the current context
7. Consider past experiences when setting goals
8. Use available game state information to inform strategy

# Each goal must include:
- id: Unique temporary ID used in dependencies
- description: Clear goal statement
- success_criteria: Array of specific conditions for completion
- dependencies: Array of prerequisite goal IDs (empty for initial goals)
- priority: Number 1-10 (10 being highest)
- required_resources: Array of resources needed (based on game state)
- estimated_difficulty: Number 1-10 based on past experiences
</goal_planning_rules>
`;

type Goal = z.infer<typeof goalPlanningSchema>;

const goalContexts = context({
  type: "goal-manager",
  schema: z.object({
    id: string(),
    goalPlanningSchema,
  }),

  key({ id }) {
    return id;
  },

  create(state) {
    console.log({ state });
    return {
      goal: state.args.goalPlanningSchema,
      tasks: state.args?.goalPlanningSchema?.long_term?.map(
        (goal) => goal.description
      ),
      currentTask: state.args?.goalPlanningSchema?.long_term?.[0]?.description,
    };
  },

  render({ memory }) {
    return render(template, {
      goal: memory.goal,
      tasks: memory?.tasks?.join("\n"),
      currentTask: memory?.currentTask ?? "NONE",
    });
  },
});

const container = createContainer();

container.singleton("tavily", () => {
  return tavily({
    apiKey: process.env.TAVILY_API_KEY!,
  });
});

// Create Dreams agent instance
const agent = createDreams({
  logger: LogLevel.DEBUG,
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli, deepResearch],
  context: goalContexts,
  container,
  actions: [
    action({
      name: "addTask",
      description: "Add a task to the goal",
      schema: z.object({ task: z.string() }),
      // enabled: ({ context }) => context.type === goalContexts.type,
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory as Goal;
        console.log(agentMemory);
        agentMemory.long_term.push({
          id: "1",
          description: call.data.task,
          success_criteria: [],
          dependencies: [],
          priority: 1,
          required_resources: [],
          estimated_difficulty: 1,
        });
        return {};
      },
    }),
    action({
      name: "createGoalPlan",
      description: "Create goal plan",
      schema: z.object({ goal: goalPlanningSchema }),
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory.goal as Goal;

        agentMemory.long_term.push(...call.data.goal.long_term);
        agentMemory.medium_term.push(...call.data.goal.medium_term);
        agentMemory.short_term.push(...call.data.goal.short_term);
        return call;
      },
    }),
    action({
      name: "updateGoal",
      description:
        "Use this to update a goals state if you think it is complete",
      schema: z.object({ goal: goalSchema }),
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory.goal as Goal;
        const goal = agentMemory.long_term.find(
          (goal) => goal.id === call.data.goal.id
        );
        if (!goal) {
          return { error: "Goal not found" };
        }
        goal.description = call.data.goal.description;
        goal.success_criteria = call.data.goal.success_criteria;
        goal.dependencies = call.data.goal.dependencies;
        goal.priority = call.data.goal.priority;
        goal.required_resources = call.data.goal.required_resources;
        goal.estimated_difficulty = call.data.goal.estimated_difficulty;
        return {};
      },
    }),
    action({
      name: "queryEternum",
      description:
        "This will tell you everything you need to know about Eternum for how to win the game",
      schema: z.object({ query: z.string() }),
      handler(call, ctx, agent) {
        return {
          data: {
            result: ETERNUM_CONTEXT,
          },
          timestamp: Date.now(),
        };
      },
    }),
    action({
      name: "Query:Eternum:Graphql",
      description: "Search Eternum GraphQL API",
      schema: z.object({ query: z.string() }),
      handler(call, ctx, agent) {
        console.log(call.data.query);
        return {
          data: {
            result: ETERNUM_CONTEXT,
          },
          timestamp: Date.now(),
        };
      },
    }),
  ],
  outputs: {
    "goal-manager:state": output({
      description:
        "Use this when you need to update the goals. Use the goal id to update the goal. You should attempt the goal then call this to update the goal.",
      instructions: "Increment the state of the goal manager",
      schema: z.object({
        type: z
          .enum(["SET", "UPDATE"])
          .describe("SET to set the goals. UPDATE to update a goal."),
        goal: goalSchema,
      }),
      handler: async (call, ctx, agent) => {
        // get goal id
        // update state of the goal id and the changes

        console.log("handler", { call, ctx, agent });

        return {
          data: {
            goal: "",
          },
          timestamp: Date.now(),
        };
      },
    }),
  },
}).start({
  id: "game",
  goalPlanningSchema: {
    long_term: [],
    medium_term: [],
    short_term: [],
  },
});
