import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionByPublicId } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { getWinnerLabel } from "@/lib/sessions/get-winner-label";
import { buildMiniAppLink } from "@/lib/telegram/deep-link";
import { SessionResultSummary } from "@/components/sessions/session-result-summary";

interface Props {
  params: Promise<{ id: string }>;
}

async function loadSession(id: string) {
  const session = await getSessionByPublicId(id);
  return session ? serializeSession(session) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await loadSession(id);

  if (!session) {
    return { title: "RESHALA" };
  }

  const winnerLabel = getWinnerLabel(session);
  const title = winnerLabel ? `RESHALA: ${winnerLabel}` : "RESHALA";
  const description = winnerLabel ? session.title : "Решала ещё думает.";

  return {
    title,
    description,
    // Приватные ссылки на конкретный результат не должны попадать в поиск.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: [`/api/og/result/${id}`],
    },
  };
}

export default async function PublicResultPage({ params }: Props) {
  const { id } = await params;
  const session = await loadSession(id);

  if (!session) {
    notFound();
  }

  const winnerLabel = getWinnerLabel(session);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-2xl font-bold tracking-tight">RESHALA</p>
      <SessionResultSummary title={session.title} status={session.status} winnerLabel={winnerLabel} />
      <a
        href={buildMiniAppLink(session.id)}
        className="bg-accent min-h-12 rounded-xl px-6 py-3 text-base font-semibold text-white"
      >
        Открыть в Telegram
      </a>
    </main>
  );
}
