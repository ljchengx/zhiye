import { describe, expect, it } from "vitest";
import { generateWorksheetPlan } from "../lib/tools/math-worksheet";
import {
  EDITION_SHIFTS, NUMBER_CORE_KINDS, SCENE_DEFINITIONS, SCENE_KINDS,
} from "../lib/tools/number-sense/curriculum";
import type { NumberSenseProblem, SceneKind } from "../lib/tools/number-sense/types";

const ESTIMATION_KINDS: ReadonlySet<SceneKind> = new Set(["aboutHowMany", "reasonable"]);
// 手写的纯图形/逻辑集合，独立于 NUMBER_CORE_KINDS，能测出配额定义本身写错。
const GRAPHIC_ONLY: ReadonlySet<SceneKind> = new Set(["windows", "seats", "neighbors", "mirror", "tiles", "code", "path", "views", "beads", "order", "clues"]);

/** 题目材料里孩子真正会看到的数，与基线统计口径一致。 */
function materialNumbers(value: unknown, out: number[]): void {
  if (typeof value === "number") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => materialNumbers(item, out));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value))
      if (key !== "kind" && typeof item !== "boolean") materialNumbers(item, out);
}

describe("内容质量验收", () => {
  it("全部活动都声明重访变化类型，两版指令与追问都不同", () => {
    expect(SCENE_KINDS.length % 2).toBe(0);
    expect(Object.keys(EDITION_SHIFTS)).toHaveLength(SCENE_KINDS.length);
    // 数量核心活动始终占多数，图形与逻辑类是少数。
    expect(NUMBER_CORE_KINDS.size / SCENE_KINDS.length).toBeGreaterThanOrEqual(0.7);
    for (const kind of SCENE_KINDS) {
      const definition = SCENE_DEFINITIONS[kind];
      expect(EDITION_SHIFTS[kind], kind).toBeDefined();
      expect(definition.prompt, kind).not.toBe(definition.repeatPrompt);
      expect(definition.followUp, kind).not.toBe(definition.repeatFollowUp);
      expect(definition.prompt.length, kind).toBeLessThanOrEqual(24);
      expect(definition.followUp.length, kind).toBeLessThanOrEqual(24);
      expect(definition.repeatPrompt.length, kind).toBeLessThanOrEqual(24);
      expect(definition.repeatFollowUp.length, kind).toBeLessThanOrEqual(24);
    }
  });

  it("100 套计划：每份至少一面数量核心，每月都有估算任务，数值覆盖到 50 以上", () => {
    let noNumberDays = 0, totalDays = 0, big = 0, mid = 0, all = 0;
    for (let seed = 0; seed < 100; seed += 1) {
      const plan = generateWorksheetPlan(seed);
      let estimation = 0;
      for (const day of plan.days) {
        totalDays += 1;
        const kinds = day.pages.map((page) => page.activity.problem.kind);
        if (kinds.every((kind) => GRAPHIC_ONLY.has(kind))) noNumberDays += 1;
        for (const page of day.pages) {
          if (ESTIMATION_KINDS.has(page.activity.problem.kind)) estimation += 1;
          const numbers: number[] = [];
          materialNumbers(page.activity.problem as NumberSenseProblem, numbers);
          for (const value of numbers) {
            if (!Number.isInteger(value) || value < 0 || value > 100) continue;
            all += 1;
            if (value > 50) big += 1;
            if (value > 30) mid += 1;
          }
        }
      }
      expect(estimation, `种子 ${seed} 的估算任务`).toBeGreaterThanOrEqual(2);
      expect(estimation, `种子 ${seed} 的估算任务`).toBeLessThanOrEqual(4);
    }
    const bigRate = big / all, midRate = mid / all;
    console.log(`数值分布: >50 ${(bigRate * 100).toFixed(1)}% / >30 ${(midRate * 100).toFixed(1)}% / 共 ${all} 个数`);
    expect(noNumberDays, "整份都没有数量活动的份数").toBe(0);
    expect(totalDays).toBe(3000);
    // 基线是 >50 仅 0.9%、>30 仅 3.8%；上探后必须显著提升。
    expect(bigRate).toBeGreaterThanOrEqual(0.08);
    expect(midRate).toBeGreaterThanOrEqual(0.15);
  }, 180000);

  it("重写过的重访活动在纸面上换掉主任务，不只是换左右", () => {
    const rewritten: SceneKind[] = ["market", "compensation", "hidden", "parking"];
    for (const kind of rewritten) {
      const definition = SCENE_DEFINITIONS[kind];
      expect(definition.repeatPrompt, kind).not.toContain("换右边");
      expect(definition.repeatPrompt, kind).not.toBe(definition.prompt);
      expect(EDITION_SHIFTS[kind], kind).toBeDefined();
    }
  });
});
