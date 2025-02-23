import { createParser, createPrompt, formatXml } from "@daydreamsai/core";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { type Research } from "./research";
import { type TavilySearchResponse } from "@tavily/core";
import { type SearchResultSchema, searchResultsSchema } from "./schemas";

export function formatResearch(research: Research) {
  return formatXml({
    tag: "research",
    params: { id: research.id },
    content: JSON.stringify(research),
  });
}

export const searchResultsPrompt = createPrompt(
  `Given the following results from a SERP search for the query, generate a list of learnings from the results. 
Return a maximum of 5 learnings, but feel free to return less if the results are clear. 
Make sure each learning is unique and not similar to each other. 
The learnings should be concise and to the point, as detailed and information dense as possible. 
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any exact metrics, numbers, or dates. 
The learnings will be used to research the topic further.
Given the following query and results from the research, create some follow up queries to clarify the research direction. 
Return a maximum of 2 queries, but feel free to return less if the original query is clearer

{{research}}

<query>{{query}}</query>

<goal>{{goal}}</goal>

<results>
{{results}}
</results>

Here is the json schema:
{{schema}}

Here's how you structure your output:
<json>
[JSON DATA]
</json>

Example:
<json>
{
  learnings: [...],
  followUpQueries: [...],
}
</json>
`,
  ({
    schema,
    research,
    results,
    goal,
    query,
  }: {
    goal: string;
    query: string;
    results: TavilySearchResponse["results"];
    research: Research;
    schema: z.AnyZodObject;
  }) => ({
    goal,
    query,
    results: results.map((r) =>
      formatXml({
        tag: "result",
        params: { url: r.url },
        content: r.content,
      })
    ),
    schema: JSON.stringify(zodToJsonSchema(schema, "schema")),
    research: formatResearch(research),
  })
);

export const searchResultsParser = createParser<
  { think?: string; output: SearchResultSchema | null },
  {}
>(
  () => ({
    output: null,
  }),
  {
    think: (state, element) => {
      state.think = element.content;
    },
    json: (state, element) => {
      state.output = searchResultsSchema.parse(JSON.parse(element.content));
    },
  }
);

export const finalReportPrompt = createPrompt(
  `
Given the following research, write a final report on the topic using the learnings from research. 
Make it as detailed as possible, aim for 3 or more pages, include ALL the learnings from research.

Here is all the data from research:
{{research}}

Return your report in markdown format. Always send the full report, do not cut it off.
`,
  ({ research }: { research: Research }) => ({
    research: formatResearch(research),
  })
);
