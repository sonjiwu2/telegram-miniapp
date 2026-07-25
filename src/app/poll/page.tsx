import { ComingSoon } from "@/components/ui/coming-soon";

export default function PollPage() {
  return (
    <main className="flex flex-1 flex-col">
      <ComingSoon title="Голосование" description="Обычный опрос с вариантами." stage={9} />
    </main>
  );
}
