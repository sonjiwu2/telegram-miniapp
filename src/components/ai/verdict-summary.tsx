import { EmptyState } from "@/components/ui/empty-state";
import type { VerdictPayload } from "@/lib/ai/get-verdict";

// Без хуков — рендерится и на сервере (/r/[id]), и на клиенте (/s/[id]).
export function VerdictSummary({ title, verdict }: { title: string; verdict: VerdictPayload | null }) {
  if (!verdict) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">Суд ещё думает</p>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    );
  }

  if (verdict.refused) {
    return (
      <EmptyState
        title="Решала отказывается принимать это решение"
        description="Тут лучше реально поговорить."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-muted text-sm tracking-wide uppercase">Суд изучил материалы</p>
      <h1 className="text-3xl font-bold">{verdict.headline}</h1>
      <p className="max-w-sm text-base">{verdict.verdict}</p>
      <p className="text-muted max-w-sm text-sm italic">«{verdict.reasoning}»</p>
      <p className="text-accent max-w-sm text-sm font-medium">Приговор: {verdict.sentence}</p>
    </div>
  );
}
