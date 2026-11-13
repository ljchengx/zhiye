export * from "./types";
export {
  allocateCounts, BLOCK_LAYOUT, blocksPerSheet, blockKindsForSheet, BLOCKS_PER_SHEET,
  DRILL_SEQUENCE, ITEMS_PER_SHEET, itemSignature, ROTATING_PER_SHEET, validateItem,
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

/** 轮换题型的名称，给页面列出本月内容。 */
export const DRILL_TITLES: readonly string[] = DRILL_SEQUENCE.map((kind) => BLOCK_LAYOUT[kind].title);

export const DRILL_PARENT_USAGE =
  "每份一张 A4 双面，一共 16 个编号小题，练 100 以内加减与九九表。每面两个大题："
  + "正面先计算再玩图形，反面尝试方法并完成一道生活应用题。图形活动每个编号只需连一对、圈一道、数一组或填一格。纸面不给答案，"
  + "做完请看看孩子的列式写清了没有、检查那一步有没有做。";

/** 要导出的份，沿用原来的选择方式。 */
export function getExportDays(
  plan: DrillPlan, selection: WorksheetExportSelection,
): readonly { day: number }[] {
  const total = plan.totalSheets;
  if (selection.kind === "day") return [{ day: Math.max(1, Math.min(total, Math.floor(selection.day))) }];
  if (selection.kind === "range") {
    // 与界面页数和文件名一致，反向选择也按从小到大的完整范围导出。
    const start = Math.max(1, Math.min(total, Math.floor(selection.from)));
    const end = Math.max(1, Math.min(total, Math.floor(selection.to)));
    const from = Math.min(start, end), to = Math.max(start, end);
    return Array.from({ length: to - from + 1 }, (_, index) => ({ day: from + index }));
  }
  return Array.from({ length: total }, (_, index) => ({ day: index + 1 }));
}

/** 一份里所有题目的标记，用于换题时避开原来的题。 */
export function sheetSignatures(sheet: DrillSheet): readonly string[] {
  return sheet.pages.flatMap((page) => page.blocks.flatMap((block) => block.items.map(itemSignature)));
}
