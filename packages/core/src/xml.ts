import type { XMLElement } from "./types";

/**
 * Formats an XML element into a string representation
 * @param tag - The XML tag name
 * @param params - Optional parameters/attributes for the XML tag
 * @param content - The content of the XML element (string or nested elements)
 * @returns Formatted XML string
 */
export function formatXml({ tag, params, content }: XMLElement): string {
  const p = params
    ? Object.entries(params)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join("")
    : "";
  try {
    return `<${tag}${p}>${typeof content === "string" ? content : Array.isArray(content) ? "\n" + content.map((el) => (typeof el === "string" ? el : formatXml(el))).join("\n") + "\n" : ""}</${tag}>`;
  } catch (error) {
    console.log("failed to format", { tag, params, content });
    throw error;
  }
}

/**
 * Creates a regular expression to match XML tags with a specific name
 * @param tagName - The name of the XML tag to match
 * @returns RegExp that matches the specified XML tag and captures its attributes and content
 */
export function createTagRegex(tagName: string) {
  return new RegExp(
    `(<${tagName}(?:\\s+[^>]*)?>)([\\s\\S]*?)<\/${tagName}>`,
    "gs"
  );
}

export function createTagParser<T = string>(
  tagName: string,
  contentParser?: (content: any) => T
) {
  const regex = createTagRegex(tagName);

  return (content: string) => {
    const matches = Array.from(content.matchAll(regex));
    try {
      return matches.map((t) => ({
        tag: tagName,
        params: t[1] ? parseAttributes(t[1]) : {},
        content: (contentParser
          ? contentParser(t[2]?.trim())
          : t[2]?.trim()) as T extends string ? string : T,
      }));
    } catch (error) {
      console.log({ content, matches });
      throw error;
    }
  };
}

// new parser
export type TextNode = {
  type: "text";
  content: string;
  parent?: Node;
  children?: never;
};

export type ElementNode<
  Attributes extends Record<string, string> = Record<string, any>,
> = {
  type: "element";
  name: string;
  attributes: Attributes;
  content: string;
  parent?: Node;
  children?: Node[];
  closed?: true;
};

export type Node = TextNode | ElementNode;

export type NodeVisitor = (node: Node, parse: () => Node[]) => Node;

export function parseAttributes(text: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (text.length === 0) return attrs;
  const matches = text.matchAll(/(\w+)="([^"]*)"/g);
  for (const match of matches) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export function parse(
  text: string,
  visitor: NodeVisitor,
  depth = 0,
  parent: Node | undefined = undefined
): Node[] {
  const nodes: Node[] = [];

  let workingText = text.trim();

  while (workingText.length > 0) {
    // Find first opening tag
    const tagStart = workingText.indexOf("<");
    if (tagStart === -1) {
      const textNode: TextNode = {
        type: "text",
        content: workingText.trim(),
      };
      nodes.push(visitor(textNode, () => []));
      break;
    }

    const tagEnd = workingText.indexOf(">", tagStart);

    if (tagStart > 0 || tagEnd === -1) {
      const textNode: TextNode = {
        type: "text",
        content: workingText.slice(0, tagEnd === -1 ? -1 : tagStart).trim(),
      };
      nodes.push(visitor(textNode, () => []));
    }

    // Find end of opening tag
    if (tagEnd === -1) break;

    // Parse tag and attributes
    let tagContent = workingText.slice(tagStart + 1, tagEnd);
    let closed = false;
    if (tagContent.at(-1) === "/") {
      closed = true;
      tagContent = tagContent.slice(0, -1);
    }

    const [name, ...attrParts] = tagContent.split(" ");
    const attributes = parseAttributes(attrParts.join(" ").trim());

    // Skip if it's a closing tag
    if (closed) {
      workingText = workingText.slice(tagEnd + 1).trim();
      nodes.push(
        visitor(
          {
            type: "element",
            name,
            attributes,
            content: "",
            closed,
          },
          () => []
        )
      );
      continue;
    }

    // Find last matching close tag
    const closeTag = `</${name}>`;
    const closePos = workingText.indexOf(closeTag);
    if (closePos === -1) break;

    // Extract content between tags
    const content = workingText.slice(tagEnd + 1, closePos).trim();

    const node: ElementNode = {
      type: "element",
      name,
      attributes,
      content,
    };

    if (parent) node.parent = parent;

    nodes.push(visitor(node, () => parse(content, visitor, depth + 1, node)));
    // Continue with remaining text before this tag
    workingText = workingText.slice(closePos + closeTag.length).trim();
  }
  return nodes;
}

export function isElement(node: Node): node is ElementNode {
  return node.type === "element";
}

export function isText(node: Node): node is TextNode {
  return node.type === "text";
}

type StartTag = {
  type: "start";
  name: string;
  attributes: Record<string, string>;
};

type EndTag = {
  type: "end";
  name: string;
};

type TextContent = {
  type: "text";
  content: string;
};

type SelfClosingTag = {
  type: "self-closing";
  name: string;
  attributes: Record<string, string>;
};

type XMLToken = StartTag | EndTag | TextContent | SelfClosingTag;

export function* xmlStreamParser(
  parseTags: Set<string>
): Generator<XMLToken | void, void, string> {
  let buffer = "";
  let textContent = "";

  while (true) {
    const chunk = yield;
    if (!chunk) continue;

    buffer += chunk;

    while (buffer.length > 0) {
      const tagStart = buffer.indexOf("<");

      if (tagStart > 0) {
        const text = buffer.slice(0, tagStart).trim();
        textContent += text;
        buffer = buffer.slice(tagStart);
        break;
      }

      if (tagStart === -1) {
        textContent += buffer;
        buffer = "";
        break;
      }

      const tagEnd = buffer.indexOf(">", tagStart);
      if (tagEnd === -1) {
        // textContent += buffer;
        // buffer = "";
        break;
      }

      let tagContent = buffer.slice(tagStart + 1, tagEnd);
      const isClosingTag = tagContent.startsWith("/");
      const tagName = isClosingTag
        ? tagContent.slice(1).trim().split(" ")[0]
        : tagContent.trim().split(" ")[0];

      if (parseTags.has(tagName)) {
        // Emit accumulated text if any
        if (textContent) {
          yield { type: "text", content: textContent };
          textContent = "";
        }

        if (isClosingTag) {
          yield { type: "end", name: tagName };
        } else {
          const attributes = parseAttributes(tagContent.slice(tagName.length));
          yield { type: "start", name: tagName, attributes };
        }
      } else {
        // Not a tag we care about, treat as text
        textContent += buffer.slice(0, tagEnd + 1);
      }

      buffer = buffer.slice(tagEnd + 1);
    }

    // Emit accumulated text if buffer is empty
    if (textContent) {
      yield { type: "text", content: textContent };
      textContent = "";
    }
  }
}
