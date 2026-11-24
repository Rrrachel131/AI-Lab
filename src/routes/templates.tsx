import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileJson, Layers, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, PageContainer, PageHeader, Reveal } from "@/components/common/Page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { shiftDate, todayISO } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import { BUILT_IN_TEMPLATES } from "@/lib/data/templates";
import type { Template } from "@/lib/data/types";
import { useUI } from "@/lib/ui-store";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates · ai.lab" },
      { name: "description", content: "产品、学习、个人目标、研究等项目模板，按 DDL 自动排期。" },
      { property: "og:title", content: "Templates · ai.lab" },
      { property: "og:description", content: "从模板开始一个新项目。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const custom = useStore((s) => s.templates);
  const del = useStore((s) => s.deleteTemplate);
  const openQuick = useUI((s) => s.openQuick);
  const [use, setUse] = useState<Template | null>(null);
  const all = [...BUILT_IN_TEMPLATES, ...custom];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace · Templates"
        title={<>Start from<span className="font-editorial italic text-caramel"> a shape.</span></>}
        description="模板只定义阶段结构与相对时长。选择开始日期和 DDL 后，系统会按权重自动排期。也可以把任何项目存为模板。"
        actions={<Button variant="outline" onClick={() => openQuick("import")}><FileJson /> 导入 JSON 计划</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {all.map((t, i) => {
          const totalW = t.phases.reduce((a, p) => a + p.weight, 0) || 1;
          return (
            <Reveal key={t.id} delay={i * 0.04}>
              <article className="surface flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <Chip tone={t.builtIn ? "default" : "brand"}>{t.builtIn ? t.category : "Custom"}</Chip>
                  {!t.builtIn && <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive" aria-label="删除模板"><Trash2 className="size-3.5" /></button>}
                </div>
                <h3 className="mt-5 font-display text-2xl">{t.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-6 flex h-2 gap-0.5 overflow-hidden rounded-full">
                  {t.phases.map((p, j) => (
                    <div key={j} className={j % 3 === 0 ? "bg-brand" : j % 3 === 1 ? "bg-amber" : "bg-caramel"} style={{ width: `${(p.weight / totalW) * 100}%` }} title={p.name} />
                  ))}
                </div>
                <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {t.phases.map((p, j) => <li key={j}><span className="font-mono">{String(j + 1).padStart(2, "0")}</span> {p.name}</li>)}
                </ol>
                <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Layers className="size-3" /> {t.phases.length} 阶段 · {t.phases.reduce((a, p) => a + p.tasks.length, 0)} 任务 · {t.suggestedDays} 天</span>
                  <Button size="sm" variant="ember" onClick={() => setUse(t)}>使用</Button>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
      <UseTemplateDialog template={use} onClose={() => setUse(null)} />
    </PageContainer>
  );
}

function UseTemplateDialog({ template, onClose }: { template: Template | null; onClose: () => void }) {
  const create = useStore((s) => s.createFromTemplate);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [start, setStart] = useState(todayISO());
  const [deadline, setDeadline] = useState("");
  const dl = deadline || (template ? shiftDate(start, template.suggestedDays) : start);
  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="font-display text-2xl">{template?.name}</DialogTitle>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!template || !name.trim() || dl < start) return;
            const p = create(template, { name: name.trim(), goal, startDate: start, deadline: dl });
            toast.success(`已从模板创建 ${p.name}`);
            onClose();
            navigate({ to: "/projects/$projectId/odyssey", params: { projectId: p.id } });
          }}
        >
          <Input autoFocus placeholder="项目名称" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea rows={2} placeholder="目标" value={goal} onChange={(e) => setGoal(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1"><span className="eyebrow">开始</span><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="grid gap-1"><span className="eyebrow">DDL</span><Input type="date" value={dl} onChange={(e) => setDeadline(e.target.value)} /></label>
          </div>
          <Button type="submit" variant="ember" disabled={!name.trim() || dl < start}>创建项目</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
