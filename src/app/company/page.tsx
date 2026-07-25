import { EmptyState } from "@/components/ui/empty-state";

export default function CompanyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <EmptyState
        title="Компании"
        description="Создай компанию и начни портить отношения организованно."
      />
    </main>
  );
}
