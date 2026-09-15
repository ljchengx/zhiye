"use client";

import {
  ArrowRight,
  Calculator,
  CalendarDays,
  Check,
  ClipboardList,
  Dices,
  Files,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  ShieldCheck,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import {
  getMathBulkPdfFilename,
  getMathWorkbookPrintPageCount,
  type MathPdfGenerateRequest,
  type MathPdfWorkerResponse,
} from "@/lib/tools/math-pdf";
import { MATH_WORKSHEET_CHARACTER_ASSETS } from "@/lib/tools/math-picture-assets";

import {
  createWorksheetGuidance,
  DEFAULT_MONTH_TWO_CONFIG,
  DEFAULT_REINFORCEMENT_CONFIG,
  FOUNDATION_WORKSHEET_DAYS,
  generateDailyWorksheet,
  getExportDays,
  getMonthTwoQuestionCounts,
  getReinforcementQuestionCounts,
  MAX_APPLICATION_RATIO,
  MAX_WORKSHEET_QUESTIONS,
  MENTAL_METHOD_LABELS,
  MONTH_ONE_DAYS,
  MONTH_TWO_DAYS,
  normalizeMonthTwoConfig,
  normalizeReinforcementConfig,
  REINFORCEMENT_WORKSHEET_DAYS,
  WORKSHEET_PLAN_DAYS,
  type ApplicationQuestion,
  type DailyWorksheet,
  type GroupingQuestion,
  type LifeMathQuestion,
  type MentalQuestion,
  type MissingNumberQuestion,
  type NumberBondQuestion,
  type PictureEquationQuestion,
  type ReinforcementConfig,
  type WorksheetIconKey,
  type WorksheetExportRange,
  type WorksheetPageSection,
  type WorksheetPlan,
  type WorksheetPrintPage,
  type WorksheetQuestion,
  type VerticalCalculationQuestion,
} from "@/lib/tools/math-worksheet";
import type { KidsToolDefinition } from "@/lib/tools/kids-registry";
import type { MathWorksheetPlanGenerateRequest, MathWorksheetPlanWorkerResponse } from "../workers/math-worksheet.worker";

import { KidsShell } from "./kids-shell";
import styles from "./math-worksheet-workspace.module.css";

type StatusTone = "idle" | "success" | "error";
type RatioKey = "neighborRatio" | "compareRatio" | "applicationRatio";

interface StatusMessage {
  tone: StatusTone;
  text: string;
}

const INITIAL_SEED = 20260831;

const WORKSHEET_CHARACTERS = MATH_WORKSHEET_CHARACTER_ASSETS;

const OBJECT_SOURCES: Record<WorksheetIconKey, string> = {
  apple: "/math-worksheet/objects/apple.svg",
  pineapple: "/math-worksheet/objects/pineapple.svg",
  heart: "/math-worksheet/objects/heart.svg",
  star: "/math-worksheet/objects/star.svg",
  fish: "/math-worksheet/objects/fish.svg",
  mushroom: "/math-worksheet/objects/mushroom.svg",
  coin: "/math-worksheet/objects/coin.svg",
  flower: "/math-worksheet/objects/flower.svg",
  block: "/math-worksheet/objects/block.svg",
  ball: "/math-worksheet/objects/ball.svg",
  book: "/math-worksheet/objects/book.svg",
  cookie: "/math-worksheet/objects/cookie.svg",
  balloon: "/math-worksheet/objects/balloon.svg",
};

const ALL_OBJECT_ASSETS = [
  ...Object.values(OBJECT_SOURCES),
  "/math-worksheet/objects/ten-frame.svg",
  "/math-worksheet/objects/ten-rod.svg",
  "/math-worksheet/objects/one-stick.svg",
] as const;

const RATIO_FIELDS: readonly { key: RatioKey; label: string; inputLabel: string }[] = [
  { key: "neighborRatio", label: "相邻数", inputLabel: "相邻数占比" },
  { key: "compareRatio", label: "比大小", inputLabel: "比大小占比" },
  { key: "applicationRatio", label: "应用题", inputLabel: "应用题占比" },
];

function getWorksheetCharacter(day: number) {
  return WORKSHEET_CHARACTERS[(Math.max(1, day) - 1) % WORKSHEET_CHARACTERS.length];
}

function getSectionQuestions(worksheet: DailyWorksheet, type: WorksheetQuestion["section"]): readonly WorksheetQuestion[] {
  return worksheet.sections.find((section) => section.type === type)?.questions ?? [];
}

function ObjectSprite({ asset, className }: { asset: WorksheetIconKey; className?: string }) {
  return <img className={className ?? styles.objectSprite} src={OBJECT_SOURCES[asset]} alt="" draggable="false" />;
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

function CountGroup({ count, icon, compact = false, role }: { count: number; icon: WorksheetIconKey; compact?: boolean; role?: string }) {
  const safeCount = Math.max(0, Math.trunc(count));
  if (safeCount <= 10) {
    return (
      <span className={`${styles.countGroup} ${compact ? styles.compactCountGroup : ""}`} aria-label={`${safeCount} 个`} data-count={safeCount} data-count-role={role}>
        {Array.from({ length: safeCount }, (_, index) => <ObjectSprite asset={icon} key={index} />)}
      </span>
    );
  }
  const tens = Math.floor(safeCount / 10);
  const ones = safeCount % 10;
  return (
    <span className={`${styles.placeValueGroup} ${compact ? styles.compactCountGroup : ""}`} aria-label={`${tens} 个十和 ${ones} 个一`} data-count={safeCount} data-count-role={role}>
      <span className={styles.placeValueObjects} aria-hidden="true">
        <span className={styles.placeValueTens}>{Array.from({ length: tens }, (_, index) => <img src="/math-worksheet/objects/ten-rod.svg" alt="" key={`ten-${index}`} />)}</span>
        <span className={styles.placeValueOnes}>{Array.from({ length: ones }, (_, index) => <img src="/math-worksheet/objects/one-stick.svg" alt="" key={`one-${index}`} />)}</span>
      </span>
    </span>
  );
}

function AnswerLine({ symbol = false, wide = false }: { symbol?: boolean; wide?: boolean }) {
  return <span className={`${symbol ? styles.symbolBox : styles.answerLine} ${wide ? styles.wideAnswerLine : ""}`} aria-hidden="true" />;
}

function MethodExample({ worksheet }: { worksheet: DailyWorksheet }) {
  const lesson = worksheet.methodLesson;
  if (!lesson) return null;
  if (lesson.method === "number-bond" || lesson.method === "picture-equation") {
    return (
      <section className={styles.methodExample} data-testid="worksheet-demo" data-method={lesson.method} data-original-left={lesson.original.left} data-original-operator={lesson.original.operator} data-original-right={lesson.original.right} data-original-answer={lesson.original.answer}>
        <div className={styles.methodHeading}>
          <span>今天学</span>
          <strong>{lesson.title}</strong>
        </div>
        <div className={styles.methodSimpleFlow}>
          <CountGroup count={lesson.original.left} icon={lesson.icon} compact role="left-operand" />
          <b>{lesson.original.operator}</b>
          <CountGroup count={lesson.original.right} icon={lesson.icon} compact role="right-operand" />
          <b>=</b>
          <strong>{lesson.original.answer}</strong>
          <span>{lesson.method === "number-bond" ? `${lesson.splitSource} 分成 ${lesson.split[0]} 和 ${lesson.split[1]}` : "看图写出算式"}</span>
        </div>
      </section>
    );
  }
  return (
    <section className={styles.methodExample} data-testid="worksheet-demo" data-method={lesson.method} data-original-left={lesson.original.left} data-original-operator={lesson.original.operator} data-original-right={lesson.original.right} data-original-answer={lesson.original.answer} data-split-source={lesson.splitSource} data-split-parts={lesson.split.join(",")}>
      <div className={styles.methodHeading}>
        <span>今天学</span>
        <strong>{lesson.title}</strong>
      </div>
      <div className={styles.methodFlow}>
        <div className={styles.methodGroup}>
          <CountGroup count={lesson.original.left} icon={lesson.icon} compact role="left-operand" />
          <b>{lesson.original.operator}</b>
          <CountGroup count={lesson.original.right} icon={lesson.icon} compact role="right-operand" />
        </div>
        <ArrowRight aria-hidden="true" size={16} />
        <div className={styles.methodSplitText}>拆 {lesson.splitSource}<br /><strong>= {lesson.split[0]} + {lesson.split[1]}</strong></div>
        <ArrowRight aria-hidden="true" size={16} />
        <div className={styles.methodSteps}>
          {lesson.steps.map((step, index) => <span key={index}><em>{index === 0 ? "先" : "再"}</em>{step.left} {step.operator} {step.right} = {step.answer}</span>)}
        </div>
      </div>
    </section>
  );
}

function GuidedQuestion({ question }: { question: MentalQuestion }) {
  const guidance = question.guidance ?? createWorksheetGuidance(question, "apple");
  if (!guidance) return null;
  return (
    <div className={styles.guidedQuestion} data-testid="math-worksheet-question" data-display="guided" data-type="mental" data-method={question.method} data-original-left={question.left} data-original-operator={question.operator} data-original-right={question.right} data-original-answer={question.answer} data-split-source={guidance.splitSource} data-split-parts={guidance.split.join(",")}>
      <div className={styles.guidedTopline}><span>{question.number}.</span><strong>{MENTAL_METHOD_LABELS[question.method]}</strong></div>
      <div className={styles.guidedVisual} aria-hidden="true"><CountGroup count={question.left} icon={guidance.icon} compact role="left-operand" /><b>{question.operator}</b><CountGroup count={question.right} icon={guidance.icon} compact role="right-operand" /></div>
      <div className={styles.guidedEquation}><strong>{question.left} {question.operator} {question.right} =</strong><AnswerLine /></div>
      <div className={styles.guidedSplit}><span>{guidance.splitSource} = {guidance.split[0]} + {guidance.split[1]}</span></div>
      <div className={styles.guidedSteps}>{guidance.steps.map((step, index) => <span key={index}>{step.left} {step.operator} {step.right} = {step.answer}</span>)}</div>
    </div>
  );
}

function NeighborQuestionView({ question }: { question: WorksheetQuestion }) {
  if (question.type !== "neighbor") return null;
  return <div className={styles.senseQuestion} data-testid="math-worksheet-question" data-type="neighbor"><span className={styles.questionNumber}>{question.number}.</span><strong>{question.left}</strong><AnswerLine /><strong>{question.right}</strong></div>;
}

function CompareQuestionView({ question }: { question: WorksheetQuestion }) {
  if (question.type !== "compare") return null;
  return <div className={styles.senseQuestion} data-testid="math-worksheet-question" data-type="compare"><span className={styles.questionNumber}>{question.number}.</span><strong>{question.left}</strong><AnswerLine symbol /><strong>{question.right}</strong></div>;
}

function NumberSenseSection({ section }: { section: WorksheetPageSection }) {
  const neighbors = section.questions.filter((question) => question.type === "neighbor");
  const compares = section.questions.filter((question) => question.type === "compare");
  const showHeading = section.title.length > 0;
  return (
    <section className={styles.numberSenseSection} data-columns={section.columns} data-testid="worksheet-number-sense">
      {neighbors.length > 0 ? <div className={styles.senseColumn}>{showHeading ? <h3>{section.title}</h3> : null}<div className={styles.senseGrid}>{neighbors.map((question) => <NeighborQuestionView question={question} key={question.id} />)}</div></div> : null}
      {compares.length > 0 ? <div className={styles.senseColumn}>{showHeading ? <h3>比大小</h3> : null}<div className={styles.senseGrid}>{compares.map((question) => <CompareQuestionView question={question} key={question.id} />)}</div></div> : null}
    </section>
  );
}

function MentalQuestionView({ question }: { question: WorksheetQuestion }) {
  if (question.type !== "mental") return null;
  const hasThirdTerm = question.third !== undefined;
  return (
    <div className={styles.mentalQuestion} data-testid="math-worksheet-question" data-type="mental" data-level={question.level}>
      <span className={styles.questionNumber}>{question.number}.</span>
      <span className={styles.expression} data-term-count={hasThirdTerm ? 3 : 2}>
        <span className={styles.termSlot} data-slot="first-term">{question.left}</span>
        <span className={styles.operatorSlot} data-slot="first-operator">{question.operator}</span>
        <span className={styles.termSlot} data-slot="second-term">{question.right}</span>
        <span className={styles.operatorSlot} data-slot="second-operator" data-empty={!hasThirdTerm}>{hasThirdTerm ? question.secondOperator : ""}</span>
        <span className={styles.termSlot} data-slot="third-term" data-empty={!hasThirdTerm}>{hasThirdTerm ? question.third : ""}</span>
        <span className={styles.equalsSlot} data-slot="equals">=</span>
      </span>
      <AnswerLine />
    </div>
  );
}

function VerticalCalculationView({ question }: { question: VerticalCalculationQuestion }) {
  return (
    <div className={styles.verticalQuestion} data-testid="math-worksheet-question" data-type="vertical-calculation" data-operator={question.operator} data-left={question.left} data-right={question.right} data-answer={question.answer}>
      <span className={styles.questionNumber}>{question.number}.</span>
      <div className={styles.verticalExpression}>
        <span>{question.left}</span>
        <span>{question.operator} {question.right}</span>
        <i aria-hidden="true" />
        <AnswerLine />
      </div>
    </div>
  );
}

function MissingNumberValue({ value }: { value?: number | null }) {
  return value == null ? <span className={styles.missingNumberSlot} data-slot="missing-number" aria-hidden="true" /> : <span>{value}</span>;
}

function MissingNumberView({ question }: { question: MissingNumberQuestion }) {
  return (
    <div className={styles.missingNumberQuestion} data-testid="math-worksheet-question" data-type="missing-number" data-missing={question.missing} data-answer={question.answer}>
      <span className={styles.questionNumber}>{question.number}.</span>
      <strong>
        <MissingNumberValue value={question.left} />
        <span>{question.operator}</span>
        <MissingNumberValue value={question.right} />
        <span>=</span>
        <MissingNumberValue value={question.result} />
      </strong>
    </div>
  );
}

function GroupingView({ question }: { question: GroupingQuestion }) {
  const expression = question.mode === "repeated-addition"
    ? `${Array.from({ length: question.groupCount }, () => question.perGroup).join(" + ")} =`
    : question.mode === "multiply"
      ? `${question.groupCount} × ${question.perGroup} =`
      : `${question.total} ÷ ${question.groupCount} =`;
  return (
    <div className={styles.groupingQuestion} data-testid="math-worksheet-question" data-type="grouping" data-mode={question.mode} data-answer={question.answer}>
      <span className={styles.questionNumber}>{question.number}.</span>
      <ObjectSprite asset={question.icon} className={styles.groupingIcon} />
      <strong>{expression}</strong>
      <AnswerLine />
    </div>
  );
}

function LifeMathView({ question }: { question: LifeMathQuestion }) {
  return (
    <div className={styles.lifeMathQuestion} data-testid="math-worksheet-question" data-type="life-math" data-topic={question.topic} data-storyline-id={question.storylineId} data-answer={question.answer}>
      <div className={styles.applicationPrompt}><span className={styles.questionNumber}>{question.number}.</span><ObjectSprite asset={question.icon} className={styles.applicationIcon} /><p>{question.prompt}</p></div>
      <div className={styles.applicationWritingSpace} data-testid="life-math-writing-space" aria-hidden="true" />
    </div>
  );
}

function NumberBondView({ question }: { question: NumberBondQuestion }) {
  if (question.mode === "picture-split") {
    return (
      <div className={styles.compositionQuestion} data-testid="math-worksheet-question" data-type="number-bond" data-mode={question.mode} data-whole={question.whole} data-known-part={question.knownPart} data-answer={question.answer}>
        <span className={styles.questionNumber}>{question.number}.</span>
        <div className={styles.bondPictureContent}>
          <span className={styles.bondPictureGroups} aria-label={`${question.knownPart} 和 ${question.answer}`}>
            <CountGroup count={question.knownPart} icon={question.icon} compact role="known-part" />
            <b>+</b>
            <CountGroup count={question.answer} icon={question.icon} compact role="missing-part" />
          </span>
          <span className={styles.bondAnswerRow}><span className={styles.bondFormula}>{question.whole} = {question.knownPart} +</span><AnswerLine /></span>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.compositionQuestion} data-testid="math-worksheet-question" data-type="number-bond" data-mode={question.mode} data-whole={question.whole} data-known-part={question.knownPart} data-answer={question.answer}>
      <span className={styles.questionNumber}>{question.number}.</span>
      <span className={styles.bondFormula}>{question.mode === "compose" ? `${question.knownPart} +` : `${question.whole} = ${question.knownPart} +`}</span>
      <AnswerLine />
      {question.mode === "compose" ? <span className={styles.bondTarget}>= {question.whole}</span> : null}
    </div>
  );
}

function PictureEquationView({ question }: { question: PictureEquationQuestion }) {
  return (
    <div className={styles.pictureEquationQuestion} data-testid="math-worksheet-question" data-type="picture-equation" data-left-count={question.leftCount} data-operator={question.operator} data-right-count={question.rightCount} data-answer={question.answer}>
      <span className={styles.questionNumber}>{question.number}.</span>
      <div className={styles.pictureEquationContent}>
        <div className={styles.pictureEquationVisual}>
          <CountGroup count={question.leftCount} icon={question.icon} compact role="left-operand" />
          <b>{question.operator}</b>
          <CountGroup count={question.rightCount} icon={question.icon} compact role="right-operand" />
        </div>
        <AnswerLine wide />
      </div>
    </div>
  );
}

function ApplicationQuestionView({ question }: { question: ApplicationQuestion }) {
  return (
    <div className={styles.applicationQuestion} data-testid="math-worksheet-question" data-type="application" data-level={question.level} data-scenario={question.scenario}>
      <div className={styles.applicationPrompt}><span className={styles.questionNumber}>{question.number}.</span><ObjectSprite asset={question.icon} className={styles.applicationIcon} /><p>{question.prompt}</p></div>
      <div className={styles.applicationWritingSpace} data-testid="application-writing-space" aria-hidden="true" />
    </div>
  );
}

function ApplicationSectionView({ section }: { section: WorksheetPageSection }) {
  const style = { "--application-row-height": `${section.rowHeightMm}mm` } as CSSProperties;
  return <section className={styles.applicationSection} data-columns={section.columns} style={style}>{section.title ? <h3>{section.title}</h3> : null}<div className={styles.applicationGrid}>{section.questions.map((question) => question.type === "application" ? <ApplicationQuestionView question={question} key={question.id} /> : null)}</div></section>;
}

function VerticalSectionView({ section }: { section: WorksheetPageSection }) {
  return <section className={styles.verticalSection} data-columns={section.columns} data-testid="worksheet-vertical-section">{section.title ? <h3>{section.title}</h3> : null}<div className={styles.verticalGrid}>{section.questions.map((question) => question.type === "vertical-calculation" ? <VerticalCalculationView question={question} key={question.id} /> : null)}</div></section>;
}

function MissingNumberSectionView({ section }: { section: WorksheetPageSection }) {
  return <section className={styles.missingNumberSection} data-columns={section.columns} data-testid="worksheet-missing-number-section">{section.title ? <h3>{section.title}</h3> : null}<div className={styles.missingNumberGrid}>{section.questions.map((question) => question.type === "missing-number" ? <MissingNumberView question={question} key={question.id} /> : null)}</div></section>;
}

function GroupingSectionView({ section }: { section: WorksheetPageSection }) {
  return <section className={styles.groupingSection} data-columns={section.columns} data-testid="worksheet-grouping-section">{section.title ? <h3>{section.title}</h3> : null}<div className={styles.groupingGrid}>{section.questions.map((question) => question.type === "grouping" ? <GroupingView question={question} key={question.id} /> : null)}</div></section>;
}

function LifeMathSectionView({ section }: { section: WorksheetPageSection }) {
  const style = { "--application-row-height": `${section.rowHeightMm}mm` } as CSSProperties;
  return <section className={styles.lifeMathSection} data-columns={section.columns} style={style} data-testid="worksheet-life-math-section">{section.title ? <h3>{section.title}</h3> : null}<div className={styles.lifeMathGrid}>{section.questions.map((question) => question.type === "life-math" ? <LifeMathView question={question} key={question.id} /> : null)}</div></section>;
}

function WorksheetPageSectionView({ section }: { section: WorksheetPageSection }) {
  if (section.type === "guided") return <section className={styles.guidedSection} data-testid="worksheet-guided-section"><h3>{section.title}</h3><div className={styles.guidedGrid}>{section.questions.map((question) => question.type === "mental" ? <GuidedQuestion question={question} key={question.id} /> : null)}</div></section>;
  if (section.type === "number-sense") return <NumberSenseSection section={section} />;
  if (section.type === "composition") return <section className={styles.compositionSection} data-columns={section.columns}>{section.title ? <h3>{section.title}</h3> : null}<div className={styles.compositionGrid}>{section.questions.map((question) => question.type === "number-bond" ? <NumberBondView question={question} key={question.id} /> : null)}</div></section>;
  if (section.type === "picture-equation") return <section className={styles.pictureEquationSection} data-columns={section.columns}>{section.title ? <h3>{section.title}</h3> : null}<div className={styles.pictureEquationGrid}>{section.questions.map((question) => question.type === "picture-equation" ? <PictureEquationView question={question} key={question.id} /> : null)}</div></section>;
  if (section.type === "application") return <ApplicationSectionView section={section} />;
  if (section.type === "vertical") return <VerticalSectionView section={section} />;
  if (section.type === "missing-number") return <MissingNumberSectionView section={section} />;
  if (section.type === "grouping") return <GroupingSectionView section={section} />;
  if (section.type === "life-math") return <LifeMathSectionView section={section} />;
  return <section className={styles.mentalSection} data-columns={section.columns} data-testid="worksheet-mental-section">{section.title ? <h3>{section.title}</h3> : null}<div className={styles.mentalGrid}>{section.questions.map((question) => <MentalQuestionView question={question} key={question.id} />)}</div></section>;
}

function WorksheetPaper({ worksheet, page, printCopy = false }: { worksheet: DailyWorksheet; page: WorksheetPrintPage; printCopy?: boolean }) {
  const character = getWorksheetCharacter(worksheet.day);
  const stageLabel = worksheet.month === 2
    ? `第二个月 ${worksheet.monthDay}/${MONTH_TWO_DAYS}`
    : worksheet.stage === "foundation" ? `基础 ${worksheet.stageDay}/${FOUNDATION_WORKSHEET_DAYS}` : `强化 ${worksheet.stageDay}/${REINFORCEMENT_WORKSHEET_DAYS}`;
  return (
    <article className={styles.paper} data-testid={printCopy ? undefined : "math-worksheet-paper"} data-day={worksheet.day} data-stage={worksheet.stage} data-stage-day={worksheet.stageDay} data-page={page.pageNumber} data-page-count={page.pageCount} data-used-height={page.usedHeightMm} data-print-copy={printCopy || undefined} data-print-side={printCopy ? (page.pageNumber === 1 ? "front" : "back") : undefined} data-blank={printCopy ? "false" : undefined} aria-label={`第 ${worksheet.day} 天数学练习第 ${page.pageNumber} 页`}>
      <header className={styles.paperHeader}>
        <div className={styles.paperTitle}><span>{stageLabel}</span><h2>数学练习</h2><strong>{worksheet.title}</strong></div>
        <img className={styles.character} src={character.src} alt="" data-character={character.name} draggable="false" />
        <div className={styles.dateField}>日期 <span aria-hidden="true" /></div>
      </header>
      <div className={styles.paperBody} data-testid={printCopy ? undefined : "worksheet-paper-body"}>{page.showMethod ? <MethodExample worksheet={worksheet} /> : null}{page.sections.map((section, index) => <WorksheetPageSectionView section={section} key={`${section.type}-${index}`} />)}</div>
      <footer className={styles.paperFooter} data-testid={printCopy ? undefined : "worksheet-paper-footer"}><span>第 {worksheet.day} / {WORKSHEET_PLAN_DAYS} 天</span><span>第 {page.pageNumber} / {page.pageCount} 页 · 本页 {page.questionCount} 题</span></footer>
    </article>
  );
}

function WorksheetBlankBack({ day }: { day: number }) {
  return <article className={`${styles.paper} ${styles.blankPaper}`} data-print-copy="true" data-day={day} data-print-side="back" data-blank="true" aria-label={`第 ${day} 天空白背面`}><div className={styles.blankMark}>第 {day} 天 · 空白背面</div></article>;
}

function MathWorksheetWorkspaceContent({ definition }: { definition: KidsToolDefinition }) {
  const seedRef = useRef(INITIAL_SEED);
  const printPackRef = useRef<HTMLDivElement>(null);
  const bulkWorkerRef = useRef<Worker | null>(null);
  const planWorkerRef = useRef<Worker | null>(null);
  const planRequestRef = useRef(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [activeMonth, setActiveMonth] = useState<1 | 2>(1);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [printPending, setPrintPending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [exportRange, setExportRange] = useState<WorksheetExportRange>("all");
  const [config, setConfig] = useState<ReinforcementConfig>(DEFAULT_REINFORCEMENT_CONFIG);
  const [monthTwoQuestionCount, setMonthTwoQuestionCount] = useState(DEFAULT_MONTH_TWO_CONFIG.dailyQuestionCount);
  const [plan, setPlan] = useState<WorksheetPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", text: "正在准备 60 天数学练习" });
  const selectedWorksheet = plan?.days[selectedDay - 1] ?? plan?.days[0];
  const selectedPage = selectedWorksheet?.pages[previewPageIndex] ?? selectedWorksheet?.pages[0];
  const visibleDays = plan ? activeMonth === 1 ? plan.monthOneDays : plan.monthTwoDays : [];
  const exportDays = plan ? getExportDays(plan, exportRange) : [];
  const contentPages = exportDays.reduce((sum, worksheet) => sum + worksheet.pages.length, 0);
  const printPages = getMathWorkbookPrintPageCount(exportDays);
  const selectedPrintPages = selectedWorksheet
    ? selectedWorksheet.pages.length + (selectedWorksheet.pages.length % 2 === 1 ? 1 : 0)
    : 0;
  const selectedCounts = selectedWorksheet ? {
    neighbor: getSectionQuestions(selectedWorksheet, "neighbor").length,
    compare: getSectionQuestions(selectedWorksheet, "compare").length,
    mental: getSectionQuestions(selectedWorksheet, "mental").length,
    application: getSectionQuestions(selectedWorksheet, "application").length,
  } : { neighbor: 0, compare: 0, mental: 0, application: 0 };
  const expectedReinforcementCounts = selectedWorksheet?.month === 1 && selectedWorksheet.stage === "reinforcement"
    ? getReinforcementQuestionCounts(config, selectedWorksheet.stageDay)
    : undefined;
  const expectedMonthTwoCounts = selectedWorksheet?.month === 2
    ? getMonthTwoQuestionCounts({ dailyQuestionCount: monthTwoQuestionCount })
    : undefined;

  const nextSeed = () => { seedRef.current += 7919; return seedRef.current; };
  const requestPlan = (seed: number, nextConfig: ReinforcementConfig, nextMonthTwoQuestionCount: number, successText: string) => {
    const requestId = planRequestRef.current + 1;
    planRequestRef.current = requestId;
    planWorkerRef.current?.terminate();
    const worker = new Worker(new URL("../workers/math-worksheet.worker.ts", import.meta.url), { type: "module" });
    planWorkerRef.current = worker;
    setPlanLoading(true);
    setStatus({ tone: "idle", text: "正在生成 60 天数学练习" });
    const finish = () => {
      worker.terminate();
      if (planWorkerRef.current === worker) planWorkerRef.current = null;
    };
    worker.onmessage = (event: MessageEvent<MathWorksheetPlanWorkerResponse>) => {
      if (planRequestRef.current !== requestId || planWorkerRef.current !== worker) return;
      const message = event.data;
      if (message.type === "error") {
        finish();
        setPlanLoading(false);
        setStatus({ tone: "error", text: `数学练习生成失败：${message.message}` });
        return;
      }
      finish();
      setPlan(message.plan);
      setPlanLoading(false);
      setPreviewPageIndex(0);
      setStatus({ tone: "success", text: successText });
    };
    worker.onerror = () => {
      if (planRequestRef.current !== requestId || planWorkerRef.current !== worker) return;
      finish();
      setPlanLoading(false);
      setStatus({ tone: "error", text: "数学练习生成失败，请刷新页面后重试" });
    };
    worker.postMessage({ type: "generate", seed, config: nextConfig, monthTwoConfig: { ...DEFAULT_MONTH_TWO_CONFIG, dailyQuestionCount: nextMonthTwoQuestionCount } } satisfies MathWorksheetPlanGenerateRequest);
  };

  useEffect(() => {
    requestPlan(INITIAL_SEED, DEFAULT_REINFORCEMENT_CONFIG, DEFAULT_MONTH_TWO_CONFIG.dailyQuestionCount, "两个 30 天数学练习计划已准备好");
    return () => {
      bulkWorkerRef.current?.terminate();
      planWorkerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!printPending || !selectedWorksheet) return;
    let cancelled = false;
    const preparePrint = async () => {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      await document.fonts.ready;
      const images = Array.from(printPackRef.current?.querySelectorAll("img") ?? []);
      await Promise.all(images.map(waitForImage));
      if (cancelled) return;
      if (images.some((image) => image.naturalWidth === 0)) {
        setPrintPending(false);
        setStatus({ tone: "error", text: "部分图片未加载完成，请稍后再试" });
        return;
      }
      setPrintPending(false);
      setStatus({ tone: "success", text: `已打开第 ${selectedWorksheet.day} 天打印窗口，共 ${selectedPrintPages} 页双面打印包` });
      window.print();
    };
    void preparePrint();
    return () => {
      cancelled = true;
    };
  }, [printPending, selectedPrintPages, selectedWorksheet?.day]);

  const regeneratePlan = (nextConfig = config, nextMonthTwoQuestionCount = monthTwoQuestionCount, text = "数学练习计划已重新生成") => { requestPlan(nextSeed(), nextConfig, nextMonthTwoQuestionCount, text); };
  const updateRatio = (key: RatioKey, value: number) => {
    const next = normalizeReinforcementConfig({ ...config, [key]: Number.isFinite(value) ? value : 0 });
    setConfig(next);
    regeneratePlan(next, monthTwoQuestionCount, "第一个月强化训练题目比例已更新");
  };
  const updateTotal = (value: number) => {
    const next = normalizeReinforcementConfig({ ...config, dailyQuestionCount: value });
    setConfig(next);
    regeneratePlan(next, monthTwoQuestionCount, "第一个月强化训练每日题量已更新");
  };
  const updateMonthTwoTotal = (value: number) => {
    const next = normalizeMonthTwoConfig({ dailyQuestionCount: value }).dailyQuestionCount;
    setMonthTwoQuestionCount(next);
    regeneratePlan(config, next, "第二个月每日题量已更新");
  };
  const regenerateDay = () => {
    if (!selectedWorksheet || selectedWorksheet.stage === "foundation") { setStatus({ tone: "idle", text: "基础引导是固定精选内容" }); return; }
    const currentWorksheet = selectedWorksheet;
    const next = selectedWorksheet.month === 2
      ? generateDailyWorksheet(selectedWorksheet.day, nextSeed(), { monthTwoQuestionCount })
      : generateDailyWorksheet(selectedWorksheet.day, nextSeed(), { neighborCount: selectedCounts.neighbor, compareCount: selectedCounts.compare, mentalCount: selectedCounts.mental, applicationCount: selectedCounts.application, theme: selectedWorksheet.theme });
    setPlan((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        days: previous.days.map((day) => day.id === next.id ? next : day),
        monthOneDays: previous.monthOneDays.map((day) => day.id === next.id ? next : day),
        monthTwoDays: previous.monthTwoDays.map((day) => day.id === next.id ? next : day),
        reinforcementDays: previous.reinforcementDays.map((day) => day.id === next.id ? next : day),
      };
    });
    setStatus({ tone: "success", text: `${currentWorksheet.month === 2 ? "第二个月" : "强化"}第 ${currentWorksheet.monthDay} 天已换一套题目` });
  };
  const selectDay = (day: number) => { setSelectedDay(day); setPreviewPageIndex(0); setStatus({ tone: "idle", text: `正在查看第 ${day} 天` }); };
  const selectMonth = (month: 1 | 2) => { setActiveMonth(month); setSelectedDay(month === 1 ? 1 : MONTH_ONE_DAYS + 1); setPreviewPageIndex(0); setStatus({ tone: "idle", text: `正在查看第 ${month} 个月` }); };
  const reset = () => { seedRef.current = INITIAL_SEED; setConfig(DEFAULT_REINFORCEMENT_CONFIG); setMonthTwoQuestionCount(DEFAULT_MONTH_TWO_CONFIG.dailyQuestionCount); setExportRange("all"); setActiveMonth(1); setSelectedDay(1); requestPlan(INITIAL_SEED, DEFAULT_REINFORCEMENT_CONFIG, DEFAULT_MONTH_TWO_CONFIG.dailyQuestionCount, "已恢复默认练习计划"); };
  const queueCurrentDayPrint = () => {
    if (!selectedWorksheet) return;
    setPrintPending(true);
    setStatus({ tone: "idle", text: `正在准备第 ${selectedWorksheet.day} 天练习纸...` });
  };
  const cancelBulkExport = () => {
    bulkWorkerRef.current?.terminate();
    bulkWorkerRef.current = null;
    setBulkProgress(null);
    setStatus({ tone: "idle", text: "已取消数学练习导出" });
  };
  const startBulkExport = () => {
    if (bulkWorkerRef.current) {
      cancelBulkExport();
      return;
    }
    const worker = new Worker(new URL("../workers/math-pdf.worker.ts", import.meta.url), { type: "module" });
    const totalDays = exportDays.length;
    const filename = getMathBulkPdfFilename(exportRange);
    bulkWorkerRef.current = worker;
    setBulkProgress(0);
    setStatus({ tone: "idle", text: `正在生成 0 / ${totalDays} 天` });

    const finish = () => {
      worker.terminate();
      if (bulkWorkerRef.current === worker) bulkWorkerRef.current = null;
      setBulkProgress(null);
    };
    worker.onmessage = (event: MessageEvent<MathPdfWorkerResponse>) => {
      if (bulkWorkerRef.current !== worker) return;
      const message = event.data;
      if (message.type === "progress") {
        setBulkProgress(message.completed);
        setStatus({ tone: "idle", text: `正在生成 ${message.completed} / ${message.total} 天` });
        return;
      }
      if (message.type === "error") {
        finish();
        setStatus({ tone: "error", text: `数学练习导出失败：${message.message}` });
        return;
      }
      const url = URL.createObjectURL(new Blob([message.bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      finish();
      setStatus({ tone: "success", text: `${totalDays} 天数学练习已导出，共 ${message.pageCount} 页` });
    };
    worker.onerror = () => {
      if (bulkWorkerRef.current !== worker) return;
      finish();
      setStatus({ tone: "error", text: "数学练习导出失败，请刷新页面后重试" });
    };
    worker.postMessage({ type: "generate", worksheets: exportDays, baseUrl: window.location.origin } satisfies MathPdfGenerateRequest);
  };

  if (!plan || !selectedWorksheet || !selectedPage) {
    return (
      <section className={`pulse-workbench ${styles.workbench}`} aria-labelledby="tool-title">
        <header className="pulse-workbench__header"><div><div className="pulse-workbench__meta" aria-hidden="true"><span>一程一成长 / 工具</span><i /><span>{definition.category}</span></div><h1 id="tool-title">{definition.seo.h1}</h1><p>{definition.description}</p></div></header>
        <div className={styles.loadingPanel} role="status" aria-live="polite"><Calculator aria-hidden="true" size={20} /><strong>{planLoading ? "正在准备 60 天数学练习" : "数学练习暂时无法生成"}</strong><span>{status.text}</span></div>
      </section>
    );
  }
  return (
    <section className={`pulse-workbench ${styles.workbench}`} aria-labelledby="tool-title">
      <header className="pulse-workbench__header"><div><div className="pulse-workbench__meta" aria-hidden="true"><span>一程一成长 / 工具</span><i /><span>{definition.category}</span></div><h1 id="tool-title">{definition.seo.h1}</h1><p>{definition.description}</p></div></header>
      <section className={styles.layout} aria-label="幼小数学练习生成工作区">
        <aside className={styles.settings} aria-label="数学练习设置">
          <header className={styles.settingsHeader}><div><span>{selectedWorksheet.month === 1 ? "第一个月练习计划" : "第二个月进阶计划"}</span><h2>{selectedWorksheet.month === 2 ? `第 ${selectedWorksheet.monthDay} 天` : selectedWorksheet.stage === "foundation" ? `基础 ${selectedWorksheet.stageDay}` : `强化 ${selectedWorksheet.stageDay}`}</h2></div><strong>{selectedWorksheet.total}<small>题</small></strong></header>
          <div className={styles.overview}><span><b>30</b> 天第一个月</span><span><b>30</b> 天第二个月</span><span><b>{contentPages}</b> 内容页</span></div>
          <section className={styles.exportRange} aria-labelledby="export-range-title"><div className={styles.settingLabel}><span id="export-range-title">导出内容</span><small>{printPages} 页双面打印</small></div><div className={styles.rangeTabs} role="tablist" aria-label="选择导出范围">{(["month-one", "month-two", "all"] as const).map((range) => <button type="button" role="tab" aria-selected={exportRange === range} className={exportRange === range ? styles.currentRange : ""} disabled={printPending || bulkProgress !== null} onClick={() => setExportRange(range)} key={range}>{range === "month-one" ? "第一个月" : range === "month-two" ? "第二个月" : "全部 60 天"}</button>)}</div><p>{exportRange === "month-one" ? "5 天基础引导 + 25 天强化训练" : exportRange === "month-two" ? "30 天加减进阶与综合练习" : "两个 30 天练习计划"}</p></section>
          <nav className={styles.dayNav} aria-label="练习计划日期"><header><CalendarDays aria-hidden="true" size={16} /><span>预览每天内容</span></header><div className={styles.monthTabs} role="tablist" aria-label="选择练习月份"><button type="button" role="tab" aria-selected={activeMonth === 1} className={activeMonth === 1 ? styles.currentRange : ""} onClick={() => selectMonth(1)}>第一个月</button><button type="button" role="tab" aria-selected={activeMonth === 2} className={activeMonth === 2 ? styles.currentRange : ""} onClick={() => selectMonth(2)}>第二个月</button></div>{activeMonth === 1 ? <><div className={styles.dayGroup}><small>基础引导</small><div className={styles.dayGrid}>{plan.foundationDays.map((day) => <button type="button" className={day.day === selectedDay ? styles.currentDay : ""} aria-label={`基础第 ${day.stageDay} 天：${day.title}`} aria-pressed={day.day === selectedDay} onClick={() => selectDay(day.day)} data-testid={`worksheet-day-${day.day}`} key={day.id}>{day.stageDay}</button>)}</div></div><div className={styles.dayGroup}><small>强化训练</small><div className={styles.dayGrid}>{plan.reinforcementDays.map((day) => <button type="button" className={day.day === selectedDay ? styles.currentDay : ""} aria-label={`强化第 ${day.stageDay} 天：${day.title}`} aria-pressed={day.day === selectedDay} onClick={() => selectDay(day.day)} data-testid={`worksheet-day-${day.day}`} key={day.id}>{day.stageDay + FOUNDATION_WORKSHEET_DAYS}</button>)}</div></div></> : <div className={styles.dayGroup}><small>第二个月进阶训练</small><div className={styles.dayGrid}>{visibleDays.map((day) => <button type="button" className={day.day === selectedDay ? styles.currentDay : ""} aria-label={`第二个月第 ${day.monthDay} 天：${day.title}`} aria-pressed={day.day === selectedDay} onClick={() => selectDay(day.day)} data-testid={`worksheet-day-${day.day}`} key={day.id}>{day.monthDay}</button>)}</div></div>}</nav>
          {selectedWorksheet.month === 2 ? <section className={styles.settingGroup} aria-labelledby="month-two-config-title"><div className={styles.settingLabel}><span id="month-two-config-title">第二个月配置</span><small>30 天统一使用</small></div><label className={styles.totalField}><span>每天题量</span><input type="range" min="10" max={MAX_WORKSHEET_QUESTIONS} value={monthTwoQuestionCount} disabled={printPending || bulkProgress !== null} onChange={(event) => updateMonthTwoTotal(event.currentTarget.valueAsNumber)} /><input type="number" min="10" max={MAX_WORKSHEET_QUESTIONS} value={monthTwoQuestionCount} disabled={printPending || bulkProgress !== null} aria-label="第二个月每天题量" onChange={(event) => updateMonthTwoTotal(event.currentTarget.valueAsNumber)} /><em>题</em></label><div className={styles.ratioGrid}><div className={styles.ratioField}><span>加减进阶</span><strong>80</strong><em>%</em></div><div className={styles.ratioField}><span>乘除启蒙</span><strong>10</strong><em>%</em></div><div className={styles.ratioField}><span>生活数学</span><strong>10</strong><em>%</em></div></div><div className={styles.ratioBar} aria-label="题型比例：加减进阶 80%，乘除启蒙 10%，生活数学 10%"><span style={{ width: "80%" }} /><span style={{ width: "10%" }} /><span style={{ width: "10%" }} /></div><p className={styles.ratioHint}>默认每天 24 道加减、3 道乘除启蒙、3 道生活数学</p></section> : <section className={styles.settingGroup} aria-labelledby="reinforcement-config-title"><div className={styles.settingLabel}><span id="reinforcement-config-title">强化训练配置</span><small>第一个月 25 天统一使用</small></div><label className={styles.totalField}><span>每天题量</span><input type="range" min="10" max={MAX_WORKSHEET_QUESTIONS} value={config.dailyQuestionCount} disabled={printPending || bulkProgress !== null} onChange={(event) => updateTotal(event.currentTarget.valueAsNumber)} /><input type="number" min="10" max={MAX_WORKSHEET_QUESTIONS} value={config.dailyQuestionCount} disabled={printPending || bulkProgress !== null} aria-label="强化训练每天题量" onChange={(event) => updateTotal(event.currentTarget.valueAsNumber)} /><em>题</em></label><div className={styles.ratioGrid}>{RATIO_FIELDS.map((field) => <label className={styles.ratioField} key={field.key}><span>{field.label}</span><input type="number" min="0" max={field.key === "applicationRatio" ? MAX_APPLICATION_RATIO : 100} step="5" value={config[field.key]} disabled={printPending || bulkProgress !== null} aria-label={field.inputLabel} onChange={(event) => updateRatio(field.key, event.currentTarget.valueAsNumber)} /><em>%</em></label>)}<div className={`${styles.ratioField} ${styles.readonlyRatio}`}><span>计算式</span><strong>{config.mentalRatio}%</strong><em>%</em></div></div><div className={styles.ratioBar} aria-label={`题型比例：相邻数 ${config.neighborRatio}%，比大小 ${config.compareRatio}%，计算式 ${config.mentalRatio}%，应用题 ${config.applicationRatio}%`}><span style={{ width: `${config.neighborRatio}%` }} /><span style={{ width: `${config.compareRatio}%` }} /><span style={{ width: `${config.mentalRatio}%` }} /><span style={{ width: `${config.applicationRatio}%` }} /></div><p className={styles.ratioHint}>应用题最多 25%，保证每天最多两页</p></section>}
          {selectedWorksheet.month === 2 ? <div className={styles.expectedCounts}><span>本日预计</span><strong>{expectedMonthTwoCounts?.neighbor ?? 0}</strong><small>相邻</small><strong>{expectedMonthTwoCounts?.compare ?? 0}</strong><small>比较</small><strong>{expectedMonthTwoCounts?.mental ?? 0}</strong><small>横式</small><strong>{expectedMonthTwoCounts?.vertical ?? 0}</strong><small>竖式</small><strong>{expectedMonthTwoCounts?.missing ?? 0}</strong><small>未知数</small><strong>{expectedMonthTwoCounts?.grouping ?? 0}</strong><small>乘除</small><strong>{expectedMonthTwoCounts?.lifeMath ?? 0}</strong><small>生活</small></div> : selectedWorksheet.stage === "reinforcement" ? <div className={styles.expectedCounts}><span>本日预计</span><strong>{expectedReinforcementCounts?.neighbor ?? 0}</strong><small>相邻</small><strong>{expectedReinforcementCounts?.compare ?? 0}</strong><small>比较</small><strong>{expectedReinforcementCounts?.mental ?? 0}</strong><small>计算</small><strong>{expectedReinforcementCounts?.application ?? 0}</strong><small>应用</small></div> : <div className={styles.fixedNotice}><Check size={15} />前 5 天为固定精选内容</div>}
          <div className={styles.actions} aria-busy={printPending || bulkProgress !== null}><button type="button" className={styles.primaryButton} disabled={printPending || bulkProgress !== null} onClick={() => regeneratePlan()}><Dices size={17} />重新生成强化题</button><button type="button" className={styles.bulkPrintButton} disabled={printPending} onClick={startBulkExport}>{bulkProgress === null ? <Files size={17} /> : <X size={17} />}{bulkProgress === null ? `导出 ${exportRange === "all" ? 60 : 30} 天 PDF` : `取消导出（${bulkProgress} / ${exportDays.length}）`}</button><button type="button" className={styles.printButton} disabled={printPending || bulkProgress !== null} onClick={queueCurrentDayPrint}><Printer size={17} />打印当前一天</button><button type="button" onClick={regenerateDay} disabled={selectedWorksheet.stage === "foundation" || printPending || bulkProgress !== null}><ClipboardList size={16} />本日换一套</button><button type="button" disabled={printPending || bulkProgress !== null} onClick={reset}><RotateCcw size={16} />恢复默认</button></div>
          <div className={styles.status} data-tone={status.tone} role="status" aria-live="polite">{status.tone === "success" ? <Check size={15} /> : null}{status.tone === "error" ? <TriangleAlert size={15} /> : null}<span>{status.text}</span></div><p className={styles.local}><ShieldCheck size={15} />题目在浏览器本地生成</p><p className={styles.printSummary} data-testid="worksheet-print-summary">{contentPages} 页内容 / {printPages} 页双面打印包</p>
        </aside>
        <section className={`${styles.preview} ${previewExpanded ? styles.previewExpanded : ""}`} aria-label="当天 A4 版面预览"><header className={styles.previewToolbar}><div><Calculator size={17} /><span>{selectedWorksheet.month === 2 ? "第二个月" : selectedWorksheet.stage === "foundation" ? "基础" : "强化"} {selectedWorksheet.month === 2 ? selectedWorksheet.monthDay : selectedWorksheet.stageDay} · A4 预览</span></div><div className={styles.previewControls}>{selectedWorksheet.pages.length > 1 ? <div className={styles.pageTabs} role="tablist" aria-label="选择预览页">{selectedWorksheet.pages.map((page, index) => <button type="button" role="tab" aria-selected={previewPageIndex === index} className={previewPageIndex === index ? styles.currentTab : ""} onClick={() => setPreviewPageIndex(index)} key={page.pageNumber}>第 {page.pageNumber} 页</button>)}</div> : <span className={styles.singlePage}>共 1 页</span>}<button type="button" className={styles.expandButton} aria-label={previewExpanded ? "退出放大预览" : "放大预览"} title={previewExpanded ? "退出放大预览" : "放大预览"} onClick={() => setPreviewExpanded((value) => !value)}>{previewExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button></div></header><div className={styles.daySummary} data-testid="worksheet-day-summary"><span><Target size={14} />今日目标</span><strong>{selectedWorksheet.title}</strong><p>{selectedWorksheet.objective}</p></div><div className={styles.previewCanvas}><WorksheetPaper worksheet={selectedWorksheet} page={selectedPage} /></div></section>
      </section>
      <div className={styles.printPack} data-testid="worksheet-print-pack" data-render-scope="selected-day" ref={printPackRef} aria-label="当前数学练习双面打印内容">{selectedWorksheet.pages.map((page) => <WorksheetPaper worksheet={selectedWorksheet} page={page} printCopy key={`${selectedWorksheet.id}-${page.pageNumber}`} />)}{selectedWorksheet.pages.length % 2 === 1 ? <WorksheetBlankBack day={selectedWorksheet.day} /> : null}</div>
      <div className={styles.assetPreload} aria-hidden="true">{ALL_OBJECT_ASSETS.map((src) => <img src={src} alt="" key={src} />)}</div>
    </section>
  );
}

export function MathWorksheetWorkspace({ definition, seoContent }: { definition: KidsToolDefinition; seoContent?: ReactNode }) {
  return <KidsShell activeTool={definition.slug}><MathWorksheetWorkspaceContent definition={definition} />{seoContent}</KidsShell>;
}
