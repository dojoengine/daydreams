// import { llm } from "./llm";
// import { createTagRegex, parseAttributes } from "./xml";
// import { render } from "./utils";
// import type {
//   ActionCall,
//   OutputRef,
//   Thought,
//   COTProps,
//   COTResponse,
// } from "./types";
// import {
//   formatAction,
//   formatContext,
//   formatOutputInterface,
// } from "./formatters";
// import { randomUUID } from "crypto";

// const promptTemplate = `
// You are tasked with analyzing your current context, formulating outputs, and initiating actions based on a that context.
// Your role is to process the information provided and respond in a structured manner.

// First, review the available actions you can initiate:
// <available_actions>
// {{actions}}
// </available_actions>

// Next, familiarize yourself with the types of outputs you can generate:
// <outputs>
// {{outputs}}
// </outputs>

// Next, review the context
// <context>
// {{context}}
// </context>

// Begin your response by carefully analyzing the context.

// Use the <think> tags to articulate your thought process, considering the available actions and potential outputs.

// If you determine that actions should be initiated based on the input and context:
// - List them after your <think> section.
// - You can only use actions listed in the <available_actions> section
// - Use the <action_call> tags for each action.
// - Follow the schemas provided for each action, always verify the action name
// - And remember actions are processed asynchronously after your response

// For any outputs you need to generate, use the <output> tags, specifying the output name and including the appropriate output data.
// Always use an output to send content.

// When formulating your response, always adhere to the following structure:
// <think>[your think process]</think>
// <response>
// [List of async actions to be initiated, if applicable]
// <action_call name="[action name]">[action data]</action>

// [List of outputs to send]
// <output name="[output name]">[output data]</output>
// </response>
// Remember to:
// 1. Create clear plans and revise them when needed
// 2. Thoroughly analyze the inputs before deciding on actions or outputs
// 3. Justify your decisions within the <think> section
// 4. Only initiate relevant actions and outputs based on the given context
// 5. Maintain a logical flow in your response
// 6. Learn from previous results to improve future decisions
// 7. Evaluate the effectiveness of previous actions and outputs
// 8. Maintain consistency with successful patterns
// 9. Adapt strategy based on failed actions
// 10. Consider all historical context when making decisions
// 11. Always at least respond to the user if you think they need a response
// 12. Try not to repeat yourself contextually

// Your response should be comprehensive yet concise, demonstrating a clear understanding of the task and the ability to make informed decisions based on the provided information.`;

// const cotTemplate = "";

// export async function chainOfThought({
//   model,
//   plan,
//   actions,
//   inputs,
//   outputs,
//   logs,
// }: COTProps): Promise<COTResponse> {
//   const prompt = render(promptTemplate, {
//     // plan,
//     actions: [
//       ...actions,
//       // outputs.map<Action>((o) => ({
//       //     name: o.type,
//       //     params: o.params,
//       //     description: o.description,
//       //     handler: async () => {},
//       // })),
//     ]
//       .map(formatAction)
//       .join("\n"),
//     context: logs.map(formatContext).filter(Boolean).join("\n"),
//     // data: "",
//     // inputs: inputs.map(formatInput).join("\n"),
//     outputs: outputs.map(formatOutputInterface).join("\n"),
//   });

//   console.log(prompt);

//   const { response } = await llm({
//     model,
//     system: prompt,
//     prompt: "<think>",
//     stopSequences: ["</response>"],
//   });

//   const now = Date.now();

//   const msg = response.messages[0];

//   let text =
//     msg.role === "assistant"
//       ? Array.isArray(msg.content)
//         ? msg.content.map((t) => (t.type === "text" ? t.text : "")).join("\n")
//         : msg.content
//       : "";

//   text = "<think>" + text;

//   console.log(text);

//   const responseText = Array.from(
//     text.matchAll(createTagRegex("response"))
//   ).map((t) => t[2].trim())[0];

//   console.log(responseText);
//   // todo: get this ordered for better outputs

//   const plans = Array.from(text.matchAll(createTagRegex("plan"))).map(
//     (t) => t[2]
//   );

//   const thinking = Array.from(
//     text.matchAll(createTagRegex("think"))
//   ).map<Thought>((t) => ({
//     ref: "thought",
//     content: t[2].trim(),
//     timestamp: now,
//   }));

//   const outs = Array.from(
//     responseText.matchAll(createTagRegex("output"))
//   ).map<OutputRef>((t) => {
//     const { name } = parseAttributes(t[1]);
//     return { ref: "output", type: name, data: t[2].trim(), timestamp: now };
//   });

//   // todo: try catch json parse and repeat?
//   const calls = Array.from(
//     responseText.matchAll(createTagRegex("action_call"))
//   ).map<ActionCall>((t) => {
//     const { name } = parseAttributes(t[1]);
//     return {
//       ref: "action_call",
//       id: randomUUID(),
//       name,
//       data: JSON.parse(t[2]),
//       timestamp: now,
//     };
//   });

//   console.dir({ outputs: outs, actions: calls }, { depth: Infinity });

//   return {
//     plan: plans,
//     actions: calls,
//     outputs: outs,
//     thinking,
//   };
// }
