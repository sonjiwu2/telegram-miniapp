import type { PublicUser } from "@/lib/types/user";
import type { PublicSession } from "@/lib/types/session";
import type { PublicCompany } from "@/lib/types/company";
import type { UserStats } from "@/lib/types/stats";
import type { Achievement } from "@/lib/achievements/evaluate";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs, ...requestInit } = init ?? {};
  const controller = timeoutMs ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  let response: Response;
  try {
    response = await fetch(path, {
      ...requestInit,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...requestInit.headers },
      signal: controller?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError(408, "REQUEST_TIMEOUT", "Request timed out");
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const code = json?.error?.code ?? "UNKNOWN_ERROR";
    const message = json?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiRequestError(response.status, code, message);
  }

  return json as T;
}

export const apiClient = {
  // Таймаут обязателен именно здесь: это самый первый запрос при открытии
  // приложения, до него нет ни одного экрана-фолбэка. Без него зависшая сеть
  // (например, нестабильный dev-туннель) оставляла бы пользователя перед
  // вечным спиннером без единого шанса на восстановление.
  authWithTelegram: (initData: string) =>
    request<{ user: PublicUser }>("/api/v1/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData }),
      timeoutMs: 15_000,
    }),
  authWithDevBypass: () =>
    request<{ user: PublicUser }>("/api/v1/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ dev: true }),
      timeoutMs: 15_000,
    }),
  me: () => request<{ user: PublicUser }>("/api/v1/me"),
  sessions: {
    create: (input: {
      type: string;
      title: string;
      companyId?: string;
      settings?: Record<string, unknown>;
    }) =>
      request<{ session: PublicSession }>("/api/v1/sessions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    get: (id: string) => request<{ session: PublicSession }>(`/api/v1/sessions/${id}`),
    addParticipants: (id: string, displayNames: string[]) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({ displayNames }),
      }),
    addOptions: (id: string, labels: string[], argumentsList?: string[]) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/options`, {
        method: "POST",
        body: JSON.stringify({ labels, arguments: argumentsList }),
      }),
    start: (id: string) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/start`, { method: "POST" }),
    finalize: (id: string, options?: { timeoutMs?: number }) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/finalize`, {
        method: "POST",
        timeoutMs: options?.timeoutMs,
      }),
    vote: (id: string, optionId: string) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId }),
      }),
    react: (id: string, emoji: string) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji }),
      }),
  },
  companies: {
    list: () => request<{ companies: PublicCompany[] }>("/api/v1/companies"),
    create: (input: { name: string; emoji?: string }) =>
      request<{ company: PublicCompany }>("/api/v1/companies", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    get: (id: string) => request<{ company: PublicCompany }>(`/api/v1/companies/${id}`),
    join: (id: string) =>
      request<{ company: PublicCompany }>(`/api/v1/companies/${id}/join`, { method: "POST" }),
    removeMember: (id: string, userId: string) =>
      request<{ company: PublicCompany }>(`/api/v1/companies/${id}/members/${userId}`, {
        method: "DELETE",
      }),
  },
  history: {
    list: (filter: { type?: string; mine?: boolean } = {}) => {
      const params = new URLSearchParams();
      if (filter.type) params.set("type", filter.type);
      if (filter.mine) params.set("mine", "true");
      const query = params.toString();
      return request<{ sessions: PublicSession[] }>(`/api/v1/history${query ? `?${query}` : ""}`);
    },
  },
  stats: {
    get: () => request<{ stats: UserStats }>("/api/v1/stats"),
  },
  achievements: {
    get: () => request<{ achievements: Achievement[] }>("/api/v1/achievements"),
  },
};
