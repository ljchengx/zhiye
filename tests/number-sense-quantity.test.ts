import { describe, expect, it } from "vitest";
import {
  createQuantityProblem, inspectQuantityProblem, QUANTITY_DEFINITIONS,
  quantitySignature, validateQuantityProblem, type QuantityProblem,
} from "../lib/tools/number-sense/activities-quantity";
import { Canvas, INK } from "../lib/tools/number-sense/drawing";
import { generateWorksheetPlan, regenerateWorksheetDay } from "../lib/tools/number-sense/generate";
import { drawQuantityScene } from "../lib/tools/number-sense/scenes-quantity";
import type { NumberSenseTask } from "../lib/tools/number-sense/types";
import { testWorksheetFonts } from "./number-sense-test-fonts";

function random(seed: number) {
  let state = seed;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
const kinds = Object.keys(QUANTITY_DEFINITIONS) as QuantityProblem["kind"][];

describe("数量活动的操作与数学关系", () => {
  it("100 个种子独立重建每一种活动的可行操作", () => {
    for (let seed = 1; seed <= 100; seed += 1) for (const kind of kinds) {
      const p = createQuantityProblem(kind, random(seed * 7919));
      const v = inspectQuantityProblem(p);
      expect(validateQuantityProblem(p), `${seed}/${kind}`).toBe(true);
      expect(v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)).toBe(true);
      if (p.kind === "pairing" && v.kind === "pairing") {
        const regroup = (count: number) => {
          const people = Array.from({ length: count }, (_, i) => i);
          const pairs: number[][] = [];
          while (people.length >= 2) pairs.push(people.splice(0, 2));
          return { pairs: pairs.length, left: people.length };
        };
        expect(v.pairs).toEqual(p.counts.map((n) => regroup(n).pairs));
        expect(v.leftovers).toEqual(p.counts.map((n) => regroup(n).left));
        const joins = [[0, 1], [0, 2], [1, 2]].filter(([a, b]) => regroup(p.counts[a] + p.counts[b]).left === 0);
        expect(v.pairableJoins).toEqual(joins);
        expect(joins).toHaveLength(1);
      } else if (p.kind === "bundles" && v.kind === "bundles") {
        const boxes = Array.from({ length: p.boxes }, () => Array.from({ length: 10 }, () => 1));
        const loose = Array.from({ length: p.loose }, () => 1);
        const blocks = [...boxes.flat(), ...loose];
        expect(v.total).toBe(blocks.length);
        expect(p.options.filter((n) => n === blocks.length)).toHaveLength(1);
        expect(p.options[v.correctOption]).toBe(blocks.length);
        loose.push(...boxes.pop()!);
        expect(v.unpacked).toEqual([boxes.length, loose.length]);
        expect([...boxes.flat(), ...loose]).toHaveLength(v.total);
      } else if (p.kind === "hidden" && v.kind === "hidden") {
        const possible = Array.from({ length: p.total + 1 }, (_, n) => n).filter((n) => n + p.visible === p.total);
        expect(possible).toEqual([v.covered]);
        const visible = Array.from({ length: p.visible }, () => "bird");
        const cloud = Array.from({ length: v.covered }, () => "bird");
        visible.push(...cloud.splice(0, p.emerge));
        expect(v.nowVisible).toBe(visible.length);
        expect(v.stillCovered).toBe(cloud.length);
        expect(visible.length + cloud.length).toBe(p.total);
      } else if (p.kind === "line" && v.kind === "line") {
        const marks = Array.from({ length: 21 }, (_, i) => p.start + i);
        expect(v.offsets).toEqual(p.numbers.map((n) => marks.indexOf(n)));
        expect(v.extraOffset).toBe(marks.indexOf(p.extra));
        const rightDistances = p.numbers.map((n) => marks.slice(marks.indexOf(n) + 1).length);
        expect(v.nearestRight).toBe(rightDistances.indexOf(Math.min(...rightDistances)));
        expect(v.ordered).toEqual(marks.filter((n) => [...p.numbers, p.extra].includes(n)));
      } else if (p.kind === "compensation" && v.kind === "compensation") {
        const transfers = Array.from({ length: 10 }, (_, i) => i + 1);
        expect(transfers.filter((n) => (p.left + n) % 10 === 0)).toEqual([v.toLeft]);
        expect(transfers.filter((n) => (p.right + n) % 10 === 0)).toEqual([v.toRight]);
        for (const [source, target, move, result] of [
          [p.right, p.left, v.toLeft, [v.afterLeft[1], v.afterLeft[0]]],
          [p.left, p.right, v.toRight, v.afterRight],
        ] as const) {
          const from = Array.from({ length: source }, (_, n) => n);
          const to = Array.from({ length: target }, (_, n) => n);
          to.push(...from.splice(0, move));
          expect([from.length, to.length]).toEqual(result);
          expect(from.length + to.length).toBe(v.total);
          expect(to.length % 10).toBe(0);
        }
      } else if (p.kind === "difference" && v.kind === "difference") {
        const walk = (start: number, steps: number) => {
          let position = start;
          for (let step = 0; step < steps; step += 1) position += 1;
          return position;
        };
        const together = p.positions.map((n) => walk(n, p.together));
        const different = p.positions.map((n, i) => walk(n, p.steps[i]));
        expect(v.afterTogether).toEqual(together);
        expect(v.afterSteps).toEqual(different);
        expect(together[0] - together[1]).toBe(v.gap);
        expect(v.finalGap).toBe(Math.abs(different[0] - different[1]));
        expect(v.leader).toBe(different[0] === different[1] ? 2 : different[0] > different[1] ? 0 : 1);
      } else if (p.kind === "capacity" && v.kind === "capacity") {
        const empty = p.capacities.map((n, i) => Array.from({ length: n }, (_, j) => j).slice(p.occupied[i]));
        expect(v.free).toEqual(empty.map((slots) => slots.length));
        expect(v.fits).toEqual(empty.flatMap((slots, i) => slots.slice(0, p.incoming).length === p.incoming ? [i] : []));
        expect(empty[v.exact]).toHaveLength(p.incoming);
        const allocations: number[][] = [];
        for (let a = 1; a <= empty[0].length; a += 1) for (let b = 1; b <= empty[1].length; b += 1)
          if (a + b === p.incoming) allocations.push([a, b]);
        expect(v.splits).toEqual(allocations);
        expect(v.splits.length).toBeGreaterThanOrEqual(2);
      } else if (p.kind === "collections" && v.kind === "collections") {
        const shapes = [0, 0, 0], textures = [0, 0], selected: number[] = [];
        p.items.forEach((item, i) => {
          shapes[item.shape] += 1;
          textures[Number(item.striped)] += 1;
          if (item.shape === p.target && item.striped) selected.push(i);
        });
        expect(v.byShape).toEqual(shapes);
        expect(v.byTexture).toEqual(textures);
        expect(v.intersection).toEqual(selected);
        expect(shapes.reduce((a, b) => a + b, 0)).toBe(v.total);
        expect(textures.reduce((a, b) => a + b, 0)).toBe(v.total);
        expect(selected.length).toBeGreaterThan(0);
        expect(selected.length).toBeLessThan(shapes[p.target]);
      } else throw new Error(`漏验活动：${kind}`);
    }
  });

  it("改变未展示字段或摆放顺序不能冒充换题", () => {
    const bundles = createQuantityProblem("bundles", random(3));
    if (bundles.kind !== "bundles") throw new Error("题型错误");
    expect(quantitySignature(bundles, 0)).toBe(quantitySignature({ ...bundles, options: [...bundles.options].reverse() as unknown as typeof bundles.options }, 0));
    const line = createQuantityProblem("line", random(7));
    if (line.kind !== "line") throw new Error("题型错误");
    expect(quantitySignature(line, 0)).toBe(quantitySignature({ ...line, extra: line.extra + 1 }, 0));
    const difference = createQuantityProblem("difference", random(11));
    if (difference.kind !== "difference") throw new Error("题型错误");
    expect(quantitySignature(difference, 0)).toBe(quantitySignature({ ...difference, steps: [2, 3] }, 0));
    const collections = createQuantityProblem("collections", random(23));
    if (collections.kind !== "collections") throw new Error("题型错误");
    expect(quantitySignature(collections, 0)).toBe(quantitySignature({ ...collections, items: [...collections.items].reverse() }, 0));
  });

  it("分放题换题必须改变 A、B 的材料，而不是只改 C 盒", () => {
    const original: QuantityProblem = { kind: "capacity", capacities: [20, 30, 10], occupied: [11, 23, 4], incoming: 7 };
    const unrelatedChange: QuantityProblem = { ...original, occupied: [11, 23, 7] };
    expect(validateQuantityProblem(original)).toBe(true);
    expect(validateQuantityProblem(unrelatedChange)).toBe(true);
    expect(quantitySignature(original, 1)).toBe(quantitySignature(unrelatedChange, 1));
    expect(quantitySignature(original, 0)).not.toBe(quantitySignature(unrelatedChange, 0));
    // 活动顺序与重访名额都会随内容库变化，跨种子找到分放题的重访版。
    const locate = (candidate: ReturnType<typeof generateWorksheetPlan>) => candidate.days
      .flatMap((day) => day.pages.map((page, index) => ({ day: day.day, index, activity: page.activity })))
      .find((item) => item.activity.problem.kind === "capacity" && item.activity.edition === 1);
    let plan = generateWorksheetPlan(2), found = locate(plan);
    for (let seed = 0; seed < 60 && !found; seed += 1) { plan = generateWorksheetPlan(seed); found = locate(plan); }
    expect(found).toBeTruthy();
    const before = found!.activity.problem;
    if (before.kind !== "capacity") throw new Error("题型错误");
    const after = regenerateWorksheetDay(plan, found!.day, 1683).pages[found!.index].activity;
    if (after.problem.kind !== "capacity") throw new Error("换题改变了活动种类");
    // 不用签名来自证；直接比较孩子真正用到的两个盒子和新来的数量。
    expect([after.problem.capacities.slice(0, 2), after.problem.occupied.slice(0, 2), after.problem.incoming])
      .not.toEqual([before.capacities.slice(0, 2), before.occupied.slice(0, 2), before.incoming]);
  });

  it("数线活动重访版的右端小旗答题框不遮挡任何旗杆", () => {
    const fonts = testWorksheetFonts();
    const samples: { task: NumberSenseTask; day: number }[] = [];
    for (let seed = 0; seed < 60 && samples.length < 3; seed += 1)
      for (const day of generateWorksheetPlan(seed).days)
        for (const page of day.pages)
          if (page.activity.problem.kind === "line" && page.activity.edition === 1 && samples.length < 3)
            samples.push({ task: page.activity, day: day.day });
    expect(samples).toHaveLength(3);
    for (const { task, day } of samples) {
      const canvas = new Canvas(fonts);
      drawQuantityScene(canvas, task, day);
      const poles = canvas.nodes.filter((node) => node.kind === "line" && node.x1 === node.x2 && node.y2 - node.y1 > 10);
      const frames = canvas.nodes.filter((node) => node.kind === "rect" && node.fill === INK.white && node.stroke === INK.blue);
      expect(poles).toHaveLength(3);
      expect(frames.filter((node) => node.kind === "rect" && node.y < 150)).toHaveLength(3);
      for (const frame of frames) for (const pole of poles) {
        if (frame.kind !== "rect" || pole.kind !== "line") throw new Error("节点类型错误");
        const intersects = pole.x1 >= frame.x && pole.x1 <= frame.x + frame.width
          && Math.max(pole.y1, pole.y2) >= frame.y && Math.min(pole.y1, pole.y2) <= frame.y + frame.height;
        expect(intersects, `第 ${day} 份的答题框遮挡旗杆`).toBe(false);
      }
      for (const label of ["A", "B", "C"]) {
        const matching = canvas.nodes.filter((node) => node.kind === "text" && node.text === label);
        expect(matching).toHaveLength(2);
        expect(matching.every((node) => node.kind === "text" && node.size >= 10)).toBe(true);
      }
      const text = canvas.nodes.filter((node) => node.kind === "text").map((node) => node.text).join("");
      expect(text).toContain("填在上方相应字母旁");
    }
  });

  it("八类活动两种操作都能放进纸面，且不读取内部答案", () => {
    const fonts = testWorksheetFonts();
    for (let seed = 1; seed <= 20; seed += 1) for (const kind of kinds) {
      const problem = createQuantityProblem(kind, random(seed * 17));
      const definition = QUANTITY_DEFINITIONS[kind];
      const versions: string[] = [];
      for (const edition of [0, 1] as const) {
        const task: NumberSenseTask = { id: "test", template: kind, edition, ...definition,
          problem, validation: inspectQuantityProblem(problem) };
        const c = new Canvas(fonts);
        expect(drawQuantityScene(c, task, seed)).toBe(true);
        const content = c.nodes.filter((node) => node.kind === "text").map((node) => node.text).join("");
        versions.push(content);
        expect(content).not.toMatch(/答案|解析|跷跷板|袋子|[×÷]|[一二三四五六七八九]分之/);
        for (const node of c.nodes) {
          const b = node.kind === "line" ? { x: Math.min(node.x1, node.x2), y: Math.min(node.y1, node.y2),
            width: Math.abs(node.x2 - node.x1), height: Math.abs(node.y2 - node.y1) }
            : node.kind === "circle" ? { x: node.x - node.radius, y: node.y - node.radius, width: node.radius * 2, height: node.radius * 2 }
              : node;
          expect(b.x, `${kind}/${edition}/${node.kind === "text" ? node.text : node.kind}`).toBeGreaterThanOrEqual(11.5);
          expect(b.y).toBeGreaterThanOrEqual(51);
          expect(b.x + b.width, `${kind}/${edition}/${node.kind === "text" ? node.text : node.kind}`).toBeLessThanOrEqual(198.5);
          expect(b.y + b.height, `${kind}/${edition}/${node.kind === "text" ? node.text : node.kind}`).toBeLessThanOrEqual(274.5);
          if (node.kind === "text") expect(node.size).toBeGreaterThanOrEqual(10);
        }
        const withoutAnswers = new Canvas(fonts);
        drawQuantityScene(withoutAnswers, { ...task, validation: undefined } as unknown as NumberSenseTask, seed);
        expect(withoutAnswers.nodes).toEqual(c.nodes);
      }
      expect(versions[0]).not.toBe(versions[1]);
    }
  });
});
