import { db } from "@/mock/db/schema";
import { request } from "@/mock/transport";
import { authController } from "../mock/auth/controllers/authControllers";

export type Session = {
  id: string;
  userId: string;
  passageId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  correctChars: number;
  createdAt: string;
};

export type CreateSessionInput = {
  passageId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  correctChars: number;
};

function currentUserId() {
  return authController.getSession()?.user.id ?? null;
}

export const sessionsService = {
  async list(limit = 20): Promise<Session[]> {
    return request("GET", "/sessions", () => {
      const uid = currentUserId();

      if (!uid) return [];

      return db
        .table("sessions")
        .filter((s) => s.userId === uid)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, limit);
    }).then((r) => r.data);
  },

  async create(
    input: CreateSessionInput
  ): Promise<Session> {
    return request("POST", "/sessions", () => {
      const uid = currentUserId();

      if (!uid) {
        throw new Error(
          "Sign in to save sessions"
        );
      }

      const session: Session = {
        id: crypto.randomUUID(),
        userId: uid,
        passageId: input.passageId,
        wpm: input.wpm,
        accuracy: input.accuracy,
        duration: input.duration,
        correctChars: input.correctChars,
        createdAt: new Date().toISOString(),
      };

      db.insert("sessions", {
        ...session,
        errorChars: 0,
      });

      return session;
    }).then((r) => r.data);
  },

  async remove(id: string) {
    return request("DELETE", "/sessions", () => {
      db.delete("sessions", (s) => s.id === id);

      return { ok: true };
    }).then((r) => r.data);
  },

  async stats() {
    return request("GET", "/sessions/stats", () => {
      const uid = currentUserId();

      if (!uid) {
        return {
          bestWpm: 0,
          avgWpm: 0,
          avgAccuracy: 0,
          count: 0,
          series: [],
        };
      }

      const ss = db
        .table("sessions")
        .filter((s) => s.userId === uid);

      if (!ss.length) {
        return {
          bestWpm: 0,
          avgWpm: 0,
          avgAccuracy: 0,
          count: 0,
          series: [],
        };
      }

      const wpms = ss.map((s) => s.wpm);

      const accs = ss.map((s) => s.accuracy);

      return {
        bestWpm: Math.max(...wpms),

        avgWpm: Math.round(
          wpms.reduce((a, b) => a + b, 0) /
            wpms.length
        ),

        avgAccuracy:
          Math.round(
            (accs.reduce((a, b) => a + b, 0) /
              accs.length) *
              10
          ) / 10,

        count: ss.length,

        series: wpms.slice(-15),
      };
    }).then((r) => r.data);
  },
};