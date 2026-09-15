/// <reference lib="webworker" />

import {
  generateWorksheetPlan,
  type MonthTwoConfig,
  type ReinforcementConfig,
  type WorksheetPlan,
} from "../lib/tools/math-worksheet";

export interface MathWorksheetPlanGenerateRequest {
  type: "generate";
  seed: number;
  config: ReinforcementConfig;
  monthTwoConfig: MonthTwoConfig;
}

export type MathWorksheetPlanWorkerResponse =
  | { type: "complete"; plan: WorksheetPlan }
  | { type: "error"; message: string };

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<MathWorksheetPlanGenerateRequest>) => {
  if (event.data.type !== "generate") return;
  try {
    const plan = generateWorksheetPlan(event.data.seed, event.data.config, event.data.monthTwoConfig);
    workerScope.postMessage({ type: "complete", plan } satisfies MathWorksheetPlanWorkerResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "数学练习计划生成失败";
    workerScope.postMessage({ type: "error", message } satisfies MathWorksheetPlanWorkerResponse);
  }
};

export {};
