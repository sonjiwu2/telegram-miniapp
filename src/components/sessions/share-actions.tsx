"use client";

import { useState } from "react";
import { getTelegramWebApp } from "@/lib/telegram/webapp";
import { buildMiniAppLink, buildSessionStartParam, buildTelegramShareLink } from "@/lib/telegram/deep-link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export function ShareActions({ sessionId, shareText }: { sessionId: string; shareText: string }) {
  const [copied, setCopied] = useState(false);
  const resultPageUrl = `${APP_URL}/r/${sessionId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resultPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер обмена недоступен (нет разрешения/протокола) — молча игнорируем
    }
  }

  async function handleShare() {
    const webApp = getTelegramWebApp();
    if (webApp) {
      const miniAppLink = buildMiniAppLink(buildSessionStartParam(sessionId));
      webApp.openTelegramLink(buildTelegramShareLink(miniAppLink, shareText));
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "RESHALA", text: shareText, url: resultPageUrl });
        return;
      } catch {
        // пользователь отменил системный диалог — это нормально, ничего не делаем
        return;
      }
    }

    await handleCopy();
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={handleShare}
        className="bg-accent min-h-12 rounded-xl font-semibold text-white active:scale-95"
      >
        Отправить в Telegram
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="border-border min-h-12 rounded-xl border text-sm font-medium"
      >
        {copied ? "Скопировано!" : "Скопировать ссылку"}
      </button>
    </div>
  );
}
