import { useNavigate } from "@tanstack/react-router";
import { FileJson, FolderPlus, Inbox, ListPlus, NotebookPen, Sparkles, Library } from "lucide-react";
import { useEffect } from "react";
import { ProjectDot } from "@/components/common/ProjectDot";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { useStore } from "@/lib/data/store";
import { useUI } from "@/lib/ui-store";
import { NAV } from "./nav";

export function CommandMenu() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommand);
  const openQuick = useUI((s) => s.openQuick);
  const editTask = useUI((s) => s.editTask);
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const prompts = useStore((s) => s.prompts);
  const assets = useStore((s) => s.assets);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useUI.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="搜索项目、任务、笔记、资产，或输入命令…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>没有找到结果</CommandEmpty>
        <CommandGroup heading="快速操作">
          <CommandItem onSelect={() => openQuick("task")}><ListPlus /> 新建任务<CommandShortcut>T</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => openQuick("inbox")}><Inbox /> 收集到 Inbox</CommandItem>
          <CommandItem onSelect={() => openQuick("project")}><FolderPlus /> 新建项目</CommandItem>
          <CommandItem onSelect={() => openQuick("import")}><FileJson /> 导入 JSON 计划</CommandItem>
        </CommandGroup>
        <CommandGroup heading="导航">
          {NAV.flatMap((g) => g.items).map((i) => (
            <CommandItem key={i.to} value={`nav ${i.label} ${i.hint}`} onSelect={() => go(() => navigate({ to: i.to }))}>
              <i.Icon /> {i.label} <span className="text-muted-foreground">· {i.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {projects.length > 0 && (
          <CommandGroup heading="项目">
            {projects.map((p) => (
              <CommandItem key={p.id} value={`project ${p.name} ${p.tagline}`} onSelect={() => go(() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } }))}>
                <ProjectDot hue={p.hue} /> {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="任务">
          {tasks.slice(0, 200).map((t) => (
            <CommandItem key={t.id} value={`task ${t.title} ${t.id}`} onSelect={() => go(() => editTask(t.id))}>
              <ListPlus /> <span className={t.status === "done" ? "line-through opacity-60" : ""}>{t.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="笔记 · 提示词 · 资产">
          {notes.map((n) => (
            <CommandItem key={n.id} value={`note ${n.title} ${n.id}`} onSelect={() => go(() => navigate({ to: "/knowledge", search: { id: n.id } }))}><NotebookPen /> {n.title}</CommandItem>
          ))}
          {prompts.map((n) => (
            <CommandItem key={n.id} value={`prompt ${n.title} ${n.id}`} onSelect={() => go(() => navigate({ to: "/prompts", search: { id: n.id } }))}><Sparkles /> {n.title}</CommandItem>
          ))}
          {assets.slice(0, 100).map((n) => (
            <CommandItem key={n.id} value={`asset ${n.name} ${n.id}`} onSelect={() => go(() => navigate({ to: "/assets", search: { id: n.id } }))}><Library /> {n.name}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
