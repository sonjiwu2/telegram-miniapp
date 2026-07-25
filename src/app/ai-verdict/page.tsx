import { ComingSoon } from "@/components/ui/coming-soon";

export default function AiVerdictPage() {
  return (
    <main className="flex flex-1 flex-col">
      <ComingSoon title="AI Вердикт" description="Опиши ситуацию — Решала вынесет приговор." stage={11} />
    </main>
  );
}
