import { Canvas, INK } from "../number-sense/drawing";
import type { WorksheetFonts } from "../number-sense/fonts";
import type { WorksheetPage, WorksheetTaskRegion } from "../number-sense/layout";
import { oralText } from "./oral";
import type { DrillBlock, DrillSheet } from "./types";

const CONTENT_LEFT = 14;
const CONTENT_WIDTH = 182;
const CONTENT_TOP = 50;
/** 题块之间的间距（毫米）。 */
const BLOCK_GAP = 6;
/** 块标题加说明占的高度。 */
const BLOCK_HEAD = 13;

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
    const text = item.data.kind === "oral" ? oralText(item.data) : "";
    c.text(text, x, y, 14, "numericBold", INK.dark);
    const width = c.width(text, "numericBold", 14);
    // 得数写在横线上，横线留给手写。
    c.line(x + width + 2, y + 5, x + width + 20, y + 5, INK.line, 0.4);
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
