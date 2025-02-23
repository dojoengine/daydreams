import { generateText, type LanguageModelV1 } from "ai";
import { render } from "../utils";
import { formatXml } from "../xml";

export const chainExpertManagerPrompt = `
You are a Chain Expert Manager.
Your role is to design and coordinate parallel execution chains based on context.

First, review available experts:
<available_experts>
{{experts}}
</available_experts>

Now, review the current context:
<context>
{{context}}
</context>

When formulating chains, follow this structure:
<think>[Analysis of problem and required chains]</think>

<response>
[List of parallel chains needed, use depends attribute only if neeeded]
<chain id="[chain_id]" depends="[chain dependecies]">
<think>[the think processes passed to the expert]</think>
<purpose>[purpose of this chain]</purpose>
[List of experts that will run sequential]
<expert name="[expert_name]">[Input and expected output]</expert>
</chain>

[Shared state between chains]
<shared_state>
{
 "active_chains": [],
 "context": {},
 "results": []
}
</shared_state>
</response>

Rules:
1. Chains run independently
2. State is shared across chains
3. Experts can communicate between chains
4. Each chain must have clear purpose
5. Design for parallel execution when beneficial

Your response should demonstrate:
- Clear chain organization
- Purposeful expert selection
- Efficient parallel processing
- Effective state management`;

export async function chainOfExperts({
  state,
  experts,
  model,
}: {
  state: any;
  experts: { name: string; description: string }[];
  model: LanguageModelV1;
}): Promise<any> {
  const context = render(chainExpertManagerPrompt, {
    context: JSON.stringify(state),
    experts: experts
      .map((expert) =>
        formatXml({
          tag: "expert",
          params: { name: expert.name },
          content: [
            {
              tag: "description",
              content: expert.description,
            },
          ],
        })
      )
      .join("\n"),
  });

  console.log({ context });

  const response = await generateText({
    model,
    system: context,
    prompt: "<response>",
    stopSequences: ["</response>"],
  });

  console.log({ response });
}
