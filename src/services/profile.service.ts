import api from "@/lib/api";

export type Profile = {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
  email?: string;
};

export const profileService = {
  async me(): Promise<Profile | null> {
    try {
      const res = await api.get("/profile/me");
      return {
        id: res.data.id,
        name: res.data.name || res.data.username,
        username: res.data.username,
        joinedAt: res.data.joinedAt || res.data.createdAt,
        email: res.data.email,
      };
    } catch (e) {
      return null;
    }
  },

  async update(
    patch: Partial<Pick<Profile, "name" | "username">>
  ): Promise<Profile> {
    // The Swagger doesn't show a direct profile update endpoint, 
    // but typically it's PUT/PATCH /profile/me
    const res = await api.patch("/profile/me", patch);
    return res.data;
  },
};
