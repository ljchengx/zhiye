import type { DrillItem, VerticalData } from "./types";

/** 列式计算的排版设置：4 列、每行 30 毫米（含答题区）。 */
export const VERTICAL_LAYOUT = { columns: 4, rowHeight: 30, maxItems: 8 } as const;
export const VERTICAL_TITLE = "列式计算";
export const VERTICAL_INSTRUCTION = "一步一步算。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 加减各四成、× 两成；× 只用九九表内的两个一位数。 */
export function createVerticalItem(random: () => number, id: string): DrillItem {
  const roll = random();
  let a: number, b: number, operator: VerticalData["operator"];
  if (roll < 0.4) {
    a = integer(random, 14, 86); b = integer(random, 12, 100 - a); operator = "+";
  } else if (roll < 0.8) {
    a = integer(random, 32, 100); b = integer(random, 13, a - 5); operator = "-";
  } else {
    a = integer(random, 2, 9); b = integer(random, 2, 9); operator = "×";
  }
  const value = operator === "+" ? a + b : operator === "-" ? a - b : a * b;
  return { id, data: { kind: "vertical", a, b, operator }, answer: { kind: "vertical", value } };
}

/** 独立重算。 */
export function evaluateVertical(data: VerticalData): number {
  if (data.operator === "+") return data.a + data.b;
  if (data.operator === "-") return data.a - data.b;
  return data.a * data.b;
}

export function validateVerticalItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "vertical" || answer.kind !== "vertical") return false;
  if (![data.a, data.b, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  // 同时检查运算结果，不能只验证操作数和答案的范围。
  if (evaluateVertical(data) !== answer.value) return false;
  if (data.operator === "+") return data.a >= 14 && data.a <= 86 && data.b >= 12 && data.a + data.b <= 100;
  if (data.operator === "-") return data.a >= 32 && data.b >= 13 && data.a - data.b >= 5;
  return data.a >= 2 && data.a <= 9 && data.b >= 2 && data.b <= 9;
}

/** 列式里的两行数字与符号。 */
export function verticalLines(data: VerticalData): { operator: string; top: string; bottom: string } {
  return { operator: data.operator, top: String(data.a), bottom: String(data.b) };
}
