import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KidsActivityShell } from "../components/kids-activity-shell";
import { KidsAuthProvider } from "../components/kids-auth-provider";
import { MOCK_ORANGE_SESSION } from "../lib/kids/session";

function renderActivityShell(props: Parameters<typeof KidsActivityShell>[0]) {
  return renderToStaticMarkup(createElement(KidsAuthProvider, {
    initialSession: MOCK_ORANGE_SESSION,
    children: createElement(KidsActivityShell, props),
  }));
}

describe("儿童沉浸式互动外壳", () => {
  it("呈现儿童身份、返回、声音、家长设置和活动区域", () => {
    const html = renderActivityShell({
      title: "空间积木",
      instruction: "照着目标搭一搭",
      soundEnabled: true,
      onSoundToggle: () => undefined,
      settings: createElement("p", null, "难度设置"),
      children: createElement("div", { id: "activity-canvas" }, "互动区域"),
    });

    expect(html).toContain("橙子小朋友");
    expect(html).toContain('aria-label="当前登录用户：橙子小朋友"');
    expect(html).toContain('aria-label="返回一程一成长"');
    expect(html).toContain('aria-label="关闭声音"');
    expect(html).toContain('aria-label="打开家长设置"');
    expect(html).toContain('aria-labelledby="kids-activity-settings-title"');
    expect(html).toContain('id="activity-canvas"');
  });

  it("没有可选能力时不显示声音和家长设置按钮", () => {
    const html = renderActivityShell({
      title: "简单活动",
      children: createElement("div", null, "内容"),
    });

    expect(html).not.toContain("打开声音");
    expect(html).not.toContain("打开家长设置");
    expect(html).not.toContain("<dialog");
  });
});
