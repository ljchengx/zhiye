import type { DrillAnswer, DrillItem, OralData } from "./types";

/** 计算题的排版设置：4 列、每行 9 毫米。 */
export const ORAL_LAYOUT = { columns: 4, rowHeight: 9, maxItems: 20 } as const;
export const ORAL_TITLE = "直接写出得数";
export const ORAL_INSTRUCTION = "看清符号，写出得数。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 六成加减、四成 × 与 ÷，加减里保证进位与退位都会出现。 */
export function createOralItem(random: () => number, id: string): DrillItem {
  const pick = random();
  let terms: number[], operators: OralData["operators"], value: number;
  if (pick < 0.3) {
    const a = integer(random, 14, 86);
    const b = integer(random, 12, 100 - a);
    terms = [a, b]; operators = ["+"]; value = a + b;
  } else if (pick < 0.6) {
    const a = integer(random, 32, 100);
    const b = integer(random, 13, a - 5);
    terms = [a, b]; operators = ["-"]; value = a - b;
  } else if (pick < 0.8) {
    const a = integer(random, 2, 9);
    const b = integer(random, 2, 9);
    terms = [a, b]; operators = ["×"]; value = a * b;
  } else {
    const divisor = integer(random, 2, 9);
    const quotient = integer(random, 2, 9);
    terms = [divisor * quotient, divisor]; operators = ["÷"]; value = quotient;
  }
  return { id, data: { kind: "oral", terms, operators }, answer: { kind: "oral", value } };
}

/** 独立重算，不复用生成时的中间结果。 */
export function evaluateOral(data: OralData): number {
  return data.terms.slice(1).reduce((total, term, index) => {
    const operator = data.operators[index];
    if (operator === "+") return total + term;
    if (operator === "-") return total - term;
    if (operator === "×") return total * term;
    return total / term;
  }, data.terms[0]);
}

export function validateOralItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "oral" || answer.kind !== "oral") return false;
  const [a, b] = data.terms;
  if (data.operators.length !== 1 || data.terms.length !== 2) return false;
  if (![a, b, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  const operator = data.operators[0];
  if (operator === "+") return a >= 14 && a <= 86 && b >= 12 && a + b <= 100;
  if (operator === "-") return a >= 32 && b >= 13 && a - b >= 5;
  if (operator === "×") return a >= 2 && a <= 9 && b >= 2 && b <= 9;
  return b >= 2 && b <= 9 && a <= 81 && a % b === 0;
}

/** 纸面文字：「38 + 27 =」。 */
export function oralText(data: OralData): string {
  return `${data.terms[0]} ${data.operators[0]} ${data.terms[1]} =`;
}

export function oralAnswerOf(item: DrillItem): DrillAnswer {
  return item.answer;
}
