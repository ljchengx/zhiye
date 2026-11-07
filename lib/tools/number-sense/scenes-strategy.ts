import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import { inspectStrategyProblem, type StrategyProblem } from "./activities-strategy";
import type { NumberSenseTask } from "./types";

type Problem<K extends StrategyProblem["kind"]> = Extract<StrategyProblem, { kind: K }>;

/** 第 1 问只写观察角度，作答动作留给第 2 问。 */
const INTRO: Record<StrategyProblem["kind"], readonly [string, string]> = {
  compensateAdd: ["两个数中有一个就要满整十。", "整十更好算。"],
  compensateSub: ["减数接近整十。", "把减数看成整十更好算。"],
  compareExpressions: ["两个算式，不用算出结果。", "只看数的变化就能比。"],
  checkBack: ["算完以后，还能检查一遍。", "用一个算式检查另一个。"],
};

function instruction(c: Canvas, text: string, y = 52) {
  c.circle(18, y + 4, 3.8, INK.gold);
  c.text("1", 18, y - 0.3, 14, "numericBold", INK.white, "center");
  c.wrap(text, 25, y, 171, 14, 2);
}
function question(c: Canvas, text: string, y = 214) {
  c.circle(18, y + 4, 3.8, INK.gold);
  c.text("2", 18, y - 0.3, 14, "numericBold", INK.white, "center");
  return c.wrap(text, 25, y, 171, 14, 2);
}
function box(c: Canvas, x: number, y: number, width = 22, height = 12) {
  c.rect(x, y, width, height, INK.white, INK.blue, 0.4);
}
function choice(c: Canvas, x: number, y: number) {
  c.circle(x, y, 3, INK.white, INK.dark, 0.4);
}
function note(c: Canvas, day: number, text: string, y = 258) {
  c.image(getMathPdfCharacter(day), 17, y - 10, 14, 18);
  c.image("star", 175, y - 10, 14, 18);
  c.wrap(text, 36, y, 134, 14, 1);
}
/** 算式条：显示题目原本的算式。 */
function expressionCard(c: Canvas, text: string, y = 100) {
  c.rect(30, y, 150, 30, INK.soft, INK.dark, 0.5);
  c.text(text, 105, y + 5, 26, "numericBold", INK.dark, "center");
}
/** 两组候选算式，每组左下角一个圈；顺序由材料定，孩子不能都选同一组。 */
function pairChoices(c: Canvas, options: readonly [string, string], y = 108) {
  options.forEach((text, i) => {
    const top = y + i * 44;
    // 颜色只按位置换，不能与对错有关。
    c.rect(24, top, 162, 30, i % 2 ? "#F1F8FA" : INK.soft, INK.line, 0.4);
    c.text(`${i === 0 ? "第一组" : "第二组"}：${text}`, 109, top + 6, 20, "chinese", INK.dark, "center");
    choice(c, 30, top + 15);
  });
}

function compensateAdd(c: Canvas, p: Problem<"compensateAdd">, edition: 0 | 1, day: number) {
  const v = inspectStrategyProblem(p);
  if (v.kind !== "compensateAdd") return;
  if (edition === 0) {
    expressionCard(c, `${p.a} + ${p.b} = ?`);
    c.text(`${p.a} + ${p.b} =`, 20, 152, 22, "numericBold", INK.dark);
    box(c, 70, 148, 28, 16);
    c.text("+", 106, 152, 22, "numericBold", INK.dark, "center");
    box(c, 118, 148, 28, 16);
    c.caption("两个结果一样大吗？", 105, 188, 12, "chinese", INK.muted, "center");
    question(c, "把一个数补成整十，另一个数相应减少，填出好算的算式。");
    note(c, day, "哪个数添了，哪个数就要减掉？");
  } else {
    const correct: [string, string] = [`${v.a2} + ${v.b2}`, `${v.a2} + ${p.b}`];
    const wrong: [string, string] = [`${v.a2} + ${p.b}`, `${v.a2} + ${v.b2}`];
    pairChoices(c, p.a % 2 === 0 ? correct : wrong);
    c.caption("哪一组结果一样？", 105, 200, 12, "chinese", INK.muted, "center");
    question(c, "圈出结果一样大的那组。");
    note(c, day, "只改一个数，结果还一样吗？");
  }
}

function compensateSub(c: Canvas, p: Problem<"compensateSub">, edition: 0 | 1, day: number) {
  const v = inspectStrategyProblem(p);
  if (v.kind !== "compensateSub") return;
  if (edition === 0) {
    expressionCard(c, `${p.a} - ${p.b} = ?`);
    c.text(`${p.a} - ${p.b} = ${p.a} -`, 20, 152, 22, "numericBold", INK.dark);
    box(c, 78, 148, 26, 16);
    c.text("+", 110, 152, 22, "numericBold", INK.dark, "center");
    box(c, 128, 148, 26, 16);
    c.caption("多减的要补回来", 105, 188, 12, "chinese", INK.muted, "center");
    question(c, "把减数看成整十，多减的要补回来。");
    note(c, day, "多减了几？为什么要补回来？");
  } else {
    const correct: [string, string] = [`${p.a} - ${v.b2} + ${p.diff}`, `${p.a} - ${v.b2}`];
    const wrong: [string, string] = [`${p.a} - ${v.b2}`, `${p.a} - ${v.b2} + ${p.diff}`];
    pairChoices(c, p.a % 2 === 0 ? correct : wrong);
    c.caption("哪一组结果一样？", 105, 200, 12, "chinese", INK.muted, "center");
    question(c, "圈出结果和原式一样的算式。");
    note(c, day, "少补一次，结果会怎样？");
  }
}

function compareExpressions(c: Canvas, p: Problem<"compareExpressions">, edition: 0 | 1, day: number) {
  const v = inspectStrategyProblem(p);
  if (v.kind !== "compareExpressions") return;
  const op = p.operator === 0 ? "+" : "-";
  const show = (side: readonly number[]) => `${side[0]} ${op} ${side[1]}`;
  c.rect(24, 104, 72, 44, INK.soft, INK.dark, 0.4);
  c.text(show(p.left), 60, 114, 24, "numericBold", INK.dark, "center");
  c.caption("左边", 60, 134, 12, "chinese", INK.muted, "center");
  c.rect(114, 104, 72, 44, "#F1F8FA", INK.dark, 0.4);
  c.text(show(p.right), 150, 114, 24, "numericBold", INK.dark, "center");
  c.caption("右边", 150, 134, 12, "chinese", INK.muted, "center");
  if (edition === 0) {
    c.text("左边大", 40, 176, 16, "chinese", INK.dark);
    choice(c, 30, 180);
    c.text("右边大", 105, 176, 16, "chinese", INK.dark);
    choice(c, 95, 180);
    c.text("一样大", 170, 176, 16, "chinese", INK.dark);
    choice(c, 160, 180);
    question(c, "不用算出结果，圈出哪边的结果大。");
    note(c, day, "你是看哪个数在变？");
  } else {
    c.caption("哪边的结果大？", 105, 166, 12, "chinese", INK.muted, "center");
    c.text("两边相差", 40, 186, 16, "chinese", INK.dark);
    box(c, 105, 182, 30, 16);
    question(c, "填出两边相差多少。");
    note(c, day, "怎么看出来的？说给伙伴听。");
  }
}

function checkBack(c: Canvas, p: Problem<"checkBack">, edition: 0 | 1, day: number) {
  const v = inspectStrategyProblem(p);
  if (v.kind !== "checkBack") return;
  const op = p.operator === 0 ? "+" : "-";
  const checkOp = p.operator === 0 ? "-" : "+";
  if (edition === 0) {
    c.text(`${p.a} ${op} ${p.b} =`, 30, 112, 24, "numericBold", INK.dark);
    box(c, 118, 106, 34, 18);
    c.text("检查：", 20, 172, 16, "chinese", INK.dark);
    box(c, 62, 166, 34, 18);
    c.text(`${checkOp} ${p.operator === 0 ? p.a : p.b} =`, 102, 170, 22, "numericBold", INK.dark);
    box(c, 158, 166, 34, 18);
    c.caption("两处结果要对上", 105, 200, 12, "chinese", INK.muted, "center");
    question(c, "先算出结果，再用另一个算式检查一遍。");
    note(c, day, "两处对上了吗？没对上回到哪一步？");
  } else {
    expressionCard(c, `${p.a} ${op} ${p.b} = ?`);
    const right = p.operator === 0 ? `${v.sum} - ${p.a}` : `${v.sum} + ${p.b}`;
    const wrongCase = p.operator === 0 ? `${v.sum} + ${p.a}` : `${v.sum} - ${p.b}`;
    const correct: [string, string] = [`${right} =`, `${wrongCase} =`];
    const swapped: [string, string] = [`${wrongCase} =`, `${right} =`];
    pairChoices(c, p.a % 2 === 0 ? correct : swapped);
    c.caption("哪一个能检查？", 105, 200, 12, "chinese", INK.muted, "center");
    question(c, "圈出能检查这个结果的算式。");
    note(c, day, "为什么另一个检查不了？");
  }
}

export function drawStrategyScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem as StrategyProblem;
  const edition = task.edition;
  if (!Object.prototype.hasOwnProperty.call(INTRO, p.kind)) return false;
  instruction(c, INTRO[p.kind][edition]);
  if (p.kind === "compensateAdd") compensateAdd(c, p, edition, day);
  else if (p.kind === "compensateSub") compensateSub(c, p, edition, day);
  else if (p.kind === "compareExpressions") compareExpressions(c, p, edition, day);
  else if (p.kind === "checkBack") checkBack(c, p, edition, day);
  else return false;
  return true;
}
