import {
  allocateCounts, BLOCK_LAYOUT, blockKindsForSheet, createItem, GRAPHIC_KINDS,
  itemSignature, makeBlock, validateItem,
} from "./blocks";
import type { DrillBlock, DrillItem, DrillMonthConfig, DrillPage, DrillPlan, DrillSheet } from "./types";
import { createMatchActivity } from "./matchLine";
import { createCircleActivity } from "./circleOut";
import { WORD_TEMPLATE_COUNT } from "./word";

/** 确定性的取数：同一份同一种子每次都生成同一张纸。 */
export function createDrillRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state;
  };
  // 小种子的头几个数偏小，先空跑几次再取数。
  for (let i = 0; i < 5; i += 1) next();
  return () => next() / 0x100000000;
}

/** 按实际年月取 28～31 份，否则用给定份数。 */
export function drillSheetCount(config: DrillMonthConfig = { count: 30 }): number {
  if ("count" in config) return Math.max(1, Math.min(31, Math.floor(config.count)));
  return new Date(Date.UTC(config.year, config.month, 0)).getUTCDate();
}

const ORDINALS = ["一", "二", "三", "四"];

function relabelPage(blocks: readonly DrillBlock[], offset: number): DrillBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    title: `${ORDINALS[index + offset]}、${BLOCK_LAYOUT[block.kind].title}`,
  }));
}

/** 固定正反面职责，分配题量与尺寸时保证放得下。 */
function assignPages(blocks: readonly DrillBlock[]): readonly [DrillBlock[], DrillBlock[]] {
  const graphic = blocks.find((block) => GRAPHIC_KINDS.includes(block.kind));
  const word = blocks.find((block) => block.kind === "word");
  const classic = blocks.filter((block) => block.kind !== "word" && !GRAPHIC_KINDS.includes(block.kind));
  if (!graphic || !word || classic.length !== 2)
    throw new Error("每份练习必须包含两个普通题块、一个图形题块和一道应用题");

  return [relabelPage([classic[0], graphic], 0), relabelPage([classic[1], word], 2)];
}

export function buildDrillSheet(sheetNumber: number, seed: number, wordTemplate?: number): DrillSheet {
  const random = createDrillRandom(seed ^ Math.imul(sheetNumber, 0x9e3779b1));
  const kinds = blockKindsForSheet(sheetNumber - 1);
  const counts = allocateCounts(kinds);
  const used = new Set<string>();
  const blocks = kinds.map((kind, index) => {
    const ids = Array.from({ length: counts[index] }, (_, item) => `s${sheetNumber}-b${index + 1}-i${item + 1}`);
    // 连线和圈选按整个活动生成，每个编号只有一道算式。
    if (kind === "matchLine") return makeBlock(index, kind, createMatchActivity(random, ids), sheetNumber);
    if (kind === "circleOut") return makeBlock(index, kind, createCircleActivity(random, ids), sheetNumber);
    const items: DrillItem[] = [];
    for (let n = 0; n < counts[index]; n += 1) {
      const id = ids[n];
      // 月内依次读到不同故事，种子改变轮换起点，避免随机抽样反复碰到同一情景。
      const story = wordTemplate ?? sheetNumber - 1 + (seed >>> 0);
      let item: DrillItem | undefined;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const candidate = createItem(kind, random, id, story);
        if (validateItem(kind, candidate) && !used.has(itemSignature(candidate))) {
          item = candidate;
          break;
        }
      }
      if (!item) throw new Error("暂时无法生成不重复的练习题");
      used.add(itemSignature(item));
      items.push(item);
    }
    return makeBlock(index, kind, items, sheetNumber);
  });
  const [front, back] = assignPages(blocks);
  const makePage = <S extends "front" | "back">(side: S, list: readonly DrillBlock[]) => ({
    side,
    title: "计算练习",
    prompt: side === "front" ? "先算一算，再玩图形。" : "想想方法，用到生活里。",
    blocks: list,
  }) as DrillPage & { side: S };
  return {
    id: `drill-${sheetNumber}-${seed}`,
    sheet: sheetNumber,
    title: "计算练习",
    objective: "100 以内加减、九九表",
    pages: [makePage("front", front), makePage("back", back)] as const,
  };
}

export function generateDrillPlan(seed = 1, config: DrillMonthConfig = { count: 30 }): DrillPlan {
  const count = drillSheetCount(config);
  return {
    seed, config, totalSheets: count,
    sheets: Array.from({ length: count }, (_, index) => buildDrillSheet(index + 1, seed)),
  };
}

/** 换题：同一份换一套材料，题型组合保持不变。 */
export function regenerateDrillSheet(plan: DrillPlan, sheetNumber: number, seed: number): DrillSheet {
  const target = Math.max(1, Math.min(plan.totalSheets, Math.floor(sheetNumber)));
  const usedStories = new Set<number>();
  for (const sheet of plan.sheets) for (const block of sheet.pages.flatMap((page) => page.blocks))
    for (const item of block.items) if (item.data.kind === "word") usedStories.add(item.data.story);
  // 换题同时避开原题及整册已用的情景，不能只换数字或挑中另一道公交题。
  const start = (target - 1 + (seed >>> 0)) % WORD_TEMPLATE_COUNT;
  for (let offset = 0; offset < WORD_TEMPLATE_COUNT; offset += 1) {
    const story = (start + offset) % WORD_TEMPLATE_COUNT;
    if (!usedStories.has(story)) return buildDrillSheet(target, seed, story);
  }
  throw new Error("暂时无法选择新的应用题情景");
}

export function drillSheetSignature(sheet: DrillSheet): string {
  return sheet.pages
    .flatMap((page) => page.blocks.flatMap((block) => block.items.map(itemSignature)))
    .sort()
    .join("|");
}

export function sheetItemCount(sheet: DrillSheet): number {
  return sheet.pages.reduce(
    (sum, page) => sum + page.blocks.reduce((count, block) => count + block.items.length, 0), 0);
}

export function sheetBlockKinds(sheet: DrillSheet): readonly string[] {
  return sheet.pages.flatMap((page) => page.blocks.map((block) => block.kind));
}
