import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { TelegramInit } from "@/components/telegram/telegram-init";
import { SessionProvider } from "@/components/providers/session-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "RESHALA",
  description: "Хватит пиздеть. Решала уже решил.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Telegram WebApp script (beforeInteractive) сам проставляет CSS-переменные
    // вьюпорта на <html> ещё до гидратации React — это ожидаемо, не наша разметка.
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">
        <TelegramInit />
        <SessionProvider>
          <div className="flex min-h-dvh flex-col pb-16">{children}</div>
          <BottomNav />
        </SessionProvider>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
