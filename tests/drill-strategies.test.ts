import { describe, expect, it } from "vitest";
import { createDrillRandom } from "../lib/tools/drill/generate";
import {
  createNumberLineItem, evaluateNumberLine, numberLineText, validateNumberLineItem,
} from "../lib/tools/drill/numberLine";
import {
  createMakeTenItem, createManyWaysItem, createSplitItem, evaluateMakeTen, evaluateManyWays,
  makeTenText, validateMakeTenItem, validateManyWaysItem, validateSplitItem,
} from "../lib/tools/drill/strategies";
import type { MakeTenData, ManyWaysData, NumberLineData } from "../lib/tools/drill/types";

const seeds = Array.from({ length: 400 }, (_, index) => index * 17 + 5);

describe("策略与数线题型", () => {
  it("一题多解的结果与算式一致，加减都会出现", () => {
    const operators = new Set<string>();
    for (const seed of seeds) {
      const item = createManyWaysItem(createDrillRandom(seed), `w${seed}`);
      expect(validateManyWaysItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "manyWays" || item.answer.kind !== "manyWays") throw new Error("题型错误");
      const data: ManyWaysData = item.data;
      expect(evaluateManyWays(data), `seed ${seed}`).toBe(item.answer.value);
      expect(item.answer.value).toBeGreaterThanOrEqual(0);
      expect(item.answer.value).toBeLessThanOrEqual(100);
      operators.add(data.operator);
      expect(makeTenText.length).toBeGreaterThan(0);
    }
    expect([...operators].sort()).toEqual(["+", "-"]);
  });

  it("凑整再算换写法之后总数不变", () => {
    for (const seed of seeds) {
      const item = createMakeTenItem(createDrillRandom(seed), `t${seed}`);
      expect(validateMakeTenItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "makeTen" || item.answer.kind !== "makeTen") throw new Error("题型错误");
      const data: MakeTenData = item.data;
      expect(data.a2 % 10, `seed ${seed} 补成整十`).toBe(0);
      expect(data.a2 + data.b2, `seed ${seed} 总数不变`).toBe(data.a + data.b);
      expect(evaluateMakeTen(data)).toBe(item.answer.value);
      expect(item.answer.value).toBe(data.b2);
      expect(makeTenText(data).endsWith("+")).toBe(true);
    }
  });

  it("数的拆分落在可以口算的范围内", () => {
    for (const seed of seeds) {
      const item = createSplitItem(createDrillRandom(seed), `s${seed}`);
      expect(validateSplitItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "split") throw new Error("题型错误");
      expect(item.data.total).toBeGreaterThanOrEqual(24);
      expect(item.data.total).toBeLessThanOrEqual(98);
    }
  });

  it("数线移动先跳整十再跳个位，终点不超过 100", () => {
    for (const seed of seeds) {
      const item = createNumberLineItem(createDrillRandom(seed), `n${seed}`);
      expect(validateNumberLineItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "numberLine" || item.answer.kind !== "numberLine") throw new Error("题型错误");
      const data: NumberLineData = item.data;
      expect(data.jumps[0] % 10, `seed ${seed} 第一跳`).toBe(0);
      expect(data.jumps[1]).toBeGreaterThanOrEqual(2);
      expect(data.jumps[1]).toBeLessThanOrEqual(9);
      expect(evaluateNumberLine(data)).toBe(item.answer.value);
      expect(item.answer.value).toBeLessThanOrEqual(100);
      expect(numberLineText(data)).toContain("+");
    }
  });
});
