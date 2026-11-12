import { describe, expect, it } from "vitest";
import {
  BLOCKS_PER_SHEET, blockKindsForSheet, CLASSIC_KINDS, DRILL_SEQUENCE, GRAPHIC_KINDS,
  ITEMS_PER_SHEET, itemSignature, ROTATING_PER_SHEET, validateItem,
} from "../lib/tools/drill/blocks";
import {
  drillSheetSignature, generateDrillPlan, regenerateDrillSheet, sheetBlockKinds, sheetItemCount,
} from "../lib/tools/drill/generate";
import { layoutDrillSheet } from "../lib/tools/drill/layout";
import { assertWorksheetPageBounds, pageNodes } from "../lib/tools/number-sense/layout";
import { testWorksheetFonts } from "./number-sense-test-fonts";

describe("计算练习册题组", () => {
  it("每份恰好 25 题，其中一节固定是应用题", () => {
    const plan = generateDrillPlan(7, { count: 30 });
    plan.sheets.forEach((sheet) => {
      expect(sheetItemCount(sheet), `第 ${sheet.sheet} 份题量`).toBe(ITEMS_PER_SHEET);
      const kinds = sheetBlockKinds(sheet);
      expect(kinds, `第 ${sheet.sheet} 份块数`).toHaveLength(BLOCKS_PER_SHEET);
      // 每份都有一节生活应用题。
      expect(kinds.filter((kind) => kind === "word"), `第 ${sheet.sheet} 份应用题`).toHaveLength(1);
    });
  });

  it("轮换题型连续四份不重复，四份覆盖 12 种", () => {
    const plan = generateDrillPlan(7, { count: 8 });
    const rotating = plan.sheets.map((sheet) =>
      new Set(sheetBlockKinds(sheet).filter((kind) => kind !== "word")));
    for (let i = 0; i < rotating.length; i += 1) for (let gap = 1; gap <= 3; gap += 1) {
      const other = rotating[i + gap];
      if (!other) continue;
      for (const kind of rotating[i])
        expect(other.has(kind), `第 ${i + 1} 份与第 ${i + 1 + gap} 份重复了 ${kind}`).toBe(false);
    }
    const firstFour = new Set(plan.sheets.slice(0, 4).flatMap((sheet) =>
      sheetBlockKinds(sheet).filter((kind) => kind !== "word")));
    expect(firstFour.size).toBe(ROTATING_PER_SHEET * 4);
    expect(firstFour.size).toBeLessThan(DRILL_SEQUENCE.length);
  });

  it("每份两个算式题型、一个图形题，末尾是应用题", () => {
    for (let index = 0; index < 8; index += 1) {
      const kinds = blockKindsForSheet(index);
      expect(kinds).toHaveLength(BLOCKS_PER_SHEET);
      expect(kinds[kinds.length - 1]).toBe("word");
      expect(GRAPHIC_KINDS).toContain(kinds[BLOCKS_PER_SHEET - 2]);
      for (const kind of kinds.slice(0, ROTATING_PER_SHEET - 1))
        expect(CLASSIC_KINDS).toContain(kind);
    }
  });

  it("题目可验题且同份内不重复", () => {
    for (const sheet of generateDrillPlan(11, { count: 6 }).sheets) {
      const seen = new Set<string>();
      for (const page of sheet.pages) for (const block of page.blocks) for (const item of block.items) {
        expect(validateItem(block.kind, item), `${block.kind} 的题目`).toBe(true);
        const signature = itemSignature(item);
        expect(seen.has(signature), `${block.kind} 题目重复`).toBe(false);
        seen.add(signature);
      }
    }
  });

  it("排版不越界、字号合规、题块不重叠", () => {
    const fonts = testWorksheetFonts();
    for (const sheet of generateDrillPlan(7, { count: 4 }).sheets) {
      for (const page of layoutDrillSheet(sheet, fonts)) {
        assertWorksheetPageBounds(page);
        for (const node of pageNodes(page)) if (node.kind === "text")
          expect(node.size, node.text).toBeGreaterThanOrEqual(node.role === "caption" ? 10 : 14);
        const regions = [...page.tasks].sort((a, b) => a.y - b.y);
        for (let i = 1; i < regions.length; i += 1)
          expect(regions[i].y, "题块重叠").toBeGreaterThanOrEqual(regions[i - 1].y + regions[i - 1].height);
      }
    }
  });

  it("同种子可复现，换题会改材料", () => {
    const first = generateDrillPlan(7, { count: 3 });
    const second = generateDrillPlan(7, { count: 3 });
    expect(drillSheetSignature(first.sheets[1])).toBe(drillSheetSignature(second.sheets[1]));
    const regenerated = regenerateDrillSheet(first, 2, 999);
    expect(drillSheetSignature(regenerated)).not.toBe(drillSheetSignature(first.sheets[1]));
    expect(sheetItemCount(regenerated)).toBe(ITEMS_PER_SHEET);
  });
});
