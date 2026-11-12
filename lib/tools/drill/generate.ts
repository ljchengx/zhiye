import {
  allocateCounts, BLOCK_LAYOUT, blockKindsForSheet, createItem, itemSignature, makeBlock, validateItem,
} from "./blocks";
import type { DrillBlock, DrillItem, DrillMonthConfig, DrillPage, DrillPlan, DrillSheet } from "./types";

/** 确定性的取数：同一份同一种子每次都生成同一张纸。 */
export function createDrillRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5; state >>>= 0;
    return state / 0x100000000;
  };
}

/** 按实际年月取 28～31 份，否则用给定份数。 */
export function drillSheetCount(config: DrillMonthConfig = { count: 30 }): number {
  if ("count" in config) return Math.max(1, Math.min(31, Math.floor(config.count)));
  return new Date(Date.UTC(config.year, config.month, 0)).getUTCDate();
}

const ORDINALS = ["一", "二", "三", "四"];

/** 把题块按高度平均分到正反面，再按「正面在前」重新编号。 */
function balance(blocks: readonly DrillBlock[]): readonly [DrillBlock[], DrillBlock[]] {
  const height = (block: DrillBlock) =>
    13 + Math.ceil(block.items.length / block.columns) * block.rowHeight;
  const ranked = [...blocks].sort((a, b) => height(b) - height(a));
  const front: DrillBlock[] = [], back: DrillBlock[] = [];
  ranked.forEach((block, index) => (index % 2 === 0 ? front : back).push(block));
  const inOrder = (list: DrillBlock[]) =>
    [...list].sort((a, b) => blocks.indexOf(a) - blocks.indexOf(b));
  const ordered = [...inOrder(front), ...inOrder(back)].map((block, index) => ({
    ...block,
    title: `${ORDINALS[index] ?? String(index + 1)}、${BLOCK_LAYOUT[block.kind].title}`,
  }));
  return [ordered.slice(0, front.length), ordered.slice(front.length)];
}

export function buildDrillSheet(sheetNumber: number, seed: number): DrillSheet {
  const random = createDrillRandom(seed ^ Math.imul(sheetNumber, 0x9e3779b1));
  const kinds = blockKindsForSheet(sheetNumber - 1);
  const counts = allocateCounts(kinds);
  const used = new Set<string>();
  const blocks = kinds.map((kind, index) => {
    const items: DrillItem[] = [];
    for (let n = 0; n < counts[index]; n += 1) {
      const id = `s${sheetNumber}-b${index + 1}-i${n + 1}`;
      let item = createItem(kind, random, id);
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (validateItem(kind, item) && !used.has(itemSignature(item))) break;
        item = createItem(kind, random, id);
      }
      used.add(itemSignature(item));
      items.push(item);
    }
    return makeBlock(index, kind, items, sheetNumber);
  });
  const [front, back] = balance(blocks);
  const makePage = <S extends "front" | "back">(side: S, list: readonly DrillBlock[]) => ({
    side,
    title: "计算练习",
    prompt: side === "front" ? "看清符号，写出得数。" : "先想清楚，再写下来。",
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
  return buildDrillSheet(target, seed);
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
