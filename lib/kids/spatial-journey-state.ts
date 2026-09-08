import { spatialPositionKey, type SpatialBlock } from "./spatial-blocks";
import { isSpatialJourneySceneComplete, type SpatialJourneySceneDefinition, type SpatialHintLevel, type SpatialViewAxis } from "./spatial-journey";

export interface JourneyState {
  step: number;
  phase: "predict" | "verify" | "express" | "complete";
  prediction?: string;
  observedAxis?: SpatialViewAxis;
  hint: SpatialHintLevel;
  compare: boolean;
  feedback: string;
  observationBlocks: readonly SpatialBlock[];
}
export const createJourneyState = (): JourneyState => ({ step: 0, phase: "predict", hint: 0, compare: false, feedback: "", observationBlocks: [] });
export function getObservationBuildTargets(scene: SpatialJourneySceneDefinition, state: JourneyState, blocks: readonly SpatialBlock[]) {
  if (scene.interaction.kind !== "observe" || state.phase !== "verify") return [];
  const step = scene.interaction.steps[state.step];
  if (step?.action !== "add") return [];
  const occupied = new Set(blocks.map((block) => spatialPositionKey(block.position)));
  // Reveal one supported landing at a time, including steps that add several blocks.
  return (step.additions ?? []).filter((position) => !occupied.has(spatialPositionKey(position))).slice(0, 1);
}
export type JourneyEvent =
  | { type: "reset" }
  | { type: "predict"; choice: string }
  | { type: "view"; axis: SpatialViewAxis }
  | { type: "verify"; targetId: string }
  | { type: "express"; choice: string }
  | { type: "build"; blocks: readonly SpatialBlock[] }
  | { type: "hint"; automatic?: boolean }
  | { type: "compare" };

// Only observable scene events advance the journey; a prediction alone never completes it.
export function reduceSpatialJourney(scene: SpatialJourneySceneDefinition, state: JourneyState, event: JourneyEvent): JourneyState {
  if (event.type === "reset") return createJourneyState();
  if (state.phase === "complete") return state;
  if (event.type === "hint") return { ...state, hint: event.automatic ? Math.max(1, state.hint) as SpatialHintLevel : Math.min(3, state.hint + 1) as SpatialHintLevel };
  if (event.type === "compare") return { ...state, compare: !state.compare };
  if (event.type === "view") return state.observedAxis === event.axis ? state : { ...state, observedAxis: event.axis };
  if (event.type === "build" && scene.interaction.kind !== "observe") {
    const complete = isSpatialJourneySceneComplete(scene, event.blocks);
    const occupied = new Set([...scene.interaction.initialBlocks, ...event.blocks.map((b) => b.position)].map(spatialPositionKey));
    const count = scene.interaction.kind === "guided-build" ? scene.interaction.steps.findIndex((s) => !occupied.has(spatialPositionKey(s.position))) : 0;
    const step = count < 0 ? scene.interaction.kind === "guided-build" ? scene.interaction.steps.length : 0 : count;
    const feedback = scene.interaction.kind === "guided-build" && step > state.step ? scene.interaction.steps[step - 1].relation : state.feedback;
    return { ...state, step, feedback, phase: complete ? "express" : "verify" };
  }
  if (scene.interaction.kind !== "observe") {
    if (event.type === "express" && state.phase === "express") return { ...state, phase: "complete" };
    return state;
  }
  const step = scene.interaction.steps[state.step];
  if (!step) return state;
  if (event.type === "build" && step.action === "add" && state.phase === "verify") {
    const occupied = new Set(event.blocks.map((block) => spatialPositionKey(block.position)));
    if (!step.additions?.every((position) => occupied.has(spatialPositionKey(position)))) return state;
    return { ...state, phase: "express", feedback: step.relation };
  }
  if (event.type === "predict" && state.phase === "predict" && step.choices.includes(event.choice)) return { ...state, prediction: event.choice, phase: "verify" };
  if (event.type === "verify" && state.phase === "verify") {
    if (step.action === "add") return state;
    if (event.targetId !== step.id || ((step.action === "reveal" || step.action === "match") && state.observedAxis !== step.axis)) return state;
    return { ...state, phase: "express", feedback: step.relation, observationBlocks: [...state.observationBlocks, ...(step.additions ?? []).map((position) => ({ position, color: "sun" as const }))] };
  }
  if (event.type === "express" && state.phase === "express") {
    if (event.choice !== step.expected) return { ...state, feedback: step.relation };
    return { ...state, step: state.step + 1, phase: state.step + 1 === scene.interaction.steps.length ? "complete" : "predict", prediction: undefined, observedAxis: undefined, hint: 0, feedback: "" };
  }
  return state;
}
