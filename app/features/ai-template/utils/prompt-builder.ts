import type { Scene } from "@/app/lib/scene";

export function buildAIPrompt(
  userPrompt: string,
  scene: Scene,
  templateName?: string
): string {
  // 压缩 JSON：无缩进，减少 token
  const sceneJson = JSON.stringify(scene);

  return `你是设计图编辑助手。根据修改要求，返回修改后的完整 JSON。

画布941x1672。元素类型:text/rect/ellipse/image。
基础属性:id,name,x,y,width,height,opacity,hidden,locked。
text特有:text,fill,fontSize,fontFamily,fontWeight,align,lineHeight。
rect/ellipse特有:fill,fillMode,gradient,startColor,endColor,direction,stroke,strokeWidth,radius。
image特有:src,alt,fit,shape。
${templateName ? `模板:${templateName}。` : ""}
JSON:
${sceneJson}

修改要求:${userPrompt}

直接输出修改后的JSON，用\`\`\`json包裹。不要输出分析过程。保持元素id不变。`;
}