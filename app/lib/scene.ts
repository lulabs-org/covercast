export const CANVAS_WIDTH = 941;
export const CANVAS_HEIGHT = 1672;

export const DEFAULT_FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif';

export type TextAlign = "left" | "center" | "right";
export type ImageFit = "cover" | "contain";
export type ImageShape = "rect" | "circle";
export type ShapeFillMode = "solid" | "gradient";
export type GradientDirection = "horizontal" | "vertical" | "diagonal-down" | "diagonal-up";

export type ShapeGradient = {
  startColor: string;
  endColor: string;
  direction: GradientDirection;
};

type ElementBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  hidden?: boolean;
  locked?: boolean;
};

export type TextElement = ElementBase & {
  type: "text";
  text: string;
  fill: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  align: TextAlign;
  lineHeight: number;
};

export type ShapeElement = ElementBase & {
  type: "rect" | "ellipse";
  fill: string;
  fillMode?: ShapeFillMode;
  gradient?: ShapeGradient;
  backgroundCutout?: boolean;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
};

export type ImageElement = ElementBase & {
  type: "image";
  src: string;
  alt: string;
  fit: ImageFit;
  shape: ImageShape;
  fallbackText?: string;
};

export type SceneElement = TextElement | ShapeElement | ImageElement;

export type Scene = {
  version: 1;
  backgroundColor: string;
  backgroundOpacity: number;
  elements: SceneElement[];
};

export type SceneTemplate = {
  id: string;
  name: string;
  description: string;
  scene: Scene;
};

export const DEFAULT_TEMPLATE_ID = "dual-course";

export function createDefaultScene(): Scene {
  return createSceneFromTemplate(DEFAULT_TEMPLATE_ID);
}

export function createSceneFromTemplate(templateId: string): Scene {
  const template =
    BUILT_IN_TEMPLATES.find((item) => item.id === templateId) ?? BUILT_IN_TEMPLATES[0];

  return cloneScene(template.scene);
}

export function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene;
}

export function isTextElement(element: SceneElement): element is TextElement {
  return element.type === "text";
}

export function isShapeElement(element: SceneElement): element is ShapeElement {
  return element.type === "rect" || element.type === "ellipse";
}

export function isImageElement(element: SceneElement): element is ImageElement {
  return element.type === "image";
}

export function createTextElement(): TextElement {
  return {
    id: `text-${Date.now()}`,
    name: "自定义文字",
    type: "text",
    text: "新的文字",
    x: 330,
    y: 760,
    width: 280,
    height: 56,
    fill: "#ffffff",
    fontSize: 42,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 800,
    align: "center",
    lineHeight: 1.18,
  };
}

export function createRectElement(): ShapeElement {
  return {
    id: `rect-${Date.now()}`,
    name: "自定义矩形",
    type: "rect",
    x: 320,
    y: 720,
    width: 300,
    height: 180,
    fill: "#ffffff",
    fillMode: "gradient",
    gradient: {
      startColor: "#ffffff",
      endColor: "#99f19c",
      direction: "horizontal",
    },
    stroke: "#ffffff",
    strokeWidth: 0,
    radius: 16,
    opacity: 1,
  };
}

export function createEllipseElement(): ShapeElement {
  return {
    id: `ellipse-${Date.now()}`,
    name: "自定义椭圆",
    type: "ellipse",
    x: 340,
    y: 740,
    width: 260,
    height: 160,
    fill: "#ffffff",
    fillMode: "gradient",
    gradient: {
      startColor: "#ffffff",
      endColor: "#99f19c",
      direction: "horizontal",
    },
    stroke: "#ffffff",
    strokeWidth: 0,
    opacity: 1,
  };
}

export function createImageElement(src: string, name = "自定义素材"): ImageElement {
  return {
    id: `image-${Date.now()}`,
    name,
    type: "image",
    src,
    alt: name,
    x: 356,
    y: 720,
    width: 230,
    height: 230,
    fit: "contain",
    shape: "rect",
  };
}

const defaultScene: Scene = {
  version: 1,
  backgroundColor: "#2845c7",
  backgroundOpacity: 1,
  elements: [
    {
      id: "avatar",
      name: "顶部头像",
      type: "image",
      src: "",
      alt: "陆向谦教授头像",
      x: 294,
      y: 68,
      width: 112,
      height: 112,
      fit: "cover",
      shape: "circle",
      fallbackText: "陆",
    },
    {
      id: "host-name",
      name: "顶部姓名",
      type: "text",
      text: "陆向谦教授",
      x: 420,
      y: 101,
      width: 300,
      height: 48,
      fill: "#ffffff",
      fontSize: 40,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1.1,
    },
    {
      id: "course-card-1",
      name: "课程条 1",
      type: "rect",
      x: 147,
      y: 202,
      width: 648,
      height: 61,
      radius: 12,
      fill: "courseGradient",
    },
    {
      id: "course-dot-1",
      name: "课程圆点 1",
      type: "ellipse",
      x: 195,
      y: 222,
      width: 22,
      height: 22,
      fill: "accentGradient",
    },
    {
      id: "course-date-1",
      name: "课程文字 1",
      type: "text",
      text: "7 月 8 日-31 日，陆向谦 AI 夏令营",
      x: 242,
      y: 219,
      width: 390,
      height: 28,
      fill: "#1f3e9e",
      fontSize: 27,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "course-full-label",
      name: "已报满标记",
      type: "text",
      text: "（已报满）",
      x: 650,
      y: 219,
      width: 138,
      height: 28,
      fill: "#ff1d25",
      fontSize: 27,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "course-card-2",
      name: "课程条 2",
      type: "rect",
      x: 147,
      y: 284,
      width: 648,
      height: 61,
      radius: 12,
      fill: "courseGradient",
    },
    {
      id: "course-dot-2",
      name: "课程圆点 2",
      type: "ellipse",
      x: 195,
      y: 304,
      width: 22,
      height: 22,
      fill: "accentGradient",
    },
    {
      id: "course-date-2",
      name: "课程文字 2",
      type: "text",
      text: "8 月 1 日-24 日，陆向谦实验室AI夏令营",
      x: 242,
      y: 302,
      width: 520,
      height: 30,
      fill: "#1f3e9e",
      fontSize: 27,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "main-title",
      name: "主标题",
      type: "text",
      text: "人工智能时代，\n如何培养孩子？",
      x: 245,
      y: 392,
      width: 452,
      height: 124,
      fill: "#ffffff",
      fontSize: 58,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1.22,
    },
    {
      id: "video-left",
      name: "左侧视频占位",
      type: "rect",
      x: 111,
      y: 550,
      width: 351,
      height: 580,
      radius: 14,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 1,
      backgroundCutout: true,
    },
    {
      id: "video-right",
      name: "右侧视频占位",
      type: "rect",
      x: 480,
      y: 550,
      width: 351,
      height: 580,
      radius: 14,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 1,
      backgroundCutout: true,
    },
    {
      id: "speaker-left-name",
      name: "左侧讲师姓名",
      type: "text",
      text: "陆向谦",
      x: 125,
      y: 1160,
      width: 320,
      height: 58,
      fill: "#ffffff",
      fontSize: 50,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "speaker-left-bio",
      name: "左侧讲师介绍",
      type: "text",
      text: "清华大学教授，教育部全国高校\n教师网络培训中心创新/创业特聘教授\n清华工学硕士，加州伯克利大学博士\n斯坦福大学 & 加州伯克利大学爸爸",
      x: 108,
      y: 1235,
      width: 355,
      height: 120,
      fill: "#ffffff",
      fontSize: 21,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 700,
      align: "center",
      lineHeight: 1.48,
    },
    {
      id: "speaker-right-name",
      name: "右侧讲师姓名",
      type: "text",
      text: "张晨老师玩AI",
      x: 508,
      y: 1160,
      width: 305,
      height: 58,
      fill: "#ffffff",
      fontSize: 44,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "speaker-right-bio",
      name: "右侧讲师介绍",
      type: "text",
      text: "清华陆向谦教授实验室\nAI 教育专家\n培养多名学生获得名企AI大奖",
      x: 514,
      y: 1248,
      width: 300,
      height: 105,
      fill: "#ffffff",
      fontSize: 22,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 800,
      align: "center",
      lineHeight: 1.62,
    },
  ],
};

const soloInterviewScene: Scene = {
  version: 1,
  backgroundColor: "#0f766e",
  backgroundOpacity: 1,
  elements: [
    {
      id: "solo-host-avatar",
      name: "嘉宾头像",
      type: "image",
      src: "",
      alt: "嘉宾头像",
      x: 70,
      y: 72,
      width: 106,
      height: 106,
      fit: "cover",
      shape: "circle",
      fallbackText: "嘉",
    },
    {
      id: "solo-host-name",
      name: "嘉宾姓名",
      type: "text",
      text: "主讲嘉宾",
      x: 198,
      y: 91,
      width: 260,
      height: 46,
      fill: "#ffffff",
      fontSize: 38,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1.1,
    },
    {
      id: "solo-host-role",
      name: "嘉宾介绍",
      type: "text",
      text: "AI 教育实践者 / 直播间主持人",
      x: 200,
      y: 144,
      width: 470,
      height: 32,
      fill: "#ccfbf1",
      fontSize: 24,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 700,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "solo-live-badge",
      name: "直播标签",
      type: "rect",
      x: 676,
      y: 82,
      width: 166,
      height: 58,
      radius: 29,
      fill: "#f97316",
      fillMode: "gradient",
      gradient: {
        startColor: "#f97316",
        endColor: "#facc15",
        direction: "horizontal",
      },
    },
    {
      id: "solo-live-text",
      name: "直播标签文字",
      type: "text",
      text: "LIVE",
      x: 676,
      y: 96,
      width: 166,
      height: 32,
      fill: "#ffffff",
      fontSize: 30,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "solo-title",
      name: "主题标题",
      type: "text",
      text: "如何用 AI\n升级学习效率",
      x: 104,
      y: 236,
      width: 734,
      height: 148,
      fill: "#ffffff",
      fontSize: 66,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1.18,
    },
    {
      id: "solo-video",
      name: "单人视频占位",
      type: "rect",
      x: 130,
      y: 440,
      width: 682,
      height: 780,
      radius: 20,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "solo-name-card",
      name: "姓名底条",
      type: "rect",
      x: 170,
      y: 1254,
      width: 602,
      height: 84,
      radius: 18,
      fill: "#ffffff",
      opacity: 0.95,
    },
    {
      id: "solo-name-card-text",
      name: "姓名底条文字",
      type: "text",
      text: "今晚 20:00 开播  |  预约直播间",
      x: 170,
      y: 1278,
      width: 602,
      height: 38,
      fill: "#0f766e",
      fontSize: 34,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "solo-bottom-note",
      name: "底部提示",
      type: "text",
      text: "适合单人访谈、公开课、开播预告",
      x: 120,
      y: 1452,
      width: 702,
      height: 42,
      fill: "#d1fae5",
      fontSize: 28,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 800,
      align: "center",
      lineHeight: 1.2,
    },
  ],
};

const roundtableScene: Scene = {
  version: 1,
  backgroundColor: "#2f244f",
  backgroundOpacity: 1,
  elements: [
    {
      id: "roundtable-kicker",
      name: "栏目名称",
      type: "text",
      text: "Covercast Roundtable",
      x: 102,
      y: 86,
      width: 738,
      height: 32,
      fill: "#fcd34d",
      fontSize: 26,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "roundtable-title",
      name: "圆桌标题",
      type: "text",
      text: "三人圆桌：\nAI 产品如何落地？",
      x: 96,
      y: 142,
      width: 750,
      height: 136,
      fill: "#ffffff",
      fontSize: 58,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1.18,
    },
    {
      id: "roundtable-video-left",
      name: "左上视频占位",
      type: "rect",
      x: 72,
      y: 358,
      width: 380,
      height: 472,
      radius: 18,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "roundtable-video-right",
      name: "右上视频占位",
      type: "rect",
      x: 490,
      y: 358,
      width: 380,
      height: 472,
      radius: 18,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "roundtable-video-bottom",
      name: "下方视频占位",
      type: "rect",
      x: 168,
      y: 914,
      width: 606,
      height: 410,
      radius: 18,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "roundtable-name-left",
      name: "左上嘉宾名",
      type: "text",
      text: "嘉宾 A",
      x: 92,
      y: 852,
      width: 340,
      height: 42,
      fill: "#ffffff",
      fontSize: 34,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "roundtable-name-right",
      name: "右上嘉宾名",
      type: "text",
      text: "嘉宾 B",
      x: 510,
      y: 852,
      width: 340,
      height: 42,
      fill: "#ffffff",
      fontSize: 34,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "roundtable-name-bottom",
      name: "下方嘉宾名",
      type: "text",
      text: "主持人",
      x: 220,
      y: 1348,
      width: 502,
      height: 42,
      fill: "#ffffff",
      fontSize: 34,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "roundtable-topic-card",
      name: "讨论话题底框",
      type: "rect",
      x: 88,
      y: 1452,
      width: 766,
      height: 96,
      radius: 20,
      fill: "#fcd34d",
      fillMode: "gradient",
      gradient: {
        startColor: "#fcd34d",
        endColor: "#f97316",
        direction: "horizontal",
      },
    },
    {
      id: "roundtable-topic",
      name: "讨论话题",
      type: "text",
      text: "话题：增长、交付、团队协作",
      x: 88,
      y: 1482,
      width: 766,
      height: 42,
      fill: "#2f244f",
      fontSize: 34,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
  ],
};

const launchPosterScene: Scene = {
  version: 1,
  backgroundColor: "#f8fafc",
  backgroundOpacity: 1,
  elements: [
    {
      id: "poster-side-band",
      name: "左侧色带",
      type: "rect",
      x: 0,
      y: 0,
      width: 110,
      height: 1672,
      fill: "#2563eb",
      fillMode: "gradient",
      gradient: {
        startColor: "#2563eb",
        endColor: "#14b8a6",
        direction: "vertical",
      },
    },
    {
      id: "poster-label",
      name: "活动标签",
      type: "text",
      text: "新课发布会",
      x: 160,
      y: 118,
      width: 320,
      height: 38,
      fill: "#2563eb",
      fontSize: 32,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "poster-title",
      name: "海报标题",
      type: "text",
      text: "用 AI 打造\n个人知识系统",
      x: 158,
      y: 214,
      width: 666,
      height: 172,
      fill: "#111827",
      fontSize: 72,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1.18,
    },
    {
      id: "poster-subtitle",
      name: "海报副标题",
      type: "text",
      text: "从信息收集、笔记整理到自动复盘",
      x: 164,
      y: 430,
      width: 628,
      height: 42,
      fill: "#475569",
      fontSize: 30,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 800,
      align: "left",
      lineHeight: 1.2,
    },
    {
      id: "poster-video",
      name: "主视觉视频占位",
      type: "rect",
      x: 158,
      y: 558,
      width: 666,
      height: 648,
      radius: 26,
      fill: "#000000",
      stroke: "#111827",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "poster-card",
      name: "报名信息卡片",
      type: "rect",
      x: 158,
      y: 1288,
      width: 666,
      height: 154,
      radius: 22,
      fill: "#111827",
    },
    {
      id: "poster-date",
      name: "日期时间",
      type: "text",
      text: "周四 20:00 直播",
      x: 198,
      y: 1328,
      width: 586,
      height: 42,
      fill: "#ffffff",
      fontSize: 38,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "poster-note",
      name: "报名提示",
      type: "text",
      text: "扫码预约，开播前自动提醒",
      x: 198,
      y: 1392,
      width: 586,
      height: 34,
      fill: "#cbd5e1",
      fontSize: 26,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 800,
      align: "left",
      lineHeight: 1,
    },
  ],
};

const courseSprintScene: Scene = {
  version: 1,
  backgroundColor: "#4c1d95",
  backgroundOpacity: 1,
  elements: [
    {
      id: "sprint-top-chip",
      name: "顶部标签底",
      type: "rect",
      x: 274,
      y: 76,
      width: 394,
      height: 58,
      radius: 29,
      fill: "#22c55e",
      fillMode: "gradient",
      gradient: {
        startColor: "#22c55e",
        endColor: "#a3e635",
        direction: "horizontal",
      },
    },
    {
      id: "sprint-top-chip-text",
      name: "顶部标签文字",
      type: "text",
      text: "7 天实战训练营",
      x: 274,
      y: 92,
      width: 394,
      height: 32,
      fill: "#1e1b4b",
      fontSize: 30,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "sprint-title",
      name: "训练营标题",
      type: "text",
      text: "AI 工具流\n从入门到交付",
      x: 106,
      y: 204,
      width: 730,
      height: 158,
      fill: "#ffffff",
      fontSize: 68,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1.16,
    },
    {
      id: "sprint-subtitle",
      name: "训练营副标题",
      type: "text",
      text: "适合产品、运营、教师与内容创作者",
      x: 126,
      y: 410,
      width: 690,
      height: 38,
      fill: "#ddd6fe",
      fontSize: 30,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 800,
      align: "center",
      lineHeight: 1,
    },
    {
      id: "sprint-video-left",
      name: "讲师视频占位",
      type: "rect",
      x: 92,
      y: 530,
      width: 360,
      height: 580,
      radius: 20,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "sprint-video-right",
      name: "助教视频占位",
      type: "rect",
      x: 490,
      y: 530,
      width: 360,
      height: 580,
      radius: 20,
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      backgroundCutout: true,
    },
    {
      id: "sprint-outline-card",
      name: "课程大纲底",
      type: "rect",
      x: 92,
      y: 1202,
      width: 758,
      height: 228,
      radius: 22,
      fill: "#ffffff",
      opacity: 0.94,
    },
    {
      id: "sprint-outline-title",
      name: "课程大纲标题",
      type: "text",
      text: "本场你会带走",
      x: 132,
      y: 1240,
      width: 680,
      height: 38,
      fill: "#4c1d95",
      fontSize: 32,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "left",
      lineHeight: 1,
    },
    {
      id: "sprint-outline",
      name: "课程大纲",
      type: "text",
      text: "01 个人知识库搭建\n02 自动化内容生产\n03 真实业务交付演示",
      x: 132,
      y: 1300,
      width: 680,
      height: 102,
      fill: "#1f2937",
      fontSize: 28,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 800,
      align: "left",
      lineHeight: 1.35,
    },
    {
      id: "sprint-footer",
      name: "底部行动提示",
      type: "text",
      text: "预约直播，领取课前资料包",
      x: 132,
      y: 1508,
      width: 678,
      height: 40,
      fill: "#ffffff",
      fontSize: 32,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 900,
      align: "center",
      lineHeight: 1,
    },
  ],
};

export const BUILT_IN_TEMPLATES = [
  {
    id: DEFAULT_TEMPLATE_ID,
    name: "双讲师课程",
    description: "双人连麦课程直播背景",
    scene: defaultScene,
  },
  {
    id: "solo-interview",
    name: "单人访谈",
    description: "单人开播、公开课、访谈",
    scene: soloInterviewScene,
  },
  {
    id: "roundtable",
    name: "三人圆桌",
    description: "三人连麦讨论场景",
    scene: roundtableScene,
  },
  {
    id: "launch-poster",
    name: "发布会海报",
    description: "新课发布、活动预告",
    scene: launchPosterScene,
  },
  {
    id: "course-sprint",
    name: "训练营直播",
    description: "课程训练营与实战营",
    scene: courseSprintScene,
  },
] satisfies SceneTemplate[];
