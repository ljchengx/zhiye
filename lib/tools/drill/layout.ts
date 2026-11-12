import { Canvas, INK } from "../number-sense/drawing";
import type { WorksheetFonts } from "../number-sense/fonts";
import type { WorksheetPage, WorksheetTaskRegion } from "../number-sense/layout";
import { chainText } from "./chain";
import { checkBackText, spotErrorText } from "./checks";
import { fillText } from "./fill";
import { compareRightText, compareText } from "./relations";
import { makeTenText, manyWaysText, splitText } from "./strategies";
import { oralText } from "./oral";
import { verticalLines } from "./vertical";
import type { DrillBlock, DrillItem, DrillSheet } from "./types";

const CONTENT_LEFT = 14;
const CONTENT_WIDTH = 182;
const CONTENT_TOP = 50;
/** 题块之间的间距（毫米）。 */
const BLOCK_GAP = 6;
/** 块标题加说明占的高度。 */
const BLOCK_HEAD = 13;

/** 算式加一条得数横线，加减题与连加连减共用。 */
function drawExpression(c: Canvas, text: string, x: number, y: number, lineWidth = 20) {
  c.text(text, x, y, 14, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", 14);
  c.line(x + width + 2, y + 5, x + width + lineWidth, y + 5, INK.line, 0.4);
}

function drawOralItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind === "oral") drawExpression(c, oralText(item.data), x, y);
  else if (item.data.kind === "chain") drawExpression(c, chainText(item.data), x, y, 16);
}

/** 比大小：左右两个算式中间留一个填符号的圈。 */
function drawCompareItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "compare") return;
  const left = compareText(item.data), right = compareRightText(item.data);
  c.text(left, x, y, 14, "numericBold", INK.dark);
  const width = c.width(left, "numericBold", 14);
  c.circle(x + width + 5.5, y + 2.5, 3.2, INK.white, INK.dark, 0.4);
  c.text(right, x + width + 12, y, 14, "numericBold", INK.dark);
}

/** 填符号：符号的位置留一条短横线。 */
function drawOperatorItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "operator") return;
  const { a, b, result } = item.data;
  const head = String(a);
  c.text(head, x, y, 14, "numericBold", INK.dark);
  const cursor = x + c.width(head, "numericBold", 14) + 3;
  c.line(cursor, y + 5, cursor + 6, y + 5, INK.line, 0.4);
  c.text(`${b} = ${result}`, cursor + 9, y, 14, "numericBold", INK.dark);
}

/** 找错改正：印出错式，下面留一条改正线。 */
function drawSpotErrorItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "spotError") return;
  c.text(spotErrorText(item.data), x, y, 14, "numericBold", INK.dark);
  c.caption("改：", x, y + 9.5, 11, "chinese", INK.muted);
  c.line(x + 10, y + 14, x + 36, y + 14, INK.line, 0.4);
}

/** 算完检查：上一行给出算式与结果，下一行填另一个算式的结果。 */
function drawCheckBackItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "checkBack") return;
  const { given, check } = checkBackText(item.data);
  c.text(given, x, y, 14, "numericBold", INK.dark);
  c.text(check, x, y + 7, 14, "numericBold", INK.dark);
  const width = c.width(check, "numericBold", 14);
  c.line(x + width + 2, y + 12, x + width + 16, y + 12, INK.line, 0.4);
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
      c.line(cursor, y + 5, cursor + 14, y + 5, INK.line, 0.4);
      cursor += 18;
      return;
    }
    c.text(part, cursor, y, 14, "numericBold", INK.dark);
    cursor += c.width(part, "numericBold", 14) + 2;
  });
}

/** 列式：两行数字右对齐，符号在左下，横线下方留答题区。 */
function drawVerticalItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "vertical") return;
  const { operator, top, bottom } = verticalLines(item.data);
  const right = x + 32;
  c.text(top, right, y, 16, "numericBold", INK.dark, "right");
  c.text(operator, x + 2, y + 9, 16, "numericBold", INK.dark);
  c.text(bottom, right, y + 9, 16, "numericBold", INK.dark, "right");
  c.line(x + 2, y + 17.5, right + 1, y + 17.5, INK.dark, 0.5);
}

/** 一题多解：先写结果，再留两行写不同的算法。 */
function drawManyWaysItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "manyWays") return;
  const text = manyWaysText(item.data);
  c.text(text, x, y, 14, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", 14);
  c.line(x + width + 3, y + 5, x + width + 26, y + 5, INK.line, 0.4);
  c.line(x + 2, y + 13, x + 56, y + 13, INK.line, 0.4);
}

/** 凑整再算：印出补成整十的算式，填减少后的那个加数。 */
function drawMakeTenItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "makeTen") return;
  const text = makeTenText(item.data);
  c.text(text, x, y, 14, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", 14);
  c.line(x + width + 3, y + 5, x + width + 18, y + 5, INK.line, 0.4);
}

/** 数的拆分：一个数后面留两处空。 */
function drawSplitItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "split") return;
  const text = splitText(item.data);
  c.text(text, x, y, 14, "numericBold", INK.dark);
  const width = c.width(text, "numericBold", 14);
  c.line(x + width + 2, y + 5, x + width + 15, y + 5, INK.line, 0.4);
  c.text("+", x + width + 18, y, 14, "numericBold", INK.dark);
  c.line(x + width + 24, y + 5, x + width + 37, y + 5, INK.line, 0.4);
}

/** 数线移动：一条数线，起点标出，两段箭头，终点留空。 */
function drawNumberLineItem(c: Canvas, item: DrillItem, x: number, y: number) {
  if (item.data.kind !== "numberLine") return;
  const { start, jumps } = item.data;
  const left = x + 4, right = x + 84;
  const first = left + (right - left) * 0.42;
  const second = left + (right - left) * 0.72;
  c.line(left, y + 9, right, y + 9, INK.dark, 0.5);
  c.circle(left, y + 9, 1.5, INK.dark);
  c.text(String(start), left, y + 4, 14, "numericBold", INK.dark, "center");
  c.arrow(left + 3, y + 14, first);
  c.arrow(first + 3, y + 14, second);
  c.text(`+${jumps[0]}`, (left + first) / 2, y + 11, 14, "numericBold", INK.muted, "center");
  c.text(`+${jumps[1]}`, (first + second) / 2, y + 11, 14, "numericBold", INK.muted, "center");
  c.line(first + 3, y + 20, right, y + 20, INK.line, 0.4);
}

/** 画一个题块，给出它的高度（毫米）。 */
function drawBlock(c: Canvas, block: DrillBlock, top: number): number {
  c.text(block.title, CONTENT_LEFT + 2, top, 14, "chineseBold", INK.dark);
  c.caption(block.instruction, CONTENT_LEFT + 2, top + 6.5, 11, "chinese", INK.muted);
  const itemsTop = top + BLOCK_HEAD;
  const columnWidth = CONTENT_WIDTH / block.columns;
  block.items.forEach((item, index) => {
    const column = index % block.columns;
    const row = Math.floor(index / block.columns);
    const x = CONTENT_LEFT + column * columnWidth;
    const y = itemsTop + row * block.rowHeight;
    if (block.kind === "vertical") drawVerticalItem(c, item, x, y);
    else if (block.kind === "fill") drawFillItem(c, item, x, y);
    else if (block.kind === "compare") drawCompareItem(c, item, x, y);
    else if (block.kind === "operator") drawOperatorItem(c, item, x, y);
    else if (block.kind === "spotError") drawSpotErrorItem(c, item, x, y);
    else if (block.kind === "checkBack") drawCheckBackItem(c, item, x, y);
    else if (block.kind === "manyWays") drawManyWaysItem(c, item, x, y);
    else if (block.kind === "makeTen") drawMakeTenItem(c, item, x, y);
    else if (block.kind === "split") drawSplitItem(c, item, x, y);
    else if (block.kind === "numberLine") drawNumberLineItem(c, item, x, y);
    else drawOralItem(c, item, x, y);
  });
  return BLOCK_HEAD + Math.ceil(block.items.length / block.columns) * block.rowHeight;
}

export function layoutDrillSheet(sheet: DrillSheet, fonts: WorksheetFonts): readonly [WorksheetPage, WorksheetPage] {
  const pages = sheet.pages.map((page) => {
    const header = new Canvas(fonts), footer = new Canvas(fonts);
    header.rect(12, 12, 186, 9, "#F8C25C");
    for (let x = 15; x < 198; x += 8) header.circle(x, 21, 2.6, "#F8C25C");
    header.caption("计算练习", 17, 12.3, 12, "chineseBold", INK.dark);
    header.rect(155, 12, 43, 9, INK.leaf);
    header.caption("四则计算", 176.5, 12.3, 12, "chineseBold", INK.white, "center");
    header.text(page.title, 105, 30, 24, "chineseBold", "#D9752C", "center");

    const regions: WorksheetTaskRegion[] = [];
    let y = CONTENT_TOP;
    page.blocks.forEach((block) => {
      const canvas = new Canvas(fonts);
      const height = drawBlock(canvas, block, y);
      regions.push({
        id: block.id,
        // 版面已不再按题型分组，这里沿用占位写法，换掉类型时移除。
        skill: "structure",
        kind: block.kind as never,
        x: CONTENT_LEFT, y, width: CONTENT_WIDTH, height,
        nodes: canvas.nodes,
      });
      y += height + BLOCK_GAP;
    });

    footer.caption(`第 ${sheet.sheet} 份 · ${page.side === "front" ? "正面" : "反面"}`, 14, 279.5, 10, "chinese", INK.muted);
    footer.caption("看清符号 · 写清得数", 196, 279.5, 10, "chinese", INK.muted, "right");

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
