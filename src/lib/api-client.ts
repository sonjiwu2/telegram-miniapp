import type { PublicUser } from "@/lib/types/user";
import type { PublicSession } from "@/lib/types/session";
import type { PublicCompany } from "@/lib/types/company";
import type { UserStats } from "@/lib/types/stats";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const code = json?.error?.code ?? "UNKNOWN_ERROR";
    const message = json?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiRequestError(response.status, code, message);
  }

  return json as T;
}

export const apiClient = {
  authWithTelegram: (initData: string) =>
    request<{ user: PublicUser }>("/api/v1/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData }),
    }),
  authWithDevBypass: () =>
    request<{ user: PublicUser }>("/api/v1/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ dev: true }),
    }),
  me: () => request<{ user: PublicUser }>("/api/v1/me"),
  sessions: {
    create: (input: { type: string; title: string; companyId?: string }) =>
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
    addOptions: (id: string, labels: string[]) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/options`, {
        method: "POST",
        body: JSON.stringify({ labels }),
      }),
    start: (id: string) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/start`, { method: "POST" }),
    finalize: (id: string) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/finalize`, { method: "POST" }),
    vote: (id: string, optionId: string) =>
      request<{ session: PublicSession }>(`/api/v1/sessions/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId }),
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
};
