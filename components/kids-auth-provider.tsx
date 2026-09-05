"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  authenticateMockKidsAccount,
  KIDS_AUTH_STORAGE_KEY,
  MOCK_ORANGE_CHILD,
  MOCK_ORANGE_USER,
  parseKidsSession,
  serializeKidsSession,
  type KidsChildProfile,
  type KidsSession,
  type KidsUser,
} from "../lib/kids/session";

export interface KidsLoginResult {
  ok: boolean;
  message?: string;
}

export interface KidsAuthContextValue {
  status: "loading" | "unauthenticated" | "authenticated";
  user: KidsUser | null;
  child: KidsChildProfile | null;
  session: KidsSession | null;
  login: (account: string, password: string) => Promise<KidsLoginResult>;
  logout: () => void;
}

interface KidsAuthProviderProps {
  children: ReactNode;
  initialSession?: KidsSession;
}

const KidsAuthContext = createContext<KidsAuthContextValue | null>(null);

export function KidsAuthProvider({
  children,
  initialSession,
}: KidsAuthProviderProps) {
  const [session, setSession] = useState<KidsSession | null>(initialSession ?? null);
  const [status, setStatus] = useState<KidsAuthContextValue["status"]>(initialSession ? "authenticated" : "loading");

  useEffect(() => {
    if (initialSession) return;
    const loadSession = () => {
      try {
        const storedSession = parseKidsSession(window.localStorage.getItem(KIDS_AUTH_STORAGE_KEY));
        setSession(storedSession);
        setStatus(storedSession ? "authenticated" : "unauthenticated");
      } catch {
        setSession(null);
        setStatus("unauthenticated");
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === KIDS_AUTH_STORAGE_KEY || event.key === null) loadSession();
    };
    loadSession();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [initialSession]);

  const login = useCallback(async (account: string, password: string): Promise<KidsLoginResult> => {
    const nextSession = authenticateMockKidsAccount(account, password);
    if (!nextSession) return { ok: false, message: "账号或密码不正确" };
    try {
      window.localStorage.setItem(KIDS_AUTH_STORAGE_KEY, serializeKidsSession(nextSession));
      setSession(nextSession);
      setStatus("authenticated");
      return { ok: true };
    } catch {
      return { ok: false, message: "当前浏览器无法保存登录状态" };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(KIDS_AUTH_STORAGE_KEY);
    } catch {
      // 即使存储暂时不可用，也先结束当前页面中的会话。
    }
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<KidsAuthContextValue>(() => ({
    status,
    user: session ? MOCK_ORANGE_USER : null,
    child: session ? MOCK_ORANGE_CHILD : null,
    session,
    login,
    logout,
  }), [login, logout, session, status]);

  return <KidsAuthContext.Provider value={value}>{children}</KidsAuthContext.Provider>;
}

export function useKidsAuth(): KidsAuthContextValue {
  const context = useContext(KidsAuthContext);
  if (!context) throw new Error("useKidsAuth 必须在 KidsAuthProvider 内使用");
  return context;
}
