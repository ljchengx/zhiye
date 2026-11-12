import { CHAIN_INSTRUCTION, CHAIN_LAYOUT, CHAIN_TITLE, createChainItem, validateChainItem } from "./chain";
import {
  CHECK_BACK_INSTRUCTION, CHECK_BACK_LAYOUT, CHECK_BACK_TITLE, createCheckBackItem, createSpotErrorItem,
  SPOT_ERROR_INSTRUCTION, SPOT_ERROR_LAYOUT, SPOT_ERROR_TITLE, validateCheckBackItem, validateSpotErrorItem,
} from "./checks";
import { createFillItem, validateFillItem } from "./fill";
import { createOralItem, ORAL_INSTRUCTION, ORAL_LAYOUT, ORAL_TITLE, validateOralItem } from "./oral";
import {
  COMPARE_INSTRUCTION, COMPARE_LAYOUT, COMPARE_TITLE, createCompareItem, createOperatorItem,
  OPERATOR_INSTRUCTION, OPERATOR_LAYOUT, OPERATOR_TITLE, validateCompareItem, validateOperatorItem,
} from "./relations";
import { createVerticalItem, validateVerticalItem } from "./vertical";
import type { DrillBlock, DrillItem, DrillKind } from "./types";

/** 每份固定 25 题。 */
export const ITEMS_PER_SHEET = 25;
/** 块数按 4-3-4-3 轮换，各段首尾相接，四份刚好走完 14 种题型。 */
export const BLOCK_PATTERN = [4, 3, 4, 3] as const;

/** 题块内容的可用高度（毫米）：4 块与 3 块的预留标题、间距不同。 */
export const BLOCK_BUDGET_4 = 151;
export const BLOCK_BUDGET_3 = 170;

/**
 * 14 种题型的轮换顺序：占地题型落在位置 0、2、5、8、11，
 * 这样每一段都有两个以上能放较多题目的短题型，25 题才排得下。
 */
export const DRILL_SEQUENCE: readonly DrillKind[] = [
  "vertical", "oral", "spotError", "fill",
  "compare", "manyWays", "operator", "chain",
  "numberLine", "checkBack", "inOut", "word",
  "split", "makeTen",
];

export interface BlockLayout {
  columns: number;
  rowHeight: number;
  maxItems: number;
  title: string;
  instruction: string;
}

/** 排版设置与标题；批次 1 只有 oral 接通生成，其余暂时沿用占位设置。 */
export const BLOCK_LAYOUT: Record<DrillKind, BlockLayout> = {
  oral: { ...ORAL_LAYOUT, maxItems: 24, title: ORAL_TITLE, instruction: ORAL_INSTRUCTION },
  vertical: { columns: 4, rowHeight: 30, maxItems: 8, title: "列式计算", instruction: "一步一步算。" },
  fill: { columns: 4, rowHeight: 10, maxItems: 16, title: "填空", instruction: "把缺的数填上。" },
  spotError: { ...SPOT_ERROR_LAYOUT, title: SPOT_ERROR_TITLE, instruction: SPOT_ERROR_INSTRUCTION },
  chain: { ...CHAIN_LAYOUT, title: CHAIN_TITLE, instruction: CHAIN_INSTRUCTION },
  checkBack: { ...CHECK_BACK_LAYOUT, title: CHECK_BACK_TITLE, instruction: CHECK_BACK_INSTRUCTION },
  compare: { ...COMPARE_LAYOUT, title: COMPARE_TITLE, instruction: COMPARE_INSTRUCTION },
  manyWays: { columns: 2, rowHeight: 18, maxItems: 6, title: "一题多解", instruction: "写出不同的算法。" },
  operator: { ...OPERATOR_LAYOUT, title: OPERATOR_TITLE, instruction: OPERATOR_INSTRUCTION },
  makeTen: { columns: 3, rowHeight: 14, maxItems: 12, title: "凑整再算", instruction: "先补成整十。" },
  inOut: { columns: 4, rowHeight: 12, maxItems: 12, title: "进几出几", instruction: "把表格补完整。" },
  numberLine: { columns: 2, rowHeight: 22, maxItems: 6, title: "数线移动", instruction: "在数线上画一画。" },
  split: { columns: 4, rowHeight: 11, maxItems: 12, title: "数的拆分", instruction: "把数拆成两部分。" },
  word: { columns: 1, rowHeight: 20, maxItems: 4, title: "应用题", instruction: "读一读，列式算出来。" },
};

export function blocksPerSheet(index: number): number {
  return BLOCK_PATTERN[index % BLOCK_PATTERN.length];
}

/**
 * 第 index 份（0 基）取序列里连续 3-4 个位置：各段首尾相接，
 * 连续四份正好走完全部 14 种题型，四份之内不重复。
 */
export function blockKindsForSheet(index: number): readonly DrillKind[] {
  const period = BLOCK_PATTERN.reduce((a, b) => a + b, 0);
  const laps = Math.floor(index / BLOCK_PATTERN.length);
  const step = index % BLOCK_PATTERN.length;
  let offset = laps * period;
  for (let i = 0; i < step; i += 1) offset += BLOCK_PATTERN[i];
  const size = BLOCK_PATTERN[step];
  return Array.from({ length: size }, (_, i) =>
    DRILL_SEQUENCE[(offset + i) % DRILL_SEQUENCE.length]);
}

/**
 * 把 25 题分给各块：每块先给 2 题，再先往「加一题不多占行」的块补，
 * 高度到上限就停，保证排版放得下。
 */
export function allocateCounts(kinds: readonly DrillKind[]): number[] {
  const layouts = kinds.map((kind) => BLOCK_LAYOUT[kind]);
  const budget = kinds.length <= 3 ? BLOCK_BUDGET_3 : BLOCK_BUDGET_4;
  const counts = layouts.map(() => 2);
  const height = () => layouts.reduce(
    (sum, layout, i) => sum + Math.ceil(counts[i] / layout.columns) * layout.rowHeight, 0);
  let total = counts.reduce((a, b) => a + b, 0);
  while (total < ITEMS_PER_SHEET) {
    let best = -1, bestCost = Infinity;
    layouts.forEach((layout, i) => {
      if (counts[i] >= layout.maxItems) return;
      const before = Math.ceil(counts[i] / layout.columns);
      const after = Math.ceil((counts[i] + 1) / layout.columns);
      const cost = (after - before) * layout.rowHeight;
      if (height() + cost > budget) return;
      // 代价相同时给题量最少的块，避免一块独大。
      if (cost < bestCost || (cost === bestCost && best >= 0 && counts[i] < counts[best])) {
        best = i; bestCost = cost;
      }
    });
    if (best < 0) break;
    counts[best] += 1;
    total += 1;
  }
  return counts;
}

/** 生成一道小题；尚未接通的题型先用加减题占位，后续批次逐个替换。 */
export function createItem(kind: DrillKind, random: () => number, id: string): DrillItem {
  if (kind === "fill") return createFillItem(random, id);
  if (kind === "vertical") return createVerticalItem(random, id);
  if (kind === "chain") return createChainItem(random, id);
  if (kind === "compare") return createCompareItem(random, id);
  if (kind === "operator") return createOperatorItem(random, id);
  if (kind === "spotError") return createSpotErrorItem(random, id);
  if (kind === "checkBack") return createCheckBackItem(random, id);
  return createOralItem(random, id);
}

export function validateItem(kind: DrillKind, item: DrillItem): boolean {
  if (kind === "fill") return validateFillItem(item);
  if (kind === "vertical") return validateVerticalItem(item);
  if (kind === "chain") return validateChainItem(item);
  if (kind === "compare") return validateCompareItem(item);
  if (kind === "operator") return validateOperatorItem(item);
  if (kind === "spotError") return validateSpotErrorItem(item);
  if (kind === "checkBack") return validateCheckBackItem(item);
  return validateOralItem(item);
}

/** 题目标记：同一份里不重复。 */
export function itemSignature(item: DrillItem): string {
  return JSON.stringify(item.data);
}

export function makeBlock(index: number, kind: DrillKind, items: readonly DrillItem[], sheet: number): DrillBlock {
  const layout = BLOCK_LAYOUT[kind];
  const ordinal = ["一", "二", "三", "四"][index] ?? String(index + 1);
  return {
    id: `s${sheet}-b${index + 1}`,
    kind,
    title: `${ordinal}、${layout.title}`,
    instruction: layout.instruction,
    columns: layout.columns,
    rowHeight: layout.rowHeight,
    items,
  };
}
