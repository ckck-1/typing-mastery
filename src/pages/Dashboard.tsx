import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useSessions, useSessionStats } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { profileService, type Profile } from "@/services/profile.service";

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useSessionStats();
  const sessions = useSessions(8);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    profileService.me().then(setProfile).catch(() => {});
  }, [user?.id]);

  const loading = stats.isLoading || sessions.isLoading;
  const error = stats.error || sessions.error;

  const cards = [
    { label: "Best WPM", value: stats.data?.bestWpm ?? "—", note: "Personal record" },
    { label: "Avg accuracy", value: stats.data ? `${stats.data.avgAccuracy}%` : "—", note: `Across ${stats.data?.count ?? 0} sessions` },
    { label: "Tests completed", value: stats.data?.count ?? "—", note: "Lifetime" },
    { label: "Avg WPM", value: stats.data?.avgWpm ?? "—", note: "All sessions" },
  ];

  const series = stats.data?.series ?? [];
  const max = series.length ? Math.max(...series) : 1;
  const min = series.length ? Math.min(...series) : 0;

  const firstName = profile?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Dashboard</div>
            <h1 className="font-serif text-3xl tracking-tight">Welcome back, {firstName}.</h1>
          </div>
          <div className="text-[12px] text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {error && (
          <div className="mb-8">
            <ErrorNote
              message="Could not load dashboard data."
              onRetry={() => { stats.refetch(); sessions.refetch(); }}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/70 hairline border rounded-md overflow-hidden mb-10">
          {cards.map((s) => (
            <div key={s.label} className="bg-card p-7">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">{s.label}</div>
              {loading ? (
                <SkeletonBlock className="h-9 w-20" />
              ) : (
                <div className="font-serif text-4xl tracking-tight">{s.value}</div>
              )}
              <div className="text-[12px] text-muted-foreground mt-2">{s.note}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <section className="lg:col-span-2 bg-card hairline border rounded-md p-8 shadow-sheet">
            <div className="flex justify-between items-baseline mb-8">
              <div>
                <h2 className="font-serif text-lg">Progress</h2>
                <p className="text-[12px] text-muted-foreground">Last {series.length} sessions · WPM</p>
              </div>
              {series.length > 0 && (
                <div className="text-[12px] text-muted-foreground tabular-nums">range {min}–{max}</div>
              )}
            </div>
            <div className="relative h-48">
              {loading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : series.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground">
                  Complete a typing test to see your progress.
                </div>
              ) : (
                <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="0.6"
                    points={series.map((v, i) => `${(i / Math.max(1, series.length - 1)) * 300},${100 - ((v - min) / Math.max(1, max - min)) * 80 - 10}`).join(" ")}
                  />
                  {series.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / Math.max(1, series.length - 1)) * 300}
                      cy={100 - ((v - min) / Math.max(1, max - min)) * 80 - 10}
                      r="1"
                      fill="hsl(var(--foreground))"
                    />
                  ))}
                </svg>
              )}
            </div>
          </section>

          <section className="bg-card hairline border rounded-md p-8 shadow-sheet">
            <h2 className="font-serif text-lg mb-6">Recent activity</h2>
            {loading && (
              <div className="space-y-4">
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            )}
            {!loading && (
              <ul className="space-y-5">
                {sessions.data?.map((a) => (
                  <li key={a.id} className="flex justify-between items-start gap-4 pb-5 border-b border-border/60 last:border-0 last:pb-0">
                    <div>
                      <div className="text-[13px] text-foreground">{a.duration}s session</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {new Date(a.createdAt).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-[13px] text-foreground">{a.wpm}</div>
                      <div className="text-[11px] text-muted-foreground">{a.accuracy}%</div>
                    </div>
                  </li>
                ))}
                {sessions.data?.length === 0 && (
                  <li className="text-[12px] text-muted-foreground">No sessions yet — complete a typing test.</li>
                )}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
