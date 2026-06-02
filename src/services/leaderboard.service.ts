import api from "@/lib/api";

export type LeaderboardScope =
  | "worldwide"
  | "friends";

export type LeaderboardEntry = {
  id: string;
  username: string;
  name: string;
  wpm: number;
  accuracy: number;
  date: string;
  rank: number;
};

export const leaderboardService = {
  async list(
    scope: LeaderboardScope = "worldwide"
  ): Promise<LeaderboardEntry[]> {
    const endpoint = scope === "friends" ? "/leaderboards/friends" : "/leaderboards/worldwide";
    const res = await api.get(endpoint);
    
    // Transform API response to our UI format if necessary
    return res.data.map((entry: any, index: number) => ({
      id: entry.userId || entry.id,
      username: entry.username,
      name: entry.name || entry.username,
      wpm: entry.wpm || entry.bestWpm || 0,
      accuracy: entry.accuracy || entry.avgAccuracy || 0,
      date: entry.createdAt || entry.date || new Date().toISOString(),
      rank: entry.rank || index + 1,
    }));
  },
};
