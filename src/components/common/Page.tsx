import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-5 pb-8 md:flex-row md:items-end md:justify-between md:pb-10", className)}>
      <div className="max-w-2xl">
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h1 className="font-display text-[2.4rem] leading-[0.95] md:text-[3.6rem]">{title}</h1>
        {description && <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-24 pt-6 md:px-8 md:pt-10 lg:px-12", className)}>{children}</div>;
}

/** Staggered card entrance. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground [&_svg]:size-5">{icon}</div>}
      <div className="font-medium">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "ink" | "amber" }) {
  const fill = tone === "ink" ? "bg-ink" : tone === "amber" ? "bg-amber" : "bg-ember";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <motion.div className={cn("h-full rounded-full", fill)} initial={{ width: 0 }} animate={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}

export function Ring({ value, size = 44, stroke = 3, className }: { value: number; size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className={cn("-rotate-90", className)} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-brand" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
  );
}

export function Chip({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "brand" | "ink" | "danger" | "success" }) {
  const tones = {
    default: "bg-secondary text-secondary-foreground",
    brand: "bg-accent text-accent-foreground",
    ink: "bg-ink text-ink-foreground",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/12 text-success",
  } as const;
  return <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium [&_svg]:size-3", tones[tone], className)}>{children}</span>;
}

export function LocalModeBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground", className)} title="数据仅保存在此浏览器中（本地模式）">
      <span className="size-1.5 rounded-full bg-warning" />
      Local mode
    </span>
  );
}
