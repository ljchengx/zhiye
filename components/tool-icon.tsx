import { Binary, Blocks, BookOpen, Braces, Calculator, Clock3, Eraser, Languages, Stamp } from "lucide-react";

import type { ToolIconName } from "@/lib/tools/registry";

const icons = {
  binary: Binary,
  braces: Braces,
  eraser: Eraser,
  stamp: Stamp,
  clock: Clock3,
  calculator: Calculator,
  languages: Languages,
  blocks: Blocks,
  "book-open": BookOpen,
} as const;

interface ToolIconProps {
  name: ToolIconName;
  size?: number;
  strokeWidth?: number;
}

export function ToolIcon({ name, size = 22, strokeWidth = 1.8 }: ToolIconProps) {
  const Icon = icons[name];

  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />;
}
