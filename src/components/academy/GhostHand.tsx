import { Finger } from "./fingerMap";

// A quiet, schematic pair of hands. Active finger is softly highlighted.
export const GhostHand = ({ active }: { active: Finger | null }) => {
  const on = (f: Finger) =>
    active === f
      ? "fill-accent/25 stroke-accent/70"
      : "fill-muted/40 stroke-border";

  // Finger geometry: rounded rectangles for each finger, palms below.
  // Left hand fingers (from pinky to index): LP LR LM LI ; thumb T
  // Right hand mirrors.
  return (
    <svg viewBox="0 0 360 160" className="w-full h-full" aria-hidden="true">
      {/* LEFT HAND */}
      <g strokeWidth="0.8">
        {/* fingers */}
        <rect x="20" y="30" width="14" height="60" rx="6" className={on("LP")} />
        <rect x="38" y="18" width="14" height="72" rx="6" className={on("LR")} />
        <rect x="56" y="10" width="14" height="80" rx="6" className={on("LM")} />
        <rect x="74" y="20" width="14" height="70" rx="6" className={on("LI")} />
        {/* thumb */}
        <rect x="92" y="60" width="32" height="14" rx="6" className={on("T")} transform="rotate(28 92 60)" />
        {/* palm */}
        <path d="M16 86 Q14 130 50 142 L100 142 Q132 134 130 96 L130 90 L16 90 Z"
          className="fill-muted/30 stroke-border" strokeWidth="0.8" />
      </g>

      {/* RIGHT HAND (mirrored) */}
      <g strokeWidth="0.8" transform="translate(360 0) scale(-1 1)">
        <rect x="20" y="30" width="14" height="60" rx="6" className={on("RP")} />
        <rect x="38" y="18" width="14" height="72" rx="6" className={on("RR")} />
        <rect x="56" y="10" width="14" height="80" rx="6" className={on("RM")} />
        <rect x="74" y="20" width="14" height="70" rx="6" className={on("RI")} />
        <rect x="92" y="60" width="32" height="14" rx="6" className={on("T")} transform="rotate(28 92 60)" />
        <path d="M16 86 Q14 130 50 142 L100 142 Q132 134 130 96 L130 90 L16 90 Z"
          className="fill-muted/30 stroke-border" strokeWidth="0.8" />
      </g>

      {/* center divider hint */}
      <line x1="180" y1="20" x2="180" y2="140" stroke="hsl(var(--border))" strokeDasharray="2 4" strokeWidth="0.5" />
    </svg>
  );
};
