import type { Template } from "./types";

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "tpl_product",
    name: "Product Launch",
    description: "从问题定义到上线发布的产品开发路径。",
    category: "Product",
    suggestedDays: 60,
    builtIn: true,
    phases: [
      { name: "Discovery", description: "定义问题、用户与机会", weight: 1, tasks: [{ title: "完成 5 次用户访谈", priority: "high" }, { title: "整理竞品分析", priority: "medium" }], deliverables: ["问题定义文档"], milestone: "机会验证" },
      { name: "Design", description: "信息架构与关键界面", weight: 1, tasks: [{ title: "绘制核心流程", priority: "high" }, { title: "高保真设计稿", priority: "medium" }], deliverables: ["设计稿"], milestone: null },
      { name: "Build", description: "实现 MVP", weight: 2, tasks: [{ title: "搭建项目框架", priority: "high" }, { title: "实现核心功能", priority: "high" }, { title: "接入数据与认证", priority: "medium" }], deliverables: ["MVP 版本"], milestone: "MVP 完成" },
      { name: "Launch", description: "测试、发布与复盘", weight: 1, tasks: [{ title: "Beta 测试", priority: "medium" }, { title: "发布公告", priority: "medium" }], deliverables: ["发布说明"], milestone: "正式上线" },
    ],
  },
  {
    id: "tpl_learning",
    name: "Learning Plan",
    description: "按模块推进的系统学习计划，含练习与输出。",
    category: "Learning",
    suggestedDays: 42,
    builtIn: true,
    phases: [
      { name: "Foundations", description: "基础概念", weight: 1, tasks: [{ title: "完成入门课程", priority: "high" }, { title: "整理概念卡片", priority: "low" }], deliverables: ["学习笔记"], milestone: null },
      { name: "Practice", description: "刻意练习", weight: 2, tasks: [{ title: "完成 3 个练习项目", priority: "high" }], deliverables: ["练习代码仓库"], milestone: "首个作品" },
      { name: "Output", description: "输出与分享", weight: 1, tasks: [{ title: "写一篇总结文章", priority: "medium" }], deliverables: ["总结文章"], milestone: "完成学习" },
    ],
  },
  {
    id: "tpl_goal",
    name: "Personal Goal",
    description: "把长期目标拆成可执行的阶段与习惯。",
    category: "Life",
    suggestedDays: 90,
    builtIn: true,
    phases: [
      { name: "Baseline", description: "记录现状", weight: 1, tasks: [{ title: "设定可衡量指标", priority: "high" }], deliverables: [], milestone: null },
      { name: "Build Habit", description: "建立节奏", weight: 2, tasks: [{ title: "连续执行 21 天", priority: "high" }], deliverables: [], milestone: "习惯形成" },
      { name: "Stretch", description: "突破目标", weight: 2, tasks: [{ title: "完成挑战目标", priority: "high" }], deliverables: ["复盘记录"], milestone: "目标达成" },
    ],
  },
  {
    id: "tpl_research",
    name: "Research Paper",
    description: "论文 / 研究报告的完整写作周期。",
    category: "Research",
    suggestedDays: 75,
    builtIn: true,
    phases: [
      { name: "Literature", description: "文献综述", weight: 1, tasks: [{ title: "阅读 20 篇核心文献", priority: "high" }], deliverables: ["文献矩阵"], milestone: null },
      { name: "Method", description: "方法与实验", weight: 2, tasks: [{ title: "设计实验", priority: "high" }, { title: "收集数据", priority: "high" }], deliverables: ["实验数据"], milestone: "实验完成" },
      { name: "Writing", description: "写作与修改", weight: 2, tasks: [{ title: "完成初稿", priority: "high" }, { title: "导师反馈修改", priority: "medium" }], deliverables: ["论文终稿"], milestone: "提交" },
    ],
  },
];
