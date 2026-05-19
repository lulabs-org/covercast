# Covercast

Next.js OBS 直播背景编辑器。默认画布为 `941×1672`，适合竖屏直播间背景。

## 使用

```bash
npm run dev
```

- 编辑器：`http://localhost:3000`
- OBS Browser Source：`http://localhost:3000/live`

在编辑器里调整文字、颜色、位置、大小和图片素材后，点击“保存到 OBS”。`/live` 页面会每秒读取一次最新场景。

## 数据

运行时场景和上传素材保存在本地 `.covercast/` 目录中，该目录已加入 `.gitignore`。

## 验证

```bash
npm run lint
npm run build
```
