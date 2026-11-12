import type { WorksheetNode } from "./drawing";

export { INK, type WorksheetNode } from "./drawing";

export const PAPER = { width: 210, height: 297, margin: 12 } as const;

/** 一页里的一处：一个题块对应一处。 */
export interface WorksheetTaskRegion {
  id: string;
  /** 版面不再按题型分组，保留这两个字段，让画图与范围检查都能用。 */
  skill: string;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodes: readonly WorksheetNode[];
}
export interface WorksheetPage {
  id: string;
  worksheetId: string;
  side: "front" | "back";
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

/** 每一处图元都要落在纸面内，也要落在自己那一块的范围里。 */
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
