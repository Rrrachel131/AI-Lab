import { lazy, Suspense, type ReactNode } from "react";
import { useFx } from "@/lib/fx";
import { cn } from "@/lib/utils";
import { FxErrorBoundary } from "./ErrorBoundary";
import type { UniverseBody } from "@/components/universe/types";
import type { OdysseyNode } from "@/components/odyssey/types";

const EnergyCoreScene = lazy(() => import("./three/EnergyCoreScene"));
const UniverseScene = lazy(() => import("@/components/universe/UniverseScene"));
const OdysseyScene = lazy(() => import("@/components/odyssey/OdysseyScene"));

function Stage({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const fx = useFx();
  if (!fx.enabled3D) return <>{fallback}</>;
  return (
    <FxErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </FxErrorBoundary>
  );
}

/* ——— Energy core ——— */
export function CoreFallback({ energy, className }: { energy: number; className?: string }) {
  return (
    <div className={cn("absolute inset-0 grid place-items-center", className)} aria-hidden>
      <div className="relative grid size-[62%] max-h-72 max-w-72 place-items-center">
        <div className="absolute inset-0 rounded-full border border-ink-foreground/10" />
        <div className="absolute inset-[12%] rounded-full border border-dashed border-amber/25 animate-orbit-slow" />
        <div
          className="animate-ember rounded-full bg-ember shadow-ember blur-[1px]"
          style={{ width: `${34 + energy * 22}%`, height: `${34 + energy * 22}%`, opacity: 0.55 + energy * 0.45 }}
        />
      </div>
    </div>
  );
}

export function EnergyCore({ energy }: { energy: number }) {
  const fx = useFx();
  return (
    <Stage fallback={<CoreFallback energy={energy} />}>
      <EnergyCoreScene energy={energy} density={fx.density} />
    </Stage>
  );
}

/* ——— Universe ——— */
export function UniverseFallback({ bodies, onEnter }: { bodies: UniverseBody[]; onEnter: (id: string) => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="-100 -60 200 120" className="h-full w-full max-w-4xl">
        {bodies.map((_, i) => (
          <ellipse key={i} cx="0" cy="0" rx={26 + i * 12} ry={(26 + i * 12) * 0.42} className="fill-none stroke-ink-foreground/15" strokeWidth="0.3" />
        ))}
        <circle r="8" className="fill-brand" opacity="0.9" />
        <circle r="13" className="fill-brand" opacity="0.12" />
        {bodies.map((b, i) => {
          const rx = 26 + i * 12;
          const a = i * 2.2 + 0.6;
          const x = Math.cos(a) * rx;
          const y = Math.sin(a) * rx * 0.42;
          const r = 3 + Math.min(4, Math.sqrt(b.taskCount));
          return (
            <g key={b.id} transform={`translate(${x} ${y})`} className="cursor-pointer" onClick={() => onEnter(b.id)} role="button" aria-label={b.name}>
              <circle r={r + 2} className="fill-none stroke-amber" strokeWidth="0.5" strokeDasharray={`${b.progress * 2 * Math.PI * (r + 2)} 999`} />
              <circle r={r} style={{ fill: `hsl(${b.hue} 70% 52%)` }} />
              <text y={-r - 4} textAnchor="middle" className="fill-ink-foreground text-[4px] font-medium">{b.name}</text>
              <text y={-r - 0.5} textAnchor="middle" className="fill-amber font-mono text-[2.8px]">{Math.round(b.progress * 100)}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Universe(props: { bodies: UniverseBody[]; overall: number; onEnter: (id: string) => void }) {
  const fx = useFx();
  return (
    <Stage fallback={<UniverseFallback bodies={props.bodies} onEnter={props.onEnter} />}>
      <UniverseScene {...props} density={fx.density} motion={fx.motion} />
    </Stage>
  );
}

/* ——— Odyssey ——— */
export function OdysseyFallback({ nodes, energy, selectedId, onSelect }: { nodes: OdysseyNode[]; energy: number; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const n = nodes.length;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="-110 -70 220 140" className="h-full w-full max-w-5xl">
        <ellipse rx="80" ry="34" className="fill-none stroke-ink-foreground/15" strokeWidth="0.4" />
        <ellipse rx="80" ry="34" className="fill-none stroke-amber animate-flow" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.6" />
        <circle r={12 + energy * 6} className="fill-brand" opacity="0.85" />
        <circle r={22 + energy * 6} className="fill-brand" opacity="0.1" />
        {nodes.map((node, i) => {
          const a = Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
          const x = Math.cos(a) * 80;
          const y = Math.sin(a) * 34;
          const cls = node.state === "done" ? "fill-amber" : node.state === "active" ? "fill-brand" : "fill-ink-muted";
          return (
            <g key={node.id} transform={`translate(${x} ${y})`} className="cursor-pointer" onClick={() => onSelect(node.id)} role="button" aria-label={node.name}>
              {selectedId === node.id && <circle r="6.5" className="fill-none stroke-brand" strokeWidth="0.6" />}
              <circle r="3.6" className={cls} />
              <text y="-8" textAnchor="middle" className="fill-ink-foreground text-[4.2px] font-medium">{node.name}</text>
              <text y="10" textAnchor="middle" className="fill-amber font-mono text-[3px]">{Math.round(node.progress * 100)}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Odyssey(props: { nodes: OdysseyNode[]; energy: number; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const fx = useFx();
  return (
    <Stage fallback={<OdysseyFallback {...props} />}>
      <OdysseyScene {...props} density={fx.density} motion={fx.motion} />
    </Stage>
  );
}
