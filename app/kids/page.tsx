import type { Metadata } from "next";

import { KidsHomeExperience } from "@/components/kids-home-experience";
import { kidsToolDefinitions } from "@/lib/tools/kids-registry";

const title = "知页启蒙 - 把每天一点练习，变成看得见的进步";
const description = "知页启蒙为 4～7 岁孩子准备轻量、递进、方便打印的学习工具，从每天一张数学练习单开始。";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: ["知页启蒙", "幼小工具", "儿童学习工具", "幼小数学", "数学练习打印"],
  alternates: {
    canonical: "/kids",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/kids",
    siteName: "知页启蒙",
    title,
    description,
    images: [
      {
        url: "/kids/opengraph-image",
        width: 1200,
        height: 630,
        alt: "知页启蒙",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/kids/opengraph-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.yzfl.top/kids#website",
      url: "https://www.yzfl.top/kids",
      name: "知页启蒙",
      description,
      inLanguage: "zh-CN",
    },
    {
      "@type": "ItemList",
      "@id": "https://www.yzfl.top/kids#tools",
      name: "知页启蒙工具",
      numberOfItems: kidsToolDefinitions.length,
      itemListElement: kidsToolDefinitions.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.title,
        url: `https://www.yzfl.top${tool.href}`,
      })),
    },
  ],
};

export default function KidsHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <KidsHomeExperience />
    </>
  );
}
