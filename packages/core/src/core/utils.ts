import { Ajv, type JSONSchemaType } from "ajv";
import zodToJsonSchema from "zod-to-json-schema";
import type { LLMValidationOptions } from "./types";

export const injectTags = (
    tags: Record<string, string> = {},
    text: string
): string => {
    let result = text;
    const tagMatches = text.match(/\{\{(\w+)\}\}/g) || [];
    const uniqueTags = [...new Set(tagMatches)];

    uniqueTags.forEach((tag) => {
        const tagName = tag.slice(2, -2);
        const values: string[] = [];
        if (tags[tagName]) {
            // Find all occurrences and collect values
            tagMatches.forEach((match) => {
                if (match === tag) {
                    values.push(tags[tagName]);
                }
            });
            // Replace with concatenated values if multiple occurrences
            result = result.replace(new RegExp(tag, "g"), values.join("\n"));
        }
    });

    return result;
};

export const generateUniqueId = (): string => {
    // Quick example ID generator
    return "step-" + Math.random().toString(36).substring(2, 15);
};

export const determineEmotions = (
    action: string,
    result: string | Record<string, any>,
    importance: number
): string[] => {
    const resultStr =
        typeof result === "string" ? result : JSON.stringify(result);
    const resultLower = resultStr.toLowerCase();
    const emotions: string[] = [];

    // Success/failure emotions
    const isFailure =
        resultLower.includes("error") || resultLower.includes("failed");
    const isHighImportance = importance > 0.7;

    if (isFailure) {
        emotions.push("frustrated");
        if (isHighImportance) emotions.push("concerned");
    } else {
        emotions.push("satisfied");
        if (isHighImportance) emotions.push("excited");
    }

    // Learning emotions
    if (resultLower.includes("learned") || resultLower.includes("discovered")) {
        emotions.push("curious");
    }

    // Action-specific emotions
    if (action.includes("QUERY") || action.includes("FETCH")) {
        emotions.push("analytical");
    }
    if (action.includes("TRANSACTION") || action.includes("EXECUTE")) {
        emotions.push("focused");
    }

    return emotions;
};

export const calculateImportance = (result: string): number => {
    const keyTerms = {
        high: [
            "error",
            "critical",
            "important",
            "success",
            "discovered",
            "learned",
            "achieved",
            "completed",
            "milestone",
        ],
        medium: [
            "updated",
            "modified",
            "changed",
            "progress",
            "partial",
            "attempted",
        ],
        low: [
            "checked",
            "verified",
            "queried",
            "fetched",
            "routine",
            "standard",
        ],
    };

    const resultLower = result.toLowerCase();

    // Calculate term-based score
    let termScore = 0;
    keyTerms.high.forEach((term) => {
        if (resultLower.includes(term)) termScore += 0.3;
    });
    keyTerms.medium.forEach((term) => {
        if (resultLower.includes(term)) termScore += 0.2;
    });
    keyTerms.low.forEach((term) => {
        if (resultLower.includes(term)) termScore += 0.1;
    });

    // Cap term score at 0.7
    termScore = Math.min(termScore, 0.7);

    // Calculate complexity score based on result length and structure
    const complexityScore = Math.min(
        result.length / 1000 +
            result.split("\n").length / 20 +
            (JSON.stringify(result).match(/{/g)?.length || 0) / 10,
        0.3
    );

    // Combine scores
    return Math.min(termScore + complexityScore, 1);
};

export const validateLLMResponseSchema = async <T>({
    prompt,
    filesAndImages,
    systemPrompt,
    schema,
    maxRetries = 3,
    onRetry,
    llmClient,
    logger,
}: LLMValidationOptions<T>): Promise<T> => {
    const ajv = new Ajv();

    const jsonSchema = zodToJsonSchema(schema, "mySchema");
    const validate = ajv.compile(jsonSchema as JSONSchemaType<T>);
    let attempts = 0;

    const formattedPrompt = `
    ${prompt}

    <response_structure>

    # rules
    - Only include the correct schema nothing else.
    - Return a JSON object exactly matching this schema.
    - Do not include any markdown formatting, slashes or comments.
    - return no <thinking> tags.
    - Only return the JSON object, no other text or other values.
    - Never return the schema wrapped in another value like 'outputs' etc.

    ${JSON.stringify(jsonSchema, null, 2)}

    </response_structure>
  `;

    while (attempts < maxRetries) {
        try {
            const response = await llmClient.analyze(
                formattedPrompt,
                {
                    system: systemPrompt,
                },
                filesAndImages
            );

            let responseText = response
                .toString()
                .replace(/```json\n?|\n?```/g, "");

            let parsed: T;
            try {
                parsed = JSON.parse(responseText);
            } catch (parseError) {
                logger.error(
                    "validateLLMResponseSchema",
                    "Failed to parse LLM response as JSON",
                    {
                        response: responseText,
                        error: parseError,
                    }
                );
                attempts++;
                onRetry?.(parseError as Error, attempts);
                continue;
            }

            if (!validate(parsed)) {
                logger.error(
                    "validateLLMResponseSchema",
                    "Response failed schema validation",
                    {
                        errors: validate.errors,
                        response: parsed,
                    }
                );
                attempts++;
                onRetry?.(
                    new Error(
                        `Schema validation failed: ${JSON.stringify(validate.errors)}`
                    ),
                    attempts
                );
                continue;
            }

            return parsed;
        } catch (error) {
            logger.error(
                "validateLLMResponseSchema",
                `Attempt ${attempts + 1} failed`,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                }
            );
            attempts++;
            onRetry?.(error as Error, attempts);

            if (attempts >= maxRetries) {
                throw new Error(
                    `Failed to get valid LLM response after ${maxRetries} attempts: ${error}`
                );
            }
        }
    }

    throw new Error("Maximum retries exceeded");
};

export function isValidDateValue(
    value: unknown
): value is string | number | Date {
    return (
        typeof value === "string" ||
        typeof value === "number" ||
        value instanceof Date
    );
}

export function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36); // Convert to base36 for shorter strings
}

export function getTimeContext(timestamp: Date): string {
    const now = new Date();
    const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) return "very_recent";
    if (hoursDiff < 72) return "recent";
    if (hoursDiff < 168) return "this_week";
    if (hoursDiff < 720) return "this_month";
    return "older";
}

export function generateContentId(content: any): string {
    try {
        // 1. Special handling for Twitter mentions/tweets array
        if (Array.isArray(content) && content[0]?.type === "tweet") {
            // Use the newest tweet's ID as the marker
            const newestTweet = content[0];
            return `tweet_batch_${newestTweet.metadata.tweetId}`;
        }

        // 2. Single tweet handling
        if (content?.type === "tweet") {
            return `tweet_${content.metadata.tweetId}`;
        }

        // 3. If it's a plain string, fallback to hashing the string but also add a small random/time factor.
        //    This ensures repeated user messages with the same text won't collapse to the same ID.
        if (typeof content === "string") {
            // Add a short suffix: e.g. timestamp + small random
            const suffix = `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 6)}`;
            return `content_${hashString(content)}_${suffix}`;
        }

        // 4. For arrays (non-tweets), attempt to find known IDs or hash the items
        if (Array.isArray(content)) {
            const ids = content.map((item) => {
                // Check if there's an explicit .id
                if (item.id) return item.id;
                // Check for item.metadata?.id
                if (item.metadata?.id) return item.metadata.id;

                // Otherwise, hash the item
                const relevantData = {
                    content: item.content || item,
                    type: item.type,
                };
                return hashString(JSON.stringify(relevantData));
            });

            // Join them, but also add a short suffix so different array orders don't collide
            const suffix = `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 6)}`;
            return `array_${ids.join("_").slice(0, 100)}_${suffix}`;
        }

        // 5. For single objects, check .id first
        if (content.id) {
            return `obj_${content.id}`;
        }

        // 6. Special handling for "internal_thought" or "consciousness"
        if (
            content.type === "internal_thought" ||
            content.source === "consciousness"
        ) {
            const thoughtData = {
                content: content.content,
                timestamp: content.timestamp,
            };
            return `thought_${hashString(JSON.stringify(thoughtData))}`;
        }

        // 7. Then check if there's a metadata.id
        if (content.metadata?.id) {
            return `obj_${content.metadata.id}`;
        }

        // 8. Or any metadata key ending with 'id'
        if (content.metadata) {
            for (const [key, value] of Object.entries(content.metadata)) {
                if (key.toLowerCase().endsWith("id") && value) {
                    return `obj_${value}`;
                }
            }
        }

        // 9. Finally, fallback to hashing the object,
        //    but add a random/time suffix so repeated content isn't auto-deduplicated.
        const relevantData = {
            content: content.content || content,
            type: content.type,
            // Include source if available
            ...(content.source &&
                content.source !== "consciousness" && {
                    source: content.source,
                }),
        };
        const baseHash = hashString(JSON.stringify(relevantData));
        const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        return `obj_${baseHash}_${suffix}`;
    } catch (error) {
        return `fallback_${Date.now()}`;
    }
}
