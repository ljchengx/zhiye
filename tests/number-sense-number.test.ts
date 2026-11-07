import { describe, expect, it } from "vitest";
import { EDITION_SHIFTS } from "../lib/tools/number-sense/curriculum";
import { generateWorksheetPlan } from "../lib/tools/math-worksheet";
import { createRandom } from "../lib/tools/number-sense/generate";
import {
  createNumberProblem, inspectNumberProblem, isNumberKind, NUMBER_DEFINITIONS,
  numberSignature, validateNumberProblem, type NumberProblem,
} from "../lib/tools/number-sense/activities-number";
import { Canvas } from "../lib/tools/number-sense/drawing";
import { drawNumberScene } from "../lib/tools/number-sense/scenes-number";
import { nodeBounds } from "../lib/tools/number-sense/layout";
import type { NumberSenseTask } from "../lib/tools/number-sense/types";
import { testWorksheetFonts } from "./number-sense-test-fonts";

const kinds = Object.keys(NUMBER_DEFINITIONS).filter(isNumberKind) as NumberProblem["kind"][];

/** 每种材料都用显式枚举重算一遍，不借用生成器的验题结果。 */
describe("数量核心活动：位值、估算、数线与图算式", () => {
  it("100 个种子的八类材料可独立求解，且数值都在 0～100", () => {
    for (let seed = 0; seed < 100; seed += 1) for (const kind of kinds) {
      const p = createNumberProblem(kind, createRandom(seed * 197 + kinds.indexOf(kind)));
      const v = inspectNumberProblem(p);
      expect(validateNumberProblem(p), `${seed}:${kind}`).toBe(true);
      expect(v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100), `${seed}:${kind}`).toBe(true);

      if (p.kind === "manyWays" && v.kind === "manyWays") {
        const odd = p.values.flatMap((value, i) => value === p.target ? [] : [i]);
        expect(odd).toEqual([...v.different]);
        expect(odd).toHaveLength(1);
        expect(Math.abs(p.values[odd[0]] - p.target)).toBeGreaterThanOrEqual(4);
      }
      if (p.kind === "regroup" && v.kind === "regroup") {
        const all: number[][] = [];
        for (let tens = 0; tens <= Math.floor(p.total / 10); tens += 1) all.push([tens, p.total - tens * 10]);
        expect(v.solutions.map((pair) => [...pair])).toEqual(all);
        const valid = p.options.flatMap(([tens, ones], i) => tens * 10 + ones === p.total ? [i] : []);
        expect(valid).toEqual([...v.valid]);
        expect(all.length).toBeGreaterThanOrEqual(3);
      }
      if (p.kind === "dualLine" && v.kind === "dualLine") {
        expect(v.upper).toBe(p.step * p.upperBound / 10);
        expect(v.lower).toBe(p.step * p.lowerBound / 10);
        expect(v.gap).toBe(p.step * (p.upperBound - p.lowerBound) / 10);
        expect(p.upper).toBeLessThanOrEqual(100);
      }
      if (p.kind === "benchmark" && v.kind === "benchmark") {
        const nearest = (anchor: number) => p.cards.reduce((best, value, i) =>
          Math.abs(value - anchor) < Math.abs(p.cards[best] - anchor) ? i : best, 0);
        expect(v.nearestA).toBe(nearest(p.anchors[0]));
        expect(v.nearestB).toBe(nearest(p.anchors[1]));
        expect(v.nearestA).not.toBe(v.nearestB);
        const order = p.cards.map((_, i) => i)
          .sort((a, b) => Math.abs(p.cards[a] - 100) - Math.abs(p.cards[b] - 100) || a - b);
        expect([...v.order]).toEqual(order);
      }
      if (p.kind === "aboutHowMany" && v.kind === "aboutHowMany") {
        const gaps = p.options.map((value) => Math.abs(value - p.first));
        expect(v.closest).toBe(gaps.indexOf(Math.min(...gaps)));
        expect(gaps.filter((gap) => gap <= 5)).toHaveLength(1);
        expect(Math.abs(p.first - p.second)).toBeGreaterThanOrEqual(20);
      }
      if (p.kind === "reasonable" && v.kind === "reasonable") {
        const exact = p.operator === 0 ? p.a + p.b : p.a - p.b;
        expect(v.exact).toBe(exact);
        expect(exact).toBeGreaterThanOrEqual(0);
        const gaps = p.options.map((value) => Math.abs(value - exact));
        expect(v.closest).toBe(gaps.indexOf(Math.min(...gaps)));
        expect(gaps.filter((gap) => gap <= 6)).toHaveLength(1);
      }
      if (p.kind === "equationMatch" && v.kind === "equationMatch") {
        const valid = p.choices.flatMap(([x, op, y, z], i) => (op === 0 ? x + y : x - y) === z ? [i] : []);
        expect([...v.validChoices]).toEqual(valid);
        const pictures = p.pictures.flatMap(([left, right], i) =>
          left === p.left && right === p.right ? [i] : []);
        expect([...v.validPictures]).toEqual(pictures);
        expect(pictures).toHaveLength(1);
      }
      if (p.kind === "compareBig" && v.kind === "compareBig") {
        const inRange = p.cards.flatMap((value, i) => value > p.low && value < p.high ? [i] : []);
        expect([...v.inRange]).toEqual(inRange);
        const swaps: number[] = [];
        for (let slot = 0; slot < p.cards.length; slot += 1) for (const [index, value] of p.replacements.entries()) {
          const after = p.cards.map((card, i) => i === slot ? value : card);
          if (after.filter((card) => card > p.low && card < p.high).length === 2) swaps.push(slot * 4 + index);
        }
        expect([...v.swaps]).toEqual(swaps);
        expect(swaps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("两版纸面不同，且每种活动都声明了换掉的思考方式", () => {
    const fonts = testWorksheetFonts();
    for (const kind of kinds) {
      expect(EDITION_SHIFTS[kind], kind).toBeDefined();
      const problem = createNumberProblem(kind, createRandom(4242));
      const versions: string[] = [];
      for (const edition of [0, 1] as const) {
        const task: NumberSenseTask = {
          id: "t", template: kind, edition, ...NUMBER_DEFINITIONS[kind],
          problem, validation: inspectNumberProblem(problem),
        };
        const canvas = new Canvas(fonts);
        expect(drawNumberScene(canvas, task, 3), kind).toBe(true);
        versions.push(canvas.nodes.filter((node) => node.kind === "text")
          .map((node) => (node as { text: string }).text).join(""));
        for (const node of canvas.nodes) {
          const b = nodeBounds(node);
          expect(b.x, `${kind}/${edition}`).toBeGreaterThanOrEqual(11.5);
          expect(b.y, `${kind}/${edition}`).toBeGreaterThanOrEqual(51);
          expect(b.x + b.width, `${kind}/${edition}/${node.kind}`).toBeLessThanOrEqual(198.5);
          expect(b.y + b.height, `${kind}/${edition}/${node.kind}`).toBeLessThanOrEqual(274.5);
          if (node.kind === "text") expect(node.size, `${kind}/${edition}`).toBeGreaterThanOrEqual(10);
        }
      }
      expect(versions[0], kind).not.toBe(versions[1]);
    }
  });

  it("先猜再数的两处小圆点都留在自己的图框内", () => {
    const fonts = testWorksheetFonts();
    for (const edition of [0, 1] as const) for (let seed = 0; seed < 100; seed += 1) {
      const problem = createNumberProblem("aboutHowMany", createRandom(seed * 7919 + 1));
      const task: NumberSenseTask = {
        id: "t", template: "aboutHowMany", edition, ...NUMBER_DEFINITIONS.aboutHowMany,
        problem, validation: inspectNumberProblem(problem),
      };
      const canvas = new Canvas(fonts);
      drawNumberScene(canvas, task, 1);
      const dots = canvas.nodes.filter((node) => node.kind === "circle" && node.radius === 2.1);
      const limit = edition === 0 ? 130 : 180;
      expect(dots.length, `${seed}/${edition}`).toBeGreaterThan(0);
      for (const dot of dots)
        expect((dot as { y: number }).y, `${seed}/${edition} 圆点跑出图框`).toBeLessThanOrEqual(limit);
    }
  });

  it("调换选项或卡片顺序不能伪装成换题", () => {
    for (let seed = 0; seed < 20; seed += 1) for (const kind of kinds) {
      const p = createNumberProblem(kind, createRandom(seed * 31 + 7));
      for (const edition of [0, 1] as const) {
        const before = numberSignature(p, edition);
        let reordered: NumberProblem = p;
        if (p.kind === "manyWays") reordered = { ...p, values: [...p.values].reverse() };
        if (p.kind === "regroup") reordered = { ...p, options: [...p.options].reverse() };
        if (p.kind === "benchmark") reordered = { ...p, cards: [...p.cards].reverse() };
        if (p.kind === "aboutHowMany") reordered = { ...p, options: [...p.options].reverse() };
        if (p.kind === "reasonable") reordered = { ...p, options: [...p.options].reverse() as unknown as typeof p.options };
        if (p.kind === "equationMatch") reordered = { ...p, choices: [...p.choices].reverse(), pictures: [...p.pictures].reverse() };
        if (p.kind === "compareBig") reordered = { ...p, cards: [...p.cards].reverse(), replacements: [...p.replacements].reverse() };
        expect(numberSignature(reordered, edition), `${seed}/${kind}/${edition}`).toBe(before);
      }
    }
    expect(kinds).toHaveLength(8);
    expect(kinds).toContain("aboutHowMany");
    expect(kinds).toContain("reasonable");
  });

  it("月度计划里的数量活动都能用不同算法独立复核", () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const plan = generateWorksheetPlan(seed);
      for (const day of plan.days) for (const page of day.pages) {
        const task = page.activity;
        if (!isNumberKind(task.problem.kind)) continue;
        const p = task.problem as NumberProblem, v = inspectNumberProblem(p);
        expect(validateNumberProblem(p), `${seed}/${p.kind}`).toBe(true);
        if (p.kind === "equationMatch" && v.kind === "equationMatch") {
          let valid = 0;
          for (const [x, op, y, z] of p.choices) if ((op === 0 ? x + y : x - y) === z) valid += 1;
          expect(valid).toBe(v.validChoices.length);
        }
        if (p.kind === "compareBig" && v.kind === "compareBig") {
          let swaps = 0;
          for (let slot = 0; slot < p.cards.length; slot += 1)
            for (const rep of p.replacements) {
              const next = p.cards.map((card, i) => i === slot ? rep : card);
              if (next.filter((card) => card > p.low && card < p.high).length === 2) swaps += 1;
            }
          expect(swaps).toBe(v.swaps.length);
        }
        if (p.kind === "aboutHowMany" && v.kind === "aboutHowMany") {
          const ranked = [...p.options].sort((a, b) => Math.abs(a - p.first) - Math.abs(b - p.first));
          expect(Math.abs(ranked[0] - p.first)).toBe(Math.abs(p.options[v.closest] - p.first));
        }
        if (p.kind === "benchmark" && v.kind === "benchmark") {
          const byTen = p.cards.map((n, i) => ({ i, d: Math.abs(n - Math.round(n / 10) * 10) }))
            .sort((a, b) => a.d - b.d || a.i - b.i);
          expect(byTen[0].i).toBe(v.nearestTen);
        }
      }
    }
  });

  it("八个数量活动两版都有第 1 问主指令", () => {
    const fonts = testWorksheetFonts();
    for (const kind of kinds) for (const edition of [0, 1] as const) {
      const problem = createNumberProblem(kind, createRandom(2024));
      const task: NumberSenseTask = {
        id: "t", template: kind, edition, ...NUMBER_DEFINITIONS[kind],
        problem, validation: inspectNumberProblem(problem),
      };
      const canvas = new Canvas(fonts);
      expect(drawNumberScene(canvas, task, 1)).toBe(true);
      const first = canvas.nodes.filter((node) => node.kind === "text" && node.role === "body" && node.y >= 51 && node.y <= 66);
      expect(first.length, `${kind}/${edition} 缺少第 1 问`).toBeGreaterThan(0);
    }
  });
});
