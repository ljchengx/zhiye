import { describe, expect, it } from "vitest";
import {
  createSpatialProblem, inspectSpatialProblem, SPATIAL_DEFINITIONS,
  spatialSignature, validateSpatialProblem, type SpatialProblem,
} from "../lib/tools/number-sense/activities-spatial";
import { Canvas } from "../lib/tools/number-sense/drawing";
import { nodeBounds } from "../lib/tools/number-sense/layout";
import { drawSpatialScene } from "../lib/tools/number-sense/scenes-spatial";
import type { NumberSenseTask } from "../lib/tools/number-sense/types";
import { testWorksheetFonts } from "./number-sense-test-fonts";

const range = (length: number) => Array.from({ length }, (_, i) => i);
const key = (cells: readonly number[]) => [...cells].sort((a, b) => a - b).join(",");
function fitsAfterSliding(piece: readonly number[], hole: readonly number[]): boolean {
  if (piece.length !== hole.length) return false;
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
    const moved = piece.map((cell) => [cell % 4 + dx, Math.floor(cell / 4) + dy]);
    if (moved.every(([x, y]) => x >= 0 && x < 4 && y >= 0 && y < 4)
      && key(moved.map(([x, y]) => y * 4 + x)) === key(hole)) return true;
  }
  return false;
}
function rng(seed: number) {
  let state = seed;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
const kinds = Object.keys(SPATIAL_DEFINITIONS) as SpatialProblem["kind"][];

describe("空间活动的材料与独立验题", () => {
  it("100 个种子覆盖八类活动，闭合选择唯一，开放任务有合法作答", () => {
    for (let seed = 1; seed <= 100; seed++) for (const kind of kinds) {
      const p = createSpatialProblem(kind, rng(seed * 13 + kinds.indexOf(kind)));
      const v = inspectSpatialProblem(p);
      expect(validateSpatialProblem(p), `${seed}:${kind}`).toBe(true);
      expect(v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)).toBe(true);
      if (p.kind === "seats" && v.kind === "seats") {
        expect(new Set(v.cells).size).toBe(3);
        for (let i = 0; i < 3; i++) {
          const seats = range(24).filter((cell) => Math.floor(cell / 6) + 1 === p.tickets[i][0] && cell % 6 + 1 === p.tickets[i][1]);
          expect(seats).toEqual([v.cells[i]]);
        }
      } else if (p.kind === "neighbors" && v.kind === "neighbors") {
        for (const extra of [0, 1]) {
          const groups: number[][] = [];
          for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
            const seats = range(p.group + extra).map((i) => col + i);
            if (seats.every((seat) => seat < 7 && !p.occupied[row].includes(seat))) groups.push(seats.map((seat) => row * 7 + seat));
          }
          expect(extra ? v.largerGroups : v.groups).toEqual(groups);
        }
      } else if (p.kind === "mirror" && v.kind === "mirror") {
        const reflected = p.left.map((cell) => {
          const row = Math.floor(cell / 6), distanceFromLine = 2 - cell % 6;
          return row * 6 + 3 + distanceFromLine;
        });
        expect(key(v.reflected)).toBe(key(reflected));
        expect(v.mistakes).toHaveLength(2);
        const fixed = p.right.filter((cell) => !v.mistakes.includes(cell));
        fixed.push(...v.mistakes.filter((cell) => !p.right.includes(cell)));
        expect(key(fixed)).toBe(key(reflected));
        expect(v.total).toBe(p.left.length + reflected.length);
      } else if (p.kind === "tiles" && v.kind === "tiles") {
        const exact = p.options.flatMap((option, i) => fitsAfterSliding(option, p.hole) ? [i] : []);
        expect(exact).toEqual([v.choice]);
        const repair: { index: number; extra: number }[] = [];
        p.larger.forEach((option, index) => option.forEach((extra) => {
          if (fitsAfterSliding(option.filter((cell) => cell !== extra), p.hole)) repair.push({ index, extra });
        }));
        expect(repair).toEqual([{ index: v.largerChoice, extra: v.extra }]);
      } else if (p.kind === "code" && v.kind === "code") {
        for (let position = 0; position < 9; position++) {
          const before = p.symbols[position], after = v.encoded[position];
          expect(before === 3 ? after === 3 : p.key.indexOf(after) === before).toBe(true);
        }
        // 每种水果都出现，反推图例时三种记号都有证据。
        for (const symbol of [0, 1, 2]) expect(p.symbols).toContain(symbol);
      } else if (p.kind === "path" && v.kind === "path") {
        let row = Math.floor(p.start / 6), col = p.start % 6;
        const visited = [p.start];
        for (const move of p.moves) for (let step = 0; step < move.steps; step++) {
          if (move.direction === 0) col++;
          else if (move.direction === 1) row++;
          else if (move.direction === 2) col--;
          else row--;
          expect(row >= 0 && row < 6 && col >= 0 && col < 6).toBe(true);
          visited.push(row * 6 + col);
        }
        expect(v.visited).toEqual(visited);
        expect(v.end).toBe(visited.at(-1));
        expect(v.distance).toBe(visited.length - 1);
        expect(new Set(visited).size).toBe(visited.length);
      } else if (p.kind === "views" && v.kind === "views") {
        const floor = p.heights.map((height) => Array.from({ length: height }).length > 0 ? 1 : 0);
        expect(v.footprint).toEqual(floor);
        expect(p.options.flatMap((option, i) => String(option) === String(floor) ? [i] : [])).toEqual([v.choice]);
        expect(v.witness.reduce((sum, value) => sum + value, 0)).toBe(v.total);
        expect(v.witness.map((height) => height > 0 ? 1 : 0)).toEqual(floor);
        expect(v.witness.every((height) => height >= 0 && height <= 4)).toBe(true);
        expect(v.witness).not.toEqual(p.heights);
      } else if (p.kind === "fence" && v.kind === "fence") {
        const matrix = range(p.height).map((row) => range(p.width).map((col) => !(p.cutCorner && row === 0 && col === p.width - 1)));
        let perimeter = 0, area = 0;
        for (let row = 0; row < p.height; row++) for (let col = 0; col < p.width; col++) {
          if (!matrix[row][col]) continue;
          area++;
          for (const [dy, dx] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (!matrix[row + dy]?.[col + dx]) perimeter++;
        }
        expect(v.perimeter).toBe(perimeter);
        expect(v.cells.length).toBe(area);
        expect(new Set(v.edges.map((edge) => key(edge))).size).toBe(perimeter);
        expect(v.rectangles.length).toBeGreaterThanOrEqual(2);
        for (const [width, height] of v.rectangles) {
          expect(width + height + width + height).toBe(perimeter);
          expect(width >= 1 && height <= 6).toBe(true);
        }
      } else throw new Error(`未独立验证的活动：${kind}`);
    }
  });

  it("无效路线、模糊补片和不足两种围法都会被拒绝", () => {
    expect(validateSpatialProblem({ kind: "path", start: 5, moves: range(4).map(() => ({ direction: 0, steps: 1 })) })).toBe(false);
    expect(validateSpatialProblem({ kind: "tiles", hole: [0, 1, 2], options: [[0, 1, 2], [0, 1, 2], [4, 5, 6]], larger: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]] })).toBe(false);
    expect(validateSpatialProblem({ kind: "fence", width: 1, height: 1, cutCorner: false })).toBe(false);
  });

  it("签名不把没印出的花纹、选项换序或另一版的材料算成新题", () => {
    const mirror = createSpatialProblem("mirror", rng(44)) as Problem<"mirror">;
    expect(spatialSignature(mirror, 0)).toBe(spatialSignature({ ...mirror, right: [...mirror.right].reverse() }, 0));
    const tiles = createSpatialProblem("tiles", rng(12)) as Problem<"tiles">;
    expect(spatialSignature(tiles, 1)).toBe(spatialSignature({ ...tiles, options: [...tiles.options].reverse(), larger: [...tiles.larger].reverse() }, 1));
    expect(spatialSignature({ kind: "fence", width: 2, height: 5, cutCorner: true }, 1))
      .toBe(spatialSignature({ kind: "fence", width: 4, height: 3, cutCorner: false }, 1));
  });

  it("两版都有图上作答空间，连续 100 组材料无边界溢出", () => {
    const fonts = testWorksheetFonts();
    for (let seed = 1; seed <= 100; seed++) for (const kind of kinds) {
      const problem = createSpatialProblem(kind, rng(seed * 19 + kinds.indexOf(kind)));
      const definition = SPATIAL_DEFINITIONS[kind];
      const papers: string[] = [];
      for (const edition of [0, 1] as const) {
        const task: NumberSenseTask = { id: `${kind}-${seed}`, edition, template: kind,
          title: definition.title, skill: definition.skill,
          prompt: edition ? definition.repeatPrompt : definition.prompt,
          followUp: edition ? definition.repeatFollowUp : definition.followUp,
          problem, validation: inspectSpatialProblem(problem) };
        const canvas = new Canvas(fonts);
        expect(drawSpatialScene(canvas, task, seed)).toBe(true);
        for (const node of canvas.nodes) {
          const b = nodeBounds(node);
          expect(b.x >= 11.5 && b.x + b.width <= 198.5 && b.y >= 51 && b.y + b.height <= 274.5,
            `${seed}:${kind}:${edition}:${node.kind === "text" ? node.text : node.kind} ${JSON.stringify(b)}`).toBe(true);
        }
        const text = canvas.nodes.filter((node) => node.kind === "text").map((node) => node.text).join("");
        expect(text).not.toMatch(/答案|解析|[×÷]|[一二三四五六七八九]分之|跷跷板/);
        papers.push(JSON.stringify(canvas.nodes));
      }
      expect(papers[0]).not.toBe(papers[1]);
    }
  }, 120000);
});
type Problem<K extends SpatialProblem["kind"]> = Extract<SpatialProblem, { kind: K }>;
