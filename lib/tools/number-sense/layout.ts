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

/** 文字和图片互不遮挡；作答线也要避开文字，图表单元格允许承载数字。 */
export function assertWorksheetContentSpacing(page: WorksheetPage): void {
  const overlaps = (a: ReturnType<typeof nodeBounds>, b: ReturnType<typeof nodeBounds>) =>
    a.x < b.x + b.width - 0.2 && b.x < a.x + a.width - 0.2
    && a.y < b.y + b.height - 0.2 && b.y < a.y + a.height - 0.2;
  for (const nodes of [page.header, ...page.tasks.map((task) => task.nodes), page.footer]) {
    const content = nodes.filter((node) => node.kind === "text" || node.kind === "image");
    for (let i = 0; i < content.length; i += 1) for (let j = i + 1; j < content.length; j += 1) {
      if (overlaps(nodeBounds(content[i]), nodeBounds(content[j])))
        throw new Error(`第 ${page.day} 份文字或图片互相遮挡`);
    }
    for (const node of nodes) if (node.purpose === "writing") {
      const bounds = nodeBounds(node);
      const stroke = node.kind === "line" ? node.weight / 2 : 0;
      const writingHeight = node.kind === "line" ? node.writingHeight ?? 0 : 0;
      const ink = {
        x: bounds.x - stroke, y: bounds.y - writingHeight - stroke,
        width: bounds.width + stroke * 2, height: bounds.height + writingHeight + stroke * 2,
      };
      if (content.some((text) => overlaps(ink, nodeBounds(text))))
        throw new Error(`第 ${page.day} 份作答区遮挡文字或图片`);
    }
  }
  for (let i = 1; i < page.tasks.length; i += 1) {
    const previous = page.tasks[i - 1], current = page.tasks[i];
    if (current.y < previous.y + previous.height)
      throw new Error(`第 ${page.day} 份题块互相重叠`);
  }
}
