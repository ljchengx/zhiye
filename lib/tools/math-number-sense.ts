import type { WorksheetIconKey, WorksheetSection, WorksheetTheme } from "./math-worksheet";

export type NumberSenseBlockKey =
  | "balance"
  | "symbol"
  | "friendly-calc"
  | "estimate"
  | "story"
  | "kenken";

export interface NumberSenseDayBlueprint {
  month: 1 | 2;
  monthDay: number;
  title: string;
  objective: string;
  parentTip: string;
  phase: number;
  phaseTitle: string;
  phaseSummary: string;
  numberMax: number;
  blocks: Readonly<Partial<Record<NumberSenseBlockKey, number>> & { kenken?: 0 | 1 }>;
  theme: WorksheetTheme;
}

export interface BalanceEquationQuestion {
  id: string;
  type: "balance-equation";
  section: "balance";
  number: number;
  expression: string;
  answer: number;
  parentAsk: string;
}

export interface SymbolLine {
  text: string;
  isAnswerLine?: boolean;
}

export interface SymbolSystemQuestion {
  id: string;
  type: "symbol-system";
  section: "symbol";
  number: number;
  lines: readonly SymbolLine[];
  answers: readonly { label: string; value: number }[];
  icons: readonly WorksheetIconKey[];
}

export interface FriendlyCalcQuestion {
  id: string;
  type: "friendly-calc";
  section: "friendly-calc";
  number: number;
  expression: string;
  hint: string;
  answer: number;
  parentAsk: string;
}

export interface EstimateJudgeQuestion {
  id: string;
  type: "estimate-judge";
  section: "estimate";
  number: number;
  statement: string;
  isCorrect: boolean;
  reason: string;
  parentAsk: string;
}

export interface SenseStoryQuestion {
  id: string;
  type: "sense-story";
  section: "story";
  number: number;
  icon: WorksheetIconKey;
  prompt: string;
  parentAsk: string;
  idea: string;
}

export interface KenkenCell {
  value?: number;
  cageId?: number;
  cageLabel?: string;
}

export interface KenkenQuestion {
  id: string;
  type: "kenken";
  section: "kenken";
  number: number;
  size: 4;
  cells: readonly (readonly KenkenCell[])[];
  solution: readonly (readonly number[])[];
  title: string;
}

export type NumberSenseQuestion =
  | BalanceEquationQuestion
  | SymbolSystemQuestion
  | FriendlyCalcQuestion
  | EstimateJudgeQuestion
  | SenseStoryQuestion
  | KenkenQuestion;

export const NUMBER_SENSE_PARENT_USAGE =
  "每天选 3～4 题深聊即可，不必整页做完；先让孩子说思路，再核对答案。";

/** 已验算的 4×4 聪明格（数字 1–4，行列不重复） */
export const KENKEN_4X4_BANK: readonly {
  id: string;
  cages: readonly { cells: readonly [number, number][]; label: string }[];
  solution: readonly (readonly number[])[];
}[] = [
  {
    id: "kk-a",
    cages: [
      { cells: [[0, 0], [0, 1]], label: "5+" },
      { cells: [[0, 2], [0, 3]], label: "3" },
      { cells: [[1, 0], [1, 1]], label: "5+" },
      { cells: [[2, 2], [2, 3], [3, 2], [3, 3]], label: "6+" },
    ],
    solution: [
      [2, 3, 1, 4],
      [1, 4, 2, 3],
      [4, 1, 3, 2],
      [3, 2, 4, 1],
    ],
  },
  {
    id: "kk-b",
    cages: [
      { cells: [[0, 0], [1, 0]], label: "3+" },
      { cells: [[0, 1], [0, 2]], label: "6+" },
      { cells: [[1, 1], [1, 2]], label: "4×" },
      { cells: [[2, 0], [2, 1], [3, 0], [3, 1]], label: "8+" },
    ],
    solution: [
      [1, 2, 3, 4],
      [2, 4, 1, 3],
      [3, 1, 4, 2],
      [4, 3, 2, 1],
    ],
  },
  {
    id: "kk-c",
    cages: [
      { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], label: "8+" },
      { cells: [[0, 2], [0, 3]], label: "7+" },
      { cells: [[2, 2], [3, 2]], label: "3+" },
      { cells: [[2, 3], [3, 3]], label: "3+" },
    ],
    solution: [
      [3, 1, 4, 2],
      [4, 2, 1, 3],
      [1, 3, 2, 4],
      [2, 4, 3, 1],
    ],
  },
  {
    id: "kk-d",
    cages: [
      { cells: [[0, 0], [1, 0]], label: "4×" },
      { cells: [[0, 1], [1, 1]], label: "5+" },
      { cells: [[0, 2], [0, 3], [1, 2], [1, 3]], label: "10+" },
      { cells: [[2, 0], [2, 1], [3, 0], [3, 1]], label: "8+" },
    ],
    solution: [
      [1, 4, 2, 3],
      [2, 3, 4, 1],
      [3, 2, 1, 4],
      [4, 1, 3, 2],
    ],
  },
];

function kenkenFromBank(bankIndex: number, id: string): KenkenQuestion {
  const bank = KENKEN_4X4_BANK[bankIndex % KENKEN_4X4_BANK.length];
  const cells: KenkenCell[][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ({})));
  bank.cages.forEach((cage, cageId) => {
    cage.cells.forEach(([row, col], index) => {
      cells[row][col] = {
        cageId,
        cageLabel: index === 0 ? cage.label : undefined,
      };
    });
  });
  return {
    id,
    type: "kenken",
    section: "kenken",
    number: 0,
    size: 4,
    cells,
    solution: bank.solution,
    title: "入门聪明格（4×4，填 1～4）",
  };
}

const BALANCE_POOL: readonly { expression: string; answer: number; parentAsk: string }[] = [
  { expression: "8 + 7 = □ + 6", answer: 9, parentAsk: "左边一共多少？要让两边一样，右边框里是几？" },
  { expression: "4 × 4 = 19 - □", answer: 3, parentAsk: "左边是几？19 减几才等于它？" },
  { expression: "26 + 15 = □ + 20", answer: 21, parentAsk: "先算左边，再想想框里填几两边才一样。" },
  { expression: "32 - 7 = 5 × □", answer: 5, parentAsk: "左边剩下多少？5 个一组能分几组？" },
  { expression: "5 × 5 = 30 - □", answer: 5, parentAsk: "两边要一样，30 减几等于 25？" },
  { expression: "9 + 6 = □ + 7", answer: 8, parentAsk: "左边是 15，右边也要 15，框里是几？" },
  { expression: "3 × 5 = 22 - □", answer: 7, parentAsk: "左边 15，22 减几得 15？" },
  { expression: "41 - 14 = □ + 10", answer: 17, parentAsk: "先算左边，再凑右边两个数。" },
];

const FRIENDLY_POOL: readonly { expression: string; hint: string; answer: number; parentAsk: string }[] = [
  { expression: "28 + 17 + 12", hint: "先算 28 + 12", answer: 57, parentAsk: "不要从左到右硬算，先凑哪两个更整？" },
  { expression: "45 - 18", hint: "先减 20，再加 2", answer: 27, parentAsk: "把 18 看成 20，算完再调回来。" },
  { expression: "19 + 36", hint: "把 19 看成 20 - 1", answer: 55, parentAsk: "先当 20 加，再减 1。" },
  { expression: "73 - 24 - 6", hint: "先算 24 + 6", answer: 43, parentAsk: "两个减数先合在一起更好算。" },
  { expression: "33 + 19 + 7", hint: "先算 33 + 7", answer: 59, parentAsk: "哪两个先加是整十？" },
  { expression: "62 - 25 - 5", hint: "先算 25 + 5", answer: 32, parentAsk: "连续减法，先想一共减了多少。" },
];

const ESTIMATE_POOL: readonly { statement: string; isCorrect: boolean; reason: string; parentAsk: string }[] = [
  { statement: "31 + 29 = 52", isCorrect: false, reason: "三十加三十接近 60", parentAsk: "不用算准，像不像五十多？圈出对或错。" },
  { statement: "7 × 6 = 48", isCorrect: false, reason: "7×6=42", parentAsk: "背口诀或估一估，结果在四十左右吗？" },
  { statement: "64 - 27 = 45", isCorrect: false, reason: "六十多减二十多是三十多", parentAsk: "结果应该是三十多还是四十多？" },
  { statement: "5 × 4 = 23", isCorrect: false, reason: "5×4=20", parentAsk: "五个四大概是多少？" },
  { statement: "28 + 33 = 50", isCorrect: false, reason: "二十多加三十多至少五十多", parentAsk: "两个三十左右的数相加，会是 50 吗？" },
  { statement: "27 + 34 = 41", isCorrect: false, reason: "二十多加三十多最少五十多", parentAsk: "只比 40 大一点，合理吗？" },
];

const SENSE_STORY_POOL: readonly Omit<SenseStoryQuestion, "id" | "number">[] = [
  {
    type: "sense-story",
    section: "story",
    icon: "cookie",
    prompt: "一盒有 5 块巧克力，买 4 盒，分给小朋友 12 块，还剩几块？",
    parentAsk: "先画 4 盒，再说先算一共多少，再算剩下。",
    idea: "5×4−12=8（块）",
  },
  {
    type: "sense-story",
    section: "story",
    icon: "book",
    prompt: "书架上有 27 本书，拿走 8 本，又放上 16 本，现在有多少本？",
    parentAsk: "按顺序说：先少后多，中间结果是多少？",
    idea: "27−8+16=35（本）",
  },
  {
    type: "sense-story",
    section: "story",
    icon: "apple",
    prompt: "小朋友先买了 6 个苹果，又买了 5 个，吃掉 4 个，还剩几个？",
    parentAsk: "两步变化，让孩子分两段讲清楚。",
    idea: "6+5−4=7（个）",
  },
  {
    type: "sense-story",
    section: "story",
    icon: "balloon",
    prompt: "每个小朋友分 3 个气球，4 个小朋友一共几个？如果破了 2 个呢？",
    parentAsk: "先想相同加数，再想剩下。",
    idea: "3×4=12；12−2=10",
  },
];

const DAY_ONE_FIXED: readonly NumberSenseQuestion[] = [
  { id: "d1-b1", type: "balance-equation", section: "balance", number: 0, expression: "8 + 7 = □ + 6", answer: 9, parentAsk: "左边一共多少？要让两边一样，框里是几？" },
  { id: "d1-b2", type: "balance-equation", section: "balance", number: 0, expression: "4 × 4 = 19 - □", answer: 3, parentAsk: "左边是 16，19 减几等于 16？" },
  {
    id: "d1-s1",
    type: "symbol-system",
    section: "symbol",
    number: 0,
    lines: [{ text: "🍎 + 🍎 = 8" }, { text: "🍎 + 🐻 = 11" }, { text: "🍎 =（  ）　🐻 =（  ）", isAnswerLine: true }],
    answers: [{ label: "🍎", value: 4 }, { label: "🐻", value: 7 }],
    icons: ["apple", "heart"],
  },
  {
    id: "d1-e1",
    type: "estimate-judge",
    section: "estimate",
    number: 0,
    statement: "31 + 29 = 52",
    isCorrect: false,
    reason: "三十加三十接近 60",
    parentAsk: "不用算准，圈出对或错，并说说像不像。",
  },
];

/** 第一月：每个符号数值 ≤ 10 */
const SYMBOL_POOL_EASY: readonly Omit<SymbolSystemQuestion, "id" | "number">[] = [
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "🍎 + 🍎 = 8" }, { text: "🍎 + 🐻 = 11" }, { text: "🍎 =（  ）　🐻 =（  ）", isAnswerLine: true }],
    answers: [
      { label: "🍎", value: 4 },
      { label: "🐻", value: 7 },
    ],
    icons: ["apple", "heart"],
  },
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "⭐ × 2 = 8" }, { text: "⭐ + 🌷 = 9" }, { text: "⭐ =（  ）　🌷 =（  ）", isAnswerLine: true }],
    answers: [
      { label: "⭐", value: 4 },
      { label: "🌷", value: 5 },
    ],
    icons: ["star", "flower"],
  },
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "🍌 − 2 = 6" }, { text: "🍌 + ⭐ = 10" }, { text: "🍌 =（  ）　⭐ =（  ）", isAnswerLine: true }],
    answers: [
      { label: "🍌", value: 8 },
      { label: "⭐", value: 2 },
    ],
    icons: ["pineapple", "star"],
  },
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "🍊 + 🍊 + 🍊 = 9" }, { text: "🍊 + 🐰 = 12" }, { text: "🍊 =？　🐰 =？", isAnswerLine: true }],
    answers: [
      { label: "🍊", value: 3 },
      { label: "🐰", value: 9 },
    ],
    icons: ["apple", "ball"],
  },
];

const SYMBOL_POOL: readonly Omit<SymbolSystemQuestion, "id" | "number">[] = [
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "🍓 + 🍓 = 14" }, { text: "🍓 + 🐻 = 20" }, { text: "🍓 =（  ）　🐻 =（  ）", isAnswerLine: true }],
    answers: [
      { label: "🍓", value: 7 },
      { label: "🐻", value: 13 },
    ],
    icons: ["apple", "heart"],
  },
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "⭐ × 3 = 12" }, { text: "⭐ + 🌷 = 11" }, { text: "⭐ =（  ）　🌷 =（  ）", isAnswerLine: true }],
    answers: [
      { label: "⭐", value: 4 },
      { label: "🌷", value: 7 },
    ],
    icons: ["star", "flower"],
  },
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "🥝 − 6 = 9" }, { text: "🥝 × 2 = （  ）", isAnswerLine: true }],
    answers: [{ label: "🥝", value: 15 }, { label: "🥝×2", value: 30 }],
    icons: ["pineapple"],
  },
  {
    type: "symbol-system",
    section: "symbol",
    lines: [{ text: "🍊 + 🍊 + 🍊 = 15" }, { text: "🍊 + 🐰 = 18" }, { text: "🍊 =？　🐰 =？", isAnswerLine: true }],
    answers: [
      { label: "🍊", value: 5 },
      { label: "🐰", value: 13 },
    ],
    icons: ["apple", "ball"],
  },
];

function createSeededRandom(seed: number): () => number {
  let state = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % 2147483647 : 1;
  if (state === 0) state = 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pickPool<T>(pool: readonly T[], count: number, random: () => number, startOffset: number): T[] {
  const indices = pool.map((_, index) => index);
  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [indices[index], indices[swap]] = [indices[swap], indices[index]];
  }
  return Array.from({ length: count }, (_, index) => pool[indices[(startOffset + index) % indices.length]]);
}

function phaseMonthOne(monthDay: number): Pick<NumberSenseDayBlueprint, "phase" | "phaseTitle" | "phaseSummary" | "numberMax"> {
  if (monthDay <= 7) return { phase: 1, phaseTitle: "10 与等号", phaseSummary: "天平相等、相同图案代表同一个数。", numberMax: 20 };
  if (monthDay <= 14) return { phase: 2, phaseTitle: "凑整与估算", phaseSummary: "先凑整十再算，用估算判断是否合理。", numberMax: 50 };
  if (monthDay <= 22) return { phase: 3, phaseTitle: "50～100 迁移", phaseSummary: "把等号、凑整和估算用到更大的数。", numberMax: 100 };
  return { phase: 4, phaseTitle: "情境与综合", phaseSummary: "两步应用与综合小测。", numberMax: 100 };
}

function phaseMonthTwo(monthDay: number): Pick<NumberSenseDayBlueprint, "phase" | "phaseTitle" | "phaseSummary" | "numberMax"> {
  if (monthDay <= 10) return { phase: 5, phaseTitle: "100 以内衔接", phaseSummary: "继续用天平、代换和凑整说清数量关系。", numberMax: 100 };
  if (monthDay <= 20) return { phase: 6, phaseTitle: "情境与代换", phaseSummary: "两步情境思考，相同图案代表同一个数。", numberMax: 100 };
  return { phase: 7, phaseTitle: "综合小测", phaseSummary: "估算、情境与聪明格综合回顾。", numberMax: 100 };
}

function defaultBlocks(month: 1 | 2, monthDay: number): NumberSenseDayBlueprint["blocks"] {
  const kenken = monthDay % 7 === 0 ? 1 : 0;
  if (month === 1) {
    if (monthDay <= 7) return { balance: 2, symbol: 1, estimate: 1, kenken };
    if (monthDay <= 14) return { balance: 1, symbol: 1, "friendly-calc": 2, estimate: 1, kenken };
    if (monthDay <= 22) return { balance: 1, "friendly-calc": 2, estimate: 1, story: 1, kenken };
    return { balance: 1, "friendly-calc": 1, estimate: 1, story: 2, kenken };
  }
  if (monthDay <= 10) return { balance: 2, symbol: 1, estimate: 1, "friendly-calc": 1, kenken };
  if (monthDay <= 20) return { balance: 1, symbol: 1, "friendly-calc": 2, estimate: 1, story: 1, kenken };
  return { balance: 1, "friendly-calc": 1, estimate: 1, story: 2, kenken };
}

function dayTitle(month: 1 | 2, monthDay: number, phaseTitle: string): string {
  return month === 1 ? `第一月 · ${phaseTitle} · 第 ${monthDay} 天` : `第二月 · ${phaseTitle} · 第 ${monthDay} 天`;
}

export function getNumberSenseDayBlueprint(month: 1 | 2, monthDay: number): NumberSenseDayBlueprint {
  const safeDay = Math.max(1, Math.min(30, Math.trunc(monthDay)));
  const phase = month === 1 ? phaseMonthOne(safeDay) : phaseMonthTwo(safeDay);
  const tips = [
    "先问：左边算是多少？要让两边一样，框里可能是几？",
    "相同图案是同一个数，先找最好算的那一行。",
    "不用硬算，说说先凑哪两个数更整？",
    "不用算准，判断像不像对，再说理由。",
    "竖式：个位对个位，十位对十位。",
  ];
  return {
    month,
    monthDay: safeDay,
    title: dayTitle(month, safeDay, phase.phaseTitle),
    objective: phase.phaseSummary,
    parentTip: tips[(safeDay + month) % tips.length],
    blocks: defaultBlocks(month, safeDay),
    theme: "mixed",
    ...phase,
  };
}

export const NUMBER_SENSE_MONTH_ONE_BLUEPRINTS: readonly NumberSenseDayBlueprint[] = Array.from({ length: 30 }, (_, index) =>
  getNumberSenseDayBlueprint(1, index + 1),
);

export const NUMBER_SENSE_MONTH_TWO_BLUEPRINTS: readonly NumberSenseDayBlueprint[] = Array.from({ length: 30 }, (_, index) =>
  getNumberSenseDayBlueprint(2, index + 1),
);

export function buildNumberSenseQuestions(
  blueprint: NumberSenseDayBlueprint,
  seed: number,
  idPrefix: string,
): NumberSenseQuestion[] {
  if (blueprint.month === 1 && blueprint.monthDay === 1) {
    return DAY_ONE_FIXED.map((question, index) => ({ ...question, id: `${idPrefix}-fixed-${index}` }));
  }
  const random = createSeededRandom(seed);
  const questions: NumberSenseQuestion[] = [];
  const blocks = blueprint.blocks;

  if (blocks.balance) {
    pickPool(BALANCE_POOL, blocks.balance, random, blueprint.monthDay).forEach((item, index) => {
      questions.push({
        id: `${idPrefix}-balance-${index}`,
        type: "balance-equation",
        section: "balance",
        number: 0,
        expression: item.expression,
        answer: item.answer,
        parentAsk: item.parentAsk,
      });
    });
  }
  if (blocks.symbol) {
    const symbolPool = blueprint.numberMax <= 20 ? SYMBOL_POOL_EASY : SYMBOL_POOL;
    pickPool(symbolPool, blocks.symbol, random, blueprint.monthDay + 3).forEach((item, index) => {
      questions.push({ ...item, id: `${idPrefix}-symbol-${index}`, number: 0 });
    });
  }
  if (blocks["friendly-calc"]) {
    pickPool(FRIENDLY_POOL, blocks["friendly-calc"], random, blueprint.monthDay + 5).forEach((item, index) => {
      questions.push({
        id: `${idPrefix}-friendly-${index}`,
        type: "friendly-calc",
        section: "friendly-calc",
        number: 0,
        expression: item.expression,
        hint: item.hint,
        answer: item.answer,
        parentAsk: item.parentAsk,
      });
    });
  }
  if (blocks.estimate) {
    pickPool(ESTIMATE_POOL, blocks.estimate, random, blueprint.monthDay + 7).forEach((item, index) => {
      questions.push({
        id: `${idPrefix}-estimate-${index}`,
        type: "estimate-judge",
        section: "estimate",
        number: 0,
        statement: item.statement,
        isCorrect: item.isCorrect,
        reason: item.reason,
        parentAsk: item.parentAsk,
      });
    });
  }
  if (blocks.story) {
    pickPool(SENSE_STORY_POOL, blocks.story, random, blueprint.monthDay + 11).forEach((item, index) => {
      questions.push({ ...item, id: `${idPrefix}-story-${index}`, number: 0 });
    });
  }
  if (blocks.kenken) {
    questions.push(kenkenFromBank(blueprint.monthDay + blueprint.month, `${idPrefix}-kenken`));
  }
  return questions;
}

export function numberSenseSectionsFromQuestions(
  blueprint: NumberSenseDayBlueprint,
  senseQuestions: readonly NumberSenseQuestion[],
): WorksheetSection[] {
  const bySection = (type: NumberSenseQuestion["section"]) => senseQuestions.filter((question) => question.section === type);
  const sections: WorksheetSection[] = [];
  const order: NumberSenseBlockKey[] = ["balance", "symbol", "friendly-calc", "estimate", "story", "kenken"];
  const titles: Record<string, string> = {
    balance: "天平等量（两边一样重）",
    symbol: "图形代换（相同图案同一个数）",
    "friendly-calc": "凑整巧算（先说方法，不用硬算）",
    estimate: "估算小侦探（不用算准，圈对错）",
    story: "情境思考（分步说思路）",
    kenken: "聪明格（入门 4×4）",
  };
  for (const key of order) {
    if (key === "kenken") {
      const items = bySection("kenken");
      if (items.length > 0) {
        sections.push({ type: "kenken", title: titles.kenken, questions: items as WorksheetSection["questions"] });
      }
      continue;
    }
    const sectionKey = key === "friendly-calc" ? "friendly-calc" : key;
    const items = bySection(sectionKey as NumberSenseQuestion["section"]);
    if (items.length > 0) {
      sections.push({ type: sectionKey as WorksheetSection["type"], title: titles[sectionKey] ?? sectionKey, questions: items as WorksheetSection["questions"] });
    }
  }
  return sections;
}

