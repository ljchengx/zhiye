import { getMathHeaderCharacters } from "../math-picture-assets";
import { Canvas, INK } from "../number-sense/drawing";
import type { WorksheetFonts } from "../number-sense/fonts";
import type { WorksheetPage, WorksheetTaskRegion } from "../number-sense/layout";
import { BLOCK_LAYOUT } from "./blocks";
import { chainText } from "./chain";
import { checkBackText, spotErrorText } from "./checks";
import { fillText } from "./fill";
import { compareRightText, compareText } from "./relations";
import { makeTenText, manyWaysText, splitText } from "./strategies";
import type { DrillBlock, DrillItem, DrillPage, DrillSheet } from "./types";
import { wordText } from "./word";

const CONTENT_LEFT = 14;
const CONTENT_WIDTH = 182;
const HEADER_TOP = 12;
/** 表头高度：两侧角色图，中间标题与份号。 */
const HEADER_HEIGHT = 30;
const CONTENT_TOP = HEADER_TOP + HEADER_HEIGHT + 8;
const CONTENT_BOTTOM = 272;
const BLOCK_GAP = 7;
/** 块标题加说明占的高度。 */
const BLOCK_HEAD = 15;
/** 每个题块下面留出的余量，最后一行文字不会超出范围。 */
const BLOCK_PAD = 5;
/** 正文与列式的字号。 */
const BODY = 16;
const VERTICAL_BODY = 18;

/** 表头：两侧角色图、中间标题与份号，角色按份号确定。 */
function drawHeader(c: Canvas, sheet: number, page: DrillPage) {
  const [left, right] = getMathHeaderCharacters(sheet);
  c.rect(12, HEADER_TOP, 186, HEADER_HEIGHT, "#FFF7E8", "#EFD2A0", 0.6);
  c.image(left, 15, HEADER_TOP + 2, 22, 22);
  c.image(right, 173, HEADER_TOP + 2, 22, 22);
  c.text("计算练习", 105, HEADER_TOP + 14, 24, "chineseBold", "#D9752C", "center");
  c.caption(
    `第 ${sheet} 份 · ${page.side === "front" ? "正面" : "反面"}`,
    105, HEADER_TOP + 24, 11, "chinese", INK.muted, "center");
}

/** 算式加一条得数横线，加减题与连加连减共用；横线不越过本列右端。 */
function drawExpression(c: Canvas, text: string, x: number, y: number, columnWidth: number) {
  const width = c.width(text, "numericBold", BODY);
  const start = x + width + 3;
  const end = Math.min(x + columnWidth - 4, start + 26);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  c.line(start, y + 5.5, Math.max(start + 8, end), y + 5.5, INK.line, 0.4);
}

function drawOralItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number) {
  if (item.data.kind === "oral") drawExpression(c, oralLine(item), x, y, columnWidth);
  else if (item.data.kind === "chain") drawExpression(c, chainText(item.data), x, y, columnWidth);
}

function oralLine(item: DrillItem): string {
  if (item.data.kind !== "oral") return "";
  return `${item.data.terms[0]} ${item.data.operators[0]} ${item.data.terms[1]} =`;
}

/** 填空：缺的位置留横线，其余照印出来。 */
function drawFillItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "fill") return;
  const { parts, blank } = fillText(item.data);
  const isBlank = (index: number) =>
    (blank === 0 && index === 0) || (blank === 1 && index === 2) || (blank === 2 && index === 4);
  let cursor = x;
  parts.forEach((part, index) => {
    if (isBlank(index)) {
      c.line(cursor, y + 5.5, cursor + 17, y + 5.5, INK.line, 0.4);
      cursor += 22;
      return;
    }
    c.text(part, cursor, y, BODY, "numericBold", INK.dark);
    cursor += c.width(part, "numericBold", BODY) + 2.5;
  });
}

/** 列式：两行数字右对齐，符号在左下，横线下方留答题区。 */
function drawVerticalItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number) {
  if (item.data.kind !== "vertical") return;
  const right = x + 34;
  const gap = 11 * scale;
  c.text(String(item.data.a), right, y, VERTICAL_BODY, "numericBold", INK.dark, "right");
  c.text(item.data.operator, x + 2, y + gap, VERTICAL_BODY, "numericBold", INK.dark);
  c.text(String(item.data.b), right, y + gap, VERTICAL_BODY, "numericBold", INK.dark, "right");
  c.line(x + 2, y + gap * 1.85, right + 1, y + gap * 1.85, INK.dark, 0.6);
}

/** 比大小：左右两个算式中间留一个填符号的圈。 */
function drawCompareItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "compare") return;
  const left = compareText(item.data), right = compareRightText(item.data);
  c.text(left, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(left, "numericBold", BODY);
  c.circle(x + width + 6, y + 2.5, 3.6, INK.white, INK.dark, 0.5);
  c.text(right, x + width + 13, y, BODY, "numericBold", INK.dark);
}

/** 填符号：符号的位置留一条短横线。 */
function drawOperatorItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "operator") return;
  const { a, b, result } = item.data;
  const head = String(a);
  c.text(head, x, y, BODY, "numericBold", INK.dark);
  const cursor = x + c.width(head, "numericBold", BODY) + 4;
  c.line(cursor, y + 5.5, cursor + 10, y + 5.5, INK.line, 0.4);
  c.text(`${b} = ${result}`, cursor + 14, y, BODY, "numericBold", INK.dark);
}

/** 找错改正：印出错式，下面留一条改正线。 */
function drawSpotErrorItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number) {
  if (item.data.kind !== "spotError") return;
  c.text(spotErrorText(item.data), x, y, BODY, "numericBold", INK.dark);
  c.caption("改：", x, y + 11 * scale, 11, "chinese", INK.muted);
  c.line(x + 11, y + 16 * scale, x + 46, y + 16 * scale, INK.line, 0.5);
}

/** 算完检查：上一行给出算式与结果，下一行填另一个算式的结果。 */
function drawCheckBackItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number) {
  if (item.data.kind !== "checkBack") return;
  const { given, check } = checkBackText(item.data);
  c.text(given, x, y, BODY, "numericBold", INK.dark);
  c.text(check, x, y + 9 * scale, BODY, "numericBold", INK.dark);
  const width = c.width(check, "numericBold", BODY);
  c.line(x + width + 3, y + 14.5 * scale, x + width + 20, y + 14.5 * scale, INK.line, 0.4);
}

/** 一题多解：先写结果，再留两行写不同的算法。 */
function drawManyWaysItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number) {
  if (item.data.kind !== "manyWays") return;
  const text = manyWaysText(item.data);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", BODY);
  c.line(x + width + 4, y + 5.5, x + width + 30, y + 5.5, INK.line, 0.4);
  c.line(x + 2, y + 15 * scale, x + 72, y + 15 * scale, INK.line, 0.4);
}

/** 凑整再算：印出补成整十的算式，填减少后的那个加数。 */
function drawMakeTenItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "makeTen") return;
  const text = makeTenText(item.data);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", BODY);
  c.line(x + width + 4, y + 5.5, x + width + 22, y + 5.5, INK.line, 0.4);
}

/** 数的拆分：一个数后面留两处空。 */
function drawSplitItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number) {
  if (item.data.kind !== "split") return;
  const text = splitText(item.data);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", BODY);
  const room = Math.max(12, (columnWidth - width - 14) / 2);
  c.line(x + width + 3, y + 5.5, x + width + 3 + room, y + 5.5, INK.line, 0.4);
  c.text("+", x + width + 5 + room, y, BODY, "numericBold", INK.dark);
  c.line(x + width + 10 + room, y + 5.5, x + width + 10 + room * 2, y + 5.5, INK.line, 0.4);
}

/** 数线移动：一条数线，起点标出，两段箭头，终点留空。 */
function drawNumberLineItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number, scale: number) {
  if (item.data.kind !== "numberLine") return;
  const { start, jumps } = item.data;
  const left = x + 4, right = x + columnWidth - 10;
  const first = left + (right - left) * 0.42;
  const second = left + (right - left) * 0.72;
  const line = y + 11 * scale;
  c.line(left, line, right, line, INK.dark, 0.6);
  c.circle(left, line, 1.8, INK.dark);
  c.text(String(start), left, y + 5 * scale, BODY, "numericBold", INK.dark, "center");
  c.arrow(left + 3, y + 17 * scale, first);
  c.arrow(first + 3, y + 17 * scale, second);
  c.text(`+${jumps[0]}`, (left + first) / 2, y + 13 * scale, BODY, "numericBold", INK.muted, "center");
  c.text(`+${jumps[1]}`, (first + second) / 2, y + 13 * scale, BODY, "numericBold", INK.muted, "center");
  c.line(first + 3, y + 24 * scale, right, y + 24 * scale, INK.line, 0.5);
}

/** 进几出几：两行格子，进的数都给出，出的数只给第一个。 */
function drawInOutItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number) {
  if (item.data.kind !== "inOut") return;
  const { inputs, outputs } = item.data;
  const labelWidth = 11, cellWidth = 20;
  const cellHeight = Math.max(7, 9 * scale);
  c.text("进", x, y, BODY, "chineseBold", INK.dark);
  c.text("出", x, y + cellHeight + 2, BODY, "chineseBold", INK.dark);
  inputs.forEach((value, index) => {
    const cellX = x + labelWidth + index * cellWidth;
    c.rect(cellX, y - 6, cellWidth, cellHeight, INK.white, INK.line, 0.3);
    c.text(String(value), cellX + cellWidth / 2, y, BODY, "numericBold", INK.dark, "center");
    c.rect(cellX, y + cellHeight - 6, cellWidth, cellHeight, INK.white, INK.line, 0.3);
    if (index === 0)
      c.text(String(outputs[0]), cellX + cellWidth / 2, y + cellHeight + 2, BODY, "numericBold", INK.dark, "center");
  });
}

/** 应用题：一行题面，下面留列式的位置。 */
function drawWordItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number) {
  if (item.data.kind !== "word") return;
  c.text(wordText(item.data), x, y, BODY, "chinese", INK.dark);
  c.caption("列式：", x, y + 11, 11, "chinese", INK.muted);
  c.line(x + 20, y + 16, x + Math.min(columnWidth - 12, 160), y + 16, INK.line, 0.5);
}

/** 画一个题块；行高由页面按可用空间算好后给出。 */
function drawBlock(c: Canvas, block: DrillBlock, top: number, rowHeight: number): number {
  c.text(block.title, CONTENT_LEFT + 2, top, 15, "chineseBold", INK.dark);
  c.caption(block.instruction, CONTENT_LEFT + 2, top + 7.5, 11, "chinese", INK.muted);
  const itemsTop = top + BLOCK_HEAD;
  const columnWidth = CONTENT_WIDTH / block.columns;
  // 行高与标准行高的比例：行高被拉大时内容跟着放大，留白才不会都留在下面。
  const scale = Math.max(0.55, Math.min(1.6, rowHeight / BLOCK_LAYOUT[block.kind].rowHeight));
  block.items.forEach((item, index) => {
    const column = index % block.columns;
    const row = Math.floor(index / block.columns);
    // 每行留出一点行距，避免字贴着下一行。
    const x = CONTENT_LEFT + column * columnWidth;
    const y = itemsTop + row * rowHeight + Math.min(7, rowHeight * 0.2);
    if (block.kind === "vertical") drawVerticalItem(c, item, x, y, scale);
    else if (block.kind === "fill") drawFillItem(c, item, x, y);
    else if (block.kind === "compare") drawCompareItem(c, item, x, y);
    else if (block.kind === "operator") drawOperatorItem(c, item, x, y);
    else if (block.kind === "spotError") drawSpotErrorItem(c, item, x, y, scale);
    else if (block.kind === "checkBack") drawCheckBackItem(c, item, x, y, scale);
    else if (block.kind === "manyWays") drawManyWaysItem(c, item, x, y, scale);
    else if (block.kind === "makeTen") drawMakeTenItem(c, item, x, y);
    else if (block.kind === "split") drawSplitItem(c, item, x, y, columnWidth);
    else if (block.kind === "numberLine") drawNumberLineItem(c, item, x, y, columnWidth, scale);
    else if (block.kind === "inOut") drawInOutItem(c, item, x, y, scale);
    else if (block.kind === "word") drawWordItem(c, item, x, y, columnWidth);
    else drawOralItem(c, item, x, y, columnWidth);
  });
  return BLOCK_HEAD + Math.ceil(block.items.length / block.columns) * rowHeight;
}

export function layoutDrillSheet(sheet: DrillSheet, fonts: WorksheetFonts): readonly [WorksheetPage, WorksheetPage] {
  const pages = sheet.pages.map((page) => {
    const header = new Canvas(fonts), footer = new Canvas(fonts);
    drawHeader(header, sheet.sheet, page);

    const blocks = page.blocks;
    const rows = blocks.map((block) => Math.ceil(block.items.length / block.columns));
    const headTotal = blocks.length * (BLOCK_HEAD + BLOCK_PAD) + Math.max(0, blocks.length - 1) * BLOCK_GAP;
    const available = Math.max(40, CONTENT_BOTTOM - CONTENT_TOP - headTotal);
    // 按各题型的标准行高分配空间，让整页正好填满，不留成片空白。
    const weights = rows.map((row, index) => row * BLOCK_LAYOUT[blocks[index].kind].rowHeight);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1;

    const regions: WorksheetTaskRegion[] = [];
    let y = CONTENT_TOP;
    blocks.forEach((block, index) => {
      const rowHeight = Math.min(58, Math.max(10, (available * weights[index]) / weightSum / rows[index]));
      const height = BLOCK_HEAD + rows[index] * rowHeight + BLOCK_PAD;
      const canvas = new Canvas(fonts);
      drawBlock(canvas, block, y, rowHeight);
      regions.push({
        id: block.id,
        // 版面不再按题型分组，保留这两个字段让画图与范围检查都能用。
        skill: "structure",
        kind: block.kind as never,
        x: CONTENT_LEFT, y, width: CONTENT_WIDTH, height,
        nodes: canvas.nodes,
      });
      y += height + BLOCK_GAP;
    });

    footer.caption(`第 ${sheet.sheet} 份 · ${page.side === "front" ? "正面" : "反面"}`, 14, 279, 10, "chinese", INK.muted);
    footer.caption("看清符号 · 写清得数", 196, 279, 10, "chinese", INK.muted, "right");

    return {
      id: `${sheet.id}-${page.side}`,
      worksheetId: sheet.id,
      side: page.side,
      day: sheet.sheet,
      title: page.title,
      header: header.nodes,
      tasks: regions,
      footer: footer.nodes,
    } satisfies WorksheetPage;
  });
  return pages as unknown as readonly [WorksheetPage, WorksheetPage];
}

export function layoutDrillPlan(sheets: readonly DrillSheet[], fonts: WorksheetFonts) {
  return { width: 210 as const, height: 297 as const, pages: sheets.flatMap((sheet) => layoutDrillSheet(sheet, fonts)) };
}
