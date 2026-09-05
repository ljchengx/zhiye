import type { Metadata } from "next";

import { MathWorksheetWorkspace } from "@/components/math-worksheet-workspace";
import { PinyinWorksheetWorkspace } from "@/components/pinyin-worksheet-workspace";
import { ToolSeoContent } from "@/components/tool-seo-content";
import { kidsToolDefinitions, getKidsToolHref, type KidsToolDefinition } from "@/lib/tools/kids-registry";

export function getKidsToolMetadata(tool: KidsToolDefinition): Metadata {
  const canonicalPath = getKidsToolHref(tool);

  return {
    title: {
      absolute: `${tool.metadata.title} | 一程一成长`,
    },
    description: tool.metadata.description,
    keywords: [...tool.keywords, tool.title, "一程一成长", "幼小阶段"],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: canonicalPath,
      siteName: "一程一成长",
      title: `${tool.metadata.title} | 一程一成长`,
      description: tool.metadata.description,
      images: ["/kids/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.metadata.title} | 一程一成长`,
      description: tool.metadata.description,
      images: ["/kids/opengraph-image"],
    },
  };
}

export function KidsToolPageContent({ definition }: { definition: KidsToolDefinition }) {
  const seoContent = (
    <ToolSeoContent
      definition={definition}
      relatedTools={kidsToolDefinitions}
      pagePath={getKidsToolHref(definition)}
      productName="一程一成长"
      productPath="/kids"
      applicationCategory="EducationalApplication"
    />
  );

  if (definition.component === "math-worksheet") {
    return <MathWorksheetWorkspace definition={definition} seoContent={seoContent} />;
  }

  if (definition.component === "pinyin-worksheet") {
    return <PinyinWorksheetWorkspace definition={definition} seoContent={seoContent} />;
  }

  return null;
}
