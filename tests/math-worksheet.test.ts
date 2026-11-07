import { describe, expect, it } from "vitest";
import {
  generateDailyWorksheet, generateWorksheetPlan, getExportDays, monthCount,
  regenerateWorksheetDay, SCENE_KINDS, SCENE_DEFINITIONS, MIN_ACTIVITY_DAY_GAP,
  MAX_ACTIVITY_OCCURRENCES, taskSignature, validateTask, type NumberSenseTask,
} from "../lib/tools/math-worksheet";
import { pageConversation } from "../lib/tools/number-sense/conversation";
import { getMathBulkPdfFilename } from "../lib/tools/math-pdf";

const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
// 独立的位置对照表，避免用生成器的旋转函数自证正确。
const clockwise = [2, 5, 8, 1, 4, 7, 0, 3, 6];
function rotate(cells: readonly number[], turns: number): number[] {
  let result = [...cells];
  for (let i = 0; i < turns; i += 1) result = result.map((cell) => clockwise[cell]);
  return sorted(result);
}

function verifyTask(task: NumberSenseTask) {
  const p = task.problem, v = task.validation;
  expect(validateTask(task)).toBe(true);
  expect(v.kind).toBe(p.kind);
  expect(v.values.every((n) => Number.isInteger(n) && n >= 0 && n <= 100)).toBe(true);
  expect(task.prompt.length).toBeLessThanOrEqual(24);
  expect(task.followUp.length).toBeLessThanOrEqual(24);
  if (p.kind === "market" && v.kind === "market") {
    expect(p.prices).toHaveLength(6);
    expect(new Set(p.prices).size).toBe(6);
    expect(p.prices.every((price) => price >= 8 && price <= 50)).toBe(true);
    expect(p.budget >= 28 && p.budget <= 48).toBe(true);
    const pairs: number[][] = [];
    for (let a = 0; a < 6; a += 1)
      for (let b = a + 1; b < 6; b += 1) {
        expect(p.prices[a] + p.prices[b]).toBeLessThanOrEqual(100);
        if (p.prices[a] + p.prices[b] === p.budget) pairs.push([a, b]);
      }
    expect(pairs.length).toBeGreaterThanOrEqual(2);
    expect(v.pairs).toEqual(pairs);
    expect(v.unaffordable).toEqual(p.prices.flatMap((price, i) => price > p.budget ? [i] : []));
    expect(v.unaffordable.length).toBeGreaterThanOrEqual(1);
    expect(v.discountedPrices).toEqual(p.prices.map((price) => price - p.discount));
    expect(v.discountedPrices.every((price) => price >= 0)).toBe(true);
    expect(v.savings).toEqual([p.discount + p.discount, p.discount]);
  } else if (p.kind === "sharing" && v.kind === "sharing") {
    expect(p.left >= 12 && p.left <= 24).toBe(true);
    expect(p.right >= 6 && p.right <= 20).toBe(true);
    expect(p.left).toBeGreaterThan(p.right);
    const possibleMoves = Array.from({ length: p.left + 1 }, (_, n) => n)
      .filter((n) => p.left - n === p.right + n);
    expect(possibleMoves).toEqual([v.move]);
    expect(p.left - v.move).toBe(v.each);
    expect(v.each + v.each).toBe(p.left + p.right);
    // 纸面是每盘分别添入 extra，新增点心必须在两盘各计算一次。
    expect(v.eachWithExtra).toBe(v.each + p.extra);
    expect(v.eachWithExtra + v.eachWithExtra).toBe(p.left + p.right + p.extra * 2);
    expect(v.values).toContain(p.left + p.right + p.extra * 2);
    expect([2, 4, 6, 8]).toContain(p.extra);
    expect(v.addOrRemove + p.right).toBe(p.left);
    expect(v.totalsAfter).toEqual([p.left + p.left, p.right + p.right]);
  } else if (p.kind === "parking" && v.kind === "parking") {
    expect(p.occupied).toHaveLength(2);
    expect([0, 1]).toContain(p.moveFrom);
    expect([1, 2, 3]).toContain(p.move);
    const allSlots = Array.from({ length: 10 }, (_, i) => i);
    p.occupied.forEach((row, index) => {
      expect(row.length >= 4 && row.length <= 9).toBe(true);
      expect(new Set(row).size).toBe(row.length);
      expect(row.every((slot) => Number.isInteger(slot) && slot >= 0 && slot < 10)).toBe(true);
      expect(v.empty[index]).toBe(allSlots.filter((slot) => !row.includes(slot)).length);
    });
    // 给每辆车保留身份，逐辆挪进空位，独立检查占位与总辆数守恒。
    const rows = p.occupied.map((row, index) => new Map(row.map((slot) => [slot, index * 10 + slot])));
    const beforeCars = sorted(rows.flatMap((row) => [...row.values()]));
    const source = rows[p.moveFrom], target = rows[1 - p.moveFrom];
    for (let step = 0; step < p.move; step += 1) {
      const [sourceSlot, car] = source.entries().next().value!;
      const targetSlot = allSlots.find((slot) => !target.has(slot));
      expect(targetSlot).not.toBeUndefined();
      source.delete(sourceSlot);
      target.set(targetSlot!, car);
    }
    expect(v.after).toEqual(rows.map((row) => row.size));
    expect(v.after.every((n) => n >= 0 && n <= 10)).toBe(true);
    expect(sorted(rows.flatMap((row) => [...row.values()]))).toEqual(beforeCars);
    expect(v.total).toBe(beforeCars.length);
    expect(sum(v.after)).toBe(v.total);
    expect(v.moreAfter).toBe(rows[0].size === rows[1].size ? "same" : rows[0].size > rows[1].size ? "A" : "B");
    const arrivals = p.occupied.map((row, i) => row.length + (i === p.moveFrom ? 0 : p.move));
    expect(v.arrivals).toEqual(arrivals);
    expect(sum(arrivals)).toBe(v.total + p.move);
    expect(v.moreAfterArrival).toBe(arrivals[0] === arrivals[1] ? "same" : arrivals[0] > arrivals[1] ? "A" : "B");
  } else if (p.kind === "garden" && v.kind === "garden") {
    expect(p.counts.every((n) => n >= 4 && n <= 10)).toBe(true);
    expect(sum(p.counts)).toBeLessThanOrEqual(27);
    const most = p.counts.flatMap((n, i) => p.counts.every((other) => n >= other) ? [i] : []);
    const least = p.counts.flatMap((n, i) => p.counts.every((other) => n <= other) ? [i] : []);
    expect(most).toEqual([v.most]);
    expect(least).toEqual([v.least]);
    expect(v.total).toBe(sum(p.counts));
    expect(v.difference).toBe(p.counts[v.most] - p.counts[v.least]);
    expect(v.removed).toBe(p.counts.reduce((total, n) => total + n - p.counts[v.least], 0));
    expect(v.remaining + v.removed).toBe(v.total);
  } else if (p.kind === "route" && v.kind === "route") {
    expect(p.segments.every((n) => n >= 6 && n <= 40)).toBe(true);
    expect(sum(p.segments)).toBeLessThanOrEqual(100);
    const lengths = [sum(p.segments.slice(0, 2)), sum(p.segments.slice(2))];
    expect(v.lengths).toEqual(lengths);
    expect(lengths[0]).not.toBe(lengths[1]);
    expect(lengths[v.shorter]).toBeLessThan(lengths[1 - v.shorter]);
    expect(v.difference).toBe(Math.abs(lengths[0] - lengths[1]));
    expect([0, 1]).toContain(p.closed);
    expect(v.open).toBe(1 - p.closed);
  } else if (p.kind === "windows" && v.kind === "windows") {
    expect(p.puzzles).toHaveLength(3);
    expect(sorted(p.puzzles.map((puzzle) => puzzle.turn))).toEqual([1, 2, 3]);
    p.puzzles.forEach((puzzle, index) => {
      expect(puzzle.pattern.every((cell) => Number.isInteger(cell) && cell >= 0 && cell <= 8)).toBe(true);
      expect(new Set(puzzle.pattern).size).toBe(puzzle.pattern.length);
      for (const turn of [1, 2, 3]) expect(rotate(puzzle.pattern, turn)).not.toEqual(sorted(puzzle.pattern));
      const mirror = puzzle.pattern.map((cell) => [2, 1, 0, 5, 4, 3, 8, 7, 6][cell]);
      for (const turn of [0, 1, 2, 3]) expect(rotate(mirror, turn)).not.toEqual(sorted(puzzle.pattern));
      const expected = rotate(puzzle.pattern, puzzle.turn);
      const matching = puzzle.options.flatMap((option, i) => String(sorted(option)) === String(expected) ? [i] : []);
      expect(puzzle.options).toHaveLength(3);
      expect(new Set(puzzle.options.map((option) => String(sorted(option)))).size).toBe(3);
      puzzle.options.forEach((option) => {
        expect(option).toHaveLength(puzzle.pattern.length);
        expect(option.every((cell) => cell >= 0 && cell <= 8)).toBe(true);
      });
      expect(matching).toEqual([v.correctOptions[index]]);
      expect(v.rotated[index]).toEqual(expected);
    });
  } else if (p.kind === "patterns" && v.kind === "patterns") {
    expect(p.rules).toHaveLength(3);
    expect(p.rules.some((rule) => rule.step > 0)).toBe(true);
    expect(p.rules.some((rule) => rule.step < 0)).toBe(true);
    expect(new Set(p.rules.map((rule) => `${rule.start}:${rule.step}`)).size).toBe(3);
    p.rules.forEach((rule, i) => {
      const terms = [rule.start];
      for (let j = 0; j < 3; j += 1) terms.push(terms.at(-1)! + rule.step);
      expect(terms.every((n) => Number.isInteger(n) && n >= 1 && n <= 12)).toBe(true);
      expect(v.fourth[i]).toBe(terms[3]);
    });
  } else if (p.kind === "measure" && v.kind === "measure") {
    expect(p.lengths.every((n) => n >= 3 && n <= 12)).toBe(true);
    expect(new Set(p.lengths).size).toBe(3);
    expect(p.offsets.every((n) => n >= 0 && n <= 3)).toBe(true);
    expect(p.offsets.some((n) => n > 0)).toBe(true);
    expect(p.unit).toBe(1);
    const actual = p.lengths.map((length, i) => {
      const start = p.offsets[i] * p.unit, end = (p.offsets[i] + length) * p.unit;
      return end - start;
    });
    expect(v.actualLengths).toEqual(actual);
    expect(actual[v.longest]).toBe(Math.max(...actual));
    expect(actual[v.shortest]).toBe(Math.min(...actual));
    expect(v.difference).toBe(actual[v.longest] - actual[v.shortest]);
  }
  // 新活动的独立枚举与开放条件检查分别在 spatial/quantity/logic 测试中。
}

describe("月度场景式双面数感", () => {
  it("100 个种子覆盖 28～31 份：全部活动验题、频次、间隔、动作搭配和复现", () => {
    const parkingOutcomes = new Set<string>();
    const parkingDirections = new Set<number>();
    for (let seed = 0; seed < 100; seed += 1)
      for (const count of [28, 29, 30, 31]) {
        const plan = generateWorksheetPlan(seed, { count });
        expect(generateWorksheetPlan(seed, { count })).toEqual(plan);
        expect(plan.days).toHaveLength(count);
        expect(new Set(plan.days.slice(0, SCENE_KINDS.length / 2).flatMap((day) => day.pages.map((page) => page.activity.problem.kind))).size).toBe(SCENE_KINDS.length);
        const signatures = new Set<string>(), occurrences = new Map<string, number>();
        const lastSeen = new Map<string, { day: number; task: NumberSenseTask }>();
        for (const day of plan.days) {
          expect(day).not.toHaveProperty("tasks");
          expect(day.pages.map((page) => page.side)).toEqual(["front", "back"]);
          expect(day.pages[0].activity.problem.kind).not.toBe(day.pages[1].activity.problem.kind);
          const [front, back] = day.pages.map((page) => SCENE_DEFINITIONS[page.activity.problem.kind]);
          expect(front.skill).not.toBe(back.skill);
          expect(day.pages[0].activity.edition ? front.repeatAction : front.action)
            .not.toBe(day.pages[1].activity.edition ? back.repeatAction : back.action);
          for (const [index, page] of day.pages.entries()) {
            const task = page.activity, signature = taskSignature(task);
            verifyTask(task);
            const previous = lastSeen.get(task.problem.kind);
            expect(task.edition).toBe(previous ? 1 : 0);
            if (previous) {
              expect(day.day - previous.day).toBeGreaterThanOrEqual(MIN_ACTIVITY_DAY_GAP);
              expect(task.prompt).not.toBe(previous.task.prompt);
              expect(task.followUp).not.toBe(previous.task.followUp);
            }
            lastSeen.set(task.problem.kind, { day: day.day, task });
            if (task.validation.kind === "parking") parkingOutcomes.add(task.validation.moreAfter);
            if (task.problem.kind === "parking") parkingDirections.add(task.problem.moveFrom);
            expect(signatures.has(signature)).toBe(false);
            signatures.add(signature);
            occurrences.set(task.problem.kind, (occurrences.get(task.problem.kind) ?? 0) + 1);
            const focus = pageConversation(day, page.side);
            expect(focus.task).toBe(task);
            expect(focus.index).toBe(index);
            expect(focus.title).toBe(task.title);
            expect(focus.question).toBe(task.followUp);
          }
        }
        expect([...occurrences.keys()].sort()).toEqual([...SCENE_KINDS].sort());
        expect([...occurrences.values()].every((n) => n >= 1 && n <= MAX_ACTIVITY_OCCURRENCES)).toBe(true);
      }
    expect([...parkingOutcomes].sort()).toEqual(["A", "B", "same"]);
    expect([...parkingDirections].sort()).toEqual([0, 1]);
    expect(SCENE_KINDS).not.toContain("balance");
  }, 120000);

  it("换题保持每面的场景类型，更新实际材料且整月导出使用新版本", () => {
    const plan = generateWorksheetPlan(20260831), before = JSON.stringify(plan);
    const oldSignatures = plan.days.flatMap((day) => day.pages.map((page) => taskSignature(page.activity)));
    const representatives = new Map<string, number>();
    plan.days.forEach((day) => day.pages.forEach((page) => representatives.set(page.activity.problem.kind, day.day)));
    for (const dayNumber of new Set([1, ...representatives.values()])) {
      const original = plan.days[dayNumber - 1], changed = regenerateWorksheetDay(plan, dayNumber, 33);
      expect(regenerateWorksheetDay(plan, dayNumber, 33)).toEqual(changed);
      expect(changed.pages.map((page) => page.activity.problem.kind)).toEqual(original.pages.map((page) => page.activity.problem.kind));
      expect(changed.pages.map((page) => page.activity.edition)).toEqual(original.pages.map((page) => page.activity.edition));
      expect(changed.objective).toBe(original.objective);
      expect(changed.skills).toEqual(original.skills);
      changed.pages.forEach((page) => {
        verifyTask(page.activity);
        expect(oldSignatures).not.toContain(taskSignature(page.activity));
        expect(pageConversation(changed, page.side).task).toBe(page.activity);
      });
      const updated = { ...plan, days: plan.days.map((day) => day.day === dayNumber ? changed : day) };
      expect(getExportDays(updated, { kind: "all" })[dayNumber - 1]).toBe(changed);
      expect(getExportDays(updated, { kind: "day", day: dayNumber })).toEqual([changed]);
    }
    expect(JSON.stringify(plan)).toBe(before);
    expect(generateDailyWorksheet(15, 20260831)).toEqual(plan.days[14]);
  });

  it("调换商品、停车位置、规律行和旋转选项不能伪装成换题", () => {
    const tasks = generateWorksheetPlan(8).days.flatMap((day) => day.pages.map((page) => page.activity));
    for (const task of tasks) {
      const p = task.problem;
      if (p.kind === "market") expect(taskSignature({ problem: { ...p, prices: [...p.prices].reverse() as unknown as typeof p.prices } })).toBe(taskSignature(task));
      if (p.kind === "parking") expect(taskSignature({ problem: { ...p,
        occupied: [p.occupied[0].map((slot) => (slot + 1) % 10), p.occupied[1].map((slot) => (slot + 3) % 10)],
      } })).toBe(taskSignature(task));
      if (p.kind === "patterns") expect(taskSignature({ problem: { ...p, rules: [...p.rules].reverse() } })).toBe(taskSignature(task));
      if (p.kind === "windows") expect(taskSignature({ problem: { ...p,
        puzzles: [...p.puzzles].reverse().map((puzzle) => ({ ...puzzle, options: [...puzzle.options].reverse() })),
      } })).toBe(taskSignature(task));
    }
  });

  it("按真实月长生成，历史避重，拒绝不合法份数", () => {
    expect(monthCount({ year: 2024, month: 2 })).toBe(29);
    expect(monthCount({ year: 2025, month: 2 })).toBe(28);
    expect(monthCount({ year: 2026, month: 10 })).toBe(31);
    expect(monthCount({ year: 2026, month: 11 })).toBe(30);
    for (const config of [{ count: 0 }, { count: 60 }, { count: 30.5 }, { year: 2026, month: 13 }])
      expect(() => generateWorksheetPlan(1, config)).toThrow();
    const before = generateWorksheetPlan(71).days.flatMap((day) => day.pages.map((page) => taskSignature(page.activity)));
    const after = generateWorksheetPlan(71, { count: 30 }, before);
    expect(after.days.flatMap((day) => day.pages.map((page) => taskSignature(page.activity))).some((signature) => before.includes(signature))).toBe(false);
  });

  it("导出按整份选择，每份包含正反面", () => {
    const plan = generateWorksheetPlan(4);
    expect(getExportDays(plan, { kind: "range", from: 12, to: 10 }).map((day) => day.day)).toEqual([10, 11, 12]);
    expect(getExportDays(plan, { kind: "day", day: 1 }).flatMap((day) => day.pages)).toHaveLength(2);
    expect(getExportDays(plan, { kind: "all" }).flatMap((day) => day.pages)).toHaveLength(60);
    expect(getMathBulkPdfFilename({ kind: "day", day: 1 })).toContain("第1份-双面");
    expect(getMathBulkPdfFilename({ kind: "range", from: 10, to: 12 })).toContain("第10至12份");
  });
});
