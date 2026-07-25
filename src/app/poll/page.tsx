"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient, ApiRequestError } from "@/lib/api-client";

export default function PollPage() {
  const { status } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addOption() {
    const label = optionInput.trim();
    if (!label || options.includes(label)) {
      setOptionInput("");
      return;
    }
    if (options.length >= 20) {
      return;
    }
    setOptions((prev) => [...prev, label]);
    setOptionInput("");
  }

  function removeOption(label: string) {
    setOptions((prev) => prev.filter((existing) => existing !== label));
  }

  async function handleCreate() {
    if (!title.trim() || options.length < 2 || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { session: created } = await apiClient.sessions.create({
        type: "POLL",
        title: title.trim(),
      });
      await apiClient.sessions.addOptions(created.id, options);
      await apiClient.sessions.start(created.id);
      router.push(`/s/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Не удалось создать голосование.");
      setSubmitting(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы создать голосование." />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Голосование</h1>

      <section className="flex flex-col gap-2">
        <label htmlFor="poll-title" className="text-sm font-medium">
          Вопрос
        </label>
        <input
          id="poll-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Что смотрим сегодня?"
          maxLength={200}
          className="border-border bg-surface min-h-12 rounded-xl border px-4 text-base"
        />
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="poll-option" className="text-sm font-medium">
          Варианты ({options.length}/20)
        </label>
        <div className="flex gap-2">
          <input
            id="poll-option"
            value={optionInput}
            onChange={(event) => setOptionInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOption();
              }
            }}
            placeholder="Комедию, Ужасы, Ничего..."
            maxLength={80}
            className="border-border bg-surface min-h-12 flex-1 rounded-xl border px-4 text-base"
          />
          <button
            type="button"
            onClick={addOption}
            className="border-border min-h-12 rounded-xl border px-4 text-sm font-medium"
          >
            Добавить
          </button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {options.map((label) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => removeOption(label)}
                className="bg-surface border-border flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
              >
                {label}
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        {options.length < 2 && <p className="text-muted text-xs">Нужно минимум 2 варианта.</p>}
      </section>

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={submitting || !title.trim() || options.length < 2}
        className="bg-accent min-h-14 rounded-2xl text-lg font-semibold text-white disabled:opacity-40"
      >
        {submitting ? "Создаём..." : "Начать голосование"}
      </button>
    </main>
  );
}
