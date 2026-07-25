export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted max-w-xs text-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="border-border mt-2 min-h-10 rounded-xl border px-4 text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
