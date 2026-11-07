import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import type { QuantityProblem } from "./activities-quantity";
import type { NumberSenseTask } from "./types";

const TINT = { sky: "#EDF8FC", wood: "#A77A51", grass: "#E8F2D9", orange: "#E68A39" };

function instruction(c: Canvas, index: number, text: string, y: number) {
  c.circle(18, y + 4, 3.8, TINT.orange);
  c.text(String(index), 18, y - 0.3, 14, "numericBold", INK.white, "center");
  c.wrap(text, 25, y, 171, 14, 2);
}

function writeAfter(c: Canvas, text: string, x: number, y: number, width = 14) {
  const end = x + c.text(text, x, y, 14) + 3;
  c.blank(end, y - 0.5, width, 10);
  return end + width;
}

function bead(c: Canvas, x: number, y: number, filled = true, radius = 3.2) {
  c.circle(x, y, radius, filled ? INK.gold : INK.white, INK.dark, 0.4);
  if (filled) c.circle(x - radius * 0.25, y - radius * 0.25, radius * 0.2, INK.white);
}

/** 每个小格对应一个物件，轮廓在黑白打印中也能看出是否已装入。 */
function tenBox(c: Canvas, x: number, y: number, occupied: number, cell = 6) {
  for (let i = 0; i < 10; i += 1) {
    const left = x + i % 5 * cell, top = y + Math.floor(i / 5) * cell;
    c.rect(left, top, cell, cell, INK.white, TINT.wood, 0.35);
    if (i < occupied) bead(c, left + cell / 2, top + cell / 2, true, cell * 0.28);
  }
}

function looseBeads(c: Canvas, count: number, x: number, y: number, cols: number, step: number) {
  for (let i = 0; i < count; i += 1) bead(c, x + i % cols * step, y + Math.floor(i / cols) * step);
}

function drawPairing(c: Canvas, p: Extract<QuantityProblem, { kind: "pairing" }>, repeat: boolean, day: number) {
  instruction(c, 1, repeat ? "先把每队两个一对圈起来，再想两队合在一起。" : "舞会要两个一对。圈一圈，把落单的个数填好。", 52);
  p.counts.forEach((count, index) => {
    const y = 81 + index * 47;
    c.ellipse(21, y, 171, 42, [INK.soft, TINT.sky, TINT.grass][index], INK.line, 0.5);
    c.text(["A 队", "B 队", "C 队"][index], 27, y + 12, 16, "chineseBold");
    for (let i = 0; i < count; i += 1) {
      const x = 66 + i % 10 * 12, top = y + 8 + Math.floor(i / 10) * 13;
      c.circle(x, top + 2, 3.2, INK.white, INK.dark, 0.45);
      c.circle(x - 1, top + 1.5, 0.35, INK.dark);
      c.circle(x + 1, top + 1.5, 0.35, INK.dark);
      c.path("M 0 0 Q 1.5 2 3 0", x - 1.5, top + 2.5, 3, 2, undefined, INK.dark, 0.3);
    }
    if (!repeat) writeAfter(c, "落单", 132, y + 29, 12);
  });
  instruction(c, 2, repeat ? "哪两队合起来，人人都有伙伴？圈一圈。" : "每队添 1 位，哪些队就不落单了？圈一圈。", 229);
  c.text(repeat ? "A 和 B       A 和 C       B 和 C" : "A 队           B 队           C 队", 63, 250, 15);
  c.image(getMathPdfCharacter(day), 20, 242, 24, 29);
}

function drawBundles(c: Canvas, p: Extract<QuantityProblem, { kind: "bundles" }>, repeat: boolean) {
  instruction(c, 1, repeat ? "每盒装 10 块。把散块中的 10 块圈成一盒。" : "每个满盒有 10 块。把积木连到同样多的数卡。", 52);
  const boxes = repeat ? p.boxes - 1 : p.boxes;
  const loose = repeat ? p.loose + 10 : p.loose;
  c.rect(20, 81, 170, 38, INK.soft, TINT.wood, 0.6);
  c.caption("满盒", 25, 83, 12, "chineseBold");
  for (let i = 0; i < boxes; i += 1) tenBox(c, 27 + (i % 5) * 33, 88 + Math.floor(i / 5) * 15, 10, 6);
  c.rect(20, 129, 170, 58, TINT.sky, INK.blue, 0.6);
  c.caption("散块", 25, 131, 12, "chineseBold");
  looseBeads(c, loose, 35, 153, 9, 17);
  if (!repeat) {
    p.options.forEach((number, i) => {
      c.rect(30 + i * 59, 200, 32, 18, INK.white, INK.blue, 0.6);
      c.text(String(number), 46 + i * 59, 201, 26, "numericBold", INK.blue, "center");
    });
    instruction(c, 2, "打开一盒：划掉一个满盒，在下面画出散块。", 228);
    c.rect(25, 248, 164, 24, undefined, INK.line, 0.4);
  } else {
    instruction(c, 2, "画好新装的一盒，再填剩下的散块个数。", 202);
    tenBox(c, 33, 223, 0, 10);
    writeAfter(c, "剩下散块", 111, 226);
    c.text("一共变了吗？圈一圈：变多　不变　变少", 25, 258, 14);
  }
}

function bird(c: Canvas, x: number, y: number) {
  c.path("M 0 4 Q 3 0 6 4 Q 9 0 12 4", x, y, 12, 4, undefined, INK.dark, 0.8);
  c.circle(x + 6, y + 4, 0.8, INK.blue);
}

function drawHidden(c: Canvas, p: Extract<QuantityProblem, { kind: "hidden" }>, repeat: boolean, day: number) {
  instruction(c, 1, repeat ? `一共有 ${p.total} 只鸟。请用小圆点画出云外的鸟。` : `一共有 ${p.total} 只鸟。云后藏着几只？`, 52);
  c.rect(17, 79, 176, 129, TINT.sky);
  c.ellipse(112, 83, 72, 58, INK.white, INK.line, 0.5);
  c.ellipse(101, 97, 55, 40, INK.white);
  c.ellipse(132, 94, 54, 45, INK.white);
  if (repeat) c.text(`云后 ${p.total - p.visible} 只`, 147, 108, 16, "chineseBold", INK.blue, "center");
  else {
    c.text("云后", 130, 109, 14);
    c.blank(153, 107, 18, 12);
    for (let group = 0; group * 5 < p.visible; group += 1)
      for (let k = 0; k < 5 && group * 5 + k < p.visible; k += 1)
        bird(c, 24 + (group % 3) * 56 + k * 11, 150 + Math.floor(group / 3) * 18);
  }
  c.image(getMathPdfCharacter(day), 25, 87, 24, 32);
  c.wrap(repeat ? "云外空白处可以画圆点。" : "看见的和藏住的，是同一群鸟。", 52, 88, 51, 14, 3);
  instruction(c, 2, repeat ? `又有 ${p.emerge} 只飞出来，换一种排法画云外的鸟。` : `又有 ${p.emerge} 只从云后飞出来。`, 220);
  c.text(repeat ? "画法和刚才一样吗？说一说。" : "在云外补画小圆点，再填一填。", 25, 234, 14);
  writeAfter(c, "云外现在", 25, 254, 17);
  writeAfter(c, "云后还剩", 115, 254, 17);
}

function numberTrack(c: Canvas, start: number, y: number) {
  c.line(25, y, 185, y, INK.dark, 0.8);
  for (let i = 0; i <= 20; i += 1) {
    const x = 25 + i * 8;
    c.line(x, y - (i % 10 === 0 ? 4 : 2), x, y + 3, INK.dark, 0.4);
    if (i % 10 === 0) c.text(String(start + i), x, y + 6, 18, "numericBold", INK.dark, "center");
  }
  c.caption("每一小格相差 1", 105, y + 21, 12, "chinese", INK.muted, "center");
}

function drawLine(c: Canvas, p: Extract<QuantityProblem, { kind: "line" }>, repeat: boolean, day: number) {
  instruction(c, 1, repeat ? "小旗站在哪个数上？把号码填在上方相应字母旁。" : "把三张数卡连到数线上的位置。", 52);
  c.rect(17, 79, 176, 112, TINT.grass);
  if (!repeat) p.numbers.forEach((n, i) => {
    const x = 42 + i * 58;
    c.rect(x - 14, 88, 28, 17, INK.white, INK.blue, 0.5);
    c.text(String(n), x, 88, 24, "numericBold", INK.blue, "center");
  });
  numberTrack(c, p.start, 150);
  if (repeat) {
    // 答题框单独成行，用字母对应旗子，避免右端回置框遮住其他旗杆。
    [...p.numbers].sort((a, b) => a - b).forEach((n, i) => {
      const label = String.fromCharCode(65 + i), answerX = 35 + i * 58;
      c.text(label, answerX, 90, 16, "numericBold", INK.dark);
      c.blank(answerX + 9, 89, 21, 13);
      const x = 25 + (n - p.start) * 8, top = 120 + i * 8;
      c.line(x, top, x, 150, INK.dark, 0.5);
      c.rect(x, top, 6.5, 8, [INK.soft, INK.pink, TINT.sky][i], INK.dark, 0.3);
      c.caption(label, x + 3.25, top + 0.4, 11, "numericBold", INK.dark, "center");
    });
  }
  instruction(c, 2, repeat ? `在数线上再标出 ${p.extra}，把四个数从小到大排好。` : "圈出离右边终点最近的数卡。", 205);
  c.image(getMathPdfCharacter(day), 23, 236, 26, 34);
  if (repeat) {
    for (let i = 0; i < 4; i += 1) {
      c.blank(63 + i * 31, 241, 21, 16);
      if (i < 3) c.text("＜", 86 + i * 31, 244, 16);
    }
  } else {
    c.wrap("从一个数走到另一个数，中间隔了几小格？指给伙伴看。", 61, 239, 126, 14, 3);
  }
}

function beadTray(c: Canvas, amount: number, x: number, label: string) {
  c.rect(x, 89, 79, 112, INK.soft, TINT.wood, 0.6);
  c.text(`${label} ${amount} 颗`, x + 39.5, 94, 18, "chineseBold", INK.dark, "center");
  const whole = Math.floor(amount / 10);
  for (let i = 0; i < whole; i += 1) tenBox(c, x + 6 + i % 2 * 35, 112 + Math.floor(i / 2) * 16, 10, 6);
  tenBox(c, x + 7, 158, amount % 10, 13);
}

function drawCompensation(c: Canvas, p: Extract<QuantityProblem, { kind: "compensation" }>, repeat: boolean, day: number) {
  instruction(c, 1, repeat ? "不搬珠子。两边各添几颗或拿走几颗，能让两边都成整十？" : "把右边的几颗搬到左边，让左边最后一盒装满。", 52);
  beadTray(c, p.left, 19, "左边");
  beadTray(c, p.right, 112, "右边");
  c.text(repeat ? "在图上圈出添或拿走的珠子。每盒 10 颗。" : "圈出要搬的珠子，画线送进空格。每盒 10 颗。", 25, 211, 14);
  instruction(c, 2, repeat ? "添或拿走以后，各有几颗？填在下面。" : "搬好以后，各有几颗？填在对应的下面。", 229);
  c.blank(51, 246, 22, 14);
  c.blank(143, 246, 22, 14);
  c.image(getMathPdfCharacter(day), 96, 236, 18, 23);
  c.text(repeat ? "两种办法，合起来一样多吗？圈：一样　不一样" : "合起来变了吗？圈：变多　不变　变少", 25, 263, 14);
}

function runnerTrack(c: Canvas, position: number, y: number, label: string, asset: ReturnType<typeof getMathPdfCharacter>) {
  c.rect(20, y - 3, 172, 37, TINT.grass);
  c.text(label, 25, y - 1, 14, "chineseBold");
  c.line(32, y + 18, 182, y + 18, INK.dark, 0.6);
  for (let n = 0; n <= 50; n += 1) {
    const x = 32 + n * 3;
    c.line(x, y + 18, x, y + (n % 10 === 0 ? 22 : 20), INK.dark, 0.3);
    if (n % 10 === 0) c.caption(String(n), x, y + 23, 12, "numeric", INK.dark, "center");
  }
  const x = 32 + position * 3;
  c.image(asset, x - 5, y - 2, 10, 17);
  c.line(x, y + 14, x, y + 18, INK.blue, 0.7);
  c.text(String(position), x + 7, y + 1, 14, "numericBold", INK.blue);
}

function drawDifference(c: Canvas, p: Extract<QuantityProblem, { kind: "difference" }>, repeat: boolean, day: number) {
  instruction(c, 1, repeat ? "看看两人的位置。按脚步往前走，标出新位置。" : `两人都往前走 ${p.together} 格。先猜，再标出新位置。`, 52);
  runnerTrack(c, p.positions[0], 91, "A", getMathPdfCharacter(day));
  runnerTrack(c, p.positions[1], 149, "B", getMathPdfCharacter(day + 1));
  c.text(repeat ? `A 往前 ${p.steps[0]} 格，B 往前 ${p.steps[1]} 格。` : "每一小格走 1 步，两条跑道的起点对齐。", 25, 197, 14);
  instruction(c, 2, repeat ? "走完以后，谁在前面？圈：A　B　并排" : "两人之间的空当：变大　不变　变小", 219);
  if (repeat) {
    c.text("回到原处，A 不动。B 走几格能追上？", 25, 245, 14);
    c.blank(163, 244, 22, 13);
  } else {
    writeAfter(c, "开始相隔", 25, 246, 17);
    writeAfter(c, "后来相隔", 115, 246, 17);
  }
}

function drawCapacity(c: Canvas, p: Extract<QuantityProblem, { kind: "capacity" }>, repeat: boolean) {
  instruction(c, 1, repeat ? `又来 ${p.incoming} 颗。只放进 A、B 两盒，每盒都要添。` : `又来 ${p.incoming} 颗。圈出能把它们全装进去的盒子。`, 52);
  c.text("一个格子放一颗，画着珠子的格子已经装好了。", 25, 72, 14);
  p.capacities.forEach((capacity, index) => {
    const x = 22 + index * 59;
    c.rect(x, 96, 49, 112, [INK.soft, TINT.sky, TINT.grass][index], TINT.wood, 0.6);
    c.text(["A", "B", "C"][index], x + 24.5, 99, 22, "numericBold", INK.blue, "center");
    for (let row = 0; row < capacity / 10; row += 1)
      tenBox(c, x + 4.5, 120 + row * 25, Math.max(0, Math.min(10, p.occupied[index] - row * 10)), 8);
    c.text(`${capacity} 格`, x + 24.5, 192, 14, "chinese", INK.dark, "center");
  });
  if (repeat) {
    instruction(c, 2, "每盒新添几颗？找两种放法，别超出空格。", 218);
    writeAfter(c, "一种：A", 27, 239, 15);
    writeAfter(c, "B", 123, 239, 15);
    writeAfter(c, "另一种：A", 27, 258, 15);
    writeAfter(c, "B", 123, 258, 15);
  } else {
    instruction(c, 2, "哪盒会刚好装满？圈：A　B　C", 224);
    c.text("在刚好装满的盒子里，把新来的珠子画出来。", 25, 250, 14);
  }
}

function token(c: Canvas, shape: number, striped: boolean, x: number, y: number, size = 10) {
  if (shape === 0) c.circle(x + size / 2, y + size / 2, size / 2, INK.white, INK.dark, 0.5);
  else if (shape === 1) c.rect(x, y, size, size, INK.white, INK.dark, 0.5);
  else c.path(`M ${size / 2} 0 L ${size} ${size} L 0 ${size} Z`, x, y, size, size, INK.white, INK.dark, 0.5);
  if (striped) {
    // 纹理画在各形状内部，不依赖颜色区分两类。
    for (const fraction of [0.45, 0.65, 0.85]) {
      const inset = shape === 2 ? size * (1 - fraction) / 2 + 0.5 : size * 0.24;
      c.line(x + inset, y + size * fraction, x + size - inset, y + size * fraction, INK.dark, 0.65);
    }
  }
}

function drawCollections(c: Canvas, p: Extract<QuantityProblem, { kind: "collections" }>, repeat: boolean) {
  const labels = ["圆形", "方形", "三角形"];
  instruction(c, 1, repeat ? `圈出有条纹的${labels[p.target]}，两个条件都要符合。` : "同一批图形，先按形状分，再按花纹分。", 52);
  c.rect(19, 80, 172, 99, INK.soft, TINT.wood, 0.6);
  p.items.forEach((item, i) => token(c, item.shape, item.striped, 31 + i % 6 * 26, 91 + Math.floor(i / 6) * 27, 14));
  if (!repeat) {
    labels.forEach((label, i) => writeAfter(c, label, 24 + i * 58, 192, 14));
    writeAfter(c, "无条纹", 24, 218, 17);
    writeAfter(c, "有条纹", 121, 218, 17);
    instruction(c, 2, "分法换了，一共变了吗？圈：变了　没变", 247);
  } else {
    instruction(c, 2, "把圈出的图形画进小盒里，再数一数。", 191);
    c.rect(25, 214, 116, 40, undefined, INK.line, 0.4);
    writeAfter(c, "共", 151, 226, 16);
    c.text(`只圈${labels[p.target]}，会多圈哪些？指给伙伴看。`, 25, 261, 14);
  }
}

/** 第二次见面改换操作条件，材料仍由同一个结构化问题驱动。 */
export function drawQuantityScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem, repeat = task.edition === 1;
  if (p.kind === "pairing") drawPairing(c, p, repeat, day);
  else if (p.kind === "bundles") drawBundles(c, p, repeat);
  else if (p.kind === "hidden") drawHidden(c, p, repeat, day);
  else if (p.kind === "line") drawLine(c, p, repeat, day);
  else if (p.kind === "compensation") drawCompensation(c, p, repeat, day);
  else if (p.kind === "difference") drawDifference(c, p, repeat, day);
  else if (p.kind === "capacity") drawCapacity(c, p, repeat);
  else if (p.kind === "collections") drawCollections(c, p, repeat);
  else return false;
  return true;
}
