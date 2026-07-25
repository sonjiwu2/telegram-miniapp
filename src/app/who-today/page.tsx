"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { VERDICT_LINES, WHO_TODAY_TEMPLATES } from "@/config/who-today-templates";
import type { PublicSessionParticipant } from "@/lib/types/session";

type Phase = "setup" | "spinning" | "result";

function pickVerdictLine(): string {
  return VERDICT_LINES[Math.floor(Math.random() * VERDICT_LINES.length)]!;
}

export default function WhoTodayPage() {
  const { status } = useAuth();

  const [phase, setPhase] = useState<Phase>("setup");
  const [question, setQuestion] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [winnerName, setWinnerName] = useState("");
  const [verdictLine, setVerdictLine] = useState("");

  const spinTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimer.current) {
        clearInterval(spinTimer.current);
      }
    };
  }, []);

  function addParticipant() {
    const name = participantInput.trim();
    if (!name || participants.includes(name)) {
      setParticipantInput("");
      return;
    }
    setParticipants((prev) => [...prev, name]);
    setParticipantInput("");
  }

  function removeParticipant(name: string) {
    setParticipants((prev) => prev.filter((existing) => existing !== name));
  }

  function runSpinAnimation(sessionParticipants: PublicSessionParticipant[], finalWinner: string) {
    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const names = sessionParticipants.map((participant) => participant.displayName);

    const finish = () => {
      setDisplayName(finalWinner);
      setTimeout(() => {
        setPhase("result");
        setSubmitting(false);
      }, 400);
    };

    if (reducedMotion || names.length === 0) {
      finish();
      return;
    }

    let tick = 0;
    const totalTicks = 18;
    spinTimer.current = setInterval(() => {
      tick += 1;
      setDisplayName(names[Math.floor(Math.random() * names.length)]!);

      if (tick >= totalTicks) {
        if (spinTimer.current) {
          clearInterval(spinTimer.current);
        }
        finish();
      }
    }, 90);
  }

  async function handleSpin() {
    if (participants.length < 2 || !question.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { session: created } = await apiClient.sessions.create({
        type: "ROULETTE",
        title: question.trim(),
      });
      await apiClient.sessions.addParticipants(created.id, participants);
      await apiClient.sessions.start(created.id);
      const { session: finalized } = await apiClient.sessions.finalize(created.id);

      const winner = finalized.participants.find(
        (participant) => participant.id === finalized.result?.winnerParticipantId,
      );

      setWinnerName(winner?.displayName ?? "Неизвестно");
      setVerdictLine(pickVerdictLine());
      setPhase("spinning");
      runSpinAnimation(finalized.participants, winner?.displayName ?? "Неизвестно");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Не удалось запустить рулетку. Попробуйте ещё раз.",
      );
      setSubmitting(false);
    }
  }

  function startNewQuestion() {
    setPhase("setup");
    setQuestion("");
    setParticipants([]);
    setParticipantInput("");
    setError(null);
    setWinnerName("");
  }

  if (phase === "spinning") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">Судьба решает</p>
        <p className="text-4xl font-bold">{displayName}</p>
      </main>
    );
  }

  if (phase === "result") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">Жертва определена</p>
        <h1 className="text-4xl font-bold">{winnerName}</h1>
        <p className="text-muted max-w-xs">{question}</p>
        <p className="text-accent text-sm font-medium">«{verdictLine}»</p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={handleSpin}
            className="bg-accent min-h-12 rounded-xl font-semibold text-white active:scale-95"
          >
            Реванш
          </button>
          <button
            type="button"
            onClick={startNewQuestion}
            className="border-border min-h-12 rounded-xl border font-semibold"
          >
            Новый вопрос
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Кто сегодня?</h1>

      {status !== "authenticated" ? (
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы запускать рулетку." />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <label htmlFor="who-today-question" className="text-sm font-medium">
              Вопрос
            </label>
            <div className="flex flex-wrap gap-2">
              {WHO_TODAY_TEMPLATES.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setQuestion(template)}
                  className={`min-h-9 rounded-full border px-3 py-1.5 text-xs ${
                    question === template ? "border-accent text-accent" : "border-border text-muted"
                  }`}
                >
                  {template}
                </button>
              ))}
            </div>
            <input
              id="who-today-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Кто сегодня ...?"
              maxLength={200}
              className="border-border bg-surface min-h-12 rounded-xl border px-4 text-base"
            />
          </section>

          <section className="flex flex-col gap-2">
            <label htmlFor="who-today-participant" className="text-sm font-medium">
              Участники ({participants.length})
            </label>
            <div className="flex gap-2">
              <input
                id="who-today-participant"
                value={participantInput}
                onChange={(event) => setParticipantInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addParticipant();
                  }
                }}
                placeholder="Имя участника"
                maxLength={50}
                className="border-border bg-surface min-h-12 flex-1 rounded-xl border px-4 text-base"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="border-border min-h-12 rounded-xl border px-4 text-sm font-medium"
              >
                Добавить
              </button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {participants.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => removeParticipant(name)}
                    className="bg-surface border-border flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
                  >
                    {name}
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {participants.length < 2 && <p className="text-muted text-xs">Нужно минимум 2 участника.</p>}
          </section>

          {error && (
            <p className="text-accent text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSpin}
            disabled={submitting || participants.length < 2 || !question.trim()}
            className="bg-accent min-h-14 rounded-2xl text-lg font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "Крутим..." : "КРУТИТЬ"}
          </button>
        </>
      )}
    </main>
  );
}
