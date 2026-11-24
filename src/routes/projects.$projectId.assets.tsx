import { createFileRoute } from "@tanstack/react-router";
import { AssetGallery } from "@/components/assets/AssetGallery";
import { useProjectData } from "@/lib/data/useProject";

export const Route = createFileRoute("/projects/$projectId/assets")({
  head: () => ({
    meta: [
      { title: "Project Assets · ai.lab" },
      { name: "description", content: "项目关联的文件、链接与交付资产。" },
      { property: "og:title", content: "Project Assets · ai.lab" },
      { property: "og:description", content: "项目资产。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectAssets,
});

function ProjectAssets() {
  const { projectId } = Route.useParams();
  const { assets } = useProjectData(projectId);
  return <AssetGallery assets={assets} projectId={projectId} />;
}
