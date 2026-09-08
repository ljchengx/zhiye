import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "../public/kids/audio/spatial-journey-manifest.json";
import { spatialJourneyScenes } from "../lib/kids/spatial-journey";
import { getSpatialNarration } from "../lib/kids/spatial-narration";

describe("本地普通话资源", () => {
  it("每条音频真实存在，清单时长在 2 到 6 秒之间", () => {
    for (const clip of manifest.clips) {
      expect(existsSync(`public${clip.audioSrc}`)).toBe(true);
      expect(readFileSync(`public${clip.audioSrc}`).byteLength).toBeGreaterThan(2000);
      expect(clip.durationSeconds).toBeGreaterThanOrEqual(2);
      expect(clip.durationSeconds).toBeLessThanOrEqual(6);
    }
  });
  it("每幕字幕、步骤和关系都有同文音频", () => {
    for (const scene of spatialJourneyScenes) {
      expect(getSpatialNarration(scene.narration.subtitle)?.subtitle).toBe(scene.narration.subtitle);
      for (const hint of scene.hintText) expect(getSpatialNarration(hint)?.subtitle).toBe(hint);
      if (scene.interaction.kind === "observe") for (const step of scene.interaction.steps) {
        expect(getSpatialNarration(step.prompt)).toBeDefined(); expect(getSpatialNarration(step.relation)).toBeDefined();
      }
      if (scene.interaction.kind === "guided-build") for (const step of scene.interaction.steps) expect(getSpatialNarration(step.relation)).toBeDefined();
    }
  });
});
