import { motion } from "framer-motion";
import { Grid3x3, Link2, List, Search, Upload } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addLinkAsset, formatBytes, uploadFiles } from "@/lib/data/assets";
import { useStore } from "@/lib/data/store";
import type { Asset, AssetKind } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { AssetCover, KIND_META } from "./AssetCover";
import { AssetDrawer } from "./AssetDrawer";

export function AssetGallery({ assets, projectId, initialOpenId = null, showProjectFilter = false }: { assets: Asset[]; projectId: string | null; initialOpenId?: string | null; showProjectFilter?: boolean }) {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kind, setKind] = useState<AssetKind | "all">("all");
  const [proj, setProj] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const kinds = useMemo(() => Array.from(new Set(assets.map((a) => a.kind))), [assets]);
  const shown = assets.filter(
    (a) =>
      (kind === "all" || a.kind === kind) &&
      (proj === "all" || (proj === "none" ? !a.projectId : a.projectId === proj)) &&
      (a.name + " " + a.tags.join(" ") + " " + a.description).toLowerCase().includes(q.toLowerCase()),
  );
  const usage = (id: string) => tasks.filter((t) => t.assetIds.includes(id)).length;

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const { created, skipped } = await uploadFiles(files, projectId);
    setBusy(false);
    if (created.length) toast.success(`已保存 ${created.length} 个文件（本地浏览器存储）`);
    if (skipped.length) toast.error(`未保存：${skipped.join("、")}`);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void handle(e.dataTransfer.files);
      }}
      className="relative"
    >
      {drag && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-3xl border-2 border-dashed border-brand bg-accent/70 backdrop-blur-sm">
          <div className="font-display text-2xl text-caramel">松开以保存到资产库</div>
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72 md:flex-none">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索名称、标签…" className="h-9 rounded-full pl-8" />
          </div>
          <div className="inline-flex rounded-full border bg-card p-0.5">
            <button onClick={() => setView("grid")} className={cn("grid size-8 place-items-center rounded-full", view === "grid" && "bg-ink text-ink-foreground")} aria-label="网格视图"><Grid3x3 className="size-3.5" /></button>
            <button onClick={() => setView("list")} className={cn("grid size-8 place-items-center rounded-full", view === "list" && "bg-ink text-ink-foreground")} aria-label="列表视图"><List className="size-3.5" /></button>
          </div>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { void handle(e.target.files); e.target.value = ""; }} />
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm"><Link2 /> 链接</Button></PopoverTrigger>
            <PopoverContent className="w-72 space-y-2">
              <Input placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
              <Button size="sm" className="w-full" disabled={!/^https?:\/\//.test(link)} onClick={() => { addLinkAsset(link, "", projectId); setLink(""); toast.success("链接已加入资产库"); }}>添加链接资产</Button>
            </PopoverContent>
          </Popover>
          <Button variant="ember" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload /> {busy ? "保存中…" : "上传"}</Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <FilterBtn on={kind === "all"} onClick={() => setKind("all")}>全部 · {assets.length}</FilterBtn>
        {kinds.map((k) => {
          const { Icon, label } = KIND_META[k];
          return (
            <FilterBtn key={k} on={kind === k} onClick={() => setKind(k)}><Icon className="size-3" /> {label} · {assets.filter((a) => a.kind === k).length}</FilterBtn>
          );
        })}
        {showProjectFilter && (
          <select value={proj} onChange={(e) => setProj(e.target.value)} className="ml-auto h-8 rounded-full border bg-card px-3 text-xs">
            <option value="all">全部项目</option>
            <option value="none">未分配</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState icon={<Upload />} title={assets.length ? "没有匹配的资产" : "资产库还是空的"} description="拖拽文件到此处，或点击上传。文件仅保存在当前浏览器（本地模式）。" />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {shown.map((a, i) => {
              const p = projects.find((x) => x.id === a.projectId);
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setOpenId(a.id)}
                  className={cn("group surface overflow-hidden text-left transition duration-300 hover:-translate-y-1 hover:shadow-lift", i % 7 === 0 && "md:col-span-2")}
                >
                  <div className={cn("overflow-hidden", i % 7 === 0 ? "aspect-[2/1]" : "aspect-[4/3]")}>
                    <div className="h-full w-full transition duration-700 group-hover:scale-[1.04]"><AssetCover asset={a} /></div>
                  </div>
                  <div className="p-3.5">
                    <div className="truncate text-sm font-medium">{a.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                      {p && <><ProjectDot hue={p.hue} />{p.name} · </>}
                      {KIND_META[a.kind].label}
                      {usage(a.id) > 0 && <> · {usage(a.id)} 个任务</>}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="surface divide-y overflow-hidden">
            {shown.map((a) => {
              const p = projects.find((x) => x.id === a.projectId);
              return (
                <button key={a.id} onClick={() => setOpenId(a.id)} className="flex w-full items-center gap-4 p-3 text-left hover:bg-secondary/60">
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg border"><AssetCover asset={a} className="p-1.5 [&_.eyebrow]:hidden [&_.font-display]:text-[10px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.tags.map((t) => `#${t}`).join(" ") || a.description || a.mime}</span>
                  </span>
                  <span className="hidden w-40 items-center gap-1.5 truncate text-xs text-muted-foreground md:flex">{p ? <><ProjectDot hue={p.hue} />{p.name}</> : "—"}</span>
                  <span className="hidden w-20 text-right font-mono text-xs text-muted-foreground md:block">{formatBytes(a.size)}</span>
                  <span className="w-20 text-right font-mono text-xs text-muted-foreground">{a.createdAt.slice(0, 10)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <AssetDrawer assetId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function FilterBtn({ on, children, onClick }: { on: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition", on ? "border-ink bg-ink text-ink-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}
