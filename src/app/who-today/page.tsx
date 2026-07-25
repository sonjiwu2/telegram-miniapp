import { ComingSoon } from "@/components/ui/coming-soon";

export default function WhoTodayPage() {
  return (
    <main className="flex flex-1 flex-col">
      <ComingSoon title="Кто сегодня?" description="Рулетка на участников компании." stage={5} />
    </main>
  );
}
