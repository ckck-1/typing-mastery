// Maps a key (uppercase) to which finger should press it.
// Fingers: LP=left pinky, LR=left ring, LM=left middle, LI=left index,
//          RI=right index, RM=right middle, RR=right ring, RP=right pinky, T=thumb
export type Finger = "LP" | "LR" | "LM" | "LI" | "RI" | "RM" | "RR" | "RP" | "T";

export const FINGER_LABEL: Record<Finger, string> = {
  LP: "Left pinky",
  LR: "Left ring",
  LM: "Left middle",
  LI: "Left index",
  RI: "Right index",
  RM: "Right middle",
  RR: "Right ring",
  RP: "Right pinky",
  T: "Thumb",
};

const MAP: Record<string, Finger> = {
  "`": "LP", "1": "LP", q: "LP", a: "LP", z: "LP",
  "2": "LR", w: "LR", s: "LR", x: "LR",
  "3": "LM", e: "LM", d: "LM", c: "LM",
  "4": "LI", "5": "LI", r: "LI", t: "LI", f: "LI", g: "LI", v: "LI", b: "LI",
  "6": "RI", "7": "RI", y: "RI", u: "RI", h: "RI", j: "RI", n: "RI", m: "RI",
  "8": "RM", i: "RM", k: "RM", ",": "RM",
  "9": "RR", o: "RR", l: "RR", ".": "RR",
  "0": "RP", p: "RP", ";": "RP", "'": "RP", "/": "RP", "-": "RP", "=": "RP", "[": "RP", "]": "RP",
  " ": "T",
};

export function fingerFor(ch: string): Finger | null {
  if (!ch) return null;
  return MAP[ch.toLowerCase()] ?? null;
}
