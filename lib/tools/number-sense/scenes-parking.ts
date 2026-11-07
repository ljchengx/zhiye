import { getMathPdfCharacter } from "../math-picture-assets";
import { Canvas, INK } from "./drawing";
import type { NumberSenseProblem } from "./types";

function instruction(c: Canvas, number: number, text: string, y: number) {
  c.circle(18, y + 4, 3.8, "#ED8B32");
  c.text(String(number), 18, y - 0.3, 14, "numericBold", INK.white, "center");
  c.wrap(text, 25, y, 171, 14, 2);
}

function car(c: Canvas, x: number, y: number, color: string) {
  for (const dx of [0, 9]) for (const dy of [4, 14])
    c.rect(x + dx, y + dy, 2, 4, INK.dark);
  c.path("M 3 0 L 8 0 Q 10 0 10 3 L 10 19 Q 10 21 8 21 L 3 21 Q 1 21 1 19 L 1 3 Q 1 0 3 0 Z", x, y, 11, 21, color, INK.dark, 0.4);
  c.path("M 1 0 L 6 0 L 7 4 L 0 4 Z", x + 2, y + 4, 7, 4, "#EAF7FA", INK.dark, 0.25);
  c.rect(x + 3, y + 9.5, 5, 5, color, INK.dark, 0.25);
  c.rect(x + 3, y + 16, 5, 2.5, "#EAF7FA", INK.dark, 0.25);
  c.line(x + 2, y + 2, x + 4, y + 2, "#FFF4BF", 0.6);
  c.line(x + 7, y + 2, x + 9, y + 2, "#FFF4BF", 0.6);
}

/** 两排车位固定为十格；空位和小车来自同一组占用位置，作答直接发生在图内。 */
export function drawParkingScene(
  c: Canvas,
  p: Extract<NumberSenseProblem, { kind: "parking" }>,
  day: number,
  edition: 0 | 1,
) {
  instruction(c, 1, "每排都有 10 个车位。看看空位，还能停几辆？", 52);
  c.rect(16, 80, 178, 120, "#DCE8DB", "#77978A", 0.6);
  c.rect(31, 85, 158, 110, "#E8EEEC");
  c.rect(31, 125, 158, 35, "#9BAEB0");
  c.line(35, 142.5, 185, 142.5, INK.white, 0.65, true);
  c.path("M 4 0 L 0 3 L 4 6 M 0 3 L 17 3", 42, 133, 17, 6, undefined, INK.white, 0.9);
  c.path("M 0 3 L 17 3 M 13 0 L 17 3 L 13 6", 161, 149, 17, 6, undefined, INK.white, 0.9);
  c.rect(21, 70, 10, 12, INK.blue);
  c.text("P", 26, 70, 20, "numericBold", INK.white, "center");
  c.image(getMathPdfCharacter(day), 162, 65, 22, 23);

  p.occupied.forEach((occupied, row) => {
    const y = row === 0 ? 90 : 164;
    c.circle(23, y + 15, 5.3, INK.white, INK.blue, 0.4);
    c.text(row === 0 ? "A" : "B", 23, y + 10, 18, "numericBold", INK.blue, "center");
    for (let spot = 0; spot < 10; spot += 1) {
      const x = 34 + spot * 15.5;
      c.rect(x, y, 15.5, 30, "#FFF8E5", "#889A96", 0.4);
      if (occupied.includes(spot)) car(c, x + 2.25, y + 4.5, row === 0 ? "#79BFCD" : "#EBA396");
    }
  });

  for (const [index, label] of ["A", "B"].entries()) {
    const x = 31 + index * 88;
    const width = c.text(`${label} 排还能停`, x, 204, 14);
    c.blank(x + width + 3, 203, 16, 11);
    c.text("辆", x + width + 22, 204, 14);
  }
  const from = p.moveFrom === 0 ? "A" : "B", to = p.moveFrom === 0 ? "B" : "A";
  instruction(c, 2, edition ? `新来 ${p.move} 辆车，停进 ${to} 排。在空车位画圆。` : `从 ${from} 排挪 ${p.move} 辆到 ${to} 排。圈出要挪的车，在 ${to} 排空位画圆。`, 224);
  c.text(`${edition ? "停好" : "挪好"}后谁多？圈一圈：A 排　B 排　一样多`, 25, 244, 14);
  instruction(c, 3, edition ? "挪车时一共不变，来新车会怎样？" : "车一共变了吗？", 261);
  let x = 103;
  for (const label of ["变多", "不变", "变少"]) {
    c.circle(x, 265, 2.4, INK.white, INK.dark, 0.4);
    x += 5;
    x += c.text(label, x, 261, 14) + 8;
  }
}
