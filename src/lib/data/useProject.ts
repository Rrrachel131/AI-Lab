import { useMemo } from "react";
import { phaseStates, taskProgress } from "./progress";
import { useStore } from "./store";

export function useProjectData(projectId: string) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId) ?? null);
  const allPhases = useStore((s) => s.phases);
  const allTasks = useStore((s) => s.tasks);
  const allMilestones = useStore((s) => s.milestones);
  const allDeliverables = useStore((s) => s.deliverables);
  const allAssets = useStore((s) => s.assets);
  return useMemo(() => {
    const phases = allPhases.filter((p) => p.projectId === projectId).sort((a, b) => a.order - b.order);
    const tasks = allTasks.filter((t) => t.projectId === projectId);
    const milestones = allMilestones.filter((m) => m.projectId === projectId).sort((a, b) => a.date.localeCompare(b.date));
    const deliverables = allDeliverables.filter((d) => d.projectId === projectId);
    const linkedIds = new Set([...tasks.flatMap((t) => t.assetIds), ...deliverables.flatMap((d) => d.assetIds)]);
    const assets = allAssets.filter((a) => a.projectId === projectId || linkedIds.has(a.id));
    const states = phaseStates(phases, tasks);
    const progress = taskProgress(tasks);
    const phaseInfo = phases.map((ph, index) => {
      const own = tasks.filter((t) => t.phaseId === ph.id);
      return { phase: ph, index, state: states.get(ph.id) ?? "upcoming", progress: taskProgress(own), tasks: own };
    });
    return { project, phases, tasks, milestones, deliverables, assets, progress, phaseInfo };
  }, [project, projectId, allPhases, allTasks, allMilestones, allDeliverables, allAssets]);
}
