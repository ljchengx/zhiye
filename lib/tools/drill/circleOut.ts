import { evalExpression } from "./matchLine";
import type { CircleOutData, DrillItem } from "./types";

/** 每个编号只判断一个算式，整个活动共用一个圈选条件。 */
export const CIRCLE_LAYOUT = { columns: 2, rowHeight: 26, maxItems: 4 } as const;
export const CIRCLE_TITLE = "圈一圈";
export const CIRCLE_INSTRUCTION = "算一算，圈出符合条件的算式。";
export const CIRCLE_ITEMS = 1;

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

interface CircleRule {
  threshold: number;
  above: boolean;
  selected: boolean;
  excluded: ReadonlySet<number>;
}

export function createCircleOutItem(random: () => number, id: string, rule?: CircleRule): DrillItem {
  const threshold = rule?.threshold ?? integer(random, 30, 70);
  const above = rule?.above ?? random() < 0.5;
  const selected = rule?.selected ?? random() < 0.5;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const a = integer(random, 18, 82), b = integer(random, 8, 34);
    const operator = random() < 0.5 ? "+" : "-";
    const value = operator === "+" ? a + b : a - b;
    if (value < 5 || value > 99 || rule?.excluded.has(value)) continue;
    if ((above ? value > threshold : value < threshold) !== selected) continue;
    const data: CircleOutData = { kind: "circleOut", expressions: [`${a} ${operator} ${b}`], values: [value], threshold, above };
    return { id, data, answer: { kind: "circleOut", indices: selected ? [0] : [] } };
  }
  throw new Error("暂时无法生成合法的圈选材料");
}

export function createCircleActivity(random: () => number, ids: readonly string[]): DrillItem[] {
  if (ids.length < 2 || ids.length > CIRCLE_LAYOUT.maxItems) throw new Error("圈选活动需要两到四道算式");
  const threshold = integer(random, 30, 70), above = random() < 0.5;
  const order = ids.map((_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = integer(random, 0, index);
    [order[index], order[other]] = [order[other], order[index]];
  }
  const selected = new Set(order.slice(0, Math.floor(ids.length / 2)));
  const excluded = new Set<number>();
  const activity = ids.map((id, index) => {
    const item = createCircleOutItem(random, id, { threshold, above, selected: selected.has(index), excluded });
    if (item.data.kind === "circleOut") excluded.add(item.data.values[0]);
    return item;
  });
  if (!validateCircleActivity(activity)) throw new Error("暂时无法生成合法的圈选材料");
  return activity;
}

export function validateCircleOutItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "circleOut" || answer.kind !== "circleOut") return false;
  if (data.expressions.length !== CIRCLE_ITEMS || data.values.length !== CIRCLE_ITEMS) return false;
  if (!Number.isInteger(data.threshold) || data.threshold < 20 || data.threshold > 80) return false;
  if (typeof data.above !== "boolean") return false;
  if (!data.values.every((value, index) => Number.isInteger(value) && value >= 0 && value <= 100
    && value === evalExpression(data.expressions[index]))) return false;
  const expected = data.values.flatMap((value, index) =>
    (data.above ? value > data.threshold : value < data.threshold) ? [index] : []);
  return expected.length === answer.indices.length && expected.every((index, position) => answer.indices[position] === index);
}

export function validateCircleActivity(items: readonly DrillItem[]): boolean {
  const first = items[0]?.data;
  if (first?.kind !== "circleOut" || items.length < 2 || items.length > CIRCLE_LAYOUT.maxItems) return false;
  let selected = 0;
  for (const item of items) {
    if (!validateCircleOutItem(item) || item.data.kind !== "circleOut" || item.answer.kind !== "circleOut") return false;
    if (item.data.threshold !== first.threshold || item.data.above !== first.above) return false;
    selected += item.answer.indices.length;
  }
  return selected > 0 && selected < items.length;
}

/** 题面上的条件文字，整个活动只显示一次。 */
export function circleOutText(data: CircleOutData): string {
  return data.above ? `圈出结果比 ${data.threshold} 大的算式。` : `圈出结果比 ${data.threshold} 小的算式。`;
}
