import { describe, expect, it } from "vitest";
import { createRandom } from "../lib/tools/number-sense/generate";
import {
  createLogicProblem, inspectLogicProblem, isLogicKind, LOGIC_DEFINITIONS,
  logicSignature, validateLogicProblem, type LogicProblem,
} from "../lib/tools/number-sense/activities-logic";
import { Canvas } from "../lib/tools/number-sense/drawing";
import { drawLogicScene } from "../lib/tools/number-sense/scenes-logic";
import { nodeBounds } from "../lib/tools/number-sense/layout";
import type { NumberSenseTask } from "../lib/tools/number-sense/types";
import { testWorksheetFonts } from "./number-sense-test-fonts";

const kinds = Object.keys(LOGIC_DEFINITIONS).filter(isLogicKind);
function orders(): number[][] {
  const found: number[][] = [];
  for (const a of [0, 1, 2, 3]) for (const b of [0, 1, 2, 3])
    for (const c of [0, 1, 2, 3]) for (const d of [0, 1, 2, 3])
      if (new Set([a, b, c, d]).size === 4) found.push([a, b, c, d]);
  return found;
}

describe("月度活动的逻辑与生活材料", () => {
  it("100 个种子的八类材料可独立求解，含两版任务的条件", () => {
    for (let seed = 0; seed < 100; seed += 1) for (const kind of kinds) {
      const p = createLogicProblem(kind, createRandom(seed * 197 + kinds.indexOf(kind)));
      const v = inspectLogicProblem(p);
      expect(validateLogicProblem(p), `${seed}:${kind}`).toBe(true);
      expect(v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)).toBe(true);
      if (p.kind === "beads" && v.kind === p.kind) {
        const expanded = [...p.motif, ...p.motif, ...p.motif, ...p.motif, ...p.motif, ...p.motif].slice(0, 12);
        expect(v.sequence).toEqual(expanded);
        expect(v.corrected).not.toBe(p.wrong);
        expect(v.missing).toEqual([expanded[p.gap], expanded[p.gap + 1]]);
        expect(new Set(p.motif).size).toBeGreaterThan(1);
        // 补空版先枚举可观察到的短花纹；纠错版独立枚举所有单颗修改。
        const motifs: number[][] = [];
        for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) {
          if (a !== b) motifs.push([a, b]);
          for (const c of [0, 1, 2]) if (new Set([a, b, c]).size > 1) motifs.push([a, b, c]);
        }
        const alternatives = motifs.map((motif) => Array.from({ length: 12 }, (_, i) => motif[i % motif.length]));
        expect(alternatives.filter((row) => row.every((value, i) => [p.gap, p.gap + 1].includes(i) || value === expanded[i]))).toEqual([expanded]);
        const printed = expanded.map((value, i) => i === p.gap ? p.wrong : value);
        const repairs: number[][] = [];
        for (let at = 0; at < printed.length; at += 1) for (const replacement of [0, 1, 2]) {
          if (replacement === printed[at]) continue;
          const candidate = printed.map((value, i) => i === at ? replacement : value);
          if (candidate.slice(0, 6).every((value, i) => value === printed[i])
            && candidate.slice(6).every((value, i) => value === candidate[i])) repairs.push(candidate);
        }
        expect(repairs).toEqual([expanded]);
      } else if (p.kind === "outfits" && v.kind === p.kind) {
        const all: number[][] = [];
        for (let a = 0; a < p.tops.length; a += 1) for (let b = 0; b < p.bottoms.length; b += 1) all.push([a, b]);
        expect(v.pairs).toEqual(all);
        const allowed = all.filter(([a, b]) => !(a === p.forbidden[0] && b === p.forbidden[1]));
        expect(v.allowed).toEqual(allowed);
        expect(v.allowed).toHaveLength(all.length - 1);
      } else if (p.kind === "order" && v.kind === p.kind) {
        const solutions = orders().filter((row) => p.before.every(([a, b]) => row.findIndex((token) => token === b) - row.findIndex((token) => token === a) === 1));
        expect(solutions).toHaveLength(1);
        expect(v.solutions).toEqual(solutions);
        const wrong = p.lineup.flatMap((token, index) => token === solutions[0][index] ? [] : [index]);
        expect(wrong).toHaveLength(2);
        expect(v.misplaced).toEqual(wrong);
        const fixed = [...p.lineup];
        [fixed[wrong[0]], fixed[wrong[1]]] = [fixed[wrong[1]], fixed[wrong[0]]];
        expect(fixed).toEqual(solutions[0]);
      } else if (p.kind === "clues" && v.kind === p.kind) {
        for (let row = 0; row < 3; row += 1) for (let column = 0; column < 2; column += 1) {
          const matches = p.toys.flatMap((toy, index) => toy.shape === row && toy.striped === column ? [index] : []);
          expect(matches).toHaveLength(1);
          expect(v.cells[matches[0]]).toBe(row * 2 + column);
        }
        const excluded = [0, 1, 2].filter((shape) => shape !== p.targetShape);
        const matching = p.toys.flatMap((toy, index) => toy.striped === p.targetStriped && excluded.every((shape) => toy.shape !== shape) ? [index] : []);
        expect(matching).toEqual([v.target]);
        expect(p.toys.filter((toy) => toy.striped === p.targetStriped && toy.shape !== excluded[0])).toHaveLength(2);
      } else if (p.kind === "bus" && v.kind === p.kind) {
        const seats = Array.from({ length: p.before }, (_, i) => i);
        seats.splice(0, p.off);
        expect(v.afterOff).toBe(seats.length);
        seats.push(...Array.from({ length: p.on }, (_, i) => i + 50));
        expect(v.final).toBe(seats.length);
        const possible = Array.from({ length: 101 }, (_, initial) => initial).filter((initial) => initial >= p.off && initial - p.off + p.on === v.final);
        expect(possible).toEqual([p.before]);
        expect(v.reverse).toBe(p.before);
      } else if (p.kind === "calendar" && v.kind === p.kind) {
        const dates = Array.from({ length: 42 }, (_, slot) => slot - p.weekday + 1);
        const startSlot = dates.indexOf(p.start);
        expect(dates[startSlot + p.wait]).toBe(v.finish);
        expect(dates[startSlot + 7]).toBe(v.nextWeek);
        expect(startSlot % 7).toBe(v.column);
        expect(Math.floor(startSlot / 7)).not.toBe(Math.floor((startSlot + p.wait) / 7));
        expect(v.nextWeek).toBeLessThanOrEqual(p.length);
      } else if (p.kind === "ribbon" && v.kind === p.kind) {
        const first = new Set(Array.from({ length: p.first }, (_, i) => i));
        const second = Array.from({ length: p.second }, (_, i) => p.first - p.overlap + i);
        const union = new Set([...first, ...second]);
        expect(v.overlapped).toBe(union.size);
        expect(v.joined).toBe(first.size + second.length);
        expect(second.filter((cell) => first.has(cell))).toHaveLength(p.overlap);
        const possible = Array.from({ length: Math.min(p.first, p.second) }, (_, overlap) => overlap).filter((overlap) => p.first + p.second - overlap === v.overlapped);
        expect(possible).toEqual([p.overlap]);
      } else if (p.kind === "pockets" && v.kind === p.kind) {
        const full = Array.from({ length: p.span + 1 }, (_, i) => p.start + i);
        const visible = full.filter((_, i) => !p.holes.includes(i));
        expect(v.missing).toEqual(full.filter((n) => !visible.includes(n)));
        const pairs: number[][] = [];
        for (const a of full) for (const b of full)
          if (p.start < a && a < b && b < p.start + p.span) pairs.push([a, b]);
        expect(v.pairs).toEqual(pairs);
        expect(v.pairs.length).toBeGreaterThan(1);
      } else throw new Error(`遗漏独立验证：${kind}`);
    }
  });

  it("换题签名忽略线索顺序、本版隐藏字段及纯装饰", () => {
    const p = createLogicProblem("outfits", createRandom(2));
    if (p.kind !== "outfits") throw new Error("题型错误");
    expect(logicSignature(p, 0)).toBe(logicSignature({ ...p, tops: [...p.tops].reverse() }, 0));
    const train: LogicProblem = { kind: "pockets", start: 5, span: 8, holes: [1, 2, 3] };
    expect(logicSignature(train, 1)).toBe(logicSignature({ ...train, holes: [2, 3, 4] }, 1));
    expect(logicSignature(train, 0)).not.toBe(logicSignature({ ...train, holes: [2, 3, 4] }, 0));
    const queue = createLogicProblem("order", createRandom(22));
    if (queue.kind !== "order") throw new Error("题型错误");
    expect(logicSignature(queue, 0)).toBe(logicSignature({ ...queue, before: [...queue.before].reverse(), lineup: [...queue.lineup].reverse() }, 0));
    const clues = createLogicProblem("clues", createRandom(31));
    if (clues.kind !== "clues") throw new Error("题型错误");
    const hiddenChange: LogicProblem = { ...clues, targetShape: (clues.targetShape + 1) % 3, targetStriped: 1 - clues.targetStriped };
    expect(logicSignature(clues, 0)).toBe(logicSignature(hiddenChange, 0));
    const fonts = testWorksheetFonts();
    const draw = (problem: LogicProblem) => {
      const c = new Canvas(fonts);
      drawLogicScene(c, { id: "clues", template: "clues", edition: 0, ...LOGIC_DEFINITIONS.clues,
        problem, validation: inspectLogicProblem(problem) }, 1);
      return c.nodes;
    };
    expect(draw(clues)).toEqual(draw(hiddenChange));
  });

  it("纠错题明确保留前六颗，不能用改第一颗构造另一种长花纹", () => {
    const p: LogicProblem = { kind: "beads", motif: [0, 1], gap: 6, wrong: 2 };
    const printed = [0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1];
    const ambiguous = [2, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1];
    expect(ambiguous.slice(0, 6)).toEqual(ambiguous.slice(6));
    expect(ambiguous.slice(0, 6)).not.toEqual(printed.slice(0, 6));
    const c = new Canvas(testWorksheetFonts());
    drawLogicScene(c, { id: "beads", template: "beads", edition: 1, ...LOGIC_DEFINITIONS.beads,
      problem: p, validation: inspectLogicProblem(p) }, 1);
    const text = c.nodes.filter((node) => node.kind === "text").map((node) => node.text).join("");
    expect(text).toContain("前 6 颗都穿对了");
    expect(text).toContain("后面照这 6 颗重复");
  });

  it("两次出现改变实际操作，图面全部留在可写区域内", () => {
    const fonts = testWorksheetFonts();
    for (const kind of kinds) {
      const p = createLogicProblem(kind, createRandom(17));
      const definition = LOGIC_DEFINITIONS[kind];
      const texts: string[] = [];
      for (const edition of [0, 1] as const) {
        const task: NumberSenseTask = { id: kind, template: kind, edition, problem: p, validation: inspectLogicProblem(p), title: definition.title, prompt: edition ? definition.repeatPrompt : definition.prompt, followUp: edition ? definition.repeatFollowUp : definition.followUp, skill: definition.skill };
        const c = new Canvas(fonts);
        expect(drawLogicScene(c, task, 1)).toBe(true);
        for (const node of c.nodes) {
          const b = nodeBounds(node);
          expect(b.x, `${kind}:${edition}`).toBeGreaterThanOrEqual(11.5);
          expect(b.y, `${kind}:${edition}`).toBeGreaterThanOrEqual(51);
          expect(b.x + b.width, `${kind}:${edition}:${node.kind === "text" ? node.text : node.kind}`).toBeLessThanOrEqual(198.5);
          expect(b.y + b.height, `${kind}:${edition}:${node.kind === "text" ? node.text : node.kind}`).toBeLessThanOrEqual(274.5);
          if (node.kind === "text") expect(node.size).toBeGreaterThanOrEqual(10);
        }
        const text = c.nodes.filter((node) => node.kind === "text").map((node) => node.text).join("");
        expect(text).not.toMatch(/[×÷]|[一二三四五六七八九]分之|跷跷板|天平|答案|解析/);
        texts.push(text);
      }
      expect(texts[0]).not.toBe(texts[1]);
    }
  });
});
