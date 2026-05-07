import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
};

type Row = { id: string; name: string; username: string; joined_at: string };
const map = (r: Row): Profile => ({
  id: r.id,
  name: r.name,
  username: r.username,
  joinedAt: r.joined_at,
});

export const profileService = {
  async me(): Promise<Profile | null> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, username, joined_at")
      .eq("id", u.user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? map(data as Row) : null;
  },

  async update(patch: Partial<Pick<Profile, "name" | "username">>): Promise<Profile> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", u.user.id)
      .select("id, name, username, joined_at")
      .single();
    if (error) throw error;
    return map(data as Row);
  },
};
