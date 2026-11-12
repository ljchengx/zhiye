import type { DotCountData, DrillItem } from "./types";

/** 数一数的排版设置：一行一题，每题 30 毫米。 */
export const DOT_LAYOUT = { columns: 1, rowHeight: 30, maxItems: 3 } as const;
export const DOT_TITLE = "数一数";
export const DOT_INSTRUCTION = "按行数清楚，一共多少个？";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/**
 * 用素材库里的角色排成几行，让孩子按行数。
 * 一共不超过 24，方便用「几个十几个一」的说法。
 */
export function createDotCountItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const rows = integer(random, 2, 4);
    const columns = integer(random, 3, 6);
    if (rows * columns > 24) continue;
    const data: DotCountData = { kind: "dotCount", rows, columns, assetIndex: integer(random, 0, 84) };
    const item: DrillItem = { id, data, answer: { kind: "dotCount", value: rows * columns } };
    if (validateDotCountItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的数数材料");
}

export function evaluateDotCount(data: DotCountData): number {
  return data.rows * data.columns;
}

export function validateDotCountItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "dotCount" || answer.kind !== "dotCount") return false;
  if (!Number.isInteger(data.rows) || !Number.isInteger(data.columns)) return false;
  if (data.rows < 2 || data.rows > 4 || data.columns < 3 || data.columns > 6) return false;
  if (!Number.isInteger(data.assetIndex) || data.assetIndex < 0 || data.assetIndex > 84) return false;
  const total = evaluateDotCount(data);
  return total <= 24 && answer.value === total;
}

/** 题面文字：几个一行，一共几行。 */
export function dotCountText(data: DotCountData): string {
  return `${data.rows} 行，每行 ${data.columns} 个`;
}
