"use client";
import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from "react";
import api from "@/lib/api";
import type { AuthUser } from "@ttm/types";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  }, []);

  // On mount: try to refresh token
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.post("/auth/refresh");
        const token = res.data.data.accessToken;
        setAccessToken(token);
        await fetchMe(token);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { user: u, accessToken: token } = res.data.data;
    setUser(u);
    setAccessToken(token);
  };

  const signup = async (name: string, email: string, password: string, role = "MEMBER") => {
    const res = await api.post("/auth/signup", { name, email, password, role });
    const { user: u, accessToken: token } = res.data.data;
    setUser(u);
    setAccessToken(token);
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, logout, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
