import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileJson, LayoutGrid, Orbit, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, EmptyState, PageContainer, PageHeader, ProgressBar, Reveal } from "@/components/common/Page";
import { ProjectOrb } from "@/components/common/ProjectDot";
import { Universe } from "@/components/fx/Stages";
import { Button } from "@/components/ui/button";
import { daysUntil, formatLong, todayISO } from "@/lib/data/dates";
import { taskProgress } from "@/lib/data/progress";
import { useStore } from "@/lib/data/store";
import type { Project } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects · ai.lab" },
      { name: "description", content: "所有项目的卡片视图与沉浸式 Universe 项目宇宙。" },
      { property: "og:title", content: "Projects · ai.lab" },
      { property: "og:description", content: "每个项目都是一颗随真实进度发光的数字星体。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

const STATUS_LABEL: Record<Project["status"], string> = { active: "进行中", paused: "暂停", completed: "已完成", archived: "已归档" };

function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const phases = useStore((s) => s.phases);
  const defaultView = useStore((s) => s.settings.defaultProjectView);
  const updateSettings = useStore((s) => s.updateSettings);
  const openQuick = useUI((s) => s.openQuick);
  const navigate = useNavigate();
  const [view, setView] = useState<"cards" | "universe">(defaultView);
  const [status, setStatus] = useState<Project["status"] | "all">("all");
  const today = todayISO();

  const rows = useMemo(
    () =>
      projects.map((p) => {
        const own = tasks.filter((t) => t.projectId === p.id);
        return { p, prog: taskProgress(own), phaseCount: phases.filter((x) => x.projectId === p.id).length, taskCount: own.length };
      }),
    [projects, tasks, phases],
  );
  const shown = status === "all" ? rows : rows.filter((r) => r.p.status === status);
  const overall = taskProgress(tasks.filter((t) => t.projectId)).ratio;
  const setV = (v: "cards" | "universe") => {
    setView(v);
    updateSettings({ defaultProjectView: v });
  };

  const viewToggle = (
    <div className="inline-flex rounded-full border bg-card p-1">
      {([["universe", Orbit, "Universe"], ["cards", LayoutGrid, "Cards"]] as const).map(([v, Icon, label]) => (
        <button key={v} onClick={() => setV(v)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm transition", view === v ? "bg-ink text-ink-foreground" : "text-muted-foreground")}>
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Workspace · ${projects.length} projects`}
        title={<>Projects<span className="font-editorial italic text-caramel"> universe</span></>}
        description="每个项目都是一颗星体：体积来自任务数量，亮度来自真实完成度。点击星体进入它的 Odyssey 星轨。"
        actions={
          <>
            {viewToggle}
            <Button variant="outline" onClick={() => openQuick("import")}><FileJson /> 导入</Button>
            <Button variant="ember" onClick={() => openQuick("project")}><Plus /> 新项目</Button>
          </>
        }
      />

      {projects.length === 0 ? (
        <EmptyState icon={<Orbit />} title="宇宙还是空的" description="创建第一个项目，或从模板 / JSON 计划开始。" action={<Button variant="ember" onClick={() => openQuick("project")}><Plus /> 新项目</Button>} />
      ) : view === "universe" ? (
        <Reveal>
          <section className="dark surface-ink relative h-[68vh] min-h-[460px] overflow-hidden">
            <Universe
              bodies={rows.filter((r) => r.p.status !== "archived").map((r) => ({ id: r.p.id, name: r.p.name, hue: r.p.hue, progress: r.prog.ratio, taskCount: r.taskCount, daysLeft: daysUntil(r.p.deadline, today), status: r.p.status }))}
              overall={overall}
              onEnter={(id) => navigate({ to: "/projects/$projectId/odyssey", params: { projectId: id } })}
            />
            <div className="pointer-events-none absolute left-6 top-6">
              <div className="eyebrow text-ink-muted">Universe core</div>
              <div className="mt-1 font-display text-4xl tabular text-ink-foreground">{Math.round(overall * 100)}<span className="text-lg text-amber">%</span></div>
              <div className="text-xs text-ink-muted">全部项目任务完成度</div>
            </div>
            <div className="pointer-events-none absolute bottom-5 left-6 right-6 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              <span>Click a body to enter its Odyssey</span>
              <span className="hidden md:inline">Size = tasks · Glow = progress</span>
            </div>
          </section>
        </Reveal>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-1.5", view === "universe" ? "mt-10" : "")}>
        {(["all", "active", "paused", "completed", "archived"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("h-8 rounded-full border px-3 text-xs transition", status === s ? "border-ink bg-ink text-ink-foreground" : "bg-card text-muted-foreground")}>
            {s === "all" ? "全部" : STATUS_LABEL[s]} · {s === "all" ? rows.length : rows.filter((r) => r.p.status === s).length}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map(({ p, prog, phaseCount, taskCount }, i) => {
          const left = daysUntil(p.deadline, today);
          return (
            <Reveal key={p.id} delay={i * 0.04}>
              <Link to="/projects/$projectId" params={{ projectId: p.id }} className="surface group flex h-full flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <ProjectOrb hue={p.hue} progress={prog.ratio} className="transition duration-500 group-hover:scale-110" />
                  <Chip tone={p.status === "active" ? "brand" : "default"}>{STATUS_LABEL[p.status]}</Chip>
                </div>
                <div className="mt-6">
                  <div className="eyebrow">{p.category}</div>
                  <h3 className="mt-1 font-display text-2xl">{p.name}</h3>
                  {p.goal && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.goal}</p>}
                </div>
                <div className="mt-auto pt-6">
                  <div className="mb-2 flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>{prog.done}/{taskCount} 任务 · {phaseCount} 阶段</span>
                    <span className="font-display text-lg tabular text-foreground">{Math.round(prog.ratio * 100)}%</span>
                  </div>
                  <ProgressBar value={prog.ratio} />
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>{formatLong(p.startDate)} → {formatLong(p.deadline)}</span>
                    <span className={left < 0 ? "text-destructive" : left <= 7 ? "text-caramel" : ""}>{left >= 0 ? `${left}d left` : `${-left}d over`}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </PageContainer>
  );
}
