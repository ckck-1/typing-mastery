import { useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useLessons } from "@/hooks/api";

const ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L",";"],
  ["Z","X","C","V","B","N","M",",",".","/"],
];

export default function Teach() {
  const { data: lessons, isLoading, isError, refetch } = useLessons();
  const [step, setStep] = useState(0);

  if (isError) {
    return (
      <Layout>
        <div className="container py-12">
          <ErrorNote message="Failed to load curriculum." onRetry={() => refetch()} />
        </div>
      </Layout>
    );
  }

  if (isLoading || !lessons) {
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

  const lesson = lessons[Math.min(step, lessons.length - 1)];
  const active = new Set(lesson.keys);

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Teaching mode</div>
        <h1 className="font-serif text-3xl mb-10 tracking-tight">A book for the hands</h1>

        <div className="flex items-center gap-3 mb-12">
          {lessons.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-foreground" : "w-2 bg-border hover:bg-muted-foreground/40"}`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
          <span className="ml-4 text-[12px] text-muted-foreground tabular-nums">{step + 1} / {lessons.length}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <article className="bg-card hairline border rounded-md p-10 shadow-sheet">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">{lesson.title.split(" — ")[0]}</div>
            <h2 className="font-serif text-2xl mb-6 leading-snug">{lesson.title.split(" — ")[1]}</h2>
            <p className="text-[15px] leading-[1.8] text-foreground/85 font-serif">{lesson.text}</p>
            <div className="mt-10 flex justify-between">
              <button
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>
              <button
                disabled={step === lessons.length - 1}
                onClick={() => setStep((s) => Math.min(lessons.length - 1, s + 1))}
                className="text-[13px] px-4 py-1.5 rounded bg-primary text-primary-foreground disabled:opacity-30"
              >
                Continue →
              </button>
            </div>
          </article>

          <div className="bg-card hairline border rounded-md p-8 shadow-sheet">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">Finger map</div>
            <div className="space-y-2">
              {ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5" style={{ paddingLeft: i * 14 }}>
                  {row.map((k) => {
                    const on = active.has(k);
                    return (
                      <div
                        key={k}
                        className={`w-10 h-10 rounded border flex items-center justify-center text-[12px] transition-all ${
                          on ? "border-accent/60 bg-accent/10 text-foreground" : "border-border/70 text-muted-foreground/70"
                        }`}
                      >
                        {k}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex justify-center pt-2">
                <div className="w-[280px] h-9 rounded border border-border/70 text-[11px] text-muted-foreground flex items-center justify-center">space</div>
              </div>
            </div>
            <div className="mt-8 flex gap-6 text-[11px] text-muted-foreground justify-center">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent/60" /> Active</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-border" /> Resting</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
