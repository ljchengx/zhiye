/* 课程 PDF：主线程负责 DOM/拉取；绘制与打包优先走 Worker + OffscreenCanvas。 */
(function () {
  const FONT = '"Microsoft YaHei","PingFang SC",sans-serif';
  const WORKER_URL = new URL("assets/export-pdf.worker.js", document.baseURI).href;

  let workerInstance = null;
  let workerFailed = false;
  let seq = 0;

  function canUseWorker() {
    return !workerFailed && typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
  }

  function getWorker() {
    if (!canUseWorker()) return null;
    if (workerInstance) return workerInstance;
    try {
      workerInstance = new Worker(WORKER_URL);
      workerInstance.addEventListener("error", () => {
        workerFailed = true;
        workerInstance = null;
      });
      return workerInstance;
    } catch (_) {
      workerFailed = true;
      return null;
    }
  }

  function workerRequest(type, payload, transfer) {
    const worker = getWorker();
    if (!worker) return Promise.reject(new Error("worker unavailable"));
    const id = ++seq;
    return new Promise((resolve, reject) => {
      function onMessage(event) {
        if (!event.data || event.data.seq !== id) return;
        worker.removeEventListener("message", onMessage);
        if (event.data.ok) resolve(event.data);
        else reject(new Error(event.data.message || "worker failed"));
      }
      worker.addEventListener("message", onMessage);
      worker.postMessage(Object.assign({ seq: id, type }, payload), transfer || []);
    });
  }

  function yieldToMain() {
    if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function") {
      return scheduler.yield();
    }
    return new Promise((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    });
  }

  function blocksFromReading(root) {
    const blocks = [];
    if (!root) return blocks;
    root.querySelectorAll(".sentence, h3, .vocab li, .words li").forEach((node) => {
      if (node.matches(".sentence")) {
        const english = node.querySelector(".en");
        const chinese = node.querySelector(".zh");
        if (english && english.textContent.trim()) blocks.push({ kind: "en", text: english.textContent.trim() });
        if (chinese && chinese.textContent.trim()) blocks.push({ kind: "zh", text: chinese.textContent.trim() });
      } else if (node.matches("h3")) {
        blocks.push({ kind: "heading", text: node.textContent.trim() });
      } else if (node.textContent.trim()) {
        blocks.push({ kind: "line", text: node.textContent.trim() });
      }
    });
    return blocks;
  }

  function splitEnZhMixed(text) {
    const value = (text || "").trim();
    if (!value) return { en: "", zh: "" };
    const index = value.search(/[\u4e00-\u9fff]/);
    if (index <= 0) return { en: value, zh: "" };
    const en = value.slice(0, index).trim();
    const zh = value.slice(index).trim();
    if (zh.length < 2) return { en: value, zh: "" };
    return { en, zh };
  }

  /** 解析 DOM：新闻/长文常把中文写在 .en 内，需拆开再精简。 */
  function blocksForPdfFromReading(root) {
    const blocks = [];
    if (!root) return blocks;
    root.querySelectorAll(".sentence, h3, .vocab li, .words li").forEach((node) => {
      if (node.matches(".sentence")) {
        const english = node.querySelector(".en");
        const chinese = node.querySelector(".zh");
        const enRaw = english?.textContent.trim() || "";
        const zhRaw = chinese?.textContent.trim() || "";
        if (zhRaw) {
          if (enRaw) blocks.push({ kind: "en", text: enRaw });
          blocks.push({ kind: "zh", text: zhRaw });
          return;
        }
        if (!enRaw) return;
        const split = splitEnZhMixed(enRaw);
        if (split.zh) {
          if (split.en) blocks.push({ kind: "en", text: split.en });
          blocks.push({ kind: "zh", text: split.zh });
        } else {
          blocks.push({ kind: "en", text: enRaw });
        }
      } else if (node.matches("h3")) {
        blocks.push({ kind: "heading", text: node.textContent.trim() });
      } else if (node.textContent.trim()) {
        blocks.push({ kind: "line", text: node.textContent.trim() });
      }
    });
    return blocks;
  }

  function normalizePdfKey(text) {
    return (text || "").toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function isPdfOcrNoise(text, strict) {
    const value = (text || "").trim();
    if (!value) return true;
    if (value.length > (strict ? 120 : 160)) return true;
    if (/\bLesson\s*\d+/i.test(value) && value.length > 28) return true;
    if ((value.match(/\d/g) || []).length > (strict ? 8 : 14)) return true;
    const letters = (value.match(/[a-zA-Z]/g) || []).length;
    const stuck = (value.match(/[a-z][A-Z]/g) || []).length;
    if (letters > 24 && stuck > (strict ? 4 : 8)) return true;
    if (strict && !/[\u4e00-\u9fff]/.test(value) && stuck > 2 && value.length > 48) return true;
    return false;
  }

  function sectionFromMeta(meta) {
    const text = meta || "";
    const index = text.indexOf("·");
    return index === -1 ? "" : text.slice(0, index).trim();
  }

  const PDF_SECTION_PROFILES = {
    低幼启蒙篇: { maxWordLines: 0, maxPairs: 8, requireZh: false, minZhLen: 1, maxEnOnlyLen: 48 },
    日常表达: { maxWordLines: 10, maxPairs: 8, requireZh: false, minZhLen: 1, maxEnOnlyLen: 56 },
    每日晨读: { maxWordLines: 0, maxPairs: 10, requireZh: true, minZhLen: 2, maxEnOnlyLen: 0 },
    科普启蒙篇: { maxWordLines: 8, maxPairs: 8, requireZh: true, minZhLen: 1, maxEnOnlyLen: 0 },
    科普进阶篇: { maxWordLines: 6, maxPairs: 6, requireZh: true, minZhLen: 2, maxEnOnlyLen: 0 },
    用英文讲好中国故事: { maxWordLines: 0, maxPairs: 8, requireZh: true, minZhLen: 2, maxEnOnlyLen: 0 },
    新闻时事: { maxWordLines: 0, maxPairs: 6, requireZh: true, minZhLen: 2, maxEnOnlyLen: 0 },
    XIN概念: { maxWordLines: 0, maxPairs: 8, requireZh: true, minZhLen: 2, maxEnOnlyLen: 0, strictNoise: true },
  };

  function pdfProfile(meta) {
    const section = sectionFromMeta(meta);
    return (
      PDF_SECTION_PROFILES[section] || {
        maxWordLines: 8,
        maxPairs: 10,
        requireZh: false,
        minZhLen: 1,
        maxEnOnlyLen: 40,
      }
    );
  }

  function polishEnLine(text, strict) {
    let en = (text || "").trim();
    en = en.replace(/^Lesson\s*\d+[.:\s-]*/i, "");
    en = en.replace(/\s+/g, " ").trim();
    if (strict && isPdfOcrNoise(en, true)) return "";
    return en;
  }

  function parseWordChip(text) {
    const value = (text || "").trim();
    const match = value.match(/^(.+?)\s+([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef].*)$/);
    if (match) return { en: match[1].trim(), zh: match[2].trim() };
    return { en: value, zh: "" };
  }

  /** PDF 专用：按板块精简为「词汇 + 核心句型」，全站统一规则。 */
  function simplifyBlocksForPdf(rawBlocks, title, meta) {
    const profile = pdfProfile(meta);
    const strict = Boolean(profile.strictNoise);
    const titleKey = normalizePdfKey(title);
    const words = [];
    const headings = [];
    const pairs = [];
    let pendingEn = "";

    for (const block of rawBlocks) {
      if (block.kind === "heading") {
        headings.push(block.text.trim());
        continue;
      }
      if (block.kind === "line") {
        words.push(parseWordChip(block.text));
        continue;
      }
      if (block.kind === "en") {
        pendingEn = block.text.trim();
        continue;
      }
      if (block.kind === "zh") {
        const zh = block.text.trim();
        if (pendingEn) {
          pairs.push({ en: pendingEn, zh });
          pendingEn = "";
        } else if (zh) {
          pairs.push({ en: "", zh });
        }
      }
    }
    if (pendingEn && !isPdfOcrNoise(pendingEn, strict)) {
      pairs.push({ en: pendingEn, zh: "" });
    }

    const seenPair = new Set();
    const cleanPairs = [];
    for (const pair of pairs) {
      let en = polishEnLine(pair.en, strict);
      let zh = pair.zh.trim();
      if (!en && !zh) continue;
      if (en && normalizePdfKey(en) === titleKey) en = "";
      if (isPdfOcrNoise(en, strict) && !zh) continue;
      if (zh && zh.length < profile.minZhLen) zh = "";
      if (profile.requireZh && !zh) continue;
      if (!zh && en) {
        if (profile.maxEnOnlyLen === 0) continue;
        if (en.length > profile.maxEnOnlyLen) continue;
        if (isPdfOcrNoise(en, strict)) continue;
      }
      if (isPdfOcrNoise(en, strict) && zh.length < profile.minZhLen) continue;
      const key = normalizePdfKey(en) + "|" + normalizePdfKey(zh);
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      if (!en && !zh) continue;
      cleanPairs.push({ en, zh });
    }

    const out = [];
    const wordLines = [];
    for (let index = 0; index < words.length; index += 2) {
      const left = words[index];
      const right = words[index + 1];
      let line = left.zh ? left.en + " " + left.zh : left.en;
      if (right) {
        const tail = right.zh ? right.en + " " + right.zh : right.en;
        line += "    ·    " + tail;
      }
      if (line.trim()) wordLines.push(line.trim());
    }
    const wordLimit = profile.maxWordLines;
    if (wordLines.length && wordLimit > 0) {
      out.push({ kind: "heading", text: "词汇" });
      for (const line of wordLines.slice(0, wordLimit)) out.push({ kind: "line", text: line });
    } else if (headings.length) {
      for (const heading of headings.slice(0, 2)) out.push({ kind: "heading", text: heading });
    }

    if (cleanPairs.length) {
      const heading = profile.maxWordLines > 0 ? "句型" : "精读";
      out.push({ kind: "heading", text: heading });
      const pairLimit = profile.maxPairs;
      for (const pair of cleanPairs.slice(0, pairLimit)) {
        if (pair.en) out.push({ kind: "en", text: pair.en });
        if (pair.zh) out.push({ kind: "zh", text: pair.zh });
      }
    } else if (pairs.length) {
      out.push({ kind: "heading", text: "摘要" });
      for (const pair of pairs.slice(0, 3)) {
        const en = polishEnLine(pair.en, strict);
        const zh = pair.zh.trim();
        if (zh && zh.length >= 2) {
          if (en && !isPdfOcrNoise(en, strict)) out.push({ kind: "en", text: en.slice(0, 200) });
          out.push({ kind: "zh", text: zh.slice(0, 320) });
        }
      }
    }
    return out;
  }

  async function bitmapFromSrc(src) {
    if (!src) return null;
    const url = new URL(src, document.baseURI).href;
    if (typeof createImageBitmap !== "function") return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    return createImageBitmap(await response.blob());
  }

  async function bitmapFromImageElement(image) {
    if (!image) return null;
    if (!image.complete || !image.naturalWidth) {
      await new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", reject, { once: true });
      });
    }
    if (!image.naturalWidth || typeof createImageBitmap !== "function") return null;
    return createImageBitmap(image);
  }

  function lessonFromHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const title = doc.querySelector(".reading h2")?.textContent.trim() || "课程";
    const meta = doc.querySelector(".reading .meta")?.textContent.trim() || "";
    const reading = doc.querySelector(".reading");
    const coverSrc = doc.querySelector(".poster img")?.getAttribute("src") || "";
    const raw = blocksForPdfFromReading(reading);
    return {
      title,
      meta,
      blocks: simplifyBlocksForPdf(raw, title, meta),
      coverSrc,
    };
  }

  async function fetchLessonHtml(id) {
    const stem = "lessons/" + encodeURIComponent(id);
    for (const url of [stem, stem + ".html"]) {
      const response = await fetch(url);
      if (response.ok) return response.text();
    }
    throw new Error("404");
  }

  function safeFilename(title) {
    return title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  }

  function triggerDownload(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement("a");
    const safe = (filename || "课程").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
    link.href = URL.createObjectURL(blob);
    link.download = safe.endsWith(".pdf") ? safe : safe + ".pdf";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    return bytes.byteLength || bytes.length;
  }

  async function encodeLessonInWorker(lesson, cover) {
    const transfer = cover ? [cover] : [];
    const result = await workerRequest(
      "encode-lesson",
      {
        lesson: { title: lesson.title, meta: lesson.meta, blocks: lesson.blocks },
        cover: cover || null,
      },
      transfer
    );
    return {
      title: result.title || lesson.title,
      pages: (result.pages || []).map((page) => ({
        jpeg: new Uint8Array(page.jpeg),
        pxWidth: page.pxWidth,
        pxHeight: page.pxHeight,
        ptWidth: page.ptWidth,
        ptHeight: page.ptHeight,
      })),
    };
  }

  async function buildPdfInWorker(pages) {
    const normalized = pages.map((page) => ({
      jpeg: page.jpeg,
      pxWidth: page.pxWidth,
      pxHeight: page.pxHeight,
      ptWidth: page.ptWidth,
      ptHeight: page.ptHeight,
    }));
    const transfer = normalized.map((page) => page.jpeg.buffer);
    const result = await workerRequest("build-pdf", { pages: normalized }, transfer);
    return new Uint8Array(result.pdf);
  }

  /* —— 主线程回退（无 Worker 时） —— */
  function concat(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }

  function pageSize(width, height) {
    const portrait = height >= width;
    const longSide = 842;
    const shortSide = 595;
    return portrait ? { width: shortSide, height: longSide } : { width: longSide, height: shortSide };
  }

  function makeCanvas(ptWidth, ptHeight) {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(ptWidth * scale);
    canvas.height = Math.round(ptHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ptWidth, ptHeight);
    return { canvas, ctx, width: ptWidth, height: ptHeight };
  }

  function wrap(ctx, text, maxWidth) {
    const lines = [];
    let line = "";
    for (const char of Array.from(text || "")) {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char.trim() ? char : "";
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  async function jpegBytes(canvas) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return new Uint8Array(await blob.arrayBuffer());
  }

  function drawCover(image) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const size = pageSize(sourceWidth, sourceHeight);
    const sheet = makeCanvas(size.width, size.height);
    const margin = 28;
    const maxWidth = size.width - margin * 2;
    const maxHeight = size.height - margin * 2;
    const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    const width = sourceWidth * ratio;
    const height = sourceHeight * ratio;
    const x = (size.width - width) / 2;
    const y = (size.height - height) / 2;
    sheet.ctx.drawImage(image, x, y, width, height);
    return sheet;
  }

  function drawTextPages(title, meta, blocks) {
    const width = 595;
    const height = 842;
    const margin = 44;
    const bottom = height - 36;
    const maxWidth = width - margin * 2;

    function layout(scale) {
      const sheet = makeCanvas(width, height);
      let y = margin;
      let overflow = false;

      function write(text, px, color, gap) {
        if (overflow) return;
        const value = (text || "").trim();
        if (!value) return;
        const size = Math.max(9, Math.round(px * scale));
        const font = size + "px " + FONT;
        const lineHeight = size + 6;
        sheet.ctx.font = font;
        const lines = wrap(sheet.ctx, value, maxWidth);
        for (const line of lines) {
          if (y + lineHeight > bottom) {
            overflow = true;
            return;
          }
          sheet.ctx.font = font;
          sheet.ctx.fillStyle = color;
          sheet.ctx.fillText(line, margin, y + lineHeight - 6);
          y += lineHeight;
        }
        y += Math.max(2, Math.round(gap * scale));
      }

      write(meta, 13, "#607484", 6);
      write(title, 26, "#1b2c38", 12);
      for (const block of blocks) {
        if (overflow) break;
        if (block.kind === "heading") write(block.text, 14, "#607484", 6);
        if (block.kind === "en") write(block.text, 18, "#1b2c38", 2);
        if (block.kind === "zh") write(block.text, 14, "#5d7280", 8);
        if (block.kind === "line") write(block.text, 13, "#243846", 4);
      }
      return { sheet, overflow };
    }

    let scale = 1;
    let result = layout(scale);
    while (result.overflow && scale > 0.5) {
      scale -= 0.05;
      result = layout(scale);
    }
    return [result.sheet];
  }

  async function encodeSheetsMain(sheets) {
    const encoded = [];
    for (const sheet of sheets) {
      encoded.push({
        jpeg: await jpegBytes(sheet.canvas),
        pxWidth: sheet.canvas.width,
        pxHeight: sheet.canvas.height,
        ptWidth: sheet.width,
        ptHeight: sheet.height,
      });
      sheet.canvas.width = 0;
      sheet.canvas.height = 0;
      await yieldToMain();
    }
    return encoded;
  }

  function pdfFromJpegsMain(pages) {
    const encoder = new TextEncoder();
    const bodies = [];
    function text(value) {
      return encoder.encode(value);
    }
    const pageIds = [];
    let nextId = 3;
    const records = pages.map((page) => {
      const pageId = nextId++;
      const contentId = nextId++;
      const imageId = nextId++;
      pageIds.push(pageId);
      return { pageId, contentId, imageId, page };
    });
    bodies[1] = text("<< /Type /Catalog /Pages 2 0 R >>");
    bodies[2] = text("<< /Type /Pages /Count " + pages.length + " /Kids [" + pageIds.map((id) => id + " 0 R").join(" ") + "] >>");
    for (const record of records) {
      const content = "q\n" + record.page.ptWidth + " 0 0 " + record.page.ptHeight + " 0 0 cm\n/Im0 Do\nQ\n";
      const contentBytes = text(content);
      bodies[record.pageId] = text(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + record.page.ptWidth + " " + record.page.ptHeight +
        "] /Contents " + record.contentId + " 0 R /Resources << /XObject << /Im0 " + record.imageId + " 0 R >> >> >>"
      );
      bodies[record.contentId] = concat([
        text("<< /Length " + contentBytes.length + " >>\nstream\n"),
        contentBytes,
        text("\nendstream"),
      ]);
      bodies[record.imageId] = concat([
        text(
          "<< /Type /XObject /Subtype /Image /Width " + record.page.pxWidth + " /Height " + record.page.pxHeight +
          " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + record.page.jpeg.length + " >>\nstream\n"
        ),
        record.page.jpeg,
        text("\nendstream"),
      ]);
    }
    const chunks = [text("%PDF-1.4\n")];
    let length = chunks[0].length;
    const offsets = [0];
    for (let id = 1; id < bodies.length; id += 1) {
      offsets[id] = length;
      const piece = concat([text(id + " 0 obj\n"), bodies[id], text("\nendobj\n")]);
      chunks.push(piece);
      length += piece.length;
    }
    const xrefAt = length;
    let xref = "xref\n0 " + bodies.length + "\n0000000000 65535 f \n";
    for (let id = 1; id < bodies.length; id += 1) {
      xref += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
    }
    xref += "trailer\n<< /Size " + bodies.length + " /Root 1 0 R >>\nstartxref\n" + xrefAt + "\n%%EOF";
    chunks.push(text(xref));
    return concat(chunks);
  }

  async function encodeLessonMain(lesson, coverBitmap) {
    const sheets = [];
    if (coverBitmap) sheets.push(drawCover(coverBitmap));
    sheets.push(...drawTextPages(lesson.title, lesson.meta, lesson.blocks));
    if (coverBitmap && typeof coverBitmap.close === "function") coverBitmap.close();
    return encodeSheetsMain(sheets.slice(0, 2));
  }

  async function encodeLesson(lesson, coverBitmap) {
    if (getWorker()) {
      try {
        return await encodeLessonInWorker(lesson, coverBitmap);
      } catch (_) {
        workerFailed = true;
        workerInstance = null;
      }
    }
    const pages = await encodeLessonMain(lesson, coverBitmap);
    return { title: lesson.title, pages };
  }

  async function buildPdf(pages) {
    if (getWorker()) {
      try {
        return await buildPdfInWorker(pages);
      } catch (_) {
        workerFailed = true;
        workerInstance = null;
      }
    }
    return pdfFromJpegsMain(pages);
  }

  async function lessonWithCoverFromHtml(html) {
    const parsed = lessonFromHtml(html);
    let cover = null;
    try {
      cover = await bitmapFromSrc(parsed.coverSrc);
    } catch (_) {
      cover = null;
    }
    const lesson = { title: parsed.title, meta: parsed.meta, blocks: parsed.blocks };
    return { lesson, cover };
  }

  window.exportLessonPdf = async function exportLessonPdf(button) {
    const label = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "正在生成 PDF…";
    }
    try {
      const meta = document.querySelector("#reader .meta")?.textContent.trim() || "";
      const titleEl = document.querySelector("#reader h2");
      const title = titleEl?.textContent.trim() || "课程";
      const blocks = simplifyBlocksForPdf(
        blocksForPdfFromReading(document.querySelector("#reader .reading")),
        title,
        meta
      );
      let cover = null;
      try {
        cover = await bitmapFromImageElement(document.querySelector("#reader .poster img"));
      } catch (_) {
        cover = null;
      }
      const encoded = await encodeLesson({ title, meta, blocks }, cover);
      const bytes = await buildPdf(encoded.pages);
      return triggerDownload(bytes, safeFilename(title));
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = label || "导出 PDF";
      }
    }
  };

  window.exportCatalogBatch = async function exportCatalogBatch(ids, button, onProgress) {
    if (!ids || !ids.length) return 0;
    const label = button ? button.textContent : "";
    if (button) button.disabled = true;
    const failures = [];
    let firstTitle = "";
    const encodedPages = [];
    try {
      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index];
        if (button) button.textContent = "正在生成 " + (index + 1) + "/" + ids.length + "…";
        if (onProgress) onProgress(index + 1, ids.length, id);
        await yieldToMain();
        try {
          const html = await fetchLessonHtml(id);
          const { lesson, cover } = await lessonWithCoverFromHtml(html);
          if (!firstTitle) firstTitle = lesson.title;
          const encoded = await encodeLesson(lesson, cover);
          encodedPages.push(...encoded.pages);
        } catch (error) {
          failures.push(id);
        }
      }
      if (!encodedPages.length) throw new Error("没有可导出的内容");
      if (button) button.textContent = "正在打包 PDF…";
      await yieldToMain();
      const name =
        ids.length === 1 && firstTitle
          ? safeFilename(firstTitle)
          : "英语晨读-批量-" + (ids.length - failures.length) + "节";
      const bytes = await buildPdf(encodedPages);
      const size = triggerDownload(bytes, name);
      if (failures.length && button) {
        button.textContent = "完成（" + failures.length + " 节失败）";
        setTimeout(() => {
          button.textContent = label || "批量导出 PDF";
        }, 2500);
      }
      return size;
    } finally {
      if (button) {
        button.disabled = false;
        if (button.textContent.startsWith("正在生成")) button.textContent = label || "批量导出 PDF";
      }
    }
  };
})();
