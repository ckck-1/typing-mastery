import { db, type Passage } from "@/server/db";
import { notFound, request } from "@/server/http";

export type { Passage };

export const passagesService = {
  list: () => request("GET", "/passages", () => db.read("passages")),

  get: (id: string) =>
    request("GET", `/passages/${id}`, () => {
      const p = db.read("passages").find((x) => x.id === id);
      if (!p) notFound("Passage");
      return p!;
    }),

  random: (category?: Passage["category"]) =>
    request("GET", `/passages/random`, () => {
      const all = db.read("passages").filter((p) => !category || p.category === category);
      if (all.length === 0) notFound("Passage");
      return all[Math.floor(Math.random() * all.length)];
    }),
};
