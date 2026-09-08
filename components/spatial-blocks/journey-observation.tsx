"use client";
import type { SpatialJourneySceneDefinition, SpatialViewAxis } from "@/lib/kids/spatial-journey";
import type { JourneyEvent, JourneyState } from "@/lib/kids/spatial-journey-state";
import { ArrowRight, Eye, Footprints } from "lucide-react";
import { ProjectionDiagram } from "./journey-handbook";
import styles from "./journey.module.css";

function ChoicePicture({ choice, scene }: { choice: string; scene: SpatialJourneySceneDefinition }) {
  if (["front", "side", "top"].includes(choice)) return <ProjectionDiagram blocks={scene.interaction.initialBlocks} axis={choice as SpatialViewAxis} label="观察形状" />;
  if (["左边高", "右边高", "一样高"].includes(choice)) return <span className={styles.heightPicture} aria-hidden="true">
    {[choice === "左边高" ? 3 : 2, choice === "右边高" ? 3 : 2].map((n, i) => <span key={i}>{Array.from({ length: n }, (_, k) => <i key={k} />)}</span>)}
  </span>;
  return <span className={styles.bankPicture} aria-hidden="true"><i data-lit={choice === "左岸"} /><b>{choice === "能过去" ? "→" : choice === "还不能" ? "…" : choice === "中间" ? "↓" : " "}</b><i data-lit={choice === "右岸"} /></span>;
}
export function JourneyObservation({ scene, state, dispatch }: { scene: SpatialJourneySceneDefinition; state: JourneyState; dispatch: (event: JourneyEvent) => void }) {
  if (state.phase === "complete") return null;
  if (scene.interaction.kind !== "observe") return state.phase === "express" ? <section className={styles.observation} aria-label="说说发现">
    <p>指一指，哪里有{scene.conceptKeys.join("、")}？</p>
    <button className={styles.primary} onClick={() => dispatch({ type: "express", choice: "pointed" })}>我指给小山雀看了<ArrowRight size={18} /></button>
  </section> : null;
  const step = scene.interaction.steps[state.step];
  if (!step) return null;
  const canVerify = !["reveal", "match"].includes(step.action) || state.observedAxis === step.axis;
  return <section className={styles.observation} aria-label="发现这一幕" data-phase={state.phase} data-building={step.action === "add" || undefined}>
    {state.phase !== "verify" ? <div className={styles.choices} aria-label={state.phase === "predict" ? "猜一猜" : "指一指看到的关系"}>
      {step.choices.map((choice, i) => <button key={choice} aria-label={step.action === "match" ? `形状${i + 1}` : choice} onClick={() => dispatch(state.phase === "predict" ? { type: "predict", choice } : { type: "express", choice })}>
        <ChoicePicture choice={choice} scene={scene} /><span>{step.action === "match" ? `${i + 1}` : choice}</span>
      </button>)}
    </div> : step.action === "add" ? null : <button className={styles.primary} disabled={!canVerify} onClick={() => dispatch({ type: "verify", targetId: step.id })}>
      {step.action === "connect" ? <Footprints size={22} /> : <Eye size={22} />}
      {step.action === "connect" ? "接起来，走一走" : step.action === "match" ? "看看这个方向" : step.action === "reveal" ? "指向露出的缺口" : "指向小岛上的位置"}
    </button>}
  </section>;
}
