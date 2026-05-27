import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { authService, type AuthUser } from "@/services/authService";
import { setProgressionUser } from "@/services/progression.service";

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) =>
    Promise<{ error: Error | null; userId?: number }>;
  verifyOtp: (userId: number, otp: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    const u = await authService.me();
    setUser(u);
    setProgressionUser(u ? String(u.id) : null);
  }, []);

  useEffect(() => {
    sync().finally(() => setLoading(false));
  }, [sync]);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    try {
      const u = await authService.login(email, password);
      setUser(u);
      setProgressionUser(String(u.id));
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signUp: AuthCtx["signUp"] = async (email, password, username) => {
    try {
      const { userId } = await authService.register(email, password, username);
      return { error: null, userId };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const verifyOtp: AuthCtx["verifyOtp"] = async (userId, otp) => {
    try {
      const u = await authService.verifyOtp(userId, otp);
      if (u) {
        setUser(u);
        setProgressionUser(String(u.id));
      } else {
        // OTP succeeded but no session yet — let the user sign in.
        await sync();
      }
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setProgressionUser(null);
  };

  const refresh = async () => { await sync(); };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, verifyOtp, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
};
