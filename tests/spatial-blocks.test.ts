import { describe, expect, it } from "vitest";

import {
  FREE_BUILD_BOUNDS,
  addSpatialBlock,
  clearSpatialBlocks,
  createSpatialBuildState,
  getMissingChallengePositions,
  isPositionInBounds,
  isSpatialChallengeComplete,
  moveSpatialBlock,
  recolorSpatialBlock,
  redoSpatialBuild,
  removeSpatialBlock,
  undoSpatialBuild,
  validateSpatialDrop,
} from "../lib/kids/spatial-blocks";

import { getSpatialSceneBuildDefinition, spatialJourneyIslands } from "../lib/kids/spatial-journey";
describe("空间积木状态内核", () => {
  it("拒绝越界和重叠方块", () => {
    const first = addSpatialBlock(createSpatialBuildState(), { position: { x: 0, y: 0, z: 0 }, color: "grass" });
    expect(addSpatialBlock(first, { position: { x: 0, y: 0, z: 0 }, color: "sun" })).toBe(first);
    expect(addSpatialBlock(first, { position: { x: 4, y: 0, z: 0 }, color: "sun" })).toBe(first);
    expect(isPositionInBounds({ x: -4, y: 5, z: 3 }, FREE_BUILD_BOUNDS)).toBe(true);
  });

  it("支持添加、删除、换色、清空、撤销和重做", () => {
    const empty = createSpatialBuildState();
    const added = addSpatialBlock(empty, { position: { x: 0, y: 0, z: 0 }, color: "grass" });
    const recolored = recolorSpatialBlock(added, { x: 0, y: 0, z: 0 }, "orange");
    const removed = removeSpatialBlock(recolored, { x: 0, y: 0, z: 0 });
    expect(undoSpatialBuild(removed).blocks[0]?.color).toBe("orange");
    expect(redoSpatialBuild(undoSpatialBuild(removed)).blocks).toEqual([]);
    expect(clearSpatialBlocks(added).blocks).toEqual([]);
  });

  it("允许同一列向上叠放不同高度的方块", () => {
    const base = addSpatialBlock(createSpatialBuildState(), { position: { x: 0, y: 0, z: 0 }, color: "grass" });
    const stacked = addSpatialBlock(base, { position: { x: 0, y: 1, z: 0 }, color: "sun" });
    expect(stacked.blocks.map((block) => block.position.y)).toEqual([0, 1]);
  });

  it("按目标坐标判断完成并计算缺失位置", () => {
    const challenge = getSpatialSceneBuildDefinition(spatialJourneyIslands[0].scenes[1]);
    const missing = getMissingChallengePositions(challenge, []);
    const completed = missing.map((position) => ({ position, color: "stone" as const }));
    expect(missing).toHaveLength(3);
    expect(isSpatialChallengeComplete(challenge, completed)).toBe(true);
  });

  it("限制自由创造岛最多 96 个方块", () => {
    let state = createSpatialBuildState();
    for (let y = 0; y < FREE_BUILD_BOUNDS.height; y += 1) {
      for (let x = -4; x < 4; x += 1) {
        for (let z = -4; z < 4; z += 1) {
          state = addSpatialBlock(state, { position: { x, y, z }, color: "grass" });
        }
      }
    }
    expect(state.blocks).toHaveLength(96);
  });

  it("区分关卡目标、占用位置和自由搭建支撑", () => {
    const challenge = getSpatialSceneBuildDefinition(spatialJourneyIslands[0].scenes[1]);
    const source = { kind: "tray" as const, color: "stone" as const };
    expect(validateSpatialDrop({
      view: "challenge",
      candidate: { x: 0, y: 1, z: 0 },
      blocks: [],
      source,
      challenge,
    })).toMatchObject({ valid: true });
    expect(validateSpatialDrop({
      view: "challenge",
      candidate: { x: 3, y: 0, z: 0 },
      blocks: [],
      source,
      challenge,
    })).toMatchObject({ valid: false, reason: "not-a-target" });
    expect(validateSpatialDrop({
      view: "challenge",
      candidate: challenge.initialBlocks[0],
      blocks: [],
      source,
      challenge,
    })).toMatchObject({ valid: false, reason: "occupied" });
    expect(validateSpatialDrop({
      view: "free",
      candidate: { x: 0, y: 1, z: 0 },
      blocks: [],
      source,
    })).toMatchObject({ valid: false, reason: "unsupported" });
  });

  it("移动方块只提交一次历史并可整体撤销", () => {
    const base = addSpatialBlock(createSpatialBuildState(), { position: { x: 0, y: 0, z: 0 }, color: "grass" });
    const moved = moveSpatialBlock(base, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    expect(moved.blocks).toEqual([{ position: { x: 1, y: 0, z: 0 }, color: "grass" }]);
    expect(moved.undoStack).toHaveLength(2);
    expect(undoSpatialBuild(moved).blocks).toEqual(base.blocks);
  });

  it("移动承重方块时拒绝产生悬空结构", () => {
    const base = addSpatialBlock(createSpatialBuildState(), { position: { x: 0, y: 0, z: 0 }, color: "grass" });
    const stacked = addSpatialBlock(base, { position: { x: 0, y: 1, z: 0 }, color: "sun" });
    expect(validateSpatialDrop({
      view: "free",
      candidate: { x: 1, y: 0, z: 0 },
      blocks: stacked.blocks,
      source: { kind: "placed", block: stacked.blocks[0] },
    })).toMatchObject({ valid: false, reason: "unsupported" });
  });
});
