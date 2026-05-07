import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, LoadingLine, SkeletonBlock } from "@/components/academy/States";
import { useSessionStats } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { friendsService, type FriendProfile } from "@/services/friends.service";
import { toast } from "@/hooks/use-toast";

type ProfileRow = {
  id: string;
  name: string;
  username: string;
  joined_at: string;
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: stats } = useSessionStats();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  // Friends
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, joined_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
      if (data) { setName(data.name); setUsername(data.username); }
      const fs = await friendsService.listFriends(user.id);
      setFriends(fs);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  // Debounced search by username
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await friendsService.search(search);
        setResults(r.filter((p) => p.id !== user?.id));
      } catch (e: any) {
        toast({ title: "Search failed", description: e.message });
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name, username: username.toLowerCase() })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Profile updated" });
      setEditing(false);
      load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const addFriend = async (friend: FriendProfile) => {
    if (!user) return;
    try {
      await friendsService.add(user.id, friend.id);
      setFriends((f) => [...f, friend]);
      toast({ title: `Added @${friend.username}` });
    } catch (e: any) {
      toast({ title: "Could not add", description: e.message });
    }
  };

  const removeFriend = async (friend: FriendProfile) => {
    if (!user) return;
    try {
      await friendsService.remove(user.id, friend.id);
      setFriends((f) => f.filter((x) => x.id !== friend.id));
    } catch (e: any) {
      toast({ title: "Could not remove", description: e.message });
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <ErrorNote message={error} onRetry={load} />
        </div>
      </Layout>
    );
  }
  if (loading || !profile) {
    return (
      <Layout>
        <div className="container py-16 max-w-2xl">
          <SkeletonBlock className="h-80 w-full" />
        </div>
      </Layout>
    );
  }

  const cells = [
    { label: "Best WPM", value: stats?.bestWpm ?? "—" },
    { label: "Average WPM", value: stats?.avgWpm ?? "—" },
    { label: "Accuracy", value: stats?.avgAccuracy != null ? `${stats.avgAccuracy}%` : "—" },
    { label: "Tests", value: stats?.count ?? 0 },
    { label: "Friends", value: friends.length },
    { label: "Member", value: new Date(profile.joined_at).getFullYear() },
  ];

  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        <div className="bg-card hairline border rounded-md p-12 shadow-sheet text-center">
          <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center mb-6">
            <span className="font-serif text-2xl text-foreground">{profile.name[0]?.toUpperCase() ?? "?"}</span>
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
                @{profile.username} · since {new Date(profile.joined_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
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
                <button onClick={save} disabled={saving} className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-[13px] rounded border border-border text-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground">
                  Edit profile
                </button>
                <button onClick={signOut} className="px-4 py-2 text-[13px] rounded border border-border text-foreground hover:bg-secondary transition-colors">
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Friends */}
        <section className="mt-10 bg-card hairline border rounded-md p-8 shadow-sheet">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl tracking-tight">Friends</h2>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{friends.length} connected</span>
          </div>

          <div className="mt-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username…"
              className="w-full px-3 py-2 text-[14px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searching && <div className="mt-3"><LoadingLine label="Searching" /></div>}

            {results.length > 0 && (
              <ul className="mt-4 divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-4 py-3 bg-card">
                    <div>
                      <div className="text-[13px] text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">@{r.username}</div>
                    </div>
                    {friendIds.has(r.id) ? (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Friend</span>
                    ) : (
                      <button
                        onClick={() => addFriend(r)}
                        className="text-[12px] px-3 py-1.5 rounded bg-primary text-primary-foreground"
                      >
                        Add
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {search && !searching && results.length === 0 && (
              <p className="mt-4 text-[12px] text-muted-foreground">No users matching “{search}”.</p>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Your friends</h3>
            {friends.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No friends yet — search above to connect.</p>
            ) : (
              <ul className="divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {friends.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-4 py-3 bg-card">
                    <div>
                      <div className="text-[13px] text-foreground">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground">@{f.username}</div>
                    </div>
                    <button
                      onClick={() => removeFriend(f)}
                      className="text-[12px] text-muted-foreground hover:text-foreground border-b border-border pb-0.5"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
