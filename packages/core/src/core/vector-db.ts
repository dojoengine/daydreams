import crypto from "crypto";
import { ChromaClient, IncludeEnum, OpenAIEmbeddingFunction } from "chromadb";
import { env } from "./env";
import { Logger } from "./logger";
import { Conversation } from "./conversation";
import {
    LogLevel,
    type ClusterMetadata,
    type ClusterStats,
    type ClusterUpdate,
    type Documentation,
    type DocumentClusterMetadata,
    type DomainMetadata,
    type EpisodeClusterMetadata,
    type EpisodicMemory,
    type HierarchicalCluster,
    type SearchResult,
    type VectorDB,
} from "./types";
import { isValidDateValue } from "./utils";

export class ChromaVectorDB implements VectorDB {
    // Static collection names
    static readonly CLUSTER_COLLECTION = "clusters";
    static readonly SYSTEM_COLLECTION = "system_metadata";
    static readonly EPISODIC_COLLECTION = "episodic_memory";
    static readonly DOCUMENTATION_COLLECTION = "documentation";

    private client: ChromaClient;
    private embedder: OpenAIEmbeddingFunction;
    private logger: Logger;
    private collectionName: string;

    constructor(
        collectionName = "memories",
        config: {
            chromaUrl?: string;
            logLevel?: LogLevel;
        } = {}
    ) {
        this.collectionName = collectionName;
        this.logger = new Logger({
            level: config.logLevel || LogLevel.INFO,
            enableColors: true,
            enableTimestamp: true,
        });

        this.client = new ChromaClient({
            path: config.chromaUrl || "http://localhost:8000",
        });

        // Add debug logging for embedder initialization
        this.logger.debug(
            "ChromaVectorDB.constructor",
            "Initializing embedder",
            {
                apiKey: env.OPENAI_API_KEY ? "present" : "missing",
                model: "text-embedding-3-small",
            }
        );

        // Initialize embedder with explicit error handling
        try {
            this.embedder = new OpenAIEmbeddingFunction({
                openai_api_key: env.OPENAI_API_KEY,
                openai_model: "text-embedding-3-small", // Make sure we're using a valid model
            });
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.constructor",
                "Failed to initialize embedder",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            throw error;
        }
    }

    // ======================= COMMON COLLECTIONS =======================

    private async getCollection() {
        return this.client.getOrCreateCollection({
            name: this.collectionName,
            embeddingFunction: this.embedder,
            metadata: {
                description: "Memory storage for AI consciousness",
            },
        });
    }

    private async getSystemCollection() {
        return this.client.getOrCreateCollection({
            name: ChromaVectorDB.SYSTEM_COLLECTION,
            embeddingFunction: this.embedder,
            metadata: {
                description: "System-wide metadata storage",
            },
        });
    }

    private async getEpisodicCollection() {
        return this.client.getOrCreateCollection({
            name: ChromaVectorDB.EPISODIC_COLLECTION,
            embeddingFunction: this.embedder,
            metadata: {
                description:
                    "Storage for agent's episodic memories and experiences",
            },
        });
    }

    private async getDocumentationCollection() {
        return this.client.getOrCreateCollection({
            name: ChromaVectorDB.DOCUMENTATION_COLLECTION,
            embeddingFunction: this.embedder,
            metadata: {
                description:
                    "Storage for documentation and learned information",
            },
        });
    }

    private async getClusterCollection() {
        return this.client.getOrCreateCollection({
            name: ChromaVectorDB.CLUSTER_COLLECTION,
            embeddingFunction: this.embedder,
            metadata: {
                description:
                    "Cluster centroids for hierarchical memory organization",
            },
        });
    }

    // ======================= MAIN API METHODS =======================

    /**
     * Finds similar items in the main "memories" collection.
     */
    public async findSimilar(
        content: string,
        limit = 5,
        metadata?: Record<string, any>
    ): Promise<SearchResult[]> {
        try {
            this.logger.debug(
                "ChromaVectorDB.findSimilar",
                "Searching for content",
                {
                    contentLength: content.length,
                    limit,
                    metadata,
                }
            );

            const collection = await this.getCollection();
            const results = await collection.query({
                queryTexts: [content],
                nResults: limit,
                where: metadata,
            });

            if (!results.ids.length || !results.distances?.length) {
                return [];
            }

            // Format as SearchResult
            return results.ids[0].map((id: string, index: number) => ({
                id,
                content: results.documents[0][index] || "",
                similarity: 1 - (results.distances?.[0]?.[index] || 0),
                metadata: results.metadatas?.[0]?.[index] || undefined,
            }));
        } catch (error) {
            this.logger.error("ChromaVectorDB.findSimilar", "Search failed", {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }

    /**
     * Stores a piece of content in the main "memories" collection.
     */
    public async store(
        content: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            const collection = await this.getCollection();
            // Generate deterministic ID so we don't accidentally store duplicates
            const id = Conversation.createDeterministicMemoryId(
                "global",
                content
            );

            this.logger.debug("ChromaVectorDB.store", "Storing content", {
                id,
                contentLength: content.length,
                metadata,
            });

            await collection.add({
                ids: [id],
                documents: [content],
                metadatas: metadata ? [metadata] : undefined,
            });
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.store",
                "Failed to store content",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            throw error;
        }
    }

    /**
     * Deletes an item by ID from the main "memories" collection.
     */
    public async delete(id: string): Promise<void> {
        try {
            this.logger.debug("ChromaVectorDB.delete", "Deleting content", {
                id,
            });
            const collection = await this.getCollection();
            await collection.delete({ ids: [id] });
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.delete",
                "Failed to delete content",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            throw error;
        }
    }

    // ======================= conversation-SPECIFIC METHODS =======================

    /**
     * Returns (and creates if necessary) a separate collection for a given conversation.
     * conversations are typically namespaced as `conversation_<conversationId>`.
     */
    public async getCollectionForConversation(conversationId: string) {
        const collectionName = `conversation_${conversationId}`;
        return this.client.getOrCreateCollection({
            name: collectionName,
            embeddingFunction: this.embedder,
            metadata: {
                description: "Conversation-specific memory storage",
                conversationId,
                platform: conversationId.split("_")[0],
                platformId: conversationId.split("_")[0] + "_platform", // TODO: This is a hack to get the platform ID
                created: new Date().toISOString(),
                lastActive: new Date().toISOString(),
            },
        });
    }

    /**
     * Stores content in a specific conversation's memory, also associating it with a cluster ID.
     */
    public async storeInConversation(
        content: string,
        conversationId: string,
        metadata: Record<string, any> = {}
    ): Promise<void> {
        try {
            // Add detailed logging
            this.logger.debug(
                "ChromaVectorDB.storeInConversation",
                "Storing content",
                {
                    content,
                    contentType: typeof content,
                    contentLength: content?.length,
                    conversationId,
                    metadata,
                }
            );

            // Ensure content is a non-empty string
            if (!content || typeof content !== "string") {
                throw new Error(`Invalid content: ${typeof content}`);
            }

            const collection =
                await this.getCollectionForConversation(conversationId);
            const id = Conversation.createDeterministicMemoryId(
                conversationId,
                content
            );
            const timestamp = new Date(metadata.timestamp || Date.now());

            this.logger.debug(
                "ChromaVectorDB.storeInConversation",
                "Generated ID",
                {
                    id,
                    conversationId,
                    timestamp: timestamp.toISOString(),
                }
            );

            // Update the conversation's metadata
            await collection.modify({
                metadata: {
                    ...collection.metadata,
                    lastActive: new Date().toISOString(),
                },
            });

            // Store the document
            await collection.add({
                ids: [id],
                documents: [content],
                metadatas: [
                    {
                        ...metadata,
                        conversationId,
                        timestamp: timestamp.toISOString(),
                    },
                ],
            });

            this.logger.debug(
                "ChromaVectorDB.storeInConversation",
                "Successfully stored",
                {
                    id,
                    conversationId,
                    contentLength: content.length,
                }
            );
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.storeInConversation",
                "Storage failed",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    content,
                    contentType: typeof content,
                    conversationId,
                }
            );
            throw error;
        }
    }

    /**
     * Finds similar items in a given conversation's collection. If no cluster match,
     * falls back to "global" search in that conversation's collection.
     */
    public async findSimilarInConversation(
        content: string,
        conversationId: string,
        limit = 5,
        metadata?: Record<string, any>
    ): Promise<SearchResult[]> {
        try {
            // Add detailed logging
            this.logger.debug(
                "ChromaVectorDB.findSimilarInconversation",
                "Input content details",
                {
                    content,
                    contentType: typeof content,
                    contentLength: content?.length,
                    conversationId,
                    metadata,
                }
            );

            // Ensure content is a non-empty string
            if (!content || typeof content !== "string") {
                this.logger.warn(
                    "ChromaVectorDB.findSimilarInconversation",
                    "Invalid content",
                    {
                        content,
                        contentType: typeof content,
                        conversationId,
                    }
                );
                return [];
            }

            const collection =
                await this.getCollectionForConversation(conversationId);

            this.logger.debug(
                "ChromaVectorDB.findSimilarInConversation",
                "Querying collection",
                {
                    queryText: content,
                    conversationId,
                    limit,
                    metadata,
                }
            );

            const results = await collection.query({
                queryTexts: [content],
                nResults: limit,
                where: metadata,
            });

            if (!results.ids.length || !results.ids[0]) {
                return [];
            }

            return results.ids[0].map((id: string, idx: number) => ({
                id,
                content: results.documents[0][idx] || "",
                similarity: 1 - (results.distances?.[0]?.[idx] || 0),
                metadata: results.metadatas?.[0]?.[idx] || undefined,
            }));
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.findSimilarInconversation",
                "Search failed",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    content,
                    contentType: typeof content,
                    conversationId,
                }
            );
            return [];
        }
    }

    /**
     * Fallback search for a conversation: no cluster restriction, just raw similarity.
     */
    private async findSimilarInConversationGlobal(
        content: string,
        conversationId: string,
        limit = 5,
        metadata?: Record<string, any>
    ): Promise<SearchResult[]> {
        const collection =
            await this.getCollectionForConversation(conversationId);
        const results = await collection.query({
            queryTexts: [content],
            nResults: limit,
            where: metadata,
        });

        if (!results.ids.length || !results.distances?.length) {
            return [];
        }

        return results.ids[0].map((id: string, index: number) => {
            const meta = results.metadatas?.[0]?.[index] || {};
            const dist = results.distances?.[0]?.[index] || 0;

            const timestampStr = meta.timestamp;
            const timestamp =
                timestampStr && isValidDateValue(timestampStr)
                    ? new Date(timestampStr)
                    : new Date();

            return {
                id,
                content: results.documents[0][index] || "",
                similarity: 1 - dist,
                metadata: {
                    ...meta,
                    timestamp: timestamp.toISOString(),
                },
            };
        });
    }

    /**
     * Lists the known "conversation_..." collections.
     */
    public async listConversations(): Promise<string[]> {
        const collections = await this.client.listCollections();

        // If .listCollections() returns an array of objects that contain `name`,
        // you may need to adapt the .filter / .map
        return collections
            .map((c) => c)
            .filter((name: string) => name.startsWith("conversation_"))
            .map((name: string) => name.replace("conversation_", ""));
    }

    /**
     * Gets the memory count for a specific conversation.
     */
    public async getConversationMemoryCount(
        conversationId: string
    ): Promise<number> {
        const collection =
            await this.getCollectionForConversation(conversationId);
        return collection.count();
    }

    /**
     * Deletes an entire conversation's collection.
     */
    public async deleteConversation(conversationId: string): Promise<void> {
        try {
            await this.client.deleteCollection({
                name: `conversation_${conversationId}`,
            });
            this.logger.info(
                "ChromaVectorDB.deleteConversation",
                "Conversation deleted",
                {
                    conversationId,
                }
            );
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.deleteConversation",
                "Deletion failed",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    conversationId,
                }
            );
            throw error;
        }
    }

    // ======================= CLUSTERING LOGIC =======================

    /**
     * Updates cluster statistics and potentially splits clusters that have grown too large or diverse
     */
    private async updateClusterStats(
        clusterId: string,
        content: string
    ): Promise<ClusterStats> {
        const clusterColl = await this.getClusterCollection();

        // Get all documents in this cluster
        const results = await clusterColl.get({
            ids: [clusterId],
            include: ["embeddings", "metadatas"] as IncludeEnum[],
        });

        if (!results.embeddings?.[0]) {
            throw new Error(`No embeddings found for cluster ${clusterId}`);
        }

        const centroid = results.embeddings[0];
        const memberEmbeddings = await this.embedder.generate([content]);

        // Calculate variance and average distance from centroid
        let totalDistance = 0;
        let maxDistance = 0;

        const distances = memberEmbeddings.map((embedding) => {
            const distance = this.calculateCosineSimilarity(
                embedding,
                centroid
            );
            totalDistance += distance;
            maxDistance = Math.max(maxDistance, distance);
            return distance;
        });

        const averageDistance = totalDistance / memberEmbeddings.length;
        const variance =
            distances.reduce(
                (sum, dist) => sum + Math.pow(dist - averageDistance, 2),
                0
            ) / distances.length;

        return {
            variance,
            memberCount: memberEmbeddings.length,
            averageDistance,
        };
    }

    /**
     * Updates a cluster's centroid and metadata based on new content
     */
    private async updateClusterCentroid(
        clusterId: string,
        content: string,
        metadata: Record<string, any>
    ): Promise<void> {
        const clusterColl = await this.getClusterCollection();

        // Get current cluster data
        const cluster = await clusterColl.get({
            ids: [clusterId],
            include: ["embeddings", "metadatas"] as IncludeEnum[],
        });

        if (!cluster.embeddings?.[0] || !cluster.metadatas?.[0]) {
            throw new Error(`Invalid cluster data for ${clusterId}`);
        }

        const currentMeta = cluster.metadatas[0];
        const currentEmbedding = cluster.embeddings[0];

        // Generate embedding for new content
        const newEmbedding = (await this.embedder.generate([content]))[0];

        // Calculate new centroid as weighted average
        const documentCount = Number(currentMeta.documentCount || 1) + 1;
        const weight = 1 / documentCount;

        const newCentroid = currentEmbedding.map(
            (val: number, idx: number) =>
                val * (1 - weight) + newEmbedding[idx] * weight
        );

        // Merge topics
        const currentTopics = String(currentMeta.topics || "")
            .split(",")
            .filter(Boolean);
        const newTopics = Array.isArray(metadata.topics) ? metadata.topics : [];
        const uniqueTopics = [...new Set([...currentTopics, ...newTopics])];

        const update: ClusterUpdate = {
            newCentroid,
            documentCount,
            topics: uniqueTopics,
        };

        // Update the cluster
        await clusterColl.update({
            ids: [clusterId],
            embeddings: [newCentroid],
            metadatas: [
                {
                    ...currentMeta,
                    documentCount: update.documentCount,
                    topics: update.topics.join(","),
                    lastUpdated: new Date().toISOString(),
                },
            ],
        });
    }

    /**
     * Splits a cluster into two if it's too large or diverse
     */
    private async splitCluster(
        clusterId: string,
        stats: ClusterStats
    ): Promise<string[]> {
        // Only split if cluster is large enough and has high variance
        if (stats.memberCount < 50 || stats.variance < 0.3) {
            return [clusterId];
        }

        const clusterColl = await this.getClusterCollection();

        // Get all documents in this cluster
        const results = await clusterColl.get({
            ids: [clusterId],
        });

        // Create two new clusters
        const newClusterIds = [crypto.randomUUID(), crypto.randomUUID()];

        // For now, just split the existing documents roughly in half
        // In a more sophisticated implementation, you might use k-means here
        const midpoint = Math.floor(results.documents.length / 2);

        for (let i = 0; i < 2; i++) {
            const start = i * midpoint;
            const end = i === 0 ? midpoint : results.documents.length;

            const docs = results.documents.slice(start, end);
            const metas = results.metadatas?.slice(start, end);

            if (docs.length > 0) {
                await clusterColl.add({
                    ids: [newClusterIds[i]],
                    documents: docs.filter(
                        (doc): doc is string => doc !== null
                    ),
                    metadatas: metas?.map((meta) => ({
                        ...meta,
                        parentClusterId: clusterId,
                        splitTimestamp: new Date().toISOString(),
                    })),
                });
            }
        }

        // Delete the original cluster
        await clusterColl.delete({ ids: [clusterId] });

        return newClusterIds;
    }

    /**
     * Identifies the domain and subdomain for a piece of content
     */
    private async identifyDomain(
        content: string,
        metadata?: Record<string, any>
    ): Promise<DomainMetadata> {
        const clusterColl = await this.getClusterCollection();

        // First try to match against top-level domain clusters
        const topResults = await clusterColl.query({
            queryTexts: [content],
            nResults: 1,
            where: { level: 1 }, // Top level clusters
        });

        const bestDist = topResults.distances?.[0]?.[0];
        if (bestDist && bestDist < 0.3) {
            const meta = topResults.metadatas?.[0]?.[0];
            return {
                domain: String(meta?.domain || "general"),
                subDomain: String(meta?.subDomain || ""),
                confidence: 1 - bestDist,
            };
        }

        // If no good match, try to infer from metadata
        if (metadata?.type === "documentation") {
            return {
                domain: "knowledge_base",
                subDomain: metadata.category,
                confidence: 1,
            };
        }

        if (metadata?.type === "episode") {
            return {
                domain: "experiences",
                subDomain: metadata.context?.domain,
                confidence: 0.8,
            };
        }

        // Default fallback
        return {
            domain: "general",
            confidence: 0.5,
        };
    }

    /**
     * Creates or updates hierarchical clusters for a domain
     */
    private async maintainHierarchicalClusters(
        content: string,
        domainInfo: DomainMetadata
    ): Promise<{ topClusterId: string; subClusterId?: string }> {
        const clusterColl = await this.getClusterCollection();

        // Find or create top-level domain cluster
        let topCluster = await clusterColl.query({
            queryTexts: [""],
            nResults: 1,
            where: {
                $and: [
                    { level: { $eq: 1 } },
                    { domain: { $eq: domainInfo.domain } },
                ],
            },
        });

        let topClusterId: string;

        if (!topCluster.ids.length) {
            // Create new top-level cluster
            topClusterId = crypto.randomUUID();
            await clusterColl.add({
                ids: [topClusterId],
                documents: [content],
                metadatas: [
                    {
                        type: "hierarchical_cluster",
                        level: 1,
                        domain: domainInfo.domain,
                        childIds: "",
                        documentCount: 1,
                        lastUpdated: new Date().toISOString(),
                    },
                ],
            });
        } else {
            topClusterId = topCluster.ids[0][0];
            await this.updateClusterCentroid(topClusterId, content, {
                type: "hierarchical_cluster",
                level: 1,
                domain: domainInfo.domain,
            });
        }

        // If we have a subdomain, handle sub-clustering
        if (domainInfo.subDomain) {
            // Find or create subdomain cluster
            let subCluster = await clusterColl.query({
                queryTexts: [content],
                nResults: 1,
                where: {
                    level: 2,
                    domain: domainInfo.domain,
                    subDomain: domainInfo.subDomain,
                    parentId: topClusterId,
                },
            });

            if (!subCluster.ids.length) {
                // Create new sub-cluster
                const subClusterId = crypto.randomUUID();
                await clusterColl.add({
                    ids: [subClusterId],
                    documents: [content],
                    metadatas: [
                        {
                            type: "hierarchical_cluster",
                            level: 2,
                            domain: domainInfo.domain,
                            subDomain: domainInfo.subDomain,
                            parentId: topClusterId,
                            childIds: "",
                            documentCount: 1,
                            lastUpdated: new Date().toISOString(),
                        },
                    ],
                });

                // Update parent's childIds
                const parent = await clusterColl.get({ ids: [topClusterId] });
                const currentChildIds = String(
                    parent.metadatas?.[0]?.childIds || ""
                )
                    .split(",")
                    .filter(Boolean);

                await clusterColl.update({
                    ids: [topClusterId],
                    metadatas: [
                        {
                            ...parent.metadatas?.[0],
                            childIds: [...currentChildIds, subClusterId].join(
                                ","
                            ),
                        },
                    ],
                });

                return { topClusterId, subClusterId };
            } else {
                const subClusterId = subCluster.ids[0][0];
                await this.updateClusterCentroid(subClusterId, content, {
                    type: "hierarchical_cluster",
                    level: 2,
                    domain: domainInfo.domain,
                    subDomain: domainInfo.subDomain,
                    parentId: topClusterId,
                });
                return { topClusterId, subClusterId };
            }
        }

        return { topClusterId };
    }

    /**
     * Finds the best cluster match for a piece of content or creates a new cluster if no match is found.
     */
    private async findOrCreateCluster(
        content: string,
        metadata: Record<string, any>
    ): Promise<ClusterMetadata> {
        // First identify the domain
        const domainInfo = await this.identifyDomain(content, metadata);

        // Maintain hierarchical structure
        const { topClusterId, subClusterId } =
            await this.maintainHierarchicalClusters(content, domainInfo);

        // Now find or create a content-specific cluster within the hierarchy
        const clusterColl = await this.getClusterCollection();
        const results = await clusterColl.query({
            queryTexts: [content],
            nResults: 1,
            where: {
                type: "content_cluster",
                parentId: subClusterId || topClusterId,
            },
        });

        const bestDist = results.distances?.[0]?.[0];
        if (bestDist && bestDist < 0.3) {
            const bestId = results.ids[0][0];
            const meta = results.metadatas?.[0]?.[0];

            // Update cluster statistics
            const stats = await this.updateClusterStats(bestId, content);

            // Handle potential split of content cluster
            if (stats.memberCount >= 50 && stats.variance >= 0.3) {
                const newClusterIds = await this.splitCluster(bestId, stats);
                const newResults = await clusterColl.query({
                    queryTexts: [content],
                    nResults: 1,
                    where: { id: { $in: newClusterIds } },
                });

                if (newResults.ids[0]?.[0]) {
                    await this.updateClusterCentroid(
                        newResults.ids[0][0],
                        content,
                        {
                            ...metadata,
                            type: "content_cluster",
                            parentId: subClusterId || topClusterId,
                            domain: domainInfo.domain,
                            subDomain: domainInfo.subDomain,
                        }
                    );

                    return {
                        clusterId: newResults.ids[0][0],
                        confidence: 1 - (newResults.distances?.[0]?.[0] || 0),
                        topics: String(
                            newResults.metadatas?.[0]?.[0]?.topics || ""
                        ).split(","),
                    };
                }
            }

            // Update existing cluster
            await this.updateClusterCentroid(bestId, content, {
                ...metadata,
                type: "content_cluster",
                parentId: subClusterId || topClusterId,
                domain: domainInfo.domain,
                subDomain: domainInfo.subDomain,
            });

            return {
                clusterId: bestId,
                confidence: 1 - bestDist,
                topics:
                    typeof meta?.topics === "string"
                        ? meta.topics.split(",")
                        : [],
            };
        }

        // Create new content cluster
        const clusterId = crypto.randomUUID();
        await clusterColl.add({
            ids: [clusterId],
            documents: [content],
            metadatas: [
                {
                    ...metadata,
                    type: "content_cluster",
                    parentId: subClusterId || topClusterId,
                    domain: domainInfo.domain,
                    subDomain: domainInfo.subDomain || "",
                    topics: Array.isArray(metadata.topics)
                        ? metadata.topics.join(",")
                        : "",
                    documentCount: 1,
                    lastUpdated: new Date().toISOString(),
                },
            ],
        });

        return {
            clusterId,
            confidence: 1,
            topics: Array.isArray(metadata.topics) ? metadata.topics : [],
        };
    }

    // ======================= SYSTEM-WIDE METADATA =======================

    /**
     * Stores arbitrary metadata in the "system_metadata" collection.
     */
    public async storeSystemMetadata(
        key: string,
        value: Record<string, any>
    ): Promise<void> {
        const coll = await this.getSystemCollection();
        const id = `metadata_${key}`;

        await coll.upsert({
            ids: [id],
            documents: [JSON.stringify(value)],
            metadatas: [
                {
                    ...value,
                    updatedAt: new Date().toISOString(),
                    type: "system_metadata",
                },
            ],
        });
    }

    /**
     * Retrieves system metadata by key.
     */
    public async getSystemMetadata(
        key: string
    ): Promise<Record<string, any> | null> {
        const coll = await this.getSystemCollection();
        try {
            const result = await coll.get({ ids: [`metadata_${key}`] });
            if (result.metadatas?.[0]) {
                return result.metadatas[0];
            }
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.getSystemMetadata",
                "Failed to get system metadata",
                {
                    key,
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
        }
        return null;
    }

    // ======================= EPISODIC MEMORY =======================

    /**
     * Stores an episodic memory (action + outcome + context).
     */
    public async storeEpisode(
        memory: Omit<EpisodicMemory, "id">
    ): Promise<string> {
        const coll = await this.getEpisodicCollection();
        const id = crypto.randomUUID();

        // Find or create appropriate cluster
        const clusterInfo = await this.findOrCreateEpisodeCluster(memory);

        const content = `Action: ${memory.action}\nOutcome: ${memory.outcome}`;
        await coll.add({
            ids: [id],
            documents: [content],
            metadatas: [
                {
                    ...memory,
                    context: memory.context
                        ? JSON.stringify(memory.context)
                        : "",
                    emotions: memory.emotions?.join(",") || "",
                    timestamp: memory.timestamp.toISOString(),
                    type: "episode",
                    clusterId: clusterInfo.clusterId,
                    clusterConfidence: clusterInfo.confidence,
                    clusterTopics: clusterInfo.topics.join(","),
                    clusterEmotions: clusterInfo.commonEmotions.join(","),
                    clusterImportance: clusterInfo.averageImportance,
                },
            ],
        });

        return id;
    }

    /**
     * Finds similar episodes by matching the "action" field.
     */
    public async findSimilarEpisodes(
        action: string,
        limit = 5
    ): Promise<EpisodicMemory[]> {
        const coll = await this.getEpisodicCollection();
        const results = await coll.query({
            queryTexts: [action],
            nResults: limit,
            where: { type: "episode" },
        });

        if (!results.ids[0]) return [];

        return results.ids[0].map((id: string, idx: number) => {
            const meta = results.metadatas[0][idx];
            return {
                id,
                action: String(meta?.action),
                outcome: String(meta?.outcome),
                context: meta?.context
                    ? JSON.parse(String(meta.context))
                    : undefined,
                emotions: String(meta?.emotions || "").split(","),
                timestamp: new Date(String(meta?.timestamp)),
            };
        });
    }

    /**
     * Retrieves the most recent episodic memories (peeking at the underlying collection).
     */
    public async getRecentEpisodes(limit = 10): Promise<EpisodicMemory[]> {
        const coll = await this.getEpisodicCollection();
        const results = await coll.peek({ limit });
        return results.ids.map((id: string, idx: number) => {
            const meta = results.metadatas[idx];
            return {
                id,
                action: String(meta?.action),
                outcome: String(meta?.outcome),
                context: meta?.context
                    ? JSON.parse(String(meta.context))
                    : undefined,
                emotions: String(meta?.emotions || "").split(","),
                timestamp: new Date(String(meta?.timestamp)),
            };
        });
    }

    // ======================= DOCUMENTATION (LONG-TERM KNOWLEDGE) =======================

    /**
     * Finds or creates a cluster for a documentation record
     */
    private async findOrCreateDocumentCluster(
        doc: Omit<Documentation, "id">
    ): Promise<DocumentClusterMetadata> {
        const clusterColl = await this.getClusterCollection();

        // Try to find most relevant cluster with matching category
        const results = await clusterColl.query({
            queryTexts: [doc.content],
            nResults: 1,
            where: {
                $and: [
                    { type: { $eq: "documentation_cluster" } },
                    { category: { $eq: doc.category } },
                ],
            },
        });

        const bestDist = results.distances?.[0]?.[0];
        if (bestDist && bestDist < 0.3) {
            const bestId = results.ids[0][0];
            const meta = results.metadatas?.[0]?.[0];

            // Update cluster statistics
            const stats = await this.updateClusterStats(bestId, doc.content);

            // Handle potential cluster split
            if (stats.memberCount >= 50 && stats.variance >= 0.3) {
                const newClusterIds = await this.splitCluster(bestId, stats);
                const newResults = await clusterColl.query({
                    queryTexts: [doc.content],
                    nResults: 1,
                    where: { id: { $in: newClusterIds } },
                });

                if (newResults.ids[0]?.[0]) {
                    await this.updateClusterCentroid(
                        newResults.ids[0][0],
                        doc.content,
                        {
                            type: "documentation_cluster",
                            category: doc.category,
                            tags: doc.tags,
                        }
                    );

                    return {
                        clusterId: newResults.ids[0][0],
                        confidence: 1 - (newResults.distances?.[0]?.[0] || 0),
                        topics: String(
                            newResults.metadatas?.[0]?.[0]?.topics || ""
                        ).split(","),
                        category: doc.category,
                        commonTags: doc.tags,
                    };
                }
            }

            // Update existing cluster
            await this.updateClusterCentroid(bestId, doc.content, {
                type: "documentation_cluster",
                category: doc.category,
                tags: doc.tags,
            });

            return {
                clusterId: bestId,
                confidence: 1 - bestDist,
                topics:
                    typeof meta?.topics === "string"
                        ? meta.topics.split(",")
                        : [],
                category: doc.category,
                commonTags: doc.tags,
            };
        }

        // Create new cluster
        const clusterId = crypto.randomUUID();
        await clusterColl.add({
            ids: [clusterId],
            documents: [doc.content],
            metadatas: [
                {
                    type: "documentation_cluster",
                    category: doc.category,
                    topics: doc.tags.join(","),
                    commonTags: doc.tags.join(","),
                    documentCount: 1,
                    lastUpdated: new Date().toISOString(),
                },
            ],
        });

        return {
            clusterId,
            confidence: 1,
            topics: doc.tags,
            category: doc.category,
            commonTags: doc.tags,
        };
    }

    /**
     * Finds or creates a cluster for an episodic memory
     */
    private async findOrCreateEpisodeCluster(
        memory: Omit<EpisodicMemory, "id">
    ): Promise<EpisodeClusterMetadata> {
        const clusterColl = await this.getClusterCollection();

        // Try to find most relevant cluster
        const results = await clusterColl.query({
            queryTexts: [`${memory.action}\n${memory.outcome}`],
            nResults: 1,
            where: {
                type: { $eq: "episode_cluster" },
            },
        });

        const bestDist = results.distances?.[0]?.[0];
        if (bestDist && bestDist < 0.3) {
            const bestId = results.ids[0][0];
            const meta = results.metadatas?.[0]?.[0];

            // Update cluster statistics
            const stats = await this.updateClusterStats(
                bestId,
                `${memory.action}\n${memory.outcome}`
            );

            // Handle potential cluster split
            if (stats.memberCount >= 50 && stats.variance >= 0.3) {
                const newClusterIds = await this.splitCluster(bestId, stats);
                const newResults = await clusterColl.query({
                    queryTexts: [`${memory.action}\n${memory.outcome}`],
                    nResults: 1,
                    where: { id: { $in: newClusterIds } },
                });

                if (newResults.ids[0]?.[0]) {
                    const newMeta = newResults.metadatas?.[0]?.[0];
                    await this.updateClusterCentroid(
                        newResults.ids[0][0],
                        `${memory.action}\n${memory.outcome}`,
                        {
                            type: "episode_cluster",
                            emotions: memory.emotions,
                            importance: memory.importance,
                        }
                    );

                    return {
                        clusterId: newResults.ids[0][0],
                        confidence: 1 - (newResults.distances?.[0]?.[0] || 0),
                        topics: String(newMeta?.topics || "").split(","),
                        commonEmotions: memory.emotions || [],
                        averageImportance: memory.importance || 0,
                    };
                }
            }

            // Update existing cluster
            await this.updateClusterCentroid(
                bestId,
                `${memory.action}\n${memory.outcome}`,
                {
                    type: "episode_cluster",
                    emotions: memory.emotions,
                    importance: memory.importance,
                }
            );

            return {
                clusterId: bestId,
                confidence: 1 - bestDist,
                topics:
                    typeof meta?.topics === "string"
                        ? meta.topics.split(",")
                        : [],
                commonEmotions: memory.emotions || [],
                averageImportance: memory.importance || 0,
            };
        }

        // Create new cluster
        const clusterId = crypto.randomUUID();
        await clusterColl.add({
            ids: [clusterId],
            documents: [`${memory.action}\n${memory.outcome}`],
            metadatas: [
                {
                    type: "episode_cluster",
                    topics: "",
                    commonEmotions: memory.emotions?.join(",") || "",
                    averageImportance: memory.importance || 0,
                    documentCount: 1,
                    lastUpdated: new Date().toISOString(),
                },
            ],
        });

        return {
            clusterId,
            confidence: 1,
            topics: [],
            commonEmotions: memory.emotions || [],
            averageImportance: memory.importance || 0,
        };
    }

    /**
     * Stores a documentation record (knowledge resource).
     */
    public async storeDocument(
        doc: Omit<Documentation, "id">
    ): Promise<string> {
        const coll = await this.getDocumentationCollection();
        const id = crypto.randomUUID();

        // Find or create appropriate cluster
        const clusterInfo = await this.findOrCreateDocumentCluster(doc);

        await coll.add({
            ids: [id],
            documents: [doc.content],
            metadatas: [
                {
                    title: doc.title,
                    category: doc.category,
                    tags: doc.tags.join(","),
                    lastUpdated: doc.lastUpdated.toISOString(),
                    source: doc.source || "",
                    relatedIds: doc.relatedIds?.join(",") || "",
                    type: "documentation",
                    clusterId: clusterInfo.clusterId,
                    clusterConfidence: clusterInfo.confidence,
                    clusterTopics: clusterInfo.topics.join(","),
                    clusterCategory: clusterInfo.category,
                    clusterCommonTags: clusterInfo.commonTags.join(","),
                },
            ],
        });

        return id;
    }

    /**
     * Finds similar documentation records by matching the user query text.
     */
    public async findSimilarDocuments(
        query: string,
        limit = 5
    ): Promise<Documentation[]> {
        const coll = await this.getDocumentationCollection();
        const results = await coll.query({
            queryTexts: [query],
            nResults: limit,
            where: {
                type: { $eq: "documentation" },
            },
        });

        if (!results.ids.length || !results.ids[0]) {
            return [];
        }

        return results.ids[0].map((id: string, idx: number) => {
            const meta = results.metadatas[0][idx];
            return {
                id,
                title: String(meta?.title),
                category: String(meta?.category),
                content: results.documents[0][idx] || "",
                tags: String(meta?.tags || "").split(","),
                lastUpdated: new Date(String(meta?.lastUpdated)),
                relatedIds: String(meta?.relatedIds || "").split(","),
            };
        });
    }

    /**
     * Searches documents by exact match on tags (joined by commas).
     */
    public async searchDocumentsByTag(
        tags: string[],
        limit = 5
    ): Promise<Documentation[]> {
        const coll = await this.getDocumentationCollection();

        let results: any;
        try {
            results = await coll.get({
                where: {
                    $and: [
                        { type: { $eq: "documentation" } },
                        { tags: { $eq: tags.join(",") } },
                    ],
                },
                limit,
            });
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.searchDocumentsByTag",
                "Failed to search by tag",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tags,
                }
            );
            throw error;
        }

        if (!results.ids?.length) return [];

        return results.ids.map((id: string, idx: number) => {
            const meta = results.metadatas[idx];
            return {
                id,
                content: results.documents[idx] || "",
                title: String(meta.title),
                category: String(meta.category),
                tags: String(meta.tags || "").split(","),
                lastUpdated: new Date(String(meta.lastUpdated)),
                relatedIds: String(meta.relatedIds || "").split(","),
            };
        });
    }

    /**
     * Updates an existing documentation record by ID.
     */
    public async updateDocument(
        id: string,
        updates: Partial<Documentation>
    ): Promise<void> {
        const coll = await this.getDocumentationCollection();
        const existing = await coll.get({ ids: [id] });

        if (!existing.ids.length) {
            throw new Error(`Document with id ${id} not found`);
        }

        const current = existing.metadatas[0];
        const updatedMetadata = {
            ...current,
            title: updates.title || current?.title || "",
            category: updates.category || current?.category || "",
            source: updates.source || current?.source || "",
            lastUpdated: new Date().toISOString(),
            tags: updates.tags ? updates.tags.join(",") : (current?.tags ?? ""),
            relatedIds: updates.relatedIds
                ? updates.relatedIds.join(",")
                : (current?.relatedIds ?? ""),
            type: current?.type || "documentation",
        };

        await coll.update({
            ids: [id],
            documents: updates.content ? [updates.content] : undefined,
            metadatas: [updatedMetadata],
        });
    }

    // ======================= EXTRA UTILITY =======================

    /**
     * Returns the total count of items in the main collection.
     */
    public async count(): Promise<number> {
        const coll = await this.getCollection();
        return coll.count();
    }

    /**
     * Clears all items from the main collection.
     */
    public async clear(): Promise<void> {
        const coll = await this.getCollection();
        await coll.delete();
    }

    /**
     * Retrieves the first N items from the main collection (for debugging).
     */
    public async peek(limit = 5): Promise<SearchResult[]> {
        const coll = await this.getCollection();
        const results = await coll.peek({ limit });

        return results.ids.map((id: string, index: number) => {
            const content = results.documents[index];
            if (content === null) {
                throw new Error(`Document content is null for id ${id}`);
            }
            return {
                id,
                content,
                similarity: 1,
                metadata: results.metadatas?.[index] ?? undefined,
            };
        });
    }

    // Add this utility method for calculating cosine similarity
    private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (mag1 * mag2);
    }

    /**
     * Gets the full hierarchical path for a cluster
     */
    private async getClusterHierarchy(
        clusterId: string
    ): Promise<HierarchicalCluster[]> {
        const clusterColl = await this.getClusterCollection();
        const hierarchy: HierarchicalCluster[] = [];

        let currentId = clusterId;
        while (currentId) {
            const result = await clusterColl.get({ ids: [currentId] });
            if (!result.metadatas?.[0]) break;

            const meta = result.metadatas[0];
            hierarchy.unshift({
                id: currentId,
                name: String(meta.name || ""),
                description: String(meta.description || ""),
                topics: String(meta.topics || "").split(","),
                documentCount: Number(meta.documentCount || 0),
                lastUpdated: new Date(String(meta.lastUpdated)),
                level: Number(meta.level || 0),
                domain: String(meta.domain || ""),
                subDomain: String(meta.subDomain || ""),
                parentId: String(meta.parentId || ""),
                childIds: String(meta.childIds || "")
                    .split(",")
                    .filter(Boolean),
            });

            currentId = String(meta.parentId || "");
        }

        return hierarchy;
    }

    /**
     * Purges all collections and data from the database.
     * Use with caution - this is irreversible!
     */
    public async purge(): Promise<void> {
        try {
            this.logger.warn("ChromaVectorDB.purge", "Purging all collections");

            // Get list of all collections
            const collections = await this.client.listCollections();

            // Delete each collection
            for (const collection of collections) {
                await this.client.deleteCollection({ name: collection });
                this.logger.debug(
                    "ChromaVectorDB.purge",
                    "Deleted collection",
                    {
                        name: collection,
                    }
                );
            }

            this.logger.info(
                "ChromaVectorDB.purge",
                "Successfully purged all collections",
                {
                    collectionCount: collections.length,
                }
            );
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.purge",
                "Failed to purge collections",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            throw error;
        }
    }

    // Check if we've already processed this content
    public async hasProcessedContent(
        contentId: string,
        conversation: Conversation
    ): Promise<boolean> {
        try {
            const collection = await this.getCollectionForConversation(
                conversation.id
            );

            // Search for exact match of the content ID in metadata
            const results = await collection.get({
                where: {
                    $and: [
                        { type: { $eq: "processed_marker" } },
                        { contentId: { $eq: contentId } },
                    ],
                },
            });

            return results.ids.length > 0;
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.hasProcessedContent",
                "Check failed",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    contentId,
                    conversationId: conversation.id,
                }
            );
            return false;
        }
    }

    // Mark content as processed
    public async markContentAsProcessed(
        contentId: string,
        conversation: Conversation
    ): Promise<void> {
        try {
            const collection = await this.getCollectionForConversation(
                conversation.id
            );
            const markerId = `processed_${contentId}`;

            await collection.add({
                ids: [markerId],
                documents: [`Processed marker for content: ${contentId}`],
                metadatas: [
                    {
                        type: "processed_marker",
                        contentId: contentId,
                        timestamp: new Date().toISOString(),
                    },
                ],
            });

            this.logger.debug(
                "ChromaVectorDB.markContentAsProcessed",
                "Marked content as processed",
                {
                    contentId,
                    conversationId: conversation.id,
                    markerId,
                }
            );
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.markContentAsProcessed",
                "Failed to mark content",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    contentId,
                    conversationId: conversation.id,
                }
            );
            throw error;
        }
    }

    /**
     * Gets all memories from a specific conversation's collection, optionally limited to a certain number
     */
    public async getMemoriesFromConversation(
        conversationId: string,
        limit?: number
    ): Promise<{ content: string; metadata?: Record<string, any> }[]> {
        try {
            const collection =
                await this.getCollectionForConversation(conversationId);

            // Get all documents from the collection, with optional limit
            const results = await collection.get({
                limit,
                include: ["documents", "metadatas"] as IncludeEnum[],
            });

            if (!results.ids.length) {
                return [];
            }

            return results.ids.map((_, idx) => ({
                content: results.documents[idx] || "",
                metadata: results.metadatas?.[idx] || {},
            }));
        } catch (error) {
            this.logger.error(
                "ChromaVectorDB.getMemoriesFromConversation",
                "Failed to get memories",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    conversationId,
                }
            );
            throw error;
        }
    }
}
