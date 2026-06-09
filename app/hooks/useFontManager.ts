"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUILT_IN_FONTS,
  DEFAULT_FONT_FAMILY,
  FONT_CATEGORY_ORDER,
  type FontCategory,
  type FontDefinition,
  type LocalFontEntry,
} from "../lib/fonts";

// ────────────────────────────────────────────
// localStorage key
// ────────────────────────────────────────────

const LOCAL_FONTS_STORAGE_KEY = "covercast-local-fonts";

// ────────────────────────────────────────────
// 类型
// ────────────────────────────────────────────

type LocalFontRecord = {
  id: string;
  name: string;
  family: string;
  fileName: string;
  /** base64 编码的字体数据（用于持久化） */
  dataUrl: string;
};

export type UseFontManagerReturn = {
  /** 所有可用字体（内置 + 本地） */
  allFonts: FontDefinition[];
  /** 本地导入的字体列表 */
  localFonts: LocalFontEntry[];
  /** 按分类组织的字体 */
  fontsByCategory: Record<FontCategory, FontDefinition[]>;
  /** 当前搜索关键词 */
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** 搜索过滤后的字体 */
  filteredFonts: FontDefinition[];
  /** 导入本地字体文件 */
  importLocalFont: (file: File) => Promise<LocalFontEntry | null>;
  /** 删除本地字体 */
  removeLocalFont: (id: string) => void;
  /** 重命名本地字体 */
  renameLocalFont: (id: string, newName: string) => void;
  /** Web 字体是否已加载 */
  webFontsLoaded: boolean;
  /** 根据 font-family 栈查找字体定义 */
  findFontByStack: (stack: string) => FontDefinition | null;
};

// ────────────────────────────────────────────
// 辅助函数
// ────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateFontId(): string {
  return `local-font-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 从 localStorage 恢复本地字体记录 */
function loadLocalFontRecords(): LocalFontRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_FONTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalFontRecord[];
  } catch {
    return [];
  }
}

/** 保存本地字体记录到 localStorage */
function saveLocalFontRecords(records: LocalFontRecord[]): void {
  try {
    localStorage.setItem(LOCAL_FONTS_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage 可能已满，静默失败
  }
}

/** 通过 FontFace API 注册字体 */
async function registerFontFace(family: string, source: string): Promise<void> {
  const fontFace = new FontFace(family, `url(${source})`);
  await fontFace.load();
  document.fonts.add(fontFace);
}

/** 将 LocalFontRecord 转换为 LocalFontEntry */
function recordToEntry(record: LocalFontRecord): LocalFontEntry {
  return {
    id: record.id,
    name: record.name,
    family: record.family,
    objectUrl: record.dataUrl,
    fileName: record.fileName,
  };
}

/** 将 LocalFontEntry 转换为 FontDefinition */
function localFontToDefinition(entry: LocalFontEntry): FontDefinition {
  return {
    label: entry.name,
    family: entry.family,
    stack: `"${entry.family}", "PingFang SC", "Microsoft YaHei", sans-serif`,
    category: "推荐",
    recommended: true,
  };
}

// ────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────

export function useFontManager(): UseFontManagerReturn {
  const [localFonts, setLocalFonts] = useState<LocalFontEntry[]>([]);
  const [webFontsLoaded, setWebFontsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const registeredRef = useRef<Set<string>>(new Set());

  // 加载 Web 字体（通过 <link> 标签注入 Google Fonts CSS）
  useEffect(() => {
    const webFonts = BUILT_IN_FONTS.filter((f) => f.webFont);
    const loadedUrls = new Set<string>();

    webFonts.forEach((font) => {
      if (!font.webFont || loadedUrls.has(font.webFont.url)) return;
      loadedUrls.add(font.webFont.url);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = font.webFont.url;
      document.head.appendChild(link);
    });

    // 等待字体加载完成
    document.fonts.ready.then(() => {
      setWebFontsLoaded(true);
    });
  }, []);

  // 从 localStorage 恢复本地字体
  useEffect(() => {
    const records = loadLocalFontRecords();
    if (records.length === 0) return;

    const entries: LocalFontEntry[] = [];
    const promises = records.map(async (record) => {
      try {
        if (!registeredRef.current.has(record.family)) {
          await registerFontFace(record.family, record.dataUrl);
          registeredRef.current.add(record.family);
        }
        entries.push(recordToEntry(record));
      } catch {
        // 注册失败，跳过该字体
      }
    });

    Promise.all(promises).then(() => {
      setLocalFonts(entries);
    });
  }, []);

  // 合并内置字体和本地字体
  const allFonts: FontDefinition[] = [
    ...localFonts.map(localFontToDefinition),
    ...BUILT_IN_FONTS,
  ];

  // 按分类组织
  const fontsByCategory: Record<FontCategory, FontDefinition[]> =
    {} as Record<FontCategory, FontDefinition[]>;
  FONT_CATEGORY_ORDER.forEach((cat) => {
    fontsByCategory[cat] = allFonts.filter((f) => f.category === cat);
  });

  // 搜索过滤
  const filteredFonts = searchQuery.trim()
    ? allFonts.filter((f) => {
        const q = searchQuery.toLowerCase();
        return (
          f.label.toLowerCase().includes(q) ||
          f.family.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      })
    : allFonts;

  // 导入本地字体
  const importLocalFont = useCallback(
    async (file: File): Promise<LocalFontEntry | null> => {
      const supportedTypes = [
        "font/ttf",
        "font/otf",
        "font/woff",
        "font/woff2",
        "application/x-font-ttf",
        "application/x-font-otf",
        "application/x-font-woff",
        "application/x-font-woff2",
        "application/font-ttf",
        "application/font-otf",
        "application/font-woff",
        "application/font-woff2",
      ];

      // 通过扩展名判断（某些浏览器 MIME 类型不准确）
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const supportedExts = ["ttf", "otf", "woff", "woff2"];
      if (!supportedTypes.includes(file.type) && !supportedExts.includes(ext)) {
        return null;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const familyName = `Local-${file.name.replace(/\.[^.]+$/, "")}`;
        const id = generateFontId();

        if (!registeredRef.current.has(familyName)) {
          await registerFontFace(familyName, dataUrl);
          registeredRef.current.add(familyName);
        }

        const entry: LocalFontEntry = {
          id,
          name: file.name.replace(/\.[^.]+$/, ""),
          family: familyName,
          objectUrl: dataUrl,
          fileName: file.name,
        };

        // 持久化
        const records = loadLocalFontRecords();
        records.push({
          id,
          name: entry.name,
          family: familyName,
          fileName: file.name,
          dataUrl,
        });
        saveLocalFontRecords(records);

        setLocalFonts((prev) => [...prev, entry]);
        return entry;
      } catch {
        return null;
      }
    },
    [],
  );

  // 删除本地字体
  const removeLocalFont = useCallback((id: string) => {
    setLocalFonts((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // 同步 localStorage
      const records = loadLocalFontRecords().filter((r) => r.id !== id);
      saveLocalFontRecords(records);
      return next;
    });
  }, []);

  // 重命名本地字体
  const renameLocalFont = useCallback((id: string, newName: string) => {
    setLocalFonts((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f)),
    );
    const records = loadLocalFontRecords().map((r) =>
      r.id === id ? { ...r, name: newName } : r,
    );
    saveLocalFontRecords(records);
  }, []);

  // 根据 stack 查找字体定义
  const findFontByStack = useCallback((stack: string): FontDefinition | null => {
    const normalized = stack.trim();
    // 先在本地字体中查找
    const localMatch = localFonts.find(
      (f) => `"${f.family}", "PingFang SC", "Microsoft YaHei", sans-serif` === normalized,
    );
    if (localMatch) return localFontToDefinition(localMatch);

    // 再在内置字体中查找
    return BUILT_IN_FONTS.find((f) => f.stack.trim() === normalized) ?? null;
  }, [localFonts]);

  return {
    allFonts,
    localFonts,
    fontsByCategory,
    searchQuery,
    setSearchQuery,
    filteredFonts,
    importLocalFont,
    removeLocalFont,
    renameLocalFont,
    webFontsLoaded,
    findFontByStack,
  };
}
