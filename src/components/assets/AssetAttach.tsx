import { Link2, Paperclip, Plus, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addLinkAsset, uploadFiles } from "@/lib/data/assets";
import { useStore } from "@/lib/data/store";
import { AssetCover } from "./AssetCover";

/** Attach assets from anywhere (task, deliverable): upload, add link or link existing. */
export function AssetAttach({ assetIds, projectId, onLink, onUnlink }: { assetIds: string[]; projectId: string | null; onLink: (id: string) => void; onUnlink: (id: string) => void }) {
  const assets = useStore((s) => s.assets);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [q, setQ] = useState("");
  const linked = useMemo(() => assetIds.map((id) => assets.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a), [assetIds, assets]);
  const candidates = useMemo(
    () => assets.filter((a) => !assetIds.includes(a.id) && a.name.toLowerCase().includes(q.toLowerCase())).slice(0, 30),
    [assets, assetIds, q],
  );

  return (
    <div className="space-y-3">
      {linked.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {linked.map((a) => (
            <li key={a.id} className="group relative overflow-hidden rounded-xl border">
              <div className="h-16"><AssetCover asset={a} /></div>
              <div className="truncate px-2 py-1.5 text-xs">{a.name}</div>
              <button type="button" onClick={() => onUnlink(a.id)} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100" aria-label="取消关联">
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = e.target.files;
            if (!files?.length) return;
            setBusy(true);
            const { created, skipped } = await uploadFiles(files, projectId);
            created.forEach((a) => onLink(a.id));
            setBusy(false);
            e.target.value = "";
            if (created.length) toast.success(`已保存 ${created.length} 个文件到本地资产库`);
            if (skipped.length) toast.error(`未保存：${skipped.join("、")}`);
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload /> {busy ? "保存中…" : "上传文件"}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline"><Link2 /> 添加链接</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2">
            <Input placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            <Button
              size="sm"
              className="w-full"
              disabled={!/^https?:\/\//.test(link)}
              onClick={() => {
                const a = addLinkAsset(link, "", projectId);
                onLink(a.id);
                setLink("");
                toast.success("链接已加入资产库");
              }}
            >
              <Plus /> 添加
            </Button>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="ghost"><Paperclip /> 关联已有</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2">
            <Input placeholder="搜索资产…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />
            <ul className="max-h-60 overflow-y-auto">
              {candidates.length === 0 && <li className="p-3 text-center text-xs text-muted-foreground">没有可关联的资产</li>}
              {candidates.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => onLink(a.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
                    <span className="size-7 shrink-0 overflow-hidden rounded"><AssetCover asset={a} className="p-1 [&_.eyebrow]:hidden [&_.font-display]:text-[8px]" /></span>
                    <span className="truncate">{a.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
