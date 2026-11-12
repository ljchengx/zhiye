import { getMathHeaderCharacters, MATH_WORKSHEET_HEADER_ASSETS } from "../math-picture-assets";
import { Canvas, INK, type WorksheetIconKey } from "../number-sense/drawing";
import type { WorksheetFonts } from "../number-sense/fonts";
import type { WorksheetPage, WorksheetTaskRegion } from "../number-sense/layout";
import { BLOCK_LAYOUT } from "./blocks";
import { chainText } from "./chain";
import { checkBackText, spotErrorText } from "./checks";
import { fillText } from "./fill";
import { compareRightText, compareText } from "./relations";
import { circleOutText } from "./circleOut";
import { makeTenText, manyWaysText, splitText } from "./strategies";
import type { DrillBlock, DrillItem, DrillPage, DrillSheet } from "./types";
import { wordText } from "./word";

const CONTENT_LEFT = 14;
const CONTENT_WIDTH = 182;
const HEADER_TOP = 12;
const HEADER_HEIGHT = 34;
const CONTENT_TOP = HEADER_TOP + HEADER_HEIGHT + 8;
const CONTENT_BOTTOM = 272;
const BLOCK_GAP = 8;
const BLOCK_HEAD = 15;
const BLOCK_PAD = 4;
const BODY = 17;
const VERTICAL_BODY = 19;

/** 每种题型一套配色与图标，孩子能分清这一块在练什么。 */
const THEME: Record<string, { bg: string; line: string; ink: string; icon: WorksheetIconKey }> = {
  oral: { bg: "#EAF6FF", line: "#7EC5EC", ink: "#16688F", icon: "fish" },
  vertical: { bg: "#FFF3E3", line: "#F2C185", ink: "#A9620F", icon: "block" },
  fill: { bg: "#F4EFFF", line: "#BFA9EE", ink: "#5B43B5", icon: "star" },
  spotError: { bg: "#FFEDEE", line: "#F09AA1", ink: "#B32B2B", icon: "heart" },
  chain: { bg: "#E7F8F4", line: "#8ED4C3", ink: "#1F7F68", icon: "mushroom" },
  checkBack: { bg: "#EDFAE7", line: "#A0D98A", ink: "#34801E", icon: "apple" },
  compare: { bg: "#FFF8DC", line: "#EDD678", ink: "#8F6E0C", icon: "coin" },
  manyWays: { bg: "#FFEFF6", line: "#F0A6C8", ink: "#B32F70", icon: "flower" },
  operator: { bg: "#EEF1FF", line: "#A2B0EE", ink: "#3544A0", icon: "ball" },
  makeTen: { bg: "#FFF1E7", line: "#EEB794", ink: "#A9601F", icon: "cookie" },
  inOut: { bg: "#E8F6FB", line: "#8FCDE5", ink: "#1B6A8A", icon: "pineapple" },
  numberLine: { bg: "#EEFAF0", line: "#9BD9A6", ink: "#227A3A", icon: "flower" },
  split: { bg: "#FFF0ED", line: "#F0A99C", ink: "#B34733", icon: "heart" },
  word: { bg: "#FFF7DE", line: "#EDCB80", ink: "#96690C", icon: "balloon" },
  numberTower: { bg: "#EAF3FF", line: "#93B8EE", ink: "#2A55A8", icon: "block" },
  dotCount: { bg: "#EFFAF3", line: "#93D8AE", ink: "#1F7A47", icon: "apple" },
  matchLine: { bg: "#F1EEFF", line: "#B3A6EE", ink: "#4B39A8", icon: "star" },
  circleOut: { bg: "#FFF0F4", line: "#EFA6BC", ink: "#A82F55", icon: "heart" },
};
const FALLBACK = THEME.oral;

/** 各题型内容本身占的高度（毫米）：缩放不能超过它，否则会超出题块。 */
const CONTENT_HEIGHT: Partial<Record<string, number>> = {
  vertical: 30, spotError: 18, checkBack: 17, manyWays: 17, numberLine: 25, inOut: 22,
  numberTower: 34, dotCount: 26, matchLine: 30, circleOut: 26,
};

type Theme = (typeof THEME)[string];

/** 表头：两侧角色图、中间标题与份号，角色按份号确定。 */
function drawHeader(c: Canvas, sheet: number, page: DrillPage) {
  const [left, right] = getMathHeaderCharacters(sheet);
  c.roundRect(12, HEADER_TOP, 186, HEADER_HEIGHT, 6, "#FFF7E8", "#EFD2A0", 0.8);
  for (let x = 21; x <= 189; x += 12) c.circle(x, HEADER_TOP + HEADER_HEIGHT - 3, 2.2, "#EFD2A0");
  c.image(left, 15, HEADER_TOP + 2, 24, 24);
  c.image(right, 171, HEADER_TOP + 2, 24, 24);
  c.text("计算练习", 105, HEADER_TOP + 14, 24, "chineseBold", "#D9752C", "center");
  c.caption(
    `第 ${sheet} 份 · ${page.side === "front" ? "正面" : "反面"}`,
    105, HEADER_TOP + 26, 11, "chinese", INK.muted, "center");
}

/** 算式后面留一条得数线，线不越过本列右端。 */
function drawExpression(c: Canvas, text: string, x: number, y: number, columnWidth: number, theme: Theme) {
  const width = c.width(text, "numericBold", BODY);
  const start = x + width + 3;
  const end = Math.min(x + columnWidth - 5, start + 26);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  c.line(start, y + 5.5, Math.max(start + 8, end), y + 5.5, theme.line, 0.7, true);
}

function drawOralItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number, theme: Theme) {
  if (item.data.kind === "oral")
    drawExpression(c, `${item.data.terms[0]} ${item.data.operators[0]} ${item.data.terms[1]} =`, x, y, columnWidth, theme);
  else if (item.data.kind === "chain")
    drawExpression(c, chainText(item.data), x, y, columnWidth, theme);
}

/** 填空：缺的位置留一条线。 */
function drawFillItem(c: Canvas, item: DrillItem, x: number, y: number, theme: Theme) {
  if (item.data.kind !== "fill") return;
  const { parts, blank } = fillText(item.data);
  const isBlank = (index: number) =>
    (blank === 0 && index === 0) || (blank === 1 && index === 2) || (blank === 2 && index === 4);
  let cursor = x;
  parts.forEach((part, index) => {
    if (isBlank(index)) {
      c.line(cursor, y + 5.5, cursor + 17, y + 5.5, theme.line, 0.7, true);
      cursor += 22;
      return;
    }
    c.text(part, cursor, y, BODY, "numericBold", INK.dark);
    cursor += c.width(part, "numericBold", BODY) + 2.5;
  });
}

/** 列式：两行数字右对齐，符号在左下，横线下方留答题区。 */
function drawVerticalItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number, theme: Theme) {
  if (item.data.kind !== "vertical") return;
  const right = x + 30;
  const gap = 12 * scale;
  c.text(String(item.data.a), right, y, VERTICAL_BODY, "numericBold", INK.dark, "right");
  c.text(item.data.operator, x + 2, y + gap, VERTICAL_BODY, "numericBold", theme.ink);
  c.text(String(item.data.b), right, y + gap, VERTICAL_BODY, "numericBold", INK.dark, "right");
  c.line(x + 2, y + gap * 1.9, right + 2, y + gap * 1.9, theme.line, 1, false);
}

/** 比大小：左右两个算式中间留一个填符号的圆。 */
function drawCompareItem(c: Canvas, item: DrillItem, x: number, y: number, theme: Theme) {
  if (item.data.kind !== "compare") return;
  const left = compareText(item.data), right = compareRightText(item.data);
  c.text(left, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(left, "numericBold", BODY);
  c.circle(x + width + 6, y + 2, 4, "#FFFFFF", theme.line, 0.8);
  c.text(right, x + width + 13, y, BODY, "numericBold", INK.dark);
}

/** 填符号：符号的位置留一条线。 */
function drawOperatorItem(c: Canvas, item: DrillItem, x: number, y: number, theme: Theme) {
  if (item.data.kind !== "operator") return;
  const { a, b, result } = item.data;
  const head = String(a);
  c.text(head, x, y, BODY, "numericBold", INK.dark);
  const cursor = x + c.width(head, "numericBold", BODY) + 4;
  c.line(cursor, y + 5.5, cursor + 10, y + 5.5, theme.line, 0.7, true);
  c.text(`${b} = ${result}`, cursor + 14, y, BODY, "numericBold", INK.dark);
}

/** 找错改正：印出错式，下面留一条改正线。 */
function drawSpotErrorItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number, theme: Theme) {
  if (item.data.kind !== "spotError") return;
  c.text(spotErrorText(item.data), x, y, BODY, "numericBold", INK.dark);
  c.caption("改：", x, y + 11 * scale, 11, "chinese", theme.ink);
  c.line(x + 11, y + 16 * scale, x + 46, y + 16 * scale, theme.line, 0.7, true);
}

/** 算完检查：上一行给出算式与结果，下一行填另一个算式的结果。 */
function drawCheckBackItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number, theme: Theme) {
  if (item.data.kind !== "checkBack") return;
  const { given, check } = checkBackText(item.data);
  c.text(given, x, y, BODY, "numericBold", INK.dark);
  c.text(check, x, y + 9 * scale, BODY, "numericBold", theme.ink);
  const width = c.width(check, "numericBold", BODY);
  c.line(x + width + 3, y + 14.5 * scale, x + width + 20, y + 14.5 * scale, theme.line, 0.7, true);
}

/** 一题多解：先写结果，再留两行写不同的算法。 */
function drawManyWaysItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number, theme: Theme) {
  if (item.data.kind !== "manyWays") return;
  const text = manyWaysText(item.data);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", BODY);
  c.line(x + width + 4, y + 5.5, x + width + 30, y + 5.5, theme.line, 0.7, true);
  c.line(x + 2, y + 15 * scale, x + 72, y + 15 * scale, theme.line, 0.6, true);
}

/** 凑整再算：印出补成整十的算式，填减少后的那个加数。 */
function drawMakeTenItem(c: Canvas, item: DrillItem, x: number, y: number, theme: Theme) {
  if (item.data.kind !== "makeTen") return;
  const text = makeTenText(item.data);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", BODY);
  c.line(x + width + 4, y + 5.5, x + width + 22, y + 5.5, theme.line, 0.7, true);
}

/** 数的拆分：一个数后面留两处空。 */
function drawSplitItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number, theme: Theme) {
  if (item.data.kind !== "split") return;
  const text = splitText(item.data);
  c.text(text, x, y, BODY, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", BODY);
  const room = Math.max(12, (columnWidth - width - 14) / 2);
  c.line(x + width + 3, y + 5.5, x + width + 3 + room, y + 5.5, theme.line, 0.7, true);
  c.text("+", x + width + 5 + room, y, BODY, "numericBold", theme.ink);
  c.line(x + width + 10 + room, y + 5.5, x + width + 10 + room * 2, y + 5.5, theme.line, 0.7, true);
}

/** 数线移动：一条数线，起点标出，两段箭头，终点留空。 */
function drawNumberLineItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number, scale: number, theme: Theme) {
  if (item.data.kind !== "numberLine") return;
  const { start, jumps } = item.data;
  const left = x + 4, right = x + columnWidth - 8;
  const first = left + (right - left) * 0.42;
  const second = left + (right - left) * 0.72;
  const line = y + 11 * scale;
  c.line(left, line, right, line, theme.line, 1);
  c.circle(left, line, 2, theme.line);
  c.text(String(start), left, y + 5 * scale, BODY, "numericBold", theme.ink, "center");
  c.line(left + 3, y + 17 * scale, first, y + 17 * scale, theme.line, 0.7);
  c.line(first + 3, y + 17 * scale, second, y + 17 * scale, theme.line, 0.7);
  c.text(`+${jumps[0]}`, (left + first) / 2, y + 13 * scale, 14, "numericBold", theme.ink, "center");
  c.text(`+${jumps[1]}`, (first + second) / 2, y + 13 * scale, 14, "numericBold", theme.ink, "center");
  c.line(first + 3, y + 24 * scale, right, y + 24 * scale, theme.line, 0.7, true);
}

/** 进几出几：两行格子，进的数都给出，出的数只给第一个。 */
function drawInOutItem(c: Canvas, item: DrillItem, x: number, y: number, scale: number, theme: Theme) {
  if (item.data.kind !== "inOut") return;
  const { inputs, outputs } = item.data;
  const labelWidth = 11, cellWidth = 20;
  const cellHeight = Math.max(8, 9 * scale);
  c.text("进", x, y, BODY, "chineseBold", theme.ink);
  c.text("出", x, y + cellHeight + 2, BODY, "chineseBold", theme.ink);
  inputs.forEach((value, index) => {
    const cellX = x + labelWidth + index * cellWidth;
    c.roundRect(cellX, y - 6, cellWidth, cellHeight, 2, "#FFFFFF", theme.line, 0.7);
    c.text(String(value), cellX + cellWidth / 2, y, BODY, "numericBold", INK.dark, "center");
    c.roundRect(cellX, y + cellHeight - 6, cellWidth, cellHeight, 2, "#FFFFFF", theme.line, 0.7);
    if (index === 0)
      c.text(String(outputs[0]), cellX + cellWidth / 2, y + cellHeight + 2, BODY, "numericBold", INK.dark, "center");
  });
}

/** 应用题：左边一个小图，右边题面，下面留列式的位置。 */
function drawWordItem(c: Canvas, item: DrillItem, x: number, y: number, columnWidth: number, theme: Theme) {
  if (item.data.kind !== "word") return;
  c.roundRect(x, y - 6, 15, 15, 3, INK.white, theme.line, 0.8);
  c.image(theme.icon, x + 2.5, y - 3.5, 10, 10);
  c.text(wordText(item.data), x + 19, y, BODY, "chinese", INK.dark);
  c.caption("列式：", x + 19, y + 11, 11, "chinese", theme.ink);
  c.line(x + 39, y + 16, x + Math.min(columnWidth - 8, 168), y + 16, theme.line, 0.8, true);
}

/** 加一加：最下面给三个数，往上相邻两数相加，空位填数。 */
function drawTowerItem(c: Canvas, item: DrillItem, x: number, y: number, rowHeight: number, scale: number, theme: Theme) {
  if (item.data.kind !== "numberTower") return;
  const step = 19 * scale;
  const rise = 8.5 * scale;
  // 上面两个方框都留在行里，上下摆正。
  const towerHeight = rise * 2 + 10;
  const baseY = y + Math.max(0, (rowHeight - towerHeight) / 2) + towerHeight - 5;
  const box = (bx: number, by: number, text: string | null) => {
    c.roundRect(bx - 7, by - 7, 14, 10, 2.5, text === null ? INK.white : theme.bg, theme.line, 0.7);
    if (text !== null) c.text(text, bx, by, 14, "numericBold", INK.dark, "center");
  };
  box(x + 14, baseY, String(item.data.base[0]));
  box(x + 14 + step, baseY, String(item.data.base[1]));
  box(x + 14 + step * 2, baseY, String(item.data.base[2]));
  box(x + 14 + step / 2, baseY - rise, null);
  box(x + 14 + step * 1.5, baseY - rise, null);
  box(x + 14 + step, baseY - rise * 2, null);
}

/** 数一数：用素材库的角色排成几行，按行数出一共多少个。 */
function drawDotCountItem(c: Canvas, item: DrillItem, x: number, y: number, rowHeight: number, theme: Theme) {
  if (item.data.kind !== "dotCount") return;
  const { rows, columns } = item.data;
  const asset = MATH_WORKSHEET_HEADER_ASSETS[item.data.assetIndex % MATH_WORKSHEET_HEADER_ASSETS.length].name;
  // 图标格距由行高反推，几行都装得下。
  const pitch = Math.max(4.5, (rowHeight - 21) / rows);
  const size = Math.min(pitch - 1.2, 46 / columns);
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    c.image(asset, x + 16 + column * pitch, y - 5 + row * pitch, size, size);
  }
  const after = y - 5 + rows * pitch + 2;
  c.text(`${rows} 行，每行 ${columns} 个`, x + 16, after, 14, "chinese", theme.ink);
  c.text("一共", x + 16, after + 8, 15, "chinese", INK.dark);
  c.line(x + 34, after + 8.5, x + 56, after + 8.5, theme.line, 0.8, true);
  c.text("个", x + 59, after + 8, 15, "chinese", INK.dark);
}

/** 连一连：左边算式、右边得数，中间留出连线的空间。 */
function drawMatchItem(c: Canvas, item: DrillItem, x: number, y: number, rowHeight: number, theme: Theme) {
  if (item.data.kind !== "matchLine") return;
  const data = item.data;
  const rowGap = Math.max(6, (rowHeight - 6) / data.expressions.length);
  data.expressions.forEach((text, index) => {
    const top = y + index * rowGap;
    c.circle(x + 26, top - 1.5, 2.6, INK.white, theme.line, 0.8);
    c.text(text, x + 2, top, 15, "numericBold", INK.dark);
    c.circle(x + 62, top - 1.5, 2.6, INK.white, theme.line, 0.8);
    c.text(String(data.right[index]), x + 67, top, 15, "numericBold", theme.ink);
  });
}

/** 圈一圈：一组六个算式，组里先写清条件，每个算式前留一个可以圈的圈。 */
function drawCircleOutItem(c: Canvas, item: DrillItem, x: number, y: number, rowHeight: number, theme: Theme) {
  if (item.data.kind !== "circleOut") return;
  c.caption(circleOutText(item.data), x + 2, y - 4, 11, "chinese", theme.ink);
  const columnWidth = 56;
  const rowGap = Math.max(7, (rowHeight - 10) / 2);
  item.data.expressions.forEach((text, index) => {
    const cx = x + (index % 3) * columnWidth;
    const cy = y + 4 + Math.floor(index / 3) * rowGap;
    c.circle(cx + 3, cy - 2, 3.4, INK.white, theme.line, 0.8);
    c.text(text, cx + 9, cy, 15, "numericBold", INK.dark);
  });
}

/** 画一个题块；行高由页面按可用空间算好后给出。 */
function drawBlock(c: Canvas, block: DrillBlock, top: number, rowHeight: number, index: number): number {
  const theme = THEME[block.kind] ?? FALLBACK;
  const rows = Math.ceil(block.items.length / block.columns);
  const height = BLOCK_HEAD + rows * rowHeight + BLOCK_PAD;
  // 卡片 + 序号圆点 + 图标，每块都能分清。
  c.roundRect(CONTENT_LEFT - 1, top - 4, CONTENT_WIDTH + 2, height + 2, 5, theme.bg, theme.line, 0.7);
  c.circle(CONTENT_LEFT + 6, top + 3, 4.6, theme.line);
  c.text(String(index + 1), CONTENT_LEFT + 6, top + 4.8, 14, "numericBold", INK.white, "center");
  c.text(block.title.replace(/^[一二三四五]、/, ""), CONTENT_LEFT + 14, top + 4.8, 17, "chineseBold", theme.ink);
  c.image(theme.icon, CONTENT_LEFT + CONTENT_WIDTH - 14, top - 3, 14, 14);
  c.caption(block.instruction, CONTENT_LEFT + 14, top + 11.5, 11, "chinese", theme.ink);
  c.line(CONTENT_LEFT + 13, top + 13.5, CONTENT_LEFT + CONTENT_WIDTH - 6, top + 13.5, theme.line, 0.4, true);

  const itemsTop = top + BLOCK_HEAD;
  const columnWidth = CONTENT_WIDTH / block.columns;
  // 行内偏移也算进内容高度，缩放后才会正好落在题块里。
  const yOffset = Math.min(4, rowHeight * 0.12);
  const base = CONTENT_HEIGHT[block.kind] ?? BLOCK_LAYOUT[block.kind].rowHeight + yOffset;
  const scale = Math.max(0.45, Math.min(1.6, (rowHeight - yOffset) / base));
  block.items.forEach((item, itemIndex) => {
    const column = itemIndex % block.columns;
    const row = Math.floor(itemIndex / block.columns);
    const x = CONTENT_LEFT + column * columnWidth + 2;
    const y = itemsTop + row * rowHeight + yOffset;
    if (block.kind === "vertical") drawVerticalItem(c, item, x, y, scale, theme);
    else if (block.kind === "fill") drawFillItem(c, item, x, y, theme);
    else if (block.kind === "compare") drawCompareItem(c, item, x, y, theme);
    else if (block.kind === "operator") drawOperatorItem(c, item, x, y, theme);
    else if (block.kind === "spotError") drawSpotErrorItem(c, item, x, y, scale, theme);
    else if (block.kind === "checkBack") drawCheckBackItem(c, item, x, y, scale, theme);
    else if (block.kind === "manyWays") drawManyWaysItem(c, item, x, y, scale, theme);
    else if (block.kind === "makeTen") drawMakeTenItem(c, item, x, y, theme);
    else if (block.kind === "split") drawSplitItem(c, item, x, y, columnWidth, theme);
    else if (block.kind === "numberLine") drawNumberLineItem(c, item, x, y, columnWidth, scale, theme);
    else if (block.kind === "inOut") drawInOutItem(c, item, x, y, scale, theme);
    else if (block.kind === "word") drawWordItem(c, item, x, y, columnWidth, theme);
    else if (block.kind === "numberTower") drawTowerItem(c, item, x, y, rowHeight, scale, theme);
    else if (block.kind === "dotCount") drawDotCountItem(c, item, x, y, rowHeight, theme);
    else if (block.kind === "matchLine") drawMatchItem(c, item, x, y, rowHeight, theme);
    else if (block.kind === "circleOut") drawCircleOutItem(c, item, x, y, rowHeight, theme);
    else drawOralItem(c, item, x, y, columnWidth, theme);
  });
  return height;
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
      const rowHeight = Math.min(56, Math.max(8, (available * weights[index]) / weightSum / rows[index]));
      const height = BLOCK_HEAD + rows[index] * rowHeight + BLOCK_PAD;
      const canvas = new Canvas(fonts);
      drawBlock(canvas, block, y, rowHeight, index);
      regions.push({
        id: block.id,
        // 版面不再按题型分组，保留这两个字段让画图与范围检查都能用。
        skill: "structure",
        kind: block.kind as never,
        // 范围把卡片一起框进来，检查时才不会把卡片判成出线。
        x: CONTENT_LEFT - 2, y: y - 5, width: CONTENT_WIDTH + 4, height: height + 4,
        nodes: canvas.nodes,
      });
      y += height + BLOCK_GAP;
    });

    footer.caption(`第 ${sheet.sheet} 份 · ${page.side === "front" ? "正面" : "反面"}`, 14, 279, 10, "chinese", INK.muted);
    footer.caption("写清楚 · 写好看", 196, 279, 10, "chinese", INK.muted, "right");

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
