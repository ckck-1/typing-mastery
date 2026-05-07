// src/services/profile.service.ts

import { db } from "@/mock/db/schema";
import { request, notFound, unauthorized } from "@/mock/transport";
import { authController } from "../mock/auth/controllers/authControllers";

export type Profile = {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
};

export const profileService = {
  async me(): Promise<Profile | null> {
    return request("GET", "/profile/me", async () => {
      const session = authController.getSession();

      if (!session) unauthorized();

      const profile = db.find(
        "profiles",
        (p) => p.id === session.user.id
      );

      if (!profile) return null;

      return {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        joinedAt: profile.joined_at,
      };
    }).then((r) => r.data);
  },

  async update(
    patch: Partial<Pick<Profile, "name" | "username">>
  ): Promise<Profile> {
    return request("PATCH", "/profile/me", async () => {
      const session = authController.getSession();

      if (!session) unauthorized();

      const profile = db.find(
        "profiles",
        (p) => p.id === session.user.id
      );

      if (!profile) notFound("Profile");

      db.update(
        "profiles",
        (p) => p.id === session.user.id,
        (p) => ({
          ...p,
          name: patch.name ?? p.name,
          username: patch.username?.toLowerCase() ?? p.username,
        })
      );

      const updated = db.find(
        "profiles",
        (p) => p.id === session.user.id
      )!;

      return {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        joinedAt: updated.joined_at,
      };
    }).then((r) => r.data);
  },
};