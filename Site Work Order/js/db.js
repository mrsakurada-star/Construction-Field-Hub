/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * IndexedDB 操作モジュール
 * 現場地図画像（Base64 DataURL）の永続化を担当する。
 * フォーム入力全体は storage.js / localStorage が担当。
 */

const SWO_DB_NAME    = 'siteWorkOrderDB';
const SWO_DB_VERSION = 1;
const SWO_STORE_NAME = 'mapImages';
const SWO_MAP_IMAGE_ID = 'mapImage'; // 単一画像のため固定キー

let swoDB = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SWO_DB_NAME, SWO_DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SWO_STORE_NAME)) {
        db.createObjectStore(SWO_STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => {
      swoDB = e.target.result;
      resolve(swoDB);
    };

    req.onerror = (e) => {
      console.error('[DB] IndexedDB 初期化失敗:', e.target.error);
      reject(e.target.error);
    };
  });
}

function saveMapImage(src) {
  if (!swoDB) return;
  const tx = swoDB.transaction(SWO_STORE_NAME, 'readwrite');
  tx.objectStore(SWO_STORE_NAME).put({ id: SWO_MAP_IMAGE_ID, src });
}

function getMapImage() {
  return new Promise((resolve) => {
    if (!swoDB) { resolve(null); return; }
    const req = swoDB
      .transaction(SWO_STORE_NAME, 'readonly')
      .objectStore(SWO_STORE_NAME)
      .get(SWO_MAP_IMAGE_ID);
    req.onsuccess = (e) => resolve(e.target.result ? e.target.result.src : null);
    req.onerror   = () => resolve(null);
  });
}

function deleteMapImage() {
  return new Promise((resolve) => {
    if (!swoDB) { resolve(); return; }
    const tx = swoDB.transaction(SWO_STORE_NAME, 'readwrite');
    const req = tx.objectStore(SWO_STORE_NAME).delete(SWO_MAP_IMAGE_ID);
    req.onsuccess = () => resolve();
    req.onerror   = () => resolve();
  });
}
