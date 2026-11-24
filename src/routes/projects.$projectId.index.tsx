import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Flag, Package } from "lucide-react";
import { Chip, ProgressBar, Reveal, Ring } from "@/components/common/Page";
import { TaskRow } from "@/components/tasks/TaskRow";
import { daysUntil, formatShort, todayISO } from "@/lib/data/dates";
import { nextMilestone, scheduleDelta } from "@/lib/data/progress";
import { useProjectData } from "@/lib/data/useProject";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/")({
  head: () => ({
    meta: [
      { title: "Project Overview · ai.lab" },
      { name: "description", content: "项目目标、阶段进度、下一步任务与交付成果。" },
      { property: "og:title", content: "Project Overview · ai.lab" },
      { property: "og:description", content: "项目执行总览。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectOverview,
});

function ProjectOverview() {
  const { projectId } = Route.useParams();
  const { project, tasks, phaseInfo, deliverables, milestones } = useProjectData(projectId);
  if (!project) return null;
  const today = todayISO();
  const delta = scheduleDelta(project, tasks, today);
  const next = tasks.filter((t) => t.status !== "done").sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")).slice(0, 5);
  const ms = nextMilestone(milestones);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Reveal className="lg:col-span-8">
        <section className="surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Phases</h2>
            <Link to="/projects/$projectId/odyssey" params={{ projectId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Odyssey <ArrowUpRight className="size-3.5" /></Link>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {phaseInfo.map(({ phase, index, state, progress }) => (
              <li key={phase.id} className={cn("rounded-xl border p-4", state === "active" && "border-brand/50 bg-accent/40")}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <Chip tone={state === "done" ? "success" : state === "active" ? "brand" : "default"} className="h-5">{state === "done" ? "完成" : state === "active" ? "当前" : "待开始"}</Chip>
                </div>
                <div className="mt-3 font-medium">{phase.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{formatShort(phase.startDate)} – {formatShort(phase.endDate)} · {progress.done}/{progress.total}</div>
                <ProgressBar value={progress.ratio} className="mt-3 h-1" />
              </li>
            ))}
          </ol>
        </section>
      </Reveal>
      <Reveal delay={0.05} className="lg:col-span-4">
        <section className="surface flex h-full flex-col gap-5 p-6">
          <div className="flex items-center gap-4">
            <Ring value={Math.max(0, Math.min(1, 0.5 + delta))} size={56} stroke={4} />
            <div>
              <div className="eyebrow">Schedule</div>
              <div className={cn("font-display text-xl", delta < -0.1 ? "text-destructive" : delta > 0.05 ? "text-success" : "")}>
                {delta < -0.1 ? "落后于计划" : delta > 0.05 ? "领先于计划" : "基本按计划"}
              </div>
              <div className="text-xs text-muted-foreground">任务进度与时间进度差 {Math.round(delta * 100)}%</div>
            </div>
          </div>
          {ms && (
            <div className="rounded-xl bg-ink p-4 text-ink-foreground">
              <div className="eyebrow flex items-center gap-1.5 text-ink-muted"><Flag className="size-3" /> Next milestone</div>
              <div className="mt-2 font-medium">{ms.title}</div>
              <div className="mt-1 text-xs text-ink-muted">{ms.date} · {daysUntil(ms.date, today)} 天</div>
            </div>
          )}
          {project.description && <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>}
        </section>
      </Reveal>
      <Reveal delay={0.1} className="lg:col-span-7">
        <section className="surface p-4 md:p-6">
          <h2 className="px-2 font-display text-xl">Next up</h2>
          <div className="mt-3">
            {next.length === 0 ? <p className="px-3 py-8 text-sm text-muted-foreground">没有未完成的任务。</p> : next.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)}
          </div>
        </section>
      </Reveal>
      <Reveal delay={0.15} className="lg:col-span-5">
        <section className="surface p-6">
          <h2 className="font-display text-xl">Deliverables</h2>
          <ul className="mt-4 space-y-2">
            {deliverables.length === 0 && <li className="text-sm text-muted-foreground">在 Milestones 页添加交付成果。</li>}
            {deliverables.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border p-3">
                <Package className={cn("size-4", d.status === "delivered" ? "text-success" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{formatShort(d.dueDate)} · {d.assetIds.length} 个资产</div>
                </div>
                <Chip tone={d.status === "delivered" ? "success" : d.status === "in_progress" ? "brand" : "default"} className="h-5">{d.status === "delivered" ? "已交付" : d.status === "in_progress" ? "进行中" : "计划中"}</Chip>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
