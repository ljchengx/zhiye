import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
  type RGB,
} from "pdf-lib";

import { PINYIN_PICTURE_PNG_SOURCES } from "./pinyin-picture-assets";
import {
  createPinyinWorksheet,
  getToneForms,
  PINYIN_PRINT_ORDER,
  type PinyinItem,
  type PinyinPictureAsset,
  type PinyinPrintPage,
  type PinyinQuestion,
  type PinyinWorksheet,
  type PinyinWorksheetConfig,
  type PinyinWorksheetSection,
} from "./pinyin-worksheet";

export const PINYIN_BULK_PDF_FILENAME = "一程一成长-幼小拼音练习-全部63项.pdf";
export const PINYIN_BULK_ITEM_COUNT = PINYIN_PRINT_ORDER.length;
export const PINYIN_BULK_SEED = 20260905;

export interface PinyinPdfGenerateRequest {
  type: "generate";
  config: PinyinWorksheetConfig;
  baseUrl: string;
}

export type PinyinPdfWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "complete"; bytes: ArrayBuffer; pageCount: number }
  | { type: "error"; message: string };

interface PdfFonts {
  pinyin: PDFFont;
  pinyinBold: PDFFont;
  chinese: PDFFont;
}

interface PdfRenderContext {
  document: PDFDocument;
  fonts: PdfFonts;
  images: Map<PinyinPictureAsset, PDFImage>;
  baseUrl: string;
}

interface TextSegment {
  text: string;
  font: PDFFont;
  size: number;
  color: RGB;
}

const POINTS_PER_MM = 72 / 25.4;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_WIDTH = PAGE_WIDTH_MM * POINTS_PER_MM;
const PAGE_HEIGHT = PAGE_HEIGHT_MM * POINTS_PER_MM;
const CONTENT_LEFT_MM = 16;
const CONTENT_RIGHT_MM = 194;
const BODY_TOP_MM = 28;
const FOOTER_TOP_MM = 280;
const BULK_SEED_STEP = 7919;

const COLORS = {
  ink: hex("#27373b"),
  muted: hex("#748486"),
  line: hex("#d8e3e1"),
  lineSoft: hex("#edf2f0"),
  grid: hex("#b8cbc3"),
  coral: hex("#e76a52"),
  green: hex("#4f9b7d"),
  greenDark: hex("#4b7666"),
  greenSoft: hex("#eff8f3"),
  yellow: hex("#e8c977"),
  yellowSoft: hex("#fff9e8"),
  paper: hex("#fffefa"),
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

function drawTextTop(page: PDFPage, text: string, xMm: number, topMm: number, font: PDFFont, size: number, color: RGB, opacity = 1) {
  page.drawText(text, {
    x: mm(xMm),
    y: textBaseline(topMm, font, size),
    size,
    font,
    color,
    opacity,
  });
  return font.widthOfTextAtSize(text, size) / POINTS_PER_MM;
}

function drawCenteredText(page: PDFPage, text: string, leftMm: number, topMm: number, widthMm: number, heightMm: number, font: PDFFont, size: number, color: RGB, opacity = 1) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const textHeight = font.heightAtSize(size, { descender: false });
  page.drawText(text, {
    x: mm(leftMm) + Math.max(0, (mm(widthMm) - textWidth) / 2),
    y: yFromTop(topMm + heightMm) + Math.max(0, (mm(heightMm) - textHeight) / 2),
    size,
    font,
    color,
    opacity,
  });
}

function isPinyinCharacter(character: string) {
  return /[A-Za-z0-9\u00c0-\u024füÜ\s/]/u.test(character);
}

function createMixedSegments(text: string, fonts: PdfFonts, size: number, color: RGB): TextSegment[] {
  const segments: TextSegment[] = [];
  for (const character of text) {
    const font = isPinyinCharacter(character) ? fonts.pinyin : fonts.chinese;
    const previous = segments[segments.length - 1];
    if (previous?.font === font) previous.text += character;
    else segments.push({ text: character, font, size, color });
  }
  return segments;
}

function getSegmentsWidth(segments: readonly TextSegment[]) {
  return segments.reduce((width, segment) => width + segment.font.widthOfTextAtSize(segment.text, segment.size), 0) / POINTS_PER_MM;
}

function drawSegmentsTop(page: PDFPage, segments: readonly TextSegment[], xMm: number, topMm: number) {
  let cursor = xMm;
  segments.forEach((segment) => {
    cursor += drawTextTop(page, segment.text, cursor, topMm, segment.font, segment.size, segment.color);
  });
  return cursor;
}

function drawMixedText(page: PDFPage, text: string, xMm: number, topMm: number, fonts: PdfFonts, size: number, color: RGB) {
  return drawSegmentsTop(page, createMixedSegments(text, fonts, size, color), xMm, topMm);
}

function drawLine(page: PDFPage, x1Mm: number, y1TopMm: number, x2Mm: number, y2TopMm: number, color: RGB, thicknessMm: number) {
  page.drawLine({
    start: { x: mm(x1Mm), y: yFromTop(y1TopMm) },
    end: { x: mm(x2Mm), y: yFromTop(y2TopMm) },
    color,
    thickness: mm(thicknessMm),
  });
}

function getItemCategoryLabel(item: PinyinItem) {
  if (item.category === "initial") return "声母";
  if (item.category === "final") return "韵母";
  return "整体认读音节";
}

function getSectionExerciseCount(section: PinyinWorksheetSection, traceRows: number) {
  return section.type === "trace" ? section.traceRows ?? traceRows : section.questions.length;
}

function drawHeader(page: PDFPage, worksheet: PinyinWorksheet, fonts: PdfFonts) {
  drawTextTop(page, "一程一成长", 16, 13, fonts.chinese, 10, COLORS.coral);
  drawTextTop(page, "拼音练习", 42, 11.2, fonts.chinese, 18, COLORS.ink);
  drawMixedText(page, `${getItemCategoryLabel(worksheet.item)} · ${worksheet.item.display}`, 72, 14, fonts, 10, COLORS.muted);

  page.drawRectangle({
    x: mm(112),
    y: yFromTop(26.5),
    width: mm(25),
    height: mm(15),
    borderColor: COLORS.yellow,
    borderWidth: mm(0.35),
    color: COLORS.yellowSoft,
  });
  drawCenteredText(page, "今天练", 112, 13, 25, 4, fonts.chinese, 8, hex("#9a7d39"));
  drawCenteredText(page, worksheet.item.display, 112, 16.5, 25, 9, fonts.pinyinBold, 22, hex("#4c6b60"));

  drawTextTop(page, "姓名", 141, 17, fonts.chinese, 9, COLORS.muted);
  drawLine(page, 151, 22, 164, 22, COLORS.muted, 0.3);
  drawTextTop(page, "日期", 167, 17, fonts.chinese, 9, COLORS.muted);
  drawLine(page, 177, 22, 194, 22, COLORS.muted, 0.3);
  drawLine(page, CONTENT_LEFT_MM, BODY_TOP_MM, CONTENT_RIGHT_MM, BODY_TOP_MM, COLORS.line, 0.25);
}

function drawSectionHeading(page: PDFPage, title: string, continued: boolean, topMm: number, fonts: PdfFonts) {
  page.drawRectangle({ x: mm(20), y: yFromTop(topMm + 7.5), width: mm(1.3), height: mm(6), color: COLORS.coral });
  drawMixedText(page, `${title}${continued ? " · 接上页" : ""}`, 24, topMm + 1.8, fonts, 15, hex("#3a504a"));
  drawLine(page, CONTENT_LEFT_MM, topMm + 9, CONTENT_RIGHT_MM, topMm + 9, COLORS.line, 0.25);
}

function drawTraceGrid(page: PDFPage, worksheet: PinyinWorksheet, section: PinyinWorksheetSection, topMm: number, startNumber: number, fonts: PdfFonts) {
  const item = worksheet.item;
  const rows = section.traceRows ?? worksheet.config.traceRows;
  const forms = item.toneCapable ? getToneForms(item.display) : [item.display];
  const symbolLength = item.display.length;
  const cellCount = symbolLength >= 3 ? 4 : symbolLength === 2 ? 7 : 9;
  const guideCellCount = symbolLength >= 3 ? 2 : 3;
  drawSectionHeading(page, section.title, section.continued, topMm, fonts);

  const itemWidth = drawTextTop(page, item.display, 18, topMm + 11, fonts.pinyinBold, 27, COLORS.coral);
  drawTextTop(page, item.toneCapable ? "读一读四声，再写一写" : "照着样子写一写", 22 + itemWidth, topMm + 12.5, fonts.chinese, 13.5, COLORS.muted);
  if (item.toneCapable) {
    const toneSegments = forms.slice(1).map((form) => ({ text: form, font: fonts.pinyin, size: 20, color: hex("#56856f") }));
    const toneWidth = getSegmentsWidth(toneSegments) + 15;
    let toneX = CONTENT_RIGHT_MM - toneWidth;
    toneSegments.forEach((segment) => {
      toneX += drawTextTop(page, segment.text, toneX, topMm + 11.8, segment.font, segment.size, segment.color) + 5;
    });
  }

  const gridLeft = 24;
  const gridWidth = CONTENT_RIGHT_MM - gridLeft;
  const cellWidth = gridWidth / cellCount;
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const rowTop = topMm + 24 + rowIndex * 27;
    const gridTop = rowTop + 1;
    const gridHeight = 25;
    const rowForm = item.toneCapable ? forms[rowIndex % forms.length] ?? item.display : item.display;
    drawCenteredText(page, String(startNumber + rowIndex), 16, rowTop + 1, 6, 8, fonts.pinyin, 10.5, hex("#a2b0ac"));

    [0, 1 / 3, 2 / 3, 1].forEach((ratio, index) => {
      drawLine(page, gridLeft, gridTop + gridHeight * ratio, CONTENT_RIGHT_MM, gridTop + gridHeight * ratio, index === 0 || index === 3 ? COLORS.grid : COLORS.line, 0.2);
    });
    for (let cellIndex = 0; cellIndex <= cellCount; cellIndex += 1) {
      const x = gridLeft + cellIndex * cellWidth;
      drawLine(page, x, gridTop, x, gridTop + gridHeight, COLORS.line, 0.2);
    }
    for (let cellIndex = 0; cellIndex < guideCellCount; cellIndex += 1) {
      drawCenteredText(
        page,
        rowForm,
        gridLeft + cellIndex * cellWidth,
        gridTop,
        cellWidth,
        gridHeight,
        fonts.pinyinBold,
        mm(18),
        COLORS.greenDark,
        cellIndex === 0 ? 1 : 0.3,
      );
    }
  }
}

function drawArrow(page: PDFPage, leftMm: number, centerTopMm: number) {
  drawLine(page, leftMm, centerTopMm, leftMm + 5, centerTopMm, COLORS.coral, 0.4);
  drawLine(page, leftMm + 3.4, centerTopMm - 1.5, leftMm + 5, centerTopMm, COLORS.coral, 0.4);
  drawLine(page, leftMm + 3.4, centerTopMm + 1.5, leftMm + 5, centerTopMm, COLORS.coral, 0.4);
}

function drawChoices(page: PDFPage, options: readonly string[], leftMm: number, topMm: number, maxWidthMm: number, fonts: PdfFonts, size = 17) {
  let x = leftMm;
  let rowTop = topMm;
  options.forEach((option) => {
    const optionWidth = fonts.pinyin.widthOfTextAtSize(option, size) / POINTS_PER_MM;
    const itemWidth = 5.5 + 1.6 + optionWidth + 6;
    if (x > leftMm && x + itemWidth > leftMm + maxWidthMm) {
      x = leftMm;
      rowTop += 9;
    }
    page.drawCircle({
      x: mm(x + 2.75),
      y: yFromTop(rowTop + 2.75),
      size: mm(2.75),
      borderColor: hex("#9cb0a8"),
      borderWidth: mm(0.25),
    });
    drawTextTop(page, option, x + 7.1, rowTop - 0.3, fonts.pinyin, size, hex("#667975"));
    x += itemWidth;
  });
}

function drawBlendQuestion(page: PDFPage, question: Extract<PinyinQuestion, { kind: "blend" }>, topMm: number, fonts: PdfFonts) {
  const components = question.components.join(" · ");
  const componentWidth = drawTextTop(page, components, 26, topMm + 2.5, fonts.pinyin, 21, hex("#49655c"));
  const arrowLeft = Math.min(112, 27 + componentWidth);
  drawArrow(page, arrowLeft, topMm + 7.2);
  drawLine(page, arrowLeft + 8, topMm + 10, arrowLeft + 36, topMm + 10, hex("#6e8980"), 0.45);
  drawChoices(page, question.options, 26, topMm + 13, 164, fonts);
}

function drawPromptQuestion(page: PDFPage, question: Extract<PinyinQuestion, { kind: "recognition" | "contrast" }>, topMm: number, fonts: PdfFonts) {
  drawMixedText(page, question.prompt, 26, topMm + 2, fonts, 14.5, hex("#536d63"));
  drawChoices(page, question.options, 26, topMm + 11.5, 164, fonts);
}

function drawCoreSection(page: PDFPage, section: PinyinWorksheetSection, topMm: number, startNumber: number, fonts: PdfFonts) {
  drawSectionHeading(page, section.title, section.continued, topMm, fonts);
  section.questions.forEach((question, index) => {
    const rowTop = topMm + 15 + index * 24;
    drawCenteredText(page, String(startNumber + index), 16, rowTop + 1, 6, 8, fonts.pinyin, 10.5, hex("#a4b1ae"));
    if (question.kind === "blend") drawBlendQuestion(page, question, rowTop, fonts);
    if (question.kind === "recognition" || question.kind === "contrast") drawPromptQuestion(page, question, rowTop, fonts);
    drawLine(page, 24, rowTop + 24, CONTENT_RIGHT_MM, rowTop + 24, COLORS.lineSoft, 0.2);
  });
}

async function ensurePictureImage(context: PdfRenderContext, asset: PinyinPictureAsset) {
  const cached = context.images.get(asset);
  if (cached) return cached;
  const bytes = await fetchBytes(context.baseUrl, PINYIN_PICTURE_PNG_SOURCES[asset]);
  const image = await context.document.embedPng(bytes);
  context.images.set(asset, image);
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

async function drawPictureSection(page: PDFPage, section: PinyinWorksheetSection, topMm: number, startNumber: number, context: PdfRenderContext) {
  drawSectionHeading(page, section.title, section.continued, topMm, context.fonts);
  for (let index = 0; index < section.questions.length; index += 1) {
    const question = section.questions[index];
    if (question?.kind !== "picture") continue;
    const rowTop = topMm + 17 + index * 55;
    const image = await ensurePictureImage(context, question.asset);
    drawCenteredText(page, String(startNumber + index), 16, rowTop + 1, 6, 8, context.fonts.pinyin, 10.5, hex("#a4b1ae"));
    drawContainedImage(page, image, 25, rowTop + 1, 42, 40);
    drawCenteredText(page, question.label, 25, rowTop + 42, 42, 6, context.fonts.chinese, 12, COLORS.muted);

    const prefix = "圈出图片的读音（含 ";
    const suffix = "）";
    const promptTop = rowTop + 8;
    let cursor = drawTextTop(page, prefix, 76, promptTop, context.fonts.chinese, 14, hex("#577166")) + 76;
    cursor += drawTextTop(page, question.targetDisplay, cursor, promptTop - 0.7, context.fonts.pinyinBold, 17, COLORS.coral);
    drawTextTop(page, suffix, cursor, promptTop, context.fonts.chinese, 14, hex("#577166"));
    drawChoices(page, question.options, 76, rowTop + 23, 118, context.fonts, 16);
    drawLine(page, 24, rowTop + 55, CONTENT_RIGHT_MM, rowTop + 55, COLORS.lineSoft, 0.2);
  }
}

function drawFooter(page: PDFPage, worksheet: PinyinWorksheet, printPage: PinyinPrintPage, fonts: PdfFonts) {
  drawLine(page, CONTENT_LEFT_MM, FOOTER_TOP_MM, CONTENT_RIGHT_MM, FOOTER_TOP_MM, COLORS.line, 0.25);
  drawMixedText(page, "家庭自用 · 不替代教学", CONTENT_LEFT_MM, 282.3, fonts, 8, hex("#8a9995"));
  const rightText = `第 ${printPage.pageNumber} / ${printPage.pageCount} 页 · 一天一小步`;
  const segments = createMixedSegments(rightText, fonts, 8, hex("#8a9995"));
  drawSegmentsTop(page, segments, CONTENT_RIGHT_MM - getSegmentsWidth(segments), 282.3);
}

async function drawWorksheetPage(context: PdfRenderContext, worksheet: PinyinWorksheet, printPage: PinyinPrintPage) {
  const page = context.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.paper });
  drawHeader(page, worksheet, context.fonts);

  let sectionTop = BODY_TOP_MM;
  let exerciseOffset = worksheet.pages
    .slice(0, printPage.pageNumber - 1)
    .flatMap((previousPage) => previousPage.sections)
    .reduce((total, section) => total + getSectionExerciseCount(section, worksheet.config.traceRows), 0);

  for (let index = 0; index < printPage.sections.length; index += 1) {
    const section = printPage.sections[index] as PinyinWorksheetSection;
    if (index > 0) sectionTop += 6;
    const startNumber = exerciseOffset + 1;
    exerciseOffset += getSectionExerciseCount(section, worksheet.config.traceRows);
    if (section.type === "trace") drawTraceGrid(page, worksheet, section, sectionTop, startNumber, context.fonts);
    if (section.type === "blend") drawCoreSection(page, section, sectionTop, startNumber, context.fonts);
    if (section.type === "picture") await drawPictureSection(page, section, sectionTop, startNumber, context);
    sectionTop += section.estimatedHeightMm;
  }
  drawFooter(page, worksheet, printPage, context.fonts);
}

async function fetchBytes(baseUrl: string, path: string) {
  const response = await fetch(new URL(path, baseUrl));
  if (!response.ok) throw new Error(`资源加载失败：${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function createRenderContext(baseUrl: string) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const [pinyinBytes, pinyinBoldBytes, chineseBytes] = await Promise.all([
    fetchBytes(baseUrl, "/fonts/andika-regular.ttf"),
    fetchBytes(baseUrl, "/fonts/andika-bold.ttf"),
    fetchBytes(baseUrl, "/fonts/noto-sans-sc-pinyin-subset.ttf"),
  ]);
  const [pinyin, pinyinBold, chinese] = await Promise.all([
    document.embedFont(pinyinBytes, { subset: true }),
    document.embedFont(pinyinBoldBytes, { subset: true }),
    document.embedFont(chineseBytes, { subset: false }),
  ]);
  document.setTitle("一程一成长 · 幼小拼音练习");
  document.setAuthor("一程一成长");
  document.setSubject("63 项幼小拼音启蒙练习纸");
  document.setKeywords(["拼音练习", "幼小启蒙", "家庭自用"]);
  document.setCreator("一程一成长");
  return { document, fonts: { pinyin, pinyinBold, chinese }, images: new Map(), baseUrl } satisfies PdfRenderContext;
}

export async function generatePinyinWorkbookPdf(
  config: PinyinWorksheetConfig,
  baseUrl: string,
  onProgress: (completed: number, total: number) => void,
) {
  const context = await createRenderContext(baseUrl);
  for (let index = 0; index < PINYIN_PRINT_ORDER.length; index += 1) {
    const item = PINYIN_PRINT_ORDER[index] as PinyinItem;
    const worksheet = createPinyinWorksheet(item.id, PINYIN_BULK_SEED + (index + 1) * BULK_SEED_STEP, config);
    for (const printPage of worksheet.pages) await drawWorksheetPage(context, worksheet, printPage);
    // 每个拼音任务独立配对，避免下一个任务印到上一项的背面。
    if (worksheet.pages.length % 2 === 1) context.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    onProgress(index + 1, PINYIN_PRINT_ORDER.length);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const bytes = await context.document.save({ useObjectStreams: true });
  return { bytes, pageCount: context.document.getPageCount() };
}
