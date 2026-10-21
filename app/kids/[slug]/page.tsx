import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getKidsToolMetadata, KidsToolPageContent } from "@/components/kids-tool-page";
import { getKidsToolByPath, isKidsAppRouteTool, kidsToolDefinitions } from "@/lib/tools/kids-registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return kidsToolDefinitions.filter(isKidsAppRouteTool).map((tool) => ({ slug: tool.path }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getKidsToolByPath(slug);

  return tool ? getKidsToolMetadata(tool) : {};
}

export default async function KidsToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getKidsToolByPath(slug);

  if (!tool || !isKidsAppRouteTool(tool)) {
    notFound();
  }

  return <KidsToolPageContent definition={tool} />;
}
