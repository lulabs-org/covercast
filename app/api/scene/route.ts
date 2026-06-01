import {
  readStoredScene,
  writeStoredScene,
  readSceneBySlot,
  writeSceneBySlot,
  deleteSceneSlot,
  listAllSlots,
} from "../../lib/storage";
import type { Scene } from "../../lib/scene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("t");
  const slotId = searchParams.get("s");

  if (templateId && slotId) {
    const scene = await readSceneBySlot(templateId, slotId);
    if (!scene) {
      return Response.json(
        { error: "Scene not found", message: "指定的 OBS 源不存在，请检查 URL 参数是否正确" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    return Response.json(scene, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (searchParams.get("list") === "1") {
    const allSlots = await listAllSlots();
    return Response.json(allSlots, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const scene = await readStoredScene();
  return Response.json(scene, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { templateId?: string; slotId?: string; scene: Scene };

    if (body.templateId && body.slotId) {
      await writeSceneBySlot(body.templateId, body.slotId, body.scene);
    } else {
      await writeStoredScene(body.scene);
    }

    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Invalid scene payload" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { templateId: string; slotId: string };
    await deleteSceneSlot(body.templateId, body.slotId);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Invalid delete request" }, { status: 400 });
  }
}
