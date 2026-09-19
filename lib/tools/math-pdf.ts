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
  getWorksheetCompanionGreeting,
  MATH_PDF_CHARACTER_SOURCES,
  MATH_PDF_OBJECT_SOURCES,
  type MathPdfCharacterAsset,
  type MathPdfObjectAsset,
} from "./math-picture-assets";
import {
  FOUNDATION_WORKSHEET_DAYS,
  MENTAL_METHOD_LABELS,
  MONTH_TWO_DAYS,
  REINFORCEMENT_WORKSHEET_DAYS,
  WORKSHEET_PAPER_HEADER_HEIGHT_MM,
  WORKSHEET_PAPER_PADDING_TOP_MM,
  WORKSHEET_PAGE_BODY_HEIGHT_MM,
  WORKSHEET_PLAN_DAYS,
  type ApplicationQuestion,
  type DailyWorksheet,
  type GroupingQuestion,
  type LifeMathQuestion,
  type MentalQuestion,
  type MissingNumberQuestion,
  type NumberBondQuestion,
  type PictureEquationQuestion,
  type WorksheetIconKey,
  type WorksheetMethodExample,
  type WorksheetPageSection,
  type WorksheetPrintPage,
  type WorksheetQuestion,
  type VerticalCalculationQuestion,
  type WorksheetExportRange,
} from "./math-worksheet";

export const MATH_FULL_PDF_FILENAME = "一程一成长-幼小数学练习-60天.pdf";
export const MATH_MONTH_ONE_PDF_FILENAME = "一程一成长-幼小数学练习-第1个月-30天.pdf";
export const MATH_MONTH_TWO_PDF_FILENAME = "一程一成长-幼小数学练习-第2个月-30天.pdf";
export const MATH_REINFORCEMENT_PDF_FILENAME = "一程一成长-幼小数学练习-强化25天.pdf";

export type MathPdfExternalCharacterMimeType = "image/png" | "image/jpeg";

export interface MathPdfExternalCharacterAsset {
  bytes: ArrayBuffer;
  mimeType: MathPdfExternalCharacterMimeType;
}

export type MathPdfExternalCharacterAssets = Partial<Record<MathPdfCharacterAsset, MathPdfExternalCharacterAsset>>;

export interface MathPdfGenerateRequest {
  type: "generate";
  worksheets: readonly DailyWorksheet[];
  baseUrl: string;
  externalCharacters?: MathPdfExternalCharacterAssets;
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
  externalCharacters: MathPdfExternalCharacterAssets;
}

const POINTS_PER_MM = 72 / 25.4;
const PAGE_WIDTH = 210 * POINTS_PER_MM;
const PAGE_HEIGHT = 297 * POINTS_PER_MM;
const CONTENT_LEFT_MM = 12;
const CONTENT_RIGHT_MM = 198;
const BODY_TOP_MM = WORKSHEET_PAPER_PADDING_TOP_MM + WORKSHEET_PAPER_HEADER_HEIGHT_MM;
const FOOTER_TOP_MM = WORKSHEET_PAPER_PADDING_TOP_MM + WORKSHEET_PAPER_HEADER_HEIGHT_MM + WORKSHEET_PAGE_BODY_HEIGHT_MM;

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

function drawRightText(page: PDFPage, text: string, leftMm: number, topMm: number, widthMm: number, heightMm: number, font: PDFFont, size: number, color: RGB) {
  const textWidth = font.widthOfTextAtSize(text, size) / POINTS_PER_MM;
  const textHeight = font.heightAtSize(size, { descender: false }) / POINTS_PER_MM;
  drawTextTop(page, text, leftMm + widthMm - textWidth, topMm + Math.max(0, (heightMm - textHeight) / 2), font, size, color);
}

function drawLeftText(page: PDFPage, text: string, leftMm: number, topMm: number, heightMm: number, font: PDFFont, size: number, color: RGB) {
  const textHeight = font.heightAtSize(size, { descender: false }) / POINTS_PER_MM;
  drawTextTop(page, text, leftMm, topMm + Math.max(0, (heightMm - textHeight) / 2), font, size, color);
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
  const external = context.externalCharacters[asset];
  const image = external
    ? external.mimeType === "image/jpeg"
      ? await context.document.embedJpg(new Uint8Array(external.bytes))
      : await context.document.embedPng(new Uint8Array(external.bytes))
    : await context.document.embedPng(await fetchBytes(context.baseUrl, MATH_PDF_CHARACTER_SOURCES[asset]));
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

async function drawCountGroup(page: PDFPage, count: number, icon: WorksheetIconKey, leftMm: number, topMm: number, widthMm: number, heightMm: number, context: PdfRenderContext, crossedCount = 0) {
  if (count <= 0) return;
  if (count <= 10) {
    const image = await ensureObject(context, icon);
    const columns = Math.min(5, count);
    const rows = Math.ceil(count / 5);
    const iconSize = Math.min(6.4, heightMm / rows - 0.5, widthMm / columns - 0.5);
    const gap = 0.65;
    const crossed = Math.max(0, Math.min(count, Math.trunc(crossedCount)));
    for (let index = 0; index < count; index += 1) {
      const row = Math.floor(index / 5);
      const itemsInRow = row === rows - 1 ? count - row * 5 : 5;
      const rowWidth = itemsInRow * iconSize + Math.max(0, itemsInRow - 1) * gap;
      const x = leftMm + (widthMm - rowWidth) / 2 + (index % 5) * (iconSize + gap);
      const y = topMm + (heightMm - (rows * iconSize + (rows - 1) * gap)) / 2 + row * (iconSize + gap);
      drawContainedImage(page, image, x, y, iconSize, iconSize);
      if (index >= count - crossed) drawLine(page, x, y + iconSize * 0.55, x + iconSize, y + iconSize * 0.35, COLORS.ink, 0.45);
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

export function getMathBulkPdfFilename(selection: boolean | WorksheetExportRange) {
  if (selection === false) return MATH_REINFORCEMENT_PDF_FILENAME;
  if (selection === "month-one") return MATH_MONTH_ONE_PDF_FILENAME;
  if (selection === "month-two") return MATH_MONTH_TWO_PDF_FILENAME;
  return MATH_FULL_PDF_FILENAME;
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
  const stageLabel = worksheet.month === 2
    ? `第二个月 ${worksheet.monthDay}/${MONTH_TWO_DAYS}`
    : worksheet.stage === "foundation"
      ? `基础 ${worksheet.stageDay}/${FOUNDATION_WORKSHEET_DAYS}`
      : `强化 ${worksheet.stageDay}/${REINFORCEMENT_WORKSHEET_DAYS}`;
  const greeting = getWorksheetCompanionGreeting(getMathPdfCharacter(worksheet.day), worksheet.title);
  const headerTop = WORKSHEET_PAPER_PADDING_TOP_MM;
  const characterSize = WORKSHEET_PAPER_HEADER_HEIGHT_MM;
  const characterLeft = CONTENT_RIGHT_MM - characterSize;
  drawTextTop(page, stageLabel, CONTENT_LEFT_MM, headerTop + 1.2, context.fonts.chinese, 9.5, COLORS.accent);
  const stageWidth = context.fonts.chinese.widthOfTextAtSize(stageLabel, 9.5) / POINTS_PER_MM;
  drawTextTop(page, fitText(worksheet.title, context.fonts.chinese, 8.5, 72), CONTENT_LEFT_MM + stageWidth + 3, headerTop + 1.8, context.fonts.chinese, 8.5, COLORS.muted);
  drawTextTop(page, "日期", characterLeft - 28, headerTop + 1.6, context.fonts.chinese, 9, COLORS.muted);
  drawLine(page, characterLeft - 18, headerTop + 7.2, characterLeft - 3, headerTop + 7.2, COLORS.muted, 0.35);

  const bubbleTop = headerTop + 10;
  const bubbleHeight = 15;
  const bubbleRight = characterLeft - 3;
  const bubbleWidth = bubbleRight - CONTENT_LEFT_MM;
  page.drawRectangle({
    x: mm(CONTENT_LEFT_MM),
    y: yFromTop(bubbleTop + bubbleHeight),
    width: mm(bubbleWidth),
    height: mm(bubbleHeight),
    color: COLORS.paper,
    borderColor: COLORS.ink,
    borderWidth: mm(0.4),
  });
  drawCenteredText(page, fitText(greeting, context.fonts.chinese, 11, bubbleWidth - 8), CONTENT_LEFT_MM + 3, bubbleTop, bubbleWidth - 6, bubbleHeight, context.fonts.chinese, 11, COLORS.ink);
  drawContainedImage(page, character, characterLeft, headerTop, characterSize, characterSize);
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
  drawTextTop(page, title, CONTENT_LEFT_MM, topMm + 1.6, context.fonts.chinese, 15, COLORS.ink);
  drawLine(page, CONTENT_LEFT_MM, topMm + 11, CONTENT_RIGHT_MM, topMm + 11, COLORS.line, 0.4);
}

function drawQuestionNumber(page: PDFPage, number: number, leftMm: number, topMm: number, context: PdfRenderContext) {
  drawTextTop(page, `${number}.`, leftMm, topMm, context.fonts.numeric, 11, COLORS.muted);
}

function drawAnswerLine(page: PDFPage, leftMm: number, topMm: number, widthMm: number) {
  drawLine(page, leftMm, topMm, leftMm + widthMm, topMm, COLORS.muted, 0.4);
}

function drawEmptyBox(page: PDFPage, leftMm: number, topMm: number, sizeMm: number) {
  page.drawRectangle({ x: mm(leftMm), y: yFromTop(topMm + sizeMm), width: mm(sizeMm), height: mm(sizeMm), color: COLORS.paper, borderColor: COLORS.muted, borderWidth: mm(0.35) });
}

function drawBondDiagram(page: PDFPage, centerMm: number, topMm: number, whole: number, left: number | null, context: PdfRenderContext, right: number | null = null, radius = 4.8) {
  const wholeX = centerMm;
  const wholeY = topMm + radius + 0.4;
  const partY = wholeY + radius * 2 + 7.2;
  const leftX = centerMm - radius - 4.6;
  const rightX = centerMm + radius + 4.6;
  const clear = radius + 1.4;
  const connect = (partX: number) => {
    const dx = partX - wholeX;
    const dy = partY - wholeY;
    const length = Math.hypot(dx, dy) || 1;
    drawLine(page, wholeX + (dx / length) * clear, wholeY + (dy / length) * clear, partX - (dx / length) * clear, partY - (dy / length) * clear, COLORS.ink, 0.4);
  };
  connect(leftX);
  connect(rightX);
  const circles = [
    { x: wholeX, y: wholeY, label: whole == null ? "" : String(whole) },
    { x: leftX, y: partY, label: left == null ? "" : String(left) },
    { x: rightX, y: partY, label: right == null ? "" : String(right) },
  ];
  circles.forEach((circle) => {
    page.drawCircle({
      x: mm(circle.x),
      y: yFromTop(circle.y),
      size: mm(radius),
      color: COLORS.paper,
      borderColor: COLORS.ink,
      borderWidth: mm(0.4),
    });
    if (circle.label) drawCenteredText(page, circle.label, circle.x - radius, circle.y - radius + 0.9, radius * 2, radius * 2 - 0.8, context.fonts.numericBold, 11, COLORS.ink);
  });
}

function roundedRectPath(width: number, height: number, radius: number) {
  const corner = Math.min(radius, width / 2, height / 2);
  return [
    `M ${corner} 0`,
    `H ${width - corner}`,
    `A ${corner} ${corner} 0 0 1 ${width} ${corner}`,
    `V ${height - corner}`,
    `A ${corner} ${corner} 0 0 1 ${width - corner} ${height}`,
    `H ${corner}`,
    `A ${corner} ${corner} 0 0 1 0 ${height - corner}`,
    `V ${corner}`,
    `A ${corner} ${corner} 0 0 1 ${corner} 0`,
    "Z",
  ].join(" ");
}

function drawRoundedBox(page: PDFPage, leftMm: number, topMm: number, widthMm: number, heightMm: number, radiusMm = 1.2, borderWidthMm = 0.4) {
  const width = mm(widthMm);
  const height = mm(heightMm);
  page.drawSvgPath(roundedRectPath(width, height, mm(radiusMm)), {
    x: mm(leftMm),
    y: yFromTop(topMm),
    color: COLORS.paper,
    borderColor: COLORS.ink,
    borderWidth: mm(borderWidthMm),
  });
}

async function drawSharingPlates(page: PDFPage, question: GroupingQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  const iconSize = 6.4;
  const iconGap = 0.7;
  const padX = 2.2;
  const plateHeight = 10.2;
  const plateGap = 3.2;
  const naturalWidth = padX * 2 + question.perGroup * iconSize + Math.max(0, question.perGroup - 1) * iconGap;
  const naturalTotal = question.groupCount * naturalWidth + Math.max(0, question.groupCount - 1) * plateGap;
  const scale = naturalTotal > widthMm ? widthMm / naturalTotal : 1;
  const plateWidth = naturalWidth * scale;
  const gap = plateGap * scale;
  const image = await ensureObject(context, question.icon);
  for (let index = 0; index < question.groupCount; index += 1) {
    const plateLeft = leftMm + index * (plateWidth + gap);
    drawRoundedBox(page, plateLeft, topMm, plateWidth, plateHeight, plateHeight / 2, 0.65);
    const rowWidth = (question.perGroup * iconSize + Math.max(0, question.perGroup - 1) * iconGap) * scale;
    const iconLeft = plateLeft + (plateWidth - rowWidth) / 2;
    const iconTop = topMm + (plateHeight - iconSize * scale) / 2;
    for (let item = 0; item < question.perGroup; item += 1) {
      drawContainedImage(page, image, iconLeft + item * (iconSize + iconGap) * scale, iconTop, iconSize * scale, iconSize * scale);
    }
  }
}

async function drawNeighborSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.type !== "neighbor") continue;
    const left = CONTENT_LEFT_MM + index * width;
    const slot = 15;
    const blankWidth = 14;
    const gap = 2.2;
    const start = left + 12;
    const boxTop = contentTop + 1.6;
    const boxHeight = 10;
    const digitSize = 18;
    const font = context.fonts.numericBold;
    drawQuestionNumber(page, question.number, left, contentTop + 3.2, context);
    drawRightText(page, String(question.left), start, boxTop, slot, boxHeight, font, digitSize, COLORS.ink);
    drawRoundedBox(page, start + slot + gap, boxTop, blankWidth, boxHeight);
    drawAnswerLine(page, start + slot + gap + 2, boxTop + boxHeight - 2.2, blankWidth - 4);
    drawLeftText(page, String(question.right), start + slot + gap + blankWidth + gap, boxTop, boxHeight, font, digitSize, COLORS.ink);
  }
}

async function drawTensSplitSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const gutter = section.columns >= 4 ? 5 : 4;
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM - gutter * (section.columns - 1)) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.type !== "tens-split") continue;
    const left = CONTENT_LEFT_MM + index * (width + gutter);
    const diagramWidth = Math.max(22, width - 14);
    const radius = Math.max(3.2, Math.min(4.2, (diagramWidth / 2 - 4.4) / 2));
    const diagramTop = contentTop + 0.8;
    drawQuestionNumber(page, question.number, left, diagramTop + radius + 0.5 - 1.9, context);
    drawBondDiagram(page, left + 12 + diagramWidth / 2, diagramTop, question.whole, question.left, context, question.right, radius);
  }
}

async function drawPictureBond(page: PDFPage, question: NumberBondQuestion, leftMm: number, topMm: number, widthMm: number, heightMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 2, context);
  const contentLeft = leftMm + 7;
  const groupWidth = Math.min(24, (widthMm - 16) / 2);
  await drawCountGroup(page, question.knownPart, question.icon, contentLeft, topMm + 1, groupWidth, 11, context);
  await drawCountGroup(page, question.answer, question.icon, contentLeft + groupWidth + 4, topMm + 1, groupWidth, 11, context);
  drawBondDiagram(page, leftMm + widthMm / 2, topMm + heightMm - 22, question.whole, question.knownPart, context);
}

function drawSimpleBond(page: PDFPage, question: NumberBondQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  const diagramWidth = Math.max(20, widthMm - 16);
  const radius = Math.max(3.2, Math.min(4.2, (diagramWidth / 2 - 4.4) / 2));
  const diagramTop = topMm + 1.2;
  drawQuestionNumber(page, question.number, leftMm, diagramTop + radius + 0.5 - 1.9, context);
  drawBondDiagram(page, leftMm + 13 + diagramWidth / 2, diagramTop, question.whole, question.knownPart, context, null, radius);
}

async function drawCompositionSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const gutter = section.columns >= 4 ? 5 : 4;
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM - gutter * (section.columns - 1)) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.type !== "number-bond") continue;
    const left = CONTENT_LEFT_MM + index * (width + gutter);
    if (question.mode === "picture-split") await drawPictureBond(page, question, left, contentTop, width, section.rowHeightMm, context);
    else drawSimpleBond(page, question, left, contentTop, width, context);
  }
}

async function drawPictureEquation(page: PDFPage, question: PictureEquationQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 2, context);
  const visualLeft = leftMm + 8;
  const visualWidth = widthMm - 10;
  if (question.operator === "-") {
    await drawCountGroup(page, question.leftCount, question.icon, visualLeft + (visualWidth - 36) / 2, topMm + 1, 36, 16, context, question.rightCount);
  } else {
    const groupWidth = Math.min(32, (visualWidth - 6) / 2);
    await drawCountGroup(page, question.leftCount, question.icon, visualLeft, topMm + 1, groupWidth, 16, context);
    await drawCountGroup(page, question.rightCount, question.icon, visualLeft + groupWidth + 6, topMm + 1, groupWidth, 16, context);
  }
  const slot = 10;
  const sentenceWidth = slot * 3 + 16;
  const sentenceLeft = leftMm + Math.max(8, (widthMm - sentenceWidth) / 2);
  const sentenceTop = topMm + 22;
  drawEmptyBox(page, sentenceLeft, sentenceTop, slot);
  drawCenteredText(page, question.operator, sentenceLeft + slot, sentenceTop, 8, slot, context.fonts.numericBold, 13, COLORS.ink);
  drawEmptyBox(page, sentenceLeft + slot + 8, sentenceTop, slot);
  drawCenteredText(page, "=", sentenceLeft + slot * 2 + 8, sentenceTop, 8, slot, context.fonts.numericBold, 13, COLORS.ink);
  drawEmptyBox(page, sentenceLeft + slot * 2 + 16, sentenceTop, slot);
}

async function drawPictureEquationSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
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
  const contentTop = topMm + (section.title ? 12 : 0);
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

async function drawMentalSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const columnGap = section.columns === 2 ? 12 : 8;
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM - columnGap * (section.columns - 1)) / section.columns;
  section.questions.forEach((question, index) => {
    if (question.type !== "mental") return;
    const left = CONTENT_LEFT_MM + index * (width + columnGap);
    drawQuestionNumber(page, question.number, left, contentTop + 5.5, context);
    const expression = mentalExpression(question);
    const expressionSize = section.columns === 2 ? 16 : 18;
    const expressionWidth = context.fonts.numeric.widthOfTextAtSize(expression, expressionSize) / POINTS_PER_MM;
    const answerWidth = 14;
    const answerLeft = left + 14 + expressionWidth;
    drawTextTop(page, expression, left + 12, contentTop + 4.2, context.fonts.numeric, expressionSize, COLORS.ink);
    drawAnswerLine(page, answerLeft, contentTop + 11.5, answerWidth);
    drawLine(page, left, contentTop + section.rowHeightMm, left + width - 2, contentTop + section.rowHeightMm, COLORS.lineSoft, 0.18);
  });
}

function drawVerticalQuestion(page: PDFPage, question: VerticalCalculationQuestion, leftMm: number, topMm: number, widthMm: number, rowHeightMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 2.2, context);
  const stackWidth = 18;
  const stackLeft = leftMm + Math.max(6, (widthMm - stackWidth) / 2);
  const digitRight = stackLeft + stackWidth;
  const digitFont = context.fonts.numericBold;
  const size = 18;
  drawTextTop(page, String(question.left), digitRight - digitFont.widthOfTextAtSize(String(question.left), size) / POINTS_PER_MM, topMm + 1.2, digitFont, size, COLORS.ink);
  drawTextTop(page, question.operator, stackLeft, topMm + 9.2, digitFont, size, COLORS.ink);
  drawTextTop(page, String(question.right), digitRight - digitFont.widthOfTextAtSize(String(question.right), size) / POINTS_PER_MM, topMm + 9.2, digitFont, size, COLORS.ink);
  const ruleTop = topMm + 17.4;
  drawLine(page, stackLeft, ruleTop, digitRight, ruleTop, COLORS.ink, 0.45);
  const answerBottom = topMm + Math.max(ruleTop + 10, rowHeightMm - 1.5);
  drawLine(page, stackLeft, answerBottom, digitRight, answerBottom, COLORS.ink, 0.35);
}

async function drawVerticalSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  section.questions.forEach((question, index) => {
    if (question.type === "vertical-calculation") drawVerticalQuestion(page, question, CONTENT_LEFT_MM + index * width, contentTop, width, section.rowHeightMm, context);
  });
}

function drawMissingNumberQuestion(page: PDFPage, question: MissingNumberQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 5, context);
  const expression = `${question.left ?? "□"} ${question.operator} ${question.right ?? "□"} = ${question.result ?? "□"}`;
  drawCenteredText(page, expression, leftMm + 12, topMm + 2, Math.max(20, widthMm - 14), 14, context.fonts.numericBold, 18, COLORS.ink);
  drawLine(page, leftMm + 2, topMm + 16, leftMm + widthMm - 2, topMm + 16, COLORS.lineSoft, 0.18);
}

async function drawMissingNumberSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  section.questions.forEach((question, index) => {
    if (question.type === "missing-number") drawMissingNumberQuestion(page, question, CONTENT_LEFT_MM + index * width, contentTop, width, context);
  });
}

async function drawGroupingQuestion(page: PDFPage, question: GroupingQuestion, leftMm: number, topMm: number, widthMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, leftMm, topMm + 2, context);
  const contentLeft = leftMm + 7;
  const contentWidth = Math.max(40, widthMm - 10);
  if (question.mode === "sharing") {
    await drawSharingPlates(page, question, contentLeft, topMm + 0.6, contentWidth, context);
    drawTextTop(page, `${question.total} 个平均分成 ${question.groupCount} 组`, contentLeft, topMm + 14, context.fonts.chinese, 12, COLORS.muted);
    drawTextTop(page, `${question.total} ÷ ${question.groupCount} =`, contentLeft, topMm + 22, context.fonts.numericBold, 16, COLORS.ink);
    const expressionWidth = context.fonts.numericBold.widthOfTextAtSize(`${question.total} ÷ ${question.groupCount} =`, 12) / POINTS_PER_MM;
    drawAnswerLine(page, contentLeft + expressionWidth + 2, topMm + 26, 14);
    return;
  }
  const groupWidth = Math.min(22, (contentWidth - (question.groupCount - 1) * 3) / question.groupCount);
  for (let index = 0; index < question.groupCount; index += 1) {
    await drawCountGroup(page, question.perGroup, question.icon, contentLeft + index * (groupWidth + 3), topMm + 1, groupWidth, 10, context);
  }
  drawTextTop(page, `${question.groupCount} 组，每组 ${question.perGroup} 个`, contentLeft, topMm + 12.5, context.fonts.chinese, 9.5, COLORS.muted);
  if (question.mode === "repeated-addition") {
    const addends = Array.from({ length: question.groupCount }, () => String(question.perGroup)).join(" + ") + " =";
    drawTextTop(page, addends, contentLeft, topMm + 18.5, context.fonts.numericBold, 11.5, COLORS.ink);
    const addWidth = context.fonts.numericBold.widthOfTextAtSize(addends, 11.5) / POINTS_PER_MM;
    drawAnswerLine(page, contentLeft + addWidth + 1.5, topMm + 25, 12);
    const multiply = `${question.groupCount} × ${question.perGroup} =`;
    const multiplyLeft = contentLeft + Math.max(48, addWidth + 18);
    drawTextTop(page, multiply, multiplyLeft, topMm + 18.5, context.fonts.numericBold, 11.5, COLORS.ink);
    const multiplyWidth = context.fonts.numericBold.widthOfTextAtSize(multiply, 11.5) / POINTS_PER_MM;
    drawAnswerLine(page, multiplyLeft + multiplyWidth + 1.5, topMm + 25, 12);
    return;
  }
  const multiply = `${question.groupCount} × ${question.perGroup} =`;
  drawTextTop(page, multiply, contentLeft, topMm + 18.5, context.fonts.numericBold, 12, COLORS.ink);
  const multiplyWidth = context.fonts.numericBold.widthOfTextAtSize(multiply, 12) / POINTS_PER_MM;
  drawAnswerLine(page, contentLeft + multiplyWidth + 2, topMm + 25.5, 14);
}

async function drawGroupingSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const width = (CONTENT_RIGHT_MM - CONTENT_LEFT_MM) / section.columns;
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question.type === "grouping") await drawGroupingQuestion(page, question, CONTENT_LEFT_MM + index * width, contentTop, width, context);
  }
}

async function drawLifeMathQuestion(page: PDFPage, question: LifeMathQuestion, topMm: number, heightMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, CONTENT_LEFT_MM, topMm + 3, context);
  const image = await ensureObject(context, question.icon);
  drawContainedImage(page, image, CONTENT_LEFT_MM + 7, topMm + 2, 9, 9);
  const lines = wrapText(question.prompt, context.fonts.chinese, 15.5, 155, 2);
  lines.forEach((line, index) => drawTextTop(page, line, CONTENT_LEFT_MM + 19, topMm + 2 + index * 8.2, context.fonts.chinese, 15.5, COLORS.ink));
  drawLine(page, CONTENT_LEFT_MM + 19, topMm + heightMm - 4, CONTENT_RIGHT_MM - 6, topMm + heightMm - 4, COLORS.lineSoft, 0.18);
}

async function drawLifeMathSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question.type === "life-math") await drawLifeMathQuestion(page, question, contentTop + index * section.rowHeightMm, section.rowHeightMm, context);
  }
}

async function drawApplicationSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  const contentTop = topMm + (section.title ? 12 : 0);
  if (section.title) drawSectionHeading(page, section.title, topMm, context);
  const question = section.questions[0];
  if (!question || question.type !== "application") return;
  await drawApplicationQuestion(page, question, contentTop, section.rowHeightMm, context);
}

async function drawApplicationQuestion(page: PDFPage, question: ApplicationQuestion, topMm: number, heightMm: number, context: PdfRenderContext) {
  drawQuestionNumber(page, question.number, CONTENT_LEFT_MM, topMm + 3, context);
  const image = await ensureObject(context, question.icon);
  drawContainedImage(page, image, CONTENT_LEFT_MM + 7, topMm + 2, 9, 9);
  const lines = wrapText(question.prompt, context.fonts.chinese, 15.5, 155, 2);
  lines.forEach((line, index) => drawTextTop(page, line, CONTENT_LEFT_MM + 19, topMm + 2 + index * 8.2, context.fonts.chinese, 15.5, COLORS.ink));
  drawLine(page, CONTENT_LEFT_MM + 19, topMm + heightMm - 4, CONTENT_RIGHT_MM - 6, topMm + heightMm - 4, COLORS.lineSoft, 0.18);
}

async function drawPageSection(page: PDFPage, section: WorksheetPageSection, topMm: number, context: PdfRenderContext) {
  if (section.type === "neighbor") await drawNeighborSection(page, section, topMm, context);
  if (section.type === "tens-split") await drawTensSplitSection(page, section, topMm, context);
  if (section.type === "composition") await drawCompositionSection(page, section, topMm, context);
  if (section.type === "picture-equation") await drawPictureEquationSection(page, section, topMm, context);
  if (section.type === "guided") await drawGuidedSection(page, section, topMm, context);
  if (section.type === "mental") await drawMentalSection(page, section, topMm, context);
  if (section.type === "vertical") await drawVerticalSection(page, section, topMm, context);
  if (section.type === "missing-number") await drawMissingNumberSection(page, section, topMm, context);
  if (section.type === "grouping") await drawGroupingSection(page, section, topMm, context);
  if (section.type === "life-math") await drawLifeMathSection(page, section, topMm, context);
  if (section.type === "application") await drawApplicationSection(page, section, topMm, context);
}

function drawFooter(page: PDFPage, worksheet: DailyWorksheet, printPage: WorksheetPrintPage, context: PdfRenderContext) {
  drawLine(page, CONTENT_LEFT_MM, FOOTER_TOP_MM, CONTENT_RIGHT_MM, FOOTER_TOP_MM, COLORS.line, 0.25);
  drawTextTop(page, `第 ${worksheet.day} / ${WORKSHEET_PLAN_DAYS} 天`, CONTENT_LEFT_MM, FOOTER_TOP_MM + 2.2, context.fonts.chinese, 8.5, COLORS.muted);
  const rightText = `第 ${printPage.pageNumber} / ${printPage.pageCount} 页 · 本页 ${printPage.questionCount} 题`;
  const width = context.fonts.chinese.widthOfTextAtSize(rightText, 8.5) / POINTS_PER_MM;
  drawTextTop(page, rightText, CONTENT_RIGHT_MM - width, FOOTER_TOP_MM + 2.2, context.fonts.chinese, 8.5, COLORS.muted);
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
    topMm += section.rowHeightMm + (section.title ? 12 : 0);
  }
  drawFooter(page, worksheet, printPage, context);
}

async function createRenderContext(baseUrl: string, externalCharacters: MathPdfExternalCharacterAssets = {}) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const [chineseBytes, numericBytes, numericBoldBytes] = await Promise.all([
    fetchBytes(baseUrl, "/fonts/noto-sans-sc-math-subset.ttf?v=2"),
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
  document.setSubject("5 天基础引导、25 天强化训练与第二个月进阶练习纸");
  document.setKeywords(["数学练习", "幼小启蒙", "家庭自用"]);
  document.setCreator("一程一成长");
  return { document, fonts: { chinese, numeric, numericBold }, objects: new Map(), characters: new Map(), baseUrl, externalCharacters } satisfies PdfRenderContext;
}

export async function generateMathWorkbookPdf(
  worksheets: readonly DailyWorksheet[],
  baseUrl: string,
  onProgress: (completed: number, total: number) => void,
  externalCharacters: MathPdfExternalCharacterAssets = {},
) {
  if (worksheets.length === 0) throw new Error("没有可导出的数学练习");
  const context = await createRenderContext(baseUrl, externalCharacters);
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
