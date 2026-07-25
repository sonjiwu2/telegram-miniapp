import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { TelegramInit } from "@/components/telegram/telegram-init";
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
    <html lang="ru">
      <body className="antialiased">
        <TelegramInit />
        {children}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
