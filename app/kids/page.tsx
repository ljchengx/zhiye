import type { Metadata } from "next";

import { KidsHomeExperience } from "@/components/kids-home-experience";
import { kidsToolDefinitions } from "@/lib/tools/kids-registry";

const title = "一程一成长 - 陪孩子走好成长的每一步";
const description = "一程一成长为 4—7 岁孩子准备轻量启蒙工具，把纸笔练习和动手探究变成孩子看得见、家长感受得到的成长。";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: ["一程一成长", "幼小工具", "儿童启蒙工具", "幼小数学", "数学练习打印", "幼小拼音", "拼音描红", "拼音练习纸", "四线三格"],
  alternates: {
    canonical: "/kids",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/kids",
    siteName: "一程一成长",
    title,
    description,
    images: [
      {
        url: "/kids/opengraph-image",
        width: 1200,
        height: 630,
        alt: "一程一成长",
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
      name: "一程一成长",
      description,
      inLanguage: "zh-CN",
    },
    {
      "@type": "ItemList",
      "@id": "https://www.yzfl.top/kids#tools",
      name: "一程一成长工具",
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
