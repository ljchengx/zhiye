import { expect, test } from "@playwright/test";

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

test("一程一成长主页只展示真实工具并提供独立入口", async ({ page }) => {
  await page.goto("/kids");

  await expect(page).toHaveTitle("一程一成长 - 陪孩子走好成长的每一步");
  await expect(page.getByRole("heading", { name: "陪孩子走好成长的每一步", level: 1 })).toBeVisible();
  await expect(page.getByText("1 个可用工具", { exact: true })).toBeVisible();
  await expect(page.getByAltText("一程一成长微信公众号二维码")).toBeVisible();
  await expect(page.getByRole("link", { name: "开始使用" })).toHaveAttribute("href", "/kids/math-worksheet");
  await expect(page.getByText("敬请期待", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "一程一成长首页" })).toHaveAttribute("href", "/kids");

  const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
  expect(structuredData).toContain("https://www.yzfl.top/kids/math-worksheet");
});

test("幼小数学练习使用 5 天基础加 25 天强化，并按天配对双面打印", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/kids/math-worksheet");

  const paper = page.getByTestId("math-worksheet-paper");
  await expect(page.getByTestId("worksheet-print-summary")).toHaveText(/^\d+ 页内容 \/ 60 页双面打印包$/);
  await expect(page.getByTestId("worksheet-print-pack").locator("[data-print-copy=true]")).toHaveCount(60);

  await expect(paper).toHaveAttribute("data-day", "1");
  await expect(paper).toHaveAttribute("data-page-count", "1");
  await expect(paper.getByTestId("worksheet-demo")).toBeVisible();
  await expect(paper.locator("[data-type=number-bond]")).toHaveCount(20);
  const pictureBond = paper.locator('[data-type="number-bond"][data-mode="picture-split"]').first();
  await expect(pictureBond.locator("img")).toHaveCount(5);
  await expect(pictureBond).toContainText("+");
  await expect(paper.locator("[data-type=neighbor]")).toHaveCount(4);
  await expect(paper.locator("[data-type=compare]")).toHaveCount(4);

  await expect(paper.getByTestId("math-worksheet-question")).toHaveCount(28);

  await page.getByTestId("worksheet-day-2").click();
  await expect(paper.getByTestId("worksheet-demo")).toBeVisible();
  await expect(paper.locator("[data-display=guided]")).toHaveCount(2);
  await expect(paper.getByTestId("math-worksheet-question")).toHaveCount(28);

  await page.getByTestId("worksheet-day-5").click();
  await expect(paper).toHaveAttribute("data-page-count", "2");
  await expect(paper.getByTestId("worksheet-demo")).toBeVisible();
  await expect(page.getByRole("tab", { name: "第 2 页" })).toBeVisible();

  await page.getByTestId("worksheet-day-6").click();
  await expect(paper).toHaveAttribute("data-page-count", "2");
  await expect(paper.getByTestId("worksheet-demo")).toHaveCount(0);
  const daySixQuestionCount = await page.getByTestId("worksheet-print-pack").locator('[data-print-copy=true][data-day="6"] [data-testid="math-worksheet-question"]').count();
  expect(daySixQuestionCount).toBe(30);

  await page.getByTestId("worksheet-day-15").click();
  await expect(paper).toHaveAttribute("data-page-count", "2");
  await expect(paper.getByTestId("worksheet-demo")).toHaveCount(0);

  await page.getByTestId("worksheet-day-21").click();
  await expect(paper).toHaveAttribute("data-page-count", "2");
  await expect(paper.getByTestId("worksheet-demo")).toHaveCount(0);
  await expect(page.getByTestId("worksheet-print-pack").locator('[data-print-copy=true][data-day="21"] [data-level=three-number]')).not.toHaveCount(0);

  await page.getByTestId("worksheet-day-30").click();
  await expect(paper).toHaveAttribute("data-page-count", "2");
  await expect(paper.locator("[data-level=three-number]")).not.toHaveCount(0);

  const printOrder = await page.getByTestId("worksheet-print-pack").locator("[data-print-copy=true]").evaluateAll((papers) => (
    papers.map((item) => ({
      day: Number(item.getAttribute("data-day")),
      page: item.getAttribute("data-page"),
      side: item.getAttribute("data-print-side"),
      blank: item.getAttribute("data-blank") === "true",
    }))
  ));
  expect(printOrder).toHaveLength(60);
  for (let day = 1; day <= 30; day += 1) {
    const [front, back] = printOrder.slice((day - 1) * 2, day * 2);
    expect(front.day).toBe(day);
    expect(front.page).toBe("1");
    expect(front.side).toBe("front");
    expect(front.blank).toBe(false);
    expect(back.day).toBe(day);
    expect(back.side).toBe("back");
    expect(back.blank ? back.page === null : back.page === "2").toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test("基础五天的数量图、原式和拆分步骤保持同一数学语义", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/kids/math-worksheet");

  for (let day = 1; day <= 5; day += 1) {
    await page.getByTestId(`worksheet-day-${day}`).click();
    const demo = page.getByTestId("math-worksheet-paper").getByTestId("worksheet-demo");
    const model = await demo.evaluate((element) => {
      const number = (name: string) => Number(element.getAttribute(name));
      const groups = Array.from(element.querySelectorAll<HTMLElement>("[data-count-role]"), (group) => ({
        role: group.dataset.countRole,
        count: Number(group.dataset.count),
      }));
      const operator = element.querySelector("[class*=methodGroup] > b, [class*=methodSimpleFlow] > b")?.textContent?.trim();
      return {
        method: element.getAttribute("data-method"),
        left: number("data-original-left"),
        operator: element.getAttribute("data-original-operator"),
        visibleOperator: operator,
        right: number("data-original-right"),
        answer: number("data-original-answer"),
        splitSource: element.hasAttribute("data-split-source") ? number("data-split-source") : null,
        split: element.getAttribute("data-split-parts")?.split(",").map(Number) ?? [],
        groups,
      };
    });

    const expectedAnswer = model.operator === "+" ? model.left + model.right : model.left - model.right;
    expect(model.answer).toBe(expectedAnswer);
    expect(model.visibleOperator).toBe(model.operator);
    expect(model.groups.find((group) => group.role === "left-operand")?.count).toBe(model.left);
    expect(model.groups.find((group) => group.role === "right-operand")?.count).toBe(model.right);
    if (model.splitSource !== null) expect(model.split.reduce((sum, value) => sum + value, 0)).toBe(model.splitSource);
    if (model.method === "break-ten") expect([model.left, model.operator, model.right]).toEqual([13, "-", 5]);
  }

  const printPack = page.getByTestId("worksheet-print-pack");
  const numberBonds = await printPack.locator('[data-print-copy=true][data-day="1"] [data-type="number-bond"]').evaluateAll((questions) => questions.map((question) => ({
    whole: Number(question.getAttribute("data-whole")),
    known: Number(question.getAttribute("data-known-part")),
    answer: Number(question.getAttribute("data-answer")),
    shownParts: Array.from(question.querySelectorAll<HTMLElement>("[data-count-role]"), (group) => ({ role: group.dataset.countRole, count: Number(group.dataset.count) })),
  })));
  expect(numberBonds).toHaveLength(20);
  numberBonds.forEach((question) => {
    expect(question.known + question.answer).toBe(question.whole);
    if (question.shownParts.length > 0) {
      expect(question.shownParts.find((part) => part.role === "known-part")?.count).toBe(question.known);
      expect(question.shownParts.find((part) => part.role === "missing-part")?.count).toBe(question.answer);
    }
  });

  await page.getByTestId("worksheet-day-1").click();
  const pictureBondLayout = await page.getByTestId("math-worksheet-paper").locator('[data-type="number-bond"][data-mode="picture-split"]').evaluateAll((questions) => questions.map((question) => {
    const questionRect = question.getBoundingClientRect();
    const number = question.children[0].getBoundingClientRect();
    const content = question.children[1];
    const groups = content.children[0];
    const answerRow = content.children[1];
    const leftGroup = groups.children[0].getBoundingClientRect();
    const plus = groups.children[1].getBoundingClientRect();
    const rightGroup = groups.children[2].getBoundingClientRect();
    const formula = answerRow.children[0].getBoundingClientRect();
    const answerLine = answerRow.children[1].getBoundingClientRect();
    return {
      numberGap: leftGroup.left - number.right,
      leftToPlus: plus.left - leftGroup.right,
      plusToRight: rightGroup.left - plus.right,
      rowGap: formula.top - Math.max(leftGroup.bottom, plus.bottom, rightGroup.bottom),
      formulaToAnswer: answerLine.left - formula.right,
      insideQuestion: leftGroup.left >= questionRect.left && rightGroup.right <= questionRect.right && answerLine.right <= questionRect.right,
    };
  }));
  expect(pictureBondLayout).toHaveLength(4);
  pictureBondLayout.forEach((layout) => {
    expect(layout.numberGap).toBeGreaterThanOrEqual(2);
    expect(layout.leftToPlus).toBeGreaterThanOrEqual(2);
    expect(layout.plusToRight).toBeGreaterThanOrEqual(2);
    expect(layout.rowGap).toBeGreaterThanOrEqual(2);
    expect(layout.formulaToAnswer).toBeGreaterThanOrEqual(2);
    expect(layout.insideQuestion).toBe(true);
  });

  const composeLayout = await page.getByTestId("math-worksheet-paper").locator('[data-type="number-bond"][data-mode="compose"]').evaluateAll((questions) => questions.map((question) => {
    const questionRect = question.getBoundingClientRect();
    const formula = question.children[1];
    const formulaRange = document.createRange();
    formulaRange.selectNodeContents(formula);
    const answerLine = question.querySelector('[aria-hidden="true"]')?.getBoundingClientRect();
    const target = question.children[3]?.getBoundingClientRect();
    return {
      answerOffset: answerLine ? answerLine.left - questionRect.left : -1,
      answerWidth: answerLine?.width ?? -1,
      formulaGap: answerLine ? answerLine.left - formulaRange.getBoundingClientRect().right : -1,
      targetOffset: target ? target.left - questionRect.left : -1,
      targetWidth: target?.width ?? -1,
    };
  }));
  expect(composeLayout).toHaveLength(8);
  for (const key of ["answerOffset", "answerWidth", "targetOffset", "targetWidth"] as const) {
    const values = composeLayout.map((layout) => layout[key]);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  }
  expect(composeLayout.every((layout) => layout.formulaGap >= 3 && layout.formulaGap <= 6)).toBe(true);

  const splitLayout = await page.getByTestId("math-worksheet-paper").locator('[data-type="number-bond"][data-mode="split"]').evaluateAll((questions) => questions.map((question) => {
    const questionRect = question.getBoundingClientRect();
    const formula = question.children[1];
    const formulaRange = document.createRange();
    formulaRange.selectNodeContents(formula);
    const answerLine = question.querySelector('[aria-hidden="true"]')?.getBoundingClientRect();
    return {
      answerOffset: answerLine ? answerLine.left - questionRect.left : -1,
      formulaGap: answerLine ? answerLine.left - formulaRange.getBoundingClientRect().right : -1,
    };
  }));
  expect(splitLayout).toHaveLength(8);
  expect(Math.max(...splitLayout.map((layout) => layout.answerOffset)) - Math.min(...splitLayout.map((layout) => layout.answerOffset))).toBeLessThanOrEqual(1);
  expect(splitLayout.every((layout) => layout.formulaGap >= 3 && layout.formulaGap <= 6)).toBe(true);

  const pictureEquations = await printPack.locator('[data-print-copy=true][data-day="5"] [data-type="picture-equation"]').evaluateAll((questions) => questions.map((question) => ({
    left: Number(question.getAttribute("data-left-count")),
    operator: question.getAttribute("data-operator"),
    right: Number(question.getAttribute("data-right-count")),
    answer: Number(question.getAttribute("data-answer")),
    shown: Array.from(question.querySelectorAll<HTMLElement>("[data-count-role]"), (group) => ({ role: group.dataset.countRole, count: Number(group.dataset.count) })),
  })));
  expect(pictureEquations).toHaveLength(6);
  pictureEquations.forEach((question) => {
    expect(question.operator === "+" ? question.left + question.right : question.left - question.right).toBe(question.answer);
    expect(question.shown.find((part) => part.role === "left-operand")?.count).toBe(question.left);
    expect(question.shown.find((part) => part.role === "right-operand")?.count).toBe(question.right);
  });

  await page.getByTestId("worksheet-day-5").click();
  const pictureEquationLayout = await page.getByTestId("math-worksheet-paper").locator('[data-type="picture-equation"]').evaluateAll((questions) => questions.map((question) => {
    const questionRect = question.getBoundingClientRect();
    const number = question.children[0].getBoundingClientRect();
    const content = question.children[1];
    const visual = content.children[0];
    const answerLine = content.children[1].getBoundingClientRect();
    const leftGroup = visual.children[0].getBoundingClientRect();
    const operator = visual.children[1].getBoundingClientRect();
    const rightGroup = visual.children[2].getBoundingClientRect();
    return {
      numberGap: leftGroup.left - number.right,
      leftToOperator: operator.left - leftGroup.right,
      operatorToRight: rightGroup.left - operator.right,
      rowGap: answerLine.top - Math.max(leftGroup.bottom, operator.bottom, rightGroup.bottom),
      insideQuestion: leftGroup.left >= questionRect.left && rightGroup.right <= questionRect.right && answerLine.left >= questionRect.left && answerLine.right <= questionRect.right,
      hasPrefilledEquation: question.textContent?.includes("=") ?? false,
    };
  }));
  expect(pictureEquationLayout).toHaveLength(6);
  pictureEquationLayout.forEach((layout) => {
    expect(layout.numberGap).toBeGreaterThanOrEqual(2);
    expect(layout.leftToOperator).toBeGreaterThanOrEqual(2);
    expect(layout.operatorToRight).toBeGreaterThanOrEqual(2);
    expect(layout.rowGap).toBeGreaterThanOrEqual(2);
    expect(layout.insideQuestion).toBe(true);
    expect(layout.hasPrefilledEquation).toBe(false);
  });

  const guidedQuestions = await printPack.locator('[data-print-copy=true][data-day="2"], [data-print-copy=true][data-day="3"], [data-print-copy=true][data-day="4"]').locator('[data-display="guided"]').evaluateAll((questions) => questions.map((question) => ({
    left: Number(question.getAttribute("data-original-left")),
    operator: question.getAttribute("data-original-operator"),
    right: Number(question.getAttribute("data-original-right")),
    answer: Number(question.getAttribute("data-original-answer")),
    splitSource: Number(question.getAttribute("data-split-source")),
    split: question.getAttribute("data-split-parts")?.split(",").map(Number) ?? [],
    shown: Array.from(question.querySelectorAll<HTMLElement>("[data-count-role]"), (group) => ({ role: group.dataset.countRole, count: Number(group.dataset.count) })),
  })));
  expect(guidedQuestions).toHaveLength(6);
  guidedQuestions.forEach((question) => {
    expect(question.operator === "+" ? question.left + question.right : question.left - question.right).toBe(question.answer);
    expect(question.split.reduce((sum, value) => sum + value, 0)).toBe(question.splitSource);
    expect(question.shown.find((part) => part.role === "left-operand")?.count).toBe(question.left);
    expect(question.shown.find((part) => part.role === "right-operand")?.count).toBe(question.right);
  });
});

test("幼小数学练习的题目网格和 A4 内容边界保持稳定", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/kids/math-worksheet");
  await page.getByTestId("worksheet-day-17").click();

  const paper = page.getByTestId("math-worksheet-paper");
  const metrics = await paper.evaluate((element) => {
    const gridMetrics = Array.from(element.querySelectorAll("[data-testid=worksheet-mental-section], [data-testid=worksheet-number-sense], section:has([data-type=application])")).map((section) => {
      const questions = Array.from(section.querySelectorAll("[data-testid=math-worksheet-question]"));
      const lines = questions.map((question) => question.querySelector("[aria-hidden=true]")?.getBoundingClientRect()).filter((rect): rect is DOMRect => Boolean(rect));
      const widthsByType = new Map<string, number[]>();
      questions.forEach((question, index) => {
        const line = lines[index];
        if (!line) return;
        const type = question.getAttribute("data-type") ?? "unknown";
        widthsByType.set(type, [...(widthsByType.get(type) ?? []), Math.round(line.width)]);
      });
      return { count: questions.length, widthGroups: Array.from(widthsByType.values()) };
    });
    const alignmentGroups = new Map<string, number[]>();
    const alignmentIndexes = new Map<string, number>();
    const mentalGaps: number[] = [];
    const complexAnswerOffsets: number[] = [];
    Array.from(element.querySelectorAll("[data-testid=worksheet-number-sense], [data-testid=worksheet-mental-section]")).forEach((section) => {
      const columns = Number(section.getAttribute("data-columns")) || 2;
      Array.from(section.querySelectorAll("[data-testid=math-worksheet-question]")).forEach((question) => {
        const type = question.getAttribute("data-type") ?? "unknown";
        const level = question.getAttribute("data-level");
        const layoutGroup = type === "mental" ? level === "three-number" ? "three-number" : level === "two-digit" ? "two-digit" : "short" : type;
        const itemIndex = alignmentIndexes.get(layoutGroup) ?? 0;
        alignmentIndexes.set(layoutGroup, itemIndex + 1);
        const line = question.querySelector("[aria-hidden=true]")?.getBoundingClientRect();
        if (!line) return;
        const key = `${layoutGroup}-${columns}-${itemIndex % columns}`;
        alignmentGroups.set(key, [...(alignmentGroups.get(key) ?? []), line.left]);
        const expression = question.querySelector("[class*=expression]");
        if (expression) {
          const range = document.createRange();
          range.selectNodeContents(expression);
          mentalGaps.push(line.left - range.getBoundingClientRect().right);
          if (columns === 2) complexAnswerOffsets.push(line.left - question.getBoundingClientRect().left);
        }
      });
    });
    const body = element.querySelector("[data-testid=worksheet-paper-body]")?.getBoundingClientRect();
    const footer = element.querySelector("[data-testid=worksheet-paper-footer]")?.getBoundingClientRect();
    const questions = Array.from(element.querySelectorAll("[data-testid=math-worksheet-question]"));
    return {
      grids: gridMetrics,
      alignmentGroups: Array.from(alignmentGroups.values()),
      mentalGaps,
      complexAnswerOffsets,
      overflow: (element as HTMLElement).scrollHeight - (element as HTMLElement).clientHeight,
      bodyBottom: body?.bottom ?? 0,
      footerTop: footer?.top ?? 0,
      questionBottom: Math.max(...questions.map((question) => question.getBoundingClientRect().bottom)),
    };
  });

  expect(metrics.grids.length).toBeGreaterThan(0);
  for (const grid of metrics.grids) {
    expect(grid.count).toBeGreaterThan(0);
    for (const widths of grid.widthGroups) expect(new Set(widths).size).toBe(1);
  }
  for (const positions of metrics.alignmentGroups) expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1);
  expect(Math.max(...metrics.mentalGaps)).toBeLessThanOrEqual(40);
  expect(Math.max(...metrics.complexAnswerOffsets) - Math.min(...metrics.complexAnswerOffsets)).toBeLessThanOrEqual(1);
  expect(metrics.overflow).toBeLessThanOrEqual(0);
  expect(metrics.questionBottom).toBeLessThanOrEqual(metrics.bodyBottom + 1);
  expect(metrics.bodyBottom).toBeLessThanOrEqual(metrics.footerTop + 1);
});

test("强化训练配置支持应用题 0% 到 25%，并可只导出强化阶段", async ({ page }) => {
  await page.goto("/kids/math-worksheet");

  const includeFoundation = page.getByRole("checkbox", { name: "包含 5 天基础学习" });
  await includeFoundation.uncheck();
  await expect(page.getByRole("button", { name: "导出 25 天 PDF" })).toBeVisible();
  await expect(page.getByTestId("worksheet-print-pack").locator("[data-print-copy=true]")).toHaveCount(50);
  await expect(page.getByTestId("worksheet-print-summary")).toHaveText("50 页内容 / 50 页双面打印包");

  const applicationRatio = page.getByRole("spinbutton", { name: "应用题占比" });
  await applicationRatio.fill("0");
  await page.getByTestId("worksheet-day-6").click();
  await expect(page.getByTestId("worksheet-print-pack").locator('[data-print-copy=true][data-day="6"] [data-type=application]')).toHaveCount(0);

  await applicationRatio.fill("25");
  const applicationCounts = await page.getByTestId("worksheet-print-pack").locator("[data-print-copy=true]").evaluateAll((papers) => (
    [6, 25].map((day) => papers.filter((paper) => paper.getAttribute("data-day") === String(day)).reduce((sum, paper) => sum + paper.querySelectorAll("[data-type=application]").length, 0))
  ));
  expect(applicationCounts[0]).toBeGreaterThan(0);
  expect(applicationCounts[1]).toBeGreaterThan(0);
  expect(applicationCounts.every((count) => count <= 8)).toBe(true);

  const applicationLayouts = await page.getByTestId("worksheet-print-pack").locator('section:has([data-type="application"])').evaluateAll((sections) => sections.map((section) => {
    const grid = section.querySelector<HTMLElement>("[class*=applicationGrid]");
    const questions = Array.from(section.querySelectorAll<HTMLElement>('[data-type="application"]'));
    const gridRect = grid?.getBoundingClientRect();
    return {
      columns: section.getAttribute("data-columns"),
      fullWidth: questions.every((question) => !gridRect || Math.abs(question.getBoundingClientRect().width - gridRect.width) <= 1),
      hasContextIcon: questions.every((question) => Boolean(question.querySelector("img"))),
    };
  }));
  expect(applicationLayouts.length).toBeGreaterThan(0);
  expect(applicationLayouts.every((layout) => layout.columns === "1" && layout.fullWidth && layout.hasContextIcon)).toBe(true);

  const application = page.getByTestId("worksheet-print-pack").locator('[data-print-copy=true][data-day="6"] [data-type=application]').first();
  await expect(application).not.toContainText("列式");
  await expect(application).not.toContainText("答");
  const writingSpace = application.getByTestId("application-writing-space");
  await expect(writingSpace).toBeAttached();
  await expect(writingSpace).toHaveText("");
  await expect(writingSpace).toHaveCSS("border-top-style", "none");
  await expect(writingSpace).toHaveCSS("border-bottom-style", "none");
  await expect(application).toHaveCSS("border-bottom-style", "none");
  await expect(application.locator("strong")).toHaveCount(0);

  const before = await page.getByTestId("worksheet-print-pack").locator('[data-print-copy=true][data-day="6"] [data-type=application]').first().textContent();
  await page.getByRole("button", { name: "本日换一套" }).click();
  await expect(page.getByRole("status")).toContainText("已换一套题目");
  const after = await page.getByTestId("worksheet-print-pack").locator('[data-print-copy=true][data-day="6"] [data-type=application]').first().textContent();
  expect(after).not.toBe(before);
});

test("幼小数学练习在移动端可完整缩放预览", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kids/math-worksheet");
  await page.getByTestId("worksheet-day-2").click();

  const paperBox = await page.getByTestId("math-worksheet-paper").boundingBox();
  const canvasBox = await page.getByTestId("math-worksheet-paper").locator("..").boundingBox();
  expect(paperBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(paperBox!.width).toBeLessThanOrEqual(canvasBox!.width + 1);
  const boundaries = await page.getByTestId("math-worksheet-paper").evaluate((paper) => {
    const body = paper.querySelector("[data-testid=worksheet-paper-body]")?.getBoundingClientRect();
    const questions = Array.from(paper.querySelectorAll("[data-testid=math-worksheet-question]"));
    return {
      bodyBottom: body?.bottom ?? 0,
      questionBottom: Math.max(...questions.map((question) => question.getBoundingClientRect().bottom)),
    };
  });
  expect(boundaries.questionBottom).toBeLessThanOrEqual(boundaries.bodyBottom + 1);

  await page.getByRole("button", { name: "放大预览" }).click();
  const expandedBox = await page.getByTestId("math-worksheet-paper").boundingBox();
  expect(expandedBox?.width ?? 0).toBeGreaterThan(390);
  await page.getByRole("button", { name: "退出放大预览" }).click();
  await expect(page.getByRole("button", { name: "导出 30 天 PDF" })).toBeVisible();
});

test("幼小数学练习的桌面 A4 预览不产生滚动条", async ({ page }) => {
  for (const width of [1440, 1280, 1200]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/kids/math-worksheet");
    const metrics = await page.getByTestId("math-worksheet-paper").evaluate((paper) => {
      const canvas = paper.parentElement;
      const paperRect = paper.getBoundingClientRect();
      return {
        paperWidth: paperRect.width,
        canvasWidth: canvas?.clientWidth ?? 0,
        canvasScrollWidth: canvas?.scrollWidth ?? 0,
      };
    });
    expect(metrics.paperWidth).toBeLessThanOrEqual(metrics.canvasWidth + 1);
    expect(metrics.canvasScrollWidth).toBeLessThanOrEqual(metrics.canvasWidth + 1);
  }
});

test("幼小数学练习打印包保持 A4 边界且素材全部加载", async ({ page }) => {
  await page.goto("/kids/math-worksheet");

  const assets = await page.locator("img[src*='/math-worksheet/objects/']").evaluateAll((images) => (
    Array.from(new Map(images.map((image) => {
      const item = image as HTMLImageElement;
      return [item.getAttribute("src"), { src: item.getAttribute("src"), loaded: item.complete && item.naturalWidth > 0 }];
    })).values())
  ));
  for (const name of ["apple", "pineapple", "heart", "star", "fish", "mushroom", "coin", "flower", "block", "ball", "book", "cookie", "balloon", "ten-frame", "ten-rod", "one-stick"]) {
    expect(assets.find((asset) => asset.src?.endsWith(name + ".svg"))?.loaded).toBe(true);
  }

  await page.emulateMedia({ media: "print" });
  const metrics = await page.getByTestId("worksheet-print-pack").locator("[data-print-copy=true]").evaluateAll((papers) => (
    papers.map((paper) => {
      const rect = paper.getBoundingClientRect();
      const footer = paper.querySelector("footer")?.getBoundingClientRect();
      const questions = Array.from(paper.querySelectorAll("[data-testid=math-worksheet-question]"));
      const applicationSections = Array.from(paper.querySelectorAll('section:has([data-type="application"])'));
      const applicationSingleColumn = applicationSections.every((section) => {
        const grid = section.querySelector<HTMLElement>("[class*=applicationGrid]");
        const gridRect = grid?.getBoundingClientRect();
        return section.getAttribute("data-columns") === "1" && Array.from(section.querySelectorAll<HTMLElement>('[data-type="application"]')).every((question) => !gridRect || Math.abs(question.getBoundingClientRect().width - gridRect.width) <= 1);
      });
      const complexQuestions = Array.from(paper.querySelectorAll('[data-testid="worksheet-mental-section"][data-columns="2"] [data-type="mental"]'));
      const complexAnswerOffsets = complexQuestions.map((question) => {
        const line = question.querySelector("[aria-hidden=true]")?.getBoundingClientRect();
        return line ? line.left - question.getBoundingClientRect().left : 0;
      });
      const complexWritingGaps = complexQuestions.map((question) => {
        const line = question.querySelector("[aria-hidden=true]")?.getBoundingClientRect();
        const expression = question.querySelector("[class*=expression]")?.getBoundingClientRect();
        return line && expression ? line.left - expression.right : 0;
      });
      const slotOffsetGroups = Array.from({ length: 6 }, (_, slotIndex) => complexQuestions.map((question) => {
        const expression = question.querySelector("[class*=expression]");
        const slot = expression?.querySelectorAll<HTMLElement>("[data-slot]")[slotIndex];
        return slot ? slot.getBoundingClientRect().left - question.getBoundingClientRect().left : 0;
      }));
      const complexSlotDrift = Math.max(0, ...slotOffsetGroups.map((offsets) => offsets.length > 1 ? Math.max(...offsets) - Math.min(...offsets) : 0));
      const uncenteredTerms = complexQuestions.some((question) => Array.from(question.querySelectorAll<HTMLElement>('[data-slot$="term"]')).some((slot) => getComputedStyle(slot).textAlign !== "center"));
      const operatorCenterDrift = Math.max(0, ...complexQuestions.flatMap((question) => {
        const expression = question.querySelector<HTMLElement>("[data-term-count]");
        if (!expression) return [Number.POSITIVE_INFINITY];
        const slots = Array.from(expression.querySelectorAll<HTMLElement>("[data-slot]"));
        const center = (slot: HTMLElement) => {
          const slotRect = slot.getBoundingClientRect();
          return slotRect.left + slotRect.width / 2;
        };
        const drifts = [Math.abs(center(slots[1]) - (center(slots[0]) + center(slots[2])) / 2)];
        if (expression.dataset.termCount === "3") drifts.push(Math.abs(center(slots[3]) - (center(slots[2]) + center(slots[4])) / 2));
        return drifts;
      }));
      const invalidEmptySlots = complexQuestions.some((question) => {
        const expression = question.querySelector<HTMLElement>("[data-term-count]");
        if (!expression) return true;
        const secondOperator = expression.querySelector<HTMLElement>('[data-slot="second-operator"]');
        const thirdTerm = expression.querySelector<HTMLElement>('[data-slot="third-term"]');
        return expression.dataset.termCount === "2"
          ? Boolean(secondOperator?.textContent || thirdTerm?.textContent)
          : !secondOperator?.textContent || !thirdTerm?.textContent;
      });
      return {
        width: rect.width,
        height: rect.height,
        overflow: (paper as HTMLElement).scrollHeight - (paper as HTMLElement).clientHeight,
        complexAnswerDrift: complexAnswerOffsets.length > 1 ? Math.max(...complexAnswerOffsets) - Math.min(...complexAnswerOffsets) : 0,
        complexWritingGaps,
        complexSlotDrift,
        operatorCenterDrift,
        uncenteredTerms,
        applicationSingleColumn,
        invalidEmptySlots,
        questionOverflow: questions.some((question) => {
          const questionRect = question.getBoundingClientRect();
          return questionRect.left < rect.left - 0.5
            || questionRect.right > rect.right + 0.5
            || (footer ? questionRect.bottom > footer.top + 0.5 : false);
        }),
      };
    })
  ));

  expect(metrics).toHaveLength(60);
  expect(metrics.every(({ width, height, overflow, questionOverflow, complexAnswerDrift, complexWritingGaps, complexSlotDrift, operatorCenterDrift, uncenteredTerms, applicationSingleColumn, invalidEmptySlots }) => (
    width >= 793 && width <= 795
    && height >= 1122 && height <= 1124
    && overflow <= 0
    && complexAnswerDrift <= 1
    && complexWritingGaps.every((gap) => gap >= 4 && gap <= 8)
    && complexSlotDrift <= 1
    && operatorCenterDrift <= 1
    && !uncenteredTerms
    && applicationSingleColumn
    && !invalidEmptySlots
    && !questionOverflow
  ))).toBe(true);
});
