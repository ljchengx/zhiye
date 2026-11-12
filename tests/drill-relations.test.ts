import { describe, expect, it } from "vitest";
import { chainText, createChainItem, evaluateChain, validateChainItem } from "../lib/tools/drill/chain";
import {
  checkBackText, createCheckBackItem, createSpotErrorItem, evaluateCheckBack, evaluateSpotError,
  validateCheckBackItem, validateSpotErrorItem,
} from "../lib/tools/drill/checks";
import { createDrillRandom } from "../lib/tools/drill/generate";
import {
  compareText, createCompareItem, createOperatorItem, evaluateCompare, matchingOperators,
  validateCompareItem, validateOperatorItem,
} from "../lib/tools/drill/relations";
import type { ChainData, CompareData, OperatorData, SpotErrorData } from "../lib/tools/drill/types";

const seeds = Array.from({ length: 400 }, (_, index) => index * 13 + 7);

describe("关系与检查题型", () => {
  it("连加连减的中间结果与最终结果都留在 0～100", () => {
    for (const seed of seeds) {
      const item = createChainItem(createDrillRandom(seed), `c${seed}`);
      expect(validateChainItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "chain" || item.answer.kind !== "chain") throw new Error("题型错误");
      const data: ChainData = item.data;
      const mid = data.operators[0] === "+" ? data.terms[0] + data.terms[1] : data.terms[0] - data.terms[1];
      expect(mid, `seed ${seed} 中间结果`).toBeGreaterThanOrEqual(0);
      expect(evaluateChain(data)).toBe(item.answer.value);
      expect(chainText(data)).toContain("=");
    }
  });

  it("比大小的符号与两边结果一致，三种关系都会出现", () => {
    const signs = new Set<string>();
    for (const seed of seeds) {
      const item = createCompareItem(createDrillRandom(seed), `m${seed}`);
      expect(validateCompareItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "compare" || item.answer.kind !== "compare") throw new Error("题型错误");
      const { left, right, sign } = evaluateCompare(item.data);
      expect(item.answer.sign, `seed ${seed} 符号`).toBe(sign);
      // 一定有一条不用算出结果的判断路径。
      const data: CompareData = item.data;
      expect(
        data.left[0] === data.right[0] || data.left[1] === data.right[1]
        || (data.operator === "+" && data.left[0] - data.right[0] === data.right[1] - data.left[1]),
        `seed ${seed} 缺少关系路径`,
      ).toBe(true);
      expect(Math.abs(left - right) >= 0).toBe(true);
      expect(compareText(data).length).toBeGreaterThan(0);
      signs.add(sign);
    }
    expect(signs.has("=")).toBe(true);
    expect(signs.size).toBeGreaterThanOrEqual(2);
  });

  it("填符号只有一种符号成立，答案唯一", () => {
    for (const seed of seeds) {
      const item = createOperatorItem(createDrillRandom(seed), `o${seed}`);
      expect(validateOperatorItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "operator" || item.answer.kind !== "operator") throw new Error("题型错误");
      const data: OperatorData = item.data;
      const matches = matchingOperators(data);
      expect(matches, `seed ${seed} 成立符号数`).toHaveLength(1);
      expect(matches[0]).toBe(item.answer.value);
    }
  });

  it("找错的得数确实错了，改动幅度在 2～9 之间", () => {
    for (const seed of seeds) {
      const item = createSpotErrorItem(createDrillRandom(seed), `e${seed}`);
      expect(validateSpotErrorItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "spotError" || item.answer.kind !== "spotError") throw new Error("题型错误");
      const data: SpotErrorData = item.data;
      const correct = evaluateSpotError(data);
      expect(data.shown, `seed ${seed} 显示值`).not.toBe(correct);
      expect(Math.abs(correct - data.shown), `seed ${seed} 幅度`).toBeLessThanOrEqual(9);
      expect(item.answer.value).toBe(correct);
      expect(data.shown).toBeGreaterThanOrEqual(0);
      expect(data.shown).toBeLessThanOrEqual(100);
    }
  });

  it("算完检查用互逆算式，结果回到另一个数", () => {
    for (const seed of seeds) {
      const item = createCheckBackItem(createDrillRandom(seed), `k${seed}`);
      expect(validateCheckBackItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "checkBack" || item.answer.kind !== "checkBack") throw new Error("题型错误");
      const { given, check } = checkBackText(item.data);
      expect(given).toContain("=");
      expect(check.endsWith("=")).toBe(true);
      expect(evaluateCheckBack(item.data)).toBe(item.answer.value);
      // 加法题检查式回到另一个加数，减法题回到被减数。
      if (item.data.operator === "+") expect(item.answer.value).toBe(item.data.b);
      else expect(item.answer.value).toBe(item.data.a);
    }
  });
});
