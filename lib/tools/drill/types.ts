/** 计算练习册的题组模型：一份 = 一张 A4 双面，共 25 题。 */

export type DrillOperator = "+" | "-" | "×" | "÷";

/** 14 种题型；{@link DRILL_SEQUENCE} 规定轮换顺序，较短的题型与占地的题型交替。 */
export type DrillKind =
  | "oral" | "vertical" | "fill" | "spotError"
  | "chain" | "checkBack" | "compare" | "manyWays"
  | "operator" | "makeTen" | "inOut" | "numberLine"
  | "split" | "word";

/** 小题数据按题型判别。 */
export type DrillSign = "<" | ">" | "=";
export type DrillData =
  | { kind: "oral"; terms: readonly number[]; operators: readonly DrillOperator[] }
  | { kind: "fill"; a: number | null; b: number | null; result: number | null; operator: DrillOperator }
  | { kind: "vertical"; a: number; b: number; operator: "+" | "-" | "×" }
  | { kind: "chain"; terms: readonly number[]; operators: readonly DrillOperator[] }
  | { kind: "compare"; left: readonly number[]; right: readonly number[]; operator: DrillOperator }
  | { kind: "operator"; a: number; b: number; result: number }
  | { kind: "spotError"; a: number; b: number; operator: DrillOperator; shown: number }
  | { kind: "checkBack"; a: number; b: number; operator: "+" | "-" };
export type DrillAnswer =
  | { kind: "oral"; value: number }
  | { kind: "fill"; value: number; blank: 0 | 1 | 2 }
  | { kind: "vertical"; value: number }
  | { kind: "chain"; value: number }
  | { kind: "compare"; sign: DrillSign }
  | { kind: "operator"; value: DrillOperator }
  | { kind: "spotError"; value: number }
  | { kind: "checkBack"; value: number };
export type OralData = Extract<DrillData, { kind: "oral" }>;
export type OralAnswer = Extract<DrillAnswer, { kind: "oral" }>;
export type FillData = Extract<DrillData, { kind: "fill" }>;
export type VerticalData = Extract<DrillData, { kind: "vertical" }>;
export type ChainData = Extract<DrillData, { kind: "chain" }>;
export type CompareData = Extract<DrillData, { kind: "compare" }>;
export type OperatorData = Extract<DrillData, { kind: "operator" }>;
export type SpotErrorData = Extract<DrillData, { kind: "spotError" }>;
export type CheckBackData = Extract<DrillData, { kind: "checkBack" }>;

export interface DrillItem {
  id: string;
  /** 题目数据：排版只读这一项。 */
  data: DrillData;
  /** 答案只用于验题，排版从不读取。 */
  answer: DrillAnswer;
}

export interface DrillBlock {
  id: string;
  kind: DrillKind;
  /** 题块标题，写作「一、直接写出得数」。 */
  title: string;
  /** 一行说明，可为空。 */
  instruction: string;
  /** 小题横向几列。 */
  columns: number;
  /** 每行占的高度（毫米），题量分配与排版共用。 */
  rowHeight: number;
  items: readonly DrillItem[];
}

export type DrillSide = "front" | "back";
/** 沿用 title/prompt 字段，页面侧栏与预览直接可用。 */
export interface DrillPage {
  side: DrillSide;
  title: string;
  prompt: string;
  blocks: readonly DrillBlock[];
}
export type DrillPagePair = readonly [DrillPage & { side: "front" }, DrillPage & { side: "back" }];

export interface DrillSheet {
  id: string;
  /** 第几份，从 1 开始。 */
  sheet: number;
  title: string;
  objective: string;
  pages: DrillPagePair;
}

export type DrillMonthConfig = { count: number } | { year: number; month: number };
export interface DrillPlan {
  seed: number;
  config: DrillMonthConfig;
  sheets: readonly DrillSheet[];
  totalSheets: number;
}
