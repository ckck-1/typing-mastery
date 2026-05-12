import { useEffect, useMemo, useState } from "react";

import { Layout } from "@/components/academy/Layout";
import {
  ErrorNote,
  LoadingLine,
  SkeletonBlock,
} from "@/components/academy/States";

import { useSessionStats } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

import {
  friendsService,
  type FriendProfile,
  type PendingRequest,
} from "@/services/friends.service";

import {
  profileService,
  type Profile,
} from "@/services/profile.service";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: stats } = useSessionStats();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // edit state
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  // friends
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);

  // search
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const friendIds = useMemo(
    () => new Set(friends.map((f) => f.id)),
    [friends]
  );

  // ─────────────────────────────────────────────────────────────
  // Load profile + friends
  // ─────────────────────────────────────────────────────────────

  const load = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const me = await profileService.me();

      if (!me) {
        setError("Profile not found");
        return;
      }

      setProfile(me);

      setName(me.name);
      setUsername(me.username);

      const [fs, ps] = await Promise.all([
        friendsService.listFriends(),
        friendsService.listPending(),
      ]);
      setFriends(fs);
      setPending(ps);
    } catch (e: any) {
      setError(e.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ─────────────────────────────────────────────────────────────
  // Search users
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const users = await friendsService.search(search);

        setResults(
          users.filter((u) => u.id !== user?.id)
        );
      } catch (e: any) {
        toast({
          title: "Search failed",
          description: e.message,
        });
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, user?.id]);

  // ─────────────────────────────────────────────────────────────
  // Save profile
  // ─────────────────────────────────────────────────────────────

  const save = async () => {
    setSaving(true);

    try {
      const updated = await profileService.update({
        name,
        username: username.toLowerCase(),
      });

      setProfile(updated);

      toast({
        title: "Profile updated",
      });

      setEditing(false);
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Add friend
  // ─────────────────────────────────────────────────────────────

  const addFriend = async (friend: FriendProfile) => {
    try {
      await friendsService.add(friend.id);

      setFriends((prev) => [...prev, friend]);

      toast({
        title: `Added @${friend.username}`,
      });
    } catch (e: any) {
      toast({
        title: "Could not add friend",
        description: e.message,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Remove friend
  // ─────────────────────────────────────────────────────────────

  const acceptRequest = async (req: PendingRequest) => {
    try {
      await friendsService.accept(req.friendshipId);
      setPending((p) => p.filter((r) => r.friendshipId !== req.friendshipId));
      setFriends((prev) => [
        ...prev,
        { id: req.id, name: req.name, username: req.username, joined_at: req.joined_at },
      ]);
      toast({ title: `You and @${req.username} are now connected` });
    } catch (e: any) {
      toast({ title: "Could not accept", description: e.message });
    }
  };

  const declineRequest = async (req: PendingRequest) => {
    try {
      await friendsService.decline(req.friendshipId);
      setPending((p) => p.filter((r) => r.friendshipId !== req.friendshipId));
      toast({ title: `Declined @${req.username}` });
    } catch (e: any) {
      toast({ title: "Could not decline", description: e.message });
    }
  };

  const removeFriend = async (
    friend: FriendProfile
  ) => {
    try {
      await friendsService.remove(friend.id);

      setFriends((prev) =>
        prev.filter((f) => f.id !== friend.id)
      );

      toast({
        title: `Removed @${friend.username}`,
      });
    } catch (e: any) {
      toast({
        title: "Could not remove friend",
        description: e.message,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <ErrorNote
            message={error}
            onRetry={load}
          />
        </div>
      </Layout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────

  if (loading || !profile) {
    return (
      <Layout>
        <div className="container py-16 max-w-2xl">
          <SkeletonBlock className="h-80 w-full" />
        </div>
      </Layout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Stats grid
  // ─────────────────────────────────────────────────────────────

  const cells = [
    {
      label: "Best WPM",
      value: stats?.bestWpm ?? "—",
    },
    {
      label: "Average WPM",
      value: stats?.avgWpm ?? "—",
    },
    {
      label: "Accuracy",
      value:
        stats?.avgAccuracy != null
          ? `${stats.avgAccuracy}%`
          : "—",
    },
    {
      label: "Tests",
      value: stats?.count ?? 0,
    },
    {
      label: "Friends",
      value: friends.length,
    },
    {
      label: "Member",
      value: new Date(
        profile.joinedAt
      ).getFullYear(),
    },
  ];

  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        {/* Profile Card */}

        <div className="bg-card hairline border rounded-md p-12 shadow-sheet text-center">
          <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center mb-6">
            <span className="font-serif text-2xl text-foreground">
              {profile.name[0]?.toUpperCase() ?? "?"}
            </span>
          </div>

          {editing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full px-3 py-2 text-[14px] rounded border border-border bg-background text-center font-serif"
              />

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="w-full px-3 py-2 text-[12px] rounded border border-border bg-background text-center text-muted-foreground"
              />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl tracking-tight">
                {profile.name}
              </h1>

              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
                @{profile.username} · since{" "}
                {new Date(
                  profile.joinedAt
                ).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </>
          )}

          {/* Stats */}

          <div className="mt-10 grid grid-cols-3 gap-px bg-border/70 hairline border rounded-md overflow-hidden">
            {cells.map((cell) => (
              <div
                key={cell.label}
                className="bg-card p-5"
              >
                <div className="font-serif text-xl text-foreground">
                  {cell.value}
                </div>

                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">
                  {cell.label}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}

          <div className="mt-10 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
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
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground"
                >
                  Edit profile
                </button>

                <button
                  onClick={signOut}
                  className="px-4 py-2 text-[13px] rounded border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Friends */}

        <section className="mt-10 bg-card hairline border rounded-md p-8 shadow-sheet">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl tracking-tight">
              Friends
            </h2>

            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {friends.length} connected
            </span>
          </div>

          {/* Search */}

          <div className="mt-6">
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by username..."
              className="w-full px-3 py-2 text-[14px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />

            {searching && (
              <div className="mt-3">
                <LoadingLine label="Searching" />
              </div>
            )}

            {/* Search Results */}

            {results.length > 0 && (
              <ul className="mt-4 divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {results.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3 bg-card"
                  >
                    <div>
                      <div className="text-[13px] text-foreground">
                        {r.name}
                      </div>

                      <div className="text-[11px] text-muted-foreground">
                        @{r.username}
                      </div>
                    </div>

                    {friendIds.has(r.id) ? (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Friend
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          addFriend(r)
                        }
                        className="text-[12px] px-3 py-1.5 rounded bg-primary text-primary-foreground"
                      >
                        Add
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {search &&
              !searching &&
              results.length === 0 && (
                <p className="mt-4 text-[12px] text-muted-foreground">
                  No users matching "{search}".
                </p>
              )}
          </div>

          {/* Pending Requests */}
          {pending.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Friend requests · {pending.length}
              </h3>
              <ul className="divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {pending.map((r) => (
                  <li
                    key={r.friendshipId}
                    className="flex items-center justify-between px-4 py-3 bg-card"
                  >
                    <div>
                      <div className="text-[13px] text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        @{r.username} · wants to connect
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(r)}
                        className="text-[12px] px-3 py-1.5 rounded bg-primary text-primary-foreground"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineRequest(r)}
                        className="text-[12px] px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Friends List */}

          <div className="mt-8">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Your friends
            </h3>

            {friends.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                No friends yet — search above to
                connect.
              </p>
            ) : (
              <ul className="divide-y divide-border/70 hairline border rounded-md overflow-hidden">
                {friends.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between px-4 py-3 bg-card"
                  >
                    <div>
                      <div className="text-[13px] text-foreground">
                        {f.name}
                      </div>

                      <div className="text-[11px] text-muted-foreground">
                        @{f.username}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        removeFriend(f)
                      }
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