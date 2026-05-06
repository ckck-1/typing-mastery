import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/academy/Layout";

const PASSAGE =
  "The discipline of typing is not measured in speed alone, but in the quiet consistency of every keystroke. A practiced hand moves with intent, never with hurry, and finds rhythm in the steady cadence of thought becoming text.";

const DURATIONS = [15, 30, 60, 120];

export default function Practice() {
  const [input, setInput] = useState("");
  const [duration, setDuration] = useState(60);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showKeyboard, setShowKeyboard] = useState(false);
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
        <div className="flex-1 flex items-center justify-center px-6 py-16" onClick={() => inputRef.current?.focus()}>
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

        {showKeyboard && <KeyboardVisual />}
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
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];
const KeyboardVisual = () => (
  <div className="container pb-10">
    <div className="bg-card hairline border rounded-md p-5 max-w-2xl mx-auto">
      {KEYS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 mb-1.5" style={{ paddingLeft: i * 12 }}>
          {row.map((k) => (
            <div key={k} className="w-9 h-9 rounded border border-border/70 flex items-center justify-center text-[11px] text-muted-foreground">
              {k}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
