import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { CALCULATION_KINDS, DRILL_SEQUENCE, GRAPHIC_KINDS, ITEMS_PER_SHEET, THINKING_KINDS } from "../lib/tools/drill/blocks";
import { generateDrillPlan, regenerateDrillSheet, sheetItemCount } from "../lib/tools/drill/generate";
import { layoutDrillSheet } from "../lib/tools/drill/layout";
import { createWordItem, WORD_TEMPLATE_COUNT } from "../lib/tools/drill/word";
import { drawWordScene } from "../lib/tools/drill/word-scene";
import { getMathHeaderCharacters, MATH_WORKSHEET_HEADER_ASSETS } from "../lib/tools/math-picture-assets";
import { Canvas } from "../lib/tools/number-sense/drawing";
import { assertWorksheetContentSpacing, assertWorksheetPageBounds, nodeBounds, pageNodes } from "../lib/tools/number-sense/layout";
import { testWorksheetFonts } from "./number-sense-test-fonts";

/**
 * 会印到练习纸上的文案可能来自这些文件，注释里的中文同样受字体约束。
 * 页面界面（工作区）用系统字体渲染，不在此列。
 */
const SOURCE_FILES = [
  ...fs.readdirSync("lib/tools/drill").filter((name) => name.endsWith(".ts")).map((name) => `lib/tools/drill/${name}`),
  "lib/tools/number-sense/drawing.ts",
  "lib/tools/number-sense/layout.ts",
  "lib/tools/math-pdf.ts",
  "components/number-sense-paper.tsx",
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

  it("每份 16 个编号小题、四个大题，两面节点在纸面与题块范围内", () => {
    const fonts = testWorksheetFonts();
    for (const sheet of generateDrillPlan(20260831, { count: 30 }).sheets) {
      expect(sheetItemCount(sheet), `第 ${sheet.sheet} 份题量`).toBe(ITEMS_PER_SHEET);
      expect(sheetItemCount(sheet)).toBe(16);
      const blocks = sheet.pages.flatMap((page) => page.blocks);
      expect(blocks).toHaveLength(4);
      expect(blocks.filter((block) => block.kind === "word").flatMap((block) => block.items)).toHaveLength(1);
      expect(blocks.filter((block) => GRAPHIC_KINDS.includes(block.kind))).toHaveLength(1);
      for (const block of blocks)
        expect(block.items.length).toBeLessThanOrEqual(block.kind === "word" ? 1 : GRAPHIC_KINDS.includes(block.kind) ? 4 : 6);
      const activity = blocks.find((block) => GRAPHIC_KINDS.includes(block.kind))!;
      expect(activity.items).toHaveLength(4);
      for (const item of activity.items) {
        if (item.data.kind === "matchLine" || item.data.kind === "circleOut") expect(item.data.expressions).toHaveLength(1);
        if (item.data.kind === "numberTower") expect(item.data.cells.filter((value) => value === null)).toHaveLength(1);
      }
      const numbers: number[] = [];
      for (const page of layoutDrillSheet(sheet, fonts)) {
        assertWorksheetPageBounds(page);
        expect(page.tasks).toHaveLength(2);
        numbers.push(...pageNodes(page).flatMap((node) => node.purpose === "item-number" ? [node.itemNumber!] : []));
        for (const node of pageNodes(page)) if (node.kind === "text")
          expect(node.size, node.text).toBeGreaterThanOrEqual(node.role === "caption" ? 10 : 14);
        for (const task of page.tasks) expect(task.nodes.length, `第 ${sheet.sheet} 份空题块`).toBeGreaterThan(0);
        for (const task of page.tasks) {
          const titleTexts = task.nodes.filter((node) => node.kind === "text").filter((node) => node.region === "title");
          expect(titleTexts.map((node) => node.text).join(""), `${task.kind} 缺少家长方法说明`).toContain("家长方法：");
          const hint = titleTexts.find((node) => node.text.startsWith("家长方法："));
          expect(hint?.size, `${task.kind} 家长引导字号`).toBe(10);
        }
        for (const task of page.tasks) if (task.kind === "numberTower" || task.kind === "dotCount")
          expect(task.nodes.filter((node) => node.purpose === "writing"), "每个图形编号只留一个作答空格").toHaveLength(4);
      }
      expect(numbers).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    }
  }, 180000);

  it("同一块里的文字与图标不会互相压住", () => {
    const fonts = testWorksheetFonts();
    const problems: string[] = [];
    for (const sheet of generateDrillPlan(20260831, { count: 30 }).sheets) {
      for (const page of layoutDrillSheet(sheet, fonts)) {
        for (const task of page.tasks) {
          const texts = task.nodes.filter((node) => node.kind === "text").filter((node) => node.region === "content");
          const icons = task.nodes.filter((node) => node.kind === "image").filter((node) => node.region === "content");
          const overlap = (
            a: { x: number; y: number; width: number; height: number },
            b: { x: number; y: number; width: number; height: number },
          ) => a.x < b.x + b.width - 0.3 && b.x < a.x + a.width - 0.3
            && a.y < b.y + b.height - 0.3 && b.y < a.y + a.height - 0.3;
          for (let i = 0; i < texts.length; i += 1) for (let j = i + 1; j < texts.length; j += 1) {
            if (overlap(nodeBounds(texts[i]), nodeBounds(texts[j])))
              problems.push(`第 ${sheet.sheet} 份 ${task.kind}：「${texts[i].text}」压住「${texts[j].text}」`);
          }
          for (const icon of icons) for (const text of texts) {
            if (overlap(nodeBounds(icon), nodeBounds(text)))
              problems.push(`第 ${sheet.sheet} 份 ${task.kind}：图标压住「${text.text}」`);
          }
          for (const line of task.nodes.filter((node) => node.purpose === "writing")) {
            const bounds = nodeBounds(line);
            const reserved = line.kind === "line" ? line.writingHeight ?? 0 : 0;
            const ink = { ...bounds, y: bounds.y - reserved - 0.3, height: Math.max(0.6, bounds.height + reserved) };
            for (const text of [...texts, ...icons]) if (overlap(ink, nodeBounds(text)))
              problems.push(`第 ${sheet.sheet} 份 ${task.kind}：作答区遮挡题目`);
          }
          const titles = task.nodes.filter((node) => node.region === "title");
          const instructions = task.nodes.filter((node) => node.region === "instruction");
          for (const title of titles) for (const instruction of instructions)
            expect(overlap(nodeBounds(title), nodeBounds(instruction)), `${task.kind} 标题压住说明`).toBe(false);
          for (const heading of [...titles, ...instructions]) for (const text of [...texts, ...icons])
            expect(overlap(nodeBounds(heading), nodeBounds(text)), `${task.kind} 题目压住标题或说明`).toBe(false);
        }
      }
    }
    expect([...new Set(problems)].slice(0, 20), "重叠").toEqual([]);
  }, 180000);

  it("所有题型都放大书写区，横线上方留足高度且作答区互不挤占", () => {
    const fonts = testWorksheetFonts();
    const covered = new Set<string>();
    for (const sheet of generateDrillPlan(20260831, { count: 31 }).sheets) {
      for (const page of layoutDrillSheet(sheet, fonts)) for (const task of page.tasks) {
        const writing = task.nodes.filter((node) => node.purpose === "writing");
        expect(writing.length, `${task.kind} 缺少作答区`).toBeGreaterThan(0);
        covered.add(task.kind);
        const areas = writing.map((node) => {
          const { x, y, width, height } = nodeBounds(node);
          if (node.kind === "line") {
            expect(node.writingHeight, task.kind).toBeGreaterThanOrEqual(13);
            expect(width, task.kind).toBeGreaterThanOrEqual(24 - 0.01);
          } else if (node.kind === "circle") {
            expect(height, task.kind).toBeGreaterThanOrEqual(6);
          } else {
            expect(height, task.kind).toBeGreaterThanOrEqual(12);
            expect(width, task.kind).toBeGreaterThanOrEqual(13);
            if (task.kind === "vertical") {
              expect(height).toBeGreaterThanOrEqual(13);
              expect(width).toBeGreaterThanOrEqual(34);
            }
            if (task.kind === "inOut") expect(height).toBeGreaterThanOrEqual(14);
            if (task.kind === "numberLine" || task.kind === "dotCount") expect(width).toBeGreaterThanOrEqual(24);
          }
          const reserved = node.kind === "line" ? node.writingHeight! : 0;
          return { x, y: y - reserved, width, height: height + reserved };
        });
        for (let i = 0; i < areas.length; i += 1) for (let j = i + 1; j < areas.length; j += 1) {
          const a = areas[i], b = areas[j];
          expect(a.x < b.x + b.width - 0.2 && b.x < a.x + a.width - 0.2
            && a.y < b.y + b.height - 0.2 && b.y < a.y + a.height - 0.2,
          `第 ${sheet.sheet} 份 ${task.kind} 作答区重叠`).toBe(false);
        }
      }
    }
    expect([...covered].sort()).toEqual([...DRILL_SEQUENCE, "word"].sort());
  });

  it("不同种子与换题均保留分面结构，一个月覆盖全部题型", () => {
    const fonts = testWorksheetFonts();
    for (const seed of [7, 99, 20260831]) {
      const plan = generateDrillPlan(seed, { count: 31 });
      const kinds = new Set<string>();
      for (const sheet of plan.sheets) {
        const [front, back] = sheet.pages;
        expect(CALCULATION_KINDS).toContain(front.blocks[0].kind);
        expect(GRAPHIC_KINDS).toContain(front.blocks[1].kind);
        expect(THINKING_KINDS).toContain(back.blocks[0].kind);
        expect(back.blocks[1].kind).toBe("word");
        const replacement = regenerateDrillSheet(plan, sheet.sheet, seed + 7919);
        expect(replacement.pages.map((page) => page.blocks.map((block) => block.kind)))
          .toEqual(sheet.pages.map((page) => page.blocks.map((block) => block.kind)));
        for (const page of [...layoutDrillSheet(sheet, fonts), ...layoutDrillSheet(replacement, fonts)]) {
          assertWorksheetContentSpacing(page);
          for (const task of page.tasks) kinds.add(task.kind);
        }
      }
      expect([...kinds].sort()).toEqual([...DRILL_SEQUENCE, "word"].sort());
    }
  });

  it("每面一个角色，31 份的 62 面不重复，配色仍按四个主题轮换", () => {
    const fonts = testWorksheetFonts();
    const plan = generateDrillPlan(7, { count: 31 });
    const pages = plan.sheets.flatMap((sheet) => layoutDrillSheet(sheet, fonts, plan.seed));
    const assets = pages.map((page) => {
      const characters = page.header.filter((node) => node.kind === "image");
      expect(characters).toHaveLength(1);
      return characters[0].asset;
    });
    expect(new Set(assets).size).toBe(62);
    const starts = MATH_WORKSHEET_HEADER_ASSETS.map((_, seed) => getMathHeaderCharacters(1, seed)[0]);
    expect(new Set(starts)).toEqual(new Set(MATH_WORKSHEET_HEADER_ASSETS.map((asset) => asset.name)));
    expect(getMathHeaderCharacters(1, 8)).not.toEqual(getMathHeaderCharacters(1, plan.seed));
    for (const asset of assets) {
      const source = MATH_WORKSHEET_HEADER_ASSETS.find((entry) => entry.name === asset);
      expect(source).toBeDefined();
      expect(fs.existsSync(`public${source!.src}`)).toBe(true);
    }
    const titles = pages.filter((page) => page.side === "front").map((page) =>
      page.header.filter((node) => node.kind === "text").find((node) => node.size === 21)?.text);
    expect(new Set(titles.slice(0, 4)).size).toBe(4);
    expect(titles[4]).toBe(titles[0]);
    const replacement = regenerateDrillSheet(plan, 1, 19);
    expect(layoutDrillSheet(replacement, fonts, plan.seed).map((page) => page.header.filter((node) => node.kind === "image")))
      .toEqual(pages.slice(0, 2).map((page) => page.header.filter((node) => node.kind === "image")));
  });

  it("全部故事的最小、最大取数保留三行题干与两条作答线，插图随情景变化", () => {
    const fonts = testWorksheetFonts();
    const base = generateDrillPlan(7, { count: 2 }).sheets[1];
    const scenes = new Set<string>();
    for (let story = 0; story < WORD_TEMPLATE_COUNT; story += 1) for (const value of [0, 0.99999]) {
      const item = createWordItem(() => value, "long-story", story);
      if (item.data.kind !== "word") throw new Error("题型错误");
      const sheet = {
        ...base,
        pages: [base.pages[0], { ...base.pages[1], blocks: base.pages[1].blocks.map((block) =>
          block.kind === "word" ? { ...block, items: [item] } : block) }] as typeof base.pages,
      };
      const page = layoutDrillSheet(sheet, fonts)[1];
      assertWorksheetContentSpacing(page);
      const nodes = page.tasks[1].nodes.filter((node) => node.itemId === item.id);
      expect(nodes.filter((node) => node.purpose === "writing")).toHaveLength(2);
      expect(nodes.filter((node) => node.kind === "text").filter((node) => node.size === 16).map((node) => node.text).join("").replace(/\s+/g, ""))
        .toBe(item.data.text.replace(/\s+/g, ""));
      expect(nodes.some((node) => node.kind === "image" && node.asset === "apple")).toBe(item.data.scene === "orchard");
      expect(nodes.filter((node) => node.purpose === "diagram").length).toBeGreaterThan(5);
      scenes.add(item.data.scene);
    }
    expect(scenes.size).toBe(40);
  });

  it("40 幅情景图的实际构图不同，不靠标题、颜色或摆放位置去重", () => {
    const fonts = testWorksheetFonts();
    const drawings = new Set<string>();
    for (let story = 0; story < WORD_TEMPLATE_COUNT; story += 1) {
      const item = createWordItem(() => 0.5, `scene-${story}`, story);
      if (item.data.kind !== "word") throw new Error("题型错误");
      const c = new Canvas(fonts);
      drawWordScene(c, item.data.scene, 0, 0, { fill: "#FFFFFF", accent: "#555555", line: "#AAAAAA" });
      expect(c.nodes.length, item.data.scene).toBeGreaterThan(5);
      expect(c.nodes.every((node) => node.purpose === "diagram" && node.kind !== "text")).toBe(true);
      for (const node of c.nodes) {
        const bounds = nodeBounds(node);
        expect(bounds.x, item.data.scene).toBeGreaterThanOrEqual(0);
        expect(bounds.y, item.data.scene).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, item.data.scene).toBeLessThanOrEqual(32);
        expect(bounds.y + bounds.height, item.data.scene).toBeLessThanOrEqual(32);
      }
      // 排除统一背景和配色，仅比较图元种类、几何、路径及素材。
      drawings.add(JSON.stringify(c.nodes.slice(1).map((node) => {
        const { x, y, width, height } = nodeBounds(node);
        return {
          kind: node.kind, bounds: { x, y, width, height },
          path: node.kind === "path" ? node.d : undefined,
          asset: node.kind === "image" ? node.asset : undefined,
          line: node.kind === "line" ? [node.x1, node.y1, node.x2, node.y2] : undefined,
        };
      })));
    }
    expect(drawings.size).toBe(40);
  });

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
