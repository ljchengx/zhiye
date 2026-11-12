import type { DrillItem, InOutData } from "./types";

/** 进几出几的排版设置：一行两个表格，每个表格一行 17 毫米。规律留给做题的人自己发现。 */
export const IN_OUT_LAYOUT = { columns: 2, rowHeight: 17, maxItems: 6 } as const;
export const IN_OUT_TITLE = "进几出几";
export const IN_OUT_INSTRUCTION = "把表格补完整。";
/** 每个表格的格数。 */
export const IN_OUT_CELLS = 4;

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 进一个数、出一个数，规律固定；表格里留几个空。 */
export function createInOutItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const operator = random() < 0.5 ? "+" : "-";
    const step = operator === "+" ? integer(random, 5, 26) : integer(random, 5, 24);
    const start = operator === "+" ? integer(random, 12, 60) : integer(random, 34, 92);
    const inputs: number[] = [];
    for (let index = 0; index < IN_OUT_CELLS; index += 1) {
      const value = start + index * integer(random, 4, 9) + index * 2;
      if (value > 96) break;
      inputs.push(value);
    }
    if (inputs.length < IN_OUT_CELLS) continue;
    const outputs = inputs.map((value) => (operator === "+" ? value + step : value - step));
    if (outputs.some((value) => value < 0 || value > 100)) continue;
    const data: InOutData = { kind: "inOut", operator, step, inputs, outputs };
    const item: DrillItem = { id, data, answer: { kind: "inOut", value: outputs[outputs.length - 1] } };
    if (validateInOutItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的进出材料");
}

export function evaluateInOut(data: InOutData): readonly number[] {
  return data.inputs.map((value) => (data.operator === "+" ? value + data.step : value - data.step));
}

export function validateInOutItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "inOut" || answer.kind !== "inOut") return false;
  if (data.inputs.length !== IN_OUT_CELLS || data.outputs.length !== IN_OUT_CELLS) return false;
  if (![data.step, ...data.inputs, ...data.outputs].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (data.step < 5 || data.step > 26) return false;
  // 进的数要一个比一个大，规律才看得清。
  for (let index = 1; index < data.inputs.length; index += 1)
    if (data.inputs[index] <= data.inputs[index - 1]) return false;
  const expected = evaluateInOut(data);
  if (expected.some((value, index) => value !== data.outputs[index])) return false;
  if (expected.some((value) => value < 0 || value > 100)) return false;
  return answer.value === data.outputs[data.outputs.length - 1];
}

export function inOutText(data: InOutData): string {
  return data.operator === "+" ? `进 + ${data.step}` : `进 - ${data.step}`;
}
