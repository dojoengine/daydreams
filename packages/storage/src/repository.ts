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

import type { Limits, Sort } from './find-types';

/**
 * Repository interface defines operations available for a certain collection.
 */
export interface Repository {
    /**
     * Insert a new document into the collection.
     *
     * @param data - The data to be inserted.
     * @returns The id of the inserted document.
     */
    insert<T>(data: T): Promise<string>;

    /**
     * Updates a document in the collection.
     *
     * @param id - The id of the document to be updated.
     * @param set - The fields to be updated.
     * @param push - The fields to be pushed.
     * @returns A promise that resolves when the operation is complete.
     */
    update(
        id: string,
        set: Record<string, any>,
        push?: Record<string, any>
    ): Promise<void>;

    /**
     * Find documents in the collection.
     *
     * @param query - The query to be used to find documents.
     * @param limits - The limits to be applied to the query.
     * @param sort - The sorting to be applied to the query.
     * @returns A promise that resolves with found documents.
     */
    find<T>(query: Record<string, any>, limits?: Limits, sort?: Sort): Promise<T[]>;

    /**
     * Finds a document in the collection.
     * 
     * @param query The query to search for.
     * @returns A promise that resolves with the found document.
     */
    findOne<T>(query: Record<string, any>): Promise<T | null>;

    /**
     * Delete a document from the collection.
     *
     * @param id - The id of the document to be deleted.
     * @returns A promise that resolves when the operation is complete.
     */
    delete(id: string): Promise<void>;

    /**
     * Delete all documents from the collection.
     *
     * @returns A promise that resolves when the operation is complete.
     */
    deleteAll(): Promise<void>;
}
