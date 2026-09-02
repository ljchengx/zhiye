import type { Metadata } from "next";

import { ImageWatermarkWorkspace } from "@/components/image-watermark-workspace";
import { TimestampWorkspace } from "@/components/timestamp-workspace";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { ToolWorkspace } from "@/components/tool-workspace";
import type { ToolDefinition } from "@/lib/tools/registry";

export function getToolPath(tool: ToolDefinition): string {
  return `/${tool.path}`;
}

export function getToolMetadata(tool: ToolDefinition, canonicalPath = getToolPath(tool)): Metadata {
  return {
    title: tool.metadata.title,
    description: tool.metadata.description,
    keywords: [...tool.keywords, tool.title, "知页", "浏览器本地工具"],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: canonicalPath,
      siteName: "知页 ZHIYE",
      title: `${tool.metadata.title} | 知页`,
      description: tool.metadata.description,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.metadata.title} | 知页`,
      description: tool.metadata.description,
      images: ["/opengraph-image"],
    },
  };
}

export function ToolPageContent({ definition }: { definition: ToolDefinition }) {
  const seoContent = <ToolSeoContent definition={definition} />;

  if (definition.slug === "image-watermark") {
    return <ImageWatermarkWorkspace definition={definition} seoContent={seoContent} />;
  }

  if (definition.slug === "timestamp-converter") {
    return <TimestampWorkspace definition={definition} seoContent={seoContent} />;
  }

  return <ToolWorkspace definition={definition} seoContent={seoContent} />;
}
