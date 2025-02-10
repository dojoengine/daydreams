import { z } from "zod";
import type { AgentContext } from "../types";

// Represents a primitive task or action that can be directly executed
export interface Operator {
    id: string;
    name: string;
    preconditions: (state: WorldState) => boolean;
    effects: (state: WorldState) => WorldState;
    execute: (state: WorldState) => Promise<WorldState>;
}

// Represents the world state as a collection of facts/predicates
export interface WorldState {
    facts: Set<string>;
    variables: Record<string, any>;
}

// Represents a method for decomposing a task into subtasks
export interface Method {
    id: string;
    name: string;
    task: string;
    preconditions: (state: WorldState) => boolean;
    subtasks: string[]; // IDs of subtasks
    ordering?: [string, string][]; // Pairs of task IDs indicating ordering constraints
}

// Enhanced Goal interface with HTN-specific fields
export interface Goal {
    id: string;
    parentId?: string;
    type: string;
    status: GoalStatus;
    priority: number;
    data: Record<string, any>;
    subgoals: Goal[];
    createdAt: number;
    updatedAt: number;
    // HTN-specific additions
    initialState: WorldState;
    targetState?: Partial<WorldState>;
    taskNetwork: string[]; // IDs of top-level tasks
    plan?: string[]; // IDs of operators in the solution plan
}

export enum GoalStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    BLOCKED = "BLOCKED"
}

// Enhanced PlanningStrategy interface with HTN methods
export interface PlanningStrategy<Context extends AgentContext = AgentContext> {
    name: string;
    description: string;

    // Original methods
    createGoals(input: any, context: Context): Promise<Goal[]>;
    evaluateGoals(goals: Goal[], context: Context): Promise<Goal[]>;
    selectNextGoals(goals: Goal[], context: Context): Promise<Goal[]>;
    handleGoalUpdate(goal: Goal, context: Context): Promise<void>;

    // HTN-specific methods
    decomposeTask(taskId: string, state: WorldState): Promise<string[]>;
    findPlan(goal: Goal): Promise<string[] | null>;
    validatePlan(plan: string[], state: WorldState): Promise<boolean>;
}

// Enhanced PlanningSystem interface with HTN capabilities
export interface PlanningSystem<Context extends AgentContext = AgentContext> {
    // Original methods
    getGoals(): Promise<Goal[]>;
    getGoal(id: string): Promise<Goal | null>;
    addGoals(goals: Goal[]): Promise<void>;
    updateGoals(goals: Goal[]): Promise<void>;
    getNextGoals(): Promise<Goal[]>;
    processInput(input: any): Promise<void>;
    getStrategy(): PlanningStrategy<Context>;
    setStrategy(strategy: PlanningStrategy<Context>): void;

    // HTN-specific methods
    registerOperator(operator: Operator): void;
    registerMethod(method: Method): void;
    getOperator(id: string): Operator | undefined;
    getMethod(id: string): Method | undefined;
    getCurrentState(): WorldState;
    updateState(state: WorldState): void;
}

// Memory-related interfaces for plan caching and learning
export interface PlanMemory {
    storePlan(goal: Goal, plan: string[], success: boolean): Promise<void>;
    findSimilarPlan(goal: Goal): Promise<string[] | null>;
    recordFailure(methodId: string, state: WorldState): Promise<void>;
    getFailureRate(methodId: string): Promise<number>;
} 