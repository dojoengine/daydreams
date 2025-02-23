import { z } from "zod";
import { createDreams, LogLevel, action, task } from "@daydreamsai/core";
import { discord } from "@daydreamsai/core/extensions";
import { Octokit } from "@octokit/rest";
import { google } from "@ai-sdk/google";

const fetchRepoContent = task(
  "github:fetch-repo-content",
  async ({
    octokit,
    owner,
    repo,
    path,
  }: {
    octokit: Octokit;
    owner: string;
    repo: string;
    path?: string;
  }) => {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: path ?? "",
    });

    let contents = "";

    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        if (
          item.type === "file" &&
          item.name.match(/\.(ts|js|tsx|jsx|md|json)$/)
        ) {
          const fileContent = await octokit.repos.getContent({
            owner,
            repo,
            path: item.path,
          });

          if ("content" in fileContent.data) {
            contents += `\n--- ${item.path} ---\n`;
            contents += Buffer.from(
              fileContent.data.content,
              "base64"
            ).toString();
          }
        } else if (item.type === "dir") {
          const subContents = await fetchRepoContent({
            octokit,
            owner,
            repo,
            path: item.path,
          });
          contents += subContents.contents;
        }
      }
    }
    return { contents };
  }
);

const agent = createDreams({
  logger: LogLevel.DEBUG,
  model: google("gemini-2.0-flash-001"),
  extensions: [discord],
  actions: [
    action({
      name: "fetchGitHubRepo",
      install({ container }) {
        container.singleton(
          "octokit",
          () =>
            new Octokit({
              auth: process.env.GITHUB_TOKEN,
            })
        );
      },
      description: "Fetch and analyze contents of a GitHub repository",
      schema: z.object({
        owner: z.string().describe("The GitHub repository owner"),
        repo: z.string().describe("The repository name"),
        path: z
          .string()
          .optional()
          .describe("Optional specific path within the repository"),
      }),
      async handler({ data }, ctx, app) {
        const octokit = app.container.resolve<Octokit>("octokit");
        try {
          const contents = await fetchRepoContent({
            octokit,
            ...data,
          });

          return {
            contents,
            repoInfo: {
              owner: data.owner,
              repo: data.repo,
              path: data.path || "",
            },
          };
        } catch (error) {
          console.error("Error fetching repo contents:", error);
          throw new Error(
            `Failed to fetch repository contents: ${error instanceof Error ? error.message : error}`
          );
        }
      },
    }),
  ],
});

console.log("Starting GitHub Repo Chat Bot...");
await agent.start();
