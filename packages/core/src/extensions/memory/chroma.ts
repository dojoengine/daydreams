/**
 * Imports required dependencies from chromadb and local types
 */
import {
  ChromaClient,
  Collection,
  OpenAIEmbeddingFunction,
  type IEmbeddingFunction,
} from "chromadb";
import type { InferContextMemory, VectorStore } from "../../types";

/**
 * Implementation of VectorStore using ChromaDB as the backend
 */
export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collection!: Collection;
  private embedder: IEmbeddingFunction;

  /**
   * Creates a new ChromaVectorStore instance
   * @param collectionName - Name of the ChromaDB collection to use (defaults to "default")
   * @param connection - Optional connection string for ChromaDB
   * @param embedder - Optional custom embedding function implementation
   */
  constructor(
    collectionName: string = "default",
    connection?: string,
    embedder?: IEmbeddingFunction
  ) {
    this.embedder =
      embedder ||
      new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY!,
        openai_model: "text-embedding-3-small",
      });
    this.client = new ChromaClient({
      path: connection,
    });
    this.initCollection(collectionName);
  }

  /**
   * Initializes or retrieves the ChromaDB collection
   * @param collectionName - Name of the collection to initialize
   */
  private async initCollection(collectionName: string) {
    this.collection = await this.client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: this.embedder,
      metadata: {
        description: "Memory storage for AI consciousness",
      },
    });
  }

  /**
   * Adds or updates documents in the vector store
   * @param contextId - Unique identifier for the context
   * @param data - Array of documents to store
   */
  async upsert(
    contextId: string,
    data: InferContextMemory<any>[]
  ): Promise<void> {
    if (data.length === 0) return;

    // Generate IDs for the documents
    const ids = data.map((_, index) => `doc_${Date.now()}_${index}`);

    // Convert documents to strings if they aren't already
    const documents = data.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item)
    );

    await this.collection.add({
      ids,
      documents,
      metadatas: [
        {
          contextId: contextId,
          timestamp: Date.now(),
        },
      ],
    });
  }

  /**
   * Searches for similar documents in the vector store
   * @param contextId - Context to search within
   * @param query - Query text to search for
   * @returns Array of matching documents
   */
  async query(contextId: string, query: string): Promise<any[]> {
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: 5,
      where: {
        contextId: contextId,
      },
    });

    return results.documents[0] || [];
  }

  /**
   * Creates a new index in ChromaDB
   * @param indexName - Name of the index to create
   */
  async createIndex(indexName: string): Promise<void> {
    await this.client.getOrCreateCollection({
      name: indexName,
      embeddingFunction: this.embedder,
    });
  }

  /**
   * Deletes an existing index from ChromaDB
   * @param indexName - Name of the index to delete
   */
  async deleteIndex(indexName: string): Promise<void> {
    await this.collection.delete({
      where: {
        indexName: indexName,
      },
    });
  }
}

/**
 * Factory function to create a new ChromaVectorStore instance
 * @param collectionName - Name of the ChromaDB collection to use (defaults to "default")
 * @param connection - Optional connection string for ChromaDB
 * @param embedder - Optional custom embedding function implementation
 * @returns A new ChromaVectorStore instance
 */
export function createChromaVectorStore(
  collectionName: string = "default",
  connection?: string,
  embedder?: IEmbeddingFunction
) {
  return new ChromaVectorStore(collectionName, connection, embedder);
}
