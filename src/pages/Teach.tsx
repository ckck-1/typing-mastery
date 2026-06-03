import { useState, useMemo } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useLessons, type Lesson } from "@/hooks/api";

const ROWS: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
  ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
];

export default function Teach() {
  const { data: lessons, isLoading, isError, refetch } = useLessons();
  const [step, setStep] = useState<number>(0);

  // Normalize lessons array safely
  const safeLessons: Lesson[] = Array.isArray(lessons) ? lessons : [];

  // Clamp step index boundary safety
  const safeStep = useMemo<number>(() => {
    if (safeLessons.length === 0) return 0;
    return Math.min(step, safeLessons.length - 1);
  }, [step, safeLessons.length]);

  const lesson: Lesson | undefined = safeLessons[safeStep];

  // Dynamically compute active keys from the lesson content text since backend omitted it
  const activeKeys = useMemo<Set<string>>(() => {
    if (!lesson) return new Set<string>();
    const textContent = lesson.content_text ?? "";
    // Remove blank spaces, convert to uppercase, split characters into a unique set
    const sanitizedChars = textContent.replace(/\s+/g, "").toUpperCase().split("");
    return new Set<string>(sanitizedChars);
  }, [lesson]);

  // 1. Error layout state
  if (isError) {
    return (
      <Layout>
        <div className="container py-12">
          <ErrorNote message="Failed to load curriculum." onRetry={() => refetch()} />
        </div>
      </Layout>
    );
  }

  // 2. Loading layout state (Isolated strictly to network request status)
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 space-y-6">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-10 w-80" />
          <div className="grid lg:grid-cols-2 gap-12">
            <SkeletonBlock className="h-64 w-full" />
            <SkeletonBlock className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  // 3. Empty data fallback layout state
  if (safeLessons.length === 0 || !lesson) {
    return (
      <Layout>
        <div className="container py-12">
          <ErrorNote message="No lessons available in the curriculum database." onRetry={() => refetch()} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Teaching mode — Lesson {lesson.order_index ?? safeStep + 1}
        </div>

        <h1 className="font-serif text-3xl mb-10 tracking-tight">
          A book for the hands
        </h1>

        {/* Step dots navigation layout navigation elements */}
        <div className="flex items-center gap-3 mb-12">
          {safeLessons.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === safeStep
                  ? "w-8 bg-foreground"
                  : "w-2 bg-border hover:bg-muted-foreground/40"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}

          <span className="ml-4 text-[12px] text-muted-foreground tabular-nums">
            {safeStep + 1} / {safeLessons.length}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Main lesson detail typography panels */}
          <article className="bg-card hairline border rounded-md p-10 shadow-sheet">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              {lesson.title}
            </div>

            <h2 className="font-serif text-xl mb-6 leading-snug text-muted-foreground font-normal normal-case">
              {lesson.description}
            </h2>

            <p className="text-[16px] leading-[1.8] text-foreground bg-muted/30 border p-4 rounded font-mono tracking-wide break-all selection:bg-primary selection:text-primary-foreground">
              {lesson.content_text}
            </p>

            <div className="mt-10 flex justify-between">
              <button
                disabled={safeStep === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>

              <button
                disabled={safeStep === safeLessons.length - 1}
                onClick={() =>
                  setStep((s) => Math.min(safeLessons.length - 1, s + 1))
                }
                className="text-[13px] px-4 py-1.5 rounded bg-primary text-primary-foreground disabled:opacity-30 transition-all hover:opacity-90"
              >
                Continue →
              </button>
            </div>
          </article>

          {/* Virtual interactive keyboard layout panels */}
          <div className="bg-card hairline border rounded-md p-8 shadow-sheet">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
              Finger map
            </div>

            <div className="space-y-2">
              {ROWS.map((row, i) => (
                <div
                  key={i}
                  className="flex justify-center gap-1.5"
                  style={{ paddingLeft: i * 14 }}
                >
                  {row.map((k) => {
                    const on = activeKeys.has(k);

                    return (
                      <div
                        key={k}
                        className={`w-10 h-10 rounded border flex items-center justify-center text-[12px] transition-all font-mono uppercase ${
                          on
                            ? "border-accent/80 bg-accent/20 text-foreground font-bold shadow-sm ring-1 ring-accent/30"
                            : "border-border/70 text-muted-foreground/40"
                        }`}
                      >
                        {k}
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="flex justify-center pt-2">
                <div className="w-[280px] h-9 rounded border border-border/70 text-[11px] text-muted-foreground flex items-center justify-center font-mono">
                  space
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-6 text-[11px] text-muted-foreground justify-center">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" /> Active for lesson
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-border" /> Resting
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}