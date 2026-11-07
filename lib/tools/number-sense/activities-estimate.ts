import type { ActivityDefinition, Pair, Triple } from "./types";

/**
 * 猜数类活动：不必算出准确结果，先看数的大小或看别人的猜数准不准。
 * 两个活动都保证「只看十位不行，必须想到进位或退位」。
 */
export type EstimateProblem =
  | { kind: "magnitude"; a: number; b: number; operator: 0 | 1; options: Triple; decade: number }
  | { kind: "closerGuess"; a: number; b: number; operator: 0 | 1; guesses: Pair; closer: 0 | 1 };

export type EstimateValidation =
  | {
      kind: "magnitude";
      values: readonly number[];
      exact: number;
      decade: number;
      upper: number;
      nearest: number;
      matches: readonly number[];
    }
  | {
      kind: "closerGuess";
      values: readonly number[];
      exact: number;
      distances: Pair;
      closer: 0 | 1;
      shown: number;
      gap: number;
    };

export const ESTIMATE_DEFINITIONS: Record<EstimateProblem["kind"], ActivityDefinition> = {
  magnitude: {
    skill: "estimate", title: "结果在哪一段", action: "circle", repeatAction: "fill",
    prompt: "先猜一猜，圈出结果在哪个十位上。",
    followUp: "你是看十位，还是看能不能进位？",
    repeatPrompt: "先猜出结果的范围，再看它接近哪个整十。",
    repeatFollowUp: "猜出的范围和算出的结果对得上吗？",
    objective: "用十位与进位判断结果的范围",
  },
  closerGuess: {
    skill: "estimate", title: "谁的猜数更准", action: "circle", repeatAction: "fill",
    prompt: "两个猜数，圈出更接近结果的那个。",
    followUp: "你怎么不看准确结果，就知道谁更近？",
    repeatPrompt: "看看这个猜数，它猜多了还是猜少了？",
    repeatFollowUp: "要改成多少才更接近？",
    objective: "在不算出准确结果时比较猜数的远近",
  },
};

export function isEstimateKind(kind: string): kind is EstimateProblem["kind"] {
  return Object.prototype.hasOwnProperty.call(ESTIMATE_DEFINITIONS, kind);
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
const exactOf = (p: EstimateProblem) => p.operator === 0 ? p.a + p.b : p.a - p.b;

export function createEstimateProblem(kind: EstimateProblem["kind"], random: () => number): EstimateProblem {
  if (kind === "magnitude") {
    let result: EstimateProblem = { kind, a: 32, b: 12, operator: 0, options: [40, 50, 60], decade: 50 };
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const a = integer(random, 32, 78);
      const operator: 0 | 1 = random() < 0.5 ? 0 : 1;
      const b = operator === 0
        ? integer(random, 11, Math.min(39, 89 - a))
        : integer(random, 11, Math.min(39, a - 20));
      const exact = operator === 0 ? a + b : a - b;
      const decade = Math.floor(exact / 10) * 10;
      if (exact < 20 || exact > 89 || decade < 20 || decade > 80) continue;
      // 十位必须变化，否则只看十位就可以了，不必进位判断。
      if (Math.floor(a / 10) === Math.floor(exact / 10)) continue;
      result = { kind, a, b, operator, options: shuffled([decade - 10, decade, decade + 10], random) as unknown as Triple, decade };
      if (validateEstimateProblem(result)) return result;
    }
    throw new Error("暂时无法生成合法的猜数材料");
  }
  let result: EstimateProblem = { kind, a: 40, b: 20, operator: 0, guesses: [60, 70], closer: 0 };
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const a = integer(random, 30, 79);
    const operator: 0 | 1 = random() < 0.5 ? 0 : 1;
    const b = operator === 0
      ? integer(random, 12, Math.min(39, 92 - a))
      : integer(random, 12, Math.min(39, a - 25));
    const exact = operator === 0 ? a + b : a - b;
    if (exact < 25 || exact > 92) continue;
    const near = exact + (random() < 0.5 ? -1 : 1) * integer(random, 0, 4);
    const far = exact + (random() < 0.5 ? -1 : 1) * integer(random, 11, 20);
    if (near < 0 || near > 100 || far < 0 || far > 100) continue;
    // 一个明显更近，孩子不用算出准确结果也能判断。
    if (Math.abs(near - exact) >= Math.abs(far - exact)) continue;
    const guesses = shuffled([near, far], random) as unknown as Pair;
    result = { kind, a, b, operator, guesses, closer: guesses[0] === near ? 0 : 1 };
    if (validateEstimateProblem(result)) return result;
  }
  throw new Error("暂时无法生成合法的猜数比较材料");
}

/** 所有结果都从材料重算，不使用题面文字。 */
export function inspectEstimateProblem(p: EstimateProblem): EstimateValidation {
  const exact = exactOf(p);
  if (p.kind === "magnitude") {
    const decade = Math.floor(exact / 10) * 10;
    const nearest = Math.round(exact / 10) * 10;
    const matches = p.options.flatMap((value, i) => value === decade ? [i] : []);
    return { kind: p.kind, exact, decade, upper: decade + 10, nearest, matches,
      values: [p.a, p.b, p.operator, ...p.options, exact, decade, decade + 10, nearest, ...matches] };
  }
  const distances: Pair = [Math.abs(p.guesses[0] - exact), Math.abs(p.guesses[1] - exact)];
  const closer: 0 | 1 = distances[0] < distances[1] ? 0 : 1;
  const shown = p.guesses[1 - closer];
  return { kind: p.kind, exact, distances, closer, shown, gap: Math.abs(shown - exact),
    values: [p.a, p.b, p.operator, ...p.guesses, exact, ...distances, closer, shown, Math.abs(shown - exact)] };
}

export function validateEstimateProblem(p: EstimateProblem): boolean {
  const v = inspectEstimateProblem(p);
  const bounded = v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100);
  if (p.kind === "magnitude") return bounded && v.kind === "magnitude"
    && p.a >= 32 && p.a <= 78 && p.b >= 11 && p.b <= 39
    && v.exact >= 20 && v.exact <= 89
    && v.decade >= 20 && v.decade <= 80 && v.decade === Math.floor(v.exact / 10) * 10
    && Math.floor(p.a / 10) !== Math.floor(v.exact / 10)
    && p.options.length === 3 && new Set(p.options).size === 3
    && v.matches.length === 1 && p.options[v.matches[0]] === v.decade
    && sorted(p.options).every((value, i) => i === 0 || value - sorted(p.options)[i - 1] === 10);
  if (p.kind === "closerGuess") return bounded && v.kind === "closerGuess"
    && p.a >= 30 && p.a <= 79 && p.b >= 12 && p.b <= 39
    && v.exact >= 25 && v.exact <= 92
    && p.guesses.length === 2 && p.guesses[0] !== p.guesses[1]
    && v.distances[0] !== v.distances[1]
    && Math.min(...v.distances) <= 4 && Math.max(...v.distances) >= 11
    && v.closer === (v.distances[0] < v.distances[1] ? 0 : 1)
    && v.gap >= 11;
  return false;
}

/** 选项顺序、猜数顺序不改变题目；第二版不显示的字段不加入去重。 */
export function estimateSignature(p: EstimateProblem, edition: 0 | 1): string {
  if (p.kind === "magnitude")
    return JSON.stringify({ kind: p.kind, a: p.a, b: p.b, operator: p.operator,
      ...(edition === 0 ? { options: sorted(p.options) } : {}), edition });
  const v = inspectEstimateProblem(p);
  if (v.kind !== "closerGuess") return JSON.stringify({ kind: p.kind, edition });
  return JSON.stringify({ kind: p.kind, a: p.a, b: p.b, operator: p.operator,
    ...(edition === 0 ? { guesses: sorted(p.guesses) } : { shown: v.shown }), edition });
}
