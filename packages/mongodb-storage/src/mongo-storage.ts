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
     * @throws {Error} If the operation fails.
     */
    public async connect(): Promise<void> {
        if (!this.client.listenerCount("connect")) {
            await this.client.connect();
        }
    }

    /**
     * Close the database connection.
     *
     * @throws {Error} If the operation fails.
     *
     * @returns A promise that resolves when the connection is closed.
     */
    public close(): Promise<void> {
        return this.client.close();
    }

    /**
     * Migrate the database schema.
     *
     * @throws {Error} If the operation fails.
     */
    public async migrate(): Promise<void> {
        // this.collections[SCHEDULED_TASKS] = this.db.collection(SCHEDULED_TASKS);
        // this.collections[ORCHESTRATORS] = this.db.collection(ORCHESTRATORS);
        // await Promise.all([
        //     this.collections[SCHEDULED_TASKS].createIndex({ nextRunAt: 1 }),
        //     this.collections[SCHEDULED_TASKS].createIndex({ status: 1 }),
        //     this.collections[ORCHESTRATORS].createIndex({ userId: 1 }),
        // ]);
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
