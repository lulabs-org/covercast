import { readAssetFile } from "../../../lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const asset = await readAssetFile(id);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(asset.buffer), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "no-store",
    },
  });
}
