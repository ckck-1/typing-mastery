import { authController } from "../mock/auth/controllers/authControllers";

export const authService = {
  signIn: async (email: string, password: string) => {
    const res = await authController.signIn(email, password);
    return res.data;
  },

  signUp: async (
    email: string,
    password: string,
    name: string,
    username: string
  ) => {
    const res = await authController.signUp(
      email,
      password,
      name,
      username
    );

    return res.data;
  },

  signOut: async () => {
    authController.signOut();
  },

  getSession: async () => {
    return authController.getSession();
  },

  refresh: async () => {
    return authController.refresh();
  },
};