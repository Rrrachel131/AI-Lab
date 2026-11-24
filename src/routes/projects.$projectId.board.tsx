import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ProjectDot } from "@/components/common/ProjectDot";
import { relativeLabel } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import { useProjectData } from "@/lib/data/useProject";
import type { TaskStatus } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/board")({
  head: () => ({
    meta: [
      { title: "Board · ai.lab" },
      { name: "description", content: "拖拽式项目看板：待办、进行中、已完成。" },
      { property: "og:title", content: "Board · ai.lab" },
      { property: "og:description", content: "项目看板。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoardPage,
});

const COLS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

function BoardPage() {
  const { projectId } = Route.useParams();
  const { tasks, phases, project } = useProjectData(projectId);
  const setStatus = useStore((s) => s.setTaskStatus);
  const editTask = useUI((s) => s.editTask);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [phase, setPhase] = useState<string>("all");
  const shown = phase === "all" ? tasks : tasks.filter((t) => t.phaseId === phase);

  return (
    <div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none">
        {[{ id: "all", name: "全部阶段" }, ...phases].map((p) => (
          <button key={p.id} onClick={() => setPhase(p.id)} className={cn("h-8 shrink-0 rounded-full border px-3 text-xs", phase === p.id ? "border-ink bg-ink text-ink-foreground" : "bg-card text-muted-foreground")}>{p.name}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {COLS.map((c, ci) => {
          const items = shown.filter((t) => t.status === c.id);
          return (
            <section
              key={c.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(c.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/task");
                if (id) setStatus(id, c.id);
                setOver(null);
              }}
              className={cn("min-h-60 rounded-2xl border bg-secondary/50 p-3 transition", over === c.id && "border-brand bg-accent/50")}
            >
              <div className="flex items-center justify-between px-2 pb-3 pt-1">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
              </div>
              <ul className="space-y-2">
                {items.map((t) => (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                    onClick={() => editTask(t.id)}
                    className="cursor-grab rounded-xl border bg-card p-3 shadow-sm transition hover:shadow-lift active:cursor-grabbing"
                  >
                    <div className={cn("text-sm", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5 truncate">
                        {project && <ProjectDot hue={project.hue} />}
                        {phases.find((p) => p.id === t.phaseId)?.name ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        {t.dueDate && relativeLabel(t.dueDate)}
                        <button disabled={ci === 0} onClick={(e) => { e.stopPropagation(); const prev = COLS[ci - 1]; if (prev) setStatus(t.id, prev.id); }} className="grid size-6 place-items-center rounded-full hover:bg-secondary disabled:opacity-20" aria-label="左移"><ChevronLeft className="size-3" /></button>
                        <button disabled={ci === COLS.length - 1} onClick={(e) => { e.stopPropagation(); const nx = COLS[ci + 1]; if (nx) setStatus(t.id, nx.id); }} className="grid size-6 place-items-center rounded-full hover:bg-secondary disabled:opacity-20" aria-label="右移"><ChevronRight className="size-3" /></button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
