export const KIDS_EXPLORATION_STORAGE_KEY = "yicheng-kids:exploration-traces:v1";
export const MAX_KIDS_EXPLORATION_TRACES = 500;

export type KidsExplorationStatus = "started" | "completed";

export interface KidsExplorationTrace {
  childId: string;
  activityId: string;
  challengeId: string;
  status: KidsExplorationStatus;
  attempts: number;
  updatedAt: string;
}

export interface KidsExplorationV1 {
  version: 1;
  traces: readonly KidsExplorationTrace[];
}

export interface KidsExplorationEvent {
  childId: string;
  activityId: string;
  challengeId: string;
  status: KidsExplorationStatus;
  updatedAt: string;
}

export interface KidsExplorationSummary {
  completed: number;
  recent: KidsExplorationTrace | null;
}

export function createEmptyKidsExploration(): KidsExplorationV1 {
  return { version: 1, traces: [] };
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isValidIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 160;
}

function normalizeTrace(value: unknown): KidsExplorationTrace | null {
  if (!value || typeof value !== "object") return null;
  const trace = value as Partial<KidsExplorationTrace>;
  if (!isValidIdentifier(trace.childId) || !isValidIdentifier(trace.activityId) || !isValidIdentifier(trace.challengeId)) return null;
  if (trace.status !== "started" && trace.status !== "completed") return null;
  if (typeof trace.attempts !== "number" || !Number.isInteger(trace.attempts) || trace.attempts < 1) return null;
  if (!isValidTimestamp(trace.updatedAt)) return null;
  return {
    childId: trace.childId.trim(),
    activityId: trace.activityId.trim(),
    challengeId: trace.challengeId.trim(),
    status: trace.status,
    attempts: trace.attempts,
    updatedAt: trace.updatedAt,
  };
}

function traceKey(trace: Pick<KidsExplorationTrace, "childId" | "activityId" | "challengeId">) {
  return `${trace.childId}\u0000${trace.activityId}\u0000${trace.challengeId}`;
}

function normalizeTraces(values: readonly unknown[]): KidsExplorationTrace[] {
  const traces = new Map<string, KidsExplorationTrace>();
  values.forEach((value) => {
    const next = normalizeTrace(value);
    if (!next) return;
    const key = traceKey(next);
    const current = traces.get(key);
    if (!current) {
      traces.set(key, next);
      return;
    }
    const latest = Date.parse(next.updatedAt) >= Date.parse(current.updatedAt) ? next : current;
    traces.set(key, {
      ...latest,
      status: current.status === "completed" || next.status === "completed" ? "completed" : "started",
      attempts: Math.max(current.attempts, next.attempts),
    });
  });
  return [...traces.values()]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, MAX_KIDS_EXPLORATION_TRACES);
}

export function parseKidsExploration(raw: string | null): KidsExplorationV1 {
  if (!raw) return createEmptyKidsExploration();
  try {
    const payload = JSON.parse(raw) as { version?: unknown; traces?: unknown };
    if (payload.version !== 1 || !Array.isArray(payload.traces)) return createEmptyKidsExploration();
    return { version: 1, traces: normalizeTraces(payload.traces) };
  } catch {
    return createEmptyKidsExploration();
  }
}

export function serializeKidsExploration(exploration: KidsExplorationV1): string {
  return JSON.stringify({ version: 1, traces: normalizeTraces(exploration.traces) });
}

export function recordKidsExploration(exploration: KidsExplorationV1, event: KidsExplorationEvent): KidsExplorationV1 {
  const eventTrace = normalizeTrace({ ...event, attempts: 1 });
  if (!eventTrace) return exploration;
  const key = traceKey(eventTrace);
  const current = exploration.traces.find((trace) => traceKey(trace) === key);
  const next: KidsExplorationTrace = {
    ...eventTrace,
    status: current?.status === "completed" ? "completed" : eventTrace.status,
    attempts: (current?.attempts ?? 0) + 1,
  };
  return {
    version: 1,
    traces: normalizeTraces([next, ...exploration.traces.filter((trace) => traceKey(trace) !== key)]),
  };
}

export function clearKidsExploration(exploration: KidsExplorationV1, childId: string, activityId?: string): KidsExplorationV1 {
  return {
    version: 1,
    traces: exploration.traces.filter((trace) => (
      trace.childId !== childId || (activityId ? trace.activityId !== activityId : false)
    )),
  };
}

export function selectKidsExploration(exploration: KidsExplorationV1, childId: string): KidsExplorationV1 {
  return {
    version: 1,
    traces: normalizeTraces(exploration.traces).filter((trace) => trace.childId === childId),
  };
}

export function getKidsExplorationSummary(exploration: KidsExplorationV1, childId: string): KidsExplorationSummary {
  const traces = selectKidsExploration(exploration, childId).traces;
  return {
    completed: traces.filter((trace) => trace.status === "completed").length,
    recent: traces[0] ?? null,
  };
}
