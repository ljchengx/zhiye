import type { ToolDefinitionBase } from "./registry";

export type KidsToolSlug = "math-worksheet" | "pinyin-worksheet";
export type KidsToolPath = "math-worksheet" | "pinyin-worksheet";
export type KidsToolFormat = "printable" | "interactive" | "creative";
export type KidsContentDomain = "math" | "pinyin" | "chinese" | "spatial" | "logic" | "science";

export interface KidsToolDefinition extends ToolDefinitionBase<KidsToolSlug, KidsToolPath> {
  href: `/kids/${KidsToolPath}`;
  summary: string;
  stage: string;
  format: KidsToolFormat;
  domain: KidsContentDomain;
  estimatedMinutes: number;
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
    summary: "5 天基础引导加 25 天强化训练，按需加入应用题并生成 A4 练习页。",
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
    format: "printable",
    domain: "math",
    estimatedMinutes: 15,
    skillAreas: ["相邻数", "比大小", "计算式", "应用题"],
    previewImage: "/kids/math-worksheet-preview.webp",
    order: 1,
    metadata: {
      title: "幼小数学练习生成器 - 基础引导与强化训练 A4 打印",
      description: "在线生成幼小阶段 5 天基础引导与 25 天强化训练，按需配置相邻数、比大小、计算式和应用题比例，并自动排成 A4 练习页。",
    },
    seo: {
      heading: "幼小数学练习在线生成与 A4 打印",
      summary: "先用 5 天固定内容学方法，再用 25 天强化练习巩固数感、计算和应用题。",
      intro: "一程一成长启蒙数学练习适合 4～7 岁孩子的日常练习。前 5 天是固定精选的基础引导，后 25 天按统一配置生成强化训练；每天 10～30 题，难度从 20 以内逐步提升到 200 以内三个数加减混合，并按实际内容自动排成 1 到 2 页。",
      features: [
        "相邻数：生成如“26 __ 28”的填中间数题目。",
        "比大小：生成数字比较题，练习小于、大于和等于。",
        "基础引导：用 5 天依次认识数的组成、凑十法、破十法、平十法和看图列式。",
        "强化训练：统一配置每天题量和题型比例，自动加入两位数、三个数加减和应用题。",
        "A4 打印：按实际内容生成 1 到 2 页；单页会自动补空白背面，方便双面打印。",
      ],
      steps: [
        "先选择是否包含 5 天基础引导，再设置强化训练的每天题量和题型比例。",
        "点击计划中的某一天，查看当天目标、题量和 A4 预览；基础内容固定，强化内容可以重新生成。",
        "点击导出 PDF 可直接下载完整计划或纯强化训练打印包；只需要某一天时，使用“打印当前一天”。",
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
          heading: "基础引导和强化训练",
          paragraphs: [
            "基础引导用 5 天固定内容示范数的组成、凑十法、破十法、平十法和看图列式。强化训练再按天递进，加入两位数、三个数加减混合和应用题。",
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
          answer: "基础引导每天 28 题；强化训练每天可设置 10～30 题，默认 30 题。相邻数、比大小和应用题按比例分配，计算式自动使用剩余比例。",
        },
        {
          question: "基础引导可以修改吗？",
          answer: "前 5 天是固定精选内容，保证方法、顺序和题目稳定；强化训练使用一套配置，可重新生成 25 天题目。",
        },
        {
          question: "应用题最多可以设置多少？",
          answer: "应用题占比最高 25%，每天最多 8 题。题目使用受控的加减情境，结果和中间结果不超过当天难度上限。",
        },
        {
          question: "如何把练习保存成 PDF？",
          answer: "导出完整计划时会直接下载 PDF；只保存当前一天时，点击“打印当前一天”，再在浏览器打印窗口中选择“另存为 PDF”。",
        },
      ],
    },
  },
  {
    slug: "pinyin-worksheet",
    path: "pinyin-worksheet",
    href: "/kids/pinyin-worksheet",
    component: "pinyin-worksheet",
    title: "幼小拼音练习",
    titleEn: "Early Pinyin Worksheet",
    shortTitle: "拼音练习",
    shortTitleEn: "Pinyin Worksheet",
    summary: "从一个声母、韵母或整体认读开始，生成轻量的四线三格 A4 拼音练习纸。",
    description: "每天练一个拼音项目，描红、拼读和看图选择都在浏览器本地完成。",
    descriptionEn: "A gentle local worksheet maker for daily pinyin practice.",
    category: "启蒙拼音",
    categoryEn: "Early pinyin",
    keywords: [
      "幼小拼音练习",
      "拼音描红",
      "四线三格",
      "拼音练习纸",
      "声母练习",
      "韵母练习",
      "整体认读音节",
      "看图选音节",
      "A4 拼音打印",
    ],
    icon: "languages",
    accent: "sage",
    stage: "4～7 岁",
    format: "printable",
    domain: "pinyin",
    estimatedMinutes: 10,
    skillAreas: ["声母韵母", "四线三格", "两拼三拼", "看图认读"],
    previewImage: "/kids/pinyin-worksheet-preview.png",
    order: 2,
    metadata: {
      title: "幼小拼音练习纸生成器 - 四线三格 A4 打印",
      description: "为 4～7 岁孩子生成声母、韵母和整体认读音节练习纸，包含四线三格描红、两拼三拼和看图选音节。",
    },
    seo: {
      heading: "幼小拼音练习在线生成与 A4 打印",
      summary: "每天选择一个拼音项目，生成描红、拼读和看图认读练习纸。",
      intro: "一程一成长拼音练习适合 4～7 岁孩子的家庭启蒙练习。家长可以从声母、韵母或整体认读音节中选择一个项目，在当前浏览器生成适合 A4 打印的练习页。",
      features: [
        "标准拼音表：覆盖 23 个声母、24 个韵母和 16 个整体认读音节。",
        "四线三格描红：浅灰示范字配合空白格，练习纸笔书写。",
        "拼读与认读：按项目生成两拼、三拼或整体认读练习。",
        "看图选音节：用原创风格实物图增加一点趣味。",
        "本地生成：内容只在当前浏览器中生成，不保存使用记录。",
      ],
      steps: [
        "选择一个声母、韵母或整体认读音节。",
        "调整描红行数、拼读题和看图题数量，查看右侧 A4 预览。",
        "打印当前项目，或在打印窗口中另存为 PDF。",
      ],
      h1: "幼小拼音练习",
      sections: [
        {
          heading: "每天一个拼音项目",
          paragraphs: [
            "把拼音启蒙拆成一个个可以完成的小步骤。今天可以只练一个声母，也可以选择一个韵母或整体认读音节。",
          ],
        },
        {
          heading: "描红、拼读和看图认读",
          paragraphs: [
            "练习纸包含四线三格描红、两拼或三拼练习，以及带实物图的选音节题。整体认读音节使用认读题，不强行拆分。",
          ],
        },
        {
          heading: "A4 练习纸与本地处理",
          paragraphs: [
            "所有内容在当前浏览器中生成，页面按 A4 竖版排版。工具不保存项目选择或使用记录，也不需要登录；练习纸标注家庭自用、不替代教学。",
          ],
        },
      ],
      faqs: [
        {
          question: "一次可以练多少个拼音？",
          answer: "每次选择一个声母、韵母或整体认读音节，保持每天一小步的练习节奏。",
        },
        {
          question: "拼音练习会自动批改吗？",
          answer: "不会。它只生成纸笔练习，不做 AI 批改、评测或教学。",
        },
        {
          question: "如何保存成 PDF？",
          answer: "点击打印或导出 PDF，在浏览器打印窗口选择“另存为 PDF”即可。",
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

export function getKidsToolsByFormat(format: KidsToolFormat): KidsToolDefinition[] {
  return kidsToolDefinitions
    .filter((tool) => tool.format === format)
    .slice()
    .sort((left, right) => left.order - right.order);
}
