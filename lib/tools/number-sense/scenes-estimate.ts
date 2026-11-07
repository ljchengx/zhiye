import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import { inspectEstimateProblem, type EstimateProblem } from "./activities-estimate";
import type { NumberSenseTask } from "./types";

type Problem<K extends EstimateProblem["kind"]> = Extract<EstimateProblem, { kind: K }>;

/** 第 1 问只写观察角度，作答动作留给第 2 问。 */
const INTRO: Record<EstimateProblem["kind"], readonly [string, string]> = {
  magnitude: ["一个加法或减法，先猜它有多大。", "同样的算式，还能用范围说清楚。"],
  closerGuess: ["两个伙伴都猜了结果。", "有人猜得不准。"],
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

/** 算式条：两个活动共用。 */
function expressionCard(c: Canvas, p: EstimateProblem, y = 94) {
  const op = p.operator === 0 ? "+" : "-";
  c.rect(30, y, 150, 30, INK.soft, INK.dark, 0.5);
  c.text(`${p.a} ${op} ${p.b} = ?`, 105, y + 4, 26, "numericBold", INK.dark, "center");
}

function magnitude(c: Canvas, p: Problem<"magnitude">, edition: 0 | 1, day: number) {
  expressionCard(c, p);
  if (edition === 0) {
    c.caption("先看十位，再想进位", 105, 132, 12, "chinese", INK.muted, "center");
    p.options.forEach((value, i) => {
      const x = 22 + i * 58;
      c.rect(x, 150, 50, 26, INK.white, INK.line, 0.4);
      c.text(`${value} 多`, x + 25, 156, 20, "chinese", INK.dark, "center");
      choice(c, x + 25, 186);
    });
    question(c, "圈出结果在哪个十位上。");
    note(c, day, "不写出得数，你怎么知道要不要进位？");
  } else {
    c.text("结果在", 30, 150, 16);
    box(c, 78, 148, 26, 14);
    c.text("和", 112, 150, 16);
    box(c, 128, 148, 26, 14);
    c.text("之间。", 162, 150, 16);
    c.text("它接近", 30, 186, 16);
    box(c, 86, 184, 26, 14);
    c.text("。", 120, 186, 16);
    question(c, "填出结果的范围和它接近的整十。");
    note(c, day, "猜出的范围和算出的结果对得上吗？");
  }
}

function closerGuess(c: Canvas, p: Problem<"closerGuess">, edition: 0 | 1, day: number) {
  expressionCard(c, p);
  const v = inspectEstimateProblem(p);
  if (v.kind !== "closerGuess") return;
  if (edition === 0) {
    c.caption("两个猜数，一个更接近", 105, 132, 12, "chinese", INK.muted, "center");
    p.guesses.forEach((value, i) => {
      const x = 30 + i * 76;
      c.rect(x, 150, 66, 28, INK.white, INK.line, 0.4);
      c.text(`${i === 0 ? "A" : "B"} 猜 ${value}`, x + 33, 156, 18, "chinese", INK.dark, "center");
      choice(c, x + 33, 188);
    });
    question(c, "圈出更接近结果的那个猜数。");
    note(c, day, "不写出得数，你怎么知道谁更近？");
  } else {
    c.text("有人猜", 30, 146, 16);
    c.rect(88, 140, 40, 26, INK.soft, INK.line, 0.4);
    c.text(String(v.shown), 108, 146, 22, "numericBold", INK.dark, "center");
    c.text("。", 134, 146, 16);
    c.text("比准确结果差", 30, 180, 16);
    box(c, 126, 178, 28, 14);
    c.text("。", 160, 180, 16);
    c.text("猜多了", 40, 202, 16);
    choice(c, 30, 206);
    c.text("猜少了", 120, 202, 16);
    choice(c, 110, 206);
    question(c, "填出差多少，再圈出猜多了还是猜少了。");
    note(c, day, "要改成多少才更接近？");
  }
}

export function drawEstimateScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem as EstimateProblem;
  const edition = task.edition;
  if (!Object.prototype.hasOwnProperty.call(INTRO, p.kind)) return false;
  instruction(c, INTRO[p.kind][edition]);
  if (p.kind === "magnitude") magnitude(c, p, edition, day);
  else if (p.kind === "closerGuess") closerGuess(c, p, edition, day);
  else return false;
  return true;
}
