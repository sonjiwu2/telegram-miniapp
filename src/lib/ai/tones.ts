// Раздел 11 ТЗ — тон влияет только на текст вердикта, не на логику безопасности.
export const AI_TONES = [
  "Судья",
  "Очень серьёзно",
  "Сарказм",
  "Корпоративный HR",
  "Бабушка",
  "Спортивный комментатор",
  "Средневековый король",
  "Сухой бюрократ",
] as const;

export type AiTone = (typeof AI_TONES)[number];

export const DEFAULT_AI_TONE: AiTone = "Судья";

export function isAiTone(value: unknown): value is AiTone {
  return typeof value === "string" && (AI_TONES as readonly string[]).includes(value);
}
