export interface OdysseyNode {
  id: string;
  index: number;
  name: string;
  state: "done" | "active" | "upcoming";
  progress: number;
  taskCount: number;
}
