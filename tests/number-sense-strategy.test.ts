import { describe, expect, it } from "vitest";
import {
  createStrategyProblem, inspectStrategyProblem, STRATEGY_DEFINITIONS, validateStrategyProblem,
  type StrategyProblem,
} from "../lib/tools/number-sense/activities-strategy";
import { SCENE_KINDS } from "../lib/tools/number-sense/curriculum";
import { createRandom, taskSignature, validateTask } from "../lib/tools/number-sense/generate";
import { layoutWorksheetDay } from "../lib/tools/number-sense/layout";
import type { NumberSenseDay, NumberSenseTask } from "../lib/tools/number-sense/types";
import { generateWorksheetPlan } from "../lib/tools/math-worksheet";
import { testWorksheetFonts } from "./number-sense-test-fonts";

const kinds = Object.keys(STRATEGY_DEFINITIONS) as StrategyProblem["kind"][];

describe("策略与检查活动", () => {
  it("材料都能通过验题，结论可以用另一套算法重算", () => {
    for (const kind of kinds) for (let seed = 0; seed < 150; seed += 1) {
      const p = createStrategyProblem(kind, createRandom(seed * 17 + 11));
      expect(validateStrategyProblem(p), `${kind}/${seed}`).toBe(true);
      const v = inspectStrategyProblem(p);
      if (p.kind === "compensateAdd" && v.kind === "compensateAdd") {
        expect(p.a2).toBe(p.a + p.up);
        expect(p.a2 % 10).toBe(0);
        expect(p.b2).toBe(p.b - p.up);
        // 换写法以后总数不变，这才是凑整的意义。
        expect(p.a2 + p.b2).toBe(p.a + p.b);
        expect(v.sum).toBe(p.a + p.b);
      }
      if (p.kind === "compensateSub" && v.kind === "compensateSub") {
        expect(p.b2).toBe(p.b + p.diff);
        expect(p.b2 % 10).toBe(0);
        expect(p.diff).toBe(10 - p.b % 10);
        expect(p.a - p.b2 + p.diff).toBe(p.a - p.b);
        expect(v.result).toBe(p.a - p.b);
      }
      if (p.kind === "compareExpressions" && v.kind === "compareExpressions") {
        const value = (side: readonly number[]) => p.operator === 0 ? side[0] + side[1] : side[0] - side[1];
        expect(v.leftValue).toBe(value(p.left));
        expect(v.rightValue).toBe(value(p.right));
        const expected = v.leftValue > v.rightValue ? 0 : v.leftValue < v.rightValue ? 1 : 2;
        expect(v.answer).toBe(expected);
        expect(v.difference).toBe(Math.abs(value(p.left) - value(p.right)));
        // 必须存在只看数的变化就能判断的路径。
        expect(
          p.left[0] === p.right[0] || p.left[1] === p.right[1]
          || (p.operator === 0 && p.left[0] - p.right[0] === p.right[1] - p.left[1]),
        ).toBe(true);
      }
      if (p.kind === "checkBack" && v.kind === "checkBack") {
        const sum = p.operator === 0 ? p.a + p.b : p.a - p.b;
        expect(v.sum).toBe(sum);
        expect(v.check).toBe(p.b);
        // 检查式必须回到另一个加数或被减数。
        expect(p.operator === 0 ? sum - p.a : sum + p.b).toBe(p.b);
      }
    }
  });

  it("正确答案不会总在同一组，算式内部顺序不改变签名", () => {
    let firstIsCorrect = 0, total = 0;
    for (const kind of kinds) for (let seed = 0; seed < 60; seed += 1) {
      const p = createStrategyProblem(kind, createRandom(seed * 29 + 5));
      if (p.kind === "compensateAdd" || p.kind === "compensateSub" || p.kind === "checkBack") {
        total += 1;
        if (p.a % 2 === 0) firstIsCorrect += 1;
      }
      if (p.kind === "compareExpressions") {
        const swapped: StrategyProblem = { ...p, left: [p.left[1], p.left[0]] as const };
        // 加法交换两侧数字是同一道题；减法交换会改变结果，不在此列。
        if (p.operator === 0) expect(taskSignature({ problem: swapped, edition: 0 })).toBe(taskSignature({ problem: p, edition: 0 }));
      }
    }
    expect(firstIsCorrect / total).toBeGreaterThan(0.35);
    expect(firstIsCorrect / total).toBeLessThan(0.65);
  });

  it("两版纸面差异明显，字号、版面与第 1 问都合规", () => {
    const fonts = testWorksheetFonts();
    const plan = generateWorksheetPlan(7);
    for (const kind of kinds) {
      const found = plan.days.flatMap((day) => day.pages.map((page) => ({ day: day.day, activity: page.activity })))
        .find((item) => item.activity.problem.kind === kind);
      expect(found, kind).toBeTruthy();
      const { day, activity } = found!;
      const render = (edition: 0 | 1) => layoutWorksheetDay({
        ...plan.days[day - 1],
        pages: [
          { side: "front", activity: { ...activity, edition } as NumberSenseTask },
          { side: "back", activity: { ...activity, edition } as NumberSenseTask },
        ],
      } as NumberSenseDay, fonts)[0];
      const first = render(0), second = render(1);
      const texts = (page: typeof first) => new Set(page.tasks[0].nodes.flatMap((node) => node.kind === "text" ? [node.text] : []));
      const a = texts(first), b = texts(second);
      let diff = 0;
      for (const item of a) if (!b.has(item)) diff += 1;
      for (const item of b) if (!a.has(item)) diff += 1;
      expect(diff, `${kind} 两版纸面差异`).toBeGreaterThanOrEqual(3);
      for (const page of [first, second]) {
        const nodes = page.tasks[0].nodes;
        for (const node of nodes) if (node.kind === "text")
          expect(node.size, node.text).toBeGreaterThanOrEqual(node.role === "caption" ? 10 : 14);
        expect(nodes.some((node) => node.kind === "text" && node.role === "body" && node.y >= 51 && node.y <= 66)).toBe(true);
      }
    }
  });

  it("内容库到 46 种后，28～31 份仍能排完全部活动", () => {
    expect(SCENE_KINDS.length).toBe(46);
    for (const count of [28, 29, 30, 31]) {
      for (const seed of [1, 2026, 77]) {
        const plan = generateWorksheetPlan(seed, { count });
        expect(plan.days.length).toBe(count);
        const seen = new Set(plan.days.flatMap((day) => day.pages.map((page) => page.activity.problem.kind)));
        expect(seen.size, `${seed}/${count} 覆盖活动数`).toBe(SCENE_KINDS.length);
        for (const day of plan.days) for (const page of day.pages)
          expect(validateTask(page.activity), `第 ${day.day} 份`).toBe(true);
      }
    }
  }, 300000);
});
