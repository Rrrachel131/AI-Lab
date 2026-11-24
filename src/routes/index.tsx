import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CornerDownLeft, Flame, Plus } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Chip, PageContainer, ProgressBar, Reveal } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { CountUp } from "@/components/fx/CountUp";
import { EnergyCore } from "@/components/fx/Stages";
import { TaskRow } from "@/components/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { daysUntil, shiftDate, todayISO, toISODate } from "@/lib/data/dates";
import { isOverdue, taskProgress, todayTasks } from "@/lib/data/progress";
import { useStore } from "@/lib/data/store";
import type { InboxKind } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today · ai.lab" },
      { name: "description", content: "今日工作台：跨项目待办、DDL 倒计时与真实完成进度。" },
      { property: "og:title", content: "Today · ai.lab" },
      { property: "og:description", content: "Build something great — 你的今日项目工作台。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Today,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Today() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const milestones = useStore((s) => s.milestones);
  const settings = useStore((s) => s.settings);
  const addTask = useStore((s) => s.addTask);
  const openQuick = useUI((s) => s.openQuick);
  const today = todayISO();
  const [filter, setFilter] = useState<string | "all">("all");
  const [draft, setDraft] = useState("");

  const list = useMemo(() => todayTasks(tasks, today), [tasks, today]);
  const filtered = filter === "all" ? list : list.filter((t) => (t.projectId ?? "personal") === filter);
  const overdue = filtered.filter((t) => isOverdue(t, today));
  const rest = filtered
    .filter((t) => !isOverdue(t, today))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || ["high", "medium", "low"].indexOf(a.priority) - ["high", "medium", "low"].indexOf(b.priority));
  const prog = taskProgress(list);
  const projectIdsToday = Array.from(new Set(list.map((t) => t.projectId ?? "personal")));

  const deadlines = useMemo(() => {
    const items = [
      ...projects.filter((p) => p.status === "active").map((p) => ({ id: p.id, kind: "project" as const, title: p.name, date: p.deadline, hue: p.hue })),
      ...milestones.filter((m) => !m.achievedAt).map((m) => ({ id: m.id, kind: "milestone" as const, title: m.title, date: m.date, hue: projects.find((p) => p.id === m.projectId)?.hue ?? 30 })),
    ];
    return items.filter((i) => i.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  }, [projects, milestones, today]);

  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = shiftDate(today, i - 6);
      return { d, n: tasks.filter((t) => t.completedAt?.slice(0, 10) === d).length };
    });
  }, [tasks, today]);
  const weekMax = Math.max(1, ...week.map((w) => w.n));
  const streak = (() => {
    let s = 0;
    for (let i = week.length - 1; i >= 0; i--) {
      if ((week[i]?.n ?? 0) > 0) s++;
      else if (i !== week.length - 1) break;
    }
    return s;
  })();

  const focus = projects
    .filter((p) => p.status === "active")
    .map((p) => {
      const own = tasks.filter((t) => t.projectId === p.id);
      const next = own.filter((t) => t.status !== "done").sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))[0];
      return { p, prog: taskProgress(own), next };
    });

  return (
    <PageContainer>
      <Reveal>
        <div className="flex flex-col gap-6 pb-8 md:flex-row md:items-end md:justify-between md:pb-10">
          <div>
            <div className="eyebrow mb-3">{format(new Date(), "EEEE · MMMM d, yyyy")}</div>
            <h1 className="font-display text-[2.6rem] leading-[0.92] md:text-[4.4rem]">
              {greeting()}
              {settings.userName ? `, ${settings.userName}` : ""}.
              <br />
              <span className="font-editorial italic text-caramel">Build something great.</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openQuick("inbox")}>快速记录</Button>
            <Button variant="ember" onClick={() => openQuick("task")}><Plus /> 新任务</Button>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Energy core — today's real completion */}
        <Reveal delay={0.05} className="lg:col-span-5 lg:row-span-2">
          <section className="dark surface-ink relative flex h-[420px] flex-col justify-between overflow-hidden p-6 lg:h-full lg:min-h-[520px]">
            <EnergyCore energy={prog.ratio} />
            <div className="relative flex items-center justify-between">
              <span className="eyebrow text-ink-muted">Today's energy</span>
              <Chip className="bg-ink-foreground/10 text-ink-foreground">{prog.done}/{prog.total} tasks</Chip>
            </div>
            <div className="pointer-events-none relative">
              <div className="flex items-baseline gap-1 font-display text-[5.5rem] leading-none tabular text-ink-foreground">
                <CountUp value={Math.round(prog.ratio * 100)} />
                <span className="text-3xl text-amber">%</span>
              </div>
              <p className="mt-2 max-w-xs text-sm text-ink-muted">
                {prog.total === 0 ? "今天还没有安排任务。把一件事加入今日，能量核心就会开始运转。" : prog.ratio === 1 ? "今日任务全部完成。能量核心已满载。" : `还剩 ${prog.total - prog.done} 项。每完成一项，能量核心都会更亮。`}
              </p>
            </div>
          </section>
        </Reveal>

        {/* Today list */}
        <Reveal delay={0.1} className="lg:col-span-7 lg:row-span-2">
          <section className="surface flex h-full flex-col p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <h2 className="font-display text-2xl">Today</h2>
              <div className="flex max-w-full gap-1 overflow-x-auto scrollbar-none">
                <FilterPill on={filter === "all"} onClick={() => setFilter("all")}>全部</FilterPill>
                {projectIdsToday.map((id) => {
                  const p = projects.find((x) => x.id === id);
                  return (
                    <FilterPill key={id} on={filter === id} onClick={() => setFilter(id)}>
                      {p ? <ProjectDot hue={p.hue} /> : null}
                      {p?.name ?? "个人"}
                    </FilterPill>
                  );
                })}
              </div>
            </div>
            <form
              className="mx-2 mt-4 flex items-center gap-2 rounded-xl border bg-background px-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                addTask({ title: draft.trim(), plannedFor: today, projectId: filter !== "all" && filter !== "personal" ? filter : null });
                setDraft("");
              }}
            >
              <Plus className="size-4 text-muted-foreground" />
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="添加到今日…  回车创建" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <CornerDownLeft className="size-3.5 text-muted-foreground" />
            </form>
            <div className="mt-3 flex-1 space-y-4 overflow-y-auto lg:max-h-[440px]">
              {overdue.length > 0 && (
                <div>
                  <div className="eyebrow px-3 pb-1 text-destructive">Overdue · {overdue.length}</div>
                  {overdue.map((t) => <TaskRow key={t.id} task={t} />)}
                </div>
              )}
              <div>
                {overdue.length > 0 && rest.length > 0 && <div className="eyebrow px-3 pb-1">Today</div>}
                {rest.map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
              {filtered.length === 0 && (
                <div className="px-3 py-12 text-center text-sm text-muted-foreground">
                  今天很清爽。在项目任务里点「加入今日」，或在上方直接添加。
                </div>
              )}
            </div>
          </section>
        </Reveal>

        {/* DDL countdown */}
        <Reveal delay={0.15} className="lg:col-span-4">
          <section className="surface h-full p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Countdown</h2>
              <Link to="/upcoming" className="text-muted-foreground hover:text-foreground" aria-label="查看 Upcoming"><ArrowUpRight className="size-4" /></Link>
            </div>
            <ul className="mt-4 divide-y">
              {deadlines.length === 0 && <li className="py-6 text-sm text-muted-foreground">暂无即将到来的 DDL。</li>}
              {deadlines.map((d, i) => {
                const n = daysUntil(d.date, today);
                return (
                  <li key={d.id} className="flex items-center gap-4 py-3">
                    <div className={cn("w-14 font-display text-3xl leading-none tabular", i === 0 ? "text-brand" : "")}>
                      <CountUp value={n} />
                      <span className="ml-0.5 text-xs text-muted-foreground">d</span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{d.title}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ProjectDot hue={d.hue} />{d.kind === "project" ? "项目 DDL" : "里程碑"} · {d.date}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>

        <Reveal delay={0.2} className="lg:col-span-4">
          <QuickCapture />
        </Reveal>

        {/* Week rhythm */}
        <Reveal delay={0.25} className="lg:col-span-4">
          <section className="surface h-full p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">This week</h2>
              <Chip tone="brand"><Flame /> {streak} day streak</Chip>
            </div>
            <div className="mt-6 flex h-28 items-end gap-2">
              {week.map((w) => (
                <div key={w.d} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div className={cn("w-full rounded-md transition-all duration-700", w.d === today ? "bg-ember" : "bg-ink/10")} style={{ height: `${Math.max(6, (w.n / weekMax) * 100)}%` }} title={`${w.n} 项完成`} />
                  </div>
                  <span className={cn("font-mono text-[10px]", w.d === today ? "text-foreground" : "text-muted-foreground")}>{format(new Date(w.d + "T00:00"), "EEEEE")}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">近 7 天共完成 {week.reduce((a, w) => a + w.n, 0)} 项任务</p>
          </section>
        </Reveal>

        {/* Cross-project focus */}
        <Reveal delay={0.3} className="lg:col-span-12">
          <section className="surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Across projects</h2>
              <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">全部项目 →</Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {focus.length === 0 && <p className="text-sm text-muted-foreground">还没有进行中的项目。</p>}
              {focus.map(({ p, prog: pg, next }) => (
                <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} className="group rounded-xl border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium"><ProjectDot hue={p.hue} /> {p.name}</span>
                    <span className="font-mono text-xs tabular text-muted-foreground">{Math.round(pg.ratio * 100)}%</span>
                  </div>
                  <ProgressBar value={pg.ratio} className="mt-3" />
                  <div className="mt-3 truncate text-xs text-muted-foreground">{next ? <>下一步 · <span className="text-foreground">{next.title}</span></> : "所有任务已完成"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">DDL {daysUntil(p.deadline, today) >= 0 ? `还有 ${daysUntil(p.deadline, today)} 天` : `已逾期 ${-daysUntil(p.deadline, today)} 天`}</div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
      <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{toISODate(new Date())} · From curiosity to intelligence.</p>
    </PageContainer>
  );
}

function FilterPill({ on, children, onClick }: { on: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition", on ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-secondary")}>
      {children}
    </button>
  );
}

function QuickCapture() {
  const add = useStore((s) => s.addInbox);
  const count = useStore((s) => s.inbox.filter((i) => !i.processed).length);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<InboxKind>("idea");
  return (
    <section className="surface flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Capture</h2>
        <Link to="/inbox" className="text-xs text-muted-foreground hover:text-foreground">Inbox · {count}</Link>
      </div>
      <form
        className="mt-4 flex flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          add(text.trim(), kind);
          setText("");
          toast.success("已收集到 Inbox");
        }}
      >
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="一闪而过的想法，先记下来…" className="min-h-24 flex-1 resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-brand" />
        <div className="flex items-center gap-1.5">
          {(["idea", "task", "resource"] as InboxKind[]).map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)} className={cn("h-7 rounded-full border px-2.5 text-[11px]", kind === k ? "border-ink bg-ink text-ink-foreground" : "text-muted-foreground")}>
              {k === "idea" ? "想法" : k === "task" ? "任务" : "资料"}
            </button>
          ))}
          <Button type="submit" size="sm" className="ml-auto" disabled={!text.trim()}>收集</Button>
        </div>
      </form>
    </section>
  );
}
