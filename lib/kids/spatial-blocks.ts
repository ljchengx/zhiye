export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export interface SpatialCameraPreset {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

export type SpatialCompletionEffect = "flag" | "bridge" | "light" | "garden";
export type SpatialBlockColor = "grass" | "sun" | "orange" | "stone";
export type SpatialDropReason = "occupied" | "out-of-bounds" | "not-a-target" | "unsupported";

export type SpatialDragSource =
  | { kind: "tray"; color: SpatialBlockColor }
  | { kind: "placed"; block: SpatialBlock };

export interface SpatialDragState {
  phase: "idle" | "lifting" | "dragging" | "dropping" | "returning";
  source?: SpatialDragSource;
  candidate?: GridPosition;
  valid?: boolean;
  reason?: SpatialDropReason;
}

export interface SpatialChallengeDefinition {
  id: string;
  title: string;
  instruction: string;
  focus: string;
  order: number;
  targetBlocks: readonly GridPosition[];
  initialBlocks: readonly GridPosition[];
  camera: SpatialCameraPreset;
  completionEffect: SpatialCompletionEffect;
  blockColor: SpatialBlockColor;
}

export interface SpatialBlock {
  position: GridPosition;
  color: SpatialBlockColor;
}

export interface SpatialBuildBounds {
  width: number;
  depth: number;
  height: number;
  maxBlocks: number;
  bridgeCells?: readonly GridPosition[];
}

export interface SpatialBuildState {
  blocks: readonly SpatialBlock[];
  undoStack: readonly (readonly SpatialBlock[])[];
  redoStack: readonly (readonly SpatialBlock[])[];
}

export interface SpatialDropValidationInput {
  view: "challenge" | "free";
  candidate?: GridPosition;
  blocks: readonly SpatialBlock[];
  source: SpatialDragSource;
  challenge?: SpatialChallengeDefinition;
  bounds?: SpatialBuildBounds;
  fixedBlocks?: readonly GridPosition[];
  allowNonTarget?: boolean;
  targetBlocks?: readonly GridPosition[];
}

export interface SpatialDropValidationResult {
  valid: boolean;
  position?: GridPosition;
  reason?: SpatialDropReason;
}

export const SPATIAL_BLOCKS_ACTIVITY_ID = "spatial-blocks";

export const FREE_BUILD_BOUNDS: SpatialBuildBounds = {
  width: 8,
  depth: 8,
  height: 6,
  maxBlocks: 96,
};

export function spatialPositionKey(position: GridPosition): string {
  return `${position.x}:${position.y}:${position.z}`;
}

export function positionsEqual(left: GridPosition, right: GridPosition): boolean {
  return spatialPositionKey(left) === spatialPositionKey(right);
}

export function uniqueSpatialPositions(positions: readonly GridPosition[]): GridPosition[] {
  return [...new Map(positions.map((position) => [spatialPositionKey(position), { ...position }])).values()];
}

export function createSpatialBuildState(blocks: readonly SpatialBlock[] = []): SpatialBuildState {
  const unique = new Map(blocks.map((block) => [spatialPositionKey(block.position), { ...block, position: { ...block.position } }]));
  return { blocks: [...unique.values()], undoStack: [], redoStack: [] };
}

function commitSpatialBlocks(state: SpatialBuildState, blocks: readonly SpatialBlock[]): SpatialBuildState {
  return {
    blocks,
    undoStack: [...state.undoStack, state.blocks],
    redoStack: [],
  };
}

export function isPositionInBounds(position: GridPosition, bounds: SpatialBuildBounds): boolean {
  const halfWidth = bounds.width / 2;
  const halfDepth = bounds.depth / 2;
  return Number.isInteger(position.x)
    && Number.isInteger(position.y)
    && Number.isInteger(position.z)
    && position.x >= -halfWidth
    && position.x < halfWidth
    && position.z >= -halfDepth
    && position.z < halfDepth
    && position.y >= 0
    && position.y < bounds.height;
}

export function addSpatialBlock(
  state: SpatialBuildState,
  block: SpatialBlock,
  bounds: SpatialBuildBounds = FREE_BUILD_BOUNDS,
  fixed: readonly GridPosition[] = [],
): SpatialBuildState {
  if (!validateSpatialDrop({ view: "free", candidate: block.position, blocks: state.blocks, source: { kind: "tray", color: block.color }, bounds, fixedBlocks: fixed }).valid) return state;
  return commitSpatialBlocks(state, [...state.blocks, { ...block, position: { ...block.position } }]);
}

export function moveSpatialBlock(
  state: SpatialBuildState,
  from: GridPosition,
  to: GridPosition,
  bounds: SpatialBuildBounds = FREE_BUILD_BOUNDS,
  fixed: readonly GridPosition[] = [],
): SpatialBuildState {
  const moving = state.blocks.find((block) => positionsEqual(block.position, from));
  if (!moving || positionsEqual(from, to) || !validateSpatialDrop({
    view: "free", blocks: state.blocks, source: { kind: "placed", block: moving }, candidate: to, bounds, fixedBlocks: fixed,
  }).valid) return state;
  if (state.blocks.some((block) => !positionsEqual(block.position, from) && positionsEqual(block.position, to))) return state;
  return commitSpatialBlocks(state, state.blocks.map((block) => (
    positionsEqual(block.position, from) ? { ...block, position: { ...to } } : block
  )));
}

function blocksAfterRemovingSource(
  blocks: readonly SpatialBlock[],
  source: SpatialDragSource,
): readonly SpatialBlock[] {
  if (source.kind === "tray") return blocks;
  return blocks.filter((block) => !positionsEqual(block.position, source.block.position));
}

// Bridge cells propagate support horizontally only inside the authored deck region.
export function isSpatialStructureSupported(positions: readonly GridPosition[], bridgeCells: readonly GridPosition[] = []): boolean {
  const supported = new Set(positions.filter((p) => p.y === 0).map(spatialPositionKey));
  const bridge = new Set(bridgeCells.map(spatialPositionKey));
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of positions) {
      const key = spatialPositionKey(p);
      if (supported.has(key)) continue;
      const below = supported.has(spatialPositionKey({ ...p, y: p.y - 1 }));
      const connected = bridge.has(key) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([x, z]) => {
        const neighbor = spatialPositionKey({ ...p, x: p.x + x, z: p.z + z });
        return bridge.has(neighbor) && supported.has(neighbor);
      });
      if (below || connected) { supported.add(key); changed = true; }
    }
  }
  return positions.every((p) => supported.has(spatialPositionKey(p)));
}

export function validateSpatialDrop(input: SpatialDropValidationInput): SpatialDropValidationResult {
  const { candidate, source } = input;
  const bounds = input.bounds ?? FREE_BUILD_BOUNDS;
  if (!candidate || !isPositionInBounds(candidate, bounds)) {
    return { valid: false, reason: "out-of-bounds" };
  }

  if (source.kind === "placed" && !input.blocks.some((b) => positionsEqual(b.position, source.block.position))) {
    return { valid: false, reason: "occupied" };
  }
  const remainingBlocks = blocksAfterRemovingSource(input.blocks, source);
  const fixedPositions = input.fixedBlocks ?? (input.view === "challenge" ? input.challenge?.initialBlocks ?? [] : []);
  const occupied = new Set([
    ...remainingBlocks.map((block) => spatialPositionKey(block.position)),
    ...fixedPositions.map(spatialPositionKey),
  ]);
  if (occupied.has(spatialPositionKey(candidate))) return { valid: false, reason: "occupied" };

  if (source.kind === "tray" && input.blocks.length >= bounds.maxBlocks) {
    return { valid: false, reason: "out-of-bounds" };
  }

  if (input.view === "challenge" && !input.allowNonTarget) {
    const targets = new Set((input.targetBlocks ?? input.challenge?.targetBlocks ?? []).map(spatialPositionKey));
    if (!targets.has(spatialPositionKey(candidate))) return { valid: false, reason: "not-a-target" };
  }

  const color = source.kind === "tray" ? source.color : source.block.color;
  const nextBlocks = [...remainingBlocks, ...fixedPositions.map((position) => ({ position, color: "stone" as const })), { position: { ...candidate }, color }];
  if (!isSpatialStructureSupported(nextBlocks.map((b) => b.position), bounds.bridgeCells)) return { valid: false, reason: "unsupported" };
  return { valid: true, position: { ...candidate } };
}

export function removeSpatialBlock(state: SpatialBuildState, position: GridPosition, fixed: readonly GridPosition[] = [], bounds: SpatialBuildBounds = FREE_BUILD_BOUNDS): SpatialBuildState {
  const next = state.blocks.filter((block) => !positionsEqual(block.position, position));
  if (!isSpatialStructureSupported([...fixed, ...next.map((b) => b.position)], bounds.bridgeCells)) return state;
  return next.length === state.blocks.length ? state : commitSpatialBlocks(state, next);
}

export function recolorSpatialBlock(
  state: SpatialBuildState,
  position: GridPosition,
  color: SpatialBlockColor,
): SpatialBuildState {
  const current = state.blocks.find((block) => positionsEqual(block.position, position));
  if (!current || current.color === color) return state;
  return commitSpatialBlocks(state, state.blocks.map((block) => (
    positionsEqual(block.position, position) ? { ...block, color } : block
  )));
}

export function clearSpatialBlocks(state: SpatialBuildState): SpatialBuildState {
  return state.blocks.length === 0 ? state : commitSpatialBlocks(state, []);
}

export function undoSpatialBuild(state: SpatialBuildState): SpatialBuildState {
  const previous = state.undoStack.at(-1);
  if (!previous) return state;
  return {
    blocks: previous,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [state.blocks, ...state.redoStack],
  };
}

export function redoSpatialBuild(state: SpatialBuildState): SpatialBuildState {
  const next = state.redoStack[0];
  if (!next) return state;
  return {
    blocks: next,
    undoStack: [...state.undoStack, state.blocks],
    redoStack: state.redoStack.slice(1),
  };
}

export function getMissingChallengePositions(
  challenge: SpatialChallengeDefinition,
  placedBlocks: readonly SpatialBlock[],
): GridPosition[] {
  const occupied = new Set([
    ...challenge.initialBlocks.map(spatialPositionKey),
    ...placedBlocks.map((block) => spatialPositionKey(block.position)),
  ]);
  return uniqueSpatialPositions(challenge.targetBlocks).filter((position) => !occupied.has(spatialPositionKey(position)));
}

export function isSpatialChallengeComplete(
  challenge: SpatialChallengeDefinition,
  placedBlocks: readonly SpatialBlock[],
): boolean {
  const target = new Set(uniqueSpatialPositions(challenge.targetBlocks).map(spatialPositionKey));
  const occupied = new Set([
    ...challenge.initialBlocks.map(spatialPositionKey),
    ...placedBlocks.map((block) => spatialPositionKey(block.position)),
  ]);
  return target.size === occupied.size && [...target].every((key) => occupied.has(key));
}
