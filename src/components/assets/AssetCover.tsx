import { FileAudio, FileCode2, FileText, FileVideo, Image as ImageIcon, Link2, File } from "lucide-react";
import type { Asset, AssetKind } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const KIND_META: Record<AssetKind, { label: string; Icon: typeof File }> = {
  image: { label: "Image", Icon: ImageIcon },
  document: { label: "Document", Icon: FileText },
  video: { label: "Video", Icon: FileVideo },
  audio: { label: "Audio", Icon: FileAudio },
  code: { label: "Code", Icon: FileCode2 },
  link: { label: "Link", Icon: Link2 },
  other: { label: "File", Icon: File },
};

/** Real thumbnail when one exists, otherwise a typographic cover derived from the asset. */
export function AssetCover({ asset, className }: { asset: Asset; className?: string }) {
  const { Icon, label } = KIND_META[asset.kind];
  if (asset.cover) {
    return <img src={asset.cover} alt={asset.name} className={cn("h-full w-full object-cover", className)} loading="lazy" />;
  }
  const ext = asset.source === "link" ? safeHost(asset.url) : (asset.name.split(".").pop() ?? "").slice(0, 5);
  return (
    <div className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden bg-paper-deep p-4", className)}>
      <div className="absolute -right-10 -top-10 size-36 rounded-full border border-ink/5" />
      <div className="absolute -right-4 -top-4 size-20 rounded-full border border-ink/5" />
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Icon className="size-4 text-caramel" />
      </div>
      <div className="font-display text-3xl uppercase leading-none tracking-tight text-ink/80">{ext || "file"}</div>
    </div>
  );
}

function safeHost(url: string | null) {
  if (!url) return "link";
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0] ?? "link";
  } catch {
    return "link";
  }
}
