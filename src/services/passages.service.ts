import api from "@/lib/api";

export type Passage = {
  id: string;
  contentText: string;
  source: string;
  language: string;
  category?: string;
};

function normalize(raw: any): Passage {
  return {
    id: String(raw.id ?? raw.passageId ?? ""),
    // Extracts from backend's true snake_case payload envelope
    contentText: raw.content_text ?? raw.contentText ?? raw.content ?? raw.text ?? "",
    source: raw.source ?? raw.title ?? "Passage",
    language: raw.language ?? "en",
    category: raw.category ?? raw.mode,
  };
}

export const passagesService = {
  // Real backend: GET /tests/passage → returns { success: true, data: { ... } }
  random: async (mode?: "quote" | "custom" | "lesson"): Promise<Passage> => {
    const res = await api.get("/tests/passage", { 
      params: mode ? { mode } : undefined 
    });
    
    // Drill past the backend wrapper down to the direct data container object
    const targetPayload = res.data?.data ? res.data.data : res.data;
    return normalize(targetPayload);
  },
};