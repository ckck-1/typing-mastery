import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, LoadingLine, SkeletonBlock } from "@/components/academy/States";
import { useTestHistory } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { friendsService, type FriendProfile, type PendingRequest } from "@/services/friends.service";
import { profileService, type Profile } from "@/services/profile.service";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  
  // Use our real hook to fetch the complete user performance log arrays
  const { data: historyData, isLoading: historyLoading } = useTestHistory();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");

  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  // Compute stats on the fly from the test history data log array
  const stats = useMemo(() => {
    const list = Array.isArray(historyData) ? historyData : [];
    if (list.length === 0) {
      return { bestWpm: "—", avgWpm: "—", avgAccuracy: "—", count: 0 };
    }

    const count = list.length;
    const wpms = list.map((item) => Math.round(parseFloat(item.wpm)));
    const accuracies = list.map((item) => parseFloat(item.accuracy));

    const bestWpm = Math.max(...wpms);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / count);
    const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / count);

    return { bestWpm, avgWpm, avgAccuracy, count };
  }, [historyData]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const me = await profileService.me();
      setProfile(me);
      setUsername(me.username);
      const [fs, ps] = await Promise.all([
        friendsService.listFriends().catch(() => []),
        friendsService.listPending().catch(() => []),
      ]);
      setFriends(fs);
      setPending(ps);
    } catch (e: any) {
      setError(e.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const u = await friendsService.search(search);
        setResults(u.filter((x) => x.id !== user?.id));
      } catch (e: any) {
        toast({ title: "Search failed", description: e.message });
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.id]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await profileService.update({ username: username.toLowerCase() });
      setProfile(updated);
      toast({ title: "Profile updated" });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message });
    } finally { setSaving(false); }
  };

  const sendRequest = async (friend: FriendProfile) => {
    try {
      await friendsService.sendRequest(friend.id);
      toast({ title: `Request sent to @${friend.username}` });
    } catch (e: any) {
      toast({ title: "Could not send request", description: e.message });
    }
  };

  const acceptRequest = async (req: PendingRequest) => {
    try {
      await friendsService.accept(req.requestId);
      setPending((p) => p.filter((r) => r.requestId !== req.requestId));
      setFriends((prev) => [...prev, { id: req.id, username: req.username, name: req.name }]);
      toast({ title: `You and @${req.username} are now connected` });
    } catch (e: any) {
      toast({ title: "Could not accept", description: e.message });
    }
  };

  const declineRequest = async (req: PendingRequest) => {
    try {
      await friendsService.decline(req.requestId);
      setPending((p) => p.filter((r) => r.requestId !== req.requestId));
      toast({ title: `Declined @${req.username}` });
    } catch (e: any) {
      toast({ title: "Could not decline", description: e.message });
    }
  };

  const removeFriend = async (friend: FriendProfile) => {
    try {
      await friendsService.remove(friend.id);
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
      toast({ title: `Removed @${friend.username}` });
    } catch (e: any) {
      toast({ title: "Could not remove friend", description: e.message });
    }
  };

  if (error) return <Layout><div className="container py-12 max-w-2xl"><ErrorNote message={error} onRetry={load} /></div></Layout>;
  // Combine profile loading states with the async test statistics loading status safely
  if (loading || historyLoading || !profile) return <Layout><div className="container py-16 max-w-2xl"><SkeletonBlock className="h-80 w-full" /></div></Layout>;

  const displayName = profile.username;
  const cells = [
    { label: "Best WPM", value: stats.bestWpm },
    { label: "Average WPM", value: stats.avgWpm },
    { label: "Accuracy", value: stats.avgAccuracy !== "—" ? `${stats.avgAccuracy}%` : "—" },
    { label: "Tests", value: stats.count },
    { label: "Friends", value: friends.length },
    { label: "Member", value: new Date(profile.joinedAt).getFullYear() },
  ];

  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        <div className="bg-card hairline border rounded-md p-12 shadow-sheet text-center">
          <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center mb-6">
            <span className="font-serif text-2xl text-foreground">
              {displayName[0]?.toUpperCase() ?? "?"}
            </span>
          </div>

          {editing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-[14px] rounded border border-border bg-background text-center font-serif"
              />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl tracking-tight">@{profile.username}</h1>
              {profile.email && <p className="text-[12px] text-muted-foreground mt-1">{profile.email}</p>}
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
                since {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </>
          )}

          <div className="mt-10 grid grid-cols-3 gap-px bg-border/70 hairline border rounded-md overflow-hidden">
            {cells.map((cell) => (
              <div key={cell.label} className="bg-card p-5">
                <div className="font-serif text-xl text-foreground">{cell.value}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">{cell.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center gap-3">
            {editing ? (
              <>
                <button onClick={save} disabled={saving} className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
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

        <section className="mt-10 bg-card hairline border rounded-md p-8 shadow-sheet">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl tracking-tight">Friends</h2>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{friends.length} connected</span>
          </div>

          <div className="mt-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full px-3 py-2 text-[14px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searching && <div className="mt-3"><LoadingLine label="Searching" /></div>}

            {results.length > 0 && (
              <ul className="mt-4 divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-4 py-3 bg-card">
                    <div>
                      <div className="text-[13px] text-foreground">@{r.username}</div>
                      {r.name && <div className="text-[11px] text-muted-foreground">{r.name}</div>}
                    </div>
                    {friendIds.has(r.id) ? (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Friend</span>
                    ) : (
                      <button onClick={() => sendRequest(r)} className="text-[12px] px-3 py-1.5 rounded bg-primary text-primary-foreground">
                        Send request
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {search && !searching && results.length === 0 && (
              <p className="mt-4 text-[12px] text-muted-foreground">No users matching "{search}".</p>
            )}
          </div>

          {pending.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Friend requests · {pending.length}
              </h3>
              <ul className="divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {pending.map((r) => (
                  <li key={r.requestId} className="flex items-center justify-between px-4 py-3 bg-card">
                    <div>
                      <div className="text-[13px] text-foreground">@{r.username}</div>
                      <div className="text-[11px] text-muted-foreground">wants to connect</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptRequest(r)} className="text-[12px] px-3 py-1.5 rounded bg-primary text-primary-foreground">
                        Accept
                      </button>
                      <button onClick={() => declineRequest(r)} className="text-[12px] px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Your friends</h3>
            {friends.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No friends yet — search above to connect.</p>
            ) : (
              <ul className="divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {friends.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-4 py-3 bg-card">
                    <div>
                      <div className="text-[13px] text-foreground">@{f.username}</div>
                      {f.name && <div className="text-[11px] text-muted-foreground">{f.name}</div>}
                    </div>
                    <button onClick={() => removeFriend(f)} className="text-[12px] text-muted-foreground hover:text-foreground border-b border-border pb-0.5">
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