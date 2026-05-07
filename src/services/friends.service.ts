import { supabase } from "@/integrations/supabase/client";

export type FriendProfile = {
  id: string;
  name: string;
  username: string;
  joined_at: string;
};

export const friendsService = {
  async search(query: string): Promise<FriendProfile[]> {
    const q = query.trim();
    if (!q) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, username, joined_at")
      .ilike("username", `%${q}%`)
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },

  async listFriends(userId: string): Promise<FriendProfile[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select("friend_id, profiles:friend_id ( id, name, username, joined_at )")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((r: any) => r.profiles).filter(Boolean);
  },

  async add(userId: string, friendId: string): Promise<void> {
    const { error } = await supabase
      .from("friendships")
      .insert({ user_id: userId, friend_id: friendId });
    if (error) throw error;
  },

  async remove(userId: string, friendId: string): Promise<void> {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("user_id", userId)
      .eq("friend_id", friendId);
    if (error) throw error;
  },
};
