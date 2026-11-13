import type { DrillItem, DrillOperator, WordData, WordScene } from "./types";

/** 一份一个完整故事，预留阅读、列式和写答句的空间。 */
export const WORD_LAYOUT = { columns: 1, rowHeight: 66, maxItems: 1 } as const;
export const WORD_TITLE = "应用题";
export const WORD_INSTRUCTION = "读一读，列式算出来。";

const integer = (random: () => number, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1));

/** 一个生活场景：题面用 a、b 两个数，两个数的范围按场景定。 */
interface WordTemplate {
  operator: DrillOperator;
  scene: WordScene;
  title: string;
  /** a 的下限、上限，b 的下限、上限。除法时 a 是要分的那个数。 */
  range: readonly [number, number, number, number];
  text: (a: number, b: number) => string;
}

/**
 * 40 个小故事各用一幅情景图，四则运算交错出现。
 * 每题都有具体物品和动作；均分先定份数与每份数，保证整除。
 */
const TEMPLATES: readonly WordTemplate[] = [
  { operator: "+", scene: "garden", title: "小兔种花", range: [16, 68, 12, 28],
    text: (a, b) => `小兔在花园里种了 ${a} 朵向日葵，又种了 ${b} 朵。花园里现在一共有多少朵向日葵？` },
  { operator: "-", scene: "library", title: "图书角借书", range: [36, 96, 14, 30],
    text: (a, b) => `班级图书角原来有 ${a} 本故事书，同学们借走了 ${b} 本。图书角还剩多少本故事书？` },
  { operator: "×", scene: "balloons", title: "生日气球", range: [3, 9, 3, 9],
    text: (a, b) => `小熊布置生日会，每束扎 ${a} 个气球，一共扎了 ${b} 束。布置生日会用了多少个气球？` },
  { operator: "÷", scene: "picnic", title: "野餐分饼干", range: [3, 9, 3, 9],
    text: (a, b) => `野餐时，小猫把 ${a} 块饼干平均分给 ${b} 个小伙伴。每个小伙伴能分到几块饼干？` },
  { operator: "+", scene: "aquarium", title: "水族馆添鱼", range: [16, 68, 12, 28],
    text: (a, b) => `水族馆的鱼缸里原来有 ${a} 条小鱼，管理员又放进 ${b} 条。鱼缸里现在有多少条小鱼？` },
  { operator: "-", scene: "pond", title: "池塘里的小鸭", range: [30, 60, 12, 25],
    text: (a, b) => `池塘里原来有 ${a} 只小鸭，其中 ${b} 只游到了岸边。池塘里还剩多少只小鸭？` },
  { operator: "×", scene: "blocks", title: "搭积木火车", range: [3, 9, 3, 9],
    text: (a, b) => `小象用积木搭小火车，每节车厢用 ${a} 块积木，一共搭了 ${b} 节。搭车厢用了多少块积木？` },
  { operator: "÷", scene: "sports", title: "体育课收球", range: [3, 9, 3, 9],
    text: (a, b) => `体育课后，老师把 ${a} 个皮球平均装进 ${b} 个球筐。每个球筐里有多少个皮球？` },
  { operator: "+", scene: "bus", title: "一起坐公交", range: [16, 40, 12, 20],
    text: (a, b) => `公交车上原来有 ${a} 位乘客，到学校站时又上来 ${b} 位。车上现在一共有多少位乘客？` },
  { operator: "-", scene: "florist", title: "花店送祝福", range: [36, 96, 14, 30],
    text: (a, b) => `花店准备了 ${a} 朵鲜花，顾客买走了 ${b} 朵。花店里还剩多少朵鲜花？` },
  { operator: "×", scene: "toyshop", title: "玩具店买球", range: [2, 9, 2, 9],
    text: (a, b) => `玩具店里每个小皮球卖 ${a} 元，小猴想买 ${b} 个送给朋友。一共需要付多少元？` },
  { operator: "÷", scene: "lanterns", title: "元宵挂花灯", range: [3, 9, 3, 9],
    text: (a, b) => `元宵节，小鹿把 ${a} 盏花灯平均挂在 ${b} 根彩绳上。每根彩绳上挂几盏花灯？` },
  { operator: "+", scene: "calendar", title: "日历上的约定", range: [1, 18, 5, 9],
    text: (a, b) => `夏令营从本月 ${a} 日开始，再过 ${b} 天就是闭营日。闭营日是本月几日？` },
  { operator: "-", scene: "bakery", title: "面包店开门啦", range: [36, 96, 14, 30],
    text: (a, b) => `面包店早上烤好 ${a} 个面包，上午卖出了 ${b} 个。店里还剩多少个面包？` },
  { operator: "×", scene: "farm", title: "农场小鸡回家", range: [2, 9, 2, 9],
    text: (a, b) => `农场里有 ${b} 间鸡舍，每间住着 ${a} 只小鸡。农场里一共有多少只小鸡？` },
  { operator: "÷", scene: "crafts", title: "彩珠做手链", range: [3, 9, 3, 9],
    text: (a, b) => `手工课上，老师把 ${a} 颗彩珠平均分给 ${b} 个小朋友。每个小朋友分到几颗彩珠？` },
  { operator: "+", scene: "stickers", title: "比比谁的贴纸多", range: [12, 52, 6, 22],
    text: (a, b) => `小兔有 ${a} 张星星贴纸，小熊的贴纸比小兔多 ${b} 张。小熊有多少张星星贴纸？` },
  { operator: "-", scene: "market", title: "菜市场买蔬菜", range: [40, 100, 15, 38],
    text: (a, b) => `小鹿带了 ${a} 元去菜市场，买蔬菜花了 ${b} 元。小鹿还剩多少元？` },
  { operator: "×", scene: "camping", title: "一起去露营", range: [2, 9, 2, 9],
    text: (a, b) => `小熊准备了 ${b} 顶帐篷，每顶能住 ${a} 人。所有帐篷一共能住多少人？` },
  { operator: "÷", scene: "artroom", title: "美术教室分画笔", range: [3, 9, 3, 9],
    text: (a, b) => `美术课上，老师把 ${a} 支画笔平均放进 ${b} 个笔筒。每个笔筒里有多少支画笔？` },
  { operator: "+", scene: "forest", title: "森林采蘑菇", range: [16, 68, 12, 28],
    text: (a, b) => `小松鼠去森林采蘑菇，上午采了 ${a} 个，下午又采了 ${b} 个。它一天一共采了多少个蘑菇？` },
  { operator: "-", scene: "postoffice", title: "邮递员送信", range: [36, 96, 14, 30],
    text: (a, b) => `邮递员今天要送 ${a} 封信，上午已经送出 ${b} 封。还有多少封信没有送到？` },
  { operator: "×", scene: "playground", title: "游乐场荡秋千", range: [2, 4, 2, 9],
    text: (a, b) => `游乐场里有 ${b} 架秋千，每架能坐 ${a} 位小朋友。一共能坐多少位小朋友？` },
  { operator: "÷", scene: "kitchen", title: "奶奶包饺子", range: [3, 9, 3, 9],
    text: (a, b) => `奶奶包了 ${a} 个饺子，平均放进 ${b} 个盘子。每个盘子里放多少个饺子？` },
  { operator: "+", scene: "orchard", title: "果园摘苹果", range: [16, 68, 12, 28],
    text: (a, b) => `果园里，小熊上午摘了 ${a} 个苹果，下午又摘了 ${b} 个。它一天一共摘了多少个苹果？` },
  { operator: "-", scene: "theater", title: "小剧场找座位", range: [36, 96, 14, 30],
    text: (a, b) => `小剧场一共有 ${a} 个座位，已经坐了 ${b} 位观众。还有多少个空座位？` },
  { operator: "×", scene: "cinema", title: "周末看电影", range: [2, 9, 2, 9],
    text: (a, b) => `周末看电影，每张儿童票 ${a} 元，小鹿和朋友一共买 ${b} 张。一共需要付多少元？` },
  { operator: "÷", scene: "beach", title: "海边捡贝壳", range: [3, 9, 3, 9],
    text: (a, b) => `海边寻宝时，小兔捡了 ${a} 枚贝壳，平均分给 ${b} 个伙伴。每个伙伴能分到几枚贝壳？` },
  { operator: "+", scene: "reading", title: "童话阅读时光", range: [12, 52, 6, 22],
    text: (a, b) => `小熊读一本童话书，昨天读了 ${a} 页，今天又读了 ${b} 页。两天一共读了多少页？` },
  { operator: "-", scene: "ferriswheel", title: "摩天轮转一圈", range: [30, 60, 12, 25],
    text: (a, b) => `摩天轮上原来有 ${a} 位游客，到站后下来了 ${b} 位。摩天轮上还剩多少位游客？` },
  { operator: "×", scene: "stationeries", title: "文具店买铅笔", range: [2, 9, 2, 9],
    text: (a, b) => `文具店每盒装 ${a} 支铅笔，老师买了 ${b} 盒。一共买了多少支铅笔？` },
  { operator: "÷", scene: "music", title: "音乐课分沙锤", range: [3, 9, 3, 9],
    text: (a, b) => `音乐课上，老师把 ${a} 只沙锤平均分给 ${b} 个小组。每个小组有几只沙锤？` },
  { operator: "+", scene: "planetarium", title: "天文馆数星星", range: [16, 68, 12, 28],
    text: (a, b) => `天文馆的展板上原来有 ${a} 颗星星模型，又添了 ${b} 颗。现在一共有多少颗星星模型？` },
  { operator: "-", scene: "sportsday", title: "运动会发奖牌", range: [36, 96, 14, 30],
    text: (a, b) => `运动会准备了 ${a} 枚奖牌，已经发出了 ${b} 枚。还剩多少枚奖牌没有发？` },
  { operator: "×", scene: "supermarket", title: "超市买牛奶", range: [2, 9, 2, 9],
    text: (a, b) => `超市里每瓶牛奶 ${a} 元，妈妈买了 ${b} 瓶。一共需要付多少元？` },
  { operator: "÷", scene: "recycling", title: "回收空瓶子", range: [3, 9, 3, 9],
    text: (a, b) => `回收站收到了 ${a} 个空瓶子，把它们平均装进 ${b} 个回收箱。每个箱子装多少个空瓶子？` },
  { operator: "+", scene: "zoo", title: "动物园迎游客", range: [16, 68, 12, 28],
    text: (a, b) => `动物园上午来了 ${a} 位游客，下午又来了 ${b} 位。今天一共来了多少位游客？` },
  { operator: "-", scene: "museum", title: "博物馆发参观券", range: [36, 96, 14, 30],
    text: (a, b) => `博物馆准备了 ${a} 张参观券，已经发出了 ${b} 张。还剩多少张参观券？` },
  { operator: "×", scene: "train", title: "观光小火车", range: [2, 9, 2, 9],
    text: (a, b) => `观光小火车有 ${b} 节车厢，每节能坐 ${a} 位小朋友。一共能坐多少位小朋友？` },
  { operator: "÷", scene: "party", title: "生日会分蛋糕", range: [3, 9, 3, 9],
    text: (a, b) => `生日会上，小熊把 ${a} 块小蛋糕平均放进 ${b} 个点心盒。每盒放几块小蛋糕？` },
];

export function createWordItem(random: () => number, id: string, templateIndex?: number): DrillItem {
  const story = templateIndex === undefined ? integer(random, 0, TEMPLATES.length - 1)
    : ((Math.trunc(templateIndex) % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length;
  const template = TEMPLATES[story];
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const [aLow, aHigh, bLow, bHigh] = template.range;
    const operator = template.operator;
    let a: number, b: number, value: number;
    if (operator === "÷") {
      // 先定份数与每份数，再算出要分的那个数，保证整除。
      b = integer(random, bLow, bHigh);
      const per = integer(random, aLow, aHigh);
      a = b * per;
      value = per;
    } else {
      a = integer(random, aLow, aHigh);
      b = integer(random, bLow, bHigh);
      value = operator === "+" ? a + b : operator === "-" ? a - b : a * b;
    }
    const data: WordData = {
      kind: "word", operator, a, b, text: template.text(a, b), value,
      story, scene: template.scene, sceneTitle: template.title,
    };
    const item: DrillItem = { id, data, answer: { kind: "word", value } };
    if (validateWordItem(item)) return item;
  }
  throw new Error("暂时无法生成合法的应用题材料");
}

export function evaluateWord(data: WordData): number {
  if (data.operator === "+") return data.a + data.b;
  if (data.operator === "-") return data.a - data.b;
  if (data.operator === "×") return data.a * data.b;
  return data.a / data.b;
}

export function validateWordItem(item: DrillItem): boolean {
  const { data, answer } = item;
  if (data.kind !== "word" || answer.kind !== "word") return false;
  if (![data.a, data.b, data.value, answer.value].every((n) => Number.isInteger(n) && n >= 0 && n <= 100)) return false;
  if (data.operator === "+" && (data.a < 1 || data.b < 5 || data.a + data.b > 100)) return false;
  if (data.operator === "-" && (data.a < 30 || data.b < 12 || data.a - data.b < 5)) return false;
  if (data.operator === "×" && (data.a < 2 || data.a > 9 || data.b < 2 || data.b > 9)) return false;
  if (data.operator === "÷" && (data.b < 3 || data.b > 9 || data.a % data.b !== 0 || data.a > 81)) return false;
  if (evaluateWord(data) !== data.value) return false;
  // 题面里必须出现这两个数，孩子才有得可算。
  if (!data.text.includes(String(data.a)) || !data.text.includes(String(data.b))) return false;
  const template = TEMPLATES[data.story];
  if (!template) return false;
  const [aLow, aHigh, bLow, bHigh] = template.range;
  const first = data.operator === "÷" ? data.value : data.a;
  // 场景的取数边界同样参与验题，例如日历不能算出不存在的日期。
  if (first < aLow || first > aHigh || data.b < bLow || data.b > bHigh) return false;
  return answer.value === data.value && data.text.length <= 66
    && data.operator === template.operator && data.scene === template.scene
    && data.sceneTitle === template.title && data.text === template.text(data.a, data.b);
}

export function wordText(data: WordData): string {
  return data.text;
}

/** 生活场景的种数，测试与文案会引用。 */
export const WORD_TEMPLATE_COUNT = TEMPLATES.length;
