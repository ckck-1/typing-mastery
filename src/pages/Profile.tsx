import { useEffect, useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useProfile, useSessionStats, useUpdateProfile } from "@/hooks/api";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { data: stats } = useSessionStats();
  const update = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (profile) { setName(profile.name); setUsername(profile.username); }
  }, [profile]);

  if (isError) {
    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <ErrorNote message="Failed to load profile." onRetry={() => refetch()} />
        </div>
      </Layout>
    );
  }

  if (isLoading || !profile) {
    return (
      <Layout>
        <div className="container py-16 max-w-2xl">
          <SkeletonBlock className="h-80 w-full" />
        </div>
      </Layout>
    );
  }

  const cells = [
    { label: "Best WPM", value: stats?.bestWpm ?? profile.bestWpm },
    { label: "Average WPM", value: stats?.avgWpm ?? profile.avgWpm },
    { label: "Accuracy", value: `${stats?.avgAccuracy ?? profile.accuracy}%` },
    { label: "Tests", value: profile.testsCompleted },
    { label: "Lessons", value: `${profile.lessonsCompleted} / ${profile.totalLessons}` },
    { label: "Rank", value: `#${profile.rank}` },
  ];

  const save = () => {
    update.mutate(
      { name, username },
      {
        onSuccess: () => { setEditing(false); toast({ title: "Profile updated" }); },
        onError: (e: any) => toast({ title: "Update failed", description: e?.message }),
      },
    );
  };

  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        <div className="bg-card hairline border rounded-md p-12 shadow-sheet text-center">
          <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center mb-6">
            <span className="font-serif text-2xl text-foreground">{profile.name[0]}</span>
          </div>

          {editing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-[14px] rounded border border-border bg-background text-center font-serif"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-[12px] rounded border border-border bg-background text-center text-muted-foreground"
              />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl tracking-tight">{profile.name}</h1>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
                @{profile.username} · since {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </>
          )}

          <div className="mt-10 grid grid-cols-3 gap-px bg-border/70 hairline border rounded-md overflow-hidden">
            {cells.map((s) => (
              <div key={s.label} className="bg-card p-5">
                <div className="font-serif text-xl text-foreground">{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={save}
                  disabled={update.isPending}
                  className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {update.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-[13px] rounded border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground">
                  Edit profile
                </button>
                <button className="px-4 py-2 text-[13px] rounded border border-border text-foreground hover:bg-secondary transition-colors">
                  Settings
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
