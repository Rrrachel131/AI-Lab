import { CalendarDays, Paperclip, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { ProjectDot } from "@/components/common/ProjectDot";
import { relativeLabel, todayISO } from "@/lib/data/dates";
import { isOverdue } from "@/lib/data/progress";
import { useStore } from "@/lib/data/store";
import type { Task } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";
import { TaskCheck } from "./TaskCheck";

const PRIORITY: Record<Task["priority"], string> = { high: "bg-brand", medium: "bg-amber", low: "bg-muted-foreground/40" };

export function TaskRow({ task, showProject = true, className }: { task: Task; showProject?: boolean; className?: string }) {
  const project = useStore((s) => (task.projectId ? s.projects.find((p) => p.id === task.projectId) : undefined));
  const phase = useStore((s) => (task.phaseId ? s.phases.find((p) => p.id === task.phaseId) : undefined));
  const toggle = useStore((s) => s.toggleTask);
  const edit = useUI((s) => s.editTask);
  const done = task.status === "done";
  const overdue = isOverdue(task);
  const today = todayISO();
  return (
    <motion.div
      layout="position"
      onClick={() => edit(task.id)}
      className={cn("group flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/70", className)}
    >
      <TaskCheck done={done} onToggle={() => toggle(task.id)} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className={cn("relative w-fit max-w-full text-[0.93rem] leading-snug transition-colors", done && "text-muted-foreground")}>
          <span className="line-clamp-2">{task.title}</span>
          <motion.span className="absolute left-0 top-1/2 h-px bg-muted-foreground" initial={false} animate={{ width: done ? "100%" : "0%" }} transition={{ duration: 0.35 }} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          {task.status === "doing" && <span className="font-medium text-caramel">进行中</span>}
          {showProject && project && (
            <span className="inline-flex items-center gap-1.5">
              <ProjectDot hue={project.hue} />
              {project.name}
              {phase && <span className="opacity-60">/ {phase.name}</span>}
            </span>
          )}
          {task.dueDate && (
            <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
              <CalendarDays className="size-3" /> {relativeLabel(task.dueDate, today)}
            </span>
          )}
          {task.plannedFor === today && task.dueDate !== today && (
            <span className="inline-flex items-center gap-1"><Sun className="size-3" /> 今日计划</span>
          )}
          {task.assetIds.length > 0 && (
            <span className="inline-flex items-center gap-1"><Paperclip className="size-3" /> {task.assetIds.length}</span>
          )}
        </div>
      </div>
      <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", PRIORITY[task.priority])} title={`优先级：${task.priority}`} />
    </motion.div>
  );
}
