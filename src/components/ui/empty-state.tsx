export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted max-w-xs text-sm">{description}</p>
    </div>
  );
}
