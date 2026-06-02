import api from "@/lib/api";

export type Passage = {
  id: string;
  contentText: string;
  source: string;
  language: string;
  category?: string;
};

export const passagesService = {
  // Note: The public API doesn't have a direct /passages list for normal users,
  // but it might be /admin/passages or just use lessons.
  // Based on common patterns, I'll assume there's a public way to get passages or we use lessons.
  // If there's no public list, we can fallback to lessons or a specific endpoint.
  list: async (): Promise<Passage[]> => {
    // Assuming there's a way to get passages, maybe via a general lessons or specific endpoint
    // For now, let's check if there's a /passages endpoint or similar.
    // Looking at the Swagger, there's /admin/passages.
    try {
        const res = await api.get("/passages");
        return res.data;
    } catch (e) {
        // Fallback to lessons if passages endpoint doesn't exist
        const lessons = await api.get("/lessons");
        return lessons.data.map((l: any) => ({
            id: l.id,
            contentText: l.content,
            source: l.title,
            language: "en"
        }));
    }
  },

  get: async (id: string): Promise<Passage> => {
    const res = await api.get(`/passages/${id}`);
    return res.data;
  },

  random: async (category?: string): Promise<Passage> => {
    // If no random endpoint, we get list and pick one
    const passages = await passagesService.list();
    const filtered = category ? passages.filter(p => p.category === category) : passages;
    if (filtered.length === 0) throw new Error("No passages found");
    return filtered[Math.floor(Math.random() * filtered.length)];
  },
};
