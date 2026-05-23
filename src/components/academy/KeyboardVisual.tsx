/**
 * Synchronized on-screen keyboard guide.
 * States per key:
 *  - upcoming (next target)      → accent ring
 *  - pressed-correct (last hit)  → green flash
 *  - pressed-incorrect (mistake) → red flash
 *  - home row anchors (F/J)      → subtle marker
 */
import { useEffect, useState } from "react";

const ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L",";"],
  ["Z","X","C","V","B","N","M",",",".","/"],
];

const HOME = new Set(["A","S","D","F","J","K","L",";"]);

export type LastKey = { key: string; ok: boolean; at: number } | null;

export const KeyboardVisual = ({
  nextKey = "",
  lastKey = null,
}: {
  nextKey?: string;
  lastKey?: LastKey;
}) => {
  const target = (nextKey || "").toUpperCase();
  const isSpace = nextKey === " ";
  const lastUp = lastKey?.key.toUpperCase() ?? "";
  const lastIsSpace = lastKey?.key === " ";

  // brief flash window
  const [flashOn, setFlashOn] = useState(false);
  useEffect(() => {
    if (!lastKey) return;
    setFlashOn(true);
    const t = setTimeout(() => setFlashOn(false), 160);
    return () => clearTimeout(t);
  }, [lastKey?.at]);

  return (
    <div className="bg-card hairline border rounded-md p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Keyboard</div>
        <div className="text-[11px] text-muted-foreground">{isSpace ? "space" : target || "—"}</div>
      </div>
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 mb-1" style={{ paddingLeft: i * 10 }}>
          {row.map((k) => {
            const isTarget = !isSpace && k === target;
            const isLast = flashOn && k === lastUp && !lastIsSpace;
            const ok = lastKey?.ok;
            const cls = isLast
              ? ok
                ? "border-emerald-400/70 bg-emerald-400/20 text-foreground scale-[1.08] shadow-[0_0_12px_hsl(150_70%_50%/0.35)]"
                : "border-destructive/70 bg-destructive/20 text-foreground scale-[1.08] shadow-[0_0_12px_hsl(0_75%_55%/0.35)]"
              : isTarget
                ? "border-accent/70 bg-accent/15 text-foreground shadow-[0_0_10px_hsl(var(--accent)/0.35)] animate-pulse"
                : HOME.has(k)
                  ? "border-border text-foreground/80"
                  : "border-border/70 text-muted-foreground";
            return (
              <div
                key={k}
                className={`w-7 h-7 rounded border flex items-center justify-center text-[10px] transition-all duration-150 ${cls}`}
              >
                {k}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center pt-1">
        <div
          className={`w-[220px] h-6 rounded border text-[10px] flex items-center justify-center transition-all duration-150 ${
            flashOn && lastIsSpace
              ? lastKey?.ok
                ? "border-emerald-400/70 bg-emerald-400/20 text-foreground"
                : "border-destructive/70 bg-destructive/20 text-foreground"
              : isSpace
                ? "border-accent/70 bg-accent/15 text-foreground animate-pulse"
                : "border-border/70 text-muted-foreground"
          }`}
        >
          space
        </div>
      </div>
    </div>
  );
};
