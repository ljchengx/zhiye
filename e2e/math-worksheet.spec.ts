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
import { SCENE_KINDS } from "../lib/tools/number-sense/curriculum";

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

/** 同一份的正反面不一定都画角色图，先切到带 mario 的那一面再做素材替换断言。 */
async function faceWithMario(page: Page): Promise<Locator> {
  const paper = page.getByTestId("math-worksheet-paper");
  for (const value of ["front", "back"] as const) {
    await side(page, value);
    const image = paper.locator('image[data-character="mario"]').first();
    if (await image.count()) return image;
  }
  throw new Error("这一份两面都没有 mario 角色图");
}

async function sceneSnapshot(paper: Locator) {
  // 图形题换题可能不改文字，只比较场景内部的实际绘图，排除任务编号。
  return paper.locator("[data-task-id]").innerHTML();
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
  await expect(paper.getByTestId("math-worksheet-question")).toHaveCount(1);
  await expect(print.locator("svg")).toHaveCount(2);
  expect(await sceneSnapshot(print.locator('svg[data-side="front"]'))).toBe(
    front,
  );
  await side(page, "back");
  await expect(paper).toHaveAttribute("data-side", "back");
  const back = await sceneSnapshot(paper);
  expect(back).not.toBe(front);
  expect(await sceneSnapshot(print.locator('svg[data-side="back"]'))).toBe(back);
  await page.getByRole("button", { name: "本份换一套", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("第 1 份正反面已更新");
  await expect(paper).toHaveAttribute("data-side", "back");
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

test("初次字体加载失败可重试，角色文件夹不改变场景物件", async ({ page }) => {
  await page
    .context()
    .route("**/fonts/noto-sans-sc-math-subset.ttf*", (route) => route.abort());
  await page.goto("/kids/math-worksheet");
  await expect(
    page
      .getByRole("region", { name: "本份练习", exact: true })
      .getByRole("alert"),
  ).toBeVisible({ timeout: 30000 });
  await page.context().unroute("**/fonts/noto-sans-sc-math-subset.ttf*");
  await page.getByRole("button", { name: "重试", exact: true }).click();
  const paper = page.getByTestId("math-worksheet-paper");
  await expect(paper).toBeVisible();
  await faceWithMario(page);
  const before = await paper.textContent();
  const objectSources = await paper.locator("image[data-object]").evaluateAll(
    (images) => images.map((image) => image.getAttribute("href")),
  );
  expect(objectSources.length).toBeGreaterThan(0);
  await page
    .getByLabel("选择角色素材文件夹", { exact: true })
    .setInputFiles("public/math-worksheet/characters");
  await expect(paper.locator('image[data-character="mario"]').first()).toHaveAttribute(
    "href",
    /^blob:/,
  );
  expect(await paper.textContent()).toBe(before);
  expect(await paper.locator("image[data-object]").evaluateAll(
    (images) => images.map((image) => image.getAttribute("href")),
  )).toEqual(objectSources);
  await page.getByText("更多设置", { exact: true }).click();
  await page.getByRole("button", { name: "清除本地素材", exact: true }).click();
  await expect(paper.locator('image[data-character="mario"]').first()).toHaveAttribute(
    "href",
    /\/math-worksheet\/characters\/mario\.png$/,
  );
  expect(
    await page.evaluate(() =>
      [
        "SenseChinese",
        "SenseChineseBold",
        "SenseNumeric",
        "SenseNumericBold",
      ].every((family) => document.fonts.check(`14px ${family}`)),
    ),
  ).toBe(true);
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole("button", { name: "打印本份", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "已准备第 1 份，共 2 页；双面打印请选择长边翻转",
  );
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
  const preview = page.getByRole("region", {
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

test("导出失败后清除本地角色，重试使用当前素材", async ({ page }) => {
  await openWorksheet(page);
  await faceWithMario(page);
  await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const bytes = Uint8Array.from(
      atob(canvas.toDataURL("image/jpeg").split(",")[1]),
      (character) => character.charCodeAt(0),
    );
    const files = new DataTransfer();
    files.items.add(new File([bytes], "mario.jpg", { type: "image/jpeg" }));
    const input = document.querySelector<HTMLInputElement>(
      'input[aria-label="选择角色素材文件夹"]',
    )!;
    input.files = files.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const character = page.getByTestId("math-worksheet-paper").locator('image[data-character="mario"]').first();
  await expect(character).toHaveAttribute("href", /^blob:/);
  await page
    .context()
    .route("**/fonts/noto-sans-sc-math-subset.ttf*", (route) => route.abort());
  await page.getByText("导出 PDF", { exact: true }).click();
  await page.getByRole("button", { name: "下载 PDF", exact: true }).click();
  const alert = page
    .getByRole("region", { name: "本份练习", exact: true })
    .getByRole("alert");
  await expect(alert).toContainText("字体加载失败");
  await page.getByText("更多设置", { exact: true }).click();
  await page.getByRole("button", { name: "清除本地素材", exact: true }).click();
  await expect(character).toHaveAttribute("href", /\/characters\/mario\.png$/);
  await page.context().unroute("**/fonts/noto-sans-sc-math-subset.ttf*");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "重试", exact: true }).click();
  const download = await downloaded;
  const pdf = await PDFDocument.load(await readFile((await download.path())!));
  expect(pdf.getPageCount()).toBe(2);
  await expect(alert).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("已导出 2 页练习");
});

for (const fixture of [
  {
    name: "普通",
    format: "jpeg",
    orientation: 1,
    source: [80, 40],
    preview: [80, 40],
    pdf: [80, 40],
    red: [20, 20],
    blue: [60, 20],
  },
  {
    name: "180 度",
    format: "jpeg",
    orientation: 3,
    source: [80, 40],
    preview: [80, 40],
    pdf: [80, 40],
    red: [60, 20],
    blue: [20, 20],
  },
  {
    name: "90 度",
    format: "jpeg",
    orientation: 6,
    source: [80, 40],
    preview: [40, 80],
    pdf: [40, 80],
    red: [20, 10],
    blue: [20, 70],
  },
  {
    name: "大图缩放",
    format: "jpeg",
    orientation: 6,
    source: [2048, 1024],
    preview: [1024, 2048],
    pdf: [512, 1024],
    red: [256, 128],
    blue: [256, 896],
  },
  {
    name: "90 度与透明背景",
    format: "png",
    orientation: 6,
    source: [80, 40],
    preview: [40, 80],
    pdf: [40, 80],
    red: [20, 10],
    blue: [20, 70],
    transparent: [35, 5],
  },
])
  test(`${fixture.format.toUpperCase()} ${fixture.name}在预览、打印和 PDF 中方向一致`, async ({
    page,
  }) => {
    await openWorksheet(page);
    await faceWithMario(page);
    const dimensions = await page.evaluate(
      async ({ orientation, source, format, transparent }) => {
        const canvas = document.createElement("canvas");
        canvas.width = source[0];
        canvas.height = source[1];
        const context = canvas.getContext("2d")!;
        context.fillStyle = "#ff0000";
        context.fillRect(0, 0, canvas.width / 2, canvas.height);
        context.fillStyle = "#0000ff";
        context.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        if (transparent) context.clearRect(0, 0, 10, 10);
        const encoded = Uint8Array.from(
          atob(canvas.toDataURL(`image/${format}`, 0.95).split(",")[1]),
          (c) => c.charCodeAt(0),
        );
        const exif = Uint8Array.from(
          "ffe1002245786966000049492a0008000000010012010300010000000600000000000000".match(
            /../g,
          )!,
          (hex) => parseInt(hex, 16),
        );
        exif[28] = orientation;
        let parts: BlobPart[];
        if (format === "png") {
          // eXIf 保存 TIFF 数据；放在 IHDR 后并写入合法的 CRC。
          const tiff = exif.slice(10);
          const chunk = new Uint8Array(tiff.length + 12);
          const view = new DataView(chunk.buffer);
          view.setUint32(0, tiff.length);
          chunk.set([101, 88, 73, 102], 4);
          chunk.set(tiff, 8);
          let crc = 0xffffffff;
          for (const byte of chunk.slice(4, -4)) {
            crc ^= byte;
            for (let i = 0; i < 8; i += 1)
              crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
          }
          view.setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
          parts = [encoded.slice(0, 33), chunk, encoded.slice(33)];
        } else {
          parts = [encoded.slice(0, 2), exif, encoded.slice(2)];
        }
        const file = new File(parts, `mario.${format}`, {
          type: `image/${format}`,
        });
        const image = new Image();
        image.src = URL.createObjectURL(file);
        await image.decode();
        const result = [image.naturalWidth, image.naturalHeight];
        URL.revokeObjectURL(image.src);
        const files = new DataTransfer();
        files.items.add(file);
        const input = document.querySelector<HTMLInputElement>(
          'input[aria-label="选择角色素材文件夹"]',
        )!;
        input.files = files.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return result;
      },
      {
        orientation: fixture.orientation,
        source: fixture.source,
        format: fixture.format,
        transparent: !!fixture.transparent,
      },
    );
    expect(dimensions).toEqual(fixture.preview);
    await expect(
      page
        .getByTestId("math-worksheet-paper")
        .locator('image[data-character="mario"]').first(),
    ).toHaveAttribute("href", /^blob:/);
    const { pdf } = await downloadPdf(page, "day");
    // 角色图可能只出现在整份的某一面，按替换图片的尺寸在整份里定位，再检验方向和像素。
    const candidates = pdf.getPages().flatMap((pdfPage) => {
      const objects = pdfPage.node.Resources()?.lookup(PDFName.of("XObject"), PDFDict);
      if (!objects) return [];
      return [...objects.values()]
        .map((reference) => pdf.context.lookup(reference))
        .filter(
          (object): object is PDFRawStream =>
            object instanceof PDFRawStream &&
            object.dict.get(PDFName.of("Subtype"))?.toString() === "/Image" &&
            object.dict.lookup(PDFName.of("Width"), PDFNumber).asNumber() === fixture.pdf[0] &&
            object.dict.lookup(PDFName.of("Height"), PDFNumber).asNumber() === fixture.pdf[1],
        );
    });
    expect(candidates).toHaveLength(1);
    const image = candidates[0];
    expect(image).toBeInstanceOf(PDFRawStream);
    if (!(image instanceof PDFRawStream)) throw new Error("PDF 缺少角色图像");
    const width = image.dict.lookup(PDFName.of("Width"), PDFNumber).asNumber();
    const height = image.dict
      .lookup(PDFName.of("Height"), PDFNumber)
      .asNumber();
    expect([width, height]).toEqual(fixture.pdf);
    const pixels = decodePDFRawStream(image).decode();
    const pixel = (x: number, y: number) => [
      ...pixels.slice((y * width + x) * 3, (y * width + x) * 3 + 3),
    ];
    const red = pixel(fixture.red[0], fixture.red[1]);
    const blue = pixel(fixture.blue[0], fixture.blue[1]);
    expect(red[0]).toBeGreaterThan(180);
    expect(red[2]).toBeLessThan(80);
    expect(blue[2]).toBeGreaterThan(180);
    expect(blue[0]).toBeLessThan(80);
    if (fixture.transparent) {
      const mask = image.dict.lookup(PDFName.of("SMask"));
      if (!(mask instanceof PDFRawStream)) throw new Error("PDF 缺少透明蒙版");
      const alpha = decodePDFRawStream(mask).decode();
      const [x, y] = fixture.transparent;
      expect(alpha[y * width + x]).toBe(0);
      expect(alpha[fixture.red[1] * width + fixture.red[0]]).toBe(255);
    }
    expect(
      await page
        .getByTestId("worksheet-print-pack")
        .locator('image[data-character="mario"]')
        .first()
        .getAttribute("href"),
    ).toMatch(/^blob:/);
  });

test("未使用的损坏素材不影响当天导出", async ({ page }) => {
  await openWorksheet(page);
  await faceWithMario(page);
  await page.evaluate(async () => {
    const png = await (
      await fetch("/math-worksheet/characters/mario.png")
    ).blob();
    const files = new DataTransfer();
    files.items.add(new File([png], "mario.png", { type: "image/png" }));
    files.items.add(
      new File(["invalid png"], "number-block-20.png", { type: "image/png" }),
    );
    const input = document.querySelector<HTMLInputElement>(
      'input[aria-label="选择角色素材文件夹"]',
    )!;
    input.files = files.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(
    page
      .getByTestId("math-worksheet-paper")
      .locator('image[data-character="mario"]').first(),
  ).toHaveAttribute("href", /^blob:/);
  const { pdf } = await downloadPdf(page, "day");
  expect(pdf.getPageCount()).toBe(2);
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
  for (let day = 1; day <= 30; day += 1) {
    await page.getByTestId(`worksheet-day-${day}`).click();
    for (const face of ["front", "back"] as const) {
      await side(page, face);
      const kind = await paper.locator("[data-task-id]").getAttribute("data-type");
      occurrences.set(kind!, [...(occurrences.get(kind!) ?? []), day]);
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
            ? [element.textContent || element.tagName]
            : [];
        }),
      );
      expect(overflow, `第 ${day} 份 ${face}`).toEqual([]);
      await expect(paper).not.toContainText(/答案|解析/);
    }
  }
  expect(occurrences.size).toBe(SCENE_KINDS.length);
  for (const [kind, days] of occurrences) {
    expect(days.length, kind).toBeLessThanOrEqual(2);
    if (days.length === 2) expect(days[1] - days[0], kind).toBeGreaterThanOrEqual(7);
  }
  await page.emulateMedia({ media: "print" });
  const bytes = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
});
