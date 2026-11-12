import type { DrillItem, TowerData } from "./types";

/** 往上填数的排版设置：2 列、每行 28 毫米。 */
export const TOWER_LAYOUT = { columns: 2, rowHeight: 28, maxItems: 4 } as const;
export const TOWER_TITLE = "加一加";
export const TOWER_INSTRUCTION = "相邻两数相加，往上填。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 最下面三个数，再往上是相邻两数之和；最大不超过 100。 */
export function createTowerItem(random: () => number, id: string): DrillItem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const base = [integer(random, 5, 22), integer(random, 5, 22), integer(random, 5, 22)];
    const mid = [base[0] + base[1], base[1] + base[2]];
    const top = mid[0] + mid[1];
    if (top > 100) continue;
    const data: TowerData = { kind: "numberTower", base };
    const item: DrillItem = { id, data, answer: { kind: "numberTower", values: [mid[0], mid[1], top] } };
    if (validateTowerItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的加一加材料");
}

/** 中间结果，画图与验题共用。 */
export function towerLayers(data: TowerData): { mid: readonly number[]; top: number } {
  const mid = [data.base[0] + data.base[1], data.base[1] + data.base[2]];
  return { mid, top: mid[0] + mid[1] };
}

export function validateTowerItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "numberTower" || answer.kind !== "numberTower") return false;
  if (data.base.length !== 3) return false;
  if (!data.base.every((n) => Number.isInteger(n) && n >= 5 && n <= 22)) return false;
  const { mid, top } = towerLayers(data);
  const values = [...mid, top];
  if (!values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  return answer.values.length === 3
    && answer.values[0] === mid[0] && answer.values[1] === mid[1] && answer.values[2] === top;
}

/** 三个要填的位置：中间两个与最上面一个。 */
export function towerText(data: TowerData): string {
  return `${data.base[0]} ${data.base[1]} ${data.base[2]}`;
}
