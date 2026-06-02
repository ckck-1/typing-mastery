import api from "@/lib/api";

export type Rank =
  | "Beginner"
  | "Fast Fingers"
  | "Keyboard Ninja"
  | "Speed Demon"
  | "Typing Phantom"
  | "Legendary Typist";

export type Progression = {
  userId: string;
  xp: number;
  level: number;
  rank: Rank;
  totalWords: number;
  bestCombo: number;
  bestArcadeScore: number;
  achievements: string[];
  updatedAt: string;
};

export type XpAward = {
  xpGained: number;
  before: Progression;
  after: Progression;
  leveledUp: boolean;
  newAchievements: string[];
};

const RANKS: { min: number; name: Rank }[] = [
  { min: 0,  name: "Beginner" },
  { min: 5,  name: "Fast Fingers" },
  { min: 12, name: "Keyboard Ninja" },
  { min: 22, name: "Speed Demon" },
  { min: 35, name: "Typing Phantom" },
  { min: 55, name: "Legendary Typist" },
];

export const xpForLevel = (lvl: number) => Math.round(80 * Math.pow(lvl, 1.35));
export const levelFromXp = (xp: number) => {
  let l = 1;
  while (xp >= xpForLevel(l + 1)) l++;
  return l;
};
export const rankFromLevel = (lvl: number): Rank => {
  let r: Rank = "Beginner";
  for (const tier of RANKS) if (lvl >= tier.min) r = tier.name;
  return r;
};
export const xpProgress = (xp: number) => {
  const lvl = levelFromXp(xp);
  const base = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  return {
    level: lvl,
    rank: rankFromLevel(lvl),
    intoLevel: xp - base,
    needed: next - base,
    pct: Math.min(100, Math.round(((xp - base) / (next - base)) * 100)),
  };
};

const KEY = (uid: string) => `typing-academy.progression.${uid}`;

function load(userId: string): Progression {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (raw) return JSON.parse(raw) as Progression;
  } catch {}
  return {
    userId, xp: 0, level: 1, rank: "Beginner",
    totalWords: 0, bestCombo: 0, bestArcadeScore: 0,
    achievements: [], updatedAt: new Date().toISOString(),
  };
}

function save(p: Progression) {
  try { localStorage.setItem(KEY(p.userId), JSON.stringify(p)); } catch {}
}

const ACHIEVEMENTS: { id: string; label: string; check: (p: Progression) => boolean }[] = [
  { id: "first_steps",  label: "First Steps",  check: (p) => p.totalWords >= 1 },
  { id: "century",      label: "Century",      check: (p) => p.totalWords >= 100 },
  { id: "kilo",         label: "Kilotypist",   check: (p) => p.totalWords >= 1000 },
  { id: "combo_10",     label: "On Fire",      check: (p) => p.bestCombo >= 10 },
  { id: "combo_25",     label: "Unstoppable",  check: (p) => p.bestCombo >= 25 },
  { id: "arcade_500",   label: "Arcade Hero",  check: (p) => p.bestArcadeScore >= 500 },
  { id: "level_5",      label: "Rising Talent",check: (p) => p.level >= 5 },
  { id: "level_10",     label: "Veteran",      check: (p) => p.level >= 10 },
];

export const progressionService = {
  async get(): Promise<Progression> {
    const res = await api.get("/profile/me");
    const id = res.data.id;
    // We still use local storage for progression as the backend doesn't seem to have XP yet
    return load(id);
  },

  async award(input: {
    xp: number;
    words?: number;
    combo?: number;
    arcadeScore?: number;
  }): Promise<XpAward> {
    const res = await api.get("/profile/me");
    const id = res.data.id;
    const before = load(id);
    const after: Progression = {
        ...before,
        xp: before.xp + Math.max(0, Math.round(input.xp)),
        totalWords: before.totalWords + (input.words ?? 0),
        bestCombo: Math.max(before.bestCombo, input.combo ?? 0),
        bestArcadeScore: Math.max(before.bestArcadeScore, input.arcadeScore ?? 0),
        updatedAt: new Date().toISOString(),
    };
    after.level = levelFromXp(after.xp);
    after.rank = rankFromLevel(after.level);
    const earned = ACHIEVEMENTS.filter(
        (a) => a.check(after) && !before.achievements.includes(a.id),
    ).map((a) => a.id);
    after.achievements = [...before.achievements, ...earned];
    save(after);
    return {
        xpGained: after.xp - before.xp,
        before, after,
        leveledUp: after.level > before.level,
        newAchievements: earned,
    };
  },

  achievementLabel(id: string) {
    return ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id;
  },
};
