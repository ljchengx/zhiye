import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { ITEMS_PER_SHEET } from "../lib/tools/drill/blocks";
import { generateDrillPlan, sheetItemCount } from "../lib/tools/drill/generate";
import { layoutDrillSheet } from "../lib/tools/drill/layout";
import { assertWorksheetPageBounds, pageNodes } from "../lib/tools/number-sense/layout";
import { testWorksheetFonts } from "./number-sense-test-fonts";

/** 纸面文案可能来自这些文件，注释里的中文同样受字体约束。 */
const SOURCE_FILES = [
  ...fs.readdirSync("lib/tools/drill").filter((name) => name.endsWith(".ts")).map((name) => `lib/tools/drill/${name}`),
  "lib/tools/number-sense/drawing.ts",
  "lib/tools/number-sense/layout.ts",
  "lib/tools/math-pdf.ts",
  "components/number-sense-paper.tsx",
  "components/math-worksheet-workspace.tsx",
  "workers/math-worksheet.worker.ts",
  "workers/math-pdf.worker.ts",
];

describe("计算练习册排版与字体", () => {
  it("源码里的中文都能在练习纸字体里找到", () => {
    const font = fontkit.create(fs.readFileSync("public/fonts/noto-sans-sc-math-subset.ttf"));
    const missing = new Set<string>();
    for (const file of SOURCE_FILES) {
      for (const char of fs.readFileSync(file, "utf8")) {
        const code = char.codePointAt(0)!;
        if (code >= 0x3400 && code <= 0x9fff && !font.hasGlyphForCodePoint(code)) missing.add(char);
      }
    }
    expect([...missing].sort(), "练习纸字体缺这些字").toEqual([]);
  });

  it("一个月里每份都是 25 题，两面节点都在纸面与题块范围内", () => {
    const fonts = testWorksheetFonts();
    for (const sheet of generateDrillPlan(20260831, { count: 30 }).sheets) {
      expect(sheetItemCount(sheet), `第 ${sheet.sheet} 份题量`).toBe(ITEMS_PER_SHEET);
      for (const page of layoutDrillSheet(sheet, fonts)) {
        assertWorksheetPageBounds(page);
        for (const node of pageNodes(page)) if (node.kind === "text")
          expect(node.size, node.text).toBeGreaterThanOrEqual(node.role === "caption" ? 10 : 14);
        for (const task of page.tasks) expect(task.nodes.length, `第 ${sheet.sheet} 份空题块`).toBeGreaterThan(0);
      }
    }
  }, 180000);

  it("排版模块不读取答案", () => {
    const source = fs.readFileSync("lib/tools/drill/layout.ts", "utf8");
    expect(source.includes(".answer"), "排版不应接触答案").toBe(false);
  });

  it("按年月生成时份数就是当月天数", () => {
    for (const month of [1, 2, 4, 12]) {
      const plan = generateDrillPlan(5, { year: 2026, month });
      const days = new Date(Date.UTC(2026, month, 0)).getUTCDate();
      expect(plan.totalSheets, `${month} 月`).toBe(days);
      expect(plan.sheets).toHaveLength(days);
    }
  });
});
