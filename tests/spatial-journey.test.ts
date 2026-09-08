import { describe, expect, it } from "vitest";

import type { KidsExplorationTrace } from "../lib/kids/exploration";
import {
  getIslandRestorationStage,
  getSpatialJourneyCompletedIslandIds,
  getSpatialJourneyResumePoint,
  getUnlockedSpatialSceneIds,
  getSpatialJourneyScene,
  isSpatialJourneySceneComplete,
  makeSpatialJourneySceneKey,
  projectSpatialBlocks,
  compareSpatialProjection,
  spatialJourneyScenes,
} from "../lib/kids/spatial-journey";

const childId = "kid_orange_001";
const at = (minutes: number) => new Date(Date.UTC(2026, 8, 7, 0, minutes)).toISOString();
const trace = (challengeId: string, status: "started" | "completed", minute: number): KidsExplorationTrace => ({
  childId,
  activityId: "spatial-blocks",
  challengeId,
  status,
  attempts: 1,
  updatedAt: at(minute),
});

describe("空间概念探究旅程", () => {
  it("按正面、侧面和顶部生成稳定投影", () => {
    const blocks = [{ x: 1, y: 2, z: 3 }, { x: 1, y: 0, z: 4 }];
    expect(projectSpatialBlocks(blocks, "front")).toEqual([{ x: 1, y: 0 }, { x: 1, y: 2 }]);
    expect(projectSpatialBlocks(blocks, "side")).toEqual([{ x: 4, y: 0 }, { x: 3, y: 2 }]);
    expect(projectSpatialBlocks(blocks, "top")).toEqual([{ x: 1, y: -4 }, { x: 1, y: -3 }]);
  });

  it("返回投影缺失格和多余格，而不是暴露坐标答案", () => {
    expect(compareSpatialProjection([{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], [{ x: 0, y: 0, z: 0 }], "front"))
      .toEqual({ missing: [{ x: 1, y: 0 }], extra: [] });
  });

  it("十二幕依次解锁，旧四关足迹不参与", () => {
    expect(getUnlockedSpatialSceneIds([trace("stone-steps", "completed", 1)])).toHaveLength(1);
    const first = makeSpatialJourneySceneKey("stone-steps", "observe");
    const unlocked = getUnlockedSpatialSceneIds([trace(first, "completed", 1)]);
    expect(unlocked).toEqual([first, makeSpatialJourneySceneKey("stone-steps", "guided-build")]);
  });

  it("每座岛按幕数返回恢复阶段，并只把第三幕完成算作点亮", () => {
    const traces = [
      trace(makeSpatialJourneySceneKey("stone-steps", "observe"), "completed", 1),
      trace(makeSpatialJourneySceneKey("stone-steps", "guided-build"), "completed", 2),
      trace(makeSpatialJourneySceneKey("stone-steps", "independent-check"), "completed", 3),
    ];
    expect(getIslandRestorationStage("stone-steps", traces)).toBe(3);
    expect(getSpatialJourneyCompletedIslandIds(traces)).toEqual(["stone-steps"]);
  });

  it("续玩点优先选择最近未完成幕", () => {
    const first = makeSpatialJourneySceneKey("stone-steps", "observe");
    const second = makeSpatialJourneySceneKey("stone-steps", "guided-build");
    expect(getSpatialJourneyResumePoint([trace(second, "started", 9), trace(first, "completed", 2)])).toMatchObject({
      islandId: "stone-steps",
      sceneId: "guided-build",
      sceneKey: second,
    });
    expect(getSpatialJourneyResumePoint([])).toMatchObject({ islandId: spatialJourneyScenes[0].islandId, sceneId: spatialJourneyScenes[0].id });
  });

  it("独立验证幕必须移除多余方块才能完成", () => {
    const scene = getSpatialJourneyScene("stone-steps", "independent-check")!;
    const extra = { position: { x: 3, y: 0, z: 0 }, color: "grass" as const };
    const targetBlocks = scene.interaction.targetBlocks.map((position) => ({ position, color: "stone" as const }));
    expect(isSpatialJourneySceneComplete(scene, [...targetBlocks, extra])).toBe(false);
    expect(isSpatialJourneySceneComplete(scene, targetBlocks)).toBe(true);
  });
});
