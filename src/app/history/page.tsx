import { EmptyState } from "@/components/ui/empty-state";

export default function HistoryPage() {
  return (
    <main className="flex flex-1 flex-col">
      <EmptyState title="История" description="Тут пока подозрительно тихо." />
    </main>
  );
}
