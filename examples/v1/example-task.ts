/**
 * Advanced example demonstrating a hierarchical goal planning system using Dreams
 * with Claude 3.7 Sonnet for autonomous agent behavior in a game environment. This is still alpha and not all features are available.
 *
 * This example shows how to:
 * 1. Create a hierarchical goal planning system (long/medium/short-term goals)
 * 2. Decompose goals into executable tasks
 * 3. Track and update goal progress
 * 4. Integrate with external APIs (Tavily, Eternum)
 *
 * Usage
 * 1. First ask the agent to "set up a plan to win at Eternum"
 * 2. Then ask the agent to execute the plan.
 */
import {
  createDreams,
  context,
  render,
  action,
  LogLevel,
  output,
  createContainer,
  fetchGraphQL,
  type InferContextMemory,
  validateEnv,
} from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { deepResearch } from "./deep-research/research";
import { string, z } from "zod";
import { tavily } from "@tavily/core";
import {
  ETERNUM_CONTEXT,
  QUERY_GUIDE,
  PROVIDER_GUIDE,
} from "../v0/eternum-context";
import { anthropic } from "@ai-sdk/anthropic";
import { StarknetChain } from "../../packages/core/src/chains/starknet";

// Initialize the starknetChain instance with configuration
const starknetChain = new StarknetChain({
  rpcUrl: process.env.STARKNET_RPC_URL || "http://localhost:5050",
  address: process.env.STARKNET_ADDRESS || "0x0",
  privateKey: process.env.STARKNET_PRIVATE_KEY || "0x0",
});

validateEnv(
  z.object({
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
    TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    STARKNET_RPC_URL: z.string().min(1, "STARKNET_RPC_URL is required"),
    STARKNET_ADDRESS: z.string().min(1, "STARKNET_ADDRESS is required"),
    STARKNET_PRIVATE_KEY: z.string().min(1, "STARKNET_PRIVATE_KEY is required"),
    GRAPHQL_URL: z.string().min(1, "GRAPHQL_URL is required"),
  })
);

/**
 * EXAMPLE USAGE:
 *
 * 1. Initialize the agent with a high-level objective:
 *    "Build a thriving settlement in Eternum with sustainable resource production"
 *
 * 2. The agent will automatically:
 *    - Break this down into hierarchical goals (long/medium/short-term)
 *    - Prioritize goals based on dependencies and importance
 *    - Execute tasks to achieve each goal
 *    - Update goal status as progress is made
 *
 * 3. Sample goal hierarchy:
 *    - Long-term: "Establish a self-sustaining settlement"
 *      - Medium-term: "Secure reliable food production"
 *        - Short-term: "Build 3 farms near water source"
 *          - Tasks: [Scout location, Gather resources, Construct buildings]
 */

// ==========================================
// SCHEMA DEFINITIONS
// ==========================================

/**
 * Defines the structure of individual tasks that make up a goal
 */
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

/**
 * Defines the structure of a goal with metadata for tracking and execution
 */
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

/**
 * Defines the hierarchical goal planning structure with three time horizons
 */
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

// ==========================================
// MODEL AND CONTAINER SETUP
// ==========================================

// Create a dependency injection container for services
const container = createContainer();

// Register Tavily search service
container.singleton("tavily", () => {
  return tavily({
    apiKey: process.env.TAVILY_API_KEY!,
  });
});

// ==========================================
// CONTEXT DEFINITION
// ==========================================

/**
 * Template for the goal manager context
 * This provides structure for the LLM to understand the current state
 */
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

// Type definition for the goal planning schema
type Goal = z.infer<typeof goalPlanningSchema>;

/**
 * Context for managing goals and tasks
 * This maintains the state of goals and provides rendering for the LLM
 */
const goalContexts = context({
  type: "goal-manager",
  schema: z.object({
    id: string(),
  }),

  key({ id }) {
    return id;
  },

  create(state) {
    return {
      goal: null as null | Goal,
      tasks: [],
      currentTask: null,
    };
  },

  render({ memory }) {
    return render(template, {
      goal: memory.goal ?? "NONE",
      tasks: memory?.tasks?.join("\n"),
      currentTask: memory?.currentTask ?? "NONE",
    });
  },
});

// Type for the goal context memory
type GoalContextMemory = InferContextMemory<typeof goalContexts>;

// ==========================================
// ACTIONS DEFINITION
// ==========================================

/**
 * Create the Dreams agent with all necessary components
 */
createDreams({
  logger: LogLevel.INFO,
  debugger: async (contextId, keys, data) => {
    const [type, id] = keys;
    await Bun.write(`./logs/tasks/${contextId}/${id}-${type}.md`, data);
  },
  model: anthropic("claude-3-7-sonnet-latest"),
  extensions: [cli, deepResearch],
  context: goalContexts,
  container,
  actions: [
    /**
     * Action to decompose a goal into executable tasks
     */
    action({
      name: "decomposeGoal",
      description: "Decompose a goal into executable tasks",
      schema: z.object({
        goalId: z.string().describe("ID of the goal to decompose"),
        goalType: z
          .enum(["long_term", "medium_term", "short_term"])
          .describe("Type of goal"),
      }),
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory as GoalContextMemory;

        if (!agentMemory.goal) {
          return { error: "No goals have been set yet" };
        }

        const goalType = call.data.goalType;
        const goalId = call.data.goalId;

        // Find the goal in the specified category
        const goal = agentMemory.goal[goalType].find((g) => g.id === goalId);

        if (!goal) {
          return {
            error: `Goal with ID ${goalId} not found in ${goalType} goals`,
          };
        }

        // Return the goal for task decomposition
        return {
          goal,
          message: `Ready to decompose goal: ${goal.description}`,
        };
      },
    }),

    /**
     * Action to set the complete goal plan
     */
    action({
      name: "setGoalPlan",
      description: "Set the complete goal plan",
      schema: z.object({ goal: goalPlanningSchema }),
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory as GoalContextMemory;
        agentMemory.goal = call.data.goal;
        return {
          plan: call.data.goal,
          message: "Goal plan has been set successfully",
        };
      },
    }),

    /**
     * Action to update a goal's state or properties
     */
    action({
      name: "updateGoal",
      description: "Update a goal's state or properties",
      schema: z.object({
        goalId: z.string().describe("ID of the goal to update"),
        goalType: z
          .enum(["long_term", "medium_term", "short_term"])
          .describe("Type of goal"),
        updates: goalSchema.partial().describe("Properties to update"),
      }),
      handler(call, ctx, agent) {
        const agentMemory = ctx.agentMemory as GoalContextMemory;

        if (!agentMemory.goal) {
          return { error: "No goals have been set yet" };
        }

        const goalType = call.data.goalType;
        const goalId = call.data.goalId;

        // Find the goal in the specified category
        const goalIndex = agentMemory.goal[goalType].findIndex(
          (g) => g.id === goalId
        );

        if (goalIndex === -1) {
          return {
            error: `Goal with ID ${goalId} not found in ${goalType} goals`,
          };
        }

        // Update the goal with the provided updates
        agentMemory.goal[goalType][goalIndex] = {
          ...agentMemory.goal[goalType][goalIndex],
          ...call.data.updates,
        };

        return {
          updatedGoal: agentMemory.goal[goalType][goalIndex],
          message: `Goal ${goalId} has been updated successfully`,
        };
      },
    }),

    /**
     * Action to query Eternum game context
     */
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

    /**
     * Action to query Eternum GraphQL API for game state
     */
    action({
      name: "Query:Eternum:Graphql",
      description: `
          USE WHEN:
          - You need to query the game state
          - You need to get the resources or buildings in the game

          RULES:
          - You must only use valid graphql syntax
          - Never use "\\n" or escape any characters in the string
          - Only submit the query, no other text
          - ${QUERY_GUIDE}
        `,
      schema: z.object({
        query: z.string().describe(`
            query GetRealmDetails {
              eternumResourceModels(where: { entity_id: ENTITY_ID }, limit: 100) {
                edges {
                  node {
                      resource_type
                      balance
                  }
                }
              }
            eternumBuildingModels(where: { outer_col: X, outer_row: Y }) {
              edges {
                node {
                    category
                    entity_id
                    inner_col
                    inner_row
                }
              }
            }
          }`),
      }),
      async handler(call, ctx, agent) {
        console.log("Query:Eternum:Graphql Action called: ", call);
        const result = await fetchGraphQL(
          process.env.GRAPHQL_URL!,
          call.data.query
        );

        if (result instanceof Error) {
          return {
            error: result.message,
          };
        }

        return {
          data: {
            result: result,
          },
          timestamp: Date.now(),
        };
      },
    }),

    /**
     * Action to execute a transaction on the Starknet chain
     */
    action({
      name: "Execute:Starknet:Transaction",
      description: `
          USE WHEN:
          - You need to execute a transaction on the Starknet chain
          - You need to call a function on a Starknet contract

          RULES:
          - ${PROVIDER_GUIDE}
        `,
      schema: z.object({
        contractAddress: z
          .string()
          .describe(
            "The address of the contract to execute the transaction on"
          ),
        entrypoint: z
          .string()
          .describe("The entrypoint to call on the contract"),
        calldata: z
          .array(
            z.union([
              z.number(),
              z.string(),
              z.array(z.union([z.number(), z.string()])),
            ])
          )
          .describe("The calldata to pass to the entrypoint."),
      }),
      async handler(call, ctx, agent) {
        console.log("Execute:Starknet:Transaction Action called: ", call);
        const result = await starknetChain.write(call.data);
        if (result instanceof Error) {
          console.error(
            "Error executing transaction:",
            result.message,
            "\nCall data:",
            JSON.stringify(
              {
                contractAddress: call.data.contractAddress,
                entrypoint: call.data.entrypoint,
                calldata: call.data.calldata,
              },
              null,
              2
            )
          );
          return {
            error: result.message,
          };
        }
        return {
          content: `Transaction executed successfully: ${JSON.stringify(
            result,
            null,
            2
          )}`,
        };
      },
    }),
  ],

  // ==========================================
  // OUTPUTS DEFINITION
  // ==========================================

  outputs: {
    /**
     * Output to update the goal state
     */
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
});
