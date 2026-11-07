import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import type { NumberProblem } from "./activities-number";
import type { NumberSenseTask } from "./types";

type Problem<K extends NumberProblem["kind"]> = Extract<NumberProblem, { kind: K }>;

/** 第 1 问只写看图提示，作答动作在第 2 问，不重复。 */
const INTRO: Record<NumberProblem["kind"], readonly [string, string]> = {
  manyWays: ["五幅小图，说的都是同一个数吗？", "四幅小图，说的都是同一个数。"],
  regroup: ["这些珠子，可以怎么装盒？", "珠子数不变，还能怎么装？"],
  dualLine: ["两条数线，每格表示多少？", "两张数卡，能落在同一格吗？"],
  benchmark: ["四张数卡，离整十和 100 各多远？", "四张数卡，谁离 100 更近？"],
  aboutHowMany: ["先看看，这群小圆点多不多？", "上面和下面，各有多少？"],
  reasonable: ["先用整十想一想，再看结果。", "看这个算式，结果可能是几？"],
  equationMatch: ["先看图，再读读旁边的算式。", "一个算式，哪幅图说得对？"],
  compareBig: ["四张数卡，哪些落在这段里？", "换一张卡，区间里的数量会变。"],
};

function instruction(c: Canvas, text: string, y = 52) {
  c.circle(18, y + 4, 3.8, INK.gold);
  c.text("1", 18, y - 0.3, 14, "numericBold", INK.white, "center");
  c.wrap(text, 25, y, 171, 14, 2);
}
function question(c: Canvas, index: number, text: string, y = 214) {
  c.circle(18, y + 4, 3.8, INK.gold);
  c.text(String(index), 18, y - 0.3, 14, "numericBold", INK.white, "center");
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

/** 满十的小盒加散点，让「满盒和散珠」在图上直接看得见。 */
function grouped(c: Canvas, value: number, x: number, y: number) {
  const tens = Math.floor(value / 10), ones = value % 10;
  for (let k = 0; k < tens && k < 8; k += 1) {
    const left = x + (k % 4) * 11, top = y + Math.floor(k / 4) * 11;
    c.rect(left, top, 10, 10, INK.gold, INK.dark, 0.3);
    c.caption("10", left + 5, top + 1.5, 10, "numericBold", INK.dark, "center");
  }
  for (let k = 0; k < ones && k < 9; k += 1)
    c.circle(x + 4 + (k % 5) * 8, y + 25 + Math.floor(k / 5) * 8, 2.4, INK.soft, INK.dark, 0.3);
}

function manyWays(c: Canvas, p: Problem<"manyWays">, edition: 0 | 1, day: number) {
  const letters = ["A", "B", "C", "D", "E"];
  for (let i = 0; i < 5; i += 1) {
    const x = 18 + (i % 3) * 60, y = 80 + Math.floor(i / 3) * 58;
    c.rect(x, y, 56, 52, i % 2 ? INK.soft : "#F1F8FA", INK.line, 0.4);
    c.text(letters[i], x + 5, y + 2, 14, "numericBold", INK.blue);
    if (edition === 1 && i === 4) {
      c.text("画在这里", x + 28, y + 20, 14, "chinese", INK.muted, "center");
      continue;
    }
    const value = p.values[i];
    if (i === 0 || i === 4) c.text(String(value), x + 28, y + 17, 26, "numericBold", INK.dark, "center");
    else if (i === 1) c.text(`${Math.floor(value / 10)} 个十和 ${value % 10} 个一`, x + 28, y + 19, 14, "chinese", INK.dark, "center");
    else if (i === 2) c.text(`${Math.floor(value / 10) * 10} + ${value % 10}`, x + 28, y + 18, 17, "numericBold", INK.dark, "center");
    else grouped(c, value, x + 4, y + 6);
  }
  if (edition === 0) {
    question(c, 2, "圈出不一样的那幅，它表示的是几？写在框里。");
    c.text("它表示", 25, 240, 14);
    box(c, 72, 238);
    note(c, day, "说一说，另外四幅哪里一样？");
  } else {
    question(c, 2, "换一种方式，在空框里再表示一次这个数。");
    c.text("我用的是", 25, 240, 14);
    box(c, 80, 238, 80, 12);
    note(c, day, "说一说，它们哪里一样？");
  }
}

function regroup(c: Canvas, p: Problem<"regroup">, edition: 0 | 1, day: number) {
  c.rect(18, 80, 174, 32, INK.soft, INK.dark, 0.5);
  c.text(`${p.total} 颗`, 105, 85, 24, "chineseBold", INK.dark, "center");
  c.caption("每盒装满 10 颗", 105, 113, 12, "chinese", INK.muted, "center");
  if (edition === 0) {
    p.options.forEach(([tens, ones], i) => {
      const y = 122 + i * 28;
      choice(c, 24, y + 6);
      c.rect(34, y, 150, 20, INK.white, INK.line, 0.35);
      c.text(`${tens} 盒满的和 ${ones} 颗散的`, 109, y + 2, 16, "chinese", INK.dark, "center");
    });
    question(c, 2, "圈出能说清这些珠子的说法。");
    c.text("装法换了，珠子一共变了吗？圈：变了　没变", 20, 242, 14);
    note(c, day, "不看图，也能知道有几颗吗？");
  } else {
    question(c, 2, "把珠子装进十格盒，写出所有装法。");
    for (let i = 0; i < 6; i += 1) box(c, 22 + (i % 3) * 58, 232 + Math.floor(i / 3) * 15, 52, 12);
    c.text("共有", 22, 262, 14);
    box(c, 56, 260, 18, 10);
    c.text("种装法。", 78, 262, 14);
  }
}

function dualLine(c: Canvas, p: Problem<"dualLine">, edition: 0 | 1, day: number) {
  const lines = [
    { label: "A", step: p.upperBound / 10, y: 92 },
    { label: "B", step: p.lowerBound / 10, y: 150 },
  ];
  for (const line of lines) {
    c.rect(16, line.y - 18, 178, 46, "#F3F8FA", INK.line, 0.4);
    c.text(`${line.label} 线`, 20, line.y - 16, 14, "chineseBold", INK.blue);
    c.line(38, line.y + 8, 186, line.y + 8, INK.dark, 0.7);
    for (let i = 0; i <= 10; i += 1) {
      const x = 38 + i * 14.8;
      c.line(x, line.y + 4, x, line.y + 12, INK.dark, 0.4);
      if (i % 5 === 0) c.caption(String(i * line.step), x, line.y + 14, 12, "numeric", INK.muted, "center");
    }
    if (edition === 0) c.circle(38 + p.step * 14.8, line.y + 8, 4, INK.gold, INK.dark, 0.5);
  }
  if (edition === 0) {
    question(c, 2, "两条线都走到同一格，各表示几？填在下面。");
    c.text("A", 25, 238, 14);
    box(c, 40, 236, 22, 12);
    c.text("B", 70, 238, 14);
    box(c, 85, 236, 22, 12);
    c.text("相差", 115, 238, 14);
    box(c, 150, 236, 22, 12);
    note(c, day, "同一个位置，两个数相差多少？");
  } else {
    question(c, 2, `把 ${p.upper} 和 ${p.lower} 两张数卡画到两条线的同一格上。`);
    c.text("A 线放", 25, 240, 14);
    c.text(String(p.upper), 72, 238, 18, "numericBold", INK.blue);
    c.text("B 线放", 105, 240, 14);
    c.text(String(p.lower), 152, 238, 18, "numericBold", INK.blue);
    note(c, day, "为什么落在同一格，两个数不一样？");
  }
}

function benchmark(c: Canvas, p: Problem<"benchmark">, edition: 0 | 1, day: number) {
  c.line(24, 100, 186, 100, INK.dark, 0.7);
  for (let i = 0; i <= 10; i += 1) {
    const x = 24 + i * 16.2;
    c.line(x, 96, x, 104, INK.dark, 0.4);
    if (i % 5 === 0) c.caption(String(i * 10), x, 106, 12, "numeric", INK.muted, "center");
  }
  p.cards.forEach((value, i) => {
    const x = 20 + i * 44;
    c.rect(x, 128, 40, 26, INK.soft, INK.dark, 0.4);
    c.text(String(value), x + 20, 130, 22, "numericBold", INK.dark, "center");
    if (edition === 0) {
      c.caption("离50", x + 11, 166, 10, "chinese", INK.muted, "center");
      c.circle(x + 11, 174, 2.6, INK.white, INK.dark, 0.4);
      c.caption("离100", x + 30, 166, 10, "chinese", INK.muted, "center");
      c.circle(x + 30, 174, 2.6, INK.white, INK.dark, 0.4);
    } else choice(c, x + 20, 174);
  });
  if (edition === 0) {
    question(c, 2, "在每张卡下面圈出：离 50 最近的、离 100 最近的。");
    note(c, day, "你先看它离哪个整十近？说一说。");
  } else {
    question(c, 2, "把四张数卡按离 100 由近到远排好。");
    for (let i = 0; i < 4; i += 1) box(c, 22 + i * 44, 240, 34, 14);
    c.text("再圈出最接近整十的那张。", 20, 260, 14);
  }
}

function dots(c: Canvas, count: number, x: number, y: number) {
  for (let i = 0; i < count; i += 1) {
    const col = i % 16, row = Math.floor(i / 16);
    c.circle(x + col * 11 + (i % 3) * 1.2, y + row * 7 + (i % 2) * 1.2, 2.1, INK.blue, INK.dark, 0.25);
  }
}

function aboutHowMany(c: Canvas, p: Problem<"aboutHowMany">, edition: 0 | 1, day: number) {
  if (edition === 0) {
    c.rect(16, 78, 178, 52, "#F3F8FA", INK.line, 0.4);
    dots(c, p.first, 20, 82);
    p.options.forEach((value, i) => {
      const x = 22 + i * 44;
      choice(c, x, 145);
      c.text(String(value), x + 6, 139, 18, "numericBold");
    });
    c.text("现在按十个一组数一数，圈出用了几组。", 18, 172, 14);
    for (let i = 0; i < 6; i += 1) {
      c.rect(22 + i * 28, 192, 24, 16, INK.white, INK.blue, 0.4);
      c.caption("10", 34 + i * 28, 194, 12, "numeric", INK.muted, "center");
    }
    question(c, 2, "先不要一个个数。猜一猜大约是多少，圈出来。", 214);
    note(c, day, "数完以后，你猜得接近吗？");
  } else {
    c.rect(16, 78, 178, 48, "#F3F8FA", INK.line, 0.4);
    dots(c, p.first, 20, 82);
    c.rect(16, 132, 178, 48, INK.soft, INK.line, 0.4);
    dots(c, p.second, 20, 136);
    question(c, 2, "两处小圆点，先猜哪处多、大约差几十。", 190);
    c.text("上面多　下面多", 25, 222, 14);
    choice(c, 22, 226);
    choice(c, 92, 226);
    c.text("大约差", 130, 222, 14);
    box(c, 170, 220, 20, 12);
    note(c, day, "再按十个一组数一数，看看差多少。", 244);
  }
}

function reasonable(c: Canvas, p: Problem<"reasonable">, edition: 0 | 1, day: number) {
  if (edition === 0) {
    c.rect(18, 82, 174, 44, INK.soft, INK.dark, 0.5);
    c.text(p.operator === 0 ? `车上 ${p.a} 人，又上来 ${p.b} 人` : `盒里 ${p.a} 颗，拿走 ${p.b} 颗`,
      105, 92, 16, "chinese", INK.dark, "center");
    c.text("只用整十想一想", 105, 130, 14, "chinese", INK.muted, "center");
  } else {
    const op = p.operator === 0 ? "+" : "-";
    // 用框标出算式，提示这里的数可以改，和追问的“改哪个数、改成几”对上。
    c.rect(30, 86, 150, 26, INK.pink, INK.line, 0.4);
    c.text(`${p.a} ${op} ${p.b} = ?`, 105, 90, 26, "numericBold", INK.dark, "center");
    c.text("算式里的数可以改一改", 105, 118, 14, "chinese", INK.muted, "center");
  }
  p.options.forEach((value, i) => {
    const x = 22 + i * 58;
    choice(c, x, 158);
    c.rect(x + 8, 146, 44, 22, INK.white, INK.blue, 0.4);
    c.text(String(value), x + 30, 148, 20, "numericBold", INK.dark, "center");
  });
  question(c, 2, edition
    ? "圈出合理的得数，再改算式里的一个数，让另一个结果也合理。"
    : "圈掉不可能的结果，把合理的那个圈出来。", 190);
  if (edition === 1) {
    c.text("把", 25, 222, 14);
    box(c, 40, 220, 24, 12);
    c.text("改成", 70, 222, 14);
    box(c, 100, 220, 24, 12);
  }
  c.text("为什么合理？写一句。", 25, 242, 14);
  box(c, 150, 240, 40, 12);
  note(c, day, "不用算出得数，也能看出谁不合理吗？", 258);
}

function equationMatch(c: Canvas, p: Problem<"equationMatch">, edition: 0 | 1, day: number) {
  if (edition === 0) {
    c.rect(18, 80, 80, 54, INK.soft, INK.dark, 0.5);
    c.text(`${p.left} 颗`, 58, 92, 20, "chinese", INK.dark, "center");
    c.rect(110, 80, 82, 54, "#F1F8FA", INK.dark, 0.5);
    c.text(`${p.right} 颗`, 151, 92, 20, "chinese", INK.dark, "center");
    c.text("合起来", 105, 138, 14, "chinese", INK.muted, "center");
    p.choices.forEach(([x, op, y, z], i) => {
      const cy = 160 + i * 24;
      choice(c, 22, cy + 6);
      c.text(`${x} ${op === 0 ? "+" : "-"} ${y} = ${z}`, 34, cy, 18, "numericBold");
    });
    question(c, 2, "圈出能说清这幅图的算式，可以多于一个。", 236);
    c.text("它们说的是什么？写一句。", 20, 258, 14);
    box(c, 145, 256, 45, 12);
  } else {
    c.text(`${p.sum} - ${p.left} = ${p.right}`, 105, 86, 24, "numericBold", INK.dark, "center");
    c.text("哪幅图能说清这个算式？", 105, 114, 14, "chinese", INK.muted, "center");
    p.pictures.forEach(([left, right], i) => {
      const x = 18 + i * 60;
      c.rect(x, 134, 56, 54, INK.soft, INK.dark, 0.4);
      c.text(`${left} 和 ${right}`, x + 28, 142, 14, "chinese", INK.dark, "center");
      c.caption("颗", x + 28, 160, 12, "chinese", INK.muted, "center");
      choice(c, x + 28, 180);
    });
    question(c, 2, "把另一幅图改一个数字，让它也能说清。", 200);
    c.text("改后的数", 25, 230, 14);
    box(c, 88, 228, 26, 12);
    note(c, day, "图和算式说的是同一个数吗？", 250);
  }
}

function compareBig(c: Canvas, p: Problem<"compareBig">, edition: 0 | 1, day: number) {
  p.cards.forEach((value, i) => {
    const x = 20 + i * 44;
    c.rect(x, 86, 40, 26, INK.soft, INK.dark, 0.4);
    c.text(String(value), x + 20, 88, 22, "numericBold", INK.dark, "center");
    if (edition === 0) {
      c.caption("区间", x + 11, 118, 10, "chinese", INK.muted, "center");
      c.circle(x + 11, 124, 2.4, INK.white, INK.dark, 0.4);
      c.caption("近70", x + 30, 118, 10, "chinese", INK.muted, "center");
      c.circle(x + 30, 124, 2.4, INK.white, INK.dark, 0.4);
    } else c.caption(String(i + 1), x + 20, 116, 10, "numeric", INK.muted, "center");
  });
  // 60～80 两格先上色，线和数字后画，不会盖住。
  c.rect(24 + 6 * 16.2, 140, 2 * 16.2, 16, INK.gold, INK.gold, 0.2);
  c.line(24, 148, 186, 148, INK.dark, 0.7);
  for (let i = 0; i <= 10; i += 1) {
    const x = 24 + i * 16.2;
    c.line(x, 144, x, 152, INK.dark, 0.4);
    if (i % 2 === 0) c.caption(String(i * 10), x, 154, 12, "numeric", INK.muted, "center");
  }
  if (edition === 0) {
    question(c, 2, "圈出比 60 大又比 80 小的，再圈出最接近 70 的。", 184);
    c.text("你还能写一个符合条件的数吗？", 20, 222, 14);
    box(c, 156, 220, 30, 12);
    note(c, day, "你先看它离哪个整十近？说一说。", 244);
  } else {
    question(c, 2, "换掉一张数卡，让区间里正好有两个数。", 184);
    c.text("可以换成", 20, 222, 14);
    p.replacements.forEach((value, i) => {
      c.text(String.fromCharCode(65 + i), 74 + i * 30, 220, 14, "numericBold", INK.muted);
      c.text(String(value), 82 + i * 30, 220, 15, "numericBold", INK.blue);
    });
    c.text("换法写成：第几张卡换成哪个字母", 20, 230, 14);
    box(c, 36, 242, 130, 14);
    note(c, day, "换完以后，区间里一共有几个数？", 258);
  }
}

/** 这组数量类活动共用一套毫米坐标；两版读同一份材料，换的是推理方向。 */
export function drawNumberScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem as NumberProblem;
  const edition = task.edition;
  // 与其它 32 种活动相同：第 1 问放在页头下方，追问才是编号 2。
  instruction(c, INTRO[p.kind][edition]);
  if (p.kind === "manyWays") manyWays(c, p, edition, day);
  else if (p.kind === "regroup") regroup(c, p, edition, day);
  else if (p.kind === "dualLine") dualLine(c, p, edition, day);
  else if (p.kind === "benchmark") benchmark(c, p, edition, day);
  else if (p.kind === "aboutHowMany") aboutHowMany(c, p, edition, day);
  else if (p.kind === "reasonable") reasonable(c, p, edition, day);
  else if (p.kind === "equationMatch") equationMatch(c, p, edition, day);
  else if (p.kind === "compareBig") compareBig(c, p, edition, day);
  else return false;
  return true;
}
