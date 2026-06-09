/**
 * 字体数据层 —— 字体分类、常用字体列表、Web 字体 URL 映射
 *
 * 设计原则：
 * - 数据与 UI / 业务逻辑完全分离
 * - 所有「推荐」字体均提供 Web Font CDN，确保 Vercel 部署后跨平台可用
 * - 系统字体（无 Web Font）在 UI 中标记「需本地安装」，引导用户导入本地字体
 * - 本地字体通过 FontFace API 动态注册，无需在此处定义
 */

// ────────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────────

export type FontCategory =
  | "推荐"
  | "中文黑体"
  | "中文宋体"
  | "中文楷体"
  | "中文圆体"
  | "中文艺术体"
  | "等宽字体"
  | "西文字体";

export type WebFontSource = {
  /** Google Fonts 或其他 CDN 的 CSS 地址 */
  url: string;
};

export type FontDefinition = {
  /** 显示名称（WPS 风格，中文名在前） */
  label: string;
  /** CSS font-family 值 */
  family: string;
  /** 完整的 CSS font-family 栈（含 fallback） */
  stack: string;
  /** 字体分类 */
  category: FontCategory;
  /** Web 字体来源（有值则跨平台可用，无值则依赖系统安装） */
  webFont?: WebFontSource;
  /** 是否为推荐字体（在"推荐"分类中置顶显示） */
  recommended?: boolean;
};

export type LocalFontEntry = {
  /** 唯一标识 */
  id: string;
  /** 用户自定义的字体名称 */
  name: string;
  /** 通过 FontFace API 注册后的 family 名 */
  family: string;
  /** 字体文件的 Object URL 或 Blob URL */
  objectUrl: string;
  /** 原始文件名 */
  fileName: string;
};

// ────────────────────────────────────────────
// 默认字体栈（与 scene.ts 保持一致）
// ────────────────────────────────────────────

export const DEFAULT_FONT_FAMILY =
  '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif';

// ────────────────────────────────────────────
// 内置字体列表
// ────────────────────────────────────────────

export const BUILT_IN_FONTS: FontDefinition[] = [
  // ── 推荐（全部有 Web Font CDN，跨平台可用） ──
  {
    label: "思源黑体",
    family: "Noto Sans SC",
    stack: '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap",
    },
  },
  {
    label: "思源宋体",
    family: "Noto Serif SC",
    stack: '"Noto Serif SC", "Source Han Serif SC", "SimSun", serif',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700;900&display=swap",
    },
  },
  {
    label: "马善政楷体",
    family: "Ma Shan Zheng",
    stack: '"Ma Shan Zheng", "Kaiti SC", KaiTi, serif',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap",
    },
  },
  {
    label: "站酷庆科黄油体",
    family: "ZCOOL QingKe HuangYou",
    stack: '"ZCOOL QingKe HuangYou", "PingFang SC", sans-serif',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&display=swap",
    },
  },
  {
    label: "站酷快乐体",
    family: "ZCOOL KuaiLe",
    stack: '"ZCOOL KuaiLe", "PingFang SC", sans-serif',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap",
    },
  },
  {
    label: "站酷小薇LOGO体",
    family: "ZCOOL XiaoWei",
    stack: '"ZCOOL XiaoWei", "PingFang SC", serif',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap",
    },
  },
  {
    label: "刘建毛草",
    family: "Liu Jian Mao Cao",
    stack: '"Liu Jian Mao Cao", "PingFang SC", cursive',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=Liu+Jian+Mao+Cao&display=swap",
    },
  },
  {
    label: "龙藏体",
    family: "Long Cang",
    stack: '"Long Cang", "PingFang SC", cursive',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=Long+Cang&display=swap",
    },
  },
  {
    label: "智忙星体",
    family: "Zhi Mang Xing",
    stack: '"Zhi Mang Xing", "PingFang SC", cursive',
    category: "推荐",
    recommended: true,
    webFont: {
      url: "https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap",
    },
  },

  // ── 中文黑体（系统字体，需本地安装） ──
  {
    label: "苹方",
    family: "PingFang SC",
    stack: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    category: "中文黑体",
  },
  {
    label: "微软雅黑",
    family: "Microsoft YaHei",
    stack: '"Microsoft YaHei", "PingFang SC", sans-serif',
    category: "中文黑体",
  },
  {
    label: "黑体",
    family: "SimHei",
    stack: 'SimHei, "Microsoft YaHei", sans-serif',
    category: "中文黑体",
  },
  {
    label: "华文黑体",
    family: "STHeiti",
    stack: '"STHeiti", "Heiti SC", "Microsoft YaHei", sans-serif',
    category: "中文黑体",
  },
  {
    label: "冬青黑体",
    family: "Hiragino Sans GB",
    stack: '"Hiragino Sans GB", "PingFang SC", "Microsoft YaHei", sans-serif',
    category: "中文黑体",
  },

  // ── 中文宋体（系统字体，需本地安装） ──
  {
    label: "宋体",
    family: "SimSun",
    stack: 'SimSun, "Songti SC", serif',
    category: "中文宋体",
  },
  {
    label: "华文宋体",
    family: "STSong",
    stack: '"STSong", "Songti SC", SimSun, serif',
    category: "中文宋体",
  },
  {
    label: "华文中宋",
    family: "STZhongsong",
    stack: '"STZhongsong", SimSun, serif',
    category: "中文宋体",
  },

  // ── 中文楷体（系统字体，需本地安装） ──
  {
    label: "楷体",
    family: "KaiTi",
    stack: 'KaiTi, "Kaiti SC", serif',
    category: "中文楷体",
  },
  {
    label: "华文楷体",
    family: "STKaiti",
    stack: '"STKaiti", "Kaiti SC", KaiTi, serif',
    category: "中文楷体",
  },

  // ── 中文圆体（系统字体，需本地安装） ──
  {
    label: "幼圆",
    family: "YouYuan",
    stack: '"YouYuan", "PingFang SC", sans-serif',
    category: "中文圆体",
  },
  {
    label: "华文圆体",
    family: "STYuanti",
    stack: '"STYuanti", "YouYuan", "PingFang SC", sans-serif',
    category: "中文圆体",
  },

  // ── 中文艺术体（系统字体，需本地安装） ──
  {
    label: "华文彩云",
    family: "STCaiyun",
    stack: '"STCaiyun", "PingFang SC", sans-serif',
    category: "中文艺术体",
  },
  {
    label: "华文隶书",
    family: "STLiti",
    stack: '"STLiti", "PingFang SC", serif',
    category: "中文艺术体",
  },
  {
    label: "隶书",
    family: "LiSu",
    stack: '"LiSu", "STLiti", serif',
    category: "中文艺术体",
  },
  {
    label: "方正舒体",
    family: "FZShuTi",
    stack: '"FZShuTi", "STLiti", serif',
    category: "中文艺术体",
  },
  {
    label: "方正姚体",
    family: "FZYaoti",
    stack: '"FZYaoti", "PingFang SC", sans-serif',
    category: "中文艺术体",
  },

  // ── 等宽字体 ──
  {
    label: "更纱黑体等宽",
    family: "Sarasa Mono SC",
    stack: '"Sarasa Mono SC", "Source Han Mono SC", "Microsoft YaHei", monospace',
    category: "等宽字体",
  },
  {
    label: "等宽字体",
    family: "monospace",
    stack: '"SF Mono", "Cascadia Code", "Fira Code", "Consolas", monospace',
    category: "等宽字体",
  },

  // ── 西文字体 ──
  {
    label: "Arial",
    family: "Arial",
    stack: "Arial, Helvetica, sans-serif",
    category: "西文字体",
  },
  {
    label: "Helvetica",
    family: "Helvetica",
    stack: "Helvetica, Arial, sans-serif",
    category: "西文字体",
  },
  {
    label: "Times New Roman",
    family: "Times New Roman",
    stack: '"Times New Roman", Times, serif',
    category: "西文字体",
  },
  {
    label: "Georgia",
    family: "Georgia",
    stack: "Georgia, serif",
    category: "西文字体",
  },
  {
    label: "Verdana",
    family: "Verdana",
    stack: "Verdana, Geneva, sans-serif",
    category: "西文字体",
  },
];

// ────────────────────────────────────────────
// 分类顺序
// ────────────────────────────────────────────

export const FONT_CATEGORY_ORDER: FontCategory[] = [
  "推荐",
  "中文黑体",
  "中文宋体",
  "中文楷体",
  "中文圆体",
  "中文艺术体",
  "等宽字体",
  "西文字体",
];

// ────────────────────────────────────────────
// 工具函数
// ────────────────────────────────────────────

/** 根据 CSS font-family 栈查找内置字体定义 */
export function findBuiltInFont(stack: string): FontDefinition | null {
  const normalized = stack.trim();
  return BUILT_IN_FONTS.find((f) => f.stack.trim() === normalized) ?? null;
}

/** 根据字体 family 名查找内置字体定义 */
export function findBuiltInFontByFamily(family: string): FontDefinition | null {
  return BUILT_IN_FONTS.find((f) => f.family === family) ?? null;
}

/** 获取需要从 CDN 加载的 Web 字体列表（去重） */
export function getWebFontsToLoad(): FontDefinition[] {
  return BUILT_IN_FONTS.filter((f) => f.webFont);
}

/** 判断字体是否为 Web 字体（跨平台可用） */
export function isWebFont(font: FontDefinition): boolean {
  return font.webFont != null;
}

/** 预览文字 */
export const FONT_PREVIEW_TEXT = "直播背景 Aa 123";
