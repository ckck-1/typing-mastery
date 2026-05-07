import { supabase } from "@/integrations/supabase/client";

export type LeaderboardScope = "global" | "weekly" | "monthly" | "friends";

export type LeaderboardEntry = {
  id: string;
  username: string;
  name: string;
  wpm: number;
  accuracy: number;
  date: string;
  rank: number;
};

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const leaderboardService = {
  async list(scope: LeaderboardScope = "global"): Promise<LeaderboardEntry[]> {
    let userIds: string[] | null = null;

    if (scope === "friends") {
      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return [];
      const { data: fr, error: frErr } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", me.user.id);
      if (frErr) throw frErr;
      userIds = [me.user.id, ...(fr ?? []).map((r: any) => r.friend_id)];
      if (userIds.length === 0) return [];
    }

    let q = supabase
      .from("sessions")
      .select("id, user_id, wpm, accuracy, created_at, profiles:user_id ( username, name )")
      .order("wpm", { ascending: false })
      .limit(50);

    if (scope === "weekly") q = q.gte("created_at", sinceIso(7));
    else if (scope === "monthly") q = q.gte("created_at", sinceIso(30));
    if (userIds) q = q.in("user_id", userIds);

    const { data, error } = await q;
    if (error) throw error;

    // Best result per user
    const seen = new Set<string>();
    const top: LeaderboardEntry[] = [];
    let rank = 1;
    for (const row of (data ?? []) as any[]) {
      if (seen.has(row.user_id)) continue;
      seen.add(row.user_id);
      top.push({
        id: row.id,
        username: row.profiles?.username ?? "anonymous",
        name: row.profiles?.name ?? "",
        wpm: row.wpm,
        accuracy: Number(row.accuracy),
        date: row.created_at,
        rank: rank++,
      });
    }
    return top;
  },
};
