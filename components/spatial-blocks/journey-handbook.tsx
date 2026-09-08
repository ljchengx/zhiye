"use client";
import type { GridPosition, SpatialBlock } from "@/lib/kids/spatial-blocks";
import { compareSpatialProjection, projectSpatialBlocks, type SpatialHintLevel, type SpatialJourneySceneDefinition, type SpatialViewAxis } from "@/lib/kids/spatial-journey";
import { BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";
import styles from "./journey.module.css";

export const viewNames = { front: "正面", side: "侧面", top: "顶部" };
export function ProjectionDiagram({ blocks, axis, difference = [], label }: { blocks: readonly (GridPosition | SpatialBlock)[]; axis: SpatialViewAxis; difference?: readonly { x: number; y: number }[]; label: string }) {
  const cells = projectSpatialBlocks(blocks, axis);
  // Every diagram shares a world-aligned grid; adding blocks never rescales the reference.
  return <svg viewBox="0 0 168 144" role="img" aria-label={label} className={styles.diagram}>
    {Array.from({ length: 42 }, (_, i) => {
      const x = i % 7 - 3, y = 4 - Math.floor(i / 7);
      const occupied = cells.some((c) => c.x === x && c.y === y);
      const differs = difference.some((c) => c.x === x && c.y === y);
      return <rect key={i} x={(x + 3) * 24 + 1} y={(4 - y) * 24 + 1} width="21" height="21" rx="2" fill={occupied ? "#39735A" : "#EDF4EC"} stroke={differs ? "#EE8354" : "#C9DCCF"} strokeWidth={differs ? 3 : 1} />;
    })}
  </svg>;
}

export function JourneyHandbook({ scene, blocks, axis, expectedAxis, onAxisChange, hint, compare, onExpanded }: {
  scene: SpatialJourneySceneDefinition; blocks: readonly SpatialBlock[]; axis: SpatialViewAxis; expectedAxis?: SpatialViewAxis;
  onAxisChange: (axis: SpatialViewAxis) => void; hint: SpatialHintLevel; compare: boolean; onExpanded: (expanded: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const actual = [...scene.interaction.initialBlocks, ...blocks];
  const target = scene.interaction.targetBlocks;
  const diff = compareSpatialProjection(target, actual, axis);
  const independent = scene.kind === "independent-check";
  return <aside className={styles.handbook} data-expanded={expanded} aria-label="观察手册">
    <button className={styles.bookHeading} onClick={() => { setExpanded(!expanded); onExpanded(!expanded); }} aria-expanded={expanded} aria-controls="journey-projections"><BookOpen size={19} />观察手册<ChevronDown size={17} /></button>
    <div className={styles.viewTabs} aria-label="观察方向">
      {scene.allowedViews.map((view) => <button key={view} aria-label={`${viewNames[view]}观察图`} aria-pressed={axis === view} data-cue={expectedAxis === view || undefined} onClick={() => onAxisChange(view)}>
        {viewNames[view]}{(compare || hint >= 2) && independent && (() => { const d = compareSpatialProjection(target, actual, view); return d.extra.length + d.missing.length ? <i aria-label="形状有不同" /> : null; })()}
      </button>)}
    </div>
    {expanded ? <div id="journey-projections" className={styles.projections} data-paired={independent}>
      {independent ? <figure><figcaption>想搭成的样子</figcaption><ProjectionDiagram blocks={target} axis={axis} label={`${viewNames[axis]}目标形状`} difference={hint >= 2 ? diff.missing : []} /></figure> : null}
      <figure><figcaption>现在的样子</figcaption><ProjectionDiagram blocks={actual} axis={axis} label={`${viewNames[axis]}当前形状`} difference={hint >= 2 ? [...diff.missing, ...diff.extra] : []} /></figure>
    </div> : null}
  </aside>;
}
