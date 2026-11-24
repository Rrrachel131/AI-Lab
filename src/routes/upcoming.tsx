import { createFileRoute } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Flag, FolderKanban } from "lucide-react";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { TaskRow } from "@/components/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { relativeLabel, todayISO, toISODate } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upcoming")({
  head: () => ({
    meta: [
      { title: "Upcoming · ai.lab" },
      { name: "description", content: "DDL 管理与日历：任务截止、里程碑与项目交付日。" },
      { property: "og:title", content: "Upcoming · ai.lab" },
      { property: "og:description", content: "所有 DDL，一目了然。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UpcomingPage,
});

type Ev = { id: string; date: string; type: "task" | "milestone" | "project"; title: string; hue: number; done: boolean };

function UpcomingPage() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const milestones = useStore((s) => s.milestones);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = todayISO();
  const [selected, setSelected] = useState<string>(today);
  const hue = (pid: string | null) => projects.find((p) => p.id === pid)?.hue ?? 30;

  const events = useMemo<Ev[]>(
    () => [
      ...tasks.filter((t) => t.dueDate).map((t) => ({ id: t.id, date: t.dueDate!, type: "task" as const, title: t.title, hue: hue(t.projectId), done: t.status === "done" })),
      ...milestones.map((m) => ({ id: m.id, date: m.date, type: "milestone" as const, title: m.title, hue: hue(m.projectId), done: !!m.achievedAt })),
      ...projects.map((p) => ({ id: p.id, date: p.deadline, type: "project" as const, title: `${p.name} DDL`, hue: p.hue, done: p.status === "completed" })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, milestones, projects],
  );
  const byDate = useMemo(() => {
    const m = new Map<string, Ev[]>();
    events.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [events]);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const upcoming = tasks.filter((t) => t.status !== "done" && t.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const groups = new Map<string, typeof upcoming>();
  upcoming.slice(0, 40).forEach((t) => groups.set(t.dueDate!, [...(groups.get(t.dueDate!) ?? []), t]));
  const selEvents = byDate.get(selected) ?? [];

  return (
    <PageContainer>
      <PageHeader eyebrow="Daily · Deadlines" title={<>Upcoming<span className="font-editorial italic text-caramel"> & due.</span></>} description="所有任务 DDL、里程碑与项目交付日，按日历与时间线排列。" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="surface p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">{format(month, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="上个月"><ChevronLeft /></Button>
              <Button size="sm" variant="outline" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(today); }}>今天</Button>
              <Button size="icon" variant="ghost" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="下个月"><ChevronRight /></Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-muted-foreground">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const iso = toISODate(d);
              const evs = byDate.get(iso) ?? [];
              const isToday = iso === today;
              return (
                <button key={iso} onClick={() => setSelected(iso)} className={cn("flex aspect-square flex-col items-start rounded-lg p-1.5 text-left transition md:aspect-[1.1]", !isSameMonth(d, month) && "opacity-35", selected === iso ? "bg-ink text-ink-foreground" : "hover:bg-secondary")}>
                  <span className={cn("grid size-6 place-items-center rounded-full text-xs tabular", isToday && selected !== iso && "bg-brand text-primary-foreground")}>{d.getDate()}</span>
                  <span className="mt-auto flex flex-wrap gap-0.5">
                    {evs.slice(0, 4).map((e) => (
                      <span key={e.id} className={cn("size-1.5 rounded-full", e.type === "project" ? "bg-brand" : e.type === "milestone" ? "bg-amber" : e.done ? "bg-muted-foreground/40" : "bg-current opacity-60")} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 border-t pt-4">
            <div className="eyebrow mb-2">{selected} · {relativeLabel(selected, today)}</div>
            {selEvents.length === 0 ? <p className="text-sm text-muted-foreground">这一天没有 DDL。</p> : (
              <ul className="space-y-1.5">
                {selEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    {e.type === "milestone" ? <Flag className="size-3.5 text-amber" /> : e.type === "project" ? <FolderKanban className="size-3.5 text-brand" /> : <ProjectDot hue={e.hue} />}
                    <span className={cn(e.done && "text-muted-foreground line-through")}>{e.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <section className="surface p-4 md:p-6">
          <h2 className="px-2 font-display text-2xl">Timeline</h2>
          <div className="mt-4 space-y-5">
            {groups.size === 0 && <p className="px-2 text-sm text-muted-foreground">没有带 DDL 的未完成任务。</p>}
            {Array.from(groups.entries()).map(([date, ts]) => (
              <div key={date}>
                <div className={cn("eyebrow px-3", date < today && "text-destructive", date === today && "text-brand")}>{date} · {relativeLabel(date, today)}</div>
                {ts.map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
