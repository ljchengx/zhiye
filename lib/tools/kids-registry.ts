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
    summary: "30 天连续练习，按难度递进排成每天的 A4 学习页。",
    description: "按天生成一套看得懂、写得下的数学练习。",
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
    skillAreas: ["相邻数", "比大小", "口算"],
    previewImage: "/kids/math-worksheet-preview.webp",
    order: 1,
    metadata: {
      title: "幼小数学练习生成器 - 30 天连续作业与 A4 打印",
      description: "在线生成幼小阶段 30 天连续数学练习，包含相邻数、比大小和口算，题目按难度递进并自动排成 1 到 2 页，可保存完整打印包。",
    },
    seo: {
      heading: "幼小数学练习在线生成与 A4 打印",
      summary: "用 30 天连续练习巩固相邻数、比大小和口算，题目按难度递进并自动排版。",
      intro: "知页启蒙数学练习适合 4～7 岁孩子的日常练习。工具按 6 个阶段安排 30 天内容，每天不超过 30 题；难度从 20 以内基础口算逐步提升到 200 以内三个数加减混合，并按实际内容自动排成 1 到 2 页。",
      features: [
        "相邻数：生成如“26 __ 28”的填中间数题目。",
        "比大小：生成数字比较题，练习小于、大于和等于。",
        "口算：按凑十法、破十法、平十法安排引导，逐步加入两位数和三个数加减混合。",
        "连续作业：按 6 个阶段生成 30 天内容，并自动计算每天需要的 A4 页面。",
      ],
      steps: [
        "在 30 天计划中点击某一天，查看当天目标、题量和 A4 预览。",
        "按需要调整当天三类题型数量，或重新生成当天题目。",
        "点击导出 30 天 PDF，在打印窗口中保存完整打印包。",
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
          heading: "三种口算方法",
          paragraphs: [
            "凑十法适合处理进位加法；破十法和平十法常用于退位减法。计划先巩固基础题，再逐步加入两位数和三个数加减混合，后期结果控制在 200 以内。",
          ],
        },
        {
          heading: "A4 练习纸与本地处理",
          paragraphs: [
            "题目在当前浏览器中生成，预览按 A4 竖版排版。点击导出 30 天 PDF 后使用浏览器打印窗口保存，打印包会按天分页，不需要上传任何内容。",
          ],
        },
      ],
      faqs: [
        {
          question: "30 天计划每天有多少题？",
          answer: "每天最多 30 题，默认会从 20 多题逐步增加到 30 题；可以点击某一天调整相邻数、比大小和口算三部分的数量。",
        },
        {
          question: "口算题支持哪些方法？",
          answer: "计划按阶段自动安排凑十法、破十法和平十法，并在阶段小结中混合练习。后期会加入 200 以内三个数加减混合，前期练习页上方提供与当天主题对应的简单演示。",
        },
        {
          question: "如何把练习保存成 PDF？",
          answer: "点击“导出 30 天 PDF”打开浏览器打印窗口，然后选择“另存为 PDF”或系统提供的 PDF 打印机即可。",
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
