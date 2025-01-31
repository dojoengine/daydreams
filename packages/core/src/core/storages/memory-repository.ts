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
 * Daydreams dependencies
 */
import type { Repository, Limits, Sort } from "@daydreamsai/storage";

/**
 * Memory repository class keeps all collection items in memory.
 */
export class MemoryRepository implements Repository {
    /**
     * Collection of items.
     */
    private data: Record<string, any> = {};

    /**
     * Insert item into collection.
     *
     * @param data Item to insert.
     * @returns A promise that resolves with the id of the inserted item.
     */
    public insert<T>(data: T): Promise<string> {
        const id = Math.random().toString(36).substr(2, 9);
        this.data[id] = data;
        return Promise.resolve(id);
    }

    /**
     * Updates a document in the collection.
     *
     * @param id The id of the document to be updated.
     * @param set The fields to be updated.
     * @param push The fields to be pushed.
     * @returns A promise that resolves when the operation is complete.
     */
    public update(
        id: string,
        set: Record<string, any>,
        push: Record<string, any>
    ): Promise<void> {
        this.data[id] = { ...this.data[id], ...set };
        for (const key in push) {
            if (!this.data[id][key]) {
                this.data[id][key] = [];
            }
            this.data[id][key].push(push[key]);
        }

        return Promise.resolve();
    }

    /**
     * Find documents in the collection.
     *
     * @param query The query to be used to find documents.
     * @param limits The limits to be applied to the query.
     * @param sort The sorting to be applied to the query.
     * @returns A promise that resolves with found documents.
     */
    public find<T>(query: Record<string, any>, limits?: Limits, sort?: Sort): Promise<T[]> {
        const items = Object.values(this.data).filter((item) => {
            for (const key in query) {
                if (query[key] !== item[key]) {
                    return false;
                }
            }
            return true;
        }) as T[];

        if (sort) {
            items.sort((a, b) => {
                for (const key in sort) {
                    const sortValue = sort[key] === "asc" ? 1 : -1;

                    if (typeof (a as Record<string, any>)[key] === "string" && typeof (b as Record<string, any>)[key] === "string") {
                        const aValue = (a as Record<string, any>)[key] || "";
                        const bValue = (b as Record<string, any>)[key] || "";

                        const comparison = aValue.localeCompare(bValue);
                        if (comparison !== 0) {
                            return comparison * sortValue;
                        }
                    }

                    if (typeof (a as Record<string, any>)[key] === "number" && typeof (b as Record<string, any>)[key] === "number") {
                        const aValue = (a as Record<string, any>)[key] || 0;
                        const bValue = (b as Record<string, any>)[key] || 0;

                        if (aValue > bValue) {
                            return sortValue;
                        }

                        if (aValue < bValue) {
                            return -sortValue;
                        }
                    }
                }

                return 0;
            });
        }

        return Promise.resolve(
            limits?.limit
                ? items.slice(limits.skip || 0, limits.skip + limits.limit)
                : items
        );
    }

    /**
     * Finds a document in the collection.
     * 
     * @param query The query to search for.
     * @returns A promise that resolves with the found document.
     */
    public findOne<T>(query: Record<string, any>): Promise<T | null> {
        const item = Object.values(this.data).find((item) => {
            for (const key in query) {
                if (query[key] !== item[key]) {
                    return false;
                }
            }
            return true;
        }) as T;

        return Promise.resolve(item || null);
    }

    /**
     * Delete a document from the collection.
     *
     * @param id The id of the document to be deleted.
     * @returns A promise that resolves when the operation is complete.
     */
    public delete(id: string): Promise<void> {
        delete this.data[id];
        return Promise.resolve();
    }

    /**
     * Delete all documents from the collection.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    public deleteAll(): Promise<void> {
        this.data = {};
        return Promise.resolve();
    }
}
