import { animate, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

/** Rolls a number to its real value. */
export function CountUp({ value, decimals = 0, suffix = "", className, duration = 1.1 }: { value: number; decimals?: number; suffix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  useEffect(() => {
    const ctrl = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = v.toFixed(decimals) + suffix;
    });
    return () => {
      ctrl.stop();
      unsub();
    };
  }, [value, decimals, suffix, duration, mv]);
  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals) + suffix}
    </span>
  );
}
