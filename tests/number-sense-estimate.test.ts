import { describe, expect, it } from "vitest";
import {
  createEstimateProblem, ESTIMATE_DEFINITIONS, inspectEstimateProblem, validateEstimateProblem,
  type EstimateProblem,
} from "../lib/tools/number-sense/activities-estimate";
import { SCENE_KINDS } from "../lib/tools/number-sense/curriculum";
import { createRandom, taskSignature, validateTask } from "../lib/tools/number-sense/generate";
import { layoutWorksheetDay } from "../lib/tools/number-sense/layout";
import type { NumberSenseDay, NumberSenseTask } from "../lib/tools/number-sense/types";
import { generateWorksheetPlan } from "../lib/tools/math-worksheet";
import { testWorksheetFonts } from "./number-sense-test-fonts";

const kinds = Object.keys(ESTIMATE_DEFINITIONS) as EstimateProblem["kind"][];
const exactOf = (p: EstimateProblem) => p.operator === 0 ? p.a + p.b : p.a - p.b;

describe("估算活动", () => {
  it("材料都能通过验题，结论可以用另一套算法重算", () => {
    for (const kind of kinds) for (let seed = 0; seed < 150; seed += 1) {
      const p = createEstimateProblem(kind, createRandom(seed * 13 + 7));
      expect(validateEstimateProblem(p), `${kind}/${seed}`).toBe(true);
      const v = inspectEstimateProblem(p), exact = exactOf(p);
      expect(v.exact).toBe(exact);
      if (p.kind === "magnitude" && v.kind === "magnitude") {
        const decade = exact - (exact % 10);
        expect(v.decade).toBe(decade);
        // 十位必须变化，否则不需要进位或退位判断。
        expect(Math.floor(p.a / 10)).not.toBe(Math.floor(exact / 10));
        expect(p.options.filter((value) => value === decade)).toHaveLength(1);
        expect(v.upper).toBe(decade + 10);
        expect(v.nearest).toBe(Math.round(exact / 10) * 10);
      }
      if (p.kind === "closerGuess" && v.kind === "closerGuess") {
        const distances = [Math.abs(p.guesses[0] - exact), Math.abs(p.guesses[1] - exact)];
        expect([...v.distances]).toEqual(distances);
        expect(v.closer).toBe(distances[0] < distances[1] ? 0 : 1);
        expect(v.shown).toBe(p.guesses[1 - v.closer]);
        expect(v.gap).toBe(Math.abs(v.shown - exact));
        expect(Math.min(...distances)).toBeLessThanOrEqual(4);
        expect(Math.max(...distances)).toBeGreaterThanOrEqual(11);
      }
    }
  });

  it("选项与猜数的顺序不改变题目", () => {
    for (const kind of kinds) {
      const p = createEstimateProblem(kind, createRandom(99));
      const reordered: EstimateProblem = p.kind === "magnitude"
        ? { ...p, options: [...p.options].reverse() as unknown as typeof p.options }
        : { ...p, guesses: [...p.guesses].reverse() as unknown as typeof p.guesses };
      for (const edition of [0, 1] as const)
        expect(taskSignature({ problem: reordered, edition })).toBe(taskSignature({ problem: p, edition }));
    }
  });

  it("两版纸面差异明显，字号与版面都合规", () => {
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
        // 每面都要有第 1 问。
        expect(nodes.some((node) => node.kind === "text" && node.role === "body" && node.y >= 51 && node.y <= 66)).toBe(true);
      }
    }
  });

  it("加上估算活动后，28～31 份仍能排完全部活动", () => {
    expect(SCENE_KINDS.length % 2).toBe(0);
    for (const count of [28, 29, 30, 31]) {
      for (const seed of [1, 2026, 88]) {
        const plan = generateWorksheetPlan(seed, { count });
        expect(plan.days.length).toBe(count);
        const seen = new Set(plan.days.flatMap((day) => day.pages.map((page) => page.activity.problem.kind)));
        expect(seen.size, `${seed}/${count} 覆盖活动数`).toBe(SCENE_KINDS.length);
        for (const day of plan.days) for (const page of day.pages)
          expect(validateTask(page.activity), `第 ${day.day} 份`).toBe(true);
      }
    }
  }, 180000);
});
