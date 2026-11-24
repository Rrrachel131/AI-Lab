import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Completion checkbox with a small ignition burst. */
export function TaskCheck({ done, onToggle, className, dark }: { done: boolean; onToggle: () => void; className?: string; dark?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? "标记为未完成" : "标记为完成"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "relative grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300",
        done ? "border-brand bg-brand text-primary-foreground" : dark ? "border-ink-foreground/30 hover:border-amber" : "border-ink/25 hover:border-brand",
        className,
      )}
    >
      <AnimatePresence>
        {done && (
          <motion.span key="c" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
            <Check className="size-3 text-ink-foreground" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {done && (
          <motion.span key="burst" className="pointer-events-none absolute inset-0 rounded-full border-2 border-amber" initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 2.4, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />
        )}
      </AnimatePresence>
    </button>
  );
}
