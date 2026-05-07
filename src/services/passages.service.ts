import { db, type Passage } from "@/mock/db/schema";

export type { Passage };

export const passagesService = {
  list: () => db.table("passages"),

  get: (id: string) => {
    const p = db.find("passages", (x) => x.id === id);
    if (!p) throw new Error("Passage not found");
    return p;
  },

  random: (category?: Passage["category"]) => {
    const all = db
      .table("passages")
      .filter((p) => !category || p.category === category);

    if (all.length === 0) throw new Error("Passage not found");

    return all[Math.floor(Math.random() * all.length)];
  },
};