import type { DrillItem, MatchData } from "./types";

/** 连线的排版设置：一行一题，每题 36 毫米。 */
export const MATCH_LAYOUT = { columns: 1, rowHeight: 34, maxItems: 3 } as const;
export const MATCH_TITLE = "连一连";
export const MATCH_INSTRUCTION = "把左边的算式和右边的得数连起来。";
/** 每组几对。 */
export const MATCH_PAIRS = 4;

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

/** 四道加减算式，右边是换了顺序的得数，一一对应。 */
export function createMatchItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const expressions: string[] = [], values: number[] = [];
    const used = new Set<number>();
    for (let index = 0; index < MATCH_PAIRS; index += 1) {
      let a: number, b: number, operator: "+" | "-", value: number;
      if (random() < 0.5) {
        a = integer(random, 14, 62); b = integer(random, 8, 30); operator = "+"; value = a + b;
      } else {
        a = integer(random, 34, 96); b = integer(random, 12, 36); operator = "-"; value = a - b;
      }
      // 得数不能重复，连线才有唯一的答案。
      if (value < 5 || value > 99 || used.has(value)) { index -= 1; continue; }
      used.add(value);
      expressions.push(`${a} ${operator} ${b}`);
      values.push(value);
    }
    const right = shuffled(values, random);
    const data: MatchData = { kind: "matchLine", expressions, right };
    const item: DrillItem = { id, data, answer: { kind: "matchLine", pairs: values.map((v) => right.indexOf(v)) } };
    if (validateMatchItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的连线材料");
}

export function validateMatchItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "matchLine" || answer.kind !== "matchLine") return false;
  if (data.expressions.length !== MATCH_PAIRS || data.right.length !== MATCH_PAIRS) return false;
  if (answer.pairs.length !== MATCH_PAIRS) return false;
  const seen = new Set<number>();
  for (const index of answer.pairs) {
    if (!Number.isInteger(index) || index < 0 || index >= MATCH_PAIRS) return false;
    if (seen.has(index)) return false;
    seen.add(index);
  }
  // 每个右边的数都要用上一次，也要和对应算式的结果对得上。
  return data.right.every((value) => Number.isInteger(value) && value >= 0 && value <= 100)
    && new Set(data.right).size === MATCH_PAIRS;
}

/** 左边第 index 个算式的结果，落在右边第几个数上。 */
export function matchTarget(data: MatchData, index: number): number {
  return data.right.indexOf(evalExpression(data.expressions[index]));
}

/** 只用于校验算式文字与结果对得上。 */
export function evalExpression(text: string): number {
  const [left, operator, right] = text.split(" ");
  return operator === "+" ? Number(left) + Number(right) : Number(left) - Number(right);
}
