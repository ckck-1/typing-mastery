import { Layout } from "@/components/academy/Layout";

const stats = [
  { label: "Best WPM", value: "82" },
  { label: "Average WPM", value: "71" },
  { label: "Accuracy", value: "97.4%" },
  { label: "Tests", value: "248" },
  { label: "Lessons", value: "14 / 24" },
  { label: "Rank", value: "#142" },
];

export default function Profile() {
  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        <div className="bg-card hairline border rounded-md p-12 shadow-sheet text-center">
          <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center mb-6">
            <span className="font-serif text-2xl text-foreground">A</span>
          </div>
          <h1 className="font-serif text-2xl tracking-tight">Adrian Hale</h1>
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
            Member since February 2026
          </p>

          <div className="mt-10 grid grid-cols-3 gap-px bg-border/70 hairline border rounded-md overflow-hidden">
            {stats.map((s) => (
              <div key={s.label} className="bg-card p-5">
                <div className="font-serif text-xl text-foreground">{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center gap-3">
            <button className="px-4 py-2 text-[13px] rounded bg-primary text-primary-foreground">Edit profile</button>
            <button className="px-4 py-2 text-[13px] rounded border border-border text-foreground hover:bg-secondary transition-colors">Settings</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
