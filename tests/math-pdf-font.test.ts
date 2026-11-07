import fs from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { describe, expect, it } from "vitest";
import { generateWorksheetPlan } from "../lib/tools/math-worksheet";
import { SCENE_KINDS } from "../lib/tools/number-sense/curriculum";
import { worksheetImageSource, type WorksheetImageAsset } from "../lib/tools/number-sense/drawing";
import {
  assertWorksheetPageBounds,
  layoutWorksheetDay,
  layoutWorksheetDocument,
  nodeBounds,
  pageNodes,
} from "../lib/tools/number-sense/layout";
import { testWorksheetFonts } from "./number-sense-test-fonts";

describe("共享场景练习纸排版与字体", () => {
  it("全部活动的重访版都改变实际纸面，两个版本均能完整排版", () => {
    const fonts = testWorksheetFonts();
    const plan = generateWorksheetPlan(20260831);
    const seen = new Set<string>();
    for (const day of plan.days) for (const [side, page] of day.pages.entries()) {
      if (seen.has(page.activity.problem.kind)) continue;
      seen.add(page.activity.problem.kind);
      const render = (edition: 0 | 1) => {
        const pages = day.pages.map((item) => ({ ...item, activity: { ...item.activity, edition } })) as unknown as typeof day.pages;
        const document = layoutWorksheetDay({ ...day, pages }, fonts)[side];
        return document.tasks[0].nodes;
      };
      expect(render(0)).not.toEqual(render(1));
      const texts = (edition: 0 | 1) => new Set(render(edition)
        .filter((node) => node.kind === "text")
        .map((node) => (node as { text: string }).text));
      const first = texts(0), second = texts(1);
      let changed = 0;
      for (const item of first) if (!second.has(item)) changed += 1;
      for (const item of second) if (!first.has(item)) changed += 1;
      if (["market", "compensation", "hidden", "parking"].includes(page.activity.problem.kind))
        expect(changed, `${page.activity.problem.kind} 两版纸面差异`).toBeGreaterThanOrEqual(3);
    }
    expect(seen.size).toBe(SCENE_KINDS.length);
  });
  it("常规、粗体子集覆盖数感模块、纸张组件、PDF 导出、worker 与工作区界面的中文文案", () => {
    const sources = fs.readdirSync("lib/tools/number-sense")
      .filter((name) => name.endsWith(".ts"))
      .map((name) => fs.readFileSync(`lib/tools/number-sense/${name}`, "utf8"));
    sources.push(
      fs.readFileSync("components/math-worksheet-workspace.tsx", "utf8"),
      fs.readFileSync("components/number-sense-paper.tsx", "utf8"),
      fs.readFileSync("lib/tools/math-pdf.ts", "utf8"),
    );
    for (const name of fs.readdirSync("workers").filter((item) => item.endsWith(".ts")))
      sources.push(fs.readFileSync(`workers/${name}`, "utf8"));
    for (const name of ["noto-sans-sc-math-subset.ttf", "noto-sans-sc-math-bold-subset.ttf"]) {
      const font = fontkit.create(fs.readFileSync(`public/fonts/${name}`));
      const missing = new Set<string>();
      for (const char of sources.join("").match(/[\u3400-\u9fff]/g) ?? [])
        if (!font.glyphForCodePoint(char.codePointAt(0)!).id) missing.add(char);
      expect([...missing].join("")).toBe("");
    }
  });

  it("100 套月份覆盖全部整页活动及两版操作、正反页序及边界，不输出验题数据", () => {
    const fonts = testWorksheetFonts();
    const kinds = new Set<string>();
    const assets = new Set<WorksheetImageAsset>();
    for (let seed = 0; seed < 100; seed += 1) {
      const plan = generateWorksheetPlan(seed);
      const document = layoutWorksheetDocument(plan.days, fonts);
      expect(document.pages).toHaveLength(60);
      for (const [index, page] of document.pages.entries()) {
        const day = plan.days[Math.floor(index / 2)];
        const source = day.pages[index % 2];
        expect(page.day).toBe(day.day);
        expect(page.side).toBe(source.side);
        expect(page.worksheetId).toBe(day.id);
        expect(page.title).toBe(source.activity.title);
        expect(page.tasks).toHaveLength(1);
        expect(page.tasks[0].id).toBe(source.activity.id);
        expect(page.tasks[0].kind).toBe(source.activity.problem.kind);
        kinds.add(page.tasks[0].kind);
        assertWorksheetPageBounds(page);
        const nodes = pageNodes(page);
        for (const node of nodes) {
          const bounds = nodeBounds(node);
          expect([bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)).toBe(true);
          if (node.kind === "text") {
            if (node.role === "caption") expect(node.size, node.text).toBeGreaterThanOrEqual(10);
            else expect(node.size, node.text).toBeGreaterThanOrEqual(14);
          }
          if (node.kind === "image") {
            expect(node.asset).not.toMatch(/^sprout/);
            assets.add(node.asset);
          }
        }
        const textNodes = nodes.filter((node) => node.kind === "text");
        // 每页必须有第 1 问：主指令落在页头下方 y≈52，不能只剩孤立的编号 2。
        expect(textNodes.some((node) => node.role === "body" && node.y >= 51 && node.y <= 66),
          `第 ${page.day} 份${page.side} 缺少第 1 问`).toBe(true);
        const paperText = textNodes.map((node) => node.text).join("");
        expect(paperText).toContain(page.title);
        expect(paperText).not.toMatch(/答案|解析|验题|小芽|跷跷板|袋子|轻重/);
        expect(paperText).not.toMatch(/[×÷]|[一二三四五六七八九]分之/);
        if (source.activity.problem.kind === "parking") {
          expect(paperText).toContain("还能停");
          expect(paperText).toContain(source.activity.edition ? "停好后谁多" : "挪好后谁多");
          expect(paperText).toContain(source.activity.edition ? "来新车会怎样" : "车一共变了吗");
          expect(paperText).not.toContain("=");
        }
        // 小字只能用于短图注/刻度，防止把完整指令标成 caption 绕过 14pt 约束。
        for (const node of textNodes)
          if (node.role === "caption" && node.y > 50 && node.y < 275)
            expect(node.text.length, `图注过长：${node.text}`).toBeLessThanOrEqual(10);
      }
      expect(JSON.stringify(document)).not.toMatch(/"validation"|"answer"|"solution"|"correctOptions"/);
    }
    expect([...kinds].sort()).toEqual([...SCENE_KINDS].sort());
    for (const asset of assets)
      expect(fs.existsSync(`public${worksheetImageSource(asset)}`), asset).toBe(true);
  }, 120000);

  it("实际月份页数严格等于份数的两倍，每份前后是不同场景", () => {
    const fonts = testWorksheetFonts();
    for (const count of [28, 29, 30, 31]) {
      const plan = generateWorksheetPlan(20260831, { count });
      const document = layoutWorksheetDocument(plan.days, fonts);
      expect(document.pages).toHaveLength(count * 2);
      for (let index = 0; index < document.pages.length; index += 2) {
        const front = document.pages[index], back = document.pages[index + 1];
        expect([front.side, back.side]).toEqual(["front", "back"]);
        expect(front.worksheetId).toBe(back.worksheetId);
        expect(front.tasks[0].id).not.toBe(back.tasks[0].id);
        expect(front.tasks[0].kind).not.toBe(back.tasks[0].kind);
      }
    }
  });
});
