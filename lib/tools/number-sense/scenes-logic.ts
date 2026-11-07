import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import type { LogicProblem } from "./activities-logic";
import type { NumberSenseTask } from "./types";

function instruction(c: Canvas, text: string, y = 52) {
  c.wrap(text, 17, y, 176, 14, 2);
}
function companion(c: Canvas, text: string, day: number, y = 250) {
  c.image(getMathPdfCharacter(day), 17, y, 17, 23);
  c.wrap(text, 40, y + 2, 153, 14, 2);
}
function symbol(c: Canvas, value: number, x: number, y: number, size = 8, striped = 0) {
  const fill = ["#FAD685", "#BAE1E7", "#F5BDBE"][value % 3];
  if (value === 0) c.circle(x, y, size / 2, fill, INK.dark, 0.45);
  else if (value === 1) c.rect(x - size / 2, y - size / 2, size, size, fill, INK.dark, 0.45);
  else c.path(`M 0 ${size} L ${size / 2} 0 L ${size} ${size} Z`, x - size / 2, y - size / 2, size, size, fill, INK.dark, 0.45);
  if (striped) {
    c.line(x - size / 5, y, x + size / 5, y, INK.dark, 0.55);
    c.line(x - size / 4, y + size / 4, x + size / 4, y + size / 4, INK.dark, 0.55);
  }
}

function beads(c: Canvas, p: Extract<LogicProblem, { kind: "beads" }>, edition: number, day: number) {
  instruction(c, edition ? "前 6 颗都穿对了。后面照这 6 颗重复，圈出错的一颗并改好。" : "珠子的图案一段一段重复。把空珠里的图案补上。");
  const positions = Array.from({ length: 12 }, (_, i) => {
    const row = Math.floor(i / 4), column = row % 2 ? 3 - i % 4 : i % 4;
    return [40 + column * 43, 91 + row * 43] as const;
  });
  positions.slice(1).forEach(([x, y], i) => c.line(positions[i][0], positions[i][1], x, y, "#C2A46E", 1));
  positions.forEach(([x, y], i) => {
    c.circle(x, y, 13, INK.white, INK.blue, 0.6);
    const missing = !edition && [p.gap, p.gap + 1].includes(i);
    if (!missing) symbol(c, edition && i === p.gap ? p.wrong : p.motif[i % p.motif.length], x, y, 12);
    c.caption(String(i + 1), x, y + 14, 10, "numeric", INK.muted, "center");
  });
  c.text(edition ? "设计自己的花纹，至少重复两遍。" : "用手指圈出一小段会重复的花纹。", 18, 207, 14);
  if (edition) {
    c.line(24, 236, 186, 236, "#C2A46E", 0.7);
    for (let i = 0; i < 8; i += 1) c.circle(28 + i * 22, 236, 8, INK.white, INK.blue, 0.4);
  } else {
    c.text("画出你发现的那一小段：", 18, 225, 14);
    c.rect(98, 221, 92, 23, INK.white, INK.line, 0.4);
  }
  companion(c, edition ? "说一说：你设计的哪一小段会重复？" : "不从头数，也能知道后面是什么图案吗？", day);
}

function top(c: Canvas, x: number, y: number, style: number) {
  c.path("M 0 8 L 12 0 L 19 5 L 26 0 L 38 8 L 32 20 L 27 17 L 27 38 L 11 38 L 11 17 L 6 20 Z", x, y, 38, 38, ["#F8D57E", "#BCDDE7", "#F4B4B9", "#CCE0AC"][style], INK.dark, 0.6);
  if (style === 3) for (const dy of [16, 22, 28]) c.line(x + 12, y + dy, x + 26, y + dy, INK.dark, 0.5);
  else symbol(c, style, x + 19, y + 22, 8);
}
function bottom(c: Canvas, x: number, y: number, style: number) {
  c.path("M 3 0 L 29 0 L 32 33 L 19 33 L 16 17 L 13 33 L 0 33 Z", x, y, 32, 33, ["#F8D57E", "#BCDDE7", "#F4B4B9", "#CCE0AC"][style], INK.dark, 0.6);
  c.line(x + 4, y + 5, x + 28, y + 5, INK.dark, 0.35);
  if (style === 3) for (const dy of [12, 18, 24]) c.line(x + 3, y + dy, x + 11, y + dy, INK.dark, 0.5);
  else symbol(c, style, x + 9, y + 15, 6);
}
function outfits(c: Canvas, p: Extract<LogicProblem, { kind: "outfits" }>, edition: number, day: number) {
  instruction(c, edition ? `上衣 ${String.fromCharCode(65 + p.forbidden[0])} 不能配下装 ${p.forbidden[1] + 1}。连出其他搭配。` : "一件上衣配一件下装。连线找全搭配，每种只连一次。");
  c.line(20, 82, 190, 82, "#A28361", 1.2);
  p.tops.forEach((style, i) => {
    const x = (p.tops.length === 2 ? 62 + i * 87 : 39 + i * 66) - 19;
    c.line(x + 19, 82, x + 19, 91, "#A28361", 0.7);
    top(c, x, 91, style);
    c.text(String.fromCharCode(65 + i), x + 19, 132, 18, "numericBold", INK.dark, "center");
    c.circle(x + 19, 148, 2, INK.white, INK.blue, 0.5);
  });
  p.bottoms.forEach((style, i) => {
    const x = (p.bottoms.length === 2 ? 62 + i * 87 : 39 + i * 66) - 16;
    c.circle(x + 16, 183, 2, INK.white, INK.blue, 0.5);
    bottom(c, x, 190, style);
    c.text(String(i + 1), x + 16, 225, 18, "numericBold", INK.dark, "center");
  });
  c.text("一共找到", 18, 240, 14);
  c.blank(53, 238, 17, 11);
  c.text("种搭配。", 74, 240, 14);
  companion(c, edition ? "哪条线不能连？其他线为什么还能连？" : "先盯住一件上衣，能帮你不漏掉搭配吗？", day, 251);
}

const friends = ["苹果", "小鱼", "鲜花", "星星"];
const friendAssets = ["apple", "fish", "flower", "star"] as const;
function order(c: Canvas, p: Extract<LogicProblem, { kind: "order" }>, edition: number, day: number) {
  instruction(c, edition ? "有两个伙伴站反了。圈出他们，画箭头交换位置。" : "按提示排队。把伙伴的名字写进队伍，也可以画图。");
  p.before.forEach(([a, b], i) => {
    c.circle(23, 80 + i * 16, 3, INK.gold);
    c.text(`${friends[a]}紧挨在${friends[b]}前面。`, 31, 75 + i * 16, 14);
  });
  if (!edition) {
    friends.forEach((name, i) => {
      c.image(friendAssets[i], 26 + i * 46, 130, 21, 23);
      c.text(name, 36.5 + i * 46, 156, 14, "chinese", INK.dark, "center");
    });
  } else c.text("每条提示都要成立，换好后再检查。", 19, 139, 14);
  c.line(20, 226, 190, 226, "#D0AD79", 1);
  c.text("队首", 20, 174, 14, "chineseBold");
  c.text("队尾", 174, 174, 14, "chineseBold");
  for (let i = 0; i < 4; i += 1) {
    const x = 21 + i * 46;
    c.rect(x, 189, 32, 32, INK.white, INK.blue, 0.5);
    if (edition) {
      c.image(friendAssets[p.lineup[i]], x + 5, 191, 22, 22);
      c.caption(friends[p.lineup[i]], x + 16, 214, 10, "chinese", INK.dark, "center");
    }
    if (i < 3) c.line(x + 34, 205, x + 44, 205, INK.line, 0.5);
  }
  companion(c, "从左边的队首开始，逐条读提示检查。", day, 247);
}

const shapeNames = ["圆形", "正方形", "三角形"];
function clues(c: Canvas, p: Extract<LogicProblem, { kind: "clues" }>, edition: number, day: number) {
  instruction(c, edition ? "听提示找玩具。在上面圈出它的编号。" : "一边看形状，一边看花纹。把编号填进它的家。");
  p.toys.forEach((toy, i) => {
    const x = 47 + i % 3 * 58, y = 91 + Math.floor(i / 3) * 46;
    symbol(c, toy.shape, x, y, 24, toy.striped);
    c.circle(x + 17, y + 12, 5, INK.white, INK.blue, 0.4);
    c.text(String(i + 1), x + 17, y + 6.5, 18, "numericBold", INK.dark, "center");
  });
  if (edition) {
    c.rect(19, 172, 172, 59, INK.soft, INK.line, 0.4);
    const excluded = [0, 1, 2].filter((shape) => shape !== p.targetShape);
    c.text(p.targetStriped ? "它身上有横线。" : "它身上没有横线。", 28, 178, 14);
    c.text(`它不是${shapeNames[excluded[0]]}。`, 28, 196, 14);
    c.text(`它也不是${shapeNames[excluded[1]]}。`, 28, 214, 14);
    companion(c, "盖住最后一条提示，可能是谁？用手指一指。", day, 247);
  } else {
    c.text("没有横线", 103, 174, 14, "chinese", INK.dark, "center");
    c.text("有横线", 158, 174, 14, "chinese", INK.dark, "center");
    for (let row = 0; row < 3; row += 1) {
      const y = 187 + row * 22;
      symbol(c, row, 43, y + 11, 12);
      for (let column = 0; column < 2; column += 1) c.rect(75 + column * 55, y, 55, 22, INK.white, INK.line, 0.4);
    }
    c.text("只看形状，能知道它住哪一格吗？", 18, 261, 14);
  }
}

function busBody(c: Canvas, x: number, y: number, count: number | null, label: string) {
  c.rect(x, y, 122, 43, "#F8D578", INK.dark, 0.7);
  c.rect(x + 6, y + 5, 77, 20, "#E9F7FB", INK.dark, 0.4);
  c.rect(x + 88, y + 5, 26, 33, "#E9F7FB", INK.dark, 0.4);
  c.line(x + 101, y + 5, x + 101, y + 38, INK.dark, 0.35);
  for (const wheelX of [22, 99]) {
    c.circle(x + wheelX, y + 43, 7, INK.dark);
    c.circle(x + wheelX, y + 43, 3, INK.white);
  }
  c.text(label, x + 9, y + 27, 14, "chineseBold");
  if (count === null) c.blank(x + 24, y + 7, 22, 14);
  else c.text(String(count), x + 35, y + 4, 24, "numericBold", INK.dark, "center");
  c.text("人", x + 51, y + 10, 14);
}
function bus(c: Canvas, p: Extract<LogicProblem, { kind: "bus" }>, edition: number, day: number) {
  instruction(c, edition ? "车在中间只停一次。到站时的人数已知，出发时呢？" : "出发以后，在车站有人下车、有人上车。到站有几人？");
  busBody(c, 24, 79, edition ? null : p.before, "出发");
  c.line(165, 95, 165, 210, INK.line, 1.2, true);
  c.path("M 0 0 L 4 7 L 8 0", 161, 202, 8, 7, undefined, INK.blue, 0.7);
  c.rect(29, 148, 99, 28, INK.soft, INK.line, 0.5);
  c.text(`下车 ${p.off} 人`, 35, 150, 16, "chineseBold");
  c.text(`上车 ${p.on} 人`, 35, 164, 16, "chineseBold");
  c.image(getMathPdfCharacter(day), 132, 147, 22, 28);
  busBody(c, 24, 191, edition ? p.before - p.off + p.on : null, "到站");
  c.text(edition ? "在图上画反向箭头，说说你怎样倒着想。" : "在车站旁画出先变少、再变多的箭头。", 19, 253, 14);
  c.text("只下车、还没上车时，车里有", 19, 267, 14);
  c.blank(131, 265, 18, 9);
  c.text("人。", 153, 267, 14);
}

function calendar(c: Canvas, p: Extract<LogicProblem, { kind: "calendar" }>, edition: number, day: number) {
  instruction(c, edition ? `${p.start + p.wait} 日去郊游，提前 ${p.wait} 天准备。圈出准备的日子。` : `${p.start} 日开始准备，过 ${p.wait} 天去郊游。圈出郊游的日子。`);
  c.wrap("明天算过 1 天；往回找时，昨天算前 1 天。", 18, 69, 174, 14, 2);
  c.rect(18, 86, 175, 27, "#F6C572", INK.dark, 0.6);
  c.text("这个月的日历", 105.5, 91, 20, "chineseBold", INK.dark, "center");
  ["一", "二", "三", "四", "五", "六", "日"].forEach((name, i) => c.text(name, 30.5 + i * 25, 116, 14, "chineseBold", INK.dark, "center"));
  for (let cell = 0; cell < 42; cell += 1) {
    const x = 18 + cell % 7 * 25, y = 130 + Math.floor(cell / 7) * 18;
    c.rect(x, y, 25, 18, INK.white, INK.line, 0.4);
    const date = cell - p.weekday + 1;
    if (date >= 1 && date <= p.length) c.text(String(date), x + 12.5, y + 1.5, 20, "numeric", INK.dark, "center");
  }
  c.text("再圈出准备的日子往后一周的同一列日期。", 18, 243, 14);
  companion(c, edition ? "从郊游那天倒着走，每次往前一天。" : "用线连出这几天，别在换行时漏掉一天。", day, 251);
}

function ribbonStrip(c: Canvas, x: number, y: number, length: number, fill: string, tag: string) {
  c.rect(x, y, length * 5, 13, fill, INK.dark, 0.5);
  for (let i = 1; i < length; i += 1) c.line(x + i * 5, y, x + i * 5, y + 13, INK.dark, 0.2);
  c.text(tag, x, y - 13, 14, "chineseBold");
}
function ribbon(c: Canvas, p: Extract<LogicProblem, { kind: "ribbon" }>, edition: number, day: number) {
  instruction(c, edition ? `两条彩带要拼成 ${p.first + p.second - p.overlap} 厘米。想想要盖住多少。` : "每小格是 1 厘米。先接头，再盖住一段，比一比。");
  if (edition) c.text("每小格代表 1 厘米，两条彩带的长度不能改。", 18, 69, 14);
  ribbonStrip(c, 28, 94, p.first, "#F3B5B9", `A：${p.first} 厘米`);
  ribbonStrip(c, 118, 126, p.second, "#B8DFE7", `B：${p.second} 厘米`);
  if (!edition) {
    c.text("刚好接头，一共", 20, 149, 14);
    c.blank(79, 148, 18, 11);
    c.text("厘米。", 101, 149, 14);
    c.text(`现在让 B 盖住 A 最后 ${p.overlap} 格。`, 20, 170, 14);
    ribbonStrip(c, 30, 198, p.first, "#F3B5B9", "");
    ribbonStrip(c, 30 + (p.first - p.overlap) * 5, 205, p.second, "#B8DFE7", "");
    c.text("拼好后，从左到右有", 20, 232, 14);
    c.blank(94, 230, 18, 11);
    c.text("厘米。", 116, 232, 14);
  } else {
    c.wrap("把 A、B 分别画在两排。上下对齐的格子，是盖住的地方。", 20, 149, 173, 14, 2);
    // 两排等长格子共用起点，孩子可以清楚地画出重叠位置。
    for (let row = 0; row < 2; row += 1)
      for (let i = 0; i < 28; i += 1) c.rect(27 + i * 5, 174 + row * 15, 5, 15, INK.white, INK.line, 0.3);
    c.text("A", 19, 176, 14, "numericBold");
    c.text("B", 19, 191, 14, "numericBold");
    c.text("要盖住", 20, 225, 14);
    c.blank(48, 224, 18, 11);
    c.text("格。用手指指出这段。", 70, 225, 14);
  }
  companion(c, "盖住的地方再多 1 格，拼好的会变长还是变短？", day, 249);
}

function carriage(c: Canvas, x: number, y: number, width: number, value: number | null) {
  c.rect(x, y, width, 22, INK.soft, INK.dark, 0.5);
  c.rect(x + 3, y + 3, width - 6, 14, INK.white, INK.blue, 0.4);
  c.circle(x + 5, y + 24, 3, INK.dark);
  c.circle(x + width - 5, y + 24, 3, INK.dark);
  if (value !== null) c.text(String(value), x + width / 2, y + 1.8, 22, "numericBold", INK.dark, "center");
}
function pockets(c: Canvas, p: Extract<LogicProblem, { kind: "pockets" }>, edition: number, day: number) {
  if (!edition) {
    instruction(c, "从车头到车尾，后一个数比前一个多 1。补上空车票。");
    c.text("从左往右，接着读下一排。", 20, 72, 14);
    for (let i = 0; i <= p.span; i += 1) {
      const x = 19 + i % 5 * 36, y = 107 + Math.floor(i / 5) * 62;
      carriage(c, x, y, 28, p.holes.includes(i) ? null : p.start + i);
      if (i % 5 !== 4 && i < p.span) c.line(x + 28, y + 14, x + 36, y + 14, INK.dark, 0.7);
    }
    c.text("把补回的三张车票从小到大写在这里。", 20, 218, 14);
    for (let i = 0; i < 3; i += 1) c.blank(42 + i * 48, 236, 28, 16);
    c.text("指一指：你是从前面找，还是从后面找？", 20, 263, 14);
  } else {
    instruction(c, "这次只要从小到大排，不必挨着。中间填两张不同的卡。");
    c.text("可选的数卡", 20, 75, 14, "chineseBold");
    for (let i = 1; i < p.span; i += 1) {
      const x = 20 + (i - 1) % 5 * 35, y = 94 + Math.floor((i - 1) / 5) * 24;
      c.rect(x, y, 27, 18, INK.white, INK.blue, 0.4);
      c.text(String(p.start + i), x + 13.5, y, 22, "numericBold", INK.dark, "center");
    }
    [169, 220].forEach((y, row) => {
      c.text(row ? "再换一种排法" : "第一种排法", 20, y - 15, 14);
      for (let i = 0; i < 4; i += 1) {
        const x = 20 + i * 46;
        carriage(c, x, y, 34, i === 0 ? p.start : i === 3 ? p.start + p.span : null);
        if (i < 3) c.line(x + 34, y + 14, x + 46, y + 14, INK.dark, 0.7);
      }
    });
    c.text("车头车尾相同，中间一定相同吗？", 20, 263, 14);
  }
}

/** 同样的材料第二次承担不同任务，避免把换数字当成内容扩充。 */
export function drawLogicScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem, edition = task.edition;
  if (p.kind === "beads") beads(c, p, edition, day);
  else if (p.kind === "outfits") outfits(c, p, edition, day);
  else if (p.kind === "order") order(c, p, edition, day);
  else if (p.kind === "clues") clues(c, p, edition, day);
  else if (p.kind === "bus") bus(c, p, edition, day);
  else if (p.kind === "calendar") calendar(c, p, edition, day);
  else if (p.kind === "ribbon") ribbon(c, p, edition, day);
  else if (p.kind === "pockets") pockets(c, p, edition, day);
  else return false;
  return true;
}
