import type { HandlerRole, Memory } from "./types";
import type { Room } from "./room";

// Define interfaces matching MongoDB document shapes
export interface ScheduledTask {
    _id?: string;
    userId: string;
    handlerName: string;
    taskData: Record<string, any>;
    nextRunAt: Date;
    intervalMs?: number;
    status: "pending" | "running" | "completed" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

export interface OrchestratorMessage {
    role: HandlerRole;
    name: string;
    data: unknown;
    timestamp: Date;
}

export interface OrchestratorChat {
    _id?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    messages: OrchestratorMessage[];
}

export interface OrchestratorDb {
    // Orchestrator methods
    getOrchestratorById(id: string): Promise<OrchestratorChat | null>;
    getOrchestratorsByUserId(userId: string): Promise<OrchestratorChat[]>;
    createOrchestrator(userId: string): Promise<string>;
    addMessage(
        orchestratorId: string,
        role: HandlerRole,
        name: string,
        data: any
    ): Promise<void>;
    getMessages(orchestratorId: string): Promise<OrchestratorMessage[]>;

    // Task management methods
    createTask(
        userId: string,
        handlerName: string,
        taskData: Record<string, any>,
        nextRunAt: Date,
        intervalMs?: number
    ): Promise<string>;
    findDueTasks(limit?: number): Promise<ScheduledTask[]>;
    markRunning(taskId: string): Promise<void>;
    markCompleted(taskId: string, failed?: boolean): Promise<void>;
    updateNextRun(taskId: string, newRunTime: Date): Promise<void>;
    rescheduleIfRecurring(task: ScheduledTask): Promise<void>;
    deleteAll(): Promise<void>;
}

export interface MemoryManager {
    hasProcessedContentInRoom(
        contentId: string,
        roomId: string
    ): Promise<boolean>;
    ensureRoom(roomId: string, source: string, userId?: string): Promise<Room>;
    getMemoriesFromRoom(roomId: string): Promise<Memory[]>;
    addMemory(roomId: string, content: string, metadata?: any): Promise<void>;
    markContentAsProcessed(contentId: string, roomId: string): Promise<void>;
}
