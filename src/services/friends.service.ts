// src/services/friends.service.ts

import { db } from "@/mock/db/schema";
import {
  request,
  conflict,
  unauthorized,
  notFound,
} from "@/mock/transport";

import { authController } from "../mock/auth/controllers/authControllers";
import { generateId } from "@/mock/utils/id";

export type FriendProfile = {
  id: string;
  name: string;
  username: string;
  joined_at: string;
};

export type PendingRequest = FriendProfile & {
  friendshipId: string;
  createdAt: string;
};

export const friendsService = {
  async search(query: string): Promise<FriendProfile[]> {
    return request("GET", "/friends/search", async () => {
      const q = query.trim().toLowerCase();
      if (!q) return [];

      const session = authController.getSession();
      const myId = session?.user.id;

      return db
        .table("profiles")
        .filter(
          (p) =>
            p.id !== myId &&
            (p.username.toLowerCase().includes(q) ||
              p.name.toLowerCase().includes(q))
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
      const me = session.user.id;

      const friendships = db
        .table("friendships")
        .filter(
          (f) =>
            f.status === "accepted" &&
            (f.userId === me || f.friendId === me)
        );

      return friendships
        .map((f) => {
          const otherId = f.userId === me ? f.friendId : f.userId;
          return db.find("profiles", (p) => p.id === otherId);
        })
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          name: p!.name,
          username: p!.username,
          joined_at: p!.joined_at,
        }));
    }).then((r) => r.data);
  },

  async listPending(): Promise<PendingRequest[]> {
    return request("GET", "/friends/pending", async () => {
      const session = authController.getSession();
      if (!session) unauthorized();
      const me = session.user.id;

      return db
        .table("friendships")
        .filter((f) => f.friendId === me && f.status === "pending")
        .map((f) => {
          const p = db.find("profiles", (x) => x.id === f.userId);
          return p
            ? {
                friendshipId: f.id,
                id: p.id,
                name: p.name,
                username: p.username,
                joined_at: p.joined_at,
                createdAt: f.createdAt,
              }
            : null;
        })
        .filter(Boolean) as PendingRequest[];
    }).then((r) => r.data);
  },

  async add(friendId: string) {
    return request("POST", "/friends", async () => {
      const session = authController.getSession();
      if (!session) unauthorized();
      const me = session.user.id;
      if (friendId === me) conflict("You cannot add yourself");

      const exists = db.find(
        "friendships",
        (f) =>
          (f.userId === me && f.friendId === friendId) ||
          (f.userId === friendId && f.friendId === me)
      );
      if (exists) conflict("Already connected or pending");

      db.insert("friendships", {
        id: generateId("fr"),
        userId: me,
        friendId,
        status: "accepted", // instant connect in mock
        createdAt: new Date().toISOString(),
      });

      return { ok: true };
    }).then((r) => r.data);
  },

  async accept(friendshipId: string) {
    return request("PATCH", `/friends/${friendshipId}`, async () => {
      const session = authController.getSession();
      if (!session) unauthorized();

      const f = db.find("friendships", (x) => x.id === friendshipId);
      if (!f) notFound("Request");
      if (f!.friendId !== session.user.id) unauthorized();

      db.update(
        "friendships",
        (x) => x.id === friendshipId,
        (x) => ({ ...x, status: "accepted" as const })
      );
      return { ok: true };
    }).then((r) => r.data);
  },

  async decline(friendshipId: string) {
    return request("DELETE", `/friends/${friendshipId}`, async () => {
      const session = authController.getSession();
      if (!session) unauthorized();

      const f = db.find("friendships", (x) => x.id === friendshipId);
      if (!f) notFound("Request");
      if (f!.friendId !== session.user.id) unauthorized();

      db.delete("friendships", (x) => x.id === friendshipId);
      return { ok: true };
    }).then((r) => r.data);
  },

  async remove(friendId: string) {
    return request("DELETE", "/friends", async () => {
      const session = authController.getSession();
      if (!session) unauthorized();
      const me = session.user.id;

      db.delete(
        "friendships",
        (f) =>
          (f.userId === me && f.friendId === friendId) ||
          (f.userId === friendId && f.friendId === me)
      );
      return { ok: true };
    }).then((r) => r.data);
  },
};
