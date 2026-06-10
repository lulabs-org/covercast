"use client";

import { useState, useCallback, useRef } from "react";
import type { FontOption } from "../lib/fonts";

/**
 * 字体按需加载器
 *
 * 使用 FontFace API 在用户选择字体时动态加载 woff2 文件。
 * 已加载的字体会被缓存，避免重复加载。
 */
export function useFontLoader() {
  const [loadedFamilies, setLoadedFamilies] = useState<Set<string>>(new Set());
  const [loadingFamilies, setLoadingFamilies] = useState<Set<string>>(new Set());
  const failedRef = useRef<Set<string>>(new Set());

  /** 加载某个字体的所有字重文件 */
  const loadFont = useCallback(async (font: FontOption) => {
    // 系统字体无需加载
    if (font.files.length === 0) return;

    // 已加载，跳过
    if (loadedFamilies.has(font.family)) return;

    // 正在加载，跳过
    if (loadingFamilies.has(font.family)) return;

    // 之前加载失败，不重试（避免反复请求不存在的文件）
    if (failedRef.current.has(font.family)) return;

    setLoadingFamilies((prev) => new Set(prev).add(font.family));

    try {
      // 并行加载所有字重
      const promises = font.files.map(async (file) => {
        // 优先加载 woff2，失败后回退 ttf
        const ttfPath = file.path.replace(/\.woff2$/, ".ttf");
        const sources = [
          { url: file.path, format: "woff2" },
          { url: ttfPath, format: "truetype" },
        ];

        let lastError: Error | null = null;
        for (const src of sources) {
          try {
            const fontFace = new FontFace(
              font.family,
              `url(${src.url})`,
              { weight: String(file.weight), style: "normal" }
            );
            const loaded = await fontFace.load();
            document.fonts.add(loaded);
            return;
          } catch (err) {
            lastError = err as Error;
          }
        }
        throw lastError;
      });

      await Promise.all(promises);

      setLoadedFamilies((prev) => new Set(prev).add(font.family));
    } catch {
      // 字体文件不存在时静默失败，浏览器会使用 fallback 字体
      failedRef.current.add(font.family);
    } finally {
      setLoadingFamilies((prev) => {
        const next = new Set(prev);
        next.delete(font.family);
        return next;
      });
    }
  }, [loadedFamilies, loadingFamilies]);

  /** 检查字体是否已加载 */
  const isLoaded = useCallback(
    (family: string) => loadedFamilies.has(family),
    [loadedFamilies]
  );

  /** 检查字体是否正在加载 */
  const isLoading = useCallback(
    (family: string) => loadingFamilies.has(family),
    [loadingFamilies]
  );

  /** 检查字体是否加载失败（文件不存在） */
  const isFailed = useCallback(
    (family: string) => failedRef.current.has(family),
    []
  );

  return { loadFont, isLoaded, isLoading, isFailed };
}
