"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { ReactionEmoji } from "@/lib/sessions/reactions";
import type { PublicSession } from "@/lib/types/session";

// Раздел 28 ТЗ: одна активная реакция на пользователя, счётчики видны всем.
// Своя реакция запоминается только локально в этой вкладке (как votedOptionId
// у голосования) — сервер не отдаёт наружу, кто чем отреагировал.
export function ReactionBar({
  session,
  onUpdate,
}: {
  session: PublicSession;
  onUpdate: (session: PublicSession) => void;
}) {
  const [myReaction, setMyReaction] = useState<ReactionEmoji | null>(null);
  const [pending, setPending] = useState(false);

  async function handleReact(emoji: ReactionEmoji) {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const { session: updated } = await apiClient.sessions.react(session.id, emoji);
      setMyReaction(emoji);
      onUpdate(updated);
    } catch {
      // Реакция необязательна для основного сценария — молча игнорируем сбой.
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      {session.reactions.map(({ emoji, count }) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleReact(emoji as ReactionEmoji)}
          disabled={pending}
          className={`flex min-h-9 items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${
            myReaction === emoji ? "border-accent" : "border-border"
          }`}
        >
          <span>{emoji}</span>
          {count > 0 && <span className="text-muted text-xs">{count}</span>}
        </button>
      ))}
    </div>
  );
}
