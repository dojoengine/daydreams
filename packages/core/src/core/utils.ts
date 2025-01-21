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
