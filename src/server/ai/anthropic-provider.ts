import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { isAiTone, DEFAULT_AI_TONE } from "@/lib/ai/tones";
import { buildVerdictSystemPrompt, buildVerdictUserMessage } from "./prompt";
import type { AIProvider, GenerateVerdictInput, Verdict } from "./types";

const VerdictSchema = z.object({
  refused: z.boolean(),
  headline: z.string(),
  verdict: z.string(),
  reasoning: z.string(),
  sentence: z.string(),
});

const REFUSED_VERDICT: Verdict = { refused: true, headline: "", verdict: "", reasoning: "", sentence: "" };

export class AnthropicAIProvider implements AIProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateVerdict(input: GenerateVerdictInput): Promise<Verdict> {
    const tone = isAiTone(input.tone) ? input.tone : DEFAULT_AI_TONE;

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 1024,
      system: buildVerdictSystemPrompt(tone),
      output_config: {
        effort: "medium",
        format: zodOutputFormat(VerdictSchema),
      },
      messages: [{ role: "user", content: buildVerdictUserMessage(input.situation) }],
    });

    // Классификатор безопасности отклонил запрос ещё до структурированного вывода.
    if (response.stop_reason === "refusal") {
      return REFUSED_VERDICT;
    }

    if (!response.parsed_output) {
      throw new Error("AI response did not match the expected schema");
    }

    return response.parsed_output;
  }
}
