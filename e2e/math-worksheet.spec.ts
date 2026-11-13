import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
import { CALCULATION_KINDS, DRILL_SEQUENCE, GRAPHIC_KINDS, THINKING_KINDS } from "../lib/tools/drill/blocks";

async function openWorksheet(page: Page) {
  await page.goto("/kids/math-worksheet");
  await expect(page.getByTestId("math-worksheet-paper")).toBeVisible({
    timeout: 45000,
  });
  await expect(
    page.getByRole("button", { name: "本份换一套", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
}

async function side(page: Page, value: "front" | "back") {
  await page
    .getByRole("button", {
      name: value === "front" ? "正面" : "反面",
      exact: true,
    })
    .click();
}

async function sceneSnapshot(paper: Locator) {
  // 一页有多个题块；换题可能只改数字，比较所有题块的实际绘图，排除任务编号。
  return paper
    .locator("[data-task-id]")
    .evaluateAll((groups) => groups.map((group) => group.innerHTML).join("|"));
}

async function wordSceneSnapshot(paper: Locator) {
  return paper.locator('[data-type="word"] [data-purpose="diagram"]')
    .evaluateAll((nodes) => nodes.map((node) => node.outerHTML).join("|"));
}

async function downloadPdf(page: Page, range: "day" | "range" | "all") {
  await page.getByText("导出 PDF", { exact: true }).click();
  await page.getByLabel("导出范围", { exact: true }).selectOption(range);
  const downloaded = page.waitForEvent("download", { timeout: 45000 });
  await page.getByRole("button", { name: "下载 PDF", exact: true }).click();
  const download = await downloaded,
    path = await download.path();
  expect(path).toBeTruthy();
  const pdf = await PDFDocument.load(await readFile(path!));
  await expect(
    page.getByRole("button", { name: "打印本份", exact: true }),
  ).toBeEnabled();
  return { pdf, download };
}

test("正反面实时切换，背面换题同时更新整份，跳选不混页", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openWorksheet(page);
  const paper = page.getByTestId("math-worksheet-paper"),
    print = page.getByTestId("worksheet-print-pack");
  const front = await sceneSnapshot(paper);
  await expect(paper).toHaveAttribute("data-side", "front");
  // 每面固定两块，整份小题连续编号 01～16。
  const blocks = await paper.locator("[data-task-id]").count();
  expect(blocks).toBe(2);
  await expect(print.locator("svg")).toHaveCount(2);
  expect(await print.locator("[data-item-number]").evaluateAll((nodes) => nodes.map((node) => Number(node.textContent))))
    .toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
  expect(await sceneSnapshot(print.locator('svg[data-side="front"]'))).toBe(
    front,
  );
  await side(page, "back");
  await expect(paper).toHaveAttribute("data-side", "back");
  const back = await sceneSnapshot(paper);
  const originalScene = await wordSceneSnapshot(paper);
  expect(back).not.toBe(front);
  expect(await sceneSnapshot(print.locator('svg[data-side="back"]'))).toBe(back);
  await page.getByRole("button", { name: "本份换一套", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("第 1 份正反面已更新");
  await expect(paper).toHaveAttribute("data-side", "back");
  expect(await wordSceneSnapshot(paper), "换题必须换插图，不能只换数字").not.toBe(originalScene);
  const changedScene = await wordSceneSnapshot(paper);
  await page.getByRole("button", { name: "本份换一套", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("第 1 份正反面已更新");
  expect(await wordSceneSnapshot(paper), "连续换题也更换实际画面").not.toBe(changedScene);
  const newBack = await sceneSnapshot(paper);
  expect(newBack).not.toBe(back);
  await side(page, "front");
  expect(await sceneSnapshot(paper)).not.toBe(front);
  for (const value of ["front", "back"] as const) {
    await side(page, value);
    expect(await sceneSnapshot(print.locator(`svg[data-side="${value}"]`))).toBe(
      await sceneSnapshot(paper),
    );
  }
  await page.getByTestId("worksheet-day-30").click();
  await expect(paper).toHaveAttribute("data-day", "30");
  await expect(paper).toHaveAttribute("data-side", "back");
  expect(
    await print
      .locator("svg")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-day"))),
  ).toEqual(["30", "30"]);
  await page.getByTestId("worksheet-day-1").click();
  expect(await sceneSnapshot(paper)).toBe(newBack);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole("button", { name: "打印本份", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("共 2 页");
  expect(errors).toEqual([]);
});

test("PDF 本份、范围和整月保持正反页序，使用换题后的两面", async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        super(scriptURL, options);
        this.addEventListener("message", (event: MessageEvent) => {
          if (event.data?.type === "day-complete")
            (window as unknown as { regeneratedPages: unknown }).regeneratedPages = event.data.pages;
        });
      }
      postMessage(
        message: unknown,
        options: Transferable[] | StructuredSerializeOptions = [],
      ) {
        const request = message as {
          document?: {
            pages: {
              day: number;
              side: string;
              header: { text?: string }[];
              tasks: { nodes: { text?: string }[] }[];
            }[];
          };
        };
        if (request.document)
          (
            window as unknown as { exportedDocument: typeof request.document }
          ).exportedDocument = request.document;
        if (Array.isArray(options)) super.postMessage(message, options);
        else super.postMessage(message, options);
      }
    };
  });
  await openWorksheet(page);
  await page.getByTestId("worksheet-day-7").click();
  await side(page, "back");
  await page.getByRole("button", { name: "本份换一套", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("第 7 份正反面已更新");
  const regeneratedPages = await page.evaluate(
    () => (window as unknown as { regeneratedPages: unknown }).regeneratedPages,
  );
  expect(Array.isArray(regeneratedPages)).toBe(true);
  const current = await page
    .getByTestId("worksheet-print-pack")
    .locator("svg")
    .evaluateAll((pages) =>
      pages.map((p) =>
        [
          ...p.querySelectorAll('[data-region="header"] text, [data-testid="math-worksheet-question"] text'),
        ].map((n) => n.textContent),
      ),
    );
  for (const [range, count] of [
    ["day", 2],
    ["range", 20],
    ["all", 60],
  ] as const) {
    const { pdf } = await downloadPdf(page, range);
    expect(pdf.getPageCount()).toBe(count);
    for (const sheet of pdf.getPages()) {
      expect((sheet.getWidth() * 25.4) / 72).toBeCloseTo(210, 4);
      expect((sheet.getHeight() * 25.4) / 72).toBeCloseTo(297, 4);
    }
    const exported = await page.evaluate(
      () =>
        (
          window as unknown as {
            exportedDocument: {
              pages: {
                day: number;
                side: string;
                header: { text?: string }[];
                tasks: { nodes: { text?: string }[] }[];
              }[];
            };
          }
        ).exportedDocument,
    );
    expect(exported.pages).toHaveLength(count);
    // 连纯图形的变化也必须进入范围及整月导出，不能只比较可见文字。
    expect(exported.pages.filter((sheet) => sheet.day === 7)).toEqual(regeneratedPages);
    for (let i = 0; i < count; i += 2) {
      expect(exported.pages[i].side).toBe("front");
      expect(exported.pages[i + 1].side).toBe("back");
      expect(exported.pages[i].day).toBe(exported.pages[i + 1].day);
    }
    expect(
      exported.pages
        .filter((p) => p.day === 7)
        .map((p) =>
          [...p.header, ...p.tasks.flatMap((t) => t.nodes)]
            .flatMap((n) => (n.text === undefined ? [] : [n.text])),
        ),
    ).toEqual(current);
    expect(JSON.stringify(exported)).not.toMatch(
      /"validation"|"answer"|"solution"/,
    );
  }

  // 反向选份数时，界面页数、文件名和实际 PDF 必须一致。
  await page.getByText("导出 PDF", { exact: true }).click();
  await page.getByLabel("导出范围", { exact: true }).selectOption("range");
  await page.getByLabel("起始份数", { exact: true }).selectOption("10");
  await page.getByLabel("结束份数", { exact: true }).selectOption("3");
  await expect(page.getByText("共 16 页", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 PDF", exact: true }).click();
  const download = await downloadPromise;
  const pdf = await PDFDocument.load(await readFile((await download.path())!));
  expect(download.suggestedFilename()).toContain("第3至10份");
  expect(pdf.getPageCount()).toBe(16);
});

test("实际月份缩短时选择和导出范围自动收回到有效份数", async ({ page }) => {
  await openWorksheet(page);
  await page.getByTestId("worksheet-day-30").click();
  await side(page, "back");
  await page.getByText("更多设置", { exact: true }).click();
  await page.getByLabel("练习月份", { exact: true }).fill("2025-02");
  await page.getByRole("button", { name: "生成所选月份", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("28 份双面练习已准备好");
  await expect(page.getByTestId("math-worksheet-paper")).toHaveAttribute(
    "data-day",
    "28",
  );
  await expect(page.getByTestId("math-worksheet-paper")).toHaveAttribute(
    "data-side",
    "back",
  );
  await expect(page.getByTestId("worksheet-day-29")).toHaveCount(0);
  const { pdf } = await downloadPdf(page, "all");
  expect(pdf.getPageCount()).toBe(56);
});

test("导出取消后释放 Worker，可重新导出；资源失败重试保持当前练习", async ({
  page,
}) => {
  test.setTimeout(60000);
  await openWorksheet(page);
  const paperText = await page
    .getByTestId("math-worksheet-paper")
    .textContent();
  await page.getByText("导出 PDF", { exact: true }).click();
  await page.getByLabel("导出范围", { exact: true }).selectOption("all");
  await page.getByRole("button", { name: "下载 PDF", exact: true }).click();
  await page.getByRole("button", { name: /取消导出/ }).click();
  await expect(page.getByRole("status")).toHaveText("已取消导出");
  await page
    .context()
    .route("**/fonts/noto-sans-sc-math-subset.ttf*", (route) => route.abort());
  await page.getByText("导出 PDF", { exact: true }).click();
  await page.getByLabel("导出范围", { exact: true }).selectOption("day");
  await page.getByRole("button", { name: "下载 PDF", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "本份练习", exact: true })
      .getByRole("alert"),
  ).toBeVisible();
  expect(await page.getByTestId("math-worksheet-paper").textContent()).toBe(
    paperText,
  );
  await page.context().unroute("**/fonts/noto-sans-sc-math-subset.ttf*");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "重试", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("第1份");
  expect(await page.getByTestId("math-worksheet-paper").textContent()).toBe(
    paperText,
  );
  await expect(page.getByRole("status")).toHaveText("已导出 2 页练习");
});

test("放大预览中的导出失败提示可见，可直接重试", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorksheet(page);
  await page.getByRole("button", { name: "放大预览", exact: true }).click();
  await page
    .context()
    .route("**/fonts/noto-sans-sc-math-subset.ttf*", (route) => route.abort());
  await page.getByText("导出 PDF", { exact: true }).click();
  await page.getByRole("button", { name: "下载 PDF", exact: true }).click();
  const preview = page.getByRole("dialog", {
    name: "A4 练习纸预览",
    exact: true,
  });
  await expect(preview.getByRole("alert")).toBeInViewport();
  await page.context().unroute("**/fonts/noto-sans-sc-math-subset.ttf*");
  const downloaded = page.waitForEvent("download");
  await preview.getByRole("button", { name: "重试", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toContain("第1份");
  await expect(preview.getByRole("status")).toHaveText("已导出 2 页练习");
});

test("放大预览内键盘焦点不会落到背景，关闭后回到放大按钮", async ({ page }) => {
  await openWorksheet(page);
  const expand = page.getByRole("button", { name: "放大预览", exact: true });
  await expand.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "A4 练习纸预览", exact: true });
  await expect(dialog).toBeVisible();
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let index = 0; index < 10; index += 1) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(expand).toBeFocused();
  const print = page.getByRole("button", { name: "打印本份", exact: true });
  await print.focus();
  await expect(print).toBeFocused();
});


for (const width of [1440, 1280, 390]) {
  test(`${width}px 导航与预览无溢出，原尺寸放大后可以滚动阅读全文`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await openWorksheet(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width === 390) {
      await expect(page.getByTestId("worksheet-day-29")).toBeHidden();
      await page.getByRole("button", { name: /选择本月练习/ }).click();
      await page.getByTestId("worksheet-day-29").click();
      await expect(page.getByTestId("worksheet-day-29")).toBeHidden();
    }
    await side(page, "back");
    await expect(page.getByTestId("math-worksheet-paper")).toHaveAttribute(
      "data-side",
      "back",
    );
    const paper = page.getByTestId("math-worksheet-paper");
    expect((await paper.boundingBox())!.width).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "放大预览", exact: true }).click();
    expect((await paper.boundingBox())!.width).toBeCloseTo(
      (210 * 96) / 25.4,
      0,
    );
    const scroll = await paper.locator("..").evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.height);
    if (width === 390) expect(scroll.scrollWidth).toBeGreaterThan(scroll.width);
    await paper.locator("..").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.scrollLeft = element.scrollWidth;
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "放大预览", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "打印本份", exact: true }),
    ).toBeVisible();
  });
}

test("30 份双面 SVG 的实际字形和场景边界、浏览器打印两页无裁切", async ({
  page,
}) => {
  test.setTimeout(90000);
  await openWorksheet(page);
  const paper = page.getByTestId("math-worksheet-paper");
  await side(page, "back");
  // 用本页真实中文字体及字号探测连续标点，不依赖某类题恰好含引号。
  const punctuation = await paper.locator('text[data-font="chinese"]').first().evaluate((node) => {
    const probe = node.cloneNode() as SVGTextElement;
    probe.textContent = "。”";
    node.parentElement!.appendChild(probe);
    const result = {
      gap: probe.getStartPositionOfChar(1).x - probe.getStartPositionOfChar(0).x,
      size: Number(probe.getAttribute("data-size")),
    };
    probe.remove();
    return result;
  });
  expect(punctuation.gap).toBeCloseTo(punctuation.size * 25.4 / 72, 1);
  const occurrences = new Map<string, number[]>();
  const headerAssets = new Set<string>();
  const wordScenes = new Set<string>();
  for (let day = 1; day <= 30; day += 1) {
    await page.getByTestId(`worksheet-day-${day}`).click();
    for (const face of ["front", "back"] as const) {
      await side(page, face);
      const kinds = await paper
        .locator("[data-task-id]")
        .evaluateAll((groups) => groups.map((group) => group.getAttribute("data-type") ?? ""));
      for (const kind of kinds)
        occurrences.set(kind, [...(occurrences.get(kind) ?? []), day]);
      expect(kinds).toHaveLength(2);
      const parentHints = await paper.locator('[data-node-region="title"]').evaluateAll((nodes) =>
        nodes.map((node) => node.textContent ?? "").filter((text) => text.startsWith("家长方法：")),
      );
      expect(parentHints, `第 ${day} 份 ${face} 每个题块都有家长方法说明`).toHaveLength(2);
      if (face === "front") {
        expect(CALCULATION_KINDS).toContain(kinds[0]);
        expect(GRAPHIC_KINDS).toContain(kinds[1]);
      } else {
        expect(THINKING_KINDS).toContain(kinds[0]);
        expect(kinds[1]).toBe("word");
        wordScenes.add((await paper.locator('[data-type="word"] text[data-size="10"][data-node-region="content"]').textContent())!);
      }
      if (kinds.includes("matchLine")) {
        const matchBlock = paper.locator('[data-type="matchLine"]');
        const groups = await matchBlock.locator('[data-purpose="item-number"]').count();
        const results = await matchBlock.locator('text[data-size="16"]').evaluateAll((nodes) =>
          nodes.map((node) => node.textContent ?? "").filter((text) => /^\d+$/.test(text)).map(Number));
        const expressions = await matchBlock.locator('text[data-size="16"]').evaluateAll((nodes) =>
          nodes.map((node) => node.textContent ?? "").filter((text) => /^\d+ [+-] \d+$/.test(text)));
        expect(groups).toBe(4);
        expect(results).toHaveLength(4);
        expect(expressions).toHaveLength(4);
        expect(new Set(results).size, `第 ${day} 份连线活动只有四对且得数不重复`).toBe(4);
      }
      if (kinds.includes("circleOut")) {
        const activity = paper.locator('[data-type="circleOut"]');
        const expressions = await activity.locator('text[data-size="16"]').evaluateAll((nodes) =>
          nodes.map((node) => node.textContent ?? "").filter((text) => /^\d+ [+-] \d+$/.test(text)));
        expect(expressions).toHaveLength(4);
        expect((await activity.textContent())!.match(/圈出结果比/g)).toHaveLength(1);
      }
      if (kinds.includes("numberTower")) {
        await expect(paper.locator('[data-type="numberTower"] [data-purpose="writing"]')).toHaveCount(4);
      }
      await expect(paper.locator('[data-region="header"] image')).toHaveCount(1);
      headerAssets.add((await paper.locator('[data-region="header"] image').getAttribute("href"))!);
      const overflow = await paper.locator("g text, g rect, g circle, g ellipse, g path, g image, g line").evaluateAll((elements) =>
        elements.flatMap((element) => {
          const graphic = element as SVGGraphicsElement;
          const box = graphic.getBBox();
          const svg = graphic.ownerSVGElement!;
          const transform = svg.getCTM()!.inverse().multiply(graphic.getCTM()!);
          const corners = [
            [box.x, box.y], [box.x + box.width, box.y],
            [box.x, box.y + box.height], [box.x + box.width, box.y + box.height],
          ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(transform));
          const visual = {
            left: Math.min(...corners.map((point) => point.x)),
            right: Math.max(...corners.map((point) => point.x)),
            top: Math.min(...corners.map((point) => point.y)),
            bottom: Math.max(...corners.map((point) => point.y)),
          };
          const group = element.closest("[data-task-id]");
          const left = Number(group?.getAttribute("data-left") ?? 0),
            top = Number(group?.getAttribute("data-top") ?? 0);
          const width = Number(group?.getAttribute("data-width") ?? 210),
            height = Number(group?.getAttribute("data-height") ?? 297);
          return visual.left < left - 0.5 ||
            visual.top < top - 1 ||
            visual.right > left + width + 0.5 ||
            visual.bottom > top + height + 0.5
            ? [`${element.tagName} ${element.textContent || ""} box=${visual.left.toFixed(1)},${visual.top.toFixed(1)},${visual.right.toFixed(1)},${visual.bottom.toFixed(1)} region=${left},${top},${(left + width).toFixed(1)},${(top + height).toFixed(1)}`]
            : [];
        }),
      );
      expect(overflow, `第 ${day} 份 ${face}`).toEqual([]);
      const collisions = await paper.locator("[data-task-id]").evaluateAll((groups) => {
        const results: string[] = [];
        for (const group of groups) {
          const texts = [...group.querySelectorAll<SVGGraphicsElement>('text, image')];
          for (let i = 0; i < texts.length; i += 1) for (let j = i + 1; j < texts.length; j += 1) {
            const a = texts[i].getBBox(), b = texts[j].getBBox();
            if (a.x < b.x + b.width - 0.2 && b.x < a.x + a.width - 0.2
              && a.y < b.y + b.height - 0.2 && b.y < a.y + a.height - 0.2)
              results.push(`${group.getAttribute("data-type")}：${texts[i].textContent} / ${texts[j].textContent}`);
          }
        }
        return results;
      });
      expect(collisions, `第 ${day} 份 ${face} 字形遮挡`).toEqual([]);
      const cramped = await paper.locator('[data-purpose="writing"]').evaluateAll((nodes) => nodes.flatMap((node) => {
        const box = (node as SVGGraphicsElement).getBBox();
        const height = node.tagName === "line" ? Number(node.getAttribute("data-writing-height")) : box.height;
        const minimum = node.tagName === "circle" ? 6 : node.tagName === "line" ? 13 : 12;
        return height < minimum - 0.01 || (node.tagName === "line" && box.width < 24 - 0.01)
          ? [`${node.closest("[data-task-id]")?.getAttribute("data-type")} ${box.width}×${height}`] : [];
      }));
      expect(cramped, `第 ${day} 份 ${face} 书写空间不足`).toEqual([]);
      await expect(paper).not.toContainText(/答案|解析/);
    }
  }
  // 一个月覆盖 17 种轮换题型和固定的生活应用题。
  expect(occurrences.size).toBe(DRILL_SEQUENCE.length + 1);
  expect(headerAssets.size, "30 份正反面的头部角色不重复").toBe(60);
  expect(wordScenes.size, "30 份的应用题情景不重复").toBe(30);
  expect(occurrences.has("word")).toBe(true);
  for (const [kind, days] of occurrences) {
    expect(days.length, kind).toBeGreaterThanOrEqual(2);
  }
  await page.emulateMedia({ media: "print" });
  const bytes = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
});
