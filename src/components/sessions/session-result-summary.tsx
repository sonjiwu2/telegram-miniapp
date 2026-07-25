const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Ещё не запущено",
  OPEN: "Крутится прямо сейчас",
  CLOSED: "Закрыто",
  RESOLVED: "Решено",
  CANCELLED: "Отменено",
};

// Без хуков и "use client" — рендерится и на сервере (публичная result-страница),
// и на клиенте (внутриприложенный просмотр по deep link).
export function SessionResultSummary({
  title,
  status,
  winnerLabel,
}: {
  title: string;
  status: string;
  winnerLabel: string | null;
}) {
  if (!winnerLabel) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-muted text-sm tracking-wide uppercase">
          {STATUS_LABELS[status] ?? "В процессе"}
        </p>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-muted text-sm tracking-wide uppercase">Решено</p>
      <h1 className="text-4xl font-bold">{winnerLabel}</h1>
      <p className="text-muted max-w-xs">{title}</p>
    </div>
  );
}
