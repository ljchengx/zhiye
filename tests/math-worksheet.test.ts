import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKSHEET_CONFIG,
  generateDailyWorksheet,
  generateWorksheet,
  generateWorksheetPlan,
  getWorksheetDayPlan,
  MENTAL_METHODS,
  normalizeWorksheetConfig,
} from "../lib/tools/math-worksheet";

describe("幼小数学练习生成", () => {
  it("按默认配置生成三部分共 30 题", () => {
    const worksheet = generateWorksheet(DEFAULT_WORKSHEET_CONFIG, 42);

    expect(worksheet.total).toBe(30);
    expect(worksheet.sections.map((section) => section.title)).toEqual(["相邻数", "比大小", "口算"]);
    expect(worksheet.sections.map((section) => section.questions.length)).toEqual([8, 8, 14]);
  });

  it("相邻数题目会在两个数字之间保留正确的中间数", () => {
    const worksheet = generateWorksheet({ ...DEFAULT_WORKSHEET_CONFIG, compareCount: 0, mentalCount: 0 }, 7);
    const questions = worksheet.sections[0].questions;

    expect(questions).toHaveLength(8);
    questions.forEach((question) => {
      expect(question.type).toBe("neighbor");
      if (question.type === "neighbor") {
        expect(question.right - question.left).toBe(2);
        expect(question.answer).toBe(question.left + 1);
      }
    });
  });

  it("比大小题目覆盖等于并且答案与数字关系一致", () => {
    const worksheet = generateWorksheet({ ...DEFAULT_WORKSHEET_CONFIG, neighborCount: 0, mentalCount: 0 }, 9);
    const questions = worksheet.sections[1].questions;

    expect(questions.some((question) => question.type === "compare" && question.left === question.right)).toBe(true);
    questions.forEach((question) => {
      if (question.type === "compare") {
        const expected = question.left < question.right ? "<" : question.left > question.right ? ">" : "=";
        expect(question.answer).toBe(expected);
      }
    });
  });

  it("默认主题是凑十法，口算题围绕当前主题生成", () => {
    const worksheet = generateWorksheet(DEFAULT_WORKSHEET_CONFIG, 21);
    const questions = worksheet.sections[2].questions;
    const methods = new Set(questions.filter((question) => question.type === "mental").map((question) => question.method));
    const expressions = questions
      .filter((question) => question.type === "mental")
      .map((question) => question.left + question.operator + question.right);

    expect(worksheet.theme).toBe("make-ten");
    expect(worksheet.demos[0].equation).toContain("9 + 4");
    expect(methods).toEqual(new Set(["make-ten"]));
    expect(questions.filter((question) => question.type === "mental" && question.level === "basic")).toHaveLength(7);
    expect(questions.filter((question) => question.type === "mental" && question.level === "two-digit")).toHaveLength(7);
    expect(new Set(expressions).size).toBe(expressions.length);
    questions.forEach((question) => {
      if (question.type === "mental") {
        expect(question.operator).toBe("+");
        expect(question.left + question.right).toBeLessThanOrEqual(100);
        if (question.level === "basic") {
          expect(question.left).toBeLessThan(10);
          expect(question.right).toBeLessThan(10);
        } else {
          expect(question.left).toBeGreaterThanOrEqual(10);
          expect(question.right).toBeGreaterThanOrEqual(10);
        }
        expect(question.answer).toBe(question.operator === "+" ? question.left + question.right : question.left - question.right);
      }
    });
  });

  it("前四期分别使用一种方法，第五期起混合四种方法", () => {
    const expectedThemes = ["make-ten", "break-ten", "flat-ten", "think-addition"] as const;

    expectedThemes.forEach((theme) => {
      const worksheet = generateWorksheet({ ...DEFAULT_WORKSHEET_CONFIG, theme }, 31);
      const methods = new Set(worksheet.sections[2].questions.map((question) => question.type === "mental" ? question.method : ""));

      expect(worksheet.theme).toBe(theme);
      expect(methods).toEqual(new Set([theme]));
      worksheet.sections[2].questions.forEach((question) => {
        if (question.type === "mental") {
          expect(question.answer).toBe(question.operator === "+" ? question.left + question.right : question.left - question.right);
          expect(question.left).toBeLessThanOrEqual(100);
          expect(question.right).toBeLessThanOrEqual(100);
          expect(question.answer).toBeLessThanOrEqual(100);
        }
      });
    });

    const mixedWorksheet = generateWorksheet({ ...DEFAULT_WORKSHEET_CONFIG, theme: "mixed" }, 32);
    const mixedMethods = new Set(mixedWorksheet.sections[2].questions.map((question) => question.type === "mental" ? question.method : ""));
    expect(mixedMethods).toEqual(new Set(MENTAL_METHODS));
    expect(mixedWorksheet.demos).toHaveLength(4);
  });

  it("会把超出上限的题量压回 30 题以内", () => {
    const config = normalizeWorksheetConfig({
      neighborCount: 30,
      compareCount: 30,
      mentalCount: 30,
      theme: "mixed",
    });

    expect(config.neighborCount + config.compareCount + config.mentalCount).toBeLessThanOrEqual(30);
    expect(config.theme).toBe("mixed");
  });

  it("会生成 30 天连续计划，并保持每天一张且总量不超过 30 题", () => {
    const plan = generateWorksheetPlan(20260831);

    expect(plan.totalDays).toBe(30);
    expect(plan.days).toHaveLength(30);
    expect(plan.totalQuestions).toBe(plan.days.reduce((sum, day) => sum + day.total, 0));
    plan.days.forEach((day) => {
      const blueprint = getWorksheetDayPlan(day.day);

      expect(day.total).toBeLessThanOrEqual(30);
      expect(day.total).toBe(blueprint.neighborCount + blueprint.compareCount + blueprint.mentalCount);
      expect(day.phase).toBe(blueprint.phase);
      expect(day.title).toBe(blueprint.title);
    });
  });

  it("会按阶段扩大数值范围，并在后期加入三个数加减混合", () => {
    const dayOne = generateDailyWorksheet(1, 12);
    const dayTen = generateDailyWorksheet(10, 12);
    const dayFifteen = generateDailyWorksheet(15, 12);
    const dayTwentyOne = generateDailyWorksheet(21, 12);
    const dayThirty = generateDailyWorksheet(30, 12);

    expect(dayOne.plan.mentalMax).toBe(20);
    expect(dayTen.plan.mentalMax).toBe(50);
    expect(dayFifteen.plan.mentalMax).toBe(100);
    expect(dayTwentyOne.plan.threeNumberRatio).toBeGreaterThan(0);
    expect(dayTwentyOne.sections[2].questions.some((question) => question.type === "mental" && question.third !== undefined)).toBe(true);
    expect(dayThirty.plan.mentalMax).toBe(200);

    dayThirty.sections[2].questions.forEach((question) => {
      if (question.type !== "mental") {
        return;
      }

      expect(question.answer).toBeLessThanOrEqual(200);
      if (question.third !== undefined) {
        const intermediate = question.left + (question.operator === "+" ? question.right : -question.right);
        const answer = intermediate + (question.secondOperator === "+" ? question.third : -question.third);

        expect(intermediate).toBeGreaterThanOrEqual(0);
        expect(answer).toBeGreaterThanOrEqual(0);
        expect(answer).toBe(question.answer);
      }
    });
  });

  it("三数题会把第三个数字和第二个运算符纳入题目表达式", () => {
    const worksheet = generateDailyWorksheet(30, 18);
    const questions = worksheet.sections[2].questions.filter(
      (question) => question.type === "mental" && question.third !== undefined,
    );

    expect(questions).toHaveLength(20);
    expect(new Set(questions.map((question) => question.type === "mental"
      ? question.left + question.operator + question.right + question.secondOperator + question.third
      : "")).size).toBe(questions.length);
  });
});
