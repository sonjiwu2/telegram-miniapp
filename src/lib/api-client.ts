import type { PublicUser } from "@/lib/types/user";

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
};
