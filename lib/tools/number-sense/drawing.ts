import {
  MATH_PDF_CHARACTER_SOURCES,
  MATH_PDF_OBJECT_SOURCES,
  type MathPdfCharacterAsset,
  type MathPdfObjectAsset,
} from "../math-picture-assets";
import { MM_PER_POINT, type WorksheetFont, type WorksheetFonts } from "./fonts";
import type { Expression } from "./types";

export const INK = {
  dark: "#354243",
  blue: "#168FA6",
  gold: "#F4B544",
  soft: "#FFF6DC",
  line: "#99C9D5",
  muted: "#587475",
  white: "#FFFFFF",
  berry: "#ED6D72",
  leaf: "#67A46F",
  pink: "#FCE6E8",
  lavender: "#E9E3F6",
} as const;

export type WorksheetImageAsset = MathPdfCharacterAsset | MathPdfObjectAsset;

export function isWorksheetCharacterAsset(
  asset: WorksheetImageAsset,
): asset is MathPdfCharacterAsset {
  return Object.prototype.hasOwnProperty.call(MATH_PDF_CHARACTER_SOURCES, asset);
}

export function worksheetImageSource(asset: WorksheetImageAsset): string {
  return isWorksheetCharacterAsset(asset)
    ? MATH_PDF_CHARACTER_SOURCES[asset]
    : MATH_PDF_OBJECT_SOURCES[asset];
}

export type WorksheetNode =
  | {
      kind: "text";
      x: number;
      y: number;
      baseline: number;
      width: number;
      height: number;
      text: string;
      font: WorksheetFont;
      size: number;
      color: string;
      /** body 是孩子要读的正文（下限 14pt），caption 是图的说明/小格标记/短说明（下限 10pt）。 */
      role: "body" | "caption";
    }
  | {
      kind: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      weight: number;
      dashed?: boolean;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      weight: number;
    }
  | {
      kind: "ellipse";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      weight: number;
    }
  | {
      kind: "circle";
      x: number;
      y: number;
      radius: number;
      fill?: string;
      stroke?: string;
      weight: number;
    }
  | {
      kind: "path";
      /** 路径以局部毫米为单位，x/y 只负责定位，不再次缩放。 */
      d: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      weight: number;
    }
  | {
      kind: "image";
      x: number;
      y: number;
      width: number;
      height: number;
      asset: WorksheetImageAsset;
    };

export class Canvas {
  nodes: WorksheetNode[] = [];
  constructor(readonly fonts: WorksheetFonts) {}

  runs(text: string, font: WorksheetFont) {
    if (font === "numeric" || font === "numericBold") return [{ text, font }];
    return text.split(/([0-9]+)/).filter(Boolean).map((part) => ({
      text: part,
      font: (/^[0-9]+$/.test(part)
        ? font === "chineseBold" ? "numericBold" : "numeric"
        : font) as WorksheetFont,
    }));
  }

  width(text: string, font: WorksheetFont, size: number) {
    return this.runs(text, font).reduce(
      (total, run) => total + this.fonts.width(run.text, run.font, size),
      0,
    );
  }

  text(
    text: string,
    x: number,
    y: number,
    size = 14,
    font: WorksheetFont = "chinese",
    color: string = INK.dark,
    align: "left" | "center" | "right" = "left",
  ) {
    return this.emitText("body", text, x, y, size, font, color, align);
  }

  /** 图的说明、小格标记与短说明：与孩子要读的正文区分，可以 10～13pt。 */
  caption(
    text: string,
    x: number,
    y: number,
    size = 12,
    font: WorksheetFont = "chinese",
    color: string = INK.dark,
    align: "left" | "center" | "right" = "left",
  ) {
    return this.emitText("caption", text, x, y, size, font, color, align);
  }

  private emitText(
    role: "body" | "caption",
    text: string,
    x: number,
    y: number,
    size: number,
    font: WorksheetFont,
    color: string,
    align: "left" | "center" | "right",
  ) {
    const width = this.width(text, font, size);
    const baseline = y + this.fonts.ascent(font, size);
    let left = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
    // 字体度量只执行一次，SVG 与 PDF 共用每段文字的基线和字宽。
    for (const run of this.runs(text, font)) {
      const runWidth = this.fonts.width(run.text, run.font, size);
      this.nodes.push({
        kind: "text", x: left, role,
        y: baseline - this.fonts.ascent(run.font, size),
        baseline, width: runWidth,
        height: this.fonts.height(run.font, size),
        text: run.text, size, font: run.font, color,
      });
      left += runWidth;
    }
    return width;
  }

  wrap(
    text: string,
    x: number,
    y: number,
    width: number,
    size = 14,
    maxLines = 2,
    color: string = INK.dark,
  ) {
    const lines: string[] = [];
    const tokens: string[] = [];
    let line = "", opening = "";
    // 数字范围不拆行，句末标点跟随前字，超长题干必须回到模板调整。
    for (const token of text.match(/[0-9]+(?:～[0-9]+)?|[A-Za-z]+|./gu) ?? []) {
      if (/^[“（「《]$/.test(token)) {
        opening += token;
        continue;
      }
      if (/^[，。、；：？！…）”」》]$/.test(token) && tokens.length)
        tokens[tokens.length - 1] += token;
      else {
        tokens.push(opening + token);
        opening = "";
      }
    }
    if (opening) tokens.push(opening);
    for (const token of tokens) {
      if (line && this.width(line + token, "chinese", size) > width) {
        lines.push(line.trim());
        line = token.trimStart();
      } else line += token;
    }
    if (line) lines.push(line.trim());
    if (lines.length > maxLines || lines.some((part) => this.width(part, "chinese", size) > width))
      throw new Error(`题干超出预留版面：${text}`);
    const step = size * MM_PER_POINT * 1.36;
    lines.forEach((part, index) => this.text(part, x, y + index * step, size, "chinese", color));
    return lines.length * step;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string = INK.line, weight = 0.3, dashed = false) {
    this.nodes.push({ kind: "line", x1, y1, x2, y2, color, weight, dashed });
  }

  rect(x: number, y: number, width: number, height: number, fill?: string, stroke?: string, weight = 0.3) {
    this.nodes.push({ kind: "rect", x, y, width, height, fill, stroke, weight });
  }

  circle(x: number, y: number, radius: number, fill?: string, stroke?: string, weight = 0.3) {
    this.nodes.push({ kind: "circle", x, y, radius, fill, stroke, weight });
  }

  ellipse(x: number, y: number, width: number, height: number, fill?: string, stroke?: string, weight = 0.3) {
    this.nodes.push({ kind: "ellipse", x, y, width, height, fill, stroke, weight });
  }

  path(d: string, x: number, y: number, width: number, height: number, fill?: string, stroke?: string, weight = 0.3) {
    this.nodes.push({ kind: "path", d, x, y, width, height, fill, stroke, weight });
  }

  image(asset: WorksheetImageAsset, x: number, y: number, width: number, height: number) {
    this.nodes.push({ kind: "image", asset, x, y, width, height });
  }

  arrow(x1: number, y: number, x2: number) {
    this.line(x1, y, x2, y, INK.blue);
    this.line(x2 - 2, y - 1.2, x2, y, INK.blue);
    this.line(x2 - 2, y + 1.2, x2, y, INK.blue);
  }

  blank(x: number, y: number, width = 12, height = 9) {
    this.rect(x, y, width, height, INK.white, INK.blue, 0.4);
  }

  expression(expression: Expression, x: number, y: number) {
    let cursor = x;
    expression.terms.forEach((term, index) => {
      if (index)
        cursor += this.text(expression.operators[index - 1] === "-" ? "−" : "+", cursor + 2, y, 22, "numericBold") + 4;
      cursor += this.text(String(term), cursor, y, 22, "numericBold");
    });
  }
}
