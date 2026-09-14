export function RadialScore({ score, level }: { score: number; level: "low" | "moderate" | "high" }) {
  const color =
    level === "high"
      ? "var(--risk-high)"
      : level === "moderate"
        ? "var(--risk-moderate)"
        : "var(--risk-low)";
  return (
    <div
      className="relative flex size-24 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, var(--muted) 0deg)`,
      }}
    >
      <div className="flex size-19 flex-col items-center justify-center rounded-full bg-card">
        <span className="text-xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
