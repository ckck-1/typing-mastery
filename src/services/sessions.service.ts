import { supabase } from "@/integrations/supabase/client";

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

type Row = {
  id: string;
  user_id: string;
  passage_id: string;
  wpm: number;
  accuracy: number;
  duration: number;
  correct_chars: number;
  created_at: string;
};

const map = (r: Row): Session => ({
  id: r.id,
  userId: r.user_id,
  passageId: r.passage_id,
  wpm: r.wpm,
  accuracy: Number(r.accuracy),
  duration: r.duration,
  correctChars: r.correct_chars,
  createdAt: r.created_at,
});

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const sessionsService = {
  async list(limit = 20): Promise<Session[]> {
    const uid = await currentUserId();
    if (!uid) return [];
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Row[]).map(map);
  },

  async create(input: CreateSessionInput): Promise<Session> {
    const uid = await currentUserId();
    if (!uid) throw new Error("Sign in to save sessions");
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: uid,
        passage_id: input.passageId,
        wpm: input.wpm,
        accuracy: input.accuracy,
        duration: input.duration,
        correct_chars: input.correctChars,
      })
      .select("*")
      .single();
    if (error) throw error;
    return map(data as Row);
  },

  async remove(id: string): Promise<{ ok: true }> {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },

  async stats() {
    const uid = await currentUserId();
    if (!uid) return { bestWpm: 0, avgWpm: 0, avgAccuracy: 0, count: 0, series: [] as number[] };
    const { data, error } = await supabase
      .from("sessions")
      .select("wpm, accuracy, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const ss = data ?? [];
    if (ss.length === 0) {
      return { bestWpm: 0, avgWpm: 0, avgAccuracy: 0, count: 0, series: [] as number[] };
    }
    const wpms = ss.map((s: any) => s.wpm as number);
    const accs = ss.map((s: any) => Number(s.accuracy));
    const bestWpm = Math.max(...wpms);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
    const avgAccuracy = Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10;
    const series = wpms.slice(-15);
    return { bestWpm, avgWpm, avgAccuracy, count: ss.length, series };
  },
};
