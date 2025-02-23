import { z } from "zod";
import { action } from "../utils";
import { tavily, type TavilyClient } from "@tavily/core";

export const getWeatherAction = action({
  name: "getWeather",
  description: "",
  schema: z.object({
    location: z.string(),
  }),
  async handler(params, ctx) {
    return "Sunny";
  },
});

export const seachWebAction = action({
  name: "search",
  description: "Search online information using Tavily",
  install({ container }) {
    container.singleton("tavily", () =>
      tavily({
        apiKey: process.env.TAVILY_API_KEY!,
      })
    );
  },
  schema: z.object({
    query: z.string().describe("The search query"),
    searchDepth: z
      .enum(["basic", "deep"])
      .optional()
      .describe("The depth of search - basic is faster, deep is more thorough"),
  }),

  async handler(call, ctx, agent) {
    const response = await agent.container
      .resolve<TavilyClient>("tavily")
      .search(call.data.query, {
        searchDepth: "advanced",
      });

    return {
      results: response.results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      })),
      totalResults: response.results.length,
    };
  },
});
