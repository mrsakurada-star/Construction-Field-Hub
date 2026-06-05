/* © 2026 Nozomi Sakurada. All rights reserved. */
/* BtoB価格表作成ツール - IndexedDB管理モジュール */

const DB_NAME = 'BtoBPriceListDB';
const DB_VERSION = 2;

let _db = null;

/**
 * DBを開く（初回のみ初期化）
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (_db) { resolve(_db); return; }
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
            const db = e.target.result;

            // 顧客ストア（取引先・販売店）
            if (!db.objectStoreNames.contains('customers')) {
                const cs = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
                cs.createIndex('parentId', 'parentId', { unique: false });
                cs.createIndex('type', 'type', { unique: false });
            }

            // 製品マスタ（製品ID・製品名・定価・仕入先・カテゴリ）
            if (!db.objectStoreNames.contains('products')) {
                const ps = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                ps.createIndex('category', 'category', { unique: false });
            }

            // 工事マスタ（工事ID・工事名・OPEN価格）
            if (!db.objectStoreNames.contains('constructions')) {
                db.createObjectStore('constructions', { keyPath: 'id', autoIncrement: true });
            }

            // 価格表ヘッダー
            if (!db.objectStoreNames.contains('priceLists')) {
                const pl = db.createObjectStore('priceLists', { keyPath: 'id', autoIncrement: true });
                pl.createIndex('customerId', 'customerId', { unique: false });
                pl.createIndex('status', 'status', { unique: false });
                pl.createIndex('originalId', 'originalId', { unique: false });
            }

            // 価格表明細（製品/工事の行データ）
            if (!db.objectStoreNames.contains('priceListItems')) {
                const pli = db.createObjectStore('priceListItems', { keyPath: 'id', autoIncrement: true });
                pli.createIndex('priceListId', 'priceListId', { unique: false });
            }

            // アプリ設定（同期ファイルハンドルなど）
            if (!db.objectStoreNames.contains('appSettings')) {
                db.createObjectStore('appSettings');
            }
        };

        req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
        req.onerror = (e) => reject(e.target.error);
    });
}

/**
 * 汎用 CRUD
 */
async function dbAdd(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const req = tx.objectStore(storeName).add(data);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbPut(storeName, data, key = undefined) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const req = key !== undefined ? tx.objectStore(storeName).put(data, key) : tx.objectStore(storeName).put(data);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGet(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbGetByIndex(storeName, indexName, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).index(indexName).getAll(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbDelete(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const req = tx.objectStore(storeName).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function dbDeleteByIndex(storeName, indexName, value) {
    const items = await dbGetByIndex(storeName, indexName, value);
    for (const item of items) {
        await dbDelete(storeName, item.id);
    }
}

/**
 * データベース全体をエクスポート
 */
async function dbExport() {
    const stores = ['customers', 'products', 'constructions', 'priceLists', 'priceListItems'];
    const data = {};
    for (const s of stores) {
        data[s] = await dbGetAll(s);
    }
    return data;
}

/**
 * データベース全体をインポート
 */
async function dbImport(data) {
    return dbImportPartial(data, ['customers', 'products', 'constructions', 'priceLists', 'priceListItems']);
}

/**
 * 特定のストアのみエクスポート
 */
async function dbExportPartial(stores) {
    const data = {};
    for (const s of stores) {
        data[s] = await dbGetAll(s);
    }
    return data;
}

/**
 * 特定のストアのみインポート
 */
async function dbImportPartial(data, stores) {
    const db = await openDB();
    
    // トランザクション開始
    const tx = db.transaction(stores, 'readwrite');
    
    for (const s of stores) {
        if (!data[s]) continue;
        const store = tx.objectStore(s);
        store.clear();
        for (const item of data[s]) {
            store.put(item);
        }
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
