import type { ToolDefinitionBase } from "./registry";

export type KidsToolSlug = "math-worksheet";
export type KidsToolPath = "math-worksheet";

export interface KidsToolDefinition extends ToolDefinitionBase<KidsToolSlug, KidsToolPath> {
  href: `/kids/${KidsToolPath}`;
  summary: string;
  stage: string;
  skillAreas: readonly string[];
  previewImage: string;
  order: number;
}

export const kidsToolDefinitions: readonly KidsToolDefinition[] = [
  {
    slug: "math-worksheet",
    path: "math-worksheet",
    href: "/kids/math-worksheet",
    component: "math-worksheet",
    title: "幼小数学练习",
    titleEn: "Early Math Worksheet",
    shortTitle: "数学练习",
    shortTitleEn: "Math Worksheet",
    summary: "5 天基础学习加 25 天强化训练，按需加入应用题并生成 A4 练习页。",
    description: "先学方法，再按比例生成计算、数感和应用题练习。",
    descriptionEn: "A progressive daily math practice set designed for young learners.",
    category: "启蒙数学",
    categoryEn: "Early math",
    keywords: [
      "幼小数学练习",
      "数学练习题",
      "口算题生成",
      "凑十法",
      "破十法",
      "平十法",
      "相邻数练习",
      "比大小练习",
      "A4 数学练习",
      "数学题打印",
    ],
    icon: "calculator",
    accent: "amber",
    stage: "4～7 岁",
    skillAreas: ["相邻数", "比大小", "计算式", "应用题"],
    previewImage: "/kids/math-worksheet-preview.webp",
    order: 1,
    metadata: {
      title: "幼小数学练习生成器 - 基础学习与强化训练 A4 打印",
      description: "在线生成幼小阶段 5 天基础学习与 25 天强化训练，按需配置相邻数、比大小、计算式和应用题比例，并自动排成 A4 练习页。",
    },
    seo: {
      heading: "幼小数学练习在线生成与 A4 打印",
      summary: "先用 5 天固定内容学方法，再用 25 天强化练习巩固数感、计算和应用题。",
      intro: "知页启蒙数学练习适合 4～7 岁孩子的日常练习。前 5 天是固定精选的基础学习，后 25 天按统一配置生成强化训练；每天 10～30 题，难度从 20 以内逐步提升到 200 以内三个数加减混合，并按实际内容自动排成 1 到 2 页。",
      features: [
        "相邻数：生成如“26 __ 28”的填中间数题目。",
        "比大小：生成数字比较题，练习小于、大于和等于。",
        "基础学习：用 5 天依次学习数的组成、凑十法、破十法、平十法和看图列式。",
        "强化训练：统一配置每天题量和题型比例，自动加入两位数、三个数加减和应用题。",
        "A4 打印：按实际内容生成 1 到 2 页；单页会自动补空白背面，方便双面打印。",
      ],
      steps: [
        "先选择是否包含 5 天基础学习，再设置强化训练的每天题量和题型比例。",
        "点击计划中的某一天，查看当天目标、题量和 A4 预览；基础内容固定，强化内容可以重新生成。",
        "点击导出 PDF，在打印窗口中保存完整计划或纯强化训练打印包。",
      ],
      h1: "幼小数学练习",
      sections: [
        {
          heading: "相邻数和比大小练什么？",
          paragraphs: [
            "相邻数练习帮助孩子建立数序，例如在 26 和 28 之间填入 27。比大小练习通过小于、大于和等于的判断，巩固数字之间的数量关系。",
          ],
        },
        {
          heading: "基础学习和强化训练",
          paragraphs: [
            "基础学习用 5 天固定内容示范数的组成、凑十法、破十法、平十法和看图列式。强化训练再按天递进，加入两位数、三个数加减混合和应用题。",
          ],
        },
        {
          heading: "A4 练习纸与本地处理",
          paragraphs: [
            "题目在当前浏览器中生成，预览按 A4 竖版排版。可以只导出 25 天强化训练，也可以导出完整的 30 天计划；单页内容会自动补空白背面，不需要上传任何内容。",
          ],
        },
      ],
      faqs: [
        {
          question: "每天有多少题？",
          answer: "基础学习每天 28 题；强化训练每天可设置 10～30 题，默认 30 题。相邻数、比大小和应用题按比例分配，计算式自动使用剩余比例。",
        },
        {
          question: "基础学习可以修改吗？",
          answer: "前 5 天是固定精选内容，保证方法、顺序和题目稳定；强化训练使用一套配置，可重新生成 25 天题目。",
        },
        {
          question: "应用题最多可以设置多少？",
          answer: "应用题占比最高 25%，每天最多 8 题。题目使用受控的加减情境，结果和中间结果不超过当天难度上限。",
        },
        {
          question: "如何把练习保存成 PDF？",
          answer: "点击工具中的“导出 PDF”打开浏览器打印窗口，然后选择“另存为 PDF”或系统提供的 PDF 打印机即可。",
        },
      ],
    },
  },
];

export function getKidsToolByPath(path: string): KidsToolDefinition | undefined {
  return kidsToolDefinitions.find((tool) => tool.path === path || tool.href === `/kids/${path}`);
}

export function getKidsToolHref(tool: Pick<KidsToolDefinition, "href">): string {
  return tool.href;
}
