"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionHistoryCard } from "@/components/sessions/session-history-card";
import { apiClient } from "@/lib/api-client";
import { SESSION_TYPE_LABELS } from "@/lib/sessions/type-labels";
import type { PublicSession } from "@/lib/types/session";

const TYPE_FILTERS = ["ROULETTE", "RANDOM_CHOICE", "POLL", "DEBATE", "AI_VERDICT"] as const;

function chipClass(active: boolean): string {
  return `min-h-9 rounded-full border px-3 py-1.5 text-xs ${
    active ? "border-accent text-accent" : "border-border text-muted"
  }`;
}

export default function HistoryPage() {
  const { status } = useAuth();

  const [mineOnly, setMineOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { sessions: loaded } = await apiClient.history.list({ mine: mineOnly, type: typeFilter });
        if (!cancelled) {
          setSessions(loaded);
        }
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить историю.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [status, mineOnly, typeFilter]);

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы увидеть историю." />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">История</h1>

      <div className="flex gap-2">
        <button type="button" onClick={() => setMineOnly(false)} className={chipClass(!mineOnly)}>
          Все
        </button>
        <button type="button" onClick={() => setMineOnly(true)} className={chipClass(mineOnly)}>
          Мои
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTypeFilter(undefined)} className={chipClass(!typeFilter)}>
          Все типы
        </button>
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={chipClass(typeFilter === type)}
          >
            {SESSION_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState title="История" description="Тут пока подозрительно тихо." />
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((session) => (
            <SessionHistoryCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </main>
  );
}
