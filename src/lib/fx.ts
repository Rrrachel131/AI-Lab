import { useEffect, useState } from "react";
import { useStore } from "@/lib/data/store";

let webglCache: boolean | null = null;
export function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/** Whether to render real-time WebGL. Falls back when the user turns effects off, prefers reduced motion, or WebGL is missing. */
export function useFx() {
  const settings = useStore((s) => s.settings);
  const [env, setEnv] = useState<{ ready: boolean; webgl: boolean; prefersReduced: boolean }>({ ready: false, webgl: false, prefersReduced: false });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnv({ ready: true, webgl: detectWebGL(), prefersReduced: mq.matches });
  }, []);
  const motion = !settings.reduceMotion && !env.prefersReduced;
  return {
    ready: env.ready,
    webgl: env.webgl,
    motion,
    enabled3D: env.ready && env.webgl && settings.effects,
    density: settings.particleDensity,
    cursorGlow: settings.cursorGlow && settings.effects && motion,
  };
}

export const DENSITY = { low: 2200, medium: 5200, high: 9000 } as const;
