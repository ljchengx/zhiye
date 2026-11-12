import type { DrillItem, NumberLineData } from "./types";

/** 数线移动的排版设置：2 列、每行 20 毫米。 */
export const NUMBER_LINE_LAYOUT = { columns: 2, rowHeight: 20, maxItems: 6 } as const;
export const NUMBER_LINE_TITLE = "数线移动";
export const NUMBER_LINE_INSTRUCTION = "在数线上画一画。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 两段：先走整十，再走个位；终点不超过 100。 */
export function createNumberLineItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const start = integer(random, 18, 72);
    const decade = integer(random, 1, 3) * 10;
    const ones = integer(random, 2, 9);
    if (start + decade + ones > 100) continue;
    const data: NumberLineData = { kind: "numberLine", start, jumps: [decade, ones] };
    const item: DrillItem = { id, data, answer: { kind: "numberLine", value: start + decade + ones } };
    if (validateNumberLineItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的数线材料");
}

export function evaluateNumberLine(data: NumberLineData): number {
  return data.jumps.reduce((total, jump) => total + jump, data.start);
}

export function validateNumberLineItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "numberLine" || answer.kind !== "numberLine") return false;
  if (data.jumps.length !== 2) return false;
  const [decade, ones] = data.jumps;
  if (![data.start, decade, ones, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  // 先走整十、再走个位，孩子才看得出数位。
  if (data.start < 18 || data.start > 72) return false;
  if (decade % 10 !== 0 || decade < 10 || decade > 30) return false;
  if (ones < 2 || ones > 9) return false;
  return evaluateNumberLine(data) === answer.value && answer.value <= 100;
}

export function numberLineText(data: NumberLineData): string {
  return `${data.start} 起，先 +${data.jumps[0]} 再 +${data.jumps[1]}`;
}
