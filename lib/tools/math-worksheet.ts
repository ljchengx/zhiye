export const MAX_WORKSHEET_QUESTIONS = 30;
export const WORKSHEET_PLAN_DAYS = 30;
export const NUMBER_SENSE_MAX = 100;

export const MENTAL_METHODS = [
  "make-ten",
  "break-ten",
  "flat-ten",
] as const;

export type MentalMethod = (typeof MENTAL_METHODS)[number];
export const WORKSHEET_THEME_SEQUENCE = MENTAL_METHODS;
export const WORKSHEET_THEMES = [...MENTAL_METHODS, "mixed"] as const;
export type WorksheetTheme = (typeof WORKSHEET_THEMES)[number];
export type MentalLevel = "basic" | "two-digit-single" | "two-digit" | "three-number";
export type MentalBinaryShape = "basic" | "two-digit-single" | "two-digit";
export type WorksheetSectionType = "neighbor" | "compare" | "mental";
export type WorksheetQuestionPresentation = "direct" | "guided";
export type WorksheetPageSectionType = "guided" | "number-sense" | "mental";
export type WorksheetIconKey = "apple" | "pineapple" | "heart" | "star" | "fish";

export const WORKSHEET_ICON_KEYS: readonly WorksheetIconKey[] = [
  "apple",
  "pineapple",
  "heart",
  "star",
  "fish",
];

export const MENTAL_METHOD_LABELS: Record<MentalMethod, string> = {
  "make-ten": "凑十法",
  "break-ten": "破十法",
  "flat-ten": "平十法",
};

export const MENTAL_METHOD_EXAMPLES: Record<MentalMethod, string> = {
  "make-ten": "9 + 4",
  "break-ten": "13 - 5",
  "flat-ten": "13 - 5",
};

export const WORKSHEET_THEME_LABELS: Record<WorksheetTheme, string> = {
  ...MENTAL_METHOD_LABELS,
  mixed: "混合主题",
};

export const WORKSHEET_THEME_DESCRIPTIONS: Record<WorksheetTheme, string> = {
  "make-ten": "先把一个数分出补数，凑成 10",
  "break-ten": "先把十几拆成 10 和几，再减",
  "flat-ten": "先减到整十，再减剩下的数",
  mixed: "三种方法轮换练习",
};

export interface WorksheetDemo {
  title: string;
  equation: string;
  note: string;
}

export const WORKSHEET_THEME_DEMOS: Record<WorksheetTheme, readonly WorksheetDemo[]> = {
  "make-ten": [
    {
      title: "拆出补数",
      equation: "9 + 4 = 9 + 1 + 3 = 10 + 3 = 13",
      note: "4 拆成 1 和 3，先凑成 10",
    },
  ],
  "break-ten": [
    {
      title: "拆十再减",
      equation: "13 - 5 = 10 - 5 + 3 = 8",
      note: "13 拆成 10 和 3",
    },
  ],
  "flat-ten": [
    {
      title: "先减到整十",
      equation: "13 - 5 = 13 - 3 - 2 = 8",
      note: "先减 3 得 10，再减 2",
    },
  ],
  mixed: [
    {
      title: "凑十法",
      equation: "9 + 4 = 10 + 3 = 13",
      note: "先凑 10",
    },
    {
      title: "破十法",
      equation: "13 - 5 = 10 - 5 + 3 = 8",
      note: "拆成 10 和几",
    },
    {
      title: "平十法",
      equation: "13 - 5 = 13 - 3 - 2 = 8",
      note: "先减到 10",
    },
  ],
};

export interface WorksheetConfig {
  neighborCount: number;
  compareCount: number;
  mentalCount: number;
  theme: WorksheetTheme;
}

export interface WorksheetDayBlueprint {
  title: string;
  objective: string;
  theme: WorksheetTheme;
  neighborCount: number;
  compareCount: number;
  mentalCount: number;
  numberMax: number;
  mentalMax: number;
  binaryShape: MentalBinaryShape;
  binaryTwoDigitRatio: number;
  threeNumberRatio: number;
  tripleMinTerm: number;
}

export interface WorksheetPhase {
  number: number;
  title: string;
  summary: string;
  startDay: number;
  endDay: number;
  days: readonly WorksheetDayBlueprint[];
}

export const WORKSHEET_PHASES: readonly WorksheetPhase[] = [
  {
    number: 1,
    title: "打基础：数序与 20 以内",
    summary: "认识补数，建立凑十、破十和平十的基本路径。",
    startDay: 1,
    endDay: 5,
    days: [
      { title: "数感热身", objective: "认识补数，先把 10 以内的数看熟", theme: "make-ten", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.3, tripleMinTerm: 1 },
      { title: "凑十法·补 1～3", objective: "找到补数，完成 20 以内进位加法", theme: "make-ten", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.3, tripleMinTerm: 1 },
      { title: "凑十法·灵活拆分", objective: "把一个加数拆开，先凑成 10 再计算", theme: "make-ten", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.3, tripleMinTerm: 1 },
      { title: "破十法·拆十再减", objective: "把十几拆成 10 和几，完成退位减法", theme: "break-ten", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.3, tripleMinTerm: 1 },
      { title: "平十法·先到整十", objective: "先减到 10，再减去剩下的数", theme: "flat-ten", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.45, tripleMinTerm: 1 },
    ],
  },
  {
    number: 2,
    title: "方法迁移：20 以内熟练化",
    summary: "巩固三种方法，再交替使用，逐步引入两位数加减。",
    startDay: 6,
    endDay: 10,
    days: [
      { title: "三法轮换·第一回", objective: "交替使用凑十、破十和平十", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.45, tripleMinTerm: 1 },
      { title: "三法轮换·第二回", objective: "根据算式特点选择合适的方法", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 20, mentalMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.45, tripleMinTerm: 1 },
      { title: "迈向 50·试做两位数", objective: "在熟悉方法上加入两位数与一位数的计算", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 14, numberMax: 50, mentalMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.6, tripleMinTerm: 1 },
      { title: "迈向 50·进退位", objective: "练习两位数和一位数的进位、退位", theme: "mixed", neighborCount: 6, compareCount: 6, mentalCount: 16, numberMax: 50, mentalMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.5, threeNumberRatio: 0.6, tripleMinTerm: 1 },
      { title: "阶段小结·50 以内", objective: "混合检查 20 以内方法和 50 以内两位数计算", theme: "mixed", neighborCount: 6, compareCount: 6, mentalCount: 16, numberMax: 50, mentalMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.5, threeNumberRatio: 0.6, tripleMinTerm: 1 },
    ],
  },
  {
    number: 3,
    title: "进阶一：50～100 的进退位",
    summary: "把三种方法迁移到两位数与一位数的算式，稳定进位和退位。",
    startDay: 11,
    endDay: 15,
    days: [
      { title: "两位数凑十", objective: "利用个位补数完成 100 以内进位加法", theme: "make-ten", neighborCount: 6, compareCount: 6, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 1, threeNumberRatio: 0.6, tripleMinTerm: 1 },
      { title: "两位数破十", objective: "借助整十数完成 100 以内退位减法", theme: "break-ten", neighborCount: 6, compareCount: 6, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 1, threeNumberRatio: 0.6, tripleMinTerm: 1 },
      { title: "两位数平十", objective: "先减到前一个整十，再完成第二步", theme: "flat-ten", neighborCount: 6, compareCount: 6, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 1 },
      { title: "三法轮换·100 以内", objective: "根据算式特点选择凑十、破十或平十", theme: "mixed", neighborCount: 6, compareCount: 6, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 1 },
      { title: "阶段小结·100 以内", objective: "综合三种方法，完成两位数进退位计算", theme: "mixed", neighborCount: 5, compareCount: 5, mentalCount: 18, numberMax: 100, mentalMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 1 },
    ],
  },
  {
    number: 4,
    title: "进阶二：两位数之间的计算",
    summary: "进入 100 以内两位数加减，继续用三种方法解决更长的算式。",
    startDay: 16,
    endDay: 20,
    days: [
      { title: "两位数凑十", objective: "利用个位补数完成两位数进位加法", theme: "make-ten", neighborCount: 5, compareCount: 5, mentalCount: 18, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 1 },
      { title: "两位数破十", objective: "在两位数减法中识别退位位置", theme: "break-ten", neighborCount: 5, compareCount: 5, mentalCount: 18, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 1 },
      { title: "两位数平十", objective: "先减到整十，再处理剩余数", theme: "flat-ten", neighborCount: 5, compareCount: 5, mentalCount: 18, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.9, tripleMinTerm: 1 },
      { title: "三法轮换·两位数", objective: "综合使用凑十、破十和平十", theme: "mixed", neighborCount: 5, compareCount: 5, mentalCount: 18, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.9, tripleMinTerm: 1 },
      { title: "阶段小结·两位数", objective: "综合完成 100 以内两位数加减法", theme: "mixed", neighborCount: 5, compareCount: 5, mentalCount: 20, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.9, tripleMinTerm: 1 },
    ],
  },
  {
    number: 5,
    title: "综合一：100 以内三个数",
    summary: "从两步算式开始，学习按顺序完成三个数的加减混合。",
    startDay: 21,
    endDay: 25,
    days: [
      { title: "三数混合·入门", objective: "按顺序完成两步加减，结果保持在 100 以内", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 1 },
      { title: "三数混合·变式", objective: "熟悉先加后减、先减后加两种结构", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 1 },
      { title: "三数混合·稳步", objective: "增加连续计算量，保持中间结果不出错", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 1 },
      { title: "三数混合·强化", objective: "在 100 以内综合使用进位、退位和两步计算", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 1 },
      { title: "阶段小结·三数 100 以内", objective: "完成 100 以内三个数加减混合的综合练习", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 1 },
    ],
  },
  {
    number: 6,
    title: "综合二：200 以内三个数",
    summary: "保持两步加减结构，逐渐扩大到 200 以内，完成整套阶段复习。",
    startDay: 26,
    endDay: 30,
    days: [
      { title: "200 以内·起步", objective: "把两步加减迁移到 120 以内", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 120, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10 },
      { title: "200 以内·展开", objective: "练习 140 以内三个数的加减混合", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 140, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10 },
      { title: "200 以内·进退位", objective: "在更大数值中稳定处理进位和退位", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 160, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10 },
      { title: "200 以内·综合", objective: "完成 180 以内三个数加减混合", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 180, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10 },
      { title: "第 30 天·阶段测评", objective: "完成 200 以内三个数加减混合，回顾全阶段方法", theme: "mixed", neighborCount: 7, compareCount: 7, mentalCount: 16, numberMax: 100, mentalMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10 },
    ],
  },
];

export interface WorksheetDayPlan extends WorksheetDayBlueprint {
  day: number;
  phase: number;
  phaseTitle: string;
  phaseSummary: string;
  startDay: number;
  endDay: number;
}

export type WorksheetDayOverrides = Partial<Pick<
  WorksheetDayBlueprint,
  | "title"
  | "objective"
  | "theme"
  | "neighborCount"
  | "compareCount"
  | "mentalCount"
  | "numberMax"
  | "mentalMax"
  | "binaryShape"
  | "binaryTwoDigitRatio"
  | "threeNumberRatio"
  | "tripleMinTerm"
>>;

export function getWorksheetDayPlan(day: number): WorksheetDayPlan {
  const safeDay = Number.isFinite(day)
    ? Math.max(1, Math.min(WORKSHEET_PLAN_DAYS, Math.trunc(day)))
    : 1;
  const phase = WORKSHEET_PHASES.find((item) => safeDay >= item.startDay && safeDay <= item.endDay)
    ?? WORKSHEET_PHASES[WORKSHEET_PHASES.length - 1];
  const blueprint = phase.days[safeDay - phase.startDay] ?? phase.days[phase.days.length - 1];

  return {
    ...blueprint,
    day: safeDay,
    phase: phase.number,
    phaseTitle: phase.title,
    phaseSummary: phase.summary,
    startDay: phase.startDay,
    endDay: phase.endDay,
  };
}

export const DEFAULT_WORKSHEET_CONFIG: WorksheetConfig = {
  neighborCount: 8,
  compareCount: 8,
  mentalCount: 14,
  theme: "make-ten",
};

interface BaseQuestion {
  id: string;
  section: WorksheetSectionType;
  number: number;
}

export interface NeighborQuestion extends BaseQuestion {
  type: "neighbor";
  section: "neighbor";
  left: number;
  right: number;
  answer: number;
}

export interface CompareQuestion extends BaseQuestion {
  type: "compare";
  section: "compare";
  left: number;
  right: number;
  answer: "<" | ">" | "=";
}

export interface MentalQuestion extends BaseQuestion {
  type: "mental";
  section: "mental";
  left: number;
  operator: "+" | "-";
  right: number;
  secondOperator?: "+" | "-";
  third?: number;
  answer: number;
  method: MentalMethod;
  level: MentalLevel;
  presentation: WorksheetQuestionPresentation;
  guidance?: WorksheetGuidance;
}

export type WorksheetQuestion = NeighborQuestion | CompareQuestion | MentalQuestion;

export interface WorksheetSection {
  type: WorksheetSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
}

export interface WorksheetGuidedStep {
  left: number;
  operator: "+" | "-";
  right: number;
  answer: number;
}

export interface WorksheetGuidance {
  icon: WorksheetIconKey;
  groups: readonly number[];
  splitSource: number;
  split: readonly [number, number];
  steps: readonly [WorksheetGuidedStep, WorksheetGuidedStep];
}

export interface WorksheetPageSection {
  type: WorksheetPageSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
  columns: 2 | 3;
  continued: boolean;
}

export interface WorksheetPrintPage {
  pageNumber: number;
  pageCount: number;
  showMethod: boolean;
  sections: readonly WorksheetPageSection[];
  questionCount: number;
  usedHeightMm: number;
}

export interface GeneratedWorksheet {
  sections: readonly WorksheetSection[];
  pages: readonly WorksheetPrintPage[];
  total: number;
  theme: WorksheetTheme;
  demos: readonly WorksheetDemo[];
}

export interface DailyWorksheet extends GeneratedWorksheet {
  day: number;
  phase: number;
  phaseTitle: string;
  phaseSummary: string;
  title: string;
  objective: string;
  plan: WorksheetDayPlan;
}

export interface WorksheetPlan {
  days: readonly DailyWorksheet[];
  totalDays: number;
  totalQuestions: number;
}

type RandomSource = () => number;

interface MentalCandidate {
  left: number;
  operator: "+" | "-";
  right: number;
  secondOperator?: "+" | "-";
  third?: number;
  answer: number;
  level: MentalLevel;
}

function createSeededRandom(seed: number): RandomSource {
  let state = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % 2147483647 : 1;
  if (state === 0) {
    state = 1;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function shuffle<T>(items: T[], random: RandomSource): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_WORKSHEET_QUESTIONS, Math.trunc(value)));
}

export function normalizeWorksheetConfig(config: WorksheetConfig): WorksheetConfig {
  const counts = {
    neighborCount: normalizeCount(config.neighborCount),
    compareCount: normalizeCount(config.compareCount),
    mentalCount: normalizeCount(config.mentalCount),
  };
  let overflow = Math.max(
    0,
    counts.neighborCount + counts.compareCount + counts.mentalCount - MAX_WORKSHEET_QUESTIONS,
  );

  for (const key of ["mentalCount", "compareCount", "neighborCount"] as const) {
    const reduction = Math.min(counts[key], overflow);
    counts[key] -= reduction;
    overflow -= reduction;
  }

  const theme = WORKSHEET_THEMES.includes(config.theme) ? config.theme : "make-ten";

  return {
    ...counts,
    theme,
  };
}

function buildNeighborQuestions(
  count: number,
  random: RandomSource,
  numberMax = NUMBER_SENSE_MAX,
): NeighborQuestion[] {
  const safeMax = Math.max(3, Math.min(NUMBER_SENSE_MAX, Math.trunc(numberMax)));
  const centers = shuffle(
    Array.from({ length: safeMax - 2 }, (_, index) => index + 2),
    random,
  ).slice(0, count);

  return centers.map((center, index) => ({
    id: "neighbor-" + index,
    type: "neighbor",
    section: "neighbor",
    number: 0,
    left: center - 1,
    right: center + 1,
    answer: center,
  }));
}

function buildCompareQuestions(
  count: number,
  random: RandomSource,
  numberMax = NUMBER_SENSE_MAX,
): CompareQuestion[] {
  const safeMax = Math.max(1, Math.min(NUMBER_SENSE_MAX, Math.trunc(numberMax)));
  const equalPairs = Array.from({ length: safeMax }, (_, index) => ({
    left: index + 1,
    right: index + 1,
  }));
  const otherPairs: Array<{ left: number; right: number }> = [];

  for (let left = 1; left <= safeMax; left += 1) {
    for (let right = 1; right <= safeMax; right += 1) {
      if (left !== right) {
        otherPairs.push({ left, right });
      }
    }
  }

  shuffle(equalPairs, random);
  shuffle(otherPairs, random);

  const selected = count > 0 ? [equalPairs[0], ...otherPairs.slice(0, count - 1)] : [];
  if (selected.length < count) {
    selected.push(...equalPairs.slice(1, count - selected.length + 1));
  }

  return shuffle(selected, random).map((pair, index) => ({
    id: "compare-" + index,
    type: "compare",
    section: "compare",
    number: 0,
    left: pair.left,
    right: pair.right,
    answer: pair.left < pair.right ? "<" : pair.left > pair.right ? ">" : "=",
  }));
}

function buildMentalCandidates(
  method: MentalMethod,
  level: Exclude<MentalLevel, "three-number">,
  resultMax: number,
): MentalCandidate[] {
  const candidates: MentalCandidate[] = [];
  const safeResultMax = Math.max(20, Math.min(200, Math.trunc(resultMax)));

  if (level === "basic") {
    if (method === "make-ten") {
      for (let left = 1; left <= 9; left += 1) {
        for (let right = 1; right <= 9; right += 1) {
          if (left + right > 10 && left + right <= safeResultMax) {
            candidates.push({ left, operator: "+", right, answer: left + right, level });
          }
        }
      }
      return candidates;
    }

    for (let left = 11; left <= 18; left += 1) {
      for (let right = left - 9; right <= 9; right += 1) {
        const answer = left - right;
        if (answer >= 1 && answer <= 9 && answer <= safeResultMax) {
          candidates.push({ left, operator: "-", right, answer, level });
        }
      }
    }
    return candidates;
  }

  if (level === "two-digit-single") {
    if (method === "make-ten") {
      for (let left = 10; left <= Math.min(99, safeResultMax); left += 1) {
        for (let right = 1; right <= 9; right += 1) {
          if (left + right <= safeResultMax && left % 10 + right >= 10) {
            candidates.push({ left, operator: "+", right, answer: left + right, level });
          }
        }
      }
      return candidates;
    }

    for (let left = 10; left <= 99; left += 1) {
      for (let right = 1; right <= 9; right += 1) {
        const answer = left - right;
        const needsBorrow = left % 10 < right;
        const reachesPreviousTen = right > left % 10;

        if (answer < 1 || answer > safeResultMax) {
          continue;
        }
        if (method === "break-ten" && (!needsBorrow || (right < 10 && left % 10 === 0))) {
          continue;
        }
        if (method === "flat-ten" && (!reachesPreviousTen || left % 10 === 0)) {
          continue;
        }

        candidates.push({ left, operator: "-", right, answer, level });
      }
    }
    return candidates;
  }

  if (method === "make-ten") {
    for (let left = 10; left <= 99; left += 1) {
      for (let right = 10; right <= 99; right += 1) {
        if (left % 10 + (right % 10) >= 10) {
          const answer = left + right;
          if (answer <= safeResultMax) {
            candidates.push({ left, operator: "+", right, answer, level });
          }
        }
      }
    }
    return candidates;
  }

  for (let left = 20; left <= 99; left += 1) {
    for (let right = 10; right <= left - 10; right += 1) {
      const answer = left - right;
      const needsBorrow = left % 10 < right % 10;
      const reachesPreviousTen = right > left % 10;

      if (answer < 10 || answer > safeResultMax) {
        continue;
      }
      if (method === "break-ten" && (!needsBorrow || (right < 10 && left % 10 === 0))) {
        continue;
      }
      if (method === "flat-ten" && (!reachesPreviousTen || left % 10 === 0)) {
        continue;
      }

      candidates.push({ left, operator: "-", right, answer, level });
    }
  }

  return candidates;
}

const MAX_THREE_NUMBER_CANDIDATES = 10000;

function buildThreeNumberCandidates(
  method: MentalMethod,
  resultMax: number,
  tripleMinTerm: number,
): MentalCandidate[] {
  const candidates: MentalCandidate[] = [];
  const safeResultMax = Math.max(20, Math.min(200, Math.trunc(resultMax)));
  const safeMinTerm = Math.max(1, Math.min(99, Math.trunc(tripleMinTerm)));

  if (method === "make-ten") {
    outer: for (let left = safeMinTerm; left <= 99; left += 1) {
      for (let right = safeMinTerm; right <= 99; right += 1) {
        const intermediate = left + right;
        if (intermediate > safeResultMax || left % 10 + right % 10 < 10) {
          continue;
        }

        for (let third = safeMinTerm; third < intermediate; third += 1) {
          const answer = intermediate - third;
          if (answer < 1 || answer > safeResultMax) {
            continue;
          }

          candidates.push({
            left,
            operator: "+",
            right,
            secondOperator: "-",
            third,
            answer,
            level: "three-number",
          });
          if (candidates.length >= MAX_THREE_NUMBER_CANDIDATES) {
            break outer;
          }
        }
      }
    }
    return candidates;
  }

  outer: for (let left = safeMinTerm; left <= 99; left += 1) {
    for (let right = safeMinTerm; right <= left; right += 1) {
      const intermediate = left - right;
      const needsBorrow = left % 10 < right % 10;
      const reachesPreviousTen = right > left % 10;

      if (method === "break-ten" && (!needsBorrow || (right < 10 && left % 10 === 0))) {
        continue;
      }
      if (method === "flat-ten" && (!reachesPreviousTen || left % 10 === 0)) {
        continue;
      }

      for (let third = safeMinTerm; third <= 99; third += 1) {
        const answer = intermediate + third;
        if (answer < 1 || answer > safeResultMax) {
          continue;
        }

        candidates.push({
          left,
          operator: "-",
          right,
          secondOperator: "+",
          third,
          answer,
          level: "three-number",
        });
        if (candidates.length >= MAX_THREE_NUMBER_CANDIDATES) {
          break outer;
        }
      }
    }
  }

  return candidates;
}

function mentalQuestionKey(candidate: MentalCandidate): string {
  return [
    candidate.left,
    candidate.operator,
    candidate.right,
    candidate.secondOperator ?? "",
    candidate.third ?? "",
  ].join("");
}

const MENTAL_DIFFICULTY_ORDER: Record<MentalLevel, number> = {
  basic: 0,
  "two-digit-single": 1,
  "two-digit": 2,
  "three-number": 3,
};

function getMentalDifficultyScore(question: Pick<MentalCandidate, "level" | "left" | "right" | "third">): number {
  const levelScore = MENTAL_DIFFICULTY_ORDER[question.level];

  if (question.level !== "three-number") {
    return levelScore;
  }

  const terms = [question.left, question.right, question.third].filter(
    (term): term is number => term !== undefined,
  );
  const twoDigitTermCount = terms.filter((term) => term >= 10).length;

  return levelScore + twoDigitTermCount;
}

function buildMentalQuestions(
  count: number,
  theme: WorksheetTheme,
  random: RandomSource,
  options: {
    resultMax?: number;
    binaryShape?: MentalBinaryShape;
    binaryTwoDigitRatio?: number;
    threeNumberRatio?: number;
    tripleMinTerm?: number;
  } = {},
): MentalQuestion[] {
  const selectedMethods: readonly MentalMethod[] = theme === "mixed" ? MENTAL_METHODS : [theme];
  const resultMax = options.resultMax ?? 100;
  const binaryShape = options.binaryShape ?? "two-digit";
  const binaryCount = count - Math.round(count * Math.max(0, Math.min(1, options.threeNumberRatio ?? 0)));
  const threeNumberCount = count - binaryCount;
  const binaryTwoDigitRatio = binaryShape === "basic"
    ? 0
    : Math.max(0, Math.min(1, options.binaryTwoDigitRatio ?? 0.5));
  const twoDigitCount = Math.round(
    binaryCount * binaryTwoDigitRatio,
  );
  const binaryLevel: MentalLevel = binaryShape;
  const levels: MentalLevel[] = [
    ...Array.from({ length: binaryCount - twoDigitCount }, () => "basic" as const),
    ...Array.from({ length: twoDigitCount }, () => binaryLevel),
    ...Array.from({ length: threeNumberCount }, () => "three-number" as const),
  ];

  const pools = new Map<MentalMethod, Map<MentalLevel, MentalCandidate[]>>();

  selectedMethods.forEach((method) => {
    const methodPools = new Map<MentalLevel, MentalCandidate[]>();
    new Set(levels).forEach((level) => {
      if (level === "three-number") {
        methodPools.set(
          level,
          shuffle(buildThreeNumberCandidates(method, resultMax, options.tripleMinTerm ?? 1), random),
        );
        return;
      }

      methodPools.set(level, shuffle(buildMentalCandidates(method, level, resultMax), random));
    });
    pools.set(method, methodPools);
  });

  const used = new Set<string>();
  const questions: MentalQuestion[] = [];
  const methodSequence = shuffle(
    Array.from({ length: count }, (_, index) => selectedMethods[index % selectedMethods.length]),
    random,
  );

  for (let index = 0; index < count; index += 1) {
    const method = methodSequence[index];
    const level = levels[index];
    const primaryPool = pools.get(method)?.get(level) ?? [];
    const candidate = primaryPool.find((item) => !used.has(mentalQuestionKey(item)));

    if (!candidate) {
      break;
    }

    used.add(mentalQuestionKey(candidate));
    questions.push({
      id: "mental-" + index,
      type: "mental",
      section: "mental",
      number: 0,
      ...candidate,
      method,
      presentation: "direct",
    });
  }

  return questions
    .sort((left, right) => getMentalDifficultyScore(left) - getMentalDifficultyScore(right))
    .map((question, index) => ({
      ...question,
      id: "mental-" + index,
    }));
}

export function createWorksheetGuidance(
  question: MentalQuestion,
  icon: WorksheetIconKey,
): WorksheetGuidance | undefined {
  if (question.third !== undefined) {
    return undefined;
  }

  if (question.method === "make-ten") {
    const target = Math.floor(question.left / 10) * 10 + 10;
    const firstPart = target - question.left;
    const secondPart = question.right - firstPart;

    if (firstPart <= 0 || secondPart < 0) {
      return undefined;
    }

    return {
      icon,
      groups: [question.left, question.right],
      splitSource: question.right,
      split: [firstPart, secondPart],
      steps: [
        { left: question.left, operator: "+", right: firstPart, answer: target },
        { left: target, operator: "+", right: secondPart, answer: question.answer },
      ],
    };
  }

  if (question.method === "break-ten") {
    const baseTen = Math.floor(question.left / 10) * 10;
    const remainder = question.left - baseTen;
    const firstAnswer = baseTen - question.right;

    if (baseTen <= 0 || remainder < 0 || firstAnswer < 0) {
      return undefined;
    }

    return {
      icon,
      groups: [baseTen, remainder],
      splitSource: question.left,
      split: [baseTen, remainder],
      steps: [
        { left: baseTen, operator: "-", right: question.right, answer: firstAnswer },
        { left: firstAnswer, operator: "+", right: remainder, answer: question.answer },
      ],
    };
  }

  const firstPart = question.left % 10;
  const secondPart = question.right - firstPart;
  const target = question.left - firstPart;

  if (firstPart <= 0 || secondPart < 0) {
    return undefined;
  }

  return {
    icon,
    groups: [question.left, question.right],
    splitSource: question.right,
    split: [firstPart, secondPart],
    steps: [
      { left: question.left, operator: "-", right: firstPart, answer: target },
      { left: target, operator: "-", right: secondPart, answer: question.answer },
    ],
  };
}

const PAGE_BODY_HEIGHT_MM = 252;
const METHOD_HEIGHT_MM = 32;
const GUIDED_SECTION_HEIGHT_MM = 58;
const SECTION_TITLE_HEIGHT_MM = 10;
const NUMBER_SENSE_ROW_HEIGHT_MM = 17;
const MENTAL_ROW_HEIGHT_MM = 17;
const THREE_NUMBER_ROW_HEIGHT_MM = 19;

interface WorksheetPageDraft {
  showMethod: boolean;
  sections: WorksheetPageSection[];
  usedHeightMm: number;
}

interface MentalRow {
  questions: readonly MentalQuestion[];
  columns: 2 | 3;
  heightMm: number;
}

function chunkQuestions<T>(questions: readonly T[], size: number): readonly T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < questions.length; index += size) {
    chunks.push(questions.slice(index, index + size));
  }

  return chunks;
}

function shouldShowMethod(day: number): boolean {
  return day <= 5 || (day >= 11 && day <= 18);
}

function addSection(
  page: WorksheetPageDraft,
  section: WorksheetPageSection,
  heightMm: number,
): void {
  page.sections.push(section);
  page.usedHeightMm += heightMm;
}

function createPage(showMethod = false): WorksheetPageDraft {
  return {
    showMethod,
    sections: [],
    usedHeightMm: showMethod ? METHOD_HEIGHT_MM : 0,
  };
}

function composeWorksheetLayout(
  sections: readonly WorksheetSection[],
  day: number,
): {
  sections: readonly WorksheetSection[];
  pages: readonly WorksheetPrintPage[];
} {
  const allQuestions = sections.flatMap((section) => section.questions);
  const mentalQuestions = allQuestions.filter(
    (question): question is MentalQuestion => question.type === "mental",
  );
  const guidedTarget = day <= 10 ? 2 : 0;
  const eligibleGuidedQuestions = mentalQuestions.filter((question) => (
    question.third === undefined
    && question.level !== "two-digit"
    && createWorksheetGuidance(question, "apple") !== undefined
  ));
  const guidedQuestions = eligibleGuidedQuestions.slice(0, guidedTarget).map((question, index) => ({
    ...question,
    presentation: "guided" as const,
    guidance: createWorksheetGuidance(
      question,
      WORKSHEET_ICON_KEYS[(day + index - 1) % WORKSHEET_ICON_KEYS.length],
    ),
  }));
  const guidedById = new Map(guidedQuestions.map((question) => [question.id, question]));
  const questionsWithPresentation: WorksheetQuestion[] = allQuestions.map((question): WorksheetQuestion => {
    const guidedQuestion = guidedById.get(question.id);

    if (guidedQuestion) {
      return guidedQuestion;
    }

    if (question.type === "mental") {
      return { ...question, presentation: "direct" as const, guidance: undefined };
    }

    return question;
  });
  const guidedIds = new Set(guidedQuestions.map((question) => question.id));
  const numberSenseQuestions = questionsWithPresentation.filter((question) => question.type !== "mental");
  const directMentalQuestions = questionsWithPresentation.filter(
    (question): question is MentalQuestion => question.type === "mental" && !guidedIds.has(question.id),
  );
  const binaryRows = chunkQuestions(
    directMentalQuestions.filter((question) => question.third === undefined),
    3,
  ).map((questions): MentalRow => ({ questions, columns: 3, heightMm: MENTAL_ROW_HEIGHT_MM }));
  const threeNumberRows = chunkQuestions(
    directMentalQuestions.filter((question) => question.third !== undefined),
    2,
  ).map((questions): MentalRow => ({ questions, columns: 2, heightMm: THREE_NUMBER_ROW_HEIGHT_MM }));
  const mentalRows = [...binaryRows, ...threeNumberRows];
  const pages: WorksheetPageDraft[] = [createPage(shouldShowMethod(day))];
  let currentPage = pages[0];

  if (guidedQuestions.length > 0) {
    addSection(currentPage, {
      type: "guided",
      title: "看图算一算",
      questions: guidedQuestions,
      columns: 2,
      continued: false,
    }, GUIDED_SECTION_HEIGHT_MM);
  }

  if (numberSenseQuestions.length > 0) {
    const neighborCount = numberSenseQuestions.filter((question) => question.type === "neighbor").length;
    const compareCount = numberSenseQuestions.filter((question) => question.type === "compare").length;
    const numberSenseColumns: 2 | 3 = day <= 10 ? 3 : 2;
    const numberSenseRows = Math.max(
      Math.ceil(neighborCount / numberSenseColumns),
      Math.ceil(compareCount / numberSenseColumns),
    );
    const numberSenseHeight = SECTION_TITLE_HEIGHT_MM + numberSenseRows * NUMBER_SENSE_ROW_HEIGHT_MM;

    if (currentPage.usedHeightMm + numberSenseHeight > PAGE_BODY_HEIGHT_MM) {
      currentPage = createPage();
      pages.push(currentPage);
    }

    addSection(currentPage, {
      type: "number-sense",
      title: "数感练习",
      questions: numberSenseQuestions,
      columns: numberSenseColumns,
      continued: false,
    }, numberSenseHeight);
  }

  let rowIndex = 0;
  let mentalStarted = false;

  while (rowIndex < mentalRows.length) {
    const titleHeight = SECTION_TITLE_HEIGHT_MM;
    const availableHeight = PAGE_BODY_HEIGHT_MM - currentPage.usedHeightMm - titleHeight;
    let fitCount = 0;
    let consumedHeight = 0;

    while (
      rowIndex + fitCount < mentalRows.length
      && consumedHeight + mentalRows[rowIndex + fitCount].heightMm <= availableHeight
    ) {
      consumedHeight += mentalRows[rowIndex + fitCount].heightMm;
      fitCount += 1;
    }

    if (fitCount === 0) {
      currentPage = createPage();
      pages.push(currentPage);
      continue;
    }

    const rowsForPage = mentalRows.slice(rowIndex, rowIndex + fitCount);
    rowsForPage.forEach((row, index) => {
      addSection(currentPage, {
        type: "mental",
        title: index === 0 ? (mentalStarted ? "口算（续）" : "口算") : "",
        questions: row.questions,
        columns: row.columns,
        continued: mentalStarted,
      }, row.heightMm + (index === 0 ? titleHeight : 0));
      mentalStarted = true;
    });
    rowIndex += fitCount;

    if (rowIndex < mentalRows.length) {
      currentPage = createPage();
      pages.push(currentPage);
    }
  }

  const displayQuestions = pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
  const numberedById = new Map(displayQuestions.map((question, index) => [
    question.id,
    { ...question, number: index + 1 } as WorksheetQuestion,
  ]));
  const numberedSections = sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => numberedById.get(question.id) ?? question),
  }));
  const pageCount = pages.length;
  const numberedPages = pages.map((page, index): WorksheetPrintPage => {
    const numberedPageSections = page.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => numberedById.get(question.id) ?? question),
    }));

    return {
      pageNumber: index + 1,
      pageCount,
      showMethod: page.showMethod,
      sections: numberedPageSections,
      questionCount: numberedPageSections.reduce((sum, section) => sum + section.questions.length, 0),
      usedHeightMm: page.usedHeightMm,
    };
  });

  return { sections: numberedSections, pages: numberedPages };
}

export function generateWorksheet(config: WorksheetConfig, seed = 1): GeneratedWorksheet {
  const normalized = normalizeWorksheetConfig(config);
  const random = createSeededRandom(seed);
  const sections: readonly WorksheetSection[] = [
    {
      type: "neighbor",
      title: "相邻数",
      questions: buildNeighborQuestions(normalized.neighborCount, random, NUMBER_SENSE_MAX),
    },
    {
      type: "compare",
      title: "比大小",
      questions: buildCompareQuestions(normalized.compareCount, random, NUMBER_SENSE_MAX),
    },
    {
      type: "mental",
      title: "口算",
      questions: buildMentalQuestions(normalized.mentalCount, normalized.theme, random, {
        resultMax: 100,
        binaryShape: "two-digit",
        binaryTwoDigitRatio: 0.5,
      }),
    },
  ];
  const layout = composeWorksheetLayout(sections, 1);

  return {
    sections: layout.sections,
    pages: layout.pages,
    total: layout.sections.reduce((total, section) => total + section.questions.length, 0),
    theme: normalized.theme,
    demos: WORKSHEET_THEME_DEMOS[normalized.theme],
  };
}

export function generateDailyWorksheet(
  day: number,
  seed = 1,
  overrides: WorksheetDayOverrides = {},
): DailyWorksheet {
  const basePlan = getWorksheetDayPlan(day);
  const rawPlan: WorksheetDayPlan = {
    ...basePlan,
    ...overrides,
    theme: WORKSHEET_THEMES.includes(overrides.theme ?? basePlan.theme)
      ? (overrides.theme ?? basePlan.theme)
      : basePlan.theme,
  };
  const normalizedCounts = normalizeWorksheetConfig({
    neighborCount: rawPlan.neighborCount,
    compareCount: rawPlan.compareCount,
    mentalCount: rawPlan.mentalCount,
    theme: rawPlan.theme,
  });
  const plan: WorksheetDayPlan = {
    ...rawPlan,
    ...normalizedCounts,
  };
  const random = createSeededRandom(seed);
  const sections: readonly WorksheetSection[] = [
    {
      type: "neighbor",
      title: "相邻数",
      questions: buildNeighborQuestions(plan.neighborCount, random, plan.numberMax),
    },
    {
      type: "compare",
      title: "比大小",
      questions: buildCompareQuestions(plan.compareCount, random, plan.numberMax),
    },
    {
      type: "mental",
      title: "口算",
      questions: buildMentalQuestions(plan.mentalCount, plan.theme, random, {
        resultMax: plan.mentalMax,
        binaryShape: plan.binaryShape,
        binaryTwoDigitRatio: plan.binaryTwoDigitRatio,
        threeNumberRatio: plan.threeNumberRatio,
        tripleMinTerm: plan.tripleMinTerm,
      }),
    },
  ];
  const layout = composeWorksheetLayout(sections, plan.day);
  const total = layout.sections.reduce((sum, section) => sum + section.questions.length, 0);

  return {
    sections: layout.sections,
    pages: layout.pages,
    total,
    theme: plan.theme,
    demos: WORKSHEET_THEME_DEMOS[plan.theme],
    day: plan.day,
    phase: plan.phase,
    phaseTitle: plan.phaseTitle,
    phaseSummary: plan.phaseSummary,
    title: plan.title,
    objective: plan.objective,
    plan,
  };
}

export function generateWorksheetPlan(seed = 1): WorksheetPlan {
  const days = Array.from({ length: WORKSHEET_PLAN_DAYS }, (_, index) =>
    generateDailyWorksheet(index + 1, seed + (index + 1) * 1009),
  );

  return {
    days,
    totalDays: days.length,
    totalQuestions: days.reduce((sum, day) => sum + day.total, 0),
  };
}
