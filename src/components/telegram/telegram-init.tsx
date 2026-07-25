"use client";

import { useEffect } from "react";
import { getTelegramWebApp } from "@/lib/telegram/webapp";

function applyColorScheme(scheme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", scheme === "dark");
}

export function TelegramInit() {
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

    return () => webApp.offEvent("themeChanged", handleThemeChanged);
  }, []);

  return null;
}
