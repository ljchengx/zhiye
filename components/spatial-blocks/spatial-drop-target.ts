import { Box3, Vector3, type Ray } from "three";
import type { GridPosition } from "@/lib/kids/spatial-blocks";

// A small margin around the visible outline tolerates imprecise child gestures.
export function findSpatialDropTarget(ray: Ray, targets: readonly GridPosition[]): GridPosition | undefined {
  const box = new Box3();
  const hit = new Vector3();
  let nearest: GridPosition | undefined;
  let distance = Infinity;
  for (const position of targets) {
    box.min.set(position.x - 0.65, position.y - 0.15, position.z - 0.65);
    box.max.set(position.x + 0.65, position.y + 1.15, position.z + 0.65);
    if (!ray.intersectBox(box, hit)) continue;
    const nextDistance = hit.distanceToSquared(ray.origin);
    if (nextDistance < distance) { nearest = position; distance = nextDistance; }
  }
  return nearest;
}
