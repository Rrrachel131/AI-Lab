import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, Package, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Odyssey } from "@/components/fx/Stages";
import { TaskCheck } from "@/components/tasks/TaskCheck";
import { formatShort } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import { useProjectData } from "@/lib/data/useProject";
import type { DeliverableStatus } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/odyssey")({
  head: () => ({
    meta: [
      { title: "Odyssey · ai.lab" },
      { name: "description", content: "项目星轨：按实际阶段生成的轨道节点与能量核心。" },
      { property: "og:title", content: "Odyssey · ai.lab" },
      { property: "og:description", content: "在星轨上查看每个阶段的任务与交付成果。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OdysseyPage,
});

const NEXT_STATUS: Record<DeliverableStatus, DeliverableStatus> = { planned: "in_progress", in_progress: "delivered", delivered: "planned" };

function OdysseyPage() {
  const { projectId } = Route.useParams();
  const { project, phaseInfo, deliverables, milestones, progress } = useProjectData(projectId);
  const toggleTask = useStore((s) => s.toggleTask);
  const updateDeliverable = useStore((s) => s.updateDeliverable);
  const addTask = useStore((s) => s.addTask);
  const editTask = useUI((s) => s.editTask);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (selected === null) setSelected(phaseInfo.find((p) => p.state === "active")?.phase.id ?? phaseInfo[0]?.phase.id ?? null);
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nodes = useMemo(() => phaseInfo.map((p) => ({ id: p.phase.id, index: p.index, name: p.phase.name, state: p.state, progress: p.progress.ratio, taskCount: p.progress.total })), [phaseInfo]);
  const sel = phaseInfo.find((p) => p.phase.id === selected) ?? null;
  if (!project) return null;

  return (
    <div className="dark -mx-4 md:-mx-8 lg:-mx-0">
      <section className="surface-ink relative h-[78vh] min-h-[560px] overflow-hidden rounded-none lg:rounded-3xl">
        {nodes.length === 0 ? (
          <div className="grid h-full place-items-center text-ink-muted">在项目设置中添加阶段，星轨会自动生成节点。</div>
        ) : (
          <Odyssey nodes={nodes} energy={progress.ratio} selectedId={selected} onSelect={setSelected} />
        )}
        <div className="pointer-events-none absolute left-5 top-5 md:left-8 md:top-8">
          <div className="eyebrow text-ink-muted">Odyssey · {nodes.length} phases</div>
          <div className="mt-1 font-display text-3xl text-ink-foreground md:text-5xl">{project.name}</div>
          <div className="mt-1 font-mono text-xs text-amber">{progress.done}/{progress.total} tasks · {Math.round(progress.ratio * 100)}% energy</div>
        </div>

        {/* phase strip for quick / accessible selection */}
        <div className="absolute inset-x-0 bottom-0 flex gap-1.5 overflow-x-auto p-4 scrollbar-none md:p-6">
          {phaseInfo.map((p) => (
            <button
              key={p.phase.id}
              onClick={() => setSelected(p.phase.id)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs transition",
                selected === p.phase.id ? "border-brand bg-brand/15 text-ink-foreground" : "border-ink-foreground/10 bg-ink/60 text-ink-muted hover:text-ink-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", p.state === "done" ? "bg-amber" : p.state === "active" ? "bg-brand" : "bg-ink-muted")} />
              {String(p.index + 1).padStart(2, "0")} {p.phase.name}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {sel && (
            <motion.aside
              key={sel.phase.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-20 right-3 top-28 flex w-[min(380px,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border border-ink-foreground/10 bg-ink/80 text-ink-foreground backdrop-blur-md md:right-6 md:top-6"
            >
              <div className="border-b border-ink-foreground/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-amber">Phase {String(sel.index + 1).padStart(2, "0")} · {sel.state}</span>
                  <button onClick={() => setSelected(null)} className="text-ink-muted hover:text-ink-foreground" aria-label="关闭"><X className="size-4" /></button>
                </div>
                <h3 className="mt-2 font-display text-2xl">{sel.phase.name}</h3>
                {sel.phase.description && <p className="mt-1 text-sm text-ink-muted">{sel.phase.description}</p>}
                <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-ink-muted">
                  <span>{formatShort(sel.phase.startDate)} – {formatShort(sel.phase.endDate)}</span>
                  <span className="text-amber">{sel.progress.done}/{sel.progress.total}</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-foreground/10">
                  <motion.div className="h-full bg-ember" initial={{ width: 0 }} animate={{ width: `${sel.progress.ratio * 100}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div>
                  <div className="eyebrow mb-2 text-ink-muted">Tasks</div>
                  <ul className="space-y-1">
                    {sel.tasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-ink-foreground/5">
                        <TaskCheck dark done={t.status === "done"} onToggle={() => toggleTask(t.id)} className="mt-0.5" />
                        <button onClick={() => editTask(t.id)} className={cn("text-left text-sm", t.status === "done" && "text-ink-muted line-through")}>{t.title}</button>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="mt-2 flex items-center gap-2 rounded-lg border border-ink-foreground/10 px-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!draft.trim()) return;
                      addTask({ title: draft.trim(), projectId, phaseId: sel.phase.id, dueDate: sel.phase.endDate });
                      setDraft("");
                    }}
                  >
                    <Plus className="size-3.5 text-ink-muted" />
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="添加到此阶段…" className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted" />
                  </form>
                </div>
                {deliverables.some((d) => d.phaseId === sel.phase.id) && (
                  <div>
                    <div className="eyebrow mb-2 text-ink-muted">Deliverables</div>
                    <ul className="space-y-1.5">
                      {deliverables.filter((d) => d.phaseId === sel.phase.id).map((d) => (
                        <li key={d.id}>
                          <button onClick={() => updateDeliverable(d.id, { status: NEXT_STATUS[d.status] })} className="flex w-full items-center gap-3 rounded-lg border border-ink-foreground/10 px-3 py-2 text-left text-sm hover:border-amber/40" title="点击切换状态">
                            <Package className={cn("size-4", d.status === "delivered" ? "text-amber" : "text-ink-muted")} />
                            <span className="flex-1 truncate">{d.title}</span>
                            <span className="font-mono text-[10px] text-ink-muted">{d.status === "delivered" ? "DELIVERED" : d.status === "in_progress" ? "IN PROGRESS" : "PLANNED"}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {milestones.some((m) => m.phaseId === sel.phase.id) && (
                  <div>
                    <div className="eyebrow mb-2 text-ink-muted">Milestones</div>
                    {milestones.filter((m) => m.phaseId === sel.phase.id).map((m) => (
                      <div key={m.id} className="flex items-center gap-2 py-1 text-sm">
                        <Flag className={cn("size-3.5", m.achievedAt ? "text-amber" : "text-ink-muted")} /> {m.title}
                        <span className="ml-auto font-mono text-[10px] text-ink-muted">{m.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
