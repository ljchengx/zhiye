import type { DrillItem, MatchData } from "./types";

/** 每个编号只对应一道算式，四个编号合成一个连线活动。 */
export const MATCH_LAYOUT = { columns: 1, rowHeight: 20, maxItems: 4 } as const;
export const MATCH_TITLE = "连一连";
export const MATCH_INSTRUCTION = "算一算，把算式连到正确的得数。";
export const MATCH_PAIRS = 1;
export const MATCH_CHOICES = 4;

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = integer(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 一道算式及其得数；活动组合时再统一打乱右侧选项。 */
export function createMatchItem(random: () => number, id: string, excluded: ReadonlySet<number> = new Set()): DrillItem {
  const expressions: string[] = [], values: number[] = [];
  const used = new Set(excluded);
  for (let attempt = 0; attempt < 300 && values.length < MATCH_PAIRS; attempt += 1) {
    let a: number, b: number, operator: "+" | "-", value: number;
    if (random() < 0.5) {
      a = integer(random, 14, 62); b = integer(random, 8, 30); operator = "+"; value = a + b;
    } else {
      a = integer(random, 34, 96); b = integer(random, 12, 36); operator = "-"; value = a - b;
    }
    if (value < 5 || value > 99 || used.has(value)) continue;
    used.add(value);
    expressions.push(`${a} ${operator} ${b}`);
    values.push(value);
  }
  if (values.length !== MATCH_PAIRS) throw new Error("暂时无法生成合法的连线材料");
  const right = shuffled(values, random);
  const data: MatchData = { kind: "matchLine", expressions, right };
  return { id, data, answer: { kind: "matchLine", pairs: values.map((v) => right.indexOf(v)) } };
}

export function createMatchActivity(random: () => number, ids: readonly string[]): DrillItem[] {
  if (ids.length < 2 || ids.length > MATCH_CHOICES) throw new Error("连线活动需要两到四道算式");
  const used = new Set<number>();
  const items = ids.map((id) => {
    const item = createMatchItem(random, id, used);
    if (item.data.kind === "matchLine") used.add(item.data.right[0]);
    return item;
  });
  const values = [...used];
  let right = shuffled(values, random);
  // 选项集中显示一次，并错开原行，孩子需要计算后寻找对应位置。
  for (let attempt = 0; attempt < 12 && right.some((value, index) => value === values[index]); attempt += 1)
    right = shuffled(values, random);
  if (right.some((value, index) => value === values[index])) right = [...values.slice(1), values[0]];
  const activity: DrillItem[] = items.map((item, index) => {
    if (item.data.kind !== "matchLine") throw new Error("连线材料题型错误");
    return { ...item, data: { ...item.data, right }, answer: { kind: "matchLine", pairs: [right.indexOf(values[index])] } };
  });
  if (!validateMatchActivity(activity)) throw new Error("暂时无法生成合法的连线材料");
  return activity;
}

export function validateMatchItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "matchLine" || answer.kind !== "matchLine") return false;
  if (data.expressions.length !== MATCH_PAIRS || data.right.length < 1 || data.right.length > MATCH_CHOICES) return false;
  if (answer.pairs.length !== MATCH_PAIRS) return false;
  const seen = new Set<number>();
  for (const index of answer.pairs) {
    if (!Number.isInteger(index) || index < 0 || index >= data.right.length) return false;
    if (seen.has(index)) return false;
    seen.add(index);
  }
  // 单题校验实际选项位置，活动校验再检查所有选项都被使用一次。
  return data.right.every((value) => Number.isInteger(value) && value >= 0 && value <= 100)
    && new Set(data.right).size === data.right.length
    && data.expressions.every((text, index) => evalExpression(text) === data.right[answer.pairs[index]]);
}

export function validateMatchActivity(items: readonly DrillItem[]): boolean {
  const first = items[0]?.data;
  if (first?.kind !== "matchLine" || first.right.length !== items.length || items.length < 2) return false;
  const targets = new Set<number>();
  for (const item of items) {
    if (!validateMatchItem(item) || item.data.kind !== "matchLine" || item.answer.kind !== "matchLine") return false;
    if (!item.data.right.every((value, index) => value === first.right[index])) return false;
    targets.add(item.answer.pairs[0]);
  }
  return targets.size === items.length;
}

/** 左边第 index 个算式的结果，落在右边第几个数上。 */
export function matchTarget(data: MatchData, index: number): number {
  return data.right.indexOf(evalExpression(data.expressions[index]));
}

/** 只用于校验算式文字与结果对得上。 */
export function evalExpression(text: string): number {
  const parts = /^(\d{1,2}) ([+-]) (\d{1,2})$/.exec(text);
  if (!parts) return Number.NaN;
  const [, left, operator, right] = parts;
  return operator === "+" ? Number(left) + Number(right) : Number(left) - Number(right);
}
