import api from "@/lib/api";

export type Lesson = {
  id: string;
  title: string;
  description: string;
  content: string;
  order: number;
  category: string;
};

export type LessonProgress = {
  lessonId: string;
  completed: boolean;
  completedAt: string;
};

export const lessonsService = {
  list: async (): Promise<Lesson[]> => {
    const res = await api.get("/lessons");
    return res.data;
  },

  get: async (id: string): Promise<Lesson> => {
    const res = await api.get(`/lessons/${id}`);
    return res.data;
  },

  complete: async (id: string) => {
    const res = await api.post(`/lessons/${id}/complete`);
    return res.data;
  },

  getProgress: async (): Promise<LessonProgress[]> => {
    const res = await api.get("/lessons/progress");
    return res.data;
  },

  getFingerMap: async () => {
    const res = await api.get("/lessons/finger-map");
    return res.data;
  }
};
