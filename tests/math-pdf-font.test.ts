import fs from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { describe, expect, it } from "vitest";

import { getMathPdfCharacter, getWorksheetCompanionGreeting } from "../lib/tools/math-picture-assets";
import { generateDailyWorksheet, WORKSHEET_PLAN_DAYS } from "../lib/tools/math-worksheet";

const PDF_LABELS = [
  "第二个月",
  "基础",
  "强化",
  "日期",
  "今天学",
  "分成",
  "和",
  "看清两组数量，再写出算式",
  "拆",
  "先",
  "再",
  "个平均分成",
  "组，每组",
  "第",
  "天",
  "页",
  "本页",
  "题",
];

function collectText(value: unknown, texts: string[]) {
  if (typeof value === "string") texts.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectText(item, texts));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectText(item, texts));
}

describe("数学练习 PDF 字体", () => {
  it("子集包含 60 天练习纸会写到纸面上的汉字", () => {
    const font = fontkit.create(fs.readFileSync("public/fonts/noto-sans-sc-math-subset.ttf"));
    const texts = [...PDF_LABELS];
    for (let day = 1; day <= WORKSHEET_PLAN_DAYS; day += 1) {
      const worksheet = generateDailyWorksheet(day);
      texts.push(worksheet.title);
      texts.push(getWorksheetCompanionGreeting(getMathPdfCharacter(day), worksheet.title));
      texts.push(getWorksheetCompanionGreeting("mario", worksheet.title));
      collectText(worksheet.methodLesson, texts);
      collectText(worksheet.sections, texts);
    }

    const missing = new Set<string>();
    for (const text of texts) {
      for (const character of text.match(/[\u3400-\u9fff]/g) ?? []) {
        const codePoint = character.codePointAt(0);
        if (codePoint !== undefined && font.glyphForCodePoint(codePoint).id === 0) missing.add(character);
      }
    }
    expect([...missing].join("")).toBe("");
  }, 30000);
});
