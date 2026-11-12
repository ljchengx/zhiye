import type { DrillItem, DrillOperator, WordData } from "./types";

/** 应用题的排版设置：一行一题，每题 22 毫米。 */
export const WORD_LAYOUT = { columns: 1, rowHeight: 22, maxItems: 4 } as const;
export const WORD_TITLE = "应用题";
export const WORD_INSTRUCTION = "读一读，列式算出来。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 四类一步应用题，全部只用两位数与九九表内的数。 */
function buildText(operator: DrillOperator, a: number, b: number): string {
  if (operator === "+") return `有 ${a} 个，又添 ${b} 个，一共多少个？`;
  if (operator === "-") return `有 ${a} 个，用掉 ${b} 个，还剩多少个？`;
  if (operator === "×") return `每盒 ${a} 个，${b} 盒一共多少个？`;
  return `${a} 个分给 ${b} 人，每人几个？`;
}

export function createWordItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const shape = integer(random, 0, 3);
    let operator: DrillOperator, a: number, b: number, value: number;
    if (shape === 0) {
      a = integer(random, 16, 72); b = integer(random, 12, 100 - a); operator = "+"; value = a + b;
    } else if (shape === 1) {
      a = integer(random, 36, 96); b = integer(random, 14, a - 12); operator = "-"; value = a - b;
    } else if (shape === 2) {
      a = integer(random, 3, 9); b = integer(random, 3, 9); operator = "×"; value = a * b;
    } else {
      b = integer(random, 3, 9);
      const per = integer(random, 3, 9);
      a = b * per; operator = "÷"; value = per;
    }
    const data: WordData = { kind: "word", operator, a, b, text: buildText(operator, a, b), value };
    const item: DrillItem = { id, data, answer: { kind: "word", value } };
    if (validateWordItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的应用题材料");
}

export function evaluateWord(data: WordData): number {
  if (data.operator === "+") return data.a + data.b;
  if (data.operator === "-") return data.a - data.b;
  if (data.operator === "×") return data.a * data.b;
  return data.a / data.b;
}

export function validateWordItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "word" || answer.kind !== "word") return false;
  if (![data.a, data.b, data.value, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (data.operator === "+" && (data.a < 16 || data.b < 12 || data.a + data.b > 100)) return false;
  if (data.operator === "-" && (data.a < 36 || data.b < 14 || data.a - data.b < 12)) return false;
  if (data.operator === "×" && (data.a < 3 || data.a > 9 || data.b < 3 || data.b > 9)) return false;
  if (data.operator === "÷" && (data.b < 3 || data.b > 9 || data.a % data.b !== 0)) return false;
  if (evaluateWord(data) !== data.value) return false;
  // 题面必须与算式对得上，也不能写太长。
  const expected = buildText(data.operator, data.a, data.b);
  return data.text === expected && answer.value === data.value && data.text.length <= 24;
}

export function wordText(data: WordData): string {
  return data.text;
}
