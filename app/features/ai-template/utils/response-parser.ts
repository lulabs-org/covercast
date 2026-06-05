import type { Scene, SceneElement } from "@/app/lib/scene";

interface ParsedAIResponse {
  success: boolean;
  scene: Scene | null;
  error: string | null;
}

function isValidScene(value: unknown): value is Scene {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (obj.version !== 1) {
    return false;
  }

  if (typeof obj.backgroundColor !== "string") {
    return false;
  }

  if (typeof obj.backgroundOpacity !== "number") {
    return false;
  }

  if (!Array.isArray(obj.elements)) {
    return false;
  }

  return obj.elements.every(isValidSceneElement);
}

function isValidSceneElement(value: unknown): value is SceneElement {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  const hasBase =
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.x === "number" &&
    typeof obj.y === "number" &&
    typeof obj.width === "number" &&
    typeof obj.height === "number";

  if (!hasBase) {
    return false;
  }

  if (obj.type === "text") {
    return (
      typeof obj.text === "string" &&
      typeof obj.fill === "string" &&
      typeof obj.fontSize === "number" &&
      typeof obj.fontFamily === "string" &&
      typeof obj.fontWeight === "number" &&
      (obj.align === "left" || obj.align === "center" || obj.align === "right") &&
      typeof obj.lineHeight === "number"
    );
  }

  if (obj.type === "image") {
    return (
      typeof obj.src === "string" &&
      typeof obj.alt === "string" &&
      (obj.fit === "cover" || obj.fit === "contain") &&
      (obj.shape === "rect" || obj.shape === "circle")
    );
  }

  if (obj.type === "rect" || obj.type === "ellipse") {
    return typeof obj.fill === "string";
  }

  return false;
}

function extractJsonFromMarkdown(text: string): string | null {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  return null;
}

export function parseAIResponse(response: string): ParsedAIResponse {
  try {
    let jsonText = response.trim();

    const extractedJson = extractJsonFromMarkdown(jsonText);
    if (extractedJson) {
      jsonText = extractedJson;
    }

    const parsed = JSON.parse(jsonText);

    if (!isValidScene(parsed)) {
      return {
        success: false,
        scene: null,
        error: "AI 返回的数据格式不符合设计图结构规范",
      };
    }

    return {
      success: true,
      scene: parsed,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知解析错误";
    return {
      success: false,
      scene: null,
      error: `解析 AI 响应失败: ${errorMessage}`,
    };
  }
}

export function validateScene(scene: Scene): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (scene.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(scene.backgroundColor)) {
    errors.push(`背景颜色格式无效: ${scene.backgroundColor}`);
  }

  if (scene.backgroundOpacity < 0 || scene.backgroundOpacity > 1) {
    errors.push(`背景透明度超出范围: ${scene.backgroundOpacity}`);
  }

  scene.elements.forEach((element, index) => {
    if (element.x < 0 || element.y < 0) {
      errors.push(`元素 ${element.name} (${index}) 位置超出画布范围`);
    }

    if (element.width <= 0 || element.height <= 0) {
      errors.push(`元素 ${element.name} (${index}) 尺寸无效`);
    }

    if (element.type === "text") {
      if (element.fontSize <= 0) {
        errors.push(`文本元素 ${element.name} 字号无效`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}