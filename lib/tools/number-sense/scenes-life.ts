import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK, type WorksheetImageAsset } from "./drawing";
import { drawParkingScene } from "./scenes-parking";
import type { NumberSenseProblem, NumberSenseTask } from "./types";

const SCENE = {
  orange: "#ED8B32",
  peach: "#FFE5BE",
  blue: "#4FB6D2",
  paleBlue: "#E7F6FA",
  green: "#DCECC2",
  brown: "#98653D",
  pink: "#F9D9D8",
} as const;

function instruction(c: Canvas, number: number, text: string, y: number) {
  c.circle(18, y + 4, 3.8, SCENE.orange);
  c.text(String(number), 18, y - 0.3, 14, "numericBold", INK.white, "center");
  return c.wrap(text, 25, y, 171, 14, 2);
}

function choices(c: Canvas, x: number, y: number, labels: readonly string[]) {
  let cursor = x;
  for (const label of labels) {
    c.circle(cursor + 2.4, y + 4, 2.4, INK.white, INK.dark, 0.4);
    cursor += 7;
    cursor += c.text(label, cursor, y, 14) + 5;
  }
}

function pairSpaces(c: Canvas, x: number, y: number) {
  c.circle(x, y, 5.2, INK.white, INK.blue, 0.5);
  c.text("和", x + 12, y - 4, 14, "chinese", INK.dark, "center");
  c.circle(x + 24, y, 5.2, INK.white, INK.blue, 0.5);
}

function drawMarket(
  c: Canvas,
  p: Extract<NumberSenseProblem, { kind: "market" }>,
  day: number,
  edition: 0 | 1,
) {
  instruction(c, 1, `带 ${p.budget} 元购物。圈出单件${edition ? "买不起" : "买得起"}的商品。`, 52);

  // 商品、编号和价格共用同一序号，孩子直接在货架上圈选。
  const goods: readonly WorksheetImageAsset[] = ["ball", "book", "cookie", "apple", "flower", "pineapple"];
  c.rect(18, 76, 174, 132, SCENE.peach, SCENE.brown, 0.7);
  c.rect(22, 83, 166, 58, "#FFF6E4");
  c.rect(22, 146, 166, 58, "#FFF6E4");
  for (let index = 0; index < 12; index += 1) {
    const left = 18 + index * 14.5;
    c.rect(left, 72, 14.5, 8, index % 2 ? INK.white : SCENE.orange);
    c.ellipse(left, 76, 14.5, 8, index % 2 ? INK.white : SCENE.orange);
  }
  goods.forEach((asset, index) => {
    const x = 28 + (index % 3) * 56;
    const y = 88 + Math.floor(index / 3) * 63;
    c.image(asset, x + 4, y + 1, 35, 36);
    c.circle(x + 3, y + 6, 5.3, INK.white, INK.blue, 0.5);
    c.text(String(index + 1), x + 3, y + 0.4, 18, "numericBold", INK.blue, "center");
    c.rect(x + 2, y + 38, 42, 13, INK.white, SCENE.brown, 0.35);
    c.text(`${p.prices[index]} 元`, x + 23, y + 38.7, 20, "chinese", INK.dark, "center");
  });
  c.rect(18, 141, 174, 4, SCENE.brown);
  c.rect(18, 204, 174, 4, SCENE.brown);
  c.rect(20, 208, 5, 6, SCENE.brown);
  c.rect(185, 208, 5, 6, SCENE.brown);
  c.image(getMathPdfCharacter(day), 15, 215, 27, 37);
  if (edition) {
    c.wrap("只给一件减价，两组各剩几元？填在下面。", 48, 214, 145, 14, 2);
    c.text("第一组剩", 46, 234, 14);
    c.blank(100, 233, 17, 11);
    c.text("第二组剩", 46, 250, 14);
    c.blank(100, 249, 17, 11);
    c.text("两组省的一样多吗？圈：一样　不一样", 16, 264, 14);
  } else {
    c.wrap("选两件不同商品，刚好花完。写两组商品编号。", 48, 214, 145, 14, 2);
    c.text("一组", 46, 237, 14);
    pairSpaces(c, 77, 242);
    c.text("另一组", 118, 237, 14);
    pairSpaces(c, 155, 242);
    const remainingX = 16 + c.text(`每件便宜 ${p.discount} 元。买一组，剩`, 16, 257, 14) + 3;
    c.blank(remainingX, 257, 17, 11);
    c.text("元。", remainingX + 20, 259, 14);
  }
}

function cookiePlate(c: Canvas, count: number, x: number, y: number, color: string) {
  c.ellipse(x, y, 76, 77, color, SCENE.brown, 0.6);
  c.ellipse(x + 4, y + 4, 68, 69, "#FFF9E7", SCENE.brown, 0.3);
  const rows = Math.ceil(count / 5);
  const top = y + (77 - rows * 10.5) / 2;
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / 5);
    const inRow = Math.min(5, count - row * 5);
    const left = x + (76 - inRow * 11) / 2;
    c.image("cookie", left + (i % 5) * 11, top + row * 10.5, 9.5, 9.5);
  }
}

function drawSharing(
  c: Canvas,
  p: Extract<NumberSenseProblem, { kind: "sharing" }>,
  day: number,
  edition: 0 | 1,
) {
  instruction(c, 1, edition ? "不搬饼干。在右盘画圆点，添到和左盘一样多。" : "让两盘一样多。圈出要搬的饼干，画线送过去。", 52);
  c.rect(23, 80, 164, 43, "#FFF4D8");
  for (let x = 29; x < 183; x += 22) c.rect(x, 80, 9, 43, SCENE.pink);
  c.image(getMathPdfCharacter(day), 36, 78, 35, 45);
  c.image(getMathPdfCharacter(day + 1), 140, 78, 35, 45);
  c.path("M 12 0 L 168 0 L 180 94 L 0 94 Z", 15, 115, 180, 94, "#BEEAF2", INK.blue, 0.7);
  for (let x = 34; x <= 174; x += 28) c.line(x, 116, x - 6, 209, "#84C9D7", 0.4);
  for (const y of [138, 163, 188]) {
    const inset = 12 * (209 - y) / 94;
    c.line(15 + inset, y, 195 - inset, y, "#84C9D7", 0.4);
  }
  c.rect(15, 209, 180, 14, SCENE.blue, INK.blue, 0.5);
  c.rect(29, 223, 7, 9, SCENE.brown);
  c.rect(174, 223, 7, 9, SCENE.brown);
  cookiePlate(c, p.left, 23, 124, "#F4C974");
  cookiePlate(c, p.right, 111, 124, "#F5B3A9");
  c.text("左盘", 61, 211, 14, "chineseBold", INK.dark, "center");
  c.text("右盘", 149, 211, 14, "chineseBold", INK.dark, "center");
  instruction(c, 2, "饼干一共变了吗？", 235);
  choices(c, 111, 235, ["变多", "不变", "变少"]);
  if (edition) {
    instruction(c, 3, "回到原来两盘，不添，左盘拿走几块就一样多？", 257);
    c.blank(173, 257, 17, 11);
  } else {
    instruction(c, 3, `分好后，每盘再添 ${p.extra} 块，还一样多吗？`, 257);
    choices(c, 149, 257, ["是", "不是"]);
  }
}

function basket(c: Canvas, x: number, y: number, label: string) {
  c.path("M 0 0 L 45 0 L 40 28 L 5 28 Z", x, y, 45, 28, "#F7D48F", SCENE.brown, 0.6);
  c.line(x + 3, y + 20, x + 42, y + 20, SCENE.brown, 0.3);
  c.line(x + 4, y + 24, x + 41, y + 24, SCENE.brown, 0.3);
  c.text(label, x + 22.5, y + 1, 14, "chineseBold", INK.dark, "center");
  c.blank(x + 15, y + 11, 15, 11);
}

function drawGarden(c: Canvas, p: Extract<NumberSenseProblem, { kind: "garden" }>, day: number, edition: 0 | 1) {
  instruction(c, 1, edition ? "和最少的一种比，把多出的圈走，留下的填篮子。" : "圈一圈、数一数，把个数填在篮子上。", 52);
  c.rect(16, 75, 178, 128, "#EFF8EC");
  c.path("M 0 22 Q 48 0 91 18 Q 143 2 178 15 L 178 75 L 0 75 Z", 16, 145, 178, 75, "#D1E7AB");
  c.path("M 68 0 Q 77 32 59 65 L 91 65 Q 99 30 86 0 Z", 16, 155, 100, 65, "#FAE6B7");
  c.path("M 12 0 L 23 0 L 24 66 L 31 72 L 0 72 L 10 65 Z", 39, 121, 31, 72, SCENE.brown);
  c.ellipse(21, 82, 68, 74, "#B5D98C", "#6C9D56", 0.5);
  c.ellipse(28, 84, 52, 65, "#C4E29D");
  const applePositions = [[39, 92], [54, 91], [68, 98], [26, 108], [42, 108], [58, 112], [74, 116], [33, 126], [49, 131], [64, 130]];
  applePositions.slice(0, p.counts[0]).forEach(([x, y]) => c.image("apple", x, y, 11, 12));
  c.image(getMathPdfCharacter(day), 99, 83, 26, 34);
  for (let i = 0; i < p.counts[1]; i += 1)
    c.image("flower", 87 + (i % 3) * 16, 129 + Math.floor(i / 3) * 18, 14, 17);
  for (let i = 0; i < p.counts[2]; i += 1)
    c.image("pineapple", 141 + (i % 3) * 16, 128 + Math.floor(i / 3) * 18, 14, 18);
  basket(c, 24, 207, "苹果");
  basket(c, 83, 207, "鲜花");
  basket(c, 142, 207, "菠萝");
  instruction(c, 2, edition ? "留下的都一样多了吗？指给伙伴看。" : "谁最多？圈名字：苹果　鲜花　菠萝", 242);
  instruction(c, 3, edition ? "一共圈走了" : "最多的比最少的多", 260);
  const differenceX = 25 + c.width(edition ? "一共圈走了" : "最多的比最少的多", "chinese", 14) + 3;
  c.blank(differenceX, 259, 15, 11);
  const totalX = differenceX + 18 + c.text(edition ? "个。还剩" : "个。一共", differenceX + 18, 260, 14) + 3;
  c.blank(totalX, 259, 15, 11);
  c.text("个。", totalX + 18, 260, 14);
}

/** 生活主题共用原有物件素材，让圈、搬、填都发生在具体场景中。 */
export function drawLifeScene(c: Canvas, task: NumberSenseTask, day: number): boolean {
  const p = task.problem;
  if (p.kind === "market") drawMarket(c, p, day, task.edition);
  else if (p.kind === "sharing") drawSharing(c, p, day, task.edition);
  else if (p.kind === "parking") drawParkingScene(c, p, day, task.edition);
  else if (p.kind === "garden") drawGarden(c, p, day, task.edition);
  else return false;
  return true;
}
