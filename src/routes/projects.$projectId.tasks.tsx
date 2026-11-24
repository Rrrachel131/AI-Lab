import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/data/store";
import { useProjectData } from "@/lib/data/useProject";
import type { TaskStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks · ai.lab" },
      { name: "description", content: "按阶段分组的项目任务清单。" },
      { property: "og:title", content: "Tasks · ai.lab" },
      { property: "og:description", content: "项目任务管理。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { projectId } = Route.useParams();
  const { phaseInfo, tasks } = useProjectData(projectId);
  const addTask = useStore((s) => s.addTask);
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const loose = tasks.filter((t) => !t.phaseId);
  const groups = [...phaseInfo.map((p) => ({ id: p.phase.id, name: p.phase.name, index: p.index, tasks: p.tasks, end: p.phase.endDate })), ...(loose.length ? [{ id: "none", name: "未分阶段", index: -1, tasks: loose, end: null }] : [])];
  const pass = (s: TaskStatus) => status === "all" || s === status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {(["all", "todo", "doing", "done"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={cn("h-8 rounded-full border px-3 text-xs", status === s ? "border-ink bg-ink text-ink-foreground" : "bg-card text-muted-foreground")}>
            {s === "all" ? "全部" : s === "todo" ? "待办" : s === "doing" ? "进行中" : "已完成"} · {s === "all" ? tasks.length : tasks.filter((t) => t.status === s).length}
          </button>
        ))}
      </div>
      {groups.map((g) => {
        const shown = g.tasks.filter((t) => pass(t.status)).sort((a, b) => a.order - b.order);
        return (
          <section key={g.id} className="surface p-4 md:p-5">
            <div className="flex items-center justify-between px-2">
              <h3 className="flex items-baseline gap-3 font-display text-lg">
                {g.index >= 0 && <span className="font-mono text-xs text-muted-foreground">{String(g.index + 1).padStart(2, "0")}</span>}
                {g.name}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">{g.tasks.filter((t) => t.status === "done").length}/{g.tasks.length}</span>
            </div>
            <div className="mt-2">
              {shown.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)}
              {shown.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">没有符合条件的任务</p>}
            </div>
            <form
              className="mt-2 flex gap-2 px-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = drafts[g.id]?.trim();
                if (!v) return;
                addTask({ title: v, projectId, phaseId: g.id === "none" ? null : g.id, dueDate: g.end });
                setDrafts((d) => ({ ...d, [g.id]: "" }));
              }}
            >
              <input value={drafts[g.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [g.id]: e.target.value }))} placeholder="添加任务…" className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-brand" />
              <Button size="sm" variant="outline" type="submit"><Plus /></Button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
