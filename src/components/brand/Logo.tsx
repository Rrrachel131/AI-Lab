import { cn } from "@/lib/utils";

/** Abstract orbit mark: a core, a tilted orbit and a satellite. */
export function LogoMark({ className, spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <radialGradient id="ailab-core" cx="40%" cy="35%" r="70%">
          <stop offset="0%" className="[stop-color:var(--amber)]" />
          <stop offset="60%" className="[stop-color:var(--brand)]" />
          <stop offset="100%" className="[stop-color:var(--caramel)]" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="5.2" fill="url(#ailab-core)" />
      <g className={cn(spin && "origin-center animate-orbit")} style={{ transformBox: "fill-box" }}>
        <ellipse cx="16" cy="16" rx="13" ry="5.4" transform="rotate(-28 16 16)" className="fill-none stroke-current" strokeWidth="1.3" opacity="0.85" />
        <circle cx="27.4" cy="10" r="1.9" className="fill-brand" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[1.05rem] leading-none tracking-[-0.04em]", className)}>
      ai<span className="text-brand">.</span>lab
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}
