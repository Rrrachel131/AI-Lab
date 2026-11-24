import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Chip, EmptyState, PageContainer, ProgressBar } from "@/components/common/Page";
import { ProjectOrb } from "@/components/common/ProjectDot";
import { CountUp } from "@/components/fx/CountUp";
import { Button } from "@/components/ui/button";
import { daysUntil, formatLong, todayISO } from "@/lib/data/dates";
import { timeElapsed } from "@/lib/data/progress";
import { useProjectData } from "@/lib/data/useProject";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project · ai.lab" },
      { name: "description", content: "项目总览、Odyssey 星轨、任务、时间轴、看板、里程碑与资产。" },
      { property: "og:title", content: "Project · ai.lab" },
      { property: "og:description", content: "一个项目的完整执行空间。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectLayout,
});

const TABS = [
  { to: "/projects/$projectId", label: "Overview", exact: true },
  { to: "/projects/$projectId/odyssey", label: "Odyssey" },
  { to: "/projects/$projectId/tasks", label: "Tasks" },
  { to: "/projects/$projectId/timeline", label: "Timeline" },
  { to: "/projects/$projectId/board", label: "Board" },
  { to: "/projects/$projectId/milestones", label: "Milestones" },
  { to: "/projects/$projectId/assets", label: "Assets" },
  { to: "/projects/$projectId/settings", label: "Settings" },
] as const;

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const { project, progress } = useProjectData(projectId);
  const openQuick = useUI((s) => s.openQuick);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const today = todayISO();

  if (!project) {
    return (
      <PageContainer>
        <EmptyState title="项目不存在或已删除" action={<Button asChild variant="outline"><Link to="/projects"><ArrowLeft /> 返回项目</Link></Button>} />
      </PageContainer>
    );
  }
  const left = daysUntil(project.deadline, today);
  const elapsed = timeElapsed(project, today);

  return (
    <PageContainer className="pt-4 md:pt-8">
      <Link to="/projects" className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Projects</Link>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <ProjectOrb hue={project.hue} progress={progress.ratio} className="mt-1 size-12" />
          <div className="min-w-0">
            <div className="eyebrow flex items-center gap-2">{project.category} <Chip tone="brand" className="h-5">{project.status}</Chip></div>
            <h1 className="mt-1 font-display text-[2.2rem] leading-none md:text-[3.2rem]">{project.name}</h1>
            {project.goal && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{project.goal}</p>}
          </div>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <div className="eyebrow">Progress</div>
            <div className="font-display text-4xl tabular"><CountUp value={Math.round(progress.ratio * 100)} /><span className="text-lg text-brand">%</span></div>
          </div>
          <div>
            <div className="eyebrow">DDL</div>
            <div className={cn("font-display text-4xl tabular", left < 0 && "text-destructive")}>{left >= 0 ? <CountUp value={left} /> : `-${-left}`}<span className="text-lg text-muted-foreground">d</span></div>
          </div>
          <Button variant="ember" size="icon" onClick={() => openQuick("task", project.id)} aria-label="新任务"><Plus /></Button>
        </div>
      </header>
      <div className="mt-6 grid gap-1.5">
        <ProgressBar value={progress.ratio} />
        <div className="relative h-1 rounded-full bg-muted">
          <div className="absolute inset-y-0 left-0 rounded-full bg-ink/25" style={{ width: `${elapsed * 100}%` }} />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{formatLong(project.startDate)}</span>
          <span>任务进度 vs 时间进度 {Math.round(elapsed * 100)}%</span>
          <span>{formatLong(project.deadline)}</span>
        </div>
      </div>
      <nav className="sticky top-14 z-20 -mx-4 mt-6 overflow-x-auto border-b bg-background/85 px-4 backdrop-blur scrollbar-none md:-mx-8 md:px-8 lg:top-0 lg:-mx-12 lg:px-12">
        <ul className="flex gap-1">
          {TABS.map((t) => {
            const href = t.to.replace("$projectId", projectId);
            const on = "exact" in t ? pathname === href || pathname === href + "/" : pathname.startsWith(href);
            return (
              <li key={t.to}>
                <Link to={t.to} params={{ projectId }} className={cn("relative inline-flex h-11 items-center px-3 text-sm transition-colors", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {t.label}
                  {on && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="pt-6">
        <Outlet />
      </div>
    </PageContainer>
  );
}
