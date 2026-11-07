import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

test("首页作为产品介绍页，并可进入独立工作台", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("知页 - 免费的浏览器本地工具箱");
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

test("主站与通用工作台不暴露启蒙产品线", async ({ page }) => {
  for (const path of ["/", "/tools"]) {
    await page.goto(path);
    await expect(page.getByText("一程一成长", { exact: true })).toHaveCount(0);
    await expect(page.getByText("幼小数学练习", { exact: true })).toHaveCount(0);
    await expect(page.locator('a[href="/kids"]')).toHaveCount(0);
    await expect(page.locator('a[href="/kids/math-worksheet"]')).toHaveCount(0);
  }
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
  await expect(lab.getByRole("link")).toHaveCount(5);
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

test("旧数学地址永久跳转到启蒙工具地址", async ({ request }) => {
  const response = await request.get("/math-worksheet", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/kids/math-worksheet");
});

test("一程一成长主页按互动与打印形式展示真实工具", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/kids");

  await expect(page).toHaveTitle("一程一成长 - 陪孩子走好成长的每一步");
  await expect(page.getByRole("heading", { name: "陪孩子走好成长的每一步", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "登录", exact: true }).first()).toHaveAttribute("href", "/kids/login?next=%2Fkids");
  await expect(page.getByLabel("当前登录用户：橙子小朋友")).toHaveCount(0);
  await expect(page.getByText("2 个打印练习", { exact: true })).toBeVisible();
  await expect(page.getByText("1 个互动探究", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "打印练习", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "互动探究", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "自由创造", level: 2 })).toHaveCount(0);
  await expect(page.getByText("探索足迹", { exact: true })).toHaveCount(0);
  await expect(page.getByText("约 15 分钟", { exact: true })).toBeVisible();
  await expect(page.getByLabel("打印练习", { exact: true }).getByText("约 10 分钟", { exact: true })).toBeVisible();
  await expect(page.getByText("A4 打印", { exact: true })).toHaveCount(2);
  await expect(page.getByAltText("一程一成长微信公众号二维码")).toBeVisible();
  await expect(page.getByLabel("互动探究", { exact: true }).getByRole("link", { name: "开始使用" })).toHaveAttribute("href", "/kids/spatial-blocks");
  await expect(page.getByLabel("打印练习", { exact: true }).getByRole("link", { name: "开始使用" }).nth(0)).toHaveAttribute("href", "/kids/math-worksheet");
  await expect(page.getByLabel("打印练习", { exact: true }).getByRole("link", { name: "开始使用" }).nth(1)).toHaveAttribute("href", "/kids/pinyin-worksheet");
  await expect(page.getByText("敬请期待", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "一程一成长首页" })).toHaveAttribute("href", "/kids");

  const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
  expect(structuredData).toContain("https://www.yzfl.top/kids/math-worksheet");
  expect(structuredData).toContain("https://www.yzfl.top/kids/pinyin-worksheet");
  expect(structuredData).toContain("https://www.yzfl.top/kids/spatial-blocks");
});

test("橙子测试账号需要输入正确账号密码后才登录", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/kids/login");

  await expect(page.getByRole("heading", { name: "登录橙子小朋友", level: 1 })).toBeVisible();
  await expect(page.getByText("orange", { exact: true })).toBeVisible();
  await expect(page.getByText("orange123", { exact: true })).toBeVisible();
  await page.getByLabel("账号", { exact: true }).fill("orange");
  await page.getByLabel("密码", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.locator("#kids-login-error")).toHaveText("账号或密码不正确");

  await page.getByLabel("密码", { exact: true }).fill("orange123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("/kids");
  await expect(page.getByLabel("当前登录用户：橙子小朋友")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem("yicheng-kids:auth-session:v1") ?? "null"))).toMatchObject({
    version: 1,
    session: { userId: "usr_orange_001", activeChildId: "kid_orange_001", provider: "mock" },
  });

  await page.getByRole("button", { name: "退出橙子小朋友账号" }).click();
  await expect(page.getByRole("link", { name: "登录", exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("yicheng-kids:auth-session:v1"))).toBeNull();

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/kids/login");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("幼小拼音练习支持按项目选择、生成和打印且不记录状态", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/kids/pinyin-worksheet");

  await expect(page).toHaveTitle("幼小拼音练习纸生成器 - 四线三格 A4 打印 | 一程一成长");
  await expect(page.getByRole("heading", { name: "幼小拼音练习", level: 1 })).toBeVisible();
  await expect(page.getByText("练习内容只在当前浏览器中生成，不保存使用记录", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "标记完成" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "清空拼音记录" })).toHaveCount(0);
  await expect(page.getByText("本地成长记录", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "选择练习量" }).getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("button", { name: /轻松/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("details").filter({ hasText: "详细调整" })).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("pinyin-paper-body").getByTestId("pinyin-trace-section")).toBeVisible();
  await expect(page.getByTestId("pinyin-paper-body").getByTestId("pinyin-trace-section").getByTestId("pinyin-grid-row")).toHaveCount(2);
  const traceRowForms = await page.getByTestId("pinyin-paper-body").getByTestId("pinyin-grid-row").evaluateAll((rows) => rows.map((row) => Array.from(row.children)
    .map((cell) => cell.textContent?.trim() ?? "")
    .filter(Boolean)));
  expect(traceRowForms).toEqual([["a", "a", "a"], ["ā", "ā", "ā"]]);
  const exerciseNumbers = await page.getByTestId("pinyin-print-pack").locator("[class*=traceRowNumber], [class*=questionNumber]").allTextContents();
  expect(exerciseNumbers).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  const sectionMarker = await page.getByTestId("pinyin-worksheet-paper").locator("[class*=sectionRule]").first().evaluate((marker) => {
    const rect = marker.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(sectionMarker.height).toBeGreaterThan(sectionMarker.width * 3);
  await expect(page.getByTestId("pinyin-print-pack").locator('[data-type="blend"], [data-type="contrast"]')).toHaveCount(2);
  await expect(page.getByTestId("pinyin-print-pack").locator('[data-type="picture"]')).toHaveCount(3);
  const readability = await page.getByTestId("pinyin-worksheet-paper").evaluate((paper) => {
    const traceCell = paper.querySelector<HTMLElement>("[class*=traceCell]");
    const coreText = paper.querySelector<HTMLElement>("[class*=blendComponents]");
    const optionText = paper.querySelector<HTMLElement>("[class*=choiceDots]");
    const picture = paper.querySelector("img");
    return {
      traceFont: traceCell ? Number.parseFloat(getComputedStyle(traceCell).fontSize) : 0,
      coreFont: coreText ? Number.parseFloat(getComputedStyle(coreText).fontSize) : 0,
      optionFont: optionText ? Number.parseFloat(getComputedStyle(optionText).fontSize) : 0,
      pictureWidth: picture?.getBoundingClientRect().width ?? 0,
    };
  });
  expect(readability.traceFont).toBeGreaterThanOrEqual(68);
  expect(readability.coreFont).toBeGreaterThanOrEqual(28);
  expect(readability.optionFont).toBeGreaterThanOrEqual(22);
  expect(readability.pictureWidth).toBeGreaterThanOrEqual(158);

  await page.getByRole("button", { name: /标准/ }).click();
  const aPictures = page.getByTestId("pinyin-print-pack").locator('[data-type="picture"]');
  await expect(aPictures).toHaveCount(3);
  const aPictureLabels = await aPictures.locator("[class*=pictureObject] span").allTextContents();
  expect(new Set(aPictureLabels).size).toBe(3);
  expect(aPictureLabels.every((label) => ["花", "鸭", "嫩芽", "西瓜"].includes(label))).toBe(true);
  await page.getByRole("tab", { name: "第 2 页" }).click();
  const pictureLayout = await page.getByTestId("pinyin-worksheet-paper").locator("[class*=pictureGrid]").evaluate((grid) => {
    const rows = Array.from(grid.querySelectorAll<HTMLElement>('[data-type="picture"]'), (question) => question.getBoundingClientRect());
    return {
      columnCount: getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,
      rowCount: rows.length,
      verticallyStacked: rows.length >= 2 && rows.slice(1).every((row, index) => row.top >= rows[index]!.bottom),
    };
  });
  expect(pictureLayout).toEqual({ columnCount: 1, rowCount: 3, verticallyStacked: true });

  await page.getByRole("button", { name: "韵母 ui" }).click();
  const uiPictures = page.getByTestId("pinyin-print-pack").locator('[data-type="picture"]');
  await expect(uiPictures).toHaveCount(3);
  expect((await uiPictures.locator("[class*=pictureObject] span").allTextContents()).sort()).toEqual(["乌龟", "吹风", "水滴"].sort());
  expect((await uiPictures.allTextContents()).join(" ")).not.toMatch(/花|伞|车/);

  await page.getByRole("button", { name: "前鼻韵母 in", exact: true }).click();
  const inPictures = page.getByTestId("pinyin-print-pack").locator('[data-type="picture"]');
  await expect(inPictures).toHaveCount(3);
  const inPictureLabels = await inPictures.locator("[class*=pictureObject] span").allTextContents();
  expect(new Set(inPictureLabels).size).toBe(3);
  expect(inPictureLabels.every((label) => ["心", "音符", "饮料", "阴天"].includes(label))).toBe(true);

  await page.getByRole("button", { name: "后鼻韵母 eng", exact: true }).click();
  const longTraceMetrics = await page.getByTestId("pinyin-paper-body").getByTestId("pinyin-grid-row").evaluateAll((rows) => rows.map((row) => ({
    cellCount: row.children.length,
    guidesFit: Array.from(row.children).filter((cell) => cell.textContent).every((cell) => (cell as HTMLElement).scrollWidth <= (cell as HTMLElement).clientWidth + 1),
  })));
  expect(longTraceMetrics.every((row) => row.cellCount === 4 && row.guidesFit)).toBe(true);

  await page.getByRole("button", { name: "韵母 ui" }).click();

  const uiQuestionsBefore = (await page.getByTestId("pinyin-print-pack").locator('[data-type="blend"], [data-type="contrast"]').allTextContents()).join(" ");
  await page.getByRole("button", { name: "换一组题" }).click();
  await expect(page.getByTestId("pinyin-worksheet-paper")).toContainText("韵母 · ui");
  const uiQuestionsAfter = (await page.getByTestId("pinyin-print-pack").locator('[data-type="blend"], [data-type="contrast"]').allTextContents()).join(" ");
  expect(uiQuestionsAfter).not.toBe(uiQuestionsBefore);

  await page.evaluate(() => { window.print = () => undefined; });
  await page.getByRole("button", { name: "打印 / 导出当前项目" }).click();
  await expect(page.getByRole("status")).toContainText("双面打印包");

  await page.getByRole("tab", { name: /声母/ }).click();
  await page.getByRole("button", { name: "声母 b" }).click();
  await expect(page.getByTestId("pinyin-worksheet-paper")).toContainText("声母 · b");
  await expect(page.getByTestId("pinyin-worksheet-paper").locator('[data-mode="two"]')).not.toHaveCount(0);

  await page.getByRole("tab", { name: /整体认读/ }).click();
  await page.getByRole("button", { name: "整体认读 zhi" }).click();
  await expect(page.getByTestId("pinyin-print-pack").locator('[data-type="recognition"]')).toHaveCount(4);
  await expect(page.getByTestId("pinyin-print-pack").locator('[data-type="blend"]')).toHaveCount(0);

  expect(await page.evaluate(() => window.localStorage.getItem("yicheng-kids:exploration-traces:v1"))).toBeNull();
});

test("幼小拼音练习可一次导出全部 63 个项目", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/kids/pinyin-worksheet");
  const printCopies = page.getByTestId("pinyin-print-pack").locator("[data-print-copy=true]");
  await expect(printCopies).toHaveCount(2);
  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await page.getByRole("button", { name: "一键导出全部 63 项" }).click();
  await expect(page.getByRole("button", { name: /取消导出/ })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/正在生成 \d+ \/ 63/);
  await expect(printCopies).toHaveCount(2);
  await expect(page.getByTestId("pinyin-print-pack")).toHaveAttribute("data-print-mode", "single");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("一程一成长-幼小拼音练习-全部63项.pdf");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const pdf = await PDFDocument.load(await readFile(downloadPath as string));
  expect(pdf.getPageCount()).toBe(126);
  expect((await readFile(downloadPath as string)).byteLength).toBeGreaterThan(500_000);
  await expect(page.getByRole("status")).toContainText("全部 63 项已导出，共 126 页");
  await expect(page.getByTestId("pinyin-print-pack")).toHaveAttribute("data-print-mode", "single");
  await expect(printCopies).toHaveCount(2);
});

test("幼小拼音全部导出可随时取消", async ({ page }) => {
  await page.goto("/kids/pinyin-worksheet");
  await page.getByRole("button", { name: "一键导出全部 63 项" }).click();
  await page.getByRole("button", { name: /取消导出/ }).click();
  await expect(page.getByRole("status")).toContainText("已取消全部拼音导出");
  await expect(page.getByRole("button", { name: "一键导出全部 63 项" })).toBeVisible();
  await expect(page.getByTestId("pinyin-print-pack").locator("[data-print-copy=true]")).toHaveCount(2);
});

test("幼小拼音练习的 A4 打印包保留四线三格和完整分页", async ({ page }) => {
  await page.goto("/kids/pinyin-worksheet");
  await page.getByText("详细调整", { exact: true }).click();
  await page.getByRole("button", { name: "减少描红行数" }).click();
  await expect(page.getByTestId("pinyin-trace-rows")).toHaveAttribute("data-value", "1");
  await expect(page.getByTestId("pinyin-core-count")).toHaveAttribute("data-value", "2");
  await expect(page.getByTestId("pinyin-picture-count")).toHaveCount(0);
  await expect(page.getByText("2 页内容 · 2 页双面打印包", { exact: true })).toBeVisible();

  const printCopies = page.getByTestId("pinyin-print-pack").locator("[data-print-copy=true]");
  await expect(printCopies).toHaveCount(2);
  await expect(page.getByTestId("pinyin-print-pack").locator('[data-blank="true"]')).toHaveCount(0);

  const fontsReady = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.status === "loaded" && document.fonts.check("16px Andika");
  });
  expect(fontsReady).toBe(true);

  await page.emulateMedia({ media: "print" });
  const metrics = await printCopies.evaluateAll((papers) => papers.map((paper) => {
    const element = paper as HTMLElement;
    const rect = element.getBoundingClientRect();
    const body = element.querySelector<HTMLElement>("[class*=paperBody]")?.getBoundingClientRect();
    const row = element.querySelector("[data-testid=pinyin-grid-row]")?.getBoundingClientRect();
    const choice = element.querySelector<HTMLElement>("[class*=choiceDots]");
    return {
      width: rect.width,
      height: rect.height,
      leftInset: body ? body.left - rect.left : 0,
      rightInset: body ? rect.right - body.right : 0,
      rowHeight: row?.height ?? 0,
      choiceFontSize: choice ? Number.parseFloat(getComputedStyle(choice).fontSize) : 0,
      overflow: element.scrollHeight - element.clientHeight,
    };
  }));
  expect(metrics[0]?.width).toBeGreaterThanOrEqual(793);
  expect(metrics[0]?.width).toBeLessThanOrEqual(795);
  expect(metrics[0]?.height).toBeGreaterThanOrEqual(1122);
  expect(metrics[0]?.height).toBeLessThanOrEqual(1124);
  expect(metrics[0]?.leftInset).toBeGreaterThanOrEqual(60);
  expect(metrics[0]?.rightInset).toBeGreaterThanOrEqual(60);
  expect(metrics[0]?.rowHeight).toBeGreaterThan(40);
  expect(metrics[0]?.choiceFontSize).toBeGreaterThanOrEqual(18);
  expect(metrics.every((metric) => metric.overflow <= 1)).toBe(true);

  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: /标准/ }).click();
  await page.getByRole("button", { name: "增加核心练习" }).click();
  await page.getByRole("button", { name: "增加核心练习" }).click();
  await expect(page.getByText("2 页内容 · 2 页双面打印包", { exact: true })).toBeVisible();
  await expect(printCopies).toHaveCount(2);
  await expect(page.getByTestId("pinyin-print-pack").locator('[data-blank="true"]')).toHaveCount(0);

  await page.emulateMedia({ media: "print" });
  const maxContentMetrics = await printCopies.evaluateAll((papers) => papers.map((paper) => {
    const element = paper as HTMLElement;
    const paperRect = element.getBoundingClientRect();
    const bodyRect = element.querySelector<HTMLElement>("[class*=paperBody]")?.getBoundingClientRect();
    const footerRect = element.querySelector("footer")?.getBoundingClientRect();
    const sections = Array.from(element.querySelectorAll<HTMLElement>("section"));
    return {
      overflow: element.scrollHeight - element.clientHeight,
      contentInsidePaper: sections.every((section) => {
        const rect = section.getBoundingClientRect();
        return rect.left >= paperRect.left - 1
          && rect.right <= paperRect.right + 1
          && (!bodyRect || rect.bottom <= bodyRect.bottom + 1)
          && (!footerRect || rect.bottom <= footerRect.top + 1);
      }),
    };
  }));
  expect(maxContentMetrics).toHaveLength(2);
  expect(maxContentMetrics.every((metric) => metric.overflow <= 1 && metric.contentInsidePaper)).toBe(true);

  const assetSelector = "img[src*='/math-worksheet/objects/'], img[src*='/pinyin-worksheet/objects/']";
  await page.waitForFunction((selector) => Array.from(document.querySelectorAll<HTMLImageElement>(selector)).every((image) => image.complete && image.naturalWidth > 0), assetSelector);
  const assets = await page.locator(assetSelector).evaluateAll((images) => Array.from(new Map(images.map((image) => {
    const item = image as HTMLImageElement;
    return [item.getAttribute("src"), { src: item.getAttribute("src"), loaded: item.complete && item.naturalWidth > 0 }];
  })).values()));
  expect(assets.length).toBe(3);
  expect(assets.every((asset) => asset.loaded)).toBe(true);
});

test("幼小拼音练习的 63 个项目均有精确图片示例", async ({ page }) => {
  const itemGroups = [
    {
      tab: /声母/,
      labels: ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w"].map((item) => `声母 ${item}`),
    },
    {
      tab: /韵母/,
      labels: [
        ...["a", "o", "e", "i", "u", "ü"].map((item) => `单韵母 ${item}`),
        ...["ai", "ei", "ui", "ao", "ou", "iu", "ie", "üe", "er"].map((item) => `复韵母 ${item}`),
        ...["an", "en", "in", "un", "ün"].map((item) => `前鼻韵母 ${item}`),
        ...["ang", "eng", "ing", "ong"].map((item) => `后鼻韵母 ${item}`),
      ],
    },
    {
      tab: /整体认读/,
      labels: ["zhi", "chi", "shi", "ri", "zi", "ci", "si", "yi", "wu", "yu", "ye", "yue", "yuan", "yin", "yun", "ying"].map((item) => `整体认读 ${item}`),
    },
  ];

  await page.goto("/kids/pinyin-worksheet");
  for (const group of itemGroups) {
    await page.getByRole("tab", { name: group.tab }).click();
    for (const label of group.labels) {
      await page.getByRole("button", { name: label, exact: true }).click();
      const pictures = page.getByTestId("pinyin-print-pack").locator('[data-type="picture"]');
      await expect(pictures).toHaveCount(3);
      expect(new Set(await pictures.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src")))).size).toBe(3);
    }
  }
});

test("幼小拼音练习在手机视口不产生横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kids/pinyin-worksheet");
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);

  const fittedPaper = await page.getByTestId("pinyin-worksheet-paper").boundingBox();
  expect(fittedPaper?.width ?? 0).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "放大预览" }).click();
  const expandedPaper = await page.getByTestId("pinyin-worksheet-paper").boundingBox();
  expect(expandedPaper?.width ?? 0).toBeGreaterThan(390);
  await page.getByRole("button", { name: "退出放大预览" }).click();
  await expect(page.getByRole("button", { name: "打印 / 导出当前项目" })).toBeVisible();
  await expect(page.getByRole("button", { name: "一键导出全部 63 项" })).toBeVisible();
});
