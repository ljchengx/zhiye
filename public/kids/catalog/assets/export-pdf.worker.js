/* PDF 绘制与打包在 Worker + OffscreenCanvas 中执行，不占用页面主线程。 */
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
    const canvas = new OffscreenCanvas(Math.round(ptWidth * scale), Math.round(ptHeight * scale));
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
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.86 });
    return new Uint8Array(await blob.arrayBuffer());
  }

  function drawCover(image) {
    const sourceWidth = image.width;
    const sourceHeight = image.height;
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

  /** 每课只允许 1 页正文：自动缩小字号，避免空白尾页与第三页。 */
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

  async function encodeLesson(lesson, cover) {
    const sheets = [];
    if (cover) sheets.push(drawCover(cover));
    sheets.push(...drawTextPages(lesson.title, lesson.meta, lesson.blocks || []));
    return encodeSheets(sheets.slice(0, 2));
  }

  function normalizePages(pages) {
    return pages.map((page) => ({
      jpeg: page.jpeg instanceof Uint8Array ? page.jpeg : new Uint8Array(page.jpeg),
      pxWidth: page.pxWidth,
      pxHeight: page.pxHeight,
      ptWidth: page.ptWidth,
      ptHeight: page.ptHeight,
    }));
  }

  self.onmessage = async (event) => {
    const data = event.data || {};
    const seq = data.seq;
    const type = data.type;
    try {
      if (type === "encode-lesson") {
        const cover = data.cover || null;
        const pages = await encodeLesson(data.lesson, cover);
        if (cover && typeof cover.close === "function") cover.close();
        const transfer = pages.map((page) => page.jpeg.buffer);
        self.postMessage({ seq, type, ok: true, title: data.lesson.title, pages }, transfer);
        return;
      }
      if (type === "build-pdf") {
        const pages = normalizePages(data.pages || []);
        const pdf = pdfFromJpegs(pages);
        self.postMessage({ seq, type, ok: true, pdf }, [pdf.buffer]);
        return;
      }
      throw new Error("unknown worker command: " + type);
    } catch (error) {
      self.postMessage({ seq, type, ok: false, message: error && error.message ? error.message : String(error) });
    }
  };
})();
