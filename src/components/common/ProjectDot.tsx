import { cn } from "@/lib/utils";

/** Project tint comes from project data (hue), so it is applied as a style. */
export function ProjectDot({ hue, className }: { hue: number; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: `hsl(${hue} 72% 52%)` }} />;
}

export function ProjectOrb({ hue, progress, className }: { hue: number; progress: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-block size-10 shrink-0 rounded-full", className)}
      style={{
        background: `radial-gradient(circle at 32% 30%, hsl(${hue + 18} 95% 78%), hsl(${hue} 75% 52%) 45%, hsl(${hue - 6} 70% 22%) 100%)`,
        boxShadow: `0 0 ${8 + progress * 26}px -4px hsl(${hue} 85% 55% / ${0.35 + progress * 0.5})`,
      }}
    />
  );
}
