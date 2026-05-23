import { Finger } from "./fingerMap";

/**
 * Animated ghost hand overlay.
 * - Resting fingers visible at home row.
 * - Active finger gets a soft glow + scale pulse via CSS transitions.
 * Pure SVG so it scales crisply and animates at 60fps.
 */
export const GhostHand = ({ active }: { active: Finger | null }) => {
  const isOn = (f: Finger) => active === f;

  const fingerClass = (f: Finger) =>
    [
      "transition-all duration-200 ease-out origin-bottom",
      isOn(f)
        ? "fill-accent/30 stroke-accent drop-shadow-[0_0_6px_hsl(var(--accent)/0.55)]"
        : "fill-muted/40 stroke-border",
    ].join(" ");

  return (
    <svg viewBox="0 0 360 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="ghost-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* LEFT HAND */}
      <g strokeWidth="0.8">
        <rect x="20" y="30" width="14" height="60" rx="6" className={fingerClass("LP")} style={{ transform: isOn("LP") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="38" y="18" width="14" height="72" rx="6" className={fingerClass("LR")} style={{ transform: isOn("LR") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="56" y="10" width="14" height="80" rx="6" className={fingerClass("LM")} style={{ transform: isOn("LM") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="74" y="20" width="14" height="70" rx="6" className={fingerClass("LI")} style={{ transform: isOn("LI") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="92" y="60" width="32" height="14" rx="6" className={fingerClass("T")} transform="rotate(28 92 60)" />
        <path d="M16 86 Q14 130 50 142 L100 142 Q132 134 130 96 L130 90 L16 90 Z"
          className="fill-muted/30 stroke-border" strokeWidth="0.8" />
      </g>

      {/* RIGHT HAND (mirrored) */}
      <g strokeWidth="0.8" transform="translate(360 0) scale(-1 1)">
        <rect x="20" y="30" width="14" height="60" rx="6" className={fingerClass("RP")} style={{ transform: isOn("RP") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="38" y="18" width="14" height="72" rx="6" className={fingerClass("RR")} style={{ transform: isOn("RR") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="56" y="10" width="14" height="80" rx="6" className={fingerClass("RM")} style={{ transform: isOn("RM") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="74" y="20" width="14" height="70" rx="6" className={fingerClass("RI")} style={{ transform: isOn("RI") ? "translateY(-3px) scaleY(1.03)" : undefined }} />
        <rect x="92" y="60" width="32" height="14" rx="6" className={fingerClass("T")} transform="rotate(28 92 60)" />
        <path d="M16 86 Q14 130 50 142 L100 142 Q132 134 130 96 L130 90 L16 90 Z"
          className="fill-muted/30 stroke-border" strokeWidth="0.8" />
      </g>

      {/* Home-row anchor markers (F & J ridges) */}
      <circle cx="88" cy="146" r="1.6" className="fill-foreground/40" />
      <circle cx="272" cy="146" r="1.6" className="fill-foreground/40" />

      <line x1="180" y1="20" x2="180" y2="140" stroke="hsl(var(--border))" strokeDasharray="2 4" strokeWidth="0.5" />
    </svg>
  );
};
