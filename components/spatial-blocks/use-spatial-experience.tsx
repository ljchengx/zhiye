"use client";

import {
  Trash2
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useKidsAuth } from "@/components/kids-auth-provider";
import {
  createSpatialBuildState,
  getMissingChallengePositions,
  recolorSpatialBlock,
  removeSpatialBlock,
  type GridPosition,
  type SpatialBlockColor,
  type SpatialBuildState,
  type SpatialChallengeDefinition
} from "@/lib/kids/spatial-blocks";
import {
  getGuidedSpatialTargetPositions,
  getIslandRestorationStage,
  getSpatialJourneyCompletedIslandIds,
  getSpatialJourneyIsland,
  getSpatialJourneyScene,
  getSpatialSceneBuildDefinition,
  getUnlockedSpatialSceneIds,
  makeSpatialJourneySceneKey,
  spatialJourneyIslands,
  spatialJourneyScenes,
  type SpatialJourneySceneDefinition,
  type SpatialViewAxis
} from "@/lib/kids/spatial-journey";


import { createJourneyState, getObservationBuildTargets, reduceSpatialJourney, type JourneyEvent } from "@/lib/kids/spatial-journey-state";
import { getSpatialNarration } from "@/lib/kids/spatial-narration";
import styles from "./spatial-blocks.module.css";
import { useJourneyTraces } from "./use-journey-traces";
import { useSpatialDrag } from "./use-spatial-drag";
import { useSpatialIdleHint, useSpatialNarration } from "./use-spatial-narration";


type SpatialView = "map" | "challenge" | "free";
function replaceSpatialUrl(query = "") {
  window.history.replaceState(null, "", `/kids/spatial-blocks${query}`);
}

function detectWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useSpatialExperience() {
  const { child, status: authStatus } = useKidsAuth();
  const { exploration, explorationReady, storageMessage, setStorageMessage, saveEvent, clearTraces } = useJourneyTraces(child?.id, authStatus === "loading");
  const [view, setView] = useState<SpatialView>("map");
  const [challenge, setChallenge] = useState<SpatialChallengeDefinition>();
  const [journeyScene, setJourneyScene] = useState<SpatialJourneySceneDefinition>();
  const [viewAxis, setViewAxis] = useState<SpatialViewAxis>("front");
  const [buildState, setBuildState] = useState<SpatialBuildState>(createSpatialBuildState);
  const [buildMode, setBuildMode] = useState<"place" | "delete" | "paint">("place");
  const [touchMode, setTouchMode] = useState<"build" | "rotate">("build");
  const [selectedColor, setSelectedColor] = useState<SpatialBlockColor>("sun");
  const [journeyState, setJourneyState] = useState(createJourneyState);
  const dispatchJourney = useCallback((event: JourneyEvent) => {
    if (journeyScene) setJourneyState((state) => reduceSpatialJourney(journeyScene, state, event));
  }, [journeyScene]);
  const hintLevel = journeyState.hint;
  const hintVisible = hintLevel > 0;
  const compareOpen = journeyState.compare;
  const complete = journeyState.phase === "complete";
  const [bookExpanded, setBookExpanded] = useState(true);
  const finishedAttempt = useRef(false);

  const [resetToken, setResetToken] = useState(0);
  const [canvasFailure, setCanvasFailure] = useState(false);
  const [canvasAttempt, setCanvasAttempt] = useState(0);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showDragCoach, setShowDragCoach] = useState(false);
  const [showGuideBird, setShowGuideBird] = useState(false);
  const queryApplied = useRef<string | undefined>(undefined);
  const buildStateRef = useRef<SpatialBuildState>(buildState);


  useEffect(() => {
    buildStateRef.current = buildState;
  }, [buildState]);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreferences = () => {
      setCoarsePointer(coarse.matches);
      setReducedMotion(reduced.matches);
    };
    syncPreferences();
    coarse.addEventListener("change", syncPreferences);
    reduced.addEventListener("change", syncPreferences);
    return () => {
      coarse.removeEventListener("change", syncPreferences);
      reduced.removeEventListener("change", syncPreferences);
    };
  }, []);

  const observationStep = journeyScene?.interaction.kind === "observe" ? journeyScene.interaction.steps[journeyState.step] : undefined;
  const observationBuilding = observationStep?.action === "add";
  const sceneTargetPositions = journeyScene
    ? journeyScene.kind === "observe" ? getObservationBuildTargets(journeyScene, journeyState, buildState.blocks)
      : getGuidedSpatialTargetPositions(journeyScene, buildState.blocks)
    : undefined;
  const guidedStep = journeyScene?.interaction.kind === "guided-build" ? journeyScene.interaction.steps[journeyState.step] : undefined;
  const expectedAxis = observationStep?.axis ?? guidedStep?.axis;
  const missingForHint = challenge ? getMissingChallengePositions(challenge, buildState.blocks) : [];
  const subtitle = complete ? getSpatialJourneyIsland(journeyScene?.islandId)?.restorationEffects[((journeyScene?.order ?? 1) - 1) % 3]?.label ?? ""
    : hintLevel ? hintLevel === 3 && !missingForHint.length ? "这里多出了一块，看看哪个方向不一样。" : journeyScene?.hintText[hintLevel - 1] ?? ""
      : journeyState.feedback || observationStep?.prompt || journeyScene?.narration.subtitle || "";
  const narration = getSpatialNarration(subtitle);
  const { audioRef, soundEnabled, toggleSound, playing, replay } = useSpatialNarration(narration, authStatus === "authenticated" && view === "challenge");
  useEffect(() => {
    setCanvasFailure(!detectWebGl());
  }, [canvasAttempt]);

  const completedIds = useMemo(() => getSpatialJourneyCompletedIslandIds(exploration.traces), [exploration]);
  const restorationStages = useMemo(() => Object.fromEntries(spatialJourneyIslands.map((island) => [island.id, getIslandRestorationStage(island.id, exploration.traces)])), [exploration]);
  const unlockedSceneIds = useMemo(() => getUnlockedSpatialSceneIds(exploration.traces), [exploration]);
  const unlockedIds = useMemo(() => spatialJourneyIslands
    .filter((island, index) => index === 0 || completedIds.includes(spatialJourneyIslands[index - 1].id))
    .map((island) => island.id), [completedIds]);

  const { dragState, dragPointer, dragArmed, resetDrag, finishDrag, beginDrag, startBlockDrag, handleDragCandidate, armKeyboard, keyboardPosition, nudgeKeyboard } = useSpatialDrag({
    view, challenge, journeyScene, targetPositions: sceneTargetPositions, reducedMotion, complete: complete || (observationBuilding && journeyState.phase !== "verify"), touchMode, buildStateRef, setBuildState, setBuildMode, setTouchMode, setShowDragCoach, setShowGuideBird,
  });

  const enterScene = useCallback((islandId: string, sceneId: string, updateUrl = true) => {
    const nextScene = getSpatialJourneyScene(islandId, sceneId);
    const nextChallenge = nextScene ? getSpatialSceneBuildDefinition(nextScene) : undefined;
    const sceneKey = nextScene ? makeSpatialJourneySceneKey(islandId, sceneId) : "";
    const completingNext = Boolean(journeyScene && journeyScene.order + 1 === nextScene?.order && complete);
    if (!nextScene || !nextChallenge || (!unlockedSceneIds.includes(sceneKey) && !completingNext)) return;
    resetDrag();
    setChallenge(nextChallenge);
    setJourneyScene(nextScene);
    const emptyState = createSpatialBuildState();
    buildStateRef.current = emptyState;
    setBuildState(emptyState);
    setBuildMode("place");
    setTouchMode("build");
    setJourneyState(createJourneyState());
    finishedAttempt.current = false;
    setViewAxis(nextScene.allowedViews[0] ?? "front");
    setShowDragCoach(nextScene.kind === "guided-build" && nextScene.islandId === "stone-steps" && !reducedMotion);
    setShowGuideBird(true);
    setView("challenge");
    setResetToken((token) => token + 1);
    const query = `?challenge=${encodeURIComponent(islandId)}&scene=${encodeURIComponent(sceneId)}`;
    if (updateUrl) replaceSpatialUrl(query);
    queryApplied.current = query;
    void saveEvent(sceneKey, "started");
    replay();
  }, [complete, journeyScene, reducedMotion, resetDrag, saveEvent, unlockedSceneIds]);

  const enterChallenge = useCallback((islandId: string, updateUrl = true) => {
    const island = getSpatialJourneyIsland(islandId);
    if (!island || !unlockedIds.includes(islandId)) return;
    const nextScene = island.scenes.find((sceneItem) => unlockedSceneIds.includes(makeSpatialJourneySceneKey(islandId, sceneItem.id))
      && !exploration.traces.some((trace) => trace.challengeId === makeSpatialJourneySceneKey(islandId, sceneItem.id) && trace.status === "completed"))
      ?? island.scenes[0];
    if (nextScene) enterScene(islandId, nextScene.id, updateUrl);
  }, [enterScene, unlockedIds, unlockedSceneIds, exploration.traces]);

  const enterMap = useCallback(() => {
    resetDrag();
    setView("map");
    setChallenge(undefined);
    setJourneyScene(undefined);
    setJourneyState(createJourneyState());
    finishedAttempt.current = false;
    setResetToken((token) => token + 1);
    replaceSpatialUrl();
    queryApplied.current = "";
  }, [resetDrag]);

  const enterFree = useCallback((updateUrl = true) => {
    if (completedIds.length < spatialJourneyIslands.length) return;
    resetDrag();
    setView("free");
    setChallenge(undefined);
    setJourneyScene(undefined);
    const emptyState = createSpatialBuildState();
    buildStateRef.current = emptyState;
    setBuildState(emptyState);
    setBuildMode("place");
    setTouchMode("build");
    setJourneyState(createJourneyState());
    finishedAttempt.current = false;
    setResetToken((token) => token + 1);
    if (updateUrl) replaceSpatialUrl("?mode=free");
    queryApplied.current = "?mode=free";
  }, [completedIds.length, resetDrag]);

  useEffect(() => {
    if (!showDragCoach && !showGuideBird) return;
    const timer = window.setTimeout(() => { setShowDragCoach(false); setShowGuideBird(false); }, 2600);
    return () => window.clearTimeout(timer);
  }, [showDragCoach, showGuideBird]);

  useEffect(() => {
    if (!child || !explorationReady) return;
    const query = window.location.search;
    if (queryApplied.current === query) return;
    queryApplied.current = query;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "free") {
      if (completedIds.length === spatialJourneyIslands.length) enterFree(false);
      else replaceSpatialUrl();
      return;
    }
    const islandId = params.get("challenge");
    const sceneId = params.get("scene");
    if (islandId && sceneId) {
      if (unlockedSceneIds.includes(makeSpatialJourneySceneKey(islandId, sceneId))) enterScene(islandId, sceneId, false);
      else enterMap();
    } else if (islandId) {
      if (unlockedIds.includes(islandId)) enterChallenge(islandId, false);
      else enterMap();
    } else if (sceneId) enterMap();
    // URL application is guarded by queryApplied; callback identities can change as a scene starts.
  }, [child, completedIds.length, explorationReady, unlockedIds, unlockedSceneIds]);

  useEffect(() => {
    if (view === "challenge") dispatchJourney({ type: "build", blocks: buildState.blocks });
  }, [buildState.blocks, journeyScene, view, dispatchJourney]);
  useEffect(() => {
    if (!complete || !journeyScene || finishedAttempt.current) return;
    finishedAttempt.current = true;
    void saveEvent(makeSpatialJourneySceneKey(journeyScene.islandId, journeyScene.id), "completed");
  }, [complete, journeyScene, saveEvent]);
  useSpatialIdleHint(view === "challenge" && !complete, dragState.phase !== "idle" || playing,
    () => { dispatchJourney({ type: "hint", automatic: true }); setShowGuideBird(true); },
    journeyScene ? makeSpatialJourneySceneKey(journeyScene.islandId, journeyScene.id) : undefined,
    `${journeyState.step}:${journeyState.phase}:${journeyState.observedAxis}:${buildState.undoStack.length}`);
  useEffect(() => {
    if (guidedStep) { setViewAxis(guidedStep.axis); setResetToken((n) => n + 1); }
  }, [guidedStep]);
  const observeAxis = useCallback((axis: SpatialViewAxis) => dispatchJourney({ type: "view", axis }), [dispatchJourney]);
  const tapDrop = (position: GridPosition) => {
    if (!dragArmed || buildMode !== "place" || touchMode === "rotate") return;
    finishDrag(position);
  };
  const removeBlock = (position: GridPosition) => {
    if (touchMode === "rotate") return;
    setBuildState((current) => {
      const next = removeSpatialBlock(current, position, journeyScene?.interaction.initialBlocks, journeyScene?.interaction.bounds);
      buildStateRef.current = next;
      return next;
    });
  };
  const recolorBlock = (position: GridPosition) => {
    if (view !== "free" || touchMode === "rotate") return;
    setBuildState((current) => {
      const next = recolorSpatialBlock(current, position, selectedColor);
      buildStateRef.current = next;
      return next;
    });
  };

  const restartChallenge = () => {
    resetDrag();
    const emptyState = createSpatialBuildState();
    buildStateRef.current = emptyState;
    setBuildState(emptyState);
    setJourneyState(createJourneyState());
    finishedAttempt.current = false;

    if (journeyScene) void saveEvent(makeSpatialJourneySceneKey(journeyScene.islandId, journeyScene.id), "started");
  };

  const requestHint = () => { dispatchJourney({ type: "hint" }); setShowGuideBird(true); };
  const nextScene = journeyScene
    ? spatialJourneyScenes.find((sceneItem) => sceneItem.order === journeyScene.order + 1)
    : undefined;

  const clearActivityTraces = async () => {
    if (!child || !window.confirm("清空橙子小朋友的空间积木探索足迹？四座岛屿将重新锁定。")) return;
    try {
      await clearTraces();
      setStorageMessage("");
      enterMap();
    } catch {
      setStorageMessage("当前浏览器无法清除探索足迹。");
    }
  };

  const settings = child ? (
    <div className={styles.parentSettings}>
      <p>只管理橙子小朋友在当前浏览器中的空间积木足迹。</p>
      <button type="button" onClick={clearActivityTraces}><Trash2 aria-hidden="true" size={17} />清除空间积木足迹</button>
    </div>
  ) : undefined;

  const title = view === "challenge" && journeyScene ? journeyScene.title : view === "free" ? "自由创造岛" : "空间积木";
  const instruction = view === "challenge" && journeyScene ? journeyScene.instruction : view === "free" ? "从托盘拿起方块，搭出自己的小岛" : "转动群岛，选择一座岛开始";
  const effectiveView: SpatialView | "demo" = child ? view : "demo";
  const freeUnlocked = completedIds.length === spatialJourneyIslands.length;
  const controlsEnabled = Boolean(child) && effectiveView !== "demo" && (!coarsePointer || touchMode === "rotate" || (journeyScene?.kind === "observe" && !observationBuilding));
  const renderedBlocks = journeyScene?.kind === "observe" && !observationBuilding ? journeyState.observationBlocks : buildState.blocks;
  const remaining = observationBuilding ? (observationStep.additions ?? []).filter((p) => !buildState.blocks.some((b) => b.position.x === p.x && b.position.y === p.y && b.position.z === p.z)).length : challenge ? getMissingChallengePositions(challenge, buildState.blocks).length : 0;
  const trayColor = challenge?.blockColor ?? selectedColor;
  const dragMessage = dragState.phase === "dragging"
    ? dragState.valid
      ? "可以放在这里"
      : dragState.reason === "occupied"
        ? "这里已经有方块"
        : dragState.reason === "unsupported"
          ? "下面需要一个方块"
          : dragState.reason === "not-a-target"
            ? "找找发亮的位置"
            : "把方块带回小岛"
    : "";
  const nextClipText = observationStep
    ? journeyState.phase === "express" && journeyScene?.interaction.kind === "observe" ? journeyScene.interaction.steps[journeyState.step + 1]?.prompt ?? nextScene?.narration.subtitle : observationStep.relation
    : guidedStep?.relation ?? nextScene?.narration.subtitle;

  return { title, child, instruction, soundEnabled, toggleSound, settings, effectiveView, journeyScene, audioRef, narration, nextClipText, authStatus, explorationReady, canvasFailure, setCanvasFailure, setCanvasAttempt, canvasAttempt, view, challenge, sceneTargetPositions, viewAxis, renderedBlocks, observationStep, journeyState, dispatchJourney, observeAxis, bookExpanded, complete, showGuideBird, hintLevel, completedIds, restorationStages, unlockedIds, freeUnlocked, buildMode, controlsEnabled, hintVisible, resetToken, reducedMotion, coarsePointer, dragState, dragPointer, keyboardPosition, dragArmed, enterChallenge, enterFree, tapDrop, removeBlock, recolorBlock, startBlockDrag, handleDragCandidate, resetDrag, expectedAxis, compareOpen, setBookExpanded, setViewAxis, setResetToken, subtitle, replay, enterMap, remaining, buildState, storageMessage, nudgeKeyboard, finishDrag, showDragCoach, trayColor, dragMessage, armKeyboard, beginDrag, selectedColor, setSelectedColor, touchMode, setTouchMode, setBuildMode, setBuildState, buildStateRef, requestHint, nextScene, enterScene, restartChallenge };
}
