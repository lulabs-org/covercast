/**
 * 字体配置：定义所有可选字体，含分类、授权信息、fallback 栈和 Web 字体文件路径。
 *
 * 授权说明：
 * - SIL OFL 1.1：完全开源免费，可商用、可嵌入 Web
 * - 免费商用：厂商授权免费商用，可嵌入 Web
 * - 系统字体：依赖用户操作系统，不嵌入字体文件，使用 CSS fallback
 *
 * 字体文件：
 * - 运行 `node scripts/download-fonts.mjs` 下载 woff2 文件到 public/fonts/
 * - 默认字体（思源黑体）通过 @font-face 预加载
 * - 其他字体在用户选择时按需加载
 */

export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display'
export type FontLicense = 'SIL OFL 1.1' | '免费商用' | '系统字体'

/** 字体文件描述：一个字重对应一个 woff2 文件 */
export interface FontFile {
  weight: number
  path: string
}

export interface FontOption {
  /** 显示名称 */
  label: string
  /** CSS font-family 首选名称（用于 @font-face 和 FontFace API） */
  family: string
  /** CSS font-family 完整值（含 fallback 栈） */
  value: string
  /** 字体分类 */
  category: FontCategory
  /** 授权类型 */
  license: FontLicense
  /** 分组键名 */
  group: string
  /** 可下载的 woff2 字体文件；系统字体为空数组 */
  files: FontFile[]
}

// ─── 分组定义 ────────────────────────────────────────────

const GROUP_OPEN_SOURCE = '开源免费字体'
const GROUP_SYSTEM = '系统字体'

// ─── 开源免费字体 ────────────────────────────────────────

const OPEN_SOURCE_FONTS: FontOption[] = [
  // 思源系列
  {
    label: '思源黑体',
    family: 'Noto Sans SC',
    value: '"Noto Sans SC", "Source Han Sans SC", sans-serif',
    category: 'sans-serif',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/noto-sans-sc-400.woff2' },
      { weight: 700, path: '/fonts/noto-sans-sc-700.woff2' },
      { weight: 900, path: '/fonts/noto-sans-sc-900.woff2' },
    ],
  },
  {
    label: '思源宋体',
    family: 'Noto Serif SC',
    value: '"Noto Serif SC", "Source Han Serif SC", serif',
    category: 'serif',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/noto-serif-sc-400.woff2' },
      { weight: 700, path: '/fonts/noto-serif-sc-700.woff2' },
      { weight: 900, path: '/fonts/noto-serif-sc-900.woff2' },
    ],
  },
  // 阿里巴巴系列
  {
    label: '阿里巴巴普惠体',
    family: 'Alibaba PuHuiTi',
    value: '"Alibaba PuHuiTi", "Alibaba PuHuiTi 3.0", sans-serif',
    category: 'sans-serif',
    license: '免费商用',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/AlibabaPuHuiTi-3-55-RegularL3.woff2' },
      { weight: 500, path: '/fonts/AlibabaPuHuiTi-3-65-Medium.woff2' },
      { weight: 700, path: '/fonts/AlibabaPuHuiTi-3-85-Bold.woff2' },
    ],
  },
  // 站酷系列
  {
    label: '站酷快乐体',
    family: 'ZCOOL KuaiLe',
    value: '"ZCOOL KuaiLe", sans-serif',
    category: 'display',
    license: '免费商用',
    group: GROUP_OPEN_SOURCE,
    files: [{ weight: 400, path: '/fonts/zcool-kuaile-400.woff2' }],
  },
  {
    label: '站酷高端黑',
    family: 'ZCOOL QingKe HuangYou',
    value: '"ZCOOL QingKe HuangYou", sans-serif',
    category: 'display',
    license: '免费商用',
    group: GROUP_OPEN_SOURCE,
    files: [{ weight: 400, path: '/fonts/zcool-qingke-400.woff2' }],
  },
  {
    label: '站酷文艺体',
    family: 'ZCOOL XiaoWei',
    value: '"ZCOOL XiaoWei", serif',
    category: 'display',
    license: '免费商用',
    group: GROUP_OPEN_SOURCE,
    files: [{ weight: 400, path: '/fonts/zcool-xiaowei-400.woff2' }],
  },
  // 优设系列
  {
    label: '优设标题黑',
    family: 'YouSheBiaoTiHei',
    value: '"YouSheBiaoTiHei", sans-serif',
    category: 'display',
    license: '免费商用',
    group: GROUP_OPEN_SOURCE,
    files: [{ weight: 400, path: '/fonts/YouSheBiaoTiHei-2.woff2' }],
  },
  // 等宽字体
  {
    label: '等距更纱黑体',
    family: 'Sarasa Mono SC',
    value: '"Sarasa Mono SC", "Source Han Mono SC", monospace',
    category: 'monospace',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 300, path: '/fonts/SarasaGothicSC-Light.woff2' },
      { weight: 400, path: '/fonts/SarasaGothicSC-Regular.woff2' },
      { weight: 700, path: '/fonts/SarasaGothicSC-Bold.woff2' },
    ],
  },
  {
    label: 'Fira Code',
    family: 'Fira Code',
    value: '"Fira Code", monospace',
    category: 'monospace',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/fira-code-400.woff2' },
      { weight: 700, path: '/fonts/fira-code-700.woff2' },
    ],
  },
  {
    label: 'JetBrains Mono',
    family: 'JetBrains Mono',
    value: '"JetBrains Mono", monospace',
    category: 'monospace',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/jetbrains-mono-400.woff2' },
      { weight: 700, path: '/fonts/jetbrains-mono-700.woff2' },
    ],
  },
  // 英文字体
  {
    label: 'Inter',
    family: 'Inter',
    value: '"Inter", sans-serif',
    category: 'sans-serif',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/inter-400.woff2' },
      { weight: 700, path: '/fonts/inter-700.woff2' },
      { weight: 900, path: '/fonts/inter-900.woff2' },
    ],
  },
  {
    label: 'Montserrat',
    family: 'Montserrat',
    value: '"Montserrat", sans-serif',
    category: 'sans-serif',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/montserrat-400.woff2' },
      { weight: 700, path: '/fonts/montserrat-700.woff2' },
      { weight: 900, path: '/fonts/montserrat-900.woff2' },
    ],
  },
  {
    label: 'Playfair Display',
    family: 'Playfair Display',
    value: '"Playfair Display", serif',
    category: 'serif',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [
      { weight: 400, path: '/fonts/playfair-display-400.woff2' },
      { weight: 700, path: '/fonts/playfair-display-700.woff2' },
      { weight: 900, path: '/fonts/playfair-display-900.woff2' },
    ],
  },
  {
    label: 'Pacifico',
    family: 'Pacifico',
    value: '"Pacifico", cursive',
    category: 'display',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [{ weight: 400, path: '/fonts/pacifico-400.woff2' }],
  },
  {
    label: 'Bebas Neue',
    family: 'Bebas Neue',
    value: '"Bebas Neue", sans-serif',
    category: 'display',
    license: 'SIL OFL 1.1',
    group: GROUP_OPEN_SOURCE,
    files: [{ weight: 400, path: '/fonts/bebas-neue-400.woff2' }],
  },
]

// ─── 系统字体 ────────────────────────────────────────────

const SYSTEM_FONTS: FontOption[] = [
  {
    label: '苹方',
    family: 'PingFang SC',
    value: '"PingFang SC", "Hiragino Sans GB", sans-serif',
    category: 'sans-serif',
    license: '系统字体',
    group: GROUP_SYSTEM,
    files: [],
  },
  {
    label: '微软雅黑',
    family: 'Microsoft YaHei',
    value: '"Microsoft YaHei", sans-serif',
    category: 'sans-serif',
    license: '系统字体',
    group: GROUP_SYSTEM,
    files: [],
  },
  {
    label: '黑体',
    family: 'SimHei',
    value: 'SimHei, sans-serif',
    category: 'sans-serif',
    license: '系统字体',
    group: GROUP_SYSTEM,
    files: [],
  },
  {
    label: '宋体',
    family: 'SimSun',
    value: 'SimSun, "Songti SC", serif',
    category: 'serif',
    license: '系统字体',
    group: GROUP_SYSTEM,
    files: [],
  },
  {
    label: '楷体',
    family: 'KaiTi',
    value: 'KaiTi, "Kaiti SC", serif',
    category: 'serif',
    license: '系统字体',
    group: GROUP_SYSTEM,
    files: [],
  },
  {
    label: '等宽字体',
    family: 'monospace',
    value: '"SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
    category: 'monospace',
    license: '系统字体',
    group: GROUP_SYSTEM,
    files: [],
  },
]

// ─── 汇总导出 ────────────────────────────────────────────

/** 所有可选字体 */
export const ALL_FONT_OPTIONS: FontOption[] = [...OPEN_SOURCE_FONTS, ...SYSTEM_FONTS]

/** 按分组排列的字体列表 */
export const FONT_GROUPS: { label: string; options: FontOption[] }[] = [
  { label: GROUP_OPEN_SOURCE, options: OPEN_SOURCE_FONTS },
  { label: GROUP_SYSTEM, options: SYSTEM_FONTS },
]

/** 默认字体（优先系统字体，回退到阿里巴巴普惠体） */
export const DEFAULT_FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Alibaba PuHuiTi", "Noto Sans SC", sans-serif'

/** 根据 CSS font-family 值查找对应的 FontOption */
export function findFontOption(value: string): FontOption | null {
  const normalized = value.trim()
  return ALL_FONT_OPTIONS.find((opt) => opt.value.trim() === normalized) ?? null
}

/** 搜索字体（按名称模糊匹配） */
export function searchFonts(query: string): FontOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return ALL_FONT_OPTIONS
  return ALL_FONT_OPTIONS.filter(
    (f) => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q),
  )
}
