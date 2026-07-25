"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareActions } from "@/components/sessions/share-actions";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import type { PublicSessionOption } from "@/lib/types/session";

type Phase = "setup" | "spinning" | "result";

const VERDICT_LINE = "Переголосование запрещено. Вы сами нажали «Нам похуй».";

export default function RandomPickPage() {
  const { status } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayLabel, setDisplayLabel] = useState("");
  const [winnerLabel, setWinnerLabel] = useState("");
  const [sessionId, setSessionId] = useState("");

  const spinTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimer.current) {
        clearInterval(spinTimer.current);
      }
    };
  }, []);

  function addOption() {
    const label = optionInput.trim();
    if (!label || options.includes(label)) {
      setOptionInput("");
      return;
    }
    if (options.length >= 20) {
      return;
    }
    setOptions((prev) => [...prev, label]);
    setOptionInput("");
  }

  function removeOption(label: string) {
    setOptions((prev) => prev.filter((existing) => existing !== label));
  }

  function runSpinAnimation(sessionOptions: PublicSessionOption[], finalWinner: string) {
    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const labels = sessionOptions.map((option) => option.label);

    const finish = () => {
      setDisplayLabel(finalWinner);
      setTimeout(() => {
        setPhase("result");
        setSubmitting(false);
      }, 400);
    };

    if (reducedMotion || labels.length === 0) {
      finish();
      return;
    }

    let tick = 0;
    const totalTicks = 16;
    spinTimer.current = setInterval(() => {
      tick += 1;
      setDisplayLabel(labels[Math.floor(Math.random() * labels.length)]!);

      if (tick >= totalTicks) {
        if (spinTimer.current) {
          clearInterval(spinTimer.current);
        }
        finish();
      }
    }, 80);
  }

  async function decide(currentOptions: string[]) {
    if (currentOptions.length < 2 || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { session: created } = await apiClient.sessions.create({
        type: "RANDOM_CHOICE",
        title: "Нам похуй",
      });
      await apiClient.sessions.addOptions(created.id, currentOptions);
      await apiClient.sessions.start(created.id);
      const { session: finalized } = await apiClient.sessions.finalize(created.id);

      const winner = finalized.options.find((option) => option.id === finalized.result?.winnerOptionId);

      setWinnerLabel(winner?.label ?? "Неизвестно");
      setSessionId(finalized.id);
      setPhase("spinning");
      runSpinAnimation(finalized.options, winner?.label ?? "Неизвестно");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Не удалось решить. Попробуйте ещё раз.");
      setSubmitting(false);
    }
  }

  function repeat() {
    decide(options);
  }

  function repeatWithoutWinner() {
    const remaining = options.filter((label) => label !== winnerLabel);
    setOptions(remaining);

    if (remaining.length >= 2) {
      decide(remaining);
    } else {
      setPhase("setup");
      setError(null);
      setWinnerLabel("");
    }
  }

  function startNewList() {
    setPhase("setup");
    setOptions([]);
    setOptionInput("");
    setError(null);
    setWinnerLabel("");
  }

  if (phase === "spinning") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">Решаем</p>
        <div className="border-border bg-surface min-w-48 rounded-2xl border px-6 py-8 text-3xl font-bold">
          {displayLabel}
        </div>
      </main>
    );
  }

  if (phase === "result") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">Решено</p>
        <h1 className="text-4xl font-bold">{winnerLabel}.</h1>
        <p className="text-accent text-sm font-medium">«{VERDICT_LINE}»</p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          <ShareActions sessionId={sessionId} shareText={`RESHALA решил: ${winnerLabel}.`} />
          <button
            type="button"
            onClick={repeat}
            className="bg-accent min-h-12 rounded-xl font-semibold text-white active:scale-95"
          >
            Повторить
          </button>
          <button
            type="button"
            onClick={repeatWithoutWinner}
            className="border-border min-h-12 rounded-xl border text-sm font-medium"
          >
            Убрать «{winnerLabel}» и повторить
          </button>
          <button
            type="button"
            onClick={startNewList}
            className="text-muted min-h-12 text-sm underline underline-offset-4"
          >
            Новый список
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Нам похуй</h1>

      {status !== "authenticated" ? (
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы решать." />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <label htmlFor="random-pick-option" className="text-sm font-medium">
              Варианты ({options.length}/20)
            </label>
            <div className="flex gap-2">
              <input
                id="random-pick-option"
                value={optionInput}
                onChange={(event) => setOptionInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addOption();
                  }
                }}
                placeholder="Пицца, Суши, Дом, Кино..."
                maxLength={80}
                className="border-border bg-surface min-h-12 flex-1 rounded-xl border px-4 text-base"
              />
              <button
                type="button"
                onClick={addOption}
                className="border-border min-h-12 rounded-xl border px-4 text-sm font-medium"
              >
                Добавить
              </button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {options.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => removeOption(label)}
                    className="bg-surface border-border flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
                  >
                    {label}
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {options.length < 2 && <p className="text-muted text-xs">Нужно минимум 2 варианта.</p>}
          </section>

          {error && (
            <p className="text-accent text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => decide(options)}
            disabled={submitting || options.length < 2}
            className="bg-accent min-h-14 rounded-2xl text-lg font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "Решаем..." : "РЕШАЙ"}
          </button>
        </>
      )}
    </main>
  );
}
