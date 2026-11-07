import { SKILL_LABELS } from "./curriculum";
import { Canvas, INK, type WorksheetNode } from "./drawing";
import type { WorksheetFonts } from "./fonts";
import { drawLifeScene } from "./scenes-life";
import { drawMathScene } from "./scenes-math";
import { drawSpatialScene } from "./scenes-spatial";
import { drawQuantityScene } from "./scenes-quantity";
import { drawLogicScene } from "./scenes-logic";
import { drawEstimateScene } from "./scenes-estimate";
import { drawNumberScene } from "./scenes-number";
import { drawStrategyScene } from "./scenes-strategy";
import type { NumberSenseDay, NumberSenseTask, WorksheetSide } from "./types";

export { INK, type WorksheetNode } from "./drawing";
export const PAPER = { width: 210, height: 297, margin: 12 } as const;

export interface WorksheetTaskRegion {
  id: string;
  skill: NumberSenseTask["skill"];
  kind: NumberSenseTask["problem"]["kind"];
  x: number;
  y: number;
  width: number;
  height: number;
  nodes: readonly WorksheetNode[];
}
export interface WorksheetPage {
  id: string;
  worksheetId: string;
  side: WorksheetSide;
  day: number;
  title: string;
  header: readonly WorksheetNode[];
  tasks: readonly WorksheetTaskRegion[];
  footer: readonly WorksheetNode[];
}
export interface WorksheetDocument {
  width: 210;
  height: 297;
  pages: readonly WorksheetPage[];
}

export function layoutWorksheetDay(day: NumberSenseDay, fonts: WorksheetFonts): readonly [WorksheetPage, WorksheetPage] {
  const pages = day.pages.map(({ side, activity }) => {
    const header = new Canvas(fonts), scene = new Canvas(fonts), footer = new Canvas(fonts);
    header.rect(12, 12, 186, 9, "#F8C25C");
    for (let x = 15; x < 198; x += 8) header.circle(x, 21, 2.6, "#F8C25C");
    header.caption("数学大发现", 17, 12.3, 12, "chineseBold", INK.dark);
    header.rect(155, 12, 43, 9, INK.leaf);
    header.caption(SKILL_LABELS[activity.skill], 176.5, 12.3, 12, "chineseBold", INK.white, "center");
    header.text(activity.title, 105, 30, 27, "chineseBold", "#D9752C", "center");
    if (!drawLifeScene(scene, activity, day.day) && !drawMathScene(scene, activity, day.day)
      && !drawSpatialScene(scene, activity, day.day) && !drawQuantityScene(scene, activity, day.day)
      && !drawLogicScene(scene, activity, day.day) && !drawNumberScene(scene, activity, day.day)
      && !drawEstimateScene(scene, activity, day.day) && !drawStrategyScene(scene, activity, day.day))
      throw new Error(`尚未实现活动画面：${activity.problem.kind}`);
    footer.caption(`第 ${day.day} 份 · ${side === "front" ? "正面" : "反面"} · 适合小学生`, 14, 279.5, 10, "chinese", INK.muted);
    footer.caption("看图 · 动手 · 想一想", 196, 279.5, 10, "chinese", INK.muted, "right");
    footer.image("flower", 100, 276, 10, 9);
    const page: WorksheetPage = {
      id: `${day.id}-${side}`, worksheetId: day.id, side, day: day.day,
      title: activity.title, header: header.nodes,
      tasks: [{ id: activity.id, skill: activity.skill, kind: activity.problem.kind, x: 12, y: 52, width: 186, height: 222, nodes: scene.nodes }],
      footer: footer.nodes,
    };
    assertWorksheetPageBounds(page);
    return page;
  });
  return [pages[0], pages[1]];
}

export function pageNodes(page: WorksheetPage): readonly WorksheetNode[] {
  return [...page.header, ...page.tasks.flatMap((task) => task.nodes), ...page.footer];
}

export function nodeBounds(node: WorksheetNode): { x: number; y: number; width: number; height: number } {
  if (node.kind === "line") return {
    x: Math.min(node.x1, node.x2), y: Math.min(node.y1, node.y2),
    width: Math.abs(node.x2 - node.x1), height: Math.abs(node.y2 - node.y1),
  };
  if (node.kind === "circle") return { x: node.x - node.radius, y: node.y - node.radius, width: node.radius * 2, height: node.radius * 2 };
  return node;
}

export function assertWorksheetPageBounds(page: WorksheetPage): void {
  for (const node of pageNodes(page)) {
    const b = nodeBounds(node);
    if (b.x < 11.5 || b.y < 11.5 || b.x + b.width > 198.5 || b.y + b.height > 285.5)
      throw new Error(`第 ${page.day} 份${page.side}超出纸面范围：${node.kind === "text" ? node.text : node.kind}`);
  }
  for (const task of page.tasks) for (const node of task.nodes) {
    const b = nodeBounds(node);
    if (b.x < task.x - 0.5 || b.x + b.width > task.x + task.width + 0.5 || b.y < task.y - 1 || b.y + b.height > task.y + task.height + 0.5)
      throw new Error(`第 ${page.day} 份活动超出预留空间：${node.kind === "text" ? node.text : node.kind}`);
  }
}

export function layoutWorksheetDocument(days: readonly NumberSenseDay[], fonts: WorksheetFonts): WorksheetDocument {
  return { width: 210, height: 297, pages: days.flatMap((day) => layoutWorksheetDay(day, fonts)) };
}
