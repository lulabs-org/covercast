import { type Scene, type SceneElement, type GradientDirection, type ShapeGradient } from "../../lib/scene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AIRequest = {
  template: Scene;
  modification: string;
  provider: "openai" | "anthropic" | "deepseek" | "google" | "custom";
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as AIRequest;

    if (!body.template) {
      return Response.json({ error: "请选择模版" }, { status: 400 });
    }

    if (!body.modification || body.modification.trim() === "") {
      return Response.json({ error: "请输入修改需求" }, { status: 400 });
    }

    if (!body.apiKey || body.apiKey.trim() === "") {
      return Response.json({ error: "请配置 API Key" }, { status: 400 });
    }

    const prompt = buildModificationPrompt(body.template, body.modification);
    const aiResponse = await callAI(body, prompt);
    const scene = parseAndValidateScene(aiResponse);

    return Response.json({ scene }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "修改场景失败";
    return Response.json({ error: message }, { status: 500 });
  }
}

function buildModificationPrompt(template: Scene, modification: string): string {
  const templateJson = JSON.stringify(template, null, 2);

  return `你是一个直播背景场景编辑助手。用户会提供一个现有的场景模版，并描述他们想要的修改，你需要根据修改需求返回修改后的完整场景JSON。

画布尺寸: 941x1672 (竖屏直播背景)

现有模版数据:
${templateJson}

用户修改需求: ${modification}

请根据用户的修改需求，对现有模版进行修改，并返回完整的修改后的场景JSON。

修改规则:
1. 保持现有模版的基本结构和风格，只修改用户要求的部分
2. 如果用户要求增加元素，合理放置新元素，避免重叠
3. 如果用户要求删除元素，移除对应的元素
4. 如果用户要求修改元素属性（如颜色、位置、大小等），只修改指定属性
5. 如果用户要求修改背景颜色，更新 backgroundColor
6. 新增元素的 id 格式: 元素类型-时间戳-序号 (如 text-1234567890-1)
7. 新增元素的 name 应该是中文描述
8. 所有坐标和尺寸必须在画布范围内 (x: 0-941, y: 0-1672)
9. 只返回修改后的完整JSON，不要包含任何解释或说明

支持的元素类型和属性:
- text: 文字元素 (text, fill, fontSize, fontFamily, fontWeight, align, lineHeight)
- rect: 矩形元素 (fill, fillMode, gradient, radius, stroke, strokeWidth, backgroundCutout)
- ellipse: 椭圆元素 (属性同 rect)
- image: 图片元素 (src, alt, fit, shape, fallbackText)

通用属性: id, name, type, x, y, width, height, opacity, hidden, locked

返回格式要求:
- 返回完整的场景JSON对象
- 包含 version, backgroundColor, backgroundOpacity, elements
- 不要包含任何 markdown 格式或其他文字`;
}

async function callAI(config: AIRequest, prompt: string): Promise<string> {
  if (config.provider === "openai" || config.provider === "deepseek" || config.provider === "custom") {
    return callOpenAICompatible(config, prompt);
  } else if (config.provider === "anthropic") {
    return callAnthropic(config, prompt);
  } else if (config.provider === "google") {
    return callGoogle(config, prompt);
  }
  throw new Error("不支持的 AI 提供商");
}

async function callOpenAICompatible(config: AIRequest, prompt: string): Promise<string> {
  const endpoint = config.apiEndpoint.replace(/\/$/, "");
  const url = `${endpoint}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API 调用失败: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI 未返回有效内容");
  }

  return content;
}

async function callAnthropic(config: AIRequest, prompt: string): Promise<string> {
  const endpoint = config.apiEndpoint.replace(/\/$/, "");
  const url = `${endpoint}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.modelName,
      max_tokens: config.maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API 调用失败: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("AI 未返回有效内容");
  }

  return content;
}

async function callGoogle(config: AIRequest, prompt: string): Promise<string> {
  const endpoint = config.apiEndpoint.replace(/\/$/, "");
  const url = `${endpoint}/models/${config.modelName}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API 调用失败: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("AI 未返回有效内容");
  }

  return content;
}

function parseAndValidateScene(content: string): Scene {
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("无法解析 AI 返回的 JSON");
      }
    } else {
      throw new Error("AI 未返回有效的 JSON 数据");
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI 返回的数据格式不正确");
  }

  const candidate = parsed as Record<string, unknown>;

  if (candidate.scene && typeof candidate.scene === "object") {
    return validateScene(candidate.scene as Record<string, unknown>);
  }

  return validateScene(candidate);
}

function validateScene(data: Record<string, unknown>): Scene {
  if (!Array.isArray(data.elements)) {
    throw new Error("场景缺少 elements 数组");
  }

  const backgroundColor = typeof data.backgroundColor === "string" 
    ? data.backgroundColor 
    : "#2845c7";

  const backgroundOpacity = typeof data.backgroundOpacity === "number"
    ? Math.max(0, Math.min(1, data.backgroundOpacity))
    : 1;

  const elements = data.elements.map((el, index) => validateElement(el, index));

  return {
    version: 1,
    backgroundColor,
    backgroundOpacity,
    elements,
  };
}

function validateElement(element: unknown, index: number): SceneElement {
  if (!element || typeof element !== "object") {
    throw new Error(`元素 ${index} 格式不正确`);
  }

  const el = element as Record<string, unknown>;

  if (el.type === "text") {
    return validateTextElement(el, index);
  } else if (el.type === "rect" || el.type === "ellipse") {
    return validateShapeElement(el, index);
  } else if (el.type === "image") {
    return validateImageElement(el, index);
  }

  throw new Error(`元素 ${index} 的类型 "${el.type}" 不支持`);
}

function validateTextElement(el: Record<string, unknown>, index: number): SceneElement {
  return {
    id: typeof el.id === "string" ? el.id : `text-${Date.now()}-${index}`,
    name: typeof el.name === "string" ? el.name : `文字元素 ${index + 1}`,
    type: "text",
    text: typeof el.text === "string" ? el.text : "示例文字",
    x: clampCoordinate(el.x, 0),
    y: clampCoordinate(el.y, 0),
    width: clampDimension(el.width, 100),
    height: clampDimension(el.height, 50),
    fill: typeof el.fill === "string" ? el.fill : "#ffffff",
    fontSize: typeof el.fontSize === "number" ? Math.max(12, Math.min(200, el.fontSize)) : 42,
    fontFamily: typeof el.fontFamily === "string" ? el.fontFamily : '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif',
    fontWeight: typeof el.fontWeight === "number" ? el.fontWeight : 700,
    align: validateAlign(el.align),
    lineHeight: typeof el.lineHeight === "number" ? el.lineHeight : 1.2,
    opacity: typeof el.opacity === "number" ? Math.max(0, Math.min(1, el.opacity)) : 1,
    hidden: typeof el.hidden === "boolean" ? el.hidden : false,
    locked: typeof el.locked === "boolean" ? el.locked : false,
  };
}

function validateShapeElement(el: Record<string, unknown>, index: number): SceneElement {
  const type = el.type as "rect" | "ellipse";
  
  return {
    id: typeof el.id === "string" ? el.id : `${type}-${Date.now()}-${index}`,
    name: typeof el.name === "string" ? el.name : `形状元素 ${index + 1}`,
    type,
    x: clampCoordinate(el.x, 0),
    y: clampCoordinate(el.y, 0),
    width: clampDimension(el.width, 100),
    height: clampDimension(el.height, 100),
    fill: typeof el.fill === "string" ? el.fill : "#ffffff",
    fillMode: validateFillMode(el.fillMode),
    gradient: el.gradient ? validateGradient(el.gradient) : undefined,
    radius: type === "rect" && typeof el.radius === "number" ? Math.max(0, el.radius) : undefined,
    stroke: typeof el.stroke === "string" ? el.stroke : undefined,
    strokeWidth: typeof el.strokeWidth === "number" ? Math.max(0, el.strokeWidth) : undefined,
    backgroundCutout: typeof el.backgroundCutout === "boolean" ? el.backgroundCutout : false,
    opacity: typeof el.opacity === "number" ? Math.max(0, Math.min(1, el.opacity)) : 1,
    hidden: typeof el.hidden === "boolean" ? el.hidden : false,
    locked: typeof el.locked === "boolean" ? el.locked : false,
  };
}

function validateImageElement(el: Record<string, unknown>, index: number): SceneElement {
  return {
    id: typeof el.id === "string" ? el.id : `image-${Date.now()}-${index}`,
    name: typeof el.name === "string" ? el.name : `图片元素 ${index + 1}`,
    type: "image",
    src: typeof el.src === "string" ? el.src : "",
    alt: typeof el.alt === "string" ? el.alt : "图片",
    x: clampCoordinate(el.x, 0),
    y: clampCoordinate(el.y, 0),
    width: clampDimension(el.width, 100),
    height: clampDimension(el.height, 100),
    fit: el.fit === "contain" ? "contain" : "cover",
    shape: el.shape === "circle" ? "circle" : "rect",
    fallbackText: typeof el.fallbackText === "string" ? el.fallbackText : undefined,
    opacity: typeof el.opacity === "number" ? Math.max(0, Math.min(1, el.opacity)) : 1,
    hidden: typeof el.hidden === "boolean" ? el.hidden : false,
    locked: typeof el.locked === "boolean" ? el.locked : false,
  };
}

function validateAlign(value: unknown): "left" | "center" | "right" {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }
  return "left";
}

function validateFillMode(value: unknown): "solid" | "gradient" {
  if (value === "solid" || value === "gradient") {
    return value;
  }
  return "solid";
}

function validateGradient(value: unknown): ShapeGradient {
  if (!value || typeof value !== "object") {
    return { startColor: "#ffffff", endColor: "#99f19c", direction: "horizontal" };
  }
  
  const grad = value as Record<string, unknown>;
  return {
    startColor: typeof grad.startColor === "string" ? grad.startColor : "#ffffff",
    endColor: typeof grad.endColor === "string" ? grad.endColor : "#99f19c",
    direction: validateGradientDirection(grad.direction),
  };
}

function validateGradientDirection(value: unknown): GradientDirection {
  if (value === "horizontal" || value === "vertical" || value === "diagonal-down" || value === "diagonal-up") {
    return value;
  }
  return "horizontal";
}

function clampCoordinate(value: unknown, defaultValue: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }
  return Math.max(0, Math.min(941, value));
}

function clampDimension(value: unknown, defaultValue: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }
  return Math.max(10, Math.min(941, value));
}