import { describe, expect, it } from "vitest";

import {
  DEFAULT_REINFORCEMENT_CONFIG,
  FOUNDATION_WORKSHEET_DAYS,
  generateDailyWorksheet,
  generateWorksheetPlan,
  getExportDays,
  getReinforcementQuestionCounts,
  getWorksheetDayPlan,
  MAX_APPLICATION_QUESTIONS,
  MAX_WORKSHEET_QUESTIONS,
  normalizeReinforcementConfig,
  REINFORCEMENT_WORKSHEET_DAYS,
  type ApplicationQuestion,
  type MentalQuestion,
} from "../lib/tools/math-worksheet";

function allQuestions(worksheet: ReturnType<typeof generateDailyWorksheet>) {
  return worksheet.sections.flatMap((section) => section.questions);
}

function mentalQuestions(worksheet: ReturnType<typeof generateDailyWorksheet>) {
  return allQuestions(worksheet).filter((question): question is MentalQuestion => question.type === "mental");
}

function calculate(left: number, operator: "+" | "-", right: number) {
  return operator === "+" ? left + right : left - right;
}

describe("幼小数学 5 天基础学习 + 25 天强化训练", () => {
  it("基础五天使用固定精选内容，并保持每天 28 题", () => {
    const first = generateWorksheetPlan(1);
    const second = generateWorksheetPlan(999);

    expect(first.foundationDays).toHaveLength(FOUNDATION_WORKSHEET_DAYS);
    expect(first.foundationDays.map((day) => day.total)).toEqual([28, 28, 28, 28, 28]);
    expect(first.foundationDays.map((day) => day.id)).toEqual([
      "foundation-1", "foundation-2", "foundation-3", "foundation-4", "foundation-5",
    ]);
    expect(first.foundationDays.map((day) => day.sections.map((section) => [section.type, section.questions.length]))).toEqual(
      second.foundationDays.map((day) => day.sections.map((section) => [section.type, section.questions.length])),
    );
    expect(first.foundationDays[0].methodLesson?.method).toBe("number-bond");
    expect(first.foundationDays[1].methodLesson?.method).toBe("make-ten");
    expect(first.foundationDays[2].methodLesson?.method).toBe("break-ten");
    expect(first.foundationDays[3].methodLesson?.method).toBe("flat-ten");
    expect(first.foundationDays[4].methodLesson?.method).toBe("picture-equation");
    expect(first.foundationDays.every((day) => day.pages[0]?.showMethod)).toBe(true);
    expect(first.reinforcementDays.every((day) => day.pages.every((page) => !page.showMethod))).toBe(true);
    expect(first.foundationDays[4].sections.find((section) => section.type === "application")?.questions).toHaveLength(8);
  });

  it("固定基础方法的拆分和每一步都能还原答案", () => {
    const plan = generateWorksheetPlan(42);
    plan.foundationDays.forEach((day) => {
      const lesson = day.methodLesson;
      expect(lesson).toBeDefined();
      if (!lesson) return;
      expect(calculate(lesson.original.left, lesson.original.operator, lesson.original.right)).toBe(lesson.original.answer);
      expect(lesson.split[0] + lesson.split[1]).toBe(lesson.splitSource);
      lesson.steps.forEach((step) => {
        expect(step.answer).toBe(calculate(step.left, step.operator, step.right));
      });

      if (lesson.method === "make-ten") {
        expect(lesson.splitSource).toBe(lesson.original.right);
        expect(lesson.steps[0]).toMatchObject({ left: lesson.original.left, operator: "+", right: lesson.split[0] });
        expect(lesson.steps[1]).toMatchObject({ left: lesson.steps[0].answer, operator: "+", right: lesson.split[1], answer: lesson.original.answer });
      } else if (lesson.method === "break-ten") {
        expect(lesson.splitSource).toBe(lesson.original.left);
        expect(lesson.steps[0]).toMatchObject({ left: lesson.split[0], operator: "-", right: lesson.original.right });
        expect(lesson.steps[1]).toMatchObject({ left: lesson.steps[0].answer, operator: "+", right: lesson.split[1], answer: lesson.original.answer });
      } else if (lesson.method === "flat-ten") {
        expect(lesson.splitSource).toBe(lesson.original.right);
        expect(lesson.steps[0]).toMatchObject({ left: lesson.original.left, operator: "-", right: lesson.split[0] });
        expect(lesson.steps[1]).toMatchObject({ left: lesson.steps[0].answer, operator: "-", right: lesson.split[1], answer: lesson.original.answer });
      }
    });
  });

  it("基础五天的数量图与题目数字始终一致", () => {
    const plan = generateWorksheetPlan(20260902);
    const numberBonds = allQuestions(plan.foundationDays[0]).filter((question) => question.type === "number-bond");
    expect(numberBonds).toHaveLength(20);
    numberBonds.forEach((question) => {
      expect(question.knownPart + question.answer).toBe(question.whole);
    });

    const pictureEquations = allQuestions(plan.foundationDays[4]).filter((question) => question.type === "picture-equation");
    expect(pictureEquations).toHaveLength(6);
    pictureEquations.forEach((question) => {
      expect(calculate(question.leftCount, question.operator, question.rightCount)).toBe(question.answer);
    });

    plan.foundationDays.slice(1, 4).forEach((day) => {
      const guidedQuestions = mentalQuestions(day).filter((question) => question.presentation === "guided");
      expect(guidedQuestions).toHaveLength(2);
      guidedQuestions.forEach((question) => {
        const guidance = question.guidance;
        expect(guidance).toBeDefined();
        if (!guidance) return;
        expect(calculate(question.left, question.operator, question.right)).toBe(question.answer);
        expect(guidance.split[0] + guidance.split[1]).toBe(guidance.splitSource);
        guidance.steps.forEach((step) => expect(calculate(step.left, step.operator, step.right)).toBe(step.answer));
        expect(guidance.steps[1].answer).toBe(question.answer);

        if (question.method === "make-ten") {
          expect(guidance.splitSource).toBe(question.right);
          expect(guidance.steps[0]).toMatchObject({ left: question.left, operator: "+", right: guidance.split[0] });
          expect(guidance.steps[1]).toMatchObject({ left: guidance.steps[0].answer, operator: "+", right: guidance.split[1] });
        } else if (question.method === "break-ten") {
          expect(guidance.splitSource).toBe(question.left);
          expect(guidance.steps[0]).toMatchObject({ left: guidance.split[0], operator: "-", right: question.right });
          expect(guidance.steps[1]).toMatchObject({ left: guidance.steps[0].answer, operator: "+", right: guidance.split[1] });
        } else {
          expect(guidance.splitSource).toBe(question.right);
          expect(guidance.steps[0]).toMatchObject({ left: question.left, operator: "-", right: guidance.split[0] });
          expect(guidance.steps[1]).toMatchObject({ left: guidance.steps[0].answer, operator: "-", right: guidance.split[1] });
        }
      });
    });
  });

  it("强化配置限制在 10～30 题，应用题最多 25%", () => {
    const normalized = normalizeReinforcementConfig({ dailyQuestionCount: 99, neighborRatio: 80, compareRatio: 50, applicationRatio: 90 });
    expect(normalized.dailyQuestionCount).toBe(30);
    expect(normalized.applicationRatio).toBeLessThanOrEqual(25);
    expect(normalized.neighborRatio + normalized.compareRatio + normalized.applicationRatio + normalized.mentalRatio).toBe(100);
    const counts = getReinforcementQuestionCounts(DEFAULT_REINFORCEMENT_CONFIG, 1);
    expect(counts.neighbor + counts.compare + counts.mental + counts.application).toBe(30);
    expect(counts.application).toBeLessThanOrEqual(MAX_APPLICATION_QUESTIONS);
  });

  it("统一配置应用到全部 25 天，题型数量准确且不超过 30", () => {
    const config = { dailyQuestionCount: 28, neighborRatio: 15, compareRatio: 15, applicationRatio: 20 };
    const plan = generateWorksheetPlan(20260902, config);
    expect(plan.days).toHaveLength(FOUNDATION_WORKSHEET_DAYS + REINFORCEMENT_WORKSHEET_DAYS);
    expect(plan.reinforcementDays).toHaveLength(REINFORCEMENT_WORKSHEET_DAYS);
    plan.reinforcementDays.forEach((day) => {
      const questions = allQuestions(day);
      const counts = getReinforcementQuestionCounts(plan.reinforcementConfig, day.stageDay);
      expect(day.total).toBe(28);
      expect(day.total).toBeLessThanOrEqual(MAX_WORKSHEET_QUESTIONS);
      expect(questions.filter((question) => question.type === "neighbor")).toHaveLength(counts.neighbor);
      expect(questions.filter((question) => question.type === "compare")).toHaveLength(counts.compare);
      expect(questions.filter((question) => question.type === "mental")).toHaveLength(counts.mental);
      expect(questions.filter((question) => question.type === "application")).toHaveLength(counts.application);
      expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
      const pageQuestions = day.pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
      expect(pageQuestions.map((question) => question.number)).toEqual(Array.from({ length: 28 }, (_, index) => index + 1));
    });
  });

  it("强化题按阶段递进，并在早期保留挑战题", () => {
    const day1 = generateDailyWorksheet(6, 12);
    const day10 = generateDailyWorksheet(15, 12);
    const day20 = generateDailyWorksheet(25, 12);
    const day30 = generateDailyWorksheet(30, 12);

    expect(day1.plan.resultMax).toBe(20);
    expect(day10.plan.resultMax).toBe(50);
    expect(day20.plan.resultMax).toBe(100);
    expect(day30.plan.resultMax).toBe(200);
    expect(mentalQuestions(day1).some((question) => question.level === "three-number")).toBe(true);
    expect(mentalQuestions(day30).every((question) => question.third !== undefined)).toBe(true);
    mentalQuestions(day30).forEach((question) => {
      expect(question.answer).toBeLessThanOrEqual(200);
      if (question.third !== undefined) {
        const intermediate = question.left + (question.operator === "+" ? question.right : -question.right);
        const answer = intermediate + (question.secondOperator === "+" ? question.third : -(question.third ?? 0));
        expect(intermediate).toBeGreaterThanOrEqual(0);
        expect(answer).toBe(question.answer);
      }
    });
  });

  it("应用题的文字情境、步骤和答案保持一致", () => {
    const plan = generateWorksheetPlan(77);
    const applications = plan.reinforcementDays.flatMap((day) => allQuestions(day)).filter((question): question is ApplicationQuestion => question.type === "application");
    expect(applications.length).toBeGreaterThan(0);
    applications.forEach((question) => {
      expect(question.prompt).not.toContain("undefined");
      expect(question.prompt).not.toContain("比它少");
      expect(question.steps.length).toBe(question.level === "two-step" ? 2 : 1);
      const last = question.steps[question.steps.length - 1];
      expect(last.answer).toBe(question.answer);
      expect(question.equation).toContain("=");
      expect(question.answer).toBeGreaterThanOrEqual(0);
    });
    plan.days.forEach((day) => {
      const dailyApplications = allQuestions(day).filter((question): question is ApplicationQuestion => question.type === "application");
      const promptPatterns = dailyApplications.map((question) => question.prompt.replace(/\d+/g, "#"));
      expect(new Set(promptPatterns).size).toBe(promptPatterns.length);
      day.pages.flatMap((page) => page.sections).filter((section) => section.type === "application").forEach((section) => {
        expect(section.columns).toBe(1);
        expect(section.rowHeightMm).toBeGreaterThanOrEqual(30);
        expect(section.rowHeightMm).toBeLessThanOrEqual(39);
      });
    });
    expect(applications.some((question) => /马里奥|路易吉|蘑菇|金币/.test(question.prompt))).toBe(true);
    expect(applications.some((question) => /书架|气球|饼干|花圃|球筐/.test(question.prompt))).toBe(true);
    expect(new Set(applications.map((question) => question.icon)).size).toBeGreaterThanOrEqual(8);
    expect(plan.reinforcementDays[0].sections.find((section) => section.type === "application")?.questions.every((question) => question.type === "application" && question.level !== "two-step")).toBe(true);
    expect(plan.reinforcementDays[20].sections.find((section) => section.type === "application")?.questions.some((question) => question.type === "application" && question.level === "two-step")).toBe(true);
  });

  it("分页保持完整题目顺序，并合理利用第二页", () => {
    const plan = generateWorksheetPlan(20260902);
    plan.days.forEach((day) => {
      const questions = day.pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
      expect(day.pages.length).toBeGreaterThanOrEqual(1);
      expect(day.pages.length).toBeLessThanOrEqual(2);
      expect(day.pages.every((page) => page.usedHeightMm <= 252)).toBe(true);
      if (day.pages.length === 2) expect(day.pages[1].usedHeightMm).toBeGreaterThanOrEqual(110);
      expect(questions.map((question) => question.number)).toEqual(Array.from({ length: day.total }, (_, index) => index + 1));
      const mental = questions.filter((question): question is MentalQuestion => question.type === "mental");
      const firstTriple = mental.findIndex((question) => question.third !== undefined);
      if (firstTriple >= 0) expect(mental.slice(firstTriple).every((question) => question.third !== undefined)).toBe(true);
      day.pages.flatMap((page) => page.sections).filter((section) => section.type === "mental").forEach((section) => {
        const levels = section.questions.filter((question): question is MentalQuestion => question.type === "mental").map((question) => question.level);
        if (section.columns === 3) expect(levels.every((level) => level === "basic" || level === "two-digit-single")).toBe(true);
      });
      const directMentalSections = day.pages.flatMap((page) => page.sections).filter((section) => section.type === "mental");
      const hasComplexQuestion = mental.some((question) => question.level === "two-digit" || question.level === "three-number");
      if (hasComplexQuestion) expect(directMentalSections.every((section) => section.columns === 2)).toBe(true);
    });
  });

  it("是否包含基础学习只影响导出筛选，不改变强化题", () => {
    const plan = generateWorksheetPlan(20260902);
    const withFoundation = getExportDays(plan, true);
    const practiceOnly = getExportDays(plan, false);
    expect(withFoundation).toHaveLength(30);
    expect(practiceOnly).toHaveLength(25);
    expect(practiceOnly[0].id).toBe("practice-1");
    expect(practiceOnly.map((day) => day.id)).toEqual(plan.reinforcementDays.map((day) => day.id));
    expect(practiceOnly.flatMap((day) => allQuestions(day)).map((question) => question.id)).toEqual(plan.reinforcementDays.flatMap((day) => allQuestions(day)).map((question) => question.id));
  });

  it("保留旧的单日生成入口，且仍能限制总题量", () => {
    const worksheet = generateDailyWorksheet(12, 4, { neighborCount: 2, compareCount: 2, mentalCount: 10, applicationCount: 2, theme: "mixed" });
    expect(worksheet.total).toBe(16);
    expect(worksheet.total).toBeLessThanOrEqual(MAX_WORKSHEET_QUESTIONS);
    expect(getWorksheetDayPlan(1).stage).toBe("foundation");
    expect(getWorksheetDayPlan(6).stage).toBe("reinforcement");
  });
});
