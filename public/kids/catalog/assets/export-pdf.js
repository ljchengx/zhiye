/* 把课程导出成 PDF：第一页封面，后面正文；支持单节与目录批量。 */
(function () {
  const FONT = '"Microsoft YaHei","PingFang SC",sans-serif';

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
    return portrait
      ? { width: shortSide, height: longSide }
      : { width: longSide, height: shortSide };
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
    const chars = Array.from(text || "");
    for (const char of chars) {
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
    const size = pageSize(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const sheet = makeCanvas(size.width, size.height);
    const margin = 28;
    const maxWidth = size.width - margin * 2;
    const maxHeight = size.height - margin * 2;
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
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
    const margin = 48;
    const bottom = height - 42;
    const maxWidth = width - margin * 2;
    const pages = [];
    let sheet = makeCanvas(width, height);
    let y = margin;

    function newPage() {
      pages.push(sheet);
      sheet = makeCanvas(width, height);
      y = margin;
    }

    function write(text, font, color, gap) {
      const lineHeight = Number(font.match(/(\d+)px/)[1]) + 8;
      sheet.ctx.font = font;
      const lines = wrap(sheet.ctx, text, maxWidth);
      for (const line of lines) {
        if (y + lineHeight > bottom) newPage();
        sheet.ctx.font = font;
        sheet.ctx.fillStyle = color;
        sheet.ctx.fillText(line, margin, y + lineHeight - 8);
        y += lineHeight;
      }
      y += gap;
    }

    write(meta || "", "13px " + FONT, "#607484", 8);
    write(title || "", "26px " + FONT, "#1b2c38", 18);
    for (const block of blocks) {
      if (block.kind === "heading") write(block.text, "14px " + FONT, "#607484", 8);
      if (block.kind === "en") write(block.text, "18px " + FONT, "#1b2c38", 2);
      if (block.kind === "zh") write(block.text, "14px " + FONT, "#5d7280", 14);
      if (block.kind === "line") write(block.text, "13px " + FONT, "#243846", 6);
    }
    pages.push(sheet);
    return pages;
  }

  function pdfFromJpegs(pages) {
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

  async function loadImageElement(image) {
    if (!image) return null;
    if (!image.complete || !image.naturalWidth) {
      await new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", reject, { once: true });
      });
    }
    return image.naturalWidth ? image : null;
  }

  async function loadImageUrl(src) {
    if (!src) return null;
    const url = new URL(src, document.baseURI).href;
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    return loadImageElement(image);
  }

  async function encodeSheets(sheets) {
    const encoded = [];
    for (const sheet of sheets) {
      encoded.push({
        jpeg: await jpegBytes(sheet.canvas),
        pxWidth: sheet.canvas.width,
        pxHeight: sheet.canvas.height,
        ptWidth: sheet.width,
        ptHeight: sheet.height,
      });
    }
    return encoded;
  }

  async function downloadPdf(encodedPages, filename) {
    const bytes = pdfFromJpegs(encodedPages);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement("a");
    const safe = (filename || "课程").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
    link.href = URL.createObjectURL(blob);
    link.download = safe.endsWith(".pdf") ? safe : safe + ".pdf";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    return bytes.length;
  }

  function safeFilename(title) {
    return title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  }

  async function fetchLessonHtml(id) {
    const stem = "lessons/" + encodeURIComponent(id);
    for (const url of [stem, stem + ".html"]) {
      const response = await fetch(url);
      if (response.ok) return response.text();
    }
    throw new Error("404");
  }

  async function sheetsForLessonHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const title = doc.querySelector(".reading h2")?.textContent.trim() || "课程";
    const meta = doc.querySelector(".reading .meta")?.textContent.trim() || "";
    const reading = doc.querySelector(".reading");
    const blocks = blocksFromReading(reading);
    const sheets = [];
    const coverSrc = doc.querySelector(".poster img")?.getAttribute("src");
    try {
      const cover = await loadImageUrl(coverSrc);
      if (cover) sheets.push(drawCover(cover));
    } catch (_) {
      /* 封面加载失败时仍导出正文 */
    }
    sheets.push(...drawTextPages(title, meta, blocks));
    return { title, sheets };
  }

  window.exportLessonPdf = async function exportLessonPdf(button) {
    const label = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "正在生成 PDF…";
    }
    try {
      const title = document.querySelector("#reader h2")?.textContent.trim() || "课程";
      const meta = document.querySelector("#reader .meta")?.textContent.trim() || "";
      const sheets = [];
      const cover = await loadImageElement(document.querySelector("#reader .poster img"));
      if (cover) sheets.push(drawCover(cover));
      sheets.push(...drawTextPages(title, meta, blocksFromReading(document.querySelector("#reader .reading"))));
      return downloadPdf(await encodeSheets(sheets), safeFilename(title));
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
    try {
      const allSheets = [];
      for (let index = 0; index < ids.length; index += 1) {
        const id = ids[index];
        if (button) button.textContent = "正在生成 " + (index + 1) + "/" + ids.length + "…";
        if (onProgress) onProgress(index + 1, ids.length, id);
        try {
          const html = await fetchLessonHtml(id);
          const lesson = await sheetsForLessonHtml(html);
          if (!firstTitle) firstTitle = lesson.title;
          allSheets.push(...lesson.sheets);
        } catch (error) {
          failures.push(id);
        }
      }
      if (!allSheets.length) throw new Error("没有可导出的内容");
      const name =
        ids.length === 1 && firstTitle
          ? safeFilename(firstTitle)
          : "英语晨读-批量-" + (ids.length - failures.length) + "节";
      const size = await downloadPdf(await encodeSheets(allSheets), name);
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
