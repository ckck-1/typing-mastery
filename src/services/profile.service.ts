import { db, type Profile } from "@/server/db";
import { request } from "@/server/http";

export type { Profile };

export const profileService = {
  me: () => request("GET", "/me", () => db.read("profile")),

  update: (patch: Partial<Pick<Profile, "name" | "username">>) =>
    request("PUT", "/me", () => {
      const current = db.read("profile");
      const next: Profile = { ...current, ...patch };
      db.write("profile", next);
      return next;
    }),
};
