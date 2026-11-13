import { describe, expect, it } from "vitest";
import { circleOutText, createCircleActivity, createCircleOutItem, validateCircleActivity, validateCircleOutItem } from "../lib/tools/drill/circleOut";
import { createDotCountItem, dotCountText, evaluateDotCount, validateDotCountItem } from "../lib/tools/drill/dotCount";
import { buildDrillSheet, createDrillRandom, generateDrillPlan, regenerateDrillSheet } from "../lib/tools/drill/generate";
import { createMatchActivity, createMatchItem, evalExpression, validateMatchActivity, validateMatchItem } from "../lib/tools/drill/matchLine";
import { createTowerItem, towerLayers, validateTowerItem } from "../lib/tools/drill/numberTower";
import type { CircleOutData, MatchData, TowerData } from "../lib/tools/drill/types";

const seeds = Array.from({ length: 300 }, (_, index) => index * 23 + 11);

describe("图形化题型", () => {
  it("加一加：相邻两数相加，两层结果都对", () => {
    for (const seed of seeds) {
      const item = createTowerItem(createDrillRandom(seed), `t${seed}`);
      expect(validateTowerItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "numberTower" || item.answer.kind !== "numberTower") throw new Error("题型错误");
      const data: TowerData = item.data;
      const { mid, top } = towerLayers(data);
      expect(mid[0]).toBe(data.base[0] + data.base[1]);
      expect(mid[1]).toBe(data.base[1] + data.base[2]);
      expect(top).toBe(mid[0] + mid[1]);
      expect(item.answer.values).toEqual([mid[0], mid[1], top]);
      expect(data.cells.filter((value) => value === null)).toHaveLength(1);
      data.cells.forEach((value, index) => {
        if (value !== null) expect(value).toBe(item.answer.kind === "numberTower" ? item.answer.values[index] : undefined);
      });
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  it("数一数：行乘每行个数就是一共多少", () => {
    for (const seed of seeds) {
      const item = createDotCountItem(createDrillRandom(seed), `d${seed}`);
      expect(validateDotCountItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "dotCount" || item.answer.kind !== "dotCount") throw new Error("题型错误");
      expect(evaluateDotCount(item.data)).toBe(item.answer.value);
      expect(item.answer.value).toBeGreaterThanOrEqual(6);
      expect(item.answer.value).toBeLessThanOrEqual(24);
      expect(item.data.assetIndex).toBeGreaterThanOrEqual(0);
      expect(item.data.assetIndex).toBeLessThan(85);
      expect(dotCountText(item.data)).toContain("行");
    }
  });

  it("连一连：每个得数只用一次，且和左边算式对得上", () => {
    for (const seed of seeds) {
      const item = createMatchItem(createDrillRandom(seed), `m${seed}`);
      expect(validateMatchItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "matchLine" || item.answer.kind !== "matchLine") throw new Error("题型错误");
      const data: MatchData = item.data;
      const pairs = item.answer.pairs;
      expect(data.expressions).toHaveLength(1);
      // 右边的得数不能重复，连线才有唯一答案。
      expect(new Set(data.right).size).toBe(data.right.length);
      // 每个左边算式的结果都要出现在右边。
      data.expressions.forEach((text, index) => {
        expect(data.right, `seed ${seed} 第 ${index} 个算式`).toContain(evalExpression(text));
        expect(pairs[index]).toBe(data.right.indexOf(evalExpression(text)));
      });
      expect(new Set(pairs).size).toBe(data.right.length);
    }
  });

  it("截图中的连线大题只有四道算式和四个共用选项", () => {
    const sheet = buildDrillSheet(3, 20260831);
    const groups = sheet.pages.flatMap((page) => page.blocks).find((block) => block.kind === "matchLine")!.items;
    const values = groups[0].data.kind === "matchLine" ? groups[0].data.right : [];
    const expressions = groups.flatMap((item) => item.data.kind === "matchLine" ? item.data.expressions : []);
    expect(groups).toHaveLength(4);
    expect(values).toHaveLength(4);
    expect(expressions).toHaveLength(4);
    expect(new Set(values).size).toBe(4);
    expect(validateMatchActivity(groups)).toBe(true);
  });

  it("整月生成及本份换题后，每个连线大题的算式和得数均不重复", () => {
    for (const seed of seeds) {
      const plan = generateDrillPlan(seed, { count: 31 });
      for (const sheet of plan.sheets) {
        const block = sheet.pages.flatMap((page) => page.blocks).find((entry) => entry.kind === "matchLine");
        if (!block) continue;
        const changed = regenerateDrillSheet(plan, sheet.sheet, seed + 7919);
        const replacement = changed.pages.flatMap((page) => page.blocks).find((entry) => entry.kind === "matchLine")!;
        for (const candidate of [block, replacement]) {
          const values = candidate.items[0].data.kind === "matchLine" ? candidate.items[0].data.right : [];
          const expressions = candidate.items.flatMap((item) => item.data.kind === "matchLine" ? item.data.expressions : []);
          expect(expressions).toHaveLength(4);
          expect(new Set(values).size, `seed ${seed} 第 ${sheet.sheet} 份得数`).toBe(values.length);
          expect(new Set(expressions).size, `seed ${seed} 第 ${sheet.sheet} 份算式`).toBe(expressions.length);
          expect(validateMatchActivity(candidate.items)).toBe(true);
          candidate.items.forEach((item, index) => {
            if (item.answer.kind === "matchLine") expect(item.answer.pairs[0]).not.toBe(index);
          });
        }
      }
    }
  });

  it("连线验题会拒绝错误配对、缺失的得数和无效算式", () => {
    const item = createMatchActivity(createDrillRandom(13), ["a", "b", "c", "d"])[0];
    if (item.data.kind !== "matchLine" || item.answer.kind !== "matchLine") throw new Error("题型错误");
    const pairs = [...item.answer.pairs];
    pairs[0] = (pairs[0] + 1) % item.data.right.length;
    expect(validateMatchItem({ ...item, answer: { kind: "matchLine", pairs } })).toBe(false);
    const data = item.data;
    const wrongRight = data.right.map((value) => (value + 1) % 100);
    expect(validateMatchItem({ ...item, data: { ...data, right: wrongRight } })).toBe(false);
    expect(validateMatchItem({ ...item, data: { ...data, expressions: ["23 * 9", ...data.expressions.slice(1)] } })).toBe(false);
  });

  it("连线得数被全部排除时能结束重试并报告失败", () => {
    const excluded = new Set(Array.from({ length: 95 }, (_, index) => index + 5));
    expect(() => createMatchItem(createDrillRandom(7), "exhausted", excluded)).toThrow("暂时无法生成合法的连线材料");
  });

  it("圈一圈：每个编号只判断一个算式，条件文字与判定一致", () => {
    for (const seed of seeds) {
      const item = createCircleOutItem(createDrillRandom(seed), `c${seed}`);
      expect(validateCircleOutItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "circleOut" || item.answer.kind !== "circleOut") throw new Error("题型错误");
      const data: CircleOutData = item.data;
      const expected = data.values.flatMap((value, index) =>
        (data.above ? value > data.threshold : value < data.threshold) ? [index] : []);
      expect(item.answer.indices).toEqual(expected);
      expect(data.expressions).toHaveLength(1);
      expect(data.values).toHaveLength(1);
      expect(circleOutText(data)).toContain(String(data.threshold));
    }
  });

  it("圈选活动只判断四道算式，共用条件且符合与不符合各两个", () => {
    const selectedPositions = new Set<string>();
    for (const seed of seeds) {
      const items = createCircleActivity(createDrillRandom(seed), ["a", "b", "c", "d"]);
      expect(validateCircleActivity(items)).toBe(true);
      expect(items.flatMap((item) => item.data.kind === "circleOut" ? item.data.expressions : [])).toHaveLength(4);
      const selected = items.flatMap((item, index) => item.answer.kind === "circleOut" && item.answer.indices.length ? [index] : []);
      expect(selected).toHaveLength(2);
      selectedPositions.add(selected.join(","));
    }
    expect(selectedPositions.size).toBeGreaterThan(1);
  });
});
