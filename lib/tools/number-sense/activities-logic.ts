import type { ActivityDefinition } from "./types";

export type LogicProblem =
  | { kind: "beads"; motif: readonly number[]; gap: number; wrong: number }
  | { kind: "outfits"; tops: readonly number[]; bottoms: readonly number[]; forbidden: readonly [number, number] }
  | { kind: "order"; before: readonly (readonly [number, number])[]; lineup: readonly number[] }
  | { kind: "clues"; toys: readonly { shape: number; striped: number }[]; targetShape: number; targetStriped: number }
  | { kind: "bus"; before: number; off: number; on: number }
  | { kind: "calendar"; length: number; weekday: number; start: number; wait: number }
  | { kind: "ribbon"; first: number; second: number; overlap: number }
  | { kind: "pockets"; start: number; span: number; holes: readonly number[] };

export type LogicValidation =
  | { kind: "beads"; values: readonly number[]; sequence: readonly number[]; missing: readonly number[]; corrected: number }
  | { kind: "outfits"; values: readonly number[]; pairs: readonly (readonly [number, number])[]; allowed: readonly (readonly [number, number])[] }
  | { kind: "order"; values: readonly number[]; solutions: readonly (readonly number[])[]; misplaced: readonly number[] }
  | { kind: "clues"; values: readonly number[]; cells: readonly number[]; target: number }
  | { kind: "bus"; values: readonly number[]; afterOff: number; final: number; reverse: number }
  | { kind: "calendar"; values: readonly number[]; finish: number; nextWeek: number; column: number }
  | { kind: "ribbon"; values: readonly number[]; joined: number; overlapped: number }
  | { kind: "pockets"; values: readonly number[]; missing: readonly number[]; pairs: readonly (readonly [number, number])[] };

export const LOGIC_DEFINITIONS: Record<LogicProblem["kind"], ActivityDefinition> = {
  beads: { skill: "construct", title: "项链接着穿", action: "draw", repeatAction: "circle", prompt: "找一段会重复的花纹，补上空珠。", followUp: "哪一小段一直在重复？", objective: "辨认重复单元，补全与修正花纹", repeatPrompt: "项链穿错了一颗，找出来改一改。", repeatFollowUp: "你也能设计一段重复的花纹吗？" },
  outfits: { skill: "compose", title: "搭配小衣橱", action: "connect", repeatAction: "connect", prompt: "一件上衣配一件下装，连出所有搭配。", followUp: "怎样连，才不会重复或漏掉？", objective: "有顺序地找全搭配，再考虑限制", repeatPrompt: "有一种搭配不能选，其他都能找全吗？", repeatFollowUp: "少了一种，其他搭配受影响吗？" },
  order: { skill: "distance", title: "谁站在哪里", action: "fill", repeatAction: "trace", prompt: "听听三个提示，给伙伴排好队。", followUp: "哪一条提示帮你先找到位置？", objective: "结合前后线索，检查并修正顺序", repeatPrompt: "这支队伍排错了，找出要交换的伙伴。", repeatFollowUp: "换好以后，每条提示都对吗？" },
  clues: { skill: "structure", title: "给玩具找家", action: "fill", repeatAction: "circle", prompt: "看形状和花纹，把编号送进格子。", followUp: "只看一个特点，能找到唯一的家吗？", objective: "同时使用两个特点分类与排除", repeatPrompt: "听三个提示，圈出藏起来的玩具。", repeatFollowUp: "去掉一条提示，还能确定是谁吗？" },
  bus: { skill: "relation", title: "公交车的变化", action: "fill", repeatAction: "fill", prompt: "有人下车，又有人上车，看看人数怎样变。", followUp: "能把这段经过倒着想一遍吗？", objective: "用前后变化图顺推与倒推人数", repeatPrompt: "知道到站时的人数，找找出发时有几人。", repeatFollowUp: "让这些人按原路回去，能回到出发时吗？" },
  calendar: { skill: "distance", title: "日历小计划", action: "trace", repeatAction: "trace", prompt: "把约好的日子圈出来，沿日历走一走。", followUp: "走到一排的末尾，下一天在哪里？", objective: "读取日历顺序，跨行寻找前后日期", repeatPrompt: "从约好的那天往回找，哪天开始准备？", repeatFollowUp: "隔一周，同一列里的数怎样变？" },
  ribbon: { skill: "estimate", title: "彩带接起来", action: "draw", repeatAction: "draw", prompt: "把两条彩带接起来，看看盖住的地方。", followUp: "盖住的一段，能算两次吗？", objective: "理解拼接长度与重叠的关系", repeatPrompt: "要拼到指定长度，画出两条彩带的位置。", repeatFollowUp: "盖住的地方变长，拼好的会怎样？" },
  pockets: { skill: "construct", title: "数卡小火车", action: "fill", repeatAction: "fill", prompt: "前后紧挨的数每次多一，把车票补齐。", followUp: "少掉的车票，怎样一张不漏地找回？", objective: "利用数序找缺失，比较不同条件下的可能", repeatPrompt: "只要从小到大排，中间能放哪些数？", repeatFollowUp: "车头车尾相同，中间一定相同吗？" },
};

const integer = (random: () => number, low: number, high: number) => low + Math.floor(random() * (high - low + 1));
function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = integer(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function permutations(values: readonly number[]): number[][] {
  if (!values.length) return [[]];
  return values.flatMap((value) => permutations(values.filter((other) => other !== value)).map((rest) => [value, ...rest]));
}

export function isLogicKind(kind: string): kind is LogicProblem["kind"] {
  return Object.prototype.hasOwnProperty.call(LOGIC_DEFINITIONS, kind);
}

export function createLogicProblem(kind: LogicProblem["kind"], random: () => number): LogicProblem {
  if (kind === "beads") {
    const symbols = shuffled([0, 1, 2], random);
    const form = integer(random, 0, 3);
    const motif = form === 0 ? symbols.slice(0, 2) : form === 1 ? [symbols[0], symbols[0], symbols[1]] : form === 2 ? [symbols[0], symbols[1], symbols[1]] : symbols;
    const gap = integer(random, 6, 9);
    return { kind, motif, gap, wrong: (motif[gap % motif.length] + integer(random, 1, 2)) % 3 };
  }
  if (kind === "outfits") {
    const tops = shuffled([0, 1, 2, 3], random).slice(0, integer(random, 2, 3));
    const bottoms = shuffled([0, 1, 2, 3], random).slice(0, integer(random, 2, 3));
    return { kind, tops, bottoms, forbidden: [integer(random, 0, tops.length - 1), integer(random, 0, bottoms.length - 1)] };
  }
  if (kind === "order") {
    const sequence = shuffled([0, 1, 2, 3], random);
    const before = sequence.slice(0, -1).map((token, i) => [token, sequence[i + 1]] as const);
    const lineup = [...sequence], at = integer(random, 0, 2);
    [lineup[at], lineup[at + 1]] = [lineup[at + 1], lineup[at]];
    return { kind, before: shuffled(before, random), lineup };
  }
  if (kind === "clues") return { kind, toys: shuffled([0, 1, 2].flatMap((shape) => [0, 1].map((striped) => ({ shape, striped }))), random), targetShape: integer(random, 0, 2), targetStriped: integer(random, 0, 1) };
  if (kind === "bus") {
    const before = integer(random, 30, 70);
    return { kind, before, off: integer(random, 2, Math.min(20, before - 2)), on: integer(random, 2, 20) };
  }
  if (kind === "calendar") {
    const weekday = integer(random, 0, 6);
    // 起点接近周末，让孩子确实需要越过日历的一行。
    const starts = Array.from({ length: 12 }, (_, i) => i + 6).filter((n) => (weekday + n - 1) % 7 >= 4);
    return { kind, length: integer(random, 28, 31), weekday, start: starts[integer(random, 0, starts.length - 1)], wait: integer(random, 3, 5) };
  }
  if (kind === "ribbon") return { kind, first: integer(random, 8, 14), second: integer(random, 6, 12), overlap: integer(random, 2, 4) };
  return { kind, start: integer(random, 0, 18), span: integer(random, 6, 9), holes: shuffled([1, 2, 3, 4, 5], random).slice(0, 3).sort((a, b) => a - b) };
}

export function inspectLogicProblem(p: LogicProblem): LogicValidation {
  if (p.kind === "beads") {
    const sequence = Array.from({ length: 12 }, (_, i) => p.motif[i % p.motif.length]);
    return { kind: p.kind, sequence, missing: sequence.slice(p.gap, p.gap + 2), corrected: sequence[p.gap], values: [...p.motif, p.gap, p.wrong, ...sequence] };
  }
  if (p.kind === "outfits") {
    const pairs = p.tops.flatMap((_, a) => p.bottoms.map((__, b) => [a, b] as const));
    const allowed = pairs.filter(([a, b]) => a !== p.forbidden[0] || b !== p.forbidden[1]);
    return { kind: p.kind, pairs, allowed, values: [...p.tops, ...p.bottoms, ...p.forbidden, pairs.length, allowed.length] };
  }
  if (p.kind === "order") {
    const solutions = permutations([0, 1, 2, 3]).filter((sequence) => p.before.every(([a, b]) => sequence.indexOf(a) + 1 === sequence.indexOf(b)));
    const misplaced = p.lineup.flatMap((token, i) => token === solutions[0]?.[i] ? [] : [i]);
    return { kind: p.kind, solutions, misplaced, values: [...p.before.flat(), ...p.lineup, ...solutions.flat(), ...misplaced] };
  }
  if (p.kind === "clues") {
    const cells = p.toys.map((toy) => toy.shape * 2 + toy.striped);
    const target = p.toys.findIndex((toy) => toy.shape === p.targetShape && toy.striped === p.targetStriped);
    return { kind: p.kind, cells, target, values: [...cells, p.targetShape, p.targetStriped, target] };
  }
  if (p.kind === "bus") {
    const afterOff = p.before - p.off, final = afterOff + p.on;
    return { kind: p.kind, afterOff, final, reverse: final - p.on + p.off, values: [p.before, p.off, p.on, afterOff, final] };
  }
  if (p.kind === "calendar") return { kind: p.kind, finish: p.start + p.wait, nextWeek: p.start + 7, column: (p.weekday + p.start - 1) % 7, values: [p.length, p.weekday, p.start, p.wait, p.start + p.wait, p.start + 7] };
  if (p.kind === "ribbon") return { kind: p.kind, joined: p.first + p.second, overlapped: p.first + p.second - p.overlap, values: [p.first, p.second, p.overlap, p.first + p.second, p.first + p.second - p.overlap] };
  const pairs: [number, number][] = [];
  for (let a = p.start + 1; a < p.start + p.span; a += 1)
    for (let b = a + 1; b < p.start + p.span; b += 1) pairs.push([a, b]);
  return { kind: p.kind, missing: p.holes.map((hole) => p.start + hole), pairs, values: [p.start, p.span, ...p.holes, ...p.holes.map((hole) => p.start + hole), ...pairs.flat(), p.start + p.span] };
}

export function validateLogicProblem(p: LogicProblem): boolean {
  const v = inspectLogicProblem(p);
  if (!v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (p.kind === "beads") return [2, 3].includes(p.motif.length) && new Set(p.motif).size >= 2 && p.motif.every((n) => n >= 0 && n <= 2) && p.gap >= 6 && p.gap <= 9 && p.wrong >= 0 && p.wrong <= 2 && p.wrong !== p.motif[p.gap % p.motif.length];
  if (p.kind === "outfits") return [2, 3].includes(p.tops.length) && [2, 3].includes(p.bottoms.length) && new Set(p.tops).size === p.tops.length && new Set(p.bottoms).size === p.bottoms.length && [...p.tops, ...p.bottoms].every((n) => n >= 0 && n <= 3) && p.forbidden[0] >= 0 && p.forbidden[0] < p.tops.length && p.forbidden[1] >= 0 && p.forbidden[1] < p.bottoms.length;
  if (p.kind === "order") return p.before.length === 3 && p.lineup.length === 4 && new Set(p.lineup).size === 4 && p.lineup.every((n) => n >= 0 && n < 4) && v.kind === p.kind && v.solutions.length === 1 && v.misplaced.length === 2;
  if (p.kind === "clues") return p.toys.length === 6 && new Set(p.toys.map((toy) => `${toy.shape}:${toy.striped}`)).size === 6 && p.toys.every((toy) => [0, 1, 2].includes(toy.shape) && [0, 1].includes(toy.striped)) && [0, 1, 2].includes(p.targetShape) && [0, 1].includes(p.targetStriped);
  if (p.kind === "bus") return p.before >= 30 && p.before <= 70 && p.off >= 2 && p.off < p.before && p.on >= 2 && p.on <= 20;
  if (p.kind === "calendar") return p.length >= 28 && p.length <= 31 && p.weekday <= 6 && p.start >= 6 && p.start <= 17 && p.wait >= 3 && p.wait <= 5 && p.start + p.wait <= p.length && p.start + 7 <= p.length;
  if (p.kind === "ribbon") return p.first >= 8 && p.first <= 14 && p.second >= 6 && p.second <= 12 && p.overlap >= 2 && p.overlap <= 4 && p.overlap < Math.min(p.first, p.second);
  return p.start <= 18 && p.span >= 6 && p.span <= 9 && p.holes.length === 3 && new Set(p.holes).size === 3 && p.holes.every((hole) => hole > 0 && hole < p.span);
}

/** 去掉本版看不见的条件；衣橱还忽略纯装饰换装，确保换题改变搭配结构。 */
export function logicSignature(p: LogicProblem, edition: 0 | 1): string {
  if (p.kind === "beads") return JSON.stringify({ kind: p.kind, motif: p.motif, gap: p.gap, ...(edition ? { wrong: p.wrong } : {}) });
  if (p.kind === "outfits") return JSON.stringify({ kind: p.kind, tops: p.tops.length, bottoms: p.bottoms.length });
  if (p.kind === "order") return JSON.stringify({ kind: p.kind, before: [...p.before].sort((a, b) => a[0] - b[0]), ...(edition ? { lineup: p.lineup } : {}) });
  if (p.kind === "clues") return JSON.stringify(edition
    ? { kind: p.kind, targetShape: p.targetShape, targetStriped: p.targetStriped }
    : { kind: p.kind, toys: p.toys });
  if (p.kind === "pockets" && edition) return JSON.stringify({ kind: p.kind, start: p.start, span: p.span });
  return JSON.stringify(p);
}
