import { create } from "zustand";

export type QuickTab = "task" | "inbox" | "project" | "import";

interface UIState {
  commandOpen: boolean;
  quickOpen: boolean;
  quickTab: QuickTab;
  quickProjectId: string | null;
  taskEditId: string | null;
  setCommand(open: boolean): void;
  openQuick(tab?: QuickTab, projectId?: string | null): void;
  closeQuick(): void;
  editTask(id: string | null): void;
}

export const useUI = create<UIState>()((set) => ({
  commandOpen: false,
  quickOpen: false,
  quickTab: "task",
  quickProjectId: null,
  taskEditId: null,
  setCommand: (open) => set({ commandOpen: open }),
  openQuick: (tab = "task", projectId = null) => set({ quickOpen: true, quickTab: tab, quickProjectId: projectId, commandOpen: false }),
  closeQuick: () => set({ quickOpen: false }),
  editTask: (id) => set({ taskEditId: id }),
}));
