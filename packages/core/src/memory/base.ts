import type { MemoryStore, VectorStore, WorkingMemory } from "../types";

/**
 * Base memory implementation providing storage and vector capabilities
 */
export type BaseMemory = {
  /** Store for conversation memory data */
  store: MemoryStore;
  /** Store for vector embeddings and similarity search */
  vector: VectorStore;
};

/**
 * Creates a new BaseMemory instance
 * @param store - Memory store implementation for conversation data
 * @param vector - Vector store implementation for embeddings
 * @returns A new BaseMemory instance
 */
export function createMemory(
  store: MemoryStore,
  vector: VectorStore
): BaseMemory {
  return { store, vector };
}

/**
 * Retrieves or creates a new conversation memory for the given ID
 * @param memory - The memory store to use
 * @param conversationId - Unique identifier for the conversation
 * @returns A WorkingMemory object for the conversation
 */
export async function getOrCreateConversationMemory(
  memory: MemoryStore,
  conversationId: string
): Promise<WorkingMemory> {
  const data = await memory.get<WorkingMemory>(conversationId);
  if (data) return data;
  return {
    inputs: [],
    outputs: [],
    thoughts: [],
    calls: [],
    results: [],
  };
}

/**
 * Creates a new in-memory store for conversation data
 * @returns A MemoryStore implementation using a Map for storage
 */
const data = new Map<string, any>();
export function createMemoryStore(): MemoryStore {
  return {
    /**
     * Retrieves a value from the store
     * @param key - Key to look up
     * @returns The stored value or null if not found
     */
    async get(key: string) {
      return data.get(key) ?? null;
    },

    /**
     * Removes all entries from the store
     */
    async clear() {
      data.clear();
    },

    /**
     * Removes a specific entry from the store
     * @param key - Key to remove
     */
    async delete(key: string) {
      data.delete(key);
    },

    /**
     * Stores a value in the store
     * @param key - Key to store under
     * @param value - Value to store
     */
    async set(key: string, value: any) {
      data.set(key, value);
    },
  };
}

/**
 * Creates a no-op vector store implementation
 * @returns A VectorStore implementation that performs no operations
 */
export function createVectorStore(): VectorStore {
  return {
    /**
     * No-op implementation of vector store upsert
     * @param contextId - Context ID (unused)
     * @param data - Data to store (unused)
     */
    upsert(contextId: string, data: any[]) {
      return Promise.resolve();
    },

    /**
     * No-op implementation of vector store query
     * @param contextId - Context ID (unused)
     * @param query - Query string (unused)
     * @returns Empty array
     */
    query(contextId: string, query: string) {
      return Promise.resolve([]);
    },

    /**
     * No-op implementation of index creation
     * @param indexName - Name of index to create (unused)
     */
    createIndex(indexName: string) {
      return Promise.resolve();
    },

    /**
     * No-op implementation of index deletion
     * @param indexName - Name of index to delete (unused)
     */
    deleteIndex(indexName: string) {
      return Promise.resolve();
    },
  };
}
