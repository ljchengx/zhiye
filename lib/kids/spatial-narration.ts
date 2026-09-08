import manifest from "../../public/kids/audio/spatial-journey-manifest.json";
import type { SpatialNarrationDefinition } from "./spatial-journey";

const clips = new Map<string, SpatialNarrationDefinition>(manifest.clips.map((clip) => [clip.subtitle, clip]));
export function getSpatialNarration(subtitle: string): SpatialNarrationDefinition | undefined {
  return clips.get(subtitle);
}
