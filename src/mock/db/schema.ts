/**
 * mock/db/schema.ts
 *
 * Central localStorage-backed in-memory store.
 * Mirrors a real PostgreSQL schema (users, profiles, sessions, passages,
 * lessons, friendships, notifications) so that migrating to a real DB is
 * purely a service-layer swap — no component changes required.
 *
 * Data is versioned: bumping DB_VERSION resets to seed data automatically.
 */

import { generateId } from "../utils/id";

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  passwordHash: string; // bcrypt-style hash (simulated)
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  role: UserRole;
};

export type Profile = {
  id: string;          // FK → User.id
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  joined_at: string;
  streakDays: number;
  totalLessons: number;
  lessonsCompleted: number;
};

export type PassageCategory = "literature" | "code" | "endurance" | "drill" | "quote";

export type Passage = {
  id: string;
  title: string;
  category: PassageCategory;
  text: string;
  author: string | null;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  passageId: string;
  wpm: number;
  accuracy: number;
  duration: number;       // seconds
  correctChars: number;
  errorChars: number;
  createdAt: string;
};

export type Lesson = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  text: string;
  keys: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
};

export type LessonProgress = {
  userId: string;
  lessonId: string;
  completedAt: string;
  bestWpm: number;
};

export type FriendshipStatus = "pending" | "accepted";

export type Friendship = {
  id: string;
  userId: string;        // initiator
  friendId: string;      // target
  status: FriendshipStatus;
  createdAt: string;
};

export type NotificationType = "friend_request" | "score_beaten" | "system";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: Record<string, unknown>;
};

export type AuthToken = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type Schema = {
  _version: number;
  users: User[];
  profiles: Profile[];
  passages: Passage[];
  sessions: Session[];
  lessons: Lesson[];
  lessonProgress: LessonProgress[];
  friendships: Friendship[];
  notifications: Notification[];
  authTokens: AuthToken[];
};

// ─── Seed data ───────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();
const DAY = 86_400_000;

function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY).toISOString();
}

// Simulated hash — real bcrypt is not available in-browser; we store a
// deterministic sentinel so the mock auth can verify passwords.
function mockHash(password: string) {
  return `$mock$${btoa(password)}`;
}

// Demo accounts
const DEMO_USER_ID = "u_demo_01";
const DEMO_FRIEND_1 = "u_demo_02";
const DEMO_FRIEND_2 = "u_demo_03";
const DEMO_FRIEND_3 = "u_demo_04";

const LEADERBOARD_USERS = [
  { id: "u_lb_01", email: "haruki@example.com", name: "Haruki T.", username: "haruki.t" },
  { id: "u_lb_02", email: "elena@example.com",  name: "Elena V.",  username: "elena.v"  },
  { id: "u_lb_03", email: "noor@example.com",   name: "Noor K.",   username: "noor.k"   },
  { id: "u_lb_04", email: "marcus@example.com", name: "Marcus L.", username: "marcus.l" },
  { id: "u_lb_05", email: "ines@example.com",   name: "Inès R.",   username: "ines.r"   },
  { id: "u_lb_06", email: "yuki@example.com",   name: "Yuki S.",   username: "yuki.s"   },
  { id: "u_lb_07", email: "david@example.com",  name: "David C.",  username: "david.c"  },
  { id: "u_lb_08", email: "anya@example.com",   name: "Anya P.",   username: "anya.p"   },
  { id: "u_lb_09", email: "tomas@example.com",  name: "Tomáš B.",  username: "tomas.b"  },
  { id: "u_lb_10", email: "lena@example.com",   name: "Lena K.",   username: "lena.k"   },
];

function buildSeed(): Schema {
  const passages: Passage[] = [
    {
      id: "p_lit_01", title: "On Discipline", category: "literature",
      text: "The discipline of typing is not measured in speed alone, but in the quiet consistency of every keystroke. A practiced hand moves with intent, never with hurry, and finds rhythm in the steady cadence of thought becoming text.",
      author: null, difficulty: "easy", createdAt: daysAgo(90), updatedAt: daysAgo(90),
    },
    {
      id: "p_lit_02", title: "The Quiet Mind", category: "literature",
      text: "The quieter you become, the more you are able to hear. Practice is the slow road from rough to refined, and the page rewards those who arrive without urgency.",
      author: null, difficulty: "easy", createdAt: daysAgo(88), updatedAt: daysAgo(88),
    },
    {
      id: "p_lit_03", title: "On Patience", category: "literature",
      text: "Patience is not the absence of action; rather it is timing. It waits for the right moment to act, for the right keys to fall beneath practiced fingers. The typist who waits for understanding before speed will always outpace the one who races blindly forward.",
      author: null, difficulty: "medium", createdAt: daysAgo(80), updatedAt: daysAgo(80),
    },
    {
      id: "p_code_01", title: "Functional Drill", category: "code",
      text: "const sum = (a, b) => a + b; const map = (xs, f) => xs.map(f); export default { sum, map };",
      author: null, difficulty: "medium", createdAt: daysAgo(70), updatedAt: daysAgo(70),
    },
    {
      id: "p_code_02", title: "Async / Await", category: "code",
      text: "async function fetchUser(id) { const res = await fetch(`/api/users/${id}`); if (!res.ok) throw new Error(res.statusText); return res.json(); }",
      author: null, difficulty: "hard", createdAt: daysAgo(65), updatedAt: daysAgo(65),
    },
    {
      id: "p_end_01", title: "Endurance — Foundations", category: "endurance",
      text: "Begin slowly. Each finger returns home. The keys F and J carry small ridges that anchor the hands. Reach upward with intent, downward with restraint, and trust that speed will follow accuracy.",
      author: null, difficulty: "easy", createdAt: daysAgo(60), updatedAt: daysAgo(60),
    },
    {
      id: "p_end_02", title: "Endurance — The Long Road", category: "endurance",
      text: "Consistency is the engine of mastery. Sit straight. Breathe. Let each finger find its home, and then, only then, begin. There is no shortcut to fluency — only the slow accumulation of correct repetitions, one after another, day after day.",
      author: null, difficulty: "medium", createdAt: daysAgo(55), updatedAt: daysAgo(55),
    },
    {
      id: "p_drill_01", title: "Home Row Drill", category: "drill",
      text: "asdf jkl; asdf jkl; asdfjkl; asdf jkl; fads jkl; fjdk slak asld fjkl",
      author: null, difficulty: "easy", createdAt: daysAgo(50), updatedAt: daysAgo(50),
    },
    {
      id: "p_quote_01", title: "Type the World", category: "quote",
      text: "The most important thing about a technology is how it changes people.",
      author: "Jaron Lanier", difficulty: "easy", createdAt: daysAgo(40), updatedAt: daysAgo(40),
    },
    {
      id: "p_quote_02", title: "Simple is Hard", category: "quote",
      text: "Simplicity is the ultimate sophistication. It takes a week to make something simple, and an afternoon to make it complicated.",
      author: "Clare Boothe Luce", difficulty: "medium", createdAt: daysAgo(30), updatedAt: daysAgo(30),
    },
  ];

  const lessons: Lesson[] = [
    {
      id: "ch_01", order: 1, title: "Chapter I — Home Row", subtitle: "Your keyboard foundation",
      text: "Begin with the home row: A, S, D, F for the left hand, and J, K, L, ; for the right. Rest your fingers lightly. The keys F and J carry small ridges — your anchors.",
      keys: ["A","S","D","F","J","K","L",";"], difficulty: "beginner",
    },
    {
      id: "ch_02", order: 2, title: "Chapter II — Top Row", subtitle: "Reaching upward",
      text: "Reach upward with intent. Each finger ascends to its assigned key and returns home. Practice slowly; speed will follow accuracy.",
      keys: ["Q","W","E","R","U","I","O","P"], difficulty: "beginner",
    },
    {
      id: "ch_03", order: 3, title: "Chapter III — Bottom Row", subtitle: "Curling downward",
      text: "The bottom row demands restraint. Curl your fingers gently and strike with the pads, not the tips.",
      keys: ["Z","X","C","V","N","M"], difficulty: "beginner",
    },
    {
      id: "ch_04", order: 4, title: "Chapter IV — Numbers & Symbols", subtitle: "Beyond letters",
      text: "Numbers require a confident reach. The top-row numerals follow naturally from the QWERTY row. Keep your wrists still and let only the fingers move.",
      keys: ["1","2","3","4","5","6","7","8","9","0"], difficulty: "intermediate",
    },
    {
      id: "ch_05", order: 5, title: "Chapter V — Capital Letters", subtitle: "Shift and strike",
      text: "Capitals demand coordination. The opposite hand's pinky depresses Shift while the striking finger hits its key. Practice the cross-hand coordination until it becomes automatic.",
      keys: ["SHIFT"], difficulty: "intermediate",
    },
    {
      id: "ch_06", order: 6, title: "Chapter VI — Punctuation", subtitle: "The fine details",
      text: "Punctuation separates the fluent typist from the merely fast one. Commas, periods, apostrophes, and hyphens complete the written word.",
      keys: [",",".",";","'","-","/"], difficulty: "intermediate",
    },
    {
      id: "ch_07", order: 7, title: "Chapter VII — Speed Drills", subtitle: "Controlled acceleration",
      text: "Now that each key is known, we build speed through repetition of common digrams and trigrams. Type with confidence. Return home after every reach.",
      keys: ["ALL"], difficulty: "advanced",
    },
  ];

  const users: User[] = [
    {
      id: DEMO_USER_ID, email: "demo@typingacademy.dev",
      passwordHash: mockHash("demo1234"),
      createdAt: daysAgo(85), updatedAt: NOW,
      emailVerified: true, role: "user",
    },
    {
      id: DEMO_FRIEND_1, email: "haruki@example.com",
      passwordHash: mockHash("password"),
      createdAt: daysAgo(120), updatedAt: NOW,
      emailVerified: true, role: "user",
    },
    {
      id: DEMO_FRIEND_2, email: "elena@example.com",
      passwordHash: mockHash("password"),
      createdAt: daysAgo(100), updatedAt: NOW,
      emailVerified: true, role: "user",
    },
    {
      id: DEMO_FRIEND_3, email: "noor@example.com",
      passwordHash: mockHash("password"),
      createdAt: daysAgo(90), updatedAt: NOW,
      emailVerified: true, role: "user",
    },
    ...LEADERBOARD_USERS.slice(3).map((u) => ({
      id: u.id, email: u.email,
      passwordHash: mockHash("password"),
      createdAt: daysAgo(Math.floor(Math.random() * 120 + 30)), updatedAt: NOW,
      emailVerified: true, role: "user" as UserRole,
    })),
  ];

  const profiles: Profile[] = [
    {
      id: DEMO_USER_ID, name: "Adrian Hale", username: "adrian.h",
      avatarUrl: null, bio: "Typing enthusiast, software developer.",
      joined_at: daysAgo(85),
      streakDays: 12, totalLessons: 7, lessonsCompleted: 3,
    },
    {
      id: DEMO_FRIEND_1, name: "Haruki T.", username: "haruki.t",
      avatarUrl: null, bio: null,
      joined_at: daysAgo(120),
      streakDays: 30, totalLessons: 7, lessonsCompleted: 7,
    },
    {
      id: DEMO_FRIEND_2, name: "Elena V.", username: "elena.v",
      avatarUrl: null, bio: null,
      joined_at: daysAgo(100),
      streakDays: 18, totalLessons: 7, lessonsCompleted: 6,
    },
    {
      id: DEMO_FRIEND_3, name: "Noor K.", username: "noor.k",
      avatarUrl: null, bio: null,
      joined_at: daysAgo(90),
      streakDays: 7, totalLessons: 7, lessonsCompleted: 5,
    },
    ...LEADERBOARD_USERS.slice(3).map((u) => ({
      id: u.id, name: u.name, username: u.username,
      avatarUrl: null, bio: null,
      joined_at: daysAgo(Math.floor(Math.random() * 90 + 20)),
      streakDays: Math.floor(Math.random() * 20),
      totalLessons: 7, lessonsCompleted: Math.floor(Math.random() * 7),
    })),
  ];

  // Demo user sessions
  const demoSessions: Session[] = [
    { id: "s_001", userId: DEMO_USER_ID, passageId: "p_lit_01", wpm: 78, accuracy: 98,   duration: 60,  correctChars: 390, errorChars: 4, createdAt: daysAgo(1)  },
    { id: "s_002", userId: DEMO_USER_ID, passageId: "p_code_01", wpm: 71, accuracy: 96,  duration: 30,  correctChars: 178, errorChars: 6, createdAt: daysAgo(2)  },
    { id: "s_003", userId: DEMO_USER_ID, passageId: "p_lit_02", wpm: 74, accuracy: 97,   duration: 60,  correctChars: 370, errorChars: 5, createdAt: daysAgo(3)  },
    { id: "s_004", userId: DEMO_USER_ID, passageId: "p_end_01", wpm: 69, accuracy: 95,   duration: 120, correctChars: 690, errorChars: 12, createdAt: daysAgo(4) },
    { id: "s_005", userId: DEMO_USER_ID, passageId: "p_lit_01", wpm: 82, accuracy: 99,   duration: 60,  correctChars: 410, errorChars: 2, createdAt: daysAgo(7)  },
    { id: "s_006", userId: DEMO_USER_ID, passageId: "p_lit_03", wpm: 75, accuracy: 97,   duration: 75,  correctChars: 375, errorChars: 5, createdAt: daysAgo(10) },
    { id: "s_007", userId: DEMO_USER_ID, passageId: "p_quote_01", wpm: 80, accuracy: 98, duration: 45,  correctChars: 240, errorChars: 3, createdAt: daysAgo(14) },
    { id: "s_008", userId: DEMO_USER_ID, passageId: "p_end_02", wpm: 73, accuracy: 96,   duration: 90,  correctChars: 438, errorChars: 8, createdAt: daysAgo(21) },
  ];

  // Leaderboard user sessions — generate realistic data
  function lbSessions(userId: string, baseWpm: number, count: number): Session[] {
    return Array.from({ length: count }, (_, i) => ({
      id: generateId("s"),
      userId,
      passageId: passages[Math.floor(Math.random() * passages.length)].id,
      wpm: Math.round(baseWpm + (Math.random() - 0.5) * 15),
      accuracy: Math.round((96 + Math.random() * 4) * 10) / 10,
      duration: [30, 60, 120][Math.floor(Math.random() * 3)],
      correctChars: Math.round(baseWpm * 5),
      errorChars: Math.floor(Math.random() * 5),
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
    }));
  }

  const lbWpms: Record<string, number> = {
    u_demo_01: 82, u_demo_02: 142, u_demo_03: 138, u_demo_04: 134,
    u_lb_04: 128, u_lb_05: 124, u_lb_06: 121, u_lb_07: 119,
    u_lb_08: 116, u_lb_09: 114, u_lb_10: 112,
  };

  const allSessions: Session[] = [
    ...demoSessions,
    ...Object.entries(lbWpms).flatMap(([uid, wpm]) =>
      uid !== DEMO_USER_ID ? lbSessions(uid, wpm, 5 + Math.floor(Math.random() * 10)) : []
    ),
  ];

  const friendships: Friendship[] = [
    { id: "fr_01", userId: DEMO_USER_ID, friendId: DEMO_FRIEND_1, status: "accepted", createdAt: daysAgo(60) },
    { id: "fr_02", userId: DEMO_USER_ID, friendId: DEMO_FRIEND_2, status: "accepted", createdAt: daysAgo(45) },
    // Pending from friend 3
    { id: "fr_03", userId: DEMO_FRIEND_3, friendId: DEMO_USER_ID, status: "pending", createdAt: daysAgo(2) },
  ];

  const notifications: Notification[] = [
    {
      id: "n_01", userId: DEMO_USER_ID,
      type: "friend_request", title: "New friend request",
      body: "Noor K. (@noor.k) wants to connect.",
      read: false, createdAt: daysAgo(2),
      data: { fromUserId: DEMO_FRIEND_3, fromUsername: "noor.k" },
    },
    {
      id: "n_02", userId: DEMO_USER_ID,
      type: "score_beaten", title: "Score beaten",
      body: "Elena V. just posted 138 WPM — you're at 82. Step it up!",
      read: true, createdAt: daysAgo(5),
      data: { challengerUsername: "elena.v", challengerWpm: 138 },
    },
    {
      id: "n_03", userId: DEMO_USER_ID,
      type: "system", title: "Welcome to Typing Academy",
      body: "Complete your first lesson to earn your first badge.",
      read: true, createdAt: daysAgo(85),
      data: {},
    },
  ];

  return {
    _version: 2,
    users,
    profiles,
    passages,
    sessions: allSessions,
    lessons,
    lessonProgress: [],
    friendships,
    notifications,
    authTokens: [],
  };
}

// ─── Persistence layer ───────────────────────────────────────────────────────

const STORAGE_KEY = "typing-academy.mock-db.v2";

function load(): Schema {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw) as Schema;
    if (parsed._version !== 2) return buildSeed(); // schema migration
    return parsed;
  } catch {
    return buildSeed();
  }
}

let _state: Schema = load();

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch {
    console.warn("[mock-db] localStorage quota exceeded — in-memory only");
  }
}

// ─── DB API ──────────────────────────────────────────────────────────────────

export const db = {
  /** Read a full table (deep clone for immutability) */
  table<K extends keyof Omit<Schema, "_version">>(key: K): Schema[K] {
    return structuredClone(_state[key]) as Schema[K];
  },

  /** Overwrite a full table */
  writeTable<K extends keyof Omit<Schema, "_version">>(key: K, value: Schema[K]) {
    (_state as any)[key] = value;
    persist();
  },

  /** Insert a row into a table */
  insert<K extends keyof Omit<Schema, "_version">>(
    key: K,
    row: Schema[K] extends Array<infer R> ? R : never,
  ) {
    (_state[key] as unknown[]).push(row);
    persist();
  },

  /** Update rows matching predicate */
  update<K extends keyof Omit<Schema, "_version">>(
    key: K,
    predicate: (row: Schema[K] extends Array<infer R> ? R : never) => boolean,
    updater: (row: Schema[K] extends Array<infer R> ? R : never) => Schema[K] extends Array<infer R> ? R : never,
  ) {
    const table = _state[key] as unknown[];
    for (let i = 0; i < table.length; i++) {
      if (predicate(table[i] as never)) {
        table[i] = updater(table[i] as never);
      }
    }
    persist();
  },

  /** Delete rows matching predicate */
  delete<K extends keyof Omit<Schema, "_version">>(
    key: K,
    predicate: (row: Schema[K] extends Array<infer R> ? R : never) => boolean,
  ) {
    (_state as any)[key] = (_state[key] as unknown[]).filter((r) => !predicate(r as never));
    persist();
  },

  /** Find a single row */
  find<K extends keyof Omit<Schema, "_version">>(
    key: K,
    predicate: (row: Schema[K] extends Array<infer R> ? R : never) => boolean,
  ): (Schema[K] extends Array<infer R> ? R : never) | null {
    const found = (_state[key] as unknown[]).find((r) => predicate(r as never));
    return found ? structuredClone(found) as never : null;
  },

  /** Reset to seed data (useful for tests / dev reset) */
  reset() {
    _state = buildSeed();
    persist();
  },

  /** Read the raw state (for debugging) */
  dump(): Schema {
    return structuredClone(_state);
  },
};

export { mockHash };