import type { CompareData, DrillItem, DrillOperator, DrillSign, OperatorData } from "./types";

/** 比大小的排版设置：3 列、每行 10 毫米。 */
export const COMPARE_LAYOUT = { columns: 3, rowHeight: 10, maxItems: 15 } as const;
export const COMPARE_TITLE = "比大小";
export const COMPARE_INSTRUCTION = "填上 > < 或 =。";

/** 填符号的排版设置：4 列、每行 10 毫米。 */
export const OPERATOR_LAYOUT = { columns: 4, rowHeight: 10, maxItems: 16 } as const;
export const OPERATOR_TITLE = "填符号";
export const OPERATOR_INSTRUCTION = "填上合适的符号。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/**
 * 三种形态：一个加几另一个减几（一样大）、同一个加数（右边大）、
 * 同一个被减数（左边大）。都不必算出结果就能判断。
 */
export function createCompareItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const shape = integer(random, 0, 2);
    const shift = integer(random, 2, 8);
    let operator: DrillOperator = "+";
    let left: readonly number[], right: readonly number[];
    if (shape === 0) {
      const a = integer(random, 20, 55), b = integer(random, 18, 38);
      if (b - shift < 12 || a + shift > 78) continue;
      left = [a, b]; right = [a + shift, b - shift];
    } else if (shape === 1) {
      const a = integer(random, 20, 55), b = integer(random, 18, 38);
      if (a + shift > 78) continue;
      left = [a, b]; right = [a + shift, b];
    } else {
      operator = "-";
      const a = integer(random, 62, 96), b = integer(random, 16, 35);
      if (b + shift > 48) continue;
      left = [a, b]; right = [a, b + shift];
    }
    const data: CompareData = { kind: "compare", left, right, operator };
    const item: DrillItem = { id, data, answer: { kind: "compare", sign: compareSign(data) } };
    if (validateCompareItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的比大小材料");
}

/** 两边的结果与比较符号。 */
export function evaluateCompare(data: CompareData): { left: number; right: number; sign: DrillSign } {
  const value = (side: readonly number[]) =>
    data.operator === "+" ? side[0] + side[1] : side[0] - side[1];
  const left = value(data.left), right = value(data.right);
  return { left, right, sign: left > right ? ">" : left < right ? "<" : "=" };
}

function compareSign(data: CompareData): DrillSign {
  return evaluateCompare(data).sign;
}

export function validateCompareItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "compare" || answer.kind !== "compare") return false;
  if (data.left.length !== 2 || data.right.length !== 2) return false;
  const every = [...data.left, ...data.right].every((n) => Number.isInteger(n) && n >= 10 && n <= 96);
  if (!every) return false;
  const { left, right, sign } = evaluateCompare(data);
  if (left < 0 || right < 0 || left > 100 || right > 100) return false;
  if (answer.sign !== sign) return false;
  // 必须存在「只看数的变化」就能判断的路径。
  return data.left[0] === data.right[0] || data.left[1] === data.right[1]
    || (data.operator === "+" && data.left[0] - data.right[0] === data.right[1] - data.left[1]);
}

export function compareText(data: CompareData): string {
  return `${data.left[0]} ${data.operator} ${data.left[1]}`;
}
export function compareRightText(data: CompareData): string {
  return `${data.right[0]} ${data.operator} ${data.right[1]}`;
}

/**
 * 填符号：给出两个数与结果，填一个符号。
 * 生成时保证只有一种符号成立，答案唯一。
 */
export function createOperatorItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const useMulDiv = random() < 0.35;
    let a: number, b: number, result: number;
    let value: DrillOperator;
    if (useMulDiv) {
      if (random() < 0.5) {
        a = integer(random, 2, 9); b = integer(random, 2, 9); result = a * b; value = "×";
      } else {
        b = integer(random, 2, 9);
        const quotient = integer(random, 2, 9);
        a = b * quotient; result = quotient; value = "÷";
      }
    } else {
      if (random() < 0.5) {
        a = integer(random, 14, 80); b = integer(random, 12, 100 - a); result = a + b; value = "+";
      } else {
        a = integer(random, 34, 100); b = integer(random, 13, a - 8); result = a - b; value = "-";
      }
    }
    const data: OperatorData = { kind: "operator", a, b, result };
    const item: DrillItem = { id, data, answer: { kind: "operator", value } };
    if (validateOperatorItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的填符号材料");
}

/** 四种符号里实际成立的那些。 */
export function matchingOperators(data: OperatorData): readonly DrillOperator[] {
  const found: DrillOperator[] = [];
  if (data.a + data.b === data.result) found.push("+");
  if (data.a - data.b === data.result) found.push("-");
  if (data.a * data.b === data.result) found.push("×");
  if (data.b !== 0 && data.a / data.b === data.result) found.push("÷");
  return found;
}

export function validateOperatorItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "operator" || answer.kind !== "operator") return false;
  if (![data.a, data.b, data.result].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  const matches = matchingOperators(data);
  // 答案唯一才不会被猜出来。
  return matches.length === 1 && matches[0] === answer.value;
}

export function operatorText(data: OperatorData): string {
  return `${data.a} __ ${data.b} = ${data.result}`;
}
