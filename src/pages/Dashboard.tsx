import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useTestHistory } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { profileService, type Profile } from "@/services/profile.service";
import { progressionService, type Progression, xpProgress } from "@/services/progression.service";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Use our real hook containing the user's unwrapped test results
  const { data: historyData, isLoading: historyLoading, isError: historyError, refetch } = useTestHistory();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progression, setProgression] = useState<Progression | null>(null);

  useEffect(() => {
    if (!user) return;
    profileService.me().then(setProfile).catch(() => {});
    progressionService.get().then(setProgression).catch(() => {});
  }, [user?.id]);

  // Compute stats on the fly from the test history data
  const stats = useMemo(() => {
    const list = Array.isArray(historyData) ? historyData : [];
    if (list.length === 0) {
      return {
        bestWpm: "—",
        avgAccuracy: "—",
        avgWpm: "—",
        count: 0,
        series: [] as number[],
      };
    }

    const count = list.length;
    
    // Parse numeric structures cleanly (handles both stringified decimals or pure numbers)
    const wpms = list.map((item) => Math.round(parseFloat(item.wpm)));
    const accuracies = list.map((item) => parseFloat(item.accuracy));

    const bestWpm = Math.max(...wpms);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / count);
    const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / count);

    // The progression graph draws from oldest to newest records
    const series = [...wpms].reverse();

    return { bestWpm, avgAccuracy, avgWpm, count, series };
  }, [historyData]);

  // Slice the newest 8 items for the recent activity panel listing
  const recentSessions = useMemo(() => {
    const list = Array.isArray(historyData) ? historyData : [];
    return list.slice(0, 8);
  }, [historyData]);

  const cards = [
    { label: "Best WPM", value: stats.bestWpm, note: "Personal record" },
    { label: "Avg accuracy", value: stats.count > 0 ? `${stats.avgAccuracy}%` : "—", note: `Across ${stats.count} sessions` },
    { label: "Tests completed", value: stats.count, note: "Lifetime" },
    { label: "Avg WPM", value: stats.avgWpm, note: "All sessions" },
  ];

  const series = stats.series;
  const max = series.length ? Math.max(...series) : 1;
  const min = series.length ? Math.min(...series) : 0;

  const firstName = profile?.username ?? user?.email?.split("@")[0] ?? "there";

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

        {historyError && (
          <div className="mb-8">
            <ErrorNote
              message="Could not load dashboard data."
              onRetry={() => refetch()}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/70 hairline border rounded-md overflow-hidden mb-10">
          {cards.map((s) => (
            <div key={s.label} className="bg-card p-7">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">{s.label}</div>
              {historyLoading ? (
                <SkeletonBlock className="h-9 w-20" />
              ) : (
                <div className="font-serif text-4xl tracking-tight">{s.value}</div>
              )}
              <div className="text-[12px] text-muted-foreground mt-2">{s.note}</div>
            </div>
          ))}
        </div>

        {progression && (() => {
          const xp = xpProgress(progression.xp);
          return (
            <div className="bg-card hairline border rounded-md p-6 mb-10 shadow-sheet">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Rank</div>
                  <div className="font-serif text-2xl">{xp.rank}</div>
                  <div className="text-[12px] text-muted-foreground mt-1">Level {xp.level} · {progression.xp} XP total</div>
                </div>
                <div className="flex-1 min-w-[200px] max-w-md">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5 tabular-nums">
                    <span>Lv {xp.level}</span>
                    <span>{xp.intoLevel} / {xp.needed} XP</span>
                    <span>Lv {xp.level + 1}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${xp.pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label="Combo" value={`x${progression.bestCombo}`} />
                  <Badge label="Arcade" value={progression.bestArcadeScore} />
                  <Badge label="Badges" value={progression.achievements.length} />
                </div>
              </div>
              {progression.achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/60">
                  {progression.achievements.map((id) => (
                    <span key={id} className="text-[11px] px-2.5 py-1 rounded-full border border-accent/40 bg-accent/10 text-foreground">
                      ★ {progressionService.achievementLabel(id)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
              {historyLoading ? (
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
            {historyLoading && (
              <div className="space-y-4">
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            )}
            {!historyLoading && (
              <ul className="space-y-5">
                {recentSessions.map((a) => (
                  <li key={a.id} className="flex justify-between items-start gap-4 pb-5 border-b border-border/60 last:border-0 last:pb-0">
                    <div>
                      <div className="text-[13px] text-foreground">{a.duration}s session</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {new Date(a.createdAt).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-[13px] text-foreground">{Math.round(parseFloat(a.wpm))}</div>
                      <div className="text-[11px] text-muted-foreground">{Math.round(parseFloat(a.accuracy))}%</div>
                    </div>
                  </li>
                ))}
                {recentSessions.length === 0 && (
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

const Badge = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-right">
    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    <div className="font-serif text-lg tabular-nums">{value}</div>
  </div>
);