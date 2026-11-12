export * from "./types";
export {
  allocateCounts, BLOCK_LAYOUT, BLOCK_PATTERN, blockKindsForSheet, blocksPerSheet,
  DRILL_SEQUENCE, ITEMS_PER_SHEET, itemSignature, validateItem,
} from "./blocks";
export {
  buildDrillSheet, createDrillRandom, drillSheetCount, drillSheetSignature, generateDrillPlan,
  regenerateDrillSheet, sheetBlockKinds, sheetItemCount,
} from "./generate";
export { layoutDrillPlan, layoutDrillSheet } from "./layout";
export type { WorksheetDocument, WorksheetPage, WorksheetTaskRegion } from "../number-sense/layout";

import { BLOCK_LAYOUT, DRILL_SEQUENCE } from "./blocks";
import { itemSignature } from "./blocks";
import type { DrillPlan, DrillSheet, WorksheetExportSelection } from "./types";

/** 14 种题型的名称，按轮换顺序，给页面列出本月内容。 */
export const DRILL_TITLES: readonly string[] = DRILL_SEQUENCE.map((kind) => BLOCK_LAYOUT[kind].title);

export const DRILL_PARENT_USAGE =
  "每份一张 A4 双面，一共 25 道题，练 100 以内加减与九九表。连续四份题型都不一样："
  + "先练写出得数、列式、填空，再练比大小、找错、检查与凑整。纸面不给答案，"
  + "做完请看看孩子的列式写清了没有、检查那一步有没有做。";

/** 要导出的份，沿用原来的选择方式。 */
export function getExportDays(
  plan: DrillPlan, selection: WorksheetExportSelection,
): readonly { day: number }[] {
  const total = plan.totalSheets;
  if (selection.kind === "day") return [{ day: Math.max(1, Math.min(total, Math.floor(selection.day))) }];
  if (selection.kind === "range") {
    const from = Math.max(1, Math.min(total, Math.floor(selection.from)));
    const to = Math.max(from, Math.min(total, Math.floor(selection.to)));
    return Array.from({ length: to - from + 1 }, (_, index) => ({ day: from + index }));
  }
  return Array.from({ length: total }, (_, index) => ({ day: index + 1 }));
}

/** 一份里所有题目的标记，用于换题时避开原来的题。 */
export function sheetSignatures(sheet: DrillSheet): readonly string[] {
  return sheet.pages.flatMap((page) => page.blocks.flatMap((block) => block.items.map(itemSignature)));
}
