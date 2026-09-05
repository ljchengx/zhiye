import { describe, expect, it } from "vitest";

import {
  addToneMark,
  createEmptyPinyinProgress,
  createPinyinWorksheet,
  DEFAULT_PINYIN_WORKSHEET_CONFIG,
  getPinyinPictureCandidates,
  getPinyinProgressCounts,
  getRecommendedPinyinItem,
  getToneForms,
  markPinyinCompleted,
  MAX_PINYIN_HISTORY,
  MAX_PINYIN_CORE_QUESTIONS,
  MAX_PINYIN_PICTURE_QUESTIONS,
  MAX_PINYIN_TRACE_ROWS,
  normalizePinyinConfig,
  parsePinyinProgress,
  PINYIN_FINALS,
  PINYIN_INITIALS,
  PINYIN_ITEMS,
  PINYIN_LEARNING_ORDER,
  PINYIN_PAGE_HEIGHT_MM,
  PINYIN_SYLLABLE_BANK,
  PINYIN_WHOLE_SYLLABLES,
  type PinyinProgressV1,
} from "../lib/tools/pinyin-worksheet";

describe("幼小拼音标准数据", () => {
  it("包含 23 个声母、24 个韵母和 16 个整体认读音节", () => {
    expect(PINYIN_INITIALS).toHaveLength(23);
    expect(PINYIN_FINALS).toHaveLength(24);
    expect(PINYIN_WHOLE_SYLLABLES).toHaveLength(16);
    expect(PINYIN_ITEMS).toHaveLength(63);
    expect(new Set(PINYIN_ITEMS.map((item) => item.id)).size).toBe(63);
    expect(PINYIN_LEARNING_ORDER).toHaveLength(63);
  });

  it("按规范给声母、韵母和复韵母标调，并处理 ü", () => {
    expect(addToneMark("a", 1)).toBe("ā");
    expect(addToneMark("ou", 3)).toBe("ǒu");
    expect(addToneMark("iu", 3)).toBe("iǔ");
    expect(addToneMark("ui", 3)).toBe("uǐ");
    expect(addToneMark("nü", 4)).toBe("nǜ");
    expect(addToneMark("jü", 2)).toBe("jú");
    expect(getToneForms("ü")).toEqual(["ü", "ǖ", "ǘ", "ǚ", "ǜ"]);
  });
});

describe("拼音练习纸生成", () => {
  it("对每个标准项目都能生成稳定、相关且可打印的练习纸", () => {
    PINYIN_ITEMS.forEach((item) => {
      const candidates = getPinyinPictureCandidates(item);
      expect(candidates.length).toBeGreaterThanOrEqual(3);
      expect(new Set(candidates.map((entry) => entry.asset)).size).toBeGreaterThanOrEqual(3);
      const config = { practiceLevel: "standard" as const, traceRows: 3, coreCount: 6, pictureCount: 3 };
      const first = createPinyinWorksheet(item.id, 20260905, config);
      const second = createPinyinWorksheet(item.id, 20260905, config);
      expect(first).toEqual(second);
      expect(first.pages.length).toBeGreaterThanOrEqual(1);
      expect(first.pages.length).toBeLessThanOrEqual(2);
      expect(first.pages.every((page) => page.usedHeightMm <= PINYIN_PAGE_HEIGHT_MM)).toBe(true);
      expect(first.pages.flatMap((page) => page.sections).some((section) => section.type === "trace")).toBe(true);
      expect(JSON.stringify(first)).not.toContain("undefined");

      const questions = first.pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
      questions.forEach((question) => {
        const answer = question.kind === "blend" ? question.markedAnswer : question.answer;
        expect(question.options.filter((option) => option === answer)).toHaveLength(1);
        expect(new Set(question.options).size).toBe(question.options.length);
        if (question.kind === "blend") {
          const syllable = PINYIN_SYLLABLE_BANK.find((entry) => entry.base === question.answer && entry.marked === question.markedAnswer);
          expect(syllable).toBeDefined();
          if (item.category === "initial") expect(syllable?.initial).toBe(item.display);
          if (item.category === "final") expect(syllable?.final).toBe(item.display);
        }
        if (question.kind === "recognition") expect(question.prompt).toContain(item.display);
        if (question.kind === "contrast") expect(question.targetDisplay).toBe(item.display);
        if (question.kind === "picture") {
          expect(question.targetDisplay).toBe(item.display);
          if (item.category === "initial") expect(question.focus.initial).toBe(item.display);
          if (item.category === "final") expect(question.focus.final).toBe(item.display);
          if (item.category === "whole-syllable") expect(question.focus.wholeSyllable).toBe(item.display);
        }
      });
    });
  });

  it("使用轻松默认值，并按简化后的题量边界生成", () => {
    expect(DEFAULT_PINYIN_WORKSHEET_CONFIG).toEqual({ practiceLevel: "light", traceRows: 2, coreCount: 2, pictureCount: 3 });
    const config = normalizePinyinConfig({ practiceLevel: "standard", traceRows: 99, coreCount: 99, pictureCount: 99 });
    expect(config).toMatchObject({
      practiceLevel: "standard",
      traceRows: MAX_PINYIN_TRACE_ROWS,
      coreCount: MAX_PINYIN_CORE_QUESTIONS,
      pictureCount: MAX_PINYIN_PICTURE_QUESTIONS,
    });
    expect(normalizePinyinConfig({ pictureCount: -99 }).pictureCount).toBe(3);
    const worksheet = createPinyinWorksheet("final-a", 17, config);
    expect(worksheet.config).toEqual(config);
    expect(worksheet.pages.length).toBeLessThanOrEqual(2);
    expect(worksheet.pages.flatMap((page) => page.sections).find((section) => section.type === "trace")?.traceRows).toBe(3);
    expect(worksheet.pages.flatMap((page) => page.sections).filter((section) => section.type === "blend").flatMap((section) => section.questions)).toHaveLength(6);
    expect(worksheet.pages.flatMap((page) => page.sections).filter((section) => section.type === "picture").flatMap((section) => section.questions)).toHaveLength(3);
  });

  it("整体认读只练当前项目，不生成错误的拆分题", () => {
    const worksheet = createPinyinWorksheet("whole-zhi", 22, { coreCount: 6, pictureCount: 0 });
    const questions = worksheet.pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
    expect(questions.filter((question) => question.kind === "recognition")).toHaveLength(4);
    expect(questions.some((question) => question.kind === "blend")).toBe(false);
    expect(questions.every((question) => question.kind !== "recognition" || question.prompt.includes("zhi"))).toBe(true);
  });

  it("看图题只使用与当前项目精确匹配的素材", () => {
    const finalA = PINYIN_ITEMS.find((item) => item.id === "final-a");
    const finalI = PINYIN_ITEMS.find((item) => item.id === "final-i");
    const finalUi = PINYIN_ITEMS.find((item) => item.id === "final-ui");
    const finalIn = PINYIN_ITEMS.find((item) => item.id === "final-in");
    const finalEng = PINYIN_ITEMS.find((item) => item.id === "final-eng");
    expect(finalA && getPinyinPictureCandidates(finalA).map((entry) => entry.label)).toEqual(expect.arrayContaining(["花", "鸭", "嫩芽", "西瓜"]));
    expect(finalI && getPinyinPictureCandidates(finalI).every((entry) => !["纸", "尺", "狮子", "橘子", "刺猬", "丝带"].includes(entry.label))).toBe(true);
    expect(finalUi && getPinyinPictureCandidates(finalUi).map((entry) => entry.label).sort()).toEqual(["乌龟", "吹风", "水滴"].sort());
    expect(finalIn && getPinyinPictureCandidates(finalIn).map((entry) => entry.label)).toEqual(expect.arrayContaining(["心", "音符", "饮料", "阴天"]));
    expect(finalEng && getPinyinPictureCandidates(finalEng).map((entry) => entry.label).sort()).toEqual(["医生", "生日", "风"].sort());

    const aPictures = createPinyinWorksheet("final-a", 7, { pictureCount: 3 }).pages.flatMap((page) => page.sections.flatMap((section) => section.questions)).filter((question) => question.kind === "picture");
    const uiPictures = createPinyinWorksheet("final-ui", 7, { pictureCount: 3 }).pages.flatMap((page) => page.sections.flatMap((section) => section.questions)).filter((question) => question.kind === "picture");
    const inPictures = createPinyinWorksheet("final-in", 7, { pictureCount: 3 }).pages.flatMap((page) => page.sections.flatMap((section) => section.questions)).filter((question) => question.kind === "picture");
    expect(aPictures).toHaveLength(3);
    expect(aPictures.some((question) => question.label === "伞" || question.label === "车")).toBe(false);
    expect(uiPictures.map((question) => question.label).sort()).toEqual(["乌龟", "吹风", "水滴"].sort());
    expect(inPictures).toHaveLength(3);
    expect(inPictures.every((question) => ["心", "音符", "饮料", "阴天"].includes(question.label))).toBe(true);
  });

  it("易混项占用核心题量，并正确处理 ui 标调与 ü 省点", () => {
    const uiQuestions = createPinyinWorksheet("final-ui", 9, { coreCount: 6, pictureCount: 0 }).pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
    expect(uiQuestions.some((question) => question.kind === "contrast" && question.rule === "final")).toBe(true);
    expect(uiQuestions.filter((question) => question.kind === "blend").every((question) => question.components.some((component) => /[īíǐì]/.test(component)))).toBe(true);

    const umlautQuestions = createPinyinWorksheet("final-ü", 11, { coreCount: 3, pictureCount: 0 }).pages.flatMap((page) => page.sections.flatMap((section) => section.questions));
    const contrast = umlautQuestions.find((question) => question.kind === "contrast");
    expect(contrast?.rule).toBe("umlaut");
    expect(contrast?.answer).not.toContain("ü");
  });
});

describe("拼音本地完成记录", () => {
  it("容错损坏数据，并对重复完成保持唯一项目计数", () => {
    expect(parsePinyinProgress("{bad json")).toEqual(createEmptyPinyinProgress());
    const first = markPinyinCompleted(createEmptyPinyinProgress(), "final-a", "2026-09-05T00:00:00.000Z");
    const second = markPinyinCompleted(first, "final-a", "2026-09-05T00:01:00.000Z");
    expect(getPinyinProgressCounts(second)).toMatchObject({ total: 63, completed: 1, finals: 1 });
    expect(second.history).toHaveLength(2);
  });

  it("按教学顺序推荐未完成项目，全部完成后推荐最久未复习项目", () => {
    let progress = createEmptyPinyinProgress();
    expect(getRecommendedPinyinItem(progress)?.display).toBe("a");
    progress = markPinyinCompleted(progress, "final-a", "2026-09-05T00:00:00.000Z");
    expect(getRecommendedPinyinItem(progress)?.display).toBe("o");

    const completeAll = PINYIN_LEARNING_ORDER.reduce<PinyinProgressV1>((current, item, index) => markPinyinCompleted(current, item.id, `2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`), createEmptyPinyinProgress());
    expect(getRecommendedPinyinItem(completeAll)?.display).toBe("a");
  });

  it("限制历史长度并过滤未知项目", () => {
    const entries = Array.from({ length: (MAX_PINYIN_HISTORY + 20) * 2 }, (_, index) => ({ itemId: index % 2 === 0 ? "final-a" : "unknown", completedAt: `2026-09-05T00:${String(index % 60).padStart(2, "0")}:00.000Z` }));
    const parsed = parsePinyinProgress(JSON.stringify({ version: 1, completedItemIds: ["final-a", "unknown"], history: entries }));
    expect(parsed.completedItemIds).toEqual(["final-a"]);
    expect(parsed.history).toHaveLength(MAX_PINYIN_HISTORY);
    expect(parsed.history.every((entry) => entry.itemId === "final-a")).toBe(true);
  });
});
