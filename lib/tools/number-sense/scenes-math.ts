import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import type { NumberSenseProblem, NumberSenseTask } from "./types";

function instruction(c: Canvas, text: string) {
  c.wrap(text, 16, 52, 178, 14, 2);
}

function house(c: Canvas, x: number, y: number) {
  c.rect(x + 3, y + 13, 24, 26, "#FFE1AA", INK.dark, 0.5);
  c.path("M 0 15 L 15 0 L 30 15 Z", x, y, 30, 15, "#E97C60", INK.dark, 0.5);
  c.rect(x + 12, y + 24, 8, 15, INK.white, INK.dark, 0.4);
  c.rect(x + 6, y + 19, 7, 7, "#BCE5EE", INK.dark, 0.4);
}

function castle(c: Canvas, x: number, y: number) {
  c.rect(x + 3, y + 10, 24, 27, "#E2D7F2", INK.dark, 0.5);
  for (const dx of [0, 20]) {
    c.rect(x + dx, y + 5, 10, 32, "#B9DCE9", INK.dark, 0.5);
    c.path("M 0 9 L 6 0 L 12 9 Z", x + dx - 1, y - 4, 12, 9, "#ED8A76", INK.dark, 0.4);
  }
  c.path("M 0 13 L 0 5 Q 5 0 10 5 L 10 13 Z", x + 10, y + 24, 10, 13, INK.white, INK.dark, 0.4);
}

function route(c: Canvas, p: Extract<NumberSenseProblem, { kind: "route" }>, day: number, edition: 0 | 1) {
  instruction(c, edition ? "让短路绕一点远路，变得和长路一样长。在图上画一画。" : "路牌标的是每一段的长度。到城堡，哪条路更短？");
  c.rect(15, 75, 180, 151, "#EEF8EF");
  c.path("M 0 18 Q 45 0 91 19 Q 134 0 180 15 L 180 63 L 0 63 Z", 15, 75, 180, 63, "#D9EDC6");
  c.ellipse(76, 130, 57, 39, "#C6EAF3");
  c.ellipse(91, 143, 28, 11, "#ACDAE7");
  // 路线只表示连接关系；距离由路牌给出，避免把弯曲程度当成长度。
  const paths = [
    { d: "M 0 51 C 12 48 24 1 67 0 C 107 0 124 38 138 51", y: 99 },
    { d: "M 0 0 C 16 10 24 51 67 51 C 110 51 123 8 138 0", y: 150 },
  ];
  paths.forEach(({ d, y }) => {
    c.path(d, 36, y, 138, 51, undefined, "#C49664", 7);
    c.path(d, 36, y, 138, 51, undefined, "#FAE3AF", 5.5);
  });
  // 白色路点分开两段，路牌上的数分别属于路点前后的路段。
  c.circle(103, 99, 3, INK.white, INK.dark, 0.5);
  c.circle(103, 201, 3, INK.white, INK.dark, 0.5);
  house(c, 17, 122);
  castle(c, 163, 122);
  const labels = [[64, 105], [139, 105], [64, 183], [139, 183]];
  labels.forEach(([x, y], index) => {
    c.line(x, y + 11, x, y + 18, "#8A765E", 0.7);
    c.rect(x - 14, y, 28, 11, INK.white, "#8A765E", 0.4);
    c.text(`${p.segments[index]} 米`, x, y - 0.2, 18, "chinese", INK.dark, "center");
  });
  c.text("A 路", 104, 84, 17, "chineseBold", INK.blue, "center");
  c.text("B 路", 104, 210, 17, "chineseBold", INK.blue, "center");
  c.caption("路线图不按比例", 19, 217, 10, "chinese", INK.muted);
  const choiceWidth = c.text(edition ? "要给哪条补路？A / B。再添" : "圈一圈：A 路短 / B 路短。短了", 16, 235, 14);
  c.blank(20 + choiceWidth, 234, 19, 11);
  c.text("米。", 42 + choiceWidth, 235, 14);
  c.image(getMathPdfCharacter(day), 17, 248, 18, 24);
  c.wrap(edition ? "同样多的路，添在前一段或后一段，最后一样长吗？" : `${p.closed === 0 ? "A" : "B"} 路今天封闭。还能走哪条路？在图上指一指。`, 40, 253, 153, 14, 2);
}

function windowGrid(c: Canvas, pattern: readonly number[], x: number, y: number, color: string) {
  const cell = 7.5;
  c.rect(x - 1, y - 1, cell * 3 + 2, cell * 3 + 2, "#FFEDCB", "#BA9876", 0.6);
  for (let index = 0; index < 9; index += 1) {
    const left = x + (index % 3) * cell;
    const top = y + Math.floor(index / 3) * cell;
    c.rect(left, top, cell, cell, INK.white, "#9AC6D0", 0.3);
    if (pattern.includes(index)) {
      // 圆形贴纸自身旋转对称，孩子只需追踪格子位置。
      c.circle(left + cell / 2, top + cell / 2, 2.5, color, INK.dark, 0.3);
    }
  }
}

function windows(c: Canvas, p: Extract<NumberSenseProblem, { kind: "windows" }>, edition: 0 | 1) {
  instruction(c, edition ? "整扇窗照箭头转。在空窗格画圆点，表示转后的贴纸。" : "整扇窗按说明向右转。圈出转动后的贴纸图。");
  const colors = ["#E78686", "#E4B450", "#79B9AA"];
  p.puzzles.forEach((puzzle, index) => {
    const y = 81 + index * 62;
    c.path("M 0 9 L 16 0 L 164 0 L 180 9 Z", 15, y - 9, 180, 9, colors[index]);
    c.rect(15, y, 180, 48, "#FFF8EB");
    c.text("照箭头转一转", 21, y + 1, 14, "chineseBold");
    const [endX, endY] = [[11, 6], [6, 11], [1, 6]][puzzle.turn - 1];
    c.circle(154, y + 6, 5, undefined, INK.line, 0.3);
    c.line(154, y + 1, 154, y + 11, INK.line, 0.2);
    c.line(149, y + 6, 159, y + 6, INK.line, 0.2);
    c.circle(154, y + 1, 0.8, INK.dark);
    // 圆弧给出转动方向和转过的部分，读不懂“几分之一圈”也能看图。
    c.path(`M 6 1 A 5 5 0 ${puzzle.turn === 3 ? 1 : 0} 1 ${endX} ${endY}`, 148, y, 12, 12, undefined, INK.blue, 0.65);
    const arrowHeads = ["M 9.5 4 L 11 6 L 12 3.5", "M 8 9.5 L 6 11 L 8.5 12", "M 2.5 8 L 1 6 L 0 8.5"];
    c.path(arrowHeads[puzzle.turn - 1], 148, y, 12, 12, undefined, INK.blue, 0.65);
    windowGrid(c, puzzle.pattern, 23, y + 15, colors[index]);
    c.arrow(53, y + 26, 67);
    if (edition) {
      windowGrid(c, [], 95, y + 15, colors[index]);
      c.text("画在这里", 131, y + 25, 14);
    } else puzzle.options.forEach((pattern, option) => {
      const x = 78 + option * 39;
      windowGrid(c, pattern, x, y + 15, colors[index]);
      c.text(String.fromCharCode(65 + option), x + 11.25, y + 39, 14, "numericBold", INK.dark, "center");
    });
  });
  c.text(edition ? "转动前后，贴纸个数变了吗？" : "指一指：你先盯住了哪一块贴纸？", 20, 261, 14);
}

function flower(c: Canvas, x: number, y: number, color: string) {
  c.line(x + 2.4, y + 3, x + 2.4, y + 6.5, INK.leaf, 0.5);
  for (const [dx, dy] of [[1.1, 1.1], [3.6, 1.1], [1.1, 3.3], [3.6, 3.3]])
    c.circle(x + dx, y + dy, 1.3, color, INK.dark, 0.15);
  c.circle(x + 2.4, y + 2.2, 1, "#F7CF67");
}

function patterns(c: Canvas, p: Extract<NumberSenseProblem, { kind: "patterns" }>, edition: 0 | 1) {
  instruction(c, edition ? "每次添或拿走一样多。第二次被擦掉了，在空花坛补画。" : "每次都添一样多，或拿走一样多。接着画，圆点也可以。");
  p.rules.forEach((rule, row) => {
    const y = 83 + row * 61;
    c.text(`第 ${row + 1} 排`, 18, y - 10, 14, "chineseBold");
    for (let stage = 0; stage < 4; stage += 1) {
      const x = 17 + stage * 46;
      const missing = stage === (edition ? 1 : 3);
      c.path("M 0 0 L 37 0 L 34 31 L 3 31 Z", x, y + 3, 37, 31, missing ? INK.white : "#F4F1D8", "#9C8C6B", 0.5);
      c.rect(x, y + 1, 37, 3, "#CFAD7B", "#9C8C6B", 0.3);
      if (!missing) {
        const count = rule.start + stage * rule.step;
        for (let i = 0; i < count; i += 1)
          flower(c, x + 5 + (i % 4) * 7.3, y + 7 + Math.floor(i / 4) * 8, row === 1 ? "#A7C8E9" : "#EF9A9D");
      }
      c.text(missing ? "画一画" : `第 ${stage + 1} 次`, x + 18.5, y + 37, 14, "chinese", INK.dark, "center");
      if (stage < 3) c.arrow(x + 39, y + 19, x + 44);
    }
  });
  c.text("说一说：哪一排越变越少？", 20, 261, 14);
}

function measure(c: Canvas, p: Extract<NumberSenseProblem, { kind: "measure" }>, edition: 0 | 1) {
  instruction(c, edition ? "每格 1 厘米。在每把尺下从 0 开始，画一条同样长的线。" : `图中每一小格代表 ${p.unit} 厘米。看清起点，量一量。`);
  const colors = ["#F0A2AD", "#8DCCD6", "#EBC56F"];
  p.lengths.forEach((length, index) => {
    const y = 86 + index * 49;
    const x = 41, cell = 8;
    c.circle(24, y + 7, 6.5, colors[index], INK.dark, 0.4);
    c.text(String.fromCharCode(65 + index), 24, y + 1, 20, "numericBold", INK.dark, "center");
    const start = x + p.offsets[index] * cell;
    c.rect(start, y + 1, length * cell, 12, colors[index], INK.dark, 0.45);
    c.line(start, y + 4, start + length * cell, y + 4, INK.white, 0.5);
    c.line(start, y + 10, start + length * cell, y + 10, INK.white, 0.5);
    c.rect(x, y + 16, 15 * cell, 14, "#FFF1D0", "#AC8C58", 0.4);
    for (let tick = 0; tick <= 15; tick += 1) {
      const tx = x + tick * cell;
      c.line(tx, y + 16, tx, y + 20, "#796C53", 0.35);
      c.text(String(tick * p.unit), tx, y + 21, 14, "numeric", INK.dark, "center");
    }
    c.line(start, y + 13, start, y + 16, INK.dark, 0.3, true);
    c.line(start + length * cell, y + 13, start + length * cell, y + 16, INK.dark, 0.3, true);
    c.blank(171, y + 3, 18, 12);
    c.text("厘米", 180, y + 17, 14, "chinese", INK.dark, "center");
    if (edition) {
      c.rect(x, y + 34, 15 * cell, 8, INK.white, INK.line);
      for (let tick = 0; tick <= 15; tick += 1)
        c.line(x + tick * cell, y + 34, x + tick * cell, y + 42, INK.line, 0.2);
      c.circle(x, y + 38, 0.8, INK.blue);
    }
  });
  c.text("圈出最长的：A　B　C", 17, 237, 14);
  const compareWidth = c.text("它比最短的长", 17, 251, 14);
  c.blank(21 + compareWidth, 250, 18, 11);
  c.text("厘米。", 42 + compareWidth, 251, 14);
  c.text(edition ? "起点不同，怎么检查两条一样长？" : "每条都剪去一格，哪条仍然最长？", 17, 266, 14);
}

/** 每种材料保留自己的版面，相关提问共用同一幅可操作的图。 */
export function drawMathScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem;
  if (p.kind === "route") route(c, p, day, task.edition);
  else if (p.kind === "windows") windows(c, p, task.edition);
  else if (p.kind === "patterns") patterns(c, p, task.edition);
  else if (p.kind === "measure") measure(c, p, task.edition);
  else return false;
  return true;
}
