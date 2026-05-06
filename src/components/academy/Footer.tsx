export const Footer = () => (
  <footer className="border-t border-border/70 mt-24">
    <div className="container py-10 flex flex-col md:flex-row justify-between gap-6 text-[12px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="font-serif text-foreground">Typing Academy</span>
        <span>·</span>
        <span>Est. 2026</span>
      </div>
      <div className="flex gap-6">
        <a className="hover:text-foreground transition-colors" href="#">About</a>
        <a className="hover:text-foreground transition-colors" href="#">Curriculum</a>
        <a className="hover:text-foreground transition-colors" href="#">Institutions</a>
        <a className="hover:text-foreground transition-colors" href="#">Contact</a>
      </div>
    </div>
  </footer>
);
