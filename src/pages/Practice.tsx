import { useState, useEffect, useRef, useMemo } from "react";
import { Layout } from "@/components/academy/Layout";
import { ErrorNote, SkeletonBlock } from "@/components/academy/States";
import { useTestPassage, useSaveTestResult } from "@/hooks/api";

type ModeType = "quote" | "custom" | "lesson";

export default function Practice() {
  const [mode, setMode] = useState<ModeType>("quote");
  const { data: passage, isLoading, isError, refetch } = useTestPassage(mode);
  const { mutate: saveResult, isPending: isSaving } = useSaveTestResult();

  // Core typing engine states
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Hooks directly into your clean, normalized text string
  const targetText = passage?.contentText ?? "";

  // Reset engine states when shifting modes or receiving a new passage stream
  const resetEngine = () => {
    setInput("");
    setStartTime(null);
    setEndTime(null);
    setErrorsCount(0);
    setIsCompleted(false);
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  useEffect(() => {
    resetEngine();
  }, [passage]);

  // Handle active keyboard entry values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isCompleted) return;

    // Start tracking performance timing on the initial keystroke
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    // Capture incremental typing errors (safeguarded against backspacing anomalies)
    if (val.length > input.length) {
      const addedChar = val[val.length - 1];
      const correspondingTargetChar = targetText[val.length - 1];
      if (addedChar !== correspondingTargetChar) {
        setErrorsCount((prev) => prev + 1);
      }
    }

    setInput(val);

    // Evaluate completion boundaries matching the passage length
    if (val.length >= targetText.length && targetText.length > 0) {
      const completionTime = Date.now();
      setEndTime(completionTime);
      setIsCompleted(true);

      const elapsedSeconds = (completionTime - (startTime || completionTime)) / 1000;
      const duration = Math.max(elapsedSeconds, 1);
      
      // Calculate WPM based on standard 5-character word averages
      const wordCount = targetText.length / 5;
      const minutes = duration / 60;
      const wpm = Math.round(wordCount / minutes);

      // Determine true stroke accuracy factoring complete mistypes
      const totalTyped = targetText.length + errorsCount;
      const accuracy = Math.max(0, Math.min(100, Math.round((targetText.length / totalTyped) * 100)));

      // Dispatch results downstream to backends and XP engines
      saveResult({
        wpm,
        accuracy,
        duration: Math.round(duration),
        mode,
        passageId: passage?.id ?? 0,
      });
    }
  };

  // Computes dynamic mid-test scoring logs
  const currentMetrics = useMemo(() => {
    if (!startTime) return { wpm: 0, accuracy: 100 };
    const currentEnd = endTime || Date.now();
    const elapsedSec = (currentEnd - startTime) / 1000;
    const duration = Math.max(elapsedSec, 1);
    
    const correctChars = input.split("").filter((char, idx) => char === targetText[idx]).length;
    const wpm = Math.round((correctChars / 5) / (duration / 60));
    const totalTyped = input.length + errorsCount;
    const accuracy = totalTyped === 0 ? 100 : Math.round((correctChars / totalTyped) * 100);

    return { wpm, accuracy };
  }, [input, startTime, endTime, errorsCount, targetText]);

  const focusInputArea = () => {
    if (!isCompleted) hiddenInputRef.current?.focus();
  };

  if (isError) {
    return (
      <Layout>
        <div className="container py-12">
          <ErrorNote message="Failed to sync practice module parameters." onRetry={() => refetch()} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        {/* Dynamic header panel tracking normalized context paths */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b pb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
              Practice Layer — {passage?.source ?? "Global Source"}
            </div>
            <h1 className="font-serif text-2xl tracking-tight">Instrument diagnostics</h1>
          </div>

          {/* Mode switching tabs */}
          <div className="flex bg-muted p-1 rounded-md text-[13px] self-start sm:self-center">
            {(["quote", "custom", "lesson"] as ModeType[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-sm font-medium capitalize transition-all ${
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time score boards */}
        <div className="grid grid-cols-3 gap-6 mb-8 text-center sm:text-left">
          <div className="bg-card border hairline rounded p-4 shadow-sheet">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Speed</div>
            <div className="text-3xl font-serif tabular-nums font-medium">
              {currentMetrics.wpm} <span className="text-[14px] font-sans text-muted-foreground">WPM</span>
            </div>
          </div>
          <div className="bg-card border hairline rounded p-4 shadow-sheet">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Accuracy</div>
            <div className="text-3xl font-serif tabular-nums font-medium">
              {currentMetrics.accuracy}<span className="text-[18px] font-sans text-muted-foreground">%</span>
            </div>
          </div>
          <div className="bg-card border hairline rounded p-4 shadow-sheet">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Progress</div>
            <div className="text-3xl font-serif tabular-nums font-medium">
              {targetText.length > 0 ? Math.round((input.length / targetText.length) * 100) : 0}
              <span className="text-[18px] font-sans text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Typing interactive console window wrapper */}
        <div 
          onClick={focusInputArea}
          className={`bg-card border hairline rounded-lg p-8 shadow-sheet min-h-[220px] relative cursor-text transition-all duration-300 ${
            isLoading ? "opacity-70 pointer-events-none" : ""
          } ${isCompleted ? "ring-1 ring-emerald-500/30 border-emerald-500/20 bg-emerald-500/[0.01]" : ""}`}
        >
          {/* Main hidden input pipeline */}
          <input
            ref={hiddenInputRef}
            type="text"
            className="absolute opacity-0 inset-0 w-full h-full cursor-text z-0"
            value={input}
            onChange={handleInputChange}
            disabled={isLoading || isCompleted}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {isLoading ? (
            <div className="space-y-3">
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-5 w-11/12" />
              <SkeletonBlock className="h-5 w-4/5" />
            </div>
          ) : (
            <div className="font-mono text-lg leading-relaxed tracking-wide text-muted-foreground select-none relative z-10 break-words whitespace-pre-wrap">
              {targetText.split("").map((char, index) => {
                let colorClass = "text-muted-foreground/50";
                let isCurrent = index === input.length;

                if (index < input.length) {
                  colorClass = input[index] === char 
                    ? "text-foreground font-medium" 
                    : "text-destructive bg-destructive/10 border-b border-destructive";
                }

                return (
                  <span key={index} className={`${colorClass} ${isCurrent ? "bg-primary/20 border-l border-primary -ml-[1px] animate-pulse" : ""}`}>
                    {char}
                  </span>
                );
              })}
            </div>
          )}

          {/* Test finish completion dialog overlay curtain */}
          {isCompleted && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center text-center p-6 z-20 animate-fade-in">
              <span className="text-emerald-600 text-sm font-medium tracking-widest uppercase mb-1">Sequence clear</span>
              <h3 className="font-serif text-xl mb-4 text-foreground">Performance logs & XP dispatched</h3>
              <button
                onClick={() => refetch()}
                disabled={isSaving}
                className="px-5 py-2 text-[13px] bg-primary text-primary-foreground font-medium rounded shadow hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isSaving ? "Saving telemetry..." : "Initialize Next Sequence"}
              </button>
            </div>
          )}
        </div>

        {!isCompleted && (
          <div className="mt-4 text-center text-[12px] text-muted-foreground italic">
            {!startTime ? "Strike any character key inside the box to initialize your timer." : "Keep spelling accurately..."}
          </div>
        )}
      </div>
    </Layout>
  );
}