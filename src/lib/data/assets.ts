import { fileStore, makeThumbnail, MAX_UPLOAD_BYTES } from "./file-store";
import { useStore } from "./store";
import type { Asset, AssetKind } from "./types";

export function kindFromMime(mime: string, name: string): AssetKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (/pdf|msword|officedocument|text\/plain|markdown|rtf|presentation|spreadsheet/.test(mime) || /\.(md|pdf|docx?|pptx?|xlsx?|txt|key|pages)$/i.test(name)) return "document";
  if (/json|javascript|typescript|x-python|html|css|xml/.test(mime) || /\.(tsx?|jsx?|py|json|css|html|ipynb|sql|sh|go|rs)$/i.test(name)) return "code";
  return "other";
}

/** Stores real files in this browser's IndexedDB. Returns the created assets; reports skipped files. */
export async function uploadFiles(files: FileList | File[], projectId: string | null): Promise<{ created: Asset[]; skipped: string[] }> {
  const created: Asset[] = [];
  const skipped: string[] = [];
  for (const file of Array.from(files)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      skipped.push(`${file.name}（超过 25MB）`);
      continue;
    }
    try {
      const blobKey = `blob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await fileStore.put(blobKey, file);
      const cover = await makeThumbnail(file);
      const asset = useStore.getState().addAsset({
        projectId,
        name: file.name,
        kind: kindFromMime(file.type, file.name),
        mime: file.type || "application/octet-stream",
        size: file.size,
        source: "upload",
        url: null,
        blobKey,
        cover,
        tags: [],
        description: "",
      });
      created.push(asset);
    } catch {
      skipped.push(`${file.name}（写入本地存储失败）`);
    }
  }
  return { created, skipped };
}

export function addLinkAsset(url: string, name: string, projectId: string | null) {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep raw */
  }
  return useStore.getState().addAsset({
    projectId,
    name: name || host,
    kind: "link",
    mime: "text/uri-list",
    size: 0,
    source: "link",
    url,
    blobKey: null,
    cover: null,
    tags: [],
    description: "",
  });
}

export function formatBytes(n: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
