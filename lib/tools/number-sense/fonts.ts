import fontkit, { type Font } from "@pdf-lib/fontkit";
import { WORKSHEET_FONT_SOURCES } from "./font-manifest";
export { WORKSHEET_FONT_SOURCES } from "./font-manifest";
export type WorksheetFont = keyof typeof WORKSHEET_FONT_SOURCES;
export interface WorksheetFonts {
  bytes: Record<WorksheetFont, Uint8Array>;
  width(text: string, font: WorksheetFont, sizePt: number): number;
  ascent(font: WorksheetFont, sizePt: number): number;
  height(font: WorksheetFont, sizePt: number): number;
}
export const MM_PER_POINT = 25.4 / 72;

export function createWorksheetFonts(
  bytes: Record<WorksheetFont, Uint8Array>,
): WorksheetFonts {
  const fonts = Object.fromEntries(
    Object.entries(bytes).map(([name, data]) => [name, fontkit.create(data)]),
  ) as Record<WorksheetFont, Font>;
  const cache = new Map<string, number>();
  return {
    bytes,
    width(text, name, sizePt) {
      const key = `${name}:${sizePt}:${text}`;
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
      const font = fonts[name];
      for (const character of text) {
        if (font.glyphForCodePoint(character.codePointAt(0)!).id === 0)
          throw new Error(`练习字体缺少字符：${character}`);
      }
      const width =
        (font.layout(text).positions.reduce((sum, p) => sum + p.xAdvance, 0) /
          font.unitsPerEm) *
        sizePt *
        MM_PER_POINT;
      cache.set(key, width);
      return width;
    },
    ascent(name, sizePt) {
      const font = fonts[name];
      return (font.ascent / font.unitsPerEm) * sizePt * MM_PER_POINT;
    },
    height(name, sizePt) {
      const font = fonts[name];
      return (
        ((font.ascent - font.descent) / font.unitsPerEm) * sizePt * MM_PER_POINT
      );
    },
  };
}

let loading: Promise<WorksheetFonts> | undefined;
export function loadWorksheetFonts(baseUrl: string): Promise<WorksheetFonts> {
  if (!loading) {
    loading = Promise.all(
      Object.entries(WORKSHEET_FONT_SOURCES).map(async ([name, path]) => {
        const response = await fetch(new URL(path, baseUrl));
        if (!response.ok) throw new Error("练习字体加载失败，请重试");
        return [name, new Uint8Array(await response.arrayBuffer())] as const;
      }),
    )
      .then((entries) =>
        createWorksheetFonts(
          Object.fromEntries(entries) as Record<WorksheetFont, Uint8Array>,
        ),
      )
      .catch(() => {
        loading = undefined;
        throw new Error("练习字体加载失败，请重试");
      });
  }
  return loading;
}
