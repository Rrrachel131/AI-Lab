import { createFileRoute } from "@tanstack/react-router";
import { Pin, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { EmptyState, PageContainer, PageHeader } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/data/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knowledge")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Knowledge · ai.lab" },
      { name: "description", content: "知识笔记：记录洞察、概念与决策，并关联到项目。" },
      { property: "og:title", content: "Knowledge · ai.lab" },
      { property: "og:description", content: "你的第二大脑。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const search = Route.useSearch();
  const notes = useStore((s) => s.notes);
  const projects = useStore((s) => s.projects);
  const { addNote, updateNote, deleteNote } = useStore.getState();
  const [activeId, setActiveId] = useState<string | null>(search.id ?? notes[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = Array.from(new Set(notes.flatMap((n) => n.tags)));
  const list = notes
    .filter((n) => (!tag || n.tags.includes(tag)) && (n.title + n.body).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  const active = notes.find((n) => n.id === activeId) ?? null;

  return (
    <PageContainer>
      <PageHeader eyebrow="Studio · Knowledge" title={<>Notes that<span className="font-editorial italic text-caramel"> compound.</span></>} actions={<Button variant="ember" onClick={() => setActiveId(addNote().id)}><Plus /> 新笔记</Button>} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="surface p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索笔记" className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm outline-none focus:border-brand" />
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => <button key={t} onClick={() => setTag(tag === t ? null : t)} className={cn("h-6 rounded-full px-2 text-[11px]", tag === t ? "bg-ink text-ink-foreground" : "bg-secondary text-muted-foreground")}>#{t}</button>)}
            </div>
          )}
          <ul className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
            {list.map((n) => {
              const p = projects.find((x) => x.id === n.projectId);
              return (
                <li key={n.id}>
                  <button onClick={() => setActiveId(n.id)} className={cn("w-full rounded-xl p-3 text-left transition", activeId === n.id ? "bg-accent" : "hover:bg-secondary")}>
                    <div className="flex items-center gap-1.5 text-sm font-medium">{n.pinned && <Pin className="size-3 text-brand" />}<span className="truncate">{n.title || "Untitled"}</span></div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body || "空白笔记"}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">{p && <><ProjectDot hue={p.hue} />{p.name} · </>}{n.updatedAt.slice(0, 10)}</div>
                  </button>
                </li>
              );
            })}
            {list.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">没有笔记</li>}
          </ul>
        </aside>
        {active ? (
          <article className="surface flex min-h-[60vh] flex-col p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <select value={active.projectId ?? ""} onChange={(e) => updateNote(active.id, { projectId: e.target.value || null })} className="h-7 rounded-full border bg-background px-2">
                <option value="">无项目</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input value={active.tags.join(", ")} onChange={(e) => updateNote(active.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} placeholder="标签, 逗号分隔" className="h-7 rounded-full border bg-background px-3 outline-none" />
              <button onClick={() => updateNote(active.id, { pinned: !active.pinned })} className={cn("ml-auto inline-flex h-7 items-center gap-1 rounded-full border px-2", active.pinned && "border-brand text-brand")}><Pin className="size-3" /> {active.pinned ? "已置顶" : "置顶"}</button>
              <button onClick={() => { deleteNote(active.id); setActiveId(null); }} className="inline-flex h-7 items-center gap-1 rounded-full px-2 hover:text-destructive"><Trash2 className="size-3" /></button>
            </div>
            <input value={active.title} onChange={(e) => updateNote(active.id, { title: e.target.value })} placeholder="标题" className="mt-6 bg-transparent font-display text-3xl outline-none md:text-4xl" />
            <textarea value={active.body} onChange={(e) => updateNote(active.id, { body: e.target.value })} placeholder="开始写…" className="mt-4 flex-1 resize-none bg-transparent text-[0.98rem] leading-7 outline-none" />
            <div className="mt-4 border-t pt-3 font-mono text-[10px] text-muted-foreground">{active.body.length} 字 · 自动保存于本地 · {active.updatedAt.slice(0, 16).replace("T", " ")}</div>
          </article>
        ) : (
          <EmptyState title="选择或新建一篇笔记" />
        )}
      </div>
    </PageContainer>
  );
}
