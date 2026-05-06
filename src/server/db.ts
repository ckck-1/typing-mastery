// Mock in-memory "database". Persists to localStorage so it survives reloads
// like a real backend would. Replace this entire file with a real DB driver
// (Postgres, Supabase, etc.) when migrating off mocks — services depend only
// on the exported async helpers, never on this object directly.

export type Passage = {
  id: string;
  title: string;
  category: "literature" | "code" | "endurance" | "drill";
  text: string;
};

export type Session = {
  id: string;
  userId: string;
  passageId: string;
  wpm: number;
  accuracy: number;
  duration: number;
  correctChars: number;
  createdAt: string;
};

export type LeaderboardEntry = {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  date: string;
};

export type Lesson = {
  id: string;
  order: number;
  title: string;
  text: string;
  keys: string[];
};

export type Profile = {
  id: string;
  name: string;
  username: string;
  joinedAt: string;
  bestWpm: number;
  avgWpm: number;
  accuracy: number;
  testsCompleted: number;
  lessonsCompleted: number;
  totalLessons: number;
  rank: number;
  streakDays: number;
};

type Schema = {
  passages: Passage[];
  sessions: Session[];
  leaderboard: LeaderboardEntry[];
  lessons: Lesson[];
  profile: Profile;
};

const SEED: Schema = {
  passages: [
    {
      id: "p_lit_01",
      title: "On Discipline",
      category: "literature",
      text: "The discipline of typing is not measured in speed alone, but in the quiet consistency of every keystroke. A practiced hand moves with intent, never with hurry, and finds rhythm in the steady cadence of thought becoming text.",
    },
    {
      id: "p_lit_02",
      title: "The Quiet Mind",
      category: "literature",
      text: "The quieter you become, the more you are able to hear. Practice is the slow road from rough to refined, and the page rewards those who arrive without urgency.",
    },
    {
      id: "p_code_01",
      title: "Functional Drill",
      category: "code",
      text: "const sum = (a, b) => a + b; const map = (xs, f) => xs.map(f); export default { sum, map };",
    },
    {
      id: "p_end_01",
      title: "Endurance — Foundations",
      category: "endurance",
      text: "Begin slowly. Each finger returns home. The keys F and J carry small ridges that anchor the hands. Reach upward with intent, downward with restraint, and trust that speed will follow accuracy.",
    },
  ],
  sessions: [
    { id: "s_001", userId: "u_me", passageId: "p_lit_01", wpm: 78, accuracy: 98, duration: 60, correctChars: 390, createdAt: "2026-05-06T09:14:00Z" },
    { id: "s_002", userId: "u_me", passageId: "p_code_01", wpm: 71, accuracy: 96, duration: 30, correctChars: 178, createdAt: "2026-05-05T21:03:00Z" },
    { id: "s_003", userId: "u_me", passageId: "p_lit_02", wpm: 74, accuracy: 97, duration: 60, correctChars: 370, createdAt: "2026-05-05T20:45:00Z" },
    { id: "s_004", userId: "u_me", passageId: "p_end_01", wpm: 69, accuracy: 95, duration: 120, correctChars: 690, createdAt: "2026-05-03T19:20:00Z" },
    { id: "s_005", userId: "u_me", passageId: "p_lit_01", wpm: 82, accuracy: 99, duration: 60, correctChars: 410, createdAt: "2026-03-18T11:00:00Z" },
  ],
  leaderboard: [
    { id: "l_01", username: "haruki.t", wpm: 142, accuracy: 99.1, date: "2026-05-05" },
    { id: "l_02", username: "elena.v", wpm: 138, accuracy: 98.7, date: "2026-05-04" },
    { id: "l_03", username: "noor.k", wpm: 134, accuracy: 98.4, date: "2026-05-06" },
    { id: "l_04", username: "marcus.l", wpm: 128, accuracy: 97.9, date: "2026-05-03" },
    { id: "l_05", username: "ines.r", wpm: 124, accuracy: 98.2, date: "2026-05-06" },
    { id: "l_06", username: "yuki.s", wpm: 121, accuracy: 97.5, date: "2026-05-02" },
    { id: "l_07", username: "david.c", wpm: 119, accuracy: 96.8, date: "2026-05-05" },
    { id: "l_08", username: "anya.p", wpm: 116, accuracy: 97.2, date: "2026-05-01" },
    { id: "l_09", username: "tomas.b", wpm: 114, accuracy: 96.4, date: "2026-04-30" },
    { id: "l_10", username: "lena.k", wpm: 112, accuracy: 96.9, date: "2026-04-29" },
  ],
  lessons: [
    { id: "ch_01", order: 1, title: "Chapter I — Home Row", text: "Begin with the home row: A, S, D, F for the left hand, and J, K, L, ; for the right. Rest your fingers lightly. The keys F and J carry small ridges — your anchors.", keys: ["A","S","D","F","J","K","L"] },
    { id: "ch_02", order: 2, title: "Chapter II — Top Row", text: "Reach upward with intent. Each finger ascends to its assigned key and returns home. Practice slowly; speed will follow accuracy.", keys: ["Q","W","E","R","U","I","O","P"] },
    { id: "ch_03", order: 3, title: "Chapter III — Bottom Row", text: "The bottom row demands restraint. Curl your fingers gently and strike with the pads, not the tips.", keys: ["Z","X","C","V","N","M"] },
  ],
  profile: {
    id: "u_me",
    name: "Adrian Hale",
    username: "adrian.h",
    joinedAt: "2026-02-12",
    bestWpm: 82,
    avgWpm: 71,
    accuracy: 97.4,
    testsCompleted: 248,
    lessonsCompleted: 14,
    totalLessons: 24,
    rank: 142,
    streakDays: 12,
  },
};

const KEY = "typing-academy.db.v1";

function load(): Schema {
  if (typeof window === "undefined") return structuredClone(SEED);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(SEED);
    return JSON.parse(raw) as Schema;
  } catch {
    return structuredClone(SEED);
  }
}

let state: Schema = load();

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors — mock store is best-effort
  }
}

export const db = {
  read<K extends keyof Schema>(key: K): Schema[K] {
    return structuredClone(state[key]);
  },
  write<K extends keyof Schema>(key: K, value: Schema[K]) {
    state[key] = value;
    persist();
  },
  reset() {
    state = structuredClone(SEED);
    persist();
  },
};
