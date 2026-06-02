import api from "@/lib/api";

export type User = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export type Session = {
  user: User;
  accessToken: string;
};

export const authService = {
  signIn: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.accessToken) {
      localStorage.setItem("auth_token", res.data.accessToken);
    }
    return res.data;
  },

  signUp: async (
    email: string,
    password: string,
    name: string,
    username: string
  ) => {
    // Note: backend expects { email, password, username }
    const res = await api.post("/auth/register", {
      email,
      password,
      username,
    });
    return res.data;
  },

  signOut: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("auth_token");
    }
  },

  getSession: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    
    try {
      // The backend doesn't seem to have a /auth/me, but we can use /profile/me
      const res = await api.get("/profile/me");
      return {
        user: res.data,
        accessToken: token,
      };
    } catch (err) {
      localStorage.removeItem("auth_token");
      return null;
    }
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh");
    if (res.data.accessToken) {
      localStorage.setItem("auth_token", res.data.accessToken);
    }
    return res.data;
  },

  verifyOtp: async (userId: number, otp: string) => {
    const res = await api.post("/auth/verify-otp", { userId, otp });
    return res.data;
  }
};
