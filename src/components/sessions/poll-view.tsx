"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/session-provider";
import { ShareActions } from "@/components/sessions/share-actions";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { getPollTally } from "@/lib/sessions/get-poll-tally";
import type { PublicSession } from "@/lib/types/session";

export function PollView({
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
  const tally = getPollTally(session);

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

  async function handleFinalize() {
    if (finalizing) {
      return;
    }
    setFinalizing(true);
    setError(null);
    try {
      const { session: updated } = await apiClient.sessions.finalize(session.id);
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Не удалось завершить голосование.");
    } finally {
      setFinalizing(false);
    }
  }

  if (session.status === "RESOLVED" && tally) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 p-6">
        <h1 className="text-center text-2xl font-bold">{session.title}</h1>
        <p className="text-muted text-center text-xs tracking-wide uppercase">
          {tally.tie ? "Ничья" : "Голосование завершено"} · {tally.totalVotes} голосов
        </p>
        <div className="flex flex-col gap-2">
          {session.options.map((option) => {
            const count = tally.counts[option.id] ?? 0;
            const percent = tally.totalVotes > 0 ? Math.round((count / tally.totalVotes) * 100) : 0;
            const isWinner = session.result?.winnerOptionId === option.id;

            return (
              <div
                key={option.id}
                className="border-border bg-surface relative overflow-hidden rounded-xl border p-3"
              >
                <div
                  className="bg-accent/15 absolute inset-y-0 left-0"
                  style={{ width: `${percent}%` }}
                  aria-hidden="true"
                />
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
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 p-6">
      <h1 className="text-center text-2xl font-bold">{session.title}</h1>
      {votedOptionId && (
        <p className="text-muted text-center text-xs">Ты проголосовал. Можно передумать до закрытия.</p>
      )}
      <div className="flex flex-col gap-2">
        {session.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleVote(option.id)}
            disabled={voting}
            className={`min-h-12 rounded-xl border px-4 text-left text-sm font-medium ${
              votedOptionId === option.id ? "border-accent text-accent" : "border-border"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}
      {isCreator && (
        <>
          <ShareActions sessionId={session.id} shareText={`Голосуем: ${session.title}`} />
          <button
            type="button"
            onClick={handleFinalize}
            disabled={finalizing}
            className="border-border min-h-12 rounded-xl border text-sm font-medium disabled:opacity-40"
          >
            {finalizing ? "Завершаем..." : "Завершить и посмотреть результаты"}
          </button>
        </>
      )}
    </div>
  );
}
