import {
  formatAction,
  formatContextLog,
  formatOutputInterface,
} from "../formatters";
import { createParser, createPrompt } from "../prompt";
import type { ActionResult, AnyAction, Log, Output } from "../types";
import { xmlStreamParser } from "../xml";

const promptTemplate = `
You are tasked with analyzing messages, formulating responses, and initiating actions based on a given context. 
You will be provided with a set of available actions, outputs, and a current context. 
Your instructions is to analyze the situation and respond appropriately.

## Instructions
- If asked for something - never do a summary unless you are asked to do a summary. Always respond with the exact information requested.
- You must use the available actions and outputs to respond to the context.
- You must reason about the context, think, and planned actions.

Follow these steps to process the updates:

1. Analyze the updates and available data:
   Wrap your reasoning process in <reasoning> tags. Consider:

   - Check the available data to avoid redundant action calls
   - The availabe contexts and their state
   - The available actions and their asynchronous nature
   - The content of the new updates
   - Potential dependencies between actions

   Response determination guidelines:

   a) First check if required state exists in the available contexts
   b) Respond to direct questions or requests for information

2. Plan actions:
   Before formulating a response, consider:

   - What data is already available
   - Which actions need to be initiated
   - The order of dependencies between actions
   - How to handle potential action failures
   - What information to provide while actions are processing

3. Formulate a output (if needed):
   If you decide to respond to the message, use <output> tags to enclose your output.
   Consider:

   - Using available data when possible
   - Acknowledging that certain information may not be immediately available
   - Setting appropriate expectations about action processing time
   - Indicating what will happen after actions complete

4. Initiate actions (if needed):
   Use <action_call> tags to initiate actions. Remember:

   - Actions are processed asynchronously after your response
   - Results will not be immediately available
   - You can only use actions listed in the <available_actions> section
   - Follow the schemas provided for each action
   - Actions should be used when necessary to fulfill requests or provide information that cannot be conveyed through a simple response

5. No output or action:
   If you determine that no output or action is necessary, don't respond to that message.

Here are the available actions you can initiate:
<available_actions>
{{actions}}
</available_actions>

Here are the available outputs you can use:
<outputs>
{{outputs}}
</outputs>

Here is the current contexts:
<contexts>
{{context}}
</contexts>

Now, analyze the following updates to contexts:
<contexts>
{{updates}}
</contexts>

Here's how you structure your response:
<response>
<reasoning>
[Your reasoning of the context, think, messages, and planned actions]
</reasoning>

[List of async action calls to be initiated, if applicable]
<action_call name="[Action name]">[action arguments using the schema as JSON]</action_call>

[List of outputs, if applicable]
<output type="[Output type]">
[output data using the schema]
</output>
</response>

{{examples}}
`;

export const prompt = createPrompt(
  promptTemplate,
  ({
    outputs,
    actions,
    updates,
    context,
  }: {
    context: string | string[];
    outputs: Output[];
    updates: string | string[];
    actions: AnyAction[];
  }) => ({
    context: context,
    outputs: outputs.map(formatOutputInterface),
    actions:
      actions.length > 0 ? actions.map(formatAction) : "NO ACTIONS AVAILABLE",
    updates: updates,
    examples: [],
  })
);

export const parse = createParser<
  {
    think: string[];
    response: string | undefined;
    reasonings: string[];
    calls: { name: string; data: any; error?: any }[];
    outputs: { type: string; content: string }[];
  },
  {
    action: { name: string };
    output: { type: string };
  }
>(
  () => ({
    think: [],
    reasonings: [],
    calls: [],
    outputs: [],
    response: undefined,
  }),
  {
    response: (state, element, parse) => {
      state.response = element.content;
      return parse();
    },

    action_call: (state, element) => {
      let [data, error] = [undefined, undefined] as [any, any];

      try {
        data = JSON.parse(element.content);
      } catch (_error) {
        error = _error;
      }

      state.calls.push({
        name: element.attributes.name,
        data,
        error,
      });
    },

    think: (state, element) => {
      state.think.push(element.content);
    },

    reasoning: (state, element) => {
      state.reasonings.push(element.content);
    },

    output: (state, element) => {
      state.outputs.push({
        type: element.attributes.type,
        content: element.content,
      });
    },
  }
);

const resultsTemplate = `
You are an AI agent tasked with analyzing the results of previously initiated actions and formulating appropriate responses based on these results. 
You will be provided with the original context, your previous analysis, and the results of the actions you initiated.

Follow these steps to process the <action_results>:

1. Analyze the results:
   Wrap your thinking process in <reasoning> tags. Consider:

   - The original context and your previous analysis
   - The results of each <action_call> by their id
   - Any dependencies between action results
   - Success or failure status of each action
   - Whether the combined results fulfill the original request

2. Correlate results with previous actions:
   For each action result:

   - Match it with the corresponding action using callId
   - Validate if the result meets the expected outcome
   - Identify any missing or incomplete results
   - Determine if additional actions are needed based on these results

3. Formulate a response (if needed):
   If you decide to respond to the message, use <response> tags to enclose your response.
   Consider:

   - Using available data when possible
   - Acknowledging that certain information may not be immediately available
   - Setting appropriate expectations about action processing time
   - Addressing any failures or unexpected results
   - Providing relevant insights from the combined results
   - Indicating if any follow-up actions are needed

4. Initiate follow-up actions (if needed):
   Use <action> tags to initiate actions. Remember:

   - Actions are processed asynchronously after your response
   - Results will not be immediately available
   - You can only use actions listed in the <available_actions> section
   - Follow the schemas provided for each action
   - Actions should be used when necessary to fulfill requests or provide information that cannot be conveyed through a simple response

Here are the available actions you can initiate:
<available_actions>
{{actions}}
</available_actions>

Here are the available outputs you can use:
<outputs>
{{outputs}}
</outputs>

Here is the current contexts:
<contexts>
{{context}}
</contexts>

Here is the contexts that triggered the actions:
<contexts>
{{updates}}
</contexts>

Now, review your current chain of reasoning/actions/outputs:

<chain>
{{logs}}
</chain>

Now, analyze the latests action results:

<action_results>
{{results}}
</action_results>

Here's how you should structure your next response:
<response>
<reasoning>
[Your reasoning of the context, think, messages, and planned actions]
</reasoning>

[List of async action calls to be initiated, if applicable]
<action_call name="[Action name]">[action arguments using the schema as JSON]</action_call>

[List of outputs, if applicable]
<output type="[Output type]">
[output data using the schema]
</output>
</response>

Remember:

- Always correlate results with their original actions using callId
- Never repeat your outputs
- Consider the complete chain of results when formulating responses
- Address any failures or unexpected results explicitly
- Initiate follow-up actions only when necessary
- Provide clear, actionable insights based on the combined results
- Maintain context awareness between original request and final results
`;

export const resultsPrompt = createPrompt(
  resultsTemplate,
  ({
    outputs,
    actions,
    updates,
    context,
    logs,
    results,
  }: {
    context: string | string[];
    outputs: Output[];
    updates: string | string[];
    actions: AnyAction[];
    logs: Log[];
    results: ActionResult[];
  }) => ({
    logs: logs
      // .sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))
      .map((i) => formatContextLog(i))
      .flat(),
    results: results.map(formatContextLog),
    context: context,
    outputs: outputs.map(formatOutputInterface),
    actions: actions.map(formatAction),
    updates: updates,
    examples: [],
  })
);

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

export type StackElement = {
  index: number;
  tag: string;
  attributes: Record<string, any>;
  content: string[];
  done: boolean;
};

const tags = new Set([
  "think",
  "response",
  "output",
  "action_call",
  "reasoning",
]);

export async function handleStream(
  textStream: AsyncGenerator<string>,
  initialIndex: number,
  fn: (el: StackElement) => void
) {
  const parser = xmlStreamParser(tags);

  parser.next();

  let current: StackElement | undefined = undefined;
  let stack: StackElement[] = [];

  let index = initialIndex;

  async function handleChunk(chunk: string) {
    let result = parser.next(chunk);
    while (!result.done && result.value) {
      if (result.value.type === "start") {
        if (current) stack.push(current);
        current = {
          index: index++,
          tag: result.value.name,
          attributes: result.value.attributes,
          content: [],
          done: false,
        };
        fn(current);
      }

      if (result.value.type === "end") {
        if (current)
          fn({
            ...current,
            done: true,
          });
        current = stack.pop();
      }

      if (result.value.type === "text") {
        if (current) {
          current.content.push(result.value.content);
          fn(current);
        }
      }
      result = parser.next();
    }
  }

  for await (const chunk of textStream) {
    handleChunk(chunk);
  }

  parser.return?.();
}

export async function* wrapStream(
  stream: AsyncIterableStream<string>,
  prefix: string,
  suffix: string
) {
  yield prefix;
  for await (const value of stream) {
    yield value;
  }
  yield suffix;
}
