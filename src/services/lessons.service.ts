import { api } from "@/lib/api";

export type Lesson = {
  id: number;
  title: string;
  text: string;
  keys: string[];
  order: number;
};

function normalize(raw: any, idx = 0): Lesson {
  return {
    id: raw.id ?? idx,
    title: raw.title ?? `Lesson ${idx + 1}`,
    text: raw.contentText ?? raw.text ?? raw.content ?? "",
    keys: Array.isArray(raw.keys) ? raw.keys : typeof raw.keys === "string" ? raw.keys.split("") : [],
    order: raw.order ?? raw.position ?? idx,
  };
}

export const lessonsService = {
  async list(): Promise<Lesson[]> {
    const raw = await api<any>("/lessons");
    const rows: any[] = Array.isArray(raw) ? raw : raw?.lessons ?? raw?.data ?? [];
    return rows.map(normalize).sort((a, b) => a.order - b.order);
  },

  async get(id: number): Promise<Lesson> {
    const raw = await api<any>(`/lessons/${id}`);
    return normalize(raw);
  },

  async complete(id: number): Promise<void> {
    await api(`/lessons/${id}/complete`, { method: "POST" });
  },

  async progress(): Promise<Array<{ lessonId: number; completedAt: string }>> {
    try {
      const raw = await api<any>("/lessons/progress");
      return Array.isArray(raw) ? raw : raw?.data ?? [];
    } catch {
      return [];
    }
  },

  async fingerMap(): Promise<Record<string, string>> {
    try {
      return await api<Record<string, string>>("/lessons/finger-map");
    } catch {
      return {};
    }
  },
};
