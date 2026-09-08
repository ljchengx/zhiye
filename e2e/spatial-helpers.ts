import { expect, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";

export async function loginOrange(page: Page) {
  await page.goto("/kids/login?next=%2Fkids%2Fspatial-blocks");
  await page.getByLabel("账号", { exact: true }).fill("orange");
  await page.getByLabel("密码", { exact: true }).fill("orange123");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/kids\/spatial-blocks$/);
  await expect(page.locator("canvas")).toBeVisible();
}
export async function discoverSteps(page: Page) {
  for (const choice of ["一样高", "左边高", "右边高"]) {
    await page.getByLabel("猜一猜", { exact: true }).getByRole("button", { name: "右边高", exact: true }).click();
    await dragGhost(page);
    if (choice === "右边高") await dragGhost(page);
    await page.getByLabel("指一指看到的关系", { exact: true }).getByRole("button", { name: choice, exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "山坡小路出现了" })).toBeVisible();
}
export async function dragTo(page: Page, position: { x: number; y: number }) {
  const tray = await page.getByTestId("spatial-block-tray-sun").boundingBox();
  if (!tray) throw new Error("Missing block tray");
  await page.mouse.move(tray.x + tray.width / 2, tray.y + tray.height / 2);
  await page.mouse.down();
  await page.mouse.move(position.x, position.y, { steps: 25 });
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForTimeout(260);
}
export async function dragGhost(page: Page) {
  const ghost = page.getByRole("button", { name: "放在发亮的位置", exact: true });
  await expect(ghost).toBeVisible();
  await page.waitForTimeout(650);
  const box = await ghost.boundingBox();
  if (!box) throw new Error("Missing target");
  await dragTo(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
}
export async function projectTop(page: Page, x: number, z: number, surface = 1) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("Missing canvas");
  const camera = new PerspectiveCamera(42, box.width / box.height, .1, 120);
  camera.position.set(0, 14, .014);
  camera.lookAt(0, 1.2, 0);
  camera.updateMatrixWorld();
  const projected = new Vector3(x, surface, z).project(camera);
  return { x: box.x + (projected.x + 1) * box.width / 2, y: box.y + (1 - projected.y) * box.height / 2 };
}
export async function seedScenes(page: Page, count: number) {
  await page.evaluate((count) => {
    const ids = ["stone-steps", "little-bridge", "light-tower", "lookout-garden"].flatMap((island) => ["observe", "guided-build", "independent-check"].map((scene) => `journey-v1:${island}:${scene}`));
    localStorage.setItem("yicheng-kids:exploration-traces:v1", JSON.stringify({ version: 1, traces: ids.slice(0, count).map((challengeId) => ({ childId: "kid_orange_001", activityId: "spatial-blocks", challengeId, status: "completed", attempts: 1, updatedAt: new Date().toISOString() })) }));
  }, count);
}
