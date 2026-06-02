import api from "@/lib/api";

export type Profile = {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
  email?: string;
  avatarUrl?: string;
};

function normalize(raw: any): Profile {
  return {
    id: String(raw.id ?? raw.userId ?? ""),
    name: raw.name ?? raw.fullName ?? raw.username ?? "",
    username: raw.username ?? "",
    joinedAt: raw.joinedAt ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    email: raw.email,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url,
  };
}

export const profileService = {
  // GET /profile/me
  async me(): Promise<Profile> {
    const res = await api.get("/profile/me");
    return normalize(res.data);
  },

  // PUT /profile/me
  async update(patch: Partial<Pick<Profile, "name" | "username">>): Promise<Profile> {
    const res = await api.put("/profile/me", patch);
    return normalize(res.data?.profile ?? res.data);
  },

  // GET /profile/{userId}
  async getPublic(userId: string): Promise<Profile> {
    const res = await api.get(`/profile/${userId}`);
    return normalize(res.data);
  },

  // POST /profile/avatar (multipart)
  async uploadAvatar(file: File): Promise<Profile> {
    const form = new FormData();
    form.append("avatar", file);
    const res = await api.post("/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalize(res.data?.profile ?? res.data);
  },

  // DELETE /profile/me
  async deleteAccount() {
    await api.delete("/profile/me");
  },
};
