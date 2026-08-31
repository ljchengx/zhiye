import type { Metadata } from "next";

import { HomeExperience } from "@/components/home-experience";
import { toolDefinitions } from "@/lib/tools/registry";

const title = "知页 - 免费在线文本、数据与数学练习工具";
const description = "知页提供在线 JSON 格式化、Base64 编解码、Markdown 清理、时间戳转换、图片水印和幼小数学练习工具。无需注册，数据直接在浏览器本地处理。";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: ["知页", "免费在线工具", "浏览器本地工具", "JSON 格式化", "JSON 美化", "在线 JSON 工具", "Base64 编解码", "Markdown 转纯文本", "时间戳转换", "图片水印", "幼小数学练习", "口算题生成"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "知页 ZHIYE",
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "知页浏览器本地工具箱",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.yzfl.top/#website",
      url: "https://www.yzfl.top/",
      name: "知页",
      alternateName: "ZHIYE",
      description,
      inLanguage: "zh-CN",
    },
    {
      "@type": "ItemList",
      "@id": "https://www.yzfl.top/#tools",
      name: "知页本地工具",
      numberOfItems: toolDefinitions.length,
      itemListElement: toolDefinitions.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.title,
        url: `https://www.yzfl.top/${tool.path}`,
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <HomeExperience />
    </>
  );
}
