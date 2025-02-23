import { z } from "zod";
import { context } from "../context";
import { service } from "../serviceProvider";
import { TwitterClient } from "../io/twitter";
import { extension, input, output } from "../utils";
import { formatXml } from "../xml";

// Define Twitter context
const twitterContext = context({
  type: "twitter:thread",
  key: ({ tweetId }) => tweetId.toString(),
  schema: z.object({
    tweetId: z.string(),
  }),
});

// Twitter service setup
const twitterService = service({
  register(container) {
    container.singleton(
      "twitter",
      () =>
        new TwitterClient({
          username: process.env.TWITTER_USERNAME!,
          password: process.env.TWITTER_PASSWORD!,
          email: process.env.TWITTER_EMAIL!,
        })
    );
  },
  async boot(container) {
    const twitter = container.resolve<TwitterClient>("twitter");
    await twitter.initialize();
    console.log("Twitter client initialized");
  },
});

export const twitter = extension({
  name: "twitter",
  services: [twitterService],
  contexts: {
    twitter: twitterContext,
  },
  inputs: {
    "twitter:mentions": input({
      schema: z.object({
        userId: z.string(),
        tweetId: z.string(),
        text: z.string(),
      }),
      format: (data) =>
        formatXml({
          tag: "tweet",
          params: { tweetId: data.tweetId },
          content: data.text,
        }),
      subscribe(send, { container }) {
        const twitter = container.resolve<TwitterClient>("twitter");

        // Check mentions every minute
        const interval = setInterval(async () => {
          const mentions = await twitter.checkMentions();

          for (const mention of mentions) {
            console.log("Mention", mention);
            send(
              twitterContext,
              { tweetId: mention.metadata.tweetId || "" },
              {
                tweetId: mention.metadata.tweetId || "",
                userId: mention.metadata.userId || "",
                text: mention.content,
              }
            );
          }
        }, 10000);

        return () => clearInterval(interval);
      },
    }),
  },

  outputs: {
    "twitter:reply": output({
      schema: z.object({
        content: z.string().max(280),
        inReplyTo: z.string(),
      }),
      description: "Use this to reply to a tweet",

      handler: async (data, ctx, { container }) => {
        const twitter = container.resolve<TwitterClient>("twitter");
        const { tweetId } = await twitter.sendTweet({
          content: data.content,
          inReplyTo: data.inReplyTo,
        });

        return {
          data: {
            ...data,
            tweetId,
          },
          timestamp: Date.now(),
        };
      },
      format: ({ data }) =>
        formatXml({
          tag: "tweet-reply",
          params: { tweetId: data.tweetId },
          content: data.content,
        }),
    }),

    "twitter:tweet": output({
      schema: z.object({
        content: z.string().max(280),
      }),
      description: "Use this to post a new tweet",

      handler: async (data, ctx, { container }) => {
        const twitter = container.resolve<TwitterClient>("twitter");
        await twitter.sendTweet({
          content: data.content,
        });
        return {
          data,
          timestamp: Date.now(),
        };
      },

      format: ({ data }) =>
        formatXml({
          tag: "tweet",
          content: data.content,
        }),
    }),
  },
});
