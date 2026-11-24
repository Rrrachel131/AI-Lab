import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { daysBetween, formatShort, shiftDate, todayISO } from "@/lib/data/dates";
import { useProjectData } from "@/lib/data/useProject";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · ai.lab" },
      { name: "description", content: "按日期展开的阶段、任务 DDL 与里程碑时间轴。" },
      { property: "og:title", content: "Timeline · ai.lab" },
      { property: "og:description", content: "项目时间轴。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const { projectId } = Route.useParams();
  const { project, phaseInfo, milestones } = useProjectData(projectId);
  const editTask = useUI((s) => s.editTask);
  if (!project) return null;
  const start = project.startDate;
  const span = Math.max(1, daysBetween(start, project.deadline));
  const pct = (d: string) => Math.max(0, Math.min(100, (daysBetween(start, d) / span) * 100));
  const today = todayISO();
  const ticks = Array.from({ length: 6 }, (_, i) => shiftDate(start, Math.round((span * i) / 5)));

  return (
    <section className="surface overflow-x-auto p-4 md:p-6">
      <div className="min-w-[720px]">
        <div className="relative ml-40 h-6 border-b">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground" style={{ left: `${pct(t)}%` }}>{formatShort(t)}</span>
          ))}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-40 right-0">
            {today >= start && today <= project.deadline && (
              <div className="absolute inset-y-0 w-px bg-brand" style={{ left: `${pct(today)}%` }}>
                <span className="absolute -top-0 left-1 font-mono text-[10px] text-brand">TODAY</span>
              </div>
            )}
          </div>
          {phaseInfo.map(({ phase, state, progress, tasks }) => {
            const s = phase.startDate ?? start;
            const e = phase.endDate ?? project.deadline;
            return (
              <div key={phase.id} className="flex items-center border-b py-3 last:border-0">
                <div className="w-40 shrink-0 pr-4">
                  <div className="truncate text-sm font-medium">{phase.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{progress.done}/{progress.total}</div>
                </div>
                <div className="relative h-10 flex-1">
                  <div
                    className={cn("absolute top-1 h-4 overflow-hidden rounded-full", state === "upcoming" ? "bg-muted" : "bg-accent")}
                    style={{ left: `${pct(s)}%`, width: `${Math.max(1.5, pct(e) - pct(s))}%` }}
                  >
                    <div className="h-full bg-ember transition-all duration-700" style={{ width: `${progress.ratio * 100}%` }} />
                  </div>
                  {tasks.filter((t) => t.dueDate).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => editTask(t.id)}
                      title={`${t.title} · ${t.dueDate}`}
                      className={cn("absolute top-6 size-2.5 -translate-x-1/2 rounded-full border-2 border-card transition hover:scale-150", t.status === "done" ? "bg-success" : t.dueDate! < today ? "bg-destructive" : "bg-ink/50")}
                      style={{ left: `${pct(t.dueDate!)}%` }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex items-center py-3">
            <div className="w-40 shrink-0 pr-4 text-sm font-medium">Milestones</div>
            <div className="relative h-8 flex-1">
              {milestones.map((m) => (
                <span key={m.id} className="absolute top-1 -translate-x-1/2" style={{ left: `${pct(m.date)}%` }} title={`${m.title} · ${m.date}`}>
                  <Flag className={cn("size-4", m.achievedAt ? "fill-amber text-caramel" : "text-muted-foreground")} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">圆点为任务 DDL（点击编辑）：绿色已完成 · 红色逾期。</p>
    </section>
  );
}
