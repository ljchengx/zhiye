import type { NumberSenseDay, NumberSenseTask, WorksheetSide } from "./types";

export function describeConversation(task: NumberSenseTask): { title: string; question: string } {
  return { title: task.title, question: task.followUp };
}

/** 页眉与聊天提示始终来自当前面的场景。 */
export function pageConversation(
  day: NumberSenseDay,
  side: WorksheetSide,
): { task: NumberSenseTask; index: number; title: string; question: string } {
  const index = side === "front" ? 0 : 1;
  const task = day.pages[index].activity;
  return { task, index, ...describeConversation(task) };
}

export function conversationLabel(day: NumberSenseDay): string {
  return day.objective;
}
