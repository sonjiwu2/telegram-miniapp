import { ComingSoon } from "@/components/ui/coming-soon";

export default function DebatePage() {
  return (
    <main className="flex flex-1 flex-col">
      <ComingSoon title="Спор" description="Голосование людей или приговор AI-судьи." stage={12} />
    </main>
  );
}
