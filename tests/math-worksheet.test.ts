import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKSHEET_CONFIG,
  generateDailyWorksheet,
  generateWorksheet,
  generateWorksheetPlan,
  getWorksheetDayPlan,
  MENTAL_METHODS,
  normalizeWorksheetConfig,
  type MentalQuestion,
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

  it("三种方法可以单独练习，混合主题只使用这三种方法", () => {
    const expectedThemes = ["make-ten", "break-ten", "flat-ten"] as const;

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
    expect(mixedWorksheet.demos).toHaveLength(3);
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

    expect(plan.days.slice(0, 10).map((day) => day.total)).toEqual(Array.from({ length: 10 }, () => 28));
    plan.days.forEach((day) => {
      expect(day.sections[2].questions.some((question) => question.type === "mental" && question.third !== undefined)).toBe(true);
    });
  });

  it("前 8 天保持引导主题，并混入两位数和三数挑战题", () => {
    for (let day = 1; day <= 8; day += 1) {
      const worksheet = generateDailyWorksheet(day, 100 + day);
      const mentalQuestions = worksheet.sections[2].questions.filter((question) => question.type === "mental");
      const twoDigitQuestions = mentalQuestions.filter((question) => question.level === "two-digit-single");
      const threeNumberQuestions = mentalQuestions.filter((question) => question.third !== undefined);
      const binaryCount = mentalQuestions.length - Math.round(mentalQuestions.length * worksheet.plan.threeNumberRatio);

      expect(worksheet.plan.threeNumberRatio).toBeGreaterThan(0);
      expect(mentalQuestions).toHaveLength(worksheet.plan.mentalCount);
      expect(threeNumberQuestions).toHaveLength(Math.round(mentalQuestions.length * worksheet.plan.threeNumberRatio));
      expect(twoDigitQuestions).toHaveLength(Math.round(binaryCount * worksheet.plan.binaryTwoDigitRatio));
    }
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

  it("口算题按难度递增排列，三数题集中放在最后", () => {
    const levelOrder: Record<string, number> = {
      basic: 0,
      "two-digit-single": 1,
      "two-digit": 2,
      "three-number": 3,
    };
    const dayOneLevels = generateDailyWorksheet(1, 22).sections[2].questions.map((question) => (
      question.type === "mental" ? question.level : ""
    ));
    const dayEightLevels = generateDailyWorksheet(8, 22).sections[2].questions.map((question) => (
      question.type === "mental" ? question.level : ""
    ));
    const dayTwentyFourQuestions = generateDailyWorksheet(24, 22).sections[2].questions.filter(
      (question) => question.type === "mental",
    );
    const dayTwentyFourScores = dayTwentyFourQuestions.map((question) => {
      const level = question.level === "three-number" ? 3 : levelOrder[question.level];
      const terms = [question.left, question.right, question.third].filter(
        (term): term is number => term !== undefined,
      );
      return level + (question.level === "three-number" ? terms.filter((term) => term >= 10).length : 0);
    });

    expect(dayOneLevels).toEqual([
      ...Array.from({ length: 8 }, () => "basic"),
      ...Array.from({ length: 2 }, () => "two-digit-single"),
      ...Array.from({ length: 4 }, () => "three-number"),
    ]);
    expect(dayEightLevels.slice(0, 5).every((level) => level === "basic")).toBe(true);
    expect(dayEightLevels[5]).toBe("two-digit-single");
    expect(dayEightLevels.slice(6).every((level) => level === "three-number")).toBe(true);
    expect(dayEightLevels.map((level) => levelOrder[level])).toEqual(
      [...dayEightLevels].map((level) => levelOrder[level]).sort((left, right) => left - right),
    );
    expect(dayTwentyFourScores).toEqual([...dayTwentyFourScores].sort((left, right) => left - right));
  });

  it("三数题会把第三个数字和第二个运算符纳入题目表达式", () => {
    const worksheet = generateDailyWorksheet(30, 18);
    const questions = worksheet.sections[2].questions.filter(
      (question) => question.type === "mental" && question.third !== undefined,
    );

    expect(questions).toHaveLength(16);
    expect(new Set(questions.map((question) => question.type === "mental"
      ? question.left + question.operator + question.right + question.secondOperator + question.third
      : "")).size).toBe(questions.length);
  });

  it("会根据内容自动生成一到两页，并保留完整题目和连续题号", () => {
    const plan = generateWorksheetPlan(20260831);

    plan.days.forEach((worksheet) => {
      const allQuestions = worksheet.sections.flatMap((section) => section.questions);
      const pageQuestions = worksheet.pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
      const allIds = new Set(allQuestions.map((question) => question.id));
      const pagedIds = new Set(pageQuestions.map((question) => question.id));
      const numbers = pageQuestions.map((question) => question.number);

      expect(worksheet.pages.length).toBeGreaterThanOrEqual(1);
      expect(worksheet.pages.length).toBeLessThanOrEqual(2);
      expect(worksheet.pages.reduce((sum, page) => sum + page.questionCount, 0)).toBe(worksheet.total);
      expect(worksheet.pages.every((page) => page.questionCount > 0 && page.usedHeightMm <= 252)).toBe(true);
      expect(worksheet.pages.map((page) => page.pageNumber)).toEqual(
        Array.from({ length: worksheet.pages.length }, (_, index) => index + 1),
      );
      expect(worksheet.pages.every((page) => page.pageCount === worksheet.pages.length)).toBe(true);
      expect(allIds.size).toBe(allQuestions.length);
      expect(pagedIds).toEqual(allIds);
      expect(numbers).toEqual(Array.from({ length: worksheet.total }, (_, index) => index + 1));

      const displayedMental = pageQuestions.filter((question): question is MentalQuestion => question.type === "mental");
      const firstThreeNumberIndex = displayedMental.findIndex((question) => question.third !== undefined);
      if (firstThreeNumberIndex >= 0) {
        expect(displayedMental.slice(firstThreeNumberIndex).every((question) => question.third !== undefined)).toBe(true);
      }
    });

    const totalPages = plan.days.reduce((sum, worksheet) => sum + worksheet.pages.length, 0);
    expect(totalPages).toBeGreaterThanOrEqual(30);
    expect(totalPages).toBeLessThan(60);
  });

  it("图示引导题的拆分和先算、再算步骤都能还原原题答案", () => {
    const guidedWorksheets = [1, 4, 5, 8, 10].map((day) => generateDailyWorksheet(day, 700 + day));
    let guidedCount = 0;

    guidedWorksheets.forEach((worksheet) => {
      const guidedQuestions = worksheet.pages
        .flatMap((page) => page.sections)
        .flatMap((section) => section.questions)
        .filter((question): question is MentalQuestion => question.type === "mental" && question.presentation === "guided");

      expect(guidedQuestions).toHaveLength(2);
      guidedQuestions.forEach((question) => {
          if (question.type !== "mental") {
            return;
          }

          guidedCount += 1;
          expect(question.guidance).toBeDefined();

          if (!question.guidance) {
            return;
          }

          expect(question.guidance.split[0] + question.guidance.split[1]).toBe(question.guidance.splitSource);
          expect(question.guidance.steps).toHaveLength(2);
          question.guidance.steps.forEach((step) => {
            const expected = step.operator === "+" ? step.left + step.right : step.left - step.right;
            expect(step.answer).toBe(expected);
          });

          const [firstStep, secondStep] = question.guidance.steps;
          expect(secondStep.answer).toBe(question.answer);
          expect(firstStep.answer).not.toBeUndefined();

          if (question.method === "break-ten" && question.level === "two-digit-single") {
            const baseTen = Math.floor(question.left / 10) * 10;
            expect(question.guidance.split).toEqual([baseTen, question.left - baseTen]);
            expect(firstStep.left).toBe(baseTen);
            expect(secondStep.left).toBe(firstStep.answer);
          }
      });
    });

    expect(guidedCount).toBe(10);
  });

  it("方法示例和图示题只出现在计划规定的阶段", () => {
    for (let day = 1; day <= 30; day += 1) {
      const worksheet = generateDailyWorksheet(day, 900 + day);
      const guidedQuestions = worksheet.pages
        .flatMap((page) => page.sections)
        .flatMap((section) => section.questions)
        .filter((question): question is MentalQuestion => question.type === "mental" && question.presentation === "guided");

      expect(guidedQuestions.every((question) => question.type !== "mental" || MENTAL_METHODS.includes(question.method))).toBe(true);
      if (day <= 10) {
        expect(guidedQuestions).toHaveLength(2);
      } else {
        expect(guidedQuestions).toHaveLength(0);
      }
      if (day <= 10 && worksheet.theme !== "mixed") {
        expect(new Set(guidedQuestions.map((question) => question.type === "mental" ? question.method : "")))
          .toEqual(new Set([worksheet.theme]));
      }

      expect(worksheet.pages[0].showMethod).toBe(day <= 5 || (day >= 11 && day <= 18));
      expect(worksheet.pages.slice(1).every((page) => !page.showMethod)).toBe(true);
    }
  });
});
