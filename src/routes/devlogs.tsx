import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import type { DevLogKind } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devlogs")({
  head: () => ({
    meta: [
      { title: "Dev Logs · ai.lab" },
      { name: "description", content: "项目研发日志：构建、修复、研究、决策与发布记录。" },
      { property: "og:title", content: "Dev Logs · ai.lab" },
      { property: "og:description", content: "记录每一次推进。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevLogsPage,
});

const KINDS: DevLogKind[] = ["build", "fix", "research", "decision", "release"];
const KIND_CLS: Record<DevLogKind, string> = { build: "bg-brand", fix: "bg-destructive", research: "bg-amber", decision: "bg-ink", release: "bg-success" };

function DevLogsPage() {
  const logs = useStore((s) => s.devlogs);
  const projects = useStore((s) => s.projects);
  const { addDevLog, deleteDevLog } = useStore.getState();
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState<DevLogKind>("build");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(todayISO());
  const [filter, setFilter] = useState("all");
  const shown = logs.filter((l) => filter === "all" || l.projectId === filter || l.kind === filter).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader eyebrow="Studio · Dev Logs" title={<>Ship log<span className="font-editorial italic text-caramel">, day by day.</span></>} description="记录构建、修复、研究、决策与发布。每条日志都可以关联到项目。" />
      <form
        className="surface grid gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addDevLog({ projectId: projectId || null, kind, title: title.trim(), body, date });
          setTitle("");
          setBody("");
        }}
      >
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)} className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px] uppercase", kind === k ? "border-ink bg-ink text-ink-foreground" : "text-muted-foreground")}>
              <span className={cn("size-1.5 rounded-full", KIND_CLS[k])} /> {k}
            </button>
          ))}
        </div>
        <Input placeholder="今天推进了什么？" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea rows={3} placeholder="细节、原因、下一步…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">无项目</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Button type="submit" variant="ember" className="ml-auto" disabled={!title.trim()}><Plus /> 记录</Button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap gap-1.5">
        {[{ id: "all", name: "全部" }, ...projects.map((p) => ({ id: p.id, name: p.name })), ...KINDS.map((k) => ({ id: k, name: k }))].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("h-7 rounded-full border px-3 text-xs", filter === f.id ? "border-ink bg-ink text-ink-foreground" : "bg-card text-muted-foreground")}>{f.name}</button>
        ))}
      </div>
      <ol className="relative mt-6 space-y-4 border-l pl-6">
        {shown.map((l) => {
          const p = projects.find((x) => x.id === l.projectId);
          return (
            <li key={l.id} className="relative">
              <span className={cn("absolute -left-[29px] top-2 size-2.5 rounded-full ring-4 ring-background", KIND_CLS[l.kind])} />
              <div className="surface p-5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span>{l.date}</span><span className="uppercase">{l.kind}</span>
                  {p && <span className="inline-flex items-center gap-1"><ProjectDot hue={p.hue} />{p.name}</span>}
                  <button onClick={() => deleteDevLog(l.id)} className="ml-auto hover:text-destructive" aria-label="删除"><Trash2 className="size-3.5" /></button>
                </div>
                <h3 className="mt-2 font-medium">{l.title}</h3>
                {l.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{l.body}</p>}
              </div>
            </li>
          );
        })}
        {shown.length === 0 && <li className="text-sm text-muted-foreground">还没有日志</li>}
      </ol>
    </PageContainer>
  );
}
