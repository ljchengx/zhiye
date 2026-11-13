/** 毫米制页面尺寸：生成、分面与绘制共用，避免各自估算。 */
export const DRILL_PAGE = {
  left: 14,
  width: 182,
  top: 46,
  bottom: 274,
  blockGap: 6,
  blockHead: 18,
  blockPad: 3,
  inset: 5,
  columnGap: 6,
} as const;

/** 按儿童实际书写尺寸留空，不能只把横线加长。 */
export const DRILL_WRITING = {
  lineHeight: 13,
  numberWidth: 24,
  numberHeight: 13,
  symbolSize: 13,
  tableCellHeight: 14,
  towerWidth: 22,
  towerHeight: 12,
  activityHeight: 18,
} as const;

export function blockHeight(
  layout: { columns: number; minRowHeight: number; preferredRowHeight: number; minBlockHeight: number },
  count: number,
  preferred = false,
): number {
  const rowHeight = preferred ? layout.preferredRowHeight : layout.minRowHeight;
  return Math.max(layout.minBlockHeight,
    DRILL_PAGE.blockHead + DRILL_PAGE.blockPad + Math.ceil(count / layout.columns) * rowHeight);
}
