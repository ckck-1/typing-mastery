import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "@/services/authService";

type User = {
  id: string;
  email: string;
  role: string;
};

type Session = {
  user: User;
  token: string;
  expiresAt: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;

  signUp: (
    email: string,
    password: string,
    name: string,
    username: string
  ) => Promise<{ error: Error | null }>;

  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const s = await authService.getSession();

      setSession(s);
      setUser(s?.user ?? null);

      setLoading(false);
    };

    boot();
  }, []);

  const signIn: AuthCtx["signIn"] = async (
    email,
    password
  ) => {
    try {
      const session = await authService.signIn(
        email,
        password
      );

      setSession(session);
      setUser(session.user);

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp: AuthCtx["signUp"] = async (
    email,
    password,
    name,
    username
  ) => {
    try {
      const session = await authService.signUp(
        email,
        password,
        name,
        username
      );

      setSession(session);
      setUser(session.user);

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await authService.signOut();

    setSession(null);
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);

  if (!v) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return v;
};