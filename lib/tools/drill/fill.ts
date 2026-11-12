import type { DrillItem, DrillOperator, FillData } from "./types";

/** 填空题的排版设置：4 列、每行 10 毫米。 */
export const FILL_LAYOUT = { columns: 4, rowHeight: 10, maxItems: 16 } as const;
export const FILL_TITLE = "填空";
export const FILL_INSTRUCTION = "把缺的数填上。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 先算一道完整的题，再去掉一个位置；去掉后的答案都唯一。 */
export function createFillItem(random: () => number, id: string): DrillItem {
  const roll = random();
  let a: number, b: number, operator: DrillOperator, result: number;
  if (roll < 0.3) {
    a = integer(random, 14, 86); b = integer(random, 12, 100 - a); operator = "+"; result = a + b;
  } else if (roll < 0.6) {
    a = integer(random, 32, 100); b = integer(random, 13, a - 5); operator = "-"; result = a - b;
  } else if (roll < 0.8) {
    a = integer(random, 2, 9); b = integer(random, 2, 9); operator = "×"; result = a * b;
  } else {
    const divisor = integer(random, 2, 9);
    const quotient = integer(random, 2, 9);
    a = divisor * quotient; b = divisor; operator = "÷"; result = quotient;
  }
  const blank = integer(random, 0, 2) as 0 | 1 | 2;
  const data: FillData = {
    kind: "fill",
    a: blank === 0 ? null : a,
    b: blank === 1 ? null : b,
    result: blank === 2 ? null : result,
    operator,
  };
  return { id, data, answer: { kind: "fill", value: [a, b, result][blank], blank } };
}

/** 由另外两个数重算被去掉的那个，不使用生成时的中间结果。 */
export function evaluateFill(data: FillData): number {
  const { a, b, result, operator } = data;
  const solve = (left: number, right: number, target: number) => {
    if (operator === "+") { if (a === null) return target - right; if (b === null) return target - left; return left + right; }
    if (operator === "-") { if (a === null) return target + right; if (b === null) return left - target; return left - right; }
    if (operator === "×") { if (a === null) return target / right; if (b === null) return target / left; return left * right; }
    if (a === null) return target * right;
    if (b === null) return left / target;
    return left / right;
  };
  return solve(a ?? 0, b ?? 0, result ?? 0);
}

export function validateFillItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "fill" || answer.kind !== "fill") return false;
  const blanks = [data.a, data.b, data.result].filter((value) => value === null).length;
  if (blanks !== 1) return false;
  const full: number[] = [data.a, data.b, data.result].map((value, index) =>
    value ?? (index === answer.blank ? answer.value : value ?? 0));
  if (full.some((value) => !Number.isInteger(value) || value < 0 || value > 100)) return false;
  const [left, right, target] = full;
  if (data.operator === "+") return left >= 14 && right >= 12 && left + right === target && target <= 100;
  if (data.operator === "-") return left >= 32 && right >= 13 && left - right === target && target >= 5;
  if (data.operator === "×") return left >= 2 && left <= 9 && right >= 2 && right <= 9 && left * right === target;
  return right >= 2 && right <= 9 && left <= 81 && left % right === 0 && left / right === target;
}

/** 纸面文字：空缺位置画横线。 */
export function fillText(data: FillData): { parts: readonly string[]; blank: 0 | 1 | 2 } {
  const blank = data.a === null ? 0 : data.b === null ? 1 : 2;
  const value = (n: number | null) => (n === null ? "" : String(n));
  return { parts: [value(data.a), data.operator, value(data.b), "=", value(data.result)], blank };
}
