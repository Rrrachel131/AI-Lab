import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flag, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AssetAttach } from "@/components/assets/AssetAttach";
import { Chip } from "@/components/common/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { daysUntil, todayISO } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import { useProjectData } from "@/lib/data/useProject";
import type { DeliverableStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/milestones")({
  head: () => ({
    meta: [
      { title: "Milestones · ai.lab" },
      { name: "description", content: "里程碑与交付成果：点亮每一个关键节点。" },
      { property: "og:title", content: "Milestones · ai.lab" },
      { property: "og:description", content: "项目里程碑与交付。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MilestonesPage,
});

function MilestonesPage() {
  const { projectId } = Route.useParams();
  const { project, milestones, deliverables, phases } = useProjectData(projectId);
  const { addMilestone, toggleMilestone, deleteMilestone, addDeliverable, updateDeliverable, deleteDeliverable } = useStore.getState();
  useStore((s) => s.milestones); // subscribe
  const lastCompleted = useStore((s) => s.lastCompleted);
  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState(project?.deadline ?? todayISO());
  const [mPhase, setMPhase] = useState("");
  const [dTitle, setDTitle] = useState("");
  const [dPhase, setDPhase] = useState("");
  const today = todayISO();
  if (!project) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-4 font-display text-2xl">Milestones</h2>
        <ol className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-border">
          {milestones.map((m) => {
            const lit = !!m.achievedAt;
            const justLit = lit && lastCompleted === m.id;
            const n = daysUntil(m.date, today);
            return (
              <li key={m.id} className="relative flex items-start gap-4">
                <button
                  onClick={() => toggleMilestone(m.id)}
                  className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition-all duration-500", lit ? "border-brand bg-ember text-ink-foreground shadow-ember" : "border-border bg-card text-muted-foreground hover:border-brand", justLit && "animate-ignite")}
                  aria-label={lit ? "取消点亮" : "点亮里程碑"}
                >
                  <motion.span key={String(lit)} initial={{ scale: 0.4, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                    <Flag className="size-4" />
                  </motion.span>
                </button>
                <div className={cn("surface flex-1 p-4 transition", lit && "border-brand/30")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {m.date} · {phases.find((p) => p.id === m.phaseId)?.name ?? "—"} · {lit ? `点亮于 ${m.achievedAt?.slice(0, 10)}` : n >= 0 ? `${n} 天后` : `逾期 ${-n} 天`}
                      </div>
                    </div>
                    <button onClick={() => deleteMilestone(m.id)} className="text-muted-foreground hover:text-destructive" aria-label="删除"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <form
          className="surface mt-4 grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mTitle.trim()) return;
            addMilestone({ projectId, phaseId: mPhase || null, title: mTitle.trim(), description: "", date: mDate });
            setMTitle("");
          }}
        >
          <Input placeholder="新里程碑" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
          <Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
          <select value={mPhase} onChange={(e) => setMPhase(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">阶段</option>
            {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button type="submit" size="sm" className="h-9"><Plus /> 添加</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl">Deliverables</h2>
        <ul className="space-y-3">
          {deliverables.map((d) => (
            <li key={d.id} className="surface p-4">
              <div className="flex items-start gap-3">
                <Package className={cn("mt-0.5 size-4", d.status === "delivered" ? "text-success" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <input value={d.title} onChange={(e) => updateDeliverable(d.id, { title: e.target.value })} className="w-full bg-transparent font-medium outline-none" />
                  <div className="mt-1 text-xs text-muted-foreground">{phases.find((p) => p.id === d.phaseId)?.name ?? "未分阶段"} · {d.dueDate ?? "无日期"} · {d.assetIds.length} 个资产</div>
                </div>
                <select value={d.status} onChange={(e) => updateDeliverable(d.id, { status: e.target.value as DeliverableStatus })} className="h-7 rounded-full border bg-background px-2 text-xs">
                  <option value="planned">计划中</option>
                  <option value="in_progress">进行中</option>
                  <option value="delivered">已交付</option>
                </select>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild><Button size="sm" variant="soft">成果资产 · {d.assetIds.length}</Button></PopoverTrigger>
                  <PopoverContent className="w-80">
                    <AssetAttach assetIds={d.assetIds} projectId={projectId} onLink={(a) => updateDeliverable(d.id, { assetIds: [...useStore.getState().deliverables.find((x) => x.id === d.id)!.assetIds, a] })} onUnlink={(a) => updateDeliverable(d.id, { assetIds: d.assetIds.filter((x) => x !== a) })} />
                  </PopoverContent>
                </Popover>
                {d.status === "delivered" && <Chip tone="success">Delivered</Chip>}
                <button onClick={() => deleteDeliverable(d.id)} className="ml-auto text-muted-foreground hover:text-destructive" aria-label="删除"><Trash2 className="size-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="surface mt-4 grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!dTitle.trim()) return;
            const ph = phases.find((p) => p.id === dPhase);
            addDeliverable({ projectId, phaseId: dPhase || null, title: dTitle.trim(), description: "", dueDate: ph?.endDate ?? project.deadline });
            setDTitle("");
          }}
        >
          <Input placeholder="新交付成果" value={dTitle} onChange={(e) => setDTitle(e.target.value)} />
          <select value={dPhase} onChange={(e) => setDPhase(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">阶段</option>
            {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button type="submit" size="sm" className="h-9"><Plus /> 添加</Button>
        </form>
      </section>
    </div>
  );
}
