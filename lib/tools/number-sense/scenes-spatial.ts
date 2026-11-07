import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import { isSpatialKind, type SpatialProblem } from "./activities-spatial";
import type { NumberSenseTask } from "./types";

type Problem<K extends SpatialProblem["kind"]> = Extract<SpatialProblem, { kind: K }>;
function instructions(c: Canvas, text: string, y = 52) { c.wrap(text, 17, y, 176, 14, 2); }
function shape(c: Canvas, which: number, x: number, y: number, size = 9) {
  if (which === 0) c.circle(x + size / 2, y + size / 2, size / 2, INK.white, INK.dark, 0.55);
  else if (which === 1) c.path(`M ${size / 2} 0 L ${size} ${size} L 0 ${size} Z`, x, y, size, size, INK.white, INK.dark, 0.55);
  else c.rect(x, y, size, size, INK.white, INK.dark, 0.55);
}
function grid(c: Canvas, x: number, y: number, columns: number, rows: number, size: number, filled: readonly number[] = []) {
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++)
    c.rect(x + col * size, y + row * size, size, size, filled.includes(row * columns + col) ? "#BDE0DC" : INK.white, INK.line, 0.35);
}
function companion(c: Canvas, day: number, text: string) {
  c.image(getMathPdfCharacter(day), 17, 248, 19, 24);
  c.wrap(text, 42, 254, 151, 14, 2);
}

function seats(c: Canvas, p: Problem<"seats">, edition: 0 | 1, day: number) {
  instructions(c, edition === 0 ? "照着三张票，把圆、三角、方块画到座位上。" : "看看三个记号坐在哪儿，把下面的电影票补完整。");
  c.path("M 0 0 Q 80 12 160 0 L 160 10 Q 80 22 0 10 Z", 27, 72, 160, 22, INK.soft, INK.gold, 0.5);
  c.text("大银幕", 107, 77, 16, "chineseBold", INK.dark, "center");
  for (let row = 0; row < 4; row++) {
    c.caption(`${row + 1} 排`, 18, 107 + row * 24, 12);
    for (let col = 0; col < 6; col++) {
      const x = 43 + col * 24, y = 102 + row * 24;
      c.rect(x, y, 17, 18, "#FBE3D7", "#A47C6B", 0.5);
      c.rect(x - 1, y + 14, 19, 5, "#EBC1A6", "#A47C6B", 0.5);
      if (row === 0) c.caption(`${col + 1} 号`, x + 8.5, 94, 10, "chinese", INK.dark, "center");
      const symbol = p.tickets.findIndex(([r, n]) => r === row + 1 && n === col + 1);
      if (edition === 1 && symbol >= 0) shape(c, symbol, x + 4, y + 3, 9);
    }
  }
  p.tickets.forEach(([row, col], i) => {
    const x = 18 + i * 61;
    c.rect(x, 210, 54, 27, INK.soft, INK.gold, 0.5);
    shape(c, i, x + 3, 219, 9);
    if (edition === 0) c.text(`${row} 排 ${col} 号`, x + 16, 219, 16);
    else {
      c.blank(x + 15, 218, 10, 11); c.caption("排", x + 26, 219, 12);
      c.blank(x + 34, 218, 10, 11); c.caption("号", x + 45, 219, 12);
    }
  });
  companion(c, day, edition === 0 ? "找位置时，你先看排，还是先看号？" : "只写几号，别人能找到座位吗？");
}

function neighbors(c: Canvas, p: Problem<"neighbors">, edition: 0 | 1, day: number) {
  const people = p.group + edition;
  instructions(c, edition === 0 ? `${people} 个朋友想坐同一排，挨在一起。圈出一组空位。`
    : `又来 1 位朋友，现在有 ${people} 人。还能在一排挨着坐吗？`);
  c.caption("画叉的位置有人坐", 20, 73, 12, "chinese", INK.muted);
  p.occupied.forEach((occupied, row) => {
    const y = 94 + row * 32;
    c.rect(32, y + 16, 155, 5, "#C6A77D", INK.dark, 0.45);
    c.rect(40, y + 21, 5, 7, "#C6A77D"); c.rect(175, y + 21, 5, 7, "#C6A77D");
    c.text(String.fromCharCode(65 + row), 21, y + 4, 18, "numericBold");
    for (let col = 0; col < 7; col++) {
      const x = 34 + col * 22;
      c.rect(x, y, 19, 16, "#EEF5E7", "#789585", 0.5);
      if (occupied.includes(col)) {
        c.line(x + 6, y + 4, x + 13, y + 11, INK.dark, 0.8);
        c.line(x + 13, y + 4, x + 6, y + 11, INK.dark, 0.8);
      }
    }
  });
  instructions(c, edition === 0 ? "再找一组不同的坐法，指给伙伴看。" : "圈一圈：能 / 不能。能的话，把位置圈出来。", 230);
  companion(c, day, "空位很多，就一定能挨着坐吗？");
}

function mirror(c: Canvas, p: Problem<"mirror">, edition: 0 | 1, day: number) {
  instructions(c, edition === 0 ? "把右边的圆点补出来，让左右两边像照镜子。" : "右边有一个圆画错了地方。划掉它，再画到对的格子。");
  c.path("M 85 28 C 14 -2 0 8 0 55 C 0 76 10 86 24 90 C 1 121 21 151 85 128 C 149 151 169 121 146 90 C 160 86 170 76 170 55 C 170 8 156 -2 85 28 Z", 20, 77, 170, 151, "#FFF3D8", "#C8A56B", 0.7);
  const x = 33, y = 105, size = 24;
  grid(c, x, y, 6, 4, size);
  for (const cell of [...p.left, ...(edition === 1 ? p.right : [])])
    c.circle(x + (cell % 6 + 0.5) * size, y + (Math.floor(cell / 6) + 0.5) * size, 5.5, INK.berry, INK.dark, 0.5);
  c.line(105, 95, 105, 211, INK.dark, 0.7, true);
  c.circle(105, 89, 5.5, INK.gold, INK.dark, 0.45);
  c.path("M 7 14 Q 5 0 0 0 M 7 14 Q 9 0 14 0", 98, 69, 14, 14, undefined, INK.dark, 0.6);
  c.caption("中间线", 105, 216, 11, "chinese", INK.muted, "center");
  const width = c.text("补好后，两边一共有", 20, 233, 14);
  c.blank(24 + width, 231, 15, 11); c.text("个圆点。", 42 + width, 233, 14);
  companion(c, day, edition === 0 ? "数一数：对应的圆离中间线各有几格？" : "左右的圆点一样多，就一定画对了吗？");
}

function patchGrid(c: Canvas, cells: readonly number[], x: number, y: number, size: number) {
  grid(c, x, y, 4, 4, size);
  cells.forEach((cell) => {
    const left = x + cell % 4 * size, top = y + Math.floor(cell / 4) * size;
    c.rect(left, top, size, size, "#E8BB68", INK.dark, 0.4);
    c.circle(left + size / 2, top + size / 2, size * 0.12, INK.dark);
  });
}
function tiles(c: Canvas, p: Problem<"tiles">, edition: 0 | 1, day: number) {
  instructions(c, edition === 0 ? "选一块补片，正好补住白色的洞。不转动，也不重叠。"
    : "不转动补片。哪块只剪掉一格，就能正好补住白洞？");
  const size = 24, x = 57, y = 78;
  for (let cell = 0; cell < 16; cell++) {
    const left = x + cell % 4 * size, top = y + Math.floor(cell / 4) * size;
    c.rect(left, top, size, size, p.hole.includes(cell) ? INK.white : "#BDE0DC", INK.dark, 0.45);
    if (!p.hole.includes(cell)) c.circle(left + 12, top + 12, 2.2, INK.blue);
  }
  for (let fringe = 0; fringe < 16; fringe++) {
    c.line(x - 4, y + 3 + fringe * 6, x, y + 3 + fringe * 6, INK.blue, 0.6);
    c.line(x + 96, y + 3 + fringe * 6, x + 100, y + 3 + fringe * 6, INK.blue, 0.6);
  }
  c.text(edition === 0 ? "圈出合适的补片。" : "圈出补片，并划掉多出来的一格。", 20, 184, 14);
  (edition === 0 ? p.options : p.larger).forEach((option, index) => {
    const left = 26 + index * 63;
    patchGrid(c, option, left, 204, 9);
    c.text(String.fromCharCode(65 + index), left + 18, 240, 14, "numericBold", INK.dark, "center");
  });
  companion(c, day, "比一比：格子数相同，形状也相同吗？");
}

function fruit(c: Canvas, which: number, x: number, y: number, size: number) {
  if (which < 2) c.image(which === 0 ? "apple" : "pineapple", x, y, size, size);
  else {
    c.path(`M ${size * .25} ${size * .65} L ${size * .52} ${size * .1} L ${size * .78} ${size * .7}`, x, y, size, size, undefined, INK.leaf, 0.7);
    c.circle(x + size * .25, y + size * .7, size * .2, INK.berry, INK.dark, 0.4);
    c.circle(x + size * .75, y + size * .73, size * .2, INK.berry, INK.dark, 0.4);
  }
}
function code(c: Canvas, p: Problem<"code">, edition: 0 | 1, day: number) {
  instructions(c, edition === 0 ? "照着上面的图例，在右边画记号。位置和空格都不变。"
    : "左边水果变成了右边的记号。找出对应关系，补好图例。");
  p.key.forEach((symbol, index) => {
    const x = 21 + index * 61;
    c.rect(x, 77, 52, 28, INK.soft, INK.gold, 0.5);
    fruit(c, index, x + 3, 82, 17); c.arrow(x + 24, 91, x + 32);
    if (edition === 0) shape(c, symbol, x + 37, 86, 11);
    else c.blank(x + 35, 83, 14, 16);
  });
  for (let panel = 0; panel < 2; panel++) {
    const x = panel === 0 ? 20 : 116, y = 130, size = 24;
    grid(c, x, y, 3, 3, size);
    p.symbols.forEach((symbol, cell) => {
      if (symbol === 3) return;
      const left = x + cell % 3 * size + 5, top = y + Math.floor(cell / 3) * size + 5;
      if (panel === 0) fruit(c, symbol, left, top, 14);
      else if (edition === 1) shape(c, p.key[symbol], left + 1, top + 1, 12);
    });
  }
  c.arrow(98, 166, 109);
  c.text("水果图", 56, 211, 14, "chineseBold", INK.dark, "center");
  c.text("记号图", 152, 211, 14, "chineseBold", INK.dark, "center");
  instructions(c, edition === 0 ? "完成后，找一种水果，指一指它变成的所有记号。"
    : "指一指：你用哪个格子找出了第一个记号？", 230);
  companion(c, day, "换了样子，格子里的位置变了吗？");
}

function directionArrow(c: Canvas, direction: number, x: number, y: number) {
  const paths = ["M 0 5 L 12 5 M 8 1 L 12 5 L 8 9", "M 5 0 L 5 12 M 1 8 L 5 12 L 9 8", "M 12 5 L 0 5 M 4 1 L 0 5 L 4 9", "M 5 12 L 5 0 M 1 4 L 5 0 L 9 4"];
  c.path(paths[direction], x, y, 12, 12, undefined, INK.blue, 0.8);
}
function path(c: Canvas, p: Problem<"path">, edition: 0 | 1, day: number) {
  instructions(c, edition === 0 ? "从“起”出发，照路牌的顺序走。每走一步到旁边一格。"
    : "从“起”沿画好的路走。按顺序数一数，把路牌补完整。");
  const x = 42, y = 78, size = 21;
  grid(c, x, y, 6, 6, size);
  const center = (cell: number) => [x + (cell % 6 + 0.5) * size, y + (Math.floor(cell / 6) + 0.5) * size];
  let cell = p.start;
  if (edition === 1) {
    p.moves.forEach((move) => {
      const [startX, startY] = center(cell);
      cell += [1, 6, -1, -6][move.direction] * move.steps;
      const [endX, endY] = center(cell);
      c.line(startX, startY, endX, endY, INK.blue, 1.1);
      c.circle(endX, endY, 1.5, INK.blue);
    });
    const [endX, endY] = center(cell);
    c.rect(endX - 5, endY - 4, 10, 8, INK.gold, INK.dark, 0.4);
    c.line(endX - 5, endY - 1, endX + 5, endY - 1, INK.dark, 0.5);
  }
  const [startX, startY] = center(p.start);
  c.circle(startX, startY, 6, INK.soft, INK.dark, 0.5);
  c.text("起", startX, startY - 4.6, 14, "chineseBold", INK.dark, "center");
  p.moves.forEach((move, i) => {
    const left = 21 + i * 46;
    c.caption(String(i + 1), left, 213, 12, "numericBold", INK.muted);
    directionArrow(c, move.direction, left + 6, 215);
    if (edition === 0) c.text(String(move.steps), left + 25, 216, 18, "numericBold");
    else c.blank(left + 23, 214, 11, 12);
    c.caption("步", left + 35, 217, 12);
  });
  instructions(c, edition === 0 ? "在图上画出路线，再圈出最后停下的格子。" : "手指沿路走一遍，检查每张路牌的步数。", 234);
  companion(c, day, "只数经过的格子，还是数走了几步？");
}

function wall(c: Canvas, heights: readonly number[] | undefined, x: number, y: number, size: number) {
  grid(c, x, y, 5, 4, size);
  if (heights) heights.forEach((height, col) => {
    for (let level = 0; level < height; level++) {
      const top = y + (3 - level) * size, left = x + col * size;
      c.rect(left, top, size, size, "#F1C879", INK.dark, 0.5);
      c.circle(left + size / 2, top + size / 2, size * 0.12, INK.white, INK.dark, 0.25);
    }
  });
  c.line(x - 2, y + 4 * size, x + 5 * size + 2, y + 4 * size, INK.dark, 0.8);
}
function footprint(c: Canvas, cells: readonly number[], x: number, y: number, size: number) {
  grid(c, x, y, 5, 1, size);
  cells.forEach((value, index) => {
    if (value) c.rect(x + index * size + 1, y + 1, size - 2, size - 2, "#F1C879", INK.dark, 0.45);
  });
}
function views(c: Canvas, p: Problem<"views">, edition: 0 | 1, day: number) {
  instructions(c, edition === 0 ? "积木只摆一排。从正上方往下看，圈出看到的图。"
    : "下面标出积木占的位置。只摆一排，每处最多搭 4 块高。");
  if (edition === 0) {
    wall(c, p.heights, 47, 82, 23);
    c.text("从前面看", 104.5, 181, 14, "chineseBold", INK.dark, "center");
    c.text("从正上方看，会是哪幅？", 20, 199, 14);
    p.options.forEach((option, index) => {
      const x = 20 + index * 61;
      footprint(c, option, x, 219, 10);
      c.text(String.fromCharCode(65 + index), x + 25, 233, 14, "numericBold", INK.dark, "center");
    });
    companion(c, day, "把一处搭高，正上方看到的位置会变吗？");
  } else {
    footprint(c, p.heights.map((height) => height > 0 ? 1 : 0), 60, 83, 18);
    c.text("涂着的地方要有积木，白格要空着。", 105, 107, 14, "chinese", INK.dark, "center");
    const total = p.heights.reduce((a, b) => a + b, 0);
    instructions(c, `每幅都用 ${total} 块积木。在格子里涂出两种不同的搭法。`, 124);
    wall(c, undefined, 23, 152, 14.5); wall(c, undefined, 115, 152, 14.5);
    c.text("第一种", 59.25, 216, 14, "chineseBold", INK.dark, "center");
    c.text("第二种", 151.25, 216, 14, "chineseBold", INK.dark, "center");
    instructions(c, "从地面往上涂，积木下面不能空着。", 235);
    companion(c, day, "哪里搭得不同？占的位置有没有变？");
  }
}

function fence(c: Canvas, p: Problem<"fence">, edition: 0 | 1, day: number) {
  if (edition === 0) {
    instructions(c, "沿花园外边描一圈。每条小格边放 1 根小栏杆，不重叠。");
    const size = 23, x = 105 - p.width * size / 2, y = 86;
    for (let row = 0; row < p.height; row++) for (let col = 0; col < p.width; col++) {
      if (p.cutCorner && row === 0 && col === p.width - 1) continue;
      const left = x + col * size, top = y + row * size;
      c.rect(left, top, size, size, "#E6F0D9", INK.line, 0.4);
      c.image("flower", left + 6.5, top + 6.5, 10, 10);
    }
    const a = c.text("围好一圈，要用", 24, 217, 14);
    c.blank(28 + a, 215, 17, 11); c.text("根小栏杆。", 48 + a, 217, 14);
    const b = c.text("花园里面有", 24, 234, 14);
    c.blank(28 + b, 232, 17, 11); c.text("个小方格。", 48 + b, 234, 14);
    companion(c, day, "里面的小格和外边的小栏杆，数法一样吗？");
  } else {
    const rails = 2 * (p.width + p.height);
    instructions(c, `每次用 ${rails} 根小栏杆，沿格线围成长方形。每条小格边用 1 根。`);
    c.text("每次全部用完，首尾接好，不重叠。", 105, 81, 14, "chinese", INK.dark, "center");
    for (let i = 0; i < rails; i++) {
      const x = 21 + (i % 9) * 19, y = 104 + Math.floor(i / 9) * 13;
      c.line(x, y, x + 12, y, INK.dark, 1.1);
      c.line(x, y - 2, x, y + 2, INK.dark, 0.6); c.line(x + 12, y - 2, x + 12, y + 2, INK.dark, 0.6);
    }
    grid(c, 23, 143, 6, 6, 12); grid(c, 115, 143, 6, 6, 12);
    c.text("第一种围法", 59, 222, 14, "chineseBold", INK.dark, "center");
    c.text("第二种围法", 151, 222, 14, "chineseBold", INK.dark, "center");
    instructions(c, "画出两种不同的长方形，只转个方向不算。", 236);
    companion(c, day, "数一数，哪种围法里面的小方格更多？");
  }
}

/** 每类活动使用可直接圈画的大图；再次出现时切换为逆向或创造任务。 */
export function drawSpatialScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem;
  if (!isSpatialKind(p.kind)) return false;
  const problem = p as SpatialProblem;
  if (problem.kind === "seats") seats(c, problem, task.edition, day);
  else if (problem.kind === "neighbors") neighbors(c, problem, task.edition, day);
  else if (problem.kind === "mirror") mirror(c, problem, task.edition, day);
  else if (problem.kind === "tiles") tiles(c, problem, task.edition, day);
  else if (problem.kind === "code") code(c, problem, task.edition, day);
  else if (problem.kind === "path") path(c, problem, task.edition, day);
  else if (problem.kind === "views") views(c, problem, task.edition, day);
  else fence(c, problem, task.edition, day);
  return true;
}
