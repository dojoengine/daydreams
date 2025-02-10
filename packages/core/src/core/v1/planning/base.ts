import type { AgentContext, MemoryStore } from "../types";
import type { Goal, PlanningStrategy, PlanningSystem } from "./types";

export class BasePlanningSystem<Context extends AgentContext = AgentContext> implements PlanningSystem<Context> {
    private goals: Map<string, Goal> = new Map();
    private strategy: PlanningStrategy<Context>;
    private context: Context;
    private memory: MemoryStore;

    constructor(
        strategy: PlanningStrategy<Context>,
        context: Context,
        memory: MemoryStore
    ) {
        this.strategy = strategy;
        this.context = context;
        this.memory = memory;
    }

    async getGoals(): Promise<Goal[]> {
        return Array.from(this.goals.values());
    }

    async getGoal(id: string): Promise<Goal | null> {
        return this.goals.get(id) || null;
    }

    async addGoals(goals: Goal[]): Promise<void> {
        for (const goal of goals) {
            this.goals.set(goal.id, goal);
        }
        await this.saveGoals();
    }

    async updateGoals(goals: Goal[]): Promise<void> {
        for (const goal of goals) {
            const existing = this.goals.get(goal.id);
            if (existing) {
                this.goals.set(goal.id, {
                    ...existing,
                    ...goal,
                    updatedAt: Date.now()
                });
                await this.strategy.handleGoalUpdate(goal, this.context);
            }
        }
        await this.saveGoals();
    }

    async getNextGoals(): Promise<Goal[]> {
        const goals = await this.getGoals();
        return this.strategy.selectNextGoals(goals, this.context);
    }

    async processInput(input: any): Promise<void> {
        const newGoals = await this.strategy.createGoals(input, this.context);
        await this.addGoals(newGoals);

        const goals = await this.getGoals();
        const updatedGoals = await this.strategy.evaluateGoals(goals, this.context);
        await this.updateGoals(updatedGoals);
    }

    getStrategy(): PlanningStrategy<Context> {
        return this.strategy;
    }

    setStrategy(strategy: PlanningStrategy<Context>): void {
        this.strategy = strategy;
    }

    private async saveGoals(): Promise<void> {
        const goals = Array.from(this.goals.values());
        await this.memory.set(`${this.context.conversationId}:goals`, goals);
    }

    private async loadGoals(): Promise<void> {
        const goals = await this.memory.get<Goal[]>(`${this.context.conversationId}:goals`);
        if (goals) {
            this.goals = new Map(goals.map(goal => [goal.id, goal]));
        }
    }
} 