import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { CursorGlow } from "@/components/fx/CursorGlow";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { useStore } from "@/lib/data/store";
import { useFx } from "@/lib/fx";
import { cn } from "@/lib/utils";
import { QuickCreate } from "./QuickCreate";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const fx = useFx();

  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() => {
      useStore.getState().ensureInitialized();
      useStore.setState({ hydrated: true });
    });
  }, []);

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="flex flex-col items-center gap-4" role="status">
          <LogoMark className="size-12" spin />
          <span className="text-sm text-muted-foreground">正在加载工作台</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-dvh bg-background", !fx.motion && "fx-off")}>
      <CursorGlow />
      <header className="relative border-b bg-background">
        <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold">
            <LogoMark />
            <span>今日工作台</span>
          </Link>
          <span className="text-xs text-muted-foreground">数据保存在此浏览器</span>
        </div>
      </header>
      <main className="relative">{children}</main>
      <QuickCreate />
      <TaskEditDialog />
    </div>
  );
}
