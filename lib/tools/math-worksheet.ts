export const MAX_WORKSHEET_QUESTIONS = 30;
export const MIN_WORKSHEET_QUESTIONS = 10;
export const FOUNDATION_WORKSHEET_DAYS = 5;
export const REINFORCEMENT_WORKSHEET_DAYS = 25;
export const WORKSHEET_PLAN_DAYS = FOUNDATION_WORKSHEET_DAYS + REINFORCEMENT_WORKSHEET_DAYS;
export const NUMBER_SENSE_MAX = 200;
export const MAX_APPLICATION_QUESTIONS = 8;
export const MAX_APPLICATION_RATIO = 25;

export const MENTAL_METHODS = ["make-ten", "break-ten", "flat-ten"] as const;
export type MentalMethod = (typeof MENTAL_METHODS)[number];
export type WorksheetTheme = MentalMethod | "mixed";
export const WORKSHEET_THEMES = [...MENTAL_METHODS, "mixed"] as const;
export const WORKSHEET_THEME_SEQUENCE = MENTAL_METHODS;

export type MentalLevel = "basic" | "two-digit-single" | "two-digit" | "three-number";
export type MentalBinaryShape = "basic" | "two-digit-single" | "two-digit";
export type WorksheetStage = "foundation" | "reinforcement";
export type WorksheetQuestionPresentation = "direct" | "guided";
export type WorksheetIconKey = "apple" | "pineapple" | "heart" | "star" | "fish" | "mushroom" | "coin" | "flower" | "block" | "ball" | "book" | "cookie" | "balloon";
export type WorksheetSectionType = "composition" | "neighbor" | "compare" | "mental" | "picture-equation" | "application";
export type WorksheetPageSectionType = "composition" | "number-sense" | "guided" | "mental" | "picture-equation" | "application";

export const WORKSHEET_ICON_KEYS: readonly WorksheetIconKey[] = ["apple", "pineapple", "heart", "star", "fish", "mushroom", "coin", "flower", "block", "ball", "book", "cookie", "balloon"];

export const MENTAL_METHOD_LABELS: Record<MentalMethod, string> = {
  "make-ten": "凑十法",
  "break-ten": "破十法",
  "flat-ten": "平十法",
};

export const WORKSHEET_THEME_LABELS: Record<WorksheetTheme, string> = {
  ...MENTAL_METHOD_LABELS,
  mixed: "综合练习",
};

export const WORKSHEET_THEME_DESCRIPTIONS: Record<WorksheetTheme, string> = {
  "make-ten": "先找补数，再凑成 10",
  "break-ten": "把十几拆开再减",
  "flat-ten": "先减到整十",
  mixed: "三种方法交替练习",
};

export interface WorksheetGuidedStep {
  left: number;
  operator: "+" | "-";
  right: number;
  answer: number;
}

export interface WorksheetVisualEquation {
  left: number;
  operator: "+" | "-";
  right: number;
  answer: number;
}

export interface WorksheetMethodExample {
  method: MentalMethod | "number-bond" | "picture-equation";
  title: string;
  original: WorksheetVisualEquation;
  splitSource: number;
  split: readonly [number, number];
  steps: readonly WorksheetGuidedStep[];
  icon: WorksheetIconKey;
}

export interface WorksheetConfig {
  neighborCount: number;
  compareCount: number;
  mentalCount: number;
  theme: WorksheetTheme;
  applicationCount?: number;
}

export interface ReinforcementConfig {
  dailyQuestionCount: number;
  neighborRatio: number;
  compareRatio: number;
  applicationRatio: number;
  mentalRatio: number;
}

export const DEFAULT_REINFORCEMENT_CONFIG: ReinforcementConfig = {
  dailyQuestionCount: 30,
  neighborRatio: 15,
  compareRatio: 15,
  applicationRatio: 20,
  mentalRatio: 50,
};

export const DEFAULT_WORKSHEET_CONFIG: WorksheetConfig = {
  neighborCount: 5,
  compareCount: 5,
  mentalCount: 14,
  applicationCount: 6,
  theme: "mixed",
};

export interface ReinforcementDayBlueprint {
  stageDay: number;
  title: string;
  objective: string;
  resultMax: number;
  numberMax: number;
  binaryShape: MentalBinaryShape;
  binaryTwoDigitRatio: number;
  threeNumberRatio: number;
  tripleMinTerm: number;
  applicationLevel: ApplicationLevel;
  methodTheme: WorksheetTheme;
}

const REINFORCEMENT_BLUEPRINTS: readonly ReinforcementDayBlueprint[] = [
  { stageDay: 1, title: "20 以内·再认识", objective: "看懂数量关系，稳稳完成 20 以内加减", resultMax: 20, numberMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.2, tripleMinTerm: 1, applicationLevel: "picture", methodTheme: "make-ten" },
  { stageDay: 2, title: "20 以内·凑十", objective: "把凑十方法用到更多算式中", resultMax: 20, numberMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.2, threeNumberRatio: 0.2, tripleMinTerm: 1, applicationLevel: "picture", methodTheme: "make-ten" },
  { stageDay: 3, title: "20 以内·破十", objective: "把十几拆开，完成退位减法", resultMax: 20, numberMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.25, threeNumberRatio: 0.2, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "break-ten" },
  { stageDay: 4, title: "20 以内·平十", objective: "先到整十，再算剩下的数", resultMax: 20, numberMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.25, threeNumberRatio: 0.2, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "flat-ten" },
  { stageDay: 5, title: "20 以内·小结", objective: "交替使用三种方法解决加减题", resultMax: 20, numberMax: 20, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.3, threeNumberRatio: 0.25, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 6, title: "50 以内·加入一位数", objective: "练习两位数和一位数的加减", resultMax: 50, numberMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.5, threeNumberRatio: 0.3, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 7, title: "50 以内·进位", objective: "在进位加法中找准个位关系", resultMax: 50, numberMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.55, threeNumberRatio: 0.3, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 8, title: "50 以内·退位", objective: "在退位减法中保持计算顺序", resultMax: 50, numberMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.6, threeNumberRatio: 0.35, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 9, title: "50 以内·数量关系", objective: "用加减法表示原来、增加和剩下", resultMax: 50, numberMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.65, threeNumberRatio: 0.35, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 10, title: "50 以内·小结", objective: "综合完成 50 以内的加减练习", resultMax: 50, numberMax: 50, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.7, threeNumberRatio: 0.4, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 11, title: "100 以内·两位数", objective: "熟悉 100 以内两位数加减", resultMax: 100, numberMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.75, threeNumberRatio: 0.4, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 12, title: "100 以内·进退位", objective: "稳定处理个位进位和退位", resultMax: 100, numberMax: 100, binaryShape: "two-digit-single", binaryTwoDigitRatio: 0.8, threeNumberRatio: 0.45, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 13, title: "100 以内·比多少", objective: "用计算解决比多、比少和相差多少", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.7, threeNumberRatio: 0.45, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 14, title: "100 以内·灵活计算", objective: "根据算式特点选择合适的方法", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.75, threeNumberRatio: 0.5, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 15, title: "100 以内·小结", objective: "综合完成两位数加减和数量关系", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.8, threeNumberRatio: 0.5, tripleMinTerm: 1, applicationLevel: "one-step", methodTheme: "mixed" },
  { stageDay: 16, title: "三个数·入门", objective: "按顺序完成两个连续的加减", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.8, threeNumberRatio: 0.6, tripleMinTerm: 1, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 17, title: "三个数·先加后减", objective: "看清先加后减的数量变化", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.8, threeNumberRatio: 0.65, tripleMinTerm: 1, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 18, title: "三个数·先减后加", objective: "看清先减后加的数量变化", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.85, threeNumberRatio: 0.7, tripleMinTerm: 1, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 19, title: "三个数·进退位", objective: "在连续计算中保持中间结果正确", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.9, threeNumberRatio: 0.75, tripleMinTerm: 1, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 20, title: "三个数·小结", objective: "综合完成 100 以内三个数加减", resultMax: 100, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.9, threeNumberRatio: 0.8, tripleMinTerm: 1, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 21, title: "200 以内·120 起步", objective: "把连续加减迁移到 120 以内", resultMax: 120, numberMax: 120, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.8, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 22, title: "200 以内·140 展开", objective: "完成 140 以内三个数加减", resultMax: 140, numberMax: 140, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.85, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 23, title: "200 以内·160 进退位", objective: "在较大数中稳定处理进退位", resultMax: 160, numberMax: 160, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.9, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 24, title: "200 以内·180 综合", objective: "综合完成 180 以内连续加减", resultMax: 180, numberMax: 180, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.95, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed" },
  { stageDay: 25, title: "200 以内·阶段测评", objective: "完成 200 以内三个数加减和两步应用题", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed" },
];

export interface WorksheetDayPlan extends ReinforcementDayBlueprint {
  day: number;
  stage: WorksheetStage;
  phase: number;
  phaseTitle: string;
  phaseSummary: string;
  startDay: number;
  endDay: number;
}

export interface BaseQuestion {
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

export interface NumberBondQuestion extends BaseQuestion {
  type: "number-bond";
  section: "composition";
  mode: "picture-split" | "split" | "compose";
  whole: number;
  knownPart: number;
  answer: number;
  icon: WorksheetIconKey;
}

export interface PictureEquationQuestion extends BaseQuestion {
  type: "picture-equation";
  section: "picture-equation";
  icon: WorksheetIconKey;
  leftCount: number;
  rightCount: number;
  operator: "+" | "-";
  answer: number;
}

export interface WorksheetGuidance {
  icon: WorksheetIconKey;
  splitSource: number;
  split: readonly [number, number];
  steps: readonly [WorksheetGuidedStep, WorksheetGuidedStep];
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

export type ApplicationScenario = "combine" | "increase" | "decrease" | "remain" | "compare-more" | "compare-less" | "two-step";
export type ApplicationLevel = "picture" | "one-step" | "two-step";

export interface ApplicationQuestion extends BaseQuestion {
  type: "application";
  section: "application";
  scenario: ApplicationScenario;
  level: ApplicationLevel;
  prompt: string;
  icon: WorksheetIconKey;
  unit: string;
  operands: readonly number[];
  operators: readonly ("+" | "-")[];
  equation: string;
  steps: readonly WorksheetGuidedStep[];
  answer: number;
  picture: boolean;
}

export type WorksheetQuestion = NeighborQuestion | CompareQuestion | NumberBondQuestion | PictureEquationQuestion | MentalQuestion | ApplicationQuestion;

export interface WorksheetSection {
  type: WorksheetSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
}

export interface WorksheetPageSection {
  type: WorksheetPageSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
  columns: 1 | 2 | 3 | 4;
  continued: boolean;
  rowHeightMm: number;
}

export interface WorksheetPrintPage {
  pageNumber: number;
  pageCount: number;
  showMethod: boolean;
  sections: readonly WorksheetPageSection[];
  questionCount: number;
  usedHeightMm: number;
}

export interface DailyWorksheet {
  id: string;
  day: number;
  stage: WorksheetStage;
  stageDay: number;
  phase: number;
  phaseTitle: string;
  phaseSummary: string;
  title: string;
  objective: string;
  sections: readonly WorksheetSection[];
  pages: readonly WorksheetPrintPage[];
  total: number;
  theme: WorksheetTheme;
  methodLesson?: WorksheetMethodExample;
  plan: WorksheetDayPlan;
}

export interface WorksheetPlan {
  days: readonly DailyWorksheet[];
  foundationDays: readonly DailyWorksheet[];
  reinforcementDays: readonly DailyWorksheet[];
  reinforcementConfig: ReinforcementConfig;
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

const PAGE_BODY_HEIGHT_MM = 252;
const METHOD_HEIGHT_MM = 34;
const SECTION_TITLE_HEIGHT_MM = 9;
const COMPOSITION_ROW_HEIGHT_MM = 22;
const COMPOSITION_PICTURE_ROW_HEIGHT_MM = 28;
const PICTURE_EQUATION_ROW_HEIGHT_MM = 32;
const NUMBER_SENSE_ROW_HEIGHT_MM = 16;
const MENTAL_BASIC_ROW_HEIGHT_MM = 17;
const MENTAL_COMPLEX_ROW_HEIGHT_MM = 20;
const APPLICATION_MIN_ROW_HEIGHT_MM = 30;
const APPLICATION_MAX_ROW_HEIGHT_MM = 39;

function createSeededRandom(seed: number): RandomSource {
  let state = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % 2147483647 : 1;
  if (state === 0) state = 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomInt(random: RandomSource, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function shuffle<T>(items: T[], random: RandomSource): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_WORKSHEET_QUESTIONS, Math.trunc(value))) : 0;
}

function normalizeRatio(value: number, max = 100): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(max, Math.trunc(value))) : 0;
}

export function normalizeReinforcementConfig(config: Partial<ReinforcementConfig> = {}): ReinforcementConfig {
  const dailyQuestionCount = Number.isFinite(config.dailyQuestionCount)
    ? Math.max(MIN_WORKSHEET_QUESTIONS, Math.min(MAX_WORKSHEET_QUESTIONS, Math.trunc(config.dailyQuestionCount as number)))
    : DEFAULT_REINFORCEMENT_CONFIG.dailyQuestionCount;
  let neighborRatio = normalizeRatio(config.neighborRatio ?? DEFAULT_REINFORCEMENT_CONFIG.neighborRatio);
  let compareRatio = normalizeRatio(config.compareRatio ?? DEFAULT_REINFORCEMENT_CONFIG.compareRatio);
  let applicationRatio = normalizeRatio(config.applicationRatio ?? DEFAULT_REINFORCEMENT_CONFIG.applicationRatio, MAX_APPLICATION_RATIO);
  let overflow = Math.max(0, neighborRatio + compareRatio + applicationRatio - 100);
  for (const key of ["neighborRatio", "compareRatio", "applicationRatio"] as const) {
    const amount = key === "neighborRatio" ? neighborRatio : key === "compareRatio" ? compareRatio : applicationRatio;
    const reduction = Math.min(amount, overflow);
    if (key === "neighborRatio") neighborRatio -= reduction;
    if (key === "compareRatio") compareRatio -= reduction;
    if (key === "applicationRatio") applicationRatio -= reduction;
    overflow -= reduction;
  }
  return { dailyQuestionCount, neighborRatio, compareRatio, applicationRatio, mentalRatio: 100 - neighborRatio - compareRatio - applicationRatio };
}

export function normalizeWorksheetConfig(config: WorksheetConfig): WorksheetConfig {
  const counts = [normalizeCount(config.neighborCount), normalizeCount(config.compareCount), normalizeCount(config.mentalCount), normalizeCount(config.applicationCount ?? 0)];
  let overflow = Math.max(0, counts.reduce((sum, count) => sum + count, 0) - MAX_WORKSHEET_QUESTIONS);
  for (const index of [2, 3, 1, 0]) {
    const reduction = Math.min(counts[index], overflow);
    counts[index] -= reduction;
    overflow -= reduction;
  }
  const theme = WORKSHEET_THEMES.includes(config.theme) ? config.theme : "mixed";
  return { neighborCount: counts[0], compareCount: counts[1], mentalCount: counts[2], applicationCount: counts[3], theme };
}

function buildNeighborQuestions(count: number, random: RandomSource, numberMax: number): NeighborQuestion[] {
  const safeMax = Math.max(3, Math.min(NUMBER_SENSE_MAX, Math.trunc(numberMax)));
  const centers = shuffle(Array.from({ length: safeMax - 2 }, (_, index) => index + 2), random).slice(0, count);
  return centers.map((center, index) => ({ id: "neighbor-" + index, type: "neighbor", section: "neighbor", number: 0, left: center - 1, right: center + 1, answer: center }));
}

function buildCompareQuestions(count: number, random: RandomSource, numberMax: number): CompareQuestion[] {
  const safeMax = Math.max(1, Math.min(NUMBER_SENSE_MAX, Math.trunc(numberMax)));
  if (count <= 0) return [];
  const equal = randomInt(random, 1, safeMax);
  const selected: Array<{ left: number; right: number }> = [{ left: equal, right: equal }];
  const used = new Set([`${equal}:${equal}`]);

  // 每天只需要少量题目，直接抽取不重复数字对，避免构造并打乱完整笛卡尔积。
  let attempts = 0;
  while (selected.length < count && attempts < count * 20) {
    attempts += 1;
    const left = randomInt(random, 1, safeMax);
    const right = randomInt(random, 1, safeMax);
    const key = `${left}:${right}`;
    if (left === right || used.has(key)) continue;
    used.add(key);
    selected.push({ left, right });
  }
  return shuffle(selected, random).map((pair, index) => ({ id: "compare-" + index, type: "compare", section: "compare", number: 0, left: pair.left, right: pair.right, answer: pair.left < pair.right ? "<" : pair.left > pair.right ? ">" : "=" }));
}

function buildMentalCandidates(method: MentalMethod, level: Exclude<MentalLevel, "three-number">, resultMax: number): MentalCandidate[] {
  const candidates: MentalCandidate[] = [];
  const safeMax = Math.max(20, Math.min(200, Math.trunc(resultMax)));
  if (level === "basic") {
    if (method === "make-ten") {
      for (let left = 1; left <= 9; left += 1) for (let right = 1; right <= 9; right += 1) if (left + right > 10 && left + right <= safeMax) candidates.push({ left, operator: "+", right, answer: left + right, level });
    } else {
      for (let left = 11; left <= 19; left += 1) for (let right = 1; right <= 9; right += 1) if (left - right >= 1 && left - right <= safeMax) candidates.push({ left, operator: "-", right, answer: left - right, level });
    }
    return candidates;
  }
  if (level === "two-digit-single") {
    if (method === "make-ten") {
      for (let left = 10; left <= Math.min(99, safeMax); left += 1) for (let right = 1; right <= 9; right += 1) if (left + right <= safeMax && left % 10 + right >= 10) candidates.push({ left, operator: "+", right, answer: left + right, level });
      return candidates;
    }
    for (let left = 10; left <= 99; left += 1) for (let right = 1; right <= 9; right += 1) {
      const answer = left - right;
      const needsBorrow = left % 10 < right;
      const reachesTen = right > left % 10;
      if (answer < 1 || answer > safeMax) continue;
      if (method === "break-ten" && !needsBorrow) continue;
      if (method === "flat-ten" && (!reachesTen || left % 10 === 0)) continue;
      candidates.push({ left, operator: "-", right, answer, level });
    }
    return candidates;
  }
  if (method === "make-ten") {
    for (let left = 10; left <= 99; left += 1) for (let right = 10; right <= 99; right += 1) if (left % 10 + right % 10 >= 10 && left + right <= safeMax) candidates.push({ left, operator: "+", right, answer: left + right, level });
    return candidates;
  }
  for (let left = 20; left <= 99; left += 1) for (let right = 10; right <= left - 10; right += 1) {
    const answer = left - right;
    const needsBorrow = left % 10 < right % 10;
    const reachesTen = right > left % 10;
    if (answer < 10 || answer > safeMax) continue;
    if (method === "break-ten" && !needsBorrow) continue;
    if (method === "flat-ten" && (!reachesTen || left % 10 === 0)) continue;
    candidates.push({ left, operator: "-", right, answer, level });
  }
  return candidates;
}

function buildThreeNumberCandidates(method: MentalMethod, resultMax: number, tripleMinTerm: number): MentalCandidate[] {
  const candidates: MentalCandidate[] = [];
  const safeMax = Math.max(20, Math.min(200, Math.trunc(resultMax)));
  const minTerm = Math.max(1, Math.min(99, Math.trunc(tripleMinTerm)));
  if (method === "make-ten") {
    for (let left = minTerm; left <= 99; left += 1) for (let right = minTerm; right <= 99; right += 1) {
      const intermediate = left + right;
      if (intermediate > safeMax || left % 10 + right % 10 < 10) continue;
      for (let third = minTerm; third < intermediate; third += 1) if (intermediate - third >= 1) candidates.push({ left, operator: "+", right, secondOperator: "-", third, answer: intermediate - third, level: "three-number" });
    }
    return candidates;
  }
  for (let left = minTerm; left <= 99; left += 1) for (let right = minTerm; right <= left; right += 1) {
    const intermediate = left - right;
    const needsBorrow = left % 10 < right % 10;
    const reachesTen = right > left % 10;
    if (method === "break-ten" && !needsBorrow) continue;
    if (method === "flat-ten" && (!reachesTen || left % 10 === 0)) continue;
    for (let third = minTerm; third <= 99; third += 1) if (intermediate + third <= safeMax && intermediate + third >= 1) candidates.push({ left, operator: "-", right, secondOperator: "+", third, answer: intermediate + third, level: "three-number" });
  }
  return candidates;
}

const MENTAL_CANDIDATE_CACHE = new Map<string, readonly MentalCandidate[]>();

function getMentalCandidates(method: MentalMethod, level: MentalLevel, resultMax: number, tripleMinTerm: number): MentalCandidate[] {
  const key = `${method}:${level}:${resultMax}:${level === "three-number" ? tripleMinTerm : 0}`;
  let candidates = MENTAL_CANDIDATE_CACHE.get(key);
  if (!candidates) {
    candidates = level === "three-number"
      ? buildThreeNumberCandidates(method, resultMax, tripleMinTerm)
      : buildMentalCandidates(method, level, resultMax);
    MENTAL_CANDIDATE_CACHE.set(key, candidates);
  }
  return [...candidates];
}

function mentalQuestionKey(candidate: MentalCandidate): string {
  return [candidate.left, candidate.operator, candidate.right, candidate.secondOperator ?? "", candidate.third ?? ""].join(":");
}

function calculateBinary(left: number, operator: "+" | "-", right: number): number {
  return operator === "+" ? left + right : left - right;
}

const MENTAL_DIFFICULTY_ORDER: Record<MentalLevel, number> = { basic: 0, "two-digit-single": 1, "two-digit": 2, "three-number": 3 };

function getMentalDifficultyScore(question: Pick<MentalCandidate, "level" | "left" | "right" | "third">): number {
  if (question.level !== "three-number") return MENTAL_DIFFICULTY_ORDER[question.level];
  return MENTAL_DIFFICULTY_ORDER[question.level] + [question.left, question.right, question.third].filter((term): term is number => term !== undefined && term >= 10).length;
}

function buildMentalQuestions(count: number, theme: WorksheetTheme, random: RandomSource, options: { resultMax: number; binaryShape: MentalBinaryShape; binaryTwoDigitRatio: number; threeNumberRatio: number; tripleMinTerm: number }): MentalQuestion[] {
  if (count <= 0) return [];
  const methods = theme === "mixed" ? MENTAL_METHODS : [theme];
  const threeNumberCount = Math.round(count * Math.max(0, Math.min(1, options.threeNumberRatio)));
  const binaryCount = count - threeNumberCount;
  const twoDigitCount = options.binaryShape === "basic" ? 0 : Math.round(binaryCount * Math.max(0, Math.min(1, options.binaryTwoDigitRatio)));
  const levels: MentalLevel[] = [...Array.from({ length: binaryCount - twoDigitCount }, () => "basic" as const), ...Array.from({ length: twoDigitCount }, () => options.binaryShape), ...Array.from({ length: threeNumberCount }, () => "three-number" as const)];
  const pools = new Map<MentalMethod, Map<MentalLevel, MentalCandidate[]>>();
  methods.forEach((method) => {
    const methodPools = new Map<MentalLevel, MentalCandidate[]>();
    new Set(levels).forEach((level) => methodPools.set(level, shuffle(getMentalCandidates(method, level, options.resultMax, options.tripleMinTerm), random)));
    pools.set(method, methodPools);
  });
  const used = new Set<string>();
  const questions: MentalQuestion[] = [];
  levels.forEach((level, index) => {
    const method = methods[index % methods.length];
    const pool = pools.get(method)?.get(level) ?? [];
    const candidate = pool.find((item) => !used.has(mentalQuestionKey(item))) ?? Array.from(pools.values()).flatMap((map) => map.get(level) ?? []).find((item) => !used.has(mentalQuestionKey(item)));
    if (!candidate) return;
    used.add(mentalQuestionKey(candidate));
    questions.push({ id: "mental-" + index, type: "mental", section: "mental", number: 0, ...candidate, method, presentation: "direct" });
  });
  return questions.sort((left, right) => getMentalDifficultyScore(left) - getMentalDifficultyScore(right)).map((question, index) => ({ ...question, id: "mental-" + index }));
}

export function createWorksheetGuidance(question: MentalQuestion, icon: WorksheetIconKey): WorksheetGuidance | undefined {
  if (question.third !== undefined) return undefined;
  if (question.method === "make-ten") {
    const target = Math.floor(question.left / 10) * 10 + 10;
    const firstPart = target - question.left;
    const secondPart = question.right - firstPart;
    if (firstPart <= 0 || secondPart < 0) return undefined;
    return { icon, splitSource: question.right, split: [firstPart, secondPart], steps: [{ left: question.left, operator: "+", right: firstPart, answer: target }, { left: target, operator: "+", right: secondPart, answer: question.answer }] };
  }
  if (question.method === "break-ten") {
    const baseTen = Math.floor(question.left / 10) * 10;
    const remainder = question.left - baseTen;
    const firstAnswer = baseTen - question.right;
    if (baseTen <= 0 || firstAnswer < 0) return undefined;
    return { icon, splitSource: question.left, split: [baseTen, remainder], steps: [{ left: baseTen, operator: "-", right: question.right, answer: firstAnswer }, { left: firstAnswer, operator: "+", right: remainder, answer: question.answer }] };
  }
  const firstPart = question.left % 10;
  const secondPart = question.right - firstPart;
  const target = question.left - firstPart;
  if (firstPart <= 0 || secondPart < 0) return undefined;
  return { icon, splitSource: question.right, split: [firstPart, secondPart], steps: [{ left: question.left, operator: "-", right: firstPart, answer: target }, { left: target, operator: "-", right: secondPart, answer: question.answer }] };
}

function createMethodLesson(method: MentalMethod): WorksheetMethodExample {
  const source = method === "make-ten"
    ? { left: 8, operator: "+" as const, right: 5, icon: "apple" as const, title: "凑十法" }
    : { left: 13, operator: "-" as const, right: 5, icon: method === "break-ten" ? "star" as const : "heart" as const, title: method === "break-ten" ? "破十法" : "平十法" };
  const answer = calculateBinary(source.left, source.operator, source.right);
  const question: MentalQuestion = { id: `lesson-${method}`, type: "mental", section: "mental", number: 0, left: source.left, operator: source.operator, right: source.right, answer, method, level: "basic", presentation: "guided" };
  const guidance = createWorksheetGuidance(question, source.icon);
  if (!guidance) throw new Error(`无法生成 ${method} 方法示例`);
  return { method, title: source.title, original: { left: source.left, operator: source.operator, right: source.right, answer }, splitSource: guidance.splitSource, split: guidance.split, steps: guidance.steps, icon: source.icon };
}

function createNumberBondLesson(): WorksheetMethodExample {
  return { method: "number-bond", title: "数的组成", original: { left: 5, operator: "+", right: 3, answer: 8 }, splitSource: 8, split: [5, 3], steps: [{ left: 5, operator: "+", right: 3, answer: 8 }], icon: "apple" };
}

function createPictureEquationLesson(): WorksheetMethodExample {
  return { method: "picture-equation", title: "看图列式", original: { left: 4, operator: "+", right: 3, answer: 7 }, splitSource: 7, split: [4, 3], steps: [{ left: 4, operator: "+", right: 3, answer: 7 }], icon: "star" };
}

function buildNumberBondQuestions(): NumberBondQuestion[] {
  const entries: Array<Pick<NumberBondQuestion, "mode" | "whole" | "knownPart" | "icon">> = [
    { mode: "picture-split", whole: 5, knownPart: 1, icon: "apple" }, { mode: "picture-split", whole: 6, knownPart: 2, icon: "star" }, { mode: "picture-split", whole: 7, knownPart: 3, icon: "heart" }, { mode: "picture-split", whole: 8, knownPart: 5, icon: "fish" },
    { mode: "split", whole: 8, knownPart: 1, icon: "apple" }, { mode: "split", whole: 9, knownPart: 2, icon: "star" }, { mode: "split", whole: 10, knownPart: 3, icon: "heart" }, { mode: "split", whole: 10, knownPart: 6, icon: "fish" }, { mode: "split", whole: 10, knownPart: 7, icon: "pineapple" }, { mode: "split", whole: 9, knownPart: 4, icon: "apple" }, { mode: "split", whole: 8, knownPart: 3, icon: "star" }, { mode: "split", whole: 7, knownPart: 5, icon: "heart" },
    { mode: "compose", whole: 6, knownPart: 2, icon: "fish" }, { mode: "compose", whole: 7, knownPart: 4, icon: "pineapple" }, { mode: "compose", whole: 8, knownPart: 5, icon: "apple" }, { mode: "compose", whole: 9, knownPart: 6, icon: "star" }, { mode: "compose", whole: 10, knownPart: 4, icon: "heart" }, { mode: "compose", whole: 10, knownPart: 7, icon: "fish" }, { mode: "compose", whole: 10, knownPart: 8, icon: "pineapple" }, { mode: "compose", whole: 10, knownPart: 9, icon: "apple" },
  ];
  return entries.map((entry, index) => ({ id: "foundation-1-composition-" + index, type: "number-bond", section: "composition", number: 0, ...entry, answer: entry.whole - entry.knownPart }));
}

function buildFoundationMental(method: MentalMethod): MentalQuestion[] {
  const values: Record<MentalMethod, Array<[number, number]>> = {
    "make-ten": [[8, 5], [7, 6], [9, 4], [6, 8], [8, 7], [9, 6], [5, 7], [4, 8], [6, 9], [7, 5], [9, 5], [8, 4], [6, 7], [5, 9], [4, 7], [3, 9], [8, 6], [7, 8], [9, 7], [6, 6]],
    "break-ten": [[13, 5], [12, 4], [14, 6], [15, 7], [16, 8], [17, 9], [13, 6], [14, 8], [15, 9], [12, 5], [16, 7], [17, 8], [18, 9], [13, 4], [14, 5], [15, 6], [16, 9], [17, 7], [18, 8], [19, 9]],
    "flat-ten": [[13, 5], [14, 6], [15, 7], [16, 8], [17, 9], [12, 4], [13, 6], [14, 8], [15, 9], [16, 7], [17, 8], [18, 9], [12, 5], [13, 4], [14, 5], [15, 6], [16, 9], [17, 7], [18, 8], [19, 9]],
  };
  return values[method].map(([left, right], index) => {
    const operator = method === "make-ten" ? "+" : "-";
    const answer = calculateBinary(left, operator, right);
    const question: MentalQuestion = { id: `foundation-${method}-${index}`, type: "mental", section: "mental", number: 0, left, operator, right, answer, method, level: "basic", presentation: index < 2 ? "guided" : "direct" };
    return index < 2 ? { ...question, guidance: createWorksheetGuidance(question, method === "make-ten" ? "apple" : method === "break-ten" ? "star" : "heart") } : question;
  });
}

function buildPictureEquationQuestions(): PictureEquationQuestion[] {
  const values: Array<[WorksheetIconKey, number, number, "+" | "-"]> = [["apple", 3, 2, "+"], ["star", 5, 3, "+"], ["heart", 8, 2, "-"], ["fish", 9, 4, "-"], ["pineapple", 4, 5, "+"], ["apple", 10, 3, "-"]];
  return values.map(([icon, leftCount, rightCount, operator], index) => ({ id: "foundation-5-picture-" + index, type: "picture-equation", section: "picture-equation", number: 0, icon, leftCount, rightCount, operator, answer: calculateBinary(leftCount, operator, rightCount) }));
}

interface ApplicationTemplate {
  id: string;
  scenario: ApplicationScenario;
  icon: WorksheetIconKey;
  unit: string;
  make: (a: number, b: number, c?: number) => { prompt: string; operators: ("+" | "-")[]; answer: number; steps: WorksheetGuidedStep[]; equation: string; operands: number[] } | undefined;
}

function oneStepStory(prompt: string, a: number, operator: "+" | "-", b: number) {
  const answer = calculateBinary(a, operator, b);
  if (answer < 0 || answer > NUMBER_SENSE_MAX) return undefined;
  return { prompt, operators: [operator], answer, steps: [{ left: a, operator, right: b, answer }], equation: `${a} ${operator} ${b} =`, operands: [a, b] };
}

function twoStepStory(prompt: string, a: number, firstOperator: "+" | "-", b: number, secondOperator: "+" | "-", c?: number) {
  if (c === undefined) return undefined;
  const middle = calculateBinary(a, firstOperator, b);
  const answer = calculateBinary(middle, secondOperator, c);
  if (middle < 0 || middle > NUMBER_SENSE_MAX || answer < 0 || answer > NUMBER_SENSE_MAX) return undefined;
  return {
    prompt,
    operators: [firstOperator, secondOperator],
    answer,
    steps: [{ left: a, operator: firstOperator, right: b, answer: middle }, { left: middle, operator: secondOperator, right: c, answer }],
    equation: `${a} ${firstOperator} ${b} ${secondOperator} ${c} =`,
    operands: [a, b, c],
  };
}

const APPLICATION_TEMPLATES: readonly ApplicationTemplate[] = [
  { id: "mario-mushrooms", scenario: "combine", icon: "mushroom", unit: "个", make: (a, b) => oneStepStory(`马里奥找到 ${a} 个蘑菇，路易吉又带来 ${b} 个。一共有多少个蘑菇？`, a, "+", b) },
  { id: "coin-boxes", scenario: "combine", icon: "coin", unit: "枚", make: (a, b) => oneStepStory(`两个金币箱分别装着 ${a} 枚和 ${b} 枚金币。合起来有多少枚？`, a, "+", b) },
  { id: "library-books", scenario: "combine", icon: "book", unit: "本", make: (a, b) => oneStepStory(`故事架上有 ${a} 本书，绘本架上有 ${b} 本。两个书架共有多少本？`, a, "+", b) },
  { id: "playground-balls", scenario: "combine", icon: "ball", unit: "个", make: (a, b) => oneStepStory(`红筐里有 ${a} 个球，蓝筐里有 ${b} 个球。两个筐共有多少个球？`, a, "+", b) },
  { id: "castle-blocks", scenario: "increase", icon: "block", unit: "块", make: (a, b) => oneStepStory(`城堡已经搭了 ${a} 块积木，又添上 ${b} 块。现在用了多少块？`, a, "+", b) },
  { id: "party-balloons", scenario: "increase", icon: "balloon", unit: "个", make: (a, b) => oneStepStory(`教室里挂好 ${a} 个气球，又挂上 ${b} 个。现在有多少个气球？`, a, "+", b) },
  { id: "garden-flowers", scenario: "increase", icon: "flower", unit: "朵", make: (a, b) => oneStepStory(`花圃里开了 ${a} 朵花，今天又开 ${b} 朵。现在有多少朵？`, a, "+", b) },
  { id: "draw-stars", scenario: "increase", icon: "star", unit: "颗", make: (a, b) => oneStepStory(`画纸上原有 ${a} 颗星星，又画了 ${b} 颗。一共有多少颗？`, a, "+", b) },
  { id: "mario-spends-coins", scenario: "decrease", icon: "coin", unit: "枚", make: (a, b) => oneStepStory(`马里奥收集了 ${a} 枚金币，换道具用掉 ${b} 枚。还剩多少枚？`, a, "-", b) },
  { id: "fish-swim-away", scenario: "decrease", icon: "fish", unit: "条", make: (a, b) => oneStepStory(`池塘里有 ${a} 条小鱼，游走了 ${b} 条。还剩多少条？`, a, "-", b) },
  { id: "borrow-books", scenario: "decrease", icon: "book", unit: "本", make: (a, b) => oneStepStory(`书架上有 ${a} 本书，小朋友借走 ${b} 本。还剩多少本？`, a, "-", b) },
  { id: "floating-balloons", scenario: "remain", icon: "balloon", unit: "个", make: (a, b) => oneStepStory(`手里有 ${a} 个气球，飞走了 ${b} 个。手里还剩多少个？`, a, "-", b) },
  { id: "share-cookies", scenario: "remain", icon: "cookie", unit: "块", make: (a, b) => oneStepStory(`盘子里有 ${a} 块饼干，分给朋友 ${b} 块。还剩多少块？`, a, "-", b) },
  { id: "eat-apples", scenario: "remain", icon: "apple", unit: "个", make: (a, b) => oneStepStory(`果篮里有 ${a} 个苹果，吃掉 ${b} 个。还剩多少个？`, a, "-", b) },
  { id: "luigi-more-coins", scenario: "compare-more", icon: "coin", unit: "枚", make: (a, b) => oneStepStory(`马里奥有 ${a} 枚金币，路易吉比他多 ${b} 枚。路易吉有多少枚？`, a, "+", b) },
  { id: "blue-more-balloons", scenario: "compare-more", icon: "balloon", unit: "个", make: (a, b) => oneStepStory(`红气球有 ${a} 个，蓝气球比红气球多 ${b} 个。蓝气球有多少个？`, a, "+", b) },
  { id: "picture-books-more", scenario: "compare-more", icon: "book", unit: "本", make: (a, b) => oneStepStory(`故事书有 ${a} 本，绘本比故事书多 ${b} 本。绘本有多少本？`, a, "+", b) },
  { id: "boo-fewer-blocks", scenario: "compare-less", icon: "block", unit: "块", make: (a, b) => oneStepStory(`酷霸王 Jr. 有 ${a} 块积木，Boo 比他少 ${b} 块。Boo 有多少块？`, a, "-", b) },
  { id: "yellow-fewer-flowers", scenario: "compare-less", icon: "flower", unit: "朵", make: (a, b) => oneStepStory(`红花有 ${a} 朵，黄花比红花少 ${b} 朵。黄花有多少朵？`, a, "-", b) },
  { id: "small-plate-cookies", scenario: "compare-less", icon: "cookie", unit: "块", make: (a, b) => oneStepStory(`大盘里有 ${a} 块饼干，小盘比大盘少 ${b} 块。小盘有多少块？`, a, "-", b) },
  { id: "mushroom-two-step", scenario: "two-step", icon: "mushroom", unit: "个", make: (a, b, c) => twoStepStory(`马里奥先找到 ${a} 个蘑菇，又找到 ${b} 个，送给路易吉 ${c} 个。还剩多少个？`, a, "+", b, "-", c) },
  { id: "coin-two-step", scenario: "two-step", icon: "coin", unit: "枚", make: (a, b, c) => twoStepStory(`马里奥原有 ${a} 枚金币，过关得到 ${b} 枚，换道具用掉 ${c} 枚。现在有多少枚？`, a, "+", b, "-", c) },
  { id: "book-two-step", scenario: "two-step", icon: "book", unit: "本", make: (a, b, c) => twoStepStory(`书架上有 ${a} 本书，借走 ${b} 本，又还回 ${c} 本。现在有多少本？`, a, "-", b, "+", c) },
  { id: "ball-two-step", scenario: "two-step", icon: "ball", unit: "个", make: (a, b, c) => twoStepStory(`球筐里有 ${a} 个球，拿走 ${b} 个，又放回 ${c} 个。现在有多少个？`, a, "-", b, "+", c) },
  { id: "cookie-two-step", scenario: "two-step", icon: "cookie", unit: "块", make: (a, b, c) => twoStepStory(`盒里有 ${a} 块饼干，上午吃掉 ${b} 块，下午又吃掉 ${c} 块。还剩多少块？`, a, "-", b, "-", c) },
  { id: "flower-two-step", scenario: "two-step", icon: "flower", unit: "朵", make: (a, b, c) => twoStepStory(`花圃里有 ${a} 朵红花、${b} 朵黄花，又开了 ${c} 朵白花。一共有多少朵？`, a, "+", b, "+", c) },
  { id: "block-two-step", scenario: "two-step", icon: "block", unit: "块", make: (a, b, c) => twoStepStory(`积木盒里有 ${a} 块，又放入 ${b} 块，搭城堡用了 ${c} 块。还剩多少块？`, a, "+", b, "-", c) },
  { id: "fish-two-step", scenario: "two-step", icon: "fish", unit: "条", make: (a, b, c) => twoStepStory(`池塘里有 ${a} 条鱼，游走 ${b} 条，又游来 ${c} 条。现在有多少条？`, a, "-", b, "+", c) },
];

function buildApplicationQuestions(count: number, blueprint: ReinforcementDayBlueprint, random: RandomSource, idPrefix: string): ApplicationQuestion[] {
  if (count <= 0) return [];
  const questions: ApplicationQuestion[] = [];
  const used = new Set<string>();
  const usedTemplates = new Set<string>();
  const wantsTwoStep = blueprint.applicationLevel === "two-step";
  let attempts = 0;
  while (questions.length < count && attempts < count * 100) {
    attempts += 1;
    const templatePool = wantsTwoStep && (questions.length % 2 === 0 || blueprint.stageDay >= 21) ? APPLICATION_TEMPLATES.filter((template) => template.scenario === "two-step") : APPLICATION_TEMPLATES.filter((template) => template.scenario !== "two-step");
    const unusedTemplates = templatePool.filter((template) => !usedTemplates.has(template.id));
    const candidates = unusedTemplates.length > 0 ? unusedTemplates : templatePool;
    const template = candidates[Math.floor(random() * candidates.length)];
    const max = blueprint.resultMax <= 20 ? 9 : blueprint.resultMax <= 50 ? 35 : Math.min(99, blueprint.resultMax - 1);
    const a = blueprint.applicationLevel === "picture" ? randomInt(random, 2, Math.min(9, max)) : randomInt(random, Math.max(3, Math.floor(max * 0.35)), max);
    const b = blueprint.applicationLevel === "picture" ? randomInt(random, 1, Math.min(8, max)) : randomInt(random, 1, Math.max(2, Math.floor(max * 0.35)));
    const c = wantsTwoStep ? randomInt(random, 1, Math.max(2, Math.min(a + b - 1, Math.floor(max * 0.3)))) : undefined;
    const result = template.make(a, b, c);
    if (!result || result.answer > blueprint.resultMax || result.steps.some((step) => step.answer < 0 || step.answer > blueprint.resultMax)) continue;
    const key = template.scenario + ":" + result.operands.join(",");
    if (used.has(key)) continue;
    used.add(key);
    usedTemplates.add(template.id);
    questions.push({ id: `${idPrefix}-application-${questions.length}`, type: "application", section: "application", number: 0, scenario: template.scenario, prompt: result.prompt, icon: template.icon, unit: template.unit, operands: result.operands, operators: result.operators, equation: result.equation, steps: result.steps, answer: result.answer, level: result.steps.length > 1 ? "two-step" : blueprint.applicationLevel === "picture" ? "picture" : "one-step", picture: blueprint.applicationLevel === "picture" });
  }
  return questions;
}

function buildFoundationApplications(): ApplicationQuestion[] {
  const entries: ReadonlyArray<{ templateId: string; a: number; b: number }> = [
    { templateId: "mario-mushrooms", a: 3, b: 2 }, { templateId: "fish-swim-away", a: 7, b: 2 }, { templateId: "party-balloons", a: 4, b: 3 }, { templateId: "borrow-books", a: 9, b: 4 }, { templateId: "luigi-more-coins", a: 5, b: 2 }, { templateId: "yellow-fewer-flowers", a: 8, b: 3 }, { templateId: "playground-balls", a: 4, b: 3 }, { templateId: "share-cookies", a: 10, b: 6 },
  ] as const;
  return entries.map(({ templateId, a, b }, index) => {
    const template = APPLICATION_TEMPLATES.find((item) => item.id === templateId);
    const result = template?.make(a, b);
    if (!template || !result) throw new Error(`无法生成基础应用题 ${templateId}`);
    return { id: "foundation-5-application-" + index, type: "application", section: "application", number: 0, scenario: template.scenario, level: "picture", prompt: result.prompt, icon: template.icon, unit: template.unit, operands: result.operands, operators: result.operators, equation: result.equation, steps: result.steps, answer: result.answer, picture: true };
  });
}

function assignNumbers(sections: readonly WorksheetSection[], pages: readonly WorksheetPrintPage[]): { sections: readonly WorksheetSection[]; pages: readonly WorksheetPrintPage[] } {
  const pageQuestions = pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
  const numbered = new Map(pageQuestions.map((question, index) => [question.id, { ...question, number: index + 1 } as WorksheetQuestion]));
  const numberedSections = sections.map((section) => ({ ...section, questions: section.questions.map((question) => numbered.get(question.id) ?? question) }));
  const numberedPages = pages.map((page) => ({ ...page, sections: page.sections.map((section) => ({ ...section, questions: section.questions.map((question) => numbered.get(question.id) ?? question) })) }));
  return { sections: numberedSections, pages: numberedPages };
}

interface LayoutBlock {
  type: WorksheetPageSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
  columns: 1 | 2 | 3 | 4;
  rowHeightMm: number;
}

function chunk<T>(items: readonly T[], size: number): readonly T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function sectionBlocks(section: WorksheetSection): LayoutBlock[] {
  if (section.type === "composition") {
    const questions = section.questions.filter((question): question is NumberBondQuestion => question.type === "number-bond");
    const pictureQuestions = questions.filter((question) => question.mode === "picture-split");
    const numberQuestions = questions.filter((question) => question.mode !== "picture-split");
    return [
      ...chunk(pictureQuestions, 2).map((row) => ({ type: "composition" as const, title: section.title, questions: row, columns: 2 as const, rowHeightMm: COMPOSITION_PICTURE_ROW_HEIGHT_MM })),
      ...chunk(numberQuestions, 4).map((row) => ({ type: "composition" as const, title: section.title, questions: row, columns: 4 as const, rowHeightMm: COMPOSITION_ROW_HEIGHT_MM })),
    ];
  }
  if (section.type === "picture-equation") return chunk(section.questions, 2).map((questions) => ({ type: "picture-equation", title: section.title, questions, columns: 2, rowHeightMm: PICTURE_EQUATION_ROW_HEIGHT_MM }));
  if (section.type === "application") {
    // 单栏应用题按总题数共享行高，既保证八题能放进一页，也让题少时获得更多书写空间。
    const rowHeightMm = Math.max(APPLICATION_MIN_ROW_HEIGHT_MM, Math.min(APPLICATION_MAX_ROW_HEIGHT_MM, Math.floor((PAGE_BODY_HEIGHT_MM - SECTION_TITLE_HEIGHT_MM) / section.questions.length)));
    return chunk(section.questions, 1).map((questions) => ({ type: "application", title: section.title, questions, columns: 1, rowHeightMm }));
  }
  if (section.type !== "mental") return [];
  const mental = section.questions.filter((question): question is MentalQuestion => question.type === "mental");
  const blocks: LayoutBlock[] = [];
  const guided = mental.filter((question) => question.presentation === "guided");
  if (guided.length > 0) blocks.push(...chunk(guided, 2).map((questions) => ({ type: "guided" as const, title: "看图算一算", questions, columns: 2 as const, rowHeightMm: 51 })));
  const directMental = mental.filter((question) => question.presentation !== "guided");
  const hasComplexQuestion = directMental.some((question) => question.level === "two-digit" || question.level === "three-number");
  const columns: 2 | 3 = hasComplexQuestion ? 2 : 3;
  const rowHeightMm = hasComplexQuestion ? MENTAL_COMPLEX_ROW_HEIGHT_MM : MENTAL_BASIC_ROW_HEIGHT_MM;

  // 同一练习区只使用一套列基线，避免难度切换时出现孤行和答案线跳动。
  blocks.push(...chunk(directMental, columns).map((questions) => ({ type: "mental" as const, title: section.title, questions, columns, rowHeightMm })));
  return blocks;
}

function numberSenseBlocks(sections: readonly WorksheetSection[]): LayoutBlock[] {
  const neighbor = sections.find((section) => section.type === "neighbor")?.questions ?? [];
  const compare = sections.find((section) => section.type === "compare")?.questions ?? [];
  const rows = Math.max(Math.ceil(neighbor.length / 2), Math.ceil(compare.length / 2));
  if (rows === 0) return [];

  // 两类数感题共用一次列定义，余数行也不会重新扩成整页宽度。
  const questions = Array.from({ length: rows }, (_, row) => [
    ...neighbor.slice(row * 2, row * 2 + 2),
    ...compare.slice(row * 2, row * 2 + 2),
  ]).flat();
  return [{ type: "number-sense", title: "相邻数", questions, columns: 2, rowHeightMm: NUMBER_SENSE_ROW_HEIGHT_MM * rows }];
}

function composeWorksheetPages(sections: readonly WorksheetSection[], showMethod: boolean): readonly WorksheetPrintPage[] {
  const blocks: LayoutBlock[] = [];
  if (sections.some((section) => section.type === "neighbor" || section.type === "compare")) blocks.push(...numberSenseBlocks(sections));
  sections.filter((section) => section.type !== "neighbor" && section.type !== "compare").forEach((section) => blocks.push(...sectionBlocks(section)));
  const firstPageHeights = [showMethod ? METHOD_HEIGHT_MM : 0];
  for (let index = 0; index < blocks.length; index += 1) {
    const needsTitle = index === 0 || blocks[index - 1].type !== blocks[index].type;
    firstPageHeights.push(firstPageHeights[index] + blocks[index].rowHeightMm + (needsTitle ? SECTION_TITLE_HEIGHT_MM : 0));
  }
  const secondPageHeights = Array.from({ length: blocks.length + 1 }, () => 0);
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const sharedTitle = index < blocks.length - 1 && blocks[index].type === blocks[index + 1].type ? SECTION_TITLE_HEIGHT_MM : 0;
    secondPageHeights[index] = blocks[index].rowHeightMm + SECTION_TITLE_HEIGHT_MM + secondPageHeights[index + 1] - sharedTitle;
  }
  const onePageHeight = firstPageHeights[blocks.length];
  let preferredBreak = -1;
  if (onePageHeight > PAGE_BODY_HEIGHT_MM) {
    // 两页内容采用约 57:43 的高度分配，避免第二页只留下少量应用题。
    let bestScore = Number.POSITIVE_INFINITY;
    for (let index = 1; index < blocks.length; index += 1) {
      const firstHeight = firstPageHeights[index];
      const secondHeight = secondPageHeights[index];
      if (firstHeight > PAGE_BODY_HEIGHT_MM || secondHeight > PAGE_BODY_HEIGHT_MM) continue;
      const score = Math.abs(firstHeight / (firstHeight + secondHeight) - 0.57);
      if (score < bestScore) {
        bestScore = score;
        preferredBreak = index;
      }
    }
  }
  const pages: Array<{ showMethod: boolean; sections: WorksheetPageSection[]; usedHeightMm: number }> = [{ showMethod, sections: [], usedHeightMm: showMethod ? METHOD_HEIGHT_MM : 0 }];
  const started = new Set<WorksheetPageSectionType>();
  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const block = blocks[blockIndex];
    let page = pages[pages.length - 1];
    if (blockIndex === preferredBreak) {
      page = { showMethod: false, sections: [], usedHeightMm: 0 };
      pages.push(page);
    }
    const hasStarted = started.has(block.type);
    let needsTitle = page.sections.length === 0 || page.sections[page.sections.length - 1].type !== block.type;
    let title = needsTitle ? (hasStarted ? `${block.title}（续）` : block.title) : "";
    let height = block.rowHeightMm + (needsTitle ? SECTION_TITLE_HEIGHT_MM : 0);
    if (page.sections.length > 0 && page.usedHeightMm + height > PAGE_BODY_HEIGHT_MM) {
      page = { showMethod: false, sections: [], usedHeightMm: 0 };
      pages.push(page);
      needsTitle = true;
      title = hasStarted ? `${block.title}（续）` : block.title;
      height = block.rowHeightMm + SECTION_TITLE_HEIGHT_MM;
    }
    page.sections.push({ type: block.type, title, questions: block.questions, columns: block.columns, continued: hasStarted, rowHeightMm: block.rowHeightMm });
    page.usedHeightMm += height;
    started.add(block.type);
  }
  const pageCount = pages.length;
  return pages.map((page, index) => ({ pageNumber: index + 1, pageCount, showMethod: page.showMethod, sections: page.sections, questionCount: page.sections.reduce((sum, section) => sum + section.questions.length, 0), usedHeightMm: page.usedHeightMm }));
}

function createDailyWorksheet(args: { id: string; day: number; stage: WorksheetStage; stageDay: number; phase: number; phaseTitle: string; phaseSummary: string; title: string; objective: string; sections: readonly WorksheetSection[]; theme: WorksheetTheme; methodLesson?: WorksheetMethodExample; plan: WorksheetDayPlan }): DailyWorksheet {
  const rawPages = composeWorksheetPages(args.sections, Boolean(args.methodLesson));
  const numbered = assignNumbers(args.sections, rawPages);
  const total = numbered.sections.reduce((sum, section) => sum + section.questions.length, 0);
  return { ...args, sections: numbered.sections, pages: numbered.pages, total };
}

function foundationDayPlan(index: number): WorksheetDayPlan {
  const titles = ["数的组成与分解", "凑十法", "破十法", "平十法", "看图列式与一步应用题"];
  const objectives = ["认识一个数可以分成两部分", "把一个数拆开，先凑成 10", "把十几拆成 10 和几再减", "把减数拆开，先减到整十", "从图中看懂数量变化并列式"];
  return { stageDay: index, day: index, stage: "foundation", phase: 0, phaseTitle: "基础引导", phaseSummary: "5 天固定精选内容，先看方法再进入强化练习。", startDay: 1, endDay: 5, title: titles[index - 1], objective: objectives[index - 1], resultMax: 20, numberMax: 20, binaryShape: "basic", binaryTwoDigitRatio: 0, threeNumberRatio: 0, tripleMinTerm: 1, applicationLevel: "picture", methodTheme: index === 1 || index === 2 ? "make-ten" : index === 3 ? "break-ten" : index === 4 ? "flat-ten" : "mixed" };
}

function buildFoundationDay(index: number): DailyWorksheet {
  const plan = foundationDayPlan(index);
  if (index === 1) return createDailyWorksheet({ id: "foundation-1", day: 1, stage: "foundation", stageDay: 1, phase: 0, phaseTitle: plan.phaseTitle, phaseSummary: plan.phaseSummary, title: plan.title, objective: plan.objective, sections: [{ type: "composition", title: "数的组成与分解", questions: buildNumberBondQuestions() }, { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(4, createSeededRandom(101), 20) }, { type: "compare", title: "比大小", questions: buildCompareQuestions(4, createSeededRandom(102), 20) }], theme: "make-ten", methodLesson: createNumberBondLesson(), plan });
  if (index <= 4) {
    const method = index === 2 ? "make-ten" : index === 3 ? "break-ten" : "flat-ten";
    const mental = buildFoundationMental(method).map((question) => ({ ...question, id: `foundation-${index}-${question.id}` }));
    return createDailyWorksheet({ id: `foundation-${index}`, day: index, stage: "foundation", stageDay: index, phase: 0, phaseTitle: plan.phaseTitle, phaseSummary: plan.phaseSummary, title: plan.title, objective: plan.objective, sections: [{ type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(4, createSeededRandom(200 + index), 20) }, { type: "compare", title: "比大小", questions: buildCompareQuestions(4, createSeededRandom(210 + index), 20) }, { type: "mental", title: "计算式", questions: mental }], theme: method, methodLesson: createMethodLesson(method), plan });
  }
  const mental = buildFoundationMental("make-ten").slice(0, 6).map((question, index) => ({ ...question, id: `foundation-5-mental-${index}`, presentation: "direct" as const, guidance: undefined }));
  return createDailyWorksheet({ id: "foundation-5", day: 5, stage: "foundation", stageDay: 5, phase: 0, phaseTitle: plan.phaseTitle, phaseSummary: plan.phaseSummary, title: plan.title, objective: plan.objective, sections: [{ type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(4, createSeededRandom(501), 20) }, { type: "compare", title: "比大小", questions: buildCompareQuestions(4, createSeededRandom(502), 20) }, { type: "mental", title: "计算式", questions: mental }, { type: "picture-equation", title: "看图列式", questions: buildPictureEquationQuestions() }, { type: "application", title: "一步应用题", questions: buildFoundationApplications() }], theme: "mixed", methodLesson: createPictureEquationLesson(), plan });
}

export function getReinforcementDayBlueprint(stageDay: number): ReinforcementDayBlueprint {
  const safe = Math.max(1, Math.min(REINFORCEMENT_WORKSHEET_DAYS, Math.trunc(stageDay)));
  return REINFORCEMENT_BLUEPRINTS[safe - 1];
}

function getPhase(stageDay: number): { phase: number; title: string; summary: string } {
  if (stageDay <= 5) return { phase: 1, title: "20 以内·方法迁移", summary: "把 5 天基础方法放进更多题目和简单情境。" };
  if (stageDay <= 10) return { phase: 2, title: "50 以内·进退位", summary: "逐步加入两位数和一位数的计算。" };
  if (stageDay <= 15) return { phase: 3, title: "100 以内·数量关系", summary: "练习两位数进退位和比多比少。" };
  if (stageDay <= 20) return { phase: 4, title: "100 以内·三个数", summary: "练习两个连续的加减步骤。" };
  return { phase: 5, title: "200 以内·综合强化", summary: "逐步扩大数值范围，完成连续计算和两步应用题。" };
}

export function getWorksheetDayPlan(day: number): WorksheetDayPlan {
  const safe = Number.isFinite(day) ? Math.max(1, Math.min(WORKSHEET_PLAN_DAYS, Math.trunc(day))) : 1;
  if (safe <= FOUNDATION_WORKSHEET_DAYS) return foundationDayPlan(safe);
  const stageDay = safe - FOUNDATION_WORKSHEET_DAYS;
  const blueprint = getReinforcementDayBlueprint(stageDay);
  const phase = getPhase(stageDay);
  return { ...blueprint, day: safe, stage: "reinforcement", phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, startDay: FOUNDATION_WORKSHEET_DAYS + 1, endDay: WORKSHEET_PLAN_DAYS };
}

function allocateCounts(config: ReinforcementConfig, stageDay: number): { neighbor: number; compare: number; mental: number; application: number } {
  const categories = [{ key: "neighbor" as const, ratio: config.neighborRatio }, { key: "compare" as const, ratio: config.compareRatio }, { key: "mental" as const, ratio: config.mentalRatio }, { key: "application" as const, ratio: config.applicationRatio }];
  const raw = categories.map((category) => ({ ...category, value: config.dailyQuestionCount * category.ratio / 100 }));
  const counts = new Map(raw.map((category) => [category.key, Math.floor(category.value)]));
  let remaining = config.dailyQuestionCount - raw.reduce((sum, category) => sum + Math.floor(category.value), 0);
  const priority = categories.map((_, index) => categories[(index + stageDay - 1) % categories.length].key);
  while (remaining > 0) {
    const candidates = raw.filter((category) => category.key !== "application" || (counts.get("application") ?? 0) < MAX_APPLICATION_QUESTIONS);
    candidates.sort((left, right) => right.value - Math.floor(right.value) - (left.value - Math.floor(left.value)) || priority.indexOf(left.key) - priority.indexOf(right.key));
    const target = candidates[0];
    counts.set(target.key, (counts.get(target.key) ?? 0) + 1);
    remaining -= 1;
  }
  return { neighbor: counts.get("neighbor") ?? 0, compare: counts.get("compare") ?? 0, mental: counts.get("mental") ?? 0, application: counts.get("application") ?? 0 };
}

export function getReinforcementQuestionCounts(config: Partial<ReinforcementConfig> = {}, stageDay = 1) {
  return allocateCounts(normalizeReinforcementConfig(config), stageDay);
}

function buildReinforcementDay(stageDay: number, seed: number, configInput: Partial<ReinforcementConfig>): DailyWorksheet {
  const config = normalizeReinforcementConfig(configInput);
  const blueprint = getReinforcementDayBlueprint(stageDay);
  const phase = getPhase(stageDay);
  const plan: WorksheetDayPlan = { ...blueprint, day: FOUNDATION_WORKSHEET_DAYS + stageDay, stage: "reinforcement", phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, startDay: FOUNDATION_WORKSHEET_DAYS + 1, endDay: WORKSHEET_PLAN_DAYS };
  const random = createSeededRandom(seed);
  const counts = allocateCounts(config, stageDay);
  const sections: WorksheetSection[] = [
    { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(counts.neighbor, random, blueprint.numberMax) },
    { type: "compare", title: "比大小", questions: buildCompareQuestions(counts.compare, random, blueprint.numberMax) },
    { type: "mental", title: "计算式", questions: buildMentalQuestions(counts.mental, blueprint.methodTheme, random, { resultMax: blueprint.resultMax, binaryShape: blueprint.binaryShape, binaryTwoDigitRatio: blueprint.binaryTwoDigitRatio, threeNumberRatio: blueprint.threeNumberRatio, tripleMinTerm: blueprint.tripleMinTerm }) },
    { type: "application", title: "应用题", questions: buildApplicationQuestions(counts.application, blueprint, random, `practice-${stageDay}`) },
  ];
  return createDailyWorksheet({ id: `practice-${stageDay}`, day: FOUNDATION_WORKSHEET_DAYS + stageDay, stage: "reinforcement", stageDay, phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, title: blueprint.title, objective: blueprint.objective, sections, theme: blueprint.methodTheme, plan });
}

export function generateWorksheet(config: WorksheetConfig, seed = 1): { sections: readonly WorksheetSection[]; pages: readonly WorksheetPrintPage[]; total: number; theme: WorksheetTheme } {
  const normalized = normalizeWorksheetConfig(config);
  const total = normalized.neighborCount + normalized.compareCount + normalized.mentalCount + (normalized.applicationCount ?? 0);
  const sections: WorksheetSection[] = [
    { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(normalized.neighborCount, createSeededRandom(seed), 100) },
    { type: "compare", title: "比大小", questions: buildCompareQuestions(normalized.compareCount, createSeededRandom(seed + 1), 100) },
    { type: "mental", title: "计算式", questions: buildMentalQuestions(normalized.mentalCount, normalized.theme, createSeededRandom(seed + 2), { resultMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.5, threeNumberRatio: 0, tripleMinTerm: 1 }) },
    { type: "application", title: "应用题", questions: buildApplicationQuestions(normalized.applicationCount ?? 0, getReinforcementDayBlueprint(15), createSeededRandom(seed + 3), "worksheet") },
  ];
  const numbered = assignNumbers(sections, composeWorksheetPages(sections, false));
  return { sections: numbered.sections, pages: numbered.pages, total, theme: normalized.theme };
}

export function generateDailyWorksheet(day: number, seed = 1, overrides: Partial<WorksheetConfig> = {}): DailyWorksheet {
  const safeDay = Number.isFinite(day) ? Math.max(1, Math.min(WORKSHEET_PLAN_DAYS, Math.trunc(day))) : 1;
  if (safeDay <= FOUNDATION_WORKSHEET_DAYS) return buildFoundationDay(safeDay);
  const base = DEFAULT_REINFORCEMENT_CONFIG;
  const hasCountOverrides = overrides.neighborCount !== undefined || overrides.compareCount !== undefined || overrides.mentalCount !== undefined || overrides.applicationCount !== undefined;
  const total = hasCountOverrides ? (overrides.neighborCount ?? 0) + (overrides.compareCount ?? 0) + (overrides.mentalCount ?? 0) + (overrides.applicationCount ?? 0) : base.dailyQuestionCount;
  const safeTotal = Math.max(MIN_WORKSHEET_QUESTIONS, Math.min(MAX_WORKSHEET_QUESTIONS, total));
  const custom = hasCountOverrides ? { dailyQuestionCount: safeTotal, neighborRatio: ((overrides.neighborCount ?? 0) / safeTotal) * 100, compareRatio: ((overrides.compareCount ?? 0) / safeTotal) * 100, applicationRatio: ((overrides.applicationCount ?? 0) / safeTotal) * 100 } : { ...base, dailyQuestionCount: safeTotal };
  return buildReinforcementDay(safeDay - FOUNDATION_WORKSHEET_DAYS, seed, custom);
}

export function generateWorksheetPlan(seed = 1, config: Partial<ReinforcementConfig> = {}): WorksheetPlan {
  const reinforcementConfig = normalizeReinforcementConfig({ ...DEFAULT_REINFORCEMENT_CONFIG, ...config });
  const foundationDays = Array.from({ length: FOUNDATION_WORKSHEET_DAYS }, (_, index) => buildFoundationDay(index + 1));
  const reinforcementDays = Array.from({ length: REINFORCEMENT_WORKSHEET_DAYS }, (_, index) => buildReinforcementDay(index + 1, seed + (index + 1) * 1009, reinforcementConfig));
  const days = [...foundationDays, ...reinforcementDays];
  return { days, foundationDays, reinforcementDays, reinforcementConfig, totalDays: days.length, totalQuestions: days.reduce((sum, day) => sum + day.total, 0) };
}

export function getExportDays(plan: WorksheetPlan, includeFoundation: boolean): readonly DailyWorksheet[] {
  return includeFoundation ? plan.days : plan.reinforcementDays;
}
