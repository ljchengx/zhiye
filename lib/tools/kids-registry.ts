import type { ToolDefinitionBase } from "./registry";

export type KidsToolSlug = "math-worksheet" | "pinyin-worksheet" | "spatial-blocks" | "english-catalog";
export type KidsToolPath = "math-worksheet" | "pinyin-worksheet" | "spatial-blocks" | "english-catalog";
export type KidsToolFormat = "printable" | "interactive" | "creative" | "library";
export type KidsContentDomain = "math" | "pinyin" | "chinese" | "spatial" | "logic" | "science" | "english";
export type KidsToolComponent = "math-worksheet" | "pinyin-worksheet" | "spatial-blocks" | "static-site";

interface KidsToolDefinitionBase extends ToolDefinitionBase<KidsToolSlug, KidsToolPath> {
  href: `/kids/${KidsToolPath}` | "/kids/catalog";
  component: KidsToolComponent;
  summary: string;
  stage: string;
  domain: KidsContentDomain;
  estimatedMinutes: number;
  skillAreas: readonly string[];
  previewImage: string;
  order: number;
}

export interface KidsPrintableToolDefinition extends KidsToolDefinitionBase {
  format: "printable";
  activityId?: never;
}

export interface KidsStatefulToolDefinition extends KidsToolDefinitionBase {
  format: "interactive" | "creative";
  activityId: string;
}

export interface KidsStaticSiteToolDefinition extends KidsToolDefinitionBase {
  format: "library";
  component: "static-site";
  activityId?: never;
}

export type KidsToolDefinition = KidsPrintableToolDefinition | KidsStatefulToolDefinition | KidsStaticSiteToolDefinition;

export function isKidsAppRouteTool(tool: KidsToolDefinition): boolean {
  return tool.component !== "static-site";
}

export const kidsToolDefinitions: readonly KidsToolDefinition[] = [
  {
    slug: "math-worksheet",
    path: "math-worksheet",
    href: "/kids/math-worksheet",
    component: "math-worksheet",
    title: "月度计算练习",
    titleEn: "Number Sense Worksheet",
    shortTitle: "计算练习",
    shortTitleEn: "Math Worksheet",
    summary: "每月一套 A4 双面练习，每面一幅完整场景，在商店、花园和停车场中发现数学关系。",
    description: "面向已熟练掌握 100 以内加减的小学低年级孩子（建议 6 岁以上），通过观察、比较和解释，理解数量之间的关系。",
    descriptionEn: "Monthly printable calculation drills for lower primary: 25 items per double-sided sheet, 14 rotating item types, addition and subtraction within 100 plus times tables.",
    category: "启蒙数学",
    categoryEn: "Early math",
    keywords: [
      "计算练习",
      "100 以内加减",
      "九九表",
      "竖式计算",
      "口算练习",
      "题组练习",
      "每日一练",
      "A4 数学练习",
      "数学题打印",
      "小学低年级",
    ],
    icon: "calculator",
    accent: "amber",
    stage: "6 岁以上",
    format: "printable",
    domain: "math",
    estimatedMinutes: 15,
    skillAreas: ["加减计算", "竖式计算", "表内乘除", "检查验算", "数量关系", "应用题"],
    previewImage: "/kids/math-worksheet-preview.webp",
    order: 1,
    metadata: {
      title: "月度计算练习 - A4 双面题组与 PDF 打印",
      description: "为小学低年级孩子生成月度计算练习。默认 30 份、A4 双面，每份 25 道题、含一节生活应用题，题型轮换安排，连续四份不重复。练 100 以内加减与九九表，支持本份、范围及整月 PDF，在浏览器本地生成。",
    },
    seo: {
      heading: "月度计算练习在线生成与 A4 双面打印",
      summary: "每份 25 题含生活应用题，题型轮换，连续四份不重复。",
      intro: "一程一成长计算练习面向小学低年级孩子。默认每月 30 份，每份一张 A4 双面，每份 25 道题。每份 25 道题、固定含一节生活应用题（12 个场景：添进来、坐车、排队、日期、用掉、看页数、飞走、买东西、成盒、单价、平分、装盒）。其余题型轮换出现：直接写出得数、列式计算、填空、找错改正、连加连减、算完检查、比大小、一题多解、填符号、凑整再算、进几出几、数线移动、数的拆分。连续四份题型不重复。",
      features: [
        "每份一张 A4 双面，固定 25 题；加减在 100 以内，乘除只用九九表。",
        "每份都有一节生活应用题，12 个场景轮换：添进来、坐车、排队、日期、用掉、看页数、飞走、买东西、成盒、单价、平分、装盒。",
        "每份 4 个题块：3 块轮换题型 + 1 节生活应用题；连续四份的轮换题型不重复。",
        "列式计算留出位值对齐的竖式与答题区；检查题要求用另一个算式验算。",
        "题量与行高按页面自动分配，整页铺满，不留成片空白。",
        "表头按份号配两个角色图，给练习添点趣味。",
        "预览、打印与 PDF 共用同一份版面，正文不小于 14pt。",
        "纸面不附答案与解析，方便反复练。",
      ],
      steps: [
        "选择本月任意一份，用正面、反面按钮查看完整练习。",
        "让孩子直接写在横线、竖式和空格上；需要新题时点击「本份换一套」。",
        "点击「打印本份」，或导出本份、自选范围、整月 PDF。双面打印选择长边翻转。",
      ],
      h1: "月度计算练习",
      sections: [
        {
          heading: "每天练什么？",
          paragraphs: [
            "每份 25 题按题块分开练：先写出得数或列竖式，再填空、比大小、找错、检查，最后是一题多解、数线移动与应用题。题量按页面自动分配，一页写完大约 12～15 分钟。",
          ],
        },
        {
          heading: "一个月怎样安排",
          paragraphs: [
            "默认生成 30 份，选择实际年月时按该月的 28～31 天生成相应份数。轮换题型在连续四份之间不重复，四份走完 12 种；应用题每份固定一节。无难度阶段或跨日依赖，可以任意抽取，正反面都可先做。",
          ],
        },
        {
          heading: "A4 练习纸与本地处理",
          paragraphs: [
            "题目和 PDF 均在当前浏览器中生成，无需上传。每份两页，默认整月 30 份为 60 页；按第 1 份正反面、第 2 份正反面的顺序排列。换题会同步更新两面，整月导出保留最新内容。",
          ],
        },
      ],
      faqs: [
        {
          question: "每份有多少内容？",
          answer: "每份一张 A4 双面，固定 25 题，分 3～4 个题块。建议每份用 12～15 分钟，可分两次完成。",
        },
        {
          question: "可以换题吗？",
          answer: "可以。「本份换一套」会换掉这一份的题目，题型组合保持不变。「重新生成全部」在更多设置中，正反面可实时切换预览。",
        },
        {
          question: "需要哪些基础？",
          answer: "适合认识两位数、开始学加减竖式与九九表的小学低年级孩子（建议 6 岁以上）。练习包含进位与退位，乘除只用九九表内的数，除法必定整除。",
        },
        {
          question: "幼儿园中大班可以用吗？",
          answer: "不建议直接使用。幼儿园中大班的数范围通常在 10 以内，本练习是两位数加减、竖式书写与一次 25 道题的题量。建议进入小学低年级（6 岁以上）后再用。",
        },
        {
          question: "如何把练习保存成 PDF？",
          answer: "在「导出 PDF」中选择本份、自选范围或整月，再点击「下载 PDF」。也可点击「打印本份」，在浏览器打印窗口保存。正反两面都包含练习，不附解析或答案。",
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
  {
    slug: "spatial-blocks",
    path: "spatial-blocks",
    href: "/kids/spatial-blocks",
    component: "spatial-blocks",
    title: "空间积木",
    titleEn: "Spatial Blocks",
    shortTitle: "空间积木",
    shortTitleEn: "Spatial Blocks",
    summary: "沿着四座自然岛屿展开十二幕观察、预测和拼搭旅程。",
    description: "在自然岛屿中通过三视图、旋转和单位方块探究空间关系。",
    descriptionEn: "Explore spatial relationships by restoring four miniature block islands.",
    category: "空间探究",
    categoryEn: "Spatial exploration",
    keywords: ["空间积木", "儿童空间思维", "3D 积木", "立体拼搭", "单位方块", "空间关系", "儿童互动探究"],
    icon: "blocks",
    accent: "clay",
    stage: "4～7 岁",
    format: "interactive",
    domain: "spatial",
    activityId: "spatial-blocks",
    estimatedMinutes: 8,
    skillAreas: ["上下左右", "旋转观察", "空间组合", "自由创造"],
    previewImage: "/kids/spatial-blocks-preview.png",
    order: 1,
    metadata: {
      title: "空间积木 - 儿童 3D 空间拼搭探究",
      description: "面向 4～7 岁儿童的在线 3D 空间积木，通过观察、预测、验证和三视图比较，感受上下、左右、高低、支撑与遮挡关系。",
    },
    seo: {
      heading: "空间积木与自然岛屿拼搭",
      summary: "沿着四座自然岛屿的十二幕旅程，观察、预测、验证并比较空间关系。",
      intro: "空间积木把观察现象、做出预测、动手验证、换角度比较和环境恢复放进一组高空微缩自然岛屿。孩子可以转动视角、查看观察手册，再从托盘拿起单位方块。模块不设置分数和倒计时，完成状态仅归入当前登录儿童的本机探索足迹。",
      features: [
        "四座自然岛屿、十二幕递进旅程：从石阶、小桥到灯塔和花园。",
        "三维观察：围绕模型旋转，并在有限范围内缩放。",
        "观察手册：同步显示正面、侧面和顶部投影，点击视图即可转向。",
        "概念迁移工坊：完成四座岛后开放自由创造，不保存作品或标准答案。",
      ],
      steps: [
        "游客可以先观看自动演示，登录橙子小朋友账号后开始操作。",
        "从群岛地图进入一座岛，先观察和预测，再按观察手册换角度比较。",
        "在引导幕中跟着小山雀逐块搭建，在独立幕中自由试错并对照三视图。",
      ],
      h1: "空间积木",
      sections: [
        {
          heading: "为什么从单位方块开始？",
          paragraphs: ["单位方块具有稳定的长、宽、高，适合把上下、左右、前后和数量关系变成可以直接观察与操作的结构。"],
        },
        {
          heading: "观察、预测和验证怎样连起来？",
          paragraphs: ["每座岛分为发现、引导拼搭和独立验证三幕。观察手册把真实方块投影成正面、侧面和顶部图，孩子可以先猜，再拖动方块验证自己的想法。"],
        },
        {
          heading: "探索足迹如何保存？",
          paragraphs: ["只有登录后的十二幕互动旅程会在当前浏览器保存开始次数和完成状态。数学与拼音打印工具、游客演示和自由创造岛都不会写入这些记录。"],
        },
      ],
      faqs: [
        { question: "不登录可以使用空间积木吗？", answer: "游客可以观看自动拼搭演示；输入橙子测试账号登录后，才能转动视角和完成关卡。" },
        { question: "自由创造岛会保存作品吗？", answer: "当前验证版不会保存或上传作品，离开页面后自由搭建内容会清空。" },
        { question: "空间积木会影响数学和拼音练习吗？", answer: "不会。数学和拼音仍是独立的无状态打印工具，不读取或写入空间积木探索足迹。" },
      ],
    },
  },
  {
    slug: "english-catalog",
    path: "english-catalog",
    href: "/kids/catalog",
    component: "static-site",
    title: "英语晨读目录",
    titleEn: "English Reading Catalog",
    shortTitle: "晨读目录",
    shortTitleEn: "Reading Catalog",
    summary: "八个板块、800+ 节中英对照晨读，按封面整理，可搜索、阅读并导出 PDF。",
    description: "浏览低幼启蒙、日常表达、科普等板块的英语晨读封面与正文。",
    descriptionEn: "Browse bilingual morning reading lessons with covers, search, and PDF export.",
    category: "英语晨读",
    categoryEn: "English reading",
    keywords: ["英语晨读", "中英对照", "儿童英语", "启蒙英语", "每日晨读", "英语阅读目录"],
    icon: "book-open",
    accent: "teal",
    stage: "4～12 岁",
    format: "library",
    domain: "english",
    estimatedMinutes: 10,
    skillAreas: ["英语朗读", "中英对照", "分板块浏览", "PDF 导出"],
    previewImage: "/kids/catalog-preview.webp",
    order: 1,
    metadata: {
      title: "英语晨读目录 - 中英对照阅读与搜索",
      description: "在一程一成长中浏览八个板块的英语晨读课程，查看封面与中英正文，支持全文搜索与单课 PDF 导出。",
    },
    seo: {
      heading: "英语晨读目录在线浏览",
      summary: "按板块浏览晨读封面，点开即可看中英对照正文。",
      intro: "英语晨读目录汇总多个板块的封面与整理后的中英句子，适合家庭晨读前先选篇、再朗读。内容在浏览器本地加载，无需额外登录。",
      features: [
        "865 节课程卡片，按板块与节次排序。",
        "全文搜索标题与正文关键词。",
        "阅读页支持导出 PDF，方便打印。",
      ],
      steps: [
        "从首页进入英语晨读目录。",
        "用板块筛选或搜索找到想读的一篇。",
        "点击卡片阅读中英正文，需要时可导出 PDF。",
      ],
      h1: "英语晨读目录",
      sections: [],
      faqs: [
        { question: "需要登录吗？", answer: "不需要。目录与阅读页在浏览器中直接打开即可使用。" },
        { question: "和数学、拼音工具有数据互通吗？", answer: "不会。晨读目录是独立的静态阅读模块，不读取其他工具的使用记录。" },
      ],
    },
  },
];

export function getKidsToolByPath(path: string): KidsToolDefinition | undefined {
  return kidsToolDefinitions.find((tool) => {
    if (tool.component === "static-site") {
      return tool.path === path;
    }
    return tool.path === path || tool.href === `/kids/${path}`;
  });
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
