/// <reference lib="webworker" />

import {
  generatePinyinWorkbookPdf,
  type PinyinPdfGenerateRequest,
  type PinyinPdfWorkerResponse,
} from "../lib/tools/pinyin-pdf";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<PinyinPdfGenerateRequest>) => {
  if (event.data.type !== "generate") return;
  try {
    const result = await generatePinyinWorkbookPdf(event.data.config, event.data.baseUrl, (completed, total) => {
      workerScope.postMessage({ type: "progress", completed, total } satisfies PinyinPdfWorkerResponse);
    });
    const bytes = new ArrayBuffer(result.bytes.byteLength);
    new Uint8Array(bytes).set(result.bytes);
    workerScope.postMessage({ type: "complete", bytes, pageCount: result.pageCount } satisfies PinyinPdfWorkerResponse, [bytes]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF 生成失败";
    workerScope.postMessage({ type: "error", message } satisfies PinyinPdfWorkerResponse);
  }
};

export {};
