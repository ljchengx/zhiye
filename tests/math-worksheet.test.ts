import { describe, expect, it } from "vitest";

import {
  FOUNDATION_WORKSHEET_DAYS,
  generateDailyWorksheet,
  generateWorksheetPlan,
  getExportDays,
  getWorksheetDayPlan,
  MONTH_ONE_DAYS,
  MONTH_TWO_DAYS,
  REINFORCEMENT_WORKSHEET_DAYS,
  WORKSHEET_PLAN_DAYS,
  type BalanceEquationQuestion,
  type EstimateJudgeQuestion,
  type FriendlyCalcQuestion,
} from "../lib/tools/math-worksheet";
import {
  getMathBulkPdfFilename,
  getMathWorkbookPageEntries,
  getMathWorkbookPrintPageCount,
} from "../lib/tools/math-pdf";
import { NUMBER_SENSE_PARENT_USAGE } from "../lib/tools/math-number-sense";

function allQuestions(worksheet: ReturnType<typeof generateDailyWorksheet>) {
  return worksheet.sections.flatMap((section) => section.questions);
}

describe("数感 60 天练习计划（5～6 岁）", () => {
  it("第一个月 30 天、第二个月 30 天，无旧版基础引导分段", () => {
    const plan = generateWorksheetPlan(42);
    expect(FOUNDATION_WORKSHEET_DAYS).toBe(0);
    expect(REINFORCEMENT_WORKSHEET_DAYS).toBe(30);
    expect(plan.foundationDays).toHaveLength(0);
    expect(plan.reinforcementDays).toHaveLength(30);
    expect(plan.monthOneDays).toHaveLength(MONTH_ONE_DAYS);
    expect(plan.monthTwoDays).toHaveLength(MONTH_TWO_DAYS);
    expect(plan.days).toHaveLength(WORKSHEET_PLAN_DAYS);
    expect(plan.days.every((day) => !day.methodLesson)).toBe(true);
    expect(plan.days.every((day) => day.pages.every((page) => !page.showMethod))).toBe(true);
  });

  it("每日题量控制在数感对话范围（约 4～12 题）", () => {
    const plan = generateWorksheetPlan(7);
    plan.days.forEach((day) => {
      expect(day.total).toBeGreaterThanOrEqual(3);
      expect(day.total).toBeLessThanOrEqual(14);
    });
  });

  it("核心板块包含天平、代换、凑整或估算", () => {
    const day = generateDailyWorksheet(3, 99);
    const types = new Set(day.sections.map((section) => section.type));
    expect(types.has("balance")).toBe(true);
    expect(types.has("symbol") || types.has("estimate") || types.has("friendly-calc")).toBe(true);
  });

  it("第 7 天与第 14 天附带聪明格", () => {
    const weekA = generateDailyWorksheet(7, 1);
    const weekB = generateDailyWorksheet(14, 1);
    expect(weekA.sections.some((section) => section.type === "kenken")).toBe(true);
    expect(weekB.sections.some((section) => section.type === "kenken")).toBe(true);
  });

  it("天平等量与凑整题答案自洽", () => {
    const plan = generateWorksheetPlan(2026);
    const balances = plan.days.flatMap(allQuestions).filter((q): q is BalanceEquationQuestion => q.type === "balance-equation");
    const friendly = plan.days.flatMap(allQuestions).filter((q): q is FriendlyCalcQuestion => q.type === "friendly-calc");
    expect(balances.length).toBeGreaterThan(10);
    expect(friendly.length).toBeGreaterThan(10);
    balances.forEach((question) => {
      expect(question.expression).toContain("□");
      expect(Number.isInteger(question.answer)).toBe(true);
    });
    friendly.forEach((question) => {
      expect(question.hint.length).toBeGreaterThan(0);
      expect(Number.isInteger(question.answer)).toBe(true);
    });
  });

  it("估算题带参考理由", () => {
    const estimates = generateWorksheetPlan(1).days.flatMap(allQuestions).filter((q): q is EstimateJudgeQuestion => q.type === "estimate-judge");
    expect(estimates.length).toBeGreaterThan(20);
    estimates.forEach((question) => {
      expect(question.statement.length).toBeGreaterThan(3);
      expect(question.reason.length).toBeGreaterThan(2);
    });
  });

  it("60 天不含口算、竖式、旧应用题板块", () => {
    const forbidden = new Set(["mental", "vertical", "application", "grouping", "neighbor", "tens-split", "guided"]);
    const plan = generateWorksheetPlan(3);
    plan.days.forEach((day) => {
      day.sections.forEach((section) => {
        expect(forbidden.has(section.type)).toBe(false);
      });
    });
  });

  it("第二个月以图形代换与情境思考为主", () => {
    const monthTwo = generateWorksheetPlan(3).monthTwoDays;
    const hasStory = monthTwo.some((day) => day.sections.some((section) => section.type === "story"));
    const hasSymbol = monthTwo.some((day) => day.sections.some((section) => section.type === "symbol"));
    expect(hasStory || hasSymbol).toBe(true);
  });

  it("每日练习含家长提示", () => {
    const day = generateDailyWorksheet(12, 3);
    expect(day.parentTip).toBeTruthy();
    expect(NUMBER_SENSE_PARENT_USAGE.length).toBeGreaterThan(10);
  });

  it("重新生成同一天会换题但结构稳定", () => {
    const a = generateDailyWorksheet(8, 11);
    const b = generateDailyWorksheet(8, 987654);
    expect(a.sections.map((section) => [section.type, section.questions.length])).toEqual(
      b.sections.map((section) => [section.type, section.questions.length]),
    );
    const idsA = allQuestions(a).map((question) => question.id);
    const idsB = allQuestions(b).map((question) => question.id);
    expect(idsA).not.toEqual(idsB);
  });

  it("导出范围与 60 天顺序", () => {
    const plan = generateWorksheetPlan(5);
    expect(getExportDays(plan, "month-one")).toHaveLength(30);
    expect(getExportDays(plan, "month-two")).toHaveLength(30);
    expect(getExportDays(plan, "all")).toHaveLength(60);
    expect(getExportDays(plan, true)).toHaveLength(30);
  });

  it("分页与 PDF 页数可计算", () => {
    const plan = generateWorksheetPlan(11);
    plan.days.forEach((day) => {
      expect(day.pages.length).toBeGreaterThanOrEqual(1);
      expect(getMathWorkbookPrintPageCount([day])).toBeGreaterThanOrEqual(day.pages.length);
    });
    const entries = getMathWorkbookPageEntries(plan.monthOneDays.slice(0, 3));
    expect(entries.length).toBeGreaterThan(0);
    expect(getMathBulkPdfFilename("month-one")).toMatch(/第1个月/);
  });
});
