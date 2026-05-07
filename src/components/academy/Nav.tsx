import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/practice", label: "Practice" },
  { to: "/teach", label: "Teaching" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/profile", label: "Profile" },
];

export const Nav = () => {
  const { user, signOut } = useAuth();
  return (
  <header className="border-b border-border/70 bg-background/80 backdrop-blur sticky top-0 z-50">
    <div className="container flex h-14 items-center justify-between">
      <Logo />
      <nav className="hidden md:flex items-center gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-3 py-1.5 text-[13px] rounded transition-colors ${
                isActive
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <button className="text-[13px] text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
          Sign in
        </button>
        <NavLink
          to="/practice"
          className="text-[13px] px-3.5 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Enter Academy
        </NavLink>
      </div>
    </div>
  </header>
);
