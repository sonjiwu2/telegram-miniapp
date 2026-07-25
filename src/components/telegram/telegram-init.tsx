"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTelegramWebApp } from "@/lib/telegram/webapp";
import { parseStartParam } from "@/lib/telegram/deep-link";

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

    // Открытие по startapp deep link (t.me/bot?startapp=s-<id>|c-<id>) —
    // Telegram кладёт значение в initDataUnsafe.start_param. Ведём сразу на
    // нужный внутриигровой экран вместо обычного домашнего.
    const startParam = webApp.initDataUnsafe.start_param;
    if (startParam && window.location.pathname === "/") {
      const target = parseStartParam(startParam);
      if (target?.type === "session") {
        router.replace(`/s/${encodeURIComponent(target.id)}`);
      } else if (target?.type === "company") {
        router.replace(`/company/${encodeURIComponent(target.id)}`);
      }
    }

    return () => webApp.offEvent("themeChanged", handleThemeChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- запускаем только один раз при монтировании
  }, []);

  return null;
}
