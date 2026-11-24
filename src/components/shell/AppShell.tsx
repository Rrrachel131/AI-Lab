import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, Plus, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { LocalModeBadge } from "@/components/common/Page";
import { ProjectDot } from "@/components/common/ProjectDot";
import { CursorGlow } from "@/components/fx/CursorGlow";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/data/store";
import { useFx } from "@/lib/fx";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./CommandMenu";
import { NAV } from "./nav";
import { QuickCreate } from "./QuickCreate";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 text-foreground">
        <LogoMark className="size-12" spin />
        <span className="eyebrow">Loading workspace</span>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const setCommand = useUI((s) => s.setCommand);
  const openQuick = useUI((s) => s.openQuick);
  const active = projects.filter((p) => p.status === "active" || p.status === "paused");
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"));
  const inboxCount = useStore((s) => s.inbox.filter((i) => !i.processed).length);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <Link to="/" onClick={onNavigate} className="inline-flex items-center gap-2 text-foreground">
          <LogoMark className="size-7" />
          <Wordmark />
        </Link>
      </div>
      <div className="flex gap-2 px-3">
        <button onClick={() => setCommand(true)} className="flex h-9 flex-1 items-center gap-2 rounded-full border bg-card px-3 text-sm text-muted-foreground transition hover:border-ink/20">
          <Search className="size-3.5" /> 搜索
          <kbd className="ml-auto rounded border px-1.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <Button size="icon" variant="ember" className="size-9" onClick={() => openQuick("task")} aria-label="快速创建">
          <Plus />
        </Button>
      </div>
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4 scrollbar-none">
        {NAV.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="eyebrow px-3 pb-1.5 text-[10px]">{g.group}</div>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const on = isActive(i.to);
                return (
                  <li key={i.to}>
                    <Link to={i.to} onClick={onNavigate} className={cn("relative flex h-9 items-center gap-3 rounded-lg px-3 text-[0.9rem] transition-colors", on ? "text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}>
                      {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-card shadow-lift" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <i.Icon className={cn("relative size-4", on && "text-brand")} strokeWidth={1.8} />
                      <span className="relative">{i.label}</span>
                      {i.to === "/inbox" && inboxCount > 0 && <span className="relative ml-auto font-mono text-[10px] text-muted-foreground">{inboxCount}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {active.length > 0 && (
          <div className="mb-4">
            <div className="eyebrow flex items-center justify-between px-3 pb-1.5 text-[10px]">
              <span>Projects</span>
              <button onClick={() => openQuick("project")} className="hover:text-foreground" aria-label="新建项目"><Plus className="size-3" /></button>
            </div>
            <ul className="space-y-0.5">
              {active.map((p) => {
                const own = tasks.filter((t) => t.projectId === p.id);
                const pct = own.length ? Math.round((own.filter((t) => t.status === "done").length / own.length) * 100) : 0;
                const on = pathname.startsWith(`/projects/${p.id}`);
                return (
                  <li key={p.id}>
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} onClick={onNavigate} className={cn("flex h-8 items-center gap-3 rounded-lg px-3 text-sm transition-colors", on ? "bg-card text-foreground shadow-lift" : "text-muted-foreground hover:text-foreground")}>
                      <ProjectDot hue={p.hue} />
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto font-mono text-[10px] tabular">{pct}%</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
      <div className="border-t px-5 py-4">
        <LocalModeBadge />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">From curiosity to intelligence.</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const setCommand = useUI((s) => s.setCommand);
  const openQuick = useUI((s) => s.openQuick);
  const fx = useFx();

  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => {
      useStore.getState().ensureInitialized();
      useStore.setState({ hydrated: true });
    });
  }, []);

  if (!hydrated) return <Splash />;

  const pageKey = pathname.split("/").slice(0, 3).join("/");

  return (
    <div className={cn("relative min-h-dvh bg-background", !fx.motion && "fx-off")}>
      <CursorGlow />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarContent />
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground">
          <LogoMark className="size-6" />
          <Wordmark />
        </Link>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setCommand(true)} aria-label="搜索"><Search /></Button>
          <Button size="icon" variant="ghost" onClick={() => setMobileOpen(true)} aria-label="菜单"><Menu /></Button>
        </div>
      </header>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[82vw] max-w-xs bg-sidebar p-0">
          <SheetTitle className="sr-only">导航</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="relative lg:pl-64">
        <motion.div key={pageKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          {children}
        </motion.div>
      </main>
      <Button variant="ember" size="icon" className="fixed bottom-5 right-5 z-30 size-12 lg:hidden" onClick={() => openQuick("task")} aria-label="快速创建">
        <Plus className="size-5" />
      </Button>
      <CommandMenu />
      <QuickCreate />
      <TaskEditDialog />
    </div>
  );
}
