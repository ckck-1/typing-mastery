import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface TestResult {
  id: number;
  wpm: number | string;
  accuracy: number | string;
  duration: number;
  createdAt: string;
}

interface ProfileData {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [history, setHistory] = useState<TestResult[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(false);

      const [profileRes, historyRes] = await Promise.all([
        api.get("/profile/me"),
        api.get("/tests/results"),
      ]);

      setProfile(profileRes.data.data);

      setHistory(
        Array.isArray(historyRes.data.data)
          ? historyRes.data.data
          : []
      );
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    if (!history.length) {
      return {
        bestWpm: "—",
        avgWpm: "—",
        avgAccuracy: "—",
        count: 0,
        series: [],
      };
    }

    const wpms = history.map((r) =>
      Math.round(Number(r.wpm))
    );

    const accuracies = history.map((r) =>
      Number(r.accuracy)
    );

    const count = history.length;

    return {
      bestWpm: Math.max(...wpms),
      avgWpm: Math.round(
        wpms.reduce((a, b) => a + b, 0) / count
      ),
      avgAccuracy: Math.round(
        accuracies.reduce((a, b) => a + b, 0) / count
      ),
      count,
      series: [...wpms].reverse(),
    };
  }, [history]);

  const recentSessions = useMemo(
    () => history.slice(0, 8),
    [history]
  );

  const cards = [
    {
      label: "Best WPM",
      value: stats.bestWpm,
      note: "Personal Record",
    },
    {
      label: "Average WPM",
      value: stats.avgWpm,
      note: "All Sessions",
    },
    {
      label: "Average Accuracy",
      value:
        stats.count > 0
          ? `${stats.avgAccuracy}%`
          : "—",
      note: "Typing Precision",
    },
    {
      label: "Tests Completed",
      value: stats.count,
      note: "Lifetime",
    },
  ];

  const firstName =
    profile?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const series = stats.series;
  const max = series.length
    ? Math.max(...series)
    : 1;

  const min = series.length
    ? Math.min(...series)
    : 0;

  return (
    <Layout>
      <div className="container py-12">

        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Dashboard
            </div>

            <h1 className="font-serif text-3xl tracking-tight">
              Welcome back, {firstName}
            </h1>
          </div>

          <div className="hidden md:block text-sm text-muted-foreground">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorNote
              message="Failed to load dashboard."
              onRetry={fetchDashboard}
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-card border rounded-md p-6"
            >
              <div className="text-xs uppercase text-muted-foreground mb-3">
                {card.label}
              </div>

              {loading ? (
                <SkeletonBlock className="h-8 w-24" />
              ) : (
                <div className="text-4xl font-serif">
                  {card.value}
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-2">
                {card.note}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          <section className="lg:col-span-2 bg-card border rounded-md p-6">

            <div className="mb-6">
              <h2 className="text-xl font-serif">
                Progress
              </h2>

              <p className="text-sm text-muted-foreground">
                Last {series.length} sessions
              </p>
            </div>

            <div className="h-48">

              {loading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : series.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No typing tests completed yet.
                </div>
              ) : (
                <svg
                  viewBox="0 0 300 100"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    points={series
                      .map(
                        (v, i) =>
                          `${(i /
                            Math.max(
                              1,
                              series.length - 1
                            )) *
                            300},${
                            100 -
                            ((v - min) /
                              Math.max(
                                1,
                                max - min
                              )) *
                              80 -
                            10
                          }`
                      )
                      .join(" ")}
                  />
                </svg>
              )}
            </div>
          </section>

          <section className="bg-card border rounded-md p-6">

            <h2 className="font-serif text-xl mb-6">
              Recent Activity
            </h2>

            {loading ? (
              <SkeletonBlock className="h-32 w-full" />
            ) : recentSessions.length === 0 ? (
              <p className="text-muted-foreground">
                No tests yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {recentSessions.map((test) => (
                  <li
                    key={test.id}
                    className="flex justify-between border-b pb-4"
                  >
                    <div>
                      <div>
                        {test.duration}s session
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(
                          test.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div>
                        {Math.round(
                          Number(test.wpm)
                        )}{" "}
                        WPM
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {Math.round(
                          Number(test.accuracy)
                        )}
                        %
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </Layout>
  );
}