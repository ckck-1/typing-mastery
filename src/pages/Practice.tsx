import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { GhostHand } from "@/components/academy/GhostHand";
import { fingerFor, FINGER_LABEL } from "@/components/academy/fingerMap";

const PASSAGE =
  "The discipline of typing is not measured in speed alone, but in the quiet consistency of every keystroke. A practiced hand moves with intent, never with hurry, and finds rhythm in the steady cadence of thought becoming text.";

const DURATIONS = [15, 30, 60, 120];

export default function Practice() {
  const [input, setInput] = useState("");
  const [duration, setDuration] = useState(60);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setTimeLeft(duration), [duration]);

  useEffect(() => {
    if (!started) return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, timeLeft]);

  const finished = started && timeLeft <= 0;

  const stats = useMemo(() => {
    const correct = input.split("").filter((ch, i) => ch === PASSAGE[i]).length;
    const accuracy = input.length === 0 ? 100 : Math.round((correct / input.length) * 100);
    const elapsed = duration - timeLeft || 1;
    const wpm = Math.round((correct / 5) / (elapsed / 60));
    return { accuracy, wpm: isFinite(wpm) ? wpm : 0, correct };
  }, [input, timeLeft, duration]);

  const reset = () => {
    setInput("");
    setStarted(false);
    setTimeLeft(duration);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished) return;
    if (!started && e.target.value.length > 0) setStarted(true);
    if (e.target.value.length <= PASSAGE.length) setInput(e.target.value);
  };

  const progress = (input.length / PASSAGE.length) * 100;

  const nextChar = PASSAGE[input.length] ?? "";
  const nextKeyDisplay = nextChar === " " ? "space" : nextChar;
  const activeFinger = fingerFor(nextChar);
  const fingerLabel = activeFinger ? FINGER_LABEL[activeFinger] : "—";

  return (
    <Layout withFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Top bar */}
        <div className="border-b border-border/70">
          <div className="container py-4 flex items-center justify-between text-[12px]">
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
                  className={`px-3 py-1 text-[12px] rounded transition-colors ${
                    duration === d ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
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
              <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                Reset ↻
              </button>
            </div>
          </div>
        </div>

        {/* Focus chamber */}
        <div className="flex-1 flex items-center justify-center px-6 py-12" onClick={() => inputRef.current?.focus()}>
          <div className="max-w-3xl w-full">
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={handleChange}
              className="sr-only"
              aria-label="Typing input"
            />
            <p className="font-mono-typing text-[22px] md:text-[26px] leading-[2] tracking-[-0.005em] select-none">
              {PASSAGE.split("").map((ch, i) => {
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

            {/* Typing Guide — appears once user starts */}
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
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">Session complete</div>
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
                <button onClick={reset} className="mt-8 px-4 py-2 rounded bg-primary text-primary-foreground text-[13px]">
                  Begin again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom progress */}
        <div className="container pb-6">
          <div className="h-px w-full bg-border relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-foreground transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Ghost hand + Keyboard */}
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
              {showKeyboard && <KeyboardVisual nextKey={nextChar} />}
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

const KEYS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L",";"],
  ["Z","X","C","V","B","N","M",",",".","/"],
];
const KeyboardVisual = ({ nextKey }: { nextKey: string }) => {
  const target = (nextKey || "").toUpperCase();
  const isSpace = nextKey === " ";
  return (
    <div className="bg-card hairline border rounded-md p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Keyboard</div>
        <div className="text-[11px] text-muted-foreground">{isSpace ? "space" : target || "—"}</div>
      </div>
      {KEYS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 mb-1" style={{ paddingLeft: i * 10 }}>
          {row.map((k) => {
            const on = !isSpace && k === target;
            return (
              <div
                key={k}
                className={`w-7 h-7 rounded border flex items-center justify-center text-[10px] transition-all ${
                  on ? "border-accent/60 bg-accent/15 text-foreground" : "border-border/70 text-muted-foreground"
                }`}
              >
                {k}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center pt-1">
        <div className={`w-[200px] h-6 rounded border text-[10px] flex items-center justify-center transition-all ${
          isSpace ? "border-accent/60 bg-accent/15 text-foreground" : "border-border/70 text-muted-foreground"
        }`}>space</div>
      </div>
    </div>
  );
};
