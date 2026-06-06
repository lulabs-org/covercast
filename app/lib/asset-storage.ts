import { randomUUID } from "crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "./db";

const ASSETS_DIR = path.join(process.cwd(), ".covercast", "assets");

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function isVercelBlobAvailable(): boolean {
  return typeof process.env.BLOB_READ_WRITE_TOKEN === "string"
    && process.env.BLOB_READ_WRITE_TOKEN.length > 0;
}

export async function saveAssetFile(file: File) {
  const extension = MIME_TO_EXT[file.type];

  if (!extension) {
    throw new Error("Unsupported asset type");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Asset too large");
  }

  const id = `${randomUUID()}.${extension}`;

  if (isVercelBlobAvailable()) {
    return saveToVercelBlob(id, file);
  }

  return saveToLocal(id, file);
}

async function saveToVercelBlob(id: string, file: File) {
  const { put } = await import("@vercel/blob");
  const blob = await put(id, file, { access: "public" });

  await prisma.asset.create({
    data: {
      name: file.name,
      mime: file.type,
      blobUrl: blob.url,
      localPath: "",
    },
  });

  return {
    id,
    name: file.name,
    mime: file.type,
    src: blob.url,
  };
}

async function saveToLocal(id: string, file: File) {
  await mkdir(ASSETS_DIR, { recursive: true });

  const assetPath = path.join(ASSETS_DIR, id);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(assetPath, buffer);

  await prisma.asset.create({
    data: {
      name: file.name,
      mime: file.type,
      blobUrl: "",
      localPath: assetPath,
    },
  });

  return {
    id,
    name: file.name,
    mime: file.type,
    src: `/api/assets/${id}`,
  };
}

export async function readAssetFile(id: string) {
  if (!isSafeAssetId(id)) {
    return null;
  }

  // Check database first for Vercel Blob URL
  const record = await prisma.asset.findFirst({
    where: {
      OR: [
        { blobUrl: { contains: id } },
        { localPath: { contains: id } },
      ],
    },
  });

  if (record?.blobUrl) {
    // Asset is stored in Vercel Blob — redirect or fetch
    const res = await fetch(record.blobUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, mime: record.mime };
  }

  // Fallback to local file system
  return readLocalAsset(id);
}

async function readLocalAsset(id: string) {
  const assetPath = path.join(ASSETS_DIR, id);

  try {
    const fileStat = await stat(assetPath);
    if (!fileStat.isFile()) {
      return null;
    }

    const buffer = await readFile(assetPath);
    const extension = path.extname(id).slice(1).toLowerCase();
    return {
      buffer,
      mime: EXT_TO_MIME[extension] ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

function isSafeAssetId(id: string) {
  return /^[a-f0-9-]+\.(png|jpg|jpeg|webp)$/i.test(id);
}
