import { getMathHeaderCharacters, MATH_WORKSHEET_CHARACTER_ASSETS } from "../math-picture-assets";
import { Canvas, INK, type WorksheetNode, type WorksheetIconKey } from "../number-sense/drawing";
import type { WorksheetFonts } from "../number-sense/fonts";
import { assertWorksheetContentSpacing, assertWorksheetPageBounds, nodeBounds, type WorksheetPage, type WorksheetTaskRegion } from "../number-sense/layout";
import { BLOCK_LAYOUT } from "./blocks";
import { chainText } from "./chain";
import { checkBackText, spotErrorText } from "./checks";
import { fillText } from "./fill";
import { DRILL_PAGE as PAGE, DRILL_WRITING as WRITING } from "./metrics";
import { compareRightText, compareText } from "./relations";
import { makeTenText, manyWaysText, splitText } from "./strategies";
import type { DrillBlock, DrillItem, DrillPage, DrillSheet } from "./types";
import { wordText } from "./word";
import { drawWordScene } from "./word-scene";

const BODY = 16;
const NUMBER_WIDTH = 9;

interface Theme {
  title: string;
  fill: string;
  accent: string;
  line: string;
  icon: WorksheetIconKey;
}

/** 配色与角色独立轮换，主题统一不限制头部只能出现四张素材。 */
const THEMES: readonly Theme[] = [
  { title: "森林探险", fill: "#F0F7E9", accent: "#426C35", line: "#9EBD89", icon: "mushroom" },
  { title: "海洋寻宝", fill: "#EDF7FC", accent: "#236D8C", line: "#8ABBCF", icon: "fish" },
  { title: "太空旅行", fill: "#F1EFFA", accent: "#625090", line: "#B1A5D1", icon: "star" },
  { title: "花园派对", fill: "#FFF1F3", accent: "#A34D67", line: "#D5A0AD", icon: "flower" },
];

interface Rect { x: number; y: number; width: number; height: number }

interface BlockGeometry {
  top: number;
  height: number;
  title: Rect;
  instruction: Rect;
  content: Rect;
  contentTop: number;
  contentHeight: number;
  rowHeight: number;
  columnWidth: number;
  itemGap: number;
}

interface ItemGeometry extends Rect {
  body: Rect;
  number: number;
  index: number;
}

interface Measurement { rows: number; minRowHeight: number; preferredRowHeight: number; minHeight: number; preferredHeight: number }

function tag(c: Canvas, from: number, metadata: Partial<WorksheetNode>) {
  for (let index = from; index < c.nodes.length; index += 1) Object.assign(c.nodes[index], metadata);
}

/** 作答线与图形线分开标记，碰撞检查才不会把格子中的数字误判为遮挡。 */
function writingLine(c: Canvas, x1: number, y: number, x2: number, theme: Theme) {
  const from = c.nodes.length;
  c.line(x1, y, x2, y, theme.line, 0.6, true);
  tag(c, from, { purpose: "writing", writingHeight: WRITING.lineHeight });
}

function writingBox(c: Canvas, x: number, y: number, width: number, height: number, theme: Theme) {
  const from = c.nodes.length;
  c.roundRect(x, y, width, height, 2, INK.white, theme.line, 0.6);
  tag(c, from, { purpose: "writing" });
}

function writingCircle(c: Canvas, x: number, y: number, radius: number, theme: Theme) {
  const from = c.nodes.length;
  c.circle(x, y, radius, INK.white, theme.accent, 0.6);
  tag(c, from, { purpose: "writing" });
}

function textHeight(c: Canvas, size = BODY) { return c.fonts.height("numericBold", size); }

/** 内容高度使用真实字体度量；图形题保留各自的几何尺寸。 */
function itemHeight(item: DrillItem, fonts: WorksheetFonts): number {
  const h = fonts.height("numericBold", BODY);
  switch (item.data.kind) {
    case "vertical": return fonts.height("numericBold", 18) * 2 + 5.5 + WRITING.numberHeight;
    case "spotError":
    case "checkBack": return h + 3 + WRITING.lineHeight;
    case "manyWays": return 37;
    case "inOut": return WRITING.tableCellHeight * 2;
    case "numberLine": return 33;
    case "word": return 60;
    case "numberTower": return WRITING.towerHeight * 3 + 4;
    case "dotCount": return 35;
    case "matchLine":
    case "circleOut": return Math.max(WRITING.activityHeight, h + 4);
    default: return Math.max(h, WRITING.lineHeight);
  }
}

function measure(block: DrillBlock, fonts: WorksheetFonts): Measurement {
  const setting = BLOCK_LAYOUT[block.kind];
  const rows = Math.ceil(block.items.length / block.columns);
  const minRowHeight = Math.max(setting.minRowHeight,
    ...block.items.map((item) => itemHeight(item, fonts) + setting.minItemGap));
  const preferredRowHeight = Math.max(minRowHeight, setting.preferredRowHeight);
  const overhead = PAGE.blockHead + PAGE.blockPad;
  return {
    rows, minRowHeight, preferredRowHeight,
    minHeight: Math.max(setting.minBlockHeight, overhead + rows * minRowHeight),
    preferredHeight: Math.max(setting.minBlockHeight, overhead + rows * preferredRowHeight),
  };
}

/** 先满足最低尺寸，再分配推荐尺寸；空间宽裕时保留白边，不无限拉伸题目。 */
function allocateGeometry(blocks: readonly DrillBlock[], fonts: WorksheetFonts): BlockGeometry[] {
  const measurements = blocks.map((block) => measure(block, fonts));
  const available = PAGE.bottom - PAGE.top - (blocks.length - 1) * PAGE.blockGap;
  const minimum = measurements.reduce((sum, block) => sum + block.minHeight, 0);
  const preferred = measurements.reduce((sum, block) => sum + block.preferredHeight, 0);
  if (minimum > available + 0.01) throw new Error("题块最低高度超过页面空间，请减少题量");
  const ratio = preferred === minimum ? 0 : Math.min(1, (available - minimum) / (preferred - minimum));
  let top: number = PAGE.top;
  return measurements.map((measured, index) => {
    const height = measured.minHeight + (measured.preferredHeight - measured.minHeight) * ratio;
    const contentHeight = height - PAGE.blockHead - PAGE.blockPad;
    const content = { x: PAGE.left + PAGE.inset, y: top + PAGE.blockHead, width: PAGE.width - PAGE.inset * 2, height: contentHeight };
    const result: BlockGeometry = {
      top, height,
      title: { x: PAGE.left + 5, y: top + 2, width: PAGE.width - 10, height: 9 },
      instruction: { x: PAGE.left + 15, y: top + 11, width: PAGE.width - 20, height: 6 },
      content, contentTop: content.y, contentHeight,
      rowHeight: contentHeight / measured.rows,
      columnWidth: (content.width - (blocks[index].columns - 1) * PAGE.columnGap) / blocks[index].columns,
      itemGap: BLOCK_LAYOUT[blocks[index].kind].minItemGap,
    };
    top += height + PAGE.blockGap;
    return result;
  });
}

function star(c: Canvas, x: number, y: number, size: number, theme: Theme) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const radius = (index % 2 ? 0.22 : 0.48) * size;
    const angle = index * Math.PI / 5 - Math.PI / 2;
    return `${size / 2 + Math.cos(angle) * radius} ${size / 2 + Math.sin(angle) * radius}`;
  });
  c.path(`M ${points.join(" L ")} Z`, x, y, size, size, INK.white, theme.accent, 0.5);
}

/** 页序与题块留出空白，数字和文字共用基线。 */
function drawPageNumber(c: Canvas, pageNumber: number, theme: Theme) {
  const center = 105, labelSize = 12, numberSize = 20, gap = 1.8;
  const labelAscent = c.fonts.ascent("chineseBold", labelSize);
  const numberAscent = c.fonts.ascent("numericBold", numberSize);
  const baseline = 285 - Math.max(
    c.fonts.height("chineseBold", labelSize) - labelAscent,
    c.fonts.height("numericBold", numberSize) - numberAscent,
  );
  const labelWidth = c.width("第", "chineseBold", labelSize);
  const number = String(pageNumber), numberWidth = c.width(number, "numericBold", numberSize);
  const totalWidth = labelWidth + numberWidth + c.width("页", "chineseBold", labelSize) + gap * 2;
  const left = center - totalWidth / 2;
  const labelTop = baseline - labelAscent;
  c.caption("第", left, labelTop, labelSize, "chineseBold", INK.muted);
  c.text(number, left + labelWidth + gap, baseline - numberAscent, numberSize, "numericBold", theme.accent);
  c.caption("页", left + labelWidth + gap * 2 + numberWidth, labelTop, labelSize, "chineseBold", INK.muted);
}

function drawHeader(c: Canvas, sheet: number, page: DrillPage, theme: Theme, headerSeed: number) {
  c.roundRect(12, 12, 186, 28, 5, theme.fill, undefined, 0);
  c.caption(`第 ${sheet} 份 · ${page.side === "front" ? "正面" : "反面"} · 计算练习`, 19, 14, 10, "chinese", theme.accent);
  c.text(`${theme.title} · ${page.side === "front" ? "算一算" : "想一想"}`, 19, 21, 21, "chineseBold", theme.accent);
  c.caption(page.side === "front" ? "先算一算，再玩图形。" : "想想方法，用到生活里。", 19, 33, 10, "chinese", INK.muted);
  const characters = getMathHeaderCharacters(sheet, headerSeed);
  c.image(characters[page.side === "front" ? 0 : 1], 167, 14, 25, 24);
  star(c, 145, 19, 6, theme);
}

function drawExpression(c: Canvas, text: string, g: ItemGeometry, theme: Theme) {
  const { x, y, width } = g.body;
  const textY = y + (WRITING.lineHeight - textHeight(c)) / 2;
  const end = x + c.text(text, x, textY, BODY, "numericBold", INK.dark);
  writingLine(c, end + 3, y + WRITING.lineHeight, Math.min(x + width - 1, end + 3 + WRITING.numberWidth), theme);
}

function drawOralItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind === "oral")
    drawExpression(c, `${item.data.terms[0]} ${item.data.operators[0]} ${item.data.terms[1]} =`, g, theme);
  else if (item.data.kind === "chain") drawExpression(c, chainText(item.data), g, theme);
}

function drawFillItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "fill") return;
  const { parts, blank } = fillText(item.data);
  let cursor = g.body.x;
  const textY = g.body.y + (WRITING.lineHeight - textHeight(c)) / 2;
  parts.forEach((part, index) => {
    if (index === blank * 2) {
      writingLine(c, cursor, g.body.y + WRITING.lineHeight, cursor + WRITING.numberWidth, theme);
      cursor += WRITING.numberWidth + 3;
    } else cursor += c.text(part, cursor, textY, BODY, "numericBold", INK.dark) + 3;
  });
}

function drawVerticalItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "vertical") return;
  const { x, y, width } = g.body;
  const h = textHeight(c, 18), gap = h + 2.5;
  const right = x + Math.min(width - 3, 34);
  c.text(String(item.data.a), right, y, 18, "numericBold", INK.dark, "right");
  c.text(item.data.operator, x, y + gap, 18, "numericBold", theme.accent);
  c.text(String(item.data.b), right, y + gap, 18, "numericBold", INK.dark, "right");
  c.line(x, y + gap + h + 1, right + 1, y + gap + h + 1, theme.line, 0.6);
  writingBox(c, x, y + gap + h + 3, right - x + 1, WRITING.numberHeight, theme);
}

function drawCompareItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "compare") return;
  const { x, y } = g.body;
  const textY = y + (WRITING.symbolSize - textHeight(c)) / 2;
  const end = x + c.text(compareText(item.data), x, textY, BODY, "numericBold", INK.dark);
  writingBox(c, end + 3, y, WRITING.symbolSize, WRITING.symbolSize, theme);
  c.text(compareRightText(item.data), end + WRITING.symbolSize + 6, textY, BODY, "numericBold", INK.dark);
}

function drawOperatorItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "operator") return;
  const { x, y } = g.body, { a, b, result } = item.data;
  const textY = y + (WRITING.symbolSize - textHeight(c)) / 2;
  const end = x + c.text(String(a), x, textY, BODY, "numericBold", INK.dark);
  writingBox(c, end + 3, y, WRITING.symbolSize, WRITING.symbolSize, theme);
  c.text(`${b} = ${result}`, end + WRITING.symbolSize + 6, textY, BODY, "numericBold", INK.dark);
}

function drawSpotErrorItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "spotError") return;
  const { x, y, width } = g.body;
  c.text(spotErrorText(item.data), x, y, BODY, "numericBold", INK.dark);
  c.caption("改：", x, y + textHeight(c) + 3, 11, "chinese", theme.accent);
  writingLine(c, x + 10, y + g.body.height, x + width - 2, theme);
}

function drawCheckBackItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "checkBack") return;
  const { given, check } = checkBackText(item.data), { x, y, width } = g.body;
  c.text(given, x, y, BODY, "numericBold", INK.dark);
  const next = y + textHeight(c) + 3;
  const end = x + c.text(check, x, next + (WRITING.lineHeight - textHeight(c)) / 2, BODY, "numericBold", theme.accent);
  writingLine(c, end + 3, next + WRITING.lineHeight, x + width - 2, theme);
}

function drawManyWaysItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "manyWays") return;
  const { x, y, width } = g.body;
  // 两种方法共用题干，各留完整书写区，不再多占一个结果栏。
  c.text(manyWaysText(item.data).slice(0, -2), x, y, BODY, "numericBold", INK.dark);
  c.caption("一：", x, y + 12, 11, "chinese", theme.accent);
  writingLine(c, x + 10, y + 23, x + width - 2, theme);
  c.caption("二：", x, y + 26, 11, "chinese", theme.accent);
  writingLine(c, x + 10, y + 37, x + width - 2, theme);
}

function drawMakeTenItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind === "makeTen") drawExpression(c, makeTenText(item.data), g, theme);
}

function drawSplitItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "split") return;
  const { x, y, width } = g.body;
  const textY = y + (WRITING.lineHeight - textHeight(c)) / 2;
  const end = x + c.text(splitText(item.data), x, textY, BODY, "numericBold", INK.dark);
  const blank = Math.min(WRITING.numberWidth, (width - (end - x) - 13) / 2);
  const baseline = y + WRITING.lineHeight;
  writingLine(c, end + 3, baseline, end + 3 + blank, theme);
  const plus = end + blank + 6;
  const plusWidth = c.text("+", plus, textY, BODY, "numericBold", theme.accent);
  writingLine(c, plus + plusWidth + 3, baseline, plus + plusWidth + 3 + blank, theme);
}

function drawNumberLineItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "numberLine") return;
  const { x, y, width } = g.body, { start, jumps } = item.data;
  const left = x + 5, right = x + width - 14;
  const middle = left + (right - left) * jumps[0] / (jumps[0] + jumps[1]);
  c.line(left, y + 13, right + 4, y + 13, theme.line, 0.6);
  for (const point of [left, middle, right]) c.line(point, y + 11.5, point, y + 14.5, theme.accent, 0.6);
  for (const [a, b, jump] of [[left, middle, jumps[0]], [middle, right, jumps[1]]]) {
    c.text(`+${jump}`, (a + b) / 2, y, 14, "numericBold", theme.accent, "center");
    c.line(a, y + 10, b, y + 10, theme.accent, 0.6);
    c.line(b - 1.5, y + 8.8, b, y + 10, theme.accent, 0.6);
  }
  c.text(String(start), left, y + 19, BODY, "numericBold", INK.dark, "center");
  writingBox(c, right - WRITING.numberWidth / 2, y + 19, WRITING.numberWidth, WRITING.numberHeight, theme);
}

function drawInOutItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "inOut") return;
  const { x, y, width } = g.body, { inputs, outputs } = item.data;
  const labelWidth = 10, cellWidth = (width - labelWidth) / inputs.length, cellHeight = WRITING.tableCellHeight;
  const labelInset = (cellHeight - c.fonts.height("chineseBold", 14)) / 2;
  const numberInset = (cellHeight - textHeight(c, 14)) / 2;
  c.text("进", x, y + labelInset, 14, "chineseBold", theme.accent);
  c.text("出", x, y + cellHeight + labelInset, 14, "chineseBold", theme.accent);
  inputs.forEach((value, index) => {
    const cellX = x + labelWidth + index * cellWidth;
    const from = c.nodes.length;
    c.rect(cellX, y, cellWidth, cellHeight, INK.white, theme.line, 0.5);
    tag(c, from, { purpose: "diagram" });
    const output = c.nodes.length;
    c.rect(cellX, y + cellHeight, cellWidth, cellHeight, INK.white, theme.line, 0.5);
    tag(c, output, { purpose: index === 0 ? "diagram" : "writing" });
    c.text(String(value), cellX + cellWidth / 2, y + numberInset, 14, "numericBold", INK.dark, "center");
    if (index === 0) c.text(String(outputs[0]), cellX + cellWidth / 2, y + cellHeight + numberInset, 14, "numericBold", INK.dark, "center");
  });
}

function drawWordItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "word") return;
  const { x, y, width } = g.body;
  drawWordScene(c, item.data.scene, x, y, theme);
  c.caption(item.data.sceneTitle, x + 16, y + 35, 10, "chinese", theme.accent, "center");
  const textX = x + 38;
  const textInset = Math.max(0, c.fonts.ascent("numeric", BODY) - c.fonts.ascent("chinese", BODY));
  const height = c.wrap(wordText(item.data), textX, y + textInset, width - 39, BODY, 3, INK.dark);
  // 先测量题干，再安排两条作答线，三行故事也不会压住列式区。
  const equationY = Math.max(24, textInset + height + 2);
  const replyY = Math.max(42, equationY + 16);
  c.caption("列式：", textX, y + equationY, 11, "chinese", theme.accent);
  writingLine(c, textX + 17, y + equationY + 12, x + width - 3, theme);
  c.caption("答：", textX, y + replyY, 11, "chinese", theme.accent);
  writingLine(c, textX + 17, y + replyY + 12, x + width - 3, theme);
}

function drawTowerItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "numberTower") return;
  const { x, y, width } = g.body;
  const boxWidth = WRITING.towerWidth, boxHeight = WRITING.towerHeight;
  const step = boxWidth + 2, rise = boxHeight + 2;
  const left = x + (width - (step * 2 + boxWidth)) / 2;
  const box = (bx: number, by: number, text: number | null) => {
    if (text === null) writingBox(c, bx, by, boxWidth, boxHeight, theme);
    else {
      const from = c.nodes.length;
      c.roundRect(bx, by, boxWidth, boxHeight, 2, theme.fill, theme.line, 0.6);
      tag(c, from, { purpose: "diagram" });
      c.text(String(text), bx + boxWidth / 2, by + (boxHeight - textHeight(c, 14)) / 2, 14, "numericBold", INK.dark, "center");
    }
  };
  item.data.base.forEach((value, index) => box(left + index * step, y + rise * 2, value));
  box(left + step / 2, y + rise, item.data.cells[0]);
  box(left + step * 1.5, y + rise, item.data.cells[1]);
  box(left + step, y, item.data.cells[2]);
}

function drawDotCountItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "dotCount") return;
  const { x, y } = g.body, { rows, columns, assetIndex } = item.data;
  const asset = MATH_WORKSHEET_CHARACTER_ASSETS[assetIndex % MATH_WORKSHEET_CHARACTER_ASSETS.length].name;
  const pitch = 6.5, size = 5.5;
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1)
    c.image(asset, x + column * pitch, y + row * pitch, size, size);
  c.caption(`${rows} 行，每行 ${columns} 个`, x, y + 26.5, 11, "chinese", INK.muted);
  c.text("一共", x + 42, y + 2, 14, "chinese", theme.accent);
  writingBox(c, x + 42, y + 13, WRITING.numberWidth, 14, theme);
  c.text("个", x + 69, y + 16, 14, "chinese", INK.dark);
}

function drawMatchItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "matchLine") return;
  const data = item.data;
  const { x, y, width } = g.body;
  const from = c.nodes.length, height = WRITING.activityHeight, center = y + height / 2;
  c.roundRect(x, y, 41, height, 3, INK.white, theme.line, 0.5);
  c.roundRect(x + width - 24, y, 22, height, 3, theme.fill, theme.line, 0.5);
  tag(c, from, { purpose: "diagram" });
  writingCircle(c, x + 49, center, 3, theme);
  writingCircle(c, x + width - 31, center, 3, theme);
  const textY = y + (height - textHeight(c)) / 2;
  c.text(data.expressions[0], x + 6, textY, BODY, "numericBold", INK.dark);
  c.text(String(data.right[g.index]), x + width - 13, textY, BODY, "numericBold", theme.accent, "center");
}

function drawCircleOutItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  if (item.data.kind !== "circleOut") return;
  const { x, y, width } = g.body;
  const from = c.nodes.length, height = WRITING.activityHeight;
  c.roundRect(x, y, width - 2, height, 3, INK.white, theme.line, 0.5);
  tag(c, from, { purpose: "diagram" });
  writingCircle(c, x + 7, y + height / 2, 3.5, theme);
  c.text(item.data.expressions[0], x + 16, y + (height - textHeight(c)) / 2, BODY, "numericBold", INK.dark);
}

function drawItem(c: Canvas, item: DrillItem, g: ItemGeometry, theme: Theme) {
  switch (item.data.kind) {
    case "vertical": return drawVerticalItem(c, item, g, theme);
    case "fill": return drawFillItem(c, item, g, theme);
    case "compare": return drawCompareItem(c, item, g, theme);
    case "operator": return drawOperatorItem(c, item, g, theme);
    case "spotError": return drawSpotErrorItem(c, item, g, theme);
    case "checkBack": return drawCheckBackItem(c, item, g, theme);
    case "manyWays": return drawManyWaysItem(c, item, g, theme);
    case "makeTen": return drawMakeTenItem(c, item, g, theme);
    case "split": return drawSplitItem(c, item, g, theme);
    case "numberLine": return drawNumberLineItem(c, item, g, theme);
    case "inOut": return drawInOutItem(c, item, g, theme);
    case "word": return drawWordItem(c, item, g, theme);
    case "numberTower": return drawTowerItem(c, item, g, theme);
    case "dotCount": return drawDotCountItem(c, item, g, theme);
    case "matchLine": return drawMatchItem(c, item, g, theme);
    case "circleOut": return drawCircleOutItem(c, item, g, theme);
    default: return drawOralItem(c, item, g, theme);
  }
}

function contains(region: Rect, bounds: Rect, tolerance = 0.3): boolean {
  return bounds.x >= region.x - tolerance && bounds.y >= region.y - tolerance
    && bounds.x + bounds.width <= region.x + region.width + tolerance
    && bounds.y + bounds.height <= region.y + region.height + tolerance;
}

function drawBlock(c: Canvas, block: DrillBlock, g: BlockGeometry, theme: Theme, ordinal: number, firstNumber: number) {
  c.roundRect(PAGE.left, g.top, PAGE.width, g.height, 4, INK.white, theme.line, 0.5);
  c.roundRect(PAGE.left + 0.5, g.top + 0.5, PAGE.width - 1, 10, 3.5, theme.fill, undefined, 0);
  let from = c.nodes.length;
  c.circle(g.title.x + 3.5, g.title.y + 3.5, 3.3, theme.accent);
  c.caption(String(ordinal), g.title.x + 3.5, g.title.y + 0.2, 11, "numericBold", INK.white, "center");
  const titleText = block.title.replace(/^[一二三四五]、/, "");
  const titleWidth = c.text(titleText, g.title.x + 10, g.title.y, 16, "chineseBold", theme.accent);
  const parentHint = `家长方法：${BLOCK_LAYOUT[block.kind].parentHint}`;
  const hintX = g.title.x + 10 + titleWidth + 5;
  if (hintX + c.width(parentHint, "chinese", 10) > g.title.x + g.title.width - 3)
    throw new Error(`${block.kind} 的家长引导超出标题区域`);
  c.caption(parentHint, hintX, g.title.y + 2, 10, "chinese", INK.muted);
  tag(c, from, { region: "title" });
  from = c.nodes.length;
  c.caption(block.instruction, g.instruction.x, g.instruction.y, 11, "chinese", INK.muted);
  tag(c, from, { region: "instruction" });
  block.items.forEach((item, index) => {
    const column = index % block.columns, row = Math.floor(index / block.columns);
    const cell = {
      x: g.content.x + column * (g.columnWidth + PAGE.columnGap),
      y: g.contentTop + row * g.rowHeight,
      width: g.columnWidth, height: g.rowHeight - g.itemGap,
    };
    const bodyHeight = itemHeight(item, c.fonts);
    const itemGeometry: ItemGeometry = {
      ...cell, number: firstNumber + index, index,
      body: { x: cell.x + NUMBER_WIDTH, y: cell.y + Math.max(0, (cell.height - bodyHeight) / 2), width: cell.width - NUMBER_WIDTH, height: bodyHeight },
    };
    from = c.nodes.length;
    c.caption(String(itemGeometry.number).padStart(2, "0"), cell.x, itemGeometry.body.y + 0.5, 11, "numericBold", theme.accent);
    tag(c, from, { purpose: "item-number" });
    drawItem(c, item, itemGeometry, theme);
    tag(c, from, { region: "content", itemId: item.id, itemNumber: itemGeometry.number });
    for (const node of c.nodes.slice(from)) if (!contains(cell, nodeBounds(node)))
      throw new Error(`${block.kind} 第 ${itemGeometry.number} 题超出作答区域`);
  });
  for (const node of c.nodes) if (node.region) {
    const region = node.region === "title" ? g.title : node.region === "instruction" ? g.instruction : g.content;
    if (!contains(region, nodeBounds(node))) throw new Error(`${block.kind} 的${node.region}超出预留区域`);
  }
}

export function layoutDrillSheet(sheet: DrillSheet, fonts: WorksheetFonts, headerSeed = 0): readonly [WorksheetPage, WorksheetPage] {
  const theme = THEMES[(sheet.sheet - 1) % THEMES.length];
  let itemNumber = 1, blockNumber = 1;
  const pages = sheet.pages.map((page) => {
    const header = new Canvas(fonts), footer = new Canvas(fonts);
    drawHeader(header, sheet.sheet, page, theme, headerSeed);
    const geometry = allocateGeometry(page.blocks, fonts);
    const tasks: WorksheetTaskRegion[] = page.blocks.map((block, index) => {
      const c = new Canvas(fonts), g = geometry[index];
      drawBlock(c, block, g, theme, blockNumber++, itemNumber);
      itemNumber += block.items.length;
      return { id: block.id, skill: "structure", kind: block.kind, x: PAGE.left, y: g.top, width: PAGE.width, height: g.height, nodes: c.nodes };
    });
    footer.caption("完成一面，涂亮两颗星！", 14, 279, 10, "chinese", INK.muted);
    // 按整册页序编号，单份换题后编号不变。
    const pageNumber = (sheet.sheet - 1) * 2 + (page.side === "front" ? 1 : 2);
    drawPageNumber(footer, pageNumber, theme);
    star(footer, 175, 276, 8, theme);
    star(footer, 187, 276, 8, theme);
    const result: WorksheetPage = {
      id: `${sheet.id}-${page.side}`, worksheetId: sheet.id, side: page.side, day: sheet.sheet,
      title: page.title, header: header.nodes, tasks, footer: footer.nodes,
    };
    assertWorksheetPageBounds(result);
    assertWorksheetContentSpacing(result);
    return result;
  });
  return [pages[0], pages[1]];
}

export function layoutDrillPlan(sheets: readonly DrillSheet[], fonts: WorksheetFonts, headerSeed = 0) {
  return { width: 210 as const, height: 297 as const, pages: sheets.flatMap((sheet) => layoutDrillSheet(sheet, fonts, headerSeed)) };
}
