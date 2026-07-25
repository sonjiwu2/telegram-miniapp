"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTelegramWebApp } from "@/lib/telegram/webapp";

function applyColorScheme(scheme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", scheme === "dark");
}

export function TelegramInit() {
  const router = useRouter();

  useEffect(() => {
    const webApp = getTelegramWebApp();

    if (!webApp) {
      // Обычный браузер вне Telegram — оставляем системную тему (см. globals.css).
      return;
    }

    webApp.ready();
    webApp.expand();
    applyColorScheme(webApp.colorScheme);

    const handleThemeChanged = () => applyColorScheme(webApp.colorScheme);
    webApp.onEvent("themeChanged", handleThemeChanged);

    // Открытие по startapp deep link (t.me/bot?startapp=<publicId>) — Telegram
    // кладёт значение в initDataUnsafe.start_param. Ведём на внутриигровой
    // просмотр этой сессии вместо обычного домашнего экрана.
    const startParam = webApp.initDataUnsafe.start_param;
    if (startParam && window.location.pathname === "/") {
      router.replace(`/s/${encodeURIComponent(startParam)}`);
    }

    return () => webApp.offEvent("themeChanged", handleThemeChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- запускаем только один раз при монтировании
  }, []);

  return null;
}
