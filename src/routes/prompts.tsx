import { createFileRoute } from "@tanstack/react-router";
import { Copy, History, Plus, Save, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/data/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prompts")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Prompt Studio · ai.lab" },
      { name: "description", content: "专业提示词工作室：变量、版本历史与项目关联。" },
      { property: "og:title", content: "Prompt Studio · ai.lab" },
      { property: "og:description", content: "写作、调试并管理你的提示词。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromptStudio,
});

const VAR_RE = /\{\{\s*([\w\u4e00-\u9fa5-]+)\s*\}\}/g;

function PromptStudio() {
  const search = Route.useSearch();
  const prompts = useStore((s) => s.prompts);
  const projects = useStore((s) => s.projects);
  const { addPrompt, updatePrompt, deletePrompt, savePromptVersion } = useStore.getState();
  const [activeId, setActiveId] = useState<string | null>(search.id ?? prompts[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"vars" | "history">("vars");
  const active = prompts.find((p) => p.id === activeId) ?? null;
  const list = prompts.filter((p) => (p.title + p.body + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
  const vars = useMemo(() => (active ? Array.from(new Set(Array.from(active.body.matchAll(VAR_RE)).map((m) => m[1] ?? ""))) : []), [active]);
  const compiled = active ? active.body.replace(VAR_RE, (_, k: string) => vals[k] || `{{${k}}}`) : "";
  const lines = (active?.body ?? "").split("\n").length;

  return (
    <div className="dark min-h-[calc(100dvh-3.5rem)] bg-background text-foreground lg:min-h-dvh">
      <div className="grid min-h-[inherit] lg:grid-cols-[260px_1fr_320px]">
        {/* list */}
        <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Studio</div>
              <h1 className="font-display text-2xl">Prompt Studio</h1>
            </div>
            <Button size="icon" variant="ember" className="size-8" onClick={() => setActiveId(addPrompt().id)} aria-label="新建提示词"><Plus /></Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索" className="h-9 w-full rounded-lg border bg-card pl-8 pr-3 text-sm outline-none focus:border-brand" />
          </div>
          <ul className="mt-3 flex gap-1 overflow-x-auto scrollbar-none lg:block lg:space-y-0.5">
            {list.map((p) => (
              <li key={p.id} className="shrink-0">
                <button onClick={() => setActiveId(p.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition", activeId === p.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground")}>
                  {p.favorite && <Star className="size-3 shrink-0 fill-amber text-amber" />}
                  <span className="truncate">{p.title}</span>
                  <span className="ml-auto hidden font-mono text-[10px] opacity-60 lg:inline">{p.category}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* editor */}
        <section className="flex min-w-0 flex-col">
          {active ? (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:px-6">
                <input value={active.title} onChange={(e) => updatePrompt(active.id, { title: e.target.value })} className="min-w-0 flex-1 bg-transparent font-display text-xl outline-none" />
                <button onClick={() => updatePrompt(active.id, { favorite: !active.favorite })} className="grid size-8 place-items-center rounded-full hover:bg-card" aria-label="收藏"><Star className={cn("size-4", active.favorite ? "fill-amber text-amber" : "text-muted-foreground")} /></button>
                <Button size="sm" variant="glass" onClick={() => { savePromptVersion(active.id); toast.success("已保存版本"); }}><Save /> 保存版本</Button>
                <Button size="sm" variant="ember" onClick={async () => { await navigator.clipboard.writeText(compiled); toast.success("已复制填充后的提示词"); }}><Copy /> 复制</Button>
              </div>
              <div className="flex flex-wrap gap-3 border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground md:px-6">
                <label className="flex items-center gap-1">cat <input value={active.category} onChange={(e) => updatePrompt(active.id, { category: e.target.value })} className="w-24 bg-transparent text-foreground outline-none" /></label>
                <label className="flex items-center gap-1">tags <input value={active.tags.join(",")} onChange={(e) => updatePrompt(active.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className="w-32 bg-transparent text-foreground outline-none" /></label>
                <label className="flex items-center gap-1">project
                  <select value={active.projectId ?? ""} onChange={(e) => updatePrompt(active.id, { projectId: e.target.value || null })} className="bg-transparent text-foreground outline-none">
                    <option value="">—</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <span className="ml-auto">{active.body.length} chars · ~{Math.ceil(active.body.length / 3.5)} tokens</span>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div aria-hidden className="select-none border-r border-border py-4 pl-4 pr-3 text-right font-mono text-xs leading-6 text-muted-foreground/50">
                  {Array.from({ length: Math.max(lines, 18) }, (_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea
                  value={active.body}
                  onChange={(e) => updatePrompt(active.id, { body: e.target.value })}
                  spellCheck={false}
                  placeholder="在这里写提示词。用 {{变量}} 声明可填充的变量。"
                  className="min-h-[420px] flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-6 outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground md:px-6">
                <span>本工作室不调用 AI 模型 · 复制后在你的工具中运行</span>
                <button onClick={() => { deletePrompt(active.id); setActiveId(null); }} className="inline-flex items-center gap-1 hover:text-destructive"><Trash2 className="size-3" /> 删除</button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-10 text-center text-muted-foreground">
              <div>
                <p>选择或新建一个提示词</p>
                <Button className="mt-4" variant="ember" onClick={() => setActiveId(addPrompt().id)}><Plus /> 新建</Button>
              </div>
            </div>
          )}
        </section>

        {/* inspector */}
        <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
          <div className="flex gap-1 rounded-full bg-card p-1">
            {(["vars", "history"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("h-7 flex-1 rounded-full text-xs", tab === t ? "bg-secondary text-foreground" : "text-muted-foreground")}>{t === "vars" ? `Variables · ${vars.length}` : `History · ${active?.versions.length ?? 0}`}</button>
            ))}
          </div>
          {active && tab === "vars" && (
            <div className="mt-4 space-y-3">
              {vars.length === 0 && <p className="text-xs text-muted-foreground">在正文中写 {"{{role}}"} 这样的占位符，这里会出现对应输入框。</p>}
              {vars.map((v) => (
                <label key={v} className="grid gap-1">
                  <span className="font-mono text-[11px] text-amber">{`{{${v}}}`}</span>
                  <textarea rows={2} value={vals[v] ?? ""} onChange={(e) => setVals((s) => ({ ...s, [v]: e.target.value }))} className="resize-none rounded-lg border bg-card p-2 text-sm outline-none focus:border-brand" />
                </label>
              ))}
              <div>
                <div className="eyebrow mb-2">Preview</div>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border bg-card p-3 font-mono text-[11.5px] leading-5 text-muted-foreground">{compiled || "—"}</pre>
              </div>
            </div>
          )}
          {active && tab === "history" && (
            <ul className="mt-4 space-y-2">
              {active.versions.length === 0 && <li className="text-xs text-muted-foreground">点击「保存版本」记录当前内容的快照。</li>}
              {active.versions.map((v, i) => (
                <li key={v.savedAt + i} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><History className="size-3" /> v{active.versions.length - i} · {v.savedAt.slice(0, 16).replace("T", " ")}</span>
                    <button onClick={() => { updatePrompt(active.id, { body: v.body }); toast("已恢复该版本"); }} className="text-amber hover:underline">恢复</button>
                  </div>
                  <p className="mt-2 line-clamp-3 font-mono text-[11px] text-muted-foreground">{v.body}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
