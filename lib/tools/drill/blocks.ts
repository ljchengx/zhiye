import { CHAIN_INSTRUCTION, CHAIN_LAYOUT, CHAIN_TITLE, createChainItem, validateChainItem } from "./chain";
import { circleOutText, CIRCLE_INSTRUCTION, CIRCLE_LAYOUT, CIRCLE_TITLE, createCircleOutItem, validateCircleOutItem } from "./circleOut";
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
import { blockHeight, DRILL_PAGE } from "./metrics";

/** 每份固定 16 个编号小题，给孩子留出足够的书写与观察空间。 */
export const ITEMS_PER_SHEET = 16;
/** 每份 4 块：3 块轮换题型，最后一块固定是生活应用题。 */
export const BLOCKS_PER_SHEET = 4;
/** 用来轮换的块数。 */
export const ROTATING_PER_SHEET = BLOCKS_PER_SHEET - 1;
/** 普通题块最多 6 题，图形题另按活动容量限制。 */
export const MAX_PER_BLOCK = 6;
/** 每份固定一道生活应用题。 */
export const WORD_ITEMS_PER_SHEET = 1;


/** 17 种轮换题型；应用题每份固定出现。 */
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
  /** 写在题目标题旁的家长方法说明，包含做法、提问和学习目的。 */
  parentHint: string;
  minRowHeight: number;
  preferredRowHeight: number;
  visualWeight: number;
  minItemGap: number;
  minBlockHeight: number;
}

function defineLayout(
  base: Pick<BlockLayout, "columns" | "rowHeight" | "maxItems">,
  title: string,
  instruction: string,
  minRowHeight: number,
  visualWeight: number,
): BlockLayout {
  return {
    ...base,
    title,
    instruction,
    parentHint: PARENT_HINTS[title] ?? "先让孩子说出想法，再动笔验证。",
    minRowHeight,
    preferredRowHeight: base.rowHeight,
    visualWeight,
    minItemGap: 2,
    minBlockHeight: DRILL_PAGE.blockHead + DRILL_PAGE.blockPad + minRowHeight,
  };
}

/** 每种题型都用「做法—提问—目的」说明，帮助家长提供支架而不是代答。 */
const PARENT_HINTS: Readonly<Record<string, string>> = {
  "直接写出得数": "先独立回忆；提问：看出什么关系？目的：提高提取速度。",
  "列式计算": "按十位、个位分步；提问：哪一位先算？目的：建立位值概念。",
  "填空": "先看等号关系；提问：空格改变哪部分？目的：发展逆向推理。",
  "找错改正": "先估算再复算；提问：哪一步与数量不符？目的：练习错误分析。",
  "连加连减": "记录中间结果；提问：这一步依据什么？目的：稳定运算顺序。",
  "算完检查": "用逆运算回到原数；提问：结果为何一致？目的：形成自我校验。",
  "比大小": "先估算再精算；提问：哪个变化决定大小？目的：建立数量关系。",
  "一题多解": "独立想两种表示；提问：它们哪里相同？目的：培养策略迁移。",
  "填符号": "逐个代入验证；提问：怎样排除其他符号？目的：练习论证唯一性。",
  "凑整再算": "先补成整十；提问：补的数从哪里来？目的：理解等值变形。",
  "进几出几": "比较相邻变化；提问：变化始终相同吗？目的：概括稳定规律。",
  "数线移动": "把跳跃画在线上；提问：终点怎样得到？目的：连接数量与运算。",
  "数的拆分": "用图示拆分；提问：还能换一种吗？目的：理解部分与整体。",
  "应用题": "复述已知和所求；提问：哪个数量发生变化？目的：建立情境模型。",
  "加一加": "先找相邻两数；提问：上一层由谁合成？目的：看见结构关系。",
  "数一数": "按行分组再计算；提问：每组有几个？目的：连接乘法与重复加法。",
  "连一连": "先算左边结果；提问：怎样用排除法复核？目的：练习对应与验证。",
  "圈一圈": "逐题计算并记录；提问：按什么条件判断？目的：区分计算与决策。",
};

/** 排版设置、题量上限与视觉负担；同一套数据同时服务生成和排版。 */
export const BLOCK_LAYOUT: Record<DrillKind, BlockLayout> = {
  oral: defineLayout({ ...ORAL_LAYOUT, columns: 2, rowHeight: 26, maxItems: 6 }, ORAL_TITLE, ORAL_INSTRUCTION, 20, 1),
  vertical: defineLayout({ columns: 3, rowHeight: 44, maxItems: 6 }, "列式计算", "一步一步算。", 41, 1.7),
  fill: defineLayout({ columns: 2, rowHeight: 26, maxItems: 6 }, "填空", "把缺的数填上。", 20, 1),
  spotError: defineLayout({ ...SPOT_ERROR_LAYOUT, columns: 2, rowHeight: 34, maxItems: 6 }, SPOT_ERROR_TITLE, SPOT_ERROR_INSTRUCTION, 28, 1.3),
  chain: defineLayout({ ...CHAIN_LAYOUT, columns: 2, rowHeight: 26, maxItems: 6 }, CHAIN_TITLE, CHAIN_INSTRUCTION, 20, 1.1),
  checkBack: defineLayout({ ...CHECK_BACK_LAYOUT, columns: 2, rowHeight: 34, maxItems: 6 }, CHECK_BACK_TITLE, CHECK_BACK_INSTRUCTION, 28, 1.3),
  compare: defineLayout({ ...COMPARE_LAYOUT, columns: 2, rowHeight: 26, maxItems: 6 }, COMPARE_TITLE, COMPARE_INSTRUCTION, 20, 1),
  manyWays: defineLayout({ ...MANY_WAYS_LAYOUT, columns: 2, rowHeight: 42, maxItems: 6 }, MANY_WAYS_TITLE, MANY_WAYS_INSTRUCTION, 39, 1.6),
  operator: defineLayout({ ...OPERATOR_LAYOUT, columns: 2, rowHeight: 26, maxItems: 6 }, OPERATOR_TITLE, OPERATOR_INSTRUCTION, 20, 1),
  makeTen: defineLayout({ ...MAKE_TEN_LAYOUT, columns: 2, rowHeight: 26, maxItems: 6 }, MAKE_TEN_TITLE, MAKE_TEN_INSTRUCTION, 20, 1.2),
  inOut: defineLayout({ ...IN_OUT_LAYOUT, columns: 2, rowHeight: 38, maxItems: 6 }, IN_OUT_TITLE, IN_OUT_INSTRUCTION, 32, 1.4),
  numberLine: defineLayout({ ...NUMBER_LINE_LAYOUT, columns: 2, rowHeight: 40, maxItems: 6 }, NUMBER_LINE_TITLE, NUMBER_LINE_INSTRUCTION, 36, 1.4),
  split: defineLayout({ ...SPLIT_LAYOUT, columns: 2, rowHeight: 26, maxItems: 6 }, SPLIT_TITLE, SPLIT_INSTRUCTION, 20, 1),
  word: defineLayout({ ...WORD_LAYOUT, columns: 1, rowHeight: 72, maxItems: 1 }, WORD_TITLE, WORD_INSTRUCTION, 62, 1.6),
  numberTower: defineLayout({ ...TOWER_LAYOUT, columns: 2, maxItems: 4, rowHeight: 46 }, TOWER_TITLE, TOWER_INSTRUCTION, 42, 1.2),
  dotCount: defineLayout({ ...DOT_LAYOUT, columns: 2, maxItems: 4, rowHeight: 44 }, DOT_TITLE, DOT_INSTRUCTION, 38, 1.2),
  matchLine: defineLayout({ ...MATCH_LAYOUT, rowHeight: 24 }, MATCH_TITLE, MATCH_INSTRUCTION, 22, 1.1),
  circleOut: defineLayout({ ...CIRCLE_LAYOUT, rowHeight: 30 }, CIRCLE_TITLE, CIRCLE_INSTRUCTION, 24, 1.1),
};

export function blocksPerSheet(): number {
  return BLOCKS_PER_SHEET;
}

/** 图形化的四种题型：每份放一个，隔四份轮一次。 */
export const GRAPHIC_KINDS: readonly DrillKind[] = ["numberTower", "dotCount", "matchLine", "circleOut"];
const GRAPHIC_SET: ReadonlySet<string> = new Set(GRAPHIC_KINDS);
/** 除图形题之外用来轮换的题型。 */
export const CLASSIC_KINDS: readonly DrillKind[] = DRILL_SEQUENCE.filter((kind) => !GRAPHIC_SET.has(kind));
/** 正面先做计算，反面再观察关系、尝试策略。 */
export const CALCULATION_KINDS: readonly DrillKind[] = ["vertical", "oral", "fill", "chain"];
export const THINKING_KINDS: readonly DrillKind[] = CLASSIC_KINDS.filter((kind) => !CALCULATION_KINDS.includes(kind));

/**
 * 每份四块：两个普通题型 + 一个图形题 + 一道生活应用题，一共 16 个编号小题。
 * 页面职责固定，避免按估算高度随机换页。
 */
export function blockKindsForSheet(index: number): readonly DrillKind[] {
  const graphic = GRAPHIC_KINDS[index % GRAPHIC_KINDS.length];
  const classic = [CALCULATION_KINDS[index % CALCULATION_KINDS.length], THINKING_KINDS[index % THINKING_KINDS.length]];
  // 应用题排在最后，作为每份的收尾。
  return [...classic, graphic, "word"];
}

/**
 * 按视觉负担分配 16 个编号小题：先达到各题块的基本练习量，
 * 再把剩余题量给当前占用最少的题块，保证图形和应用题不被挤压。
 */
export function allocateCounts(kinds: readonly DrillKind[]): number[] {
  let best: number[] | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  const search = (counts: number[], total: number) => {
    if (counts.length < kinds.length) {
      const kind = kinds[counts.length], layout = BLOCK_LAYOUT[kind];
      const minimum = kind === "word" ? WORD_ITEMS_PER_SHEET : 4;
      const maximum = Math.min(layout.maxItems, GRAPHIC_SET.has(kind) ? 4 : MAX_PER_BLOCK);
      for (let count = minimum; count <= maximum && total + count <= ITEMS_PER_SHEET; count += 1)
        search([...counts, count], total + count);
      return;
    }
    if (total !== ITEMS_PER_SHEET) return;
    const height = (index: number, preferred = false) => blockHeight(BLOCK_LAYOUT[kinds[index]], counts[index], preferred);
    const capacity = DRILL_PAGE.bottom - DRILL_PAGE.top - DRILL_PAGE.blockGap;
    // 使用与绘制一致的最低高度排除放不下的组合，不靠缩字号补救。
    if (height(0) + height(2) > capacity || height(1) + height(3) > capacity) return;
    const score = counts.reduce((sum, count, index) =>
      sum + height(index, true) * BLOCK_LAYOUT[kinds[index]].visualWeight + count * count * 3, 0);
    if (score < bestScore) { best = counts; bestScore = score; }
  };
  if (kinds.length === BLOCKS_PER_SHEET) search([], 0);
  if (!best) throw new Error("题块容量不足，无法生成完整练习");
  return best;
}

/** 按题型生成一道可独立验算的小题。 */
export function createItem(
  kind: DrillKind, random: () => number, id: string,
  wordTemplate?: number, excludedMatchValues?: ReadonlySet<number>,
): DrillItem {
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
  if (kind === "word") return createWordItem(random, id, wordTemplate);
  if (kind === "numberTower") return createTowerItem(random, id);
  if (kind === "dotCount") return createDotCountItem(random, id);
  if (kind === "matchLine") return createMatchItem(random, id, excludedMatchValues);
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
    instruction: kind === "circleOut" && items[0]?.data.kind === "circleOut" ? circleOutText(items[0].data) : layout.instruction,
    columns: layout.columns,
    rowHeight: layout.rowHeight,
    items,
  };
}
