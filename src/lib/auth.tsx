import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  avatarUrl?: string | null;
  accountSubscription?: {
    plan: string;
    status: string;
    expiresAt?: string | null;
    startedAt?: string | null;
  } | null;
};

type AuthContextType = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, siteName: string, domain: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const res = await api.get("/auth/me");
      setAdmin(res.data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await api.post("/auth/login", { email, password });
    await fetchMe();
  }

  async function signup(name: string, email: string, password: string, siteName: string, domain: string) {
    await api.post("/auth/signup", { name, email, password, siteName, domain });
    await fetchMe();
  }

  async function requestPasswordReset(email: string) {
    await api.post("/auth/password-reset/request", { email });
  }

  async function resetPassword(token: string, password: string) {
    await api.post("/auth/password-reset/confirm", { token, password });
  }

  async function logout() {
    await api.post("/auth/logout");
    setAdmin(null);
  }

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ admin, loading, login, signup, requestPasswordReset, resetPassword, refresh: fetchMe, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
