import { db, type LeaderboardEntry } from "@/server/db";
import { request } from "@/server/http";

export type LeaderboardScope = "global" | "weekly" | "monthly" | "friends";
export type { LeaderboardEntry };

function withinDays(iso: string, days: number) {
  const diff = (Date.now() - +new Date(iso)) / 86_400_000;
  return diff <= days;
}

export const leaderboardService = {
  list: (scope: LeaderboardScope = "global") =>
    request("GET", `/leaderboard?scope=${scope}`, () => {
      let rows = db.read("leaderboard");
      if (scope === "weekly") rows = rows.filter((r) => withinDays(r.date, 7));
      else if (scope === "monthly") rows = rows.filter((r) => withinDays(r.date, 30));
      else if (scope === "friends") rows = rows.slice(0, 5);
      return rows
        .sort((a, b) => b.wpm - a.wpm)
        .map((r, i) => ({ ...r, rank: i + 1 }));
    }),
};
