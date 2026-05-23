import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { progressionService, xpProgress } from "@/services/progression.service";
import { toast } from "@/hooks/use-toast";

// ─── Word bank — short, varied, no rare punctuation ─────────────────────────
const WORD_BANK = [
  "echo","silent","aurora","cipher","forge","velvet","quartz","nimbus","candle","ember",
  "ledger","summit","mirror","glide","horizon","amber","river","piano","drift","atlas",
  "lantern","verse","syntax","kernel","fjord","compose","oblique","wander","grove","relay",
  "haven","ivory","matrix","oasis","pebble","quill","ripple","silken","tundra","vivid",
  "willow","zenith","render","cobalt","onyx","linen","prism","aspen","cedar","copper",
];

type Word = {
  id: number;
  text: string;
  typed: string;
  x: number;       // 0..100 (%)
  y: number;       // 0..100 (%) of play field
  speed: number;   // px/frame
  spawnedAt: number;
};

type GameState = "idle" | "playing" | "over";

let nextId = 1;

export default function Arcade() {
  const [state, setState] = useState<GameState>("idle");
  const [words, setWords] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; pts: number }[]>([]);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const spawnRef = useRef<number>(0);
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const stateRef = useRef(state);
  stateRef.current = state;
  const levelRef = useRef(level);
  levelRef.current = level;

  // ── Spawn / animate loop ────────────────────────────────────────────────
  useEffect(() => {
    if (state !== "playing") return;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 16.67; // normalize to 60fps frames
      last = now;
      spawnRef.current += dt;

      // Spawn interval shrinks with level
      const spawnEvery = Math.max(28, 90 - levelRef.current * 6);
      if (spawnRef.current >= spawnEvery) {
        spawnRef.current = 0;
        const text = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
        const speed = 0.18 + Math.random() * 0.12 + levelRef.current * 0.04;
        setWords((w) => [
          ...w,
          {
            id: nextId++,
            text,
            typed: "",
            x: 6 + Math.random() * 84,
            y: -6,
            speed,
            spawnedAt: now,
          },
        ]);
      }

      // Move words down
      let lostThisFrame = 0;
      setWords((prev) => {
        const next: Word[] = [];
        for (const w of prev) {
          const ny = w.y + w.speed * dt;
          if (ny >= 100) {
            lostThisFrame++;
          } else {
            next.push({ ...w, y: ny });
          }
        }
        return next;
      });

      if (lostThisFrame > 0) {
        setCombo(0);
        setShake(true);
        setTimeout(() => setShake(false), 220);
        setLives((l) => {
          const nl = l - lostThisFrame;
          if (nl <= 0) {
            endGame();
            return 0;
          }
          return nl;
        });
      }

      if (stateRef.current === "playing") {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [state]);

  // ── Level up by score thresholds ────────────────────────────────────────
  useEffect(() => {
    const nextLevel = Math.min(10, 1 + Math.floor(score / 150));
    if (nextLevel !== level) setLevel(nextLevel);
  }, [score, level]);

  // ── Input handler ───────────────────────────────────────────────────────
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state !== "playing") return;
    const val = e.target.value.toLowerCase();

    // Find a target — first word whose text startsWith val
    const all = wordsRef.current;
    const target = all
      .filter((w) => w.text.startsWith(val) && val.length > 0)
      .sort((a, b) => b.y - a.y)[0];

    if (!target) {
      // Mistype — break combo, small penalty
      setCombo(0);
      e.target.value = "";
      return;
    }

    if (val === target.text) {
      // Word completed!
      const pts = Math.max(5, target.text.length * 5) + Math.floor(combo * 1.5);
      setScore((s) => s + pts);
      setCombo((c) => {
        const nc = c + 1;
        setBestCombo((b) => Math.max(b, nc));
        return nc;
      });
      setWords((ws) => ws.filter((w) => w.id !== target.id));

      // Burst popup
      const bid = nextId++;
      setBursts((b) => [...b, { id: bid, x: target.x, y: target.y, pts }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== bid)), 700);

      e.target.value = "";
    } else {
      // Partial — update typed indicator for that word
      setWords((ws) =>
        ws.map((w) => (w.id === target.id ? { ...w, typed: val } : { ...w, typed: "" })),
      );
    }
  };

  // ── Start / end ─────────────────────────────────────────────────────────
  const startGame = () => {
    setWords([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLives(3);
    setLevel(1);
    setBursts([]);
    spawnRef.current = 0;
    setState("playing");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const endGame = async () => {
    setState("over");
    // Award XP based on score + combo
    try {
      const xpGain = Math.round(score / 4 + bestCombo * 2);
      const res = await progressionService.award({
        xp: xpGain,
        words: 0,
        combo: bestCombo,
        arcadeScore: score,
      });
      toast({
        title: `+${res.xpGained} XP`,
        description: res.leveledUp
          ? `Level up! You're now Lv ${res.after.level} — ${res.after.rank}`
          : res.newAchievements.length
            ? `Achievement: ${progressionService.achievementLabel(res.newAchievements[0])}`
            : `Best combo: ${bestCombo}`,
      });
    } catch (e: any) {
      toast({ title: "Sign in to save your run", description: e?.message ?? "" });
    }
  };

  const xp = useMemo(() => xpProgress(score), [score]);

  return (
    <Layout withFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
        {/* HUD */}
        <div className="border-b border-border/70">
          <div className="container py-4 flex flex-wrap items-center justify-between gap-6 text-[12px]">
            <div className="flex items-center gap-8">
              <Hud label="Score" value={score} mono />
              <Hud label="Combo" value={`x${combo}`} mono />
              <Hud label="Best" value={`x${bestCombo}`} mono />
              <Hud label="Level" value={level} mono />
              <Hud label="Lives" value={"♥".repeat(lives) || "—"} />
            </div>
            <div className="flex items-center gap-3">
              {state !== "playing" && (
                <button onClick={startGame} className="px-4 py-2 rounded bg-primary text-primary-foreground text-[13px]">
                  {state === "idle" ? "Start run" : "Play again"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Play field */}
        <div
          ref={fieldRef}
          onClick={() => inputRef.current?.focus()}
          className={`relative flex-1 overflow-hidden bg-gradient-to-b from-background to-secondary/40 ${shake ? "animate-shake" : ""}`}
        >
          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          {/* Falling words */}
          {words.map((w) => (
            <div
              key={w.id}
              className="absolute font-mono-typing text-[18px] md:text-[20px] -translate-x-1/2 select-none whitespace-nowrap"
              style={{ left: `${w.x}%`, top: `${w.y}%` }}
            >
              <span className="px-3 py-1 rounded bg-card/80 backdrop-blur border border-border shadow-soft">
                <span className="text-accent">{w.text.slice(0, w.typed.length)}</span>
                <span className="text-foreground">{w.text.slice(w.typed.length)}</span>
              </span>
            </div>
          ))}

          {/* Score popups */}
          {bursts.map((b) => (
            <div
              key={b.id}
              className="absolute -translate-x-1/2 text-accent font-serif text-lg pointer-events-none animate-burst"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              +{b.pts}
            </div>
          ))}

          {/* Idle / Over overlay */}
          {state !== "playing" && (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="bg-card hairline border rounded-md p-10 max-w-md w-full text-center shadow-sheet animate-fade-up">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  {state === "idle" ? "Arcade — Falling Words" : "Run complete"}
                </div>
                <h2 className="font-serif text-3xl mb-4">
                  {state === "idle" ? "Type before they fall." : `${score} points`}
                </h2>
                {state === "over" && (
                  <div className="grid grid-cols-3 gap-4 mb-6 text-left">
                    <Stat label="Best combo" value={`x${bestCombo}`} />
                    <Stat label="Level reached" value={level} />
                    <Stat label="XP from run" value={Math.round(score / 4 + bestCombo * 2)} />
                  </div>
                )}
                <p className="text-[13px] text-muted-foreground mb-6">
                  Words fall faster every level. Chain perfect words to build combo multipliers.
                </p>
                <button onClick={startGame} className="px-5 py-2 rounded bg-primary text-primary-foreground text-[13px]">
                  {state === "idle" ? "Begin" : "Try again"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border/70 bg-background">
          <div className="container py-4 flex items-center gap-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Type</div>
            <input
              ref={inputRef}
              onChange={onChange}
              disabled={state !== "playing"}
              placeholder={state === "playing" ? "type a falling word…" : "press Start to play"}
              className="flex-1 bg-secondary/60 border border-border rounded px-4 py-2 font-mono-typing text-[15px] outline-none focus:border-accent/60 transition-colors"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="text-[11px] text-muted-foreground tabular-nums w-28 text-right">
              Lv {xp.level} · {xp.rank}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes burst {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.85); }
          25% { opacity: 1; transform: translate(-50%, -10px) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(1); }
        }
        .animate-burst { animation: burst 700ms ease-out forwards; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 220ms ease-in-out; }
      `}</style>
    </Layout>
  );
}

const Hud = ({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    <span className={`text-foreground tabular-nums ${mono ? "font-mono-typing" : ""}`}>{value}</span>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    <div className="font-serif text-2xl mt-1">{value}</div>
  </div>
);
