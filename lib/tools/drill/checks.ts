import type { CheckBackData, DrillItem, DrillOperator, SpotErrorData } from "./types";

/** 找错改正的排版设置：2 列、每行 18 毫米。 */
export const SPOT_ERROR_LAYOUT = { columns: 2, rowHeight: 18, maxItems: 6 } as const;
export const SPOT_ERROR_TITLE = "找错改正";
export const SPOT_ERROR_INSTRUCTION = "圈出错处，改在旁边。";

/** 算完检查的排版设置：4 列、每行 17 毫米（一行放两行字）。 */
export const CHECK_BACK_LAYOUT = { columns: 4, rowHeight: 17, maxItems: 12 } as const;
export const CHECK_BACK_TITLE = "算完检查";
export const CHECK_BACK_INSTRUCTION = "用另一个算式检查。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 先算一道对的题，再把得数改错，改动的幅度离正确得数 2～9。 */
export function createSpotErrorItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const roll = random();
    let a: number, b: number, operator: DrillOperator, value: number;
    if (roll < 0.4) {
      a = integer(random, 16, 80); b = integer(random, 14, 100 - a); operator = "+"; value = a + b;
    } else if (roll < 0.8) {
      a = integer(random, 36, 98); b = integer(random, 15, a - 8); operator = "-"; value = a - b;
    } else {
      a = integer(random, 3, 9); b = integer(random, 3, 9); operator = "×"; value = a * b;
    }
    const gap = integer(random, 2, 9);
    const shown = random() < 0.5 ? value - gap : value + gap;
    if (shown < 0 || shown > 100) continue;
    const data: SpotErrorData = { kind: "spotError", a, b, operator, shown };
    const item: DrillItem = { id, data, answer: { kind: "spotError", value } };
    if (validateSpotErrorItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的找错材料");
}

/** 正确的得数。 */
export function evaluateSpotError(data: SpotErrorData): number {
  if (data.operator === "+") return data.a + data.b;
  if (data.operator === "-") return data.a - data.b;
  return data.a * data.b;
}

export function validateSpotErrorItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "spotError" || answer.kind !== "spotError") return false;
  if (![data.a, data.b, data.shown, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (data.operator === "+" && (data.a < 16 || data.b < 14 || data.a + data.b > 100)) return false;
  if (data.operator === "-" && (data.a < 36 || data.b < 15 || data.a - data.b < 8)) return false;
  if (data.operator === "×" && (data.a < 3 || data.a > 9 || data.b < 3 || data.b > 9)) return false;
  const correct = evaluateSpotError(data);
  const gap = Math.abs(correct - data.shown);
  // 错的得数必须确实错，改动也要看得出来。
  return correct === answer.value && data.shown !== correct && gap >= 2 && gap <= 9;
}

export function spotErrorText(data: SpotErrorData): string {
  return `${data.a} ${data.operator} ${data.b} = ${data.shown}`;
}

/** 先写一个算式与结果，再用另一个算式检查。 */
export function createCheckBackItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (random() < 0.5) {
      const a = integer(random, 16, 82);
      const b = integer(random, 12, 100 - a);
      const data: CheckBackData = { kind: "checkBack", a, b, operator: "+" };
      const item: DrillItem = { id, data, answer: { kind: "checkBack", value: b } };
      if (validateCheckBackItem(item)) return item;
    } else {
      const a = integer(random, 36, 98);
      const b = integer(random, 13, a - 8);
      const data: CheckBackData = { kind: "checkBack", a, b, operator: "-" };
      const item: DrillItem = { id, data, answer: { kind: "checkBack", value: a } };
      if (validateCheckBackItem(item)) return item;
    }
  }
  throw new Error("暂时无法生成合法的检查材料");
}

/** 检查式的结果：加法题回到另一个加数，减法题回到被减数。 */
export function evaluateCheckBack(data: CheckBackData): number {
  if (data.operator === "+") return data.a + data.b - data.a;
  return data.a - data.b + data.b;
}

export function validateCheckBackItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "checkBack" || answer.kind !== "checkBack") return false;
  if (![data.a, data.b, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (data.operator === "+") return data.a >= 16 && data.a <= 82 && data.b >= 12 && data.a + data.b <= 100 && answer.value === data.b;
  return data.a >= 36 && data.b >= 13 && data.a - data.b >= 8 && answer.value === data.a;
}

/** 纸面两行：给出的算式，和要填的检查式。 */
export function checkBackText(data: CheckBackData): { given: string; check: string } {
  if (data.operator === "+") {
    const sum = data.a + data.b;
    return { given: `${data.a} + ${data.b} = ${sum}`, check: `${sum} - ${data.a} =` };
  }
  const diff = data.a - data.b;
  return { given: `${data.a} - ${data.b} = ${diff}`, check: `${diff} + ${data.b} =` };
}
