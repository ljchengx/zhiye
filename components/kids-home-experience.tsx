import { ArrowDown, ArrowRight, Calculator, Check, Printer, TrendingUp } from "lucide-react";
import Link from "next/link";

import { getKidsToolHref, kidsToolDefinitions } from "@/lib/tools/kids-registry";

import { KidsShell } from "./kids-shell";
import styles from "./kids-home-experience.module.css";

const learningPrinciples = [
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

function toolGridClass(count: number) {
  if (count === 1) {
    return styles.toolGridSingle;
  }
  if (count === 2) {
    return styles.toolGridDouble;
  }
  return styles.toolGridMany;
}

export function KidsHomeExperience() {
  const firstTool = kidsToolDefinitions[0];

  return (
    <KidsShell>
      <div className={styles.page}>
        <section className={styles.hero} aria-labelledby="kids-home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>给孩子的每天一页</p>
            <h1 id="kids-home-title">知页启蒙</h1>
            <p className={styles.heroLead}>把每天一点练习，变成看得见的进步</p>
            <p className={styles.heroNote}>为 4～7 岁孩子准备的轻量学习工具，家长选择，孩子动手。</p>
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
          </div>

          {firstTool ? (
            <div className={styles.heroSheet}>
              <div className={styles.sheetFrame}>
                <img src={firstTool.previewImage} alt="幼小数学练习 A4 页面预览" loading="eager" />
              </div>
              <div className={styles.sheetCaption}>
                <span>第一张学习页</span>
                <strong>A4 数学练习</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className={styles.toolsSection} id="tools" aria-labelledby="kids-tools-title">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>启蒙工具</p>
              <h2 id="kids-tools-title">现在，就从一张练习单开始。</h2>
            </div>
            <span>{kidsToolDefinitions.length} 个可用工具</span>
          </header>

          <div className={`${styles.toolGrid} ${toolGridClass(kidsToolDefinitions.length)}`}>
            {kidsToolDefinitions
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((tool) => (
                <article className={styles.toolFeature} data-accent={tool.accent} key={tool.slug}>
                  <div className={styles.toolPreview}>
                    <img src={tool.previewImage} alt={`${tool.title}页面预览`} loading="lazy" />
                  </div>
                  <div className={styles.toolInfo}>
                    <div className={styles.toolMeta}>
                      <span>{tool.stage}</span>
                      <span>{tool.category}</span>
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

        <section className={styles.approach} id="approach" aria-labelledby="kids-approach-title">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>学习方式</p>
              <h2 id="kids-approach-title">把练习放进每天的节奏里。</h2>
            </div>
          </header>
          <div className={styles.principleGrid}>
            {learningPrinciples.map(({ title, detail, icon: Icon }) => (
              <article className={styles.principle} key={title}>
                <Icon aria-hidden="true" size={19} strokeWidth={1.7} />
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <strong>知页启蒙</strong>
          <span>当前有 {kidsToolDefinitions.length} 个工具</span>
          <small>本地生成 · 为每天的练习留一页</small>
        </footer>
      </div>
    </KidsShell>
  );
}
