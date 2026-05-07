// src/services/friends.service.ts

import { db } from "@/mock/db/schema";
import {
  request,
  conflict,
  unauthorized,
} from "@/mock/transport";

import { authController } from "../mock/auth/controllers/authControllers";
import { generateId } from "@/mock/utils/id";

export type FriendProfile = {
  id: string;
  name: string;
  username: string;
  joined_at: string;
};

export const friendsService = {
  async search(query: string): Promise<FriendProfile[]> {
    return request("GET", "/friends/search", async () => {
      const q = query.trim().toLowerCase();

      if (!q) return [];

      return db
        .table("profiles")
        .filter((p) =>
          p.username.toLowerCase().includes(q)
        )
        .slice(0, 20)
        .map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          joined_at: p.joined_at,
        }));
    }).then((r) => r.data);
  },

  async listFriends(): Promise<FriendProfile[]> {
    return request("GET", "/friends", async () => {
      const session = authController.getSession();

      if (!session) unauthorized();

      const friendships = db
        .table("friendships")
        .filter(
          (f) =>
            f.userId === session.user.id &&
            f.status === "accepted"
        );

      return friendships
        .map((f) =>
          db.find("profiles", (p) => p.id === f.friendId)
        )
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          name: p!.name,
          username: p!.username,
          joined_at: p!.joined_at,
        }));
    }).then((r) => r.data);
  },

  async add(friendId: string) {
    return request("POST", "/friends", async () => {
      const session = authController.getSession();

      if (!session) unauthorized();

      const exists = db.find(
        "friendships",
        (f) =>
          f.userId === session.user.id &&
          f.friendId === friendId
      );

      if (exists) conflict("Already friends");

      db.insert("friendships", {
        id: generateId("fr"),
        userId: session.user.id,
        friendId,
        status: "accepted",
        createdAt: new Date().toISOString(),
      });

      return { ok: true };
    }).then((r) => r.data);
  },

  async remove(friendId: string) {
    return request("DELETE", "/friends", async () => {
      const session = authController.getSession();

      if (!session) unauthorized();

      db.delete(
        "friendships",
        (f) =>
          f.userId === session.user.id &&
          f.friendId === friendId
      );

      return { ok: true };
    }).then((r) => r.data);
  },
};