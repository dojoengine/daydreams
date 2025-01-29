import { ObjectId } from "mongodb";

export interface OrchestratorData {
    _id: ObjectId;
    name: string;
    userId: string;
    model: string;
    temperature: number;
    messages: Array<any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrchestratorParams {
    name?: string;
    userId: string;
    model?: string;
    temperature?: number;
    initialMessage?: any;
} 