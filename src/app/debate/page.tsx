"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { AI_TONES, DEFAULT_AI_TONE, type AiTone } from "@/lib/ai/tones";
import { DEBATE_DURATION_OPTIONS, type DebateJudgeMode } from "@/lib/sessions/debate-settings";

interface Side {
  name: string;
  argument: string;
}

const EMPTY_SIDE: Side = { name: "", argument: "" };

export default function DebatePage() {
  const { status } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sides, setSides] = useState<Side[]>([{ ...EMPTY_SIDE }, { ...EMPTY_SIDE }]);
  const [judge, setJudge] = useState<DebateJudgeMode>("vote");
  const [tone, setTone] = useState<AiTone>(DEFAULT_AI_TONE);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSide(index: number, field: keyof Side, value: string) {
    setSides((prev) => prev.map((side, i) => (i === index ? { ...side, [field]: value } : side)));
  }

  function addSide() {
    if (sides.length >= 6) {
      return;
    }
    setSides((prev) => [...prev, { ...EMPTY_SIDE }]);
  }

  function removeSide(index: number) {
    if (sides.length <= 2) {
      return;
    }
    setSides((prev) => prev.filter((_, i) => i !== index));
  }

  const validSides = sides.filter((side) => side.name.trim() && side.argument.trim());
  const canSubmit = title.trim().length > 0 && validSides.length >= 2 && !submitting;

  async function handleCreate() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { session: created } = await apiClient.sessions.create({
        type: "DEBATE",
        title: title.trim(),
        settings: {
          judge,
          ...(judge === "ai" ? { tone } : { durationMinutes }),
        },
      });
      await apiClient.sessions.addOptions(
        created.id,
        validSides.map((side) => side.name.trim()),
        validSides.map((side) => side.argument.trim()),
      );
      await apiClient.sessions.start(created.id);
      router.push(`/s/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Не удалось создать спор.");
      setSubmitting(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState title="Нужен вход" description="Открой RESHALA через Telegram-бота, чтобы начать спор." />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Спор</h1>

      <section className="flex flex-col gap-2">
        <label htmlFor="debate-title" className="text-sm font-medium">
          О чём спор
        </label>
        <input
          id="debate-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Кто должен мыть посуду?"
          maxLength={200}
          className="border-border bg-surface min-h-12 rounded-xl border px-4 text-base"
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Стороны ({sides.length}/6)</span>
          <button
            type="button"
            onClick={addSide}
            disabled={sides.length >= 6}
            className="border-border min-h-9 rounded-full border px-3 text-xs font-medium disabled:opacity-40"
          >
            Добавить сторону
          </button>
        </div>
        {sides.map((side, index) => (
          <div key={index} className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-3">
            <div className="flex items-center gap-2">
              <input
                value={side.name}
                onChange={(event) => updateSide(index, "name", event.target.value)}
                placeholder={`Сторона ${index + 1}, например "Макс"`}
                maxLength={80}
                className="border-border min-h-10 flex-1 rounded-lg border px-3 text-sm"
              />
              {sides.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSide(index)}
                  aria-label="Убрать сторону"
                  className="text-muted flex h-9 w-9 items-center justify-center"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <textarea
              value={side.argument}
              onChange={(event) => updateSide(index, "argument", event.target.value)}
              placeholder="Аргумент этой стороны"
              maxLength={280}
              rows={2}
              className="border-border min-h-10 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        ))}
        {validSides.length < 2 && <p className="text-muted text-xs">Нужно минимум 2 стороны с именем и аргументом.</p>}
      </section>

      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium">Кто решит?</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setJudge("vote")}
            className={`min-h-11 flex-1 rounded-xl border text-sm font-medium ${
              judge === "vote" ? "border-accent text-accent" : "border-border"
            }`}
          >
            Голосование людей
          </button>
          <button
            type="button"
            onClick={() => setJudge("ai")}
            className={`min-h-11 flex-1 rounded-xl border text-sm font-medium ${
              judge === "ai" ? "border-accent text-accent" : "border-border"
            }`}
          >
            AI Судья
          </button>
        </div>
      </section>

      {judge === "vote" && (
        <section className="flex flex-col gap-2">
          <span className="text-sm font-medium">Таймер голосования</span>
          <div className="flex flex-wrap gap-2">
            {DEBATE_DURATION_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setDurationMinutes(option.minutes)}
                className={`min-h-9 rounded-full border px-3 py-1.5 text-xs ${
                  durationMinutes === option.minutes ? "border-accent text-accent" : "border-border text-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {judge === "ai" && (
        <section className="flex flex-col gap-2">
          <span className="text-sm font-medium">Тон AI-судьи</span>
          <div className="flex flex-wrap gap-2">
            {AI_TONES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTone(option)}
                className={`min-h-9 rounded-full border px-3 py-1.5 text-xs ${
                  tone === option ? "border-accent text-accent" : "border-border text-muted"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!canSubmit}
        className="bg-accent min-h-14 rounded-2xl text-lg font-semibold text-white disabled:opacity-40"
      >
        {submitting ? "Создаём..." : "Начать спор"}
      </button>
    </main>
  );
}
