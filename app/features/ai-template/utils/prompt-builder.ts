import type { Scene } from "@/app/lib/scene";

export function buildAIPrompt(
  userPrompt: string,
  scene: Scene,
  canvasWidth: number,
  canvasHeight: number,
  templateName?: string
): string {
  // 压缩 JSON：无缩进，减少 token
  const sceneJson = JSON.stringify(scene);

  return `你是一个专业的设计图编辑助手。用户会给你一个设计图的 JSON 结构和修改要求，你需要返回修改后的 JSON 结构。

## 设计图 JSON 结构说明

画布尺寸：${canvasWidth}x${canvasHeight}(${canvasHeight > canvasWidth ? "竖屏" : "横屏"})

元素类型：
- text: 文本元素
- rect: 矩形
- ellipse: 椭圆
- image: 图片

每个元素都有以下基础属性：
- id: 唯一标识
- name: 元素名称
- x, y: 位置坐标
- width, height: 尺寸
- opacity: 透明度 (0-1)
- hidden: 是否隐藏
- locked: 是否锁定

文本元素特有属性：
- text: 文本内容
- fill: 文字颜色
- fontSize: 字号
- fontFamily: 字体
- fontWeight: 字重
- align: 对齐方式 (left/center/right)
- lineHeight: 行高

形状元素特有属性：
- fill: 填充颜色
- fillMode: 填充模式 (solid/gradient)
- gradient: 渐变配置 { startColor, endColor, direction }
- stroke: 描边颜色
- strokeWidth: 描边宽度
- radius: 圆角半径

图片元素特有属性：
- src: 图片地址
- alt: 替代文本
- fit: 填充方式 (cover/contain)
- shape: 形状 (rect/circle)

## 当前设计图 JSON

${templateName ? `模板名称：${templateName}` : ""}

\`\`\`json
${sceneJson}
\`\`\`

## 修改要求

${userPrompt}

## 输出要求

1. 只输出修改后的 JSON，不要输出任何解释或说明
2. JSON 必须符合上述结构规范
3. 保持 JSON 格式正确，确保可以被解析
4. 不要删除或修改元素的 id
5. 可以添加新元素，需要生成新的唯一 id
6. 可以删除元素
7. 可以修改元素的任何属性
8. 输出格式：\`\`\`json\n{...}\n\`\`\``;
}