import { describe, expect, it } from "vitest";
import { countSpatialProjectionSolutions } from "../lib/kids/spatial-content-validation";
import { createJourneyState, getObservationBuildTargets, reduceSpatialJourney } from "../lib/kids/spatial-journey-state";
import { spatialJourneyScenes, getSpatialJourneyScene, getSpatialSceneBuildDefinition, getGuidedSpatialTargetPositions } from "../lib/kids/spatial-journey";
import { createSpatialBuildState, isSpatialStructureSupported, moveSpatialBlock, removeSpatialBlock, undoSpatialBuild, redoSpatialBuild, validateSpatialDrop, spatialPositionKey } from "../lib/kids/spatial-blocks";

describe("探究行为与内容质量", () => {
  it.each(spatialJourneyScenes.filter((s) => s.kind === "independent-check"))("$islandId 的投影恰有一个合法解", (scene) => {
    expect(countSpatialProjectionSolutions(scene)).toBe(1);
    const guided = getSpatialJourneyScene(scene.islandId, "guided-build")!;
    expect(scene.interaction.targetBlocks).not.toEqual(guided.interaction.targetBlocks);
  });
  it.each(spatialJourneyScenes)("$islandId $kind 初始结构和目标结构均有支撑", (scene) => {
    expect(isSpatialStructureSupported(scene.interaction.initialBlocks, scene.interaction.bounds.bridgeCells)).toBe(true);
    expect(isSpatialStructureSupported(scene.interaction.targetBlocks, scene.interaction.bounds.bridgeCells)).toBe(true);
  });
  it("预测不是完成，验证后还要指认实际关系", () => {
    const scene = getSpatialJourneyScene("stone-steps", "observe")!;
    let state = createJourneyState();
    state = reduceSpatialJourney(scene, state, { type: "predict", choice: "右边高" });
    expect(state.phase).toBe("verify");
    expect(reduceSpatialJourney(scene, state, { type: "verify", targetId: "other" })).toBe(state);
    expect(reduceSpatialJourney(scene, state, { type: "verify", targetId: "same" })).toBe(state);
    state = reduceSpatialJourney(scene, state, { type: "build", blocks: [{ position: { x: -1, y: 1, z: 0 }, color: "sun" }] });
    expect(state.phase).toBe("express");
    expect(reduceSpatialJourney(scene, state, { type: "express", choice: "右边高" }).step).toBe(0);
    state = reduceSpatialJourney(scene, state, { type: "express", choice: "一样高" });
    expect(state.step).toBe(1);
    expect(state.phase).toBe("predict");
  });
  it("发现幕逐块叠加，两块的步骤不能提前结束", () => {
    const scene = getSpatialJourneyScene("stone-steps", "observe")!;
    let state = { ...createJourneyState(), step: 2 };
    expect(getObservationBuildTargets(scene, state, [])).toEqual([]);
    state = reduceSpatialJourney(scene, state, { type: "predict", choice: "一样高" });
    const blocks = [{ position: { x: 1, y: 2, z: 0 }, color: "sun" as const }];
    expect(getObservationBuildTargets(scene, state, [])).toEqual([blocks[0].position]);
    expect(reduceSpatialJourney(scene, state, { type: "build", blocks })).toBe(state);
    expect(getObservationBuildTargets(scene, state, blocks)).toEqual([{ x: 1, y: 3, z: 0 }]);
    state = reduceSpatialJourney(scene, state, { type: "build", blocks: [...blocks, { position: { x: 1, y: 3, z: 0 }, color: "sun" }] });
    expect(state.phase).toBe("express");
    expect(getObservationBuildTargets(scene, state, blocks)).toEqual([]);
  });
  it("灯塔缺口必须在实际侧面观察后才能验证", () => {
    const scene = getSpatialJourneyScene("light-tower", "observe")!;
    let state = reduceSpatialJourney(scene, createJourneyState(), { type: "predict", choice: "正面" });
    expect(reduceSpatialJourney(scene, state, { type: "verify", targetId: "hidden" })).toBe(state);
    state = reduceSpatialJourney(scene, state, { type: "view", axis: "side" });
    expect(reduceSpatialJourney(scene, state, { type: "verify", targetId: "hidden" }).phase).toBe("express");
  });
  it("引导幕逐步放置均合法，并且只开放下一个目标", () => {
    for (const scene of spatialJourneyScenes.filter((s) => s.kind === "guided-build")) {
      if (scene.interaction.kind !== "guided-build") continue;
      const blocks: { position: { x: number; y: number; z: number }; color: "sun" }[] = [];
      for (const step of scene.interaction.steps) {
        expect(getGuidedSpatialTargetPositions(scene, blocks)).toEqual([step.position]);
        expect(validateSpatialDrop({ view: "challenge", challenge: getSpatialSceneBuildDefinition(scene), candidate: step.position, blocks, source: { kind: "tray", color: "sun" }, bounds: scene.interaction.bounds, targetBlocks: [step.position] }).valid).toBe(true);
        blocks.push({ position: step.position, color: "sun" });
      }
    }
  });
  it("自动提示不提高已有等级，手动提示最高三级", () => {
    const scene = spatialJourneyScenes[0];
    let state = reduceSpatialJourney(scene, createJourneyState(), { type: "hint", automatic: true });
    expect(state.hint).toBe(1);
    state = reduceSpatialJourney(scene, state, { type: "hint" });
    expect(reduceSpatialJourney(scene, state, { type: "hint", automatic: true }).hint).toBe(2);
    for (let i = 0; i < 5; i++) state = reduceSpatialJourney(scene, state, { type: "hint" });
    expect(state.hint).toBe(3);
  });
  it("删除或移动承重块失败时保留原状态，合法移动整体撤销重做", () => {
    const scene = getSpatialJourneyScene("little-bridge", "guided-build")!;
    const blocks = [{ position: { x: -1, y: 1, z: 0 }, color: "sun" as const }, { position: { x: 0, y: 1, z: 0 }, color: "sun" as const }];
    const state = createSpatialBuildState(blocks);
    const fixed = scene.interaction.initialBlocks, bounds = scene.interaction.bounds;
    expect(removeSpatialBlock(state, blocks[0].position, fixed, bounds)).toBe(state);
    expect(moveSpatialBlock(state, blocks[0].position, { x: 1, y: 1, z: 0 }, bounds, fixed)).not.toBe(state);
    const moved = moveSpatialBlock(state, blocks[1].position, { x: 1, y: 1, z: 0 }, bounds, fixed);
    expect(moved.undoStack).toHaveLength(1);
    expect(undoSpatialBuild(moved).blocks).toEqual(state.blocks);
    expect(redoSpatialBuild(undoSpatialBuild(moved)).blocks).toEqual(moved.blocks);
    expect(new Set(moved.blocks.map((b) => spatialPositionKey(b.position))).size).toBe(2);
  });
});
