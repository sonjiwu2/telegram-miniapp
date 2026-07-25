import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { isAiTone, DEFAULT_AI_TONE } from "@/lib/ai/tones";
import { buildVerdictSystemPrompt, buildVerdictUserMessage, buildDebateJudgeSystemPrompt, buildDebateJudgeUserMessage } from "./prompt";
import type { AIProvider, GenerateVerdictInput, JudgeDebateInput, Verdict, DebateVerdict } from "./types";

const VerdictSchema = z.object({
  refused: z.boolean(),
  headline: z.string(),
  verdict: z.string(),
  reasoning: z.string(),
  sentence: z.string(),
});

const REFUSED_VERDICT: Verdict = { refused: true, headline: "", verdict: "", reasoning: "", sentence: "" };

const DebateVerdictSchema = z.object({
  refused: z.boolean(),
  winnerId: z.string(),
  headline: z.string(),
  reasoning: z.string(),
  sentence: z.string(),
  confidence: z.number().min(0).max(100),
});

const REFUSED_DEBATE_VERDICT: DebateVerdict = {
  refused: true,
  winnerId: "",
  headline: "",
  reasoning: "",
  sentence: "",
  confidence: 0,
};

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

  async judgeDebate(input: JudgeDebateInput): Promise<DebateVerdict> {
    const tone = isAiTone(input.tone) ? input.tone : DEFAULT_AI_TONE;

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 1024,
      system: buildDebateJudgeSystemPrompt(tone),
      output_config: {
        effort: "medium",
        format: zodOutputFormat(DebateVerdictSchema),
      },
      messages: [{ role: "user", content: buildDebateJudgeUserMessage(input.question, input.sides) }],
    });

    if (response.stop_reason === "refusal") {
      return REFUSED_DEBATE_VERDICT;
    }

    if (!response.parsed_output) {
      throw new Error("AI response did not match the expected schema");
    }

    return response.parsed_output;
  }
}
