"use client";

import { useEffect, useState } from "react";
import { getAssetFromIndexedDB } from "../lib/storage";

export function useIndexedDBImage(src: string | undefined): string | undefined {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(undefined);
      return;
    }

    if (!src.startsWith("indexeddb://")) {
      setResolvedSrc(src);
      return;
    }

    const id = src.replace("indexeddb://", "");
    let objectUrl: string | undefined;

    getAssetFromIndexedDB(id)
      .then((asset) => {
        if (!asset) {
          setResolvedSrc(undefined);
          return;
        }

        const blob = new Blob([asset.data], { type: asset.mime });
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      })
      .catch(() => {
        setResolvedSrc(undefined);
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return resolvedSrc;
}

export function useIndexedDBImages(elements: Array<{ id: string; src?: string }>): Map<string, string> {
  const [resolvedUrls, setResolvedUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const objectUrls = new Set<string>();
    const newMap = new Map<string, string>();
    let cancelled = false;

    Promise.all(
      elements.map(async (element) => {
        if (!element.src) {
          return;
        }

        if (!element.src.startsWith("indexeddb://")) {
          newMap.set(element.id, element.src);
          return;
        }

        const id = element.src.replace("indexeddb://", "");
        const asset = await getAssetFromIndexedDB(id);

        if (!asset || cancelled) {
          return;
        }

        const blob = new Blob([asset.data], { type: asset.mime });
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.add(objectUrl);
        newMap.set(element.id, objectUrl);
      })
    ).then(() => {
      if (!cancelled) {
        setResolvedUrls(newMap);
      }
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [elements]);

  return resolvedUrls;
}