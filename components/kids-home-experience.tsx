import { ArrowDown, ArrowRight, Calculator, Check, Printer, TrendingUp } from "lucide-react";
import Link from "next/link";

import {
  getKidsToolHref,
  getKidsToolsByFormat,
  kidsToolDefinitions,
  type KidsToolDefinition,
  type KidsToolFormat,
} from "@/lib/tools/kids-registry";

import { KidsShell } from "./kids-shell";
import styles from "./kids-home-experience.module.css";

const experiencePrinciples = [
  {
    title: "每天一点",
    detail: "一张练习单，保持轻量节奏。",
    icon: Calculator,
  },
  {
    title: "难度递进",
    detail: "从会做的题，走到下一步。",
    icon: TrendingUp,
  },
  {
    title: "打印方便",
    detail: "A4 排版，拿到纸上就能写。",
    icon: Printer,
  },
  {
    title: "本地生成",
    detail: "内容在当前浏览器中完成。",
    icon: Check,
  },
] as const;

const heroSteps = [
  { marker: "01", label: "看见起点", accent: "green" },
  { marker: "02", label: "每天练习", accent: "coral" },
  { marker: "03", label: "留下变化", accent: "blue" },
] as const;

function toolGridClass(count: number) {
  if (count === 1) {
    return styles.toolGridSingle;
  }
  if (count === 2) {
    return styles.toolGridDouble;
  }
  return styles.toolGridMany;
}

const formatLabels: Record<KidsToolFormat, string> = {
  printable: "A4 打印",
  interactive: "在线互动",
  creative: "自由创作",
};

function ToolCollection({
  tools,
  sectionId,
  kicker,
  title,
  description,
}: {
  tools: readonly KidsToolDefinition[];
  sectionId: string;
  kicker: string;
  title: string;
  description: string;
}) {
  if (tools.length === 0) return null;
  return (
    <section className={styles.toolsSection} aria-labelledby={sectionId}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionKicker}>{kicker}</p>
          <h2 id={sectionId}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
        <span>{tools.length} 个{title}</span>
      </header>

      <div className={`${styles.toolGrid} ${toolGridClass(tools.length)}`}>
        {tools.map((tool) => (
          <article className={styles.toolFeature} data-accent={tool.accent} data-format={tool.format} key={tool.slug}>
            <div className={styles.toolPreview}>
              <img src={tool.previewImage} alt={`${tool.title}页面预览`} loading="lazy" />
            </div>
            <div className={styles.toolInfo}>
              <div className={styles.toolMeta}>
                <span>{tool.stage}</span>
                <span>约 {tool.estimatedMinutes} 分钟</span>
                <span>{formatLabels[tool.format]}</span>
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.summary}</p>
              <ul className={styles.skillList} aria-label={`${tool.title}练习内容`}>
                {tool.skillAreas.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
              <Link className={styles.toolAction} href={getKidsToolHref(tool)}>
                开始使用
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function KidsHomeExperience() {
  const firstTool = kidsToolDefinitions[0];
  const interactiveTools = getKidsToolsByFormat("interactive");
  const printableTools = getKidsToolsByFormat("printable");
  const creativeTools = getKidsToolsByFormat("creative");

  return (
    <KidsShell>
      <div className={styles.page}>
        <section className={styles.hero} aria-labelledby="kids-home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>给孩子的每天一步</p>
            <h1 id="kids-home-title">陪孩子走好成长的每一步</h1>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#tools">
                看看有哪些工具
                <ArrowDown aria-hidden="true" size={16} strokeWidth={1.8} />
              </a>
              {firstTool ? (
                <Link className={styles.secondaryAction} href={getKidsToolHref(firstTool)}>
                  开始数学练习
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                </Link>
              ) : null}
            </div>
            <div className={styles.heroPath} aria-label="每日成长路径">
              <div className={styles.heroPathHeader}>
                <span>每天的成长节奏</span>
                <strong>一小步，也算数</strong>
              </div>
              <div className={styles.heroPathSteps}>
                {heroSteps.map(({ marker, label, accent }) => (
                  <div className={styles.heroPathStep} data-accent={accent} key={marker}>
                    <span className={styles.heroPathMarker}>{marker}</span>
                    <strong>{label}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {firstTool ? (
            <div className={styles.heroSheet}>
              <div className={styles.sheetFrame}>
                <img src={firstTool.previewImage} alt="幼小数学练习 A4 页面预览" loading="eager" />
              </div>
              <div className={styles.sheetCaption}>
                <span>第一张练习页</span>
                <strong>A4 数学练习</strong>
              </div>
            </div>
          ) : null}
        </section>

        <div className={styles.toolGroups} id="tools">
          <ToolCollection
            tools={interactiveTools}
            sectionId="kids-interactive-tools-title"
            kicker="动手探索"
            title="互动探究"
            description="通过点击、拖动和观察，把抽象概念变成孩子可以直接操作的体验。"
          />
          <ToolCollection
            tools={printableTools}
            sectionId="kids-printable-tools-title"
            kicker="纸笔巩固"
            title="打印练习"
            description="按所选内容即时生成 A4 页面，适合家庭陪伴和纸笔练习，不记录使用状态。"
          />
          <ToolCollection
            tools={creativeTools}
            sectionId="kids-creative-tools-title"
            kicker="自由表达"
            title="自由创造"
            description="没有固定答案，在尝试和组合中留下属于孩子自己的作品。"
          />
        </div>

        <section className={styles.approach} id="approach" aria-labelledby="kids-approach-title">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>家长价值</p>
              <h2 id="kids-approach-title">不只看结果，更看见孩子正在发生的变化。</h2>
              <p className={styles.sectionDescription}>为 4—7 岁孩子准备的轻量启蒙工具。让每天一点练习和动手探究，变成孩子看得见、家长感受得到的成长。</p>
            </div>
          </header>
          <div className={styles.principleGrid}>
            {experiencePrinciples.map(({ title, detail, icon: Icon }) => (
              <article className={styles.principle} key={title}>
                <Icon aria-hidden="true" size={19} strokeWidth={1.7} />
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerMeta}>
            <strong>一程一成长</strong>
            <span>当前有 {kidsToolDefinitions.length} 个工具</span>
            <small>本地生成 · 为每天的练习留一页</small>
          </div>
          <div className={styles.wechat}>
            <div className={styles.wechatCopy}>
              <strong>关注公众号</strong>
              <span>扫码获取更多成长内容</span>
            </div>
            <img src="/kids/wechat-qrcode.jpg" alt="一程一成长微信公众号二维码" loading="lazy" />
          </div>
        </footer>
      </div>
    </KidsShell>
  );
}
