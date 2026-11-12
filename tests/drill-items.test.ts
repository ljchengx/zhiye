import { describe, expect, it } from "vitest";
import { createItem, itemSignature, validateItem } from "../lib/tools/drill/blocks";
import { createFillItem, evaluateFill, validateFillItem } from "../lib/tools/drill/fill";
import { createDrillRandom, generateDrillPlan } from "../lib/tools/drill/generate";
import { layoutDrillSheet } from "../lib/tools/drill/layout";
import { createVerticalItem, evaluateVertical, validateVerticalItem } from "../lib/tools/drill/vertical";
import { assertWorksheetPageBounds } from "../lib/tools/number-sense/layout";
import { testWorksheetFonts } from "./number-sense-test-fonts";

describe("填空与列式计算", () => {
  it("填空恰好挖一个位置，答案可以用另一套算法重算", () => {
    const blanks = new Set<number>();
    for (let seed = 0; seed < 400; seed += 1) {
      const item = createFillItem(createDrillRandom(seed * 7 + 3), `f${seed}`);
      expect(validateFillItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "fill" || item.answer.kind !== "fill") throw new Error("题型错误");
      const missing = [item.data.a, item.data.b, item.data.result].filter((value) => value === null);
      expect(missing, `seed ${seed} 挖空数量`).toHaveLength(1);
      expect(evaluateFill(item.data), `seed ${seed} 答案`).toBe(item.answer.value);
      blanks.add(item.answer.blank);
    }
    // 三个位置都会出现，不能只挖结果。
    expect([...blanks].sort()).toEqual([0, 1, 2]);
  });

  it("列式计算覆盖加减乘，结果都在 100 以内", () => {
    const operators = new Set<string>();
    for (let seed = 0; seed < 400; seed += 1) {
      const item = createVerticalItem(createDrillRandom(seed * 11 + 5), `v${seed}`);
      expect(validateVerticalItem(item), `seed ${seed}`).toBe(true);
      if (item.data.kind !== "vertical" || item.answer.kind !== "vertical") throw new Error("题型错误");
      expect(evaluateVertical(item.data), `seed ${seed} 答案`).toBe(item.answer.value);
      expect(item.answer.value).toBeGreaterThanOrEqual(0);
      expect(item.answer.value).toBeLessThanOrEqual(100);
      operators.add(item.data.operator);
    }
    expect([...operators].sort()).toEqual(["+", "-", "×"]);
  });

  it("接通的题型都按各自规则验题，同份内不重复", () => {
    const kinds = new Set<string>();
    for (const sheet of generateDrillPlan(23, { count: 4 }).sheets) {
      const seen = new Set<string>();
      for (const page of sheet.pages) for (const block of page.blocks) {
        kinds.add(block.kind);
        for (const item of block.items) {
          expect(validateItem(block.kind, item), `${block.kind} 题目`).toBe(true);
          expect(seen.has(itemSignature(item)), `${block.kind} 重复`).toBe(false);
          seen.add(itemSignature(item));
        }
      }
    }
    // 第一份就同时含竖式与填空。
    expect(kinds.has("vertical")).toBe(true);
    expect(kinds.has("fill")).toBe(true);
  });

  it("含竖式与填空的整份排版不越界", () => {
    const fonts = testWorksheetFonts();
    for (const sheet of generateDrillPlan(23, { count: 4 }).sheets) {
      for (const page of layoutDrillSheet(sheet, fonts)) assertWorksheetPageBounds(page);
    }
  });

  it("每个题型都能生成合法小题", () => {
    for (const kind of ["oral", "fill", "vertical"] as const) {
      for (let seed = 0; seed < 60; seed += 1) {
        const item = createItem(kind, createDrillRandom(seed + 1), `i${seed}`);
        expect(validateItem(kind, item), `${kind} seed ${seed}`).toBe(true);
      }
    }
  });
});
