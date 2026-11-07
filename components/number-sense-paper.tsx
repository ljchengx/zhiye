import type { LocalWorksheetCharacterMap } from "@/lib/tools/math-local-assets";
import type { WorksheetPage } from "@/lib/tools/number-sense/layout";
import {
  isWorksheetCharacterAsset,
  worksheetImageSource,
  type WorksheetNode,
} from "@/lib/tools/number-sense/drawing";

import { WORKSHEET_FONT_FAMILIES } from "@/lib/tools/number-sense/font-manifest";

function Node({
  node,
  overrides,
}: {
  node: WorksheetNode;
  overrides?: LocalWorksheetCharacterMap;
}) {
  if (node.kind === "text")
    return (
      <text
        x={node.x}
        y={node.baseline}
        fontFamily={WORKSHEET_FONT_FAMILIES[node.font]}
        fontSize={(node.size * 25.4) / 72}
        fill={node.color}
        xmlSpace="preserve"
        data-font={node.font}
        data-size={node.size}
      >
        {node.text}
      </text>
    );
  if (node.kind === "line")
    return (
      <line
        x1={node.x1}
        y1={node.y1}
        x2={node.x2}
        y2={node.y2}
        stroke={node.color}
        strokeWidth={node.weight}
        strokeDasharray={node.dashed ? "1 1" : undefined}
      />
    );
  if (node.kind === "rect")
    return (
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.fill ?? "none"}
        stroke={node.stroke ?? "none"}
        strokeWidth={node.weight}
      />
    );
  if (node.kind === "circle")
    return (
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius}
        fill={node.fill ?? "none"}
        stroke={node.stroke ?? "none"}
        strokeWidth={node.weight}
      />
    );
  if (node.kind === "ellipse")
    return (
      <ellipse
        cx={node.x + node.width / 2}
        cy={node.y + node.height / 2}
        rx={node.width / 2}
        ry={node.height / 2}
        fill={node.fill ?? "none"}
        stroke={node.stroke ?? "none"}
        strokeWidth={node.weight}
      />
    );
  if (node.kind === "path")
    return (
      <path
        d={node.d}
        transform={`translate(${node.x} ${node.y})`}
        fill={node.fill ?? "none"}
        stroke={node.stroke ?? "none"}
        strokeWidth={node.weight}
      />
    );
  const asset = node.asset;
  const character = isWorksheetCharacterAsset(asset);
  return (
    <image
      x={node.x}
      y={node.y}
      width={node.width}
      height={node.height}
      href={
        (character ? overrides?.[asset]?.url : undefined) ?? worksheetImageSource(asset)
      }
      preserveAspectRatio="xMidYMid meet"
      data-character={character ? asset : undefined}
      data-object={character ? undefined : asset}
    />
  );
}

export function NumberSensePaper({
  page,
  className,
  printCopy = false,
  overrides,
}: {
  page: WorksheetPage;
  className?: string;
  printCopy?: boolean;
  overrides?: LocalWorksheetCharacterMap;
}) {
  const nodes = (items: readonly WorksheetNode[]) =>
    items.map((node, index) => (
      <Node node={node} overrides={overrides} key={index} />
    ));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 210 297"
      className={className}
      role="img"
      aria-label={`第 ${page.day} 份${page.side === "front" ? "正面" : "反面"}：${page.title}`}
      data-testid={printCopy ? undefined : "math-worksheet-paper"}
      data-day={page.day}
      data-side={page.side}
      data-page-id={page.id}
      data-worksheet-id={page.worksheetId}
      data-print-copy={printCopy || undefined}
      // 关闭浏览器自动收紧中文标点，保持与共享排版和 PDF 的字宽相同。
      style={{ fontSynthesis: "none", textSpacingTrim: "space-all" }}
    >
      <title>{`第 ${page.day} 份 · ${page.side === "front" ? "正面" : "反面"} · ${page.title}`}</title>
      <rect x="0" y="0" width="210" height="297" fill="#FFFFFF" />
      <g data-region="header">{nodes(page.header)}</g>
      {page.tasks.map((task) => (
        <g
          data-testid="math-worksheet-question"
          data-skill={task.skill}
          data-type={task.kind}
          data-task-id={task.id}
          data-top={task.y}
          data-left={task.x}
          data-width={task.width}
          data-height={task.height}
          key={task.id}
        >
          {nodes(task.nodes)}
        </g>
      ))}
      <g data-region="footer">{nodes(page.footer)}</g>
    </svg>
  );
}
