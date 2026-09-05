export const PINYIN_INITIALS = [
  "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w",
] as const;

export const PINYIN_SIMPLE_FINALS = ["a", "o", "e", "i", "u", "ü"] as const;
export const PINYIN_COMPOUND_FINALS = ["ai", "ei", "ui", "ao", "ou", "iu", "ie", "üe", "er"] as const;
export const PINYIN_FRONT_NASAL_FINALS = ["an", "en", "in", "un", "ün"] as const;
export const PINYIN_BACK_NASAL_FINALS = ["ang", "eng", "ing", "ong"] as const;
export const PINYIN_FINALS = [
  ...PINYIN_SIMPLE_FINALS,
  ...PINYIN_COMPOUND_FINALS,
  ...PINYIN_FRONT_NASAL_FINALS,
  ...PINYIN_BACK_NASAL_FINALS,
] as const;
export const PINYIN_WHOLE_SYLLABLES = [
  "zhi", "chi", "shi", "ri", "zi", "ci", "si", "yi", "wu", "yu", "ye", "yue", "yuan", "yin", "yun", "ying",
] as const;

export type PinyinInitial = (typeof PINYIN_INITIALS)[number];
export type PinyinFinal = (typeof PINYIN_FINALS)[number];
export type PinyinWholeSyllable = (typeof PINYIN_WHOLE_SYLLABLES)[number];
export type PinyinCategory = "initial" | "final" | "whole-syllable";
export type PinyinGroup = "声母" | "单韵母" | "复韵母" | "前鼻韵母" | "后鼻韵母" | "整体认读";

export interface PinyinItem {
  id: string;
  display: string;
  category: PinyinCategory;
  group: PinyinGroup;
  order: number;
  label: string;
  toneCapable: boolean;
}

function createPinyinItems(): PinyinItem[] {
  const initials = PINYIN_INITIALS.map((display, order) => ({
    id: `initial-${display}`,
    display,
    category: "initial" as const,
    group: "声母" as const,
    order,
    label: `声母 ${display}`,
    toneCapable: false,
  }));
  const finals = PINYIN_FINALS.map((display, order) => {
    const group: PinyinGroup = PINYIN_SIMPLE_FINALS.includes(display as (typeof PINYIN_SIMPLE_FINALS)[number])
      ? "单韵母"
      : PINYIN_COMPOUND_FINALS.includes(display as (typeof PINYIN_COMPOUND_FINALS)[number])
        ? "复韵母"
        : PINYIN_FRONT_NASAL_FINALS.includes(display as (typeof PINYIN_FRONT_NASAL_FINALS)[number])
          ? "前鼻韵母"
          : "后鼻韵母";
    return {
      id: `final-${display}`,
      display,
      category: "final" as const,
      group,
      order,
      label: `${group} ${display}`,
      toneCapable: true,
    };
  });
  const wholeSyllables = PINYIN_WHOLE_SYLLABLES.map((display, order) => ({
    id: `whole-${display}`,
    display,
    category: "whole-syllable" as const,
    group: "整体认读" as const,
    order,
    label: `整体认读 ${display}`,
    toneCapable: true,
  }));
  return [...initials, ...finals, ...wholeSyllables];
}

export const PINYIN_ITEMS: readonly PinyinItem[] = createPinyinItems();
export const PINYIN_ITEM_IDS: readonly string[] = PINYIN_ITEMS.map((item) => item.id);

const LEARNING_ORDER_DISPLAY = [
  "a", "o", "e", "i", "u", "ü",
  "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w",
  "ai", "ei", "ui", "ao", "ou", "iu", "ie", "üe", "er", "an", "en", "in", "un", "ün", "ang", "eng", "ing", "ong",
  "zhi", "chi", "shi", "ri", "zi", "ci", "si", "yi", "wu", "yu", "ye", "yue", "yuan", "yin", "yun", "ying",
] as const;

function getItemByCategoryAndDisplay(category: PinyinCategory, display: string) {
  return PINYIN_ITEMS.find((item) => item.category === category && item.display === display);
}

export const PINYIN_LEARNING_ORDER: readonly PinyinItem[] = LEARNING_ORDER_DISPLAY
  .map((display) => PINYIN_ITEMS.find((item) => item.display === display))
  .filter((item): item is PinyinItem => Boolean(item));

export function getPinyinItem(id: string) {
  return PINYIN_ITEMS.find((item) => item.id === id);
}

export function getPinyinItemByDisplay(category: PinyinCategory, display: string) {
  return getItemByCategoryAndDisplay(category, display);
}

export type ToneNumber = 1 | 2 | 3 | 4;
export type PinyinToneMode = "base" | "all";

const TONE_MARKS: Record<string, readonly [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

function normalizeUmlaut(value: string) {
  return value.replaceAll("v", "ü");
}

export function addToneMark(value: string, tone: ToneNumber | 0): string {
  const normalized = normalizeUmlaut(value);
  if (tone === 0 || normalized.length === 0) return normalized;
  const chars = Array.from(normalized);
  const shouldHideUmlaut = /^[jqxy]/.test(normalized) && normalized.includes("ü");
  const printable = shouldHideUmlaut ? chars.map((char) => char === "ü" ? "u" : char) : chars;
  const vowelIndex = (() => {
    const aIndex = printable.indexOf("a");
    if (aIndex >= 0) return aIndex;
    const eIndex = printable.indexOf("e");
    if (eIndex >= 0) return eIndex;
    if (printable.join("").includes("ou")) return printable.indexOf("o");
    for (let index = printable.length - 1; index >= 0; index -= 1) {
      if ("iouü".includes(printable[index] ?? "")) return index;
    }
    return -1;
  })();
  if (vowelIndex < 0) return printable.join("");
  const vowel = printable[vowelIndex] ?? "";
  const marks = TONE_MARKS[vowel];
  if (!marks) return printable.join("");
  printable[vowelIndex] = marks[tone - 1] ?? vowel;
  return printable.join("");
}

export function getToneForms(value: string): readonly [string, string, string, string, string] {
  const base = normalizeUmlaut(value);
  return [base, addToneMark(base, 1), addToneMark(base, 2), addToneMark(base, 3), addToneMark(base, 4)];
}

export interface PinyinSyllable {
  id: string;
  base: string;
  marked: string;
  initial: string;
  medial?: string;
  final: string;
  tone: ToneNumber;
  split: "two" | "three";
}

function makeSyllable(id: string, initial: string, final: string, tone: ToneNumber, medial?: string): PinyinSyllable {
  const components = [initial, medial ?? "", final];
  const base = components.join("").replace("ü", /^[jqxy]/.test(initial) ? "u" : "ü");
  return {
    id,
    base,
    marked: addToneMark(base, tone),
    initial,
    medial,
    final,
    tone,
    split: medial ? "three" : "two",
  };
}

const SYLLABLE_DEFINITIONS: readonly (readonly [string, string, string, ToneNumber, string?])[] = [
  ["ba", "b", "a", 1], ["pa", "p", "a", 2], ["ma", "m", "a", 3], ["fa", "f", "a", 1], ["da", "d", "a", 2], ["na", "n", "a", 3], ["la", "l", "a", 4], ["ya", "y", "a", 1], ["wa", "w", "a", 1], ["zha", "zh", "a", 1], ["cha", "ch", "a", 2], ["sha", "sh", "a", 3], ["za", "z", "a", 4], ["ca", "c", "a", 1], ["sa", "s", "a", 2],
  ["bo", "b", "o", 1], ["po", "p", "o", 2], ["mo", "m", "o", 2], ["fo", "f", "o", 2], ["lo", "l", "o", 2],
  ["me", "m", "e", 2], ["de", "d", "e", 2], ["te", "t", "e", 4], ["ne", "n", "e", 2], ["le", "l", "e", 4], ["ge", "g", "e", 1], ["he", "h", "e", 1], ["zhe", "zh", "e", 1], ["she", "sh", "e", 1], ["re", "r", "e", 2], ["ze", "z", "e", 2], ["se", "s", "e", 4],
  ["bi", "b", "i", 3], ["pi", "p", "i", 2], ["mi", "m", "i", 3], ["di", "d", "i", 4], ["ti", "t", "i", 1], ["ni", "n", "i", 3], ["li", "l", "i", 4], ["ji", "j", "i", 1], ["qi", "q", "i", 1], ["xi", "x", "i", 1], ["zi", "z", "i", 1], ["ci", "c", "i", 4], ["si", "s", "i", 1], ["zhi", "zh", "i", 1], ["chi", "ch", "i", 1], ["shi", "sh", "i", 1], ["ri", "r", "i", 4],
  ["bu", "b", "u", 4], ["pu", "p", "u", 3], ["mu", "m", "u", 4], ["fu", "f", "u", 2], ["du", "d", "u", 1], ["tu", "t", "u", 2], ["nu", "n", "u", 3], ["lu", "l", "u", 4], ["gu", "g", "u", 1], ["ku", "k", "u", 1], ["hu", "h", "u", 1], ["zhu", "zh", "u", 1], ["chu", "ch", "u", 1], ["shu", "sh", "u", 1], ["ru", "r", "u", 2], ["zu", "z", "u", 2], ["cu", "c", "u", 1], ["su", "s", "u", 1],
  ["nü", "n", "ü", 3], ["lü", "l", "ü", 4], ["ju", "j", "ü", 2], ["qu", "q", "ü", 2], ["xu", "x", "ü", 1], ["yu", "y", "ü", 2],
  ["bai", "b", "ai", 1], ["mai", "m", "ai", 4], ["dai", "d", "ai", 4], ["gai", "g", "ai", 1], ["hai", "h", "ai", 3], ["zhai", "zh", "ai", 2], ["cai", "c", "ai", 2], ["sai", "s", "ai", 1],
  ["bei", "b", "ei", 4], ["pei", "p", "ei", 2], ["mei", "m", "ei", 2], ["fei", "f", "ei", 1], ["nei", "n", "ei", 3], ["lei", "l", "ei", 3], ["gei", "g", "ei", 3],
  ["dui", "d", "ui", 4], ["tui", "t", "ui", 1], ["gui", "g", "ui", 1], ["kui", "k", "ui", 2], ["hui", "h", "ui", 1], ["rui", "r", "ui", 3], ["zhui", "zh", "ui", 1], ["chui", "ch", "ui", 1], ["shui", "sh", "ui", 3], ["zui", "z", "ui", 4], ["cui", "c", "ui", 4], ["sui", "s", "ui", 1],
  ["bao", "b", "ao", 1], ["pao", "p", "ao", 4], ["mao", "m", "ao", 1], ["dao", "d", "ao", 4], ["tao", "t", "ao", 1], ["nao", "n", "ao", 3], ["lao", "l", "ao", 3], ["gao", "g", "ao", 1], ["hao", "h", "ao", 3], ["zhao", "zh", "ao", 1], ["chao", "ch", "ao", 1], ["shao", "sh", "ao", 1], ["zao", "z", "ao", 3], ["cao", "c", "ao", 1], ["sao", "s", "ao", 1],
  ["mou", "m", "ou", 2], ["dou", "d", "ou", 4], ["tou", "t", "ou", 1], ["nou", "n", "ou", 3], ["gou", "g", "ou", 3], ["kou", "k", "ou", 3], ["hou", "h", "ou", 2], ["zhou", "zh", "ou", 1], ["chou", "ch", "ou", 1], ["shou", "sh", "ou", 3], ["zou", "z", "ou", 3], ["cou", "c", "ou", 4], ["sou", "s", "ou", 1],
  ["miu", "m", "iu", 1], ["diu", "d", "iu", 1], ["niu", "n", "iu", 2], ["liu", "l", "iu", 2], ["jiu", "j", "iu", 3], ["qiu", "q", "iu", 2], ["xiu", "x", "iu", 1],
  ["bie", "b", "ie", 2], ["pie", "p", "ie", 1], ["mie", "m", "ie", 1], ["die", "d", "ie", 2], ["tie", "t", "ie", 1], ["nie", "n", "ie", 1], ["lie", "l", "ie", 4], ["jie", "j", "ie", 2], ["qie", "q", "ie", 4], ["xie", "x", "ie", 4],
  ["nüe", "n", "üe", 4], ["lüe", "l", "üe", 4], ["jue", "j", "üe", 2], ["que", "q", "üe", 1], ["xue", "x", "üe", 2], ["yue", "y", "üe", 4],
  ["ban", "b", "an", 1], ["pan", "p", "an", 2], ["man", "m", "an", 2], ["fan", "f", "an", 1], ["dan", "d", "an", 1], ["tan", "t", "an", 2], ["nan", "n", "an", 2], ["lan", "l", "an", 2], ["gan", "g", "an", 1], ["han", "h", "an", 2], ["zhan", "zh", "an", 1], ["chan", "ch", "an", 3], ["shan", "sh", "an", 1], ["ran", "r", "an", 2], ["zan", "z", "an", 1], ["can", "c", "an", 1], ["san", "s", "an", 1],
  ["ben", "b", "en", 3], ["pen", "p", "en", 2], ["men", "m", "en", 2], ["fen", "f", "en", 1], ["gen", "g", "en", 1], ["hen", "h", "en", 3], ["zhen", "zh", "en", 1], ["shen", "sh", "en", 1], ["ren", "r", "en", 2], ["sen", "s", "en", 1],
  ["bin", "b", "in", 1], ["pin", "p", "in", 1], ["min", "m", "in", 2], ["jin", "j", "in", 1], ["qin", "q", "in", 2], ["xin", "x", "in", 1], ["lin", "l", "in", 2],
  ["dun", "d", "un", 1], ["tun", "t", "un", 1], ["lun", "l", "un", 2], ["gun", "g", "un", 3], ["kun", "k", "un", 1], ["hun", "h", "un", 1], ["zhun", "zh", "un", 1], ["chun", "ch", "un", 1], ["shun", "sh", "un", 4], ["zun", "z", "un", 1], ["cun", "c", "un", 1], ["sun", "s", "un", 1],
  ["jun", "j", "ün", 1], ["qun", "q", "ün", 2], ["xun", "x", "ün", 2], ["yun", "y", "ün", 2],
  ["bang", "b", "ang", 1], ["mang", "m", "ang", 2], ["dang", "d", "ang", 1], ["tang", "t", "ang", 2], ["nang", "n", "ang", 2], ["lang", "l", "ang", 2], ["gang", "g", "ang", 1], ["hang", "h", "ang", 2], ["zhang", "zh", "ang", 1], ["chang", "ch", "ang", 2], ["shang", "sh", "ang", 4], ["rang", "r", "ang", 4], ["zang", "z", "ang", 1], ["cang", "c", "ang", 1], ["sang", "s", "ang", 1],
  ["beng", "b", "eng", 1], ["peng", "p", "eng", 2], ["meng", "m", "eng", 2], ["feng", "f", "eng", 1], ["deng", "d", "eng", 1], ["neng", "n", "eng", 2], ["leng", "l", "eng", 2], ["geng", "g", "eng", 1], ["heng", "h", "eng", 1], ["zheng", "zh", "eng", 1], ["cheng", "ch", "eng", 2], ["sheng", "sh", "eng", 1], ["reng", "r", "eng", 2], ["zeng", "z", "eng", 1], ["ceng", "c", "eng", 2], ["seng", "s", "eng", 1],
  ["bing", "b", "ing", 1], ["ping", "p", "ing", 2], ["ming", "m", "ing", 2], ["ding", "d", "ing", 1], ["ting", "t", "ing", 1], ["ning", "n", "ing", 2], ["ling", "l", "ing", 2], ["jing", "j", "ing", 1], ["qing", "q", "ing", 1], ["xing", "x", "ing", 1],
  ["dong", "d", "ong", 1], ["tong", "t", "ong", 2], ["nong", "n", "ong", 2], ["long", "l", "ong", 2], ["gong", "g", "ong", 1], ["kong", "k", "ong", 1], ["hong", "h", "ong", 2], ["zhong", "zh", "ong", 1], ["chong", "ch", "ong", 2], ["rong", "r", "ong", 2], ["zong", "z", "ong", 1], ["cong", "c", "ong", 1], ["song", "s", "ong", 1],
  ["wu", "w", "u", 1], ["wo", "w", "o", 3], ["wai", "w", "ai", 4], ["wei", "w", "ei", 4], ["you", "y", "ou", 3], ["yao", "y", "ao", 2], ["yan", "y", "an", 2],
  ["gua", "g", "a", 1, "u"], ["duo", "d", "o", 1, "u"], ["jiao", "j", "ao", 1, "i"], ["xue-three", "x", "e", 2, "ü"], ["yuan", "y", "an", 2, "ü"], ["lian", "l", "an", 2, "i"], ["tian", "t", "an", 1, "i"], ["xiang", "x", "ang", 4, "i"], ["shuang", "sh", "ang", 1, "u"],
];

export const PINYIN_SYLLABLE_BANK: readonly PinyinSyllable[] = SYLLABLE_DEFINITIONS.map(([id, initial, final, tone, medial]) => makeSyllable(id, initial, final, tone, medial));

export interface PinyinWholeEntry {
  base: PinyinWholeSyllable;
  marked: string;
  tone: ToneNumber;
}

export const PINYIN_WHOLE_BANK: readonly PinyinWholeEntry[] = PINYIN_WHOLE_SYLLABLES.flatMap((base) => ([1, 2, 3, 4] as const).map((tone) => ({
  base,
  tone,
  marked: addToneMark(base, tone),
})));

export type PinyinPictureAsset =
  | "apple"
  | "ball"
  | "balloon"
  | "birthday"
  | "bird"
  | "block"
  | "bowl"
  | "box"
  | "book"
  | "calendar"
  | "car"
  | "cat"
  | "chair"
  | "children"
  | "circle"
  | "clover"
  | "clothes"
  | "cloud"
  | "cloudyDay"
  | "coconut"
  | "coin"
  | "corn"
  | "cookie"
  | "cow"
  | "cup"
  | "darkCloud"
  | "dinosaur"
  | "doctor"
  | "dog"
  | "door"
  | "drink"
  | "driver"
  | "duck"
  | "ear"
  | "exercise"
  | "feather"
  | "fish"
  | "firefly"
  | "flower"
  | "fountain"
  | "goose"
  | "grapes"
  | "hand"
  | "heart"
  | "hedgehog"
  | "headphones"
  | "house"
  | "insect"
  | "juice"
  | "jump"
  | "leaf"
  | "lion"
  | "magnet"
  | "meal"
  | "moon"
  | "mooncake"
  | "mushroom"
  | "music"
  | "orange"
  | "paper"
  | "pants"
  | "park"
  | "parrot"
  | "persimmon"
  | "pineapple"
  | "rabbit"
  | "rainbowCloud"
  | "ribbon"
  | "roundTable"
  | "ruler"
  | "seeds"
  | "sheep"
  | "ship"
  | "shield"
  | "spider"
  | "sprout"
  | "star"
  | "stone"
  | "sun"
  | "sunrise"
  | "thunder"
  | "turtle"
  | "umbrella"
  | "water"
  | "watermelon"
  | "wings"
  | "wind";

export interface PinyinPictureFocus {
  base: string;
  marked: string;
  initial: string;
  medial?: string;
  // zhi、chi 等整体认读音节的 i 不作为普通单韵母 i 的图片匹配依据。
  final?: PinyinFinal;
  wholeSyllable?: PinyinWholeSyllable;
}

export interface PinyinPictureEntry {
  id: string;
  asset: PinyinPictureAsset;
  label: string;
  answer: string;
  options: readonly string[];
  focus: PinyinPictureFocus;
  additionalFocuses?: readonly PinyinPictureFocus[];
}

export const PINYIN_PICTURE_BANK: readonly PinyinPictureEntry[] = [
  { id: "apple", asset: "apple", label: "苹果", answer: "píng guǒ", options: ["píng guǒ", "bǐng guǒ", "pín guǒ"], focus: { base: "ping", marked: "píng", initial: "p", final: "ing" }, additionalFocuses: [{ base: "guo", marked: "guǒ", initial: "g", medial: "u", final: "o" }] },
  { id: "fish", asset: "fish", label: "鱼", answer: "yú", options: ["yú", "yǔ", "yī"], focus: { base: "yu", marked: "yú", initial: "y", final: "ü", wholeSyllable: "yu" } },
  { id: "flower", asset: "flower", label: "花", answer: "huā", options: ["huā", "huǒ", "hū"], focus: { base: "hua", marked: "huā", initial: "h", medial: "u", final: "a" } },
  { id: "duck", asset: "duck", label: "鸭", answer: "yā", options: ["yā", "yú", "wā"], focus: { base: "ya", marked: "yā", initial: "y", final: "a" } },
  { id: "ball", asset: "ball", label: "足球", answer: "zú qiú", options: ["zú qiú", "zú qiū", "zhú qiú"], focus: { base: "qiu", marked: "qiú", initial: "q", final: "iu" }, additionalFocuses: [{ base: "zu", marked: "zú", initial: "z", final: "u" }] },
  { id: "book", asset: "book", label: "书", answer: "shū", options: ["shū", "shǔ", "sū"], focus: { base: "shu", marked: "shū", initial: "sh", final: "u" } },
  { id: "balloon", asset: "balloon", label: "气球", answer: "qì qiú", options: ["qì qiú", "qí qiú", "qī qiú"], focus: { base: "qi", marked: "qì", initial: "q", final: "i" }, additionalFocuses: [{ base: "qiu", marked: "qiú", initial: "q", final: "iu" }] },
  { id: "pineapple", asset: "pineapple", label: "菠萝", answer: "bō luó", options: ["bō luó", "bō lǔ", "pō luó"], focus: { base: "bo", marked: "bō", initial: "b", final: "o" }, additionalFocuses: [{ base: "luo", marked: "luó", initial: "l", medial: "u", final: "o" }] },
  { id: "mushroom", asset: "mushroom", label: "蘑菇", answer: "mó gū", options: ["mó gū", "mǒ gū", "mó kū"], focus: { base: "mo", marked: "mó", initial: "m", final: "o" }, additionalFocuses: [{ base: "gu", marked: "gū", initial: "g", final: "u" }] },
  { id: "star", asset: "star", label: "星", answer: "xīng", options: ["xīng", "xǐng", "xiāng"], focus: { base: "xing", marked: "xīng", initial: "x", final: "ing" } },
  { id: "cookie", asset: "cookie", label: "饼干", answer: "bǐng gān", options: ["bǐng gān", "bìng gān", "pǐng gān"], focus: { base: "bing", marked: "bǐng", initial: "b", final: "ing" }, additionalFocuses: [{ base: "gan", marked: "gān", initial: "g", final: "an" }] },
  { id: "heart", asset: "heart", label: "爱心", answer: "ài xīn", options: ["ài xīn", "āi xīn", "ǎi xīn"], focus: { base: "ai", marked: "ài", initial: "", final: "ai" } },
  { id: "heart-xin", asset: "heart", label: "心", answer: "xīn", options: ["xīn", "xīng", "xiāng"], focus: { base: "xin", marked: "xīn", initial: "x", final: "in" } },
  { id: "coin", asset: "coin", label: "硬币", answer: "yìng bì", options: ["yìng bì", "yīn bì", "yǐng bì"], focus: { base: "ying", marked: "yìng", initial: "y", final: "ing", wholeSyllable: "ying" }, additionalFocuses: [{ base: "bi", marked: "bì", initial: "b", final: "i" }] },
  { id: "block", asset: "block", label: "积木", answer: "jī mù", options: ["jī mù", "jǐ mù", "qī mù"], focus: { base: "ji", marked: "jī", initial: "j", final: "i" }, additionalFocuses: [{ base: "mu", marked: "mù", initial: "m", final: "u" }] },
  { id: "cat", asset: "cat", label: "猫", answer: "māo", options: ["māo", "máo", "mǎo"], focus: { base: "mao", marked: "māo", initial: "m", final: "ao" } },
  { id: "dog", asset: "dog", label: "狗", answer: "gǒu", options: ["gǒu", "gōu", "gòu"], focus: { base: "gou", marked: "gǒu", initial: "g", final: "ou" } },
  { id: "rabbit", asset: "rabbit", label: "兔", answer: "tù", options: ["tù", "tǔ", "dù"], focus: { base: "tu", marked: "tù", initial: "t", final: "u" } },
  { id: "bird", asset: "bird", label: "鸟", answer: "niǎo", options: ["niǎo", "niào", "nǎo"], focus: { base: "niao", marked: "niǎo", initial: "n", medial: "i", final: "ao" } },
  { id: "sun", asset: "sun", label: "太阳", answer: "tài yáng", options: ["tài yáng", "tāi yáng", "tǎi yáng"], focus: { base: "tai", marked: "tài", initial: "t", final: "ai" }, additionalFocuses: [{ base: "yang", marked: "yáng", initial: "y", final: "ang" }] },
  { id: "moon", asset: "moon", label: "月亮", answer: "yuè liang", options: ["yuè liang", "yué liang", "yǔ liang"], focus: { base: "yue", marked: "yuè", initial: "y", final: "üe", wholeSyllable: "yue" }, additionalFocuses: [{ base: "liang", marked: "liang", initial: "l", medial: "i", final: "ang" }] },
  { id: "umbrella", asset: "umbrella", label: "伞", answer: "sǎn", options: ["sǎn", "shǎn", "sān"], focus: { base: "san", marked: "sǎn", initial: "s", final: "an" } },
  { id: "car", asset: "car", label: "车", answer: "chē", options: ["chē", "chě", "cē"], focus: { base: "che", marked: "chē", initial: "ch", final: "e" } },
  { id: "water", asset: "water", label: "水滴", answer: "shuǐ dī", options: ["shuǐ dī", "shuāi dī", "shǒu dī"], focus: { base: "shui", marked: "shuǐ", initial: "sh", final: "ui" }, additionalFocuses: [{ base: "di", marked: "dī", initial: "d", final: "i" }] },
  { id: "paper", asset: "paper", label: "纸", answer: "zhǐ", options: ["zhǐ", "zǐ", "chǐ"], focus: { base: "zhi", marked: "zhǐ", initial: "zh", wholeSyllable: "zhi" } },
  { id: "ruler", asset: "ruler", label: "尺", answer: "chǐ", options: ["chǐ", "cǐ", "zhǐ"], focus: { base: "chi", marked: "chǐ", initial: "ch", wholeSyllable: "chi" } },
  { id: "lion", asset: "lion", label: "狮子", answer: "shī zi", options: ["shī zi", "sī zi", "shí zi"], focus: { base: "shi", marked: "shī", initial: "sh", wholeSyllable: "shi" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "calendar", asset: "calendar", label: "日历", answer: "rì lì", options: ["rì lì", "lì lì", "rǐ lì"], focus: { base: "ri", marked: "rì", initial: "r", wholeSyllable: "ri" }, additionalFocuses: [{ base: "li", marked: "lì", initial: "l", final: "i" }] },
  { id: "orange", asset: "orange", label: "橘子", answer: "jú zi", options: ["jú zi", "jú zhi", "jú zǐ"], focus: { base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }, additionalFocuses: [{ base: "ju", marked: "jú", initial: "j", final: "ü" }] },
  { id: "hedgehog", asset: "hedgehog", label: "刺猬", answer: "cì wei", options: ["cì wei", "chì wei", "cí wei"], focus: { base: "ci", marked: "cì", initial: "c", wholeSyllable: "ci" }, additionalFocuses: [{ base: "wei", marked: "wei", initial: "w", final: "ei" }] },
  { id: "ribbon", asset: "ribbon", label: "丝带", answer: "sī dài", options: ["sī dài", "shī dài", "sǐ dài"], focus: { base: "si", marked: "sī", initial: "s", wholeSyllable: "si" }, additionalFocuses: [{ base: "dai", marked: "dài", initial: "d", final: "ai" }] },
  { id: "clothes", asset: "clothes", label: "衣服", answer: "yī fu", options: ["yī fu", "yí fu", "wū fu"], focus: { base: "yi", marked: "yī", initial: "y", final: "i", wholeSyllable: "yi" }, additionalFocuses: [{ base: "fu", marked: "fu", initial: "f", final: "u" }] },
  { id: "turtle", asset: "turtle", label: "乌龟", answer: "wū guī", options: ["wū guī", "wú guī", "yū guī"], focus: { base: "wu", marked: "wū", initial: "w", final: "u", wholeSyllable: "wu" }, additionalFocuses: [{ base: "gui", marked: "guī", initial: "g", final: "ui" }] },
  { id: "leaf", asset: "leaf", label: "叶子", answer: "yè zi", options: ["yè zi", "yuè zi", "yě zi"], focus: { base: "ye", marked: "yè", initial: "y", final: "ie", wholeSyllable: "ye" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "circle", asset: "circle", label: "圆圈", answer: "yuán quān", options: ["yuán quān", "yún quān", "yuǎn quān"], focus: { base: "yuan", marked: "yuán", initial: "y", medial: "ü", final: "an", wholeSyllable: "yuan" }, additionalFocuses: [{ base: "quan", marked: "quān", initial: "q", medial: "ü", final: "an" }] },
  { id: "music", asset: "music", label: "音符", answer: "yīn fú", options: ["yīn fú", "yīng fú", "yǐn fú"], focus: { base: "yin", marked: "yīn", initial: "y", final: "in", wholeSyllable: "yin" }, additionalFocuses: [{ base: "fu", marked: "fú", initial: "f", final: "u" }] },
  { id: "cloud", asset: "cloud", label: "云朵", answer: "yún duǒ", options: ["yún duǒ", "yín duǒ", "yǔn duǒ"], focus: { base: "yun", marked: "yún", initial: "y", final: "ün", wholeSyllable: "yun" }, additionalFocuses: [{ base: "duo", marked: "duǒ", initial: "d", medial: "u", final: "o" }] },
  { id: "wind", asset: "wind", label: "风", answer: "fēng", options: ["fēng", "fēn", "fěng"], focus: { base: "feng", marked: "fēng", initial: "f", final: "eng" } },
  { id: "shield", asset: "shield", label: "盾", answer: "dùn", options: ["dùn", "tùn", "dǔn"], focus: { base: "dun", marked: "dùn", initial: "d", final: "un" } },
  { id: "thunder", asset: "thunder", label: "雷", answer: "léi", options: ["léi", "lái", "lěi"], focus: { base: "lei", marked: "léi", initial: "l", final: "ei" } },
  { id: "dinosaur", asset: "dinosaur", label: "恐龙", answer: "kǒng lóng", options: ["kǒng lóng", "gǒng lóng", "kǒn lóng"], focus: { base: "kong", marked: "kǒng", initial: "k", final: "ong" }, additionalFocuses: [{ base: "long", marked: "lóng", initial: "l", final: "ong" }] },
  { id: "ear", asset: "ear", label: "耳", answer: "ěr", options: ["ěr", "ér", "è"], focus: { base: "er", marked: "ěr", initial: "", final: "er" } },
  { id: "door", asset: "door", label: "门", answer: "mén", options: ["mén", "méng", "měn"], focus: { base: "men", marked: "mén", initial: "m", final: "en" } },
  { id: "sheep", asset: "sheep", label: "羊", answer: "yáng", options: ["yáng", "yán", "yǎng"], focus: { base: "yang", marked: "yáng", initial: "y", final: "ang" } },
  { id: "spider", asset: "spider", label: "蜘蛛", answer: "zhī zhū", options: ["zhī zhū", "zī zhū", "zhǐ zhū"], focus: { base: "zhi", marked: "zhī", initial: "zh", wholeSyllable: "zhi" }, additionalFocuses: [{ base: "zhu", marked: "zhū", initial: "zh", final: "u" }] },
  { id: "juice", asset: "juice", label: "果汁", answer: "guǒ zhī", options: ["guǒ zhī", "guǒ zī", "guō zhī"], focus: { base: "zhi", marked: "zhī", initial: "zh", wholeSyllable: "zhi" }, additionalFocuses: [{ base: "guo", marked: "guǒ", initial: "g", medial: "u", final: "o" }] },
  { id: "meal", asset: "meal", label: "吃饭", answer: "chī fàn", options: ["chī fàn", "cī fàn", "chí fàn"], focus: { base: "chi", marked: "chī", initial: "ch", wholeSyllable: "chi" }, additionalFocuses: [{ base: "fan", marked: "fàn", initial: "f", final: "an" }] },
  { id: "wings", asset: "wings", label: "翅膀", answer: "chì bǎng", options: ["chì bǎng", "cì bǎng", "chǐ bǎng"], focus: { base: "chi", marked: "chì", initial: "ch", wholeSyllable: "chi" }, additionalFocuses: [{ base: "bang", marked: "bǎng", initial: "b", final: "ang" }] },
  { id: "stone", asset: "stone", label: "石头", answer: "shí tou", options: ["shí tou", "sí tou", "shǐ tou"], focus: { base: "shi", marked: "shí", initial: "sh", wholeSyllable: "shi" }, additionalFocuses: [{ base: "tou", marked: "tou", initial: "t", final: "ou" }] },
  { id: "persimmon", asset: "persimmon", label: "柿子", answer: "shì zi", options: ["shì zi", "sì zi", "shí zi"], focus: { base: "shi", marked: "shì", initial: "sh", wholeSyllable: "shi" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "sunrise", asset: "sunrise", label: "日出", answer: "rì chū", options: ["rì chū", "lì chū", "rǐ chū"], focus: { base: "ri", marked: "rì", initial: "r", wholeSyllable: "ri" }, additionalFocuses: [{ base: "chu", marked: "chū", initial: "ch", final: "u" }] },
  { id: "birthday", asset: "birthday", label: "生日", answer: "shēng rì", options: ["shēng rì", "shēng lì", "shēng rǐ"], focus: { base: "ri", marked: "rì", initial: "r", wholeSyllable: "ri" }, additionalFocuses: [{ base: "sheng", marked: "shēng", initial: "sh", final: "eng" }] },
  { id: "seeds", asset: "seeds", label: "种子", answer: "zhǒng zi", options: ["zhǒng zi", "zǒng zi", "zhòng zi"], focus: { base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }, additionalFocuses: [{ base: "zhong", marked: "zhǒng", initial: "zh", final: "ong" }] },
  { id: "bowl", asset: "bowl", label: "瓷碗", answer: "cí wǎn", options: ["cí wǎn", "chí wǎn", "cǐ wǎn"], focus: { base: "ci", marked: "cí", initial: "c", wholeSyllable: "ci" }, additionalFocuses: [{ base: "wan", marked: "wǎn", initial: "w", final: "an" }] },
  { id: "magnet", asset: "magnet", label: "磁铁", answer: "cí tiě", options: ["cí tiě", "chí tiě", "cǐ tiě"], focus: { base: "ci", marked: "cí", initial: "c", wholeSyllable: "ci" }, additionalFocuses: [{ base: "tie", marked: "tiě", initial: "t", final: "ie" }] },
  { id: "driver", asset: "driver", label: "司机", answer: "sī jī", options: ["sī jī", "shī jī", "sǐ jī"], focus: { base: "si", marked: "sī", initial: "s", wholeSyllable: "si" }, additionalFocuses: [{ base: "ji", marked: "jī", initial: "j", final: "i" }] },
  { id: "clover", asset: "clover", label: "四叶草", answer: "sì yè cǎo", options: ["sì yè cǎo", "shì yè cǎo", "sī yè cǎo"], focus: { base: "si", marked: "sì", initial: "s", wholeSyllable: "si" }, additionalFocuses: [{ base: "ye", marked: "yè", initial: "y", final: "ie", wholeSyllable: "ye" }, { base: "cao", marked: "cǎo", initial: "c", final: "ao" }] },
  { id: "chair", asset: "chair", label: "椅子", answer: "yǐ zi", options: ["yǐ zi", "yí zi", "wǐ zi"], focus: { base: "yi", marked: "yǐ", initial: "y", final: "i", wholeSyllable: "yi" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "doctor", asset: "doctor", label: "医生", answer: "yī shēng", options: ["yī shēng", "yí shēng", "wū shēng"], focus: { base: "yi", marked: "yī", initial: "y", final: "i", wholeSyllable: "yi" }, additionalFocuses: [{ base: "sheng", marked: "shēng", initial: "sh", final: "eng" }] },
  { id: "dark-cloud", asset: "darkCloud", label: "乌云", answer: "wū yún", options: ["wū yún", "wú yún", "yū yún"], focus: { base: "wu", marked: "wū", initial: "w", final: "u", wholeSyllable: "wu" }, additionalFocuses: [{ base: "yun", marked: "yún", initial: "y", final: "ün", wholeSyllable: "yun" }] },
  { id: "house", asset: "house", label: "屋子", answer: "wū zi", options: ["wū zi", "wú zi", "yū zi"], focus: { base: "wu", marked: "wū", initial: "w", final: "u", wholeSyllable: "wu" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "corn", asset: "corn", label: "玉米", answer: "yù mǐ", options: ["yù mǐ", "yǔ mǐ", "yú mǐ"], focus: { base: "yu", marked: "yù", initial: "y", final: "ü", wholeSyllable: "yu" }, additionalFocuses: [{ base: "mi", marked: "mǐ", initial: "m", final: "i" }] },
  { id: "feather", asset: "feather", label: "羽毛", answer: "yǔ máo", options: ["yǔ máo", "yú máo", "yù máo"], focus: { base: "yu", marked: "yǔ", initial: "y", final: "ü", wholeSyllable: "yu" }, additionalFocuses: [{ base: "mao", marked: "máo", initial: "m", final: "ao" }] },
  { id: "coconut", asset: "coconut", label: "椰子", answer: "yē zi", options: ["yē zi", "yuē zi", "yě zi"], focus: { base: "ye", marked: "yē", initial: "y", final: "ie", wholeSyllable: "ye" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "mooncake", asset: "mooncake", label: "月饼", answer: "yuè bǐng", options: ["yuè bǐng", "yué bǐng", "yǔ bǐng"], focus: { base: "yue", marked: "yuè", initial: "y", final: "üe", wholeSyllable: "yue" }, additionalFocuses: [{ base: "bing", marked: "bǐng", initial: "b", final: "ing" }] },
  { id: "jump", asset: "jump", label: "跳跃", answer: "tiào yuè", options: ["tiào yuè", "tiào yué", "tiào yǔ"], focus: { base: "yue", marked: "yuè", initial: "y", final: "üe", wholeSyllable: "yue" }, additionalFocuses: [{ base: "tiao", marked: "tiào", initial: "t", medial: "i", final: "ao" }] },
  { id: "park", asset: "park", label: "公园", answer: "gōng yuán", options: ["gōng yuán", "gōng yún", "gǒng yuán"], focus: { base: "yuan", marked: "yuán", initial: "y", medial: "ü", final: "an", wholeSyllable: "yuan" }, additionalFocuses: [{ base: "gong", marked: "gōng", initial: "g", final: "ong" }] },
  { id: "round-table", asset: "roundTable", label: "圆桌", answer: "yuán zhuō", options: ["yuán zhuō", "yún zhuō", "yuǎn zhuō"], focus: { base: "yuan", marked: "yuán", initial: "y", medial: "ü", final: "an", wholeSyllable: "yuan" }, additionalFocuses: [{ base: "zhuo", marked: "zhuō", initial: "zh", medial: "u", final: "o" }] },
  { id: "drink", asset: "drink", label: "饮料", answer: "yǐn liào", options: ["yǐn liào", "yīn liào", "yǐng liào"], focus: { base: "yin", marked: "yǐn", initial: "y", final: "in", wholeSyllable: "yin" }, additionalFocuses: [{ base: "liao", marked: "liào", initial: "l", medial: "i", final: "ao" }] },
  { id: "cloudy-day", asset: "cloudyDay", label: "阴天", answer: "yīn tiān", options: ["yīn tiān", "yīng tiān", "yǐn tiān"], focus: { base: "yin", marked: "yīn", initial: "y", final: "in", wholeSyllable: "yin" }, additionalFocuses: [{ base: "tian", marked: "tiān", initial: "t", medial: "i", final: "an" }] },
  { id: "exercise", asset: "exercise", label: "运动", answer: "yùn dòng", options: ["yùn dòng", "yún dòng", "yǔn dòng"], focus: { base: "yun", marked: "yùn", initial: "y", final: "ün", wholeSyllable: "yun" }, additionalFocuses: [{ base: "dong", marked: "dòng", initial: "d", final: "ong" }] },
  { id: "rainbow-cloud", asset: "rainbowCloud", label: "彩云", answer: "cǎi yún", options: ["cǎi yún", "cǎi yín", "cǎi yǔn"], focus: { base: "yun", marked: "yún", initial: "y", final: "ün", wholeSyllable: "yun" }, additionalFocuses: [{ base: "cai", marked: "cǎi", initial: "c", final: "ai" }] },
  { id: "parrot", asset: "parrot", label: "鹦鹉", answer: "yīng wǔ", options: ["yīng wǔ", "yīn wǔ", "yǐng wǔ"], focus: { base: "ying", marked: "yīng", initial: "y", final: "ing", wholeSyllable: "ying" }, additionalFocuses: [{ base: "wu", marked: "wǔ", initial: "w", final: "u", wholeSyllable: "wu" }] },
  { id: "firefly", asset: "firefly", label: "萤火虫", answer: "yíng huǒ chóng", options: ["yíng huǒ chóng", "yín huǒ chóng", "yǐng huǒ chóng"], focus: { base: "ying", marked: "yíng", initial: "y", final: "ing", wholeSyllable: "ying" }, additionalFocuses: [{ base: "huo", marked: "huǒ", initial: "h", medial: "u", final: "o" }, { base: "chong", marked: "chóng", initial: "ch", final: "ong" }] },
  { id: "goose", asset: "goose", label: "鹅", answer: "é", options: ["é", "ě", "è"], focus: { base: "e", marked: "é", initial: "", final: "e" } },
  { id: "box", asset: "box", label: "盒子", answer: "hé zi", options: ["hé zi", "hē zi", "ké zi"], focus: { base: "he", marked: "hé", initial: "h", final: "e" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "cup", asset: "cup", label: "杯子", answer: "bēi zi", options: ["bēi zi", "pēi zi", "běi zi"], focus: { base: "bei", marked: "bēi", initial: "b", final: "ei" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "children", asset: "children", label: "儿童", answer: "ér tóng", options: ["ér tóng", "ěr tóng", "é tóng"], focus: { base: "er", marked: "ér", initial: "", final: "er" }, additionalFocuses: [{ base: "tong", marked: "tóng", initial: "t", final: "ong" }] },
  { id: "headphones", asset: "headphones", label: "耳机", answer: "ěr jī", options: ["ěr jī", "ér jī", "ě jī"], focus: { base: "er", marked: "ěr", initial: "", final: "er" }, additionalFocuses: [{ base: "ji", marked: "jī", initial: "j", final: "i" }] },
  { id: "sprout", asset: "sprout", label: "嫩芽", answer: "nèn yá", options: ["nèn yá", "nén yá", "nèn yǎ"], focus: { base: "nen", marked: "nèn", initial: "n", final: "en" }, additionalFocuses: [{ base: "ya", marked: "yá", initial: "y", final: "a" }] },
  { id: "fountain", asset: "fountain", label: "喷泉", answer: "pēn quán", options: ["pēn quán", "pén quán", "bēn quán"], focus: { base: "pen", marked: "pēn", initial: "p", final: "en" }, additionalFocuses: [{ base: "quan", marked: "quán", initial: "q", medial: "ü", final: "an" }] },
  { id: "insect", asset: "insect", label: "昆虫", answer: "kūn chóng", options: ["kūn chóng", "kǔn chóng", "gūn chóng"], focus: { base: "kun", marked: "kūn", initial: "k", final: "un" }, additionalFocuses: [{ base: "chong", marked: "chóng", initial: "ch", final: "ong" }] },
  { id: "ship", asset: "ship", label: "轮船", answer: "lún chuán", options: ["lún chuán", "lùn chuán", "lǔn chuán"], focus: { base: "lun", marked: "lún", initial: "l", final: "un" }, additionalFocuses: [{ base: "chuan", marked: "chuán", initial: "ch", medial: "u", final: "an" }] },
  { id: "grapes", asset: "grapes", label: "葡萄", answer: "pú tao", options: ["pú tao", "bú tao", "pǔ tao"], focus: { base: "pu", marked: "pú", initial: "p", final: "u" }, additionalFocuses: [{ base: "tao", marked: "tao", initial: "t", final: "ao" }] },
  { id: "cow", asset: "cow", label: "奶牛", answer: "nǎi niú", options: ["nǎi niú", "lǎi niú", "nài niú"], focus: { base: "nai", marked: "nǎi", initial: "n", final: "ai" }, additionalFocuses: [{ base: "niu", marked: "niú", initial: "n", final: "iu" }] },
  { id: "pants", asset: "pants", label: "裤子", answer: "kù zi", options: ["kù zi", "gù zi", "kǔ zi"], focus: { base: "ku", marked: "kù", initial: "k", final: "u" }, additionalFocuses: [{ base: "zi", marked: "zi", initial: "z", wholeSyllable: "zi" }] },
  { id: "watermelon", asset: "watermelon", label: "西瓜", answer: "xī guā", options: ["xī guā", "qī guā", "xǐ guā"], focus: { base: "xi", marked: "xī", initial: "x", final: "i" }, additionalFocuses: [{ base: "gua", marked: "guā", initial: "g", medial: "u", final: "a" }] },
  { id: "hand", asset: "hand", label: "手", answer: "shǒu", options: ["shǒu", "sǒu", "shōu"], focus: { base: "shou", marked: "shǒu", initial: "sh", final: "ou" } },
  { id: "wind-chui", asset: "wind", label: "吹风", answer: "chuī fēng", options: ["chuī fēng", "cuī fēng", "chuǐ fēng"], focus: { base: "chui", marked: "chuī", initial: "ch", final: "ui" } },
];

export type PinyinPracticeLevel = "light" | "standard";

export interface PinyinWorksheetConfig {
  practiceLevel: PinyinPracticeLevel;
  traceRows: number;
  coreCount: number;
  pictureCount: number;
}

export const PINYIN_PRACTICE_PRESETS: Record<PinyinPracticeLevel, PinyinWorksheetConfig> = {
  light: { practiceLevel: "light", traceRows: 2, coreCount: 2, pictureCount: 3 },
  standard: { practiceLevel: "standard", traceRows: 3, coreCount: 4, pictureCount: 3 },
};

export const DEFAULT_PINYIN_WORKSHEET_CONFIG: PinyinWorksheetConfig = PINYIN_PRACTICE_PRESETS.light;
export const PINYIN_PAGE_HEIGHT_MM = 252;
export const MAX_PINYIN_TRACE_ROWS = 3;
export const MAX_PINYIN_CORE_QUESTIONS = 6;
export const MIN_PINYIN_PICTURE_QUESTIONS = 3;
export const MAX_PINYIN_PICTURE_QUESTIONS = 3;

export function normalizePinyinConfig(partial: Partial<PinyinWorksheetConfig>): PinyinWorksheetConfig {
  const practiceLevel: PinyinPracticeLevel = partial.practiceLevel === "standard" ? "standard" : "light";
  const preset = PINYIN_PRACTICE_PRESETS[practiceLevel];
  const integer = (value: number | undefined, fallback: number, min: number, max: number) => {
    const numeric = Number.isFinite(value) ? Math.trunc(value as number) : fallback;
    return Math.min(max, Math.max(min, numeric));
  };
  return {
    practiceLevel,
    traceRows: integer(partial.traceRows, preset.traceRows, 1, MAX_PINYIN_TRACE_ROWS),
    coreCount: integer(partial.coreCount, preset.coreCount, 2, MAX_PINYIN_CORE_QUESTIONS),
    pictureCount: integer(partial.pictureCount, preset.pictureCount, MIN_PINYIN_PICTURE_QUESTIONS, MAX_PINYIN_PICTURE_QUESTIONS),
  };
}

export interface PinyinBlendQuestion {
  kind: "blend";
  id: string;
  mode: "two" | "three";
  components: readonly string[];
  answer: string;
  markedAnswer: string;
  options: readonly string[];
}

export interface PinyinRecognitionQuestion {
  kind: "recognition";
  id: string;
  prompt: string;
  answer: string;
  options: readonly string[];
}

export type PinyinContrastRule = "shape" | "retroflex" | "final" | "umlaut";

export interface PinyinContrastQuestion {
  kind: "contrast";
  id: string;
  prompt: string;
  answer: string;
  options: readonly string[];
  targetDisplay: string;
  rule: PinyinContrastRule;
}

export interface PinyinPictureQuestion {
  kind: "picture";
  id: string;
  asset: PinyinPictureAsset;
  label: string;
  answer: string;
  options: readonly string[];
  focus: PinyinPictureFocus;
  targetDisplay: string;
}

export type PinyinQuestion = PinyinBlendQuestion | PinyinRecognitionQuestion | PinyinContrastQuestion | PinyinPictureQuestion;
export type PinyinPageSectionType = "trace" | "blend" | "picture";

export interface PinyinWorksheetSection {
  type: PinyinPageSectionType;
  title: string;
  questions: readonly PinyinQuestion[];
  traceRows?: number;
  continued: boolean;
  estimatedHeightMm: number;
}

export interface PinyinPrintPage {
  pageNumber: number;
  pageCount: number;
  sections: readonly PinyinWorksheetSection[];
  questionCount: number;
  usedHeightMm: number;
}

export interface PinyinWorksheet {
  item: PinyinItem;
  seed: number;
  config: PinyinWorksheetConfig;
  sections: readonly PinyinWorksheetSection[];
  pages: readonly PinyinPrintPage[];
}

function createRandom(seed: number) {
  let state = (Math.trunc(seed) >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function rotate<T>(items: readonly T[], start: number, count: number): T[] {
  if (items.length === 0 || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length] as T);
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex] as T, result[index] as T];
  }
  return result;
}

function makeOptions(answer: string, pool: readonly string[], random: () => number) {
  const candidates = Array.from(new Set(pool.filter((value) => value !== answer)));
  const start = candidates.length > 0 ? Math.floor(random() * candidates.length) : 0;
  const distractors = rotate(candidates, start, Math.min(2, candidates.length));
  return shuffle([answer, ...distractors], random);
}

const TONE_LABELS: Record<ToneNumber, string> = {
  1: "一声",
  2: "二声",
  3: "三声",
  4: "四声",
};

function createRecognitionQuestions(item: PinyinItem, count: number, toneMode: PinyinToneMode, random: () => number): PinyinRecognitionQuestion[] {
  const tones = toneMode === "all" ? shuffle([1, 2, 3, 4] as const, random) : [0] as const;
  const selectedTones = rotate(tones, 0, Math.min(count, tones.length));
  return selectedTones.map((tone, index) => {
    const answer = addToneMark(item.display, tone);
    const confusablePool = item.category === "whole-syllable"
      ? PINYIN_WHOLE_SYLLABLES.filter((base) => base !== item.display).map((base) => addToneMark(base, tone))
      : tone === 0 ? ["e", "en", "eng"] : getToneForms("er").slice(1).filter((form) => form !== answer);
    return {
      kind: "recognition",
      id: `recognition-${item.id}-${index + 1}`,
      prompt: tone === 0 ? `圈出 ${item.display}` : `圈出 ${item.display} 的${TONE_LABELS[tone]}`,
      answer,
      options: makeOptions(answer, confusablePool, random),
    };
  });
}

function createBlendQuestions(item: PinyinItem, count: number, random: () => number): PinyinQuestion[] {
  if (count <= 0) return [];
  if (item.category === "whole-syllable" || (item.category === "final" && item.display === "er")) {
    return createRecognitionQuestions(item, count, "all", random);
  }
  const pool = item.category === "initial"
    ? PINYIN_SYLLABLE_BANK.filter((syllable) => syllable.initial === item.display)
    : PINYIN_SYLLABLE_BANK.filter((syllable) => syllable.final === item.display);
  const source = shuffle(pool, random).slice(0, Math.min(count, pool.length));
  const answerPool = pool.map((syllable) => syllable.marked);
  return source.map((target, index) => {
    const final = addToneMark(target.final, target.tone);
    const components = target.medial ? [target.initial, target.medial, final] : [target.initial, final];
    return {
      kind: "blend",
      id: `blend-${item.id}-${index + 1}`,
      mode: target.split,
      components,
      answer: target.base,
      markedAnswer: target.marked,
      options: makeOptions(target.marked, answerPool, random),
    } satisfies PinyinBlendQuestion;
  });
}

const INITIAL_CONTRAST_GROUPS: readonly { targets: readonly string[]; options: readonly string[]; rule: PinyinContrastRule }[] = [
  { targets: ["b", "d", "p", "q"], options: ["b", "d", "p", "q"], rule: "shape" },
  { targets: ["z", "zh"], options: ["z", "zh", "c"], rule: "retroflex" },
  { targets: ["c", "ch"], options: ["c", "ch", "z"], rule: "retroflex" },
  { targets: ["s", "sh"], options: ["s", "sh", "z"], rule: "retroflex" },
];

const FINAL_CONTRAST_GROUPS: readonly { targets: readonly string[]; options: readonly string[] }[] = [
  { targets: ["ui", "iu"], options: ["ui", "iu", "ie"] },
  { targets: ["an", "ang"], options: ["an", "ang", "en"] },
  { targets: ["en", "eng"], options: ["en", "eng", "an"] },
  { targets: ["in", "ing"], options: ["in", "ing", "ün"] },
];

function createUmlautContrast(item: PinyinItem, random: () => number): PinyinContrastQuestion | undefined {
  const umlautFinals = ["ü", "üe", "ün"] as const;
  const initials = ["j", "q", "x", "y"] as const;
  const candidates = PINYIN_SYLLABLE_BANK.filter((syllable) => {
    const matchesInitial = item.category === "initial"
      && initials.includes(item.display as (typeof initials)[number])
      && syllable.initial === item.display
      && umlautFinals.includes(syllable.final as (typeof umlautFinals)[number]);
    const matchesFinal = item.category === "final" && umlautFinals.includes(item.display as (typeof umlautFinals)[number]) && syllable.final === item.display;
    return (matchesInitial || matchesFinal) && syllable.base.includes("u");
  });
  const target = candidates[Math.floor(random() * candidates.length)];
  if (!target) return undefined;
  const writtenWithDots = [target.initial, target.medial ?? "", target.final].join("");
  const otherFinal = target.final === "ü" ? "i" : target.final === "üe" ? "ie" : "in";
  return {
    kind: "contrast",
    id: `contrast-${item.id}-umlaut`,
    prompt: `${target.initial} 和 ${target.final} 相拼，应该写成`,
    answer: target.base,
    options: shuffle([target.base, writtenWithDots, `${target.initial}${otherFinal}`], random),
    targetDisplay: item.display,
    rule: "umlaut",
  };
}

function createContrastQuestion(item: PinyinItem, random: () => number): PinyinContrastQuestion | undefined {
  const umlaut = createUmlautContrast(item, random);
  if (umlaut) return umlaut;
  if (item.category === "initial") {
    const group = INITIAL_CONTRAST_GROUPS.find((entry) => entry.targets.includes(item.display));
    if (!group) return undefined;
    return {
      kind: "contrast",
      id: `contrast-${item.id}-${group.rule}`,
      prompt: `圈出声母 ${item.display}`,
      answer: item.display,
      options: shuffle(group.options, random),
      targetDisplay: item.display,
      rule: group.rule,
    };
  }
  if (item.category === "final") {
    const group = FINAL_CONTRAST_GROUPS.find((entry) => entry.targets.includes(item.display));
    if (!group) return undefined;
    return {
      kind: "contrast",
      id: `contrast-${item.id}-final`,
      prompt: `圈出韵母 ${item.display}`,
      answer: item.display,
      options: shuffle(group.options, random),
      targetDisplay: item.display,
      rule: "final",
    };
  }
  return undefined;
}

function createCoreQuestions(item: PinyinItem, count: number, random: () => number): PinyinQuestion[] {
  if (item.category === "whole-syllable" || (item.category === "final" && item.display === "er")) {
    return createBlendQuestions(item, count, random);
  }
  const contrast = createContrastQuestion(item, random);
  const blendQuestions = createBlendQuestions(item, Math.max(0, count - (contrast ? 1 : 0)), random);
  if (!contrast) return blendQuestions;
  return blendQuestions.length > 0 ? [blendQuestions[0] as PinyinQuestion, contrast, ...blendQuestions.slice(1)] : [contrast];
}

function pictureFocusMatchesItem(focus: PinyinPictureFocus, item: PinyinItem) {
  if (item.category === "initial") return focus.initial === item.display;
  if (item.category === "final") return focus.final === item.display;
  return focus.wholeSyllable === item.display;
}

function getMatchingPictureFocus(entry: PinyinPictureEntry, item: PinyinItem) {
  return [entry.focus, ...(entry.additionalFocuses ?? [])].find((focus) => pictureFocusMatchesItem(focus, item));
}

export function getPinyinPictureCandidates(item: PinyinItem): readonly PinyinPictureEntry[] {
  return PINYIN_PICTURE_BANK.filter((entry) => Boolean(getMatchingPictureFocus(entry, item)));
}

function createPictureQuestions(item: PinyinItem, count: number, random: () => number): PinyinPictureQuestion[] {
  if (count <= 0) return [];
  const candidates = getPinyinPictureCandidates(item);
  const start = candidates.length > 0 ? Math.floor(random() * candidates.length) : 0;
  return rotate(candidates, start, Math.min(count, candidates.length)).flatMap((entry, index) => {
    const focus = getMatchingPictureFocus(entry, item);
    if (!focus) return [];
    const options = shuffle(entry.options, random);
    return [{
      kind: "picture",
      id: `picture-${item.id}-${index + 1}`,
      asset: entry.asset,
      label: entry.label,
      answer: entry.answer,
      options,
      focus,
      targetDisplay: item.display,
    }];
  });
}

function sectionHeight(type: PinyinPageSectionType, count: number, traceRows = 0) {
  if (type === "trace") return 24 + traceRows * 27;
  if (type === "blend") return 15 + Math.max(1, count) * 24;
  // 图片题固定单栏，每道题都按一个完整横行参与分页。
  return 17 + Math.max(1, count) * 55;
}

export function getPinyinSectionHeight(type: PinyinPageSectionType, count: number, traceRows = 0) {
  return sectionHeight(type, count, traceRows);
}

function paginateSections(sources: readonly PinyinWorksheetSection[]): readonly PinyinPrintPage[] {
  const pages: { sections: PinyinWorksheetSection[]; usedHeightMm: number }[] = [{ sections: [], usedHeightMm: 0 }];
  const addPage = () => pages.push({ sections: [], usedHeightMm: 0 });
  const addSection = (page: { sections: PinyinWorksheetSection[]; usedHeightMm: number }, section: PinyinWorksheetSection) => {
    const gap = page.sections.length > 0 ? 6 : 0;
    page.sections.push(section);
    page.usedHeightMm += gap + section.estimatedHeightMm;
  };

  sources.forEach((source) => {
    if (source.type === "trace") {
      const page = pages[pages.length - 1] as { sections: PinyinWorksheetSection[]; usedHeightMm: number };
      const required = source.estimatedHeightMm + (page.sections.length > 0 ? 6 : 0);
      if (page.sections.length > 0 && page.usedHeightMm + required > PINYIN_PAGE_HEIGHT_MM) addPage();
      addSection(pages[pages.length - 1] as { sections: PinyinWorksheetSection[]; usedHeightMm: number }, source);
      return;
    }

    let offset = 0;
    while (offset < source.questions.length) {
      let page = pages[pages.length - 1] as { sections: PinyinWorksheetSection[]; usedHeightMm: number };
      const gap = page.sections.length > 0 ? 6 : 0;
      let available = PINYIN_PAGE_HEIGHT_MM - page.usedHeightMm - gap;
      let take = Math.min(source.questions.length - offset, source.type === "blend" ? MAX_PINYIN_CORE_QUESTIONS : MAX_PINYIN_PICTURE_QUESTIONS);
      while (take > 1 && sectionHeight(source.type, take) > available) take -= 1;
      if (sectionHeight(source.type, take) > available && page.sections.length > 0) {
        addPage();
        page = pages[pages.length - 1] as { sections: PinyinWorksheetSection[]; usedHeightMm: number };
        available = PINYIN_PAGE_HEIGHT_MM;
        take = Math.min(source.questions.length - offset, source.type === "blend" ? MAX_PINYIN_CORE_QUESTIONS : MAX_PINYIN_PICTURE_QUESTIONS);
        while (take > 1 && sectionHeight(source.type, take) > available) take -= 1;
      }
      const questions = source.questions.slice(offset, offset + take);
      addSection(page, { ...source, questions, continued: offset > 0, estimatedHeightMm: sectionHeight(source.type, questions.length) });
      offset += take;
    }
  });

  return pages.map((page, index) => ({
    pageNumber: index + 1,
    pageCount: pages.length,
    sections: page.sections,
    questionCount: page.sections.reduce((sum, section) => sum + section.questions.length, 0),
    usedHeightMm: page.usedHeightMm,
  }));
}

export function createPinyinWorksheet(itemId: string, seed: number, partialConfig: Partial<PinyinWorksheetConfig> = {}): PinyinWorksheet {
  const item = getPinyinItem(itemId) ?? PINYIN_LEARNING_ORDER[0] ?? PINYIN_ITEMS[0] as PinyinItem;
  const config = normalizePinyinConfig(partialConfig);
  const random = createRandom(seed);
  const traceSection: PinyinWorksheetSection = {
    type: "trace",
    title: "看一看，写一写",
    questions: [],
    traceRows: config.traceRows,
    continued: false,
    estimatedHeightMm: sectionHeight("trace", 0, config.traceRows),
  };
  const blendQuestions = createCoreQuestions(item, config.coreCount, random);
  const blendSection: PinyinWorksheetSection = {
    type: "blend",
    title: item.category === "whole-syllable" || (item.category === "final" && item.display === "er") ? "认一认，辨一辨" : "拼一拼，辨一辨",
    questions: blendQuestions,
    continued: false,
    estimatedHeightMm: sectionHeight("blend", blendQuestions.length),
  };
  const pictureQuestions = createPictureQuestions(item, config.pictureCount, random);
  const pictureSection: PinyinWorksheetSection = {
    type: "picture",
    title: "看图选音节",
    questions: pictureQuestions,
    continued: false,
    estimatedHeightMm: sectionHeight("picture", pictureQuestions.length),
  };
  const sections = [traceSection, ...(blendQuestions.length > 0 ? [blendSection] : []), ...(pictureQuestions.length > 0 ? [pictureSection] : [])];
  return { item, seed, config, sections, pages: paginateSections(sections) };
}

export const PINYIN_PROGRESS_STORAGE_KEY = "yicheng-kids:pinyin-progress:v1";
export const MAX_PINYIN_HISTORY = 180;

export interface PinyinProgressHistoryEntry {
  itemId: string;
  completedAt: string;
}

export interface PinyinProgressV1 {
  version: 1;
  completedItemIds: readonly string[];
  history: readonly PinyinProgressHistoryEntry[];
}

export function createEmptyPinyinProgress(): PinyinProgressV1 {
  return { version: 1, completedItemIds: [], history: [] };
}

export function parsePinyinProgress(raw: string | null): PinyinProgressV1 {
  if (!raw) return createEmptyPinyinProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return createEmptyPinyinProgress();
    const record = value as { version?: unknown; completedItemIds?: unknown; history?: unknown };
    if (record.version !== 1 || !Array.isArray(record.completedItemIds) || !Array.isArray(record.history)) return createEmptyPinyinProgress();
    const validIds = new Set(PINYIN_ITEM_IDS);
    const completedItemIds = Array.from(new Set(record.completedItemIds.filter((id): id is string => typeof id === "string" && validIds.has(id))));
    const history = record.history
      .filter((entry): entry is PinyinProgressHistoryEntry => Boolean(entry && typeof entry === "object" && typeof (entry as PinyinProgressHistoryEntry).itemId === "string" && typeof (entry as PinyinProgressHistoryEntry).completedAt === "string"))
      .filter((entry) => validIds.has(entry.itemId))
      .slice(-MAX_PINYIN_HISTORY);
    return { version: 1, completedItemIds, history };
  } catch {
    return createEmptyPinyinProgress();
  }
}

export function serializePinyinProgress(progress: PinyinProgressV1) {
  return JSON.stringify(progress);
}

export function markPinyinCompleted(progress: PinyinProgressV1, itemId: string, completedAt: string) {
  if (!getPinyinItem(itemId)) return progress;
  const completedItemIds = progress.completedItemIds.includes(itemId) ? [...progress.completedItemIds] : [...progress.completedItemIds, itemId];
  const history = [...progress.history, { itemId, completedAt }].slice(-MAX_PINYIN_HISTORY);
  return { version: 1 as const, completedItemIds, history };
}

export function getRecommendedPinyinItem(progress: PinyinProgressV1) {
  const completed = new Set(progress.completedItemIds);
  const next = PINYIN_LEARNING_ORDER.find((item) => !completed.has(item.id));
  if (next) return next;
  const lastPracticed = new Map<string, string>();
  progress.history.forEach((entry) => lastPracticed.set(entry.itemId, entry.completedAt));
  return [...PINYIN_LEARNING_ORDER].sort((left, right) => {
    const leftTime = lastPracticed.get(left.id) ?? "";
    const rightTime = lastPracticed.get(right.id) ?? "";
    return leftTime.localeCompare(rightTime) || left.order - right.order;
  })[0] ?? PINYIN_ITEMS[0];
}

export function getPinyinProgressCounts(progress: PinyinProgressV1) {
  const completed = new Set(progress.completedItemIds);
  return {
    total: PINYIN_ITEMS.length,
    completed: completed.size,
    initials: PINYIN_ITEMS.filter((item) => item.category === "initial" && completed.has(item.id)).length,
    finals: PINYIN_ITEMS.filter((item) => item.category === "final" && completed.has(item.id)).length,
    wholeSyllables: PINYIN_ITEMS.filter((item) => item.category === "whole-syllable" && completed.has(item.id)).length,
  };
}
