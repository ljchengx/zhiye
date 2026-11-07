import type { ActivityDefinition, Pair, Triple } from "./types";

export type NumberProblem =
  | { kind: "manyWays"; target: number; values: readonly number[] }
  | { kind: "regroup"; total: number; options: readonly Pair[] }
  | { kind: "dualLine"; step: number; upperBound: number; lowerBound: number; upper: number; lower: number }
  | { kind: "benchmark"; cards: readonly number[]; anchors: Pair }
  | { kind: "aboutHowMany"; first: number; second: number; options: readonly number[] }
  | { kind: "reasonable"; a: number; b: number; operator: 0 | 1; options: Triple }
  | {
      kind: "equationMatch";
      left: number;
      right: number;
      sum: number;
      choices: readonly (readonly [number, 0 | 1, number, number])[];
      pictures: readonly Pair[];
    }
  | { kind: "compareBig"; cards: readonly number[]; low: number; high: number; target: number; replacements: readonly number[] };

export type NumberValidation =
  | { kind: "manyWays"; values: readonly number[]; different: readonly number[]; delta: number }
  | { kind: "regroup"; values: readonly number[]; solutions: readonly Pair[]; valid: readonly number[]; count: number }
  | { kind: "dualLine"; values: readonly number[]; upper: number; lower: number; gap: number }
  | { kind: "benchmark"; values: readonly number[]; nearestA: number; nearestB: number; order: readonly number[]; nearestTen: number }
  | { kind: "aboutHowMany"; values: readonly number[]; closest: number; gap: number }
  | { kind: "reasonable"; values: readonly number[]; exact: number; closest: number }
  | { kind: "equationMatch"; values: readonly number[]; validChoices: readonly number[]; validPictures: readonly number[] }
  | { kind: "compareBig"; values: readonly number[]; inRange: readonly number[]; nearest: number; swaps: readonly number[] };

export const NUMBER_DEFINITIONS: Record<NumberProblem["kind"], ActivityDefinition> = {
  manyWays: {
    skill: "structure", title: "同一个数", action: "circle", repeatAction: "draw",
    prompt: "五幅小图说的是同一个数吗？圈出不一样的那幅。",
    followUp: "它表示的是几？写在框里。",
    repeatPrompt: "四幅小图说的是同一个数，换一种方式再表示一次。",
    repeatFollowUp: "说一说，它们哪里一样？",
    objective: "在十格、数线、数卡和算式之间认出同一个数",
  },
  regroup: {
    skill: "structure", title: "几个十和几个一", action: "circle", repeatAction: "fill",
    prompt: "圈出能说清这些珠子的说法。",
    followUp: "分法换了，珠子一共变了吗？",
    repeatPrompt: "把同一个数拆成几个十和几个一，找出所有拆法。",
    repeatFollowUp: "一共有几种拆法？写在框里。",
    objective: "理解同一个数可以有几种不同的十与一的拆法",
  },
  dualLine: {
    skill: "distance", title: "两条数线", action: "fill", repeatAction: "draw",
    prompt: "两条数线都走到同一格，各表示几？填一填。",
    followUp: "同一个位置，两个数相差多少？",
    repeatPrompt: "把两张数卡放到两条数线的同一格上。",
    repeatFollowUp: "为什么落在同一格，两个数不一样？",
    objective: "看出同一位置在不同范围的数线上表示不同的数",
  },
  benchmark: {
    skill: "distance", title: "离整十多远", action: "circle", repeatAction: "fill",
    prompt: "圈出离 50 最近的，再圈出离 100 最近的。",
    followUp: "你先看它离哪个整十近？说一说。",
    repeatPrompt: "把四张数卡按离 100 由近到远排好。",
    repeatFollowUp: "再圈出最接近整十的那张。",
    objective: "用整十和 100 作对照判断数的位置",
  },
  aboutHowMany: {
    skill: "estimate", title: "先猜再数", action: "circle", repeatAction: "circle",
    prompt: "先不要一个个数。猜一猜大约是多少，圈出来。",
    followUp: "现在按十个一组数一数，你猜得接近吗？",
    repeatPrompt: "两处小圆点，先猜哪处多、大约差几十。",
    repeatFollowUp: "再按十个一组数一数，看看差多少。",
    objective: "先猜数量，再用分组检查自己的判断",
  },
  reasonable: {
    skill: "estimate", title: "哪个结果合理", action: "circle", repeatAction: "circle",
    prompt: "只用整十想一想，圈掉不可能的结果。",
    followUp: "把合理的那个圈出来，说一说为什么。",
    repeatPrompt: "看算式，圈出合理的得数。",
    repeatFollowUp: "改一个数字，让另一个结果也合理。",
    objective: "用整十判断结果的范围，排除不合理答案",
  },
  equationMatch: {
    skill: "relation", title: "图和算式", action: "circle", repeatAction: "circle",
    prompt: "圈出能说清这幅图的算式，可以多于一个。",
    followUp: "在框里写一句，它们说的是什么。",
    repeatPrompt: "给一个算式，圈出能说清它的那幅图。",
    repeatFollowUp: "把另一幅图改一个数字，让它也能说清。",
    objective: "在图和加减算式之间来回对照，用算式说出关系",
  },
  compareBig: {
    skill: "distance", title: "比 60 大又比 80 小", action: "circle", repeatAction: "fill",
    prompt: "圈出 60～80 之间的，圈出离 70 最近的。",
    followUp: "你还能写一个符合条件的数吗？写在框里。",
    repeatPrompt: "换掉一张数卡，让区间里正好有两个数。",
    repeatFollowUp: "把所有换法都找出来，写在框里。",
    objective: "在几十几的范围内比较大小并找出符合条件的数",
  },
};

export function isNumberKind(kind: string): kind is NumberProblem["kind"] {
  return Object.prototype.hasOwnProperty.call(NUMBER_DEFINITIONS, kind);
}

const integer = (random: () => number, low: number, high: number) => low + Math.floor(random() * (high - low + 1));
function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = integer(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);

export function createNumberProblem(kind: NumberProblem["kind"], random: () => number): NumberProblem {
  if (kind === "manyWays") {
    const target = integer(random, 32, 86);
    const delta = (random() < 0.5 ? -1 : 1) * integer(random, 4, 9);
    return { kind, target, values: [target, target, target, target, target + delta] };
  }
  if (kind === "regroup") {
    const total = integer(random, 24, 58);
    const base = integer(random, 0, Math.floor(total / 10));
    const good = shuffled(
      Array.from({ length: Math.floor(total / 10) + 1 }, (_, k) => [k, total - k * 10] as Pair),
      random,
    ).slice(0, 2);
    // 另一个说法里，个位保持 0～9，只是合起来对不上，不出现“18 个一”这类不规范说法。
    const bad: Pair = [base, (total - base * 10 + integer(random, 1, 9)) % 10];
    return { kind, total, options: shuffled([...good, bad], random) as unknown as Pair[] };
  }
  if (kind === "dualLine") {
    const step = integer(random, 2, 9);
    const [upperBound, lowerBound] = ([[100, 50], [80, 40], [60, 30]] as const)[integer(random, 0, 2)];
    return { kind, step, upperBound, lowerBound, upper: step * upperBound / 10, lower: step * lowerBound / 10 };
  }
  if (kind === "benchmark") {
    let result: NumberProblem = { kind, cards: [], anchors: [50, 100] };
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const cards = shuffled(Array.from({ length: 12 }, (_, i) => 28 + i * 6), random).slice(0, 4);
      result = { kind, cards, anchors: [50, 100] };
      if (validateNumberProblem(result)) return result;
    }
    throw new Error("暂时无法生成合法的离整十材料");
  }
  if (kind === "aboutHowMany") {
    const first = integer(random, 38, 62);
    const second = first + (random() < 0.5 ? -1 : 1) * integer(random, 22, 32);
    const near = first + integer(random, -3, 3);
    return { kind, first, second, options: shuffled([near, first - 24, first + 22, first + 36], random) };
  }
  if (kind === "reasonable") {
    let result: NumberProblem = { kind, a: 0, b: 0, operator: 0, options: [0, 0, 0] };
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const a = integer(random, 32, 68);
      const b = integer(random, 12, 28);
      const operator: 0 | 1 = random() < 0.5 ? 0 : 1;
      const exact = operator === 0 ? a + b : a - b;
      const near = exact + integer(random, -4, 4);
      const options = shuffled([
        near,
        Math.max(0, exact - integer(random, 22, 30)),
        Math.min(100, exact + integer(random, 22, 30)),
      ], random) as unknown as Triple;
      result = { kind, a, b, operator, options };
      if (validateNumberProblem(result)) return result;
    }
    throw new Error("暂时无法生成合理的猜数材料");
  }
  if (kind === "equationMatch") {
    const left = integer(random, 20, 45);
    const right = integer(random, 12, 35);
    const sum = left + right;
    const choices = shuffled([
      [left, 0, right, sum],
      [left, 0, right, sum + 8],
      [sum, 1, left, right],
    ] as (readonly [number, 0 | 1, number, number])[], random);
    const pictures = shuffled([
      [left, right],
      [left + 8, right],
      [left, right + 6],
    ] as Pair[], random);
    return { kind, left, right, sum, choices, pictures };
  }
  const low = 60, high = 80;
  let result: NumberProblem = { kind, cards: [], low, high, target: 70, replacements: [] };
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const cards = shuffled(Array.from({ length: 11 }, (_, i) => 42 + i * 5), random).slice(0, 4);
    const replacements = shuffled(Array.from({ length: 9 }, (_, i) => 52 + i * 4), random).slice(0, 4);
    result = { kind, cards, low, high, target: 70, replacements };
    if (validateNumberProblem(result)) return result;
  }
  throw new Error("暂时无法生成合法的换卡材料");
}

/** 所有结果都从材料重新算一遍，不使用题面文字或生成器给出的中间结果。 */
export function inspectNumberProblem(p: NumberProblem): NumberValidation {
  if (p.kind === "manyWays") {
    const different = p.values.flatMap((value, i) => value === p.target ? [] : [i]);
    return { kind: p.kind, different, delta: p.values[4] - p.target,
      values: [p.target, ...p.values, ...different, Math.abs(p.values[4] - p.target)] };
  }
  if (p.kind === "regroup") {
    const solutions: Pair[] = [];
    for (let k = 0; k <= Math.floor(p.total / 10); k += 1) solutions.push([k, p.total - k * 10]);
    const valid = p.options.flatMap(([tens, ones], i) => tens * 10 + ones === p.total && ones >= 0 ? [i] : []);
    return { kind: p.kind, solutions, valid, count: solutions.length,
      values: [p.total, ...p.options.flat(), ...solutions.flat(), solutions.length, ...valid] };
  }
  if (p.kind === "dualLine") {
    const upper = p.step * p.upperBound / 10, lower = p.step * p.lowerBound / 10;
    return { kind: p.kind, upper, lower, gap: upper - lower,
      values: [p.step, p.upperBound, p.lowerBound, p.upper, p.lower, upper, lower, upper - lower] };
  }
  if (p.kind === "benchmark") {
    const distance = (value: number, anchor: number) => Math.abs(value - anchor);
    const nearest = (anchor: number) => p.cards.reduce((best, value, i) =>
      distance(value, anchor) < distance(p.cards[best], anchor) ? i : best, 0);
    const nearestA = nearest(p.anchors[0]), nearestB = nearest(p.anchors[1]);
    const order = p.cards.map((_, i) => i).sort((a, b) =>
      distance(p.cards[a], p.anchors[1]) - distance(p.cards[b], p.anchors[1]) || a - b);
    const nearestTen = p.cards.reduce((best, value, i) =>
      Math.abs(value - Math.round(value / 10) * 10) < Math.abs(p.cards[best] - Math.round(p.cards[best] / 10) * 10) ? i : best, 0);
    return { kind: p.kind, nearestA, nearestB, order, nearestTen,
      values: [...p.cards, ...p.anchors, nearestA, nearestB, nearestTen, ...order,
        ...p.cards.flatMap((value) => [distance(value, p.anchors[0]), distance(value, p.anchors[1]),
          Math.abs(value - Math.round(value / 10) * 10)])] };
  }
  if (p.kind === "aboutHowMany") {
    const closest = p.options.reduce((best, value, i) =>
      Math.abs(value - p.first) < Math.abs(p.options[best] - p.first) ? i : best, 0);
    return { kind: p.kind, closest, gap: Math.abs(p.first - p.second),
      values: [p.first, p.second, ...p.options, closest, Math.abs(p.first - p.second),
        ...p.options.map((value) => Math.abs(value - p.first))] };
  }
  if (p.kind === "reasonable") {
    const exact = p.operator === 0 ? p.a + p.b : p.a - p.b;
    const closest = p.options.reduce((best, value, i) =>
      Math.abs(value - exact) < Math.abs(p.options[best] - exact) ? i : best, 0);
    return { kind: p.kind, exact, closest,
      values: [p.a, p.b, p.operator, exact, closest, ...p.options,
        ...p.options.map((value) => Math.abs(value - exact))] };
  }
  if (p.kind === "equationMatch") {
    const validChoices = p.choices.flatMap(([x, op, y, z], i) => (op === 0 ? x + y : x - y) === z ? [i] : []);
    const validPictures = p.pictures.flatMap(([left, right], i) =>
      left + right === p.sum && right === p.right && left === p.left ? [i] : []);
    return { kind: p.kind, validChoices, validPictures,
      values: [p.left, p.right, p.sum, ...p.choices.flat(), ...p.pictures.flat(),
        ...validChoices, ...validPictures] };
  }
  const inRange = p.cards.flatMap((value, i) => value > p.low && value < p.high ? [i] : []);
  const nearest = p.cards.reduce((best, value, i) =>
    Math.abs(value - p.target) < Math.abs(p.cards[best] - p.target) ? i : best, 0);
  const swaps: number[] = [];
  for (let slot = 0; slot < p.cards.length; slot += 1) for (const [index, value] of p.replacements.entries()) {
    const after = p.cards.map((card, i) => i === slot ? value : card);
    if (after.filter((card) => card > p.low && card < p.high).length === 2) swaps.push(slot * 4 + index);
  }
  return { kind: p.kind, inRange, nearest, swaps,
    values: [...p.cards, p.low, p.high, p.target, ...p.replacements, ...inRange, nearest, ...swaps,
      ...p.cards.map((value) => Math.abs(value - p.target))] };
}

export function validateNumberProblem(p: NumberProblem): boolean {
  const v = inspectNumberProblem(p);
  const bounded = v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100);
  if (p.kind === "manyWays") return bounded && v.kind === "manyWays"
    && p.values.length === 5 && p.values.slice(0, 4).every((value) => value === p.target)
    && v.different.length === 1 && Math.abs(v.delta) >= 4 && p.values[4] !== p.target;
  if (p.kind === "regroup") return bounded && v.kind === "regroup"
    && p.total >= 24 && p.total <= 58 && p.options.length === 3
    && p.options.every(([tens, ones]) => Number.isInteger(tens) && Number.isInteger(ones))
    && v.solutions.length >= 3 && v.valid.length === 2;
  if (p.kind === "dualLine") return bounded && v.kind === "dualLine"
    && p.step >= 2 && p.step <= 9 && [60, 80, 100].includes(p.upperBound)
    && p.lowerBound === p.upperBound / 2
    && p.upper === p.step * p.upperBound / 10 && p.lower === p.step * p.lowerBound / 10
    && v.gap === p.step * p.lowerBound / 10;
  if (p.kind === "benchmark") return bounded && v.kind === "benchmark"
    && p.cards.length === 4 && new Set(p.cards).size === 4
    && p.cards.every((value) => value >= 28 && value <= 94)
    && v.nearestA !== v.nearestB && new Set(v.order).size === 4
    && p.cards.filter((value) => Math.abs(value - Math.round(value / 10) * 10)
      === Math.abs(p.cards[v.nearestTen] - Math.round(p.cards[v.nearestTen] / 10) * 10)).length === 1;
  if (p.kind === "aboutHowMany") return bounded && v.kind === "aboutHowMany"
    && p.first >= 30 && p.first <= 70 && p.second >= 0 && p.second <= 100
    && p.options.length === 4 && new Set(p.options).size === 4
    && p.options.filter((value) => Math.abs(value - p.first) <= 5).length === 1
    && p.options.filter((value) => Math.abs(value - p.first) >= 15).length === 3
    && v.gap >= 20;
  if (p.kind === "reasonable") return bounded && v.kind === "reasonable"
    && p.a >= 30 && p.a <= 70 && p.b >= 10 && p.b <= 30
    && v.exact >= 0 && v.exact <= 100 && new Set(p.options).size === 3
    && p.options.filter((value) => Math.abs(value - v.exact) <= 6).length === 1
    && p.options.filter((value) => Math.abs(value - v.exact) >= 18).length === 2;
  if (p.kind === "equationMatch") return bounded && v.kind === "equationMatch"
    && p.left >= 20 && p.right >= 12 && p.sum === p.left + p.right && p.sum <= 100
    && p.choices.length === 3 && p.pictures.length === 3
    && v.validChoices.length >= 1 && v.validChoices.length <= 2
    && v.validPictures.length === 1;
  return bounded && v.kind === "compareBig"
    && p.cards.length === 4 && new Set(p.cards).size === 4
    && p.replacements.length === 4 && p.low === 60 && p.high === 80 && p.target === 70
    && v.inRange.length >= 1
    && p.cards.filter((value) => Math.abs(value - p.target) === Math.abs(p.cards[v.nearest] - p.target)).length === 1
    && v.swaps.length >= 2;
}

/** 选项顺序、卡片顺序不改变题目；看不见的中间量不加入去重。 */
export function numberSignature(p: NumberProblem, edition: 0 | 1): string {
  // 两版任务不同，标记一律带上 edition；第二版不显示的字段也不要加入去重。
  if (p.kind === "manyWays") return JSON.stringify({ kind: p.kind, target: p.target, values: edition === 0 ? sorted(p.values) : [p.target], edition });
  if (p.kind === "regroup") return JSON.stringify({ kind: p.kind, total: p.total, ...(edition === 0 ? { options: [...p.options].map(String).sort() } : {}), edition });
  if (p.kind === "dualLine") return JSON.stringify({ kind: p.kind, step: p.step, upperBound: p.upperBound, lowerBound: p.lowerBound, edition });
  if (p.kind === "benchmark") return JSON.stringify({ kind: p.kind, cards: sorted(p.cards), anchors: p.anchors, edition });
  if (p.kind === "aboutHowMany") return JSON.stringify({ kind: p.kind, first: p.first, second: p.second, ...(edition === 0 ? { options: sorted(p.options) } : {}), edition });
  if (p.kind === "reasonable") return JSON.stringify({ kind: p.kind, a: p.a, b: p.b, operator: p.operator, options: sorted(p.options), edition });
  if (p.kind === "equationMatch") return JSON.stringify({ kind: p.kind, left: p.left, right: p.right, choices: [...p.choices].map(String).sort(), pictures: [...p.pictures].map(String).sort(), edition });
  return JSON.stringify({ kind: p.kind, cards: sorted(p.cards), ...(edition === 1 ? { replacements: sorted(p.replacements) } : {}), edition });
}
