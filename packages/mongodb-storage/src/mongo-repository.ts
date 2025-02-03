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
import { Db, Collection } from "mongodb";
import type { Filter as Query } from "mongodb";

/**
 * Daydreams dependencies
 */
import type { Repository, Filter, Limits, Sort } from "@daydreamsai/storage";

/**
 * The repository class that represents a MongoDB collection.
 */
export class MongoRepository implements Repository {
    /**
     * The MongoDB collection object.
     */
    private collection: Collection<any>;

    /**
     * Constructor
     *
     * @param mongodb The MongoDB database object.
     * @param kind The name of the collection.
     */
    constructor(mongodb: Db, kind: string) {
        this.collection = mongodb.collection(kind);
    }

    /**
     * Get the collection object.
     * 
     * @returns The collection object.
     */
    public getCollection(): Collection<any> {
        return this.collection;
    }

    /**
     * Insert a new document into the collection.
     *
     * @param data The data to insert.
     * @returns A promise that resolves with the ID of the inserted document.
     */
    public async insert<T>(data: T): Promise<string> {
        const result = await this.collection.insertOne(data);
        return result.insertedId.toString();
    }

    /**
     * Updates a document in the collection.
     *
     * @param id The ID of the document to update.
     * @param set The fields to update.
     * @param push The fields to push into document property arrays.
     * @returns A promise that resolves when the operation is complete.
     */
    public async update(
        id: string,
        set: Record<string, any>,
        push: Record<string, any> = {}
    ): Promise<void> {
        const data = {
            $set: {},
            $push: {},
        };

        if (Object.keys(set).length) {
            data["$set"] = set;
        }

        if (Object.keys(push).length) {
            data["$push"] = push;
        }

        await this.collection.updateOne({ _id: id }, data);
    }

    /**
     * Finds a document in the collection.
     *
     * @param query The query to search for.
     * @param limits The limits to be applied to the query.
     * @param sort The sorting to be applied to the query.
     * @returns A promise that resolves with the found documents.
     */
    public async find<T>(query: Filter, limits?: Limits, sort?: Sort): Promise<T[]> {
        const _query: Query<any> = {};

        for (const key in query) {
            if (typeof query[key] === 'string') {
                _query[key] = query[key];
            } else if (typeof query[key] === 'object') {
                _query[key] = {};
                if (query[key].eq) {
                    _query[key].$eq = query[key].eq;
                }
                if (query[key].gt) {
                    _query[key].$gt = query[key].gt;
                }
                if (query[key].gte) {
                    _query[key].$gte = query[key].gte;
                }
                if (query[key].in) {
                    _query[key].$in = query[key].in;
                }
                if (query[key].lt) {
                    _query[key].$lt = query[key].lt;
                }
                if (query[key].lte) {
                    _query[key].$lte = query[key].lte;
                }
                if (query[key].ne) {
                    _query[key].$ne = query[key].ne;
                }
                if (query[key].nin) {
                    _query[key].$nin = query[key].nin;
                }
            }
        }

        const find = this.collection.find(_query)

        if (limits) {
            if (limits.limit) {
                find.limit(limits.limit);
            }

            if (limits.skip) {
                find.skip(limits.skip);
            }
        }

        if (sort) {
            find.sort(sort);
        }

        return find.toArray();
    }

    /**
     * Finds a document in the collection.
     * 
     * @param query The query to search for.
     * @returns A promise that resolves with the found document.
     */
    public async findOne<T>(query: Filter): Promise<T | null> {
        return this.collection.findOne(query);
    }

    /**
     * Deletes a document from the collection.
     *
     * @param id The ID of the document to delete.
     * @returns A promise that resolves when the operation is complete.
     */
    public async delete(id: string): Promise<void> {
        await this.collection.deleteOne({ _id: id });
    }

    /**
     * Deletes all documents from the collection.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    public async deleteAll(): Promise<void> {
        await this.collection.deleteMany({});
    }
}
