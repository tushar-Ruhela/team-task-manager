"use client";
import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from "react";
import axios from "axios";
import api from "@/lib/api";
import type { AuthUser } from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  // On mount: try to restore session via refresh token cookie.
  // ✅ FIX: Use plain axios (not the intercepted `api` instance) so a 401
  // here does NOT trigger the response interceptor's retry logic.
  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const token = res.data.data.accessToken;
        sessionStorage.setItem("access_token", token);
        setAccessToken(token);
        await fetchMe(token);
      } catch {
        // No valid refresh token — user is not logged in, that's fine
        sessionStorage.removeItem("access_token");
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
    sessionStorage.setItem("access_token", token);
    setUser(u);
    setAccessToken(token);
  };

  const signup = async (name: string, email: string, password: string, role = "MEMBER") => {
    const res = await api.post("/auth/signup", { name, email, password, role });
    const { user: u, accessToken: token } = res.data.data;
    sessionStorage.setItem("access_token", token);
    setUser(u);
    setAccessToken(token);
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    sessionStorage.removeItem("access_token");
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
