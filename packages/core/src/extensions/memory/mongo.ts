import { Collection, MongoClient, ObjectId } from "mongodb";
import type { MemoryStore } from "../../types";

export interface MongoMemoryOptions {
  uri: string;
  dbName?: string;
  collectionName?: string;
}

export class MongoMemoryStore implements MemoryStore {
  private client: MongoClient;
  private collection: Collection | null = null;
  private readonly dbName: string;
  private readonly collectionName: string;

  constructor(options: MongoMemoryOptions) {
    this.client = new MongoClient(options.uri);
    this.dbName = options.dbName || "dreams_memory";
    this.collectionName = options.collectionName || "conversations";
  }

  /**
   * Initialize the MongoDB connection
   */
  async initialize(): Promise<void> {
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.collection = db.collection(this.collectionName);
  }

  /**
   * Retrieves a value from the store
   * @param key - Key to look up
   * @returns The stored value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    const doc = await this.collection.findOne({ _id: new ObjectId(key) });
    if (!doc) return null;

    return doc.value as T;
  }

  /**
   * Stores a value in the store
   * @param key - Key to store under
   * @param value - Value to store
   */
  async set(key: string, value: any): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    await this.collection.updateOne(
      { _id: new ObjectId(key) },
      { $set: { value } },
      { upsert: true }
    );
  }

  /**
   * Removes a specific entry from the store
   * @param key - Key to remove
   */
  async delete(key: string): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    await this.collection.deleteOne({ _id: new ObjectId(key) });
  }

  /**
   * Removes all entries from the store
   */
  async clear(): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");

    await this.collection.deleteMany({});
  }

  /**
   * Close the MongoDB connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}

/**
 * Creates a new MongoDB-backed memory store
 * @param options - MongoDB connection options
 * @returns A MemoryStore implementation using MongoDB for storage
 */
export async function createMongoMemoryStore(
  options: MongoMemoryOptions
): Promise<MemoryStore> {
  const store = new MongoMemoryStore(options);
  await store.initialize();
  return store;
}
