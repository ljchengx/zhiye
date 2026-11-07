import {
  WORKSHEET_FONT_FAMILIES,
  WORKSHEET_FONT_SOURCES,
} from "./font-manifest";

let loading: Promise<void> | undefined;

export function loadWorksheetPreviewFonts(): Promise<void> {
  if (!loading) {
    // CSS 字体一旦加载失败便不能直接重试，显式创建新的字体实例以恢复预览和打印。
    loading = Promise.all(
      Object.entries(WORKSHEET_FONT_SOURCES).map(async ([name, source]) => {
        const family =
          WORKSHEET_FONT_FAMILIES[name as keyof typeof WORKSHEET_FONT_FAMILIES];
        return new FontFace(
          family,
          `url("${source}") format("truetype")`,
        ).load();
      }),
    )
      .then(async (faces) => {
        faces.forEach((face) => document.fonts.add(face));
        await document.fonts.ready;
      })
      .catch(() => {
        loading = undefined;
        throw new Error("练习字体加载失败，请重试");
      });
  }
  return loading;
}
