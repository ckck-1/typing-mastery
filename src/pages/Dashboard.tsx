import { Layout } from "@/components/academy/Layout";

const stats = [
  { label: "Best WPM", value: "82", note: "Personal record · Mar 18" },
  { label: "Avg accuracy", value: "97.4%", note: "Last 30 sessions" },
  { label: "Tests completed", value: "248", note: "Across 14 weeks" },
  { label: "Streak", value: "12d", note: "Daily practice" },
];

const activity = [
  { date: "Today · 09:14", type: "Test", detail: "60s · English literature", wpm: 78, acc: "98%" },
  { date: "Today · 08:42", type: "Lesson", detail: "Chapter III — Bottom row", wpm: null, acc: "—" },
  { date: "Yesterday · 21:03", type: "Test", detail: "30s · Code drill", wpm: 71, acc: "96%" },
  { date: "Yesterday · 20:45", type: "Test", detail: "60s · Literature", wpm: 74, acc: "97%" },
  { date: "May 03 · 19:20", type: "Test", detail: "120s · Endurance", wpm: 69, acc: "95%" },
];

const sparkline = [62, 64, 61, 66, 70, 68, 72, 74, 71, 76, 78, 75, 80, 78, 82];

export default function Dashboard() {
  const max = Math.max(...sparkline);
  const min = Math.min(...sparkline);
  return (
    <Layout>
      <div className="container py-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Dashboard</div>
            <h1 className="font-serif text-3xl tracking-tight">Good morning, Adrian.</h1>
          </div>
          <div className="text-[12px] text-muted-foreground hidden md:block">Wednesday · May 6, 2026</div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/70 hairline border rounded-md overflow-hidden mb-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-card p-7">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">{s.label}</div>
              <div className="font-serif text-4xl tracking-tight">{s.value}</div>
              <div className="text-[12px] text-muted-foreground mt-2">{s.note}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Chart */}
          <section className="lg:col-span-2 bg-card hairline border rounded-md p-8 shadow-sheet">
            <div className="flex justify-between items-baseline mb-8">
              <div>
                <h2 className="font-serif text-lg">Progress</h2>
                <p className="text-[12px] text-muted-foreground">Last 15 sessions · WPM</p>
              </div>
              <div className="text-[12px] text-muted-foreground tabular-nums">range {min}–{max}</div>
            </div>
            <div className="relative h-48">
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="0.6"
                  points={sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 300},${100 - ((v - min) / (max - min)) * 80 - 10}`).join(" ")}
                />
                {sparkline.map((v, i) => (
                  <circle
                    key={i}
                    cx={(i / (sparkline.length - 1)) * 300}
                    cy={100 - ((v - min) / (max - min)) * 80 - 10}
                    r="1"
                    fill="hsl(var(--foreground))"
                  />
                ))}
              </svg>
            </div>
          </section>

          {/* Activity */}
          <section className="bg-card hairline border rounded-md p-8 shadow-sheet">
            <h2 className="font-serif text-lg mb-6">Recent activity</h2>
            <ul className="space-y-5">
              {activity.map((a, i) => (
                <li key={i} className="flex justify-between items-start gap-4 pb-5 border-b border-border/60 last:border-0 last:pb-0">
                  <div>
                    <div className="text-[13px] text-foreground">{a.detail}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{a.date} · {a.type}</div>
                  </div>
                  {a.wpm != null && (
                    <div className="text-right tabular-nums">
                      <div className="text-[13px] text-foreground">{a.wpm}</div>
                      <div className="text-[11px] text-muted-foreground">{a.acc}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}
