/** ai.lab domain model. Everything is data-driven; no project names, phase counts or durations are hardcoded. */
export type ID = string;
export type ISODate = string; // yyyy-MM-dd
export type ISODateTime = string;

export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";

export interface Project {
  id: ID;
  name: string;
  tagline: string;
  goal: string;
  description: string;
  category: string;
  status: ProjectStatus;
  startDate: ISODate;
  deadline: ISODate;
  hue: number; // planet tint, 0-360
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Phase {
  id: ID;
  projectId: ID;
  name: string;
  description: string;
  order: number;
  startDate: ISODate | null;
  endDate: ISODate | null;
}

export interface Task {
  id: ID;
  projectId: ID | null; // null = personal / unassigned
  phaseId: ID | null;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: ISODate | null;
  /** Pinned to the Today workbench for this date */
  plannedFor: ISODate | null;
  assetIds: ID[];
  completedAt: ISODateTime | null;
  createdAt: ISODateTime;
  order: number;
}

export interface Milestone {
  id: ID;
  projectId: ID;
  phaseId: ID | null;
  title: string;
  description: string;
  date: ISODate;
  achievedAt: ISODateTime | null;
}

export type DeliverableStatus = "planned" | "in_progress" | "delivered";
export interface Deliverable {
  id: ID;
  projectId: ID;
  phaseId: ID | null;
  title: string;
  description: string;
  status: DeliverableStatus;
  dueDate: ISODate | null;
  assetIds: ID[];
}

export type AssetKind = "image" | "document" | "video" | "audio" | "code" | "link" | "other";
export interface Asset {
  id: ID;
  projectId: ID | null;
  name: string;
  kind: AssetKind;
  mime: string;
  size: number;
  source: "upload" | "link";
  url: string | null; // for links
  blobKey: string | null; // key in local IndexedDB file store
  cover: string | null; // small data-URL thumbnail
  tags: string[];
  description: string;
  createdAt: ISODateTime;
}

export type InboxKind = "idea" | "task" | "resource";
export interface InboxItem {
  id: ID;
  text: string;
  kind: InboxKind;
  createdAt: ISODateTime;
  processed: boolean;
}

export interface Note {
  id: ID;
  title: string;
  body: string;
  tags: string[];
  projectId: ID | null;
  pinned: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface PromptVersion {
  body: string;
  savedAt: ISODateTime;
}
export interface Prompt {
  id: ID;
  title: string;
  body: string;
  category: string;
  tags: string[];
  projectId: ID | null;
  favorite: boolean;
  versions: PromptVersion[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type DevLogKind = "build" | "fix" | "research" | "decision" | "release";
export interface DevLog {
  id: ID;
  projectId: ID | null;
  date: ISODate;
  kind: DevLogKind;
  title: string;
  body: string;
  createdAt: ISODateTime;
}

export interface TemplatePhase {
  name: string;
  description: string;
  weight: number; // relative share of project duration
  tasks: { title: string; priority: Priority }[];
  deliverables: string[];
  milestone: string | null;
}
export interface Template {
  id: ID;
  name: string;
  description: string;
  category: string;
  suggestedDays: number;
  builtIn: boolean;
  phases: TemplatePhase[];
}

export interface Settings {
  userName: string;
  effects: boolean;
  particleDensity: "low" | "medium" | "high";
  cursorGlow: boolean;
  reduceMotion: boolean;
  defaultProjectView: "cards" | "universe";
}

export interface DataSnapshot {
  version: 1;
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  assets: Asset[];
  inbox: InboxItem[];
  notes: Note[];
  prompts: Prompt[];
  devlogs: DevLog[];
  templates: Template[];
}
