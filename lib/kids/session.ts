export type KidsUserRole = "child" | "guardian";
export type KidsAuthProvider = "mock" | "credentials" | "oauth";

export interface KidsUser {
  id: string;
  displayName: string;
  role: KidsUserRole;
  createdAt: string;
}

export interface KidsChildProfile {
  id: string;
  ownerUserId: string;
  displayName: string;
  avatarInitial: string;
  avatarColor: string;
  createdAt: string;
}

export interface KidsSession {
  id: string;
  userId: string;
  activeChildId: string;
  provider: KidsAuthProvider;
  authenticatedAt: string;
  expiresAt: string;
}

export const KIDS_AUTH_STORAGE_KEY = "yicheng-kids:auth-session:v1";
// 仅用于纯网页阶段的测试账号，正式认证实现不得在客户端保存密码。
export const MOCK_ORANGE_ACCOUNT = "orange";
export const MOCK_ORANGE_PASSWORD = "orange123";

export const MOCK_ORANGE_USER: KidsUser = {
  id: "usr_orange_001",
  displayName: "橙子小朋友",
  role: "child",
  createdAt: "2026-09-05T00:00:00.000Z",
};

export const MOCK_ORANGE_CHILD: KidsChildProfile = {
  id: "kid_orange_001",
  ownerUserId: MOCK_ORANGE_USER.id,
  displayName: "橙子小朋友",
  avatarInitial: "橙",
  avatarColor: "#e45d45",
  createdAt: "2026-09-05T00:00:00.000Z",
};

export const MOCK_ORANGE_SESSION: KidsSession = {
  id: "ses_local_orange_001",
  userId: MOCK_ORANGE_USER.id,
  activeChildId: MOCK_ORANGE_CHILD.id,
  provider: "mock",
  authenticatedAt: "2026-09-05T00:00:00.000Z",
  expiresAt: "2099-12-31T23:59:59.999Z",
};

function isValidIsoTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function authenticateMockKidsAccount(account: string, password: string, authenticatedAt = new Date().toISOString()): KidsSession | null {
  if (account.trim().toLowerCase() !== MOCK_ORANGE_ACCOUNT || password !== MOCK_ORANGE_PASSWORD || !isValidIsoTime(authenticatedAt)) return null;
  const expiresAt = new Date(Date.parse(authenticatedAt) + 30 * 24 * 60 * 60 * 1000).toISOString();
  return { ...MOCK_ORANGE_SESSION, authenticatedAt, expiresAt };
}

export function serializeKidsSession(session: KidsSession): string {
  return JSON.stringify({ version: 1, session });
}

export function parseKidsSession(raw: string | null, now = Date.now()): KidsSession | null {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as { version?: unknown; session?: Partial<KidsSession> };
    const session = payload.session;
    if (payload.version !== 1 || !session) return null;
    if (session.id !== MOCK_ORANGE_SESSION.id || session.userId !== MOCK_ORANGE_USER.id || session.activeChildId !== MOCK_ORANGE_CHILD.id || session.provider !== "mock") return null;
    if (!isValidIsoTime(session.authenticatedAt) || !isValidIsoTime(session.expiresAt) || Date.parse(session.expiresAt) <= now) return null;
    return {
      id: session.id,
      userId: session.userId,
      activeChildId: session.activeChildId,
      provider: session.provider,
      authenticatedAt: session.authenticatedAt,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}
