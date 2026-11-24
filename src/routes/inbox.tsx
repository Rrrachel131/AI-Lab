import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowRight, Lightbulb, Link2, ListTodo, NotebookPen, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageContainer, PageHeader } from "@/components/common/Page";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addLinkAsset } from "@/lib/data/assets";
import { todayISO } from "@/lib/data/dates";
import { useStore } from "@/lib/data/store";
import type { InboxItem, InboxKind } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox · ai.lab" },
      { name: "description", content: "快速记录想法、任务与资料，再整理到项目中。" },
      { property: "og:title", content: "Inbox · ai.lab" },
      { property: "og:description", content: "先捕获，再整理。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InboxPage,
});

const KIND: Record<InboxKind, { label: string; Icon: typeof Lightbulb }> = {
  idea: { label: "想法", Icon: Lightbulb },
  task: { label: "任务", Icon: ListTodo },
  resource: { label: "资料", Icon: Link2 },
};

function InboxPage() {
  const inbox = useStore((s) => s.inbox);
  const add = useStore((s) => s.addInbox);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<InboxKind>("idea");
  const [showDone, setShowDone] = useState(false);
  const items = inbox.filter((i) => i.processed === showDone);

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader eyebrow="Daily · Capture" title={<>Inbox<span className="font-editorial italic text-caramel">, then focus.</span></>} description="先把脑中的事情放下来。之后一键转为任务、笔记或资产。" />
      <form
        className="surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          add(text.trim(), kind);
          setText("");
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={3}
          placeholder="记下任何东西…  ⌘ + Enter 保存"
          className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-1.5 border-t pt-3">
          {(Object.keys(KIND) as InboxKind[]).map((k) => {
            const { Icon, label } = KIND[k];
            return (
              <button type="button" key={k} onClick={() => setKind(k)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs", kind === k ? "border-ink bg-ink text-ink-foreground" : "text-muted-foreground")}>
                <Icon className="size-3" /> {label}
              </button>
            );
          })}
          <Button type="submit" variant="ember" size="sm" className="ml-auto" disabled={!text.trim()}>收集</Button>
        </div>
      </form>

      <div className="mt-8 flex items-center gap-2">
        <button onClick={() => setShowDone(false)} className={cn("h-8 rounded-full px-3 text-xs", !showDone ? "bg-ink text-ink-foreground" : "text-muted-foreground")}>待整理 · {inbox.filter((i) => !i.processed).length}</button>
        <button onClick={() => setShowDone(true)} className={cn("h-8 rounded-full px-3 text-xs", showDone ? "bg-ink text-ink-foreground" : "text-muted-foreground")}>已归档 · {inbox.filter((i) => i.processed).length}</button>
      </div>
      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((i) => <InboxRow key={i.id} item={i} />)}
        </AnimatePresence>
      </ul>
      {items.length === 0 && <EmptyState className="mt-4" title={showDone ? "没有归档内容" : "Inbox 清空了"} description={showDone ? undefined : "Inbox zero。去 Today 专注执行吧。"} />}
    </PageContainer>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const projects = useStore((s) => s.projects);
  const { updateInbox, deleteInbox, addTask, addNote } = useStore.getState();
  const { Icon, label } = KIND[item.kind];
  const done = (msg: string) => {
    updateInbox(item.id, { processed: true });
    toast.success(msg);
  };
  const isUrl = /^https?:\/\/\S+$/.test(item.text.trim());
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }} className="surface flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Icon className="size-3.5" /></span>
        <div className="min-w-0">
          <p className="whitespace-pre-wrap break-words text-sm">{item.text}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{label} · {item.createdAt.slice(0, 16).replace("T", " ")}</p>
        </div>
      </div>
      {!item.processed ? (
        <div className="flex flex-wrap gap-1.5">
          <Popover>
            <PopoverTrigger asChild><Button size="sm" variant="outline"><ArrowRight /> 转为任务</Button></PopoverTrigger>
            <PopoverContent className="w-60 p-1.5">
              <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { addTask({ title: item.text, plannedFor: todayISO() }); done("已转为今日任务"); }}>个人 · 加入今日</button>
              {projects.map((p) => (
                <button key={p.id} className="w-full truncate rounded-md px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { addTask({ title: item.text, projectId: p.id }); done(`已加入 ${p.name}`); }}>{p.name}</button>
              ))}
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="outline" onClick={() => { addNote({ title: item.text.slice(0, 40), body: item.text }); done("已转为笔记"); }}><NotebookPen /> 笔记</Button>
          {isUrl && <Button size="sm" variant="outline" onClick={() => { addLinkAsset(item.text.trim(), "", null); done("已保存为链接资产"); }}><Link2 /> 资产</Button>}
          <Button size="icon" variant="ghost" className="size-8" onClick={() => updateInbox(item.id, { processed: true })} aria-label="归档"><Archive /></Button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => updateInbox(item.id, { processed: false })}>恢复</Button>
          <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => deleteInbox(item.id)} aria-label="删除"><Trash2 /></Button>
        </div>
      )}
    </motion.li>
  );
}
