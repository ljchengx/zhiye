"use client";

import {
  CalendarDays,
  Calculator,
  Check,
  ClipboardList,
  Dices,
  Printer,
  RotateCcw,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { recordRecentTool } from "@/lib/recent-tools";
import {
  createWorksheetGuidance,
  generateDailyWorksheet,
  generateWorksheetPlan,
  MAX_WORKSHEET_QUESTIONS,
  MENTAL_METHOD_LABELS,
  WORKSHEET_PLAN_DAYS,
  WORKSHEET_THEME_DESCRIPTIONS,
  WORKSHEET_THEME_LABELS,
  type DailyWorksheet,
  type MentalQuestion,
  type WorksheetDayOverrides,
  type WorksheetGuidance,
  type WorksheetIconKey,
  type WorksheetPageSection,
  type WorksheetPlan,
  type WorksheetPrintPage,
  type WorksheetQuestion,
} from "@/lib/tools/math-worksheet";
import type { ToolDefinition } from "@/lib/tools/registry";

import styles from "./math-worksheet-workspace.module.css";
import { PulseShell } from "./pulse-shell";

type StatusTone = "idle" | "success" | "error";
type CountKey = "neighborCount" | "compareCount" | "mentalCount";

interface StatusMessage {
  tone: StatusTone;
  text: string;
}

interface MethodLesson {
  question: MentalQuestion;
  guidance: WorksheetGuidance;
}

const INITIAL_SEED = 20260831;

const WORKSHEET_CHARACTERS = [
  { name: "mario", src: "/math-worksheet/characters/mario.png" },
  { name: "luigi", src: "/math-worksheet/characters/luigi.png" },
  { name: "bowser-jr", src: "/math-worksheet/characters/bowser-jr.png" },
  { name: "boo", src: "/math-worksheet/characters/boo.png" },
] as const;

const OBJECT_SOURCES: Record<WorksheetIconKey, string> = {
  apple: "/math-worksheet/objects/apple.svg",
  pineapple: "/math-worksheet/objects/pineapple.svg",
  heart: "/math-worksheet/objects/heart.svg",
  star: "/math-worksheet/objects/star.svg",
  fish: "/math-worksheet/objects/fish.svg",
};

const ALL_OBJECT_ASSETS = [
  ...Object.values(OBJECT_SOURCES),
  "/math-worksheet/objects/ten-frame.svg",
  "/math-worksheet/objects/ten-rod.svg",
  "/math-worksheet/objects/one-stick.svg",
] as const;

const countFields: readonly { key: CountKey; label: string; inputLabel: string }[] = [
  { key: "neighborCount", label: "相邻数", inputLabel: "相邻数题数" },
  { key: "compareCount", label: "比大小", inputLabel: "比大小题数" },
  { key: "mentalCount", label: "口算", inputLabel: "口算题数" },
];

function getWorksheetCharacter(day: number) {
  return WORKSHEET_CHARACTERS[(Math.max(1, day) - 1) % WORKSHEET_CHARACTERS.length];
}

function getSectionCount(worksheet: DailyWorksheet, type: "neighbor" | "compare" | "mental"): number {
  return worksheet.sections.find((section) => section.type === type)?.questions.length ?? 0;
}

function getWorksheetOverrides(worksheet: DailyWorksheet): WorksheetDayOverrides {
  return {
    neighborCount: getSectionCount(worksheet, "neighbor"),
    compareCount: getSectionCount(worksheet, "compare"),
    mentalCount: getSectionCount(worksheet, "mental"),
    theme: worksheet.theme,
  };
}

function getMethodLesson(worksheet: DailyWorksheet): MethodLesson | undefined {
  const mentalQuestions = worksheet.sections
    .find((section) => section.type === "mental")?.questions
    .filter((question): question is MentalQuestion => question.type === "mental" && question.third === undefined) ?? [];

  for (const question of mentalQuestions) {
    const guidance = createWorksheetGuidance(question, "apple");
    if (guidance) {
      return { question, guidance };
    }
  }

  return undefined;
}

function ObjectSprite({ asset }: { asset: WorksheetIconKey }) {
  return <img className={styles.objectSprite} src={OBJECT_SOURCES[asset]} alt="" draggable="false" />;
}

function CountGroup({ count, icon, compact = false }: { count: number; icon: WorksheetIconKey; compact?: boolean }) {
  const safeCount = Math.max(0, Math.trunc(count));

  if (safeCount <= 10) {
    return (
      <span className={styles.countGroup} data-compact={compact || undefined} aria-label={safeCount + " 个"}>
        {Array.from({ length: safeCount }, (_, index) => <ObjectSprite asset={icon} key={index} />)}
      </span>
    );
  }

  const tens = Math.floor(safeCount / 10);
  const ones = safeCount % 10;

  return (
    <span className={styles.placeValueGroup} data-compact={compact || undefined} aria-label={tens + " 个十和 " + ones + " 个一"}>
      <span className={styles.placeValueObjects} aria-hidden="true">
        <span className={styles.placeValueTens}>
          {Array.from({ length: tens }, (_, index) => (
            <img src="/math-worksheet/objects/ten-rod.svg" alt="" key={"ten-" + index} />
          ))}
        </span>
        <span className={styles.placeValueOnes}>
          {Array.from({ length: ones }, (_, index) => (
            <img src="/math-worksheet/objects/one-stick.svg" alt="" key={"one-" + index} />
          ))}
        </span>
      </span>
    </span>
  );
}

function AnswerLine({ symbol = false }: { symbol?: boolean }) {
  return <span className={symbol ? styles.symbolBox : styles.answerLine} aria-hidden="true" />;
}

function MethodExample({ lesson }: { lesson: MethodLesson }) {
  const { question, guidance } = lesson;

  return (
    <section className={styles.methodExample} data-testid="worksheet-demo">
      <header className={styles.methodTitle}>
        <strong>{MENTAL_METHOD_LABELS[question.method]}</strong>
        <span>{question.left} {question.operator} {question.right} = {question.answer}</span>
      </header>
      <div className={styles.methodVisual} aria-hidden="true">
        <CountGroup count={question.left} icon={guidance.icon} compact />
        <b>{question.operator}</b>
        <CountGroup count={question.right} icon={guidance.icon} compact />
      </div>
      <div className={styles.methodSplit}>
        <span>拆</span>
        <strong>{guidance.splitSource} = {guidance.split[0]} + {guidance.split[1]}</strong>
      </div>
      <div className={styles.methodSteps}>
        {guidance.steps.map((step, index) => (
          <span key={index}>
            <em>{index === 0 ? "先" : "再"}</em>
            <strong>{step.left} {step.operator} {step.right} = {step.answer}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}

function GuidedQuestion({ question }: { question: MentalQuestion }) {
  const guidance = question.guidance;
  if (!guidance) {
    return null;
  }

  return (
    <div className={styles.guidedQuestion} data-testid="math-worksheet-question" data-display="guided">
      <div className={styles.guidedTopline}>
        <span>{question.number}.</span>
        <strong>{MENTAL_METHOD_LABELS[question.method]}</strong>
      </div>
      <div className={styles.guidedVisual} aria-hidden="true">
        <CountGroup count={question.left} icon={guidance.icon} compact />
        <b>{question.operator}</b>
        <CountGroup count={question.right} icon={guidance.icon} compact />
      </div>
      <div className={styles.guidedEquation}>
        <strong>{question.left} {question.operator} {question.right} =</strong>
        <AnswerLine symbol />
      </div>
      <div className={styles.guidedSplit}>
        <em>拆</em><b>{guidance.splitSource}</b><i>=</i><AnswerLine symbol /><i>+</i><AnswerLine symbol />
      </div>
      <div className={styles.guidedSteps}>
        {guidance.steps.map((step, index) => (
          <span key={index}>
            <em>{index === 0 ? "先" : "再"}</em>
            <b>{step.left}</b><i>{step.operator}</i><AnswerLine symbol /><i>=</i><AnswerLine symbol />
          </span>
        ))}
      </div>
    </div>
  );
}

function NeighborQuestionView({ question }: { question: WorksheetQuestion }) {
  if (question.type !== "neighbor") {
    return null;
  }

  return (
    <div className={styles.senseQuestion} data-testid="math-worksheet-question" data-type="neighbor">
      <span className={styles.questionNumber}>{question.number}.</span>
      <strong>{question.left}</strong>
      <AnswerLine />
      <strong>{question.right}</strong>
    </div>
  );
}

function CompareQuestionView({ question }: { question: WorksheetQuestion }) {
  if (question.type !== "compare") {
    return null;
  }

  return (
    <div className={styles.senseQuestion} data-testid="math-worksheet-question" data-type="compare">
      <span className={styles.questionNumber}>{question.number}.</span>
      <strong>{question.left}</strong>
      <AnswerLine symbol />
      <strong>{question.right}</strong>
    </div>
  );
}

function NumberSenseSection({ section }: { section: WorksheetPageSection }) {
  const neighbors = section.questions.filter((question) => question.type === "neighbor");
  const compares = section.questions.filter((question) => question.type === "compare");

  return (
    <section className={styles.numberSenseSection} data-columns={section.columns} data-testid="worksheet-number-sense">
      <div className={styles.senseColumn}>
        <h3>相邻数</h3>
        <div className={styles.senseGrid}>
          {neighbors.map((question) => <NeighborQuestionView question={question} key={question.id} />)}
        </div>
      </div>
      <div className={styles.senseColumn}>
        <h3>比大小</h3>
        <div className={styles.senseGrid}>
          {compares.map((question) => <CompareQuestionView question={question} key={question.id} />)}
        </div>
      </div>
    </section>
  );
}

function MentalQuestionView({ question }: { question: WorksheetQuestion }) {
  if (question.type !== "mental") {
    return null;
  }

  return (
    <div
      className={styles.mentalQuestion}
      data-testid="math-worksheet-question"
      data-type="mental"
      data-level={question.level}
    >
      <span className={styles.questionNumber}>{question.number}.</span>
      <span className={styles.expression}>
        {question.left} {question.operator} {question.right}
        {question.third === undefined ? "" : " " + question.secondOperator + " " + question.third} =
      </span>
      <AnswerLine />
    </div>
  );
}

function WorksheetPageSectionView({ section }: { section: WorksheetPageSection }) {
  if (section.type === "guided") {
    return (
      <section className={styles.guidedSection} data-testid="worksheet-guided-section">
        <h3>{section.title}</h3>
        <div className={styles.guidedGrid}>
          {section.questions.map((question) => question.type === "mental"
            ? <GuidedQuestion question={question} key={question.id} />
            : null)}
        </div>
      </section>
    );
  }

  if (section.type === "number-sense") {
    return <NumberSenseSection section={section} />;
  }

  return (
    <section className={styles.mentalSection} data-columns={section.columns} data-testid="worksheet-mental-section">
      {section.title ? <h3>{section.title}</h3> : null}
      <div className={styles.mentalGrid}>
        {section.questions.map((question) => <MentalQuestionView question={question} key={question.id} />)}
      </div>
    </section>
  );
}

function WorksheetPaper({ worksheet, page, printCopy = false }: {
  worksheet: DailyWorksheet;
  page: WorksheetPrintPage;
  printCopy?: boolean;
}) {
  const character = getWorksheetCharacter(worksheet.day);
  const lesson = page.showMethod ? getMethodLesson(worksheet) : undefined;

  return (
    <article
      className={styles.paper}
      data-testid={printCopy ? undefined : "math-worksheet-paper"}
      data-day={worksheet.day}
      data-page={page.pageNumber}
      data-page-count={page.pageCount}
      data-used-height={page.usedHeightMm}
      data-print-copy={printCopy || undefined}
      aria-label={`第 ${worksheet.day} 天数学练习第 ${page.pageNumber} 页`}
    >
      <header className={styles.paperHeader}>
        <div className={styles.paperTitle}>
          <strong>第 {worksheet.day} 天</strong>
          <h2>数学练习</h2>
        </div>
        <img className={styles.character} src={character.src} alt="" data-character={character.name} draggable="false" />
        <div className={styles.dateField}>日期 <span aria-hidden="true" /></div>
      </header>

      <div className={styles.paperBody} data-testid={printCopy ? undefined : "worksheet-paper-body"}>
        {lesson ? <MethodExample lesson={lesson} /> : null}
        {page.sections.map((section, index) => (
          <WorksheetPageSectionView section={section} key={`${section.type}-${index}`} />
        ))}
      </div>

      <footer className={styles.paperFooter} data-testid={printCopy ? undefined : "worksheet-paper-footer"}>
        <span>第 {worksheet.day} / {WORKSHEET_PLAN_DAYS} 天</span>
        <span>第 {page.pageNumber} / {page.pageCount} 页 · 本页 {page.questionCount} 题</span>
      </footer>
    </article>
  );
}

function MathWorksheetWorkspaceContent({ definition }: { definition: ToolDefinition }) {
  const seedRef = useRef(INITIAL_SEED);
  const [selectedDay, setSelectedDay] = useState(1);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [plan, setPlan] = useState<WorksheetPlan>(() => generateWorksheetPlan(INITIAL_SEED));
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", text: "30 天连续作业已准备好" });
  const selectedWorksheet = plan.days[selectedDay - 1] ?? plan.days[0];
  const selectedPage = selectedWorksheet?.pages[previewPageIndex] ?? selectedWorksheet?.pages[0];
  const selectedTotal = selectedWorksheet?.total ?? 0;
  const totalPages = plan.days.reduce((sum, worksheet) => sum + worksheet.pages.length, 0);
  const selectedCounts = selectedWorksheet ? {
    neighborCount: getSectionCount(selectedWorksheet, "neighbor"),
    compareCount: getSectionCount(selectedWorksheet, "compare"),
    mentalCount: getSectionCount(selectedWorksheet, "mental"),
  } : { neighborCount: 0, compareCount: 0, mentalCount: 0 };

  useEffect(() => {
    recordRecentTool(definition.slug);
  }, [definition.slug]);

  const nextSeed = () => {
    seedRef.current += 7919;
    return seedRef.current;
  };

  const replaceSelectedDay = (nextWorksheet: DailyWorksheet) => {
    setPlan((previous) => {
      const current = previous.days[selectedDay - 1];
      const days = previous.days.map((day) => day.day === nextWorksheet.day ? nextWorksheet : day);
      return {
        ...previous,
        days,
        totalQuestions: previous.totalQuestions - (current?.total ?? 0) + nextWorksheet.total,
      };
    });
    setPreviewPageIndex(0);
  };

  const rebuildSelectedDay = (overrides: WorksheetDayOverrides, text: string) => {
    replaceSelectedDay(generateDailyWorksheet(selectedDay, nextSeed(), overrides));
    setStatus({ tone: "success", text });
  };

  const updateCount = (key: CountKey, value: number) => {
    const safeValue = Number.isFinite(value)
      ? Math.max(0, Math.min(MAX_WORKSHEET_QUESTIONS, Math.trunc(value)))
      : 0;
    const otherTotal = selectedTotal - selectedCounts[key];
    const nextCounts = {
      ...selectedCounts,
      [key]: Math.min(safeValue, MAX_WORKSHEET_QUESTIONS - otherTotal),
    };
    rebuildSelectedDay(
      { ...getWorksheetOverrides(selectedWorksheet), ...nextCounts },
      `第 ${selectedDay} 天题目数量已更新`,
    );
  };

  const regenerateDay = () => {
    if (selectedTotal === 0) {
      setStatus({ tone: "error", text: "请至少保留 1 道题" });
      return;
    }
    rebuildSelectedDay(getWorksheetOverrides(selectedWorksheet), `第 ${selectedDay} 天已重新出题`);
  };

  const regeneratePlan = () => {
    setPlan(generateWorksheetPlan(nextSeed()));
    setPreviewPageIndex(0);
    setStatus({ tone: "success", text: "30 天计划已重新生成" });
  };

  const selectDay = (day: number) => {
    setSelectedDay(day);
    setPreviewPageIndex(0);
    setStatus({ tone: "idle", text: `正在查看第 ${day} 天` });
  };

  const reset = () => {
    seedRef.current = INITIAL_SEED;
    setSelectedDay(1);
    setPreviewPageIndex(0);
    setPlan(generateWorksheetPlan(INITIAL_SEED));
    setStatus({ tone: "success", text: "已恢复默认 30 天计划" });
  };

  const printPlan = () => {
    setStatus({ tone: "success", text: `已打开打印窗口，共 ${totalPages} 页` });
    window.print();
  };

  if (!selectedWorksheet || !selectedPage) {
    return null;
  }

  return (
    <section
      className={`pulse-workbench ${styles.workbench}`}
      aria-labelledby="tool-title"
    >
      <header className="pulse-workbench__header">
        <div>
          <div className="pulse-workbench__meta" aria-hidden="true">
            <span>知页 / 工具</span><i /><span>{definition.category}</span>
          </div>
          <h1 id="tool-title">{definition.seo.h1}</h1>
          <p>{definition.description}</p>
        </div>
      </header>

      <section className={styles.layout} aria-label="30 天数学练习生成工作区">
        <aside className={styles.settings} aria-label="30 天练习设置">
          <header className={styles.settingsHeader}>
            <div><span>30 天连续作业</span><h2>第 {selectedDay} 天</h2></div>
            <strong>{selectedTotal}<small>/ {MAX_WORKSHEET_QUESTIONS} 题</small></strong>
          </header>

          <div className={styles.overview}>
            <span><b>{plan.totalDays}</b> 天</span>
            <span><b>{plan.totalQuestions}</b> 题</span>
            <span><b>{totalPages}</b> 页</span>
          </div>

          <nav className={styles.dayNav} aria-label="30 天学习计划">
            <header><CalendarDays aria-hidden="true" size={16} /><span>选择日期</span></header>
            <div className={styles.dayGrid}>
              {plan.days.map((day) => (
                <button
                  type="button"
                  className={day.day === selectedDay ? styles.currentDay : ""}
                  aria-label={`第 ${day.day} 天：${day.title}`}
                  aria-pressed={day.day === selectedDay}
                  onClick={() => selectDay(day.day)}
                  data-testid={`worksheet-day-${day.day}`}
                  key={day.day}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </nav>

          <section className={styles.settingGroup} aria-labelledby="worksheet-count-title">
            <div className={styles.settingLabel}>
              <span id="worksheet-count-title">当天题量</span><small>总量上限 30 题</small>
            </div>
            <div className={styles.counts}>
              {countFields.map((field) => (
                <label key={field.key}>
                  <span>{field.label}</span>
                  <input
                    type="number"
                    min="0"
                    max={MAX_WORKSHEET_QUESTIONS - selectedTotal + selectedCounts[field.key]}
                    inputMode="numeric"
                    aria-label={field.inputLabel}
                    value={selectedCounts[field.key]}
                    onChange={(event) => updateCount(field.key, event.currentTarget.valueAsNumber)}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className={styles.settingGroup}>
            <div className={styles.settingLabel}><span>本日主题</span><small>按计划安排</small></div>
            <div className={styles.theme} data-testid="worksheet-theme">
              <strong>{WORKSHEET_THEME_LABELS[selectedWorksheet.theme]}</strong>
              <span>{WORKSHEET_THEME_DESCRIPTIONS[selectedWorksheet.theme]}</span>
            </div>
          </section>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryButton} onClick={regeneratePlan}><Dices size={17} />重新生成计划</button>
            <button type="button" className={styles.printButton} onClick={printPlan}><Printer size={17} />导出 30 天 PDF</button>
            <button type="button" onClick={regenerateDay}><ClipboardList size={16} />本日换一套</button>
            <button type="button" onClick={reset}><RotateCcw size={16} />恢复默认</button>
          </div>

          <div className={styles.status} data-tone={status.tone} role="status" aria-live="polite">
            {status.tone === "success" ? <Check size={15} /> : null}
            {status.tone === "error" ? <TriangleAlert size={15} /> : null}
            <span>{status.text}</span>
          </div>
          <p className={styles.local}><ShieldCheck size={15} />题目在浏览器本地生成</p>
          <p className={styles.printSummary} data-testid="worksheet-print-summary">30 天 / {totalPages} 页，可按需双面打印</p>
        </aside>

        <section className={styles.preview} aria-label="当天 A4 版面预览">
          <header className={styles.previewToolbar}>
            <div><Calculator size={17} /><span>第 {selectedDay} 天 · A4 预览</span></div>
            {selectedWorksheet.pages.length > 1 ? (
              <div className={styles.pageTabs} role="tablist" aria-label="选择预览页">
                {selectedWorksheet.pages.map((page, index) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewPageIndex === index}
                    className={previewPageIndex === index ? styles.currentTab : ""}
                    onClick={() => setPreviewPageIndex(index)}
                    key={page.pageNumber}
                  >
                    第 {page.pageNumber} 页
                  </button>
                ))}
              </div>
            ) : <span className={styles.singlePage}>共 1 页</span>}
          </header>
          <div className={styles.daySummary} data-testid="worksheet-day-summary">
            <span><Target size={14} />今日目标</span>
            <strong>{selectedWorksheet.title}</strong>
            <p>{selectedWorksheet.objective}</p>
          </div>
          <div className={styles.previewCanvas}>
            <WorksheetPaper worksheet={selectedWorksheet} page={selectedPage} />
          </div>
        </section>
      </section>

      <div className={styles.printPack} data-testid="worksheet-print-pack" aria-label="30 天打印内容">
        {plan.days.flatMap((day) => day.pages.map((page) => (
          <WorksheetPaper worksheet={day} page={page} printCopy key={`${day.day}-${page.pageNumber}`} />
        )))}
      </div>
      <div className={styles.assetPreload} aria-hidden="true">
        {ALL_OBJECT_ASSETS.map((src) => <img src={src} alt="" key={src} />)}
      </div>
    </section>
  );
}

export function MathWorksheetWorkspace({ definition, seoContent }: { definition: ToolDefinition; seoContent?: ReactNode }) {
  return (
    <PulseShell activeNavigation="workbench" activeTool={definition.slug}>
      <MathWorksheetWorkspaceContent definition={definition} />
      {seoContent}
    </PulseShell>
  );
}
