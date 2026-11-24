export interface UniverseBody {
  id: string;
  name: string;
  hue: number;
  progress: number; // 0..1 real task completion
  taskCount: number;
  daysLeft: number;
  status: string;
}
