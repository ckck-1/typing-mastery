import { Link } from "react-router-dom";
import { Layout } from "@/components/academy/Layout";

const passages = [
  "Discipline is the bridge between goals and accomplishment.",
  "The quieter you become, the more you are able to hear.",
  "Practice is the slow road from rough to refined.",
];

const features = [
  {
    n: "01",
    title: "Typing Test",
    body: "Measure speed and accuracy with curated literature, technical prose, and timed drills.",
  },
  {
    n: "02",
    title: "Teaching Mode",
    body: "Structured chapters that build muscle memory through deliberate, finger-mapped lessons.",
  },
  {
    n: "03",
    title: "Progress Tracking",
    body: "A quiet record of your improvement — words per minute, accuracy, consistency over time.",
  },
  {
    n: "04",
    title: "Leaderboards",
    body: "Compare against peers, classmates, or the global cohort. Refined emphasis, no spectacle.",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container pt-24 pb-32 md:pt-32 md:pb-40 relative">
          {/* subtle background typing animation */}
          <div className="absolute inset-0 pointer-events-none select-none opacity-[0.035] flex items-center justify-center">
            <div className="font-mono-typing text-[180px] leading-none tracking-tight whitespace-nowrap overflow-hidden">
              the_quick_brown_fox
            </div>
          </div>

          <div className="relative max-w-3xl animate-fade-up">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
              · Volume I — Foundations
            </div>
            <h1 className="font-serif text-[44px] md:text-[64px] leading-[1.05] tracking-[-0.02em] text-foreground">
              The craft of typing,<br />
              taught with <span className="italic">precision</span>.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              A focused environment for serious learners. Measure your speed, refine your form, and study at your own pace — without the noise.
            </p>
            <div className="mt-10 flex items-center gap-5">
              <Link
                to="/practice"
                className="px-5 py-2.5 rounded bg-primary text-primary-foreground text-[13px] hover:opacity-90 transition-opacity"
              >
                Start Practicing
              </Link>
              <Link to="/teach" className="text-[13px] text-foreground hover:text-muted-foreground transition-colors border-b border-border hover:border-foreground/40 pb-0.5">
                Browse curriculum →
              </Link>
            </div>
          </div>

          {/* sample sheet */}
          <div className="relative mt-20 max-w-3xl animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="bg-card hairline border rounded-md shadow-sheet p-8 md:p-10">
              <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-6">
                <span>Sample passage</span>
                <span>72 wpm · 98%</span>
              </div>
              <p className="font-mono-typing text-[18px] leading-[1.9] text-foreground/85">
                <span className="text-muted-foreground/60">{passages[0].slice(0, 28)}</span>
                <span className="bg-accent/15 text-foreground border-b border-accent">{passages[0].slice(28, 29)}</span>
                <span className="text-muted-foreground/40">{passages[0].slice(29)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/70">
        <div className="container py-20">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-2xl tracking-tight">Four disciplines</h2>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hidden md:block">§ Index</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/70 hairline border">
            {features.map((f) => (
              <div key={f.n} className="bg-background p-7 hover:bg-card transition-colors group">
                <div className="text-[11px] tracking-[0.2em] text-muted-foreground mb-8">{f.n}</div>
                <h3 className="font-serif text-lg mb-3 text-foreground">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="container py-24">
        <blockquote className="max-w-2xl mx-auto text-center">
          <p className="font-serif text-2xl md:text-3xl leading-snug text-foreground italic">
            “{passages[1]}”
          </p>
          <footer className="mt-6 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            — Foundational principle
          </footer>
        </blockquote>
      </section>
    </Layout>
  );
};

export default Index;
