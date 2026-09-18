export const MAX_WORKSHEET_QUESTIONS = 30;
export const MIN_WORKSHEET_QUESTIONS = 10;
export const FOUNDATION_WORKSHEET_DAYS = 5;
export const REINFORCEMENT_WORKSHEET_DAYS = 25;
export const MONTH_ONE_DAYS = FOUNDATION_WORKSHEET_DAYS + REINFORCEMENT_WORKSHEET_DAYS;
export const MONTH_TWO_DAYS = 30;
export const WORKSHEET_PLAN_DAYS = MONTH_ONE_DAYS + MONTH_TWO_DAYS;
export const NUMBER_SENSE_MAX = 200;
export const MAX_APPLICATION_QUESTIONS = 8;
export const MAX_APPLICATION_RATIO = 25;
export const MONTH_TWO_CORE_QUESTION_COUNT = 24;
export const MONTH_TWO_GROUPING_QUESTION_COUNT = 3;
export const MONTH_TWO_LIFE_MATH_QUESTION_COUNT = 3;
export const WORKSHEET_PAPER_PADDING_TOP_MM = 4;
export const WORKSHEET_PAPER_HEADER_HEIGHT_MM = 28;
export const WORKSHEET_PAGE_BODY_HEIGHT_MM = 252;

export const MENTAL_METHODS = ["make-ten", "break-ten", "flat-ten"] as const;
export type MentalMethod = (typeof MENTAL_METHODS)[number];
export type WorksheetTheme = MentalMethod | "mixed";
export const WORKSHEET_THEMES = [...MENTAL_METHODS, "mixed"] as const;
export const WORKSHEET_THEME_SEQUENCE = MENTAL_METHODS;

export type WorksheetMonth = 1 | 2;
export type MonthOneGenerationMode = "legacy" | "low-repeat";
export type MentalLevel = "basic" | "two-digit-single" | "two-digit" | "three-number";
export type MentalBinaryShape = "basic" | "two-digit-single" | "two-digit";
export type WorksheetStage = "foundation" | "reinforcement";
export type WorksheetQuestionPresentation = "direct" | "guided";
export type WorksheetIconKey = "apple" | "pineapple" | "heart" | "star" | "fish" | "mushroom" | "coin" | "flower" | "block" | "ball" | "book" | "cookie" | "balloon";
export type WorksheetSectionType = "composition" | "neighbor" | "tens-split" | "mental" | "vertical" | "missing-number" | "grouping" | "life-math" | "picture-equation" | "application";
export type WorksheetPageSectionType = "composition" | "neighbor" | "tens-split" | "guided" | "mental" | "vertical" | "missing-number" | "grouping" | "life-math" | "picture-equation" | "application";

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

export interface DailyWorksheetOverrides extends Partial<WorksheetConfig> {
  monthTwoQuestionCount?: number;
  monthOneMode?: MonthOneGenerationMode;
  monthOneUsedStorylineIds?: readonly string[];
  monthOneUsedQuestionSignatures?: readonly string[];
}

export interface WorksheetGenerationOptions {
  monthOneMode?: MonthOneGenerationMode;
}

export interface ReinforcementConfig {
  dailyQuestionCount: number;
  neighborRatio: number;
  compareRatio: number;
  applicationRatio: number;
  mentalRatio: number;
}

export const DEFAULT_REINFORCEMENT_CONFIG: ReinforcementConfig = {
  dailyQuestionCount: 22,
  neighborRatio: 15,
  compareRatio: 25,
  applicationRatio: 20,
  mentalRatio: 40,
};

export interface MonthTwoConfig {
  dailyQuestionCount: number;
  coreRatio: 80;
  groupingRatio: 10;
  lifeMathRatio: 10;
}

export const DEFAULT_MONTH_TWO_CONFIG: MonthTwoConfig = {
  dailyQuestionCount: 22,
  coreRatio: 80,
  groupingRatio: 10,
  lifeMathRatio: 10,
};

export const DEFAULT_WORKSHEET_CONFIG: WorksheetConfig = {
  neighborCount: 5,
  compareCount: 8,
  mentalCount: 11,
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

export type MonthTwoArithmeticFocus = "review" | "vertical-addition" | "vertical-subtraction" | "mixed-200" | "missing-number" | "assessment";
export type VerticalCalculationMode = "mixed" | "addition" | "subtraction";
export type GroupingMode = "repeated-addition" | "multiply" | "sharing" | "mixed";
export type LifeMathTopic = "money" | "time" | "measurement" | "mixed";
export type LifeMathStorylineStage = "money-addition" | "money-subtraction" | "time" | "measurement";

const LIFE_MATH_ICON_SEQUENCES: Record<LifeMathStorylineStage, readonly WorksheetIconKey[]> = {
  "money-addition": ["coin", "heart", "star", "book", "balloon", "apple", "cookie", "flower", "block", "ball", "fish", "mushroom", "pineapple"],
  "money-subtraction": ["block", "coin", "book", "apple", "heart", "balloon", "cookie", "star", "flower", "ball", "fish", "mushroom", "pineapple"],
  time: ["book", "ball", "star", "flower", "mushroom", "block", "balloon", "heart", "cookie", "fish", "apple", "pineapple", "coin"],
  measurement: ["block", "balloon", "star", "book", "flower", "mushroom", "ball", "heart", "cookie", "fish", "apple", "pineapple", "coin"],
};

export interface LifeMathStoryline {
  id: string;
  topic: Exclude<LifeMathTopic, "mixed">;
  stage: LifeMathStorylineStage;
  icon: WorksheetIconKey;
  template: string;
}

export interface MonthTwoDayBlueprint extends ReinforcementDayBlueprint {
  monthDay: number;
  arithmeticFocus: MonthTwoArithmeticFocus;
  verticalMode: VerticalCalculationMode;
  verticalCarryRatio: number;
  verticalBorrowRatio: number;
  groupingMode: GroupingMode;
  lifeMathTopic: LifeMathTopic;
}

const MONTH_TWO_BLUEPRINTS: readonly MonthTwoDayBlueprint[] = [
  { monthDay: 1, stageDay: 1, title: "衔接复习·数位再认识", objective: "复习 100～200 以内加减和个位、十位关系", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.35, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "review", verticalMode: "mixed", verticalCarryRatio: 0.25, verticalBorrowRatio: 0.25, groupingMode: "repeated-addition", lifeMathTopic: "money" },
  { monthDay: 2, stageDay: 2, title: "衔接复习·进位回顾", objective: "在 100 以内稳定完成进位加法", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.35, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "review", verticalMode: "addition", verticalCarryRatio: 0.35, verticalBorrowRatio: 0.2, groupingMode: "repeated-addition", lifeMathTopic: "money" },
  { monthDay: 3, stageDay: 3, title: "衔接复习·退位回顾", objective: "在 100 以内稳定完成退位减法", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.35, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "review", verticalMode: "subtraction", verticalCarryRatio: 0.2, verticalBorrowRatio: 0.35, groupingMode: "repeated-addition", lifeMathTopic: "money" },
  { monthDay: 4, stageDay: 4, title: "衔接复习·连续计算", objective: "复习三个数连续加减和数量变化", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.4, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "review", verticalMode: "mixed", verticalCarryRatio: 0.35, verticalBorrowRatio: 0.35, groupingMode: "repeated-addition", lifeMathTopic: "money" },
  { monthDay: 5, stageDay: 5, title: "衔接复习·小结", objective: "综合复习第一个月的加减方法", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.45, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "review", verticalMode: "mixed", verticalCarryRatio: 0.4, verticalBorrowRatio: 0.4, groupingMode: "repeated-addition", lifeMathTopic: "money" },
  { monthDay: 6, stageDay: 6, title: "竖式加法·不进位", objective: "对齐数位完成两位数竖式加法", resultMax: 150, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.35, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-addition", verticalMode: "addition", verticalCarryRatio: 0.1, verticalBorrowRatio: 0, groupingMode: "multiply", lifeMathTopic: "time" },
  { monthDay: 7, stageDay: 7, title: "竖式加法·个位进位", objective: "在个位进位中保持数位对齐", resultMax: 150, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.35, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-addition", verticalMode: "addition", verticalCarryRatio: 0.35, verticalBorrowRatio: 0, groupingMode: "multiply", lifeMathTopic: "time" },
  { monthDay: 8, stageDay: 8, title: "竖式加法·连续进位", objective: "练习连续进位加法并检查结果", resultMax: 180, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.4, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-addition", verticalMode: "addition", verticalCarryRatio: 0.55, verticalBorrowRatio: 0, groupingMode: "multiply", lifeMathTopic: "time" },
  { monthDay: 9, stageDay: 9, title: "竖式加法·应用", objective: "用竖式加法解决数量合并问题", resultMax: 180, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.45, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-addition", verticalMode: "addition", verticalCarryRatio: 0.65, verticalBorrowRatio: 0, groupingMode: "multiply", lifeMathTopic: "time" },
  { monthDay: 10, stageDay: 10, title: "竖式加法·小结", objective: "综合完成两位数竖式加法", resultMax: 200, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.5, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-addition", verticalMode: "addition", verticalCarryRatio: 0.7, verticalBorrowRatio: 0, groupingMode: "multiply", lifeMathTopic: "time" },
  { monthDay: 11, stageDay: 11, title: "竖式减法·不退位", objective: "对齐数位完成两位数竖式减法", resultMax: 150, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.4, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-subtraction", verticalMode: "subtraction", verticalCarryRatio: 0, verticalBorrowRatio: 0.1, groupingMode: "sharing", lifeMathTopic: "measurement" },
  { monthDay: 12, stageDay: 12, title: "竖式减法·个位退位", objective: "在个位退位中保持计算顺序", resultMax: 150, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.4, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-subtraction", verticalMode: "subtraction", verticalCarryRatio: 0, verticalBorrowRatio: 0.35, groupingMode: "sharing", lifeMathTopic: "measurement" },
  { monthDay: 13, stageDay: 13, title: "竖式减法·连续退位", objective: "练习连续退位减法并检查差", resultMax: 180, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.45, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-subtraction", verticalMode: "subtraction", verticalCarryRatio: 0, verticalBorrowRatio: 0.55, groupingMode: "sharing", lifeMathTopic: "measurement" },
  { monthDay: 14, stageDay: 14, title: "竖式减法·应用", objective: "用竖式减法解决剩下和相差问题", resultMax: 180, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.5, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-subtraction", verticalMode: "subtraction", verticalCarryRatio: 0, verticalBorrowRatio: 0.65, groupingMode: "sharing", lifeMathTopic: "measurement" },
  { monthDay: 15, stageDay: 15, title: "竖式减法·小结", objective: "综合完成两位数竖式减法", resultMax: 200, numberMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.5, tripleMinTerm: 10, applicationLevel: "one-step", methodTheme: "mixed", arithmeticFocus: "vertical-subtraction", verticalMode: "subtraction", verticalCarryRatio: 0, verticalBorrowRatio: 0.7, groupingMode: "sharing", lifeMathTopic: "measurement" },
  { monthDay: 16, stageDay: 16, title: "200 以内·加减综合", objective: "把进位和退位迁移到 200 以内", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.55, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "mixed-200", verticalMode: "mixed", verticalCarryRatio: 0.55, verticalBorrowRatio: 0.55, groupingMode: "mixed", lifeMathTopic: "money" },
  { monthDay: 17, stageDay: 17, title: "200 以内·连续计算", objective: "完成 200 以内三个数连续加减", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.65, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "mixed-200", verticalMode: "mixed", verticalCarryRatio: 0.6, verticalBorrowRatio: 0.6, groupingMode: "mixed", lifeMathTopic: "money" },
  { monthDay: 18, stageDay: 18, title: "200 以内·进退位", objective: "稳定处理连续计算中的进退位", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.7, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "mixed-200", verticalMode: "mixed", verticalCarryRatio: 0.65, verticalBorrowRatio: 0.65, groupingMode: "mixed", lifeMathTopic: "money" },
  { monthDay: 19, stageDay: 19, title: "200 以内·两步应用", objective: "用连续加减解决两步数量问题", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "mixed-200", verticalMode: "mixed", verticalCarryRatio: 0.7, verticalBorrowRatio: 0.7, groupingMode: "mixed", lifeMathTopic: "money" },
  { monthDay: 20, stageDay: 20, title: "200 以内·小结", objective: "综合完成 200 以内加减混合练习", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.8, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "mixed-200", verticalMode: "mixed", verticalCarryRatio: 0.7, verticalBorrowRatio: 0.7, groupingMode: "mixed", lifeMathTopic: "money" },
  { monthDay: 21, stageDay: 21, title: "未知数·填空", objective: "在加减算式中找到缺少的数", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.65, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "missing-number", verticalMode: "mixed", verticalCarryRatio: 0.6, verticalBorrowRatio: 0.6, groupingMode: "mixed", lifeMathTopic: "time" },
  { monthDay: 22, stageDay: 22, title: "未知数·关系", objective: "根据已知结果反推算式中的未知数", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.7, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "missing-number", verticalMode: "mixed", verticalCarryRatio: 0.65, verticalBorrowRatio: 0.65, groupingMode: "mixed", lifeMathTopic: "time" },
  { monthDay: 23, stageDay: 23, title: "未知数·应用", objective: "用未知数和数量关系解决应用题", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.75, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "missing-number", verticalMode: "mixed", verticalCarryRatio: 0.7, verticalBorrowRatio: 0.7, groupingMode: "mixed", lifeMathTopic: "time" },
  { monthDay: 24, stageDay: 24, title: "未知数·连续算式", objective: "在连续加减中保持中间结果正确", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.8, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "missing-number", verticalMode: "mixed", verticalCarryRatio: 0.7, verticalBorrowRatio: 0.7, groupingMode: "mixed", lifeMathTopic: "time" },
  { monthDay: 25, stageDay: 25, title: "未知数·小结", objective: "综合完成填未知数和两步应用题", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.85, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "missing-number", verticalMode: "mixed", verticalCarryRatio: 0.75, verticalBorrowRatio: 0.75, groupingMode: "mixed", lifeMathTopic: "time" },
  { monthDay: 26, stageDay: 26, title: "综合测评·加减", objective: "综合检查 200 以内加减和数量关系", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.9, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "assessment", verticalMode: "mixed", verticalCarryRatio: 0.75, verticalBorrowRatio: 0.75, groupingMode: "mixed", lifeMathTopic: "mixed" },
  { monthDay: 27, stageDay: 27, title: "综合测评·混合", objective: "混合完成横式、竖式和应用题", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.9, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "assessment", verticalMode: "mixed", verticalCarryRatio: 0.8, verticalBorrowRatio: 0.8, groupingMode: "mixed", lifeMathTopic: "mixed" },
  { monthDay: 28, stageDay: 28, title: "综合测评·查漏", objective: "根据不同题型检查计算准确性", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 0.95, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "assessment", verticalMode: "mixed", verticalCarryRatio: 0.8, verticalBorrowRatio: 0.8, groupingMode: "mixed", lifeMathTopic: "mixed" },
  { monthDay: 29, stageDay: 29, title: "综合测评·迁移", objective: "把加减方法迁移到乘除和生活情境", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "assessment", verticalMode: "mixed", verticalCarryRatio: 0.8, verticalBorrowRatio: 0.8, groupingMode: "mixed", lifeMathTopic: "mixed" },
  { monthDay: 30, stageDay: 30, title: "综合测评·第二个月总结", objective: "完成第二个月数学能力综合测评", resultMax: 200, numberMax: 200, binaryShape: "two-digit", binaryTwoDigitRatio: 1, threeNumberRatio: 1, tripleMinTerm: 10, applicationLevel: "two-step", methodTheme: "mixed", arithmeticFocus: "assessment", verticalMode: "mixed", verticalCarryRatio: 0.85, verticalBorrowRatio: 0.85, groupingMode: "mixed", lifeMathTopic: "mixed" },
];

function createLifeMathStorylines(stage: LifeMathStorylineStage, topic: Exclude<LifeMathTopic, "mixed">, prefix: string, templates: readonly string[]): LifeMathStoryline[] {
  const icons = LIFE_MATH_ICON_SEQUENCES[stage];
  return templates.map((template, index) => ({ id: `${prefix}-${index + 1}`, topic, stage, icon: icons[index % icons.length], template }));
}

export const LIFE_MATH_STORYLINES: readonly LifeMathStoryline[] = [
  ...createLifeMathStorylines("money-addition", "money", "money-add", [
    "存钱罐里原来有 {a} 元，又放入 {b} 元，现在一共有多少元？",
    "小朋友手里有 {a} 元，爷爷又给了 {b} 元，现在有多少元？",
    "妈妈给小朋友 {a} 元，爸爸又给了 {b} 元，一共有多少元？",
    "小朋友攒了 {a} 元，又收到 {b} 元零花钱，现在有多少元？",
    "钱包里有 {a} 元，家人再放入 {b} 元，现在有多少元？",
    "小朋友有 {a} 元，过生日又得到 {b} 元，现在有多少元？",
    "盒子里有 {a} 元，又找到 {b} 元硬币，现在有多少元？",
    "小朋友原来有 {a} 元，完成家务得到 {b} 元，现在有多少元？",
    "存钱罐中有 {a} 元，又存进 {b} 元，现在有多少元？",
    "小朋友有 {a} 元，姐姐送给他 {b} 元，现在有多少元？",
    "口袋里有 {a} 元，又装进 {b} 元，现在一共有多少元？",
    "小朋友带着 {a} 元，妈妈又给了 {b} 元，现在有多少元？",
    "小朋友收集了 {a} 元硬币，又收集 {b} 元，现在有多少元？",
    "零钱盒里有 {a} 元，又放入 {b} 元，现在有多少元？",
    "小朋友原来有 {a} 元，卖掉旧书得到 {b} 元，现在有多少元？",
    "小朋友有 {a} 元，今天得到 {b} 元奖励，现在有多少元？",
    "钱包中有 {a} 元，又放进 {b} 元压岁钱，现在有多少元？",
    "小朋友有 {a} 元，家长补给他 {b} 元，现在有多少元？",
    "小朋友收银盒里有 {a} 元，又收到 {b} 元，现在有多少元？",
    "小朋友的储蓄卡里有 {a} 元，又存入 {b} 元，现在有多少元？",
  ]),
  ...createLifeMathStorylines("money-subtraction", "money", "money-subtract", [
    "小朋友带了 {a} 元，买彩笔花了 {b} 元，还剩多少元？",
    "存钱罐里有 {a} 元，取出 {b} 元后，还剩多少元？",
    "小朋友有 {a} 元，买一本书花了 {b} 元，还剩多少元？",
    "小朋友有 {a} 元，买水果花了 {b} 元，还剩多少元？",
    "钱包里有 {a} 元，买橡皮花了 {b} 元，还剩多少元？",
    "小朋友有 {a} 元，借给同学 {b} 元，还剩多少元？",
    "盒子里有 {a} 元，拿出 {b} 元买东西，还剩多少元？",
    "小朋友有 {a} 元，乘车花了 {b} 元，还剩多少元？",
    "零花钱有 {a} 元，买贴纸花了 {b} 元，还剩多少元？",
    "小朋友带着 {a} 元，买文具用去 {b} 元，还剩多少元？",
    "储蓄罐有 {a} 元，取出 {b} 元买礼物，还剩多少元？",
    "小朋友有 {a} 元，买面包花了 {b} 元，还剩多少元？",
    "钱夹里有 {a} 元，买一盒彩笔用了 {b} 元，还剩多少元？",
    "小朋友有 {a} 元，送出 {b} 元后，还剩多少元？",
    "小朋友带了 {a} 元，买小书签花了 {b} 元，还剩多少元？",
    "零钱盒里有 {a} 元，拿出 {b} 元买贴纸，还剩多少元？",
    "小朋友有 {a} 元，买一块橡皮用了 {b} 元，还剩多少元？",
    "钱包中有 {a} 元，买一支铅笔花了 {b} 元，还剩多少元？",
    "小朋友有 {a} 元，给公交卡充了 {b} 元，还剩多少元？",
    "小朋友有 {a} 元，花掉 {b} 元买小礼物，还剩多少元？",
  ]),
  ...createLifeMathStorylines("time", "time", "time", [
    "小朋友从 {h}:00 开始读书，到 {endTime} 结束，一共读了多少分钟？",
    "活动从 {h}:00 开始，经过 {durationText} 结束，经过了多少分钟？",
    "课程在 {h}:00 开始，到 {endTime} 下课，经过了多少分钟？",
    "小朋友 {h}:00 开始画画，{endTime} 画完，一共用了多少分钟？",
    "游戏从 {h}:00 开始，到 {endTime} 结束，玩了多少分钟？",
    "故事会 {h}:00 开始，{endTime} 结束，故事会进行了多少分钟？",
    "小朋友在 {h}:00 开始做手工，{endTime} 做完，用了多少分钟？",
    "体育活动从 {h}:00 到 {endTime}，一共进行了多少分钟？",
    "小朋友 {h}:00 开始搭积木，经过 {durationText} 完成，搭了多少分钟？",
    "午间阅读从 {h}:00 开始，到 {endTime} 结束，有多少分钟？",
    "小朋友 {h}:00 出发，{endTime} 到达，一共用了多少分钟？",
    "一场小表演从 {h}:00 开始，{endTime} 结束，表演了多少分钟？",
    "小朋友 {h}:00 开始练习写字，{endTime} 停笔，练习了多少分钟？",
    "绘画课从 {h}:00 上课，到 {endTime} 下课，一共多少分钟？",
    "小朋友 {h}:00 开始整理玩具，经过 {durationText} 整理好，用了多少分钟？",
    "动画片从 {h}:00 播放，到 {endTime} 播完，播放了多少分钟？",
    "小朋友 {h}:00 开始浇花，{endTime} 完成，浇花用了多少分钟？",
    "音乐活动从 {h}:00 开始，{endTime} 结束，持续了多少分钟？",
    "小朋友 {h}:00 开始拼图，经过 {durationText} 拼好，用了多少分钟？",
    "早餐时间从 {h}:00 到 {endTime}，一共用了多少分钟？",
    "小朋友 {h}:00 开始看书，{endTime} 合上书，看了多少分钟？",
    "老师在 {h}:00 开始讲故事，{endTime} 讲完，讲了多少分钟？",
    "小朋友 {h}:00 开始跳绳，经过 {durationText} 结束，跳了多少分钟？",
    "一次科学观察从 {h}:00 到 {endTime}，进行了多少分钟？",
    "小朋友 {h}:00 开始喂鱼，{endTime} 完成，用了多少分钟？",
    "手工课 {h}:00 开始，经过 {durationText} 结束，手工课有多少分钟？",
    "小朋友 {h}:00 开始练琴，{endTime} 结束，练了多少分钟？",
    "户外活动从 {h}:00 到 {endTime}，一共是多少分钟？",
    "小朋友 {h}:00 开始折纸，经过 {durationText} 折好，用了多少分钟？",
    "一节阅读课从 {h}:00 开始，到 {endTime} 结束，持续多少分钟？",
    "小朋友 {h}:00 开始收拾书包，{endTime} 收拾好，用了多少分钟？",
    "故事阅读在 {h}:00 开始，经过 {durationText} 结束，阅读了多少分钟？",
    "小朋友 {h}:00 开始观察小植物，{endTime} 记录完成，观察了多少分钟？",
    "课堂练习从 {h}:00 开始，到 {endTime} 结束，练习了多少分钟？",
    "小朋友 {h}:00 开始做拼贴画，经过 {durationText} 完成，用了多少分钟？",
  ]),
  ...createLifeMathStorylines("measurement", "measurement", "measurement", [
    "一根绳子长 {a} 厘米，剪去 {b} 厘米，还剩多少厘米？",
    "彩带长 {a} 厘米，用掉 {b} 厘米，还剩多少厘米？",
    "红色积木长 {a} 厘米，蓝色积木比它短 {b} 厘米，蓝色积木长多少厘米？",
    "一支铅笔长 {a} 厘米，削去 {b} 厘米，还剩多少厘米？",
    "纸条长 {a} 厘米，剪下 {b} 厘米，还剩多少厘米？",
    "小木棒长 {a} 厘米，截去 {b} 厘米，还剩多少厘米？",
    "蓝色丝带长 {a} 厘米，红色丝带比它短 {b} 厘米，红色丝带长多少厘米？",
    "一条线段长 {a} 厘米，去掉 {b} 厘米，还剩多少厘米？",
    "小朋友量得桌边长 {a} 厘米，另一边短 {b} 厘米，另一边长多少厘米？",
    "一根吸管长 {a} 厘米，剪掉 {b} 厘米，还剩多少厘米？",
    "卡纸条长 {a} 厘米，用去 {b} 厘米，还剩多少厘米？",
    "黄色积木长 {a} 厘米，绿色积木比它短 {b} 厘米，绿色积木长多少厘米？",
    "一根毛线长 {a} 厘米，剪下 {b} 厘米，还剩多少厘米？",
    "尺子量出书签长 {a} 厘米，剪短 {b} 厘米后是多少厘米？",
    "小木条长 {a} 厘米，锯掉 {b} 厘米，还剩多少厘米？",
    "一张纸带长 {a} 厘米，去掉 {b} 厘米，还剩多少厘米？",
    "红绳长 {a} 厘米，蓝绳比红绳短 {b} 厘米，蓝绳长多少厘米？",
    "小朋友有一条 {a} 厘米长的彩带，用去 {b} 厘米，还剩多少厘米？",
    "一根吸管长 {a} 厘米，另一根比它短 {b} 厘米，另一根长多少厘米？",
    "纸板边长 {a} 厘米，剪掉 {b} 厘米后，还剩多少厘米？",
    "一条布带长 {a} 厘米，裁去 {b} 厘米，还剩多少厘米？",
    "黄色绳子长 {a} 厘米，绿色绳子比它短 {b} 厘米，绿色绳子长多少厘米？",
    "小朋友量得画纸长 {a} 厘米，剪去 {b} 厘米，还剩多少厘米？",
    "一根纸管长 {a} 厘米，去掉 {b} 厘米，还剩多少厘米？",
    "小木尺长 {a} 厘米，另一根短 {b} 厘米，另一根长多少厘米？",
  ]),
];

export interface WorksheetDayPlan extends ReinforcementDayBlueprint {
  day: number;
  month: WorksheetMonth;
  monthDay: number;
  stage: WorksheetStage;
  phase: number;
  phaseTitle: string;
  phaseSummary: string;
  startDay: number;
  endDay: number;
  arithmeticFocus?: MonthTwoArithmeticFocus;
  verticalMode?: VerticalCalculationMode;
  verticalCarryRatio?: number;
  verticalBorrowRatio?: number;
  groupingMode?: GroupingMode;
  lifeMathTopic?: LifeMathTopic;
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

export type TensSplitMissing = "left" | "right";

export interface TensSplitQuestion extends BaseQuestion {
  type: "tens-split";
  section: "tens-split";
  whole: number;
  left: number | null;
  right: number | null;
  answer: number;
  missing: TensSplitMissing;
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

export interface VerticalCalculationQuestion extends BaseQuestion {
  type: "vertical-calculation";
  section: "vertical";
  left: number;
  right: number;
  operator: "+" | "-";
  answer: number;
  carry: boolean;
  borrow: boolean;
}

export type MissingNumberPosition = "left" | "right" | "result";

export interface MissingNumberQuestion extends BaseQuestion {
  type: "missing-number";
  section: "missing-number";
  left: number | null;
  right: number | null;
  operator: "+" | "-";
  result: number | null;
  missing: MissingNumberPosition;
  answer: number;
}

export interface GroupingQuestion extends BaseQuestion {
  type: "grouping";
  section: "grouping";
  mode: "repeated-addition" | "multiply" | "sharing";
  groupCount: number;
  perGroup: number;
  total: number;
  operator: "+" | "×" | "÷";
  answer: number;
  icon: WorksheetIconKey;
}

export interface LifeMathQuestion extends BaseQuestion {
  type: "life-math";
  section: "life-math";
  storylineId: string;
  topic: Exclude<LifeMathTopic, "mixed">;
  prompt: string;
  icon: WorksheetIconKey;
  unit: string;
  operands: readonly number[];
  operators: readonly ("+" | "-")[];
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
  storylineId?: string;
  storylineFamily?: string;
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

export type WorksheetQuestion = NeighborQuestion | TensSplitQuestion | NumberBondQuestion | PictureEquationQuestion | MentalQuestion | VerticalCalculationQuestion | MissingNumberQuestion | GroupingQuestion | LifeMathQuestion | ApplicationQuestion;

export interface WorksheetSection {
  type: WorksheetSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
}

export interface WorksheetPageSection {
  type: WorksheetPageSectionType;
  title: string;
  questions: readonly WorksheetQuestion[];
  columns: 1 | 2 | 3 | 4 | 5;
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
  month: WorksheetMonth;
  monthDay: number;
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
  monthOneDays: readonly DailyWorksheet[];
  monthTwoDays: readonly DailyWorksheet[];
  reinforcementConfig: ReinforcementConfig;
  monthTwoConfig: MonthTwoConfig;
  monthOneMode: MonthOneGenerationMode;
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

const PAGE_BODY_HEIGHT_MM = WORKSHEET_PAGE_BODY_HEIGHT_MM;
const METHOD_HEIGHT_MM = 40;
const SECTION_TITLE_HEIGHT_MM = 12;
const COMPOSITION_ROW_HEIGHT_MM = 34;
const COMPOSITION_PICTURE_ROW_HEIGHT_MM = 42;
const PICTURE_EQUATION_ROW_HEIGHT_MM = 44;
const NEIGHBOR_ROW_HEIGHT_MM = 24;
const TENS_SPLIT_ROW_HEIGHT_MM = 32;
const MENTAL_BASIC_ROW_HEIGHT_MM = 24;
const MENTAL_COMPLEX_ROW_HEIGHT_MM = 24;
const VERTICAL_ROW_HEIGHT_MM = 34;
const MISSING_NUMBER_ROW_HEIGHT_MM = 24;
const GROUPING_ROW_HEIGHT_MM = 42;
const LIFE_MATH_MIN_ROW_HEIGHT_MM = 30;
const LIFE_MATH_MAX_ROW_HEIGHT_MM = 32;
const APPLICATION_MIN_ROW_HEIGHT_MM = 36;
const APPLICATION_MAX_ROW_HEIGHT_MM = 46;
const GUIDED_ROW_HEIGHT_MM = 58;

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

function tensSplitPairs(whole: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let tens = 10; tens < whole; tens += 10) pairs.push([tens, whole - tens]);
  const takeTen = pairs.find(([left]) => left === 10);
  const tensOnes = pairs.find(([left]) => left === Math.floor(whole / 10) * 10);
  const rest = pairs.filter((pair) => pair !== takeTen && pair !== tensOnes);
  return [...(takeTen ? [takeTen] : []), ...(tensOnes && tensOnes !== takeTen ? [tensOnes] : []), ...rest];
}

function pickTensSplitPair(whole: number, random: RandomSource): [number, number] | undefined {
  const pairs = tensSplitPairs(whole);
  if (pairs.length === 0) return undefined;
  if (pairs.length === 1) return pairs[0];
  const roll = random();
  if (roll < 0.4) return pairs[0];
  if (roll < 0.75) return pairs[1];
  return pairs[randomInt(random, 0, pairs.length - 1)];
}

function buildTensSplitQuestions(count: number, random: RandomSource, numberMax: number): TensSplitQuestion[] {
  const maxWhole = Math.max(11, Math.min(NUMBER_SENSE_MAX, Math.trunc(numberMax)));
  if (count <= 0) return [];
  const questions: TensSplitQuestion[] = [];
  const used = new Set<string>();
  const usedWholes = new Set<number>();
  let attempts = 0;
  while (questions.length < count && attempts < count * 40) {
    attempts += 1;
    const whole = randomInt(random, 11, maxWhole);
    if (usedWholes.has(whole) && usedWholes.size < Math.min(count, maxWhole - 10)) continue;
    const pair = pickTensSplitPair(whole, random);
    if (!pair) continue;
    const missing: TensSplitMissing = random() < 0.7 ? "right" : "left";
    const key = `${whole}:${pair[0]}:${pair[1]}:${missing}`;
    if (used.has(key)) continue;
    used.add(key);
    usedWholes.add(whole);
    questions.push({
      id: "tens-split-" + questions.length,
      type: "tens-split",
      section: "tens-split",
      number: 0,
      whole,
      left: missing === "left" ? null : pair[0],
      right: missing === "right" ? null : pair[1],
      answer: missing === "left" ? pair[0] : pair[1],
      missing,
    });
  }
  return questions;
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

function hasCarry(left: number, right: number) {
  return left % 10 + right % 10 >= 10;
}

function hasBorrow(left: number, right: number) {
  return left % 10 < right % 10;
}

function buildVerticalQuestions(count: number, blueprint: MonthTwoDayBlueprint, random: RandomSource, idPrefix: string): VerticalCalculationQuestion[] {
  const questions: VerticalCalculationQuestion[] = [];
  const used = new Set<string>();
  const maxOperand = Math.max(20, Math.min(99, Math.trunc(blueprint.numberMax)));
  let attempts = 0;
  while (questions.length < count && attempts < count * 300) {
    attempts += 1;
    const operator = blueprint.verticalMode === "addition"
      ? "+"
      : blueprint.verticalMode === "subtraction"
        ? "-"
        : questions.length % 2 === 0 ? "+" : "-";
    let left = randomInt(random, 10, maxOperand);
    let right = randomInt(random, 10, maxOperand);
    if (operator === "-") {
      if (right >= left) [left, right] = [right, left];
      if (right === left) continue;
    }
    const answer = calculateBinary(left, operator, right);
    if (answer < 0 || answer > blueprint.resultMax) continue;
    const carry = operator === "+" && hasCarry(left, right);
    const borrow = operator === "-" && hasBorrow(left, right);
    const targetRatio = operator === "+" ? blueprint.verticalCarryRatio : blueprint.verticalBorrowRatio;
    if (targetRatio > 0 && random() < 0.72 && (targetRatio >= 0.5 ? !(operator === "+" ? carry : borrow) : operator === "+" ? carry : borrow)) continue;
    const key = `${left}:${operator}:${right}`;
    if (used.has(key)) continue;
    used.add(key);
    questions.push({ id: `${idPrefix}-vertical-${questions.length}`, type: "vertical-calculation", section: "vertical", number: 0, left, right, operator, answer, carry, borrow });
  }
  return questions;
}

function buildMissingNumberQuestions(count: number, blueprint: MonthTwoDayBlueprint, random: RandomSource, idPrefix: string): MissingNumberQuestion[] {
  const questions: MissingNumberQuestion[] = [];
  const used = new Set<string>();
  let attempts = 0;
  while (questions.length < count && attempts < count * 300) {
    attempts += 1;
    const missing = (["left", "right", "result"] as const)[questions.length % 3];
    const operator = random() < 0.5 ? "+" : "-";
    let left = randomInt(random, 10, 99);
    let right = randomInt(random, 1, 49);
    let result = calculateBinary(left, operator, right);
    if (operator === "-" && result < 0) {
      [left, right] = [right, left];
      result = calculateBinary(left, operator, right);
    }
    if (result < 0 || result > blueprint.resultMax) continue;
    if (missing === "left") {
      const answer = operator === "+" ? result - right : result + right;
      if (answer < 1 || answer > 99) continue;
      left = answer;
    }
    if (missing === "right") {
      const answer = operator === "+" ? result - left : left - result;
      if (answer < 1 || answer > 99) continue;
      right = answer;
    }
    const answer = missing === "left" ? left : missing === "right" ? right : result;
    const key = `${missing}:${left}:${operator}:${right}:${result}`;
    if (used.has(key)) continue;
    used.add(key);
    questions.push({
      id: `${idPrefix}-missing-${questions.length}`,
      type: "missing-number",
      section: "missing-number",
      number: 0,
      left: missing === "left" ? null : left,
      right: missing === "right" ? null : right,
      operator,
      result: missing === "result" ? null : result,
      missing,
      answer,
    });
  }
  return questions;
}

function resolveGroupingMode(mode: GroupingMode, index: number): Exclude<GroupingMode, "mixed"> {
  if (mode !== "mixed") return mode;
  return (["repeated-addition", "multiply", "sharing"] as const)[index % 3];
}

function buildGroupingQuestions(count: number, blueprint: MonthTwoDayBlueprint, random: RandomSource, idPrefix: string): GroupingQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const mode = resolveGroupingMode(blueprint.groupingMode, index);
    // 分组图要能印在一行里：组数、每组个数都控制在 2～4。
    const groupCount = randomInt(random, 2, 4);
    const perGroup = randomInt(random, 2, 4);
    const total = groupCount * perGroup;
    const icon = WORKSHEET_ICON_KEYS[(blueprint.monthDay + index) % WORKSHEET_ICON_KEYS.length];
    return {
      id: `${idPrefix}-grouping-${index}`,
      type: "grouping" as const,
      section: "grouping" as const,
      number: 0,
      mode,
      groupCount,
      perGroup,
      total,
      operator: mode === "repeated-addition" ? "+" as const : mode === "multiply" ? "×" as const : "÷" as const,
      answer: mode === "sharing" ? perGroup : total,
      icon,
    };
  });
}

function resolveLifeMathTopic(topic: LifeMathTopic, index: number): Exclude<LifeMathTopic, "mixed"> {
  if (topic !== "mixed") return topic;
  return (["money", "time", "measurement"] as const)[index % 3];
}

function resolveLifeMathStorylineStage(topic: Exclude<LifeMathTopic, "mixed">, monthDay: number): LifeMathStorylineStage {
  if (topic === "money") return monthDay >= 16 ? "money-subtraction" : "money-addition";
  return topic;
}

function fillLifeMathTemplate(template: string, values: Record<string, number | string>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function selectLifeMathStorylines(stage: LifeMathStorylineStage, count: number, random: RandomSource, usedStorylineIds: Set<string>, usedIcons: Set<WorksheetIconKey>): LifeMathStoryline[] {
  return Array.from({ length: count }, () => {
    const available = LIFE_MATH_STORYLINES.filter((storyline) => storyline.stage === stage && !usedStorylineIds.has(storyline.id));
    if (available.length === 0) throw new Error(`生活数学故事线不足：${stage}`);
    const distinctIconCandidates = available.filter((storyline) => !usedIcons.has(storyline.icon));
    const candidatePool = distinctIconCandidates.length > 0 ? distinctIconCandidates : available;
    const iconUsage = new Map<WorksheetIconKey, number>();
    LIFE_MATH_STORYLINES.forEach((storyline) => {
      if (storyline.stage === stage && usedStorylineIds.has(storyline.id)) iconUsage.set(storyline.icon, (iconUsage.get(storyline.icon) ?? 0) + 1);
    });
    const icons = [...new Set(candidatePool.map((storyline) => storyline.icon))].sort((left, right) => (iconUsage.get(left) ?? 0) - (iconUsage.get(right) ?? 0) || WORKSHEET_ICON_KEYS.indexOf(left) - WORKSHEET_ICON_KEYS.indexOf(right));
    const targetIcon = icons[0];
    const candidates = candidatePool.filter((storyline) => storyline.icon === targetIcon);
    const storyline = candidates[randomInt(random, 0, candidates.length - 1)];
    usedStorylineIds.add(storyline.id);
    usedIcons.add(storyline.icon);
    return storyline;
  });
}

function buildLifeMathQuestions(count: number, blueprint: MonthTwoDayBlueprint, random: RandomSource, idPrefix: string, usedStorylineIds = new Set<string>()): LifeMathQuestion[] {
  const usedIcons = new Set<WorksheetIconKey>();
  const selected = Array.from({ length: count }, (_, index) => {
    const topic = resolveLifeMathTopic(blueprint.lifeMathTopic, index);
    const stage = resolveLifeMathStorylineStage(topic, blueprint.monthDay);
    return { topic, storyline: selectLifeMathStorylines(stage, 1, random, usedStorylineIds, usedIcons)[0] };
  });
  return selected.map(({ topic, storyline }, index) => {
    const icon = storyline.icon;
    if (topic === "money") {
      const first = randomInt(random, 8, blueprint.monthDay >= 16 ? 35 : 20);
      const second = randomInt(random, 1, Math.min(10, first - 1));
      const operator: "+" | "-" = storyline.stage === "money-addition" ? "+" : "-";
      const answer = operator === "+" ? first + second : first - second;
      return { id: `${idPrefix}-life-${index}`, type: "life-math", section: "life-math", number: 0, storylineId: storyline.id, topic, prompt: fillLifeMathTemplate(storyline.template, { a: first, b: second }), icon, unit: "元", operands: [first, second], operators: [operator], answer };
    }
    if (topic === "time") {
      const startHour = randomInt(random, 7, 10);
      const duration = random() < 0.5 ? 30 : 60;
      const endTime = duration === 30 ? `${startHour}:30` : `${startHour + 1}:00`;
      return { id: `${idPrefix}-life-${index}`, type: "life-math", section: "life-math", number: 0, storylineId: storyline.id, topic, prompt: fillLifeMathTemplate(storyline.template, { h: startHour, endTime, durationText: duration === 30 ? "半小时" : "1 小时", minutes: duration }), icon, unit: "分钟", operands: [duration], operators: [], answer: duration };
    }
    const length = randomInt(random, 20, blueprint.monthDay >= 16 ? 80 : 50);
    const change = randomInt(random, 5, Math.min(15, length - 1));
    return { id: `${idPrefix}-life-${index}`, type: "life-math", section: "life-math", number: 0, storylineId: storyline.id, topic, prompt: fillLifeMathTemplate(storyline.template, { a: length, b: change }), icon, unit: "厘米", operands: [length, change], operators: ["-"], answer: length - change };
  });
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

type MonthOneStorylineGroup = "add" | "subtract" | "more" | "less";
type MonthOneTwoStepGroup = "plus-minus" | "minus-plus" | "plus-plus" | "minus-minus";

export interface MonthOneApplicationStoryline {
  id: string;
  family: string;
  scenario: ApplicationScenario;
  level: ApplicationLevel;
  icon: WorksheetIconKey;
  unit: string;
  operators: readonly ("+" | "-")[];
  template: string;
}

interface MonthOneStorylineFamilyDefinition {
  family: string;
  icon: WorksheetIconKey;
  unit: string;
  item: string;
  place: string;
  actor: string;
  otherPlace: string;
  recipient: string;
  oneStepGroup: MonthOneStorylineGroup;
  oneStepScenario: Exclude<ApplicationScenario, "two-step">;
  oneStepOperator: "+" | "-";
  twoStepGroup: MonthOneTwoStepGroup;
}

const MONTH_ONE_PICTURE_TEMPLATES: Record<MonthOneStorylineGroup, readonly string[]> = {
  add: [
    "{place}里有 {a}{unit}{item}，又来 {b}{unit}{item}。一共有多少{unit}{item}？",
    "{actor}手里有 {a}{unit}{item}，又得到 {b}{unit}{item}。现在有多少{unit}{item}？",
  ],
  subtract: [
    "{place}里有 {a}{unit}{item}，拿走 {b}{unit}{item}。还剩多少{unit}{item}？",
    "{actor}有 {a}{unit}{item}，送出 {b}{unit}{item}。还剩多少{unit}{item}？",
  ],
  more: [
    "{place}有 {a}{unit}{item}，{otherPlace}比它多 {b}{unit}{item}。{otherPlace}有多少{unit}{item}？",
    "{actor}有 {a}{unit}{item}，{recipient}比他多 {b}{unit}{item}。{recipient}有多少{unit}{item}？",
  ],
  less: [
    "{place}有 {a}{unit}{item}，{otherPlace}比它少 {b}{unit}{item}。{otherPlace}有多少{unit}{item}？",
    "{actor}有 {a}{unit}{item}，{recipient}比他少 {b}{unit}{item}。{recipient}有多少{unit}{item}？",
  ],
};

const MONTH_ONE_ONE_STEP_TEMPLATES: Record<MonthOneStorylineGroup, readonly string[]> = {
  add: [
    "{place}里有 {a}{unit}{item}，又放入 {b}{unit}{item}。现在有多少{unit}{item}？",
    "{actor}先收集了 {a}{unit}{item}，后来又得到 {b}{unit}{item}。一共有多少{unit}{item}？",
    "{place}上午有 {a}{unit}{item}，下午又送来 {b}{unit}{item}。现在有多少{unit}{item}？",
    "{otherPlace}里放着 {a}{unit}{item}，{recipient}又送来 {b}{unit}{item}。现在有多少{unit}{item}？",
    "{place}原来摆着 {a}{unit}{item}，又增加 {b}{unit}{item}。一共摆着多少{unit}{item}？",
    "{actor}做完了 {a}{unit}{item}，又完成了 {b}{unit}{item}。一共完成多少{unit}{item}？",
    "盒子里有 {a}{unit}{item}，旁边又装入 {b}{unit}{item}。盒里共有多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，第二组又增加 {b}{unit}{item}。两组共有多少{unit}{item}？",
  ],
  subtract: [
    "{place}里有 {a}{unit}{item}，拿走 {b}{unit}{item}。现在还剩多少{unit}{item}？",
    "{actor}收集了 {a}{unit}{item}，送给朋友 {b}{unit}{item}。还剩多少{unit}{item}？",
    "{place}原来有 {a}{unit}{item}，用掉 {b}{unit}{item}。还剩多少{unit}{item}？",
    "{otherPlace}里有 {a}{unit}{item}，分出 {b}{unit}{item}。还剩多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，取下 {b}{unit}{item}。现在有多少{unit}{item}？",
    "{actor}做了 {a}{unit}{item}，其中 {b}{unit}{item} 已经送出。还剩多少{unit}{item}？",
    "盒子里装着 {a}{unit}{item}，拿出 {b}{unit}{item}。盒里还剩多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，借给第二组 {b}{unit}{item}。第一组还剩多少{unit}{item}？",
  ],
  more: [
    "{place}有 {a}{unit}{item}，{otherPlace}比它多 {b}{unit}{item}。{otherPlace}有多少{unit}{item}？",
    "{actor}收集了 {a}{unit}{item}，{recipient}比他多 {b}{unit}{item}。{recipient}有多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，第二组比第一组多 {b}{unit}{item}。第二组有多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，旁边的架子多 {b}{unit}{item}。旁边有多少{unit}{item}？",
    "上午完成 {a}{unit}{item}，下午比上午多完成 {b}{unit}{item}。下午完成多少{unit}{item}？",
    "{otherPlace}有 {a}{unit}{item}，{recipient}那里比它多 {b}{unit}{item}。{recipient}有多少{unit}{item}？",
    "小队得到 {a}{unit}{item}，另一队比它多 {b}{unit}{item}。另一队得到多少{unit}{item}？",
    "{actor}画了 {a}{unit}{item}，同伴比他多画 {b}{unit}{item}。同伴画了多少{unit}{item}？",
  ],
  less: [
    "{place}有 {a}{unit}{item}，{otherPlace}比它少 {b}{unit}{item}。{otherPlace}有多少{unit}{item}？",
    "{actor}收集了 {a}{unit}{item}，{recipient}比他少 {b}{unit}{item}。{recipient}有多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，第二组比第一组少 {b}{unit}{item}。第二组有多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，旁边的架子少 {b}{unit}{item}。旁边有多少{unit}{item}？",
    "上午完成 {a}{unit}{item}，下午比上午少完成 {b}{unit}{item}。下午完成多少{unit}{item}？",
    "{otherPlace}有 {a}{unit}{item}，{recipient}那里比它少 {b}{unit}{item}。{recipient}有多少{unit}{item}？",
    "小队得到 {a}{unit}{item}，另一队比它少 {b}{unit}{item}。另一队得到多少{unit}{item}？",
    "{actor}画了 {a}{unit}{item}，同伴比他少画 {b}{unit}{item}。同伴画了多少{unit}{item}？",
  ],
};

const MONTH_ONE_TWO_STEP_TEMPLATES: Record<MonthOneTwoStepGroup, readonly string[]> = {
  "plus-minus": [
    "{place}里有 {a}{unit}{item}，又放入 {b}{unit}{item}，后来拿走 {c}{unit}{item}。还剩多少{unit}{item}？",
    "{actor}收集了 {a}{unit}{item}，又得到 {b}{unit}{item}，送给{recipient} {c}{unit}{item}。还剩多少{unit}{item}？",
    "{otherPlace}原有 {a}{unit}{item}，补充 {b}{unit}{item}，用掉 {c}{unit}{item}。还剩多少{unit}{item}？",
    "上午有 {a}{unit}{item}，下午又送来 {b}{unit}{item}，分出 {c}{unit}{item}。现在有多少{unit}{item}？",
    "盒子里有 {a}{unit}{item}，再装入 {b}{unit}{item}，又拿出 {c}{unit}{item}。盒里还剩多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，增加 {b}{unit}{item}，后来取下 {c}{unit}{item}。现在有多少{unit}{item}？",
  ],
  "minus-plus": [
    "{place}里有 {a}{unit}{item}，拿走 {b}{unit}{item}，后来又放回 {c}{unit}{item}。现在有多少{unit}{item}？",
    "{actor}有 {a}{unit}{item}，送出 {b}{unit}{item}，又得到 {c}{unit}{item}。现在有多少{unit}{item}？",
    "{otherPlace}原有 {a}{unit}{item}，用掉 {b}{unit}{item}，后来补充 {c}{unit}{item}。现在有多少{unit}{item}？",
    "盒子里有 {a}{unit}{item}，取出 {b}{unit}{item}，又装入 {c}{unit}{item}。盒里有多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，借出 {b}{unit}{item}，又收回 {c}{unit}{item}。现在有多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，分给第二组 {b}{unit}{item}，后来又领回 {c}{unit}{item}。第一组有多少{unit}{item}？",
  ],
  "plus-plus": [
    "{place}里有 {a}{unit}{item}，又放入 {b}{unit}{item}，后来再放入 {c}{unit}{item}。现在有多少{unit}{item}？",
    "{actor}收集了 {a}{unit}{item}，得到 {b}{unit}{item}，又找到 {c}{unit}{item}。一共有多少{unit}{item}？",
    "{otherPlace}有 {a}{unit}{item}，上午增加 {b}{unit}{item}，下午再增加 {c}{unit}{item}。现在有多少{unit}{item}？",
    "盒子里有 {a}{unit}{item}，第一次装入 {b}{unit}{item}，第二次装入 {c}{unit}{item}。盒里有多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，第一组送来 {b}{unit}{item}，第二组送来 {c}{unit}{item}。现在有多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，第二组增加 {b}{unit}{item}，第三组再增加 {c}{unit}{item}。一共有多少{unit}{item}？",
  ],
  "minus-minus": [
    "{place}里有 {a}{unit}{item}，先拿走 {b}{unit}{item}，又拿走 {c}{unit}{item}。还剩多少{unit}{item}？",
    "{actor}有 {a}{unit}{item}，送出 {b}{unit}{item}，又用掉 {c}{unit}{item}。还剩多少{unit}{item}？",
    "{otherPlace}原有 {a}{unit}{item}，分出 {b}{unit}{item}，再取下 {c}{unit}{item}。还剩多少{unit}{item}？",
    "盒子里有 {a}{unit}{item}，上午拿出 {b}{unit}{item}，下午又拿出 {c}{unit}{item}。盒里还剩多少{unit}{item}？",
    "{place}摆着 {a}{unit}{item}，借出 {b}{unit}{item}，后来取走 {c}{unit}{item}。现在有多少{unit}{item}？",
    "第一组有 {a}{unit}{item}，分给第二组 {b}{unit}{item}，又分给第三组 {c}{unit}{item}。第一组还剩多少{unit}{item}？",
  ],
};

const MONTH_ONE_STORYLINE_FAMILIES: readonly MonthOneStorylineFamilyDefinition[] = [
  { family: "fruit", icon: "apple", unit: "个", item: "苹果", place: "果园", actor: "小朋友", otherPlace: "果篮", recipient: "妈妈", oneStepGroup: "add", oneStepScenario: "combine", oneStepOperator: "+", twoStepGroup: "plus-minus" },
  { family: "toy", icon: "ball", unit: "个", item: "小球", place: "玩具架", actor: "小朋友", otherPlace: "玩具箱", recipient: "老师", oneStepGroup: "add", oneStepScenario: "increase", oneStepOperator: "+", twoStepGroup: "minus-plus" },
  { family: "stationery", icon: "block", unit: "支", item: "铅笔", place: "笔筒", actor: "小朋友", otherPlace: "文具盒", recipient: "老师", oneStepGroup: "subtract", oneStepScenario: "decrease", oneStepOperator: "-", twoStepGroup: "plus-minus" },
  { family: "animal", icon: "fish", unit: "条", item: "小鱼", place: "鱼缸", actor: "小朋友", otherPlace: "池塘", recipient: "饲养员", oneStepGroup: "subtract", oneStepScenario: "remain", oneStepOperator: "-", twoStepGroup: "minus-plus" },
  { family: "sports", icon: "star", unit: "颗", item: "星星", place: "计分板", actor: "小队", otherPlace: "运动墙", recipient: "老师", oneStepGroup: "more", oneStepScenario: "compare-more", oneStepOperator: "+", twoStepGroup: "plus-plus" },
  { family: "garden", icon: "flower", unit: "朵", item: "花", place: "花圃", actor: "小朋友", otherPlace: "花坛", recipient: "园丁", oneStepGroup: "less", oneStepScenario: "compare-less", oneStepOperator: "-", twoStepGroup: "minus-minus" },
  { family: "kitchen", icon: "cookie", unit: "块", item: "饼干", place: "厨房", actor: "小朋友", otherPlace: "点心盘", recipient: "妈妈", oneStepGroup: "add", oneStepScenario: "combine", oneStepOperator: "+", twoStepGroup: "plus-minus" },
  { family: "craft", icon: "mushroom", unit: "个", item: "纽扣", place: "手工桌", actor: "小朋友", otherPlace: "材料盒", recipient: "老师", oneStepGroup: "add", oneStepScenario: "increase", oneStepOperator: "+", twoStepGroup: "minus-plus" },
  { family: "celebration", icon: "balloon", unit: "个", item: "气球", place: "教室", actor: "小朋友", otherPlace: "气球箱", recipient: "老师", oneStepGroup: "subtract", oneStepScenario: "decrease", oneStepOperator: "-", twoStepGroup: "plus-minus" },
  { family: "classroom", icon: "book", unit: "本", item: "故事书", place: "阅读角", actor: "小朋友", otherPlace: "书架", recipient: "老师", oneStepGroup: "more", oneStepScenario: "compare-more", oneStepOperator: "+", twoStepGroup: "minus-plus" },
];

const MONTH_ONE_TWO_STEP_OPERATORS: Record<MonthOneTwoStepGroup, readonly ["+" | "-", "+" | "-"]> = {
  "plus-minus": ["+", "-"],
  "minus-plus": ["-", "+"],
  "plus-plus": ["+", "+"],
  "minus-minus": ["-", "-"],
};

function personalizeMonthOneStorylineTemplate(template: string, family: MonthOneStorylineFamilyDefinition): string {
  const replacements: Record<string, string> = {
    item: family.item,
    place: family.place,
    actor: family.actor,
    otherPlace: family.otherPlace,
    recipient: family.recipient,
    unit: family.unit,
  };
  return template.replace(/\{(item|place|actor|otherPlace|recipient|unit)\}/g, (_, key: string) => replacements[key] ?? "");
}

function createMonthOneApplicationStorylines(family: MonthOneStorylineFamilyDefinition): MonthOneApplicationStoryline[] {
  const createEntries = (
    level: MonthOneApplicationStoryline["level"],
    templates: readonly string[],
    scenario: ApplicationScenario,
    operators: readonly ("+" | "-")[],
  ) => templates.map((template, index) => ({
    id: `month1-${family.family}-${level}-${index + 1}`,
    family: family.family,
    scenario,
    level,
    icon: family.icon,
    unit: family.unit,
    operators,
    template: personalizeMonthOneStorylineTemplate(template, family),
  }));

  return [
    ...createEntries("picture", MONTH_ONE_PICTURE_TEMPLATES[family.oneStepGroup], family.oneStepScenario, [family.oneStepOperator]),
    ...createEntries("one-step", MONTH_ONE_ONE_STEP_TEMPLATES[family.oneStepGroup], family.oneStepScenario, [family.oneStepOperator]),
    ...createEntries("two-step", MONTH_ONE_TWO_STEP_TEMPLATES[family.twoStepGroup], "two-step", MONTH_ONE_TWO_STEP_OPERATORS[family.twoStepGroup]),
  ] as MonthOneApplicationStoryline[];
}

export const MONTH_ONE_APPLICATION_STORYLINES: readonly MonthOneApplicationStoryline[] = MONTH_ONE_STORYLINE_FAMILIES.flatMap(createMonthOneApplicationStorylines);

export interface MonthTwoApplicationStoryline {
  id: string;
  family: string;
  scenario: ApplicationScenario;
  level: "one-step" | "two-step";
  icon: WorksheetIconKey;
  unit: string;
  operators: readonly ("+" | "-")[];
  template: string;
}

function createMonthTwoApplicationStorylines(
  family: string,
  icon: WorksheetIconKey,
  unit: string,
  oneStepScenario: Exclude<ApplicationScenario, "two-step">,
  oneStepOperator: "+" | "-",
  oneStepTemplates: readonly string[],
  twoStepOperators: readonly ["+" | "-", "+" | "-"],
  twoStepTemplates: readonly string[],
): MonthTwoApplicationStoryline[] {
  return [
    ...oneStepTemplates.map((template, index) => ({ id: `${family}-one-${index + 1}`, family, scenario: oneStepScenario, level: "one-step" as const, icon, unit, operators: [oneStepOperator] as const, template })),
    ...twoStepTemplates.map((template, index) => ({ id: `${family}-two-${index + 1}`, family, scenario: "two-step" as const, level: "two-step" as const, icon, unit, operators: twoStepOperators, template })),
  ];
}

export const MONTH_TWO_APPLICATION_STORYLINES: readonly MonthTwoApplicationStoryline[] = [
  ...createMonthTwoApplicationStorylines("fruit", "apple", "个", "combine", "+", [
    "果篮里有 {a} 个苹果，旁边又放入 {b} 个。一共有多少个苹果？",
    "小朋友摘了 {a} 个苹果，老师又分来 {b} 个。现在有多少个？",
    "红果盘有 {a} 个苹果，绿果盘有 {b} 个。两个果盘共有多少个？",
    "冰箱里有 {a} 个苹果，妈妈又买来 {b} 个。现在有多少个？",
  ], ["+", "-"], [
    "果园筐里有 {a} 个苹果，又摘下 {b} 个，送给邻居 {c} 个。还剩多少个？",
    "小朋友有 {a} 个苹果，午后又得到 {b} 个，分给同学 {c} 个。现在有多少个？",
    "盘中有 {a} 个苹果，姐姐放入 {b} 个，大家吃掉 {c} 个。还剩多少个？",
    "树上摘下 {a} 个苹果，篮子又装入 {b} 个，拿去清洗 {c} 个。篮中还有多少个？",
    "果摊上午有 {a} 个苹果，送来 {b} 个，卖出 {c} 个。还剩多少个？",
    "野餐带了 {a} 个苹果，又装上 {b} 个，吃掉 {c} 个。还剩多少个？",
    "小朋友收集 {a} 个苹果，找到 {b} 个，送出 {c} 个。现在有多少个？",
    "冷藏箱有 {a} 个苹果，放入 {b} 个，取出 {c} 个。箱里还有多少个？",
  ]),
  ...createMonthTwoApplicationStorylines("toy", "ball", "个", "increase", "+", [
    "玩具架上原有 {a} 个小球，又放入 {b} 个。现在有多少个？",
    "小车库里停着 {a} 辆小车，又开来 {b} 辆。一共有多少辆？",
    "积木盒里有 {a} 块积木，桌上又拿来 {b} 块。现在有多少块？",
    "球筐里原有 {a} 个皮球，老师又放入 {b} 个。现在有多少个？",
  ], ["-", "+"], [
    "玩具箱里有 {a} 个小球，拿出 {b} 个，又放回 {c} 个。现在有多少个？",
    "小车库里有 {a} 辆小车，开走 {b} 辆，又回来 {c} 辆。现在有多少辆？",
    "积木盒里有 {a} 块积木，搭城堡用了 {b} 块，又放回 {c} 块。还剩多少块？",
    "球筐里有 {a} 个皮球，借给操场 {b} 个，又收回 {c} 个。现在有多少个？",
    "玩具店有 {a} 个玩偶，卖出 {b} 个，又进货 {c} 个。现在有多少个？",
    "游戏桌上有 {a} 个棋子，收起 {b} 个，又摆上 {c} 个。现在有多少个？",
    "礼物袋里有 {a} 个小玩具，送出 {b} 个，又装入 {c} 个。还剩多少个？",
    "抽屉里有 {a} 个彩球，拿去布置 {b} 个，又放回 {c} 个。现在有多少个？",
  ]),
  ...createMonthTwoApplicationStorylines("stationery", "block", "支", "decrease", "-", [
    "笔筒里有 {a} 支铅笔，小朋友拿走 {b} 支。还剩多少支？",
    "文具盒里有 {a} 支彩笔，用掉 {b} 支。还剩多少支？",
    "桌上放着 {a} 支水彩笔，老师收走 {b} 支。还剩多少支？",
    "小组有 {a} 支记号笔，借给同学 {b} 支。还剩多少支？",
  ], ["+", "-"], [
    "笔筒里有 {a} 支铅笔，又放入 {b} 支，借出 {c} 支。现在有多少支？",
    "彩笔盒里有 {a} 支彩笔，老师补充 {b} 支，用掉 {c} 支。还剩多少支？",
    "文具袋里有 {a} 支水彩笔，买来 {b} 支，送给同学 {c} 支。还剩多少支？",
    "桌上有 {a} 支荧光笔，找回 {b} 支，又借出 {c} 支。现在有多少支？",
    "小组有 {a} 支铅笔，老师发下 {b} 支，用完 {c} 支。还剩多少支？",
    "美术盒里有 {a} 支画笔，放入 {b} 支，取出 {c} 支。盒里还有多少支？",
    "抽屉里有 {a} 支蜡笔，又找到 {b} 支，分给同学 {c} 支。还剩多少支？",
    "课桌里有 {a} 支彩笔，妈妈送来 {b} 支，拿走 {c} 支。现在有多少支？",
  ]),
  ...createMonthTwoApplicationStorylines("animal", "fish", "条", "remain", "-", [
    "鱼缸里有 {a} 条小鱼，游走了 {b} 条。还剩多少条？",
    "池塘里有 {a} 条小鱼，被水草挡住 {b} 条。还能看到多少条？",
    "小河里有 {a} 条小鱼，游到下游 {b} 条。上游还剩多少条？",
    "水族箱里有 {a} 条小鱼，送到邻缸 {b} 条。还剩多少条？",
  ], ["-", "+"], [
    "鱼缸里有 {a} 条小鱼，游走 {b} 条，又游来 {c} 条。现在有多少条？",
    "池塘里有 {a} 条小鱼，捉走 {b} 条，又放回 {c} 条。现在有多少条？",
    "小河里有 {a} 条小鱼，游向下游 {b} 条，又游回 {c} 条。现在有多少条？",
    "水族箱里有 {a} 条小鱼，分出 {b} 条，又放入 {c} 条。现在有多少条？",
    "观察池有 {a} 条小鱼，躲到石头后 {b} 条，又游出 {c} 条。现在有多少条？",
    "池边有 {a} 条小鱼，游走 {b} 条，邻池游来 {c} 条。现在有多少条？",
    "养鱼桶里有 {a} 条小鱼，送给朋友 {b} 条，又补进 {c} 条。还剩多少条？",
    "小池里有 {a} 条小鱼，暂时捞出 {b} 条，又放回 {c} 条。现在有多少条？",
  ]),
  ...createMonthTwoApplicationStorylines("sports", "star", "颗", "compare-more", "+", [
    "红队得到 {a} 颗星星，蓝队比红队多 {b} 颗。蓝队有多少颗？",
    "小明跳绳得 {a} 颗星，乐乐比他多 {b} 颗。乐乐得了多少颗？",
    "一组有 {a} 颗星星贴纸，二组比一组多 {b} 颗。二组有多少颗？",
    "运动打卡有 {a} 颗星，周末又多得 {b} 颗。现在有多少颗？",
  ], ["+", "+"], [
    "红队有 {a} 颗星星，第一轮多得 {b} 颗，第二轮又得 {c} 颗。共有多少颗？",
    "小明得到 {a} 颗星，老师奖励 {b} 颗，比赛又得 {c} 颗。现在有多少颗？",
    "一组有 {a} 颗星星贴纸，上午添 {b} 颗，下午再添 {c} 颗。共有多少颗？",
    "运动墙上有 {a} 颗星，跳绳区贴上 {b} 颗，跑步区贴上 {c} 颗。现在有多少颗？",
    "小队收集 {a} 颗星，挑战成功得 {b} 颗，合作任务得 {c} 颗。共有多少颗？",
    "计分板上有 {a} 颗星，第一场得 {b} 颗，第二场得 {c} 颗。现在有多少颗？",
    "班级有 {a} 颗运动星，本周增加 {b} 颗，又增加 {c} 颗。现在有多少颗？",
    "奖励卡有 {a} 颗星，完成热身得 {b} 颗，完成比赛得 {c} 颗。共有多少颗？",
  ]),
  ...createMonthTwoApplicationStorylines("garden", "flower", "朵", "compare-less", "-", [
    "花坛里有 {a} 朵红花，黄花比红花少 {b} 朵。黄花有多少朵？",
    "第一盆有 {a} 朵花，第二盆比第一盆少 {b} 朵。第二盆有多少朵？",
    "姐姐种了 {a} 朵花，弟弟比姐姐少种 {b} 朵。弟弟种了多少朵？",
    "东边花圃有 {a} 朵花，西边少 {b} 朵。西边有多少朵？",
  ], ["-", "-"], [
    "花坛里有 {a} 朵花，摘下 {b} 朵，又送走 {c} 朵。还剩多少朵？",
    "红花圃有 {a} 朵花，剪下 {b} 朵，插瓶用掉 {c} 朵。还剩多少朵？",
    "小花园有 {a} 朵花，风吹落 {b} 朵，孩子摘走 {c} 朵。还剩多少朵？",
    "花店有 {a} 朵鲜花，卖出 {b} 朵，又做花束用掉 {c} 朵。还剩多少朵？",
    "校园花坛有 {a} 朵花，移栽 {b} 朵，送给老师 {c} 朵。还剩多少朵？",
    "阳台上有 {a} 朵花，凋谢 {b} 朵，剪下 {c} 朵。还剩多少朵？",
    "花篮里有 {a} 朵花，布置会场用了 {b} 朵，又送出 {c} 朵。还剩多少朵？",
    "种植角有 {a} 朵花，采集种子摘下 {b} 朵，做标本用了 {c} 朵。还剩多少朵？",
  ]),
  ...createMonthTwoApplicationStorylines("kitchen", "cookie", "块", "combine", "+", [
    "盘子里有 {a} 块饼干，盒子里有 {b} 块。共有多少块？",
    "小朋友有 {a} 块饼干，妈妈又给了 {b} 块。现在有多少块？",
    "上午烤好 {a} 块饼干，下午又烤好 {b} 块。一共烤好多少块？",
    "大盒装有 {a} 块饼干，小盒装有 {b} 块。两个盒子共有多少块？",
  ], ["+", "-"], [
    "盘子里有 {a} 块饼干，又放入 {b} 块，分给客人 {c} 块。还剩多少块？",
    "厨房烤好 {a} 块饼干，后来又烤 {b} 块，吃掉 {c} 块。还剩多少块？",
    "盒子里有 {a} 块饼干，姐姐放入 {b} 块，午餐吃掉 {c} 块。还剩多少块？",
    "小朋友有 {a} 块饼干，得到 {b} 块，送给朋友 {c} 块。现在有多少块？",
    "餐桌上有 {a} 块饼干，又端来 {b} 块，大家拿走 {c} 块。还剩多少块？",
    "礼盒里有 {a} 块饼干，补放 {b} 块，分装带走 {c} 块。还剩多少块？",
    "点心盘有 {a} 块饼干，放入 {b} 块，下午吃掉 {c} 块。还剩多少块？",
    "小店有 {a} 块饼干，上午进货 {b} 块，卖出 {c} 块。现在有多少块？",
  ]),
  ...createMonthTwoApplicationStorylines("craft", "mushroom", "个", "increase", "+", [
    "手工盒里有 {a} 个小装饰，又放入 {b} 个。现在有多少个？",
    "作品墙上贴着 {a} 个小图案，老师又贴上 {b} 个。现在有多少个？",
    "小朋友折好 {a} 个纸作品，同伴又送来 {b} 个。一共有多少个？",
    "材料盘里有 {a} 个纽扣，又找到 {b} 个。现在有多少个？",
  ], ["-", "+"], [
    "手工盒里有 {a} 个装饰，拿出 {b} 个，又放回 {c} 个。现在有多少个？",
    "作品墙上有 {a} 个图案，取下 {b} 个，又贴上 {c} 个。现在有多少个？",
    "材料盘里有 {a} 个纽扣，用掉 {b} 个，又补进 {c} 个。还剩多少个？",
    "小朋友折好 {a} 个纸作品，送出 {b} 个，又折好 {c} 个。现在有多少个？",
    "手工桌上有 {a} 个纸杯，拿走 {b} 个，又摆来 {c} 个。现在有多少个？",
    "工具盒里有 {a} 个小夹子，借出 {b} 个，又收回 {c} 个。现在有多少个？",
    "制作区有 {a} 个彩纸图案，分给小组 {b} 个，又得到 {c} 个。还剩多少个？",
    "展示架上有 {a} 个作品，搬走 {b} 个，又放上 {c} 个。现在有多少个？",
  ]),
  ...createMonthTwoApplicationStorylines("celebration", "balloon", "个", "decrease", "-", [
    "教室里有 {a} 个气球，飞走了 {b} 个。还剩多少个？",
    "门口挂着 {a} 个气球，取下 {b} 个。还剩多少个？",
    "庆祝会上有 {a} 个气球，送给小朋友 {b} 个。还剩多少个？",
    "气球箱里有 {a} 个气球，拿去布置 {b} 个。箱里还剩多少个？",
  ], ["+", "-"], [
    "教室里有 {a} 个气球，又挂上 {b} 个，取下 {c} 个。现在有多少个？",
    "气球箱里有 {a} 个气球，买来 {b} 个，布置会场用了 {c} 个。还剩多少个？",
    "活动场地有 {a} 个气球，补充 {b} 个，飞走 {c} 个。现在有多少个？",
    "门口挂着 {a} 个气球，添上 {b} 个，又取下 {c} 个。现在有多少个？",
    "庆祝会上有 {a} 个气球，送出 {b} 个，又收到 {c} 个。还剩多少个？",
    "小朋友手里有 {a} 个气球，放飞 {b} 个，又拿来 {c} 个。现在有多少个？",
    "礼物区有 {a} 个气球，拿走 {b} 个，又摆上 {c} 个。现在有多少个？",
    "操场边有 {a} 个气球，风吹走 {b} 个，老师补上 {c} 个。现在有多少个？",
  ]),
  ...createMonthTwoApplicationStorylines("classroom", "book", "本", "compare-more", "+", [
    "阅读角有 {a} 本故事书，绘本比故事书多 {b} 本。绘本有多少本？",
    "一组收集 {a} 本书，二组比一组多 {b} 本。二组有多少本？",
    "书架上有 {a} 本书，旁边的架子多 {b} 本。旁边有多少本？",
    "小明读了 {a} 本书，乐乐比他多读 {b} 本。乐乐读了多少本？",
  ], ["-", "+"], [
    "阅读角有 {a} 本书，借出 {b} 本，又归还 {c} 本。现在有多少本？",
    "班级书柜有 {a} 本书，借给一年级 {b} 本，又收到 {c} 本。现在有多少本？",
    "故事架上有 {a} 本书，整理时取走 {b} 本，又放回 {c} 本。还剩多少本？",
    "绘本盒里有 {a} 本书，送给朋友 {b} 本，又得到 {c} 本。现在有多少本？",
    "图书角有 {a} 本书，借出 {b} 本，老师补充 {c} 本。现在有多少本？",
    "书包里有 {a} 本练习册，交上去 {b} 本，又领回 {c} 本。现在有多少本？",
    "班级有 {a} 本新书，分发 {b} 本，又收回 {c} 本。现在有多少本？",
    "书架上有 {a} 本书，清点时拿下 {b} 本，又摆回 {c} 本。现在有多少本？",
  ]),
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

function fillApplicationStorylineTemplate(template: string, values: readonly number[]): string {
  const names = ["a", "b", "c"];
  return template.replace(/\{([a-zA-Z]+)\}/g, (_, key: string) => {
    const index = names.indexOf(key);
    return index >= 0 && values[index] !== undefined ? String(values[index]) : "";
  });
}

function makeApplicationStory(storyline: Pick<MonthTwoApplicationStoryline, "operators" | "template">, operands: readonly number[]) {
  if (operands.length !== storyline.operators.length + 1) return undefined;
  let current = operands[0];
  const steps: WorksheetGuidedStep[] = [];
  for (let index = 0; index < storyline.operators.length; index += 1) {
    const right = operands[index + 1];
    const operator = storyline.operators[index];
    const answer = calculateBinary(current, operator, right);
    if (answer < 0 || answer > NUMBER_SENSE_MAX) return undefined;
    steps.push({ left: current, operator, right, answer });
    current = answer;
  }
  const equation = operands.reduce((text, value, index) => index === 0 ? String(value) : `${text} ${storyline.operators[index - 1]} ${value}`, "") + " =";
  return {
    prompt: fillApplicationStorylineTemplate(storyline.template, operands),
    operators: storyline.operators,
    answer: current,
    steps,
    equation,
    operands,
  };
}

function selectMonthTwoApplicationStoryline(
  level: "one-step" | "two-step",
  random: RandomSource,
  usedStorylineIds: Set<string>,
  usedFamilies: Set<string>,
  usedIcons: Set<WorksheetIconKey>,
): MonthTwoApplicationStoryline | undefined {
  const available = MONTH_TWO_APPLICATION_STORYLINES.filter((storyline) => storyline.level === level && !usedStorylineIds.has(storyline.id) && !usedFamilies.has(storyline.family) && !usedIcons.has(storyline.icon));
  if (available.length === 0) return undefined;
  const familyUsage = new Map<string, number>();
  MONTH_TWO_APPLICATION_STORYLINES.forEach((storyline) => {
    if (storyline.level === level && usedStorylineIds.has(storyline.id)) familyUsage.set(storyline.family, (familyUsage.get(storyline.family) ?? 0) + 1);
  });
  const families = [...new Set(available.map((storyline) => storyline.family))].sort((left, right) => (familyUsage.get(left) ?? 0) - (familyUsage.get(right) ?? 0) || left.localeCompare(right));
  const family = families[0];
  const candidates = available.filter((storyline) => storyline.family === family);
  return candidates[randomInt(random, 0, candidates.length - 1)];
}

function buildMonthTwoApplicationQuestion(storyline: MonthTwoApplicationStoryline, blueprint: MonthTwoDayBlueprint, random: RandomSource) {
  const maxOperand = Math.max(20, Math.min(99, blueprint.resultMax - 1));
  const minOperand = blueprint.resultMax <= 20 ? 2 : 10;
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const first = randomInt(random, minOperand, maxOperand);
    const secondMax = storyline.operators[0] === "-" ? Math.max(1, Math.min(40, first - 1)) : Math.min(40, maxOperand);
    const second = randomInt(random, 1, secondMax);
    const third = storyline.operators.length === 2
      ? randomInt(random, 1, storyline.operators[1] === "-" ? Math.max(1, Math.min(40, first + second - 1)) : Math.min(40, maxOperand))
      : undefined;
    const operands = third === undefined ? [first, second] : [first, second, third];
    const result = makeApplicationStory(storyline, operands);
    if (!result || result.steps.some((step) => step.answer > blueprint.resultMax) || result.answer > blueprint.resultMax) continue;
    return result;
  }
  return undefined;
}

function buildMonthTwoApplicationQuestions(count: number, blueprint: MonthTwoDayBlueprint, random: RandomSource, idPrefix: string, usedStorylineIds = new Set<string>()): ApplicationQuestion[] {
  if (count <= 0) return [];
  const questions: ApplicationQuestion[] = [];
  const usedFamilies = new Set<string>();
  const usedIcons = new Set<WorksheetIconKey>();
  const level = blueprint.applicationLevel === "two-step" ? "two-step" : "one-step";
  let attempts = 0;
  while (questions.length < count && attempts < count * 2000) {
    attempts += 1;
    const storyline = selectMonthTwoApplicationStoryline(level, random, usedStorylineIds, usedFamilies, usedIcons);
    if (!storyline) break;
    const result = buildMonthTwoApplicationQuestion(storyline, blueprint, random);
    if (!result) continue;
    usedStorylineIds.add(storyline.id);
    usedFamilies.add(storyline.family);
    usedIcons.add(storyline.icon);
    questions.push({ id: `${idPrefix}-application-${questions.length}`, type: "application", section: "application", number: 0, storylineId: storyline.id, storylineFamily: storyline.family, scenario: storyline.scenario, prompt: result.prompt, icon: storyline.icon, unit: storyline.unit, operands: result.operands, operators: result.operators, equation: result.equation, steps: result.steps, answer: result.answer, level: storyline.level, picture: false });
  }
  if (questions.length !== count) throw new Error(`第二个月应用题故事线不足：${level}`);
  return questions;
}

interface MonthOneApplicationGenerationContext {
  usedStorylineIds: Set<string>;
  usedQuestionSignatures: Set<string>;
}

function selectMonthOneApplicationStoryline(
  level: ApplicationLevel,
  random: RandomSource,
  usedStorylineIds: Set<string>,
  usedFamilies: Set<string>,
  usedIcons: Set<WorksheetIconKey>,
  blockedStorylineIds: Set<string>,
): MonthOneApplicationStoryline | undefined {
  const available = MONTH_ONE_APPLICATION_STORYLINES.filter((storyline) => storyline.level === level
    && !usedStorylineIds.has(storyline.id)
    && !blockedStorylineIds.has(storyline.id)
    && !usedFamilies.has(storyline.family)
    && !usedIcons.has(storyline.icon));
  if (available.length === 0) return undefined;

  const familyUsage = new Map<string, number>();
  MONTH_ONE_APPLICATION_STORYLINES.forEach((storyline) => {
    if (storyline.level === level && usedStorylineIds.has(storyline.id)) {
      familyUsage.set(storyline.family, (familyUsage.get(storyline.family) ?? 0) + 1);
    }
  });
  const families = [...new Set(available.map((storyline) => storyline.family))].sort((left, right) =>
    (familyUsage.get(left) ?? 0) - (familyUsage.get(right) ?? 0) || left.localeCompare(right));
  const family = families[0];
  const candidates = available.filter((storyline) => storyline.family === family);
  return candidates[randomInt(random, 0, candidates.length - 1)];
}

function buildMonthOneApplicationQuestion(storyline: MonthOneApplicationStoryline, blueprint: ReinforcementDayBlueprint, random: RandomSource) {
  const maxOperand = blueprint.resultMax <= 20
    ? 9
    : blueprint.resultMax <= 50
      ? 35
      : Math.min(99, blueprint.resultMax - 1);
  const minOperand = storyline.level === "picture"
    ? 2
    : blueprint.resultMax <= 50
      ? 3
      : Math.max(5, Math.floor(maxOperand * 0.25));

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const first = randomInt(random, minOperand, maxOperand);
    const secondMax = storyline.operators[0] === "-"
      ? Math.max(1, Math.min(35, first - 1))
      : Math.min(35, maxOperand);
    const second = randomInt(random, 1, secondMax);
    const intermediate = storyline.operators[0] === "+" ? first + second : first - second;
    const third = storyline.operators.length === 2
      ? randomInt(random, 1, storyline.operators[1] === "-" ? Math.max(1, Math.min(35, intermediate - 1)) : Math.min(35, maxOperand))
      : undefined;
    const operands = third === undefined ? [first, second] : [first, second, third];
    const result = makeApplicationStory(storyline, operands);
    if (!result || result.steps.some((step) => step.answer < 0 || step.answer > blueprint.resultMax) || result.answer > blueprint.resultMax) continue;
    return result;
  }
  return undefined;
}

function createApplicationQuestionSignature(level: ApplicationLevel, operators: readonly ("+" | "-")[], operands: readonly number[]): string {
  return `${level}:${operators.join("")}:${operands.join(",")}`;
}

export function getApplicationQuestionSignature(question: Pick<ApplicationQuestion, "level" | "operators" | "operands">): string {
  return createApplicationQuestionSignature(question.level, question.operators, question.operands);
}

function buildMonthOneApplicationQuestions(
  count: number,
  blueprint: ReinforcementDayBlueprint,
  random: RandomSource,
  idPrefix: string,
  context: MonthOneApplicationGenerationContext,
): ApplicationQuestion[] {
  if (count <= 0) return [];
  const questions: ApplicationQuestion[] = [];
  const usedFamilies = new Set<string>();
  const usedIcons = new Set<WorksheetIconKey>();
  const blockedStorylineIds = new Set<string>();
  let attempts = 0;

  while (questions.length < count && attempts < count * 2400) {
    attempts += 1;
    const storyline = selectMonthOneApplicationStoryline(blueprint.applicationLevel, random, context.usedStorylineIds, usedFamilies, usedIcons, blockedStorylineIds);
    if (!storyline) break;
    blockedStorylineIds.add(storyline.id);
    const result = buildMonthOneApplicationQuestion(storyline, blueprint, random);
    if (!result) continue;
    const signature = createApplicationQuestionSignature(storyline.level, storyline.operators, result.operands);
    if (context.usedQuestionSignatures.has(signature)) continue;

    context.usedStorylineIds.add(storyline.id);
    context.usedQuestionSignatures.add(signature);
    usedFamilies.add(storyline.family);
    usedIcons.add(storyline.icon);
    questions.push({
      id: `${idPrefix}-application-${questions.length}`,
      type: "application",
      section: "application",
      number: 0,
      storylineId: storyline.id,
      storylineFamily: storyline.family,
      scenario: storyline.scenario,
      prompt: result.prompt,
      icon: storyline.icon,
      unit: storyline.unit,
      operands: result.operands,
      operators: result.operators,
      equation: result.equation,
      steps: result.steps,
      answer: result.answer,
      level: storyline.level,
      picture: storyline.level === "picture",
    });
  }

  if (questions.length === count) return questions;

  const fallback = buildApplicationQuestions(count - questions.length, blueprint, random, `${idPrefix}-fallback`);
  const normalizedFallback = fallback.map((question, index) => ({ ...question, id: `${idPrefix}-application-${questions.length + index}` }));
  normalizedFallback.forEach((question) => context.usedQuestionSignatures.add(getApplicationQuestionSignature(question)));
  return [...questions, ...normalizedFallback];
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
  columns: 1 | 2 | 3 | 4 | 5;
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
    const maxRowHeight = section.title === "加减应用题" ? APPLICATION_MIN_ROW_HEIGHT_MM : APPLICATION_MAX_ROW_HEIGHT_MM;
    const rowHeightMm = Math.max(APPLICATION_MIN_ROW_HEIGHT_MM, Math.min(maxRowHeight, Math.floor((PAGE_BODY_HEIGHT_MM - SECTION_TITLE_HEIGHT_MM) / section.questions.length)));
    return chunk(section.questions, 1).map((questions) => ({ type: "application", title: section.title, questions, columns: 1, rowHeightMm }));
  }
  if (section.type === "vertical") {
    // 5 题及以内单行排满，贴近一年级竖式练习纸。
    const columns = Math.min(5, Math.max(1, section.questions.length)) as 1 | 2 | 3 | 4 | 5;
    return chunk(section.questions, columns).map((questions) => ({ type: "vertical" as const, title: section.title, questions, columns, rowHeightMm: VERTICAL_ROW_HEIGHT_MM }));
  }
  if (section.type === "missing-number") {
    const columns = Math.min(3, Math.max(1, section.questions.length)) as 1 | 2 | 3;
    return chunk(section.questions, columns).map((questions) => ({ type: "missing-number" as const, title: section.title, questions, columns, rowHeightMm: MISSING_NUMBER_ROW_HEIGHT_MM }));
  }
  if (section.type === "grouping") {
    const columns = Math.min(2, Math.max(1, section.questions.length)) as 1 | 2;
    return chunk(section.questions, columns).map((questions) => ({ type: "grouping" as const, title: section.title, questions, columns, rowHeightMm: GROUPING_ROW_HEIGHT_MM }));
  }
  if (section.type === "life-math") {
    const rowHeightMm = Math.max(LIFE_MATH_MIN_ROW_HEIGHT_MM, Math.min(LIFE_MATH_MAX_ROW_HEIGHT_MM, Math.floor((PAGE_BODY_HEIGHT_MM - SECTION_TITLE_HEIGHT_MM) / Math.max(1, section.questions.length))));
    return chunk(section.questions, 1).map((questions) => ({ type: "life-math", title: section.title, questions, columns: 1, rowHeightMm }));
  }
  if (section.type !== "mental") return [];
  const mental = section.questions.filter((question): question is MentalQuestion => question.type === "mental");
  const blocks: LayoutBlock[] = [];
  const guided = mental.filter((question) => question.presentation === "guided");
  if (guided.length > 0) blocks.push(...chunk(guided, 2).map((questions) => ({ type: "guided" as const, title: "看图算一算", questions, columns: 2 as const, rowHeightMm: GUIDED_ROW_HEIGHT_MM })));
  const directMental = mental.filter((question) => question.presentation !== "guided");
  const hasComplexQuestion = directMental.some((question) => question.level === "two-digit" || question.level === "three-number");
  const columns: 2 | 3 = hasComplexQuestion ? 2 : 3;
  const rowHeightMm = hasComplexQuestion ? MENTAL_COMPLEX_ROW_HEIGHT_MM : MENTAL_BASIC_ROW_HEIGHT_MM;

  // 同一练习区只使用一套列基线，避免难度切换时出现孤行和答案线跳动。
  blocks.push(...chunk(directMental, columns).map((questions) => ({ type: "mental" as const, title: section.title, questions, columns, rowHeightMm })));
  return blocks;
}

function neighborBlocks(section: WorksheetSection | undefined): LayoutBlock[] {
  const questions = section?.questions ?? [];
  if (questions.length === 0) return [];
  // 两列才能放下 18 磅的三位数和题号，四列会压到空格和下一个题号上。
  return chunk(questions, 2).map((row) => ({ type: "neighbor" as const, title: "相邻数", questions: row, columns: 2 as const, rowHeightMm: NEIGHBOR_ROW_HEIGHT_MM }));
}

function tensSplitBlocks(section: WorksheetSection | undefined): LayoutBlock[] {
  const questions = section?.questions ?? [];
  if (questions.length === 0) return [];
  // 6/3/9 题用三列，圆圈更大更满；其余固定四列。
  const columns = questions.length % 3 === 0 && questions.length % 4 !== 0 ? 3 : 4;
  return chunk(questions, columns).map((row) => ({ type: "tens-split" as const, title: "数的组成", questions: row, columns: columns as 3 | 4, rowHeightMm: TENS_SPLIT_ROW_HEIGHT_MM }));
}

function composeWorksheetPages(sections: readonly WorksheetSection[], showMethod: boolean): readonly WorksheetPrintPage[] {
  const blocks: LayoutBlock[] = [];
  blocks.push(...neighborBlocks(sections.find((section) => section.type === "neighbor")));
  blocks.push(...tensSplitBlocks(sections.find((section) => section.type === "tens-split")));
  sections.filter((section) => section.type !== "neighbor" && section.type !== "tens-split").forEach((section) => blocks.push(...sectionBlocks(section)));
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
  const backMatterTypes = new Set<WorksheetPageSectionType>(["application", "grouping", "life-math"]);
  const firstBackIndex = blocks.findIndex((block) => backMatterTypes.has(block.type));
  let preferredBreak = -1;
  if (onePageHeight > PAGE_BODY_HEIGHT_MM) {
    // 优先把应用题/乘除/生活数学整段落到背面，避免正面只剩一道应用题占脚。
    let bestScore = Number.POSITIVE_INFINITY;
    for (let index = 1; index < blocks.length; index += 1) {
      const firstHeight = firstPageHeights[index];
      const secondHeight = secondPageHeights[index];
      if (firstHeight > PAGE_BODY_HEIGHT_MM || secondHeight > PAGE_BODY_HEIGHT_MM) continue;
      const balance = Math.abs(firstHeight / (firstHeight + secondHeight) - 0.52);
      const thinPenalty = secondHeight < 110 ? (110 - secondHeight) / 200 : 0;
      const splitsBackMatter = firstBackIndex >= 0 && index > firstBackIndex ? 0.45 : 0;
      const keepsBackTogether = firstBackIndex >= 0 && index === firstBackIndex ? -0.2 : 0;
      const score = balance + thinPenalty + splitsBackMatter + keepsBackTogether;
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
  const expanded = pages.map((page, pageIndex) => (pageIndex === 0 && pages.length === 2 ? expandFrontPageSections(page) : page));
  const pageCount = expanded.length;
  return expanded.map((page, index) => ({ pageNumber: index + 1, pageCount, showMethod: page.showMethod, sections: page.sections, questionCount: page.sections.reduce((sum, section) => sum + section.questions.length, 0), usedHeightMm: page.usedHeightMm }));
}

const FRONT_PAGE_ROW_CAPS: Partial<Record<WorksheetPageSectionType, number>> = {
  neighbor: 28,
  "tens-split": 36,
  mental: 32,
  vertical: 48,
  composition: 40,
  guided: 64,
  "picture-equation": 48,
};

const FRONT_PAGE_EXPAND_PRIORITY: readonly WorksheetPageSectionType[] = [
  "vertical",
  "tens-split",
  "mental",
  "neighbor",
  "composition",
  "guided",
  "picture-equation",
];

function expandFrontPageSections(page: { showMethod: boolean; sections: WorksheetPageSection[]; usedHeightMm: number }) {
  let slack = PAGE_BODY_HEIGHT_MM - page.usedHeightMm;
  if (slack < 6) return page;
  const expandableIndexes = page.sections
    .map((section, index) => ({ section, index, cap: FRONT_PAGE_ROW_CAPS[section.type] }))
    .filter((item) => item.cap != null && item.section.rowHeightMm < (item.cap as number))
    .sort((left, right) => FRONT_PAGE_EXPAND_PRIORITY.indexOf(left.section.type) - FRONT_PAGE_EXPAND_PRIORITY.indexOf(right.section.type));
  if (expandableIndexes.length === 0) return page;
  const sections = page.sections.map((section) => ({ ...section }));
  let usedHeightMm = page.usedHeightMm;
  let guard = 0;
  while (slack > 0 && guard < 200) {
    guard += 1;
    let progressed = false;
    for (const item of expandableIndexes) {
      const section = sections[item.index];
      const cap = item.cap as number;
      if (section.rowHeightMm >= cap || slack <= 0) continue;
      section.rowHeightMm += 1;
      usedHeightMm += 1;
      slack -= 1;
      progressed = true;
      if (slack <= 0) break;
    }
    if (!progressed) break;
  }
  return { ...page, sections, usedHeightMm };
}

function createDailyWorksheet(args: { id: string; day: number; stage: WorksheetStage; stageDay: number; phase: number; phaseTitle: string; phaseSummary: string; title: string; objective: string; sections: readonly WorksheetSection[]; theme: WorksheetTheme; methodLesson?: WorksheetMethodExample; plan: WorksheetDayPlan }): DailyWorksheet {
  const rawPages = composeWorksheetPages(args.sections, Boolean(args.methodLesson));
  const numbered = assignNumbers(args.sections, rawPages);
  const total = numbered.sections.reduce((sum, section) => sum + section.questions.length, 0);
  return { ...args, month: args.plan.month, monthDay: args.plan.monthDay, sections: numbered.sections, pages: numbered.pages, total };
}

function foundationDayPlan(index: number): WorksheetDayPlan {
  const titles = ["数的组成与分解", "凑十法", "破十法", "平十法", "看图列式与一步应用题"];
  const objectives = ["认识一个数可以分成两部分", "把一个数拆开，先凑成 10", "把十几拆成 10 和几再减", "把减数拆开，先减到整十", "从图中看懂数量变化并列式"];
  return { stageDay: index, day: index, month: 1, monthDay: index, stage: "foundation", phase: 0, phaseTitle: "基础引导", phaseSummary: "5 天固定精选内容，先看方法再进入强化练习。", startDay: 1, endDay: MONTH_ONE_DAYS, title: titles[index - 1], objective: objectives[index - 1], resultMax: 20, numberMax: 20, binaryShape: "basic", binaryTwoDigitRatio: 0, threeNumberRatio: 0, tripleMinTerm: 1, applicationLevel: "picture", methodTheme: index === 1 || index === 2 ? "make-ten" : index === 3 ? "break-ten" : index === 4 ? "flat-ten" : "mixed" };
}

function buildFoundationDay(index: number): DailyWorksheet {
  const plan = foundationDayPlan(index);
  if (index === 1) return createDailyWorksheet({ id: "foundation-1", day: 1, stage: "foundation", stageDay: 1, phase: 0, phaseTitle: plan.phaseTitle, phaseSummary: plan.phaseSummary, title: plan.title, objective: plan.objective, sections: [{ type: "composition", title: "数的组成与分解", questions: buildNumberBondQuestions().slice(0, 10) }, { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(4, createSeededRandom(101), 20) }, { type: "tens-split", title: "数的组成", questions: buildTensSplitQuestions(6, createSeededRandom(102), 20) }], theme: "make-ten", methodLesson: createNumberBondLesson(), plan });
  if (index <= 4) {
    const method = index === 2 ? "make-ten" : index === 3 ? "break-ten" : "flat-ten";
    const mental = buildFoundationMental(method).slice(0, 8).map((question) => ({ ...question, id: `foundation-${index}-${question.id}` }));
    return createDailyWorksheet({ id: `foundation-${index}`, day: index, stage: "foundation", stageDay: index, phase: 0, phaseTitle: plan.phaseTitle, phaseSummary: plan.phaseSummary, title: plan.title, objective: plan.objective, sections: [{ type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(4, createSeededRandom(200 + index), 20) }, { type: "tens-split", title: "数的组成", questions: buildTensSplitQuestions(6, createSeededRandom(210 + index), 20) }, { type: "mental", title: "计算式", questions: mental }], theme: method, methodLesson: createMethodLesson(method), plan });
  }
  const mental = buildFoundationMental("make-ten").slice(0, 4).map((question, index) => ({ ...question, id: `foundation-5-mental-${index}`, presentation: "direct" as const, guidance: undefined }));
  return createDailyWorksheet({ id: "foundation-5", day: 5, stage: "foundation", stageDay: 5, phase: 0, phaseTitle: plan.phaseTitle, phaseSummary: plan.phaseSummary, title: plan.title, objective: plan.objective, sections: [{ type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(4, createSeededRandom(501), 20) }, { type: "tens-split", title: "数的组成", questions: buildTensSplitQuestions(4, createSeededRandom(502), 20) }, { type: "mental", title: "计算式", questions: mental }, { type: "picture-equation", title: "看图列式", questions: buildPictureEquationQuestions().slice(0, 4) }, { type: "application", title: "一步应用题", questions: buildFoundationApplications().slice(0, 3) }], theme: "mixed", methodLesson: createPictureEquationLesson(), plan });
}

export function getReinforcementDayBlueprint(stageDay: number): ReinforcementDayBlueprint {
  const safe = Math.max(1, Math.min(REINFORCEMENT_WORKSHEET_DAYS, Math.trunc(stageDay)));
  return REINFORCEMENT_BLUEPRINTS[safe - 1];
}

export function getMonthTwoDayBlueprint(monthDay: number): MonthTwoDayBlueprint {
  const safe = Math.max(1, Math.min(MONTH_TWO_DAYS, Math.trunc(monthDay)));
  return MONTH_TWO_BLUEPRINTS[safe - 1];
}

function getPhase(stageDay: number): { phase: number; title: string; summary: string } {
  if (stageDay <= 5) return { phase: 1, title: "20 以内·方法迁移", summary: "把 5 天基础方法放进更多题目和简单情境。" };
  if (stageDay <= 10) return { phase: 2, title: "50 以内·进退位", summary: "逐步加入两位数和一位数的计算。" };
  if (stageDay <= 15) return { phase: 3, title: "100 以内·数量关系", summary: "练习两位数进退位和比多比少。" };
  if (stageDay <= 20) return { phase: 4, title: "100 以内·三个数", summary: "练习两个连续的加减步骤。" };
  return { phase: 5, title: "200 以内·综合强化", summary: "逐步扩大数值范围，完成连续计算和两步应用题。" };
}

function getMonthTwoPhase(monthDay: number): { phase: number; title: string; summary: string } {
  if (monthDay <= 5) return { phase: 6, title: "衔接复习", summary: "回顾第一个月的加减方法，准备进入竖式计算。" };
  if (monthDay <= 10) return { phase: 7, title: "两位数竖式加法", summary: "先对齐数位，再逐步加入个位和连续进位。" };
  if (monthDay <= 15) return { phase: 8, title: "两位数竖式减法", summary: "先对齐数位，再逐步加入个位和连续退位。" };
  if (monthDay <= 20) return { phase: 9, title: "200 以内加减综合", summary: "把竖式和连续加减迁移到更多数量关系中。" };
  if (monthDay <= 25) return { phase: 10, title: "未知数与应用", summary: "通过填空和两步应用题反推未知数量。" };
  return { phase: 11, title: "第二个月综合测评", summary: "综合检查加减、乘除启蒙和生活数学。" };
}

export function getWorksheetDayPlan(day: number): WorksheetDayPlan {
  const safe = Number.isFinite(day) ? Math.max(1, Math.min(WORKSHEET_PLAN_DAYS, Math.trunc(day))) : 1;
  if (safe <= FOUNDATION_WORKSHEET_DAYS) return foundationDayPlan(safe);
  if (safe <= MONTH_ONE_DAYS) {
    const stageDay = safe - FOUNDATION_WORKSHEET_DAYS;
    const blueprint = getReinforcementDayBlueprint(stageDay);
    const phase = getPhase(stageDay);
    return { ...blueprint, day: safe, month: 1, monthDay: safe, stage: "reinforcement", phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, startDay: FOUNDATION_WORKSHEET_DAYS + 1, endDay: MONTH_ONE_DAYS };
  }
  const monthDay = safe - MONTH_ONE_DAYS;
  const blueprint = getMonthTwoDayBlueprint(monthDay);
  const phase = getMonthTwoPhase(monthDay);
  return { ...blueprint, day: safe, month: 2, monthDay, stage: "reinforcement", phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, startDay: MONTH_ONE_DAYS + 1, endDay: WORKSHEET_PLAN_DAYS };
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

function buildReinforcementDay(stageDay: number, seed: number, configInput: Partial<ReinforcementConfig>, monthOneContext?: MonthOneApplicationGenerationContext): DailyWorksheet {
  const config = normalizeReinforcementConfig(configInput);
  const blueprint = getReinforcementDayBlueprint(stageDay);
  const phase = getPhase(stageDay);
  const day = FOUNDATION_WORKSHEET_DAYS + stageDay;
  const plan: WorksheetDayPlan = { ...blueprint, day, month: 1, monthDay: day, stage: "reinforcement", phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, startDay: FOUNDATION_WORKSHEET_DAYS + 1, endDay: MONTH_ONE_DAYS };
  const random = createSeededRandom(seed);
  const counts = allocateCounts(config, stageDay);
  const sections: WorksheetSection[] = [
    { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(counts.neighbor, random, blueprint.numberMax) },
    { type: "tens-split", title: "数的组成", questions: buildTensSplitQuestions(counts.compare, random, blueprint.numberMax) },
    { type: "mental", title: "计算式", questions: buildMentalQuestions(counts.mental, blueprint.methodTheme, random, { resultMax: blueprint.resultMax, binaryShape: blueprint.binaryShape, binaryTwoDigitRatio: blueprint.binaryTwoDigitRatio, threeNumberRatio: blueprint.threeNumberRatio, tripleMinTerm: blueprint.tripleMinTerm }) },
    { type: "application", title: "应用题", questions: monthOneContext
      ? buildMonthOneApplicationQuestions(counts.application, blueprint, random, `practice-${stageDay}`, monthOneContext)
      : buildApplicationQuestions(counts.application, blueprint, random, `practice-${stageDay}`) },
  ];
  return createDailyWorksheet({ id: `practice-${stageDay}`, day: FOUNDATION_WORKSHEET_DAYS + stageDay, stage: "reinforcement", stageDay, phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, title: blueprint.title, objective: blueprint.objective, sections, theme: blueprint.methodTheme, plan });
}

export function normalizeMonthTwoConfig(config: Partial<MonthTwoConfig> = {}): MonthTwoConfig {
  const dailyQuestionCount = Number.isFinite(config.dailyQuestionCount)
    ? Math.max(MIN_WORKSHEET_QUESTIONS, Math.min(MAX_WORKSHEET_QUESTIONS, Math.trunc(config.dailyQuestionCount as number)))
    : DEFAULT_MONTH_TWO_CONFIG.dailyQuestionCount;
  return { dailyQuestionCount, coreRatio: 80, groupingRatio: 10, lifeMathRatio: 10 };
}

export interface MonthTwoQuestionCounts {
  neighbor: number;
  compare: number;
  mental: number;
  vertical: number;
  missing: number;
  application: number;
  grouping: number;
  lifeMath: number;
}

export function getMonthTwoQuestionCounts(config: Partial<MonthTwoConfig> = {}): MonthTwoQuestionCounts {
  const total = normalizeMonthTwoConfig(config).dailyQuestionCount;
  // 大字号练习纸按 22 题配比，放大后仍能排进两页。
  const weights = [
    ["neighbor", 4],
    ["compare", 3],
    ["mental", 4],
    ["vertical", 3],
    ["missing", 2],
    ["application", 3],
    ["grouping", 1],
    ["lifeMath", 2],
  ] as const;
  const raw = weights.map(([key, weight]) => ({ key, value: total * weight / 22 }));
  const counts = new Map(raw.map(({ key, value }) => [key, Math.floor(value)]));
  let remaining = total - raw.reduce((sum, item) => sum + Math.floor(item.value), 0);
  const priority = [...raw].sort((left, right) => {
    const fractionalDifference = (right.value - Math.floor(right.value)) - (left.value - Math.floor(left.value));
    return fractionalDifference || weights.findIndex(([key]) => key === left.key) - weights.findIndex(([key]) => key === right.key);
  });
  let index = 0;
  while (remaining > 0) {
    const key = priority[index % priority.length].key;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    remaining -= 1;
    index += 1;
  }
  return {
    neighbor: counts.get("neighbor") ?? 0,
    compare: counts.get("compare") ?? 0,
    mental: counts.get("mental") ?? 0,
    vertical: counts.get("vertical") ?? 0,
    missing: counts.get("missing") ?? 0,
    application: counts.get("application") ?? 0,
    grouping: counts.get("grouping") ?? 0,
    lifeMath: counts.get("lifeMath") ?? 0,
  };
}

function buildMonthTwoDay(monthDay: number, seed: number, configInput: Partial<MonthTwoConfig>, usedLifeMathStorylineIds = new Set<string>(), usedApplicationStorylineIds = new Set<string>()): DailyWorksheet {
  const config = normalizeMonthTwoConfig(configInput);
  const blueprint = getMonthTwoDayBlueprint(monthDay);
  const phase = getMonthTwoPhase(monthDay);
  const day = MONTH_ONE_DAYS + monthDay;
  const plan: WorksheetDayPlan = { ...blueprint, day, month: 2, monthDay, stage: "reinforcement", phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, startDay: MONTH_ONE_DAYS + 1, endDay: WORKSHEET_PLAN_DAYS };
  const random = createSeededRandom(seed);
  const counts = getMonthTwoQuestionCounts(config);
  const sections: WorksheetSection[] = [
    { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(counts.neighbor, random, blueprint.numberMax) },
    { type: "tens-split", title: "数的组成", questions: buildTensSplitQuestions(counts.compare, random, blueprint.numberMax) },
    { type: "mental", title: "横式加减", questions: buildMentalQuestions(counts.mental, blueprint.methodTheme, random, { resultMax: blueprint.resultMax, binaryShape: blueprint.binaryShape, binaryTwoDigitRatio: blueprint.binaryTwoDigitRatio, threeNumberRatio: blueprint.threeNumberRatio, tripleMinTerm: blueprint.tripleMinTerm }) },
    { type: "vertical", title: "竖式加减", questions: buildVerticalQuestions(counts.vertical, blueprint, random, `month2-${monthDay}`) },
    { type: "missing-number", title: "填未知数", questions: buildMissingNumberQuestions(counts.missing, blueprint, random, `month2-${monthDay}`) },
    { type: "application", title: "加减应用题", questions: buildMonthTwoApplicationQuestions(counts.application, blueprint, random, `month2-${monthDay}`, usedApplicationStorylineIds) },
    { type: "grouping", title: "乘除启蒙", questions: buildGroupingQuestions(counts.grouping, blueprint, random, `month2-${monthDay}`) },
    { type: "life-math", title: "生活数学", questions: buildLifeMathQuestions(counts.lifeMath, blueprint, random, `month2-${monthDay}`, usedLifeMathStorylineIds) },
  ];
  return createDailyWorksheet({ id: `month2-${monthDay}`, day, stage: "reinforcement", stageDay: monthDay, phase: phase.phase, phaseTitle: phase.title, phaseSummary: phase.summary, title: blueprint.title, objective: blueprint.objective, sections, theme: blueprint.methodTheme, plan });
}

export function generateWorksheet(config: WorksheetConfig, seed = 1): { sections: readonly WorksheetSection[]; pages: readonly WorksheetPrintPage[]; total: number; theme: WorksheetTheme } {
  const normalized = normalizeWorksheetConfig(config);
  const total = normalized.neighborCount + normalized.compareCount + normalized.mentalCount + (normalized.applicationCount ?? 0);
  const sections: WorksheetSection[] = [
    { type: "neighbor", title: "相邻数", questions: buildNeighborQuestions(normalized.neighborCount, createSeededRandom(seed), 100) },
    { type: "tens-split", title: "数的组成", questions: buildTensSplitQuestions(normalized.compareCount, createSeededRandom(seed + 1), 100) },
    { type: "mental", title: "计算式", questions: buildMentalQuestions(normalized.mentalCount, normalized.theme, createSeededRandom(seed + 2), { resultMax: 100, binaryShape: "two-digit", binaryTwoDigitRatio: 0.5, threeNumberRatio: 0, tripleMinTerm: 1 }) },
    { type: "application", title: "应用题", questions: buildApplicationQuestions(normalized.applicationCount ?? 0, getReinforcementDayBlueprint(15), createSeededRandom(seed + 3), "worksheet") },
  ];
  const numbered = assignNumbers(sections, composeWorksheetPages(sections, false));
  return { sections: numbered.sections, pages: numbered.pages, total, theme: normalized.theme };
}

export function generateDailyWorksheet(day: number, seed = 1, overrides: DailyWorksheetOverrides = {}): DailyWorksheet {
  const safeDay = Number.isFinite(day) ? Math.max(1, Math.min(WORKSHEET_PLAN_DAYS, Math.trunc(day))) : 1;
  if (safeDay <= FOUNDATION_WORKSHEET_DAYS) return buildFoundationDay(safeDay);
  if (safeDay > MONTH_ONE_DAYS) return buildMonthTwoDay(safeDay - MONTH_ONE_DAYS, seed, { dailyQuestionCount: overrides.monthTwoQuestionCount });
  const base = DEFAULT_REINFORCEMENT_CONFIG;
  const hasCountOverrides = overrides.neighborCount !== undefined || overrides.compareCount !== undefined || overrides.mentalCount !== undefined || overrides.applicationCount !== undefined;
  const total = hasCountOverrides ? (overrides.neighborCount ?? 0) + (overrides.compareCount ?? 0) + (overrides.mentalCount ?? 0) + (overrides.applicationCount ?? 0) : base.dailyQuestionCount;
  const safeTotal = Math.max(MIN_WORKSHEET_QUESTIONS, Math.min(MAX_WORKSHEET_QUESTIONS, total));
  const custom = hasCountOverrides ? { dailyQuestionCount: safeTotal, neighborRatio: ((overrides.neighborCount ?? 0) / safeTotal) * 100, compareRatio: ((overrides.compareCount ?? 0) / safeTotal) * 100, applicationRatio: ((overrides.applicationCount ?? 0) / safeTotal) * 100 } : { ...base, dailyQuestionCount: safeTotal };
  const monthOneContext = overrides.monthOneMode === "low-repeat"
    ? {
      usedStorylineIds: new Set(overrides.monthOneUsedStorylineIds ?? []),
      usedQuestionSignatures: new Set(overrides.monthOneUsedQuestionSignatures ?? []),
    }
    : undefined;
  return buildReinforcementDay(safeDay - FOUNDATION_WORKSHEET_DAYS, seed, custom, monthOneContext);
}

export function generateWorksheetPlan(
  seed = 1,
  config: Partial<ReinforcementConfig> = {},
  monthTwoConfigInput: Partial<MonthTwoConfig> = {},
  options: WorksheetGenerationOptions = {},
): WorksheetPlan {
  const reinforcementConfig = normalizeReinforcementConfig({ ...DEFAULT_REINFORCEMENT_CONFIG, ...config });
  const monthTwoConfig = normalizeMonthTwoConfig({ ...DEFAULT_MONTH_TWO_CONFIG, ...monthTwoConfigInput });
  const monthOneMode = options.monthOneMode ?? "legacy";
  const foundationDays = Array.from({ length: FOUNDATION_WORKSHEET_DAYS }, (_, index) => buildFoundationDay(index + 1));
  const monthOneContext = monthOneMode === "low-repeat"
    ? { usedStorylineIds: new Set<string>(), usedQuestionSignatures: new Set<string>() }
    : undefined;
  const reinforcementDays = Array.from({ length: REINFORCEMENT_WORKSHEET_DAYS }, (_, index) => buildReinforcementDay(index + 1, seed + (index + 1) * 1009, reinforcementConfig, monthOneContext));
  const monthOneDays = [...foundationDays, ...reinforcementDays];
  const usedLifeMathStorylineIds = new Set<string>();
  const usedApplicationStorylineIds = new Set<string>();
  const monthTwoDays = Array.from({ length: MONTH_TWO_DAYS }, (_, index) => buildMonthTwoDay(index + 1, seed + (MONTH_ONE_DAYS + index + 1) * 1009, monthTwoConfig, usedLifeMathStorylineIds, usedApplicationStorylineIds));
  const days = [...monthOneDays, ...monthTwoDays];
  return { days, foundationDays, reinforcementDays, monthOneDays, monthTwoDays, reinforcementConfig, monthTwoConfig, monthOneMode, totalDays: days.length, totalQuestions: days.reduce((sum, day) => sum + day.total, 0) };
}

export type WorksheetExportRange = "month-one" | "month-two" | "all";

export function getExportDays(plan: WorksheetPlan, selection: boolean | WorksheetExportRange): readonly DailyWorksheet[] {
  if (typeof selection === "boolean") return selection ? plan.monthOneDays : plan.reinforcementDays;
  if (selection === "month-one") return plan.monthOneDays;
  if (selection === "month-two") return plan.monthTwoDays;
  return plan.days;
}
