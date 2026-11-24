import { Download, ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes } from "@/lib/data/assets";
import { fileStore } from "@/lib/data/file-store";
import { useStore } from "@/lib/data/store";
import { AssetCover, KIND_META } from "./AssetCover";

function useBlobUrl(blobKey: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!blobKey) return;
    let u: string | null = null;
    let alive = true;
    fileStore
      .get(blobKey)
      .then((b) => {
        if (!alive) return;
        if (!b) return setMissing(true);
        u = URL.createObjectURL(b);
        setUrl(u);
      })
      .catch(() => setMissing(true));
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [blobKey]);
  return { url, missing };
}

export function AssetDrawer({ assetId, onClose }: { assetId: string | null; onClose: () => void }) {
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId) ?? null);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const update = useStore((s) => s.updateAsset);
  const del = useStore((s) => s.deleteAsset);
  const { url, missing } = useBlobUrl(asset?.blobKey ?? null);
  const linkedTasks = useMemo(() => (asset ? tasks.filter((t) => t.assetIds.includes(asset.id)) : []), [tasks, asset]);

  return (
    <Sheet open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-md">
        {asset && (
          <div className="flex flex-col">
            <div className="aspect-[4/3] w-full overflow-hidden border-b bg-muted">
              {asset.kind === "image" && url ? (
                <img src={url} alt={asset.name} className="h-full w-full object-contain" />
              ) : asset.kind === "video" && url ? (
                <video src={url} controls className="h-full w-full bg-ink" />
              ) : asset.kind === "audio" && url ? (
                <div className="grid h-full place-items-center p-6">
                  <audio src={url} controls className="w-full" />
                </div>
              ) : (
                <AssetCover asset={asset} />
              )}
            </div>
            <div className="space-y-5 p-6">
              <SheetHeader className="space-y-1 text-left">
                <div className="eyebrow">{KIND_META[asset.kind].label} · {asset.source === "upload" ? "本地文件" : "外部链接"}</div>
                <SheetTitle className="font-display text-2xl">{asset.name}</SheetTitle>
              </SheetHeader>
              {missing && <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">本地文件已不在此浏览器中（可能已清除浏览器数据）。</p>}
              <div className="flex flex-wrap gap-2">
                {asset.source === "link" && asset.url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      <ExternalLink /> 打开链接
                    </a>
                  </Button>
                )}
                {url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={url} download={asset.name}>
                      <Download /> 下载
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={async () => {
                    await del(asset.id);
                    toast("资产已删除");
                    onClose();
                  }}
                >
                  <Trash2 /> 删除
                </Button>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="eyebrow">名称</span>
                  <Input value={asset.name} onChange={(e) => update(asset.id, { name: e.target.value })} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="eyebrow">所属项目</span>
                  <select className="h-9 rounded-md border bg-background px-3 text-sm" value={asset.projectId ?? ""} onChange={(e) => update(asset.id, { projectId: e.target.value || null })}>
                    <option value="">未分配</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="eyebrow">标签（逗号分隔）</span>
                  <Input value={asset.tags.join(", ")} onChange={(e) => update(asset.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="eyebrow">描述</span>
                  <Textarea rows={3} value={asset.description} onChange={(e) => update(asset.id, { description: e.target.value })} />
                </label>
              </div>
              <dl className="grid grid-cols-2 gap-y-2 border-t pt-4 text-sm">
                <dt className="text-muted-foreground">大小</dt>
                <dd className="tabular text-right">{formatBytes(asset.size)}</dd>
                <dt className="text-muted-foreground">类型</dt>
                <dd className="truncate text-right">{asset.mime}</dd>
                <dt className="text-muted-foreground">添加于</dt>
                <dd className="text-right">{asset.createdAt.slice(0, 10)}</dd>
              </dl>
              {linkedTasks.length > 0 && (
                <div className="border-t pt-4">
                  <div className="eyebrow mb-2">关联任务</div>
                  <ul className="space-y-1 text-sm">
                    {linkedTasks.map((t) => (
                      <li key={t.id} className="truncate">· {t.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
