import { describe, expect, it } from "vitest";
import { circleOutText, createCircleOutItem, validateCircleOutItem } from "../lib/tools/drill/circleOut";
import { createDotCountItem, dotCountText, evaluateDotCount, validateDotCountItem } from "../lib/tools/drill/dotCount";
import { createDrillRandom } from "../lib/tools/drill/generate";
import { createMatchItem, evalExpression, validateMatchItem } from "../lib/tools/drill/matchLine";
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

  it("圈一圈：符合条件的最少两个，条件文字与判定一致", () => {
    for (const seed of seeds) {
      const item = createCircleOutItem(createDrillRandom(seed), `c${seed}`);
      expect(validateCircleOutItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "circleOut" || item.answer.kind !== "circleOut") throw new Error("题型错误");
      const data: CircleOutData = item.data;
      const expected = data.values.flatMap((value, index) =>
        (data.above ? value > data.threshold : value < data.threshold) ? [index] : []);
      expect(item.answer.indices).toEqual(expected);
      expect(expected.length).toBeGreaterThanOrEqual(2);
      expect(expected.length).toBeLessThanOrEqual(data.values.length - 2);
      expect(circleOutText(data)).toContain(String(data.threshold));
    }
  });
});
