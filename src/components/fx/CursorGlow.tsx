import { useEffect, useRef } from "react";
import { useFx } from "@/lib/fx";

/** Soft warm light that follows the pointer on paper surfaces. */
export function CursorGlow() {
  const fx = useFx();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fx.cursorGlow) return;
    let raf = 0;
    let x = window.innerWidth / 2,
      y = window.innerHeight / 3,
      tx = x,
      ty = y;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      if (ref.current) ref.current.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [fx.cursorGlow]);
  if (!fx.cursorGlow) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 size-[600px] rounded-full opacity-60 mix-blend-multiply blur-3xl [background:radial-gradient(circle,color-mix(in_oklab,var(--amber)_22%,transparent),transparent_65%)]"
    />
  );
}
