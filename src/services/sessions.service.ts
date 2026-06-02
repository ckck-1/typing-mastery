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

export const sessionsService = {
  async list(limit = 20): Promise<Session[]> {
    const res = await api.get(`/tests?limit=${limit}`);
    return res.data;
  },

  async create(
    input: CreateSessionInput
  ): Promise<Session> {
    // Backend endpoint for tests/sessions
    const res = await api.post("/tests", {
        passageId: input.passageId,
        wpm: input.wpm,
        accuracy: input.accuracy,
        duration: input.duration,
        correctChars: input.correctChars
    });
    return res.data;
  },

  async remove(id: string) {
    const res = await api.delete(`/tests/${id}`);
    return res.data;
  },

  async stats() {
    // If no dedicated stats endpoint, we can calculate or check if it exists
    try {
        const res = await api.get("/profile/stats");
        return res.data;
    } catch (e) {
        const tests = await sessionsService.list();
        if (!tests.length) {
            return {
              bestWpm: 0,
              avgWpm: 0,
              avgAccuracy: 0,
              count: 0,
              series: [],
            };
        }
        const wpms = tests.map((s) => s.wpm);
        const accs = tests.map((s) => s.accuracy);
        return {
            bestWpm: Math.max(...wpms),
            avgWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
            avgAccuracy: Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10,
            count: tests.length,
            series: wpms.slice(-15),
        };
    }
  },
};
