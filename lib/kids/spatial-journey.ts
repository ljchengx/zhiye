import { spatialPositionKey, type GridPosition, type SpatialBlock, type SpatialChallengeDefinition, type SpatialBuildBounds, type SpatialBlockColor, type SpatialCompletionEffect } from "./spatial-blocks";
import type { KidsExplorationTrace } from "./exploration";
export type SpatialSceneKind = "observe" | "guided-build" | "independent-check";
export type SpatialViewAxis = "front" | "side" | "top";
export type SpatialHintLevel = 0 | 1 | 2 | 3;
export interface SpatialNarrationDefinition { subtitle: string; audioSrc: string; durationSeconds: number }
export interface SpatialObservationStep {
  id: string; action: "add" | "point" | "reveal" | "match" | "connect";
  position: GridPosition; axis: SpatialViewAxis; prompt: string; relation: string;
  choices: readonly string[]; expected: string;
  additions?: readonly GridPosition[];
}
interface SpatialStructure { targetBlocks: readonly GridPosition[]; initialBlocks: readonly GridPosition[]; bounds: SpatialBuildBounds }
export type SpatialSceneInteraction =
  | (SpatialStructure & { kind: "observe"; steps: readonly SpatialObservationStep[] })
  | (SpatialStructure & { kind: "guided-build"; steps: readonly { position: GridPosition; axis: SpatialViewAxis; relation: string }[] })
  | (SpatialStructure & { kind: "independent-check"; blockBudget: number });
export interface SpatialJourneySceneDefinition {
  id: string; islandId: string; order: number; kind: SpatialSceneKind; title: string; instruction: string;
  conceptKeys: readonly string[]; interaction: SpatialSceneInteraction; allowedViews: readonly SpatialViewAxis[];
  narration: { subtitle: string }; hintText: readonly [string, string, string];
}
export interface SpatialRestorationEffect { stage: 1 | 2 | 3; label: string; effect: "path" | "flowers" | "animals" | "building" | "cloud-route" }
export interface SpatialIslandDefinition {
  id: string; title: string; blockColor: SpatialBlockColor; completionEffect: SpatialCompletionEffect;
  scenes: readonly SpatialJourneySceneDefinition[]; restorationEffects: readonly SpatialRestorationEffect[];
}
export interface SpatialProjectionCell { x: number; y: number }
export interface SpatialProjectionDiff { missing: readonly SpatialProjectionCell[]; extra: readonly SpatialProjectionCell[] }
export interface SpatialJourneyResumePoint { islandId: string; sceneId: string; sceneKey: string }
export const SPATIAL_JOURNEY_VERSION = "journey-v1";
const p = (x: number, y: number, z = 0): GridPosition => ({ x, y, z });
const columns = (heights: readonly number[], z = 0) => heights.flatMap((h, i) => Array.from({ length: h }, (_, y) => p(i - 1, y, z)));
const bounds: SpatialBuildBounds = { width: 6, depth: 4, height: 4, maxBlocks: 20 };
const heights = ["左边高", "一样高", "右边高"];
const step = (id: string, action: SpatialObservationStep["action"], position: GridPosition, axis: SpatialViewAxis, prompt: string, relation: string, choices: readonly string[], expected: string, additions?: readonly GridPosition[]): SpatialObservationStep =>
  ({ id, action, position, axis, prompt, relation, choices, expected, additions });
function defineScene(islandId: string, order: number, kind: SpatialSceneKind, title: string, subtitle: string,
  interaction: SpatialSceneInteraction, allowedViews: readonly SpatialViewAxis[]): SpatialJourneySceneDefinition {
  return {
    islandId, order, id: kind, kind, title, instruction: subtitle,
    conceptKeys: islandId === "stone-steps" ? ["高低", "上下"] : islandId === "little-bridge" ? ["左右", "连接"] : islandId === "light-tower" ? ["前后", "遮挡"] : ["方向", "组合"],
    interaction, allowedViews,
    narration: { subtitle },
    hintText: ["转到观察板亮着的方向看看。", "比较观察板上圈出的地方。", "这里还空着一个位置。"]
  };
}
function guided(islandId: string, order: number, title: string, target: GridPosition[], initial: GridPosition[], positions: GridPosition[], views: readonly SpatialViewAxis[], region = bounds) {
  return defineScene(islandId, order, "guided-build", title, "跟着小山雀，一块一块搭起来。", {
    kind: "guided-build", targetBlocks: target, initialBlocks: initial, bounds: region,
    steps: positions.map((position, i) => ({
      position, axis: views[Math.floor(i * views.length / positions.length)],
      relation: islandId === "little-bridge" ? "这一块和旁边的桥面连起来了。" : position.y ? initial.some((b) => b.x === position.x && b.z === position.z && b.y === position.y - 1) ? "黄色方块在灰色方块上面。" : "这块在刚才那块上面。" : "这一块在最下面。"
    })),
  }, views);
}
function independent(islandId: string, order: number, title: string, target: GridPosition[], initial: GridPosition[], views: readonly SpatialViewAxis[], region = bounds) {
  return defineScene(islandId, order, "independent-check", title, "看看观察板，搭出同样的形状。", {
    kind: "independent-check", targetBlocks: target, initialBlocks: initial, bounds: region, blockBudget: target.length - initial.length,
  }, views);
}
const stepsBase = [p(-1, 0), p(1, 0), p(1, 1)];
const stairs = columns([1, 2, 3]), stairBase = columns([1, 1, 1]);
const deck = [-2, -1, 0, 1, 2].map((x) => p(x, 1));
const bridgeBase = [p(-2, 0), p(2, 0), p(-2, 1), p(2, 1)];
const bridgeBounds = { ...bounds, bridgeCells: deck };
const bridgeTarget = [p(-2, 0), p(2, 0), ...deck];
const towerObserve = [...columns([0, 3]), p(0, 0, -1)];
const towerGuided = [...columns([0, 4]), ...columns([0, 2], -1)];
const gardenGuide = [p(-1, 0, -1), p(1, 0, -1), p(0, 0, 1), p(-1, 1, -1), p(1, 1, -1), p(0, 1, 1)];
const gardenFinal = [p(-1, 0, 1), p(0, 0, -1), p(1, 0, 0), p(-1, 1, 1), p(1, 1, 0), p(1, 2, 0)];
export const spatialJourneyIslands: readonly SpatialIslandDefinition[] = [
  {
    id: "stone-steps", title: "石阶岛", blockColor: "sun", completionEffect: "flag", scenes: [
      defineScene("stone-steps", 1, "observe", "找找高低", "左边加一块，会变得多高呢？", {
        kind: "observe", bounds, initialBlocks: stepsBase, targetBlocks: [...stepsBase, p(-1, 1), p(-1, 2), p(1, 2), p(1, 3)], steps: [
          step("same", "add", p(-1, 1), "front", "左边加一块，会变得多高呢？", "两边一样高。", heights, "一样高", [p(-1, 1)]),
          step("higher", "add", p(-1, 2), "front", "左边再加一块，会怎样呢？", "左边高，右边低。", heights, "左边高", [p(-1, 2)]),
          step("lower", "add", p(1, 2), "front", "右边加两块，会怎样呢？", "右边高，左边低。", heights, "右边高", [p(1, 2), p(1, 3)]),
        ]
      }, ["front", "top"]),
      guided("stone-steps", 2, "一块接一块", stairs, stairBase, [p(0, 1), p(1, 1), p(1, 2)], ["front", "top"]),
      independent("stone-steps", 3, "修好石阶", columns([3, 2, 1]), stairBase, ["front", "top"]),
    ], restorationEffects: [{ stage: 1, label: "山坡小路出现了", effect: "path" }, { stage: 2, label: "石阶旁开出野花", effect: "flowers" }, { stage: 3, label: "终点旗帜升起了", effect: "building" }]
  },
  {
    id: "little-bridge", title: "小桥岛", blockColor: "sun", completionEffect: "bridge", scenes: [
      defineScene("little-bridge", 4, "observe", "两岸之间", "找找左岸、右岸和中间。", {
        kind: "observe", bounds: bridgeBounds, initialBlocks: bridgeBase, targetBlocks: bridgeTarget, steps: [
          step("left", "point", p(-2, 1), "front", "左岸在哪里？", "这是左岸。", ["左岸", "右岸"], "左岸"),
          step("right", "point", p(2, 1), "front", "再找找右岸。", "这是右岸。", ["左岸", "右岸"], "右岸"),
          step("gap", "point", p(0, 1), "front", "两岸之间空在哪里？", "缺口在两岸中间。", ["中间", "外面"], "中间"),
          step("connect", "connect", p(0, 1), "top", "接起来以后，小山雀能过去吗？", "桥面连起来，小山雀走过去了。", ["能过去", "还不能"], "能过去", [p(-1, 1), p(1, 1), p(0, 1)]),
        ]
      }, ["front", "top"]),
      guided("little-bridge", 5, "从两边连起来", bridgeTarget, bridgeBase, [p(-1, 1), p(1, 1), p(0, 1)], ["front", "top"], bridgeBounds),
      independent("little-bridge", 6, "接通小桥", bridgeTarget.map((b) => ({ ...b, z: 1 })), bridgeBase.map((b) => ({ ...b, z: 1 })), ["front", "top"], { ...bounds, bridgeCells: deck.map((b) => ({ ...b, z: 1 })) }),
    ], restorationEffects: [{ stage: 1, label: "两岸小路显出方向", effect: "path" }, { stage: 2, label: "小山雀回到云谷", effect: "animals" }, { stage: 3, label: "云路接通了", effect: "cloud-route" }]
  },
  {
    id: "light-tower", title: "灯塔岛", blockColor: "sun", completionEffect: "light", scenes: [
      defineScene("light-tower", 7, "observe", "转到看得见", "转到侧面，找找藏起来的缺口。", {
        kind: "observe", bounds, initialBlocks: towerObserve, targetBlocks: [...towerObserve, p(0, 1, -1)],
        steps: [step("hidden", "reveal", p(0, 1, -1), "side", "从哪个方向能看见后面的缺口？", "转到侧面，后面的缺口露出来了。", ["正面", "侧面"], "侧面")]
      }, ["front", "side"]),
      guided("light-tower", 8, "从低到高", towerGuided, [p(0, 0), p(0, 0, -1)], [p(0, 1), p(0, 2), p(0, 3), p(0, 1, -1)], ["front", "side"]),
      independent("light-tower", 9, "点亮灯塔", [...columns([0, 3]), ...columns([0, 4], -1)], [p(0, 0), p(0, 1), p(0, 0, -1)], ["front", "side", "top"]),
    ], restorationEffects: [{ stage: 1, label: "风向旗展开了", effect: "path" }, { stage: 2, label: "塔边灌木长高了", effect: "flowers" }, { stage: 3, label: "灯塔发出柔光", effect: "building" }]
  },
  {
    id: "lookout-garden", title: "花园岛", blockColor: "sun", completionEffect: "garden", scenes: [
      defineScene("lookout-garden", 10, "observe", "同一个结构，三个样子", "转一转，把看到的形状找出来。", {
        kind: "observe", bounds, initialBlocks: gardenFinal, targetBlocks: gardenFinal,
        steps: (["front", "side", "top"] as const).map((axis, i) => step(axis, "match", p(0, 1), axis, "转到亮着的方向，找出看到的形状。", ["这是正面看到的形状。", "这是侧面看到的形状。", "这是顶部看到的形状。"][i], ["front", "side", "top"], axis)),
      }, ["front", "side", "top"]),
      guided("lookout-garden", 11, "按方向搭建", gardenGuide, gardenGuide.filter((b) => b.y === 0), gardenGuide.filter((b) => b.y > 0), ["front", "side", "top"]),
      independent("lookout-garden", 12, "恢复花园", gardenFinal, gardenFinal.filter((b) => b.y === 0), ["front", "side", "top"]),
    ], restorationEffects: [{ stage: 1, label: "梯田小路出现了", effect: "path" }, { stage: 2, label: "树苗和花朵长出来了", effect: "flowers" }, { stage: 3, label: "整片群岛重新点亮", effect: "cloud-route" }]
  },
];
export const spatialJourneyScenes = spatialJourneyIslands.flatMap((island) => island.scenes);
export function makeSpatialJourneySceneKey(islandId: string, sceneId: string): string {
  return `${SPATIAL_JOURNEY_VERSION}:${islandId}:${sceneId}`;
}

export function parseSpatialJourneySceneKey(value: string): { islandId: string; sceneId: string } | null {
  const parts = value.split(":");
  if (parts.length !== 3 || parts[0] !== SPATIAL_JOURNEY_VERSION || !parts[1] || !parts[2]) return null;
  return { islandId: parts[1], sceneId: parts[2] };
}

export function getSpatialJourneyIsland(id: string | null | undefined): SpatialIslandDefinition | undefined {
  return spatialJourneyIslands.find((island) => island.id === id);
}

export function getSpatialJourneyScene(islandId: string | null | undefined, sceneId: string | null | undefined): SpatialJourneySceneDefinition | undefined {
  return getSpatialJourneyIsland(islandId)?.scenes.find((sceneItem) => sceneItem.id === sceneId);
}

function projectionCell(position: GridPosition, axis: SpatialViewAxis): SpatialProjectionCell {
  if (axis === "side") return { x: position.z, y: position.y };
  if (axis === "top") return { x: position.x, y: -position.z };
  return { x: position.x, y: position.y };
}

function projectionKey(cell: SpatialProjectionCell): string {
  return `${cell.x}:${cell.y}`;
}

export function projectSpatialBlocks(blocks: readonly (GridPosition | SpatialBlock)[], axis: SpatialViewAxis): SpatialProjectionCell[] {
  const cells = new Map<string, SpatialProjectionCell>();
  blocks.forEach((item) => {
    const position = "position" in item ? item.position : item;
    const cell = projectionCell(position, axis);
    cells.set(projectionKey(cell), cell);
  });
  return [...cells.values()].sort((left, right) => left.y - right.y || left.x - right.x);
}

export function compareSpatialProjection(
  target: readonly (GridPosition | SpatialBlock)[],
  actual: readonly (GridPosition | SpatialBlock)[],
  axis: SpatialViewAxis,
): SpatialProjectionDiff {
  const targetCells = projectSpatialBlocks(target, axis);
  const actualCells = projectSpatialBlocks(actual, axis);
  const actualKeys = new Set(actualCells.map(projectionKey));
  const targetKeys = new Set(targetCells.map(projectionKey));
  return {
    missing: targetCells.filter((cell) => !actualKeys.has(projectionKey(cell))),
    extra: actualCells.filter((cell) => !targetKeys.has(projectionKey(cell))),
  };
}

function completedSceneKeys(traces: readonly KidsExplorationTrace[]): Set<string> {
  return new Set(traces
    .filter((trace) => trace.activityId === "spatial-blocks" && trace.status === "completed")
    .map((trace) => trace.challengeId)
    .filter((value) => value.startsWith(`${SPATIAL_JOURNEY_VERSION}:`)));
}

export function getUnlockedSpatialSceneIds(traces: readonly KidsExplorationTrace[]): string[] {
  const completed = completedSceneKeys(traces);
  const unlocked: string[] = [];
  spatialJourneyScenes.forEach((sceneItem, index) => {
    if (index === 0 || completed.has(makeSpatialJourneySceneKey(spatialJourneyScenes[index - 1].islandId, spatialJourneyScenes[index - 1].id))) {
      unlocked.push(makeSpatialJourneySceneKey(sceneItem.islandId, sceneItem.id));
    }
  });
  return unlocked;
}

export function getIslandRestorationStage(islandId: string, traces: readonly KidsExplorationTrace[]): 0 | 1 | 2 | 3 {
  const completed = completedSceneKeys(traces);
  const island = getSpatialJourneyIsland(islandId);
  if (!island) return 0;
  const count = island.scenes.filter((sceneItem) => completed.has(makeSpatialJourneySceneKey(islandId, sceneItem.id))).length;
  return Math.min(3, count) as 0 | 1 | 2 | 3;
}

export function getSpatialJourneyResumePoint(traces: readonly KidsExplorationTrace[]): SpatialJourneyResumePoint | null {
  const completed = completedSceneKeys(traces);
  const started = traces
    .filter((trace) => trace.activityId === "spatial-blocks" && trace.status === "started" && trace.challengeId.startsWith(`${SPATIAL_JOURNEY_VERSION}:`))
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  const unlocked = new Set(getUnlockedSpatialSceneIds(traces));
  const recentUnfinished = started.find((trace) => unlocked.has(trace.challengeId) && !completed.has(trace.challengeId));
  const next = recentUnfinished?.challengeId ?? spatialJourneyScenes.find((sceneItem) => !completed.has(makeSpatialJourneySceneKey(sceneItem.islandId, sceneItem.id)));
  if (!next) return null;
  const parsed = typeof next === "string" ? parseSpatialJourneySceneKey(next) : { islandId: next.islandId, sceneId: next.id };
  if (!parsed) return null;
  return { ...parsed, sceneKey: makeSpatialJourneySceneKey(parsed.islandId, parsed.sceneId) };
}

export function getSpatialSceneBuildDefinition(scene: SpatialJourneySceneDefinition): SpatialChallengeDefinition {
  const island = getSpatialJourneyIsland(scene.islandId)!;
  return {
    id: island.id, title: scene.title, instruction: scene.instruction, focus: scene.conceptKeys.join("、"), order: scene.order,
    targetBlocks: scene.interaction.targetBlocks, initialBlocks: scene.interaction.initialBlocks,
    camera: { position: [8, 6, 10], target: [0, 1.2, 0] }, completionEffect: island.completionEffect, blockColor: island.blockColor
  };
}

export function getSpatialJourneyCompletedIslandIds(traces: readonly KidsExplorationTrace[]): string[] {
  return spatialJourneyIslands
    .filter((island) => completedSceneKeys(traces).has(makeSpatialJourneySceneKey(island.id, "independent-check")))
    .map((island) => island.id);
}

export function getGuidedSpatialTargetPositions(scene: SpatialJourneySceneDefinition, blocks: readonly SpatialBlock[]): GridPosition[] {
  if (scene.interaction.kind !== "guided-build") return [...scene.interaction.targetBlocks];
  const occupied = new Set([
    ...scene.interaction.initialBlocks.map(spatialPositionKey),
    ...blocks.map((block) => spatialPositionKey(block.position)),
  ]);
  const next = scene.interaction.steps.find((step) => !occupied.has(spatialPositionKey(step.position)))?.position;
  return next ? [next] : [];
}

export function isSpatialJourneySceneComplete(scene: SpatialJourneySceneDefinition, blocks: readonly SpatialBlock[]): boolean {
  const occupied = new Set([
    ...scene.interaction.initialBlocks.map(spatialPositionKey),
    ...blocks.map((block) => spatialPositionKey(block.position)),
  ]);
  const target = new Set(scene.interaction.targetBlocks.map(spatialPositionKey));
  if (scene.kind === "observe") return false;
  return occupied.size === target.size && [...target].every((key) => occupied.has(key));
}
