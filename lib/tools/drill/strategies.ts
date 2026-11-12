import type { DrillItem, MakeTenData, ManyWaysData, SplitData } from "./types";

/** 一题多解的排版设置：2 列、每行 20 毫米（留两行写法）。 */
export const MANY_WAYS_LAYOUT = { columns: 2, rowHeight: 20, maxItems: 6 } as const;
export const MANY_WAYS_TITLE = "一题多解";
export const MANY_WAYS_INSTRUCTION = "用两种方法算。";

/** 凑整再算的排版设置：3 列、每行 14 毫米。 */
export const MAKE_TEN_LAYOUT = { columns: 3, rowHeight: 14, maxItems: 12 } as const;
export const MAKE_TEN_TITLE = "凑整再算";
export const MAKE_TEN_INSTRUCTION = "先补成整十。";

/** 数的拆分的排版设置：3 列、每行 11 毫米。 */
export const SPLIT_LAYOUT = { columns: 3, rowHeight: 11, maxItems: 12 } as const;
export const SPLIT_TITLE = "数的拆分";
export const SPLIT_INSTRUCTION = "把数拆成两部分。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 开放式题目：给出算式，让孩子写两种算法，答案是那个唯一的结果。 */
export function createManyWaysItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const useAdd = random() < 0.7;
    let a: number, b: number, value: number;
    if (useAdd) {
      a = integer(random, 24, 68);
      b = integer(random, 16, 100 - a);
      if (a + b > 100) continue;
      value = a + b;
    } else {
      a = integer(random, 52, 98);
      b = integer(random, 16, a - 20);
      value = a - b;
    }
    const data: ManyWaysData = { kind: "manyWays", a, b, operator: useAdd ? "+" : "-" };
    const item: DrillItem = { id, data, answer: { kind: "manyWays", value } };
    if (validateManyWaysItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的一题多解材料");
}

export function evaluateManyWays(data: ManyWaysData): number {
  return data.operator === "+" ? data.a + data.b : data.a - data.b;
}

export function validateManyWaysItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "manyWays" || answer.kind !== "manyWays") return false;
  if (![data.a, data.b, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (evaluateManyWays(data) !== answer.value) return false;
  if (data.operator === "+") return data.a >= 24 && data.b >= 16 && data.a + data.b <= 100;
  return data.a >= 52 && data.b >= 16 && data.a - data.b >= 16;
}

export function manyWaysText(data: ManyWaysData): string {
  return `${data.a} ${data.operator} ${data.b} =`;
}

/** 把一个加数补成整十，另一个加数相应减少，和不变。 */
export function createMakeTenItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const a = integer(random, 27, 49);
    if (a % 10 < 7) continue;
    const up = 10 - (a % 10);
    const b = integer(random, 18, 39);
    const b2 = b - up;
    if (b2 < 6) continue;
    const data: MakeTenData = { kind: "makeTen", a, b, up, a2: a + up, b2 };
    // 纸面让孩子填减少后的那个加数。
    const item: DrillItem = { id, data, answer: { kind: "makeTen", value: b2 } };
    if (validateMakeTenItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的凑整材料");
}

export function evaluateMakeTen(data: MakeTenData): number {
  return data.b - data.up;
}

export function validateMakeTenItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "makeTen" || answer.kind !== "makeTen") return false;
  if (![data.a, data.b, data.up, data.a2, data.b2].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (data.a < 27 || data.a > 49 || data.a % 10 < 7) return false;
  if (data.up !== 10 - (data.a % 10) || data.up < 1 || data.up > 3) return false;
  if (data.a2 !== data.a + data.up || data.a2 % 10 !== 0) return false;
  if (data.b < 18 || data.b > 39 || data.b2 !== data.b - data.up || data.b2 < 6) return false;
  // 换写法之后和不变，这才是凑整的道理。
  if (data.a2 + data.b2 !== data.a + data.b || data.a + data.b > 100) return false;
  return answer.value === data.b2;
}

/** 纸面：「38 + 27 = 40 + ___」。 */
export function makeTenText(data: MakeTenData): string {
  return `${data.a} + ${data.b} = ${data.a2} +`;
}

/** 开放式题目：把一个数拆成两部分。 */
export function createSplitItem(random: () => number, id: string): DrillItem {
  const total = integer(random, 24, 98);
  const data: SplitData = { kind: "split", total };
  return { id, data, answer: { kind: "split", total } };
}

export function validateSplitItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "split" || answer.kind !== "split") return false;
  if (!Number.isInteger(data.total) || data.total < 24 || data.total > 98) return false;
  return answer.total === data.total;
}

export function splitText(data: SplitData): string {
  return `${data.total} =`;
}
