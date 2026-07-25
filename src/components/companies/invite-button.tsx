"use client";

import { useState } from "react";
import { getTelegramWebApp } from "@/lib/telegram/webapp";
import { buildCompanyStartParam, buildMiniAppLink, buildTelegramShareLink } from "@/lib/telegram/deep-link";

export function InviteButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = buildMiniAppLink(buildCompanyStartParam(companyId));
  const text = `Вступай в компанию «${companyName}» в RESHALA`;

  async function handleInvite() {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.openTelegramLink(buildTelegramShareLink(inviteLink, text));
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "RESHALA", text, url: inviteLink });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер обмена недоступен — молча игнорируем
    }
  }

  return (
    <button
      type="button"
      onClick={handleInvite}
      className="border-border min-h-12 rounded-xl border text-sm font-medium"
    >
      {copied ? "Ссылка скопирована!" : "Пригласить в компанию"}
    </button>
  );
}
