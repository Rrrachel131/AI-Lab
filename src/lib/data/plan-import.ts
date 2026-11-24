import { z } from "zod";
import { shiftDate, todayISO } from "./dates";
import { uid } from "./ids";
import type { Deliverable, Milestone, Phase, Project, Task } from "./types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式需为 YYYY-MM-DD");

export const planSchema = z.object({
  name: z.string().min(1, "缺少项目名称 name"),
  tagline: z.string().optional(),
  goal: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  startDate: dateStr.optional(),
  deadline: dateStr.optional(),
  phases: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: dateStr.optional(),
        endDate: dateStr.optional(),
        tasks: z
          .array(
            z.union([
              z.string().min(1),
              z.object({
                title: z.string().min(1),
                notes: z.string().optional(),
                priority: z.enum(["low", "medium", "high"]).optional(),
                dueDate: dateStr.optional(),
                status: z.enum(["todo", "doing", "done"]).optional(),
              }),
            ]),
          )
          .optional(),
        deliverables: z.array(z.union([z.string().min(1), z.object({ title: z.string().min(1), dueDate: dateStr.optional() })])).optional(),
        milestones: z.array(z.object({ title: z.string().min(1), date: dateStr.optional() })).optional(),
      }),
    )
    .min(1, "至少需要一个阶段 phases"),
});

export type PlanInput = z.infer<typeof planSchema>;

export interface ImportedPlan {
  project: Project;
  phases: Phase[];
  tasks: Task[];
  deliverables: Deliverable[];
  milestones: Milestone[];
}

export function parsePlanJSON(text: string): { ok: true; plan: PlanInput } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON 无法解析，请检查逗号与引号。" };
  }
  const res = planSchema.safeParse(raw);
  if (!res.success) {
    const issue = res.error.issues[0];
    return { ok: false, error: `${issue?.path.join(".") || "root"}: ${issue?.message ?? "格式错误"}` };
  }
  return { ok: true, plan: res.data };
}

/** Converts a validated plan into entities. Phases without dates split the project span evenly. */
export function buildFromPlan(plan: PlanInput, today = todayISO(), hue = 28): ImportedPlan {
  const now = new Date().toISOString();
  const start = plan.startDate ?? today;
  const deadline = plan.deadline ?? shiftDate(start, plan.phases.length * 14);
  const projectId = uid("prj");
  const project: Project = {
    id: projectId,
    name: plan.name,
    tagline: plan.tagline ?? "",
    goal: plan.goal ?? "",
    description: plan.description ?? "",
    category: plan.category ?? "Imported",
    status: "active",
    startDate: start,
    deadline,
    hue,
    createdAt: now,
    updatedAt: now,
  };
  const span = Math.max(1, Math.round((Date.parse(deadline) - Date.parse(start)) / 86400000));
  const per = span / plan.phases.length;
  const phases: Phase[] = [];
  const tasks: Task[] = [];
  const deliverables: Deliverable[] = [];
  const milestones: Milestone[] = [];
  plan.phases.forEach((p, i) => {
    const phaseId = uid("phs");
    const pStart = p.startDate ?? shiftDate(start, Math.round(per * i));
    const pEnd = p.endDate ?? shiftDate(start, Math.round(per * (i + 1)));
    phases.push({ id: phaseId, projectId, name: p.name, description: p.description ?? "", order: i, startDate: pStart, endDate: pEnd });
    (p.tasks ?? []).forEach((t, j) => {
      const obj = typeof t === "string" ? { title: t } : t;
      const status = "status" in obj && obj.status ? obj.status : "todo";
      tasks.push({
        id: uid("tsk"),
        projectId,
        phaseId,
        title: obj.title,
        notes: ("notes" in obj && obj.notes) || "",
        status,
        priority: ("priority" in obj && obj.priority) || "medium",
        dueDate: ("dueDate" in obj && obj.dueDate) || pEnd,
        plannedFor: null,
        assetIds: [],
        completedAt: status === "done" ? now : null,
        createdAt: now,
        order: j,
      });
    });
    (p.deliverables ?? []).forEach((d) => {
      const obj = typeof d === "string" ? { title: d } : d;
      deliverables.push({ id: uid("dlv"), projectId, phaseId, title: obj.title, description: "", status: "planned", dueDate: obj.dueDate ?? pEnd, assetIds: [] });
    });
    (p.milestones ?? []).forEach((m) => {
      milestones.push({ id: uid("mls"), projectId, phaseId, title: m.title, description: "", date: m.date ?? pEnd, achievedAt: null });
    });
  });
  return { project, phases, tasks, deliverables, milestones };
}

export const PLAN_EXAMPLE = `{
  "name": "Portfolio Website",
  "goal": "上线个人作品集并获得 3 次面试邀请",
  "startDate": "2026-12-01",
  "deadline": "2027-01-15",
  "phases": [
    {
      "name": "Research",
      "tasks": ["收集 10 个参考网站", { "title": "确定信息架构", "priority": "high" }],
      "deliverables": ["Moodboard"]
    },
    {
      "name": "Build",
      "tasks": ["搭建首页", "整理 3 个案例"],
      "milestones": [{ "title": "首版上线" }]
    }
  ]
}`;
