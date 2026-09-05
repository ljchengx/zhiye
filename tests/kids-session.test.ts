import { describe, expect, it } from "vitest";

import {
  authenticateMockKidsAccount,
  MOCK_ORANGE_CHILD,
  MOCK_ORANGE_SESSION,
  MOCK_ORANGE_USER,
  parseKidsSession,
  serializeKidsSession,
} from "../lib/kids/session";

describe("幼小站模拟账户会话", () => {
  it("只有正确测试账号才能创建橙子小朋友会话", () => {
    expect(authenticateMockKidsAccount("orange", "wrong")).toBeNull();
    expect(authenticateMockKidsAccount("unknown", "orange123")).toBeNull();

    const session = authenticateMockKidsAccount(" Orange ", "orange123", "2026-09-05T08:00:00.000Z");
    expect(session).toMatchObject({
      userId: MOCK_ORANGE_USER.id,
      activeChildId: MOCK_ORANGE_CHILD.id,
      authenticatedAt: "2026-09-05T08:00:00.000Z",
    });
  });

  it("解析有效会话并拒绝损坏、过期或身份不匹配的数据", () => {
    expect(parseKidsSession("{broken")).toBeNull();
    expect(parseKidsSession(JSON.stringify({ version: 1, session: { ...MOCK_ORANGE_SESSION, userId: "usr_other" } }))).toBeNull();
    expect(parseKidsSession(serializeKidsSession(MOCK_ORANGE_SESSION), Date.parse("2026-09-05T00:00:00.000Z"))).toEqual(MOCK_ORANGE_SESSION);
    expect(parseKidsSession(serializeKidsSession({ ...MOCK_ORANGE_SESSION, expiresAt: "2026-09-04T00:00:00.000Z" }), Date.parse("2026-09-05T00:00:00.000Z"))).toBeNull();
  });
});
