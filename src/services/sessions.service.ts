import { api } from "@/lib/api";

export type Session = {
  id: number;
  wpm: number;
  accuracy: number;
  duration: number;
  mode: string;
  passageId?: number;
  createdAt: string;
};

export type CreateSessionInput = {
  passageId?: number;
  wpm: number;
  accuracy: number;
  duration: number;
  mode?: string;
  correctChars?: number;
};

function normalize(raw: any): Session {
  return {
    id: raw.id,
    wpm: Number(raw.wpm) || 0,
    accuracy: Number(raw.accuracy) || 0,
    duration: Number(raw.duration) || 0,
    mode: raw.mode ?? "quote",
    passageId: raw.passageId,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export const sessionsService = {
  async list(limit = 20): Promise<Session[]> {
    const raw = await api<any>("/tests/results");
    const rows: any[] = Array.isArray(raw) ? raw : raw?.results ?? raw?.data ?? [];
    return rows
      .map(normalize)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  async create(input: CreateSessionInput): Promise<Session> {
    const raw = await api<any>("/tests/result", {
      method: "POST",
      body: {
        wpm: Math.round(input.wpm),
        accuracy: Math.round(input.accuracy),
        duration: Math.round(input.duration),
        mode: input.mode ?? "quote",
        ...(input.passageId !== undefined ? { passageId: input.passageId } : {}),
      },
    });
    return normalize(raw ?? input);
  },

  async stats() {
    const sessions = await this.list(100);
    if (sessions.length === 0) {
      return { bestWpm: 0, avgWpm: 0, avgAccuracy: 0, count: 0, series: [] as number[] };
    }
    const count = sessions.length;
    const bestWpm = Math.max(...sessions.map((s) => s.wpm));
    const avgWpm = Math.round(sessions.reduce((a, s) => a + s.wpm, 0) / count);
    const avgAccuracy = Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / count);
    const series = [...sessions].reverse().slice(-12).map((s) => s.wpm);
    return { bestWpm, avgWpm, avgAccuracy, count, series };
  },
};
