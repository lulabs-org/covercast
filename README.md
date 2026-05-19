# Covercast

Next.js 直播室背景编辑器。默认画布为 `941×1672`，适合竖屏直播间背景。所有元素以 SVG 渲染，可通过 OBS「浏览器源」引入直播间。

## 快速开始

```bash
npm install
npm run dev
```

- **编辑器**：`http://localhost:3000`
- **OBS 浏览器源**：本地为 `http://localhost:3000/live`，部署后使用当前站点域名生成

在编辑器里调整文字、颜色、位置、大小和图片素材后，每个浏览器源都是一套独立场景，互不干扰。`/live` 页面每秒自动拉取最新场景，无需手动刷新。

## 功能概览

### 🎨 画布编辑

- **拖拽移动** — 选中元素后在画布上直接拖拽
- **右下角缩放** — 拖拽选中框右下角的黄色手柄调整尺寸
- **属性面板** — 精确设置 X / Y 坐标、宽高、透明度等参数
- **图层管理** — 显示/隐藏、锁定/解锁、上下移动图层顺序
- **快捷键操作** — 点击画布空白处取消选择，点击图层行快速选中

### 🧩 元素类型

| 类型 | 说明 |
| --- | --- |
| **文字** | 支持多行文本、字体、字号、字重、行高、对齐方式 |
| **矩形** | 可设置圆角、纯色/渐变填充、描边、背景切割（视频占位） |
| **椭圆** | 同上，形状为椭圆 |
| **图片** | 上传 PNG / JPG / WebP，支持矩形/圆形裁切、Cover / Contain 适配 |

### 🎛️ 场景设置

- **背景颜色** — 拾色器选择
- **背景透明度** — 0–1 滑块控制，影响底色和光晕

### 🎯 模板系统

内置 5 套模板，覆盖常见直播场景：

| 模板 | 适用场景 |
| --- | --- |
| 双讲师课程 | 双人连麦课程直播 |
| 单人访谈 | 单人开播、公开课、嘉宾访谈 |
| 三人圆桌 | 三人连麦讨论 |
| 发布会海报 | 新课发布、活动预告 |
| 训练营直播 | 课程训练营与实战营 |

支持保存自定义模板到浏览器本地存储，可随时套用或删除。

### 📺 OBS 多源管理

- 同一个模板可以创建多个独立的浏览器源（slot），每个源保存各自的场景数据
- 支持为每个源自定义名称，方便区分
- 一键复制 OBS 源 URL，粘贴到 OBS「浏览器」源即可
- 删除源时自动清理服务端场景文件
- `/live` 页面通过 `?t=<模板ID>&s=<源ID>` 参数区分不同源

### 📤 导出

支持将当前场景导出为 **PNG**、**JPG**、**SVG** 或模板 **JSON**。图片/SVG 导出时会自动将图片素材转为内联 base64，生成独立可用的文件；模板 JSON 可通过编辑器顶部「导入」按钮重新导入为自定义模板。

## 项目结构

```
covercast/
├── app/
│   ├── api/
│   │   ├── assets/
│   │   │   ├── [id]/route.ts    # GET — 读取上传的图片素材
│   │   │   └── route.ts         # POST — 上传图片素材
│   │   └── scene/
│   │       └── route.ts         # GET/POST/DELETE — 场景数据 CRUD
│   ├── components/
│   │   ├── LiveView.tsx          # /live 页面组件，每秒轮询场景
│   │   ├── SceneCanvas.tsx       # SVG 画布渲染组件（编辑器 + 直播共用）
│   │   └── SceneEditor.tsx       # 编辑器主组件（侧栏、工具栏、属性面板）
│   ├── lib/
│   │   ├── scene-svg.ts          # SVG 标记生成工具（导出用）
│   │   ├── scene.ts              # 场景数据模型、类型定义、内置模板
│   │   └── storage.ts            # 文件系统读写封装
│   ├── live/
│   │   └── page.tsx              # /live 路由页
│   ├── globals.css               # 全局样式（Tailwind + 自定义 CSS）
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 编辑器首页
├── public/                        # 静态资源
├── .covercast/                    # 运行时数据（已加入 .gitignore）
│   ├── scene.json                 # 默认场景
│   ├── scenes/<模板>/<源>.json    # 各浏览器源场景
│   └── assets/                    # 上传的图片素材
├── package.json
├── tsconfig.json
├── next.config.ts
└── eslint.config.mjs
```

## 数据存储

运行时的场景和上传素材保存在项目根目录 `.covercast/` 中，该目录已加入 `.gitignore`。

### 文件结构

```
.covercast/
├── scene.json                        # 默认场景数据
├── scenes/
│   └── <templateId>/
│       └── <slotId>.json            # 各浏览器源的独立场景数据
└── assets/
    └── <uuid>.png                   # 上传的图片素材
```

### 多源机制

- 默认场景通过读写 `scene.json`，编辑器首页加载此文件
- 每个浏览器源（slot）独立保存为 `scenes/<templateId>/<slotId>.json`
- API 通过查询参数 `t`（模板 ID）和 `s`（源 ID）定位具体场景
- 素材上传后生成 UUID 文件名，通过 `/api/assets/<id>` 接口提供访问

### 自定义模板

自定义模板保存在浏览器 `localStorage` 中（key: `covercast.customTemplates.v1`），不涉及服务端存储。源名称映射同样保存在 `localStorage`（key: `covercast.slotNames.v1`）。

## API 参考

### `GET /api/scene`

读取场景数据。

| 参数 | 说明 |
| --- | --- |
| `t` + `s` | 指定模板 ID 和源 ID，读取对应浏览器源的场景 |
| `list=1` | 列出所有模板及其下的源列表 |
| （无参数） | 读取默认场景 `scene.json` |

### `POST /api/scene`

写入场景数据。请求体：

```json
{
  "templateId": "dual-course",
  "slotId": "slot-xxx",
  "scene": { ... }
}
```

若省略 `templateId` 和 `slotId`，则写入默认场景文件。

### `DELETE /api/scene`

删除指定浏览器源的场景文件。请求体：

```json
{
  "templateId": "dual-course",
  "slotId": "slot-xxx"
}
```

### `POST /api/assets`

上传图片素材。Content-Type 为 `multipart/form-data`，字段名 `asset`。支持 PNG、JPG、WebP，限制 8MB。返回：

```json
{
  "id": "uuid.png",
  "name": "原始文件名",
  "mime": "image/png",
  "src": "/api/assets/uuid.png"
}
```

### `GET /api/assets/[id]`

以原始格式返回素材文件。

## 技术栈

| 技术 | 说明 |
| --- | --- |
| [Next.js](https://nextjs.org/) 16 | React 全栈框架，App Router |
| [React](https://react.dev/) 19 | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) 5 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) 4 | 原子化 CSS 框架 |
| SVG | 画布渲染格式 |

## 调度到 OBS

1. 在编辑器中创建浏览器源，复制生成的 URL
2. 打开 OBS，添加「浏览器」源
3. 粘贴 URL，建议设置宽度 941、高度 1672
4. 在编辑器中修改场景内容，OBS 画面会在 1 秒内自动同步

> `/live` 页面背景为透明，在 OBS 中叠加到摄像头画面下方即可。

## 验证

```bash
npm run lint
npm run build
```
