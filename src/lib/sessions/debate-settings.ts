export type DebateJudgeMode = "vote" | "ai";

export const DEFAULT_DEBATE_JUDGE_MODE: DebateJudgeMode = "vote";

export function isDebateJudgeMode(value: unknown): value is DebateJudgeMode {
  return value === "vote" || value === "ai";
}

export interface DebateDurationOption {
  label: string;
  minutes: number | null;
}

// Раздел 9 ТЗ: варианты таймера голосования. null — без таймера.
export const DEBATE_DURATION_OPTIONS: DebateDurationOption[] = [
  { label: "5 минут", minutes: 5 },
  { label: "30 минут", minutes: 30 },
  { label: "1 час", minutes: 60 },
  { label: "24 часа", minutes: 1440 },
  { label: "Без таймера", minutes: null },
];

export interface DebateSettings {
  judge: DebateJudgeMode;
  tone?: string;
  durationMinutes: number | null;
}

export function readDebateSettings(settings: unknown): DebateSettings {
  const candidate = (settings ?? {}) as Record<string, unknown>;
  return {
    judge: isDebateJudgeMode(candidate.judge) ? candidate.judge : DEFAULT_DEBATE_JUDGE_MODE,
    tone: typeof candidate.tone === "string" ? candidate.tone : undefined,
    durationMinutes: typeof candidate.durationMinutes === "number" ? candidate.durationMinutes : null,
  };
}

// closesAt актуален только для голосования — у AI-судьи нет таймера,
// решение выносится сразу по запросу создателя.
export function computeDebateClosesAt(startedAt: Date | null, durationMinutes: number | null): Date | null {
  if (!startedAt || !durationMinutes) {
    return null;
  }
  return new Date(startedAt.getTime() + durationMinutes * 60_000);
}
