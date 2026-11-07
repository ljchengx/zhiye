import { MIN_ACTIVITY_DAY_GAP, monthCount, NUMBER_CORE_KINDS, safePlanDay, SCENE_DEFINITIONS, SCENE_KINDS } from "./curriculum";
import { createSpatialProblem, inspectSpatialProblem, isSpatialKind, spatialSignature, validateSpatialProblem, type SpatialProblem } from "./activities-spatial";
import { createQuantityProblem, inspectQuantityProblem, isQuantityKind, quantitySignature, validateQuantityProblem, type QuantityProblem } from "./activities-quantity";
import { createLogicProblem, inspectLogicProblem, isLogicKind, logicSignature, validateLogicProblem, type LogicProblem } from "./activities-logic";
import { createEstimateProblem, estimateSignature, inspectEstimateProblem, isEstimateKind, validateEstimateProblem, type EstimateProblem } from "./activities-estimate";
import { createNumberProblem, inspectNumberProblem, isNumberKind, numberSignature, validateNumberProblem, type NumberProblem } from "./activities-number";
import type {
  Expression, NumberSenseDay, NumberSenseMonthConfig, NumberSensePlan,
  NumberSenseProblem, NumberSenseTask, Pair, PatternRule, SceneKind,
  TaskValidation, Triple, WindowPuzzle, WorksheetExportSelection, WorksheetSide,
} from "./types";

export function createRandom(seed: number) {
  let state = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function expressionValues(expression: Expression): number[] {
  let value = expression.terms[0];
  return [...expression.terms, ...expression.terms.slice(1).map((term, i) => {
    value = expression.operators[i] === "+" ? value + term : value - term;
    return value;
  })];
}
export function evaluateExpression(expression: Expression): number {
  return expressionValues(expression).at(-1)!;
}
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
const integer = (random: () => number, low: number, high: number) => low + Math.floor(random() * (high - low + 1));
function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = integer(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);
const sameCells = (a: readonly number[], b: readonly number[]) => String(sorted(a)) === String(sorted(b));

/** 位置随整扇窗顺时针转动，编号只用于描述九宫格位置。 */
export function rotateWindowPattern(pattern: readonly number[], turn: number): number[] {
  let cells = [...pattern];
  for (let i = 0; i < turn; i += 1)
    cells = cells.map((cell) => (cell % 3) * 3 + 2 - Math.floor(cell / 3));
  return sorted(cells);
}
function asymmetric(pattern: readonly number[]): boolean {
  const reflected = pattern.map((cell) => Math.floor(cell / 3) * 3 + 2 - cell % 3);
  return [1, 2, 3].every((turn) => !sameCells(pattern, rotateWindowPattern(pattern, turn)))
    && [0, 1, 2, 3].every((turn) => !sameCells(pattern, rotateWindowPattern(reflected, turn)));
}
function pricePairs(prices: readonly number[], target: number): Pair[] {
  const pairs: Pair[] = [];
  for (let a = 0; a < prices.length; a += 1)
    for (let b = a + 1; b < prices.length; b += 1)
      if (prices[a] + prices[b] === target) pairs.push([a, b]);
  return pairs;
}

/** 直接根据材料重算封闭问题，不从题面文字推断答案。 */
export function inspectProblem(p: NumberSenseProblem): TaskValidation {
  if (isSpatialKind(p.kind)) return inspectSpatialProblem(p as SpatialProblem);
  if (isQuantityKind(p.kind)) return inspectQuantityProblem(p as QuantityProblem);
  if (isLogicKind(p.kind)) return inspectLogicProblem(p as LogicProblem);
  if (isNumberKind(p.kind)) return inspectNumberProblem(p as NumberProblem);
  if (isEstimateKind(p.kind)) return inspectEstimateProblem(p as EstimateProblem);
  if (p.kind === "market") {
    const sums = p.prices.flatMap((price, a) => p.prices.slice(a + 1).map((other) => price + other));
    const discountedPrices = p.prices.map((price) => price - p.discount);
    return { kind: p.kind, pairs: pricePairs(p.prices, p.budget),
      unaffordable: p.prices.flatMap((price, i) => price > p.budget ? [i] : []),
      discountedPrices, savings: [p.discount + p.discount, p.discount],
      values: [...p.prices, p.budget, p.discount, p.discount + p.discount, ...sums, ...discountedPrices] };
  }
  if (p.kind === "sharing") {
    const move = (p.left - p.right) / 2;
    const each = (p.left + p.right) / 2;
    const eachWithExtra = each + p.extra;
    return { kind: p.kind, move, each, eachWithExtra, addOrRemove: p.left - p.right, totalsAfter: [p.left + p.left, p.right + p.right],
      values: [p.left, p.right, p.extra, p.left + p.right, p.left + p.right + p.extra * 2, move, each, eachWithExtra,
        p.left - p.right, p.left + p.left, p.right + p.right] };
  }
  if (p.kind === "parking") {
    const counts: Pair = [p.occupied[0].length, p.occupied[1].length];
    const empty: Pair = [10 - counts[0], 10 - counts[1]];
    const after: [number, number] = [...counts];
    after[p.moveFrom] -= p.move;
    after[1 - p.moveFrom] += p.move;
    const arrivals: [number, number] = [...counts];
    arrivals[1 - p.moveFrom] += p.move;
    const moreAfter = after[0] === after[1] ? "same" : after[0] > after[1] ? "A" : "B";
    return { kind: p.kind, empty, after, arrivals, total: sum(counts), moreAfter,
      moreAfterArrival: arrivals[0] === arrivals[1] ? "same" : arrivals[0] > arrivals[1] ? "A" : "B",
      values: [...p.occupied.flat(), ...counts, ...empty, p.moveFrom, p.move, ...after, ...arrivals, sum(arrivals), sum(counts)] };
  }
  if (p.kind === "garden") {
    const maximum = Math.max(...p.counts), minimum = Math.min(...p.counts);
    return { kind: p.kind, total: sum(p.counts), most: p.counts.indexOf(maximum),
      least: p.counts.indexOf(minimum), difference: maximum - minimum,
      removed: sum(p.counts) - minimum * 3, remaining: minimum * 3,
      values: [...p.counts, sum(p.counts), maximum - minimum, minimum * 3, sum(p.counts) - minimum * 3] };
  }
  if (p.kind === "route") {
    const lengths: Pair = [p.segments[0] + p.segments[1], p.segments[2] + p.segments[3]];
    return { kind: p.kind, lengths, shorter: lengths[0] < lengths[1] ? 0 : 1,
      difference: Math.abs(lengths[0] - lengths[1]), open: 1 - p.closed,
      values: [...p.segments, sum(p.segments), ...lengths, Math.abs(lengths[0] - lengths[1])] };
  }
  if (p.kind === "windows") {
    const rotated = p.puzzles.map((puzzle) => rotateWindowPattern(puzzle.pattern, puzzle.turn));
    return { kind: p.kind, rotated,
      correctOptions: p.puzzles.map((puzzle, i) => puzzle.options.findIndex((option) => sameCells(option, rotated[i]))),
      values: p.puzzles.flatMap((puzzle) => [...puzzle.pattern, puzzle.turn, ...puzzle.options.flat()]) };
  }
  if (p.kind === "patterns") {
    const terms = p.rules.map((rule) => Array.from({ length: 4 }, (_, i) => rule.start + i * rule.step));
    return { kind: p.kind, fourth: terms.map((row) => row[3]), second: terms.map((row) => row[1]),
      values: [...terms.flat(), ...p.rules.map((rule) => Math.abs(rule.step))] };
  }
  if (p.kind !== "measure") throw new Error(`未知活动：${p.kind}`);
  const actualLengths = p.lengths.map((length) => length * p.unit) as unknown as Triple;
  const maximum = Math.max(...actualLengths), minimum = Math.min(...actualLengths);
  return { kind: p.kind, actualLengths, longest: actualLengths.indexOf(maximum),
    shortest: actualLengths.indexOf(minimum), difference: maximum - minimum,
    values: [...p.lengths, ...p.offsets, p.unit, ...actualLengths,
      ...p.lengths.map((length, i) => (length + p.offsets[i]) * p.unit), maximum - minimum] };
}

export function taskSignature(task: Pick<NumberSenseTask, "problem"> & Partial<Pick<NumberSenseTask, "edition">>): string {
  const p = task.problem;
  if (isSpatialKind(p.kind)) return spatialSignature(p as SpatialProblem, task.edition ?? 0);
  if (isQuantityKind(p.kind)) return quantitySignature(p as QuantityProblem, task.edition ?? 0);
  if (isLogicKind(p.kind)) return logicSignature(p as LogicProblem, task.edition ?? 0);
  if (isNumberKind(p.kind)) return numberSignature(p as NumberProblem, task.edition ?? 0);
  if (isEstimateKind(p.kind)) return estimateSignature(p as EstimateProblem, task.edition ?? 0);
  // 调换商品、题行或选项的顺序不能冒充内容换新。
  if (p.kind === "market") return JSON.stringify({ ...p, prices: sorted(p.prices) });
  if (p.kind === "sharing") return JSON.stringify({ kind: p.kind, left: p.left, right: p.right });
  if (p.kind === "route") return JSON.stringify({ kind: p.kind, segments: p.segments });
  // 只改变停车位置不算换题，数量和挪车条件必须改变。
  if (p.kind === "parking") return JSON.stringify({ kind: p.kind,
    counts: p.occupied.map((row) => row.length), moveFrom: p.moveFrom, move: p.move });
  if (p.kind === "patterns") return JSON.stringify({ ...p, rules: [...p.rules].sort((a, b) => a.start - b.start || a.step - b.step) });
  if (p.kind === "windows") return JSON.stringify({ kind: p.kind,
    puzzles: p.puzzles.map((puzzle) => ({ pattern: sorted(puzzle.pattern), turn: puzzle.turn }))
      .sort((a, b) => String(a.pattern).localeCompare(String(b.pattern)) || a.turn - b.turn) });
  return JSON.stringify(p);
}
export function validateTask(task: NumberSenseTask): boolean {
  const p = task.problem, expected = inspectProblem(p);
  if (!expected.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)
    || JSON.stringify(expected) !== JSON.stringify(task.validation)) return false;
  if (isSpatialKind(p.kind)) return validateSpatialProblem(p as SpatialProblem);
  if (isQuantityKind(p.kind)) return validateQuantityProblem(p as QuantityProblem);
  if (isLogicKind(p.kind)) return validateLogicProblem(p as LogicProblem);
  if (isNumberKind(p.kind)) return validateNumberProblem(p as NumberProblem);
  if (isEstimateKind(p.kind)) return validateEstimateProblem(p as EstimateProblem);
  if (p.kind === "market") return p.prices.length === 6 && new Set(p.prices).size === 6
    && p.prices.every((price) => price >= 8 && price <= 50) && p.budget >= 28 && p.budget <= 48
    && p.discount >= 1 && p.discount <= 5 && expected.kind === "market"
    && expected.pairs.length >= 2 && expected.unaffordable.length >= 1;
  if (p.kind === "sharing") return p.left >= 12 && p.left <= 24 && p.right >= 6 && p.right <= 20
    && p.left > p.right && (p.left - p.right) % 2 === 0 && [2, 4, 6, 8].includes(p.extra);
  if (p.kind === "parking") return p.occupied.length === 2
    && p.occupied.every((row) => row.length >= 4 && row.length <= 9
      && new Set(row).size === row.length && row.every((slot) => slot >= 0 && slot < 10))
    && [0, 1].includes(p.moveFrom) && p.move >= 1 && p.move <= 3
    && p.occupied[p.moveFrom].length >= p.move
    && p.occupied[1 - p.moveFrom].length + p.move <= 10;
  if (p.kind === "garden") return new Set(p.counts).size === 3 && p.counts.every((n) => n >= 4 && n <= 10) && sum(p.counts) <= 27;
  if (p.kind === "route") return p.segments.every((n) => n >= 6 && n <= 40) && sum(p.segments) <= 100
    && p.segments[0] + p.segments[1] !== p.segments[2] + p.segments[3] && [0, 1].includes(p.closed);
  if (p.kind === "windows") return p.puzzles.length === 3 && p.puzzles.every((puzzle) =>
    [1, 2, 3].includes(puzzle.turn) && asymmetric(puzzle.pattern)
    && new Set(puzzle.pattern).size === puzzle.pattern.length
    && puzzle.pattern.every((cell) => cell >= 0 && cell <= 8)
    && puzzle.options.length === 3 && new Set(puzzle.options.map((option) => String(sorted(option)))).size === 3
    && puzzle.options.every((option) => option.length === puzzle.pattern.length && new Set(option).size === option.length
      && option.every((cell) => cell >= 0 && cell <= 8))
    && puzzle.options.filter((option) => sameCells(option, rotateWindowPattern(puzzle.pattern, puzzle.turn))).length === 1);
  if (p.kind === "patterns") return p.rules.length === 3 && p.rules.some((r) => r.step > 0) && p.rules.some((r) => r.step < 0)
    && new Set(p.rules.map((r) => `${r.start}:${r.step}`)).size === 3
    && p.rules.every((r) => Number.isInteger(r.step) && Math.abs(r.step) >= 1 && Math.abs(r.step) <= 3
      && Array.from({ length: 4 }, (_, i) => r.start + i * r.step).every((n) => n >= 1 && n <= 12));
  if (p.kind !== "measure") return false;
  return new Set(p.lengths).size === 3 && p.lengths.every((n) => n >= 3 && n <= 12)
    && p.offsets.every((n) => n >= 0 && n <= 3) && p.offsets.some((n) => n > 0) && p.unit === 1;
}

function windowPuzzle(turn: 1 | 2 | 3, random: () => number): WindowPuzzle {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const pattern = sorted(shuffle(Array.from({ length: 9 }, (_, i) => i), random).slice(0, integer(random, 3, 5)));
    if (!asymmetric(pattern)) continue;
    const distractors = shuffle([0, 1, 2, 3].filter((n) => n !== turn), random).slice(0, 2);
    return { pattern, turn, options: shuffle([turn, ...distractors], random).map((n) => rotateWindowPattern(pattern, n)) };
  }
  throw new Error("暂时无法生成贴纸图案，请重试");
}
function candidate(kind: SceneKind, random: () => number, edition: 0 | 1): NumberSenseTask {
  let problem: NumberSenseProblem;
  if (isSpatialKind(kind)) problem = createSpatialProblem(kind, random);
  else if (isQuantityKind(kind)) problem = createQuantityProblem(kind, random);
  else if (isLogicKind(kind)) problem = createLogicProblem(kind, random);
  else if (isNumberKind(kind)) problem = createNumberProblem(kind, random);
  else if (isEstimateKind(kind)) problem = createEstimateProblem(kind, random);
  else if (kind === "market") {
    const budget = integer(random, 28, 48);
    const lower = shuffle(Array.from({ length: Math.floor((budget - 1) / 2) - 7 }, (_, i) => i + 8), random);
    const first = lower[0], second = lower[1];
    const prices = [first, budget - first, second, budget - second, integer(random, budget + 1, 50)];
    const remaining = Array.from({ length: 43 }, (_, i) => i + 8).filter((price) => !prices.includes(price));
    prices.push(remaining[integer(random, 0, remaining.length - 1)]);
    problem = { kind, prices: shuffle(prices, random) as unknown as Extract<NumberSenseProblem, { kind: "market" }>["prices"], budget, discount: integer(random, 1, 5) };
  } else if (kind === "sharing") {
    const left = integer(random, 12, 24);
    const choices = Array.from({ length: 15 }, (_, i) => i + 6).filter((n) => n < left && (left - n) % 2 === 0);
    problem = { kind, left, right: choices[integer(random, 0, choices.length - 1)], extra: integer(random, 1, 4) * 2 };
  } else if (kind === "parking") {
    const slots = Array.from({ length: 10 }, (_, i) => i);
    const occupied = [
      sorted(shuffle(slots, random).slice(0, integer(random, 4, 9))),
      sorted(shuffle(slots, random).slice(0, integer(random, 4, 9))),
    ] as const;
    const moveFrom = integer(random, 0, 1) as 0 | 1;
    const move = integer(random, 1, Math.min(3, 10 - occupied[1 - moveFrom].length));
    problem = { kind, occupied, moveFrom, move };
  } else if (kind === "garden") {
    problem = { kind, counts: shuffle([4, 5, 6, 7, 8, 9, 10], random).slice(0, 3) as unknown as Triple };
  } else if (kind === "route") {
    problem = { kind, segments: [integer(random, 6, 40), integer(random, 6, 40), integer(random, 6, 40), integer(random, 6, 40)], closed: integer(random, 0, 1) };
  } else if (kind === "windows") {
    problem = { kind, puzzles: shuffle([1, 2, 3] as const, random).map((turn) => windowPuzzle(turn, random)) };
  } else if (kind === "patterns") {
    const rules: PatternRule[] = [];
    const directions = shuffle([1, -1, random() < 0.5 ? 1 : -1], random);
    for (const direction of directions) {
      let rule: PatternRule;
      do {
        const step = integer(random, 1, 3) * direction;
        const start = step > 0 ? integer(random, 1, 12 - step * 3) : integer(random, 1 - step * 3, 12);
        rule = { start, step };
      } while (rules.some((other) => other.start === rule.start && other.step === rule.step));
      rules.push(rule);
    }
    problem = { kind, rules };
  } else if (kind === "measure") {
    const offsets: [number, number, number] = [integer(random, 0, 3), integer(random, 0, 3), integer(random, 0, 3)];
    if (!offsets.some((n) => n > 0)) offsets[integer(random, 0, 2)] = integer(random, 1, 3);
    problem = { kind, lengths: shuffle(Array.from({ length: 10 }, (_, i) => i + 3), random).slice(0, 3) as unknown as Triple,
      offsets, unit: 1 };
  } else throw new Error(`未知活动：${kind}`);
  const { title, prompt, followUp, repeatPrompt, repeatFollowUp, skill } = SCENE_DEFINITIONS[kind];
  return { id: "", edition, title, prompt: edition ? repeatPrompt : prompt,
    followUp: edition ? repeatFollowUp : followUp, skill, template: kind, problem, validation: inspectProblem(problem) };
}
function generateActivity(kind: SceneKind, day: number, side: WorksheetSide, seed: number, used: Set<string>, edition: 0 | 1): NumberSenseTask {
  const random = createRandom(seed ^ Math.imul(day, 104729) ^ (side === "front" ? 0x37a1 : 0x521f));
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const task = candidate(kind, random, edition), signature = taskSignature(task);
    if (!validateTask(task) || used.has(signature)) continue;
    used.add(signature);
    return { ...task, id: `d${day}-${side}-${seed}-${attempt}` };
  }
  throw new Error("本月暂时没有新的场景材料，请换个种子重试");
}
function buildDay(day: number, seed: number, kinds: readonly [SceneKind, SceneKind], used: Set<string>, editions: readonly [0 | 1, 0 | 1]): NumberSenseDay {
  const front = generateActivity(kinds[0], day, "front", seed, used, editions[0]);
  const back = generateActivity(kinds[1], day, "back", seed, used, editions[1]);
  return { id: `day-${day}-${seed}`, day, title: `${front.title} · ${back.title}`,
    objective: `${SCENE_DEFINITIONS[kinds[0]].objective}；${SCENE_DEFINITIONS[kinds[1]].objective}。`,
    skills: [...new Set([front.skill, back.skill])],
    pages: [{ side: "front", activity: front }, { side: "back", activity: back }] };
}

/** 先让所有活动各见一次，再换任务重访；两轮都是混合内容，不是难度阶段。 */
function sceneSchedule(seed: number, count: number): [SceneKind, SceneKind][] {
  if (SCENE_KINDS.length % 2 !== 0) throw new Error("活动数量要成双才能两两配对");
  const random = createRandom(seed ^ 0x4612);
  const hasNumber = (a: SceneKind, b: SceneKind) => NUMBER_CORE_KINDS.has(a) || NUMBER_CORE_KINDS.has(b);
  const compatible = (a: SceneKind, b: SceneKind, repeat = false) =>
    SCENE_DEFINITIONS[a].skill !== SCENE_DEFINITIONS[b].skill
    && SCENE_DEFINITIONS[a][repeat ? "repeatAction" : "action"] !== SCENE_DEFINITIONS[b][repeat ? "repeatAction" : "action"]
    && hasNumber(a, b);
  // 重新排列整轮，避免贪心配对在最后留下两个动作相同的活动。
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const first: SceneKind[] = [], remaining = shuffle(SCENE_KINDS, random);
    while (remaining.length) {
      const a = remaining.pop()!;
      const partner = remaining.findIndex((b) => compatible(a, b));
      if (partner < 0) break;
      first.push(a, remaining.splice(partner, 1)[0]);
    }
    if (first.length !== SCENE_KINDS.length) continue;
    const pages = [...first], repeats = shuffle(SCENE_KINDS, random);
    while (pages.length < count * 2) {
      const currentDay = Math.floor(pages.length / 2);
      const next = repeats.findIndex((kind) =>
        currentDay - Math.floor(first.indexOf(kind) / 2) >= MIN_ACTIVITY_DAY_GAP
        && (pages.length % 2 === 0 || compatible(pages.at(-1)!, kind, true)));
      if (next < 0) break;
      pages.push(repeats.splice(next, 1)[0]);
    }
    if (pages.length === count * 2)
      return Array.from({ length: count }, (_, i) => [pages[i * 2], pages[i * 2 + 1]]);
  }
  throw new Error("本月活动编排未完成，请重试");
}
export function generateWorksheetPlan(seed = 1, config: NumberSenseMonthConfig = { count: 30 }, excluded: readonly string[] = []): NumberSensePlan {
  const count = monthCount(config), used = new Set(excluded);
  const seen = new Set<SceneKind>();
  const days = sceneSchedule(seed, count).map((kinds, i) => {
    const editions = kinds.map((kind) => {
      const edition = seen.has(kind) ? 1 : 0;
      seen.add(kind);
      return edition;
    }) as [0 | 1, 0 | 1];
    return buildDay(i + 1, seed, kinds, used, editions);
  });
  return { seed, config, days, totalDays: count };
}
export function generateDailyWorksheet(day: number, seed = 1, config: NumberSenseMonthConfig = { count: 30 }): NumberSenseDay {
  const plan = generateWorksheetPlan(seed, config);
  return plan.days[safePlanDay(day, plan.days.length) - 1];
}
export function regenerateWorksheetDay(plan: NumberSensePlan, input: number, seed: number): NumberSenseDay {
  const day = safePlanDay(input, plan.days.length), original = plan.days[day - 1];
  const used = new Set(plan.days.flatMap((item) => item.pages.map((page) => taskSignature(page.activity))));
  return buildDay(day, seed, [original.pages[0].activity.problem.kind, original.pages[1].activity.problem.kind], used,
    [original.pages[0].activity.edition, original.pages[1].activity.edition]);
}
export function getExportDays(plan: NumberSensePlan, selection: WorksheetExportSelection): readonly NumberSenseDay[] {
  if (selection.kind === "day") return [plan.days[safePlanDay(selection.day, plan.days.length) - 1]];
  if (selection.kind === "range") {
    const from = safePlanDay(Math.min(selection.from, selection.to), plan.days.length);
    const to = safePlanDay(Math.max(selection.from, selection.to), plan.days.length);
    return plan.days.filter((day) => day.day >= from && day.day <= to);
  }
  return plan.days;
}
