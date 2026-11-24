import { BookOpen, CalendarClock, FileCode2, FolderKanban, Inbox, LayoutGrid, LayoutTemplate, Library, NotebookPen, Settings, Sparkles, Sun, TerminalSquare } from "lucide-react";

export const NAV = [
  {
    group: "Daily",
    items: [
      { to: "/", label: "Today", hint: "今日工作台", Icon: Sun },
      { to: "/inbox", label: "Inbox", hint: "快速记录", Icon: Inbox },
      { to: "/upcoming", label: "Upcoming", hint: "DDL 与日历", Icon: CalendarClock },
    ],
  },
  {
    group: "Workspace",
    items: [
      { to: "/overview", label: "Overview", hint: "全局总览", Icon: LayoutGrid },
      { to: "/projects", label: "Projects", hint: "项目与宇宙", Icon: FolderKanban },
      { to: "/templates", label: "Templates", hint: "项目模板", Icon: LayoutTemplate },
    ],
  },
  {
    group: "Studio",
    items: [
      { to: "/assets", label: "Assets", hint: "数字资产", Icon: Library },
      { to: "/prompts", label: "Prompt Studio", hint: "提示词", Icon: Sparkles },
      { to: "/knowledge", label: "Knowledge", hint: "知识笔记", Icon: NotebookPen },
      { to: "/devlogs", label: "Dev Logs", hint: "研发日志", Icon: TerminalSquare },
    ],
  },
  {
    group: "Support",
    items: [
      { to: "/handbook", label: "Handbook", hint: "使用手册", Icon: BookOpen },
      { to: "/settings", label: "Settings", hint: "系统设置", Icon: Settings },
    ],
  },
] as const;

export type NavPath = (typeof NAV)[number]["items"][number]["to"];
export const FileIcon = FileCode2;
