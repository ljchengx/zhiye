import { defineConfig, devices } from "@playwright/test";

// 本机 3000 可能被其它常驻服务占用，用 PW_PORT 换端口而不改默认值。
const port = Number(process.env.PW_PORT ?? 3000);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  // 登录态用例共享同一测试账号，串行执行避免并发登录相互踢下线。
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: origin,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: origin,
    reuseExistingServer: true,
  },
});
