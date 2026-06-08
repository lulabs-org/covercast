import { prisma } from "./db";
import { createDefaultScene, type Scene } from "./scene";

export async function readStoredScene(): Promise<Scene> {
  const row = await prisma.scene.findFirst({
    where: { templateId: "default", slotId: "default" },
  });

  if (!row) {
    return createDefaultScene();
  }

  return parseSceneData(row.data);
}

export async function writeStoredScene(scene: Scene): Promise<void> {
  const data = JSON.stringify(scene);
  await prisma.scene.upsert({
    where: { templateId_slotId: { templateId: "default", slotId: "default" } },
    update: { data },
    create: { templateId: "default", slotId: "default", name: "默认场景", data },
  });
}

export async function readSceneBySlot(
  templateId: string,
  slotId: string,
): Promise<Scene | null> {
  const row = await prisma.scene.findUnique({
    where: { templateId_slotId: { templateId, slotId } },
  });

  if (!row) {
    return null;
  }

  return parseSceneData(row.data);
}

export async function writeSceneBySlot(
  templateId: string,
  slotId: string,
  scene: Scene,
): Promise<void> {
  const data = JSON.stringify(scene);
  await prisma.scene.upsert({
    where: { templateId_slotId: { templateId, slotId } },
    update: { data },
    create: { templateId, slotId, name: "", data },
  });
}

export async function listTemplateSlots(
  templateId: string,
): Promise<string[]> {
  const rows = await prisma.scene.findMany({
    where: { templateId },
    select: { slotId: true },
  });
  return rows.map((r) => r.slotId);
}

export async function listAllSlots(): Promise<
  { templateId: string; slots: string[] }[]
> {
  const rows = await prisma.scene.findMany({
    where: { NOT: { templateId: "default", slotId: "default" } },
    select: { templateId: true, slotId: true },
    orderBy: { templateId: "asc" },
  });

  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const existing = grouped.get(row.templateId) ?? [];
    existing.push(row.slotId);
    grouped.set(row.templateId, existing);
  }

  return Array.from(grouped.entries()).map(([templateId, slots]) => ({
    templateId,
    slots,
  }));
}

export async function deleteSceneSlot(
  templateId: string,
  slotId: string,
): Promise<void> {
  await prisma.scene.deleteMany({
    where: { templateId, slotId },
  });
}

function parseSceneData(data: string): Scene {
  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.elements)) {
      return createDefaultScene();
    }
    return {
      version: 1,
      backgroundColor:
        typeof parsed.backgroundColor === "string"
          ? parsed.backgroundColor
          : "#2845c7",
      backgroundOpacity:
        typeof parsed.backgroundOpacity === "number"
          ? parsed.backgroundOpacity
          : 1,
      elements: parsed.elements,
    } as Scene;
  } catch {
    return createDefaultScene();
  }
}
