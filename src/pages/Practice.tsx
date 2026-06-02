import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { GhostHand } from "@/components/academy/GhostHand";
import { KeyboardVisual, type LastKey } from "@/components/academy/KeyboardVisual";
import { fingerFor, FINGER_LABEL } from "@/components/academy/fingerMap";
import { ErrorNote, LoadingLine, SkeletonBlock } from "@/components/academy/States";
import { useCreateSession, useRandomPassage } from "@/hooks/api";
import { progressionService } from "@/services/progression.service";
import { toast } from "@/hooks/use-toast";

const DURATIONS = [15, 30, 60, 120];

export default function Practice() {
  const { data: passage, isLoading, isError, refetch, isFetching } = useRandomPassage();
  const createSession = useCreateSession();

  const text = passage?.contentText ?? "";

  const [input, setInput] = useState("");
  const [duration, setDuration] = useState(60);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [lastKey, setLastKey] = useState<LastKey>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => setTimeLeft(duration), [duration]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, timeLeft]);

  const finished = started && timeLeft <= 0;

  const stats = useMemo(() => {
    const correct = input.split("").filter((ch, i) => ch === text[i]).length;
    const accuracy = input.length === 0 ? 100 : Math.round((correct / input.length) * 100);
    const elapsed = duration - timeLeft || 1;
    const wpm = Math.round((correct / 5) / (elapsed / 60));
    return { accuracy, wpm: isFinite(wpm) ? wpm : 0, correct };
  }, [input, timeLeft, duration, text]);

  // Persist completed session to "backend"
  useEffect(() => {
    if (!finished || submittedRef.current || !passage) return;
    submittedRef.current = true;
    createSession.mutate(
      {
        passageId: passage.id,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        duration,
        correctChars: stats.correct,
      },
      {
        onSuccess: async () => {
          toast({ title: "Session saved", description: `${stats.wpm} WPM · ${stats.accuracy}%` });
          // Award XP: scale with WPM and accuracy
          try {
            const xp = Math.round(stats.wpm * (stats.accuracy / 100) * (duration / 60) * 2);
            const words = Math.round(stats.correct / 5);
            const res = await progressionService.award({ xp, words });
            if (res.leveledUp) {
              toast({ title: `Level up — Lv ${res.after.level}`, description: res.after.rank });
            } else if (res.newAchievements.length) {
              toast({
                title: "Achievement unlocked",
                description: progressionService.achievementLabel(res.newAchievements[0]),
              });
            }
          } catch { }
        },
        onError: (e: any) => toast({ title: "Could not save session", description: e?.response?.data?.message ?? e?.message ?? "Network error" }),
      },
    );
  }, [finished, passage, stats, duration, createSession]);

  const reset = () => {
    setInput("");
    setStarted(false);
    setTimeLeft(duration);
    submittedRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const newPassage = async () => {
    submittedRef.current = false;
    setInput("");
    setStarted(false);
    setTimeLeft(duration);
    await refetch();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished || !text) return;
    const val = e.target.value;
    if (!started && val.length > 0) setStarted(true);
    if (val.length <= text.length) {
      // Track last keystroke for keyboard flash
      if (val.length > input.length) {
        const ch = val[val.length - 1];
        const expected = text[val.length - 1];
        setLastKey({ key: ch, ok: ch === expected, at: performance.now() });
      }
      setInput(val);
    }
  };

  const progress = text ? (input.length / text.length) * 100 : 0;
  const nextChar = text[input.length] ?? "";
  const nextKeyDisplay = nextChar === " " ? "space" : nextChar;
  const activeFinger = fingerFor(nextChar);
  const fingerLabel = activeFinger ? FINGER_LABEL[activeFinger] : "—";

  return (
    <Layout withFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Top bar */}
        <div className="border-b border-border/70">
          <div className="container py-4 flex items-center justify-between text-[12px] gap-6 flex-wrap">
            <div className="flex items-center gap-8">
              <Stat label="WPM" value={stats.wpm} />
              <Stat label="Accuracy" value={`${stats.accuracy}%`} />
              <Stat label="Time" value={`${timeLeft}s`} mono />
            </div>
            <div className="flex items-center gap-1 bg-secondary/60 rounded p-0.5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); reset(); }}
                  className={`px-3 py-1 text-[12px] rounded transition-colors ${duration === d ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {d}s
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={showGhost} onChange={(e) => setShowGhost(e.target.checked)} className="accent-primary" />
                Ghost hand
              </label>
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={showKeyboard} onChange={(e) => setShowKeyboard(e.target.checked)} className="accent-primary" />
                Keyboard
              </label>
              <button onClick={newPassage} className="text-muted-foreground hover:text-foreground transition-colors" disabled={isFetching}>
                {isFetching ? "Loading…" : "New passage ⤴"}
              </button>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                Reset ↻
              </button>
            </div>
          </div>
        </div>

        {/* Focus chamber */}
        <div className="flex-1 flex items-center justify-center px-6 py-12" onClick={() => inputRef.current?.focus()}>
          <div className="max-w-3xl w-full">
            {isLoading && (
              <div className="space-y-4">
                <LoadingLine label="Fetching passage" />
                <SkeletonBlock className="h-6 w-11/12" />
                <SkeletonBlock className="h-6 w-10/12" />
                <SkeletonBlock className="h-6 w-9/12" />
              </div>
            )}

            {isError && !isLoading && (
              <ErrorNote message="Failed to load passage from server." onRetry={() => refetch()} />
            )}

            {!isLoading && !isError && passage && (
              <>
                <div className="flex items-center justify-between mb-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{passage.source}</span>
                  <span>· {passage.language}</span>
                </div>
                <input
                  ref={inputRef}
                  autoFocus
                  value={input}
                  onChange={handleChange}
                  className="sr-only"
                  aria-label="Typing input"
                />
                <p className="font-mono-typing text-[22px] md:text-[26px] leading-[2] tracking-[-0.005em] select-none">
                  {text.split("").map((ch, i) => {
                    const typed = input[i];
                    let cls = "text-muted-foreground/40";
                    if (typed != null) {
                      cls = typed === ch ? "text-foreground" : "text-destructive/80 underline decoration-destructive/40 underline-offset-4";
                    }
                    const isCurrent = i === input.length;
                    return (
                      <span key={i} className={`${cls} relative ${isCurrent ? "border-l border-foreground caret -ml-px" : ""}`}>
                        {ch}
                      </span>
                    );
                  })}
                </p>

                {started && !finished && (
                  <div className="mt-10 flex items-stretch gap-4 animate-fade-in">
                    <div className="flex-1 bg-card hairline border rounded-md p-4 flex items-center gap-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Next</div>
                      <div className="flex items-center justify-center min-w-[44px] h-11 px-3 rounded border border-accent/40 bg-accent/10 font-mono-typing text-[15px] text-foreground">
                        {nextKeyDisplay || "·"}
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Use</div>
                        <div className="text-[13px] text-foreground mt-0.5">{fingerLabel}</div>
                      </div>
                      <div className="ml-auto text-[11px] text-muted-foreground hidden sm:block">
                        Tip — keep wrists relaxed, return to home row.
                      </div>
                    </div>
                  </div>
                )}

                {finished && (
                  <div className="mt-12 bg-card hairline border rounded-md p-8 shadow-sheet animate-fade-up">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Session complete</div>
                      <div className="text-[11px] text-muted-foreground">
                        {createSession.isPending ? "Saving…" : createSession.isError ? "Save failed" : "Saved ✓"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                      <div>
                        <div className="font-serif text-4xl">{stats.wpm}</div>
                        <div className="text-[12px] text-muted-foreground mt-1">Words / min</div>
                      </div>
                      <div>
                        <div className="font-serif text-4xl">{stats.accuracy}%</div>
                        <div className="text-[12px] text-muted-foreground mt-1">Accuracy</div>
                      </div>
                      <div>
                        <div className="font-serif text-4xl">{stats.correct}</div>
                        <div className="text-[12px] text-muted-foreground mt-1">Correct chars</div>
                      </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                      <button onClick={reset} className="px-4 py-2 rounded bg-primary text-primary-foreground text-[13px]">
                        Begin again
                      </button>
                      <button onClick={newPassage} className="px-4 py-2 rounded border border-border text-foreground hover:bg-secondary text-[13px]">
                        New passage
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="container pb-6">
          <div className="h-px w-full bg-border relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-foreground transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {(showGhost || showKeyboard) && (
          <div className="container pb-10">
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {showGhost && (
                <div className="bg-card hairline border rounded-md p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ghost hand</div>
                    <div className="text-[11px] text-muted-foreground">{fingerLabel}</div>
                  </div>
                  <div className="h-32">
                    <GhostHand active={activeFinger} />
                  </div>
                </div>
              )}
              {showKeyboard && <KeyboardVisual nextKey={nextChar} lastKey={lastKey} />}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const Stat = ({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    <span className={`text-foreground tabular-nums ${mono ? "font-mono-typing" : ""}`}>{value}</span>
  </div>
);

