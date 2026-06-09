import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 私有 Blob 代理路由
// 通过 token 认证获取私有 Blob 内容并返回给客户端
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // 使用 SDK 的 get 方法获取私有 blob
    const result = await get(id, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return Response.json({ error: "Blob not found" }, { status: 404 });
    }

    // 流式返回 blob 内容
    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": result.blob.etag,
        "Content-Disposition": result.blob.contentDisposition,
      },
    });
  } catch {
    return Response.json({ error: "Blob not found" }, { status: 404 });
  }
}