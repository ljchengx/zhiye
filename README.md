# 知页 ZHIYE

知页是面向 AI 时代的浏览器本地工具箱，注重视觉品质、使用效率与内容隐私。目前提供 Base64 编解码、JSON 格式化、Markdown 清理、时间戳转换、图片水印和幼小数学练习六项工具。

> 聪明处理，止于本页。

所有文本与图片处理均在浏览器本地完成，不需要账号、数据库或服务端 API，也不会上传用户输入内容。

## 功能

| 工具 | 路由 | 能力 |
| --- | --- | --- |
| 幼小数学练习 | /math-worksheet | 生成每天一张的 30 天连续练习，包含相邻数、比大小和口算，支持主题自选、逐步加入两位数与 200 以内三个数加减混合，并导出 30 页 A4 PDF |
| Base64 编解码 | `/base64` | UTF-8 编解码、URL-safe、结果交换与下载 |
| JSON 格式化 | `/json` | 格式化、压缩、校验、键排序、错误定位与结构视图 |
| Markdown 清理 | `/markdown` | 基于 AST 移除 Markdown 标记，保留列表、代码、链接文字与表格结构 |
| 时间戳转换 | `/timestamp` | Unix 秒/毫秒时间戳与本地或 UTC 日期时间双向转换 |
| 图片水印 | `/image-watermark` | 本地上传图片，实时调整文本、颜色、透明度与角度，并按原尺寸导出 |

首页 `/` 是独立的产品介绍页，包含可拖拽的工具物理实验台、自动轮播的视觉展台和全部工具入口。工作台 `/tools` 用于集中选择工具，进入具体工具后可通过侧边导航快速切换。

## 键盘操作

- 时间戳转换的单行输入框按 `Enter` 执行转换。
- Base64、JSON 和 Markdown 的多行编辑器按 `Ctrl + Enter` 执行；macOS 使用 `Command + Enter`。
- 多行编辑器中的普通 `Enter` 仍用于换行，中文输入法组合输入不会误触发执行。
- 图片水印采用实时预览，无需手动触发生成。

## 设计特点

- 冷雾灰画布与低饱和矿物绿强调色
- 使用 CSS Variables 统一管理颜色、字号、间距、圆角、阴影与动效
- 首页物理实验台支持拖拽和随机重置，工具实体可直接进入对应页面
- 视觉展台支持自动轮播与桌面端轻微视差，鼠标悬停或键盘聚焦时暂停
- 桌面端保持高效分栏，移动端自动切换为纵向工作流
- 支持 `prefers-reduced-motion`，减少动态效果时仍可完整使用
- 图片和文本结果均作为本地数据处理，不进行 HTML 注入

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript
- Motion + Matter.js
- unified、remark-parse、remark-gfm
- Vitest + Playwright

## 本地开发

环境要求：Node.js 20.9 或更高版本。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。如需允许局域网设备访问，可以运行：

```bash
npm run dev -- --hostname 0.0.0.0
```

## 验证

```bash
# TypeScript 类型检查
npm run typecheck

# 单元测试
npm test

# 端到端测试
npm run test:e2e

# 生产构建与静态导出
npm run build
```

项目使用 `output: "export"`，生产构建生成的静态文件位于 `out/`。

## 部署到 Vercel

1. 在 Vercel 中导入本仓库。
2. Framework Preset 选择 Next.js，其他构建配置保持默认。
3. 部署即可，无需配置环境变量、数据库或外部服务。

也可以通过 Vercel CLI 部署：

```bash
npx vercel
```

## 许可与商业授权

本项目采用 [PolyForm Noncommercial License 1.0.0](./LICENSE)。源码可以查看，个人学习、研究、实验、教育和其他非商业用途可以免费使用；商业产品、公司内部业务、SaaS、客户交付、再分发和销售等用途需要先购买书面商业授权。

因此，本项目属于“源码可见许可”，不是允许商业使用的 OSI 认证开源协议。商业授权范围与费用请查看 [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md)，或联系 EverettStone1990@gmail.com。

## 项目结构

```text
app/                         页面、静态路由与全局设计令牌
components/                  产品主页、物理实验台、工作台、导航和工具交互组件
lib/tools/                   Base64、JSON、Markdown、时间戳和数学练习纯处理逻辑
lib/tools/registry.ts        工具注册表与搜索信息
public/home-carousel/        首页视觉展台图片
e2e/                         Playwright 端到端测试
tests/                       Vitest 单元测试
```

## 扩展工具

新增工具时，需要：

1. 在 `lib/tools/registry.ts` 注册工具定义、关键词和页面元数据。
2. 在 `lib/tools/` 中实现可独立测试的处理逻辑。
3. 在 `components/` 中实现工作台界面，并在动态工具路由中关联组件。
4. 为核心逻辑和主要用户流程补充单元测试与端到端测试。

工具注册表同时驱动静态路由和侧边导航，新增能力不需要复制页面外壳。
