/// <reference lib="webworker" />
import {
  generateWorksheetPlan,
  regenerateWorksheetDay,
  type NumberSenseDay,
  type NumberSensePlan,
  type NumberSenseMonthConfig,
} from "../lib/tools/math-worksheet";
import { loadWorksheetFonts } from "../lib/tools/number-sense/fonts";
import {
  layoutWorksheetDay,
  layoutWorksheetDocument,
  type WorksheetDocument,
  type WorksheetPage,
} from "../lib/tools/number-sense/layout";

export type MathWorksheetPlanGenerateRequest =
  | {
      type: "generate";
      requestId: number;
      seed: number;
      baseUrl: string;
      config: NumberSenseMonthConfig;
      excluded?: readonly string[];
    }
  | {
      type: "regenerate-day";
      requestId: number;
      seed: number;
      baseUrl: string;
      day: number;
      plan: NumberSensePlan;
    };
export type MathWorksheetPlanWorkerResponse =
  | {
      type: "complete";
      requestId: number;
      plan: NumberSensePlan;
      document: WorksheetDocument;
    }
  | {
      type: "day-complete";
      requestId: number;
      day: NumberSenseDay;
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
      const day = regenerateWorksheetDay(
        message.plan,
        message.day,
        message.seed,
      );
      workerScope.postMessage({
        type: "day-complete",
        requestId: message.requestId,
        day,
        pages: layoutWorksheetDay(day, fonts),
      } satisfies MathWorksheetPlanWorkerResponse);
    } else {
      const plan = generateWorksheetPlan(
        message.seed,
        message.config,
        message.excluded,
      );
      workerScope.postMessage({
        type: "complete",
        requestId: message.requestId,
        plan,
        document: layoutWorksheetDocument(plan.days, fonts),
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
