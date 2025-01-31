/**
 * MIT License
 *
 * Copyright (c) 2025 Loaf
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * External dependencies
 */
import { MongoClient, Db } from "mongodb";

/**
 * Daydreams dependencies
 */
import { SCHEDULED_TASKS_KIND, ORCHESTRATORS_KIND } from "@daydreamsai/storage";
import type { Repository, Storage } from "@daydreamsai/storage";

/**
 * Internal dependencies
 */
import { MongoRepository } from "./mongo-repository";

/**
 * The storage class that represents a MongoDB database.
 */
export class MongoStorage implements Storage {
    /**
     * The MongoDB client object.
     */
    private client: MongoClient;

    /**
     * The MongoDB database object.
     */
    private db: Db;

    /**
     * The repositories map.
     */
    private repositories: Record<string, MongoRepository> = {};

    /**
     * Constructor
     *
     * @param uri The MongoDB connection URI.
     * @param dbName The name of the database.
     */
    constructor(uri: string, dbName: string) {
        this.client = new MongoClient(uri);
        this.db = this.client.db(dbName);
    }

    /**
     * Connect to the database. If the connection is already established, this
     * method does nothing.
     *
     * @returns A promise that resolves when the connection is established.
     */
    public async connect(): Promise<void> {
        if (!this.client.listenerCount("connect")) {
            await this.client.connect();
        }
    }

    /**
     * Close the database connection.
     *
     * @returns A promise that resolves when the connection is closed.
     */
    public close(): Promise<void> {
        return this.client.close();
    }

    /**
     * Migrate the database schema.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    public async migrate(): Promise<void> {
        // Initialize the repositories
        this.getRepository(SCHEDULED_TASKS_KIND);
        this.getRepository(ORCHESTRATORS_KIND);

        const tasksCollection = this.repositories[SCHEDULED_TASKS_KIND].getCollection();
        const orchestratorsCollection = this.repositories[ORCHESTRATORS_KIND].getCollection();

        // Create indexes
        await Promise.all([
            tasksCollection.createIndex({ nextRunAt: 1 }),
            tasksCollection.createIndex({ status: 1 }),
            orchestratorsCollection.createIndex({ userId: 1 }),
        ]);
    }

    /**
     * Get a repository object for a specific collection.
     *
     * @param kind The name of the collection.
     * @returns The repository object.
     */
    public getRepository(kind: string): Repository {
        if (!this.repositories[kind]) {
            this.repositories[kind] = new MongoRepository(this.db, kind);
        }
        return this.repositories[kind];
    }
}
