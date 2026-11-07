import type { EstimateProblem, EstimateValidation } from "./activities-estimate";
import type { NumberProblem, NumberValidation } from "./activities-number";
import type { StrategyProblem, StrategyValidation } from "./activities-strategy";
import type { SpatialProblem, SpatialValidation } from "./activities-spatial";
import type { QuantityProblem, QuantityValidation } from "./activities-quantity";
import type { LogicProblem, LogicValidation } from "./activities-logic";

export type SkillId = "structure" | "distance" | "compose" | "relation" | "estimate" | "construct";
/** 第二次见面换掉的作答方式，测试会检查。 */
export type EditionShift = "direction" | "condition" | "representation" | "openness";
export interface ActivityDefinition {
  skill: SkillId;
  title: string;
  prompt: string;
  followUp: string;
  objective: string;
  repeatPrompt: string;
  repeatFollowUp: string;
  /** 以主要作答动作配对正反面，不把不同插图视为不同活动。 */
  action: "circle" | "draw" | "connect" | "fill" | "trace";
  repeatAction: "circle" | "draw" | "connect" | "fill" | "trace";
}
export type WorksheetSide = "front" | "back";
export type Operator = "+" | "-";
export interface Expression { terms: readonly number[]; operators: readonly Operator[] }
export type Pair = readonly [number, number];
export type Triple = readonly [number, number, number];
export interface WindowPuzzle {
  /** 3×3 窗格从左到右、从上到下编号为 0～8。 */
  pattern: readonly number[];
  turn: 1 | 2 | 3;
  options: readonly (readonly number[])[];
}
export interface PatternRule { start: number; step: number }
export type NumberSenseProblem =
  | SpatialProblem | QuantityProblem | LogicProblem | NumberProblem | EstimateProblem | StrategyProblem
  | { kind: "market"; prices: readonly [number, number, number, number, number, number]; budget: number; discount: number }
  | { kind: "sharing"; left: number; right: number; extra: number }
  | { kind: "parking"; occupied: readonly [readonly number[], readonly number[]]; moveFrom: 0 | 1; move: number }
  | { kind: "garden"; counts: Triple }
  | { kind: "route"; segments: readonly [number, number, number, number]; closed: number }
  | { kind: "windows"; puzzles: readonly WindowPuzzle[] }
  | { kind: "patterns"; rules: readonly PatternRule[] }
  | { kind: "measure"; lengths: Triple; offsets: Triple; unit: 1 };
export type SceneKind = NumberSenseProblem["kind"];

/** 内部验题数据不进入排版；索引均指向 problem 中对应材料。 */
export type TaskValidation =
  | SpatialValidation | QuantityValidation | LogicValidation | NumberValidation | EstimateValidation | StrategyValidation
  | { kind: "market"; values: readonly number[]; pairs: readonly Pair[]; unaffordable: readonly number[]; discountedPrices: readonly number[]; savings: Pair }
  | { kind: "sharing"; values: readonly number[]; move: number; each: number; eachWithExtra: number; addOrRemove: number; totalsAfter: Pair }
  | { kind: "parking"; values: readonly number[]; empty: Pair; after: Pair; arrivals: Pair; total: number; moreAfter: "A" | "B" | "same"; moreAfterArrival: "A" | "B" | "same" }
  | { kind: "garden"; values: readonly number[]; total: number; most: number; least: number; difference: number; removed: number; remaining: number }
  | { kind: "route"; values: readonly number[]; lengths: Pair; shorter: number; difference: number; open: number }
  | { kind: "windows"; values: readonly number[]; correctOptions: readonly number[]; rotated: readonly (readonly number[])[] }
  | { kind: "patterns"; values: readonly number[]; fourth: readonly number[]; second: readonly number[] }
  | { kind: "measure"; values: readonly number[]; actualLengths: Triple; longest: number; shortest: number; difference: number };
export interface NumberSenseTask {
  id: string;
  /** 同一活动第二次出现时，改为另一种操作或条件。换题保留此版本。 */
  edition: 0 | 1;
  skill: SkillId;
  template: string;
  title: string;
  prompt: string;
  followUp: string;
  problem: NumberSenseProblem;
  validation: TaskValidation;
}
export interface NumberSensePage { side: WorksheetSide; activity: NumberSenseTask }
export interface NumberSenseDay {
  id: string;
  day: number;
  title: string;
  objective: string;
  skills: readonly SkillId[];
  /** 每面只有一个完整场景；相关小问共享同一份材料。 */
  pages: readonly [NumberSensePage & { side: "front" }, NumberSensePage & { side: "back" }];
}
export type NumberSenseMonthConfig = { count: number } | { year: number; month: number };
export interface NumberSensePlan {
  seed: number;
  config: NumberSenseMonthConfig;
  days: readonly NumberSenseDay[];
  totalDays: number;
}
export type WorksheetExportSelection =
  | { kind: "day"; day: number }
  | { kind: "range"; from: number; to: number }
  | { kind: "all" };

// 独立聪明格与本地素材模块继续复用这些类型。
export interface KenkenCage {
  cells: readonly number[];
  operation: "+" | "-" | "=";
  target: number;
}
export interface KenkenProblem { kind: "kenken"; cages: readonly KenkenCage[] }
export type WorksheetIconKey =
  | "apple" | "pineapple" | "heart" | "star" | "fish" | "mushroom"
  | "coin" | "flower" | "block" | "ball" | "book" | "cookie" | "balloon";
