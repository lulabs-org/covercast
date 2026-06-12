/**
 * SEO配置文件 - 集中管理所有SEO元数据
 * 遵循架构要求：UI、业务逻辑、数据访问分离
 */

export const SITE_CONFIG = {
  name: 'Covercast',
  description: '专业封面编辑器 — 快速创建、实时预览、一键导出，让每一场直播都有完美视觉呈现。',
  url: 'https://covercast.app',
  ogImage: '/covercast-logo.png',
  locale: 'zh_CN',
} as const;

export const ROUTES = {
  home: '/',
  editor: '/editor',
  live: '/live',
} as const;

export const PAGE_METADATA = {
  home: {
    title: 'Covercast - 专业封面编辑器 | 免费在线背景制作工具',
    description: 'Covercast是免费的专业封面编辑器，支持可视化拖拽编辑、实时预览、一键导出SVG/PNG。快速创建精美的直播间背景图片，适用于抖音、快手、B站、YouTube等平台直播。无需设计经验，轻松制作专业背景。',
    keywords: [
      '直播背景', '背景编辑器', '直播工具', '可视化编辑', '实时预览',
      'SVG导出', 'PNG导出', '开源工具', '免费直播背景', '在线背景制作',
      '直播间背景', '直播背景图片', '直播背景设计', '抖音直播背景', '快手直播背景',
      'B站直播背景', 'YouTube直播背景', '直播背景模板', '直播背景素材',
      '拖拽编辑器', '所见即所得', '直播背景生成器', '直播画面设计',
      '直播背景制作', '直播背景下载', '免费背景设计', '在线设计工具'
    ],
  },
  editor: {
    title: '在线编辑器 - Covercast | 免费直播背景制作工具',
    description: 'Covercast在线编辑器，拖拽式画布操作，支持文本、图片、形状等多种元素编辑。实时预览直播背景效果，一键导出高清背景图片。免费使用，无需注册，立即开始设计你的直播背景。',
    keywords: [
      '直播背景编辑', '在线编辑器', '拖拽编辑', '实时预览', '背景导出',
      '免费编辑器', '在线背景设计', '直播背景制作工具', '拖拽式编辑',
      '可视化编辑器', '直播背景设计工具', '在线背景生成', '直播画面编辑',
      '背景图片制作', '直播背景素材编辑', '免费背景制作'
    ],
  },
  live: {
    title: '实时预览 - Covercast | 直播背景效果展示',
    description: 'Covercast实时预览页面，查看直播背景的实际效果。支持不同尺寸和场景的背景预览，确保你的直播背景在各平台都能完美展示。',
    keywords: [
      '直播预览', '背景预览', '实时效果', '直播背景展示',
      '背景效果查看', '直播画面预览', '背景实时渲染', '直播背景测试'
    ],
  },
} as const;

export const OPEN_GRAPH = {
  type: 'website',
  siteName: SITE_CONFIG.name,
  locale: SITE_CONFIG.locale,
} as const;

export const TWITTER_CARD = {
  card: 'summary_large_image',
  site: '@covercast',
} as const;

export const JSON_LD_CONFIG = {
  organization: {
    '@type': 'Organization',
    name: 'Covercast',
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    description: SITE_CONFIG.description,
    sameAs: [
      'https://github.com/lulabs-org/covercast',
    ],
  },
  softwareApplication: {
    '@type': 'SoftwareApplication',
    name: 'Covercast',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: SITE_CONFIG.description,
    screenshot: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  },
  faq: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Covercast是什么？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Covercast是一个免费的专业封面编辑器，支持可视化拖拽编辑、实时预览和一键导出功能。用户可以快速创建精美的直播间背景图片，适用于抖音、快手、B站、YouTube等平台。',
        },
      },
      {
        '@type': 'Question',
        name: 'Covercast支持哪些导出格式？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Covercast支持SVG和PNG等多种格式导出，满足不同平台的直播背景尺寸需求。SVG格式适合矢量图形，PNG格式适合高清图片。',
        },
      },
      {
        '@type': 'Question',
        name: 'Covercast是否免费使用？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '是的，Covercast完全免费使用，无需注册账号。基于开源协议发布，代码透明可审计，社区驱动持续迭代优化。',
        },
      },
      {
        '@type': 'Question',
        name: '如何使用Covercast创建直播背景？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '使用Covercast创建直播背景非常简单：1. 打开编辑器页面；2. 拖拽添加文本、图片、形状等元素；3. 实时预览调整效果；4. 一键导出SVG或PNG格式。整个过程所见即所得，无需设计经验。',
        },
      },
      {
        '@type': 'Question',
        name: 'Covercast支持哪些直播平台？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Covercast创建的直播背景适用于所有主流直播平台，包括抖音、快手、B站、YouTube、Twitch等。支持横屏、竖屏、方形等多种直播场景。',
        },
      },
    ],
  },
  howTo: {
    '@type': 'HowTo',
    name: '如何使用Covercast创建直播背景',
    description: '使用Covercast免费在线编辑器快速创建专业直播背景的完整教程',
    step: [
      {
        '@type': 'HowToStep',
        name: '打开编辑器',
        text: '访问Covercast官网，点击"开始使用"按钮进入在线编辑器页面',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: '添加元素',
        text: '在画布上拖拽添加文本、图片、形状等元素，调整位置和大小',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: '实时预览',
        text: '编辑过程中实时预览效果，调整颜色、字体、透明度等参数',
        position: 3,
      },
      {
        '@type': 'HowToStep',
        name: '导出背景',
        text: '点击导出按钮，选择SVG或PNG格式，下载高清直播背景图片',
        position: 4,
      },
    ],
    totalTime: 'PT5M',
  },
} as const;