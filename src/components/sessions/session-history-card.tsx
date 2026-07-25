import Link from "next/link";
import { getWinnerLabel } from "@/lib/sessions/get-winner-label";
import { SESSION_STATUS_LABELS, SESSION_TYPE_LABELS } from "@/lib/sessions/type-labels";
import type { PublicSession } from "@/lib/types/session";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function SessionHistoryCard({ session }: { session: PublicSession }) {
  const winnerLabel = getWinnerLabel(session);

  return (
    <Link
      href={`/s/${session.id}`}
      className="border-border bg-surface flex flex-col gap-1 rounded-xl border p-4"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{SESSION_TYPE_LABELS[session.type] ?? session.type}</span>
        <span className="text-muted">{formatDate(session.createdAt)}</span>
      </div>
      <p className="font-medium">{session.title}</p>
      <p className="text-muted text-sm">
        {winnerLabel ?? SESSION_STATUS_LABELS[session.status] ?? session.status}
      </p>
    </Link>
  );
}
