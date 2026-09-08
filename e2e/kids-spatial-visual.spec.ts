import { expect, test } from "@playwright/test";
import { dragGhost, loginOrange, seedScenes } from "./spatial-helpers";

for (const [width, height] of [[360, 800], [768, 1024], [1440, 900]]) {
  test(`空间探究 ${width}x${height} 布局、实际像素与镜头`, async ({ browser }, info) => {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 800, isMobile: width === 360, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await loginOrange(page);
    await page.screenshot({ path: info.outputPath("map.png") });
    await page.getByRole("button", { name: /石阶岛/ }).click();
    await expect(page.getByLabel("观察手册")).toBeVisible();
    await page.waitForTimeout(700);
    const pixels = await page.locator("canvas").screenshot();
    const colors = await page.evaluate(async (base64) => {
      const img = new Image(); img.src = `data:image/png;base64,${base64}`; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let sky = 0, green = 0, stone = 0, cloud = 0;
      const buckets = new Set<string>();
      for (let i = 0; i < data.length; i += 64) {
        const [r, g, b] = data.slice(i, i + 3);
        buckets.add(`${r >> 4}:${g >> 4}:${b >> 4}`);
        if (b > r + 12 && g > r + 12) sky++;
        if (g > r * 1.1 && g > b * 1.1) green++;
        if (r < 140 && g < 155 && b < 140) stone++;
        if (r > 190 && g > 190 && b > 180) cloud++;
      }
      return { sky, green, stone, cloud, buckets: buckets.size };
    }, pixels.toString("base64"));
    expect(colors.buckets).toBeGreaterThan(60);
    expect(colors.sky).toBeGreaterThan(100);
    expect(colors.green).toBeGreaterThan(100);
    expect(colors.stone).toBeGreaterThan(100);
    expect(colors.cloud).toBeGreaterThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("observe.png") });
    const observationTray = page.getByTestId("spatial-block-tray-sun");
    await expect(observationTray).toBeVisible();
    await expect(observationTray).toBeDisabled();
    const choices = await page.getByLabel("猜一猜", { exact: true }).boundingBox();
    const dock = await page.getByLabel("积木托盘").boundingBox();
    expect(choices!.y + choices!.height).toBeLessThan(dock!.y);
    await page.getByLabel("猜一猜", { exact: true }).getByRole("button", { name: "一样高", exact: true }).click();
    await expect(observationTray).toBeEnabled();
    await dragGhost(page);
    await expect(page.getByLabel("指一指看到的关系", { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("observe-stacked.png") });
    const caption = await page.getByRole("button", { name: "重播引导语" }).locator("..").boundingBox();
    const board = await page.getByLabel("观察手册").boundingBox();
    expect(caption!.height).toBeLessThan(95);
    expect(caption!.y + caption!.height).toBeLessThanOrEqual(board!.y);
    await seedScenes(page, 1);
    await page.goto("/kids/spatial-blocks?challenge=stone-steps&scene=guided-build");
    await expect(page.getByLabel("积木托盘")).toBeVisible();
    await page.waitForTimeout(700);
    const before = await page.locator("canvas").screenshot();
    await page.getByRole("button", { name: "顶部观察图" }).click();
    await page.waitForTimeout(350);
    expect((await page.locator("canvas").screenshot()).equals(before)).toBe(false);
    await page.getByRole("button", { name: "正面观察图" }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: info.outputPath("guided.png") });
    const handbook = await page.getByLabel("观察手册").boundingBox();
    const tray = await page.getByLabel("积木托盘").boundingBox();
    expect(handbook!.y + handbook!.height).toBeLessThan(tray!.y);
    await page.getByRole("link", { name: "返回一程一成长" }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("静音偏好、重播与 45 秒一级提示", async ({ page }) => {
  await loginOrange(page);
  await page.getByRole("button", { name: "关闭声音" }).click();
  await page.getByRole("button", { name: /石阶岛/ }).click();
  await page.getByRole("button", { name: "重播引导语" }).click();
  expect(await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await page.clock.install();
  await page.clock.fastForward(46000);
  await expect(page.getByText("转到观察板亮着的方向看看。", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "打开声音" })).toBeVisible();
});
