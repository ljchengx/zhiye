import { expect, test } from "@playwright/test";
import { loginOrange, discoverSteps, dragGhost, dragTo, projectTop, seedScenes } from "./spatial-helpers";

test("第二块叠加取消后可在同一落点重试，缩放后仍能放下", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginOrange(page);
  await page.getByRole("button", { name: /石阶岛/ }).click();
  await page.getByLabel("猜一猜", { exact: true }).getByRole("button", { name: "一样高", exact: true }).click();
  await dragGhost(page);
  await page.getByLabel("指一指看到的关系", { exact: true }).getByRole("button", { name: "一样高", exact: true }).click();
  await page.getByLabel("猜一猜", { exact: true }).getByRole("button", { name: "左边高", exact: true }).click();
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, -140);
  await page.waitForTimeout(700);
  const tray = await page.getByTestId("spatial-block-tray-sun").boundingBox();
  const target = await page.getByRole("button", { name: "放在发亮的位置", exact: true }).boundingBox();
  for (const cancel of [true, false]) {
    await page.mouse.move(tray!.x + tray!.width / 2, tray!.y + tray!.height / 2);
    await page.mouse.down();
    await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2);
    await expect(page.getByText("可以放在这里", { exact: true })).toBeVisible();
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up();
    if (cancel) await expect(page.getByText("还需 1 块", { exact: true })).toBeVisible();
  }
  await expect(page.getByLabel("指一指看到的关系", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/second-block-stacked.png" });
});

test("游客只能观看演示且不留下足迹", async ({ page }) => {
  await page.goto("/kids/spatial-blocks");
  await expect(page.getByRole("link", { name: "登录后动手搭建" })).toBeVisible();
  await expect(page.getByLabel("积木托盘")).toHaveCount(0);
  await expect(page.locator("canvas")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("yicheng-kids:exploration-traces:v1"))).toBeNull();
});

test("真实指针完成石阶岛三幕、刷新续玩、解锁和清除", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginOrange(page);
  await page.getByRole("button", { name: /石阶岛/ }).click();
  await discoverSteps(page);
  await page.getByRole("button", { name: "继续下一幕" }).click();
  for (const remaining of [2, 1, 0]) {
    await dragGhost(page);
    if (remaining) await expect(page.getByText(`还缺 ${remaining} 块`, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "我指给小山雀看了" }).click();
  await expect(page.getByRole("heading", { name: "石阶旁开出野花" })).toBeVisible();
  await page.getByRole("button", { name: "继续下一幕" }).click();
  await page.reload();
  await expect(page.getByLabel("观察手册")).toBeVisible();
  await page.getByRole("button", { name: "顶部观察图" }).click();
  await page.waitForTimeout(1100);
  // Add a legal, incorrect block. Comparison must not expose a 3D solution.
  const extra = await projectTop(page, 2, 0, .1);
  await dragTo(page, extra);
  await page.getByRole("button", { name: "对照一下", exact: true }).click();
  await expect(page.getByLabel("形状有不同").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "放在发亮的位置" })).toHaveCount(0);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await dragTo(page, await projectTop(page, -1, 0, 1));
  await dragTo(page, await projectTop(page, -1, 0, 2));
  await dragTo(page, await projectTop(page, 0, 0, 1));
  await page.getByRole("button", { name: "我指给小山雀看了" }).click();
  await expect(page.getByRole("heading", { name: "终点旗帜升起了" })).toBeVisible();
  await page.getByRole("button", { name: "回到群岛", exact: true }).click();
  await expect(page.getByRole("button", { name: /小桥岛/ })).toBeEnabled();
  await expect(page.getByText("1 / 4 座岛已点亮")).toBeVisible();
  const traces = await page.evaluate(() => JSON.parse(localStorage.getItem("yicheng-kids:exploration-traces:v1")!).traces);
  expect(Object.fromEntries(traces.map((t: { challengeId: string; attempts: number }) => [t.challengeId, t.attempts]))).toEqual({
    "journey-v1:stone-steps:observe": 1, "journey-v1:stone-steps:guided-build": 1, "journey-v1:stone-steps:independent-check": 2,
  });
  await page.goto("/kids");
  await expect(page.getByText("1 座岛", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "继续两岸之间" }).click();
  await page.getByRole("button", { name: "家长设置" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "清除空间积木足迹" }).click();
  await expect(page.getByText("0 / 4 座岛已点亮")).toBeVisible();
});

test("取消拖拽、场景外释放与移动撤销不会写完成状态", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginOrange(page); await seedScenes(page, 1);
  await page.goto("/kids/spatial-blocks?challenge=stone-steps&scene=guided-build");
  await dragGhost(page);
  await page.getByRole("button", { name: "顶部观察图" }).click();
  await page.waitForTimeout(1000);
  const from = await projectTop(page, 0, 0, 2);
  const to = await projectTop(page, 1, 0, 1);
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 20 }); await page.waitForTimeout(150); await page.mouse.up();
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(page.getByText("还缺 2 块", { exact: true })).toBeVisible();
  const tray = page.getByTestId("spatial-block-tray-sun");
  await tray.click(); await page.keyboard.press("Escape");
  await expect(page.getByText("还缺 2 块", { exact: true })).toBeVisible();
  await dragTo(page, { x: 20, y: 20 });
  await expect(page.getByText("还缺 2 块", { exact: true })).toBeVisible();
});

test("手机发现与搭建模式可用，转动模式不放置", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await loginOrange(page);
  await page.getByRole("button", { name: /石阶岛/ }).click();
  await discoverSteps(page);
  await page.getByRole("button", { name: "继续下一幕" }).click();
  await page.getByRole("button", { name: "转动", exact: true }).click();
  await page.getByTestId("spatial-block-tray-sun").tap();
  await expect(page.getByText("还缺 3 块", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "搭建", exact: true }).click();
  await page.getByTestId("spatial-block-tray-sun").tap();
  await page.getByRole("button", { name: "放在发亮的位置" }).tap();
  await expect(page.getByText("还缺 2 块", { exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  const trayBox = await page.getByTestId("spatial-block-tray-sun").boundingBox();
  const targetBox = await page.getByRole("button", { name: "放在发亮的位置" }).boundingBox();
  const cdp = await context.newCDPSession(page);
  const from = { x: trayBox!.x + trayBox!.width / 2, y: trayBox!.y + trayBox!.height / 2 };
  const to = { x: targetBox!.x + 22, y: targetBox!.y + 22 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  for (let i = 1; i <= 20; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + (to.x - from.x) * i / 20, y: from.y + (to.y - from.y) * i / 20 }] });
  await page.waitForTimeout(150);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByText("还缺 1 块", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("灯塔发现必须换到实际侧面", async ({ page }) => {
  await loginOrange(page); await seedScenes(page, 6);
  await page.goto("/kids/spatial-blocks?challenge=light-tower&scene=observe");
  await page.getByRole("button", { name: "正面", exact: true }).click();
  await expect(page.getByRole("button", { name: "指向露出的缺口" })).toBeDisabled();
  await page.getByRole("button", { name: "侧面观察图" }).click();
  await expect(page.getByRole("button", { name: "指向露出的缺口" })).toBeEnabled();
  await page.getByRole("button", { name: "指向露出的缺口" }).click();
  await page.getByRole("button", { name: "侧面", exact: true }).click();
  await expect(page.getByRole("heading", { name: "风向旗展开了" })).toBeVisible();
});

test("四岛完成才开放自由创造，未开放地址回地图", async ({ page }) => {
  await loginOrange(page);
  await page.goto("/kids/spatial-blocks?mode=free");
  await expect(page.getByRole("button", { name: /自由创造岛/ })).toBeDisabled();
  await seedScenes(page, 12);
  await page.reload();
  await page.getByRole("button", { name: /自由创造岛/ }).click();
  await expect(page.getByLabel("自由创造灵感")).toBeVisible();
});

test("小桥指认两岸、连接验证与花园三方向配对", async ({ page }) => {
  await loginOrange(page); await seedScenes(page, 3);
  await page.goto("/kids/spatial-blocks?challenge=little-bridge&scene=observe");
  for (const choice of ["左岸", "右岸", "中间", "能过去"]) {
    await page.getByLabel("猜一猜", { exact: true }).getByRole("button", { name: choice, exact: true }).click();
    if (choice === "能过去") await page.getByRole("button", { name: "接起来，走一走" }).click();
    else await page.getByRole("button", { name: "动手验证这个位置" }).click();
    await page.getByLabel("指一指看到的关系", { exact: true }).getByRole("button", { name: choice, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "两岸小路显出方向" })).toBeVisible();
  await seedScenes(page, 9);
  await page.goto("/kids/spatial-blocks?challenge=lookout-garden&scene=observe");
  for (const [index, name] of ["正面", "侧面", "顶部"].entries()) {
    await page.getByLabel("猜一猜", { exact: true }).getByRole("button", { name: "形状1" }).click();
    await page.getByRole("button", { name: `${name}观察图` }).click();
    await page.getByRole("button", { name: "看看这个方向" }).click();
    await page.getByLabel("指一指看到的关系", { exact: true }).getByRole("button", { name: `形状${index + 1}` }).click();
  }
  await expect(page.getByRole("heading", { name: "梯田小路出现了" })).toBeVisible();
});

test("键盘选位可放置，取消后不会遗留预览", async ({ page }) => {
  await loginOrange(page); await seedScenes(page, 2);
  await page.goto("/kids/spatial-blocks?challenge=stone-steps&scene=independent-check");
  const tray = page.getByTestId("spatial-block-tray-sun");
  await tray.focus(); await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "向左", exact: true }).click();
  await page.getByRole("button", { name: "上一层", exact: true }).click();
  await page.getByRole("button", { name: "放在选中位置" }).click();
  await expect(page.getByText("还缺 2 块", { exact: true })).toBeVisible();
  await tray.focus(); await page.keyboard.press("Enter"); await page.keyboard.press("Escape");
  await expect(page.getByLabel("选择搭建位置")).toHaveCount(0);
});

test("WebGL 不可用时有重试和返回", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
      if (id === "webgl" || id === "webgl2") return null;
      return original.call(this, id as "2d", ...args as []);
    } as typeof original;
  });
  await page.goto("/kids/spatial-blocks");
  await expect(page.getByText("当前浏览器没有打开 3D 场景", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "重新尝试" })).toBeVisible();
});

test("音频失败和足迹写入失败仍可完成观察", async ({ page }) => {
  await page.route("**/*.mp3", (route) => route.abort());
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key.includes("exploration-traces")) throw Error("unavailable"); return original.call(this, key, value); };
  });
  await loginOrange(page);
  await page.getByRole("button", { name: /石阶岛/ }).click();
  await discoverSteps(page);
  await expect(page.getByText("当前浏览器无法保存探索足迹，本次仍可继续探究。")).toBeVisible();
  await page.getByRole("button", { name: "继续下一幕" }).click();
  await expect(page.getByTestId("spatial-block-tray-sun")).toBeVisible();
});
