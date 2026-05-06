import { useState } from "react";
import { Layout } from "@/components/academy/Layout";

const TABS = ["Global", "Weekly", "Monthly", "Friends"];

const ROWS = [
  { rank: 1, user: "haruki.t", wpm: 142, acc: "99.1%", date: "May 05" },
  { rank: 2, user: "elena.v", wpm: 138, acc: "98.7%", date: "May 04" },
  { rank: 3, user: "noor.k", wpm: 134, acc: "98.4%", date: "May 06" },
  { rank: 4, user: "marcus.l", wpm: 128, acc: "97.9%", date: "May 03" },
  { rank: 5, user: "ines.r", wpm: 124, acc: "98.2%", date: "May 06" },
  { rank: 6, user: "yuki.s", wpm: 121, acc: "97.5%", date: "May 02" },
  { rank: 7, user: "david.c", wpm: 119, acc: "96.8%", date: "May 05" },
  { rank: 8, user: "anya.p", wpm: 116, acc: "97.2%", date: "May 01" },
  { rank: 9, user: "tomas.b", wpm: 114, acc: "96.4%", date: "Apr 30" },
  { rank: 10, user: "lena.k", wpm: 112, acc: "96.9%", date: "Apr 29" },
];

export default function Leaderboard() {
  const [tab, setTab] = useState("Global");

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Standings</div>
        <h1 className="font-serif text-3xl mb-8 tracking-tight">Leaderboard</h1>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-secondary/60 rounded p-0.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-[12px] rounded transition-colors ${
                  tab === t ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground">Updated 2 min ago</div>
        </div>

        <div className="bg-card hairline border rounded-md overflow-hidden shadow-sheet">
          <div className="grid grid-cols-12 px-6 py-3 border-b border-border/70 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Username</div>
            <div className="col-span-2 text-right">WPM</div>
            <div className="col-span-2 text-right">Accuracy</div>
            <div className="col-span-2 text-right">Date</div>
          </div>
          {ROWS.map((r) => {
            const top = r.rank <= 3;
            return (
              <div
                key={r.rank}
                className="grid grid-cols-12 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors items-center"
              >
                <div className={`col-span-1 tabular-nums ${top ? "font-serif text-foreground" : "text-muted-foreground"}`}>
                  {String(r.rank).padStart(2, "0")}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] ${
                    top ? "bg-accent/15 text-accent-foreground border border-accent/30" : "bg-secondary text-muted-foreground"
                  }`}>
                    {r.user[0].toUpperCase()}
                  </div>
                  <span className="text-[14px] text-foreground">{r.user}</span>
                  {r.rank === 1 && <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground ml-2">· Laureate</span>}
                </div>
                <div className="col-span-2 text-right tabular-nums text-[14px] text-foreground">{r.wpm}</div>
                <div className="col-span-2 text-right tabular-nums text-[13px] text-muted-foreground">{r.acc}</div>
                <div className="col-span-2 text-right text-[12px] text-muted-foreground">{r.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
