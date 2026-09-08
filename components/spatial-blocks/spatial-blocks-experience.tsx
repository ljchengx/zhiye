"use client";

import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  LogIn,
  RotateCcw
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  type ErrorInfo,
  type ReactNode
} from "react";

import { KidsActivityShell } from "@/components/kids-activity-shell";
import {
  FREE_BUILD_BOUNDS
} from "@/lib/kids/spatial-blocks";
import {
  getSpatialJourneyIsland,
  spatialJourneyIslands
} from "@/lib/kids/spatial-journey";


import { getSpatialNarration } from "@/lib/kids/spatial-narration";
import { JourneyDock } from "./journey-dock";
import { JourneyHandbook } from "./journey-handbook";
import { JourneyKeyboard } from "./journey-keyboard";
import { JourneyObservation } from "./journey-observation";
import styles from "./spatial-blocks.module.css";
import { useSpatialExperience } from "./use-spatial-experience";


const SpatialBlocksCanvas = dynamic(
  () => import("./spatial-blocks-canvas").then((module) => module.SpatialBlocksCanvas),
  {
    ssr: false,
    loading: () => <div className={styles.canvasLoading} role="status">小岛正在靠近…</div>,
  },
);


class SpatialCanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const inspirationCards = ["搭一个有高有低的花园", "搭一座左右连通的门", "搭一个能从三面看到的塔"] as const;

function EmptyCanvasState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.canvasFailure} role="alert">
      <Box aria-hidden="true" size={34} />
      <strong>当前浏览器没有打开 3D 场景</strong>
      <span>可以重试，或返回选择其他探究工具。</span>
      <div>
        <button type="button" onClick={onRetry}><RotateCcw aria-hidden="true" size={17} />重新尝试</button>
        <Link href="/kids"><ArrowLeft aria-hidden="true" size={17} />返回首页</Link>
      </div>
    </div>
  );
}

export function SpatialBlocksExperience() {
  const controller = useSpatialExperience();
  const { title, child, instruction, soundEnabled, toggleSound, settings, effectiveView, journeyScene, audioRef, narration, nextClipText, authStatus, explorationReady, canvasFailure, setCanvasFailure, setCanvasAttempt, canvasAttempt, view, challenge, sceneTargetPositions, viewAxis, renderedBlocks, observationStep, journeyState, dispatchJourney, observeAxis, bookExpanded, complete, showGuideBird, hintLevel, completedIds, restorationStages, unlockedIds, freeUnlocked, buildMode, controlsEnabled, hintVisible, resetToken, reducedMotion, coarsePointer, dragState, dragPointer, keyboardPosition, dragArmed, enterChallenge, enterFree, tapDrop, removeBlock, recolorBlock, startBlockDrag, handleDragCandidate, resetDrag, expectedAxis, compareOpen, setBookExpanded, setViewAxis, setResetToken, subtitle, replay, enterMap, remaining, buildState, storageMessage, nudgeKeyboard, finishDrag, showDragCoach, trayColor, dragMessage, armKeyboard, beginDrag, selectedColor, setSelectedColor, touchMode, setTouchMode, setBuildMode, setBuildState, buildStateRef, requestHint, nextScene, enterScene, restartChallenge } = controller;
  return (
    <KidsActivityShell
      title={child ? title : "空间积木"}
      instruction={child ? instruction : "看看方块怎样唤醒一座小岛"}
      soundEnabled={soundEnabled}
      onSoundToggle={child ? toggleSound : undefined}
      settings={settings}
    >
      <div className={styles.experience} data-testid="spatial-blocks-stage" data-view={effectiveView} data-observe={journeyScene?.kind === "observe" || undefined}>
        {journeyScene ? <audio ref={audioRef} key={narration?.audioSrc} preload="metadata" src={narration?.audioSrc} aria-label="当前幕普通话引导" /> : null}
        {nextClipText ? <link rel="preload" as="audio" href={getSpatialNarration(nextClipText)?.audioSrc} /> : null}
        {authStatus === "loading" || (child && !explorationReady) ? (
          <div className={styles.canvasLoading} role="status">正在找到橙子的小岛…</div>
        ) : canvasFailure ? (
          <EmptyCanvasState onRetry={() => { setCanvasFailure(false); setCanvasAttempt((value) => value + 1); }} />
        ) : (
          <SpatialCanvasBoundary onError={() => setCanvasFailure(true)} key={canvasAttempt}>
            <SpatialBlocksCanvas
              view={effectiveView}
              challenge={challenge}
              journeyScene={journeyScene}
              sceneTargetPositions={sceneTargetPositions}
              viewAxis={viewAxis}
              blocks={renderedBlocks}
              observationStep={observationStep}
              observationPhase={journeyState.phase}
              onObservationVerify={(targetId) => dispatchJourney({ type: "verify", targetId })}
              onObservedAxis={observeAxis}
              bookExpanded={bookExpanded}
              sceneComplete={complete}
              guideActive={showGuideBird || hintLevel > 0 || journeyState.phase === 'express'}
              completedIds={completedIds}
              restorationStages={restorationStages}
              unlockedIds={unlockedIds}
              freeUnlocked={freeUnlocked}
              buildMode={buildMode}
              controlsEnabled={controlsEnabled}
              hintVisible={hintVisible}
              hintLevel={hintLevel}
              resetToken={resetToken}
              reducedMotion={reducedMotion}
              coarsePointer={coarsePointer}
              dragState={dragState}
              dragPointer={dragPointer}
              keyboardPosition={keyboardPosition}
              dragArmed={dragArmed}
              onChooseChallenge={enterChallenge}
              onChooseFree={enterFree}
              onTapDrop={tapDrop}
              onRemove={removeBlock}
              onRecolor={recolorBlock}
              onStartBlockDrag={startBlockDrag}
              onDragCandidate={handleDragCandidate}
              onCancelDrag={resetDrag}
              onContextLost={() => setCanvasFailure(true)}
            />
          </SpatialCanvasBoundary>
        )}

        {child && journeyScene && view === "challenge" ? (
          <>
            <JourneyHandbook scene={journeyScene} blocks={renderedBlocks} axis={viewAxis} expectedAxis={expectedAxis} hint={hintLevel} compare={compareOpen} onExpanded={setBookExpanded}
              onAxisChange={(axis) => { setViewAxis(axis); setResetToken((token) => token + 1); }} />
            <div className={styles.narrationBar} aria-live="polite">
              <span>{subtitle}</span>
              <button type="button" onClick={replay} aria-label="重播引导语" title="重播引导语"><RotateCcw size={18} /></button>
            </div>
            <JourneyObservation scene={journeyScene} state={journeyState} dispatch={dispatchJourney} />
          </>
        ) : null}

        {!child && authStatus === "unauthenticated" ? (
          <section className={styles.guestPanel} aria-label="空间积木游客演示">
            <span>自然岛屿正在恢复</span>
            <h1>橙子的小小积木岛</h1>
            <Link href="/kids/login?next=%2Fkids%2Fspatial-blocks"><LogIn aria-hidden="true" size={18} />登录后动手搭建</Link>
          </section>
        ) : null}

        {child && view === "map" ? (
          <div className={styles.mapStatus}>
            <strong>{completedIds.length} / {spatialJourneyIslands.length} 座岛已点亮</strong>
            <span>从亮着的岛开始</span>
          </div>
        ) : null}

        {child && view === "free" ? (
          <div className={styles.inspirationRail} aria-label="自由创造灵感">
            <span>灵感卡</span>
            {inspirationCards.map((card) => <em key={card}>{card}</em>)}
          </div>
        ) : null}

        {child && view !== "map" ? (
          <div className={styles.sceneStatus}>
            <button type="button" onClick={enterMap}><ArrowLeft aria-hidden="true" size={17} />群岛地图</button>
            {view === "challenge" ? <span>{complete ? "小岛有了新变化" : journeyScene?.kind === "observe" ? "发现岛上的关系" : `还缺 ${remaining} 块`}</span> : <span>{buildState.blocks.length} / {FREE_BUILD_BOUNDS.maxBlocks} 块</span>}
          </div>
        ) : null}

        {storageMessage ? <p className={styles.storageMessage} role="status">{storageMessage}</p> : null}
        {keyboardPosition ? <JourneyKeyboard position={keyboardPosition} onMove={nudgeKeyboard} onPlace={() => finishDrag(keyboardPosition)} /> : null}

        <JourneyDock controller={controller} />

        {child && complete && challenge && journeyScene ? (
          <section className={styles.completePanel} role="status">
            <span><Check aria-hidden="true" size={18} />{journeyScene.conceptKeys.slice(0, 2).join(" · ")}</span>
            <h2>{getSpatialJourneyIsland(journeyScene.islandId)?.restorationEffects[journeyScene.order % 3 === 0 ? 2 : journeyScene.order % 3 - 1]?.label}</h2>
            <div>
              <button type="button" onClick={enterMap}>回到群岛</button>
              {nextScene ? <button type="button" onClick={() => enterScene(nextScene.islandId, nextScene.id)}>继续下一幕<ArrowRight aria-hidden="true" size={17} /></button> : null}
              <button type="button" onClick={restartChallenge}>再搭一次</button>
            </div>
          </section>
        ) : null}
      </div>
    </KidsActivityShell>
  );
}
