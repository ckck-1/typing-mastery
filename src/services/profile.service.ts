import { api } from "@/lib/api";

export type Profile = {
  id: number;
  username: string;
  email?: string;
  avatarUrl?: string | null;
  joinedAt: string;
  emailNotificationsEnabled?: boolean;
};

function normalize(raw: any): Profile {
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? null,
    joinedAt: raw.createdAt ?? raw.created_at ?? raw.joinedAt ?? new Date().toISOString(),
    emailNotificationsEnabled: raw.emailNotificationsEnabled,
  };
}

export const profileService = {
  async me(): Promise<Profile> {
    const raw = await api<any>("/profile/me");
    return normalize(raw);
  },

  async update(patch: { username?: string; emailNotificationsEnabled?: boolean }): Promise<Profile> {
    const raw = await api<any>("/profile/me", { method: "PUT", body: patch });
    return normalize(raw);
  },

  async getPublic(userId: number): Promise<Profile> {
    const raw = await api<any>(`/profile/${userId}`);
    return normalize(raw);
  },

  async uploadAvatar(file: File): Promise<Profile> {
    const fd = new FormData();
    fd.append("avatar", file);
    const raw = await api<any>("/profile/avatar", { method: "POST", body: fd });
    return normalize(raw);
  },

  async deleteAccount(): Promise<void> {
    await api("/profile/me", { method: "DELETE" });
  },
};
