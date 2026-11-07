import type { ActivityDefinition, Pair } from "./types";

/**
 * 计算办法类活动：把数凑成整十再算、不算出结果比较两个算式、用加减关系检查。
 * 全部用两位数，落在 100 以内，也都保留「结果有没有变」这一步判断。
 */
export type StrategyProblem =
  | { kind: "compensateAdd"; a: number; b: number; up: number; a2: number; b2: number }
  | { kind: "compensateSub"; a: number; b: number; diff: number; b2: number }
  | { kind: "compareExpressions"; operator: 0 | 1; left: Pair; right: Pair }
  | { kind: "checkBack"; a: number; b: number; sum: number; operator: 0 | 1 };

export type StrategyValidation =
  | { kind: "compensateAdd"; values: readonly number[]; sum: number; a2: number; b2: number }
  | { kind: "compensateSub"; values: readonly number[]; result: number; b2: number; diff: number }
  | {
      kind: "compareExpressions";
      values: readonly number[];
      leftValue: number;
      rightValue: number;
      answer: 0 | 1 | 2;
      difference: number;
    }
  | { kind: "checkBack"; values: readonly number[]; sum: number; check: number; operator: 0 | 1 };

export const STRATEGY_DEFINITIONS: Record<StrategyProblem["kind"], ActivityDefinition> = {
  compensateAdd: {
    skill: "compose", title: "凑整十再算", action: "fill", repeatAction: "circle",
    prompt: "把一个数补成整十，另一个数相应减少。",
    followUp: "两个算式的结果一样吗？为什么？",
    repeatPrompt: "两个算式，圈出结果一样大的那组。",
    repeatFollowUp: "哪个数添了，哪个数就要减掉？",
    objective: "用一个数补整十、另一个数相应减少来把加法变好算",
  },
  compensateSub: {
    skill: "compose", title: "先减整十", action: "fill", repeatAction: "fill",
    prompt: "把减数看成整十，多减的要补回来。",
    followUp: "多减了几？为什么要补回来？",
    repeatPrompt: "填出结果，再说一说多减的还是补回来的。",
    repeatFollowUp: "换成先减整十，结果会变吗？",
    objective: "把减数凑成整十来算减法并解释补偿",
  },
  compareExpressions: {
    skill: "relation", title: "哪边结果大", action: "circle", repeatAction: "fill",
    prompt: "不用算出结果，圈出哪边的结果大。",
    followUp: "你是看哪个数在变？",
    repeatPrompt: "填出两边相差多少。",
    repeatFollowUp: "怎么看出来的？说给伙伴听。",
    objective: "不算出结果，只用一个数增另一个数减来判断大小关系",
  },
  checkBack: {
    skill: "relation", title: "算完检查", action: "fill", repeatAction: "circle",
    prompt: "先算出结果，再用另一个算式检查一遍。",
    followUp: "两处对上了吗？没对上要回到哪一步？",
    repeatPrompt: "两个检查算式，圈出能检查这个结果的那个。",
    repeatFollowUp: "为什么另一个检查不了？",
    objective: "用加减之间的关系检查自己的计算结果",
  },
};

export function isStrategyKind(kind: string): kind is StrategyProblem["kind"] {
  return Object.prototype.hasOwnProperty.call(STRATEGY_DEFINITIONS, kind);
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

export function createStrategyProblem(kind: StrategyProblem["kind"], random: () => number): StrategyProblem {
  if (kind === "compensateAdd") {
    let result: StrategyProblem = { kind, a: 38, b: 27, up: 2, a2: 40, b2: 25 };
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const a = shuffled([27, 28, 29, 37, 38, 39, 47, 48, 49], random)[0];
      const up = 10 - a % 10;
      const b = integer(random, 18, 39);
      const b2 = b - up;
      // 另一个数减掉以后还要能用，不能变成个位数或负数。
      if (b2 < 5) continue;
      result = { kind, a, b, up, a2: a + up, b2 };
      if (validateStrategyProblem(result)) return result;
    }
    throw new Error("暂时无法生成合法的凑整材料");
  }
  if (kind === "compensateSub") {
    let result: StrategyProblem = { kind, a: 62, b: 19, diff: 1, b2: 20 };
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const a = integer(random, 45, 92);
      const b = shuffled([18, 19, 28, 29, 38, 39], random)[0];
      const diff = 10 - b % 10;
      if (a - b < 20) continue;
      result = { kind, a, b, diff, b2: b + diff };
      if (validateStrategyProblem(result)) return result;
    }
    throw new Error("暂时无法生成合法的减整十材料");
  }
  if (kind === "compareExpressions") {
    let result: StrategyProblem = { kind, operator: 0, left: [30, 20], right: [32, 18] };
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const shape = integer(random, 0, 2);
      const shift = integer(random, 1, 5);
      if (shape === 0) {
        // 一个加几、另一个减几，两边一样大。
        const a = integer(random, 20, 60), b = integer(random, 15, 30);
        if (b - shift < 10 || a + shift > 70) continue;
        result = { kind, operator: 0, left: [a, b], right: [a + shift, b - shift] };
      } else if (shape === 1) {
        // 同一个加数，被加数变大的那边结果大。
        const a = integer(random, 20, 60), b = integer(random, 15, 30);
        if (a + shift > 70) continue;
        result = { kind, operator: 0, left: [a, b], right: [a + shift, b] };
      } else {
        // 同一个被减数，减得多的那边结果小。
        const a = integer(random, 60, 92), b = integer(random, 15, 30);
        if (b + shift > 40) continue;
        result = { kind, operator: 1, left: [a, b], right: [a, b + shift] };
      }
      if (validateStrategyProblem(result)) return result;
    }
    throw new Error("暂时无法生成合法的算式比较材料");
  }
  let result: StrategyProblem = { kind, a: 36, b: 27, sum: 63, operator: 0 };
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const operator: 0 | 1 = random() < 0.5 ? 0 : 1;
    if (operator === 0) {
      const a = integer(random, 23, 58);
      const b = integer(random, 14, Math.min(38, 100 - a));
      result = { kind, a, b, sum: a + b, operator };
    } else {
      const a = integer(random, 55, 92);
      const b = integer(random, 14, 38);
      if (a - b < 17) continue;
      result = { kind, a, b, sum: a - b, operator };
    }
    if (validateStrategyProblem(result)) return result;
  }
  throw new Error("暂时无法生成合法的检查材料");
}

/** 所有结果都从材料重算，不使用题面文字。 */
export function inspectStrategyProblem(p: StrategyProblem): StrategyValidation {
  if (p.kind === "compensateAdd") {
    const a2 = p.a + p.up, b2 = p.b - p.up, sum = p.a + p.b;
    return { kind: p.kind, sum, a2, b2, values: [p.a, p.b, p.up, a2, b2, sum, a2 + b2] };
  }
  if (p.kind === "compensateSub") {
    const b2 = p.b + p.diff, result = p.a - p.b;
    return { kind: p.kind, result, b2, diff: p.diff, values: [p.a, p.b, p.diff, b2, result, p.a - b2 + p.diff] };
  }
  if (p.kind === "compareExpressions") {
    const value = (side: Pair) => p.operator === 0 ? side[0] + side[1] : side[0] - side[1];
    const leftValue = value(p.left), rightValue = value(p.right);
    const answer: 0 | 1 | 2 = leftValue > rightValue ? 0 : leftValue < rightValue ? 1 : 2;
    return { kind: p.kind, leftValue, rightValue, answer, difference: Math.abs(leftValue - rightValue),
      values: [p.operator, ...p.left, ...p.right, leftValue, rightValue, answer, Math.abs(leftValue - rightValue)] };
  }
  const sum = p.operator === 0 ? p.a + p.b : p.a - p.b;
  const check = p.operator === 0 ? sum - p.a : sum + p.b;
  return { kind: p.kind, sum, check, operator: p.operator,
    values: [p.a, p.b, sum, check, sum - p.a, sum + p.b, p.a + p.b, p.a - p.b] };
}

export function validateStrategyProblem(p: StrategyProblem): boolean {
  const v = inspectStrategyProblem(p);
  const bounded = v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100);
  if (p.kind === "compensateAdd") return bounded && v.kind === "compensateAdd"
    && p.a >= 27 && p.a <= 49 && p.a % 10 >= 7
    && p.up === 10 - p.a % 10 && p.up >= 1 && p.up <= 3
    && p.a2 === p.a + p.up && p.a2 % 10 === 0
    && p.b >= 18 && p.b <= 39 && p.b2 === p.b - p.up && p.b2 >= 5
    && v.sum === p.a + p.b && v.sum === p.a2 + p.b2 && v.sum <= 99;
  if (p.kind === "compensateSub") return bounded && v.kind === "compensateSub"
    && p.a >= 45 && p.a <= 92 && p.b >= 18 && p.b <= 39
    && [18, 19, 28, 29, 38, 39].includes(p.b)
    && p.diff === 10 - p.b % 10 && p.diff >= 1 && p.diff <= 2
    && p.b2 === p.b + p.diff && p.b2 % 10 === 0
    && v.result === p.a - p.b && v.result >= 20
    && p.a - p.b2 + p.diff === v.result;
  if (p.kind === "compareExpressions") return bounded && v.kind === "compareExpressions"
    && p.left.length === 2 && p.right.length === 2
    && p.left.every((n) => n >= 10 && n <= 92) && p.right.every((n) => n >= 10 && n <= 92)
    && v.answer === (v.leftValue > v.rightValue ? 0 : v.leftValue < v.rightValue ? 1 : 2)
    && (v.answer === 2 ? v.difference === 0 : v.difference >= 1)
    // 必须有「只看的数的变化就能判断」的路径：两边共用一个数，或一增一减。
    && (p.left[0] === p.right[0] || p.left[1] === p.right[1]
      || (p.operator === 0 && (p.left[0] - p.right[0]) === (p.right[1] - p.left[1])));
  return bounded && v.kind === "checkBack"
    && p.a >= 23 && p.a <= 92 && p.b >= 14 && p.b <= 38
    && v.sum === (p.operator === 0 ? p.a + p.b : p.a - p.b)
    && v.sum >= 17 && v.sum <= 100
    && v.check === p.b
    && (p.operator === 0 ? v.sum - p.a === p.b : v.sum + p.b === p.a);
}

/** 算式内部顺序不影响结果；左右位置改变答案，所以保留左右。 */
export function strategySignature(p: StrategyProblem, edition: 0 | 1): string {
  if (p.kind === "compareExpressions")
    return JSON.stringify({ kind: p.kind, operator: p.operator, left: sorted(p.left), right: sorted(p.right), edition });
  return JSON.stringify({ kind: p.kind, a: p.a, b: p.b, operator: p.kind === "checkBack" ? p.operator : undefined, edition });
}
