import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "@/services/authService";
import { profileService } from "@/services/profile.service";

type User = {
  id: string;
  email: string;
  username?: string;
  role?: string;
};

type Session = {
  user: User;
  token: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;

  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<{ data?: any; error: Error | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

async function hydrate(): Promise<{ user: User; token: string } | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  try {
    const me = await profileService.me();
    return { token, user: { id: me.id, email: me.email ?? "", username: me.username } };
  } catch {
    localStorage.removeItem("auth_token");
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const s = await hydrate();
    setSession(s);
    setUser(s?.user ?? null);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    try {
      const res = await authService.signIn(email, password);
      const token: string | undefined =
        res?.accessToken ?? res?.token ?? res?.data?.accessToken;
      if (token) localStorage.setItem("auth_token", token);
      await refresh();
      return { error: null };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Sign in failed";
      return { error: new Error(msg) };
    }
  };

  const signUp: AuthCtx["signUp"] = async (email, password, name, username) => {
    try {
      const res = await authService.signUp(email, password, name, username);
      return { data: res, error: null };
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Sign up failed";
      return { error: new Error(msg) };
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, session, loading, refresh, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
};
