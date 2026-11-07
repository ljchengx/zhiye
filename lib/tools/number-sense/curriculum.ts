import { NUMBER_DEFINITIONS } from "./activities-number";
import { SPATIAL_DEFINITIONS } from "./activities-spatial";
import { QUANTITY_DEFINITIONS } from "./activities-quantity";
import { LOGIC_DEFINITIONS } from "./activities-logic";
import type { ActivityDefinition, EditionShift, NumberSenseMonthConfig, SceneKind, SkillId } from "./types";

export const NUMBER_SENSE_PLAN_DAYS = 30;
export const WORKSHEET_PLAN_DAYS = NUMBER_SENSE_PLAN_DAYS;
export const NUMBER_SENSE_PUBLIC_STAGE = "月度混合数感练习";
export const NUMBER_SENSE_PARENT_USAGE =
  "每面约 10～15 分钟，可分两次完成；圈、画、摆、说，让孩子表达自己的发现。";
export const SKILL_LABELS: Record<SkillId, string> = {
  structure: "数量分类",
  distance: "路线位置",
  compose: "搭配选择",
  relation: "关系变化",
  estimate: "比较测量",
  construct: "图形规律",
};
export const NUMBER_SENSE_SKILLS = Object.keys(SKILL_LABELS) as SkillId[];
export const SCENE_DEFINITIONS: Record<SceneKind, ActivityDefinition> = {
  market: {
    skill: "compose", title: "小小商店", prompt: "选两件不同商品，试试不同搭配。",
    followUp: "换一种搭配，还能正好花完吗？", objective: "搭配价格，比较预算和变化",
    action: "circle", repeatAction: "circle", repeatPrompt: "圈出买不起的，再比一比两组各剩多少。", repeatFollowUp: "只给一件减价，两组省得一样多吗？",
  },
  sharing: {
    skill: "relation", title: "点心分一分", prompt: "移动点心，让两盘一样多。",
    followUp: "添了点心，还能一样多吗？", objective: "观察移动后的数量关系",
    action: "connect", repeatAction: "draw", repeatPrompt: "不搬点心，添几块就一样多？", repeatFollowUp: "只从多的盘拿走，可以怎样做？",
  },
  parking: {
    skill: "relation", title: "停车场挪一挪", prompt: "看看空车位，把小车挪一挪。",
    followUp: "只换了车位，一共变了吗？", objective: "观察空位与挪车后的数量关系",
    action: "draw", repeatAction: "draw", repeatPrompt: "画进新来的车，观察空位的变化。", repeatFollowUp: "来新车和挪车，变化一样吗？",
  },
  garden: {
    skill: "structure", title: "花园里的发现", prompt: "数一数，比一比，发现花园的秘密。",
    followUp: "怎样分组能看得更清楚？", objective: "分类观察，比较数量",
    action: "fill", repeatAction: "circle", repeatPrompt: "圈出要送走的，让每种都一样多。", repeatFollowUp: "留下的一共还有几个？",
  },
  route: {
    skill: "distance", title: "去乐园的两条路", prompt: "看路线，帮伙伴选一条路。",
    followUp: "路被挡住后，你会怎样走？", objective: "读路线，比较距离和条件",
    action: "trace", repeatAction: "draw", repeatPrompt: "短路多绕一段，两条路会一样长吗？", repeatFollowUp: "要再多走多少米才一样长？",
  },
  windows: {
    skill: "construct", title: "窗上的贴纸", prompt: "转一转，圈出转动后的贴纸。",
    followUp: "你先盯住了哪一块贴纸？", objective: "观察位置，想象图形转动",
    action: "circle", repeatAction: "draw", repeatPrompt: "这次自己画出转动后的贴纸。", repeatFollowUp: "转动前后，贴纸个数变了吗？",
  },
  patterns: {
    skill: "construct", title: "花坛里的规律", prompt: "看清每次的变化，画出下一次。",
    followUp: "每次都发生了什么变化？", objective: "发现增加和减少的规律",
    action: "draw", repeatAction: "draw", repeatPrompt: "花坛中间空了一次，把它补出来。", repeatFollowUp: "补出的花坛能接上前后两次吗？",
  },
  measure: {
    skill: "estimate", title: "彩带有多长", prompt: "看清起点，量一量三条彩带。",
    followUp: "起点变了，长度会变吗？", objective: "理解长度、起点与单位",
    action: "fill", repeatAction: "draw", repeatPrompt: "在尺上另画一条一样长的彩带。", repeatFollowUp: "换了起点，终点该在哪里？",
  },
  ...SPATIAL_DEFINITIONS,
  ...QUANTITY_DEFINITIONS,
  ...LOGIC_DEFINITIONS,
  ...NUMBER_DEFINITIONS,
};
export const SCENE_KINDS = Object.keys(SCENE_DEFINITIONS) as SceneKind[];
export const MAX_ACTIVITY_OCCURRENCES = 2;
export const MIN_ACTIVITY_DAY_GAP = 7;

/** 每份至少一面是数量类活动，编排以此为准。 */
export const NUMBER_CORE_KINDS: ReadonlySet<SceneKind> = new Set<SceneKind>([
  "market", "sharing", "parking", "garden", "route", "measure", "patterns",
  "pairing", "bundles", "hidden", "line", "compensation", "difference",
  "capacity", "collections", "bus", "calendar", "ribbon", "pockets", "outfits", "fence",
  "manyWays", "regroup", "dualLine", "benchmark", "aboutHowMany", "reasonable",
  "equationMatch", "compareBig",
]);

/** 每种活动重访时换掉哪一类作答方式，测试会检查。 */
export const EDITION_SHIFTS: Record<SceneKind, EditionShift> = {
  market: "condition", sharing: "direction", parking: "condition", garden: "condition",
  route: "condition", windows: "representation", patterns: "direction", measure: "condition",
  seats: "direction", neighbors: "condition", mirror: "condition", tiles: "condition",
  code: "direction", path: "direction", views: "representation", fence: "openness",
  pairing: "condition", bundles: "representation", hidden: "direction", line: "direction",
  compensation: "direction", difference: "condition", capacity: "openness", collections: "condition",
  beads: "openness", outfits: "condition", order: "condition", clues: "condition",
  bus: "direction", calendar: "direction", ribbon: "condition", pockets: "openness",
  manyWays: "representation", regroup: "openness", dualLine: "direction",
  benchmark: "condition", aboutHowMany: "condition", reasonable: "condition",
  equationMatch: "direction", compareBig: "openness",
};

export function monthCount(
  config: NumberSenseMonthConfig = { count: 30 },
): number {
  if ("count" in config) {
    if (
      !Number.isInteger(config.count) ||
      config.count < 28 ||
      config.count > 31
    )
      throw new Error("每月请选择 28～31 份练习");
    return config.count;
  }
  if (
    !Number.isInteger(config.year) ||
    config.year < 1900 ||
    config.year > 9999 ||
    !Number.isInteger(config.month) ||
    config.month < 1 ||
    config.month > 12
  )
    throw new Error("请选择有效年月");
  return new Date(Date.UTC(config.year, config.month, 0)).getUTCDate();
}
export function safePlanDay(day: number, total = 31): number {
  return Number.isFinite(day)
    ? Math.max(1, Math.min(total, Math.trunc(day)))
    : 1;
}
