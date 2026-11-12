import type { DrillItem, DrillOperator, WordData } from "./types";

/** 应用题的排版设置：一行一题，每题 26 毫米。 */
export const WORD_LAYOUT = { columns: 1, rowHeight: 26, maxItems: 6 } as const;
export const WORD_TITLE = "应用题";
export const WORD_INSTRUCTION = "读一读，列式算出来。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 一个生活场景：题面用 a、b 两个数，两个数的范围按场景定。 */
interface WordTemplate {
  operator: DrillOperator;
  /** a 的下限、上限，b 的下限、上限。除法时 a 是要分的那个数。 */
  range: readonly [number, number, number, number];
  text: (a: number, b: number) => string;
}

/**
 * 12 个生活场景：加减各四个，另外两组用九九表。
 * 除法模板里每份数由取数给出，要分的数再算出来，保证整除。
 * 均分模板里 a 由份数算出来，保证整除。
 */
const TEMPLATES: readonly WordTemplate[] = [
  { operator: "+", range: [16, 72, 12, 28], text: (a, b) => `有 ${a} 个，又添 ${b} 个，一共多少个？` },
  { operator: "+", range: [16, 68, 12, 28], text: (a, b) => `车上原有 ${a} 人，又上来 ${b} 人，一共多少人？` },
  { operator: "+", range: [12, 52, 6, 22], text: (a, b) => `第一排 ${a} 人，第二排比第一排多 ${b} 人，第二排多少人？` },
  { operator: "+", range: [1, 20, 5, 9], text: (a, b) => `今天是 ${a} 号，再过 ${b} 天是几号？` },
  { operator: "-", range: [36, 96, 14, 30], text: (a, b) => `有 ${a} 个，用掉 ${b} 个，还剩多少个？` },
  { operator: "-", range: [36, 96, 14, 30], text: (a, b) => `一本 ${a} 页，看了 ${b} 页，还剩多少页？` },
  { operator: "-", range: [30, 90, 12, 26], text: (a, b) => `有 ${a} 只，飞走 ${b} 只，还剩多少只？` },
  { operator: "-", range: [40, 100, 15, 38], text: (a, b) => `带 ${a} 元，用掉 ${b} 元，还剩多少元？` },
  { operator: "×", range: [3, 9, 3, 9], text: (a, b) => `每盒 ${a} 个，${b} 盒一共多少个？` },
  { operator: "×", range: [2, 9, 2, 9], text: (a, b) => `一个 ${a} 元，买 ${b} 个要多少元？` },
  { operator: "÷", range: [3, 9, 3, 9], text: (a, b) => `${a} 个分给 ${b} 人，每人几个？` },
  { operator: "÷", range: [3, 9, 3, 9], text: (a, b) => `${a} 个放进 ${b} 个盒子，每盒几个？` },
];

export function createWordItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const template = TEMPLATES[integer(random, 0, TEMPLATES.length - 1)];
    const [aLow, aHigh, bLow, bHigh] = template.range;
    const operator = template.operator;
    let a: number, b: number, value: number;
    if (operator === "÷") {
      // 先定份数与每份数，再算出要分的那个数，保证整除。
      b = integer(random, bLow, bHigh);
      const per = integer(random, aLow, aHigh);
      a = b * per;
      value = per;
    } else {
      a = integer(random, aLow, aHigh);
      b = integer(random, bLow, bHigh);
      value = operator === "+" ? a + b : operator === "-" ? a - b : a * b;
    }
    const data: WordData = { kind: "word", operator, a, b, text: template.text(a, b), value };
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
  if (data.operator === "+" && (data.a < 1 || data.b < 5 || data.a + data.b > 100)) return false;
  if (data.operator === "-" && (data.a < 30 || data.b < 12 || data.a - data.b < 5)) return false;
  if (data.operator === "×" && (data.a < 2 || data.a > 9 || data.b < 2 || data.b > 9)) return false;
  if (data.operator === "÷" && (data.b < 3 || data.b > 9 || data.a % data.b !== 0 || data.a > 81)) return false;
  if (evaluateWord(data) !== data.value) return false;
  // 题面里必须出现这两个数，孩子才有得可算。
  if (!data.text.includes(String(data.a)) || !data.text.includes(String(data.b))) return false;
  return answer.value === data.value && data.text.length <= 30;
}

export function wordText(data: WordData): string {
  return data.text;
}

/** 生活场景的种数，测试与文案会引用。 */
export const WORD_TEMPLATE_COUNT = TEMPLATES.length;
