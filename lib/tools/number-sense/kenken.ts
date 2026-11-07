import type { KenkenCage, KenkenProblem } from "./types";

// 四阶拉丁方仅有 576 个；穷举候选可同时验证行列规则和题目唯一性。
const LATIN_SQUARES: number[][] = [];
function enumerate(grid: number[] = []): void {
  if (grid.length === 16) {
    LATIN_SQUARES.push([...grid]);
    return;
  }
  const index = grid.length,
    row = Math.floor(index / 4),
    col = index % 4;
  for (let value = 1; value <= 4; value += 1) {
    if (grid.slice(row * 4).includes(value)) continue;
    if (
      Array.from({ length: row }, (_, r) => grid[r * 4 + col]).includes(value)
    )
      continue;
    grid.push(value);
    enumerate(grid);
    grid.pop();
  }
}
enumerate();
export function solveKenken(
  problem: KenkenProblem,
): readonly (readonly number[])[] {
  return LATIN_SQUARES.filter((grid) =>
    problem.cages.every((cage) => {
      const values = cage.cells.map((cell) => grid[cell]);
      if (cage.operation === "=")
        return values.length === 1 && values[0] === cage.target;
      if (cage.operation === "-")
        return (
          values.length === 2 && Math.abs(values[0] - values[1]) === cage.target
        );
      return values.reduce((sum, value) => sum + value, 0) === cage.target;
    }),
  );
}
function makeBankEntry(bankIndex: number): {
  problem: KenkenProblem;
  solution: readonly number[];
} {
  const solution = LATIN_SQUARES[(bankIndex * 37 + 13) % LATIN_SQUARES.length];
  for (let attempt = 0; attempt < 256; attempt += 1) {
    let state = (bankIndex + 1) * 7919 + attempt * 104729;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const remaining = new Set(Array.from({ length: 16 }, (_, i) => i));
    const cages: KenkenCage[] = [];
    while (remaining.size) {
      const cell = [...remaining][Math.floor(random() * remaining.size)];
      remaining.delete(cell);
      const neighbors = [
        cell - 4,
        cell + 4,
        ...(cell % 4 ? [cell - 1] : []),
        ...(cell % 4 < 3 ? [cell + 1] : []),
      ].filter((n) => remaining.has(n));
      if (!neighbors.length) {
        cages.push({ cells: [cell], operation: "=", target: solution[cell] });
        continue;
      }
      const other = neighbors[Math.floor(random() * neighbors.length)];
      remaining.delete(other);
      const subtract = random() > 0.45;
      cages.push({
        cells: [cell, other].sort((a, b) => a - b),
        operation: subtract ? "-" : "+",
        target: subtract
          ? Math.abs(solution[cell] - solution[other])
          : solution[cell] + solution[other],
      });
    }
    const problem: KenkenProblem = { kind: "kenken", cages };
    if (
      cages.filter((c) => c.cells.length === 1).length <= 6 &&
      solveKenken(problem).length === 1
    )
      return { problem, solution };
  }
  throw new Error("聪明格题库未通过唯一解校验");
}
export const KENKEN_4X4_BANK = Array.from({ length: 24 }, (_, index) =>
  makeBankEntry(index),
);
