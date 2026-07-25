"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";

// Публичная result-страница (/r/[id]) — самостоятельный лендинг для браузера
// вне Telegram (см. раздел 53 ТЗ), ей не нужен bottom nav основного приложения.
const STANDALONE_PREFIXES = ["/r/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = STANDALONE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-dvh flex-col pb-16">{children}</div>
      <BottomNav />
    </>
  );
}
