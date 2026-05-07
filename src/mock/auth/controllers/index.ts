/**
 * mock/controllers/index.ts
 *
 * All REST-style mock controllers.  Each function mirrors a real API endpoint
 * and returns a typed ApiResponse<T> so the service layer has a consistent
 * interface to a real backend.
 *
 * Endpoints modelled:
 *   GET    /passages          – list with filter + pagination
 *   GET    /passages/:id      – single
 *   GET    /passages/random   – random by category
 *   POST   /passages          – create (admin)
 *   PUT    /passages/:id      – update (admin)
 *   DELETE /passages/:id      – delete (admin)
 *
 *   GET    /sessions          – list (current user, paginated)
 *   POST   /sessions          – create
 *   DELETE /sessions/:id      – delete
 *   GET    /sessions/stats    – aggregate stats
 *
 *   GET    /leaderboard       – scoped: global | weekly | monthly | friends
 *
 *   GET    /lessons           – list
 *   GET    /lessons/:id       – single
 *   POST   /lessons/:id/complete – mark complete
 *
 *   GET    /profiles/me       – current user profile
 *   PUT    /profiles/me       – update current user profile
 *   GET    /profiles/:id      – public profile
 *   GET    /profiles/search   – search by username
 *
 *   GET    /friends           – list accepted friends
 *   POST   /friends           – send request
 *   PATCH  /friends/:id       – accept/decline
 *   DELETE /friends/:id       – remove
 *
 *   GET    /notifications     – list (current user)
 *   PATCH  /notifications/:id – mark read
 *   POST   /notifications/read-all – mark all read
 */

import { db, type Passage, type Session } from "../../db/schema";
import { generateId } from "../../utils/id";
import {
  request,
  notFound,
  unauthorized,
  conflict,
  validationError,
  paginate,
  type ApiResponse,
  type PaginationParams,
} from "../../transport";
import { authController, type MockSession } from "../controllers/authControllers";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function requireSession(): MockSession {
  const s = authController.getSession();
  if (!s) unauthorized();
  return s!;
}

// ─── Passages ─────────────────────────────────────────────────────────────────

export type PassageFilter = {
  category?: Passage["category"];
  difficulty?: Passage["difficulty"];
  search?: string;
};

export const passagesController = {
  list: (filter: PassageFilter & PaginationParams = {}) =>
    request("GET", "/passages", () => {
      let rows = db.table("passages");
      if (filter.category) rows = rows.filter((p) => p.category === filter.category);
      if (filter.difficulty) rows = rows.filter((p) => p.difficulty === filter.difficulty);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        rows = rows.filter(
          (p) => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q),
        );
      }
      const { rows: paged, meta } = paginate(rows, filter);
      return { passages: paged, meta };
    }),

  get: (id: string) =>
    request("GET", `/passages/${id}`, () => {
      const p = db.find("passages", (x) => x.id === id);
      if (!p) notFound("Passage");
      return p!;
    }),

  random: (category?: Passage["category"]) =>
    request("GET", "/passages/random", () => {
      const all = db.table("passages").filter((p) => !category || p.category === category);
      if (all.length === 0) notFound("Passage");
      return all[Math.floor(Math.random() * all.length)];
    }),

  create: (input: Pick<Passage, "title" | "category" | "text" | "difficulty"> & { author?: string }) =>
    request("POST", "/passages", () => {
      requireSession();
      if (!input.title || !input.text) validationError("title and text are required");
      const now = new Date().toISOString();
      const passage: Passage = {
        id: generateId("p"),
        title: input.title,
        category: input.category ?? "literature",
        text: input.text,
        author: input.author ?? null,
        difficulty: input.difficulty ?? "medium",
        createdAt: now,
        updatedAt: now,
      };
      db.insert("passages", passage);
      return passage;
    }),

  update: (id: string, patch: Partial<Pick<Passage, "title" | "text" | "category" | "difficulty">>) =>
    request("PUT", `/passages/${id}`, () => {
      requireSession();
      const existing = db.find("passages", (p) => p.id === id);
      if (!existing) notFound("Passage");
      const updated = { ...existing!, ...patch, updatedAt: new Date().toISOString() };
      db.update("passages", (p) => p.id === id, () => updated);
      return updated;
    }),

  delete: (id: string) =>
    request("DELETE", `/passages/${id}`, () => {
      requireSession();
      const existing = db.find("passages", (p) => p.id === id);
      if (!existing) notFound("Passage");
      db.delete("passages", (p) => p.id === id);
      return { id, deleted: true };
    }),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type CreateSessionInput = {
  passageId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  correctChars: number;
  errorChars?: number;
};

export const sessionsController = {
  list: (params: PaginationParams & { sort?: "desc" | "asc" } = {}) =>
    request("GET", "/sessions", () => {
      const { user } = requireSession();
      let rows = db.table("sessions").filter((s) => s.userId === user.id);
      rows.sort((a, b) => {
        const dir = params.sort === "asc" ? 1 : -1;
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
      const { rows: paged, meta } = paginate(rows, params);
      return { sessions: paged, meta };
    }),

  create: (input: CreateSessionInput) =>
    request("POST", "/sessions", () => {
      const { user } = requireSession();
      if (input.wpm < 0 || input.wpm > 300) validationError("WPM out of range");
      if (input.accuracy < 0 || input.accuracy > 100) validationError("Accuracy out of range");

      const now = new Date().toISOString();
      const session: Session = {
        id: generateId("s"),
        userId: user.id,
        passageId: input.passageId,
        wpm: Math.round(input.wpm),
        accuracy: Math.round(input.accuracy * 10) / 10,
        duration: input.duration,
        correctChars: input.correctChars,
        errorChars: input.errorChars ?? 0,
        createdAt: now,
      };
      db.insert("sessions", session);

      // Update leaderboard entry if this is a personal best
      return session;
    }),

  delete: (id: string) =>
    request("DELETE", `/sessions/${id}`, () => {
      const { user } = requireSession();
      const existing = db.find("sessions", (s) => s.id === id);
      if (!existing) notFound("Session");
      if (existing!.userId !== user.id) unauthorized("You can only delete your own sessions");
      db.delete("sessions", (s) => s.id === id);
      return { id, deleted: true };
    }),

  stats: () =>
    request("GET", "/sessions/stats", () => {
      const { user } = requireSession();
      const rows = db.table("sessions")
        .filter((s) => s.userId === user.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (rows.length === 0) {
        return { bestWpm: 0, avgWpm: 0, avgAccuracy: 0, count: 0, series: [] as number[] };
      }

      const wpms = rows.map((s) => s.wpm);
      const accs = rows.map((s) => s.accuracy);
      const bestWpm = Math.max(...wpms);
      const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
      const avgAccuracy = Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10;
      const series = wpms.slice(-15);

      return { bestWpm, avgWpm, avgAccuracy, count: rows.length, series };
    }),
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardScope = "global" | "weekly" | "monthly" | "friends";

export const leaderboardController = {
  list: (scope: LeaderboardScope = "global") =>
    request("GET", `/leaderboard?scope=${scope}`, () => {
      const session = authController.getSession();

      // Determine which user IDs to include
      let allowedUserIds: Set<string> | null = null;

      if (scope === "friends") {
        if (!session) return [];
        const myId = session.user.id;
        const friends = db.table("friendships").filter(
          (f) =>
            f.status === "accepted" &&
            (f.userId === myId || f.friendId === myId),
        );
        allowedUserIds = new Set([
          myId,
          ...friends.map((f) => (f.userId === myId ? f.friendId : f.userId)),
        ]);
      }

      let allSessions = db.table("sessions");

      if (scope === "weekly") {
        const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
        allSessions = allSessions.filter((s) => s.createdAt >= cutoff);
      } else if (scope === "monthly") {
        const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
        allSessions = allSessions.filter((s) => s.createdAt >= cutoff);
      }

      if (allowedUserIds) {
        allSessions = allSessions.filter((s) => allowedUserIds!.has(s.userId));
      }

      // Best session per user
      const bestPerUser = new Map<string, Session>();
      for (const s of allSessions) {
        const existing = bestPerUser.get(s.userId);
        if (!existing || s.wpm > existing.wpm) bestPerUser.set(s.userId, s);
      }

      // Attach profile info and rank
      const entries = Array.from(bestPerUser.values())
        .sort((a, b) => b.wpm - a.wpm)
        .map((s, i) => {
          const profile = db.find("profiles", (p) => p.id === s.userId);
          return {
            id: s.id,
            userId: s.userId,
            username: profile?.username ?? "anonymous",
            name: profile?.name ?? "",
            wpm: s.wpm,
            accuracy: s.accuracy,
            date: s.createdAt,
            rank: i + 1,
            isMe: session?.user.id === s.userId,
          };
        });

      return entries;
    }),
};

// ─── Lessons ──────────────────────────────────────────────────────────────────

export const lessonsController = {
  list: () =>
    request("GET", "/lessons", () => {
      const session = authController.getSession();
      const lessons = db.table("lessons").sort((a, b) => a.order - b.order);

      if (!session) return lessons.map((l) => ({ ...l, completed: false, bestWpm: null }));

      const progress = db.table("lessonProgress").filter((lp) => lp.userId === session.user.id);
      const progressMap = new Map(progress.map((lp) => [lp.lessonId, lp]));

      return lessons.map((l) => ({
        ...l,
        completed: progressMap.has(l.id),
        bestWpm: progressMap.get(l.id)?.bestWpm ?? null,
      }));
    }),

  get: (id: string) =>
    request("GET", `/lessons/${id}`, () => {
      const l = db.find("lessons", (x) => x.id === id);
      if (!l) notFound("Lesson");
      return l!;
    }),

  complete: (lessonId: string, wpm: number) =>
    request("POST", `/lessons/${lessonId}/complete`, () => {
      const { user } = requireSession();
      const lesson = db.find("lessons", (l) => l.id === lessonId);
      if (!lesson) notFound("Lesson");

      const existing = db.find(
        "lessonProgress",
        (lp) => lp.userId === user.id && lp.lessonId === lessonId,
      );

      if (existing) {
        // Update if new personal best
        if (wpm > existing.bestWpm) {
          db.update(
            "lessonProgress",
            (lp) => lp.userId === user.id && lp.lessonId === lessonId,
            (lp) => ({ ...lp, bestWpm: wpm }),
          );
        }
      } else {
        db.insert("lessonProgress", {
          userId: user.id,
          lessonId,
          completedAt: new Date().toISOString(),
          bestWpm: wpm,
        });
      }

      return { lessonId, completed: true };
    }),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profilesController = {
  me: () =>
    request("GET", "/profiles/me", () => {
      const { user } = requireSession();
      const profile = db.find("profiles", (p) => p.id === user.id);
      if (!profile) notFound("Profile");

      const sessions = db.table("sessions").filter((s) => s.userId === user.id);
      const wpms = sessions.map((s) => s.wpm);
      const accs = sessions.map((s) => s.accuracy);
      const bestWpm = wpms.length ? Math.max(...wpms) : 0;
      const avgWpm = wpms.length ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : 0;
      const avgAccuracy = accs.length
        ? Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10
        : 0;

      // Rank — position on global leaderboard
      const allBest = new Map<string, number>();
      for (const s of db.table("sessions")) {
        const cur = allBest.get(s.userId) ?? 0;
        if (s.wpm > cur) allBest.set(s.userId, s.wpm);
      }
      const sorted = Array.from(allBest.entries()).sort((a, b) => b[1] - a[1]);
      const rankIdx = sorted.findIndex(([uid]) => uid === user.id);
      const rank = rankIdx >= 0 ? rankIdx + 1 : null;

      const progress = db.table("lessonProgress").filter((lp) => lp.userId === user.id);

      return {
        id: profile!.id,
        name: profile!.name,
        username: profile!.username,
        avatarUrl: profile!.avatarUrl,
        bio: profile!.bio,
        joined_at: profile!.joined_at,
        streakDays: profile!.streakDays,
        totalLessons: profile!.totalLessons,
        lessonsCompleted: progress.length,
        bestWpm,
        avgWpm,
        avgAccuracy,
        testsCompleted: sessions.length,
        rank,
        email: user.email,
      };
    }),

  update: (patch: Partial<{ name: string; username: string; bio: string }>) =>
    request("PUT", "/profiles/me", () => {
      const { user } = requireSession();

      if (patch.username) {
        if (!/^[a-z0-9_.]+$/i.test(patch.username)) validationError("Invalid username format");
        const taken = db.find(
          "profiles",
          (p) => p.username === patch.username!.toLowerCase() && p.id !== user.id,
        );
        if (taken) conflict("Username is already taken");
        patch.username = patch.username.toLowerCase();
      }

      db.update(
        "profiles",
        (p) => p.id === user.id,
        (p) => ({ ...p, ...patch }),
      );

      return db.find("profiles", (p) => p.id === user.id)!;
    }),

  get: (id: string) =>
    request("GET", `/profiles/${id}`, () => {
      const profile = db.find("profiles", (p) => p.id === id);
      if (!profile) notFound("Profile");
      return profile!;
    }),

  search: (query: string, page = 1) =>
    request("GET", `/profiles/search?q=${query}`, () => {
      const q = query.trim().toLowerCase();
      if (!q) return { profiles: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };

      const rows = db
        .table("profiles")
        .filter(
          (p) => p.username.includes(q) || p.name.toLowerCase().includes(q),
        );

      const { rows: paged, meta } = paginate(rows, { page, pageSize: 20 });
      return { profiles: paged, meta };
    }),
};

// ─── Friends ──────────────────────────────────────────────────────────────────

export const friendsController = {
  list: () =>
    request("GET", "/friends", () => {
      const { user } = requireSession();
      const friendships = db.table("friendships").filter(
        (f) =>
          f.status === "accepted" &&
          (f.userId === user.id || f.friendId === user.id),
      );

      return friendships.map((f) => {
        const friendId = f.userId === user.id ? f.friendId : f.userId;
        const profile = db.find("profiles", (p) => p.id === friendId);
        return {
          friendshipId: f.id,
          id: friendId,
          name: profile?.name ?? "Unknown",
          username: profile?.username ?? "unknown",
          joined_at: profile?.joined_at ?? "",
          status: f.status,
          since: f.createdAt,
        };
      });
    }),

  pendingIncoming: () =>
    request("GET", "/friends/pending", () => {
      const { user } = requireSession();
      return db.table("friendships")
        .filter((f) => f.friendId === user.id && f.status === "pending")
        .map((f) => {
          const profile = db.find("profiles", (p) => p.id === f.userId);
          return {
            friendshipId: f.id,
            id: f.userId,
            name: profile?.name ?? "Unknown",
            username: profile?.username ?? "unknown",
          };
        });
    }),

  send: (targetId: string) =>
    request("POST", "/friends", () => {
      const { user } = requireSession();

      if (user.id === targetId) validationError("You cannot add yourself");

      const target = db.find("profiles", (p) => p.id === targetId);
      if (!target) notFound("User");

      const existing = db.find(
        "friendships",
        (f) =>
          (f.userId === user.id && f.friendId === targetId) ||
          (f.userId === targetId && f.friendId === user.id),
      );
      if (existing) conflict("Friend request already exists or you are already friends");

      const now = new Date().toISOString();
      const friendship = {
        id: generateId("fr"),
        userId: user.id,
        friendId: targetId,
        status: "accepted" as const, // instant accept in mock
        createdAt: now,
      };
      db.insert("friendships", friendship);

      // Create notification for target
      const myProfile = db.find("profiles", (p) => p.id === user.id);
      db.insert("notifications", {
        id: generateId("n"),
        userId: targetId,
        type: "friend_request",
        title: "New friend request",
        body: `${myProfile?.name ?? user.email} wants to connect with you.`,
        read: false,
        createdAt: now,
        data: { fromUserId: user.id, fromUsername: myProfile?.username ?? "" },
      });

      return friendship;
    }),

  accept: (friendshipId: string) =>
    request("PATCH", `/friends/${friendshipId}`, () => {
      const { user } = requireSession();
      const friendship = db.find("friendships", (f) => f.id === friendshipId);
      if (!friendship) notFound("Friend request");
      if (friendship!.friendId !== user.id) unauthorized("Not your friend request");

     db.update(
      "friendships",
      (f) => f.id === friendshipId,
      (f) => ({ ...f, status: "accepted" as const }),  // 👈 add "as const"
    );

      return { friendshipId, accepted: true };
    }),

  remove: (friendId: string) =>
    request("DELETE", `/friends/${friendId}`, () => {
      const { user } = requireSession();
      const existing = db.find(
        "friendships",
        (f) =>
          (f.userId === user.id && f.friendId === friendId) ||
          (f.userId === friendId && f.friendId === user.id),
      );
      if (!existing) notFound("Friendship");

      db.delete(
        "friendships",
        (f) =>
          (f.userId === user.id && f.friendId === friendId) ||
          (f.userId === friendId && f.friendId === user.id),
      );

      return { friendId, removed: true };
    }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsController = {
  list: (params: PaginationParams = {}) =>
    request("GET", "/notifications", () => {
      const { user } = requireSession();
      const rows = db
        .table("notifications")
        .filter((n) => n.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const { rows: paged, meta } = paginate(rows, { pageSize: 20, ...params });
      const unreadCount = rows.filter((n) => !n.read).length;
      return { notifications: paged, meta, unreadCount };
    }),

  markRead: (id: string) =>
    request("PATCH", `/notifications/${id}`, () => {
      const { user } = requireSession();
      const n = db.find("notifications", (x) => x.id === id);
      if (!n) notFound("Notification");
      if (n!.userId !== user.id) unauthorized();

      db.update(
        "notifications",
        (x) => x.id === id,
        (x) => ({ ...x, read: true }),
      );
      return { id, read: true };
    }),

  markAllRead: () =>
    request("POST", "/notifications/read-all", () => {
      const { user } = requireSession();
      db.update(
        "notifications",
        (n) => n.userId === user.id && !n.read,
        (n) => ({ ...n, read: true }),
      );
      return { ok: true };
    }),
};