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
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { recordRecentTool } from "@/lib/recent-tools";
import {
  generateDailyWorksheet,
  generateWorksheetPlan,
  MAX_WORKSHEET_QUESTIONS,
  WORKSHEET_PHASES,
  WORKSHEET_PLAN_DAYS,
  WORKSHEET_THEME_DESCRIPTIONS,
  WORKSHEET_THEME_LABELS,
  type DailyWorksheet,
  type MentalQuestion,
  type WorksheetDayOverrides,
  type WorksheetPlan,
  type WorksheetQuestion,
} from "@/lib/tools/math-worksheet";
import type { ToolDefinition } from "@/lib/tools/registry";

import { PulseShell } from "./pulse-shell";

type StatusTone = "idle" | "success" | "error";
type CountKey = "neighborCount" | "compareCount" | "mentalCount";

interface StatusMessage {
  tone: StatusTone;
  text: string;
}

const INITIAL_SEED = 20260831;

const countFields: readonly { key: CountKey; label: string; inputLabel: string }[] = [
  { key: "neighborCount", label: "相邻数", inputLabel: "相邻数题数" },
  { key: "compareCount", label: "比大小", inputLabel: "比大小题数" },
  { key: "mentalCount", label: "口算", inputLabel: "口算题数" },
];

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

function questionAriaLabel(question: WorksheetQuestion): string {
  if (question.type === "neighbor") {
    return "相邻数 " + question.left + " 待填写 " + question.right;
  }

  if (question.type === "compare") {
    return "比大小 " + question.left + " 待填写 " + question.right;
  }

  const expression = question.third === undefined
    ? question.left + question.operator + question.right
    : question.left + question.operator + question.right + (question.secondOperator ?? "") + question.third;

  return "口算 " + expression + " 等于待填写";
}

function QuestionContent({ question }: { question: WorksheetQuestion }) {
  if (question.type === "neighbor") {
    return (
      <>
        <span>{question.left}</span>
        <span className="math-worksheet-blank" aria-hidden="true" />
        <span>{question.right}</span>
      </>
    );
  }

  if (question.type === "compare") {
    return (
      <>
        <span>{question.left}</span>
        <span className="math-worksheet-blank math-worksheet-blank--symbol" aria-hidden="true" />
        <span>{question.right}</span>
      </>
    );
  }

  return (
    <>
      <span>{question.left}</span>
      <span>{question.operator}</span>
      <span>{question.right}</span>
      {question.third === undefined ? null : (
        <>
          <span>{question.secondOperator}</span>
          <span>{question.third}</span>
        </>
      )}
      <span>=</span>
      <span className="math-worksheet-blank" aria-hidden="true" />
    </>
  );
}

function getColumnGuideQuestion(worksheet: DailyWorksheet): MentalQuestion | undefined {
  const mentalSection = worksheet.sections.find((section) => section.type === "mental");
  const questions = mentalSection?.questions.filter(
    (question): question is MentalQuestion => question.type === "mental" && question.level !== "basic",
  ) ?? [];

  if (worksheet.plan.threeNumberRatio > 0) {
    return questions.find((question) => question.third !== undefined) ?? questions[0];
  }

  return questions[0];
}

function ColumnMethodStack({
  left,
  operator,
  right,
  answer,
}: {
  left: number;
  operator: "+" | "-";
  right: number;
  answer: number;
}) {
  return (
    <div className="math-worksheet-column-guide__stack" aria-hidden="true">
      <div className="math-worksheet-column-guide__row">
        <span />
        <strong>{left}</strong>
      </div>
      <div className="math-worksheet-column-guide__row">
        <span>{operator}</span>
        <strong>{right}</strong>
      </div>
      <div className="math-worksheet-column-guide__rule" />
      <div className="math-worksheet-column-guide__row math-worksheet-column-guide__answer">
        <span />
        <strong>{answer}</strong>
      </div>
    </div>
  );
}

function ColumnMethodGuide({ question, printCopy }: { question: MentalQuestion; printCopy: boolean }) {
  const firstAnswer = question.operator === "+"
    ? question.left + question.right
    : question.left - question.right;
  const isThreeNumber = question.third !== undefined;

  return (
    <div
      className="math-worksheet-column-guide"
      data-testid={printCopy ? undefined : "worksheet-column-guide"}
      aria-label="竖式计算方法提示"
    >
      <div className="math-worksheet-column-guide__copy">
        <span>列式提示</span>
        <strong>{question.third === undefined ? "相同数位对齐" : "连续两步列式"}</strong>
        <small>
          {isThreeNumber
            ? "每一步相同数位对齐，先算前两项，再把得数带入第二步"
            : "个位对齐个位，从个位开始计算"}
        </small>
      </div>
      <div className="math-worksheet-column-guide__example">
        <span>示范</span>
        {isThreeNumber ? (
          <div className="math-worksheet-column-guide__steps" aria-hidden="true">
            <div className="math-worksheet-column-guide__step">
              <span>第 1 步</span>
              <ColumnMethodStack
                left={question.left}
                operator={question.operator}
                right={question.right}
                answer={firstAnswer}
              />
            </div>
            <span className="math-worksheet-column-guide__then">再算</span>
            <div className="math-worksheet-column-guide__step">
              <span>第 2 步</span>
              <ColumnMethodStack
                left={firstAnswer}
                operator={question.secondOperator ?? "+"}
                right={question.third ?? 0}
                answer={question.answer}
              />
            </div>
          </div>
        ) : (
          <ColumnMethodStack
            left={question.left}
            operator={question.operator}
            right={question.right}
            answer={question.answer}
          />
        )}
      </div>
    </div>
  );
}

function WorksheetPaper({ worksheet, printCopy = false }: { worksheet: DailyWorksheet; printCopy?: boolean }) {
  let questionNumber = 0;
  const paperTestId = printCopy ? undefined : "math-worksheet-paper";
  const demoTestId = printCopy ? undefined : "worksheet-demo";
  const demoTitleId = "worksheet-demo-title-" + worksheet.day + (printCopy ? "-print" : "");
  const columnGuideQuestion = getColumnGuideQuestion(worksheet);

  return (
    <article
      className={"math-worksheet-paper" + (printCopy ? " math-worksheet-paper--print-copy" : "")}
      data-testid={paperTestId}
      data-day={worksheet.day}
      aria-label={"第 " + worksheet.day + " 天 A4 数学练习题"}
    >
      <header className="math-worksheet-paper__header">
        <div>
          <span className="math-worksheet-paper__eyebrow">知页 · 30 天学习计划</span>
          <h2>幼小数学练习</h2>
          <p>第 {worksheet.day} 天 · {worksheet.title}</p>
        </div>
        <div className="math-worksheet-paper__fields" aria-label="填写信息">
          <span>姓名 <i aria-hidden="true" /></span>
          <span>日期 <i aria-hidden="true" /></span>
        </div>
      </header>

      <div className="math-worksheet-paper__rule" aria-hidden="true" />

      <section
        className={"math-worksheet-demo" + (worksheet.demos.length === 1 ? " math-worksheet-demo--single" : "")}
        data-testid={demoTestId}
        aria-labelledby={demoTitleId}
      >
        <div className="math-worksheet-demo__lead">
          <span>本日重点</span>
          <strong id={demoTitleId}>{WORKSHEET_THEME_LABELS[worksheet.theme]}</strong>
          <small>{WORKSHEET_THEME_DESCRIPTIONS[worksheet.theme]}</small>
          <p>{worksheet.objective}</p>
        </div>
        <div className="math-worksheet-demo__examples">
          {worksheet.demos.map((demo) => (
            <div className="math-worksheet-demo__example" key={demo.title}>
              <span>{demo.title}</span>
              <strong>{demo.equation}</strong>
              <small>{demo.note}</small>
            </div>
          ))}
          {columnGuideQuestion ? (
            <ColumnMethodGuide question={columnGuideQuestion} printCopy={printCopy} />
          ) : null}
        </div>
      </section>

      <div className="math-worksheet-paper__sections">
        {worksheet.sections.map((section, sectionIndex) => {
          const startNumber = questionNumber + 1;
          questionNumber += section.questions.length;
          const sectionId = "worksheet-section-" + worksheet.day + "-" + section.type + (printCopy ? "-print" : "");

          return (
            <section className="math-worksheet-paper__section" key={section.type} aria-labelledby={sectionId}>
              <header>
                <div>
                  <span className="math-worksheet-paper__section-number">0{sectionIndex + 1}</span>
                  <h3 id={sectionId}>{section.title}</h3>
                </div>
                <span>{section.questions.length} 题</span>
              </header>
              {section.questions.length > 0 ? (
                <ol
                  className={
                    "math-worksheet-paper__questions"
                    + (section.type === "mental" ? " math-worksheet-paper__questions--mental" : "")
                  }
                  start={startNumber}
                >
                  {section.questions.map((question, index) => (
                    <li
                      className={
                        "math-worksheet-paper__question"
                        + (question.type === "mental" && question.third !== undefined
                          ? " math-worksheet-paper__question--three-number"
                          : "")
                      }
                      data-testid={printCopy ? undefined : "math-worksheet-question"}
                      data-method={!printCopy && question.type === "mental" ? question.method : undefined}
                      data-level={!printCopy && question.type === "mental" ? question.level : undefined}
                      aria-label={questionAriaLabel(question)}
                      key={question.id}
                    >
                      <span className="math-worksheet-paper__question-number">{startNumber + index}.</span>
                      <span className="math-worksheet-paper__question-content">
                        <QuestionContent question={question} />
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="math-worksheet-paper__empty">本部分未分配题目</p>
              )}
            </section>
          );
        })}
      </div>

      <footer className="math-worksheet-paper__footer">
        <span>第 {worksheet.day} / {WORKSHEET_PLAN_DAYS} 天 · {worksheet.phaseTitle}</span>
        <span>共 {worksheet.total} 题</span>
      </footer>
    </article>
  );
}

function MathWorksheetWorkspaceContent({ definition }: { definition: ToolDefinition }) {
  const reducedMotion = useReducedMotion();
  const seedRef = useRef(INITIAL_SEED);
  const [selectedDay, setSelectedDay] = useState(1);
  const [plan, setPlan] = useState<WorksheetPlan>(() => generateWorksheetPlan(INITIAL_SEED));
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", text: "30 天连续作业已准备好" });
  const selectedWorksheet = plan.days[selectedDay - 1] ?? plan.days[0];
  const selectedTotal = selectedWorksheet?.total ?? 0;
  const selectedCounts = selectedWorksheet
    ? {
        neighborCount: getSectionCount(selectedWorksheet, "neighbor"),
        compareCount: getSectionCount(selectedWorksheet, "compare"),
        mentalCount: getSectionCount(selectedWorksheet, "mental"),
      }
    : { neighborCount: 0, compareCount: 0, mentalCount: 0 };
  useEffect(() => {
    recordRecentTool(definition.slug);
  }, [definition.slug]);

  const nextSeed = () => {
    seedRef.current += 1;
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
  };

  const rebuildSelectedDay = (overrides: WorksheetDayOverrides, text: string) => {
    const nextWorksheet = generateDailyWorksheet(selectedDay, nextSeed(), overrides);
    replaceSelectedDay(nextWorksheet);
    setStatus({ tone: "success", text });
  };

  const updateCount = (key: CountKey, value: number) => {
    if (!selectedWorksheet) {
      return;
    }

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
      "第 " + selectedDay + " 天题目数量已更新",
    );
  };

  const regenerateDay = () => {
    if (!selectedWorksheet || selectedTotal === 0) {
      setStatus({ tone: "error", text: "请至少保留 1 道题" });
      return;
    }

    rebuildSelectedDay(getWorksheetOverrides(selectedWorksheet), "第 " + selectedDay + " 天已重新出题");
  };

  const regeneratePlan = () => {
    setPlan(generateWorksheetPlan(nextSeed()));
    setStatus({ tone: "success", text: "30 天计划已重新生成，难度结构保持不变" });
  };

  const selectDay = (day: number) => {
    setSelectedDay(day);
    setStatus({ tone: "idle", text: "正在查看第 " + day + " 天" });
  };

  const reset = () => {
    setSelectedDay(1);
    setPlan(generateWorksheetPlan(INITIAL_SEED));
    seedRef.current = INITIAL_SEED;
    setStatus({ tone: "success", text: "已恢复默认 30 天计划" });
  };

  const printPlan = () => {
    if (plan.days.length !== WORKSHEET_PLAN_DAYS || plan.totalQuestions === 0) {
      setStatus({ tone: "error", text: "30 天计划还没有准备完成" });
      return;
    }

    setStatus({ tone: "success", text: "已打开打印窗口，可选择保存为 30 页 PDF" });
    window.print();
  };

  if (!selectedWorksheet) {
    return null;
  }

  return (
    <motion.section
      className="pulse-workbench pulse-workbench--math-worksheet"
      aria-labelledby="tool-title"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: "easeOut" }}
    >
      <header className="pulse-workbench__header">
        <div>
          <div className="pulse-workbench__meta" aria-hidden="true">
            <span>知页 / 工具</span>
            <i />
            <span>{definition.category}</span>
          </div>
          <h1 id="tool-title">{definition.seo.h1}</h1>
          <p>{definition.description}</p>
        </div>
      </header>

      <section className="math-worksheet-layout" aria-label="30 天数学练习生成工作区">
        <aside className="math-worksheet-settings" aria-label="30 天练习设置">
          <header className="math-worksheet-settings__header">
            <div>
              <span>30 天连续作业</span>
              <h2>第 {selectedDay} 天</h2>
            </div>
            <strong className={selectedTotal === MAX_WORKSHEET_QUESTIONS ? "is-complete" : ""}>
              {selectedTotal}<small>/ {MAX_WORKSHEET_QUESTIONS} 题</small>
            </strong>
          </header>

          <section className="math-worksheet-plan-overview" aria-label="计划概览">
            <div>
              <strong>{plan.totalDays}</strong>
              <span>天计划</span>
            </div>
            <div>
              <strong>{plan.totalQuestions}</strong>
              <span>道总题</span>
            </div>
            <div>
              <strong>{WORKSHEET_PHASES.length}</strong>
              <span>个阶段</span>
            </div>
          </section>

          <nav className="math-worksheet-day-nav" aria-label="30 天学习计划">
            <header className="math-worksheet-day-nav__header">
              <div>
                <CalendarDays aria-hidden="true" size={16} strokeWidth={1.8} />
                <span>阶段导航</span>
              </div>
              <small>点击查看当天</small>
            </header>
            <div className="math-worksheet-day-nav__list">
              {WORKSHEET_PHASES.map((phase) => (
                <section className="math-worksheet-day-nav__phase" key={phase.number}>
                  <header>
                    <span>阶段 {phase.number}</span>
                    <strong>{phase.title}</strong>
                    <small>{phase.startDay}-{phase.endDay} 天</small>
                  </header>
                  <div className="math-worksheet-day-nav__days">
                    {phase.days.map((dayBlueprint, index) => {
                      const day = phase.startDay + index;
                      const currentDay = plan.days[day - 1];

                      return (
                        <button
                          type="button"
                          className={day === selectedDay ? "is-current" : ""}
                          key={day}
                          aria-label={"第 " + day + " 天：" + dayBlueprint.title}
                          aria-pressed={day === selectedDay}
                          onClick={() => selectDay(day)}
                          data-testid={"worksheet-day-" + day}
                        >
                          <strong>{String(day).padStart(2, "0")}</strong>
                          <span>{currentDay?.theme ? WORKSHEET_THEME_LABELS[currentDay.theme] : "练习"}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <section className="math-worksheet-settings__group" aria-labelledby="worksheet-count-title">
            <div className="math-worksheet-settings__label">
              <span id="worksheet-count-title">第 {selectedDay} 天题型数量</span>
              <small>总量上限 30 题</small>
            </div>
            <div className="math-worksheet-counts">
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

          <section className="math-worksheet-settings__group" aria-labelledby="worksheet-theme-title">
            <div className="math-worksheet-settings__label">
              <span id="worksheet-theme-title">本日主题</span>
              <small>按 30 天计划安排</small>
            </div>
            <div className="math-worksheet-theme-current" data-testid="worksheet-theme">
              <span>计划主题</span>
              <strong>{WORKSHEET_THEME_LABELS[selectedWorksheet.theme]}</strong>
              <small>{WORKSHEET_THEME_DESCRIPTIONS[selectedWorksheet.theme]}</small>
            </div>
            <p className="math-worksheet-level-note">
              当天口算结果上限 {selectedWorksheet.plan.mentalMax}；
              {selectedWorksheet.plan.threeNumberRatio > 0
                ? "已加入三个数加减混合"
                : selectedWorksheet.plan.binaryTwoDigitRatio > 0
                  ? "逐步加入两位数题"
                  : "先巩固 20 以内基础"}
            </p>
          </section>

          <div className="math-worksheet-actions">
            <button className="math-worksheet-button math-worksheet-button--primary" type="button" onClick={regeneratePlan}>
              <Dices aria-hidden="true" size={17} strokeWidth={1.8} />
              重新生成计划
            </button>
            <button className="math-worksheet-button math-worksheet-button--print" type="button" onClick={printPlan}>
              <Printer aria-hidden="true" size={17} strokeWidth={1.8} />
              导出 30 天 PDF
            </button>
            <button className="math-worksheet-button math-worksheet-button--secondary" type="button" onClick={regenerateDay} disabled={selectedTotal === 0}>
              <ClipboardList aria-hidden="true" size={16} strokeWidth={1.8} />
              本日换一套
            </button>
            <button className="math-worksheet-button math-worksheet-button--quiet" type="button" onClick={reset}>
              <RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />
              恢复默认
            </button>
          </div>

          <div className={"math-worksheet-status math-worksheet-status--" + status.tone} role="status" aria-live="polite">
            {status.tone === "success" ? <Check aria-hidden="true" size={15} strokeWidth={2} /> : null}
            {status.tone === "error" ? <TriangleAlert aria-hidden="true" size={15} strokeWidth={1.8} /> : null}
            <span>{status.text}</span>
          </div>
          <p className="math-worksheet-local"><ShieldCheck aria-hidden="true" size={15} />题目在浏览器本地生成</p>
        </aside>

        <section className="math-worksheet-preview" aria-label="当天 A4 版面预览">
          <header className="math-worksheet-preview__toolbar">
            <div>
              <Calculator aria-hidden="true" size={17} strokeWidth={1.7} />
              <span>第 {selectedDay} 天 · A4 竖版预览</span>
            </div>
            <span>{selectedWorksheet.phaseTitle} · {selectedTotal} 题</span>
          </header>
          <div className="math-worksheet-preview__context" data-testid="worksheet-day-summary">
            <div>
              <span><Target aria-hidden="true" size={14} strokeWidth={1.8} />今日目标</span>
              <strong>{selectedWorksheet.title}</strong>
            </div>
            <p>{selectedWorksheet.objective}</p>
            <small>{selectedWorksheet.phaseSummary}</small>
          </div>
          <WorksheetPaper worksheet={selectedWorksheet} />
        </section>
      </section>

      <div className="math-worksheet-print-pack" aria-label="30 天打印内容">
        {plan.days.map((day) => (
          <WorksheetPaper key={day.day} worksheet={day} printCopy />
        ))}
      </div>
    </motion.section>
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
