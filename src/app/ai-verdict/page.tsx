"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareActions } from "@/components/sessions/share-actions";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { AI_TONES, DEFAULT_AI_TONE, type AiTone } from "@/lib/ai/tones";
import { getVerdict, type VerdictPayload } from "@/lib/ai/get-verdict";

type Phase = "setup" | "loading" | "result";

const LOADING_LINES = [
  "Суд изучает материалы дела…",
  "Опрашиваем свидетелей, которых нет…",
  "Вердикт почти готов…",
];

const AI_TIMEOUT_MS = 45_000;

export default function AiVerdictPage() {
  const { status } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [situation, setSituation] = useState("");
  const [tone, setTone] = useState<AiTone>(DEFAULT_AI_TONE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<VerdictPayload | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);

  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (loadingTimer.current) {
        clearInterval(loadingTimer.current);
      }
    };
  }, []);

  function startLoadingCarousel() {
    let index = 0;
    setLoadingLine(LOADING_LINES[0]!);
    loadingTimer.current = setInterval(() => {
      index = (index + 1) % LOADING_LINES.length;
      setLoadingLine(LOADING_LINES[index]!);
    }, 2200);
  }

  function stopLoadingCarousel() {
    if (loadingTimer.current) {
      clearInterval(loadingTimer.current);
      loadingTimer.current = null;
    }
  }

  async function handleSubmit() {
    if (situation.trim().length < 10 || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setPhase("loading");
    startLoadingCarousel();

    try {
      const { session: created } = await apiClient.sessions.create({
        type: "AI_VERDICT",
        title: situation.trim(),
        settings: { tone },
      });
      await apiClient.sessions.start(created.id);
      const { session: finalized } = await apiClient.sessions.finalize(created.id, {
        timeoutMs: AI_TIMEOUT_MS,
      });

      const parsed = getVerdict(finalized);
      if (!parsed) {
        throw new Error("AI вернул неожиданный ответ");
      }

      setVerdict(parsed);
      setSessionId(finalized.id);
      setPhase("result");
    } catch (err) {
      let message = "Суд не смог вынести решение. Попробуйте ещё раз.";
      if (err instanceof ApiRequestError) {
        if (err.code === "AI_DAILY_LIMIT_REACHED") {
          message = "Дневной лимит бесплатных вердиктов исчерпан. Приходи завтра.";
        } else if (err.code === "AI_NOT_CONFIGURED") {
          message = "AI Вердикт пока не настроен на сервере.";
        } else if (err.code === "REQUEST_TIMEOUT") {
          message = "Суд слишком долго думает. Попробуйте ещё раз.";
        } else {
          message = err.message;
        }
      }
      setError(message);
      setPhase("setup");
    } finally {
      stopLoadingCarousel();
      setSubmitting(false);
    }
  }

  function reset() {
    setPhase("setup");
    setSituation("");
    setVerdict(null);
    setError(null);
  }

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы вызвать AI Вердикт." />
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">AI Вердикт</p>
        <p className="text-lg font-medium">{loadingLine}</p>
      </main>
    );
  }

  if (phase === "result" && verdict) {
    if (verdict.refused) {
      return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <EmptyState
            title="Решала отказывается принимать это решение"
            description="Тут лучше реально поговорить."
          />
          <button
            type="button"
            onClick={reset}
            className="border-border min-h-12 rounded-xl border px-6 text-sm font-medium"
          >
            Новая ситуация
          </button>
        </main>
      );
    }

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">Суд изучил материалы</p>
        <h1 className="text-3xl font-bold">{verdict.headline}</h1>
        <p className="max-w-sm text-base">{verdict.verdict}</p>
        <p className="text-muted max-w-sm text-sm italic">«{verdict.reasoning}»</p>
        <p className="text-accent max-w-sm text-sm font-medium">Приговор: {verdict.sentence}</p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          <ShareActions sessionId={sessionId} shareText={`RESHALA вынес вердикт: ${verdict.headline}`} />
          <button
            type="button"
            onClick={reset}
            className="border-border min-h-12 rounded-xl border font-semibold"
          >
            Новая ситуация
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">AI Вердикт</h1>
      <p className="text-muted text-sm">Опиши ситуацию — Решала вынесет приговор.</p>

      <section className="flex flex-col gap-2">
        <label htmlFor="ai-verdict-tone" className="text-sm font-medium">
          Тон
        </label>
        <div id="ai-verdict-tone" className="flex flex-wrap gap-2">
          {AI_TONES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTone(option)}
              className={`min-h-9 rounded-full border px-3 py-1.5 text-xs ${
                tone === option ? "border-accent text-accent" : "border-border text-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="ai-verdict-situation" className="text-sm font-medium">
          Ситуация
        </label>
        <textarea
          id="ai-verdict-situation"
          value={situation}
          onChange={(event) => setSituation(event.target.value)}
          placeholder="Мы договорились встретиться в 8. Антон пришёл в 9:20 и говорит, что предупреждал сообщением «скоро буду». Кто виноват?"
          maxLength={2000}
          rows={6}
          className="border-border bg-surface rounded-xl border px-4 py-3 text-base"
        />
      </section>

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || situation.trim().length < 10}
        className="bg-accent min-h-14 rounded-2xl text-lg font-semibold text-white disabled:opacity-40"
      >
        Вынести вердикт
      </button>
    </main>
  );
}
