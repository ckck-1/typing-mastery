import { db } from "@/mock/db/schema";
import { request } from "@/mock/transport";
import { authController } from "../mock/auth/controllers/authControllers";

export type LeaderboardScope =
  | "global"
  | "weekly"
  | "monthly"
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

function since(days: number) {
  return Date.now() - days * 86400000;
}

export const leaderboardService = {
  async list(
    scope: LeaderboardScope = "global"
  ): Promise<LeaderboardEntry[]> {
    return request(
      "GET",
      "/leaderboard",
      () => {
        let sessions = db.table("sessions");

        if (scope === "weekly") {
          sessions = sessions.filter(
            (s) =>
              new Date(s.createdAt).getTime() >=
              since(7)
          );
        }

        if (scope === "monthly") {
          sessions = sessions.filter(
            (s) =>
              new Date(s.createdAt).getTime() >=
              since(30)
          );
        }

        if (scope === "friends") {
          const uid =
            authController.getSession()?.user.id;

          if (!uid) return [];

          const friends = db
            .table("friendships")
            .filter(
              (f) =>
                f.userId === uid &&
                f.status === "accepted"
            )
            .map((f) => f.friendId);

          sessions = sessions.filter(
            (s) =>
              s.userId === uid ||
              friends.includes(s.userId)
          );
        }

        sessions.sort((a, b) => b.wpm - a.wpm);

        const seen = new Set<string>();

        const top: LeaderboardEntry[] = [];

        let rank = 1;

        for (const s of sessions) {
          if (seen.has(s.userId)) continue;

          seen.add(s.userId);

          const profile = db.find(
            "profiles",
            (p) => p.id === s.userId
          );

          top.push({
            id: s.id,
            username:
              profile?.username ?? "anonymous",
            name: profile?.name ?? "",
            wpm: s.wpm,
            accuracy: s.accuracy,
            date: s.createdAt,
            rank: rank++,
          });
        }

        return top.slice(0, 50);
      }
    ).then((r) => r.data);
  },
};