"use client";

import {
  Check,
  Dices,
  Languages,
  Maximize2,
  Minus,
  Minimize2,
  Plus,
  Printer,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import {
  createEmptyPinyinProgress,
  createPinyinWorksheet,
  DEFAULT_PINYIN_WORKSHEET_CONFIG,
  getPinyinItem,
  getPinyinPictureCandidates,
  getPinyinProgressCounts,
  getRecommendedPinyinItem,
  getToneForms,
  markPinyinCompleted,
  MAX_PINYIN_CORE_QUESTIONS,
  MAX_PINYIN_TRACE_ROWS,
  normalizePinyinConfig,
  parsePinyinProgress,
  PINYIN_ITEMS,
  PINYIN_PRACTICE_PRESETS,
  PINYIN_PROGRESS_STORAGE_KEY,
  serializePinyinProgress,
  type PinyinCategory,
  type PinyinItem,
  type PinyinPictureAsset,
  type PinyinPracticeLevel,
  type PinyinPrintPage,
  type PinyinProgressV1,
  type PinyinQuestion,
  type PinyinWorksheet,
  type PinyinWorksheetConfig,
  type PinyinWorksheetSection,
} from "@/lib/tools/pinyin-worksheet";
import type { KidsToolDefinition } from "@/lib/tools/kids-registry";

import { KidsShell } from "./kids-shell";
import styles from "./pinyin-worksheet-workspace.module.css";

type StatusTone = "idle" | "success" | "error";
type CategoryTab = Extract<PinyinCategory, "initial" | "final" | "whole-syllable">;
type ConfigKey = "traceRows" | "coreCount";

interface StatusMessage {
  tone: StatusTone;
  text: string;
}

const INITIAL_SEED = 20260905;

const CATEGORY_TABS: readonly { key: CategoryTab; label: string; description: string }[] = [
  { key: "initial", label: "声母", description: "23 个" },
  { key: "final", label: "韵母", description: "24 个" },
  { key: "whole-syllable", label: "整体认读", description: "16 个" },
];

const PICTURE_SOURCES: Record<PinyinPictureAsset, string> = {
  apple: "/math-worksheet/objects/apple.svg",
  ball: "/math-worksheet/objects/ball.svg",
  balloon: "/math-worksheet/objects/balloon.svg",
  birthday: "/pinyin-worksheet/objects/birthday.svg",
  bird: "/pinyin-worksheet/objects/bird.svg",
  block: "/pinyin-worksheet/objects/blocks.svg",
  book: "/math-worksheet/objects/book.svg",
  bowl: "/pinyin-worksheet/objects/bowl.svg",
  box: "/pinyin-worksheet/objects/box.svg",
  calendar: "/pinyin-worksheet/objects/calendar.svg",
  car: "/pinyin-worksheet/objects/car.svg",
  cat: "/pinyin-worksheet/objects/cat.svg",
  chair: "/pinyin-worksheet/objects/chair.svg",
  children: "/pinyin-worksheet/objects/children.svg",
  circle: "/pinyin-worksheet/objects/circle.svg",
  clover: "/pinyin-worksheet/objects/clover.svg",
  clothes: "/pinyin-worksheet/objects/clothes.svg",
  cloud: "/pinyin-worksheet/objects/cloud.svg",
  cloudyDay: "/pinyin-worksheet/objects/cloudy-day.svg",
  coconut: "/pinyin-worksheet/objects/coconut.svg",
  coin: "/math-worksheet/objects/coin.svg",
  corn: "/pinyin-worksheet/objects/corn.svg",
  cookie: "/math-worksheet/objects/cookie.svg",
  cow: "/pinyin-worksheet/objects/cow.svg",
  cup: "/pinyin-worksheet/objects/cup.svg",
  darkCloud: "/pinyin-worksheet/objects/dark-cloud.svg",
  dinosaur: "/pinyin-worksheet/objects/dinosaur.svg",
  doctor: "/pinyin-worksheet/objects/doctor.svg",
  dog: "/pinyin-worksheet/objects/dog.svg",
  door: "/pinyin-worksheet/objects/door.svg",
  drink: "/pinyin-worksheet/objects/drink.svg",
  driver: "/pinyin-worksheet/objects/driver.svg",
  duck: "/pinyin-worksheet/objects/duck.svg",
  ear: "/pinyin-worksheet/objects/ear.svg",
  exercise: "/pinyin-worksheet/objects/exercise.svg",
  feather: "/pinyin-worksheet/objects/feather.svg",
  fish: "/math-worksheet/objects/fish.svg",
  firefly: "/pinyin-worksheet/objects/firefly.svg",
  flower: "/math-worksheet/objects/flower.svg",
  fountain: "/pinyin-worksheet/objects/fountain.svg",
  goose: "/pinyin-worksheet/objects/goose.svg",
  grapes: "/pinyin-worksheet/objects/grapes.svg",
  hand: "/pinyin-worksheet/objects/hand.svg",
  heart: "/math-worksheet/objects/heart.svg",
  hedgehog: "/pinyin-worksheet/objects/hedgehog.svg",
  headphones: "/pinyin-worksheet/objects/headphones.svg",
  house: "/pinyin-worksheet/objects/house.svg",
  insect: "/pinyin-worksheet/objects/insect.svg",
  juice: "/pinyin-worksheet/objects/juice.svg",
  jump: "/pinyin-worksheet/objects/jump.svg",
  leaf: "/pinyin-worksheet/objects/leaf.svg",
  lion: "/pinyin-worksheet/objects/lion.svg",
  magnet: "/pinyin-worksheet/objects/magnet.svg",
  meal: "/pinyin-worksheet/objects/meal.svg",
  moon: "/pinyin-worksheet/objects/moon.svg",
  mooncake: "/pinyin-worksheet/objects/mooncake.svg",
  mushroom: "/math-worksheet/objects/mushroom.svg",
  music: "/pinyin-worksheet/objects/music.svg",
  orange: "/pinyin-worksheet/objects/orange.svg",
  paper: "/pinyin-worksheet/objects/paper.svg",
  pants: "/pinyin-worksheet/objects/pants.svg",
  park: "/pinyin-worksheet/objects/park.svg",
  parrot: "/pinyin-worksheet/objects/parrot.svg",
  persimmon: "/pinyin-worksheet/objects/persimmon.svg",
  pineapple: "/math-worksheet/objects/pineapple.svg",
  rabbit: "/pinyin-worksheet/objects/rabbit.svg",
  rainbowCloud: "/pinyin-worksheet/objects/rainbow-cloud.svg",
  ribbon: "/pinyin-worksheet/objects/ribbon.svg",
  roundTable: "/pinyin-worksheet/objects/round-table.svg",
  ruler: "/pinyin-worksheet/objects/ruler.svg",
  seeds: "/pinyin-worksheet/objects/seeds.svg",
  sheep: "/pinyin-worksheet/objects/sheep.svg",
  ship: "/pinyin-worksheet/objects/ship.svg",
  shield: "/pinyin-worksheet/objects/shield.svg",
  spider: "/pinyin-worksheet/objects/spider.svg",
  sprout: "/pinyin-worksheet/objects/sprout.svg",
  star: "/math-worksheet/objects/star.svg",
  stone: "/pinyin-worksheet/objects/stone.svg",
  sun: "/pinyin-worksheet/objects/sun.svg",
  sunrise: "/pinyin-worksheet/objects/sunrise.svg",
  thunder: "/pinyin-worksheet/objects/thunder.svg",
  turtle: "/pinyin-worksheet/objects/turtle.svg",
  umbrella: "/pinyin-worksheet/objects/umbrella.svg",
  water: "/pinyin-worksheet/objects/water.svg",
  watermelon: "/pinyin-worksheet/objects/watermelon.svg",
  wings: "/pinyin-worksheet/objects/wings.svg",
  wind: "/pinyin-worksheet/objects/wind.svg",
};

const ALL_PICTURE_ASSETS = Object.values(PICTURE_SOURCES);

function getItemCategoryLabel(category: PinyinCategory) {
  if (category === "initial") return "声母";
  if (category === "final") return "韵母";
  return "整体认读音节";
}

function getItemList(category: CategoryTab) {
  return PINYIN_ITEMS.filter((item) => item.category === category);
}

function getTraceForms(item: PinyinItem) {
  if (!item.toneCapable) return [item.display];
  return getToneForms(item.display).slice(0, 5);
}

function PinyinPicture({ asset, className }: { asset: PinyinPictureAsset; className?: string }) {
  return <img className={className ?? styles.pictureAsset} src={PICTURE_SOURCES[asset]} alt="" draggable="false" />;
}

function SectionHeading({ title, continued }: { title: string; continued: boolean }) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.sectionRule} aria-hidden="true" />
      <h3>{title}{continued ? " · 接上页" : ""}</h3>
    </div>
  );
}

function TraceSection({ item, rows, continued, startNumber }: { item: PinyinItem; rows: number; continued: boolean; startNumber: number }) {
  const forms = getTraceForms(item);
  const symbolLength = item.display.length;
  const cellCount = symbolLength >= 3 ? 4 : symbolLength === 2 ? 7 : 9;
  const guideCellCount = symbolLength >= 3 ? 2 : 3;
  const gridStyle = { "--trace-columns": String(cellCount) } as CSSProperties;
  return (
    <section className={styles.traceSection} data-testid="pinyin-trace-section" data-trace-rows={rows}>
      <SectionHeading title="看一看，写一写" continued={continued} />
      <div className={styles.traceIntro}>
        <strong>{item.display}</strong>
        <span>{item.toneCapable ? "读一读四声，再写一写" : "照着样子写一写"}</span>
        {item.toneCapable ? (
          <div className={styles.toneStrip} aria-label={`${item.display} 的四声`}>
            {forms.slice(1).map((form) => <span key={form}>{form}</span>)}
          </div>
        ) : null}
      </div>
      <div className={styles.traceRows}>
        {Array.from({ length: rows }, (_, rowIndex) => {
          // 每行只练一个字形，避免同一行的示范字与描红字出现不同声调。
          const rowForm = item.toneCapable ? forms[rowIndex % forms.length] ?? item.display : item.display;
          return (
            <div className={styles.traceRow} key={rowIndex}>
              <span className={styles.traceRowNumber}>{startNumber + rowIndex}</span>
              <div className={styles.traceGrid} style={gridStyle} data-testid="pinyin-grid-row">
                {Array.from({ length: cellCount }, (_, cellIndex) => {
                  // 长音节减少示范格数量，避免字形跨格，同时保留足够的独立书写格。
                  return (
                    <span className={`${styles.traceCell} ${cellIndex === 0 ? styles.traceSample : cellIndex < guideCellCount ? styles.traceGuide : ""}`} key={cellIndex}>
                      {cellIndex < guideCellCount ? rowForm : null}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChoiceDots({ options }: { options: readonly string[] }) {
  return (
    <div className={styles.choiceDots}>
      {options.map((option, index) => <span className={styles.choiceDot} key={`${option}-${index}`}><i aria-hidden="true" />{option}</span>)}
    </div>
  );
}

function BlendQuestionView({ question, number }: { question: Extract<PinyinQuestion, { kind: "blend" }>; number: number }) {
  return (
    <div className={styles.blendQuestion} data-type="blend" data-mode={question.mode}>
      <span className={styles.questionNumber}>{number}</span>
      <div className={styles.blendLine}>
        <div className={styles.blendComponents}>
          {question.components.map((component, componentIndex) => (
            <span className={styles.blendComponent} key={`${component}-${componentIndex}`}>
              {component}
              {componentIndex < question.components.length - 1 ? <b aria-hidden="true">·</b> : null}
            </span>
          ))}
          <strong aria-hidden="true">→</strong>
          <span className={styles.answerBlank} aria-label="填写音节" />
        </div>
        <ChoiceDots options={question.options} />
      </div>
    </div>
  );
}

function RecognitionQuestionView({ question, number }: { question: Extract<PinyinQuestion, { kind: "recognition" }>; number: number }) {
  return (
    <div className={styles.recognitionQuestion} data-type="recognition">
      <span className={styles.questionNumber}>{number}</span>
      <div>
        <strong>{question.prompt}</strong>
        <ChoiceDots options={question.options} />
      </div>
    </div>
  );
}

function ContrastQuestionView({ question, number }: { question: Extract<PinyinQuestion, { kind: "contrast" }>; number: number }) {
  return (
    <div className={styles.contrastQuestion} data-type="contrast" data-rule={question.rule}>
      <span className={styles.questionNumber}>{number}</span>
      <div>
        <strong>{question.prompt}</strong>
        <ChoiceDots options={question.options} />
      </div>
    </div>
  );
}

function BlendSection({ questions, title, continued, startNumber }: { questions: readonly PinyinQuestion[]; title: string; continued: boolean; startNumber: number }) {
  return (
    <section className={styles.blendSection} data-testid="pinyin-blend-section">
      <SectionHeading title={title} continued={continued} />
      <div className={styles.blendGrid}>
        {questions.map((question, index) => question.kind === "blend"
          ? <BlendQuestionView number={startNumber + index} key={question.id} question={question} />
          : question.kind === "recognition"
            ? <RecognitionQuestionView number={startNumber + index} key={question.id} question={question} />
            : question.kind === "contrast" ? <ContrastQuestionView number={startNumber + index} key={question.id} question={question} /> : null)}
      </div>
    </section>
  );
}

function PictureQuestionView({ question, number }: { question: Extract<PinyinQuestion, { kind: "picture" }>; number: number }) {
  return (
    <div className={styles.pictureQuestion} data-type="picture">
      <span className={styles.questionNumber}>{number}</span>
      <div className={styles.pictureObject}><PinyinPicture asset={question.asset} /><span>{question.label}</span></div>
      <div className={styles.picturePrompt}><span>圈出图片的读音（含 <b>{question.targetDisplay}</b>）</span><ChoiceDots options={question.options} /></div>
    </div>
  );
}

function PictureSection({ questions, continued, startNumber }: { questions: readonly PinyinQuestion[]; continued: boolean; startNumber: number }) {
  return (
    <section className={styles.pictureSection} data-testid="pinyin-picture-section">
      <SectionHeading title="看图选音节" continued={continued} />
      <div className={styles.pictureGrid}>
        {questions.map((question, index) => question.kind === "picture" ? <PictureQuestionView number={startNumber + index} key={question.id} question={question} /> : null)}
      </div>
    </section>
  );
}

function getSectionExerciseCount(section: PinyinWorksheetSection, fallbackTraceRows: number) {
  return section.type === "trace" ? section.traceRows ?? fallbackTraceRows : section.questions.length;
}

function PinyinPaper({ worksheet, page, printCopy }: { worksheet: PinyinWorksheet; page: PinyinPrintPage; printCopy?: boolean }) {
  const stageLabel = getItemCategoryLabel(worksheet.item.category);
  let exerciseOffset = worksheet.pages
    .slice(0, page.pageNumber - 1)
    .flatMap((previousPage) => previousPage.sections)
    .reduce((total, section) => total + getSectionExerciseCount(section, worksheet.config.traceRows), 0);
  return (
    <article
      className={styles.paper}
      data-testid={printCopy ? undefined : "pinyin-worksheet-paper"}
      data-page={page.pageNumber}
      data-page-count={page.pageCount}
      data-used-height={page.usedHeightMm}
      data-print-copy={printCopy || undefined}
      data-print-side={printCopy ? (page.pageNumber === 1 ? "front" : "back") : undefined}
      aria-label={`${worksheet.item.display} 拼音练习第 ${page.pageNumber} 页`}
    >
      <header className={styles.paperHeader}>
        <div className={styles.paperTitle}>
          <span>一程一成长</span>
          <h2>拼音练习</h2>
          <strong>{stageLabel} · {worksheet.item.display}</strong>
        </div>
        <div className={styles.paperTarget} aria-label={`今天练习 ${worksheet.item.display}`}>
          <small>今天练</small>
          <b>{worksheet.item.display}</b>
        </div>
        <div className={styles.paperFields}><span>姓名</span><i /><span>日期</span><i /></div>
      </header>
      <div className={styles.paperBody} data-testid={printCopy ? undefined : "pinyin-paper-body"}>
        {page.sections.map((section, index) => {
          const startNumber = exerciseOffset + 1;
          exerciseOffset += getSectionExerciseCount(section, worksheet.config.traceRows);
          if (section.type === "trace") return <TraceSection item={worksheet.item} rows={section.traceRows ?? worksheet.config.traceRows} continued={section.continued} startNumber={startNumber} key={`trace-${index}`} />;
          if (section.type === "blend") return <BlendSection questions={section.questions} title={section.title} continued={section.continued} startNumber={startNumber} key={`blend-${index}`} />;
          return <PictureSection questions={section.questions} continued={section.continued} startNumber={startNumber} key={`picture-${index}`} />;
        })}
      </div>
      <footer className={styles.paperFooter}>
        <span>家庭自用 · 不替代教学</span>
        <span>第 {page.pageNumber} / {page.pageCount} 页 · 一天一小步</span>
      </footer>
    </article>
  );
}

function PinyinBlankBack({ pageNumber }: { pageNumber: number }) {
  return <article className={`${styles.paper} ${styles.blankPaper}`} data-print-copy="true" data-blank="true" data-print-side="back" aria-label={`第 ${pageNumber} 页空白背面`}><span className={styles.blankMark}>双面打印留白</span></article>;
}

function ConfigStepper({ label, value, min, max, unit, onChange, testId }: { label: string; value: number; min: number; max: number; unit: "行" | "题"; onChange: (value: number) => void; testId: string }) {
  return (
    <div className={styles.configStepper} data-testid={testId} data-value={value}>
      <span>{label}</span>
      <div>
        <button type="button" aria-label={`减少${label}`} title={`减少${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus aria-hidden="true" size={14} /></button>
        <output aria-label={`${label}数量`}>{value}<small>{unit}</small></output>
        <button type="button" aria-label={`增加${label}`} title={`增加${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus aria-hidden="true" size={14} /></button>
      </div>
    </div>
  );
}

function PinyinWorksheetWorkspaceContent({ definition }: { definition: KidsToolDefinition }) {
  const seedRef = useRef(INITIAL_SEED);
  const firstItem = getPinyinItem("final-a") ?? PINYIN_ITEMS[0] as PinyinItem;
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("final");
  const [selectedItemId, setSelectedItemId] = useState(firstItem.id);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [config, setConfig] = useState<PinyinWorksheetConfig>(DEFAULT_PINYIN_WORKSHEET_CONFIG);
  const [worksheet, setWorksheet] = useState<PinyinWorksheet>(() => createPinyinWorksheet(firstItem.id, INITIAL_SEED, DEFAULT_PINYIN_WORKSHEET_CONFIG));
  const [progress, setProgress] = useState<PinyinProgressV1>(createEmptyPinyinProgress);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", text: "选一个拼音项目，开始今天的一小步" });
  const selectedItem = getPinyinItem(selectedItemId) ?? firstItem;
  const selectedPage = worksheet.pages[previewPageIndex] ?? worksheet.pages[0];
  const recommendedItem = useMemo(() => getRecommendedPinyinItem(progress) ?? firstItem, [progress, firstItem]);
  const progressCounts = useMemo(() => getPinyinProgressCounts(progress), [progress]);
  const pictureCandidates = useMemo(() => getPinyinPictureCandidates(selectedItem), [selectedItem]);
  const activePreset = PINYIN_PRACTICE_PRESETS[config.practiceLevel];
  const hasCustomCounts = config.traceRows !== activePreset.traceRows || config.coreCount !== activePreset.coreCount;
  const visibleItems = getItemList(activeCategory);
  const contentPages = worksheet.pages.length;
  const printPages = contentPages % 2 === 1 ? contentPages + 1 : contentPages;

  useEffect(() => {
    try {
      setProgress(parsePinyinProgress(window.localStorage.getItem(PINYIN_PROGRESS_STORAGE_KEY)));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, []);

  const nextSeed = () => {
    seedRef.current += 7919;
    return seedRef.current;
  };

  const regenerate = (nextConfig = config, nextItemId = selectedItemId, message = "练习纸已更新") => {
    setWorksheet(createPinyinWorksheet(nextItemId, nextSeed(), nextConfig));
    setPreviewPageIndex(0);
    setStatus({ tone: "success", text: message });
  };

  const selectItem = (item: PinyinItem) => {
    setSelectedItemId(item.id);
    if (item.category !== activeCategory) setActiveCategory(item.category);
    regenerate(config, item.id, `已选择 ${item.display}，练习纸准备好了`);
  };

  const selectRecommended = () => {
    selectItem(recommendedItem);
    setStatus({ tone: "success", text: `今日推荐：${recommendedItem.display}` });
  };

  const updateConfig = (key: ConfigKey, value: number) => {
    const nextConfig = normalizePinyinConfig({ ...config, [key]: value });
    setConfig(nextConfig);
    regenerate(nextConfig, selectedItemId, "练习题量已更新");
  };

  const setPracticeLevel = (level: PinyinPracticeLevel) => {
    const nextConfig = { ...PINYIN_PRACTICE_PRESETS[level] };
    setConfig(nextConfig);
    regenerate(nextConfig, selectedItemId, level === "light" ? "已切换为轻松练习" : "已切换为标准练习");
  };

  const markComplete = () => {
    if (storageAvailable === false) {
      setStatus({ tone: "error", text: "当前浏览器未允许本地记录，练习和打印仍可继续" });
      return;
    }
    const nextProgress = markPinyinCompleted(progress, selectedItemId, new Date().toISOString());
    try {
      window.localStorage.setItem(PINYIN_PROGRESS_STORAGE_KEY, serializePinyinProgress(nextProgress));
      setProgress(nextProgress);
      setStatus({ tone: "success", text: `${selectedItem.display} 已记入本地进度` });
    } catch {
      setStorageAvailable(false);
      setStatus({ tone: "error", text: "本地记录没有保存，练习和打印仍可继续" });
    }
  };

  const clearProgress = () => {
    if (!window.confirm("清空拼音完成记录？练习纸不会受到影响。")) return;
    const empty = createEmptyPinyinProgress();
    try {
      window.localStorage.setItem(PINYIN_PROGRESS_STORAGE_KEY, serializePinyinProgress(empty));
      setProgress(empty);
      setStatus({ tone: "success", text: "拼音完成记录已清空" });
    } catch {
      setStorageAvailable(false);
      setStatus({ tone: "error", text: "记录未能清空，请检查浏览器存储权限" });
    }
  };

  const printWorksheet = () => {
    setStatus({ tone: "success", text: `已打开打印窗口，共 ${printPages} 页双面打印包` });
    window.print();
  };

  const reset = () => {
    seedRef.current = INITIAL_SEED;
    const nextConfig = { ...DEFAULT_PINYIN_WORKSHEET_CONFIG };
    setConfig(nextConfig);
    setPreviewPageIndex(0);
    setWorksheet(createPinyinWorksheet(selectedItemId, INITIAL_SEED, nextConfig));
    setStatus({ tone: "success", text: "已恢复轻松练习" });
  };

  if (!selectedPage) return null;

  return (
    <section className={`pulse-workbench ${styles.workbench}`} aria-labelledby="pinyin-tool-title">
      <header className="pulse-workbench__header">
        <div>
          <div className="pulse-workbench__meta" aria-hidden="true"><span>一程一成长 / 工具</span><i /><span>启蒙拼音</span></div>
          <h1 id="pinyin-tool-title">{definition.seo.h1}</h1>
          <p>{definition.description}</p>
        </div>
      </header>

      <section className={styles.layout} aria-label="幼小拼音练习生成工作区">
        <aside className={styles.settings} aria-label="拼音练习设置">
          <header className={styles.settingsHeader}>
            <div><span>每天一小步</span><h2>今天练哪个？</h2></div>
            <div className={styles.progressStat}><strong>{progressCounts.completed}<small> / {progressCounts.total}</small></strong><span>已练项目</span></div>
          </header>

          <section className={styles.recommendation} aria-label="今日推荐">
            <div><Sparkles aria-hidden="true" size={15} /><span>今日推荐</span><strong>{recommendedItem.display}</strong></div>
            <button type="button" onClick={selectRecommended} data-testid="pinyin-recommendation">使用推荐</button>
          </section>

          <nav className={styles.categoryTabs} aria-label="拼音分类" role="tablist">
            {CATEGORY_TABS.map((tab) => (
              <button type="button" role="tab" aria-selected={activeCategory === tab.key} className={activeCategory === tab.key ? styles.activeTab : ""} onClick={() => setActiveCategory(tab.key)} key={tab.key}>
                <strong>{tab.label}</strong><small>{tab.description}</small>
              </button>
            ))}
          </nav>

          <section className={styles.itemPicker} aria-label={`${getItemCategoryLabel(activeCategory)}选择`}>
            {activeCategory === "final" ? (
              <>
                <ItemGroup title="单韵母" items={visibleItems.filter((item) => item.group === "单韵母")} selectedItemId={selectedItemId} onSelect={selectItem} />
                <ItemGroup title="复韵母" items={visibleItems.filter((item) => item.group === "复韵母")} selectedItemId={selectedItemId} onSelect={selectItem} />
                <ItemGroup title="鼻韵母" items={visibleItems.filter((item) => item.group === "前鼻韵母" || item.group === "后鼻韵母")} selectedItemId={selectedItemId} onSelect={selectItem} />
              </>
            ) : <ItemGroup title={getItemCategoryLabel(activeCategory)} items={visibleItems} selectedItemId={selectedItemId} onSelect={selectItem} />}
          </section>

          <section className={styles.progressPanel} aria-label="拼音本地进度">
            <div className={styles.progressHeader}><span>本地成长记录</span><strong>{progressCounts.completed} / {progressCounts.total}</strong></div>
            <div className={styles.progressBar}><span style={{ width: `${(progressCounts.completed / progressCounts.total) * 100}%` }} /></div>
            <div className={styles.progressBreakdown}><span>声母 {progressCounts.initials}/23</span><span>韵母 {progressCounts.finals}/24</span><span>整体 {progressCounts.wholeSyllables}/16</span></div>
          </section>

          <section className={styles.practiceLevel} aria-labelledby="pinyin-level-title">
            <div className={styles.settingLabel}><span id="pinyin-level-title">练习量</span><small>{hasCustomCounts ? "已做详细调整" : "声调由系统自动安排"}</small></div>
            <div className={styles.levelSwitch} role="group" aria-label="选择练习量">
              <button type="button" className={config.practiceLevel === "light" ? styles.activeLevel : ""} aria-pressed={config.practiceLevel === "light"} onClick={() => setPracticeLevel("light")}><strong>轻松</strong><small>少写多看</small></button>
              <button type="button" className={config.practiceLevel === "standard" ? styles.activeLevel : ""} aria-pressed={config.practiceLevel === "standard"} onClick={() => setPracticeLevel("standard")}><strong>标准</strong><small>多练一点</small></button>
            </div>
          </section>

          <details className={styles.advancedSettings}>
            <summary><Settings2 aria-hidden="true" size={15} /><span>详细调整</span><small>{hasCustomCounts ? "已自定义" : "默认不用设置"}</small></summary>
            <div className={styles.advancedBody}>
              <ConfigStepper label="描红行数" value={config.traceRows} min={1} max={MAX_PINYIN_TRACE_ROWS} unit="行" onChange={(value) => updateConfig("traceRows", value)} testId="pinyin-trace-rows" />
              <ConfigStepper label="核心练习" value={config.coreCount} min={2} max={MAX_PINYIN_CORE_QUESTIONS} unit="题" onChange={(value) => updateConfig("coreCount", value)} testId="pinyin-core-count" />
              <p className={styles.pictureAvailability} data-testid="pinyin-picture-availability">{pictureCandidates.length >= config.pictureCount ? `已准备 ${pictureCandidates.length} 张与 ${selectedItem.display} 直接相关的图片，每次选 3 张生成。` : `当前只有 ${pictureCandidates.length} 张与 ${selectedItem.display} 精确匹配的图片，将按实际数量生成。`}</p>
              <div className={styles.advancedActions}>
                <button type="button" onClick={reset}><RotateCcw aria-hidden="true" size={14} />恢复轻松练习</button>
                <button type="button" className={styles.clearProgress} onClick={clearProgress}>清空拼音记录</button>
              </div>
            </div>
          </details>

          <div className={styles.actions}>
            <button type="button" className={styles.printButton} onClick={printWorksheet}><Printer aria-hidden="true" size={17} />打印 / 导出 PDF</button>
            <button type="button" className={styles.regenerateButton} onClick={() => regenerate()}><Dices aria-hidden="true" size={17} />换一组题</button>
            <button type="button" className={styles.completeButton} onClick={markComplete}><Check aria-hidden="true" size={16} />标记完成</button>
          </div>
          <div className={styles.status} data-tone={status.tone} role="status" aria-live="polite">
            {status.tone === "success" ? <Check aria-hidden="true" size={15} /> : null}
            {status.tone === "error" ? <TriangleAlert aria-hidden="true" size={15} /> : null}
            <span>{status.text}</span>
          </div>
          <p className={styles.local}><ShieldCheck aria-hidden="true" size={15} />{storageAvailable === false ? "本地记录不可用，练习仍可继续" : "内容和完成记录只在当前浏览器中处理"}</p>
        </aside>

        <section className={`${styles.preview} ${previewExpanded ? styles.previewExpanded : ""}`} aria-label="拼音 A4 版面预览">
          <header className={styles.previewToolbar}>
            <div><Languages aria-hidden="true" size={17} /><span>{selectedItem.display} · A4 预览</span></div>
            <div className={styles.previewControls}>
              {worksheet.pages.length > 1 ? <div className={styles.pageTabs} role="tablist" aria-label="选择预览页">{worksheet.pages.map((page, index) => <button type="button" role="tab" aria-selected={previewPageIndex === index} className={previewPageIndex === index ? styles.activePageTab : ""} onClick={() => setPreviewPageIndex(index)} key={page.pageNumber}>第 {page.pageNumber} 页</button>)}</div> : <span className={styles.singlePage}>共 1 页</span>}
              <button type="button" className={styles.expandButton} aria-label={previewExpanded ? "退出放大预览" : "放大预览"} title={previewExpanded ? "退出放大预览" : "放大预览"} onClick={() => setPreviewExpanded((value) => !value)}>{previewExpanded ? <Minimize2 aria-hidden="true" size={16} /> : <Maximize2 aria-hidden="true" size={16} />}</button>
            </div>
          </header>
          <div className={styles.previewSummary}><strong>{selectedItem.display}</strong><span>{getItemCategoryLabel(selectedItem.category)}</span><span>{contentPages} 页内容 · {printPages} 页双面打印包</span></div>
          <div className={styles.previewCanvas}><PinyinPaper worksheet={worksheet} page={selectedPage} /></div>
          <p className={styles.previewNote}>打印纸会按 A4 竖版排版；单页内容会自动补空白背面，方便双面打印。</p>
        </section>
      </section>

      <div className={styles.printPack} data-testid="pinyin-print-pack" aria-label="拼音练习双面打印内容">
        {worksheet.pages.map((page) => <PinyinPaper worksheet={worksheet} page={page} printCopy key={`page-${page.pageNumber}`} />)}
        {worksheet.pages.length % 2 === 1 ? <PinyinBlankBack pageNumber={worksheet.pages.length + 1} /> : null}
      </div>
      <div className={styles.assetPreload} aria-hidden="true">{ALL_PICTURE_ASSETS.map((src) => <img src={src} alt="" key={src} />)}</div>
    </section>
  );
}

function ItemGroup({ title, items, selectedItemId, onSelect }: { title: string; items: readonly PinyinItem[]; selectedItemId: string; onSelect: (item: PinyinItem) => void }) {
  return (
    <div className={styles.itemGroup}>
      <div className={styles.itemGroupTitle}><span>{title}</span><small>{items.length} 项</small></div>
      <div className={styles.itemGrid}>
        {items.map((item) => <button type="button" className={selectedItemId === item.id ? styles.selectedItem : ""} aria-label={item.label} aria-pressed={selectedItemId === item.id} onClick={() => onSelect(item)} key={item.id}>{item.display}</button>)}
      </div>
    </div>
  );
}

export function PinyinWorksheetWorkspace({ definition, seoContent }: { definition: KidsToolDefinition; seoContent?: ReactNode }) {
  return <KidsShell activeTool={definition.slug}><PinyinWorksheetWorkspaceContent definition={definition} />{seoContent}</KidsShell>;
}
