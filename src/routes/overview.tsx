import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, FolderKanban, Library, ListTodo } from "lucide-react";
import { useMemo } from "react";
import { PageContainer, PageHeader, ProgressBar, Reveal } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { CountUp } from "@/components/fx/CountUp";
import { daysUntil, shiftDate, todayISO } from "@/lib/data/dates";
import { isOverdue, scheduleDelta, taskProgress, timeElapsed } from "@/lib/data/progress";
import { useStore } from "@/lib/data/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview · ai.lab" },
      { name: "description", content: "所有项目、任务、DDL 与资产的全局总览。" },
      { property: "og:title", content: "Overview · ai.lab" },
      { property: "og:description", content: "全局项目健康度。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const assets = useStore((s) => s.assets);
  const devlogs = useStore((s) => s.devlogs);
  const today = todayISO();
  const prog = taskProgress(tasks);
  const overdue = tasks.filter((t) => isOverdue(t, today));
  const active = projects.filter((p) => p.status === "active");
  const weekAhead = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate >= today && t.dueDate <= shiftDate(today, 7)).length;

  const trend = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const d = shiftDate(today, i - 27);
        return tasks.filter((t) => t.completedAt?.slice(0, 10) === d).length;
      }),
    [tasks, today],
  );
  const max = Math.max(1, ...trend);
  const stats = [
    { label: "Active projects", value: active.length, Icon: FolderKanban },
    { label: "Open tasks", value: tasks.filter((t) => t.status !== "done").length, Icon: ListTodo },
    { label: "Completed", value: prog.done, Icon: CheckCircle2 },
    { label: "Assets", value: assets.length, Icon: Library },
  ];

  return (
    <PageContainer>
      <PageHeader eyebrow="Workspace · Overview" title={<>Everything,<span className="font-editorial italic text-caramel"> at a glance.</span></>} />
      <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-12">
        <Reveal className="md:col-span-6 lg:col-span-5 lg:row-span-2">
          <section className="surface-ink flex h-full flex-col justify-between p-7">
            <div className="eyebrow text-ink-muted">Total completion</div>
            <div>
              <div className="font-display text-[6rem] leading-none tabular text-ink-foreground"><CountUp value={Math.round(prog.ratio * 100)} /><span className="text-3xl text-amber">%</span></div>
              <p className="mt-2 text-sm text-ink-muted">{prog.done} / {prog.total} 项任务已完成，覆盖 {projects.length} 个项目。</p>
            </div>
            <div className="mt-8 flex h-20 items-end gap-1">
              {trend.map((n, i) => (
                <div key={i} className={cn("flex-1 rounded-sm", i === trend.length - 1 ? "bg-brand" : "bg-ink-foreground/15")} style={{ height: `${Math.max(4, (n / max) * 100)}%` }} title={`${n}`} />
              ))}
            </div>
            <div className="mt-2 font-mono text-[10px] text-ink-muted">近 28 天每日完成数</div>
          </section>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:col-span-6 lg:col-span-7">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={0.05 * (i + 1)}>
            <section className="surface h-full p-5">
              <s.Icon className="size-4 text-caramel" />
              <div className="mt-6 font-display text-4xl tabular"><CountUp value={s.value} /></div>
              <div className="eyebrow mt-1">{s.label}</div>
            </section>
          </Reveal>
        ))}
        </div>
        <Reveal delay={0.2} className="md:col-span-6 lg:col-span-7">
          <section className="surface h-full p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn("size-4", overdue.length ? "text-destructive" : "text-muted-foreground")} />
              <h2 className="font-display text-xl">Attention</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{overdue.length} 项逾期 · 未来 7 天到期 {weekAhead} 项</p>
            <ul className="mt-3 space-y-1">
              {overdue.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{t.title}</span><span className="shrink-0 font-mono text-xs text-destructive">{t.dueDate}</span></li>
              ))}
            </ul>
          </section>
        </Reveal>
        <Reveal delay={0.25} className="md:col-span-6 lg:col-span-12">
          <section className="surface overflow-x-auto p-6">
            <h2 className="font-display text-xl">Project health</h2>
            <table className="mt-4 w-full min-w-[640px] text-sm">
              <thead className="eyebrow text-left">
                <tr><th className="pb-3 font-normal">Project</th><th className="pb-3 font-normal">Progress</th><th className="pb-3 font-normal">Time</th><th className="pb-3 font-normal">Schedule</th><th className="pb-3 text-right font-normal">DDL</th></tr>
              </thead>
              <tbody className="divide-y">
                {projects.map((p) => {
                  const own = tasks.filter((t) => t.projectId === p.id);
                  const pr = taskProgress(own);
                  const d = scheduleDelta(p, own, today);
                  const left = daysUntil(p.deadline, today);
                  return (
                    <tr key={p.id}>
                      <td className="py-3"><Link to="/projects/$projectId" params={{ projectId: p.id }} className="flex items-center gap-2 font-medium hover:text-brand"><ProjectDot hue={p.hue} />{p.name}</Link></td>
                      <td className="w-48 py-3 pr-6"><div className="flex items-center gap-2"><ProgressBar value={pr.ratio} /><span className="w-9 font-mono text-xs">{Math.round(pr.ratio * 100)}%</span></div></td>
                      <td className="w-40 py-3 pr-6"><div className="flex items-center gap-2"><ProgressBar value={timeElapsed(p, today)} tone="ink" /><span className="w-9 font-mono text-xs">{Math.round(timeElapsed(p, today) * 100)}%</span></div></td>
                      <td className={cn("py-3 text-xs", d < -0.1 ? "text-destructive" : d > 0.05 ? "text-success" : "text-muted-foreground")}>{d < -0.1 ? "Behind" : d > 0.05 ? "Ahead" : "On track"}</td>
                      <td className="py-3 text-right font-mono text-xs">{left >= 0 ? `${left}d` : `${-left}d over`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </Reveal>
        <Reveal delay={0.3} className="md:col-span-6 lg:col-span-12">
          <section className="surface p-6">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl">Recent dev logs</h2><Link to="/devlogs" className="text-sm text-muted-foreground hover:text-foreground">全部 →</Link></div>
            <ul className="mt-3 divide-y">
              {devlogs.slice(0, 4).map((l) => (
                <li key={l.id} className="flex gap-4 py-3 text-sm"><span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{l.date}</span><span className="eyebrow w-20 shrink-0">{l.kind}</span><span className="truncate">{l.title}</span></li>
              ))}
              {devlogs.length === 0 && <li className="py-3 text-sm text-muted-foreground">暂无日志</li>}
            </ul>
          </section>
        </Reveal>
      </div>
    </PageContainer>
  );
}
