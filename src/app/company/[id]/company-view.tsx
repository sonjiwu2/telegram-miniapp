"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dices, Gavel, Sparkles, Vote } from "lucide-react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteButton } from "@/components/companies/invite-button";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import type { PublicCompany } from "@/lib/types/company";

type State =
  | { status: "loading" }
  | { status: "loaded"; company: PublicCompany }
  | { status: "not-found" }
  | { status: "error"; message: string };

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Владелец",
  ADMIN: "Админ",
  MEMBER: "Участник",
};

export function CompanyView({ id }: { id: string }) {
  const { status: authStatus, user } = useAuth();
  const [state, setState] = useState<State>({ status: "loading" });
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiClient.companies
      .get(id)
      .then(({ company }) => {
        if (!cancelled) {
          setState({ status: "loaded", company });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiRequestError && error.status === 404) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error", message: "Не удалось загрузить компанию." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleJoin() {
    if (joining) {
      return;
    }
    setJoining(true);
    try {
      const { company } = await apiClient.companies.join(id);
      setState({ status: "loaded", company });
    } catch {
      setState({ status: "error", message: "Не удалось вступить в компанию." });
    } finally {
      setJoining(false);
    }
  }

  if (authStatus !== "authenticated") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы вступить в компанию." />
      </main>
    );
  }

  if (state.status === "loading") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6" aria-busy="true">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-56" />
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Не нашли" description="Такой компании не существует или она удалена." />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Что-то сломалось" description={state.message} />
      </main>
    );
  }

  const { company } = state;
  const isMember = user ? company.members.some((member) => member.userId === user.id) : false;

  if (!isMember) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-4xl">{company.emoji || "👥"}</span>
        <p className="text-muted text-sm tracking-wide uppercase">Вас приглашают в компанию</p>
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <p className="text-muted text-sm">{company.members.length} участников</p>
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="bg-accent min-h-12 w-full max-w-xs rounded-xl font-semibold text-white disabled:opacity-40"
        >
          {joining ? "Вступаем..." : "Вступить"}
        </button>
      </main>
    );
  }

  const actions = [
    { href: `/who-today?companyId=${company.id}`, label: "Кто сегодня?", icon: Dices },
    { href: "/random-pick", label: "Нам похуй", icon: Sparkles },
    { href: "/debate", label: "Спор", icon: Gavel },
    { href: "/poll", label: "Голосование", icon: Vote },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{company.emoji || "👥"}</span>
        <h1 className="text-2xl font-bold">{company.name}</h1>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {actions.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="border-border bg-surface flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center"
            >
              <Icon size={22} aria-hidden="true" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <InviteButton companyId={company.id} companyName={company.name} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Участники ({company.members.length})</h2>
        <ul className="flex flex-col gap-2">
          {company.members.map((member) => (
            <li
              key={member.userId}
              className="border-border bg-surface flex items-center justify-between rounded-xl border px-4 py-3"
            >
              <span>{member.nickname || member.displayName}</span>
              <span className="text-muted text-xs">{ROLE_LABELS[member.role] ?? member.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
