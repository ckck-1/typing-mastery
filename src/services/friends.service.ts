import { api } from "@/lib/api";

export type FriendProfile = {
  id: number;
  username: string;
  name?: string;
  avatarUrl?: string | null;
  joined_at?: string;
};

export type PendingRequest = FriendProfile & {
  requestId: number;
  createdAt: string;
};

function pickProfile(raw: any): FriendProfile {
  const u = raw.user ?? raw.friend ?? raw.sender ?? raw.profile ?? raw;
  return {
    id: u.id ?? raw.userId ?? raw.friendId,
    username: u.username ?? "anonymous",
    name: u.name,
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
    joined_at: u.createdAt ?? u.created_at,
  };
}

export const friendsService = {
  async search(q: string): Promise<FriendProfile[]> {
    if (!q.trim()) return [];
    const raw = await api<any>("/users/search", { query: { q } });
    const rows: any[] = Array.isArray(raw) ? raw : raw?.users ?? raw?.data ?? [];
    return rows.map(pickProfile);
  },

  async listFriends(): Promise<FriendProfile[]> {
    const raw = await api<any>("/friends");
    const rows: any[] = Array.isArray(raw) ? raw : raw?.friends ?? raw?.data ?? [];
    return rows.map(pickProfile);
  },

  async listPending(): Promise<PendingRequest[]> {
    const raw = await api<any>("/friends/requests");
    const rows: any[] = Array.isArray(raw) ? raw : raw?.requests ?? raw?.data ?? [];
    return rows.map((r) => ({
      ...pickProfile(r),
      requestId: r.id ?? r.requestId,
      createdAt: r.createdAt ?? r.created_at ?? new Date().toISOString(),
    }));
  },

  async sendRequest(receiverId: number): Promise<void> {
    await api("/friends/request", { method: "POST", body: { receiverId } });
  },

  async accept(requestId: number): Promise<void> {
    await api(`/friends/request/${requestId}`, { method: "PUT", body: { action: "accept" } });
  },

  async decline(requestId: number): Promise<void> {
    await api(`/friends/request/${requestId}`, { method: "PUT", body: { action: "decline" } });
  },

  async remove(friendId: number): Promise<void> {
    await api(`/friends/${friendId}`, { method: "DELETE" });
  },
};
