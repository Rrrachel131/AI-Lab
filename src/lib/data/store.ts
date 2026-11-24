import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { shiftDate, todayISO } from "./dates";
import { fileStore } from "./file-store";
import { uid } from "./ids";
import type { ImportedPlan } from "./plan-import";
import { makeSeed } from "./seed";
import type {
  Asset,
  DataSnapshot,
  Deliverable,
  DevLog,
  ID,
  InboxItem,
  Milestone,
  Note,
  Phase,
  Project,
  Prompt,
  Settings,
  Task,
  Template,
} from "./types";

type Patch<T> = Partial<Omit<T, "id">>;

const defaultSettings: Settings = {
  userName: "",
  effects: true,
  particleDensity: "medium",
  cursorGlow: true,
  reduceMotion: false,
  defaultProjectView: "universe",
};

interface State extends Omit<DataSnapshot, "version"> {
  settings: Settings;
  initialized: boolean;
  hydrated: boolean;
  /** Recently completed ids (for one-shot celebration animations) */
  lastCompleted: string | null;

  // projects
  createProject(p: Partial<Project> & { name: string }, phases?: { name: string; description?: string }[]): Project;
  updateProject(id: ID, patch: Patch<Project>): void;
  deleteProject(id: ID): void;
  importPlan(plan: ImportedPlan): void;
  createFromTemplate(t: Template, opts: { name: string; goal: string; startDate: string; deadline: string }): Project;

  // phases
  addPhase(projectId: ID, name: string): void;
  updatePhase(id: ID, patch: Patch<Phase>): void;
  deletePhase(id: ID): void;
  movePhase(id: ID, dir: -1 | 1): void;

  // tasks
  addTask(t: Partial<Task> & { title: string }): Task;
  updateTask(id: ID, patch: Patch<Task>): void;
  setTaskStatus(id: ID, status: Task["status"]): void;
  toggleTask(id: ID): void;
  deleteTask(id: ID): void;

  // milestones / deliverables
  addMilestone(m: Omit<Milestone, "id" | "achievedAt">): void;
  updateMilestone(id: ID, patch: Patch<Milestone>): void;
  toggleMilestone(id: ID): void;
  deleteMilestone(id: ID): void;
  addDeliverable(d: Omit<Deliverable, "id" | "assetIds" | "status"> & Partial<Deliverable>): void;
  updateDeliverable(id: ID, patch: Patch<Deliverable>): void;
  deleteDeliverable(id: ID): void;

  // assets
  addAsset(a: Omit<Asset, "id" | "createdAt">): Asset;
  updateAsset(id: ID, patch: Patch<Asset>): void;
  deleteAsset(id: ID): Promise<void>;
  linkAssetToTask(taskId: ID, assetId: ID): void;
  unlinkAssetFromTask(taskId: ID, assetId: ID): void;

  // inbox / notes / prompts / logs / templates
  addInbox(text: string, kind: InboxItem["kind"]): void;
  updateInbox(id: ID, patch: Patch<InboxItem>): void;
  deleteInbox(id: ID): void;
  addNote(n?: Partial<Note>): Note;
  updateNote(id: ID, patch: Patch<Note>): void;
  deleteNote(id: ID): void;
  addPrompt(p?: Partial<Prompt>): Prompt;
  updatePrompt(id: ID, patch: Patch<Prompt>): void;
  savePromptVersion(id: ID): void;
  deletePrompt(id: ID): void;
  addDevLog(l: Omit<DevLog, "id" | "createdAt">): void;
  updateDevLog(id: ID, patch: Patch<DevLog>): void;
  deleteDevLog(id: ID): void;
  saveProjectAsTemplate(projectId: ID): void;
  deleteTemplate(id: ID): void;

  // system
  updateSettings(patch: Partial<Settings>): void;
  ensureInitialized(): void;
  resetToSample(): void;
  clearAll(): void;
  exportSnapshot(): DataSnapshot;
  importSnapshot(s: DataSnapshot): void;
}

const empty: Omit<DataSnapshot, "version"> = {
  projects: [],
  phases: [],
  tasks: [],
  milestones: [],
  deliverables: [],
  assets: [],
  inbox: [],
  notes: [],
  prompts: [],
  devlogs: [],
  templates: [],
};

const nowISO = () => new Date().toISOString();
const map = <T extends { id: ID }>(arr: T[], id: ID, fn: (x: T) => T) => arr.map((x) => (x.id === id ? fn(x) : x));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...empty,
      settings: defaultSettings,
      initialized: false,
      hydrated: false,
      lastCompleted: null,

      createProject(p, phaseDefs) {
        const today = todayISO();
        const project: Project = {
          id: uid("prj"),
          tagline: "",
          goal: "",
          description: "",
          category: "General",
          status: "active",
          startDate: today,
          deadline: shiftDate(today, 30),
          hue: 20 + Math.round(Math.random() * 30),
          createdAt: nowISO(),
          updatedAt: nowISO(),
          ...p,
        };
        const defs = phaseDefs && phaseDefs.length ? phaseDefs : [{ name: "Plan" }, { name: "Execute" }, { name: "Deliver" }];
        const span = Math.max(1, (Date.parse(project.deadline) - Date.parse(project.startDate)) / 86400000);
        const per = span / defs.length;
        const phases: Phase[] = defs.map((d, i) => ({
          id: uid("phs"),
          projectId: project.id,
          name: d.name,
          description: d.description ?? "",
          order: i,
          startDate: shiftDate(project.startDate, Math.round(per * i)),
          endDate: shiftDate(project.startDate, Math.round(per * (i + 1))),
        }));
        set((s) => ({ projects: [...s.projects, project], phases: [...s.phases, ...phases] }));
        return project;
      },
      updateProject(id, patch) {
        set((s) => ({ projects: map(s.projects, id, (p) => ({ ...p, ...patch, updatedAt: nowISO() })) }));
      },
      deleteProject(id) {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          phases: s.phases.filter((x) => x.projectId !== id),
          tasks: s.tasks.filter((x) => x.projectId !== id),
          milestones: s.milestones.filter((x) => x.projectId !== id),
          deliverables: s.deliverables.filter((x) => x.projectId !== id),
          assets: s.assets.map((a) => (a.projectId === id ? { ...a, projectId: null } : a)),
          notes: s.notes.map((n) => (n.projectId === id ? { ...n, projectId: null } : n)),
          prompts: s.prompts.map((n) => (n.projectId === id ? { ...n, projectId: null } : n)),
          devlogs: s.devlogs.map((n) => (n.projectId === id ? { ...n, projectId: null } : n)),
        }));
      },
      importPlan(plan) {
        set((s) => ({
          projects: [...s.projects, plan.project],
          phases: [...s.phases, ...plan.phases],
          tasks: [...s.tasks, ...plan.tasks],
          milestones: [...s.milestones, ...plan.milestones],
          deliverables: [...s.deliverables, ...plan.deliverables],
        }));
      },
      createFromTemplate(t, opts) {
        const project = get().createProject(
          { name: opts.name, goal: opts.goal, startDate: opts.startDate, deadline: opts.deadline, category: t.category },
          [],
        );
        // replace default phases with weighted template phases
        const span = Math.max(1, (Date.parse(opts.deadline) - Date.parse(opts.startDate)) / 86400000);
        const totalW = t.phases.reduce((a, p) => a + p.weight, 0) || 1;
        let cursor = 0;
        const phases: Phase[] = [];
        const tasks: Task[] = [];
        const dels: Deliverable[] = [];
        const mls: Milestone[] = [];
        t.phases.forEach((tp, i) => {
          const len = (span * tp.weight) / totalW;
          const startDate = shiftDate(opts.startDate, Math.round(cursor));
          cursor += len;
          const endDate = shiftDate(opts.startDate, Math.round(cursor));
          const phaseId = uid("phs");
          phases.push({ id: phaseId, projectId: project.id, name: tp.name, description: tp.description, order: i, startDate, endDate });
          tp.tasks.forEach((tt, j) =>
            tasks.push({ id: uid("tsk"), projectId: project.id, phaseId, title: tt.title, notes: "", status: "todo", priority: tt.priority, dueDate: endDate, plannedFor: null, assetIds: [], completedAt: null, createdAt: nowISO(), order: j }),
          );
          tp.deliverables.forEach((d) => dels.push({ id: uid("dlv"), projectId: project.id, phaseId, title: d, description: "", status: "planned", dueDate: endDate, assetIds: [] }));
          if (tp.milestone) mls.push({ id: uid("mls"), projectId: project.id, phaseId, title: tp.milestone, description: "", date: endDate, achievedAt: null });
        });
        set((s) => ({
          phases: [...s.phases.filter((p) => p.projectId !== project.id), ...phases],
          tasks: [...s.tasks, ...tasks],
          deliverables: [...s.deliverables, ...dels],
          milestones: [...s.milestones, ...mls],
        }));
        return project;
      },

      addPhase(projectId, name) {
        const own = get().phases.filter((p) => p.projectId === projectId);
        const order = own.length ? Math.max(...own.map((p) => p.order)) + 1 : 0;
        set((s) => ({ phases: [...s.phases, { id: uid("phs"), projectId, name, description: "", order, startDate: null, endDate: null }] }));
      },
      updatePhase(id, patch) {
        set((s) => ({ phases: map(s.phases, id, (p) => ({ ...p, ...patch })) }));
      },
      deletePhase(id) {
        set((s) => ({
          phases: s.phases.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => (t.phaseId === id ? { ...t, phaseId: null } : t)),
          milestones: s.milestones.map((t) => (t.phaseId === id ? { ...t, phaseId: null } : t)),
          deliverables: s.deliverables.map((t) => (t.phaseId === id ? { ...t, phaseId: null } : t)),
        }));
      },
      movePhase(id, dir) {
        const ph = get().phases.find((p) => p.id === id);
        if (!ph) return;
        const siblings = get().phases.filter((p) => p.projectId === ph.projectId).sort((a, b) => a.order - b.order);
        const i = siblings.findIndex((p) => p.id === id);
        const j = i + dir;
        if (j < 0 || j >= siblings.length) return;
        const reordered = [...siblings];
        const [moved] = reordered.splice(i, 1);
        if (moved) reordered.splice(j, 0, moved);
        const orders = new Map(reordered.map((p, k) => [p.id, k]));
        set((s) => ({ phases: s.phases.map((p) => (orders.has(p.id) ? { ...p, order: orders.get(p.id) ?? p.order } : p)) }));
      },

      addTask(t) {
        const task: Task = {
          id: uid("tsk"),
          projectId: null,
          phaseId: null,
          notes: "",
          status: "todo",
          priority: "medium",
          dueDate: null,
          plannedFor: null,
          assetIds: [],
          completedAt: null,
          createdAt: nowISO(),
          order: get().tasks.length,
          ...t,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },
      updateTask(id, patch) {
        set((s) => ({ tasks: map(s.tasks, id, (t) => ({ ...t, ...patch })) }));
      },
      setTaskStatus(id, status) {
        set((s) => ({
          lastCompleted: status === "done" ? id : s.lastCompleted,
          tasks: map(s.tasks, id, (t) => ({ ...t, status, completedAt: status === "done" ? (t.completedAt ?? nowISO()) : null })),
        }));
      },
      toggleTask(id) {
        const t = get().tasks.find((x) => x.id === id);
        if (t) get().setTaskStatus(id, t.status === "done" ? "todo" : "done");
      },
      deleteTask(id) {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      addMilestone(m) {
        set((s) => ({ milestones: [...s.milestones, { ...m, id: uid("mls"), achievedAt: null }] }));
      },
      updateMilestone(id, patch) {
        set((s) => ({ milestones: map(s.milestones, id, (m) => ({ ...m, ...patch })) }));
      },
      toggleMilestone(id) {
        set((s) => ({
          lastCompleted: id,
          milestones: map(s.milestones, id, (m) => ({ ...m, achievedAt: m.achievedAt ? null : nowISO() })),
        }));
      },
      deleteMilestone(id) {
        set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
      },
      addDeliverable(d) {
        set((s) => ({ deliverables: [...s.deliverables, { status: "planned", assetIds: [], ...d, id: uid("dlv") }] }));
      },
      updateDeliverable(id, patch) {
        set((s) => ({ deliverables: map(s.deliverables, id, (d) => ({ ...d, ...patch })) }));
      },
      deleteDeliverable(id) {
        set((s) => ({ deliverables: s.deliverables.filter((d) => d.id !== id) }));
      },

      addAsset(a) {
        const asset: Asset = { ...a, id: uid("ast"), createdAt: nowISO() };
        set((s) => ({ assets: [asset, ...s.assets] }));
        return asset;
      },
      updateAsset(id, patch) {
        set((s) => ({ assets: map(s.assets, id, (a) => ({ ...a, ...patch })) }));
      },
      async deleteAsset(id) {
        const a = get().assets.find((x) => x.id === id);
        if (a?.blobKey) await fileStore.remove(a.blobKey).catch(() => undefined);
        set((s) => ({
          assets: s.assets.filter((x) => x.id !== id),
          tasks: s.tasks.map((t) => (t.assetIds.includes(id) ? { ...t, assetIds: t.assetIds.filter((x) => x !== id) } : t)),
          deliverables: s.deliverables.map((t) => (t.assetIds.includes(id) ? { ...t, assetIds: t.assetIds.filter((x) => x !== id) } : t)),
        }));
      },
      linkAssetToTask(taskId, assetId) {
        set((s) => ({ tasks: map(s.tasks, taskId, (t) => (t.assetIds.includes(assetId) ? t : { ...t, assetIds: [...t.assetIds, assetId] })) }));
      },
      unlinkAssetFromTask(taskId, assetId) {
        set((s) => ({ tasks: map(s.tasks, taskId, (t) => ({ ...t, assetIds: t.assetIds.filter((x) => x !== assetId) })) }));
      },

      addInbox(text, kind) {
        set((s) => ({ inbox: [{ id: uid("inb"), text, kind, createdAt: nowISO(), processed: false }, ...s.inbox] }));
      },
      updateInbox(id, patch) {
        set((s) => ({ inbox: map(s.inbox, id, (i) => ({ ...i, ...patch })) }));
      },
      deleteInbox(id) {
        set((s) => ({ inbox: s.inbox.filter((i) => i.id !== id) }));
      },
      addNote(n) {
        const note: Note = { id: uid("nte"), title: "Untitled", body: "", tags: [], projectId: null, pinned: false, createdAt: nowISO(), updatedAt: nowISO(), ...n };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      updateNote(id, patch) {
        set((s) => ({ notes: map(s.notes, id, (n) => ({ ...n, ...patch, updatedAt: nowISO() })) }));
      },
      deleteNote(id) {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      },
      addPrompt(p) {
        const prompt: Prompt = { id: uid("prm"), title: "Untitled prompt", body: "", category: "General", tags: [], projectId: null, favorite: false, versions: [], createdAt: nowISO(), updatedAt: nowISO(), ...p };
        set((s) => ({ prompts: [prompt, ...s.prompts] }));
        return prompt;
      },
      updatePrompt(id, patch) {
        set((s) => ({ prompts: map(s.prompts, id, (p) => ({ ...p, ...patch, updatedAt: nowISO() })) }));
      },
      savePromptVersion(id) {
        set((s) => ({ prompts: map(s.prompts, id, (p) => ({ ...p, versions: [{ body: p.body, savedAt: nowISO() }, ...p.versions].slice(0, 30) })) }));
      },
      deletePrompt(id) {
        set((s) => ({ prompts: s.prompts.filter((p) => p.id !== id) }));
      },
      addDevLog(l) {
        set((s) => ({ devlogs: [{ ...l, id: uid("dev"), createdAt: nowISO() }, ...s.devlogs] }));
      },
      updateDevLog(id, patch) {
        set((s) => ({ devlogs: map(s.devlogs, id, (d) => ({ ...d, ...patch })) }));
      },
      deleteDevLog(id) {
        set((s) => ({ devlogs: s.devlogs.filter((d) => d.id !== id) }));
      },
      saveProjectAsTemplate(projectId) {
        const s = get();
        const p = s.projects.find((x) => x.id === projectId);
        if (!p) return;
        const phases = s.phases.filter((x) => x.projectId === projectId).sort((a, b) => a.order - b.order);
        const days = Math.max(1, (Date.parse(p.deadline) - Date.parse(p.startDate)) / 86400000);
        const tpl: Template = {
          id: uid("tpl"),
          name: `${p.name} Template`,
          description: p.goal || p.description,
          category: p.category,
          suggestedDays: Math.round(days),
          builtIn: false,
          phases: phases.map((ph) => ({
            name: ph.name,
            description: ph.description,
            weight: ph.startDate && ph.endDate ? Math.max(1, (Date.parse(ph.endDate) - Date.parse(ph.startDate)) / 86400000) : 1,
            tasks: s.tasks.filter((t) => t.phaseId === ph.id).map((t) => ({ title: t.title, priority: t.priority })),
            deliverables: s.deliverables.filter((d) => d.phaseId === ph.id).map((d) => d.title),
            milestone: s.milestones.find((m) => m.phaseId === ph.id)?.title ?? null,
          })),
        };
        set((st) => ({ templates: [...st.templates, tpl] }));
      },
      deleteTemplate(id) {
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
      },

      updateSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },
      ensureInitialized() {
        if (get().initialized) return;
        const seed = makeSeed();
        set({ ...seed, initialized: true });
      },
      resetToSample() {
        const seed = makeSeed();
        set({ ...seed, initialized: true });
      },
      clearAll() {
        set({ ...empty, initialized: true });
      },
      exportSnapshot() {
        const s = get();
        return { version: 1, projects: s.projects, phases: s.phases, tasks: s.tasks, milestones: s.milestones, deliverables: s.deliverables, assets: s.assets, inbox: s.inbox, notes: s.notes, prompts: s.prompts, devlogs: s.devlogs, templates: s.templates };
      },
      importSnapshot(snap) {
        set({ ...empty, ...snap, initialized: true });
      },
    }),
    {
      name: "ailab:v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        const { hydrated: _h, lastCompleted: _l, ...rest } = s;
        void _h;
        void _l;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as Partial<State>;
      },
      onRehydrateStorage: () => (state) => {
        state?.ensureInitialized();
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

export type AppState = State;
