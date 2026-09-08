import { isPositionInBounds, isSpatialStructureSupported, spatialPositionKey, type GridPosition } from "./spatial-blocks";
import { compareSpatialProjection, projectSpatialBlocks, type SpatialJourneySceneDefinition } from "./spatial-journey";

// Restrict the search to cells allowed by every silhouette, then enumerate exact-budget structures.
export function countSpatialProjectionSolutions(scene: SpatialJourneySceneDefinition, limit = 2): number {
  if (scene.interaction.kind !== "independent-check") return 0;
  const { bounds, targetBlocks, initialBlocks, blockBudget } = scene.interaction;
  const fixed = new Set(initialBlocks.map(spatialPositionKey));
  const allowed = scene.allowedViews.map((axis) => ({ axis, cells: new Set(projectSpatialBlocks(targetBlocks, axis).map((c) => `${c.x}:${c.y}`)) }));
  const candidates: GridPosition[] = [];
  for (let x = -Math.floor(bounds.width / 2);x < bounds.width / 2;x++) for (let z = -Math.floor(bounds.depth / 2);z < bounds.depth / 2;z++) for (let y = 0;y < bounds.height;y++) {
    const p = { x, y, z };
    if (!fixed.has(spatialPositionKey(p)) && isPositionInBounds(p, bounds) && allowed.every(({ axis, cells }) => {
      const c = projectSpatialBlocks([p], axis)[0]; return cells.has(`${c.x}:${c.y}`);
    })) candidates.push(p);
  }
  let count = 0;
  function visit(index: number, chosen: GridPosition[]) {
    if (count >= limit || chosen.length > blockBudget || chosen.length + candidates.length - index < blockBudget) return;
    if (chosen.length === blockBudget) {
      const actual = [...initialBlocks, ...chosen];
      if (isSpatialStructureSupported(actual, bounds.bridgeCells) && scene.allowedViews.every((axis) => { const d = compareSpatialProjection(targetBlocks, actual, axis); return !d.extra.length && !d.missing.length; })) count++;
      return;
    }
    if (index === candidates.length) return;
    visit(index + 1, [...chosen, candidates[index]]);
    visit(index + 1, chosen);
  }
  visit(0, []);
  return count;
}
