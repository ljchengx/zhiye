import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getKidsToolMetadata, KidsToolPageContent } from "@/components/kids-tool-page";
import { getKidsToolByPath, kidsToolDefinitions } from "@/lib/tools/kids-registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return kidsToolDefinitions.map((tool) => ({ slug: tool.path }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getKidsToolByPath(slug);

  return tool ? getKidsToolMetadata(tool) : {};
}

export default async function KidsToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getKidsToolByPath(slug);

  if (!tool) {
    notFound();
  }

  return <KidsToolPageContent definition={tool} />;
}
