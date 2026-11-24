import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AssetGallery } from "@/components/assets/AssetGallery";
import { PageContainer, PageHeader } from "@/components/common/Page";
import { formatBytes } from "@/lib/data/assets";
import { useStore } from "@/lib/data/store";

export const Route = createFileRoute("/assets")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Assets · ai.lab" },
      { name: "description", content: "全局数字资产中心：文件、图片、文档与链接，关联到项目与任务。" },
      { property: "og:title", content: "Assets · ai.lab" },
      { property: "og:description", content: "你的数字资产展馆。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const { id } = Route.useSearch();
  const assets = useStore((s) => s.assets);
  const total = assets.reduce((a, x) => a + x.size, 0);
  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Studio · ${assets.length} assets · ${formatBytes(total)}`}
        title={<>Asset<span className="font-editorial italic text-caramel"> gallery.</span></>}
        description="所有项目的成果与素材集中陈列。上传的文件保存在当前浏览器的本地存储中；接入云端后可跨设备同步。"
      />
      <AssetGallery key={id ?? "all"} assets={assets} projectId={null} initialOpenId={id ?? null} showProjectFilter />
    </PageContainer>
  );
}
