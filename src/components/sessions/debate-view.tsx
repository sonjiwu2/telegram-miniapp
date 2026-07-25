"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/session-provider";
import { ShareActions } from "@/components/sessions/share-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { getDebateResult } from "@/lib/sessions/get-debate-result";
import { readDebateSettings, computeDebateClosesAt } from "@/lib/sessions/debate-settings";
import type { PublicSession } from "@/lib/types/session";

function useCountdown(closesAt: Date | null): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    function sync() {
      setRemainingMs(closesAt ? closesAt.getTime() - Date.now() : null);
    }
    sync();
    if (!closesAt) {
      return;
    }
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  return remainingMs;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function DebateView({
  session,
  onUpdate,
}: {
  session: PublicSession;
  onUpdate: (session: PublicSession) => void;
}) {
  const { user } = useAuth();
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreator = user?.id === session.creatorId;
  const { judge, durationMinutes } = readDebateSettings(session.settings);
  const closesAt = computeDebateClosesAt(session.startedAt ? new Date(session.startedAt) : null, durationMinutes);
  const remainingMs = useCountdown(judge === "vote" ? closesAt : null);
  const timeIsUp = remainingMs !== null && remainingMs <= 0;

  async function handleVote(optionId: string) {
    if (voting) {
      return;
    }
    setVoting(true);
    setError(null);
    try {
      const { session: updated } = await apiClient.sessions.vote(session.id, optionId);
      setVotedOptionId(optionId);
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Не удалось проголосовать.");
    } finally {
      setVoting(false);
    }
  }

  async function handleFinalize(timeoutMs?: number) {
    if (finalizing) {
      return;
    }
    setFinalizing(true);
    setError(null);
    try {
      const { session: updated } = await apiClient.sessions.finalize(session.id, { timeoutMs });
      onUpdate(updated);
    } catch (err) {
      let message = "Не удалось завершить спор.";
      if (err instanceof ApiRequestError) {
        if (err.code === "AI_DAILY_LIMIT_REACHED") {
          message = "Дневной лимит бесплатных AI-решений исчерпан. Приходи завтра.";
        } else if (err.code === "AI_NOT_CONFIGURED") {
          message = "AI-судья пока не настроен на сервере.";
        } else if (err.code === "REQUEST_TIMEOUT") {
          message = "Решала слишком долго думает. Попробуйте ещё раз.";
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setFinalizing(false);
    }
  }

  // Голосование само не закрывается сервером (нет фоновых джобов) — как только
  // у создателя истекает таймер, его клиент сам вызывает finalize.
  useEffect(() => {
    if (!(isCreator && judge === "vote" && timeIsUp && session.status === "OPEN" && !finalizing)) {
      return;
    }
    async function autoFinalize() {
      await handleFinalize();
    }
    void autoFinalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFinalize/finalizing намеренно не в зависимостях, иначе тикающий таймер пересоздавал бы эффект каждую секунду
  }, [isCreator, judge, timeIsUp, session.status]);

  const result = getDebateResult(session);

  if (session.status === "RESOLVED" && result) {
    if (result.mode === "ai") {
      if (result.refused) {
        return (
          <div className="flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
            <EmptyState
              title="Решала отказывается принимать это решение"
              description="Тут лучше реально поговорить."
            />
          </div>
        );
      }

      const winnerLabel = session.options.find((o) => o.id === session.result?.winnerOptionId)?.label ?? "";

      return (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
          <h1 className="text-center text-2xl font-bold">{session.title}</h1>
          <p className="text-muted text-xs tracking-wide uppercase">AI-судья вынес решение · уверенность {result.confidence}%</p>
          <p className="text-3xl font-bold">{winnerLabel}</p>
          <p className="text-muted max-w-sm text-sm italic">«{result.reasoning}»</p>
          <p className="text-accent max-w-sm text-sm font-medium">Приговор: {result.sentence}</p>
        </div>
      );
    }

    return (
      <div className="flex w-full max-w-sm flex-col gap-3 p-6">
        <h1 className="text-center text-2xl font-bold">{session.title}</h1>
        <p className="text-muted text-center text-xs tracking-wide uppercase">
          {result.tie ? "Ничья" : "Победитель спора"} · {result.totalVotes} голосов
        </p>
        <div className="flex flex-col gap-2">
          {session.options.map((option) => {
            const count = result.counts[option.id] ?? 0;
            const percent = result.totalVotes > 0 ? Math.round((count / result.totalVotes) * 100) : 0;
            const isWinner = session.result?.winnerOptionId === option.id;

            return (
              <div key={option.id} className="border-border bg-surface relative overflow-hidden rounded-xl border p-3">
                <div className="bg-accent/15 absolute inset-y-0 left-0" style={{ width: `${percent}%` }} aria-hidden="true" />
                <div className="relative flex items-center justify-between text-sm">
                  <span className={isWinner ? "font-semibold" : undefined}>{option.label}</span>
                  <span className="text-muted">
                    {percent}% ({count})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {!result.tie && <p className="text-accent text-center text-sm font-medium">«{result.verdictLine}»</p>}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 p-6">
      <h1 className="text-center text-2xl font-bold">{session.title}</h1>

      {judge === "vote" && remainingMs !== null && (
        <p className="text-muted text-center text-xs tracking-wide uppercase">
          {timeIsUp ? "Время вышло" : `Осталось: ${formatRemaining(remainingMs)}`}
        </p>
      )}

      {votedOptionId && judge === "vote" && (
        <p className="text-muted text-center text-xs">Ты проголосовал. Можно передумать до закрытия.</p>
      )}

      <div className="flex flex-col gap-2">
        {session.options.map((option) =>
          judge === "vote" ? (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={voting || timeIsUp}
              className={`min-h-12 rounded-xl border px-4 py-2 text-left text-sm ${
                votedOptionId === option.id ? "border-accent text-accent" : "border-border"
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              {option.argument && <span className="text-muted block text-xs">«{option.argument}»</span>}
            </button>
          ) : (
            <div key={option.id} className="border-border bg-surface rounded-xl border px-4 py-2 text-left text-sm">
              <span className="block font-medium">{option.label}</span>
              {option.argument && <span className="text-muted block text-xs">«{option.argument}»</span>}
            </div>
          ),
        )}
      </div>

      {judge === "ai" && !isCreator && (
        <p className="text-muted text-center text-xs">Ждём, пока создатель спросит Решалу.</p>
      )}

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      {isCreator && (
        <>
          <ShareActions sessionId={session.id} shareText={`Спорим: ${session.title}`} />
          <button
            type="button"
            onClick={() => handleFinalize(judge === "ai" ? 45_000 : undefined)}
            disabled={finalizing}
            className="border-border min-h-12 rounded-xl border text-sm font-medium disabled:opacity-40"
          >
            {finalizing
              ? judge === "ai"
                ? "Решала думает..."
                : "Завершаем..."
              : judge === "ai"
                ? "Спросить Решалу"
                : "Завершить и посмотреть результаты"}
          </button>
        </>
      )}
    </div>
  );
}
