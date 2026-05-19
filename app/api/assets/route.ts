import { saveAssetFile } from "../../lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("asset");

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing asset file" }, { status: 400 });
    }

    const asset = await saveAssetFile(file);
    return Response.json(asset, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save asset";
    return Response.json({ error: message }, { status: 400 });
  }
}
