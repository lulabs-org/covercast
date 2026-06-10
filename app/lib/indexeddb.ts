"use client";

const DB_NAME = "covercast";
const DB_VERSION = 1;
const ASSETS_STORE = "assets";

export interface StoredAsset {
  id: string;
  data: ArrayBuffer;
  mime: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        db.createObjectStore(ASSETS_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function getAssetFromIndexedDB(id: string): Promise<StoredAsset | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ASSETS_STORE, "readonly");
      const store = transaction.objectStore(ASSETS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  } catch {
    return null;
  }
}

export async function saveAssetToIndexedDB(asset: StoredAsset): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readwrite");
    const store = transaction.objectStore(ASSETS_STORE);
    const request = store.put(asset);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteAssetFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readwrite");
    const store = transaction.objectStore(ASSETS_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}