import { readStoredScene, writeStoredScene } from "../../lib/storage";
import type { Scene } from "../../lib/scene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const scene = await readStoredScene();

  return Response.json(scene, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  try {
    const scene = (await request.json()) as Scene;
    await writeStoredScene(scene);

    return Response.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json({ error: "Invalid scene payload" }, { status: 400 });
  }
}
