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
import type { Repository } from "@daydreamsai/storage";

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
    public async insert<T>(data: T): Promise<string> {
        const id = Math.random().toString(36).substr(2, 9);
        this.data[id] = data;
        return Promise.resolve(id);
    }

    /**
     * Updates a document in the collection.
     *
     * @param id - The id of the document to be updated.
     * @param set - The fields to be updated.
     * @param push - The fields to be pushed.
     * @returns A promise that resolves when the operation is complete.
     */
    public async update(
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
     * @param query - The query to be used to find documents.
     * @returns A promise that resolves with found documents.
     */
    public async find<T>(query: Record<string, any>): Promise<T[]> {
        const items = Object.values(this.data).filter((item) => {
            for (const key in query) {
                if (query[key] !== item[key]) {
                    return false;
                }
            }
            return true;
        }) as T[];

        return Promise.resolve(items);
    }

    /**
     * Delete a document from the collection.
     *
     * @param id - The id of the document to be deleted.
     * @returns A promise that resolves when the operation is complete.
     */
    public async delete(id: string): Promise<void> {
        delete this.data[id];
        return Promise.resolve();
    }

    /**
     * Delete all documents from the collection.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    public async deleteAll(): Promise<void> {
        this.data = {};
        return Promise.resolve();
    }
}
