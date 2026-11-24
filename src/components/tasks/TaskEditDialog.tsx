import { Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AssetAttach } from "@/components/assets/AssetAttach";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import type { Task } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

const field = "h-9 w-full rounded-md border bg-background px-3 text-sm";

export function TaskEditDialog() {
  const id = useUI((s) => s.taskEditId);
  const close = useUI((s) => s.editTask);
  const task = useStore((s) => s.tasks.find((t) => t.id === id) ?? null);
  const projects = useStore((s) => s.projects);
  const allPhases = useStore((s) => s.phases);
  const update = useStore((s) => s.updateTask);
  const setStatus = useStore((s) => s.setTaskStatus);
  const del = useStore((s) => s.deleteTask);
  const link = useStore((s) => s.linkAssetToTask);
  const unlink = useStore((s) => s.unlinkAssetFromTask);
  const phases = task ? allPhases.filter((p) => p.projectId === task.projectId).sort((a, b) => a.order - b.order) : [];
  const today = todayISO();

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && close(null)}>
      <DialogContent className="max-w-xl gap-0 p-0">
        {task && (
          <div>
            <div className="border-b p-6 pb-4">
              <DialogTitle className="sr-only">编辑任务</DialogTitle>
              <div className="eyebrow mb-2">Task</div>
              <Input value={task.title} onChange={(e) => update(task.id, { title: e.target.value })} className="h-auto border-0 px-0 font-display text-2xl shadow-none focus-visible:ring-0" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["todo", "doing", "done"] as Task["status"][]).map((s) => (
                  <button key={s} onClick={() => setStatus(task.id, s)} className={cn("h-7 rounded-full border px-3 text-xs transition", task.status === s ? "border-ink bg-ink text-ink-foreground" : "hover:bg-secondary")}>
                    {s === "todo" ? "待办" : s === "doing" ? "进行中" : "已完成"}
                  </button>
                ))}
                <button
                  onClick={() => update(task.id, { plannedFor: task.plannedFor === today ? null : today })}
                  className={cn("ml-auto inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs", task.plannedFor === today ? "border-brand bg-accent text-accent-foreground" : "hover:bg-secondary")}
                >
                  <Sun className="size-3" /> {task.plannedFor === today ? "已加入今日" : "加入今日"}
                </button>
              </div>
            </div>
            <div className="grid gap-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="eyebrow">项目</span>
                  <select className={field} value={task.projectId ?? ""} onChange={(e) => update(task.id, { projectId: e.target.value || null, phaseId: null })}>
                    <option value="">个人 / 无项目</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="eyebrow">阶段</span>
                  <select className={field} value={task.phaseId ?? ""} disabled={!task.projectId} onChange={(e) => update(task.id, { phaseId: e.target.value || null })}>
                    <option value="">未分阶段</option>
                    {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="eyebrow">截止日期 DDL</span>
                  <Input type="date" value={task.dueDate ?? ""} onChange={(e) => update(task.id, { dueDate: e.target.value || null })} />
                </label>
                <label className="grid gap-1.5">
                  <span className="eyebrow">优先级</span>
                  <select className={field} value={task.priority} onChange={(e) => update(task.id, { priority: e.target.value as Task["priority"] })}>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5">
                <span className="eyebrow">备注</span>
                <Textarea rows={3} value={task.notes} placeholder="补充说明、验收标准…" onChange={(e) => update(task.id, { notes: e.target.value })} />
              </label>
              <div className="grid gap-2">
                <span className="eyebrow">成果 / 资产</span>
                <AssetAttach assetIds={task.assetIds} projectId={task.projectId} onLink={(a) => link(task.id, a)} onUnlink={(a) => unlink(task.id, a)} />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    del(task.id);
                    close(null);
                    toast("任务已删除");
                  }}
                >
                  <Trash2 /> 删除任务
                </Button>
                <Button size="sm" onClick={() => close(null)}>完成</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
