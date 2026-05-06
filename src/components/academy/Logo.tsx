import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 group ${className}`}>
    <div className="h-7 w-7 rounded-sm bg-primary flex items-center justify-center">
      <span className="font-serif text-primary-foreground text-sm leading-none">T</span>
    </div>
    <span className="font-serif text-[15px] tracking-tight text-foreground">
      Typing <span className="italic text-muted-foreground">Academy</span>
    </span>
  </Link>
);
