import { randomUUID } from "crypto";
import type { AgentContext } from "../../types";
import type { Goal, PlanningStrategy } from "../types";
import { GoalStatus } from "../types";

export class SimplePlanningStrategy implements PlanningStrategy {
    name = "simple";
    description = "A simple sequential planning strategy";

    async createGoals(input: any, context: AgentContext): Promise<Goal[]> {
        // Simple example: create a single goal from input
        return [{
            id: randomUUID(),
            type: "user_request",
            status: GoalStatus.PENDING,
            priority: 1,
            data: { input },
            subgoals: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }];
    }

    async evaluateGoals(goals: Goal[], context: AgentContext): Promise<Goal[]> {
        // Simple example: just return goals as-is
        return goals;
    }

    async selectNextGoals(goals: Goal[], context: AgentContext): Promise<Goal[]> {
        // Simple example: select pending goals with highest priority
        return goals
            .filter(goal => goal.status === GoalStatus.PENDING)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 1);
    }

    async handleGoalUpdate(goal: Goal, context: AgentContext): Promise<void> {
        // Simple example: no special handling
    }
} 