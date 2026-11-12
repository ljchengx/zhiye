import type { CircleOutData, DrillItem } from "./types";

/** 圈一圈的排版设置：一行一组，每组 30 毫米。 */
export const CIRCLE_LAYOUT = { columns: 1, rowHeight: 28, maxItems: 3 } as const;
export const CIRCLE_TITLE = "圈一圈";
export const CIRCLE_INSTRUCTION = "圈出符合条件的结果。";
/** 每组的算式个数。 */
export const CIRCLE_ITEMS = 6;

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 六个算式，圈出结果比给定数大（或小）的那些；符合与不符合各有几道。 */
export function createCircleOutItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const above = random() < 0.5;
    const threshold = integer(random, 30, 70);
    const expressions: string[] = [], values: number[] = [];
    let hit = 0;
    for (let index = 0; index < CIRCLE_ITEMS; index += 1) {
      const want = index % 2 === 0 ? above : !above;
      let made = false;
      for (let tryValue = 0; tryValue < 40 && !made; tryValue += 1) {
        const a = integer(random, 18, 82);
        const b = integer(random, 8, 34);
        const operator = random() < 0.5 ? "+" : "-";
        const value = operator === "+" ? a + b : a - b;
        if (value < 5 || value > 99) continue;
        if ((value > threshold) !== want) continue;
        expressions.push(`${a} ${operator} ${b}`);
        values.push(value);
        if (want) hit += 1;
        made = true;
      }
      if (!made) { index -= 1; continue; }
    }
    // 两边都要有题可圈，条件才不会白给。
    if (hit < 2 || hit > CIRCLE_ITEMS - 2) continue;
    const data: CircleOutData = { kind: "circleOut", expressions, values, threshold, above };
    const indices = values.flatMap((value, index) => (above ? value > threshold : value < threshold) ? [index] : []);
    const item: DrillItem = { id, data, answer: { kind: "circleOut", indices } };
    if (validateCircleOutItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的圈选材料");
}

export function validateCircleOutItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "circleOut" || answer.kind !== "circleOut") return false;
  if (data.expressions.length !== CIRCLE_ITEMS || data.values.length !== CIRCLE_ITEMS) return false;
  if (!data.values.every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) return false;
  if (data.threshold < 20 || data.threshold > 80) return false;
  const expected = data.values.flatMap((value, index) =>
    (data.above ? value > data.threshold : value < data.threshold) ? [index] : []);
  if (expected.length !== answer.indices.length) return false;
  if (!expected.every((index, position) => answer.indices[position] === index)) return false;
  return expected.length >= 2 && expected.length <= CIRCLE_ITEMS - 2;
}

/** 题面上的条件文字。 */
export function circleOutText(data: CircleOutData): string {
  return data.above ? `圈出结果比 ${data.threshold} 大的` : `圈出结果比 ${data.threshold} 小的`;
}
