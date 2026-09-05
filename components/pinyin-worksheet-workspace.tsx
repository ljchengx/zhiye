"use client";

import {
  Check,
  Dices,
  Files,
  Languages,
  Maximize2,
  Minus,
  Minimize2,
  Plus,
  Printer,
  RotateCcw,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import {
  createPinyinWorksheet,
  DEFAULT_PINYIN_WORKSHEET_CONFIG,
  getPinyinItem,
  getPinyinPictureCandidates,
  getToneForms,
  MAX_PINYIN_CORE_QUESTIONS,
  MAX_PINYIN_TRACE_ROWS,
  normalizePinyinConfig,
  PINYIN_ITEMS,
  PINYIN_PRINT_ORDER,
  PINYIN_PRACTICE_PRESETS,
  type PinyinCategory,
  type PinyinItem,
  type PinyinPictureAsset,
  type PinyinPracticeLevel,
  type PinyinPrintPage,
  type PinyinQuestion,
  type PinyinWorksheet,
  type PinyinWorksheetConfig,
  type PinyinWorksheetSection,
} from "@/lib/tools/pinyin-worksheet";
import type { KidsToolDefinition } from "@/lib/tools/kids-registry";
import { PINYIN_PICTURE_SOURCES } from "@/lib/tools/pinyin-picture-assets";
import type { PinyinPdfGenerateRequest, PinyinPdfWorkerResponse } from "@/lib/tools/pinyin-pdf";

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
const BULK_PDF_FILENAME = "一程一成长-幼小拼音练习-全部63项.pdf";

const CATEGORY_TABS: readonly { key: CategoryTab; label: string; description: string }[] = [
  { key: "initial", label: "声母", description: "23 个" },
  { key: "final", label: "韵母", description: "24 个" },
  { key: "whole-syllable", label: "整体认读", description: "16 个" },
];

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
  return <img className={className ?? styles.pictureAsset} src={PINYIN_PICTURE_SOURCES[asset]} alt="" draggable="false" />;
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
      data-print-item={printCopy ? worksheet.item.id : undefined}
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

function PinyinPrintSheets({ worksheet }: { worksheet: PinyinWorksheet }) {
  return (
    <>
      {worksheet.pages.map((page) => <PinyinPaper worksheet={worksheet} page={page} printCopy key={`${worksheet.item.id}-${page.pageNumber}`} />)}
      {worksheet.pages.length % 2 === 1 ? <PinyinBlankBack pageNumber={worksheet.pages.length + 1} /> : null}
    </>
  );
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
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
  const printPackRef = useRef<HTMLDivElement>(null);
  const bulkWorkerRef = useRef<Worker | null>(null);
  const firstItem = getPinyinItem("final-a") ?? PINYIN_ITEMS[0] as PinyinItem;
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("final");
  const [selectedItemId, setSelectedItemId] = useState(firstItem.id);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [printPending, setPrintPending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<number | null>(null);
  const [config, setConfig] = useState<PinyinWorksheetConfig>(DEFAULT_PINYIN_WORKSHEET_CONFIG);
  const [worksheet, setWorksheet] = useState<PinyinWorksheet>(() => createPinyinWorksheet(firstItem.id, INITIAL_SEED, DEFAULT_PINYIN_WORKSHEET_CONFIG));
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", text: "选一个拼音项目，开始今天的一小步" });
  const selectedItem = getPinyinItem(selectedItemId) ?? firstItem;
  const selectedPage = worksheet.pages[previewPageIndex] ?? worksheet.pages[0];
  const pictureCandidates = useMemo(() => getPinyinPictureCandidates(selectedItem), [selectedItem]);
  const activePreset = PINYIN_PRACTICE_PRESETS[config.practiceLevel];
  const hasCustomCounts = config.traceRows !== activePreset.traceRows || config.coreCount !== activePreset.coreCount;
  const visibleItems = getItemList(activeCategory);
  const contentPages = worksheet.pages.length;
  const printPages = contentPages % 2 === 1 ? contentPages + 1 : contentPages;

  useEffect(() => () => bulkWorkerRef.current?.terminate(), []);

  useEffect(() => {
    if (!printPending) return;
    let cancelled = false;
    const preparePrint = async () => {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      await document.fonts.ready;
      const images = Array.from(printPackRef.current?.querySelectorAll("img") ?? []);
      await Promise.all(images.map(waitForImage));
      if (cancelled) return;
      if (images.some((image) => image.naturalWidth === 0)) {
        setPrintPending(false);
        setStatus({ tone: "error", text: "部分图片未加载完成，请稍后再试" });
        return;
      }
      setPrintPending(false);
      setStatus({
        tone: "success",
        text: `已打开打印窗口，共 ${printPages} 页双面打印包`,
      });
      window.print();
    };
    void preparePrint();
    return () => {
      cancelled = true;
    };
  }, [printPages, printPending]);

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

  const queuePrint = () => {
    setPrintPending(true);
    setStatus({ tone: "idle", text: "正在准备当前练习纸..." });
  };

  const cancelBulkExport = () => {
    bulkWorkerRef.current?.terminate();
    bulkWorkerRef.current = null;
    setBulkProgress(null);
    setStatus({ tone: "idle", text: "已取消全部拼音导出" });
  };

  const startBulkExport = () => {
    if (bulkWorkerRef.current) {
      cancelBulkExport();
      return;
    }
    const worker = new Worker(new URL("../workers/pinyin-pdf.worker.ts", import.meta.url), { type: "module" });
    bulkWorkerRef.current = worker;
    setBulkProgress(0);
    setStatus({ tone: "idle", text: `正在生成 0 / ${PINYIN_PRINT_ORDER.length}` });

    const finish = () => {
      worker.terminate();
      if (bulkWorkerRef.current === worker) bulkWorkerRef.current = null;
      setBulkProgress(null);
    };
    worker.onmessage = (event: MessageEvent<PinyinPdfWorkerResponse>) => {
      if (bulkWorkerRef.current !== worker) return;
      const message = event.data;
      if (message.type === "progress") {
        setBulkProgress(message.completed);
        setStatus({ tone: "idle", text: `正在生成 ${message.completed} / ${message.total}` });
        return;
      }
      if (message.type === "error") {
        finish();
        setStatus({ tone: "error", text: `全部拼音导出失败：${message.message}` });
        return;
      }
      const url = URL.createObjectURL(new Blob([message.bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = BULK_PDF_FILENAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      finish();
      setStatus({ tone: "success", text: `全部 63 项已导出，共 ${message.pageCount} 页` });
    };
    worker.onerror = () => {
      if (bulkWorkerRef.current !== worker) return;
      finish();
      setStatus({ tone: "error", text: "全部拼音导出失败，请刷新页面后重试" });
    };
    worker.postMessage({ type: "generate", config, baseUrl: window.location.origin } satisfies PinyinPdfGenerateRequest);
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
          </header>

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
              </div>
            </div>
          </details>

          <div className={styles.actions} aria-busy={printPending || bulkProgress !== null}>
            <button type="button" className={styles.printButton} disabled={printPending || bulkProgress !== null} onClick={queuePrint}><Printer aria-hidden="true" size={17} />打印 / 导出当前项目</button>
            <button type="button" className={styles.bulkPrintButton} disabled={printPending} onClick={startBulkExport}>
              {bulkProgress === null ? <Files aria-hidden="true" size={17} /> : <X aria-hidden="true" size={17} />}
              {bulkProgress === null ? "一键导出全部 63 项" : `取消导出（${bulkProgress} / 63）`}
            </button>
            <button type="button" className={styles.regenerateButton} onClick={() => regenerate()}><Dices aria-hidden="true" size={17} />换一组题</button>
          </div>
          <div className={styles.status} data-tone={status.tone} role="status" aria-live="polite">
            {status.tone === "success" ? <Check aria-hidden="true" size={15} /> : null}
            {status.tone === "error" ? <TriangleAlert aria-hidden="true" size={15} /> : null}
            <span>{status.text}</span>
          </div>
          <p className={styles.local}><ShieldCheck aria-hidden="true" size={15} />练习内容只在当前浏览器中生成，不保存使用记录</p>
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

      <div className={styles.printPack} data-testid="pinyin-print-pack" data-print-mode="single" ref={printPackRef} aria-label="拼音练习双面打印内容">
        <PinyinPrintSheets worksheet={worksheet} />
      </div>
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
