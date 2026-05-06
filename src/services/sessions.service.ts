import { db, type Session } from "@/server/db";
import { notFound, request } from "@/server/http";

export type { Session };

export type CreateSessionInput = Omit<Session, "id" | "createdAt" | "userId"> & {
  userId?: string;
};

function uid() {
  return "s_" + Math.random().toString(36).slice(2, 10);
}

export const sessionsService = {
  list: (limit = 20) =>
    request("GET", "/sessions", () => {
      return db
        .read("sessions")
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit);
    }),

  create: (input: CreateSessionInput) =>
    request("POST", "/sessions", () => {
      const sessions = db.read("sessions");
      const created: Session = {
        id: uid(),
        userId: input.userId ?? "u_me",
        passageId: input.passageId,
        wpm: input.wpm,
        accuracy: input.accuracy,
        duration: input.duration,
        correctChars: input.correctChars,
        createdAt: new Date().toISOString(),
      };
      db.write("sessions", [created, ...sessions]);
      return created;
    }),

  remove: (id: string) =>
    request("DELETE", `/sessions/${id}`, () => {
      const sessions = db.read("sessions");
      const next = sessions.filter((s) => s.id !== id);
      if (next.length === sessions.length) notFound("Session");
      db.write("sessions", next);
      return { ok: true } as const;
    }),

  stats: () =>
    request("GET", "/sessions/stats", () => {
      const ss = db.read("sessions");
      if (ss.length === 0) {
        return { bestWpm: 0, avgWpm: 0, avgAccuracy: 0, count: 0, series: [] as number[] };
      }
      const bestWpm = Math.max(...ss.map((s) => s.wpm));
      const avgWpm = Math.round(ss.reduce((a, s) => a + s.wpm, 0) / ss.length);
      const avgAccuracy = Math.round((ss.reduce((a, s) => a + s.accuracy, 0) / ss.length) * 10) / 10;
      const series = [...ss]
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
        .slice(-15)
        .map((s) => s.wpm);
      return { bestWpm, avgWpm, avgAccuracy, count: ss.length, series };
    }),
};
