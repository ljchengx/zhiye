import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PulseShell } from "@/components/pulse-shell";
import { ToolIcon } from "@/components/tool-icon";
import { toolDefinitions } from "@/lib/tools/registry";

const title = "免费在线工具工作台 - 文本、数据与图片";
const description = "选择 Base64 编解码、JSON 格式化、Markdown 清理、Unix 时间戳或图片水印工具，所有操作均在浏览器本地完成。";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/tools",
    siteName: "知页 ZHIYE",
    title: `${title} | 知页`,
    description,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | 知页`,
    description,
    images: ["/opengraph-image"],
  },
};

export default function ToolsPage() {
  return (
    <PulseShell activeNavigation="workbench">
      <section className="zhiye-workbench-index" aria-labelledby="workbench-title">
        <header className="zhiye-workbench-index__header">
          <p>知页 / 工作台</p>
          <h1 id="workbench-title">免费在线工具工作台</h1>
          <span>文本、数据和图片工具，均可在浏览器本地使用，内容不会上传。</span>
        </header>

        <div className="zhiye-workbench-index__grid">
          {toolDefinitions.map((tool, index) => (
            <article key={tool.slug} className={`zhiye-workbench-index__card zhiye-workbench-index__card--${tool.accent}`}>
              <Link href={`/${tool.path}`} aria-label={`打开${tool.title}`}>
                <span className="zhiye-workbench-index__number">0{index + 1}</span>
                <span className="zhiye-workbench-index__icon"><ToolIcon name={tool.icon} size={25} strokeWidth={1.45} /></span>
                <h2>{tool.title}</h2>
                <p>{tool.seo.summary}</p>
                <span className="zhiye-workbench-index__action">
                  打开工具
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PulseShell>
  );
}
