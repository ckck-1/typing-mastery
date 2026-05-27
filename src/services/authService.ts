import { api, ApiError } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  role?: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
};

type LoginResponse = AuthUser | { user: AuthUser };
type RegisterResponse = { userId: number } | { user: AuthUser };

function pickUser(payload: any): AuthUser {
  if (!payload) throw new Error("Empty response");
  if (payload.user) return payload.user as AuthUser;
  if (payload.id && (payload.email || payload.username)) return payload as AuthUser;
  if (payload.data?.user) return payload.data.user as AuthUser;
  throw new Error("Unexpected auth response");
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return pickUser(res);
  },

  async register(email: string, password: string, username: string): Promise<{ userId: number }> {
    const res = await api<RegisterResponse>("/auth/register", {
      method: "POST",
      body: { email, password, username },
    });
    if ((res as any).userId) return { userId: (res as any).userId };
    if ((res as any).user?.id) return { userId: (res as any).user.id };
    throw new Error("Unexpected register response");
  },

  async verifyOtp(userId: number, otp: string): Promise<AuthUser | null> {
    const res = await api<any>("/auth/verify-otp", {
      method: "POST",
      body: { userId, otp },
    });
    try { return pickUser(res); } catch { return null; }
  },

  async logout(): Promise<void> {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
  },

  async refresh(): Promise<boolean> {
    try {
      await api("/auth/refresh", { method: "POST", noRefresh: true });
      return true;
    } catch {
      return false;
    }
  },

  async me(): Promise<AuthUser | null> {
    try {
      const res = await api<any>("/profile/me");
      return pickUser(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api("/auth/reset-password-request", { method: "POST", body: { email } });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api("/auth/reset-password", { method: "POST", body: { token, password } });
  },
};
