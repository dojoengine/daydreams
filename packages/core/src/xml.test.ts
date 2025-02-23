import { expect, test, describe } from "bun:test";
import { isElement, parse, type ElementNode } from "./xml";

describe("XMLParser", () => {
  test("parses simple element", () => {
    const xml = "<test>content</test>";
    const nodes = parse(xml, (node) => node);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      type: "element",
      name: "test",
      content: "content",
      attributes: {},
    });
  });

  test("parses attributes", () => {
    const xml = '<test id="123" class="main">content</test>';
    const nodes = parse(xml, (node) => node);

    expect(nodes[0].type === "element" ? nodes[0].attributes : {}).toEqual({
      id: "123",
      class: "main",
    });
  });

  test("parses nested elements", () => {
    const xml = "<parent><child>content</child></parent>";
    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") {
        return { ...node, children: parse() };
      }
      return node;
    });

    expect(nodes[0].children).toHaveLength(1);
    expect(nodes[0].children?.[0]).toMatchObject({
      name: "child",
      content: "content",
    });
  });

  test("parses self-closing tags", () => {
    const xml = "<parent><child/></parent>";
    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") {
        return { ...node, children: parse() };
      }
      return node;
    });

    expect(nodes[0].children?.[0]).toMatchObject({
      type: "element",
      name: "child",
      closed: true,
    });
  });

  test("handles text nodes", () => {
    const xml = "<root>text content<child/>more text</root>";
    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") {
        return { ...node, children: parse() };
      }
      return node;
    });

    const children = nodes[0].children;
    expect(children).toHaveLength(3);
    expect(children?.[0]).toMatchObject({
      type: "text",
      content: "text content",
    });
    expect(children?.[2]).toMatchObject({
      type: "text",
      content: "more text",
    });
  });

  test("maintains parent references", () => {
    const xml = "<parent><child>content</child></parent>";
    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") {
        return { ...node, children: parse() };
      }
      return node;
    });

    const child = nodes[0].children?.[0];
    expect(child?.parent).toBeDefined();
    expect(child?.parent?.type).toBe("element");
    expect((child?.parent as any).name).toBe("parent");
  });

  test("handles complex nested structure", () => {
    const xml = `
      <output>
        <action name="test"/>
        <analysis msgId="123">
          This is content
        </analysis>
        <response msgId="456">
          <nested>data</nested>
        </response>
      </output>
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") {
        return { ...node, children: parse() };
      }
      return node;
    });

    expect(isElement(nodes[0]) ? nodes[0].name : "").toBe("output");
    expect(nodes[0].children).toHaveLength(3);
  });

  test("handles malformed XML gracefully", () => {
    const xml = "<test>unclosed";
    const nodes = parse(xml, (node) => node);
    expect(nodes).toHaveLength(0);
  });

  test("parses prompt with instructions", () => {
    const xml = `
      <prompt>
        <instruction>Complete the story about:</instruction>
        <context>A cat named Whiskers who loves to explore</context>
        <examples>
          <example>Whiskers climbed the highest tree</example>
          <example>Whiskers found a secret garden</example>
        </examples>
      </prompt>
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    expect(nodes[0].children).toHaveLength(3);
    expect(nodes[0].children?.[1].content).toBe(
      "A cat named Whiskers who loves to explore"
    );
  });

  test("parses LLM response with multiple elements", () => {
    const xml = `
      <response>
        <thought>Let's solve this step by step</thought>
        <calculation>
          Step 1: Initialize x = 5
          Step 2: Multiply by 2
          Result: x = 10
        </calculation>
        <final_answer>The answer is 10</final_answer>
      </response>
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    const children = nodes[0].children;
    expect(children).toHaveLength(3);
    expect((children?.[0] as ElementNode).name).toBe("thought");
    expect((children?.[2] as ElementNode).name).toBe("final_answer");
  });

  test("handles mixed content with code blocks", () => {
    const xml = `
      <message>
        Here's a code example:
        <code language="python">
          def hello():
              print("Hello World")
        </code>
        And here's another:
        <code language="javascript">
          console.log("Hi");
        </code>
      </message>
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    const children = nodes[0].children;
    expect(children).toBeDefined();
    expect(
      children?.filter(
        (node) => node.type === "element" && node.name === "code"
      )
    ).toHaveLength(2);
    expect(children?.filter((node) => node.type === "text")).toHaveLength(2);
  });

  test("parses nested functions and reasoning", () => {
    const xml = `
      <reasoning>
        <step>First, we need to analyze the input</step>
        <function name="analyze">
          <input>raw data</input>
          <output>processed result</output>
          <explanation>The data was processed using...</explanation>
        </function>
        <step>Now we can conclude...</step>
      </reasoning>
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    const function_node = nodes[0].children?.find(
      (c) => c.type === "element" && c.name === "function"
    );
    expect((function_node as ElementNode).attributes.name).toBe("analyze");
    expect(function_node?.children).toHaveLength(3);
  });

  test("handles special characters in text content", () => {
    const xml = `
      <response>
        <text>Here's some text with &lt;special&gt; characters</text>
        <code>if (x < 10 && y > 20)</code>
      </response>
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    expect(nodes[0].children?.[0].content).toContain("special");
    expect(nodes[0].children?.[1].content).toContain("<");
  });
});

describe("XML Parser - Mixed Content", () => {
  test("handles text before and after xml", () => {
    const xml = `Some text\n<test/>\nMore text`;
    const nodes = parse(xml, (node) => node);

    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toMatchObject({
      type: "text",
      content: "Some text",
    });
    expect(nodes[1]).toMatchObject({
      type: "element",
      name: "test",
      closed: true,
    });
    expect(nodes[2]).toMatchObject({
      type: "text",
      content: "More text",
    });
  });

  test("handles multiple xml tags with text between", () => {
    const xml = `Start\n<first/>\nMiddle\n<second/>\nEnd`;
    const nodes = parse(xml, (node) => node);

    expect(nodes).toHaveLength(5);
    expect(nodes.map((n) => n.type)).toEqual([
      "text",
      "element",
      "text",
      "element",
      "text",
    ]);
  });

  test("preserves whitespace in text content", () => {
    const xml = `   Leading spaces\n<tag/>\n  Indented text  \n`;
    const nodes = parse(xml, (node) => node);

    expect(nodes[0].content).toBe("Leading spaces");
    expect(nodes[2].content).toBe("Indented text");
  });

  test("handles nested xml within text", () => {
    const xml = `Before\n<parent>Inside <child/> parent</parent>\nAfter`;
    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    expect(nodes).toHaveLength(3);
    expect(nodes[1].children).toHaveLength(3);
  });

  test("handles complex mixed content", () => {
    const xml = `
    Start of document
    <metadata type="info">
      <title>Test</title>
      Some description
      <tags>
        <tag>one</tag>
        between tags
        <tag>two</tag>
      </tags>
    </metadata>
    End of document
    `;

    const nodes = parse(xml, (node, parse) => {
      if (node.type === "element") return { ...node, children: parse() };
      return node;
    });

    expect(nodes).toHaveLength(3);
    expect(nodes[1].children?.length).toBeGreaterThan(0);
  });
});
