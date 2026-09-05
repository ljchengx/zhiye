import { describe, expect, it } from "vitest";

import {
  clearKidsExploration,
  createEmptyKidsExploration,
  getKidsExplorationSummary,
  KIDS_EXPLORATION_STORAGE_KEY,
  MAX_KIDS_EXPLORATION_TRACES,
  parseKidsExploration,
  recordKidsExploration,
  serializeKidsExploration,
} from "../lib/kids/exploration";
import {
  createLocalKidsExplorationRepository,
  loadKidsExplorationFromStorage,
} from "../lib/kids/exploration-storage";
import { MOCK_ORANGE_CHILD } from "../lib/kids/session";

const ORANGE_ID = MOCK_ORANGE_CHILD.id;
const OTHER_CHILD_ID = "kid_other_001";

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
  };
}

describe("按儿童身份归属的探索足迹", () => {
  it("容错损坏数据、过滤无归属足迹并合并重复挑战", () => {
    expect(parseKidsExploration("{bad json")).toEqual(createEmptyKidsExploration());
    expect(parseKidsExploration(JSON.stringify({ version: 2, traces: [] }))).toEqual(createEmptyKidsExploration());

    const parsed = parseKidsExploration(JSON.stringify({
      version: 1,
      traces: [
        { childId: ORANGE_ID, activityId: "spatial-blocks", challengeId: "level-1", status: "started", attempts: 1, updatedAt: "2026-09-05T08:00:00.000Z" },
        { childId: ORANGE_ID, activityId: "spatial-blocks", challengeId: "level-1", status: "completed", attempts: 2, updatedAt: "2026-09-06T08:00:00.000Z" },
        { childId: "", activityId: "spatial-blocks", challengeId: "level-2", status: "completed", attempts: 1, updatedAt: "2026-09-06T08:00:00.000Z" },
        { childId: ORANGE_ID, activityId: "spatial-blocks", challengeId: "level-3", status: "completed", attempts: 1, updatedAt: "not-a-time" },
      ],
    }));

    expect(parsed.traces).toEqual([
      expect.objectContaining({ childId: ORANGE_ID, challengeId: "level-1", status: "completed", attempts: 2 }),
    ]);
  });

  it("限制为最近 500 条有效足迹", () => {
    const traces = Array.from({ length: MAX_KIDS_EXPLORATION_TRACES + 20 }, (_, index) => ({
      childId: ORANGE_ID,
      activityId: "spatial-blocks",
      challengeId: `level-${index}`,
      status: "started",
      attempts: 1,
      updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    }));
    const parsed = parseKidsExploration(JSON.stringify({ version: 1, traces }));
    expect(parsed.traces).toHaveLength(MAX_KIDS_EXPLORATION_TRACES);
    expect(parsed.traces[0]?.challengeId).toBe("level-519");
  });

  it("按孩子隔离足迹、累加尝试次数且完成状态不回退", () => {
    const started = recordKidsExploration(createEmptyKidsExploration(), {
      childId: ORANGE_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "started",
      updatedAt: "2026-09-05T08:00:00.000Z",
    });
    const completed = recordKidsExploration(started, {
      childId: ORANGE_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "completed",
      updatedAt: "2026-09-06T08:00:00.000Z",
    });
    const revisited = recordKidsExploration(completed, {
      childId: ORANGE_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "started",
      updatedAt: "2026-09-07T08:00:00.000Z",
    });
    const withOtherChild = recordKidsExploration(revisited, {
      childId: OTHER_CHILD_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "completed",
      updatedAt: "2026-09-08T08:00:00.000Z",
    });

    expect(withOtherChild.traces).toHaveLength(2);
    expect(withOtherChild.traces.find((trace) => trace.childId === ORANGE_ID)).toMatchObject({ status: "completed", attempts: 3 });
    expect(getKidsExplorationSummary(withOtherChild, ORANGE_ID).completed).toBe(1);
    expect(clearKidsExploration(withOtherChild, ORANGE_ID).traces).toEqual([
      expect.objectContaining({ childId: OTHER_CHILD_ID }),
    ]);
  });

  it("仓储只读取探索足迹 v1，不迁移其他版本", async () => {
    const unsupported = JSON.stringify({ version: 2, traces: [] });
    const storage = createMemoryStorage({ [KIDS_EXPLORATION_STORAGE_KEY]: unsupported });
    expect(loadKidsExplorationFromStorage(storage)).toEqual(createEmptyKidsExploration());
    expect(storage.getItem(KIDS_EXPLORATION_STORAGE_KEY)).toBe(unsupported);

    const repository = createLocalKidsExplorationRepository(() => storage);
    const exploration = await repository.record({
      childId: ORANGE_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "completed",
      updatedAt: "2026-09-05T00:00:00.000Z",
    });
    expect(await repository.load(ORANGE_ID)).toEqual(parseKidsExploration(serializeKidsExploration(exploration)));
  });

  it("按活动清除当前孩子足迹并保留其他孩子数据", async () => {
    let exploration = recordKidsExploration(createEmptyKidsExploration(), {
      childId: ORANGE_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "completed",
      updatedAt: "2026-09-05T00:00:00.000Z",
    });
    exploration = recordKidsExploration(exploration, {
      childId: OTHER_CHILD_ID,
      activityId: "spatial-blocks",
      challengeId: "level-1",
      status: "completed",
      updatedAt: "2026-09-06T00:00:00.000Z",
    });
    const storage = createMemoryStorage({ [KIDS_EXPLORATION_STORAGE_KEY]: serializeKidsExploration(exploration) });
    const repository = createLocalKidsExplorationRepository(() => storage);
    const next = await repository.clear(ORANGE_ID, "spatial-blocks");
    expect(next.traces).toEqual([]);
    expect(loadKidsExplorationFromStorage(storage).traces).toEqual([
      expect.objectContaining({ childId: OTHER_CHILD_ID }),
    ]);
  });
});
