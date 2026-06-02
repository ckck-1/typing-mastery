import api from "@/lib/api";

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

function normalize(raw: any): Session {
  return {
    id: String(raw.id ?? raw.resultId ?? ""),
    userId: String(raw.userId ?? raw.user_id ?? ""),
    passageId: String(raw.passageId ?? raw.passage_id ?? ""),
    wpm: Number(raw.wpm ?? 0),
    accuracy: Number(raw.accuracy ?? 0),
    duration: Number(raw.duration ?? raw.durationSeconds ?? 0),
    correctChars: Number(raw.correctChars ?? raw.correct_chars ?? 0),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export const sessionsService = {
  // Real backend: GET /tests/results — current user's history
  async list(limit = 20): Promise<Session[]> {
    const res = await api.get("/tests/results");
    const arr: any[] = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
    return arr.slice(0, limit).map(normalize);
  },

  // Real backend: POST /tests/result
  async create(input: CreateSessionInput): Promise<Session> {
    const res = await api.post("/tests/result", {
      passageId: Number(input.passageId) || input.passageId,
      wpm: input.wpm,
      accuracy: input.accuracy,
      duration: input.duration,
      correctChars: input.correctChars,
    });
    return normalize(res.data?.result ?? res.data);
  },

  // Derived locally from /tests/results — backend has no dedicated stats endpoint
  async stats() {
    const tests = await this.list(200);
    if (!tests.length) {
      return { bestWpm: 0, avgWpm: 0, avgAccuracy: 0, count: 0, series: [] as number[] };
    }
    const wpms = tests.map((s) => s.wpm);
    const accs = tests.map((s) => s.accuracy);
    return {
      bestWpm: Math.max(...wpms),
      avgWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
      avgAccuracy: Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10,
      count: tests.length,
      series: wpms.slice(0, 15).reverse(),
    };
  },

  // Public share endpoint
  async share(id: string) {
    const res = await api.get(`/tests/result/${id}/share`);
    return res.data;
  },
};
