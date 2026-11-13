import { Canvas, INK } from "../number-sense/drawing";
import type { WordScene } from "./types";

interface ScenePalette { fill: string; accent: string; line: string }

/** 32 毫米情景图只介绍环境，物品数量不对应题目得数。 */
export function drawWordScene(c: Canvas, scene: WordScene, x: number, y: number, palette: ScenePalette) {
  const from = c.nodes.length;
  c.roundRect(x, y, 32, 32, 4, palette.fill, palette.line, 0.4);
  switch (scene) {
    case "garden":
      c.ellipse(x + 3, y + 24, 26, 5, "#DDECCF");
      for (const left of [6, 18]) {
        c.path("M 0 0 H 8 L 6.5 6 H 1.5 Z", x + left, y + 21, 8, 6, "#D59B71");
        c.line(x + left + 4, y + 13, x + left + 4, y + 22, "#75A469", 0.7);
        c.image("flower", x + left, y + 8, 8, 10);
      }
      break;
    case "aquarium":
      c.roundRect(x + 3, y + 7, 26, 21, 3, "#DFF2FA", "#71AFC7", 0.6);
      c.line(x + 4, y + 11, x + 28, y + 11, "#96C9DB", 0.4);
      c.image("fish", x + 6, y + 14, 10, 8);
      c.image("fish", x + 18, y + 18, 8, 6);
      c.circle(x + 22, y + 14, 1, INK.white, "#96C9DB", 0.3);
      c.circle(x + 25, y + 10, 0.7, INK.white, "#96C9DB", 0.3);
      break;
    case "balloons":
      for (const [left, top] of [[4, 6], [13, 3], [22, 8]]) {
        c.line(x + left + 3, y + top + 11, x + 16, y + 27, palette.line, 0.4);
        c.image("balloon", x + left, y + top, 7, 11);
      }
      c.circle(x + 16, y + 27, 1, palette.accent);
      break;
    case "library":
      c.roundRect(x + 4, y + 4, 24, 25, 1, "#FFF9EC", "#B99772", 0.5);
      for (const top of [6, 17]) {
        c.image("book", x + 7, y + top, 8, 9);
        c.image("book", x + 18, y + top, 7, 9);
        c.line(x + 5, y + top + 9.5, x + 27, y + top + 9.5, "#B99772", 0.8);
      }
      break;
    case "bus":
      c.line(x + 2, y + 28, x + 30, y + 28, palette.line, 0.6);
      c.roundRect(x + 3, y + 9, 26, 16, 3, "#F7CD73", "#BB8C37", 0.5);
      for (const left of [6, 13, 20]) {
        c.roundRect(x + left, y + 12, 5, 6, 1, "#E8F5FB", undefined, 0);
        c.circle(x + left + 2.5, y + 15, 1.2, "#DCA47D");
      }
      c.circle(x + 9, y + 25, 2.7, "#617078");
      c.circle(x + 23, y + 25, 2.7, "#617078");
      c.circle(x + 9, y + 25, 1.1, INK.white);
      c.circle(x + 23, y + 25, 1.1, INK.white);
      break;
    case "calendar":
      c.roundRect(x + 5, y + 5, 22, 24, 2, INK.white, palette.line, 0.5);
      c.rect(x + 5, y + 7, 22, 6, "#ED9996");
      c.line(x + 10, y + 3, x + 10, y + 8, palette.accent, 0.8);
      c.line(x + 22, y + 3, x + 22, y + 8, palette.accent, 0.8);
      for (const top of [16, 22]) for (const left of [9, 15, 21])
        c.roundRect(x + left, y + top, 3, 3, 0.6, left === 15 && top === 22 ? "#ED9996" : "#D6E4E7");
      break;
    case "toyshop":
      c.rect(x + 5, y + 11, 22, 17, INK.white, "#C99D76", 0.5);
      c.path("M 3 0 H 23 L 26 7 H 0 Z", x + 3, y + 5, 26, 7, "#F5C877", "#C99D76", 0.4);
      c.image("ball", x + 7, y + 16, 9, 9);
      c.image("coin", x + 20, y + 19, 5, 5);
      c.line(x + 6, y + 26, x + 26, y + 26, "#C99D76", 0.6);
      break;
    case "picnic":
      c.roundRect(x + 3, y + 8, 26, 21, 2, "#FAE5DD");
      for (const left of [8, 17, 26]) c.line(x + left, y + 8, x + left, y + 29, "#EDC4B4", 0.4);
      for (const top of [14, 22]) c.line(x + 3, y + top, x + 29, y + top, "#EDC4B4", 0.4);
      c.ellipse(x + 6, y + 12, 20, 13, INK.white, "#D4C9B5", 0.5);
      c.image("cookie", x + 9, y + 15, 6, 6);
      c.image("cookie", x + 18, y + 17, 5, 5);
      break;
    case "blocks":
      c.line(x + 3, y + 29, x + 29, y + 29, palette.line, 0.5);
      c.image("block", x + 4, y + 15, 10, 10);
      c.image("block", x + 16, y + 15, 10, 10);
      c.image("block", x + 10, y + 4, 10, 10);
      c.circle(x + 9, y + 26, 2, "#697E86");
      c.circle(x + 22, y + 26, 2, "#697E86");
      break;
    case "sports":
      c.roundRect(x + 3, y + 6, 26, 23, 2, "#E1EFD5", "#90B37B", 0.4);
      c.line(x + 16, y + 7, x + 16, y + 28, INK.white, 0.6);
      c.circle(x + 16, y + 17, 5, undefined, INK.white, 0.6);
      c.image("ball", x + 6, y + 9, 8, 8);
      c.image("ball", x + 19, y + 20, 7, 7);
      break;
    case "stickers":
      c.roundRect(x + 6, y + 4, 21, 25, 2, INK.white, palette.line, 0.5);
      for (const [left, top] of [[9, 8], [19, 8], [9, 19], [19, 19]])
        c.image("star", x + left, y + top, 5, 6);
      break;
    case "forest":
      c.ellipse(x + 3, y + 25, 26, 4, "#DDECCF");
      c.rect(x + 10, y + 14, 3, 13, "#B68962");
      c.circle(x + 12, y + 11, 7, "#A8CB8E");
      c.circle(x + 8, y + 15, 4.5, "#A8CB8E");
      c.image("mushroom", x + 19, y + 20, 9, 8);
      break;
    case "pond":
      c.ellipse(x + 3, y + 13, 26, 15, "#CDECF5", "#80BDCF", 0.4);
      for (const left of [25, 28]) {
        c.line(x + left, y + 9, x + left - 1, y + 21, "#7FA06A", 0.6);
        c.roundRect(x + left - 0.7, y + 6, 1.4, 5, 0.7, "#B18E65");
      }
      for (const [left, top] of [[6, 16], [16, 22]]) {
        c.ellipse(x + left, y + top, 8, 5, "#F8D46C", "#D3A745", 0.3);
        c.circle(x + left + 6, y + top - 1, 2.2, "#F8D46C");
        c.path("M 0 0 L 3 1.2 L 0 2.4 Z", x + left + 7.8, y + top - 1.5, 3, 2.4, "#E8A25A");
        c.circle(x + left + 6.6, y + top - 1.4, 0.35, INK.dark);
      }
      break;
    case "florist":
      for (const left of [10, 22]) c.line(x + left, y + 12, x + 16, y + 26, "#7BA574", 0.7);
      c.image("flower", x + 6, y + 4, 8, 10);
      c.image("flower", x + 18, y + 6, 8, 10);
      c.path("M 0 0 H 18 L 12 14 H 6 Z", x + 7, y + 14, 18, 14, "#F2D9BF", "#C7A283", 0.4);
      c.line(x + 12, y + 23, x + 20, y + 23, "#DC8D9F", 1);
      c.path("M 0 0 L 4 2 L 0 4 Z M 8 0 L 4 2 L 8 4 Z", x + 12, y + 21, 8, 4, "#EBA5B4");
      break;
    case "lanterns":
      c.path("M 0 0 Q 13 5 26 0", x + 3, y + 4, 26, 2.5, undefined, "#B89362", 0.5);
      for (const [left, top] of [[4, 9], [13, 12], [22, 9]]) {
        c.line(x + left + 3, y + 6, x + left + 3, y + top, "#C19B61", 0.4);
        c.ellipse(x + left, y + top, 6, 9, "#ED9692", "#CB6C68", 0.4);
        c.ellipse(x + left + 1.7, y + top, 2.6, 9, undefined, "#F7CC8C", 0.35);
        c.rect(x + left + 1, y + top - 0.5, 4, 1.2, "#E8B95E");
        c.rect(x + left + 1, y + top + 8.5, 4, 1.2, "#E8B95E");
        c.line(x + left + 3, y + top + 10, x + left + 3, y + top + 14, "#D28A70", 0.7);
      }
      break;
    case "bakery":
      c.roundRect(x + 3, y + 13, 26, 15, 3, "#E7EDEF", "#A0B2B9", 0.5);
      for (const left of [6, 18]) {
        c.ellipse(x + left, y + 10, 8, 14, "#EAC18A", "#B98E60", 0.5);
        for (const top of [13, 17, 21]) c.line(x + left + 2, y + top, x + left + 5, y + top - 1.5, "#FFF0CB", 0.8);
        c.path("M 1 0 Q 0 1.5 1 3 T 1 6", x + left + 3, y + 3, 1.5, 6, undefined, "#C5B9AA", 0.4);
      }
      break;
    case "farm":
      c.rect(x + 10, y + 13, 17, 15, "#E6A09A", "#B77870", 0.4);
      c.path("M 0 10 L 11.5 0 L 23 10 Z", x + 7, y + 4, 23, 10, "#C57B70");
      c.rect(x + 17, y + 19, 7, 9, "#F7E4CB", "#B77870", 0.4);
      c.line(x + 17, y + 19, x + 24, y + 28, "#B77870", 0.4);
      c.line(x + 24, y + 19, x + 17, y + 28, "#B77870", 0.4);
      for (const left of [3, 7, 11]) c.line(x + left, y + 22, x + left, y + 29, "#C6AA83", 0.9);
      c.line(x + 2, y + 25, x + 12, y + 25, "#C6AA83", 0.8);
      c.circle(x + 6, y + 17, 2.8, "#F6D875");
      c.circle(x + 7, y + 15, 1.8, "#F6D875");
      c.path("M 0 0 L 2 0.8 L 0 1.6 Z", x + 8.5, y + 14.7, 2, 1.6, "#DB9D58");
      c.circle(x + 7.4, y + 14.7, 0.3, INK.dark);
      break;
    case "crafts":
      c.ellipse(x + 5, y + 6, 22, 21, undefined, "#C1B2CB", 0.7);
      for (let bead = 0; bead < 8; bead += 1) {
        const angle = bead * Math.PI / 4;
        const bx = x + 16 + Math.cos(angle) * 11, by = y + 16.5 + Math.sin(angle) * 10.5;
        c.circle(bx, by, 2.6, ["#E9A8A9", "#A8CDD1", "#EED08A", "#C9B8DD"][bead % 4], "#A99DB4", 0.3);
        c.circle(bx, by, 0.6, INK.white);
      }
      break;
    case "market":
      c.path("M 0 10 C 0 0 20 0 20 10", x + 6, y + 3, 20, 10, undefined, "#B79568", 0.9);
      c.path("M 0 0 L 6 0 L 3 12 Z", x + 7, y + 10, 6, 12, "#EDAF72", "#CB8F54", 0.3);
      c.line(x + 10, y + 10, x + 7, y + 6, "#86AC76", 0.8);
      c.line(x + 10, y + 10, x + 12, y + 5, "#86AC76", 0.8);
      c.circle(x + 21, y + 14, 4.5, "#E69789", "#C67E70", 0.3);
      c.path("M 0 0 L 2 2 L 4 0 L 3 3 L 5 4 H 0 L 1 2 Z", x + 18.5, y + 8, 5, 4, "#8CAC75");
      c.path("M 0 0 H 26 L 22 13 H 4 Z", x + 3, y + 16, 26, 13, "#EAD3AB", "#B79568", 0.5);
      for (const left of [9, 16, 23]) c.line(x + left, y + 19, x + left, y + 26, "#C5AA80", 0.5);
      break;
    case "camping":
      c.ellipse(x + 2, y + 26, 28, 4, "#DDE9D2");
      c.circle(x + 25, y + 7, 3.3, "#EED593");
      c.circle(x + 26.4, y + 5.8, 2.8, palette.fill);
      c.image("star", x + 6, y + 4, 3, 3);
      c.path("M 0 19 L 12 0 L 25 19 Z", x + 3, y + 9, 25, 19, "#E8BA88", "#B78D63", 0.5);
      c.path("M 0 15 L 7 0 L 13 15 Z", x + 9, y + 13, 13, 15, "#9BADC3", "#778C9E", 0.4);
      c.line(x + 16, y + 13, x + 16, y + 28, "#DBE6EC", 0.4);
      break;
    case "artroom":
      c.line(x + 12, y + 5, x + 7, y + 29, "#B7926B", 0.8);
      c.line(x + 17, y + 5, x + 23, y + 29, "#B7926B", 0.8);
      c.rect(x + 5, y + 7, 18, 16, INK.white, "#B7926B", 0.6);
      c.circle(x + 11, y + 12, 2.3, "#F3D48A");
      c.path("M 0 6 L 5 0 L 10 6 Z", x + 7, y + 15, 10, 6, "#A8C89D");
      c.line(x + 5, y + 24, x + 23, y + 24, "#B7926B", 1);
      for (const [left, top] of [[26, 11], [29, 13]]) {
        c.line(x + left, y + top, x + left - 1, y + 25, "#9FAFBD", 0.6);
        c.ellipse(x + left - 0.8, y + top - 3, 1.6, 4, "#DA9F95");
      }
      c.roundRect(x + 24, y + 21, 6, 8, 1, "#B6D6D6", "#87AFB2", 0.4);
      break;
    case "postoffice":
      c.roundRect(x + 5, y + 6, 18, 21, 3, "#9DC9DE", "#669BB5", 0.5);
      c.rect(x + 8, y + 11, 12, 2, "#5C8096");
      c.line(x + 8, y + 27, x + 8, y + 30, "#7C8D99", 1);
      c.line(x + 20, y + 27, x + 20, y + 30, "#7C8D99", 1);
      c.roundRect(x + 12, y + 17, 17, 11, 1, "#FFF8E8", "#C5AC87", 0.4);
      c.path("M 0 0 L 8.5 6 L 17 0 M 0 11 L 5 6 M 17 11 L 12 6", x + 12, y + 17, 17, 11, undefined, "#C5AC87", 0.4);
      break;
    case "playground":
      c.ellipse(x + 2, y + 26, 28, 4, "#E0ECD8");
      c.line(x + 8, y + 6, x + 3, y + 28, "#9AAFC4", 1);
      c.line(x + 24, y + 6, x + 29, y + 28, "#9AAFC4", 1);
      c.line(x + 6, y + 6, x + 26, y + 6, "#91A8BF", 1.2);
      for (const left of [12, 20]) c.line(x + left, y + 7, x + left, y + 23, "#BD9B70", 0.6);
      c.roundRect(x + 10, y + 23, 12, 2.5, 1, "#E2AF7F", "#B68962", 0.4);
      break;
    case "kitchen":
      c.ellipse(x + 3, y + 9, 26, 19, INK.white, "#9FC3D0", 0.6);
      c.ellipse(x + 6, y + 12, 20, 13, undefined, "#C9DFE6", 0.4);
      for (const [left, top] of [[7, 14], [16, 14], [12, 20]]) {
        c.path("M 0 4 Q 4 -4 8 4 Z", x + left, y + top, 8, 4, "#F4E6C8", "#C4B189", 0.4);
        for (const crease of [2, 4, 6]) c.line(x + left + crease, y + top + 2, x + left + crease, y + top + 3.4, "#D7C5A1", 0.3);
      }
      c.line(x + 17, y + 3, x + 28, y + 10, "#AC8966", 0.6);
      c.line(x + 15, y + 4, x + 26, y + 11, "#AC8966", 0.6);
      break;
    case "orchard":
      c.ellipse(x + 2, y + 26, 28, 4, "#E1ECCE");
      c.rect(x + 11, y + 15, 4, 13, "#BD966D");
      c.circle(x + 13, y + 12, 9, "#B0CF8E");
      c.circle(x + 7, y + 16, 4.5, "#B0CF8E");
      c.circle(x + 20, y + 16, 5, "#B0CF8E");
      c.image("apple", x + 7, y + 8, 5, 5);
      c.image("apple", x + 16, y + 13, 5, 5);
      c.path("M 0 0 H 10 L 8.5 7 H 1.5 Z", x + 20, y + 22, 10, 7, "#DFC19A", "#B79A75", 0.4);
      c.line(x + 22, y + 25, x + 28, y + 25, "#B79A75", 0.4);
      break;
    case "theater":
      c.rect(x + 4, y + 5, 24, 20, "#FBEED8", "#BE8F79", 0.5);
      c.path("M 0 0 H 7 Q 7 10 2 17 H 0 Z", x + 4, y + 6, 7, 17, "#DA8F93");
      c.path("M 0 0 H 7 V 17 H 5 Q 0 10 0 0 Z", x + 21, y + 6, 7, 17, "#DA8F93");
      c.rect(x + 3, y + 4, 26, 3, "#C77983");
      c.rect(x + 3, y + 23, 26, 2, "#C69E76");
      c.image("star", x + 13, y + 10, 6, 7);
      for (const left of [5, 13, 21]) c.roundRect(x + left, y + 27, 6, 3, 1, "#B89DB7");
      break;
    case "cinema":
      c.roundRect(x + 4, y + 11, 24, 17, 2, "#71828F", "#536571", 0.5);
      c.rect(x + 4, y + 7, 24, 5, "#F8FAF7", "#536571", 0.4);
      for (const left of [5, 13, 21])
        c.path("M 3 0 H 7 L 4 5 H 0 Z", x + left, y + 7, 7, 5, "#71828F");
      c.path("M 0 0 L 8 5 L 0 10 Z", x + 13, y + 15, 8, 10, "#F6DEAA");
      c.circle(x + 6, y + 9.5, 0.8, "#E4B966");
      break;
    case "beach":
      c.path("M 0 1 Q 6 4 13 1 T 26 1 V 19 H 0 Z", x + 3, y + 10, 26, 19, "#F5E2AF");
      c.path("M 0 1 Q 6 4 13 1 T 26 1", x + 3, y + 10, 26, 2.5, undefined, "#9ACEDB", 1.1);
      c.circle(x + 25, y + 6, 3, "#F4D18B");
      c.path("M 7 10 C -4 5 1 0 4 2 C 4 -1 10 -1 10 2 C 14 0 18 5 7 10 Z", x + 6, y + 16, 15, 10, "#EDBAAB", "#C59687", 0.4);
      for (const left of [8, 12, 16]) c.line(x + 13, y + 25, x + left, y + 19, "#D49E8E", 0.4);
      c.path("M 0 0 H 7 L 6 6 H 1 Z", x + 23, y + 21, 7, 6, "#A8C9D6", "#7DAABF", 0.3);
      c.path("M 0 3 C 0 -1 5 -1 5 3", x + 24, y + 18, 5, 3, undefined, "#7DAABF", 0.4);
      break;
    case "reading":
      c.roundRect(x + 3, y + 12, 20, 14, 3, "#D0BDD9", "#AA95B8", 0.5);
      c.roundRect(x + 5, y + 20, 16, 6, 2, "#E3D6E9", "#AA95B8", 0.4);
      c.line(x + 6, y + 26, x + 6, y + 29, "#A58B72", 0.8);
      c.line(x + 20, y + 26, x + 20, y + 29, "#A58B72", 0.8);
      c.line(x + 27, y + 11, x + 27, y + 28, "#B49D78", 0.7);
      c.path("M 2 0 H 6 L 8 7 H 0 Z", x + 23, y + 4, 8, 7, "#F2DFA9", "#C6B58B", 0.3);
      c.line(x + 24, y + 28, x + 30, y + 28, "#B49D78", 0.8);
      c.image("book", x + 9, y + 11, 9, 10);
      break;
    case "ferriswheel":
      c.line(x + 16, y + 14, x + 9, y + 30, "#A8B8C8", 0.9);
      c.line(x + 16, y + 14, x + 23, y + 30, "#A8B8C8", 0.9);
      c.line(x + 7, y + 30, x + 25, y + 30, "#A8B8C8", 0.9);
      c.circle(x + 16, y + 14, 10, undefined, "#8FAFBD", 0.6);
      for (let cabin = 0; cabin < 6; cabin += 1) {
        const angle = cabin * Math.PI / 3 - Math.PI / 2;
        const bx = x + 16 + Math.cos(angle) * 10, by = y + 14 + Math.sin(angle) * 10;
        c.line(x + 16, y + 14, bx, by, "#A9C3CA", 0.4);
        c.roundRect(bx - 2.5, by - 1, 5, 4, 1, ["#E8ADA9", "#EBCB87", "#B1CFB0"][cabin % 3], "#95A7B0", 0.3);
      }
      c.circle(x + 16, y + 14, 1.6, "#F2D99B", "#A1B6C2", 0.4);
      break;
    case "stationeries":
      for (const [left, top, color] of [[9, 4, "#E6A5A3"], [19, 7, "#A9C8D9"]] as const) {
        c.rect(x + left, y + top, 3, 17, color, "#B3987C", 0.3);
        c.rect(x + left, y + top, 3, 2, "#D7C9D9");
        c.path("M 0 0 H 3 L 1.5 4 Z", x + left, y + top + 17, 3, 4, "#D9BC92");
      }
      c.roundRect(x + 3, y + 19, 26, 10, 3, "#EBCF95", "#C0A16A", 0.5);
      c.line(x + 6, y + 22, x + 26, y + 22, "#BD9C63", 0.5);
      c.circle(x + 24, y + 23, 1, "#D3AC66", "#A98B58", 0.3);
      break;
    case "music":
      c.line(x + 9, y + 14, x + 5, y + 28, "#C69B6E", 2.4);
      c.ellipse(x + 5, y + 5, 10, 13, "#E7AAA8", "#C48D8D", 0.5);
      c.line(x + 6, y + 12, x + 14, y + 12, "#F8DEAD", 1.1);
      c.line(x + 22, y + 17, x + 27, y + 29, "#C69B6E", 2.4);
      c.ellipse(x + 16, y + 9, 10, 13, "#A6CDD4", "#7CAAB5", 0.5);
      c.line(x + 17, y + 16, x + 25, y + 16, "#F8DEAD", 1.1);
      c.ellipse(x + 24, y + 5, 2.5, 1.8, "#9F91B4");
      c.line(x + 26.5, y + 5.8, x + 26.5, y + 2, "#9F91B4", 0.5);
      c.line(x + 26.5, y + 2, x + 29, y + 3, "#9F91B4", 0.7);
      break;
    case "planetarium":
      c.circle(x + 16, y + 17, 8, "#B6BADD", "#919BBD", 0.5);
      c.ellipse(x + 3, y + 13, 26, 8, undefined, "#D7B57B", 1);
      c.path("M 0 2 Q 5 0 10 2 M 1 6 Q 5 8 9 6", x + 11, y + 12, 10, 7, undefined, "#D1D4EC", 0.7);
      c.image("star", x + 4, y + 3, 4, 5);
      c.image("star", x + 25, y + 24, 3, 4);
      break;
    case "sportsday":
      c.rect(x + 3, y + 23, 8, 6, "#B5CEDA");
      c.rect(x + 11, y + 19, 10, 10, "#F0D99C");
      c.rect(x + 21, y + 25, 8, 4, "#E3BCA4");
      c.path("M 0 0 H 4 L 7 11 L 3 10 Z", x + 9, y + 3, 7, 11, "#DFA0A4");
      c.path("M 3 0 H 7 L 4 10 L 0 11 Z", x + 16, y + 3, 7, 11, "#9EBFD5");
      c.circle(x + 16, y + 14, 5.2, "#ECCD84", "#C3A269", 0.5);
      c.image("star", x + 13.5, y + 11.5, 5, 5);
      break;
    case "supermarket":
      c.path("M 0 0 H 4 L 8 20 H 24", x + 3, y + 6, 24, 20, undefined, "#93A8B9", 0.8);
      c.path("M 0 0 H 21 L 18 11 H 3 Z", x + 7, y + 11, 21, 11, "#DFEAEF", "#93A8B9", 0.6);
      c.path("M 1 0 H 5 V 3 L 6 5 V 12 H 0 V 5 L 1 3 Z", x + 12, y + 5, 6, 12, "#FFF9EA", "#B7C9D3", 0.4);
      c.rect(x + 13, y + 4, 4, 2, "#B8CFE0");
      c.rect(x + 12.5, y + 11, 5, 3, "#BAD7E0");
      c.roundRect(x + 21, y + 8, 4, 9, 0.8, "#E8CBA2", "#C2A884", 0.3);
      c.circle(x + 12, y + 28, 1.8, "#889CA9");
      c.circle(x + 25, y + 28, 1.8, "#889CA9");
      break;
    case "recycling":
      for (const [left, color] of [[4, "#A4C9DB"], [18, "#AECBAA"]] as const) {
        c.roundRect(x + left, y + 13, 10, 16, 1.5, color, "#8AA4A6", 0.4);
        c.roundRect(x + left - 1, y + 11, 12, 3, 0.8, color, "#8AA4A6", 0.4);
        c.path("M 1 0 H 3 V 2 L 4 4 V 8 H 0 V 4 L 1 2 Z", x + left + 3, y + 17, 4, 8, "#F5F9F2");
      }
      c.path("M 1 0 H 4 V 2 L 5 4 V 9 H 0 V 4 L 1 2 Z", x + 9, y + 1, 5, 9, "#D6E7E4", "#97B6B1", 0.4);
      c.line(x + 20, y + 3, x + 20, y + 8, "#9EB9A4", 0.5);
      c.line(x + 18, y + 6, x + 20, y + 8, "#9EB9A4", 0.5);
      c.line(x + 22, y + 6, x + 20, y + 8, "#9EB9A4", 0.5);
      break;
    case "zoo":
      for (const left of [4, 25]) c.roundRect(x + left, y + 12, 3, 17, 1, "#CFB28B");
      c.path("M 0 8 Q 13 -8 26 8 V 11 Q 13 -2 0 11 Z", x + 3, y + 4, 26, 11, "#B4CEA0", "#8FAC7A", 0.5);
      c.circle(x + 12, y + 15, 3, "#687983");
      c.circle(x + 22, y + 15, 3, "#687983");
      c.ellipse(x + 9, y + 14, 16, 14, "#FFFDF5", "#B3BEBD", 0.4);
      c.ellipse(x + 12, y + 18, 3, 4, "#687983");
      c.ellipse(x + 19, y + 18, 3, 4, "#687983");
      c.circle(x + 13.5, y + 19, 0.55, INK.white);
      c.circle(x + 20.5, y + 19, 0.55, INK.white);
      c.ellipse(x + 16, y + 23, 2, 1.4, "#687983");
      break;
    case "museum":
      c.path("M 0 8 L 13 0 L 26 8 Z", x + 3, y + 3, 26, 8, "#D6BD98", "#B29A78", 0.4);
      c.rect(x + 5, y + 11, 22, 2.5, "#EBDBC2", "#BBA688", 0.3);
      for (const left of [7, 14, 21]) {
        c.rect(x + left, y + 14, 4, 11, "#F6E9D5", "#C5B398", 0.4);
        c.line(x + left + 2, y + 15, x + left + 2, y + 24, "#DFCEB3", 0.4);
      }
      c.rect(x + 4, y + 25, 24, 2, "#D6BD98");
      c.rect(x + 2, y + 28, 28, 2, "#C7AD8B");
      break;
    case "train":
      c.line(x + 9, y + 24, x + 4, y + 30, "#AAB5BB", 0.7);
      c.line(x + 23, y + 24, x + 28, y + 30, "#AAB5BB", 0.7);
      c.line(x + 6, y + 28, x + 26, y + 28, "#AAB5BB", 0.6);
      c.roundRect(x + 6, y + 5, 20, 20, 4, "#9EC5D5", "#6C9BAC", 0.5);
      c.roundRect(x + 9, y + 8, 14, 8, 2, "#E9F4F7", "#78A6B7", 0.4);
      c.line(x + 16, y + 8, x + 16, y + 16, "#78A6B7", 0.5);
      c.roundRect(x + 6, y + 18, 20, 7, 2, "#DE9992", "#BC7B77", 0.4);
      for (const left of [10, 22]) c.circle(x + left, y + 20, 1.7, "#FFF1BA", "#C79E6B", 0.3);
      c.path("M 3 0 H 9 L 12 5 H 0 Z", x + 10, y + 23, 12, 5, "#8A9FAC");
      c.rect(x + 12, y + 3, 8, 2, "#E4BB7F");
      break;
    case "party":
      c.path("M 0 0 Q 13 6 26 0", x + 3, y + 3, 26, 3, undefined, "#BBA9C2", 0.4);
      for (const [left, top, color] of [[5, 4, "#E9AAAA"], [13, 5, "#B6CDA5"], [22, 4, "#ACCBD9"]] as const)
        c.path("M 0 0 H 5 L 2.5 5 Z", x + left, y + top, 5, 5, color);
      c.ellipse(x + 4, y + 26, 24, 4, "#E9E2DB");
      c.roundRect(x + 7, y + 18, 18, 9, 2, "#F4DDAF", "#CBAC83", 0.4);
      c.path("M 0 0 H 18 V 3 Q 16 6 14 3 Q 12 6 10 3 Q 7 6 5 3 Q 2 6 0 3 Z", x + 7, y + 17, 18, 4.5, "#EBAEB2");
      for (const left of [11, 16, 21]) {
        c.rect(x + left - 0.6, y + 13, 1.2, 4, "#B2CBD8");
        c.ellipse(x + left - 0.7, y + 10, 1.4, 2.5, "#ECC76F");
      }
      break;
    default: {
      const unsupported: never = scene;
      throw new Error(`没有对应的情景图：${unsupported}`);
    }
  }
  for (let index = from; index < c.nodes.length; index += 1) c.nodes[index].purpose = "diagram";
}
