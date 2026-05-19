import { randomUUID } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { createDefaultScene, type Scene } from "./scene";

const DATA_DIR = path.join(process.cwd(), ".covercast");
const ASSETS_DIR = path.join(DATA_DIR, "assets");
const SCENE_FILE = path.join(DATA_DIR, "scene.json");

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

export async function readStoredScene(): Promise<Scene> {
  try {
    const content = await readFile(SCENE_FILE, "utf8");
    return normalizeScene(JSON.parse(content));
  } catch {
    return createDefaultScene();
  }
}

export async function writeStoredScene(scene: Scene) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SCENE_FILE, JSON.stringify(normalizeScene(scene), null, 2), "utf8");
}

export async function saveAssetFile(file: File) {
  const extension = MIME_TO_EXT[file.type];

  if (!extension) {
    throw new Error("Unsupported asset type");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Asset too large");
  }

  await mkdir(ASSETS_DIR, { recursive: true });

  const id = `${randomUUID()}.${extension}`;
  const assetPath = path.join(ASSETS_DIR, id);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(assetPath, buffer);

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

function normalizeScene(value: unknown): Scene {
  const fallback = createDefaultScene();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<Scene>;
  if (!Array.isArray(candidate.elements)) {
    return fallback;
  }

  return {
    version: 1,
    backgroundColor:
      typeof candidate.backgroundColor === "string"
        ? candidate.backgroundColor
        : fallback.backgroundColor,
    elements: candidate.elements,
  } as Scene;
}

function isSafeAssetId(id: string) {
  return /^[a-f0-9-]+\.(png|jpg|jpeg|webp)$/i.test(id);
}
