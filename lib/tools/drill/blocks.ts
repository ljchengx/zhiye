import { CHAIN_INSTRUCTION, CHAIN_LAYOUT, CHAIN_TITLE, createChainItem, validateChainItem } from "./chain";
import { CIRCLE_INSTRUCTION, CIRCLE_LAYOUT, CIRCLE_TITLE, createCircleOutItem, validateCircleOutItem } from "./circleOut";
import { createDotCountItem, DOT_INSTRUCTION, DOT_LAYOUT, DOT_TITLE, validateDotCountItem } from "./dotCount";
import {
  CHECK_BACK_INSTRUCTION, CHECK_BACK_LAYOUT, CHECK_BACK_TITLE, createCheckBackItem, createSpotErrorItem,
  SPOT_ERROR_INSTRUCTION, SPOT_ERROR_LAYOUT, SPOT_ERROR_TITLE, validateCheckBackItem, validateSpotErrorItem,
} from "./checks";
import { createFillItem, validateFillItem } from "./fill";
import { createMatchItem, MATCH_INSTRUCTION, MATCH_LAYOUT, MATCH_TITLE, validateMatchItem } from "./matchLine";
import { createTowerItem, TOWER_INSTRUCTION, TOWER_LAYOUT, TOWER_TITLE, validateTowerItem } from "./numberTower";
import { createInOutItem, IN_OUT_INSTRUCTION, IN_OUT_LAYOUT, IN_OUT_TITLE, validateInOutItem } from "./inOut";
import { createNumberLineItem, NUMBER_LINE_INSTRUCTION, NUMBER_LINE_LAYOUT, NUMBER_LINE_TITLE, validateNumberLineItem } from "./numberLine";
import { createOralItem, ORAL_INSTRUCTION, ORAL_LAYOUT, ORAL_TITLE, validateOralItem } from "./oral";
import {
  COMPARE_INSTRUCTION, COMPARE_LAYOUT, COMPARE_TITLE, createCompareItem, createOperatorItem,
  OPERATOR_INSTRUCTION, OPERATOR_LAYOUT, OPERATOR_TITLE, validateCompareItem, validateOperatorItem,
} from "./relations";
import {
  createMakeTenItem, createManyWaysItem, createSplitItem, MAKE_TEN_INSTRUCTION, MAKE_TEN_LAYOUT,
  MAKE_TEN_TITLE, MANY_WAYS_INSTRUCTION, MANY_WAYS_LAYOUT, MANY_WAYS_TITLE, SPLIT_INSTRUCTION,
  SPLIT_LAYOUT, SPLIT_TITLE, validateMakeTenItem, validateManyWaysItem, validateSplitItem,
} from "./strategies";
import { createVerticalItem, validateVerticalItem } from "./vertical";
import { createWordItem, validateWordItem, WORD_INSTRUCTION, WORD_LAYOUT, WORD_TITLE } from "./word";
import type { DrillBlock, DrillItem, DrillKind } from "./types";

/** 每份固定 20 题：图形题占地方，题量相应收一些。 */
export const ITEMS_PER_SHEET = 20;
/** 每份 4 块：3 块轮换题型，最后一块固定是生活应用题。 */
export const BLOCKS_PER_SHEET = 4;
/** 用来轮换的块数。 */
export const ROTATING_PER_SHEET = BLOCKS_PER_SHEET - 1;
/** 单个题块最多几题，避免一类题写很多。 */
export const MAX_PER_BLOCK = 10;
/** 每份固定的生活应用题题量。 */
export const WORD_ITEMS_PER_SHEET = 2;


/**
 * 用来轮换的 13 种题型：占地题型落在位置 0、2、5、8、11，
 * 这样每一段都有两个以上能放较多题目的短题型，25 题才排得下。
 * 应用题不放进轮换，每份固定一块。
 */
export const DRILL_SEQUENCE: readonly DrillKind[] = [
  "vertical", "oral", "spotError", "fill",
  "compare", "manyWays", "operator", "chain",
  "numberLine", "checkBack", "inOut",
  "split", "makeTen",
  "numberTower", "circleOut", "matchLine", "dotCount",
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
  oral: { ...ORAL_LAYOUT, columns: 3, rowHeight: 11, maxItems: 10, title: ORAL_TITLE, instruction: ORAL_INSTRUCTION },
  vertical: { columns: 4, rowHeight: 30, maxItems: 10, title: "列式计算", instruction: "一步一步算。" },
  fill: { columns: 3, rowHeight: 11, maxItems: 10, title: "填空", instruction: "把缺的数填上。" },
  spotError: { ...SPOT_ERROR_LAYOUT, columns: 2, rowHeight: 22, maxItems: 10, title: SPOT_ERROR_TITLE, instruction: SPOT_ERROR_INSTRUCTION },
  chain: { ...CHAIN_LAYOUT, columns: 2, rowHeight: 12, maxItems: 10, title: CHAIN_TITLE, instruction: CHAIN_INSTRUCTION },
  checkBack: { ...CHECK_BACK_LAYOUT, columns: 3, rowHeight: 20, maxItems: 10, title: CHECK_BACK_TITLE, instruction: CHECK_BACK_INSTRUCTION },
  compare: { ...COMPARE_LAYOUT, columns: 2, rowHeight: 11, maxItems: 10, title: COMPARE_TITLE, instruction: COMPARE_INSTRUCTION },
  manyWays: { ...MANY_WAYS_LAYOUT, columns: 2, rowHeight: 24, maxItems: 10, title: MANY_WAYS_TITLE, instruction: MANY_WAYS_INSTRUCTION },
  operator: { ...OPERATOR_LAYOUT, columns: 3, rowHeight: 11, maxItems: 10, title: OPERATOR_TITLE, instruction: OPERATOR_INSTRUCTION },
  makeTen: { ...MAKE_TEN_LAYOUT, columns: 2, rowHeight: 18, maxItems: 10, title: MAKE_TEN_TITLE, instruction: MAKE_TEN_INSTRUCTION },
  inOut: { ...IN_OUT_LAYOUT, columns: 2, rowHeight: 22, maxItems: 10, title: IN_OUT_TITLE, instruction: IN_OUT_INSTRUCTION },
  numberLine: { ...NUMBER_LINE_LAYOUT, columns: 2, rowHeight: 26, maxItems: 10, title: NUMBER_LINE_TITLE, instruction: NUMBER_LINE_INSTRUCTION },
  split: { ...SPLIT_LAYOUT, columns: 3, rowHeight: 11, maxItems: 10, title: SPLIT_TITLE, instruction: SPLIT_INSTRUCTION },
  word: { ...WORD_LAYOUT, columns: 1, rowHeight: 26, maxItems: 6, title: WORD_TITLE, instruction: WORD_INSTRUCTION },
  numberTower: { ...TOWER_LAYOUT, title: TOWER_TITLE, instruction: TOWER_INSTRUCTION },
  dotCount: { ...DOT_LAYOUT, title: DOT_TITLE, instruction: DOT_INSTRUCTION },
  matchLine: { ...MATCH_LAYOUT, title: MATCH_TITLE, instruction: MATCH_INSTRUCTION },
  circleOut: { ...CIRCLE_LAYOUT, title: CIRCLE_TITLE, instruction: CIRCLE_INSTRUCTION },
};

export function blocksPerSheet(): number {
  return BLOCKS_PER_SHEET;
}

/**
 * 第 index 份（0 基）取序列里连续 3-4 个位置：各段首尾相接，
 * 连续四份正好走完全部 14 种题型，四份之内不重复。
 */
/** 图形化的四种题型：每份放一个，隔四份轮一次。 */
export const GRAPHIC_KINDS: readonly DrillKind[] = ["numberTower", "dotCount", "matchLine", "circleOut"];
const GRAPHIC_SET: ReadonlySet<string> = new Set(GRAPHIC_KINDS);
/** 除图形题之外用来轮换的题型。 */
export const CLASSIC_KINDS: readonly DrillKind[] = DRILL_SEQUENCE.filter((kind) => !GRAPHIC_SET.has(kind));

/**
 * 每份四块：两个算式题型 + 一个图形题 + 一道生活应用题，一共 20 题。
 * 图形题容量小，单独占一块，免得和其它短题型挤在一起凑不满 25 题。
 */
export function blockKindsForSheet(index: number): readonly DrillKind[] {
  const graphic = GRAPHIC_KINDS[index % GRAPHIC_KINDS.length];
  const offset = (index * 2) % CLASSIC_KINDS.length;
  const classic = [CLASSIC_KINDS[offset], CLASSIC_KINDS[(offset + 1) % CLASSIC_KINDS.length]];
  // 应用题排在最后，作为每份的收尾。
  return [...classic, graphic, "word"];
}

/**
 * 把 25 题分给各块：每块先给 2 题，再先往「加一题不多占行」的块补，
 * 高度到上限就停，保证排版放得下。
 */
export function allocateCounts(kinds: readonly DrillKind[]): number[] {
  const layouts = kinds.map((kind) => BLOCK_LAYOUT[kind]);
  // 应用题每份固定两题，其余题量在别的题块间平均。
  const counts: number[] = kinds.map((kind) => (kind === "word" ? WORD_ITEMS_PER_SHEET : 0));
  let total = counts.reduce((sum, count) => sum + count, 0);
  while (total < ITEMS_PER_SHEET) {
    let best = -1;
    layouts.forEach((layout, index) => {
      if (kinds[index] === "word") return;
      if (counts[index] >= Math.min(layout.maxItems, MAX_PER_BLOCK)) return;
      if (best < 0 || counts[index] < counts[best]) best = index;
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
  if (kind === "manyWays") return createManyWaysItem(random, id);
  if (kind === "makeTen") return createMakeTenItem(random, id);
  if (kind === "split") return createSplitItem(random, id);
  if (kind === "numberLine") return createNumberLineItem(random, id);
  if (kind === "inOut") return createInOutItem(random, id);
  if (kind === "word") return createWordItem(random, id);
  if (kind === "numberTower") return createTowerItem(random, id);
  if (kind === "dotCount") return createDotCountItem(random, id);
  if (kind === "matchLine") return createMatchItem(random, id);
  if (kind === "circleOut") return createCircleOutItem(random, id);
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
  if (kind === "manyWays") return validateManyWaysItem(item);
  if (kind === "makeTen") return validateMakeTenItem(item);
  if (kind === "split") return validateSplitItem(item);
  if (kind === "numberLine") return validateNumberLineItem(item);
  if (kind === "inOut") return validateInOutItem(item);
  if (kind === "word") return validateWordItem(item);
  if (kind === "numberTower") return validateTowerItem(item);
  if (kind === "dotCount") return validateDotCountItem(item);
  if (kind === "matchLine") return validateMatchItem(item);
  if (kind === "circleOut") return validateCircleOutItem(item);
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
