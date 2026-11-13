import { describe, expect, it } from "vitest";
import { createDrillRandom, generateDrillPlan, regenerateDrillSheet } from "../lib/tools/drill/generate";
import { createInOutItem, evaluateInOut, IN_OUT_CELLS, validateInOutItem } from "../lib/tools/drill/inOut";
import { createWordItem, evaluateWord, validateWordItem, WORD_TEMPLATE_COUNT, wordText } from "../lib/tools/drill/word";
import type { DrillSheet, InOutData, WordData } from "../lib/tools/drill/types";

const seeds = Array.from({ length: 400 }, (_, index) => index * 19 + 3);

function wordFor(sheet: DrillSheet): WordData {
  const data = sheet.pages[1].blocks[1].items[0].data;
  if (data.kind !== "word") throw new Error("题型错误");
  return data;
}

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

  it("40 个故事各有独立情景，四则运算均衡且题面与场景一致", () => {
    const operators = new Map<string, number>();
    const scenes = new Set<string>();
    const texts = new Set<string>();
    expect(WORD_TEMPLATE_COUNT).toBe(40);
    for (let story = 0; story < WORD_TEMPLATE_COUNT; story += 1) {
      const item = createWordItem(createDrillRandom(story + 10), `story${story}`, story);
      if (item.data.kind !== "word") throw new Error("题型错误");
      const data = item.data;
      expect(validateWordItem(item)).toBe(true);
      expect(data.story).toBe(story);
      expect(data.text).toMatch(/。.+？$/);
      expect(data.text).not.toMatch(/^有 \d+ 个/);
      if (data.operator === "÷") expect(data.text).toContain("平均");
      if (data.scene === "calendar") expect(data.value).toBeLessThanOrEqual(28);
      expect(validateWordItem({ ...item, data: { ...data, text: `有 ${data.a} 个和 ${data.b} 个。` } })).toBe(false);
      expect(validateWordItem({ ...item, data: { ...data, scene: data.scene === "bus" ? "pond" : "bus" } })).toBe(false);
      operators.set(data.operator, (operators.get(data.operator) ?? 0) + 1);
      scenes.add(data.scene);
      texts.add(data.text);
    }
    expect([...operators.values()]).toEqual([10, 10, 10, 10]);
    expect(scenes.size).toBe(40);
    expect(texts.size).toBe(40);
  });

  it("整册 31 份不重复故事和情景，同种子稳定且换种子改变轮换起点", () => {
    const storiesFor = (seed: number) => generateDrillPlan(seed, { count: 31 }).sheets.map(wordFor);
    const first = storiesFor(7), repeated = storiesFor(7), other = storiesFor(8);
    expect(first).toEqual(repeated);
    expect(first[0].story).not.toBe(other[0].story);
    for (const seed of [0, 7, 39, 40, 20260831, 0xffffffff]) {
      const words = storiesFor(seed);
      expect(new Set(words.map((data) => data.story)).size).toBe(31);
      expect(new Set(words.map((data) => data.scene)).size).toBe(31);
      expect(words.filter((data) => data.scene === "bus").length).toBeLessThanOrEqual(1);
    }
  });

  it("连续换题更换情景并避开当前整册，包括种子轮换起点相同的情况", () => {
    let plan = generateDrillPlan(7, { count: 31 });
    for (let turn = 0; turn < 50; turn += 1) {
      const day = turn % 2 === 0 ? 1 : 31;
      const previous = wordFor(plan.sheets[day - 1]);
      const usedScenes = new Set(plan.sheets.map((sheet) => wordFor(sheet).scene));
      // 同余种子也必须换图；将返回值写回整册，模拟工作区连续操作。
      const seed = plan.seed + WORD_TEMPLATE_COUNT * (turn + 1);
      const replacement = regenerateDrillSheet(plan, day, seed);
      const word = wordFor(replacement);
      expect(word.scene).not.toBe(previous.scene);
      expect(usedScenes.has(word.scene), `第 ${turn + 1} 次换题`).toBe(false);
      expect(regenerateDrillSheet(plan, day, seed)).toEqual(replacement);
      plan = { ...plan, sheets: plan.sheets.map((sheet) => sheet.sheet === day ? replacement : sheet) };
      expect(new Set(plan.sheets.map((sheet) => wordFor(sheet).scene)).size).toBe(31);
    }
  });
});
