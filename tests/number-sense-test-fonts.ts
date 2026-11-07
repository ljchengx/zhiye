import fs from "node:fs";
import {
  createWorksheetFonts,
  WORKSHEET_FONT_SOURCES,
  type WorksheetFont,
} from "../lib/tools/number-sense/fonts";

export function testWorksheetFonts() {
  return createWorksheetFonts(
    Object.fromEntries(
      Object.entries(WORKSHEET_FONT_SOURCES).map(([name, path]) => [
        name,
        new Uint8Array(fs.readFileSync(`public${path.split("?")[0]}`)),
      ]),
    ) as Record<WorksheetFont, Uint8Array>,
  );
}
