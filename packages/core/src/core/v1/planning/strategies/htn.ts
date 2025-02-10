import { randomUUID } from "crypto";
import type { AgentContext } from "../../types";
import type {
    Goal,
    PlanningStrategy,
    WorldState,
    Operator,
    Method,
    PlanMemory
} from "../types";
import { GoalStatus } from "../types";

export class HTNPlanningStrategy implements PlanningStrategy {
    name = "htn";
    description = "Hierarchical Task Network planning strategy";

    private operators: Map<string, Operator> = new Map();
    private methods: Map<string, Method> = new Map();
    private memory: PlanMemory;

    constructor(memory: PlanMemory) {
        this.memory = memory;
    }

    async createGoals(input: any, context: AgentContext): Promise<Goal[]> {
        // Create a goal with initial HTN structure
        const goal: Goal = {
            id: randomUUID(),
            type: "user_request",
            status: GoalStatus.PENDING,
            priority: 1,
            data: { input },
            subgoals: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            initialState: this.getCurrentState(),
            taskNetwork: this.createInitialTaskNetwork(input)
        };

        return [goal];
    }

    async evaluateGoals(goals: Goal[], context: AgentContext): Promise<Goal[]> {
        return Promise.all(goals.map(async (goal) => {
            if (goal.status === GoalStatus.PENDING) {
                const plan = await this.findPlan(goal);
                if (plan) {
                    goal.plan = plan;
                    goal.status = GoalStatus.IN_PROGRESS;
                }
            }
            return goal;
        }));
    }

    async selectNextGoals(goals: Goal[], context: AgentContext): Promise<Goal[]> {
        return goals
            .filter(goal => goal.status === GoalStatus.IN_PROGRESS && goal.plan)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 1);
    }

    async handleGoalUpdate(goal: Goal, context: AgentContext): Promise<void> {
        if (goal.status === GoalStatus.COMPLETED && goal.plan) {
            await this.memory.storePlan(goal, goal.plan, true);
        }
    }

    async decomposeTask(taskId: string, state: WorldState): Promise<string[]> {
        const method = this.methods.get(taskId);
        if (!method) return [];

        if (!method.preconditions(state)) {
            await this.memory.recordFailure(taskId, state);
            return [];
        }

        return method.subtasks;
    }

    async findPlan(goal: Goal): Promise<string[] | null> {
        // First check memory for similar successful plans
        const cachedPlan = await this.memory.findSimilarPlan(goal);
        if (cachedPlan) return cachedPlan;

        // Otherwise perform HTN planning
        return this.planHTN(goal.taskNetwork, goal.initialState);
    }

    async validatePlan(plan: string[], state: WorldState): Promise<boolean> {
        let currentState = { ...state };

        for (const opId of plan) {
            const operator = this.operators.get(opId);
            if (!operator) return false;

            if (!operator.preconditions(currentState)) return false;
            currentState = operator.effects(currentState);
        }

        return true;
    }

    private async planHTN(
        tasks: string[],
        state: WorldState,
        depth: number = 0
    ): Promise<string[] | null> {
        if (tasks.length === 0) return [];
        if (depth > 100) return null; // Prevent infinite recursion

        const task = tasks[0];
        const remainingTasks = tasks.slice(1);

        // If primitive operator
        const operator = this.operators.get(task);
        if (operator) {
            if (!operator.preconditions(state)) return null;

            const newState = operator.effects(state);
            const subPlan = await this.planHTN(remainingTasks, newState, depth + 1);

            if (subPlan === null) return null;
            return [task, ...subPlan];
        }

        // If compound task
        const method = this.methods.get(task);
        if (!method) return null;

        // Check failure history
        const failureRate = await this.memory.getFailureRate(task);
        if (failureRate > 0.8) return null; // Skip methods that fail too often

        if (!method.preconditions(state)) return null;

        // Try to decompose
        const subtasks = await this.decomposeTask(task, state);
        const subPlan = await this.planHTN([...subtasks, ...remainingTasks], state, depth + 1);

        return subPlan;
    }

    private getCurrentState(): WorldState {
        return {
            facts: new Set(),
            variables: {}
        };
    }

    private createInitialTaskNetwork(input: any): string[] {
        // Convert input into initial task network
        // This would be domain-specific
        return [];
    }
} 