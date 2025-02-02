import { createHash } from "crypto";
import type { ConversationMetadata } from "./types";
import type { Memory } from "./types";

/**
 * Represents a conversation context that can store memories and metadata.
 */
export class Conversation {
    /** Unique identifier for the conversation */
    public readonly id: string;
    /** Collection of memories associated with this conversation */
    private memories: Memory[] = [];
    /** Metadata about the conversation like name, description, participants etc */
    private metadata: ConversationMetadata;

    /**
     * Creates a new Conversation instance
     * @param platformId - Platform-specific identifier (e.g. tweet thread ID, chat ID)
     * @param platform - Platform name where this conversation exists
     * @param metadata - Optional metadata to initialize the conversation with
     */
    constructor(
        public readonly platformId: string,
        public readonly platform: string,
        metadata?: Partial<ConversationMetadata>
    ) {
        this.id = Conversation.createDeterministicId(platform, platformId);

        this.metadata = {
            name: metadata?.name || `Conversation ${platformId}`,
            description: metadata?.description,
            participants: metadata?.participants || [],
            createdAt: metadata?.createdAt || new Date(),
            lastActive: metadata?.lastActive || new Date(),
            metadata: metadata?.metadata,
        };
    }

    /**
     * Creates a deterministic conversation ID based on platform and platformId
     * @param platform - Platform name
     * @param platformId - Platform-specific identifier
     * @returns A deterministic conversation ID string
     */
    public static createDeterministicId(
        platform: string,
        platformId: string
    ): string {
        const hash = createHash("sha256")
            .update(`${platform}:${platformId}`)
            .digest("hex")
            .slice(0, 16);

        return `${platform}_${hash}`;
    }

    /**
     * Adds a new memory to the conversation
     * @param content - Content of the memory
     * @param metadata - Optional metadata for the memory
     * @returns The created Memory object
     */
    public async addMemory(
        content: string,
        metadata?: Record<string, any>
    ): Promise<Memory> {
        // Create deterministic memory ID based on Conversation ID and content
        const memoryId = Conversation.createDeterministicMemoryId(
            this.id,
            content
        );

        const memory: Memory = {
            id: memoryId,
            conversationId: this.id,
            content,
            timestamp: new Date(),
            metadata,
        };

        this.memories.push(memory);
        this.metadata.lastActive = new Date();

        return memory;
    }

    /**
     * Creates a deterministic memory ID based on conversation ID and content
     * @param conversationId - ID of the conversation
     * @param content - Content of the memory
     * @returns A deterministic memory ID string
     */
    public static createDeterministicMemoryId(
        conversationId: string,
        content: string
    ): string {
        const hash = createHash("sha256")
            .update(`${conversationId}:${content}`)
            .digest("hex")
            .slice(0, 16);

        return `mem_${hash}`;
    }

    /**
     * Retrieves memories from the conversation
     * @param limit - Optional limit on number of memories to return
     * @returns Array of Memory objects
     */
    public getMemories(limit?: number): Memory[] {
        return limit ? this.memories.slice(-limit) : this.memories;
    }

    /**
     * Gets a copy of the conversation's metadata
     * @returns Copy of conversation metadata
     */
    public getMetadata(): ConversationMetadata {
        return { ...this.metadata };
    }

    /**
     * Updates the conversation's metadata
     * @param update - Partial metadata object with fields to update
     */
    public updateMetadata(update: Partial<ConversationMetadata>): void {
        this.metadata = {
            ...this.metadata,
            ...update,
            lastActive: new Date(),
        };
    }

    /**
     * Converts the conversation instance to a plain object
     * @returns Plain object representation of the conversation
     */
    public toJSON() {
        return {
            id: this.id,
            platformId: this.platformId,
            platform: this.platform,
            metadata: this.metadata,
            memories: this.memories,
        };
    }
}
