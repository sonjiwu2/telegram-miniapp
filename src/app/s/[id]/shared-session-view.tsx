"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { getWinnerLabel } from "@/lib/sessions/get-winner-label";
import { SessionResultSummary } from "@/components/sessions/session-result-summary";
import { PollView } from "@/components/sessions/poll-view";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicSession } from "@/lib/types/session";

type State =
  | { status: "loading" }
  | { status: "loaded"; session: PublicSession }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function SharedSessionView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiClient.sessions
      .get(id)
      .then(({ session }) => {
        if (!cancelled) {
          setState({ status: "loaded", session });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiRequestError && error.status === 404) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error", message: "Не удалось загрузить сессию." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6" aria-busy="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-56" />
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Не нашли" description="Такой сессии не существует или она удалена." />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Что-то сломалось" description={state.message} />
      </main>
    );
  }

  const { session } = state;

  if (session.type === "POLL") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center">
        <PollView session={session} onUpdate={(updated) => setState({ status: "loaded", session: updated })} />
      </main>
    );
  }

  const winnerLabel = getWinnerLabel(session);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <SessionResultSummary title={session.title} status={session.status} winnerLabel={winnerLabel} />
      <Link href="/" className="bg-accent min-h-12 rounded-xl px-6 py-3 text-base font-semibold text-white">
        Создать своё решение
      </Link>
    </main>
  );
}
