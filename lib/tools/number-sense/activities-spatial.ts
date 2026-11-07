import type { ActivityDefinition } from "./types";

type Seat = readonly [number, number];
export type SpatialProblem =
  | { kind: "seats"; tickets: readonly Seat[] }
  | { kind: "neighbors"; occupied: readonly (readonly number[])[]; group: number }
  | { kind: "mirror"; left: readonly number[]; right: readonly number[] }
  | { kind: "tiles"; hole: readonly number[]; options: readonly (readonly number[])[]; larger: readonly (readonly number[])[] }
  | { kind: "code"; symbols: readonly number[]; key: readonly number[] }
  | { kind: "path"; start: number; moves: readonly { direction: number; steps: number }[] }
  | { kind: "views"; heights: readonly number[]; options: readonly (readonly number[])[] }
  | { kind: "fence"; width: number; height: number; cutCorner: boolean };

export type SpatialValidation =
  | { kind: "seats"; values: readonly number[]; cells: readonly number[] }
  | { kind: "neighbors"; values: readonly number[]; groups: readonly (readonly number[])[]; largerGroups: readonly (readonly number[])[] }
  | { kind: "mirror"; values: readonly number[]; reflected: readonly number[]; mistakes: readonly number[]; total: number }
  | { kind: "tiles"; values: readonly number[]; choice: number; largerChoice: number; extra: number }
  | { kind: "code"; values: readonly number[]; encoded: readonly number[] }
  | { kind: "path"; values: readonly number[]; visited: readonly number[]; end: number; distance: number }
  | { kind: "views"; values: readonly number[]; footprint: readonly number[]; choice: number; total: number; witness: readonly number[] }
  | { kind: "fence"; values: readonly number[]; cells: readonly number[]; edges: readonly (readonly [number, number])[]; perimeter: number; rectangles: readonly Seat[] };

export const SPATIAL_DEFINITIONS: Record<SpatialProblem["kind"], ActivityDefinition> = {
  seats: { skill: "distance", title: "对号找座位", action: "draw", repeatAction: "fill", prompt: "照着票，把记号画到座位上。", followUp: "排和号，少看一个会怎样？", objective: "同时看清排与号，确定位置", repeatPrompt: "看看座位，把三张票补完整。", repeatFollowUp: "同一排的票，哪个数一样？" },
  neighbors: { skill: "distance", title: "我们想挨着坐", action: "circle", repeatAction: "circle", prompt: "找一排空位，让朋友挨着坐。", followUp: "还有别的坐法吗？", objective: "用连续空位判断能否一起坐", repeatPrompt: "又来一位朋友，还能挨着坐吗？", repeatFollowUp: "空位多，就一定能挨着坐吗？" },
  mirror: { skill: "construct", title: "蝴蝶的另一边", action: "draw", repeatAction: "draw", prompt: "照着左边，把右边的花纹补好。", followUp: "离中间线一样远吗？", objective: "追踪对称位置与对应数量", repeatPrompt: "右边有两处不对，圈出再改好。", repeatFollowUp: "一样多，就一定画对了吗？" },
  tiles: { skill: "construct", title: "补好小地毯", action: "circle", repeatAction: "circle", prompt: "哪块正好补上空缺？圈一圈。", followUp: "只数格子，能选对吗？", objective: "同时比较缺片的形状与位置", repeatPrompt: "剪掉一格，哪块能补好地毯？", repeatFollowUp: "把多出来的那格划掉。" },
  code: { skill: "structure", title: "水果的秘密记号", action: "draw", repeatAction: "draw", prompt: "照着图例，把水果变成记号。", followUp: "空格的位置也保留了吗？", objective: "根据图例转换信息并保持位置", repeatPrompt: "看看两张图，把图例补完整。", repeatFollowUp: "同一种水果用了同样记号吗？" },
  path: { skill: "distance", title: "方格里的寻宝路", action: "trace", repeatAction: "fill", prompt: "照着路牌走，在方格中画路线。", followUp: "最后停在哪一格？", objective: "结合方向与步数追踪位置", repeatPrompt: "路线已经画好，请把路牌补全。", repeatFollowUp: "拐弯前后，分别走了几格？" },
  views: { skill: "construct", title: "从上面看积木", action: "circle", repeatAction: "draw", prompt: "从正上方看，哪幅图是对的？", followUp: "搭高了，地上的位置会变吗？", objective: "区分积木高度与占地位置", repeatPrompt: "照着地上的位置，画出积木墙。", repeatFollowUp: "同样多积木，还有别的搭法吗？" },
  fence: { skill: "estimate", title: "花园围一圈", action: "trace", repeatAction: "draw", prompt: "沿花园外边描一圈，数数小栏杆。", followUp: "里面的格子和外边一样多吗？", objective: "区分花园内部与外边的长度", repeatPrompt: "用同样多的小栏杆，画两种围法。", repeatFollowUp: "围法不同，里面的格子一样多吗？" },
};

export function isSpatialKind(kind: string): kind is SpatialProblem["kind"] {
  return Object.prototype.hasOwnProperty.call(SPATIAL_DEFINITIONS, kind);
}
export function spatialSignature(p: SpatialProblem, edition: 0 | 1): string {
  if (p.kind === "mirror") return JSON.stringify({ kind: p.kind, left: p.left, ...(edition === 1 ? { right: p.right } : {}) });
  if (p.kind === "tiles") return JSON.stringify({ kind: p.kind, hole: p.hole });
  if (p.kind === "views") return JSON.stringify(edition === 0 ? { kind: p.kind, heights: p.heights }
    : { kind: p.kind, footprint: p.heights.map((height) => height > 0), blocks: p.heights.reduce((a, b) => a + b, 0) });
  if (p.kind === "fence" && edition === 1) return JSON.stringify({ kind: p.kind, rails: 2 * (p.width + p.height) });
  return JSON.stringify(p);
}
const integer = (random: () => number, low: number, high: number) => low + Math.floor(random() * (high - low + 1));
const range = (length: number) => Array.from({ length }, (_, i) => i);
const sorted = (items: readonly number[]) => [...items].sort((a, b) => a - b);
// 补片可以平移，不能旋转；比较外形时去掉在小方框中的空白偏移。
const outline = (cells: readonly number[]) => {
  const left = Math.min(...cells.map((cell) => cell % 4)), top = Math.min(...cells.map((cell) => Math.floor(cell / 4)));
  return sorted(cells.map((cell) => (Math.floor(cell / 4) - top) * 4 + cell % 4 - left)).join(",");
};
const removable = (piece: readonly number[], hole: readonly number[]) => piece.filter((extra) => outline(piece.filter((cell) => cell !== extra)) === outline(hole));
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = integer(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function neighborGroups(occupied: readonly (readonly number[])[], size: number): number[][] {
  return occupied.flatMap((row, y) => range(8 - size).flatMap((x) => {
    const cells = range(size).map((i) => x + i);
    return cells.every((cell) => !row.includes(cell)) ? [cells.map((cell) => y * 7 + cell)] : [];
  }));
}
const reflect = (cell: number) => Math.floor(cell / 6) * 6 + 5 - cell % 6;
function adjoining(a: number, b: number): boolean {
  return (Math.floor(a / 4) === Math.floor(b / 4) && Math.abs(a - b) === 1) || Math.abs(a - b) === 4;
}
function connected(cells: readonly number[]): boolean {
  const seen = new Set(cells.slice(0, 1));
  for (let changed = true; changed;) {
    changed = false;
    for (const cell of cells) if (!seen.has(cell) && [...seen].some((other) => adjoining(cell, other))) {
      seen.add(cell); changed = true;
    }
  }
  return seen.size === cells.length;
}
export function inspectSpatialProblem(p: SpatialProblem): SpatialValidation {
  if (p.kind === "seats") {
    const cells = p.tickets.map(([row, col]) => (row - 1) * 6 + col - 1);
    return { kind: p.kind, cells, values: [...p.tickets.flat(), ...cells] };
  }
  if (p.kind === "neighbors") {
    const groups = neighborGroups(p.occupied, p.group), largerGroups = neighborGroups(p.occupied, p.group + 1);
    return { kind: p.kind, groups, largerGroups, values: [...p.occupied.flat(), p.group, p.group + 1, ...groups.flat(), ...largerGroups.flat()] };
  }
  if (p.kind === "mirror") {
    const reflected = sorted(p.left.map(reflect));
    const mistakes = sorted([...reflected.filter((cell) => !p.right.includes(cell)), ...p.right.filter((cell) => !reflected.includes(cell))]);
    return { kind: p.kind, reflected, mistakes, total: p.left.length * 2, values: [...p.left, ...p.right, ...reflected, ...mistakes, p.left.length * 2] };
  }
  if (p.kind === "tiles") {
    const choice = p.options.findIndex((option) => outline(option) === outline(p.hole));
    const largerChoice = p.larger.findIndex((option) => removable(option, p.hole).length > 0);
    const extra = p.larger[largerChoice] ? removable(p.larger[largerChoice], p.hole)[0] : -1;
    return { kind: p.kind, choice, largerChoice, extra, values: [...p.hole, ...p.options.flat(), ...p.larger.flat(), choice, largerChoice, extra] };
  }
  if (p.kind === "code") {
    const encoded = p.symbols.map((symbol) => symbol === 3 ? 3 : p.key[symbol]);
    return { kind: p.kind, encoded, values: [...p.symbols, ...p.key, ...encoded] };
  }
  if (p.kind === "path") {
    const visited = [p.start];
    for (const move of p.moves) for (let step = 0; step < move.steps; step++) visited.push(visited.at(-1)! + [1, 6, -1, -6][move.direction]);
    return { kind: p.kind, visited, end: visited.at(-1)!, distance: visited.length - 1,
      values: [p.start, ...p.moves.flatMap((move) => [move.direction, move.steps]), ...visited, visited.length - 1] };
  }
  if (p.kind === "views") {
    const footprint = p.heights.map((height) => height > 0 ? 1 : 0);
    const choice = p.options.findIndex((option) => String(option) === String(footprint));
    const witness = [...p.heights];
    const from = witness.findIndex((height) => height >= 2);
    const to = witness.findIndex((height, index) => index !== from && height > 0 && height < 4);
    if (from >= 0 && to >= 0) { witness[from]--; witness[to]++; }
    const total = p.heights.reduce((a, b) => a + b, 0);
    return { kind: p.kind, footprint, choice, total, witness, values: [...p.heights, ...p.options.flat(), ...footprint, choice, total, ...witness] };
  }
  const cells = range(p.width * p.height).map((i) => Math.floor(i / p.width) * 6 + i % p.width)
    .filter((cell) => !p.cutCorner || cell !== p.width - 1);
  // 网格交点按七列编号；只收录没有相邻花格的一侧，避免重复数内部边。
  const edges: [number, number][] = [];
  for (const cell of cells) {
    const row = Math.floor(cell / 6), col = cell % 6, point = row * 7 + col;
    if (row === 0 || !cells.includes(cell - 6)) edges.push([point, point + 1]);
    if (!cells.includes(cell + 6)) edges.push([point + 7, point + 8]);
    if (col === 0 || !cells.includes(cell - 1)) edges.push([point, point + 7]);
    if (col === 5 || !cells.includes(cell + 1)) edges.push([point + 1, point + 8]);
  }
  const rectangles: Seat[] = [];
  for (let width = 1; width <= 6; width++) for (let height = width; height <= 6; height++)
    if (2 * (width + height) === edges.length) rectangles.push([width, height]);
  return { kind: p.kind, cells, edges, perimeter: edges.length, rectangles,
    values: [p.width, p.height, ...cells, ...edges.flat(), edges.length, ...rectangles.flat()] };
}

export function validateSpatialProblem(p: SpatialProblem): boolean {
  const v = inspectSpatialProblem(p);
  if (!v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (p.kind === "seats") return p.tickets.length === 3 && new Set(p.tickets.map(String)).size === 3
    && p.tickets.every(([row, col]) => row >= 1 && row <= 4 && col >= 1 && col <= 6);
  if (p.kind === "neighbors") return p.occupied.length === 4 && [2, 3].includes(p.group)
    && p.occupied.every((row) => new Set(row).size === row.length && row.every((cell) => cell >= 0 && cell < 7))
    && v.kind === "neighbors" && v.groups.length >= 2;
  if (p.kind === "mirror") return p.left.length >= 4 && p.left.length <= 8 && new Set(p.left).size === p.left.length
    && p.left.every((cell) => cell < 24 && cell % 6 < 3) && p.right.length === p.left.length
    && new Set(p.right).size === p.right.length && p.right.every((cell) => cell < 24 && cell % 6 >= 3)
    && v.kind === "mirror" && v.mistakes.length === 2;
  if (p.kind === "tiles") return p.hole.length >= 3 && p.hole.length <= 6 && new Set(p.hole).size === p.hole.length
    && [...p.hole, ...p.options.flat(), ...p.larger.flat()].every((cell) => cell < 16)
    && p.options.length === 3 && p.larger.length === 3
    && p.options.every((row) => row.length === p.hole.length && new Set(row).size === row.length)
    && p.larger.every((row) => row.length === p.hole.length + 1 && new Set(row).size === row.length)
    && [p.hole, ...p.options, ...p.larger].every(connected)
    && new Set(p.options.map((row) => String(sorted(row)))).size === 3
    && new Set(p.larger.map((row) => String(sorted(row)))).size === 3
    && p.options.filter((row) => outline(row) === outline(p.hole)).length === 1
    && p.larger.reduce((count, row) => count + removable(row, p.hole).length, 0) === 1;
  if (p.kind === "code") return p.symbols.length === 9 && p.symbols.every((n) => n <= 3)
    && [0, 1, 2, 3].every((n) => p.symbols.includes(n)) && String(sorted(p.key)) === "0,1,2";
  if (p.kind === "path") {
    if (p.start >= 36 || p.moves.length !== 4 || v.kind !== "path") return false;
    let cell = p.start;
    for (const move of p.moves) {
      if (move.direction > 3 || move.steps < 1 || move.steps > 3) return false;
      for (let i = 0; i < move.steps; i++) {
        const next = cell + [1, 6, -1, -6][move.direction];
        if (next < 0 || next >= 36 || ((move.direction === 0 || move.direction === 2) && Math.floor(next / 6) !== Math.floor(cell / 6))) return false;
        cell = next;
      }
    }
    return new Set(v.visited).size === v.visited.length;
  }
  if (p.kind === "views") return p.heights.length === 5 && p.heights.every((n) => n <= 4)
    && p.heights.filter((n) => n > 0).length >= 3 && p.heights.some((n) => n === 0)
    && p.options.length === 3 && p.options.every((row) => row.length === 5 && row.every((n) => n <= 1))
    && new Set(p.options.map(String)).size === 3 && v.kind === "views"
    && p.options.filter((row) => String(row) === String(v.footprint)).length === 1
    && String(v.witness) !== String(p.heights) && v.witness.every((n, i) => (n > 0) === (p.heights[i] > 0) && n <= 4);
  return p.width >= 2 && p.width <= 4 && p.height >= 3 && p.height <= 5 && v.kind === "fence" && v.rectangles.length >= 2;
}

export function createSpatialProblem(kind: SpatialProblem["kind"], random: () => number): SpatialProblem {
  if (kind === "seats") return { kind, tickets: shuffled(range(24), random).slice(0, 3).map((cell) => [Math.floor(cell / 6) + 1, cell % 6 + 1] as const) };
  if (kind === "neighbors") {
    const group = integer(random, 2, 3), row = integer(random, 0, 3), start = integer(random, 0, 7 - group);
    const occupied = range(4).map((y) => sorted(shuffled(range(7), random).slice(0, integer(random, 2, 4))
      .filter((cell) => y !== row || cell < start || cell >= start + group)));
    if (neighborGroups(occupied, group).length < 2) return createSpatialProblem(kind, random);
    return { kind, occupied, group };
  }
  if (kind === "mirror") {
    const left = sorted(shuffled(range(24).filter((cell) => cell % 6 < 3), random).slice(0, integer(random, 4, 8)));
    const right = left.map(reflect);
    const removed = integer(random, 0, right.length - 1);
    const choices = range(24).filter((cell) => cell % 6 >= 3 && !right.includes(cell));
    right[removed] = choices[integer(random, 0, choices.length - 1)];
    return { kind, left, right: sorted(right) };
  }
  if (kind === "tiles") {
    const shape = (size: number) => {
      const cells = [integer(random, 0, 15)];
      while (cells.length < size) {
        const adjacent = range(16).filter((cell) => !cells.includes(cell) && cells.some((other) => adjoining(cell, other)));
        cells.push(adjacent[integer(random, 0, adjacent.length - 1)]);
      }
      return sorted(cells);
    };
    const hole = shape(integer(random, 3, 6));
    const options = [hole];
    while (options.length < 3) {
      const next = shape(hole.length);
      if (!options.some((option) => outline(option) === outline(next))) options.push(next);
    }
    const outside = range(16).filter((cell) => !hole.includes(cell) && hole.some((other) => adjoining(cell, other))
      && removable([...hole, cell], hole).length === 1);
    if (!outside.length) return createSpatialProblem(kind, random);
    const larger = [sorted([...hole, outside[integer(random, 0, outside.length - 1)]])];
    while (larger.length < 3) {
      const next = shape(hole.length + 1);
      if (removable(next, hole).length === 0 && !larger.some((option) => outline(option) === outline(next))) larger.push(next);
    }
    return { kind, hole, options: shuffled(options, random), larger: shuffled(larger, random) };
  }
  if (kind === "code") return { kind, key: shuffled([0, 1, 2], random), symbols: shuffled([0, 1, 2, 3, ...range(5).map(() => integer(random, 0, 3))], random) };
  if (kind === "path") {
    const start = integer(random, 0, 35), visited = [start], moves: { direction: number; steps: number }[] = [];
    for (let turn = 0; turn < 4; turn++) {
      const choices: { direction: number; steps: number; cells: number[] }[] = [];
      for (let direction = 0; direction < 4; direction++) {
        if (moves.at(-1)?.direction === direction) continue;
        let cell = visited.at(-1)!;
        const cells: number[] = [];
        for (let steps = 1; steps <= 3; steps++) {
          const next = cell + [1, 6, -1, -6][direction];
          if (next < 0 || next >= 36 || visited.includes(next) || ((direction === 0 || direction === 2) && Math.floor(next / 6) !== Math.floor(cell / 6))) break;
          cells.push(next); cell = next;
          choices.push({ direction, steps, cells: [...cells] });
        }
      }
      if (!choices.length) return createSpatialProblem(kind, random);
      const choice = choices[integer(random, 0, choices.length - 1)];
      moves.push({ direction: choice.direction, steps: choice.steps }); visited.push(...choice.cells);
    }
    return { kind, start, moves };
  }
  if (kind === "views") {
    const heights = shuffled([0, 1, integer(random, 2, 4), integer(random, 1, 4), integer(random, 0, 4)], random);
    const footprint = heights.map((height) => height > 0 ? 1 : 0);
    const flips = shuffled(range(5), random).slice(0, 2);
    const options = shuffled([footprint, ...flips.map((flip) => footprint.map((value, index) => index === flip ? 1 - value : value))], random);
    return { kind, heights, options };
  }
  return { kind, width: integer(random, 2, 4), height: integer(random, 3, 5), cutCorner: random() < 0.5 };
}
