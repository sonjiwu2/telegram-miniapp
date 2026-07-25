import Link from "next/link";
import { MODES } from "@/config/modes";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-2 pt-4">
        <h1 className="text-4xl font-bold tracking-tight">RESHALA</h1>
        <p className="text-muted max-w-xs text-balance">Хватит пиздеть. Решала уже решил.</p>
      </div>

      <Link
        href="/who-today"
        className="bg-accent min-h-14 w-full max-w-xs rounded-2xl px-6 py-4 text-lg font-semibold text-white shadow-lg transition-transform active:scale-95"
      >
        ЗАПУСТИТЬ
      </Link>

      <ul className="grid w-full max-w-md grid-cols-2 gap-3">
        {MODES.map(({ slug, title, description, icon: Icon }) => (
          <li key={slug}>
            <Link
              href={`/${slug}`}
              className="border-border bg-surface flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center"
            >
              <Icon size={24} aria-hidden="true" />
              <span className="text-sm font-medium">{title}</span>
              <span className="text-muted text-xs">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
