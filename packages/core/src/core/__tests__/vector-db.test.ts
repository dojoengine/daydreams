import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            reporter: ["text", "json", "html"],
        },
    },
});

import { describe, test, expect, vi, beforeEach } from "vitest";
import { ChromaVectorDB } from "../vector-db";

// Mock environment variables
vi.mock("../env", () => ({
    env: {
        OPENAI_API_KEY: "mock-api-key",
        CHROMA_DB_URL: "mock-db-url",
    },
}));

// Mock collection object with all required methods
const mockCollection = {
    query: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    modify: vi.fn(),
    count: vi.fn().mockResolvedValue(42),
    peek: vi.fn(),
    get: vi.fn(),
    upsert: vi.fn(),
};

// Mock ChromaClient
const mockClient = {
    getOrCreateCollection: vi.fn().mockResolvedValue(mockCollection),
    deleteCollection: vi.fn(),
    listCollections: vi.fn(),
};

// Mock OpenAI embedding function
const mockEmbedder = {
    generate: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
};

// Setup mocks
vi.mock("chromadb", () => ({
    ChromaClient: vi.fn().mockImplementation(() => mockClient),
    OpenAIEmbeddingFunction: vi.fn().mockImplementation(() => mockEmbedder),
}));

describe("ChromaVectorDB", () => {
    let db: ChromaVectorDB;

    beforeEach(() => {
        vi.clearAllMocks();
        db = new ChromaVectorDB("test_collection");

        // Setup default mock responses for hierarchical clustering
        mockCollection.query
            // Mock response for top-level domain cluster query
            .mockResolvedValueOnce({
                ids: [],
                distances: [],
                documents: [],
                metadatas: [],
                embeddings: [[0.1, 0.2, 0.3]],
            })
            // Mock response for content cluster query
            .mockResolvedValueOnce({
                ids: [["cluster1"]],
                distances: [[0.2]],
                documents: [["cluster content"]],
                metadatas: [[{ topics: "topic1,topic2" }]],
                embeddings: [[0.1, 0.2, 0.3]],
            });

        // Mock get response for cluster stats
        mockCollection.get.mockResolvedValue({
            ids: ["cluster1"],
            distances: [[0.1]],
            documents: ["content"],
            metadatas: [{ topics: "topic1,topic2" }],
            embeddings: [[0.1, 0.2, 0.3]],
        });
    });

    // Basic Operations
    describe("Basic Operations", () => {
        test("store() should add content to collection", async () => {
            await db.store("test content", { testKey: "testValue" });

            expect(mockClient.getOrCreateCollection).toHaveBeenCalled();
            expect(mockCollection.add).toHaveBeenCalledWith({
                ids: expect.any(Array),
                documents: ["test content"],
                metadatas: [{ testKey: "testValue" }],
            });
        });

        test("findSimilar() should query collection", async () => {
            // Reset default mocks first
            mockCollection.query.mockReset();

            mockCollection.query.mockResolvedValueOnce({
                ids: [["id1"]],
                distances: [[0.1]],
                documents: [["similar content"]],
                metadatas: [[{ key: "value" }]],
                embeddings: [[0.1, 0.2, 0.3]], // Add embeddings
            });

            const results = await db.findSimilar("query content", 5);

            expect(mockCollection.query).toHaveBeenCalledWith({
                queryTexts: ["query content"],
                nResults: 5,
                where: undefined,
            });
            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                id: "id1",
                content: "similar content",
                similarity: expect.any(Number),
            });
        });

        test("delete() should remove content from collection", async () => {
            await db.delete("test-id");

            expect(mockCollection.delete).toHaveBeenCalledWith({
                ids: ["test-id"],
            });
        });

        test("count() should return collection size", async () => {
            const count = await db.count();
            expect(count).toBe(42);
        });
    });

    // Conversation Operations
    describe("Conversation Operations", () => {
        test("listConversations() should return conversation collections", async () => {
            mockClient.listCollections.mockResolvedValueOnce([
                "conversation_123",
                "conversation_456",
                "other_collection",
            ]);

            const conversations = await db.listConversations();
            expect(conversations).toEqual(["123", "456"]);
        });
    });

    // System Metadata
    describe("System Metadata", () => {
        test("storeSystemMetadata() should store metadata", async () => {
            await db.storeSystemMetadata("test-key", { data: "value" });

            expect(mockCollection.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    ids: ["metadata_test-key"],
                })
            );
        });

        test("getSystemMetadata() should retrieve metadata", async () => {
            mockCollection.get.mockResolvedValueOnce({
                metadatas: [{ data: "value" }],
            });

            const metadata = await db.getSystemMetadata("test-key");
            expect(metadata).toEqual({ data: "value" });
        });
    });

    // Documentation
    describe("Documentation Operations", () => {
        test("storeDocument() should store documentation", async () => {
            // Reset and setup specific mocks for this test
            mockCollection.query
                // Mock domain cluster query
                .mockResolvedValueOnce({
                    ids: [["domain1"]],
                    distances: [[0.2]],
                    documents: [["domain content"]],
                    metadatas: [[{ topics: "topic1,topic2" }]],
                    embeddings: [[0.1, 0.2, 0.3]],
                })
                // Mock content cluster query
                .mockResolvedValueOnce({
                    ids: [["cluster1"]],
                    distances: [[0.2]],
                    documents: [["cluster content"]],
                    metadatas: [
                        [
                            {
                                topics: "topic1,topic2",
                                category: "test",
                                commonTags: "tag1,tag2",
                            },
                        ],
                    ],
                    embeddings: [[0.1, 0.2, 0.3]],
                });

            const doc = {
                title: "Test Doc",
                content: "Test content",
                category: "test",
                tags: ["tag1", "tag2"],
                lastUpdated: new Date(),
            };

            await db.storeDocument(doc);

            expect(mockCollection.add).toHaveBeenCalled();
        });

        test("findSimilarDocuments() should search docs", async () => {
            // Reset default mocks first
            mockCollection.query.mockReset();

            mockCollection.query.mockResolvedValueOnce({
                ids: [["doc1"]],
                distances: [[0.1]],
                documents: [["doc content"]],
                metadatas: [
                    [
                        {
                            title: "Test Doc",
                            category: "test",
                            tags: "tag1,tag2",
                            lastUpdated: new Date().toISOString(),
                            type: "documentation", // Add type to match filter
                        },
                    ],
                ],
                embeddings: [[0.1, 0.2, 0.3]], // Add embeddings
            });

            const docs = await db.findSimilarDocuments("query");
            expect(docs).toHaveLength(1);
            expect(docs[0]).toMatchObject({
                id: "doc1",
                title: "Test Doc",
            });
        });

        test("updateDocument() should update existing doc", async () => {
            mockCollection.get.mockResolvedValueOnce({
                ids: ["doc1"],
                metadatas: [{ title: "Old Title" }],
            });

            await db.updateDocument("doc1", {
                title: "New Title",
            });

            expect(mockCollection.update).toHaveBeenCalled();
        });
    });

    // Error Handling
    describe("Error Handling", () => {
        test("should handle collection creation failure", async () => {
            mockClient.getOrCreateCollection.mockRejectedValueOnce(
                new Error("DB Error")
            );

            await expect(db.store("content")).rejects.toThrow();
        });

        test("should handle query failures gracefully", async () => {
            mockCollection.query.mockRejectedValueOnce(
                new Error("Query Error")
            );

            const results = await db.findSimilar("query");
            expect(results).toEqual([]);
        });

        test("should handle missing metadata gracefully", async () => {
            // Reset default mocks first
            mockCollection.query.mockReset();

            mockCollection.query.mockResolvedValueOnce({
                ids: [["id1"]],
                distances: [[0.1]],
                documents: [["content"]],
                metadatas: [[null]], // Use null in the nested array
                embeddings: [[0.1, 0.2, 0.3]], // Add embeddings
            });

            const results = await db.findSimilar("query");
            expect(results[0].metadata).toBeUndefined();
        });
    });
});
