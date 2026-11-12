import { describe, expect, it } from "vitest";
import {
  BLOCK_PATTERN, blockKindsForSheet, DRILL_SEQUENCE, ITEMS_PER_SHEET, itemSignature, validateItem,
} from "../lib/tools/drill/blocks";
import {
  drillSheetSignature, generateDrillPlan, regenerateDrillSheet, sheetBlockKinds, sheetItemCount,
} from "../lib/tools/drill/generate";
import { layoutDrillSheet } from "../lib/tools/drill/layout";
import { assertWorksheetPageBounds, pageNodes } from "../lib/tools/number-sense/layout";
import { testWorksheetFonts } from "./number-sense-test-fonts";

describe("计算练习册题组", () => {
  it("每份恰好 25 题，块数按 4-3-4-3 循环", () => {
    const plan = generateDrillPlan(7, { count: 30 });
    plan.sheets.forEach((sheet, index) => {
      expect(sheetItemCount(sheet), `第 ${sheet.sheet} 份题量`).toBe(ITEMS_PER_SHEET);
      expect(sheet.pages.flatMap((page) => page.blocks), `第 ${sheet.sheet} 份块数`)
        .toHaveLength(BLOCK_PATTERN[index % BLOCK_PATTERN.length]);
    });
  });

  it("相邻两份与间隔两份都不重复，前四份覆盖全部题型", () => {
    const plan = generateDrillPlan(7, { count: 8 });
    const sets = plan.sheets.map((sheet) => new Set(sheetBlockKinds(sheet)));
    for (let i = 0; i < sets.length; i += 1) for (let gap = 1; gap <= 2; gap += 1) {
      const other = sets[i + gap];
      if (!other) continue;
      for (const kind of sets[i])
        expect(other.has(kind), `第 ${i + 1} 份与第 ${i + 1 + gap} 份重复了 ${kind}`).toBe(false);
    }
    const firstFour = new Set(plan.sheets.slice(0, 4).flatMap(sheetBlockKinds));
    expect(firstFour.size).toBe(DRILL_SEQUENCE.length);
  });

  it("题型组合按窗口滚动，不总落在固定几块", () => {
    expect(blockKindsForSheet(0)).toEqual(DRILL_SEQUENCE.slice(0, 4));
    expect(blockKindsForSheet(1)).toEqual(DRILL_SEQUENCE.slice(4, 7));
    expect(blockKindsForSheet(2)).toEqual(DRILL_SEQUENCE.slice(7, 11));
    expect(blockKindsForSheet(3)).toEqual(DRILL_SEQUENCE.slice(11, 14));
    expect(blockKindsForSheet(4)).toEqual(blockKindsForSheet(0));
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
