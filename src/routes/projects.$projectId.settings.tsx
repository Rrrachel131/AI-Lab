import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ProjectOrb } from "@/components/common/ProjectDot";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/data/store";
import { useProjectData } from "@/lib/data/useProject";
import type { Project } from "@/lib/data/types";

export const Route = createFileRoute("/projects/$projectId/settings")({
  head: () => ({
    meta: [
      { title: "Project Settings · ai.lab" },
      { name: "description", content: "编辑项目目标、日期、阶段与外观。" },
      { property: "og:title", content: "Project Settings · ai.lab" },
      { property: "og:description", content: "项目设置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectSettings,
});

function ProjectSettings() {
  const { projectId } = Route.useParams();
  const { project, phases, progress } = useProjectData(projectId);
  const s = useStore.getState();
  const navigate = useNavigate();
  const [newPhase, setNewPhase] = useState("");
  if (!project) return null;
  const up = (patch: Partial<Project>) => s.updateProject(project.id, patch);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="surface grid gap-4 p-6">
        <h2 className="font-display text-xl">Basics</h2>
        <Field label="项目名称"><Input value={project.name} onChange={(e) => up({ name: e.target.value })} /></Field>
        <Field label="一句话描述"><Input value={project.tagline} onChange={(e) => up({ tagline: e.target.value })} /></Field>
        <Field label="目标"><Textarea rows={2} value={project.goal} onChange={(e) => up({ goal: e.target.value })} /></Field>
        <Field label="说明"><Textarea rows={3} value={project.description} onChange={(e) => up({ description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="分类"><Input value={project.category} onChange={(e) => up({ category: e.target.value })} /></Field>
          <Field label="状态">
            <select value={project.status} onChange={(e) => up({ status: e.target.value as Project["status"] })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="active">进行中</option>
              <option value="paused">暂停</option>
              <option value="completed">已完成</option>
              <option value="archived">已归档</option>
            </select>
          </Field>
          <Field label="开始日期"><Input type="date" value={project.startDate} onChange={(e) => e.target.value && up({ startDate: e.target.value })} /></Field>
          <Field label="截止日期 DDL"><Input type="date" value={project.deadline} onChange={(e) => e.target.value && up({ deadline: e.target.value })} /></Field>
        </div>
        <Field label={`星体色调 · ${project.hue}°`}>
          <div className="flex items-center gap-4">
            <ProjectOrb hue={project.hue} progress={progress.ratio} />
            <Slider min={0} max={60} step={1} value={[project.hue]} onValueChange={([v]) => v !== undefined && up({ hue: v })} />
          </div>
        </Field>
      </section>

      <div className="grid content-start gap-6">
        <section className="surface p-6">
          <h2 className="font-display text-xl">Phases</h2>
          <p className="mt-1 text-sm text-muted-foreground">阶段数量不限，Odyssey 星轨会按这里的顺序生成节点。</p>
          <ul className="mt-4 space-y-2">
            {phases.map((ph, i) => (
              <li key={ph.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <input value={ph.name} onChange={(e) => s.updatePhase(ph.id, { name: e.target.value })} className="flex-1 bg-transparent text-sm font-medium outline-none" />
                  <button disabled={i === 0} onClick={() => s.movePhase(ph.id, -1)} className="grid size-7 place-items-center rounded-full hover:bg-secondary disabled:opacity-25" aria-label="上移"><ArrowUp className="size-3.5" /></button>
                  <button disabled={i === phases.length - 1} onClick={() => s.movePhase(ph.id, 1)} className="grid size-7 place-items-center rounded-full hover:bg-secondary disabled:opacity-25" aria-label="下移"><ArrowDown className="size-3.5" /></button>
                  <button onClick={() => s.deletePhase(ph.id)} className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="删除阶段"><Trash2 className="size-3.5" /></button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input type="date" className="h-8 text-xs" value={ph.startDate ?? ""} onChange={(e) => s.updatePhase(ph.id, { startDate: e.target.value || null })} />
                  <Input type="date" className="h-8 text-xs" value={ph.endDate ?? ""} onChange={(e) => s.updatePhase(ph.id, { endDate: e.target.value || null })} />
                </div>
                <Input className="mt-2 h-8 text-xs" placeholder="阶段说明" value={ph.description} onChange={(e) => s.updatePhase(ph.id, { description: e.target.value })} />
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPhase.trim()) return;
              s.addPhase(project.id, newPhase.trim());
              setNewPhase("");
            }}
          >
            <Input placeholder="新阶段名称" value={newPhase} onChange={(e) => setNewPhase(e.target.value)} />
            <Button type="submit" variant="outline"><Plus /> 添加</Button>
          </form>
        </section>

        <section className="surface flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <h2 className="font-display text-xl">Danger zone</h2>
            <p className="text-sm text-muted-foreground">删除项目会移除其阶段、任务、里程碑与交付；资产与笔记会保留并取消关联。</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { s.saveProjectAsTemplate(project.id); toast.success("已保存为模板"); }}><Copy /> 存为模板</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 /> 删除项目</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>删除「{project.name}」？</AlertDialogTitle>
                  <AlertDialogDescription>此操作无法撤销。</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { s.deleteProject(project.id); toast("项目已删除"); navigate({ to: "/projects" }); }}>删除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}
