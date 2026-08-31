import { expect, test } from "@playwright/test";

test("首页作为产品介绍页，并可进入独立工作台", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("知页 - 免费在线文本、数据与数学练习工具");
  await expect(page.getByRole("link", { name: "知页首页" })).toBeVisible();
  await expect(page.getByRole("link", { name: "在 GitHub 查看知页源码" })).toHaveAttribute("href", "https://github.com/ljchengx/zhiye");
  await expect(page.locator("#home-title")).toContainText("把琐碎处理");
  await expect(page.locator("#home-title")).toContainText("留在这一页");
  const promises = page.getByLabel("知页产品承诺");
  await expect(promises.getByText("无需登录", { exact: true })).toBeVisible();
  await expect(promises.getByText("本地处理", { exact: true })).toBeVisible();
  await expect(promises.getByText("始终免费", { exact: true })).toBeVisible();
  const carousel = page.getByRole("region", { name: "知页视觉展示", exact: true });
  await expect(carousel).toBeVisible();
  await expect(page.locator(".zhiye-product-gallery__copy h2")).toContainText("内容留在浏览器");
  await expect(carousel.getByRole("button", { name: "查看第 1 张图片" })).toHaveAttribute("aria-current", "true");
  await carousel.getByRole("button", { name: "查看第 2 张图片" }).click();
  await expect(carousel.getByRole("button", { name: "查看第 2 张图片" })).toHaveAttribute("aria-current", "true");

  await page.getByRole("link", { name: "进入工作台" }).first().click();
  await expect(page).toHaveURL(/\/tools$/);
  await expect(page.getByRole("heading", { name: "免费在线工具工作台" })).toBeVisible();
  await expect(page.getByRole("link", { name: "打开图片水印" })).toBeVisible();
});

test("工具页包含可索引说明、FAQ 和结构化数据", async ({ page }) => {
  await page.goto("/json");

  await expect(page.getByRole("heading", { name: "JSON 在线格式化、美化与校验" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "常见问题" })).toBeVisible();
  await expect(page.getByText("JSON 格式化和 JSON 压缩有什么区别？", { exact: true })).toBeVisible();
  const structuredData = await page.locator('script[type="application/ld+json"]').evaluate((script) => script.textContent ?? "");
  expect(structuredData).toContain("WebApplication");
});

test("工作台保持浏览器本地处理的编辑器界面", async ({ page }) => {
  await page.goto("/base64");
  await page.getByLabel("输入文本").focus();

  const theme = await page.evaluate(() => {
    const card = getComputedStyle(document.querySelector(".pulse-editor-card--input")!);
    const button = getComputedStyle(document.querySelector(".pulse-run-button")!);

    return {
      cardBackground: card.backgroundColor,
      cardBackdrop: card.backdropFilter,
      buttonBackground: button.backgroundColor,
    };
  });

  expect(theme.cardBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(theme.cardBackdrop).toBe("blur(18px)");
  expect(theme.buttonBackground).not.toBe("rgba(0, 0, 0, 0)");
});

test("工作台导航可在首页、工作台和具体工具之间切换", async ({ page }) => {
  await page.goto("/base64");
  await expect(page.getByRole("link", { name: "工作台" })).toBeVisible();
  await expect(page.getByRole("link", { name: "JSON", exact: true })).toHaveAttribute("href", "/json");
  await page.getByRole("link", { name: "工作台" }).click();
  await expect(page).toHaveURL(/\/tools$/);
  await page.getByRole("link", { name: "打开JSON 格式化" }).click();
  await expect(page).toHaveURL(/\/json$/);
});

test("Base64 可处理 UTF-8 文本", async ({ page }) => {
  await page.goto("/base64");

  await expect(page).toHaveTitle("Base64 编码解码工具 - 免费在线 Base64 编解码 | 知页");
  await page.getByLabel("输入文本").fill("你好🙂");
  await page.getByLabel("输入文本").press("Control+Enter");

  await expect(page.getByLabel("处理结果")).toHaveValue("5L2g5aW98J+Zgg==");
  await expect(page.getByRole("status")).toContainText("文本已编码");
});

test("JSON 在出错时显示行列位置", async ({ page }) => {
  await page.goto("/json");

  await page.getByLabel("输入文本").fill('{\n  "name": "MORPH",\n}');
  await page.getByLabel("输入文本").press("Control+Enter");

  await expect(page.getByRole("status")).toContainText("第");
});

test("JSON 普通回车换行，组合键执行格式化", async ({ page }) => {
  await page.goto("/json");

  const input = page.getByLabel("输入文本");
  await input.fill('{"name":"知页"}');
  await input.press("Enter");
  await expect(input).toHaveValue('{"name":"知页"}\n');
  await expect(page.getByLabel("处理结果")).toHaveValue("");

  await input.press("Control+Enter");
  await expect(page.getByLabel("处理结果")).toHaveValue('{\n  "name": "知页"\n}');
});

test("Markdown 清理保留可读内容", async ({ page }) => {
  await page.goto("/markdown");

  await page.getByLabel("输入文本").fill("# 标题\n\n**保留文本** [链接](https://example.com)");
  await page.getByLabel("输入文本").press("Control+Enter");

  await expect(page.getByLabel("处理结果")).toHaveValue("标题\n保留文本 链接");
});

test("Markdown 清理会处理 text 围栏中的标题、粗体和分隔线", async ({ page }) => {
  await page.goto("/markdown");

  const fence = "```";
  const input = [
    "---",
    "",
    `${fence}text`,
    "# 输入结构",
    "",
    "1. **学生作答图片**（必需）",
    "",
    "---",
    "",
    "# 判定优先级",
    `${fence}`,
  ].join("\n");

  await page.getByLabel("输入文本").fill(input);
  await page.getByLabel("输入文本").press("Control+Enter");

  await expect(page.getByLabel("处理结果")).toHaveValue("输入结构\n1. 学生作答图片（必需）\n\n判定优先级");
});

test("减少动态效果时首页仍可进入工作台工具", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator("canvas")).toHaveCount(0);
  const markdownLink = page.locator(".zhiye-product-tools").getByRole("link", { name: "打开Markdown 清理" });
  await expect(markdownLink).toBeVisible();
  await markdownLink.click();
  await expect(page).toHaveURL(/\/markdown/);
  await context.close();
});

test("首页轮播会自动播放，并尊重减少动态效果设置", async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "知页视觉展示", exact: true });
  await expect(carousel.getByRole("button", { name: "查看第 1 张图片" })).toHaveAttribute("aria-current", "true");
  await expect(carousel.getByRole("button", { name: "查看第 2 张图片" })).toHaveAttribute("aria-current", "true", { timeout: 6000 });
  await page.close();

  const reducedContext = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto("/");
  const reducedCarousel = reducedPage.getByRole("region", { name: "知页视觉展示", exact: true });
  await expect(reducedCarousel.getByRole("button", { name: "查看第 1 张图片" })).toHaveAttribute("aria-current", "true");
  await reducedPage.waitForTimeout(4600);
  await expect(reducedCarousel.getByRole("button", { name: "查看第 1 张图片" })).toHaveAttribute("aria-current", "true");
  await reducedContext.close();
});

test("首页展台仅在桌面端启用轻微视差", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await page.goto("/");
  const stage = page.getByRole("region", { name: "知页视觉展示", exact: true });
  await stage.scrollIntoViewIfNeeded();
  const initialTransform = await stage.evaluate((element) => getComputedStyle(element).transform);
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.9, bounds!.y + bounds!.height * 0.15);
  await expect.poll(() => stage.evaluate((element) => getComputedStyle(element).transform)).not.toBe(initialTransform);
  await page.mouse.move(10, 10);
  await expect.poll(() => stage.evaluate((element) => getComputedStyle(element).transform), { timeout: 1500 }).toBe(initialTransform);
  await page.close();

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto("/");
  await expect(mobilePage.getByRole("region", { name: "知页视觉展示", exact: true })).toHaveCSS("transform", "none");
  await mobilePage.close();
});

test("首页物理实验台支持拖拽、重置和真实工具导航", async ({ page }) => {
  await page.goto("/");
  const lab = page.getByLabel("可拖拽的知页工具");
  await lab.scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "知页工具实验台" })).toBeAttached();
  await expect(lab.getByRole("link")).toHaveCount(6);
  await expect(lab).toHaveClass(/is-ready/);

  const base64 = lab.getByRole("link", { name: "打开Base64 编解码" });
  const before = await base64.boundingBox();
  expect(before).not.toBeNull();
  await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
  await page.mouse.down();
  await page.mouse.move(before!.x + before!.width / 2 + 90, before!.y - 70, { steps: 6 });
  await page.mouse.up();
  expect(new URL(page.url()).pathname).toBe("/");

  const initialLayout = await lab.getAttribute("data-layout");
  await page.getByRole("button", { name: "重置实验台" }).click();
  await expect(lab).toHaveClass(/is-ready/);
  await expect(lab).not.toHaveAttribute("data-layout", initialLayout!);
  await base64.click();
  await expect(page).toHaveURL(/\/base64$/);
});

test("减少动态效果时物理实验台保持静态可访问", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const lab = page.getByLabel("可拖拽的知页工具");
  await expect(lab).toBeAttached();
  await expect(lab).toHaveClass(/is-static/);
  await expect(page.getByRole("button", { name: "重置实验台" })).toHaveCount(0);
  await expect(lab.getByRole("link", { name: "打开时间戳转换" })).toBeVisible();
  await context.close();
});

test("Base64 支持 URL-safe 输出与结果交换", async ({ page }) => {
  await page.goto("/base64");

  await page.getByRole("button", { name: "URL-safe" }).click();
  await page.getByLabel("输入文本").fill("你好🙂");
  await page.getByRole("button", { name: "执行编码文本" }).click();
  await expect(page.getByLabel("处理结果")).toHaveValue("5L2g5aW98J-Zgg");

  await page.getByRole("button", { name: "交换输入和结果" }).click();
  await page.getByRole("button", { name: "解码" }).click();
  await page.getByRole("button", { name: "执行解码文本" }).click();
  await expect(page.getByLabel("处理结果")).toHaveValue("你好🙂");
});

test("JSON 支持键排序与结构视图", async ({ page }) => {
  await page.goto("/json");

  await page.getByLabel("输入文本").fill('{"z":1,"a":{"d":2,"b":3}}');
  await page.getByRole("button", { name: "4 空格" }).click();
  await page.getByLabel("按名称排序").check();
  await page.getByRole("button", { name: "执行格式化" }).click();
  await expect(page.getByLabel("处理结果")).toHaveValue('{\n    "a": {\n        "b": 3,\n        "d": 2\n    },\n    "z": 1\n}');

  await page.getByRole("button", { name: "结构" }).click();
  await expect(page.getByLabel("JSON 结构视图")).toBeVisible();
});

test("Markdown 清理可保留列表并合并空行", async ({ page }) => {
  await page.goto("/markdown");

  await page.getByLabel("合并空行").check();
  await page.getByLabel("输入文本").fill("1. 第一项\n   - 子项\n\n2. 第二项");
  await page.getByRole("button", { name: "执行清理文本" }).click();
  await expect(page.getByLabel("处理结果")).toHaveValue("1. 第一项\n  - 子项\n2. 第二项");
});

test("图片水印支持四项自定义并下载原尺寸结果", async ({ page }) => {
  await page.goto("/image-watermark");
  await expect(page.getByLabel("颜色", { exact: true })).toHaveValue("#8a9299");
  await expect(page.getByRole("slider", { name: "透明度" })).toHaveValue("22");
  const png = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 150;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#f7f7f5";
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png").split(",")[1];
  }), "base64");

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "id-card.png",
    mimeType: "image/png",
    buffer: png,
  });

  await expect(page.locator('.pulse-watermark-statusbar [role="status"]')).toContainText("水印预览已生成");
  await expect(page.getByTestId("watermark-canvas")).toHaveAttribute("width", "240");
  const previewBefore = await page.getByTestId("watermark-canvas").evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await page.getByLabel("水印文本").fill("仅供开户验证使用");
  await page.getByLabel("颜色", { exact: true }).fill("#b42318");
  await page.getByRole("slider", { name: "透明度" }).fill("36");
  await page.getByRole("slider", { name: "角度" }).fill("-18");

  await expect(page.getByLabel("水印文本")).toHaveValue("仅供开户验证使用");
  await expect(page.getByRole("slider", { name: "透明度" })).toHaveValue("36");
  await expect(page.getByRole("slider", { name: "角度" })).toHaveValue("-18");
  await expect(page.getByRole("button", { name: "生成水印" })).toHaveCount(0);
  await expect.poll(() => page.getByTestId("watermark-canvas").evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).not.toBe(previewBefore);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载水印图片" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("id-card-watermarked.png");
});

test("时间戳工具支持双向转换和真实交互", async ({ page }) => {
  await page.goto("/timestamp");

  await expect(page).toHaveTitle("时间戳转换工具 - Unix 时间戳在线转换 | 知页");
  await expect(page.getByRole("link", { name: "时间戳" })).toHaveAttribute("aria-current", "page");
  await page.getByLabel("输入 Unix 时间戳").fill("0");
  await page.getByLabel("输入 Unix 时间戳").press("Enter");
  await expect(page.getByText("1970-01-01T00:00:00.000Z")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("按秒解析");

  await page.getByRole("button", { name: "日期转时间戳" }).click();
  await page.getByRole("button", { name: "UTC", exact: true }).click();
  await page.getByLabel("选择要转换的日期和时间").fill("1970-01-01T00:00");
  await page.getByRole("button", { name: "开始转换" }).click();
  const secondsRow = page.getByText("秒时间戳", { exact: true }).locator("..");
  await expect(secondsRow.locator("code")).toHaveText("0");

  await page.getByRole("button", { name: "使用当前时间" }).click();
  await expect(page.getByLabel("选择要转换的日期和时间")).not.toHaveValue("");
});

test("幼小数学练习支持 30 天计划、主题选择与 A4 打印包", async ({ page }) => {
  await page.goto("/math-worksheet");

  await expect(page).toHaveTitle("幼小数学练习生成器 - 30 天连续作业与 A4 打印 | 知页");
  await expect(page.getByRole("link", { name: "数学练习" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("math-worksheet-paper")).toBeVisible();
  await expect(page.getByTestId("math-worksheet-question")).toHaveCount(24);
  await expect(page.getByTestId("worksheet-column-guide")).toHaveCount(0);
  await expect(page.getByText("相邻数").first()).toBeVisible();
  await expect(page.getByTestId("worksheet-demo")).toContainText("凑十法");
  await expect(page.getByTestId("worksheet-theme")).toContainText("计划主题");
  await expect(page.getByTestId("worksheet-day-30")).toBeVisible();
  await expect(page.locator(".math-worksheet-print-pack .math-worksheet-paper")).toHaveCount(30);

  await page.getByTestId("worksheet-day-9").click();
  await expect(page.getByTestId("math-worksheet-paper")).toHaveAttribute("data-day", "9");
  await expect(page.getByTestId("math-worksheet-question")).toHaveCount(26);
  await expect(page.getByTestId("worksheet-demo")).toContainText("混合主题");
  await expect(page.getByTestId("worksheet-column-guide")).toContainText("相同数位对齐");
  await expect(page.getByTestId("worksheet-column-guide").locator(".math-worksheet-column-guide__stack")).toHaveCount(1);
  await expect(page.getByTestId("worksheet-day-summary")).toContainText("迈向 50");

  await page.getByTestId("worksheet-day-21").click();
  await expect(page.getByTestId("math-worksheet-question")).toHaveCount(30);
  await expect(page.locator('[data-testid="math-worksheet-question"][data-level="three-number"]')).toHaveCount(10);
  await expect(page.getByTestId("worksheet-column-guide")).toContainText("连续两步列式");
  await expect(page.getByTestId("worksheet-column-guide")).toContainText("第 1 步");
  await expect(page.getByTestId("worksheet-column-guide")).toContainText("第 2 步");
  await expect(page.getByTestId("worksheet-column-guide").locator(".math-worksheet-column-guide__stack")).toHaveCount(2);

  await page.getByTestId("worksheet-day-30").click();
  await expect(page.getByTestId("math-worksheet-paper")).toHaveAttribute("data-day", "30");
  await expect(page.locator('[data-testid="math-worksheet-question"][data-level="three-number"]')).toHaveCount(20);
  await expect(page.getByTestId("worksheet-day-summary")).toContainText("阶段测评");

  await page.getByRole("button", { name: "选择平十法" }).click();
  await expect(page.getByTestId("worksheet-theme")).toContainText("自选主题");
  await expect(page.getByTestId("worksheet-theme")).toContainText("平十法");
  await expect(page.locator('[data-testid="math-worksheet-question"][data-method="flat-ten"]')).toHaveCount(20);
  await page.getByRole("button", { name: "本日换一套" }).click();
  await expect(page.getByTestId("worksheet-theme")).toContainText("自选主题");
  await expect(page.getByTestId("worksheet-demo")).toContainText("平十法");

  await page.getByRole("button", { name: "重新生成计划" }).click();
  await expect(page.getByRole("status")).toContainText("难度结构保持不变");
  await expect(page.getByTestId("worksheet-theme")).toContainText("计划主题");
});
