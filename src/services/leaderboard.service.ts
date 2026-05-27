import { api } from "@/lib/api";

export type LeaderboardScope = "global" | "friends";

export type LeaderboardEntry = {
  id: number | string;
  username: string;
  name?: string;
  wpm: number;
  accuracy: number;
  date: string;
  rank: number;
};

function normalize(rows: any[]): LeaderboardEntry[] {
  return rows.map((r, i) => ({
    id: r.id ?? r.userId ?? r.user_id ?? i,
    username: r.username ?? r.user?.username ?? "anonymous",
    name: r.name ?? r.user?.name,
    wpm: Number(r.wpm ?? r.bestWpm) || 0,
    accuracy: Number(r.accuracy ?? r.avgAccuracy) || 0,
    date: r.date ?? r.createdAt ?? r.updatedAt ?? new Date().toISOString(),
    rank: r.rank ?? i + 1,
  }));
}

export const leaderboardService = {
  async list(scope: LeaderboardScope = "global"): Promise<LeaderboardEntry[]> {
    const path = scope === "friends" ? "/leaderboards/friends" : "/leaderboards/worldwide";
    const raw = await api<any>(path);
    const rows: any[] = Array.isArray(raw) ? raw : raw?.entries ?? raw?.results ?? raw?.data ?? [];
    return normalize(rows).slice(0, 50);
  },
};
