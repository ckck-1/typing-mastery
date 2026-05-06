// Shared loading + error primitives — keep them visually quiet to match the
// "quiet luxury" aesthetic. Used across pages so the production feel is consistent.

export const LoadingLine = ({ label = "Loading" }: { label?: string }) => (
  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-foreground/40 animate-ping" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground/70" />
    </span>
    {label}
  </div>
);

export const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-secondary/70 rounded ${className}`} />
);

export const ErrorNote = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="bg-card hairline border rounded-md p-5 flex items-center justify-between gap-4">
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-destructive/80 mb-1">Error</div>
      <div className="text-[13px] text-foreground">{message}</div>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-[12px] text-muted-foreground hover:text-foreground border-b border-border pb-0.5"
      >
        Retry
      </button>
    )}
  </div>
);
