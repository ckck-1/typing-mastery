import { api } from "@/lib/api";

export type Passage = {
  id: number;
  text: string;
  source?: string;
  language?: string;
  mode?: string;
};

function normalize(raw: any): Passage {
  return {
    id: raw.id,
    text: raw.contentText ?? raw.content ?? raw.text ?? "",
    source: raw.source,
    language: raw.language,
    mode: raw.mode,
  };
}

export const passagesService = {
  async random(mode?: "quote" | "custom" | "lesson"): Promise<Passage> {
    const raw = await api<any>("/tests/passage", { query: mode ? { mode } : undefined });
    return normalize(raw);
  },
};
