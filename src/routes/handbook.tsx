import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/common/Page";
import { PLAN_EXAMPLE } from "@/lib/data/plan-import";

export const Route = createFileRoute("/handbook")({
  head: () => ({
    meta: [
      { title: "Handbook · ai.lab" },
      { name: "description", content: "ai.lab 使用手册：新手引导、场景指南与 JSON 计划格式。" },
      { property: "og:title", content: "Handbook · ai.lab" },
      { property: "og:description", content: "从想法到交付的使用指南。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Handbook,
});

const STEPS = [
  { n: "01", t: "写下想完成的事", d: "在 Inbox 或 Today 的 Capture 里快速记录。" },
  { n: "02", t: "设定目标与 DDL", d: "新建项目，填写目标、开始日期与截止日期。" },
  { n: "03", t: "创建或导入计划", d: "自定义阶段、使用模板，或粘贴 JSON 计划。" },
  { n: "04", t: "每日执行", d: "把任务「加入今日」，在 Today 勾选完成。" },
  { n: "05", t: "保存成果", d: "在任务弹窗中直接上传或关联资产。" },
  { n: "06", t: "完成交付", d: "在 Milestones 页点亮里程碑、标记交付成果。" },
];

function Handbook() {
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader eyebrow="Support · Handbook" title={<>From curiosity<span className="font-editorial italic text-caramel"> to delivery.</span></>} description="ai.lab 是一个通用的个人项目操作系统。以下是核心流程与快捷入口。" />
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="surface p-5">
            <div className="font-mono text-xs text-brand">{s.n}</div>
            <div className="mt-3 font-medium">{s.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>
      <section className="surface mt-8 p-6">
        <h2 className="font-display text-2xl">快捷键与入口</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><kbd className="rounded border px-1.5 font-mono text-xs">⌘ / Ctrl + K</kbd> 全局搜索与命令</li>
          <li>右下角 / 侧栏的 <span className="text-brand">+</span> 按钮：快速创建任务、项目、导入 JSON</li>
          <li><Link to="/projects" className="text-foreground underline underline-offset-4">Projects</Link> 的 Universe 视图中点击星体进入 Odyssey 星轨</li>
          <li><Link to="/settings" className="text-foreground underline underline-offset-4">Settings</Link> 可关闭特效、导出 / 导入全部数据</li>
        </ul>
      </section>
      <section className="surface mt-8 p-6">
        <h2 className="font-display text-2xl">JSON 计划格式</h2>
        <p className="mt-1 text-sm text-muted-foreground">必填：name、phases（至少一个，含 name）。任务可以是字符串或对象（title / priority / dueDate / status）。未填日期时按阶段平均分配。</p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs leading-5 text-ink-foreground">{PLAN_EXAMPLE}</pre>
      </section>
      <section className="surface mt-8 p-6">
        <h2 className="font-display text-2xl">数据模式</h2>
        <p className="mt-1 text-sm text-muted-foreground">当前为本地模式：所有数据与上传文件只保存在此浏览器中，清除浏览器数据会丢失。请定期在 Settings 导出备份。云端同步、登录与文件存储尚未接入。</p>
      </section>
    </PageContainer>
  );
}
