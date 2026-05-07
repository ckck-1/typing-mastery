import { db, type Lesson } from "@/mock/db/schema";

export type { Lesson };

export const lessonsService = {
  list: () =>
    db.table("lessons").sort((a, b) => a.order - b.order),

  get: (id: string) => {
    const l = db.find("lessons", (x) => x.id === id);
    if (!l) throw new Error("Lesson not found");
    return l;
  },
};