import { createFileRoute } from "@tanstack/react-router";
import { animate, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ProgressBar, Reveal } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { CountUp } from "@/components/fx/CountUp";
import { EnergyCore } from "@/components/fx/Stages";
import { TaskRow } from "@/components/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { daysUntil, formatLong, relativeLabel, shiftDate, todayISO } from "@/lib/data/dates";
import { isOverdue, taskProgress, todayTasks, type Progress } from "@/lib/data/progress";
import { useStore } from "@/lib/data/store";
import type { InboxKind, Task } from "@/lib/data/types";
import { useFx } from "@/lib/fx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "今日工作台" },
      { name: "description", content: "安排今日任务，查看截止日期和完成进度，随手记录想法。" },
      { property: "og:title", content: "今日工作台" },
    ],
  }),
  component: Today,
});

const priorityOrder: Record<Task["priority"], number> = { high: 0, medium: 1, low: 2 };
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
const currentDate = new Intl.DateTimeFormat("zh-CN", { dateStyle: "full" });
const captureLabels: Record<InboxKind, string> = { idea: "想法", task: "待办", resource: "资料" };

function greeting(hour: number, name: string) {
  const salutation = hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  return name.trim() ? `${salutation}，${name.trim()}！` : `${salutation}！`;
}

function Today() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const milestones = useStore((s) => s.milestones);
  const name = useStore((s) => s.settings.userName);
  const addTask = useStore((s) => s.addTask);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const today = todayISO();

  const list = todayTasks(tasks, today);
  const progress = taskProgress(list);
  const activeProjects = projects.filter((p) => p.status === "active");
  const filtered = list.filter((task) => !filter || (task.projectId ?? "personal") === filter);
  const overdue = filtered.filter((task) => isOverdue(task, today));
  const remaining = filtered
    .filter((task) => !isOverdue(task, today))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || priorityOrder[a.priority] - priorityOrder[b.priority]);
  const deadlines = [
    ...activeProjects.map((p) => ({ id: p.id, title: p.name, date: p.deadline, kind: "项目" })),
    ...milestones.filter((m) => !m.achievedAt).map((m) => ({ id: m.id, title: m.title, date: m.date, kind: "里程碑" })),
  ].filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:px-8 md:pt-12">
      <header className="mb-7">
        <p className="mb-3 text-sm text-muted-foreground">{currentDate.format(new Date(`${today}T00:00:00`))}</p>
        <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">{greeting(new Date().getHours(), name)}</h1>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="min-w-0 space-y-5">
          <section className="surface min-w-0 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">今日任务</h2>
              {projects.length > 0 && (
                <select aria-label="按项目筛选任务" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-full rounded-lg border bg-background px-2 py-1.5 text-sm">
                  <option value="">全部任务</option>
                  <option value="personal">个人任务</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              addTask({ title: draft.trim(), plannedFor: today, projectId: filter && filter !== "personal" ? filter : null });
              setDraft("");
            }}>
              <input aria-label="任务名称" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="输入今天要做的事" className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" />
              <Button type="submit" variant="ember" disabled={!draft.trim()}><Plus /> 添加任务</Button>
            </form>
            <div className="mt-4 space-y-3">
              {overdue.length > 0 && (
                <div>
                  <h3 className="px-3 py-1 text-xs font-medium text-destructive">已逾期 · {overdue.length} 项</h3>
                  {overdue.map((task) => <TaskRow key={task.id} task={task} />)}
                </div>
              )}
              {remaining.map((task) => <TaskRow key={task.id} task={task} />)}
              {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">这里还没有任务。</p>}
            </div>
          </section>
          <QuickCapture />
        </div>

        <aside className="min-w-0 space-y-5" aria-label="进度与日期">
          <ProgressCard progress={progress} />
          <section className="surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><CalendarDays className="size-4 text-brand" /> 即将截止</h2>
            {deadlines.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">暂无即将截止的项目或里程碑。</p> : (
              <ul className="mt-2 divide-y">
                {deadlines.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3 last:pb-0">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.kind} · {formatLong(item.date)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-caramel">{relativeLabel(item.date, today)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <More title="近七天与项目进度">
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {Array.from({ length: 7 }, (_, i) => {
                const date = shiftDate(today, i - 6);
                const weekday = weekdays[new Date(`${date}T00:00:00`).getDay()];
                const completed = tasks.filter((task) => task.completedAt?.slice(0, 10) === date).length;
                return <span key={date}>周{weekday} {completed} 项</span>;
              })}
            </p>
            {activeProjects.map((project) => {
              const p = taskProgress(tasks.filter((task) => task.projectId === project.id));
              const days = daysUntil(project.deadline, today);
              return (
                <div key={project.id} className="mt-4">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2"><ProjectDot hue={project.hue} /> <span className="truncate">{project.name}</span></span>
                    <span className="shrink-0 text-xs">{p.done}/{p.total} 项</span>
                  </div>
                  <ProgressBar value={p.ratio} className="mt-2" />
                  <p className="mt-1 text-xs text-muted-foreground">{days < 0 ? `已逾期 ${-days} 天` : `截止：${relativeLabel(project.deadline, today)}`}</p>
                </div>
              );
            })}
          </More>
        </aside>
      </div>
    </div>
  );
}

function ProgressCard({ progress: { done, total, ratio } }: { progress: Progress }) {
  const { motion: enableMotion } = useFx();
  const x = useSpring(0, { stiffness: 150, damping: 24 });
  const y = useSpring(0, { stiffness: 150, damping: 24 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, #ff9d5338, transparent 58%)`;
  const pulse = useMotionValue(0);
  const previousDone = useRef(done);
  const percent = Math.round(ratio * 100);
  const allDone = total > 0 && done === total;

  useEffect(() => {
    const completed = done > previousDone.current;
    previousDone.current = done;
    if (!completed || !enableMotion) {
      pulse.set(0);
      return;
    }

    const animation = animate(pulse, [0, allDone ? 0.9 : 0.6, 0], {
      duration: allDone ? 1.35 : 0.8,
      times: [0, 0.22, 1],
    });
    return () => animation.stop();
  }, [allDone, done, enableMotion, pulse]);

  return (
    <Reveal>
      <section
        className="group dark surface-ink relative grid min-h-56 content-center overflow-hidden p-6 lg:min-h-64"
        onPointerMove={(event) => {
          if (!enableMotion || event.pointerType === "touch") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const horizontal = (event.clientX - bounds.left) / bounds.width;
          const vertical = (event.clientY - bounds.top) / bounds.height;
          x.set((horizontal - 0.5) * 24);
          y.set((vertical - 0.5) * 18);
          glowX.set(horizontal * 100);
          glowY.set(vertical * 100);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        <motion.div className="pointer-events-none absolute inset-y-0 right-0 w-2/3" style={enableMotion ? { x, y } : {}} aria-hidden="true">
          <EnergyCore energy={ratio} />
        </motion.div>
        {enableMotion && (
          <>
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: glow }} />
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_50%,#ff9d5370,transparent_72%)]" style={{ opacity: pulse }} />
          </>
        )}
        <div className="relative">
          <h2 className="text-sm font-medium text-ink-muted">今日进度</h2>
          <p aria-hidden="true" className="mt-3 font-display text-6xl leading-none tabular text-ink-foreground">
            {enableMotion ? <CountUp value={percent} duration={0.65} /> : percent}
            <span className="ml-1 text-3xl text-amber">%</span>
          </p>
          <p role="status" className="mt-3 text-sm text-ink-muted">
            {allDone ? `今日任务全部完成 · ${total} 项` : `已完成 ${done} 项，共 ${total} 项`}
          </p>
          <div role="progressbar" aria-label="今日任务完成进度" aria-valuenow={percent} className="mt-4 h-1 w-full max-w-32 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-ember transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function More({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group surface px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function QuickCapture() {
  const inbox = useStore((s) => s.inbox);
  const addInbox = useStore((s) => s.addInbox);
  const updateInbox = useStore((s) => s.updateInbox);
  const addTask = useStore((s) => s.addTask);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<InboxKind>("idea");
  const pending = inbox.filter((item) => !item.processed);
  return (
    <More title={`随手记${pending.length ? ` · ${pending.length} 条` : ""}`}>
      <form className="space-y-2" onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        addInbox(draft.trim(), kind);
        setDraft("");
        toast.success("已保存记录");
      }}>
        <textarea aria-label="记录内容" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="记一个想法、待办或资料" rows={2} className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" />
        <div className="flex items-center gap-2">
          <select aria-label="记录类型" value={kind} onChange={(e) => setKind(e.target.value as InboxKind)} className="rounded-lg border bg-background px-2 py-1.5 text-sm">
            {Object.entries(captureLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <Button type="submit" size="sm" disabled={!draft.trim()}>保存记录</Button>
        </div>
      </form>
      <ul className="mt-3 divide-y">
        {pending.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-2 py-3 last:pb-0">
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">{item.text}</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => {
              addTask({ title: item.text, plannedFor: todayISO() });
              updateInbox(item.id, { processed: true });
              toast.success("已加入今日任务");
            }}>转为任务</Button>
          </li>
        ))}
      </ul>
    </More>
  );
}
