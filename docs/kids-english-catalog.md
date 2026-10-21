# 英语晨读目录（/kids/catalog）

## 在站点中的位置

- **首页入口**：`/kids` →「阅读目录」→ `/kids/catalog/index.html`（避免被 `/kids/[slug]` 接走）。Vercel 上 `/kids/catalog` 会重写到同一页。
- **静态文件**：`public/kids/catalog/`（由 `wo-d` 仓库同步，勿手改）
- **注册表**：`lib/tools/kids-registry.ts` 中 `english-catalog`，`format: "library"`，`component: "static-site"`（不生成 `/kids/english-catalog` 的 Next 页面，避免与静态目录冲突）

## 发布前

```bash
npm run sync:catalog
npm run build
```

## 架构示意

```mermaid
flowchart LR
  subgraph wo_d [wo-d]
    data[data/catalog.json + ocr]
    build[work/build.py]
    site[site/]
    data --> build --> site
  end
  subgraph ai_tools [ai_tools]
    public[public/kids/catalog/]
    next[next build export]
    vercel[Vercel CDN]
    public --> next --> vercel
  end
  site -->|sync_ai_tools.py| public
```
