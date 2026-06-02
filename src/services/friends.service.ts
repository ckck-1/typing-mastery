import api from "@/lib/api";

export type FriendProfile = {
  id: string;
  name: string;
  username: string;
  joined_at?: string;
};

export type PendingRequest = FriendProfile & {
  requestId: string;
  createdAt: string;
};

export const friendsService = {
  async search(query: string): Promise<FriendProfile[]> {
    const res = await api.get(`/users/search?q=${query}`);
    return res.data;
  },

  async listFriends(): Promise<FriendProfile[]> {
    const res = await api.get("/friends");
    return res.data;
  },

  async listPending(): Promise<PendingRequest[]> {
    const res = await api.get("/friends/requests");
    return res.data.map((req: any) => ({
        requestId: req.id,
        id: req.senderId,
        name: req.senderName || req.senderUsername,
        username: req.senderUsername,
        joined_at: req.createdAt,
        createdAt: req.createdAt
    }));
  },

  async add(receiverId: string) {
    const res = await api.post("/friends/request", { receiverId });
    return res.data;
  },

  async sendRequest(receiverId: string) {
    return this.add(receiverId);
  },

  async accept(requestId: string) {
    const res = await api.put(`/friends/request/${requestId}`, { action: "accept" });
    return res.data;
  },

  async decline(requestId: string) {
    const res = await api.put(`/friends/request/${requestId}`, { action: "decline" });
    return res.data;
  },

  async remove(friendId: string) {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },
};
