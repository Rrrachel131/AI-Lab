import { daysBetween, todayISO } from "./dates";
import type { ISODate, Milestone, Phase, Project, Task } from "./types";

export interface Progress {
  done: number;
  total: number;
  ratio: number; // 0..1, 0 when no tasks
}

export function taskProgress(tasks: Task[]): Progress {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export type PhaseState = "done" | "active" | "upcoming";

/** Phase state is derived from its real tasks: done when every task is done, active for the first unfinished phase. */
export function phaseStates(phases: Phase[], tasks: Task[]): Map<string, PhaseState> {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const out = new Map<string, PhaseState>();
  let activeAssigned = false;
  for (const ph of sorted) {
    const own = tasks.filter((t) => t.phaseId === ph.id);
    const complete = own.length > 0 && own.every((t) => t.status === "done");
    if (complete) out.set(ph.id, "done");
    else if (!activeAssigned) {
      out.set(ph.id, "active");
      activeAssigned = true;
    } else out.set(ph.id, "upcoming");
  }
  return out;
}

/** Share of elapsed project time, clamped to 0..1. */
export function timeElapsed(project: Pick<Project, "startDate" | "deadline">, today: ISODate = todayISO()) {
  const span = daysBetween(project.startDate, project.deadline);
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, daysBetween(project.startDate, today) / span));
}

/** Positive = ahead of schedule, negative = behind (task ratio minus time ratio). */
export function scheduleDelta(project: Project, tasks: Task[], today: ISODate = todayISO()) {
  return taskProgress(tasks).ratio - timeElapsed(project, today);
}

export function isOverdue(t: Pick<Task, "status" | "dueDate">, today: ISODate = todayISO()) {
  return t.status !== "done" && !!t.dueDate && t.dueDate < today;
}

/** Today's workbench: unfinished tasks planned for or due on/before today, plus tasks completed today. */
export function todayTasks(tasks: Task[], today: ISODate = todayISO()) {
  return tasks.filter((t) => {
    if (t.status === "done") return t.completedAt?.slice(0, 10) === today;
    return (t.plannedFor !== null && t.plannedFor <= today) || (t.dueDate !== null && t.dueDate <= today);
  });
}

export function nextMilestone(milestones: Milestone[]) {
  return [...milestones].filter((m) => !m.achievedAt).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}
