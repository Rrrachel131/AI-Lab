import { useNavigate } from "@tanstack/react-router";
import { FileJson, FolderPlus, Inbox, ListPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { shiftDate, todayISO } from "@/lib/data/dates";
import { buildFromPlan, parsePlanJSON, PLAN_EXAMPLE } from "@/lib/data/plan-import";
import { useStore } from "@/lib/data/store";
import type { InboxKind, Priority } from "@/lib/data/types";
import { useUI, type QuickTab } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

const TABS: { id: QuickTab; label: string; Icon: typeof Inbox }[] = [
  { id: "task", label: "任务", Icon: ListPlus },
  { id: "inbox", label: "收集", Icon: Inbox },
  { id: "project", label: "项目", Icon: FolderPlus },
  { id: "import", label: "导入 JSON", Icon: FileJson },
];
const field = "h-9 w-full rounded-md border bg-background px-3 text-sm";

export function QuickCreate() {
  const { quickOpen, quickTab, quickProjectId, closeQuick, openQuick } = useUI();
  return (
    <Dialog open={quickOpen} onOpenChange={(o) => !o && closeQuick()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogTitle className="sr-only">快速创建</DialogTitle>
        <div className="flex gap-1 overflow-x-auto border-b p-2 pr-12 scrollbar-none">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => openQuick(id, quickProjectId)} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition", quickTab === id ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-secondary")}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {quickTab === "task" && <TaskForm defaultProject={quickProjectId} onDone={closeQuick} />}
          {quickTab === "inbox" && <InboxForm onDone={closeQuick} />}
          {quickTab === "project" && <ProjectForm onDone={closeQuick} />}
          {quickTab === "import" && <ImportForm onDone={closeQuick} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ defaultProject, onDone }: { defaultProject: string | null; onDone: () => void }) {
  const projects = useStore((s) => s.projects);
  const phases = useStore((s) => s.phases);
  const addTask = useStore((s) => s.addTask);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProject ?? "");
  const [phaseId, setPhaseId] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [today, setToday] = useState(true);
  const own = phases.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order);
  useEffect(() => setPhaseId(own[0]?.id ?? ""), [projectId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        addTask({ title: title.trim(), projectId: projectId || null, phaseId: phaseId || null, dueDate: due || null, priority, plannedFor: today ? todayISO() : null });
        toast.success("任务已创建");
        onDone();
      }}
    >
      <Input autoFocus placeholder="要完成什么？" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 text-base" />
      <div className="grid grid-cols-2 gap-3">
        <select className={field} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">个人 / 无项目</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={field} value={phaseId} disabled={!projectId} onChange={(e) => setPhaseId(e.target.value)}>
          <option value="">未分阶段</option>
          {own.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="截止日期" />
        <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={today} onChange={(e) => setToday(e.target.checked)} className="accent-brand" /> 加入今日工作台
      </label>
      <Button type="submit" variant="ember" disabled={!title.trim()}>创建任务</Button>
    </form>
  );
}

function InboxForm({ onDone }: { onDone: () => void }) {
  const add = useStore((s) => s.addInbox);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<InboxKind>("idea");
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        add(text.trim(), kind);
        toast.success("已放入 Inbox");
        onDone();
      }}
    >
      <Textarea autoFocus rows={4} placeholder="想法、待办、链接…先记下来" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        {(["idea", "task", "resource"] as InboxKind[]).map((k) => (
          <button type="button" key={k} onClick={() => setKind(k)} className={cn("h-8 rounded-full border px-3 text-xs", kind === k ? "border-ink bg-ink text-ink-foreground" : "")}>
            {k === "idea" ? "想法" : k === "task" ? "任务" : "资料"}
          </button>
        ))}
      </div>
      <Button type="submit" variant="ember" disabled={!text.trim()}>收集</Button>
    </form>
  );
}

export function ProjectForm({ onDone }: { onDone: () => void }) {
  const create = useStore((s) => s.createProject);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [start, setStart] = useState(todayISO());
  const [deadline, setDeadline] = useState(shiftDate(todayISO(), 30));
  const [phases, setPhases] = useState("Plan, Execute, Deliver");
  const invalid = !name.trim() || deadline < start;
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (invalid) return;
        const defs = phases.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean).map((n) => ({ name: n }));
        const p = create({ name: name.trim(), goal: goal.trim(), startDate: start, deadline }, defs);
        toast.success(`已创建 ${p.name}`);
        onDone();
        navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
      }}
    >
      <Input autoFocus placeholder="项目名称" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
      <Textarea rows={2} placeholder="目标：完成后会是什么样？" value={goal} onChange={(e) => setGoal(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1"><span className="eyebrow">开始</span><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="grid gap-1"><span className="eyebrow">DDL</span><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
      </div>
      <label className="grid gap-1">
        <span className="eyebrow">阶段（逗号分隔，数量不限）</span>
        <Input value={phases} onChange={(e) => setPhases(e.target.value)} />
      </label>
      {deadline < start && <p className="text-xs text-destructive">DDL 不能早于开始日期</p>}
      <Button type="submit" variant="ember" disabled={invalid}>创建项目</Button>
    </form>
  );
}

export function ImportForm({ onDone }: { onDone: () => void }) {
  const importPlan = useStore((s) => s.importPlan);
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">粘贴 JSON 项目计划，或上传 .json 文件。格式见 Handbook。</p>
      <Textarea rows={10} className="font-mono text-xs" placeholder={PLAN_EXAMPLE} value={text} onChange={(e) => { setText(e.target.value); setError(null); }} />
      {error && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setText(PLAN_EXAMPLE)}>填入示例</Button>
        <label className="inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs hover:bg-secondary">
          选择 .json 文件
          <input type="file" accept="application/json,.json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} />
        </label>
        <Button
          type="button"
          variant="ember"
          size="sm"
          className="ml-auto"
          disabled={!text.trim()}
          onClick={() => {
            const res = parsePlanJSON(text);
            if (!res.ok) return setError(res.error);
            const plan = buildFromPlan(res.plan);
            importPlan(plan);
            toast.success(`已导入 ${plan.project.name}：${plan.phases.length} 个阶段，${plan.tasks.length} 个任务`);
            onDone();
            navigate({ to: "/projects/$projectId/odyssey", params: { projectId: plan.project.id } });
          }}
        >
          导入计划
        </Button>
      </div>
    </div>
  );
}
