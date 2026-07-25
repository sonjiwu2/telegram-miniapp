import Link from "next/link";

export function ComingSoon({
  title,
  description,
  stage,
}: {
  title: string;
  description: string;
  stage: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted max-w-xs text-sm">{description}</p>
      <span className="text-muted text-xs tracking-wide uppercase">Этап {stage} — скоро</span>
      <Link href="/" className="text-accent mt-4 text-sm underline underline-offset-4">
        На главную
      </Link>
    </div>
  );
}
