import { useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useLeaderboard } from "@/hooks/api";
import type { LeaderboardScope } from "@/services/leaderboard.service";

const TABS: { label: string; scope: LeaderboardScope }[] = [
  { label: "Worldwide", scope: "worldwide" },
  { label: "Friends", scope: "friends" },
];

export default function Leaderboard() {
  const [scope, setScope] = useState<LeaderboardScope>("worldwide");
  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard(scope);

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Standings</div>
        <h1 className="font-serif text-3xl mb-8 tracking-tight">Leaderboard</h1>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-secondary/60 rounded p-0.5">
            {TABS.map((t) => (
              <button
                key={t.scope}
                onClick={() => setScope(t.scope)}
                className={`px-4 py-1.5 text-[12px] rounded transition-colors ${
                  scope === t.scope ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground">{isFetching ? "Refreshing…" : "Updated just now"}</div>
        </div>

        {isError && <ErrorNote message="Failed to load leaderboard." onRetry={() => refetch()} />}

        {!isError && (
          <div className="bg-card hairline border rounded-md overflow-hidden shadow-sheet">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-border/70 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Username</div>
              <div className="col-span-2 text-right">WPM</div>
              <div className="col-span-2 text-right">Accuracy</div>
              <div className="col-span-2 text-right">Date</div>
            </div>

            {isLoading && (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-8 w-full" />
                ))}
              </div>
            )}

            {!isLoading && data?.length === 0 && (
              <div className="p-10 text-center text-[13px] text-muted-foreground">No entries for this period.</div>
            )}

            {!isLoading && data?.map((r: any) => {
              const top = r.rank <= 3;
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-12 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors items-center"
                >
                  <div className={`col-span-1 tabular-nums ${top ? "font-serif text-foreground" : "text-muted-foreground"}`}>
                    {String(r.rank).padStart(2, "0")}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] ${
                      top ? "bg-accent/15 text-accent-foreground border border-accent/30" : "bg-secondary text-muted-foreground"
                    }`}>
                      {(r.username?.[0] ?? "?").toUpperCase()}
                    </div>
                    <span className="text-[14px] text-foreground">@{r.username}</span>
                    {r.rank === 1 && <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground ml-2">· Laureate</span>}
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-[14px] text-foreground">{r.wpm}</div>
                  <div className="col-span-2 text-right tabular-nums text-[13px] text-muted-foreground">{r.accuracy}%</div>
                  <div className="col-span-2 text-right text-[12px] text-muted-foreground">
                    {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
