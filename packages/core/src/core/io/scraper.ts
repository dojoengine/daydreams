import { HandlerRole, type IOHandler } from "../types";
import { Logger } from "../logger";
import { LogLevel } from "../types";
import { z } from "zod";
import { tavily } from "@tavily/core";

export interface ScraperCredentials {
    tavily_api_key: string;
}

export interface SearchResult {
    url: string;
    content: string;
    title?: string;
    score?: number;
}

export type SearchResults = SearchResult[];

export const searchedContentSchema = z.object({
    title: z.string().optional().describe("The page title if available"),
    url: z.string().url().describe("The URL that was scraped"),
    content: z.string().describe("The content from the webpage"),
    score: z.number().optional().describe("The score of the search result"),
});

export class WebSearcher {
    private client;
    private logger: Logger;

    constructor(
        credentials: ScraperCredentials,
        logLevel: LogLevel = LogLevel.INFO
    ) {
        this.client = tavily({
            apiKey: credentials.tavily_api_key,
        });

        this.logger = new Logger({
            level: logLevel,
            enableColors: true,
            enableTimestamp: true,
        });
    }

    /**
     * Scrapes a single URL using Tavily's API
     */
    public async search(
        payload: string | { query: string }
    ): Promise<SearchResults> {
        const query = typeof payload === "string" ? payload : payload.query;

        this.logger.info(
            "WebSearcher.search ============= : ",
            "Searching for",
            {
                query,
            }
        );
        try {
            const response = await this.client.search(query, {
                maxResults: 5,
            });

            console.log("DEBUG: Search Response ============ : ", response);

            const results = response.results.map((result) => ({
                title: result.title,
                url: result.url,
                content: result.content,
                score: result.score,
            }));

            return results;
        } catch (error) {
            this.logger.error("Scraper.search", "Failed to search", {
                error,
                query,
            });
            throw error;
        }
    }

    /**
     * Clean and normalize scraped content
     */
    private cleanContent(content: string): string {
        return content
            .replace(/[\r\n]+/g, "\n") // Normalize line endings
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim();
    }

    /**
     * Creates an input handler for the Orchestrator
     */
    public createSearchInput(): IOHandler {
        return {
            role: HandlerRole.INPUT,
            name: "web_searcher",
            execute: async (data: string | { query: string }) => {
                const query = typeof data === "string" ? data : data.query;
                return await this.search(query);
            },
        };
    }

    /**
     * Creates an action handler for the Orchestrator
     */
    public createSearchAction(): IOHandler {
        return {
            role: HandlerRole.ACTION,
            name: "web_searcher",
            outputSchema: searchedContentSchema,
            execute: async (data: string | { query: string }) => {
                const query = typeof data === "string" ? data : data.query;
                return await this.search(query);
            },
        };
    }
}
