"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/session-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/api-client";
import type { UserStats } from "@/lib/types/stats";
import type { Achievement } from "@/lib/achievements/evaluate";

export default function ProfilePage() {
  const { status, user, error, retry } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const { stats: loaded } = await apiClient.stats.get();
        if (!cancelled) {
          setStats(loaded);
        }
      } catch {
        // Статистика необязательна для отображения профиля — молча игнорируем.
      }

      try {
        const { achievements: loaded } = await apiClient.achievements.get();
        if (!cancelled) {
          setAchievements(loaded);
        }
      } catch {
        // Титулы необязательны для отображения профиля — молча игнорируем.
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <main className="flex flex-1 flex-col p-6">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 pt-8" aria-busy="true" aria-live="polite">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      )}

      {status === "authenticated" && user && (
        <div className="flex flex-col items-center gap-2 pt-8">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- внешний Telegram CDN, оптимизация next/image здесь не нужна
            <img
              src={user.photoUrl}
              alt=""
              width={80}
              height={80}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="bg-accent flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-white">
              {user.firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-lg font-semibold">
            {user.firstName} {user.lastName ?? ""}
          </p>
          {user.username && <p className="text-muted text-sm">@{user.username}</p>}

          {stats && (
            <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-2 text-center">
              <div className="border-border bg-surface rounded-xl border p-3">
                <p className="text-xl font-bold">{stats.sessionsParticipated}</p>
                <p className="text-muted text-xs">Решений</p>
              </div>
              <div className="border-border bg-surface rounded-xl border p-3">
                <p className="text-xl font-bold">{stats.sessionsCreated}</p>
                <p className="text-muted text-xs">Создано</p>
              </div>
              <div className="border-border bg-surface rounded-xl border p-3">
                <p className="text-xl font-bold">{stats.rouletteWins}</p>
                <p className="text-muted text-xs">Побед в рулетке</p>
              </div>
            </div>
          )}

          {achievements && (
            <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
              <p className="text-muted text-xs tracking-wide uppercase">Достижения</p>
              <ul className="flex flex-col gap-2">
                {achievements.map((achievement) => (
                  <li
                    key={achievement.code}
                    className={`rounded-xl border p-3 text-left ${
                      achievement.unlocked ? "border-accent" : "border-border opacity-40"
                    }`}
                  >
                    <p className="text-sm font-semibold">{achievement.title}</p>
                    <p className="text-muted text-xs">{achievement.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status === "unauthenticated" && (
        <EmptyState
          title="Вы не в сети"
          description="Открой RESHALA через Telegram-бота, чтобы Решала тебя узнал."
        />
      )}

      {status === "error" && (
        <EmptyState
          title="Что-то сломалось"
          description={error ?? "Не удалось загрузить профиль."}
          actionLabel="Повторить"
          onAction={retry}
        />
      )}
    </main>
  );
}
