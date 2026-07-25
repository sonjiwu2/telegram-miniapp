"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { getTelegramWebApp } from "@/lib/telegram/webapp";
import type { PublicUser } from "@/lib/types/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthState {
  status: AuthStatus;
  user: PublicUser | null;
  error: string | null;
  retry: () => void;
}

const initialState: AuthState = { status: "loading", user: null, error: null, retry: () => {} };

const AuthContext = createContext<AuthState>(initialState);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "retry">>({ status: "loading", user: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      setState({ status: "loading", user: null, error: null });

      const initData = getTelegramWebApp()?.initData;

      try {
        // Внутри Telegram есть initData — используем его. Вне Telegram (обычный
        // браузер, локальная разработка) пробуем dev-обход: сервер сам откажет
        // (403), если ALLOW_DEV_AUTH выключен, и мы просто останемся гостем.
        const { user } = initData
          ? await apiClient.authWithTelegram(initData)
          : await apiClient.authWithDevBypass();

        if (!cancelled) {
          setState({ status: "authenticated", user, error: null });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
          setState({ status: "unauthenticated", user: null, error: null });
          return;
        }

        setState({
          status: "error",
          user: null,
          error: error instanceof Error ? error.message : "Неизвестная ошибка",
        });
      }
    }

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => setAttempt((prev) => prev + 1);

  return <AuthContext.Provider value={{ ...state, retry }}>{children}</AuthContext.Provider>;
}
