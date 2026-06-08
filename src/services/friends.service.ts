import api from "@/lib/api";

export type FriendProfile = {
  id: number; // Aligned with your component state requirements
  name: string;
  username: string;
  joined_at?: string;
};

export type PendingRequest = FriendProfile & {
  requestId: number;
  createdAt: string;
};

export const friendsService = {
  async search(query: string): Promise<FriendProfile[]> {
    const res = await api.get(`/users/search?q=${query}`);
    // Extracting array from the api's response structure safely
    const array = res.data?.data || res.data || [];
    return array.map((u: any) => ({
      ...u,
      id: Number(u.id)
    }));
  },

  async listFriends(): Promise<FriendProfile[]> {
    const res = await api.get("/friends");
    // Extract the array out of the response data wrapper safely
    const array = res.data?.data || res.data || [];
    return array.map((f: any) => ({
      ...f,
      id: Number(f.id)
    }));
  },

  async listPending(): Promise<PendingRequest[]> {
    const res = await api.get("/friends/requests");
    const array = res.data?.data || res.data || [];
    return array.map((req: any) => ({
      requestId: Number(req.id),
      id: Number(req.senderId),
      name: req.senderName || req.senderUsername || "",
      username: req.senderUsername,
      joined_at: req.createdAt,
      createdAt: req.createdAt
    }));
  },

  async add(receiverId: number) {
    const res = await api.post("/friends/request", { receiverId });
    return res.data;
  },

  async sendRequest(receiverId: number) {
    return this.add(receiverId);
  },

  async accept(requestId: number) {
    const res = await api.put(`/friends/request/${requestId}`, { action: "accept" });
    return res.data;
  },

  async decline(requestId: number) {
    const res = await api.put(`/friends/request/${requestId}`, { action: "decline" });
    return res.data;
  },

  async remove(friendId: number) {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },
};