import { describe, expect, it } from "vitest";
import { createDrillRandom } from "../lib/tools/drill/generate";
import { createInOutItem, evaluateInOut, IN_OUT_CELLS, validateInOutItem } from "../lib/tools/drill/inOut";
import { createWordItem, evaluateWord, validateWordItem, wordText } from "../lib/tools/drill/word";
import type { InOutData, WordData } from "../lib/tools/drill/types";

const seeds = Array.from({ length: 400 }, (_, index) => index * 19 + 3);

describe("表格与应用题", () => {
  it("进几出几的规律一致，进的数递增", () => {
    for (const seed of seeds) {
      const item = createInOutItem(createDrillRandom(seed), `t${seed}`);
      expect(validateInOutItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "inOut" || item.answer.kind !== "inOut") throw new Error("题型错误");
      const data: InOutData = item.data;
      expect(data.inputs).toHaveLength(IN_OUT_CELLS);
      expect(data.outputs).toHaveLength(IN_OUT_CELLS);
      for (let index = 1; index < data.inputs.length; index += 1)
        expect(data.inputs[index], `seed ${seed} 递增`).toBeGreaterThan(data.inputs[index - 1]);
      const expected = evaluateInOut(data);
      expected.forEach((value, index) => expect(value, `seed ${seed} 第 ${index} 格`).toBe(data.outputs[index]));
      expect(expected.every((value) => value >= 0 && value <= 100), `seed ${seed} 范围`).toBe(true);
      expect(item.answer.value).toBe(data.outputs[data.outputs.length - 1]);
    }
  });

  it("应用题题面与算式对得上，结果在 100 以内", () => {
    const operators = new Set<string>();
    for (const seed of seeds) {
      const item = createWordItem(createDrillRandom(seed), `w${seed}`);
      expect(validateWordItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "word" || item.answer.kind !== "word") throw new Error("题型错误");
      const data: WordData = item.data;
      expect(evaluateWord(data), `seed ${seed} 答案`).toBe(item.answer.value);
      expect(item.answer.value).toBeGreaterThanOrEqual(0);
      expect(item.answer.value).toBeLessThanOrEqual(100);
      expect(wordText(data)).toBe(data.text);
      // 题面里要出现两个数，孩子才有得可算。
      expect(data.text).toContain(String(data.a));
      expect(data.text).toContain(String(data.b));
      operators.add(data.operator);
    }
    expect([...operators].sort()).toEqual(["+", "-", "×", "÷"]);
  });
});
