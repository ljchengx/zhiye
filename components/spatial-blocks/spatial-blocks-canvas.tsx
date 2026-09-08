"use client";

import { Edges, Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Plane, Vector2, Vector3, type Group, type Object3D } from "three";

import {
  FREE_BUILD_BOUNDS,
  getMissingChallengePositions,
  spatialPositionKey,
  validateSpatialDrop,
  type GridPosition,
  type SpatialBlock,
  type SpatialBlockColor,
  type SpatialChallengeDefinition,
  type SpatialDragState,
  type SpatialDropValidationResult,
} from "@/lib/kids/spatial-blocks";
import {
  getSpatialSceneBuildDefinition,
  spatialJourneyIslands,
  type SpatialJourneySceneDefinition,
  type SpatialObservationStep,
  type SpatialViewAxis,
} from "@/lib/kids/spatial-journey";

import { JourneyBird } from "./journey-bird";
import {
  ChallengeTerrain,
  CompletionDetail,
  Flag,
  GrassCluster,
  IslandBase,
  MapLandmark,
  Tree,
  WorldEnvironment,
  useFreeBuildCells,
} from "./spatial-blocks-world";
import styles from "./spatial-blocks.module.css";
import { SpatialCamera } from "./spatial-camera";
import { findSpatialDropTarget } from "./spatial-drop-target";

const blockColors: Record<SpatialBlockColor, string> = {
  grass: "#72B96B",
  sun: "#F2C75C",
  orange: "#EE8354",
  stone: "#77847F",
};

export interface SpatialPointerPosition {
  x: number;
  y: number;
}

interface SpatialBlocksCanvasProps {
  view: "demo" | "map" | "challenge" | "free";
  challenge?: SpatialChallengeDefinition;
  journeyScene?: SpatialJourneySceneDefinition;
  sceneTargetPositions?: readonly GridPosition[];
  viewAxis?: SpatialViewAxis;
  observationStep?: SpatialObservationStep;
  observationPhase: string;
  onObservationVerify: (id: string) => void;
  onObservedAxis: (axis: SpatialViewAxis) => void;
  bookExpanded: boolean;
  sceneComplete: boolean;
  guideActive: boolean;
  blocks: readonly SpatialBlock[];
  completedIds: readonly string[];
  restorationStages: Readonly<Record<string, number>>;
  unlockedIds: readonly string[];
  freeUnlocked: boolean;
  buildMode: "place" | "delete" | "paint";
  controlsEnabled: boolean;
  hintVisible: boolean;
  hintLevel: 0 | 1 | 2 | 3;
  resetToken: number;
  reducedMotion: boolean;
  coarsePointer: boolean;
  dragState: SpatialDragState;
  dragPointer?: SpatialPointerPosition;
  keyboardPosition?: GridPosition;
  dragArmed: boolean;
  onChooseChallenge: (challengeId: string) => void;
  onChooseFree: () => void;
  onTapDrop: (position: GridPosition) => void;
  onRemove: (position: GridPosition) => void;
  onRecolor: (position: GridPosition) => void;
  onStartBlockDrag: (block: SpatialBlock, pointer: SpatialPointerPosition & { pointerId: number }) => void;
  onDragCandidate: (candidate: GridPosition | undefined, result: SpatialDropValidationResult) => void;
  onCancelDrag: () => void;
  onContextLost: () => void;
}

function CanvasLifecycle({ onContextLost }: { onContextLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onContextLost]);
  return null;
}

function findDropData(object: Object3D) {
  let current: Object3D | null = object;
  while (current) {
    if (current.userData.dropPosition || current.userData.gridPosition) return current.userData;
    current = current.parent;
  }
  return undefined;
}

function dominantNormal(normal: Vector3): GridPosition {
  const absolute = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)];
  const largest = Math.max(...absolute);
  if (largest === absolute[0]) return { x: Math.sign(normal.x), y: 0, z: 0 };
  if (largest === absolute[1]) return { x: 0, y: Math.sign(normal.y), z: 0 };
  return { x: 0, y: 0, z: Math.sign(normal.z) };
}

function DragResolver({ blocks, challenge, journeyScene, sceneTargetPositions, dragPointer, dragState, onDragCandidate, view }: Pick<SpatialBlocksCanvasProps, "blocks" | "challenge" | "journeyScene" | "sceneTargetPositions" | "dragPointer" | "dragState" | "onDragCandidate" | "view">) {
  const { camera, gl, raycaster, scene } = useThree();
  const pointer = useMemo(() => new Vector2(), []);

  useFrame(() => {
    if (dragState.phase !== "dragging" || !dragState.source || !dragPointer) return;
    const rect = gl.domElement.getBoundingClientRect();
    if (dragPointer.x < rect.left || dragPointer.x > rect.right || dragPointer.y < rect.top || dragPointer.y > rect.bottom) {
      onDragCandidate(undefined, { valid: false, reason: "out-of-bounds" });
      return;
    }

    pointer.set(((dragPointer.x - rect.left) / rect.width) * 2 - 1, -((dragPointer.y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const sourceKey = dragState.source.kind === "placed" ? spatialPositionKey(dragState.source.block.position) : undefined;
    let candidate = journeyScene?.kind === "observe" || journeyScene?.kind === "guided-build"
      ? findSpatialDropTarget(raycaster.ray, sceneTargetPositions ?? []) : undefined;

    for (const hit of raycaster.intersectObjects(scene.children, true)) {
      if (candidate) break;
      const data = findDropData(hit.object);
      if (!data) continue;
      if (data.dragSourceKey && data.dragSourceKey === sourceKey) continue;
      if (data.dropPosition) {
        candidate = { ...data.dropPosition } as GridPosition;
        break;
      }
      if (data.gridPosition && hit.face) {
        const normal = dominantNormal(hit.face.normal.clone().transformDirection(hit.object.matrixWorld));
        candidate = {
          x: data.gridPosition.x + normal.x,
          y: data.gridPosition.y + normal.y,
          z: data.gridPosition.z + normal.z,
        };
        break;
      }
    }

    const result = validateSpatialDrop({
      view: view === "challenge" && journeyScene?.kind !== "independent-check" ? "challenge" : "free",
      candidate,
      blocks,
      source: dragState.source,
      challenge,
      bounds: journeyScene?.interaction.bounds ?? FREE_BUILD_BOUNDS,
      fixedBlocks: journeyScene?.interaction.initialBlocks,
      allowNonTarget: journeyScene?.kind === "independent-check",
      targetBlocks: sceneTargetPositions,
    });
    // The controller deduplicates within a gesture, never across separate drags.
    onDragCandidate(candidate, result);
  });
  return null;
}

function WoodenBlock({ color, transparent = false }: { color: SpatialBlockColor; transparent?: boolean }) {
  const topColor = useMemo(() => new Color(blockColors[color]).offsetHSL(0, -0.04, 0.08), [color]);
  return (
    <>
      <RoundedBox args={[0.94, 0.94, 0.94]} radius={0.105} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={blockColors[color]} roughness={0.68} metalness={0.01} transparent={transparent} opacity={transparent ? 0.28 : 1} />
      </RoundedBox>
      {!transparent ? (
        <mesh position={[0, 0.476, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.68, 0.68]} />
          <meshStandardMaterial color={topColor} roughness={0.8} transparent opacity={0.42} />
        </mesh>
      ) : null}
    </>
  );
}

function Block({ block, buildMode, dragArmed, draggingSource, fixed = false, onRemove, onRecolor, onStartDrag, onTapSurface }: {
  block: SpatialBlock;
  buildMode: "place" | "delete" | "paint";
  dragArmed: boolean;
  draggingSource?: boolean;
  fixed?: boolean;
  onRemove?: (position: GridPosition) => void;
  onRecolor?: (position: GridPosition) => void;
  onStartDrag?: SpatialBlocksCanvasProps["onStartBlockDrag"];
  onTapSurface?: (position: GridPosition) => void;
}) {
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (fixed || buildMode !== "place" || dragArmed) return;
    event.stopPropagation();
    onStartDrag?.(block, { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY, pointerId: event.nativeEvent.pointerId });
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (dragArmed && onTapSurface && event.face) { const n = dominantNormal(event.face.normal.clone().transformDirection(event.object.matrixWorld)); onTapSurface({ x: block.position.x + n.x, y: block.position.y + n.y, z: block.position.z + n.z }); return; }
    if (fixed) return;
    if (buildMode === "delete") onRemove?.(block.position);
    else if (buildMode === "paint") onRecolor?.(block.position);
    else if (dragArmed) onTapSurface?.({ ...block.position, y: block.position.y + 1 });
  };

  return (
    <group
      position={[block.position.x, block.position.y + 0.5, block.position.z]}
      userData={draggingSource ? { dragSourceKey: spatialPositionKey(block.position) } : { gridPosition: block.position }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      scale={draggingSource ? 0.94 : 1}
    >
      <WoodenBlock color={block.color} transparent={draggingSource} />
    </group>
  );
}

function DraggedBlockPreview({ dragPointer, dragState, reducedMotion }: Pick<SpatialBlocksCanvasProps, "dragPointer" | "dragState" | "reducedMotion">) {
  const group = useRef<Group>(null);
  const { camera, gl, raycaster } = useThree();
  const pointer = useMemo(() => new Vector2(), []);
  const target = useMemo(() => new Vector3(), []);
  const previewPlane = useMemo(() => new Plane(), []);
  const direction = useMemo(() => new Vector3(), []);
  const sceneCenter = useMemo(() => new Vector3(0, 1.2, 0), []);
  const color = dragState.source?.kind === "tray" ? dragState.source.color : dragState.source?.block.color;

  useFrame((_, delta) => {
    if (!group.current || !color) return;
    if (dragState.candidate && dragState.valid) {
      target.set(dragState.candidate.x, dragState.candidate.y + 0.58, dragState.candidate.z);
    } else if (dragPointer) {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.set(((dragPointer.x - rect.left) / rect.width) * 2 - 1, -((dragPointer.y - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      // Keep the preview at island depth and under the pointer after rotation/zoom.
      previewPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(direction), sceneCenter);
      raycaster.ray.intersectPlane(previewPlane, target);
    }
    const speed = reducedMotion ? 1 : Math.min(1, delta * 18);
    group.current.position.lerp(target, speed);
    const targetScale = dragState.phase === "returning" ? 0.35 : dragState.phase === "dropping" ? 1 : 1.09;
    const nextScale = group.current.scale.x + (targetScale - group.current.scale.x) * speed;
    group.current.scale.setScalar(nextScale);
    if (!reducedMotion && dragState.phase === "dragging") group.current.rotation.y += delta * 0.55;
  });

  if (!color || dragState.phase === "idle" || dragState.phase === "lifting") return null;
  return (
    <group ref={group} renderOrder={5}>
      <WoodenBlock color={color} />
      <Edges color={dragState.valid ? "#DDF3C6" : "#C55B43"} lineWidth={2.2} />
    </group>
  );
}

function DropMarker({ dragState }: { dragState: SpatialDragState }) {
  if (dragState.phase !== "dragging" || !dragState.candidate) return null;
  return (
    <group position={[dragState.candidate.x, dragState.candidate.y + 0.012, dragState.candidate.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.43, 0.58, 24]} />
        <meshBasicMaterial color={dragState.valid ? "#DDF3C6" : "#C55B43"} transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

const mapPositions: readonly (readonly [number, number, number])[] = [
  [-4.1, 0.3, 1.4], [-1.65, 0.95, -3], [1.8, 0.05, 1.65], [3.5, 1.1, -2.6],
];

function MapRoutes({ completedIds }: { completedIds: readonly string[] }) {
  return (
    <>
      {mapPositions.slice(0, -1).map((position, index) => (
        <Line
          key={index}
          points={[position, mapPositions[index + 1]]}
          color={completedIds.includes(spatialJourneyIslands[index].id) ? "#F2C75C" : "#E8F5EE"}
          lineWidth={completedIds.includes(spatialJourneyIslands[index].id) ? 2.4 : 1.2}
          transparent
          opacity={0.82}
        />
      ))}
    </>
  );
}

function ArchipelagoMap({ completedIds, unlockedIds, restorationStages, freeUnlocked, onChooseChallenge, onChooseFree, reducedMotion }: Pick<SpatialBlocksCanvasProps, "completedIds" | "unlockedIds" | "restorationStages" | "freeUnlocked" | "onChooseChallenge" | "onChooseFree" | "reducedMotion">) {
  return (
    <group>
      <MapRoutes completedIds={completedIds} />
      {spatialJourneyIslands.map((challenge, index) => {
        const position = mapPositions[index];
        const completed = completedIds.includes(challenge.id);
        const stage = restorationStages[challenge.id] ?? 0;
        const unlocked = unlockedIds.includes(challenge.id);
        return (
          <group key={challenge.id} position={[position[0], position[1], position[2]]}>
            <IslandBase scale={0.7} alive={unlocked || completed} />
            {unlocked ? <GrassCluster position={[-1, 0.04, 0.65]} /> : null}
            <Restoration stage={stage} miniature islandId={challenge.id} reducedMotion={reducedMotion} />
            <MapLandmark challengeId={challenge.id} completed={completed} reducedMotion={reducedMotion} />
            <Html center position={[0, 2.25, 0]} zIndexRange={[2, 0]}>
              <button className={styles.islandLabel} data-complete={completed || undefined} type="button" disabled={!unlocked} onClick={() => onChooseChallenge(challenge.id)}>
                <span>{completed ? "已点亮" : unlocked ? (stage ? `已恢复 ${stage}/3` : `第 ${index + 1} 岛`) : "尚未开放"}</span>
                <strong>{challenge.title}</strong>
              </button>
            </Html>
          </group>
        );
      })}
      <group position={[0.25, -0.55, 5.5]}>
        {freeUnlocked ? <FreeIslandLand reducedMotion={reducedMotion} /> : null}
        <Html center position={[0, 1.85, 0]} zIndexRange={[2, 0]}>
          <button className={styles.islandLabel} data-free type="button" disabled={!freeUnlocked} onClick={onChooseFree}>
            <span>{freeUnlocked ? "概念迁移工坊" : "完成四座岛后开放"}</span><strong>自由创造岛</strong>
          </button>
        </Html>
      </group>
    </group>
  );
}

function FreeIslandLand({ reducedMotion }: { reducedMotion: boolean }) {
  const island = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!island.current || reducedMotion || document.hidden) return;
    island.current.position.y += (0 - island.current.position.y) * Math.min(1, delta * 2.5);
  });
  return <group ref={island} position={[0, reducedMotion ? 0 : -3, 0]}>
    <IslandBase scale={0.62} />
    <Tree position={[-0.65, 0.05, 0.2]} scale={0.58} />
    <mesh position={[0.3, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.6, 1.05, 8]} /><meshStandardMaterial color="#F2C75C" roughness={0.82} /></mesh>
  </group>;
}

function Restoration({ stage, miniature = false, islandId, reducedMotion = true }: { stage: number; miniature?: boolean; islandId?: string; reducedMotion?: boolean }) {
  return <group scale={miniature ? .45 : 1}>
    {stage >= 1 ? [-2, -1, 0].map((x) => <mesh key={x} position={[x, .08, 1.8]}><boxGeometry args={[.6, .09, .4]} /><meshStandardMaterial color="#F2C75C" /></mesh>) : null}
    {stage >= 2 ? [-1.8, 1.8].map((x) => <group key={x} position={[x, .18, -.8]}><GrassCluster position={[0, 0, 0]} /><mesh position={[0, .35, 0]}><icosahedronGeometry args={[.19, 0]} /><meshStandardMaterial color="#EE8354" /></mesh></group>) : null}
    {stage >= 1 && islandId === "light-tower" ? <Flag position={[-2, .1, -.6]} reducedMotion={reducedMotion} /> : null}
    {stage >= 2 && islandId === "little-bridge" ? <JourneyBird active reducedMotion={reducedMotion} /> : null}
    {stage >= 2 && islandId === "lookout-garden" ? <Tree position={[-2, .1, 1]} scale={stage === 3 ? .9 : .45} /> : null}
  </group>;
}

function ChallengeScene(props: SpatialBlocksCanvasProps & { challenge: SpatialChallengeDefinition }) {
  const missing = useMemo(() => getMissingChallengePositions(props.challenge, props.blocks), [props.blocks, props.challenge]);
  const visibleTargets = props.sceneTargetPositions ?? missing;
  const hintTargets = props.journeyScene?.kind === "independent-check" && props.hintLevel === 3 ? missing.slice(0, 1) : visibleTargets;
  const complete = props.sceneComplete;
  const stage = Math.max(props.restorationStages[props.challenge.id] ?? 0, complete ? ((props.journeyScene?.order ?? 1) - 1) % 3 + 1 : 0);
  const sourceKey = props.dragState.source?.kind === "placed" ? spatialPositionKey(props.dragState.source.block.position) : undefined;
  return (
    <group>
      <ChallengeTerrain challengeId={props.challenge.id} completed={stage === 3} bridgeZ={props.challenge.targetBlocks[0]?.z} beaconPosition={(() => { const top = [...props.challenge.targetBlocks].sort((a, b) => b.y - a.y)[0]; return top ? [top.x, top.y + 1.18, top.z] : undefined; })()} />
      <Restoration stage={stage} islandId={props.challenge.id} reducedMotion={props.reducedMotion} />
      <JourneyBird key={`${props.journeyScene?.id}-${props.observationStep?.id}-${complete}`} target={props.observationStep?.position ?? props.sceneTargetPositions?.[0]} active={props.guideActive || complete} walking={props.challenge.id === "little-bridge" && (complete || props.observationStep?.action === "connect" && props.observationPhase === "express")} reducedMotion={props.reducedMotion} />
      {props.challenge.initialBlocks.map((position) => (
        <Block key={`fixed-${spatialPositionKey(position)}`} block={{ position, color: "stone" }} fixed buildMode={props.buildMode} dragArmed={props.dragArmed} onTapSurface={props.onTapDrop} />
      ))}
      {props.blocks.map((block) => (
        <Block
          key={spatialPositionKey(block.position)} block={block} fixed={props.journeyScene?.kind === "observe"} buildMode={props.buildMode} dragArmed={props.dragArmed}
          draggingSource={sourceKey === spatialPositionKey(block.position)} onRemove={props.onRemove} onStartDrag={props.onStartBlockDrag} onTapSurface={props.onTapDrop}
        />
      ))}
      {props.journeyScene?.kind === "independent-check" ? <IndependentGrid onTap={props.onTapDrop} armed={props.dragArmed} width={props.journeyScene.interaction.bounds.width} depth={props.journeyScene.interaction.bounds.depth} /> : null}
      {props.observationStep && props.observationStep.action !== "add" && props.observationPhase === "verify" ? (
        <Html position={[props.observationStep.position.x, props.observationStep.position.y + 1.1, props.observationStep.position.z]} center occlude zIndexRange={[3, 0]}>
          <button className={styles.sceneTarget} aria-label="动手验证这个位置" onClick={() => props.onObservationVerify(props.observationStep!.id)}>＋</button>
        </Html>
      ) : null}
      {props.journeyScene?.kind !== "independent-check" || props.hintLevel === 3 ? hintTargets.map((position) => (
        <RoundedBox
          key={`ghost-${spatialPositionKey(position)}`} args={[0.96, 0.96, 0.96]} radius={0.1} smoothness={3}
          position={[position.x, position.y + 0.5, position.z]} userData={{ dropPosition: position }}
          onClick={(event) => { event.stopPropagation(); if (props.dragArmed) props.onTapDrop(position); }}
        >
          <meshStandardMaterial color="#F2C75C" transparent opacity={props.hintVisible ? 0.48 : 0.2} depthWrite={false} />
          <Edges color="#F7E7A6" lineWidth={1.1} />
          <Html center zIndexRange={[3, 0]}><button className={styles.ghostTarget} aria-label="放在发亮的位置" onClick={(e) => { e.stopPropagation(); if (props.dragArmed) props.onTapDrop(position); }} /></Html>
        </RoundedBox>
      )) : null}
      <CompletionDetail effect={props.challenge.completionEffect} completed={stage === 3} reducedMotion={props.reducedMotion} />
    </group>
  );
}

function IndependentGrid({ onTap, armed, width, depth }: { onTap: (p: GridPosition) => void; armed: boolean; width: number; depth: number }) {
  const cells = useMemo(() => {
    const result: GridPosition[] = [];
    for (let x = -width / 2;x < width / 2;x += 1) for (let z = -depth / 2;z < depth / 2;z += 1) result.push({ x, y: 0, z });
    return result;
  }, [width, depth]);
  return <group>
    {cells.map((cell) => (
      <mesh key={`independent-${spatialPositionKey(cell)}`} position={[cell.x, 0.095, cell.z]} userData={{ dropPosition: cell }} receiveShadow onClick={(e) => { e.stopPropagation(); if (armed) onTap(cell); }}>
        <boxGeometry args={[0.94, 0.04, 0.94]} />
        <meshStandardMaterial color={(cell.x + cell.z) % 2 === 0 ? "#D9E8D1" : "#CDE0C7"} roughness={1} />
      </mesh>
    ))}
  </group>;
}

function FreeBuildScene(props: SpatialBlocksCanvasProps) {
  const cells = useFreeBuildCells();
  const sourceKey = props.dragState.source?.kind === "placed" ? spatialPositionKey(props.dragState.source.block.position) : undefined;
  return (
    <group>
      <IslandBase position={[0, -0.12, 0]} scale={1.58} />
      <Tree position={[-4.25, 0.05, 2.5]} scale={0.82} />
      <Tree position={[4.1, 0.05, -2.45]} scale={0.76} />
      {cells.map((cell) => (
        <mesh
          key={`cell-${spatialPositionKey(cell)}`} position={[cell.x, 0.095, cell.z]} userData={{ dropPosition: cell }} receiveShadow
          onClick={(event) => { event.stopPropagation(); if (props.dragArmed) props.onTapDrop(cell); }}
        >
          <boxGeometry args={[0.94, 0.045, 0.94]} />
          <meshStandardMaterial color={(cell.x + cell.z) % 2 === 0 ? "#CDE0C7" : "#D9E8D1"} roughness={1} />
        </mesh>
      ))}
      {props.blocks.map((block) => (
        <Block
          key={spatialPositionKey(block.position)} block={block} buildMode={props.buildMode} dragArmed={props.dragArmed}
          draggingSource={sourceKey === spatialPositionKey(block.position)} onRemove={props.onRemove} onRecolor={props.onRecolor}
          onStartDrag={props.onStartBlockDrag} onTapSurface={props.onTapDrop}
        />
      ))}
    </group>
  );
}

function DemoScene({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const demoBlocks = useRef<(Group | null)[]>([]);
  const flag = useRef<Group>(null);
  const challenge = getSpatialSceneBuildDefinition(spatialJourneyIslands[0].scenes[1]);
  const missing = getMissingChallengePositions(challenge, []);

  useFrame(({ clock }) => {
    if (reducedMotion || document.hidden) return;
    const cycle = clock.elapsedTime % 12;
    const visibleCount = Math.min(missing.length, Math.max(0, Math.floor((cycle - 2) / 1.4) + 1));
    demoBlocks.current.forEach((block, index) => { if (block) block.visible = index < visibleCount; });
    if (flag.current) flag.current.visible = visibleCount === missing.length;
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.24;
  });

  return (
    <group ref={group}>
      <ChallengeTerrain challengeId={challenge.id} completed />
      {challenge.initialBlocks.map((position) => (
        <Block key={spatialPositionKey(position)} block={{ position, color: "stone" }} fixed buildMode="place" dragArmed={false} />
      ))}
      {missing.map((position, index) => (
        <group key={spatialPositionKey(position)} ref={(node) => { demoBlocks.current[index] = node; }} visible={reducedMotion}>
          <Block block={{ position, color: challenge.blockColor }} fixed buildMode="place" dragArmed={false} />
        </group>
      ))}
      <group ref={flag} visible={reducedMotion}><Flag reducedMotion={reducedMotion} /></group>
    </group>
  );
}

export function SpatialBlocksCanvas(props: SpatialBlocksCanvasProps) {
  const orbitTarget = props.challenge?.camera.target ?? [0, props.view === "map" ? 0 : 1, 0];
  const interactiveView = props.view === "challenge" || props.view === "free";
  return (
    <Canvas
      shadows dpr={props.coarsePointer ? [1, 1.25] : [1, 1.5]}
      camera={{ fov: 42, near: 0.1, far: 120, position: [9, 8, 9] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onPointerMissed={() => { if (props.dragArmed) props.onCancelDrag(); }}
    >
      <color attach="background" args={["#CDE7EC"]} />
      <fog attach="fog" args={["#CDE7EC", 22, 52]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight color="#FFF8E8" groundColor="#536762" intensity={1.25} />
      <directionalLight
        position={[9, 14, 8]} intensity={2.35} color="#FFF1D2" castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={11} shadow-camera-bottom={-11}
      />
      <WorldEnvironment reducedMotion={props.reducedMotion} />
      <SpatialCamera view={props.view} challenge={props.challenge} viewAxis={props.viewAxis} resetToken={props.resetToken} reducedMotion={props.reducedMotion} bookExpanded={props.bookExpanded} onObservedAxis={props.onObservedAxis} />
      <CanvasLifecycle onContextLost={props.onContextLost} />
      {props.view === "demo" ? <DemoScene reducedMotion={props.reducedMotion} /> : null}
      {props.view === "map" ? <ArchipelagoMap completedIds={props.completedIds} unlockedIds={props.unlockedIds} restorationStages={props.restorationStages} freeUnlocked={props.freeUnlocked} onChooseChallenge={props.onChooseChallenge} onChooseFree={props.onChooseFree} reducedMotion={props.reducedMotion} /> : null}
      {props.view === "challenge" && props.challenge ? <ChallengeScene {...props} challenge={props.challenge} /> : null}
      {props.view === "free" ? <FreeBuildScene {...props} /> : null}
      {interactiveView ? (
        <>
          <DragResolver {...props} />
          <DropMarker dragState={props.dragState} />
          {props.keyboardPosition ? <group position={[props.keyboardPosition.x, props.keyboardPosition.y + .5, props.keyboardPosition.z]}><mesh><boxGeometry args={[1.02, 1.02, 1.02]} /><meshBasicMaterial color="#EE8354" wireframe /></mesh></group> : null}
          <DraggedBlockPreview dragState={props.dragState} dragPointer={props.dragPointer} reducedMotion={props.reducedMotion} />
        </>
      ) : null}
      <OrbitControls
        makeDefault enabled={props.controlsEnabled && props.dragState.phase === "idle"} enablePan={false} enableZoom={props.view !== "demo"}
        minDistance={7} maxDistance={props.view === "map" ? 36 : 24} minPolarAngle={0.001} maxPolarAngle={1.565}
        target={[orbitTarget[0], orbitTarget[1], orbitTarget[2]]}
      />
    </Canvas>
  );
}
