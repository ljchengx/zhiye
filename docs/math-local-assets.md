# 数学练习本地素材

数学练习支持从用户主动选择的本地文件夹读取角色图片。浏览器只在当前页面创建本地对象 URL，图片不会上传到服务器，也不会写入项目目录。

推荐目录结构：

```text
数学角色素材/
└─ characters/
   ├─ number-block-1.png
   ├─ number-block-2.png
   ├─ ...
   ├─ number-block-20.png
   ├─ mario.png
   ├─ luigi.png
   ├─ bowser-jr.png
   └─ boo.png
```

支持 `png` 和 `jpg/jpeg`。文件名使用角色名或 `number-block-1` 到 `number-block-20` 时会自动匹配；无法匹配的图片会被忽略。同名文件同时存在时，优先使用 `characters` 路径下的文件。

选择文件夹后，A4 预览、浏览器打印和 PDF Worker 都使用本地图片。清除本地素材或刷新页面后，会恢复使用内置兜底资源；页面刷新不会保留文件夹授权，需要再次选择。

只应加载自己拥有或已获得使用授权的素材。
