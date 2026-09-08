"use client";
import { addSpatialBlock, FREE_BUILD_BOUNDS, moveSpatialBlock, validateSpatialDrop, type GridPosition, type SpatialBlock, type SpatialBuildState, type SpatialChallengeDefinition, type SpatialDragSource, type SpatialDragState, type SpatialDropValidationResult } from "@/lib/kids/spatial-blocks";
import { type SpatialJourneySceneDefinition } from "@/lib/kids/spatial-journey";
import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { SpatialPointerPosition } from "./spatial-blocks-canvas";
const emptyDragState: SpatialDragState = { phase: "idle" };
interface ActivePointerGesture { pointerId: number; startX: number; startY: number }
export function useSpatialDrag({ view, challenge, journeyScene, targetPositions, reducedMotion, complete, touchMode, buildStateRef, setBuildState, setBuildMode, setTouchMode, setShowDragCoach, setShowGuideBird }: {
  targetPositions?: readonly GridPosition[];
  view: "map" | "challenge" | "free"; challenge?: SpatialChallengeDefinition; journeyScene?: SpatialJourneySceneDefinition;
  reducedMotion: boolean; complete: boolean; touchMode: "build" | "rotate";
  buildStateRef: RefObject<SpatialBuildState>; setBuildState: Dispatch<SetStateAction<SpatialBuildState>>;
  setBuildMode: Dispatch<SetStateAction<"place" | "delete" | "paint">>; setTouchMode: Dispatch<SetStateAction<"build" | "rotate">>;
  setShowDragCoach: Dispatch<SetStateAction<boolean>>; setShowGuideBird: Dispatch<SetStateAction<boolean>>;
}) {
  const [dragState, setDragState] = useState<SpatialDragState>(emptyDragState);
  const [dragPointer, setDragPointer] = useState<SpatialPointerPosition>();
  const [dragArmed, setDragArmed] = useState(false);
  const [keyboardPosition, setKeyboardPosition] = useState<GridPosition>();
  const activePointer = useRef<ActivePointerGesture | undefined>(undefined);
  const dragStateRef = useRef<SpatialDragState>(emptyDragState);
  const dragTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (dragTimer.current) clearTimeout(dragTimer.current); }, []);
  const resetDrag = useCallback(() => {
    if (dragTimer.current) window.clearTimeout(dragTimer.current);
    activePointer.current = undefined;
    setDragArmed(false);
    setDragPointer(undefined);
    setKeyboardPosition(undefined);
    dragStateRef.current = emptyDragState;
    setDragState(emptyDragState);
  }, []);

  const finishDrag = useCallback((explicitCandidate?: GridPosition) => {
    const currentDrag = dragStateRef.current;
    if (!currentDrag.source || (view !== "challenge" && view !== "free")) return;
    const candidate = explicitCandidate ?? currentDrag.candidate;
    const validation = validateSpatialDrop({
      view: journeyScene?.kind === "independent-check" ? "free" : view,
      candidate,
      blocks: buildStateRef.current.blocks,
      source: currentDrag.source,
      challenge,
      bounds: journeyScene?.interaction.bounds ?? FREE_BUILD_BOUNDS,
      fixedBlocks: journeyScene?.interaction.initialBlocks,
      allowNonTarget: journeyScene?.kind === "independent-check",
      targetBlocks: targetPositions,
    });
    activePointer.current = undefined;
    setDragArmed(false);

    if (!validation.valid || !validation.position) {
      const returningState: SpatialDragState = { ...currentDrag, phase: "returning", candidate, valid: false, reason: validation.reason };
      dragStateRef.current = returningState;
      setDragState(returningState);
      dragTimer.current = window.setTimeout(resetDrag, reducedMotion ? 0 : 210);
      return;
    }

    const nextState = currentDrag.source.kind === "tray"
      ? addSpatialBlock(buildStateRef.current, { position: validation.position, color: currentDrag.source.color }, journeyScene?.interaction.bounds ?? FREE_BUILD_BOUNDS, journeyScene?.interaction.initialBlocks)
      : moveSpatialBlock(buildStateRef.current, currentDrag.source.block.position, validation.position, journeyScene?.interaction.bounds ?? FREE_BUILD_BOUNDS, journeyScene?.interaction.initialBlocks);
    buildStateRef.current = nextState;
    setBuildState(nextState);
    const droppingState: SpatialDragState = { ...currentDrag, phase: "dropping", candidate: validation.position, valid: true, reason: undefined };
    dragStateRef.current = droppingState;
    setDragState(droppingState);
    dragTimer.current = window.setTimeout(resetDrag, reducedMotion ? 0 : 170);
  }, [challenge, journeyScene, targetPositions, reducedMotion, resetDrag, view]);

  const beginDrag = useCallback((source: SpatialDragSource, pointer: SpatialPointerPosition & { pointerId: number }) => {
    if (complete || touchMode === "rotate") return;
    if (dragTimer.current) window.clearTimeout(dragTimer.current);
    setBuildMode("place");
    setTouchMode("build");
    setShowDragCoach(false);
    setShowGuideBird(false);
    setDragArmed(false);
    setDragPointer({ x: pointer.x, y: pointer.y });
    activePointer.current = {
      pointerId: pointer.pointerId,
      startX: pointer.x,
      startY: pointer.y,
    };
    const liftingState: SpatialDragState = { phase: "lifting", source };
    dragStateRef.current = liftingState;
    setDragState(liftingState);
  }, [complete, touchMode]);

  const startBlockDrag = useCallback((block: SpatialBlock, pointer: SpatialPointerPosition & { pointerId: number }) => {
    if (journeyScene?.kind === "observe") return;
    beginDrag({ kind: "placed", block }, pointer);
  }, [beginDrag, journeyScene]);

  const handleDragCandidate = useCallback((candidate: GridPosition | undefined, result: SpatialDropValidationResult) => {
    setDragState((current) => {
      if (current.phase !== "dragging") return current;
      const unchanged = current.candidate?.x === candidate?.x
        && current.candidate?.y === candidate?.y
        && current.candidate?.z === candidate?.z
        && current.valid === result.valid
        && current.reason === result.reason;
      if (unchanged) return current;
      const next = { ...current, candidate, valid: result.valid, reason: result.reason };
      dragStateRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!activePointer.current || (dragState.phase !== "lifting" && dragState.phase !== "dragging")) return;
    const handleMove = (event: PointerEvent) => {
      const gesture = activePointer.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      setDragPointer({ x: event.clientX, y: event.clientY });
      if (dragStateRef.current.phase === "lifting" && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) >= 6) {
        setDragState((current) => {
          const next: SpatialDragState = { ...current, phase: "dragging" };
          dragStateRef.current = next;
          return next;
        });
      }
    };
    const handleUp = (event: PointerEvent) => {
      const gesture = activePointer.current;
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const current = dragStateRef.current;
      activePointer.current = undefined;
      if (current.phase === "lifting") {
        setDragArmed(true);
        const armedState: SpatialDragState = { ...current, phase: "dragging" };
        dragStateRef.current = armedState;
        setDragState(armedState);
        return;
      }
      setDragPointer({ x: event.clientX, y: event.clientY });
      window.requestAnimationFrame(() => finishDrag());
    };
    const handleCancel = (event: PointerEvent) => {
      if (event.pointerId === activePointer.current?.pointerId) resetDrag();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
    };
  }, [dragState.phase, finishDrag, resetDrag]);

  useEffect(() => {
    if (!dragArmed) return;
    const handleMove = (event: PointerEvent) => setDragPointer({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [dragArmed]);

  useEffect(() => {
    if (dragState.phase === "idle") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetDrag();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dragState.phase, resetDrag]);


  const armKeyboard = (source: SpatialDragSource) => {
    if (complete || touchMode === "rotate") return;
    resetDrag();
    const next: SpatialDragState = { phase: "dragging", source };
    dragStateRef.current = next; setDragState(next); setDragArmed(true); setBuildMode("place");
    setKeyboardPosition(journeyScene?.kind !== "independent-check" && targetPositions?.[0] ? targetPositions[0] : { x: 0, y: 0, z: 0 });
  };
  const nudgeKeyboard = (axis: "x" | "y" | "z", delta: number) => setKeyboardPosition((p) => {
    if (!p) return p;
    const bounds = journeyScene?.interaction.bounds ?? FREE_BUILD_BOUNDS;
    const min = axis === "y" ? 0 : -(axis === "x" ? bounds.width : bounds.depth) / 2;
    const max = axis === "y" ? bounds.height - 1 : (axis === "x" ? bounds.width : bounds.depth) / 2 - 1;
    return { ...p, [axis]: Math.max(min, Math.min(max, p[axis] + delta)) };
  });
  useEffect(() => {
    if (!keyboardPosition) return;
    const handle = (event: KeyboardEvent) => {
      const moves: Record<string, ["x" | "y" | "z", number]> = { ArrowLeft: ["x", -1], ArrowRight: ["x", 1], ArrowUp: ["z", -1], ArrowDown: ["z", 1], PageUp: ["y", 1], PageDown: ["y", -1] };
      if (moves[event.key]) { event.preventDefault(); nudgeKeyboard(...moves[event.key]); }
      if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); finishDrag(keyboardPosition); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [keyboardPosition, finishDrag, journeyScene]);
  return { dragState, dragPointer, dragArmed, resetDrag, finishDrag, beginDrag, startBlockDrag, handleDragCandidate, armKeyboard, keyboardPosition, nudgeKeyboard };
}
