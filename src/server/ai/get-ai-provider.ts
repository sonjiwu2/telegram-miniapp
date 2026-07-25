import "server-only";
import { env } from "@/config/env";
import { ApiError } from "@/server/http/errors";
import { AnthropicAIProvider } from "./anthropic-provider";
import type { AIProvider } from "./types";

let cachedProvider: AIProvider | null = null;

// Провайдер выбирается по env.AI_PROVIDER — бизнес-логика (резолвер сессии)
// работает только через интерфейс AIProvider, ничего не знает про Anthropic.
export function getAIProvider(): AIProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  if (!env.AI_PROVIDER || !env.AI_API_KEY) {
    throw new ApiError(503, "AI_NOT_CONFIGURED", "AI provider is not configured");
  }

  switch (env.AI_PROVIDER) {
    case "anthropic":
      cachedProvider = new AnthropicAIProvider(env.AI_API_KEY, env.AI_MODEL ?? "claude-opus-5");
      return cachedProvider;
    default:
      throw new ApiError(503, "AI_NOT_CONFIGURED", `Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
  }
}
