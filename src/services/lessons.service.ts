import { db, type Lesson } from "@/server/db";
import { notFound, request } from "@/server/http";

export type { Lesson };

export const lessonsService = {
  list: () =>
    request("GET", "/lessons", () =>
      db.read("lessons").sort((a, b) => a.order - b.order),
    ),

  get: (id: string) =>
    request("GET", `/lessons/${id}`, () => {
      const l = db.read("lessons").find((x) => x.id === id);
      if (!l) notFound("Lesson");
      return l!;
    }),
};
