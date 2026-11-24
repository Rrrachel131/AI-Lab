import { shiftDate, todayISO } from "./dates";
import type { DataSnapshot, Deliverable, Milestone, Phase, Project, Task } from "./types";

/** Sample data. Built lazily (never at module scope) and fully editable / deletable by the user. */
export function makeSeed(today: ISODateLike = todayISO()): DataSnapshot {
  const now = new Date().toISOString();
  const d = (n: number) => shiftDate(today, n);
  const projects: Project[] = [];
  const phases: Phase[] = [];
  const tasks: Task[] = [];
  const milestones: Milestone[] = [];
  const deliverables: Deliverable[] = [];
  let order = 0;

  function project(p: Omit<Project, "createdAt" | "updatedAt" | "status"> & { status?: Project["status"] }) {
    projects.push({ status: "active", createdAt: now, updatedAt: now, ...p });
  }
  function phase(id: string, projectId: string, name: string, description: string, o: number, s: number, e: number) {
    phases.push({ id, projectId, name, description, order: o, startDate: d(s), endDate: d(e) });
  }
  function task(projectId: string, phaseId: string, title: string, status: Task["status"], priority: Task["priority"], due: number | null, planned: number | null = null, notes = "") {
    tasks.push({
      id: `tsk_seed_${++order}`,
      projectId,
      phaseId,
      title,
      notes,
      status,
      priority,
      dueDate: due === null ? null : d(due),
      plannedFor: planned === null ? null : d(planned),
      assetIds: [],
      completedAt: status === "done" ? (planned === 0 ? now : new Date(Date.now() - 86400000 * 3).toISOString()) : null,
      createdAt: now,
      order,
    });
  }

  // ——— CareerPilot AI ———
  const cp = "prj_careerpilot";
  project({ id: cp, name: "CareerPilot AI", tagline: "AI 求职副驾驶", goal: "上线 AI 简历优化与面试模拟 MVP，获得 100 名种子用户", description: "一个帮助求职者优化简历、匹配岗位并进行模拟面试的 AI 助手。", category: "Product", startDate: d(-24), deadline: d(41), hue: 24 });
  phase("phs_cp_1", cp, "Discovery", "用户访谈与问题定义", 0, -24, -12);
  phase("phs_cp_2", cp, "Product Design", "核心流程与界面设计", 1, -12, 2);
  phase("phs_cp_3", cp, "MVP Build", "简历解析、岗位匹配与面试模拟", 2, 2, 24);
  phase("phs_cp_4", cp, "Beta", "种子用户测试与迭代", 3, 24, 34);
  phase("phs_cp_5", cp, "Launch", "发布与增长", 4, 34, 41);
  task(cp, "phs_cp_1", "完成 8 位求职者深度访谈", "done", "high", -16);
  task(cp, "phs_cp_1", "整理竞品矩阵（Teal / Kickresume）", "done", "medium", -14);
  task(cp, "phs_cp_1", "撰写问题定义文档", "done", "high", -12);
  task(cp, "phs_cp_2", "绘制简历优化核心流程", "done", "high", -6);
  task(cp, "phs_cp_2", "完成面试模拟界面高保真", "doing", "high", 0, 0, "重点：实时反馈面板与评分可视化");
  task(cp, "phs_cp_2", "设计系统与组件规范", "todo", "medium", 1, 0);
  task(cp, "phs_cp_2", "可用性测试脚本", "todo", "low", -1);
  task(cp, "phs_cp_3", "简历 PDF 解析原型", "todo", "high", 8);
  task(cp, "phs_cp_3", "岗位匹配评分算法", "todo", "high", 14);
  task(cp, "phs_cp_3", "面试问答 Prompt 链", "todo", "medium", 18);
  task(cp, "phs_cp_3", "账户与数据存储接入", "todo", "medium", 22);
  task(cp, "phs_cp_4", "招募 30 名 Beta 用户", "todo", "high", 27);
  task(cp, "phs_cp_4", "收集反馈并迭代", "todo", "medium", 33);
  task(cp, "phs_cp_5", "Product Hunt 发布", "todo", "high", 40);
  milestones.push(
    { id: "mls_cp_1", projectId: cp, phaseId: "phs_cp_1", title: "问题验证完成", description: "访谈结论得出核心痛点", date: d(-12), achievedAt: now },
    { id: "mls_cp_2", projectId: cp, phaseId: "phs_cp_2", title: "设计冻结", description: "", date: d(2), achievedAt: null },
    { id: "mls_cp_3", projectId: cp, phaseId: "phs_cp_3", title: "MVP 可演示", description: "", date: d(24), achievedAt: null },
    { id: "mls_cp_4", projectId: cp, phaseId: "phs_cp_5", title: "正式发布", description: "", date: d(41), achievedAt: null },
  );
  deliverables.push(
    { id: "dlv_cp_1", projectId: cp, phaseId: "phs_cp_1", title: "用户访谈报告", description: "", status: "delivered", dueDate: d(-12), assetIds: [] },
    { id: "dlv_cp_2", projectId: cp, phaseId: "phs_cp_2", title: "高保真设计稿", description: "", status: "in_progress", dueDate: d(2), assetIds: [] },
    { id: "dlv_cp_3", projectId: cp, phaseId: "phs_cp_3", title: "MVP Web App", description: "", status: "planned", dueDate: d(24), assetIds: [] },
    { id: "dlv_cp_4", projectId: cp, phaseId: "phs_cp_5", title: "发布说明与落地页", description: "", status: "planned", dueDate: d(41), assetIds: [] },
  );

  // ——— Learning plan ———
  const dl = "prj_deeplearning";
  project({ id: dl, name: "Deep Learning Foundations", tagline: "系统学习深度学习", goal: "完成课程并独立复现一篇 Transformer 论文", description: "", category: "Learning", startDate: d(-10), deadline: d(30), hue: 38 });
  phase("phs_dl_1", dl, "Math & Basics", "", 0, -10, 4);
  phase("phs_dl_2", dl, "Transformers", "", 1, 4, 20);
  phase("phs_dl_3", dl, "Reproduce", "", 2, 20, 30);
  task(dl, "phs_dl_1", "线性代数复习 · 第 1–3 章", "done", "medium", -4);
  task(dl, "phs_dl_1", "反向传播手推一遍", "todo", "high", 0, 0);
  task(dl, "phs_dl_1", "完成 MLP 练习", "todo", "medium", 3);
  task(dl, "phs_dl_2", "精读 Attention Is All You Need", "todo", "high", 10);
  task(dl, "phs_dl_2", "实现 Self-Attention 模块", "todo", "high", 16);
  task(dl, "phs_dl_3", "复现 mini-GPT 并写报告", "todo", "high", 29);
  milestones.push({ id: "mls_dl_1", projectId: dl, phaseId: "phs_dl_3", title: "论文复现", description: "", date: d(30), achievedAt: null });

  // ——— Personal goal ———
  const hm = "prj_halfmarathon";
  project({ id: hm, name: "Half Marathon", tagline: "完成第一场半马", goal: "2 小时内完成 21.1 km", description: "", category: "Life", startDate: d(-35), deadline: d(62), hue: 16 });
  phase("phs_hm_1", hm, "Base", "", 0, -35, 0);
  phase("phs_hm_2", hm, "Build", "", 1, 0, 40);
  phase("phs_hm_3", hm, "Peak", "", 2, 40, 55);
  phase("phs_hm_4", hm, "Race", "", 3, 55, 62);
  task(hm, "phs_hm_1", "连续 4 周每周 3 跑", "done", "medium", -7);
  task(hm, "phs_hm_1", "测试 5km 基准配速", "done", "low", -2);
  task(hm, "phs_hm_2", "今日 8km 有氧跑", "todo", "medium", 0, 0);
  task(hm, "phs_hm_2", "长距离 15km", "todo", "high", 12);
  task(hm, "phs_hm_3", "模拟赛 18km", "todo", "high", 48);
  task(hm, "phs_hm_4", "比赛日", "todo", "high", 62);

  return {
    version: 1,
    projects,
    phases,
    tasks,
    milestones,
    deliverables,
    assets: [
      { id: "ast_seed_1", projectId: cp, name: "WCAG 2.2 Quick Reference", kind: "link", mime: "text/html", size: 0, source: "link", url: "https://www.w3.org/WAI/WCAG22/quickref/", blobKey: null, cover: null, tags: ["design", "a11y"], description: "设计评审时的无障碍检查清单", createdAt: now },
      { id: "ast_seed_2", projectId: dl, name: "Attention Is All You Need", kind: "document", mime: "application/pdf", size: 0, source: "link", url: "https://arxiv.org/abs/1706.03762", blobKey: null, cover: null, tags: ["paper"], description: "Transformer 原论文", createdAt: now },
      { id: "ast_seed_3", projectId: null, name: "Three.js Docs", kind: "code", mime: "text/html", size: 0, source: "link", url: "https://threejs.org/docs/", blobKey: null, cover: null, tags: ["webgl"], description: "", createdAt: now },
    ],
    inbox: [
      { id: "inb_seed_1", text: "面试模拟可以加入语音回答 + 语速分析", kind: "idea", createdAt: now, processed: false },
      { id: "inb_seed_2", text: "预约下周的牙医", kind: "task", createdAt: now, processed: false },
    ],
    notes: [
      { id: "nte_seed_1", title: "访谈洞察 · 求职者的三个焦虑", body: "1. 不知道简历哪里不好\n2. 投递后没有反馈\n3. 面试前缺少真实练习\n\n→ CareerPilot 的切入点：即时、具体、可执行的反馈。", tags: ["research"], projectId: cp, pinned: true, createdAt: now, updatedAt: now },
      { id: "nte_seed_2", title: "Self-Attention 直觉", body: "Q·K 决定「看哪里」，V 决定「看到什么」。缩放因子 √d 防止 softmax 饱和。", tags: ["ml"], projectId: dl, pinned: false, createdAt: now, updatedAt: now },
    ],
    prompts: [
      {
        id: "prm_seed_1",
        title: "简历要点改写",
        body: "你是一名资深招聘官。请将以下简历要点改写为结果导向的表述，使用 STAR 结构，保留真实信息，不夸大。\n\n目标岗位：{{role}}\n原始要点：\n{{bullets}}\n\n输出 3 个版本，并说明各自侧重点。",
        category: "Writing",
        tags: ["careerpilot"],
        projectId: cp,
        favorite: true,
        versions: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prm_seed_2",
        title: "论文精读助手",
        body: "请用三层结构解读论文《{{paper}}》：\n1. 一句话贡献\n2. 方法核心（含公式直觉）\n3. 局限与可复现要点\n\n读者水平：{{level}}",
        category: "Research",
        tags: ["learning"],
        projectId: dl,
        favorite: false,
        versions: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    devlogs: [
      { id: "dev_seed_1", projectId: cp, date: d(-3), kind: "decision", title: "MVP 先做简历优化，面试模拟延后", body: "访谈中 6/8 位用户首要痛点是简历。面试模拟放入 MVP Build 后半段。", createdAt: now },
      { id: "dev_seed_2", projectId: cp, date: d(-1), kind: "build", title: "完成简历优化流程原型", body: "上传 → 解析 → 逐条建议 → 一键应用。", createdAt: now },
    ],
    templates: [],
  };
}

type ISODateLike = string;
