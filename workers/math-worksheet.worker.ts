/// <reference lib="webworker" />
import {
  generateDrillPlan,
  layoutDrillPlan,
  layoutDrillSheet,
  regenerateDrillSheet,
  type DrillMonthConfig,
  type DrillPlan,
  type DrillSheet,
} from "../lib/tools/math-worksheet";
import { loadWorksheetFonts } from "../lib/tools/number-sense/fonts";
import type { WorksheetDocument, WorksheetPage } from "../lib/tools/number-sense/layout";

export type MathWorksheetPlanGenerateRequest =
  | {
      type: "generate";
      requestId: number;
      seed: number;
      baseUrl: string;
      config: DrillMonthConfig;
      /** 保留字段：本册按份生成，同种子可复现，不再逐份排除原来的题。 */
      excluded?: readonly string[];
    }
  | {
      type: "regenerate-day";
      requestId: number;
      seed: number;
      baseUrl: string;
      day: number;
      plan: DrillPlan;
    };
export type MathWorksheetPlanWorkerResponse =
  | {
      type: "complete";
      requestId: number;
      plan: DrillPlan;
      document: WorksheetDocument;
    }
  | {
      type: "day-complete";
      requestId: number;
      day: DrillSheet;
      pages: readonly [WorksheetPage, WorksheetPage];
    }
  | { type: "error"; requestId: number; message: string };

const workerScope = self as DedicatedWorkerGlobalScope;
workerScope.onmessage = async (
  event: MessageEvent<MathWorksheetPlanGenerateRequest>,
) => {
  const message = event.data;
  try {
    const fonts = await loadWorksheetFonts(message.baseUrl);
    if (message.type === "regenerate-day") {
      const sheet = regenerateDrillSheet(message.plan, message.day, message.seed);
      workerScope.postMessage({
        type: "day-complete",
        requestId: message.requestId,
        day: sheet,
        pages: layoutDrillSheet(sheet, fonts, message.plan.seed),
      } satisfies MathWorksheetPlanWorkerResponse);
    } else {
      const plan = generateDrillPlan(message.seed, message.config);
      workerScope.postMessage({
        type: "complete",
        requestId: message.requestId,
        plan,
        document: layoutDrillPlan(plan.sheets, fonts, plan.seed),
      } satisfies MathWorksheetPlanWorkerResponse);
    }
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      requestId: message.requestId,
      message: error instanceof Error ? error.message : "练习生成失败，请重试",
    } satisfies MathWorksheetPlanWorkerResponse);
  }
};
export {};
