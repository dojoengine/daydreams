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
 * Filter options for queries.
 */
export type Filter = {
	/**
	 * The field to filter by.
	 */
	[key: string]: FilterOperation | any;
}

/**
 * Filter options for queries.
 */
export type FilterOperation = {
	/**
	 * Equality comparison.
	 */
	eq?: any;
	/**
	 * Greater than comparison.
	 */
	gt?: any;
	/**
	 * Greater than or equal to comparison.
	 */
	gte?: any;
	/**
	 * In comparison.
	 */
	in?: ReadonlyArray<any>;
	/**
	 * Less than comparison.
	 */
	lt?: any;
	/**
	 * Less than or equal to comparison.
	 */
	lte?: any;
	/**
	 * Not equal comparison.
	 */
	ne?: any;
	/**
	 * Not in comparison.
	 */
	nin?: ReadonlyArray<any>;
}

/**
 * Limits for pagination in queries.
 */
export type Limits = {
	/**
	 * The maximum number of documents to return.
	 */
	limit?: number;
	/**
	 * The number of documents to skip.
	 */
	skip?: number;
};

/**
 * Sort options for queries.
 */
export type Sort = {
	/**
	 * The field to sort by.
	 */
	[key: string]: "asc" | "desc";
};
