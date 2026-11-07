import type { ActivityDefinition, Pair, Triple } from "./types";

export type QuantityProblem =
  | { kind: "pairing"; counts: Triple }
  | { kind: "bundles"; boxes: number; loose: number; options: Triple }
  | { kind: "hidden"; total: number; visible: number; emerge: number }
  | { kind: "line"; start: number; numbers: Triple; extra: number }
  | { kind: "compensation"; left: number; right: number }
  | { kind: "difference"; positions: Pair; together: number; steps: Pair }
  | { kind: "capacity"; capacities: Triple; occupied: Triple; incoming: number }
  | { kind: "collections"; items: readonly { shape: 0 | 1 | 2; striped: boolean }[]; target: 0 | 1 | 2 };

export type QuantityValidation =
  | { kind: "pairing"; values: readonly number[]; pairs: Triple; leftovers: Triple; pairableJoins: readonly Pair[] }
  | { kind: "bundles"; values: readonly number[]; total: number; correctOption: number; unpacked: Pair }
  | { kind: "hidden"; values: readonly number[]; covered: number; stillCovered: number; nowVisible: number }
  | { kind: "line"; values: readonly number[]; offsets: Triple; nearestRight: number; extraOffset: number; ordered: readonly number[] }
  | { kind: "compensation"; values: readonly number[]; toLeft: number; toRight: number; afterLeft: Pair; afterRight: Pair; total: number }
  | { kind: "difference"; values: readonly number[]; gap: number; afterTogether: Pair; afterSteps: Pair; finalGap: number; leader: 0 | 1 | 2 }
  | { kind: "capacity"; values: readonly number[]; free: Triple; fits: readonly number[]; exact: number; splits: readonly Pair[] }
  | { kind: "collections"; values: readonly number[]; byShape: Triple; byTexture: Pair; intersection: readonly number[]; total: number };

export const QUANTITY_DEFINITIONS: Record<QuantityProblem["kind"], ActivityDefinition> = {
  pairing: { skill: "structure", title: "舞会找伙伴", action: "circle", repeatAction: "circle",
    prompt: "两个一对圈起来，看看谁会落单。", followUp: "添一位伙伴，哪队就不落单？",
    repeatPrompt: "把两队合起来，能都找到伙伴吗？", repeatFollowUp: "不用重数，你是怎样知道的？",
    objective: "通过配对理解落单与合并的关系" },
  bundles: { skill: "structure", title: "积木装进十格盒", action: "connect", repeatAction: "draw",
    prompt: "满盒和散块，连到同样多的数。", followUp: "打开一盒，积木会变多吗？",
    repeatPrompt: "圈出十块装一盒，画出新的摆法。", repeatFollowUp: "盒子多了，积木一共变了吗？",
    objective: "在整盒与散块之间转换同一个数量" },
  hidden: { skill: "compose", title: "云后藏着几只鸟", action: "fill", repeatAction: "draw",
    prompt: "看见一部分，找出云后的鸟。", followUp: "飞出几只后，云后还剩几只？",
    repeatPrompt: "知道云后有几只，画出云外的鸟。", repeatFollowUp: "换一种排法画云外的鸟，说一说。",
    objective: "用整体和已知部分推断另一部分" },
  line: { skill: "distance", title: "数线上的小旗", action: "connect", repeatAction: "fill",
    prompt: "把数卡送到数线上合适的地方。", followUp: "谁离右边的终点最近？",
    repeatPrompt: "看小旗的位置，填好它的号码。", repeatFollowUp: "再放一张数卡，谁会排在它两边？",
    objective: "把数的大小、顺序与距离联系起来" },
  compensation: { skill: "compose", title: "拼到整十更好看", action: "draw", repeatAction: "draw",
    prompt: "搬几颗珠子，让左边凑成整十。", followUp: "两边合起来，还是一样多吗？",
    repeatPrompt: "不搬珠子，添或拿走让两边都成整十。", repeatFollowUp: "两种办法，合起来一样多吗？",
    objective: "理解加法补偿与整体不变" },
  difference: { skill: "relation", title: "谁追上了谁", action: "trace", repeatAction: "trace",
    prompt: "走同样远，两人之间会变近吗？", followUp: "把新位置标出来，再比一比。",
    repeatPrompt: "两人走得不一样远，谁在前面？", repeatFollowUp: "怎样走，后面的才能追上？",
    objective: "比较同增与不同增造成的距离变化" },
  capacity: { skill: "estimate", title: "哪个盒子放得下", action: "circle", repeatAction: "fill",
    prompt: "看看空格，圈出能装下的盒子。", followUp: "哪一盒会刚好装满？",
    repeatPrompt: "只用两个盒子，找两种放法。", repeatFollowUp: "能换一种放法，还不挤出来吗？",
    objective: "比较空余容量并构造可行的分放办法" },
  collections: { skill: "structure", title: "换一种分法", action: "fill", repeatAction: "circle",
    prompt: "按形状分，再按花纹分。", followUp: "分法换了，一共会变吗？",
    repeatPrompt: "同时看形状和花纹，圈出目标。", repeatFollowUp: "只看一个条件，会多圈哪些？",
    objective: "对同一批物件重新分类并交叉筛选" },
};

export function isQuantityKind(kind: string): kind is QuantityProblem["kind"] {
  return Object.prototype.hasOwnProperty.call(QUANTITY_DEFINITIONS, kind);
}

/** 选项顺序、队名和散放位置不会构成一次新的数学活动。 */
export function quantitySignature(p: QuantityProblem, edition: 0 | 1): string {
  if (p.kind === "bundles") return JSON.stringify({ kind: p.kind, boxes: p.boxes, loose: p.loose });
  if (p.kind === "pairing") return JSON.stringify({ kind: p.kind, counts: [...p.counts].sort((a, b) => a - b) });
  if (p.kind === "line") return JSON.stringify({ kind: p.kind, start: p.start, numbers: [...p.numbers].sort((a, b) => a - b) });
  if (p.kind === "difference") return JSON.stringify({ kind: p.kind, positions: p.positions });
  if (p.kind === "collections") return JSON.stringify({ kind: p.kind, items: [...p.items].sort((a, b) =>
    a.shape - b.shape || Number(a.striped) - Number(b.striped)) });
  // 分放版只使用 A、B，改变旁边的 C 盒不能算换了一道题。
  if (p.kind === "capacity" && edition === 1) return JSON.stringify({ kind: p.kind,
    capacities: p.capacities.slice(0, 2), occupied: p.occupied.slice(0, 2), incoming: p.incoming });
  return JSON.stringify(p);
}

const integer = (random: () => number, low: number, high: number) => low + Math.floor(random() * (high - low + 1));
function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = integer(random, 0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
const triple = (values: readonly number[]) => values as unknown as Triple;

export function createQuantityProblem(kind: QuantityProblem["kind"], random: () => number): QuantityProblem {
  if (kind === "pairing") {
    // 一队能配完，两队会落单，合并时可实际连接两位落单者。
    const even = integer(random, 4, 9) * 2;
    const odd = shuffle([7, 9, 11, 13, 15, 17, 19], random).slice(0, 2);
    return { kind, counts: triple(shuffle([even, ...odd], random)) };
  }
  if (kind === "bundles") {
    const boxes = integer(random, 2, 8), loose = integer(random, 2, 8);
    const total = boxes * 10 + loose;
    return { kind, boxes, loose, options: triple(shuffle([total, total + 10, total - 1], random)) };
  }
  if (kind === "hidden") {
    const visible = integer(random, 20, 45), covered = integer(random, 10, 35);
    return { kind, total: visible + covered, visible, emerge: integer(random, 1, covered - 1) };
  }
  if (kind === "line") {
    const start = integer(random, 1, 8) * 10;
    const offsets = shuffle(Array.from({ length: 17 }, (_, i) => i + 2), random).slice(0, 4);
    return { kind, start, numbers: triple(offsets.slice(0, 3).map((n) => start + n)), extra: start + offsets[3] };
  }
  if (kind === "compensation") {
    return { kind, left: integer(random, 2, 4) * 10 + integer(random, 6, 9),
      right: integer(random, 1, 3) * 10 + integer(random, 4, 8) };
  }
  if (kind === "difference") {
    const behind = integer(random, 10, 25), gap = integer(random, 4, 10);
    return { kind, positions: [behind + gap, behind], together: integer(random, 3, 9),
      steps: [integer(random, 2, 6), integer(random, 4, 15)] };
  }
  if (kind === "capacity") {
    const incoming = integer(random, 5, 9);
    const free = shuffle([integer(random, 2, incoming - 1), incoming, integer(random, incoming + 1, 10)], random);
    const capacities = triple(shuffle([10, 20, 30], random));
    return { kind, capacities, occupied: triple(capacities.map((n, i) => n - free[i])), incoming };
  }
  const items: { shape: 0 | 1 | 2; striped: boolean }[] = [];
  // 每种形状的两种纹理都出现，避免双条件选择退化成单条件。
  for (const shape of [0, 1, 2] as const) for (const striped of [false, true]) {
    for (let i = 0, count = integer(random, 1, 3); i < count; i += 1) items.push({ shape, striped });
  }
  return { kind, items: shuffle(items, random), target: integer(random, 0, 2) as 0 | 1 | 2 };
}

export function inspectQuantityProblem(p: QuantityProblem): QuantityValidation {
  if (p.kind === "pairing") {
    const pairs = triple(p.counts.map((n) => Math.floor(n / 2)));
    const leftovers = triple(p.counts.map((n) => n % 2));
    const pairableJoins: Pair[] = [];
    for (let a = 0; a < 3; a += 1) for (let b = a + 1; b < 3; b += 1)
      if ((p.counts[a] + p.counts[b]) % 2 === 0) pairableJoins.push([a, b]);
    return { kind: p.kind, pairs, leftovers, pairableJoins,
      values: [...p.counts, ...pairs, ...leftovers, ...pairableJoins.flat()] };
  }
  if (p.kind === "bundles") {
    const total = p.boxes * 10 + p.loose;
    const unpacked: Pair = [p.boxes - 1, p.loose + 10];
    return { kind: p.kind, total, correctOption: p.options.indexOf(total), unpacked,
      values: [p.boxes, p.loose, total, ...p.options, ...unpacked] };
  }
  if (p.kind === "hidden") {
    const covered = p.total - p.visible, stillCovered = covered - p.emerge, nowVisible = p.visible + p.emerge;
    return { kind: p.kind, covered, stillCovered, nowVisible,
      values: [p.total, p.visible, p.emerge, covered, stillCovered, nowVisible] };
  }
  if (p.kind === "line") {
    const offsets = triple(p.numbers.map((n) => n - p.start));
    return { kind: p.kind, offsets, nearestRight: p.numbers.indexOf(Math.max(...p.numbers)),
      extraOffset: p.extra - p.start, ordered: [...p.numbers, p.extra].sort((a, b) => a - b),
      values: [p.start, p.start + 20, ...p.numbers, ...offsets, p.extra, p.extra - p.start] };
  }
  if (p.kind === "compensation") {
    const toLeft = 10 - p.left % 10, toRight = 10 - p.right % 10;
    const afterLeft: Pair = [p.left + toLeft, p.right - toLeft];
    const afterRight: Pair = [p.left - toRight, p.right + toRight];
    return { kind: p.kind, toLeft, toRight, afterLeft, afterRight, total: p.left + p.right,
      values: [p.left, p.right, toLeft, toRight, ...afterLeft, ...afterRight, p.left + p.right] };
  }
  if (p.kind === "difference") {
    const afterTogether: Pair = [p.positions[0] + p.together, p.positions[1] + p.together];
    const afterSteps: Pair = [p.positions[0] + p.steps[0], p.positions[1] + p.steps[1]];
    const leader = afterSteps[0] === afterSteps[1] ? 2 : afterSteps[0] > afterSteps[1] ? 0 : 1;
    const gap = p.positions[0] - p.positions[1], finalGap = Math.abs(afterSteps[0] - afterSteps[1]);
    return { kind: p.kind, gap, afterTogether, afterSteps, finalGap, leader,
      values: [...p.positions, p.together, ...p.steps, ...afterTogether, ...afterSteps, gap, finalGap, leader] };
  }
  if (p.kind === "capacity") {
    const free = triple(p.capacities.map((n, i) => n - p.occupied[i]));
    const fits = free.flatMap((n, i) => n >= p.incoming ? [i] : []);
    const splits: Pair[] = [];
    for (let a = 1; a < p.incoming; a += 1)
      if (a <= free[0] && p.incoming - a <= free[1]) splits.push([a, p.incoming - a]);
    return { kind: p.kind, free, fits, exact: free.indexOf(p.incoming), splits,
      values: [...p.capacities, ...p.occupied, p.incoming, ...free, ...fits, ...splits.flat()] };
  }
  const byShape = triple([0, 1, 2].map((shape) => p.items.filter((item) => item.shape === shape).length));
  const byTexture: Pair = [p.items.filter((item) => !item.striped).length, p.items.filter((item) => item.striped).length];
  const intersection = p.items.flatMap((item, i) => item.shape === p.target && item.striped ? [i] : []);
  return { kind: p.kind, byShape, byTexture, intersection, total: p.items.length,
    values: [...byShape, ...byTexture, ...intersection, p.items.length, p.target] };
}

export function validateQuantityProblem(p: QuantityProblem): boolean {
  const result = inspectQuantityProblem(p);
  if (!result.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (p.kind === "pairing") return p.counts.length === 3 && p.counts.every((n) => n >= 7 && n <= 19)
    && new Set(p.counts).size === 3 && p.counts.filter((n) => n % 2 === 1).length === 2;
  if (p.kind === "bundles") return p.boxes >= 2 && p.boxes <= 8 && p.loose >= 2 && p.loose <= 8
    && p.options.length === 3 && new Set(p.options).size === 3
    && p.options.filter((n) => n === p.boxes * 10 + p.loose).length === 1;
  if (p.kind === "hidden") return p.visible >= 20 && p.visible <= 45 && p.total > p.visible
    && p.total - p.visible <= 35 && p.emerge >= 1 && p.emerge < p.total - p.visible;
  if (p.kind === "line") return p.start >= 10 && p.start <= 80 && p.start % 10 === 0
    && p.numbers.length === 3 && new Set([...p.numbers, p.extra]).size === 4
    && [...p.numbers, p.extra].every((n) => n > p.start && n < p.start + 20);
  if (p.kind === "compensation") return p.left >= 26 && p.left <= 49 && p.right >= 14 && p.right <= 38
    && p.left % 10 >= 6 && p.right % 10 >= 4 && p.right % 10 <= 8;
  if (p.kind === "difference") return p.positions.length === 2 && p.steps.length === 2
    && p.positions[0] > p.positions[1] && p.positions.every((n) => n >= 10 && n <= 35)
    && p.together >= 3 && p.together <= 9 && p.steps.every((n) => n >= 2 && n <= 15)
    && Math.max(...p.positions) + Math.max(p.together, ...p.steps) <= 50;
  if (p.kind === "capacity") return p.capacities.length === 3 && p.occupied.length === 3
    && new Set(p.capacities).size === 3 && p.capacities.every((n) => [10, 20, 30].includes(n))
    && p.occupied.every((n, i) => n >= 0 && n <= p.capacities[i])
    && p.incoming >= 5 && p.incoming <= 9 && result.kind === "capacity"
    && result.fits.length === 2 && result.exact >= 0 && result.splits.length >= 2;
  return p.items.length >= 6 && p.items.length <= 18 && [0, 1, 2].includes(p.target)
    && p.items.every((item) => [0, 1, 2].includes(item.shape) && typeof item.striped === "boolean")
    && [0, 1, 2].every((shape) => [false, true].every((striped) =>
      p.items.some((item) => item.shape === shape && item.striped === striped)));
}
