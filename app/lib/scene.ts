export const CANVAS_WIDTH = 941;
export const CANVAS_HEIGHT = 1672;

export const DEFAULT_FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif';

export type TextAlign = "left" | "center" | "right";
export type ImageFit = "cover" | "contain";
export type ImageShape = "rect" | "circle";

type ElementBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
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
  elements: SceneElement[];
};

export function createDefaultScene(): Scene {
  return JSON.parse(JSON.stringify(defaultScene)) as Scene;
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
      x: 611,
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
