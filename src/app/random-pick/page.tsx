import { ComingSoon } from "@/components/ui/coming-soon";

export default function RandomPickPage() {
  return (
    <main className="flex flex-1 flex-col">
      <ComingSoon title="Нам похуй" description="Случайный выбор из вариантов." stage={6} />
    </main>
  );
}
