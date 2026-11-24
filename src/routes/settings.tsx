import { createFileRoute } from "@tanstack/react-router";
import { Download, RotateCcw, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { LocalModeBadge, PageContainer, PageHeader } from "@/components/common/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/data/store";
import type { DataSnapshot, Settings } from "@/lib/data/types";
import { useFx } from "@/lib/fx";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ai.lab" },
      { name: "description", content: "系统设置：特效开关、粒子密度、数据导入导出。" },
      { property: "og:title", content: "Settings · ai.lab" },
      { property: "og:description", content: "ai.lab 系统设置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const { updateSettings, exportSnapshot, importSnapshot, resetToSample, clearAll } = useStore.getState();
  const fx = useFx();
  const set = (p: Partial<Settings>) => updateSettings(p);

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader eyebrow="Support · Settings" title="Settings" />
      <section className="surface divide-y">
        <Row title="你的名字" desc="显示在 Today 问候语中"><Input className="w-48" value={settings.userName} onChange={(e) => set({ userName: e.target.value })} /></Row>
        <Row title="3D 特效" desc={fx.webgl ? "实时粒子能量核心、项目宇宙与星轨" : "此设备不支持 WebGL，已使用降级视图"}><Switch checked={settings.effects} onCheckedChange={(v) => set({ effects: v })} /></Row>
        <Row title="粒子密度" desc="低密度更省电">
          <select value={settings.particleDensity} onChange={(e) => set({ particleDensity: e.target.value as Settings["particleDensity"] })} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Row>
        <Row title="鼠标跟随光影"><Switch checked={settings.cursorGlow} onCheckedChange={(v) => set({ cursorGlow: v })} /></Row>
        <Row title="减少动效" desc="关闭页面转场与动画"><Switch checked={settings.reduceMotion} onCheckedChange={(v) => set({ reduceMotion: v })} /></Row>
      </section>
      <section className="surface mt-6 p-6">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl">Data</h2><LocalModeBadge /></div>
        <p className="mt-2 text-sm text-muted-foreground">数据保存在此浏览器。导出的 JSON 包含项目、任务、笔记等；上传的文件本体不包含在内。云端同步尚未接入。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => {
            const blob = new Blob([JSON.stringify(exportSnapshot(), null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `ailab-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}><Download /> 导出备份</Button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm hover:bg-secondary">
            <Upload className="size-4" /> 恢复备份
            <input type="file" accept=".json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const snap = JSON.parse(await f.text()) as DataSnapshot;
                if (snap.version !== 1 || !Array.isArray(snap.projects)) throw new Error();
                importSnapshot(snap);
                toast.success("已恢复备份");
              } catch { toast.error("备份文件格式不正确"); }
            }} />
          </label>
          <Button variant="ghost" onClick={() => { resetToSample(); toast("已重置为示例数据"); }}><RotateCcw /> 重置为示例</Button>
          <Button variant="ghost" className="text-destructive" onClick={() => { if (confirm("清空所有数据？此操作无法撤销。")) { clearAll(); toast("已清空"); } }}>清空全部</Button>
        </div>
      </section>
    </PageContainer>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div><div className="text-sm font-medium">{title}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>
      {children}
    </div>
  );
}
