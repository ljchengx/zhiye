import { describe, expect, it } from "vitest";

import { decodeBase64, encodeBase64, TextTransformError } from "../lib/tools/base64";
import { formatJson, getJsonStructureStats, getJsonSummary, JsonTransformError, minifyJson } from "../lib/tools/json";
import { stripMarkdown } from "../lib/tools/markdown";
import { getKidsToolByPath, getKidsToolsByFormat, kidsToolDefinitions } from "../lib/tools/kids-registry";
import { searchTools } from "../lib/tools/registry";
import { matchWorksheetCharacterAsset } from "../lib/tools/math-local-assets";
import { getWorksheetCompanionGreeting } from "../lib/tools/math-picture-assets";
import {
  dateTimeToTimestamp,
  detectTimestampUnit,
  timestampToDate,
  TimestampTransformError,
} from "../lib/tools/timestamp";

describe("Base64 文本转换", () => {
  it("使用 UTF-8 正确编码和解码中文与 Emoji", () => {
    const source = "你好，MORPH 🙂";

    expect(decodeBase64(encodeBase64(source))).toBe(source);
  });

  it("允许解码内容中常见的换行空白", () => {
    expect(decodeBase64("SGVs\nbG8gV29ybGQ=")).toBe("Hello World");
  });

  it("拒绝非法 Base64", () => {
    expect(() => decodeBase64("%%%")) .toThrow(TextTransformError);
    expect(() => decodeBase64("a")) .toThrow("Base64 长度无效");
  });

  it("支持无填充的 URL-safe Base64，并自动识别解码", () => {
    const source = "你好🙂";
    const urlSafe = encodeBase64(source, { variant: "url" });

    expect(urlSafe).not.toMatch(/[+/=]/);
    expect(decodeBase64(urlSafe)).toBe(source);
    expect(encodeBase64(source, { variant: "url", padding: true }).endsWith("==")).toBe(true);
  });
});

describe("JSON 处理", () => {
  it("格式化并压缩严格 JSON", () => {
    const source = '{"name":"MORPH","items":[1,true]}';

    expect(formatJson(source)).toBe('{\n  "name": "MORPH",\n  "items": [\n    1,\n    true\n  ]\n}');
    expect(minifyJson(formatJson(source))).toBe(source);
  });

  it("为无效 JSON 提供位置", () => {
    const source = '{\n  "name": "MORPH",\n  "enabled": true,\n}';

    try {
      formatJson(source);
      throw new Error("Expected JSON formatting to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(JsonTransformError);
      const transformError = error as JsonTransformError;
      expect(transformError.location.line).toBeGreaterThanOrEqual(3);
      expect(transformError.location.column).toBeGreaterThan(0);
    }
  });

  it("支持可选缩进、递归键排序和结构摘要", () => {
    const source = '{"z":1,"a":{"d":2,"b":3}}';

    expect(formatJson(source, { indentation: 4, sortKeys: true })).toBe(
      '{\n    "a": {\n        "b": 3,\n        "d": 2\n    },\n    "z": 1\n}',
    );
    expect(getJsonSummary(JSON.parse(source))).toEqual({ kind: "object", entries: 2, nodes: 5, depth: 3 });
    expect(getJsonStructureStats(JSON.parse(source))).toEqual({ objects: 2, arrays: 0, keyValuePairs: 4 });
  });
});

describe("Markdown 清理", () => {
  it("保留阅读结构并移除常见 Markdown 语法", () => {
    const source = [
      "# 标题",
      "",
      "这是 **加粗** 与 [链接](https://example.com)。",
      "",
      "![替代文字](image.png)",
      "",
      "> 引用内容",
      "",
      "```ts",
      "const value = 1;",
      "```",
      "",
      "| 名称 | 值 |",
      "| --- | --- |",
      "| A | B |",
    ].join("\n");

    expect(stripMarkdown(source)).toBe(
      ["标题", "这是 加粗 与 链接。", "", "替代文字", "", "引用内容", "", "const value = 1;", "", "名称\t值\nA\tB"].join("\n"),
    );
  });

  it("保留有序、嵌套和任务列表的阅读顺序", () => {
    const source = [
      "1. 第一项",
      "   - 子项",
      "   - [x] 已完成",
      "2. 第二项",
    ].join("\n");

    expect(stripMarkdown(source)).toBe("1. 第一项\n  - 子项\n  - [x] 已完成\n2. 第二项");
    expect(stripMarkdown("# 标题\n\n第一段\n\n第二段", { compact: true })).toBe("标题\n第一段\n第二段");
    expect(stripMarkdown("# 第一节\n\n正文\n\n# 第二节\n\n内容", { compact: true }))
      .toBe("第一节\n正文\n\n第二节\n内容");
  });

  it("会继续清理 text 代码块中的 Markdown，而保留真实代码块", () => {
    expect(stripMarkdown("```text\n# 文本标题\n\n**正文**\n```"))
      .toBe("文本标题\n正文");
    expect(stripMarkdown("```ts\n# 这是一行代码\n```"))
      .toBe("# 这是一行代码");
  });
});

describe("数学练习本地角色素材", () => {
  it("只识别约定的角色文件名，并支持递归文件夹路径", () => {
    expect(matchWorksheetCharacterAsset("characters/number-block-11.png")).toBe("number-block-11");
    expect(matchWorksheetCharacterAsset("number-blocks/11Better.png")).toBe("number-block-11");
    expect(matchWorksheetCharacterAsset("characters/bowser_jr.jpg")).toBe("bowser-jr");
    expect(matchWorksheetCharacterAsset("characters/number-block-21.png")).toBeNull();
    expect(matchWorksheetCharacterAsset("notes/holiday-photo.png")).toBeNull();
  });

  it("页眉开场白按角色和当天任务生成", () => {
    expect(getWorksheetCompanionGreeting("number-block-7", "看图列式与一步应用题")).toBe("今天我是 7，我们来看图列式");
    expect(getWorksheetCompanionGreeting("mario", "数的组成与分解")).toBe("今天和我一起把一个数拆开");
    expect(getWorksheetCompanionGreeting("number-block-1", "竖式加法·个位进位")).toBe("今天我是 1，我们来对齐数位再加");
  });

});

describe("时间戳转换", () => {
  it("支持 Unix 纪元与负时间戳", () => {
    expect(timestampToDate("0", "seconds").date.toISOString()).toBe("1970-01-01T00:00:00.000Z");
    expect(timestampToDate(-1, "seconds").date.toISOString()).toBe("1969-12-31T23:59:59.000Z");
  });

  it("自动识别秒和毫秒并保持同一时刻", () => {
    expect(detectTimestampUnit("1723456789")).toBe("seconds");
    expect(detectTimestampUnit("1723456789000")).toBe("milliseconds");
    expect(timestampToDate("1723456789").date.getTime()).toBe(timestampToDate("1723456789000").date.getTime());
  });

  it("按 UTC 日期生成秒和毫秒时间戳", () => {
    expect(dateTimeToTimestamp("1970-01-01T00:00:00", "seconds", "utc")).toBe(0);
    expect(dateTimeToTimestamp("2024-01-02T03:04:05.123", "milliseconds", "utc")).toBe(Date.UTC(2024, 0, 2, 3, 4, 5, 123));
  });

  it("拒绝非数字时间戳和不存在的日期", () => {
    expect(() => timestampToDate("abc")).toThrow(TimestampTransformError);
    expect(() => dateTimeToTimestamp("2024-02-30T12:00:00", "seconds", "local")).toThrow("该日期不存在");
  });
});

describe("工具注册表", () => {
  it("支持中文和英文关键词搜索，通用工具不包含启蒙工具", () => {
    expect(searchTools("编码").map((tool) => tool.slug)).toEqual(["base64"]);
    expect(searchTools("JSON").map((tool) => tool.slug)).toEqual(["json-formatter"]);
    expect(searchTools("markdown").map((tool) => tool.slug)).toEqual(["markdown-cleaner"]);
    expect(searchTools("身份证").map((tool) => tool.slug)).toEqual(["image-watermark"]);
    expect(searchTools("时间戳").map((tool) => tool.slug)).toEqual(["timestamp-converter"]);
    expect(searchTools("口算")).toEqual([]);
  });
});

describe("启蒙工具注册表", () => {
  it("区分无状态打印工具与空间积木互动模块", () => {
    expect(kidsToolDefinitions.map((tool) => tool.slug)).toEqual(["math-worksheet", "pinyin-worksheet", "spatial-blocks"]);
    expect(new Set(kidsToolDefinitions.map((tool) => tool.href)).size).toBe(kidsToolDefinitions.length);
    expect(kidsToolDefinitions[0]?.summary).toContain("两个 30 天");
    expect(kidsToolDefinitions[0]?.summary).toContain("生活数学");
    expect(getKidsToolByPath("math-worksheet")?.href).toBe("/kids/math-worksheet");
    expect(getKidsToolByPath("pinyin-worksheet")?.href).toBe("/kids/pinyin-worksheet");
    expect(getKidsToolByPath("spatial-blocks")?.href).toBe("/kids/spatial-blocks");
    expect(kidsToolDefinitions.map((tool) => ({ format: tool.format, domain: tool.domain, estimatedMinutes: tool.estimatedMinutes }))).toEqual([
      { format: "printable", domain: "math", estimatedMinutes: 15 },
      { format: "printable", domain: "pinyin", estimatedMinutes: 10 },
      { format: "interactive", domain: "spatial", estimatedMinutes: 8 },
    ]);
    expect(getKidsToolsByFormat("printable").map((tool) => tool.slug)).toEqual(["math-worksheet", "pinyin-worksheet"]);
    expect(getKidsToolsByFormat("printable").every((tool) => !("activityId" in tool))).toBe(true);
    expect(getKidsToolsByFormat("interactive").map((tool) => ({ slug: tool.slug, activityId: tool.activityId }))).toEqual([
      { slug: "spatial-blocks", activityId: "spatial-blocks" },
    ]);
    expect(getKidsToolsByFormat("creative")).toEqual([]);
  });
});
