/// <reference lib="webworker" />

import {
  generateMathWorkbookPdf,
  type MathPdfGenerateRequest,
  type MathPdfWorkerResponse,
} from "../lib/tools/math-pdf";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<MathPdfGenerateRequest>) => {
  if (event.data.type !== "generate") return;
  try {
    const result = await generateMathWorkbookPdf(event.data.worksheets, event.data.baseUrl, (completed, total) => {
      workerScope.postMessage({ type: "progress", completed, total } satisfies MathPdfWorkerResponse);
    });
    const bytes = new ArrayBuffer(result.bytes.byteLength);
    new Uint8Array(bytes).set(result.bytes);
    workerScope.postMessage({ type: "complete", bytes, pageCount: result.pageCount } satisfies MathPdfWorkerResponse, [bytes]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF 生成失败";
    workerScope.postMessage({ type: "error", message } satisfies MathPdfWorkerResponse);
  }
};

export {};
