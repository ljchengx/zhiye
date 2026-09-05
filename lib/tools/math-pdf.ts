import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
  type RGB,
} from "pdf-lib";

import {
  getMathPdfCharacter,
  MATH_PDF_CHARACTER_SOURCES,
  MATH_PDF_OBJECT_SOURCES,
  type MathPdfCharacterAsset,
  type MathPdfObjectAsset,
} from "./math-picture-assets";
import {
  FOUNDATION_WORKSHEET_DAYS,
  MENTAL_METHOD_LABELS,
  WORKSHEET_PLAN_DAYS,
  type ApplicationQuestion,
  type DailyWorksheet,
  type MentalQuestion,
  type NumberBondQuestion,
  type PictureEquationQuestion,
  type WorksheetIconKey,
  type WorksheetMethodExample,
  type WorksheetPageSection,
  type WorksheetPrintPage,
  type WorksheetQuestion,
} from "./math-worksheet";

export const MATH_FULL_PDF_FILENAME = "一程一成长-幼小数学练习-30天.pdf";
export const MATH_REINFORCEMENT_PDF_FILENAME = "一程一成长-幼小数学练习-强化25天.pdf";

export interface MathPdfGenerateRequest {
  type: "generate";
  worksheets: readonly DailyWorksheet[];
  baseUrl: string;
}

export type MathPdfWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "complete"; bytes: ArrayBuffer; pageCount: number }
  | { type: "error"; message: string };

export interface MathWorkbookPageEntry {
  day: number;
  pageNumber: number | null;
  blank: boolean;
}

interface PdfFonts {
  chinese: PDFFont;
  numeric: PDFFont;
  numericBold: PDFFont;
}

interface PdfRenderContext {
  document: PDFDocument;
  fonts: PdfFonts;
  objects: Map<MathPdfObjectAsset, PDFImage>;
  characters: Map<MathPdfCharacterAsset, PDFImage>;
  baseUrl: string;
}

const POINTS_PER_MM = 72 / 25.4;
const PAGE_WIDTH = 210 * POINTS_PER_MM;
const PAGE_HEIGHT = 297 * POINTS_PER_MM;
const CONTENT_LEFT_MM = 12;
const CONTENT_RIGHT_MM = 198;
const BODY_TOP_MM = 28;
const FOOTER_TOP_MM = 280;

const COLORS = {
  accent: hex("#e76a52"),
  accentDark: hex("#d44f3a"),
  ink: hex("#263439"),
  muted: hex("#6f7d82"),
  line: hex("#d9e2e4"),
  lineSoft: hex("#edf1f2"),
  paper: hex("#ffffff"),
  soft: hex("#fff6f1"),
};

function mm(value: number) {
  return value * POINTS_PER_MM;
}

function hex(value: string): RGB {
  const numeric = Number.parseInt(value.slice(1), 16);
  return rgb(((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255);
}

function yFromTop(topMm: number) {
  return PAGE_HEIGHT - mm(topMm);
}

function textBaseline(topMm: number, font: PDFFont, size: number) {
  return yFromTop(topMm) - font.heightAtSize(size, { descender: false });
}

function drawTextTop(page: PDFPage, text: string, xMm: number, topMm: number, font: PDFFont, size: number, color: RGB) {
  page.drawText(text, { x: mm(xMm), y: textBaseline(topMm, font, size), font, size, color });
  return font.widthOfTextAtSize(text, size) / POINTS_PER_MM;
}

function drawCenteredText(page: PDFPage, text: string, leftMm: number, topMm: number, widthMm: number, heightMm: number, font: PDFFont, size: number, color: RGB) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const textHeight = font.heightAtSize(size, { descender: false });
  page.drawText(text, {
    x: mm(leftMm) + Math.max(0, (mm(widthMm) - textWidth) / 2),
    y: yFromTop(topMm + heightMm) + Math.max(0, (mm(heightMm) - textHeight) / 2),
    font,
    size,
    color,
  });
}

function drawLine(page: PDFPage, x1Mm: number, y1TopMm: number, x2Mm: number, y2TopMm: number, color: RGB, thicknessMm = 0.25) {
  page.drawLine({
    start: { x: mm(x1Mm), y: yFromTop(y1TopMm) },
    end: { x: mm(x2Mm), y: yFromTop(y2TopMm) },
    color,
    thickness: mm(thicknessMm),
  });
}

function fitText(text: string, font: PDFFont, size: number, maxWidthMm: number) {
  if (font.widthOfTextAtSize(text, size) <= mm(maxWidthMm)) return text;
  let result = text;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}…`, size) > mm(maxWidthMm)) result = result.slice(0, -1);
  return `${result}…`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidthMm: number, maxLines: number) {
  const lines: string[] = [];
  let current = "";
  for (const character of text) {
    const candidate = current + character;
    if (current && font.widthOfTextAtSize(candidate, size) > mm(maxWidthMm)) {
      lines.push(current);
      current = character;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  const consumed = lines.join("").length;
  if (consumed < text.length && lines.length > 0) lines[lines.length - 1] = fitText(lines[lines.length - 1], font, size, maxWidthMm);
  return lines;
}

async function fetchBytes(baseUrl: string, path: string) {
  const response = await fetch(new URL(path, baseUrl));
  if (!response.ok) throw new Error(`资源加载失败：${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function ensureObject(context: PdfRenderContext, asset: MathPdfObjectAsset) {
  const cached = context.objects.get(asset);
  if (cached) return cached;
  const image = await context.document.embedPng(await fetchBytes(context.baseUrl, MATH_PDF_OBJECT_SOURCES[asset]));
  context.objects.set(asset, image);
  return image;
}

async function ensureCharacter(context: PdfRenderContext, asset: MathPdfCharacterAsset) {
  const cached = context.characters.get(asset);
  if (cached) return cached;
  const image = await context.document.embedPng(await fetchBytes(context.baseUrl, MATH_PDF_CHARACTER_SOURCES[asset]));
  context.characters.set(asset, image);
  return image;
}

function drawContainedImage(page: PDFPage, image: PDFImage, leftMm: number, topMm: number, widthMm: number, heightMm: number) {
  const scale = Math.min(mm(widthMm) / image.width, mm(heightMm) / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, {
    x: mm(leftMm) + (mm(widthMm) - width) / 2,
    y: yFromTop(topMm + heightMm) + (mm(heightMm) - height) / 2,
    width,
    height,
  });
}

async function drawCountGroup(page: PDFPage, count: number, icon: WorksheetIconKey, leftMm: number, topMm: number, widthMm: number, heightMm: number, context: PdfRenderContext) {
  if (count <= 0) return;
  if (count <= 10) {
    const image = await ensureObject(context, icon);
    const columns = Math.min(5, count);
    const rows = Math.ceil(count / 5);
    const iconSize = Math.min(4.2, heightMm / rows - 0.7, widthMm / columns - 0.7);
    const gap = 0.65;
    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(index / 5);
      const itemsInRow = row === rows - 1 ? count - row * 5 : 5;
      const rowWidth = itemsInRow * iconSize + Math.max(0, itemsInRow - 1) * gap;
      const x = leftMm + (widthMm - rowWidth) / 2 + (index % 5) * (iconSize + gap);
      const y = topMm + (heightMm - (rows * iconSize + (rows - 1) * gap)) / 2 + row * (iconSize + gap);
      drawContainedImage(page, image, x, y, iconSize, iconSize);
    }
    return;
  }

  const [tenRod, oneStick] = await Promise.all([ensureObject(context, "ten-rod"), ensureObject(context, "one-stick")]);
  const tens = Math.floor(count / 10);
  const ones = count % 10;
  const rodWidth = 2.15;
  const rodHeight = Math.min(7.5, heightMm);
  const stickWidth = 1.6;
  const stickHeight = Math.min(3.7, heightMm);
  const totalWidth = tens * rodWidth + Math.max(0, tens - 1) * 0.45 + (ones > 0 ? 1.5 + ones * stickWidth + Math.max(0, ones - 1) * 0.35 : 0);
  let x = leftMm + Math.max(0, (widthMm - totalWidth) / 2);
  for (let index = 0; index < tens; index += 1) {
    drawContainedImage(page, tenRod, x, topMm + (heightMm - rodHeight) / 2, rodWidth, rodHeight);
    x += rodWidth + 0.45;
  }
  if (ones > 0) x += 1.05;
  for (let index = 0; index < ones; index += 1) {
    drawContainedImage(page, oneStick, x, topMm + (heightMm - stickHeight) / 2, stickWidth, stickHeight);
    x += stickWidth + 0.35;
  }
}

export function getMathBulkPdfFilename(includeFoundation: boolean) {
  return includeFoundation ? MATH_FULL_PDF_FILENAME : MATH_REINFORCEMENT_PDF_FILENAME;
}

export function getMathWorkbookPageEntries(worksheets: readonly DailyWorksheet[]): readonly MathWorkbookPageEntry[] {
  return worksheets.flatMap((worksheet) => {
    const pages = worksheet.pages.map((page) => ({ day: worksheet.day, pageNumber: page.pageNumber, blank: false }));
    return worksheet.pages.length % 2 === 1 ? [...pages, { day: worksheet.day, pageNumber: null, blank: true }] : pages;
  });
}

export function getMathWorkbookPrintPageCount(worksheets: readonly DailyWorksheet[]) {
  return getMathWorkbookPageEntries(worksheets).length;
}

function drawHeader(page: PDFPage, worksheet: DailyWorksheet, context: PdfRenderContext, character: PDFImage) {
  const stageLabel = worksheet.stage === "foundation"
    ? `基础 ${worksheet.stageDay}/${FOUNDATION_WORKSHEET_DAYS}`
    : `强化 ${worksheet.stageDay}/${WORKSHEET_PLAN_DAYS - FOUNDATION_WORKSHEET_DAYS}`;
  drawTextTop(page, stageLabel, CONTENT_LEFT_MM, 15, context.fonts.chinese, 10, COLORS.accent);
  drawTextTop(page, "数学练习", 35, 12.4, context.fonts.chinese, 16, COLORS.ink);
  drawTextTop(page, fitText(worksheet.title, context.fonts.chinese, 9, 62), 64, 16, context.fonts.chinese, 9, COLORS.muted);
  drawContainedImage(page, character, 144, 11.5, 15, 15);
  drawTextTop(page, "日期", 164, 17, context.fonts.chinese, 9.5, COLORS.muted);
  drawLine(page, 174, 22.5, CONTENT_RIGHT_MM, 22.5, COLORS.muted, 0.35);
}

async function drawMethodExample(page: PDFPage, lesson: WorksheetMethodExample, topMm: number, context: PdfRenderContext) {
  page.drawRectangle({ x: mm(CONTENT_LEFT_MM), y: yFromTop(topMm + 34), width: mm(CONTENT_RIGHT_MM - CONTENT_LEFT_MM), height: mm(34), color: COLORS.soft });
  drawTextTop(page, "今天学", 16, topMm + 7, context.fonts.chinese, 9, COLORS.accent);
  drawTextTop(page, lesson.title, 16, topMm + 15, context.fonts.chinese, 13, COLORS.accentDark);

  await drawCountGroup(page, lesson.original.left, lesson.icon, 44, topMm + 4, 25, 13, context);
  drawCenteredText(page, lesson.original.operator, 69, topMm + 5, 7, 10, context.fonts.numericBold, 13, COLORS.ink);
  await drawCountGroup(page, lesson.original.right, lesson.icon, 76, topMm + 4, 25, 13, context);
  drawCenteredText(page, "=", 101, topMm + 5, 7, 10, context.fonts.numericBold, 13, COLORS.ink);
  drawCenteredText(page, String(lesson.original.answer), 108, topMm + 5, 10, 10, context.fonts.numericBold, 13, COLORS.ink);

  if (lesson.method === "number-bond" || lesson.method === "picture-equation") {
    const note = lesson.method === "number-bond"
      ? `${lesson.splitSource} 分成 ${lesson.split[0]} 和 ${lesson.split[1]}`
      : "看清两组数量，再写出算式";
    drawTextTop(page, note, 126, topMm + 8, context.fonts.chinese, 10, COLORS.muted);
    return;
  }

  drawTextTop(page, `拆 ${lesson.splitSource} = ${lesson.split[0]} + ${lesson.split[1]}`, 47, topMm + 21, context.fonts.chinese, 10, COLORS.muted);
  const first = lesson.steps[0];
  const second = lesson.steps[1];
  drawTextTop(page, `先 ${first.left} ${first.operator} ${first.right} = ${first.answer}`, 96, topMm + 21, context.fonts.chinese, 10, COLORS.ink);
  drawTextTop(page, `再 ${second.left} ${second.operator} ${second.right} = ${second.answer}`, 146, topMm + 21, context.fonts.chinese, 10, COLORS.ink);
}

function drawSectionHeading(page: PDFPage, title: string, topMm: number, context: PdfRenderContext) {
  drawTextTop(page, title, CONTENT_LEFT_MM, topMm + 2.2, context.fonts.chinese, 12, COLORS.ink);
  drawLine(page, CONTENT_LEFT_MM, topMm + 9, CONTENT_RIGHT_MM, topMm + 9, COLORS.line, 0.35);
}

function drawQuestionNumber(page: PDFPage, number: number, leftMm: number, topMm: number, context: PdfRenderContext) {
  drawTextTop(page, `${number}.`, leftMm, topMm, context.fonts.numeric, 8.5, COLORS.muted);
}

function drawAnswerLine(page: PDFPage, leftMm: number, topMm: number, widthMm: number) {
  drawLine(page, leftMm, topMm, leftMm + widthMm, topMm, COLORS.muted, 0.4);
}

function drawNumberSenseQuestion(page: PDFPage, question: WorksheetQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  if (question.type !== "neighbor" && question.type !== "compare") return;
  drawQuestionNumber(page, question.number, leftMm, topMm + 5.2, context);
  drawCenteredText(page, String(question.left), leftMm + 6, topMm + 2.5, 10, 10, context.fonts.numericBold, 15, COLORS.ink);
  if (question.type === "neighbor") {
    drawAnswerLine(page, leftMm + 18, topMm + 10.5, 11);
  } else {
    page.drawRectangle({ x: mm(leftMm + 19), y: yFromTop(topMm + 12), width: mm(9), height: mm(9), borderColor: COLORS.muted, borderWidth: mm(0.35) });
  }
  drawCenteredText(page, String(question.right), leftMm + 31, topMm + 2.5, Math.max(8, widthMm - 33), 10, context.fonts.numericBold, 15, COLORS.ink);
}

function drawNumberSenseSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const neighbors = section.questions.filter((question) => question.type === "neighbor");
  const compares = section.questions.filter((question) => question.type === "compare");
  const halfWidth = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM - 6) / 2;
  if (section.title) {
    drawSectionHeading(page, section.title, topMm, context);
    if (compares.length > 0) drawTextTop(page, "比大小", CONTENT_LEFT_MM + halfWidth + 6, topMm + 2.2, context.fonts.chinese, 12, COLORS.ink);
  }
  const rowTop = topMm + (section.title ? 9 : 0);
  const cellWidth = halfWidth / 2;
  neighbors.forEach((question, index) => drawNumberSenseQuestion(page, question, CONTENT_LEFT_MM + (index % 2) * cellWidth, rowTop + Math.floor(index / 2) * 16, cellWidth, context));
  compares.forEach((question, index) => drawNumberSenseQuestion(page, question, CONTENT_LEFT_MM + halfWidth + 6 + (index % 2) * cellWidth, rowTop + Math.floor(index / 2) * 16, cellWidth, context));
}

async function drawPictureBond(page: PDFPage, question: NumberBondQuestion, leftMm: number, topMm: number, widthMm: number, heightMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 2, context);
  const contentLeft = leftMm + 7;
  const groupWidth = Math.min(24, (widthMm - 18) / 2);
  await drawCountGroup(page, question.knownPart, question.icon, contentLeft, topMm + 1, groupWidth, 12, context);
  drawCenteredText(page, "+", contentLeft + groupWidth, topMm + 3, 5, 8, context.fonts.numericBold, 13, COLORS.ink);
  await drawCountGroup(page, question.answer, question.icon, contentLeft + groupWidth + 5, topMm + 1, groupWidth, 12, context);
  const formula = `${question.whole} = ${question.knownPart} +`;
  const formulaWidth = context.fonts.numeric.widthOfTextAtSize(formula, 15) / POINTS_PER_MM;
  const formulaLeft = leftMm + Math.max(7, (widthMm - formulaWidth - 17) / 2);
  drawTextTop(page, formula, formulaLeft, topMm + heightMm - 10, context.fonts.numeric, 15, COLORS.ink);
  drawAnswerLine(page, formulaLeft + formulaWidth + 3, topMm + heightMm - 4, 14);
}

function drawSimpleBond(page: PDFPage, question: NumberBondQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 6, context);
  const formula = question.mode === "compose" ? `${question.knownPart} +` : `${question.whole} = ${question.knownPart} +`;
  const suffix = question.mode === "compose" ? `= ${question.whole}` : "";
  drawTextTop(page, formula, leftMm + 6, topMm + 5, context.fonts.numeric, 12.5, COLORS.ink);
  const formulaWidth = context.fonts.numeric.widthOfTextAtSize(formula, 12.5) / POINTS_PER_MM;
  const lineLeft = leftMm + 7 + formulaWidth;
  drawAnswerLine(page, lineLeft, topMm + 13, 11);
  if (suffix) drawTextTop(page, suffix, lineLeft + 14, topMm + 5, context.fonts.numeric, 12.5, COLORS.ink);
  drawLine(page, leftMm, topMm + 22, leftMm + widthMm - 2, topMm + 22, COLORS.lineSoft, 0.18);
}

async function drawCompositionSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 9 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.type !== "number-bond") continue;
    const left = CONTENT_LEFT_MM + index * width;
    if (question.mode === "picture-split") await drawPictureBond(page, question, left, contentTop, width, section.rowHeightMm, context);
    else drawSimpleBond(page, question, left, contentTop, width, context);
  }
}

async function drawPictureEquation(page: PDFPage, question: PictureEquationQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 2, context);
  const visualLeft = leftMm + 9;
  const groupWidth = Math.min(28, (widthMm - 21) / 2);
  await drawCountGroup(page, question.leftCount, question.icon, visualLeft, topMm + 1, groupWidth, 15, context);
  drawCenteredText(page, question.operator, visualLeft + groupWidth, topMm + 4, 5, 8, context.fonts.numericBold, 14, COLORS.ink);
  await drawCountGroup(page, question.rightCount, question.icon, visualLeft + groupWidth + 5, topMm + 1, groupWidth, 15, context);
  drawAnswerLine(page, leftMm + (widthMm - 42) / 2, topMm + 26, 42);
}

async function drawPictureEquationSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 9 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.type === "picture-equation") await drawPictureEquation(page, question, CONTENT_LEFT_MM + index * width, contentTop, width, context);
  }
}

async function drawGuidedQuestion(page: PDFPage, question: MentalQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  const guidance = question.guidance;
  if (!guidance) return;
  drawQuestionNumber(page, question.number, leftMm, topMm + 2, context);
  drawTextTop(page, MENTAL_METHOD_LABELS[question.method], leftMm + widthMm - 20, topMm + 2, context.fonts.chinese, 9.5, COLORS.accentDark);
  await drawCountGroup(page, question.left, guidance.icon, leftMm + 10, topMm + 7, 25, 12, context);
  drawCenteredText(page, question.operator, leftMm + 35, topMm + 9, 5, 8, context.fonts.numericBold, 13, COLORS.ink);
  await drawCountGroup(page, question.right, guidance.icon, leftMm + 40, topMm + 7, 25, 12, context);
  const equation = `${question.left} ${question.operator} ${question.right} =`;
  const equationWidth = context.fonts.numericBold.widthOfTextAtSize(equation, 14) / POINTS_PER_MM;
  const equationLeft = leftMm + Math.max(8, (widthMm - equationWidth - 18) / 2);
  drawTextTop(page, equation, equationLeft, topMm + 21, context.fonts.numericBold, 14, COLORS.ink);
  drawAnswerLine(page, equationLeft + equationWidth + 3, topMm + 29, 15);
  drawCenteredText(page, `${guidance.splitSource} = ${guidance.split[0]} + ${guidance.split[1]}`, leftMm, topMm + 32, widthMm, 6, context.fonts.numericBold, 10.5, COLORS.muted);
  const steps = guidance.steps.map((step) => `${step.left} ${step.operator} ${step.right} = ${step.answer}`).join("  →  ");
  drawCenteredText(page, steps, leftMm, topMm + 40, widthMm, 8, context.fonts.numericBold, 10.5, COLORS.ink);
}

async function drawGuidedSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 9 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM - 6) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.type !== "mental") continue;
    const left = CONTENT_LEFT_MM + index * (width + 6);
    await drawGuidedQuestion(page, question, left, contentTop, width, context);
    if (index > 0) drawLine(page, left - 3, contentTop, left - 3, contentTop + section.rowHeightMm, COLORS.lineSoft, 0.25);
  }
}

function mentalExpression(question: MentalQuestion) {
  return question.third === undefined
    ? `${question.left} ${question.operator} ${question.right} =`
    : `${question.left} ${question.operator} ${question.right} ${question.secondOperator} ${question.third} =`;
}

function drawMentalSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 9 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  section.questions.forEach((question, index) => {
    if (question.type !== "mental") return;
    const left = CONTENT_LEFT_MM + index * width;
    drawQuestionNumber(page, question.number, left, contentTop + 5.5, context);
    const expression = mentalExpression(question);
    const expressionSize = section.columns === 2 ? 14.5 : 15;
    const expressionWidth = context.fonts.numeric.widthOfTextAtSize(expression, expressionSize) / POINTS_PER_MM;
    drawTextTop(page, expression, left + 7, contentTop + 4.2, context.fonts.numeric, expressionSize, COLORS.ink);
    drawAnswerLine(page, left + 9 + expressionWidth, contentTop + 13, 18);
    drawLine(page, left, contentTop + section.rowHeightMm, left + width - 2, contentTop + section.rowHeightMm, COLORS.lineSoft, 0.18);
  });
}

async function drawApplicationSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 9 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const question = section.questions[0];
  if (!question || question.type !== "application") return;
  await drawApplicationQuestion(page, question, contentTop, section.rowHeightMm, context);
}

async function drawApplicationQuestion(page: PDFPage, question: ApplicationQuestion, topMm: number, heightMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, CONTENT_LEFT_MM, topMm + 3, context);
  const image = await ensureObject(context, question.icon);
  drawContainedImage(page, image, CONTENT_LEFT_MM + 7, topMm + 2, 9, 9);
  const lines = wrapText(question.prompt, context.fonts.chinese, 12, 160, 2);
  lines.forEach((line, index) => drawTextTop(page, line, CONTENT_LEFT_MM + 19, topMm + 2 + index * 6.8, context.fonts.chinese, 12, COLORS.ink));
  drawLine(page, CONTENT_LEFT_MM + 19, topMm + heightMm - 4, CONTENT_RIGHT_MM - 6, topMm + heightMm - 4, COLORS.lineSoft, 0.18);
}

async function drawPageSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  if (section.type === "number-sense") drawNumberSenseSection(page, section, topMm, context);
  if (section.type === "composition") await drawCompositionSection(page, section, topMm, context);
  if (section.type === "picture-equation") await drawPictureEquationSection(page, section, topMm, context);
  if (section.type === "guided") await drawGuidedSection(page, section, topMm, context);
  if (section.type === "mental") drawMentalSection(page, section, topMm, context);
  if (section.type === "application") await drawApplicationSection(page, section, topMm, context);
}

function drawFooter(page: PDFPage, worksheet: DailyWorksheet, printPage: WorksheetPrintPage, context: PdfRenderContext) {
  drawLine(page, CONTENT_LEFT_MM, FOOTER_TOP_MM, CONTENT_RIGHT_MM, FOOTER_TOP_MM, COLORS.line, 0.25);
  drawTextTop(page, `第 ${worksheet.day} / ${WORKSHEET_PLAN_DAYS} 天`, CONTENT_LEFT_MM, 282.2, context.fonts.chinese, 8.5, COLORS.muted);
  const rightText = `第 ${printPage.pageNumber} / ${printPage.pageCount} 页 · 本页 ${printPage.questionCount} 题`;
  const width = context.fonts.chinese.widthOfTextAtSize(rightText, 8.5) / POINTS_PER_MM;
  drawTextTop(page, rightText, CONTENT_RIGHT_MM - width, 282.2, context.fonts.chinese, 8.5, COLORS.muted);
}

async function drawWorksheetPage(context: PdfRenderContext, worksheet: DailyWorksheet, printPage: WorksheetPrintPage) {
  const page = context.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.paper });
  const character = await ensureCharacter(context, getMathPdfCharacter(worksheet.day));
  drawHeader(page, worksheet, context, character);

  let topMm = BODY_TOP_MM;
  if (printPage.showMethod && worksheet.methodLesson) {
    await drawMethodExample(page, worksheet.methodLesson, topMm, context);
    topMm += 34;
  }
  for (const section of printPage.sections) {
    await drawPageSection(page, section, topMm, context);
    topMm += section.rowHeightMm + (section.title ? 9 : 0);
  }
  drawFooter(page, worksheet, printPage, context);
}

async function createRenderContext(baseUrl: string) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const [chineseBytes, numericBytes, numericBoldBytes] = await Promise.all([
    fetchBytes(baseUrl, "/fonts/noto-sans-sc-math-subset.ttf"),
    fetchBytes(baseUrl, "/fonts/andika-regular.ttf"),
    fetchBytes(baseUrl, "/fonts/andika-bold.ttf"),
  ]);
  const [chinese, numeric, numericBold] = await Promise.all([
    document.embedFont(chineseBytes, { subset: false }),
    document.embedFont(numericBytes, { subset: true }),
    document.embedFont(numericBoldBytes, { subset: true }),
  ]);
  document.setTitle("一程一成长 · 幼小数学练习");
  document.setAuthor("一程一成长");
  document.setSubject("5 天基础引导与 25 天强化训练练习纸");
  document.setKeywords(["数学练习", "幼小启蒙", "家庭自用"]);
  document.setCreator("一程一成长");
  return { document, fonts: { chinese, numeric, numericBold }, objects: new Map(), characters: new Map(), baseUrl } satisfies PdfRenderContext;
}

export async function generateMathWorkbookPdf(
  worksheets: readonly DailyWorksheet[],
  baseUrl: string,
  onProgress: (completed: number, total: number) => void,
) {
  if (worksheets.length === 0) throw new Error("没有可导出的数学练习");
  const context = await createRenderContext(baseUrl);
  for (let index = 0; index < worksheets.length; index += 1) {
    const worksheet = worksheets[index] as DailyWorksheet;
    for (const printPage of worksheet.pages) await drawWorksheetPage(context, worksheet, printPage);
    // 每天独立配对，单数内容页后补空白背面。
    if (worksheet.pages.length % 2 === 1) context.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    onProgress(index + 1, worksheets.length);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const bytes = await context.document.save({ useObjectStreams: true });
  return { bytes, pageCount: context.document.getPageCount() };
}
