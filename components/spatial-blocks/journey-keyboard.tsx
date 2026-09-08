"use client";
import type { GridPosition } from "@/lib/kids/spatial-blocks";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, ChevronUp } from "lucide-react";
import styles from "./journey.module.css";
export function JourneyKeyboard({ position, onMove, onPlace }: { position: GridPosition; onMove: (axis: "x" | "y" | "z", delta: number) => void; onPlace: () => void }) {
  return <div className={styles.keyboard} aria-label="选择搭建位置">
    <button aria-label="向左" onClick={() => onMove("x", -1)}><ArrowLeft /></button><button aria-label="向右" onClick={() => onMove("x", 1)}><ArrowRight /></button>
    <button aria-label="向前" onClick={() => onMove("z", 1)}><ArrowDown /></button><button aria-label="向后" onClick={() => onMove("z", -1)}><ArrowUp /></button>
    <button aria-label="上一层" onClick={() => onMove("y", 1)}><ChevronUp /></button><button aria-label="下一层" onClick={() => onMove("y", -1)}><ChevronDown /></button>
    <button aria-label="放在选中位置" onClick={onPlace}><Check /></button>
    <span className={styles.srOnly} aria-live="polite">横向 {position.x}，第 {position.y + 1} 层，纵向 {position.z}</span>
  </div>;
}
