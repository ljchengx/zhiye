"use client";

import {
  Check,
  ChevronDown,
  Download,
  FolderOpen,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { KidsToolDefinition } from "@/lib/tools/kids-registry";
import {
  DRILL_PARENT_USAGE,
  DRILL_TITLES,
  getExportDays,
  sheetSignatures,
  type DrillMonthConfig,
  type DrillPlan,
  type WorksheetExportSelection,
  type WorksheetSide,
} from "@/lib/tools/math-worksheet";
import {
  getMathBulkPdfFilename,
  type MathPdfExternalCharacterAssets,
  type MathPdfGenerateRequest,
  type MathPdfWorkerResponse,
} from "@/lib/tools/math-pdf";
import {
  readWorksheetCharacterFolder,
  releaseWorksheetCharacterFolder,
  type LocalWorksheetCharacterMap,
} from "@/lib/tools/math-local-assets";
import {
  pageNodes,
  type WorksheetDocument,
  type WorksheetPage,
} from "@/lib/tools/number-sense/layout";
import { loadWorksheetPreviewFonts } from "@/lib/tools/number-sense/preview-fonts";
import { isWorksheetCharacterAsset } from "@/lib/tools/number-sense/drawing";
import type {
  MathWorksheetPlanGenerateRequest,
  MathWorksheetPlanWorkerResponse,
} from "../workers/math-worksheet.worker";
import { KidsShell } from "./kids-shell";
import { NumberSensePaper } from "./number-sense-paper";
import styles from "./math-worksheet-workspace.module.css";

const INITIAL_SEED = 20260831;
type Action =
  | {
      kind: "plan";
      seed: number;
      config?: DrillMonthConfig;
      reset?: boolean;
    }
  | { kind: "day"; seed: number; day: number };
type RetryAction = Action | { kind: "export" | "print" | "characters" };
interface Workbook {
  plan: DrillPlan;
  document: WorksheetDocument;
}

async function pdfCharacterAssets(
  assets: LocalWorksheetCharacterMap,
  pages: readonly WorksheetPage[],
  isActive: () => boolean,
): Promise<MathPdfExternalCharacterAssets> {
  const used = new Set(
    pages.flatMap((page) =>
      pageNodes(page).flatMap((node) =>
        node.kind === "image" && isWorksheetCharacterAsset(node.asset) ? [node.asset] : [],
      ),
    ),
  );
  const result: MathPdfExternalCharacterAssets = {};
  for (const asset of Object.values(assets)) {
    if (!asset || !used.has(asset.name)) continue;
    if (!isActive()) return result;
    // PNG 也可能含 EXIF；统一按浏览器方向转为 PNG，并保留透明背景。
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("角色素材加载失败，请重试"));
      image.src = asset.url;
    });
    if (!isActive()) return result;
    const scale = Math.min(
      1,
      1024 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    let blob: Blob;
    try {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("角色素材处理失败，请重试");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("角色素材处理失败，请重试")),
          "image/png",
        ),
      );
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
    if (!isActive()) return result;
    result[asset.name] = {
      bytes: await blob.arrayBuffer(),
      mimeType: "image/png",
    };
  }
  return result;
}

async function preparePrintAssets(root: HTMLElement | null) {
  await loadWorksheetPreviewFonts();
  await Promise.all(
    Array.from(root?.querySelectorAll("image") ?? []).map(
      (element) =>
        new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("角色素材加载失败，请重试"));
          image.src = element.getAttribute("href") ?? "";
        }),
    ),
  );
}

function MathWorksheetContent({
  definition,
}: {
  definition: KidsToolDefinition;
}) {
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSide, setSelectedSide] = useState<WorksheetSide>("front");
  const [month, setMonth] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("正在准备练习与图形…");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [printPending, setPrintPending] = useState(false);
  const [exportRange, setExportRange] = useState<"day" | "range" | "all">(
    "day",
  );
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(10);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [characters, setCharacters] = useState<LocalWorksheetCharacterMap>({});
  const planWorker = useRef<Worker | null>(null),
    pdfWorker = useRef<Worker | null>(null);
  const requestId = useRef(0),
    seed = useRef(INITIAL_SEED),
    retry = useRef<RetryAction>({ kind: "plan", seed: INITIAL_SEED });
  const characterRef = useRef<LocalWorksheetCharacterMap>({}),
    folderInput = useRef<HTMLInputElement>(null),
    printPack = useRef<HTMLDivElement>(null),
    previewPanel = useRef<HTMLElement>(null),
    expandButton = useRef<HTMLButtonElement>(null),
    mounted = useRef(false);
  const day = workbook?.plan.sheets[selectedDay - 1];
  const content = day?.pages.find((item) => item.side === selectedSide);
  const pages =
    workbook?.document.pages.filter((item) => item.day === selectedDay) ?? [];
  const page = pages.find((item) => item.side === selectedSide);
  const total = workbook?.plan.sheets.length ?? 30;
  const locked = busy || printPending || progress !== null;
  const selection: WorksheetExportSelection =
    exportRange === "day"
      ? { kind: "day", day: selectedDay }
      : exportRange === "range"
        ? { kind: "range", from: rangeFrom, to: rangeTo }
        : { kind: "all" };

  const request = (action: Action) => {
    retry.current = action;
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setStatus(
      action.kind === "day" ? "正在更新正反面…" : "正在准备月度双面练习…",
    );
    try {
      let worker = planWorker.current;
      if (!worker) {
        worker = new Worker(
          new URL("../workers/math-worksheet.worker.ts", import.meta.url),
          { type: "module" },
        );
        planWorker.current = worker;
        const currentWorker = worker;
        worker.onmessage = async (
          event: MessageEvent<MathWorksheetPlanWorkerResponse>,
        ) => {
          const message = event.data;
          if (
            planWorker.current !== currentWorker ||
            message.requestId !== requestId.current
          )
            return;
          if (message.type === "error") {
            setBusy(false);
            setError(message.message);
            setStatus("");
            return;
          }
          try {
            await loadWorksheetPreviewFonts();
          } catch {
            if (
              planWorker.current === currentWorker &&
              message.requestId === requestId.current
            ) {
              setBusy(false);
              setError("练习字体加载失败，请重试");
              setStatus("");
            }
            return;
          }
          if (
            planWorker.current !== currentWorker ||
            message.requestId !== requestId.current
          )
            return;
          setBusy(false);
          if (message.type === "complete") {
            setWorkbook({ plan: message.plan, document: message.document });
            setSelectedDay((value) =>
              Math.min(value, message.plan.sheets.length),
            );
            setRangeFrom((value) => Math.min(value, message.plan.sheets.length));
            setRangeTo((value) => Math.min(value, message.plan.sheets.length));
            setStatus(`${message.plan.sheets.length} 份双面练习已准备好`);
          } else {
            setWorkbook((previous) =>
              previous
                ? {
                    plan: {
                      ...previous.plan,
                      sheets: previous.plan.sheets.map((item) =>
                        item.sheet === message.day.sheet ? message.day : item,
                      ),
                    },
                    document: {
                      ...previous.document,
                      // 两面在一次状态提交中替换，预览、打印和导出共用这份文档。
                      pages: previous.document.pages.flatMap((item) =>
                        item.day === message.day.sheet
                          ? item.side === "front"
                            ? message.pages
                            : []
                          : [item],
                      ),
                    },
                  }
                : previous,
            );
            setStatus(`第 ${message.day.sheet} 份正反面已更新`);
          }
        };
        worker.onerror = () => {
          if (planWorker.current !== currentWorker) return;
          currentWorker.terminate();
          planWorker.current = null;
          setBusy(false);
          setError("练习生成失败，请重试");
          setStatus("");
        };
      }
      const common = {
        requestId: id,
        seed: action.seed,
        baseUrl: window.location.origin,
      };
      if (action.kind === "day" && workbook)
        worker.postMessage({
          ...common,
          type: "regenerate-day",
          day: action.day,
          plan: workbook.plan,
        } satisfies MathWorksheetPlanGenerateRequest);
      else
        worker.postMessage({
          ...common,
          type: "generate",
          config:
            action.kind === "plan"
              ? (action.config ?? workbook?.plan.config ?? { count: 30 })
              : { count: 30 },
          excluded:
            action.kind === "plan" && !action.reset
              ? workbook?.plan.sheets.flatMap((item) => sheetSignatures(item))
              : undefined,
        } satisfies MathWorksheetPlanGenerateRequest);
    } catch {
      setBusy(false);
      setError("练习生成失败，请重试");
      setStatus("");
    }
  };

  useEffect(() => {
    mounted.current = true;
    request({ kind: "plan", seed: INITIAL_SEED });
    folderInput.current?.setAttribute("webkitdirectory", "");
    folderInput.current?.setAttribute("directory", "");
    return () => {
      mounted.current = false;
      planWorker.current?.terminate();
      planWorker.current = null;
      pdfWorker.current?.terminate();
      pdfWorker.current = null;
      releaseWorksheetCharacterFolder(characterRef.current);
    };
  }, []);

  useEffect(() => {
    const panel = previewPanel.current;
    if (!expanded || !panel) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = new Map<HTMLElement, boolean>();
    // 逐层停用弹窗以外的兄弟节点，保留原有 inert 状态供关闭时恢复。
    for (let ancestor: HTMLElement = panel; ancestor.parentElement; ancestor = ancestor.parentElement) {
      for (const sibling of ancestor.parentElement.children) {
        if (sibling !== ancestor && sibling instanceof HTMLElement) {
          background.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
    }
    document.body.style.overflow = "hidden";
    expandButton.current?.focus({ preventScroll: true });
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
      } else if (event.key === "Tab") {
        const controls = Array.from(panel.querySelectorAll<HTMLElement>(
          'button, summary, select, input, a[href], [tabindex]',
        )).filter((element) => element.tabIndex >= 0
          && !element.matches(":disabled") && element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (!panel.contains(document.activeElement)
          || (event.shiftKey && document.activeElement === first)
          || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        }
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previous;
      background.forEach((inert, element) => { element.inert = inert; });
      window.removeEventListener("keydown", keyboard);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [expanded]);

  const nextSeed = () => {
    seed.current = (seed.current + 7919) >>> 0;
    return seed.current;
  };
  const selectDay = (value: number) => {
    setSelectedDay(value);
    setNavigationOpen(false);
    setError("");
  };
  const replaceCharacters = (next: LocalWorksheetCharacterMap) => {
    releaseWorksheetCharacterFolder(characterRef.current);
    characterRef.current = next;
    setCharacters(next);
  };
  const importCharacters = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;
    const result = readWorksheetCharacterFolder(files);
    if (!result.matchedFiles) {
      retry.current = { kind: "characters" };
      setError(
        "未找到角色图片，请使用 mario、luigi 或 number-block-1 等角色文件名",
      );
      return;
    }
    replaceCharacters(result.assets);
    setError("");
    setStatus(`已读取 ${result.matchedFiles} 个本地角色素材`);
  };
  const cancelExport = () => {
    pdfWorker.current?.terminate();
    pdfWorker.current = null;
    setProgress(null);
    setStatus("已取消导出");
  };
  const exportPdf = async () => {
    if (!workbook) return;
    retry.current = { kind: "export" };
    setError("");
    const selected = new Set(
      getExportDays(workbook.plan, selection).map((item) => item.day),
    );
    const pages = workbook.document.pages.filter((item) =>
      selected.has(item.day),
    );
    const filename = getMathBulkPdfFilename(selection);
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("../workers/math-pdf.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      setError("PDF 导出无法启动，请重试");
      return;
    }
    pdfWorker.current = worker;
    setProgress({ completed: 0, total: pages.length });
    setStatus("正在准备 PDF…");
    const finish = () => {
      worker.terminate();
      if (pdfWorker.current === worker) pdfWorker.current = null;
      setProgress(null);
    };
    worker.onmessage = (event: MessageEvent<MathPdfWorkerResponse>) => {
      if (pdfWorker.current !== worker) return;
      const message = event.data;
      if (message.type === "progress") {
        setProgress({ completed: message.completed, total: message.total });
        return;
      }
      if (message.type === "error") {
        finish();
        setError(message.message);
        setStatus("");
        return;
      }
      const url = URL.createObjectURL(
        new Blob([message.bytes], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      finish();
      setStatus(`已导出 ${message.pageCount} 页练习`);
    };
    worker.onerror = () => {
      if (pdfWorker.current === worker) {
        finish();
        setError("PDF 导出失败，请重试");
        setStatus("");
      }
    };
    try {
      const externalCharacters = await pdfCharacterAssets(
        characters,
        pages,
        () => pdfWorker.current === worker,
      );
      if (pdfWorker.current !== worker) return;
      worker.postMessage({
        type: "generate",
        document: { ...workbook.document, pages },
        baseUrl: window.location.origin,
        externalCharacters,
      } satisfies MathPdfGenerateRequest);
    } catch {
      if (pdfWorker.current === worker) {
        finish();
        setError("角色素材读取失败，请重新选择后重试");
        setStatus("");
      }
    }
  };
  const print = async () => {
    retry.current = { kind: "print" };
    setPrintPending(true);
    setError("");
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      await preparePrintAssets(printPack.current);
      if (!mounted.current) return;
      window.print();
      setStatus(`已准备第 ${selectedDay} 份，共 2 页；双面打印请选择长边翻转`);
    } catch (reason) {
      if (mounted.current)
        setError(
          reason instanceof Error ? reason.message : "打印准备失败，请重试",
        );
    } finally {
      if (mounted.current) setPrintPending(false);
    }
  };
  const reset = () => {
    seed.current = INITIAL_SEED;
    setSelectedDay(1);
    setSelectedSide("front");
    setMonth("");
    setRangeFrom(1);
    setRangeTo(10);
    setExportRange("day");
    setExpanded(false);
    replaceCharacters({});
    request({
      kind: "plan",
      seed: INITIAL_SEED,
      config: { count: 30 },
      reset: true,
    });
  };
  const retryLastAction = () => {
    // 只保存操作，重试时读取当前练习和素材，避免复用已释放的图片。
    const action = retry.current;
    switch (action.kind) {
      case "export":
        void exportPdf();
        break;
      case "print":
        void print();
        break;
      case "characters":
        folderInput.current?.click();
        break;
      case "plan":
      case "day":
        request(action);
    }
  };

  return (
    <section
      className={`pulse-workbench ${styles.workbench}`}
      aria-labelledby="tool-title"
    >
      <header className={styles.intro}>
        <span className={styles.eyebrow}>一程一成长 / 计算练习</span>
        <h1 id="tool-title">计算练习册</h1>
        <p>
          每份 16 题，正反面各两个大题。算一算、玩图形，再把数学用到生活里。
        </p>
      </header>
      <div className={styles.layout}>
        <aside className={styles.navigator} aria-label="月度练习选择">
          <button
            type="button"
            className={styles.mobileNavToggle}
            onClick={() => setNavigationOpen((value) => !value)}
            aria-expanded={navigationOpen}
            aria-controls="sense-navigation"
          >
            选择本月练习
            <span>
              第 {selectedDay} 份<ChevronDown size={16} />
            </span>
          </button>
          <div
            id="sense-navigation"
            className={`${styles.navigationContent} ${navigationOpen ? styles.navigationOpen : ""}`}
          >
            <div className={styles.navHeading}>
              <span>本月的 {total} 份练习</span>
              <small>每份独立，可以任意抽取</small>
            </div>
            <div className={styles.dayHeading}>
              <span>选择一份</span>
              <small>每份正反两面</small>
            </div>
            <div className={styles.days}>
              {Array.from({ length: total }, (_, i) => i + 1).map((value) => (
                <button
                  type="button"
                  disabled={locked}
                  className={selectedDay === value ? styles.activeDay : ""}
                  aria-label={`第 ${value} 份`}
                  aria-pressed={selectedDay === value}
                  data-testid={`worksheet-day-${value}`}
                  onClick={() => selectDay(value)}
                  key={value}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className={styles.skillList} aria-label="本月练习内容">
              {DRILL_TITLES.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
          <details className={styles.advanced}>
            <summary>
              更多设置
              <ChevronDown size={14} />
            </summary>
            <div className={styles.advancedBody}>
              <label htmlFor="sense-month">按实际月份生成</label>
              <input
                id="sense-month"
                type="month"
                aria-label="练习月份"
                min="1900-01"
                max="9999-12"
                value={month}
                disabled={locked}
                onChange={(event) => setMonth(event.target.value)}
              />
              <button
                type="button"
                disabled={locked || !month}
                onClick={() => {
                  const [year, monthNumber] = month.split("-").map(Number);
                  request({
                    kind: "plan",
                    seed: nextSeed(),
                    config: { year, month: monthNumber },
                  });
                }}
              >
                生成所选月份
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => request({ kind: "plan", seed: nextSeed() })}
              >
                <RefreshCw size={14} />
                重新生成全部
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => folderInput.current?.click()}
              >
                <FolderOpen size={14} />
                选择角色文件夹
              </button>
              <input
                ref={folderInput}
                type="file"
                multiple
                accept="image/png,image/jpeg"
                onChange={importCharacters}
                className={styles.hiddenInput}
                aria-label="选择角色素材文件夹"
              />
              {Object.keys(characters).length ? (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    replaceCharacters({});
                    setStatus("已恢复内置角色");
                  }}
                >
                  清除本地素材
                </button>
              ) : null}
              <p>
                可替换马里奥、路易吉与数字积木等角色，仅在当前浏览器使用。文件名：mario、luigi、number-block-1 等。
              </p>
              <button type="button" disabled={locked} onClick={reset}>
                <RotateCcw size={14} />
                恢复默认
              </button>
            </div>
          </details>
        </aside>
        <section className={styles.workspace} aria-label="本份练习">
          <header className={styles.today}>
            <div>
              <span className={styles.todayLabel}>
                第 {selectedDay} 份 / 共 {total} 份
              </span>
              <h2>{content?.title ?? "准备本份练习"}</h2>
              <p>{content?.prompt ?? "正在准备本份练习…"}</p>
            </div>
            <div className={styles.primaryActions}>
              <button
                type="button"
                className={styles.printButton}
                onClick={() => void print()}
                disabled={locked || !page}
              >
                {printPending ? (
                  <LoaderCircle size={17} className={styles.spin} />
                ) : (
                  <Printer size={17} />
                )}
                打印本份
              </button>
              <button
                type="button"
                onClick={() =>
                  request({ kind: "day", seed: nextSeed(), day: selectedDay })
                }
                disabled={locked || !day}
              >
                <RefreshCw
                  size={16}
                  className={busy && workbook ? styles.spin : undefined}
                />
                本份换一套
              </button>
            </div>
          </header>
          <section
            ref={previewPanel}
            className={`${styles.preview} ${expanded ? styles.expanded : ""}`}
            aria-label="A4 练习纸预览"
            role={expanded ? "dialog" : undefined}
            aria-modal={expanded ? true : undefined}
          >
            <header className={styles.previewBar}>
              <span>
                A4 双面练习<small>16 题 · 每面两个大题</small>
              </span>
              <div>
                {progress ? (
                  <button type="button" onClick={cancelExport}>
                    <X size={15} />
                    取消导出（{progress.completed}/{progress.total}）
                  </button>
                ) : (
                  <details className={styles.exportMenu}>
                    <summary>
                      <Download size={15} />
                      导出 PDF
                      <ChevronDown size={13} />
                    </summary>
                    <div>
                      <label htmlFor="sense-export-range">导出范围</label>
                      <select
                        id="sense-export-range"
                        aria-label="导出范围"
                        value={exportRange}
                        disabled={locked}
                        onChange={(event) =>
                          setExportRange(
                            event.target.value as typeof exportRange,
                          )
                        }
                      >
                        <option value="day">本份 · 2 页</option>
                        <option value="range">自选范围</option>
                        <option value="all">整月 · {total * 2} 页</option>
                      </select>
                      {exportRange === "range" ? (
                        <div className={styles.rangeFields}>
                          <label>
                            起始份数
                            <select
                              aria-label="起始份数"
                              value={rangeFrom}
                              disabled={locked}
                              onChange={(event) =>
                                setRangeFrom(Number(event.target.value))
                              }
                            >
                              {Array.from({ length: total }, (_, i) => (
                                <option key={i} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            结束份数
                            <select
                              aria-label="结束份数"
                              value={rangeTo}
                              disabled={locked}
                              onChange={(event) =>
                                setRangeTo(Number(event.target.value))
                              }
                            >
                              {Array.from({ length: total }, (_, i) => (
                                <option key={i} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <small>
                            共 {(Math.abs(rangeTo - rangeFrom) + 1) * 2} 页
                          </small>
                        </div>
                      ) : null}
                      <p>双面打印请选择长边翻转。</p>
                      <button
                        type="button"
                        disabled={locked || !page}
                        onClick={() => void exportPdf()}
                      >
                        <Download size={14} />
                        下载 PDF
                      </button>
                    </div>
                  </details>
                )}
                <button
                  ref={expandButton}
                  type="button"
                  aria-label={expanded ? "退出放大预览" : "放大预览"}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </header>
            <div className={styles.sideBar}>
              <div
                className={styles.sideTabs}
                role="group"
                aria-label="选择预览面"
              >
                {(["front", "back"] as const).map((side) => (
                  <button
                    type="button"
                    key={side}
                    aria-pressed={selectedSide === side}
                    onClick={() => setSelectedSide(side)}
                  >
                    {side === "front" ? "正面" : "反面"}
                  </button>
                ))}
              </div>
              <span>
                第 {selectedDay} 份 ·{" "}
                {selectedSide === "front" ? "正面" : "反面"}
              </span>
            </div>
            <div className={styles.feedback} aria-live="polite">
              {error ? (
                <div className={styles.error} role="alert">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={retryLastAction}
                    disabled={locked}
                  >
                    重试
                  </button>
                </div>
              ) : (
                <span role="status">
                  {busy ? (
                    <LoaderCircle size={13} className={styles.spin} />
                  ) : status ? (
                    <Check size={13} />
                  ) : null}
                  {status}
                </span>
              )}
            </div>
            <div className={styles.previewViewport} tabIndex={expanded ? 0 : undefined}>
              {page ? (
                <NumberSensePaper
                  page={page}
                  className={styles.paper}
                  overrides={characters}
                />
              ) : (
                <div className={styles.loading}>
                  <LoaderCircle size={26} className={styles.spin} />
                  <span>{error ? "练习暂未生成" : "正在准备图形与练习…"}</span>
                </div>
              )}
            </div>
          </section>
          <p className={styles.usage}>{DRILL_PARENT_USAGE}</p>
        </section>
      </div>
      <div
        ref={printPack}
        className={styles.printPack}
        data-testid="worksheet-print-pack"
        data-render-scope="selected-day"
      >
        {pages.map((printPage) => (
          <NumberSensePaper
            key={printPage.id}
            page={printPage}
            className={styles.paper}
            printCopy
            overrides={characters}
          />
        ))}
      </div>
    </section>
  );
}

export function MathWorksheetWorkspace({
  definition,
  seoContent,
}: {
  definition: KidsToolDefinition;
  seoContent?: ReactNode;
}) {
  return (
    <KidsShell activeTool={definition.slug}>
      <MathWorksheetContent definition={definition} />
      {seoContent}
    </KidsShell>
  );
}
