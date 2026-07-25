"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import type { PublicCompany } from "@/lib/types/company";

export default function CompanyListPage() {
  const { status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;
    apiClient.companies
      .list()
      .then(({ companies: loaded }) => {
        if (!cancelled) {
          setCompanies(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить компании.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName || creating) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { company } = await apiClient.companies.create({
        name: trimmedName,
        emoji: emoji.trim() || undefined,
      });
      setCompanies((prev) => [...prev, company]);
      setName("");
      setEmoji("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Не удалось создать компанию.");
    } finally {
      setCreating(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы завести компанию." />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Компании</h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState title="Компании" description="Создай компанию и начни портить отношения организованно." />
      ) : (
        <ul className="flex flex-col gap-2">
          {companies.map((company) => (
            <li key={company.id}>
              <Link
                href={`/company/${company.id}`}
                className="border-border bg-surface flex min-h-16 items-center gap-3 rounded-xl border px-4"
              >
                <span className="text-2xl">{company.emoji || "👥"}</span>
                <span className="flex flex-col">
                  <span className="font-semibold">{company.name}</span>
                  <span className="text-muted text-xs">{company.members.length} участников</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-2">
        <label htmlFor="company-name" className="text-sm font-medium">
          Новая компания
        </label>
        <div className="flex gap-2">
          <input
            id="company-emoji"
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            placeholder="🏠"
            maxLength={8}
            className="border-border bg-surface min-h-12 w-16 rounded-xl border px-3 text-center text-lg"
          />
          <input
            id="company-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Гараж"
            maxLength={60}
            className="border-border bg-surface min-h-12 flex-1 rounded-xl border px-4 text-base"
          />
        </div>
        {error && (
          <p className="text-accent text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="bg-accent min-h-12 rounded-xl font-semibold text-white disabled:opacity-40"
        >
          {creating ? "Создаём..." : "Создать компанию"}
        </button>
      </section>
    </main>
  );
}
