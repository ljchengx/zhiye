"use client";
import { clearSpatialBlocks, redoSpatialBuild, undoSpatialBuild, type SpatialBlockColor } from "@/lib/kids/spatial-blocks";
import { Eye, Grid3X3, Lightbulb, MousePointer2, PaintBucket, Redo2, RotateCcw, Trash2, Undo2 } from "lucide-react";
import styles from "./spatial-blocks.module.css";
import type { useSpatialExperience } from "./use-spatial-experience";
const colorOptions: readonly { value: SpatialBlockColor; label: string; color: string }[] = [
  { value: "grass", label: "草地绿", color: "#72B96B" },
  { value: "sun", label: "阳光黄", color: "#F2C75C" },
  { value: "orange", label: "橙子色", color: "#EE8354" },
  { value: "stone", label: "岩石灰", color: "#77847F" },
];

function TrayCube({ color }: { color: SpatialBlockColor }) {
  return (
    <span className={styles.trayCube} data-color={color} aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}


export function JourneyDock({ controller }: { controller: ReturnType<typeof useSpatialExperience> }) {
  const { child, view, complete, journeyState, journeyScene, showDragCoach, trayColor, dragMessage, dragState, armKeyboard, beginDrag, remaining, selectedColor, setSelectedColor, coarsePointer, touchMode, resetDrag, setTouchMode, buildMode, setBuildMode, buildState, setBuildState, buildStateRef, compareOpen, dispatchJourney, hintVisible, requestHint, setResetToken } = controller;
  const observationBuilding = controller.observationStep?.action === "add";
  return <>{child && view !== "map" && !complete && (observationBuilding || (journeyState.phase !== "express" && journeyScene?.kind !== "observe")) ? (
    <>
      {showDragCoach ? (
        <div className={styles.dragCoach} aria-hidden="true">
          <TrayCube color={trayColor} />
          <MousePointer2 size={22} />
        </div>
      ) : null}
      {dragMessage ? <p className={styles.dragStatus} data-valid={dragState.valid || undefined} aria-live="polite">{dragMessage}</p> : null}
      <div className={styles.bottomDock} data-dragging={dragState.phase !== "idle" || undefined} data-returning={dragState.phase === "returning" || undefined}>
        <div className={styles.blockTray} aria-label="积木托盘">
          {view === "challenge" ? (
            <button
              className={styles.trayBlock}
              type="button"
              data-testid={`spatial-block-tray-${trayColor}`}
              disabled={observationBuilding && journeyState.phase !== "verify"}
              data-active={dragState.source?.kind === "tray" || undefined}
              aria-label={`拿起${colorOptions.find((option) => option.value === trayColor)?.label ?? "方块"}`}
              onClick={(event) => { if (event.detail === 0) armKeyboard({ kind: "tray", color: trayColor }); }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                beginDrag({ kind: "tray", color: trayColor }, {
                  x: event.clientX,
                  y: event.clientY,
                  pointerId: event.pointerId,
                });
              }}
            >
              <TrayCube color={trayColor} />
              <span><strong>{observationBuilding ? "叠叠积木" : "修复积木"}</strong><small>{observationBuilding && journeyState.phase === "predict" ? "先猜一猜" : observationBuilding && journeyState.phase === "express" ? "看看现在的高低" : `还需 ${remaining} 块`}</small></span>
            </button>
          ) : colorOptions.map((option) => (
            <button
              className={styles.trayColorBlock}
              type="button"
              key={option.value}
              data-testid={`spatial-block-tray-${option.value}`}
              data-active={selectedColor === option.value || undefined}
              aria-label={`拿起${option.label}方块`}
              title={option.label}
              onClick={(event) => { if (event.detail === 0) armKeyboard({ kind: "tray", color: option.value }); }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setSelectedColor(option.value);
                beginDrag({ kind: "tray", color: option.value }, {
                  x: event.clientX,
                  y: event.clientY,
                  pointerId: event.pointerId,
                });
              }}
            >
              <TrayCube color={option.value} />
            </button>
          ))}
        </div>

        <div className={styles.controls} aria-label="空间积木工具栏">
          {coarsePointer ? (
            <div className={styles.segmented} aria-label="触屏操作模式">
              <button type="button" data-active={touchMode === "build" || undefined} onClick={() => { resetDrag(); setTouchMode("build"); }}><Grid3X3 aria-hidden="true" size={17} /><span>搭建</span></button>
              <button type="button" data-active={touchMode === "rotate" || undefined} onClick={() => { resetDrag(); setTouchMode("rotate"); }}><Eye aria-hidden="true" size={17} /><span>转动</span></button>
            </div>
          ) : null}
          <div className={styles.toolGroup}>
            {!observationBuilding ? <>
            <button type="button" data-active={buildMode === "delete" || undefined} onClick={() => { resetDrag(); setBuildMode("delete"); setTouchMode("build"); }} title="删除方块" aria-label="删除方块"><Trash2 aria-hidden="true" size={18} /><span>删除</span></button>
            {view === "free" ? <button type="button" data-active={buildMode === "paint" || undefined} onClick={() => { resetDrag(); setBuildMode("paint"); setTouchMode("build"); }} title="给方块上色" aria-label="给方块上色"><PaintBucket aria-hidden="true" size={18} /><span>上色</span></button> : null}
            <button type="button" disabled={!buildState.undoStack.length} onClick={() => { resetDrag(); setBuildState((current) => { const next = undoSpatialBuild(current); buildStateRef.current = next; return next; }); }} title="撤销" aria-label="撤销"><Undo2 aria-hidden="true" size={18} /><span>撤销</span></button>
            <button type="button" disabled={!buildState.redoStack.length} onClick={() => { resetDrag(); setBuildState((current) => { const next = redoSpatialBuild(current); buildStateRef.current = next; return next; }); }} title="重做" aria-label="重做"><Redo2 aria-hidden="true" size={18} /><span>重做</span></button>
            </> : null}
            {journeyScene?.kind === "independent-check" ? <button type="button" data-active={compareOpen || undefined} onClick={() => dispatchJourney({ type: "compare" })} title="比较三视图" aria-label="对照一下"><Grid3X3 aria-hidden="true" size={18} /><span>对照</span></button> : null}
            {view === "challenge" ? <button type="button" data-active={hintVisible || undefined} onClick={requestHint} title="获得观察提示" aria-label="获得观察提示"><Lightbulb aria-hidden="true" size={18} /><span>提示</span></button> : null}
            <button type="button" onClick={() => setResetToken((token) => token + 1)} title="复位视角" aria-label="复位视角"><RotateCcw aria-hidden="true" size={18} /><span>视角</span></button>
            {view === "free" ? (
              <button
                type="button"
                disabled={!buildState.blocks.length}
                onClick={() => {
                  resetDrag();
                  if (window.confirm("清空自由创造岛上的所有方块？")) {
                    setBuildState((current) => {
                      const next = clearSpatialBlocks(current);
                      buildStateRef.current = next;
                      return next;
                    });
                  }
                }}
                title="全部清空"
                aria-label="全部清空"
              ><Trash2 aria-hidden="true" size={18} /><span>清空</span></button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  ) : null}</>;
}
