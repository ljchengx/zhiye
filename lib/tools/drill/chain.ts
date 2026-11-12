import type { ChainData, DrillItem, DrillOperator } from "./types";

/** 连加连减的排版设置：3 列、每行 11 毫米。 */
export const CHAIN_LAYOUT = { columns: 3, rowHeight: 11, maxItems: 12 } as const;
export const CHAIN_TITLE = "连加连减";
export const CHAIN_INSTRUCTION = "按顺序算。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 三项两算符，中间结果与最终结果都留在 0～100 以内。 */
export function createChainItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const a = integer(random, 22, 72);
    const first: DrillOperator = random() < 0.5 ? "+" : "-";
    const firstMax = first === "+" ? Math.min(58, 100 - a) : a - 6;
    if (firstMax < 14) continue;
    const b = integer(random, 14, firstMax);
    const mid = first === "+" ? a + b : a - b;
    if (mid < 12 || mid > 92) continue;
    const second: DrillOperator = random() < 0.5 ? "+" : "-";
    const secondMax = second === "+" ? Math.min(58, 100 - mid) : mid - 6;
    if (secondMax < 14) continue;
    const c = integer(random, 14, secondMax);
    const value = second === "+" ? mid + c : mid - c;
    const data: ChainData = { kind: "chain", terms: [a, b, c], operators: [first, second] };
    const item: DrillItem = { id, data, answer: { kind: "chain", value } };
    if (validateChainItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的连加连减材料");
}

/** 从左到右依次计算。 */
export function evaluateChain(data: ChainData): number {
  return data.terms.slice(1).reduce((total, term, index) => {
    const operator = data.operators[index];
    return operator === "+" ? total + term : total - term;
  }, data.terms[0]);
}

export function validateChainItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "chain" || answer.kind !== "chain") return false;
  if (data.terms.length !== 3 || data.operators.length !== 2) return false;
  if (!data.operators.every((operator) => operator === "+" || operator === "-")) return false;
  const [a, b, c] = data.terms;
  if (![a, b, c, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  const mid = data.operators[0] === "+" ? a + b : a - b;
  const value = data.operators[1] === "+" ? mid + c : mid - c;
  // 中间结果也要留在范围内，不能出现负数。
  return a >= 22 && b >= 14 && c >= 14 && mid >= 0 && mid <= 100 && value >= 0 && value <= 100
    && value === answer.value;
}

export function chainText(data: ChainData): string {
  return `${data.terms[0]} ${data.operators[0]} ${data.terms[1]} ${data.operators[1]} ${data.terms[2]} =`;
}
