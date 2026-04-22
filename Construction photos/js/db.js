/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * IndexedDB 操作モジュール
 * 写真 src（Base64 DataURL）の永続化を担当する。
 * メタ情報（タイトル・日付等）は storage.js / localStorage が担当。
 */

const DB_NAME    = 'kojiPhotoDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let kojiDB = null; // 開いた DB インスタンスを保持

/**
 * IndexedDB を開いてグローバル kojiDB に格納する。
 * アプリ起動時に一度呼ぶ（Promise）。
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    // 初回作成 or バージョンアップ時のスキーマ定義
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // id をキーパス（photos[].id と対応）
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => {
      kojiDB = e.target.result;
      resolve(kojiDB);
    };

    req.onerror = (e) => {
      console.error('[DB] IndexedDB 初期化失敗:', e.target.error);
      reject(e.target.error);
    };
  });
}

/**
 * 指定した id の写真 src を保存（上書き）する。
 * @param {number} id   - photo.id
 * @param {string} src  - Base64 DataURL
 */
function savePhotoSrc(id, src) {
  if (!kojiDB) return;
  const tx = kojiDB.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put({ id, src });
}

/**
 * 指定した id の写真 src を取得する（Promise）。
 * @param {number} id
 * @returns {Promise<string|null>} src または null
 */
function getPhotoSrc(id) {
  return new Promise((resolve) => {
    if (!kojiDB) { resolve(null); return; }
    const req = kojiDB
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .get(id);
    req.onsuccess = (e) => resolve(e.target.result ? e.target.result.src : null);
    req.onerror   = () => resolve(null);
  });
}

/**
 * 全写真 src を取得して Map<id, src> で返す（Promise）。
 * @returns {Promise<Map<number, string>>}
 */
function getAllPhotoSrcs() {
  return new Promise((resolve) => {
    if (!kojiDB) { resolve(new Map()); return; }
    const map = new Map();
    const req = kojiDB
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        map.set(cursor.value.id, cursor.value.src);
        cursor.continue();
      } else {
        resolve(map);
      }
    };
    req.onerror = () => resolve(map);
  });
}

/**
 * 指定した id の写真 src を IndexedDB から削除する。
 * @param {number} id
 */
function deletePhotoSrc(id) {
  if (!kojiDB) return;
  const tx = kojiDB.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
}

/**
 * IndexedDB 内の全写真 src を削除する。
 * ストレージクリア時に呼ぶ。
 */
function clearAllPhotoSrcs() {
  return new Promise((resolve) => {
    if (!kojiDB) { resolve(); return; }
    const tx  = kojiDB.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => resolve();
  });
}
