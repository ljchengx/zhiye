import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFImage, type PDFFont } from "pdf-lib";
import type { MathPdfCharacterAsset } from "./math-picture-assets";
import {
  isWorksheetCharacterAsset,
  worksheetImageSource,
  type WorksheetImageAsset,
} from "./number-sense/drawing";
import type { WorksheetExportSelection } from "./drill/types";
import {
  loadWorksheetFonts,
  MM_PER_POINT,
  type WorksheetFont,
} from "./number-sense/fonts";
import { pageNodes, type WorksheetDocument } from "./number-sense/layout";

export const MATH_FULL_PDF_FILENAME = "一程一成长-月度计算练习.pdf";
export type MathPdfExternalCharacterMimeType = "image/png" | "image/jpeg";
export interface MathPdfExternalCharacterAsset {
  bytes: ArrayBuffer;
  mimeType: MathPdfExternalCharacterMimeType;
}
export type MathPdfExternalCharacterAssets = Partial<
  Record<MathPdfCharacterAsset, MathPdfExternalCharacterAsset>
>;
export interface MathPdfGenerateRequest {
  type: "generate";
  document: WorksheetDocument;
  baseUrl: string;
  externalCharacters?: MathPdfExternalCharacterAssets;
}
export type MathPdfWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "complete"; bytes: ArrayBuffer; pageCount: number }
  | { type: "error"; message: string };

export function getMathBulkPdfFilename(
  selection: WorksheetExportSelection,
): string {
  if (selection.kind === "day")
    return `一程一成长-计算练习-第${selection.day}份-双面.pdf`;
  if (selection.kind === "range")
    return `一程一成长-计算练习-第${Math.min(selection.from, selection.to)}至${Math.max(selection.from, selection.to)}份-双面.pdf`;
  return MATH_FULL_PDF_FILENAME;
}

const pt = (value: number) => value / MM_PER_POINT;
const color = (hex: string) =>
  rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

export async function generateMathWorkbookPdf(
  document: WorksheetDocument,
  baseUrl: string,
  onProgress: (completed: number, total: number) => void = () => {},
  externalCharacters: MathPdfExternalCharacterAssets = {},
) {
  if (!document.pages.length) throw new Error("没有可导出的练习");
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const loaded = await loadWorksheetFonts(baseUrl);
  const fonts = Object.fromEntries(
    await Promise.all(
      Object.entries(loaded.bytes).map(async ([name, bytes]) => [
        name,
        await pdf.embedFont(bytes, { subset: false }),
      ]),
    ),
  ) as Record<WorksheetFont, PDFFont>;
  const images = new Map<WorksheetImageAsset, PDFImage>();
  const getImage = async (asset: WorksheetImageAsset) => {
    const cached = images.get(asset);
    if (cached) return cached;
    const external = isWorksheetCharacterAsset(asset) ? externalCharacters[asset] : undefined;
    let image: PDFImage;
    if (external)
      image =
        external.mimeType === "image/jpeg"
          ? await pdf.embedJpg(external.bytes)
          : await pdf.embedPng(external.bytes);
    else {
      const response = await fetch(
        new URL(worksheetImageSource(asset), baseUrl),
      );
      if (!response.ok) throw new Error("练习素材加载失败，请重试");
      image = await pdf.embedPng(await response.arrayBuffer());
    }
    images.set(asset, image);
    return image;
  };
  pdf.setTitle("一程一成长 · 计算练习");
  pdf.setAuthor("一程一成长");
  pdf.setSubject("月度计算 · 100 以内加减与九九表");
  for (const [index, sheet] of document.pages.entries()) {
    const page = pdf.addPage([pt(document.width), pt(document.height)]);
    // 所有坐标、字号、换行直接来自共享文档，导出时不进行第二次排版。
    for (const node of pageNodes(sheet)) {
      if (node.kind === "text")
        page.drawText(node.text, {
          x: pt(node.x),
          y: pt(document.height - node.baseline),
          size: node.size,
          font: fonts[node.font],
          color: color(node.color),
        });
      else if (node.kind === "line")
        page.drawLine({
          start: { x: pt(node.x1), y: pt(document.height - node.y1) },
          end: { x: pt(node.x2), y: pt(document.height - node.y2) },
          thickness: pt(node.weight),
          color: color(node.color),
          ...(node.dashed ? { dashArray: [pt(1), pt(1)] } : {}),
        });
      else if (node.kind === "rect")
        page.drawRectangle({
          x: pt(node.x),
          y: pt(document.height - node.y - node.height),
          width: pt(node.width),
          height: pt(node.height),
          ...(node.fill ? { color: color(node.fill) } : { opacity: 0 }),
          borderColor: node.stroke ? color(node.stroke) : undefined,
          borderWidth: node.stroke ? pt(node.weight) : 0,
          borderOpacity: 1,
        });
      else if (node.kind === "circle")
        page.drawCircle({
          x: pt(node.x),
          y: pt(document.height - node.y),
          size: pt(node.radius),
          ...(node.fill ? { color: color(node.fill) } : { opacity: 0 }),
          borderColor: node.stroke ? color(node.stroke) : undefined,
          borderWidth: node.stroke ? pt(node.weight) : 0,
          borderOpacity: 1,
        });
      else if (node.kind === "ellipse")
        page.drawEllipse({
          x: pt(node.x + node.width / 2),
          y: pt(document.height - node.y - node.height / 2),
          xScale: pt(node.width / 2),
          yScale: pt(node.height / 2),
          ...(node.fill ? { color: color(node.fill) } : { opacity: 0 }),
          borderColor: node.stroke ? color(node.stroke) : undefined,
          borderWidth: node.stroke ? pt(node.weight) : 0,
          borderOpacity: 1,
        });
      else if (node.kind === "path")
        page.drawSvgPath(node.d, {
          x: pt(node.x),
          y: pt(document.height - node.y),
          scale: pt(1),
          color: node.fill ? color(node.fill) : undefined,
          borderColor: node.stroke ? color(node.stroke) : undefined,
          // drawSvgPath 已整体缩放毫米坐标，线宽保留毫米，避免二次放大。
          borderWidth: node.stroke ? node.weight : 0,
        });
      else {
        const image = await getImage(node.asset),
          scale = Math.min(
            node.width / image.width,
            node.height / image.height,
          );
        const width = image.width * scale,
          height = image.height * scale;
        page.drawImage(image, {
          x: pt(node.x + (node.width - width) / 2),
          y: pt(document.height - node.y - (node.height + height) / 2),
          width: pt(width),
          height: pt(height),
        });
      }
    }
    onProgress(index + 1, document.pages.length);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return {
    bytes: await pdf.save({ useObjectStreams: true }),
    pageCount: pdf.getPageCount(),
  };
}
