/* © 2026 Nozomi Sakurada. All rights reserved. */
/* Service Book - IndexedDB管理モジュール */
const DB_NAME='ServiceBookDB';
const DB_VERSION=1;
let _db=null;

function openDB(){
  return new Promise((resolve,reject)=>{
    if(_db){resolve(_db);return;}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=(e)=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains('customers')){
        db.createObjectStore('customers',{keyPath:'id',autoIncrement:true});
      }
      if(!db.objectStoreNames.contains('equipments')){
        const es=db.createObjectStore('equipments',{keyPath:'id',autoIncrement:true});
        es.createIndex('customerId','customerId',{unique:false});
      }
      if(!db.objectStoreNames.contains('serviceRecords')){
        const rs=db.createObjectStore('serviceRecords',{keyPath:'id',autoIncrement:true});
        rs.createIndex('equipmentId','equipmentId',{unique:false});
        rs.createIndex('status','status',{unique:false});
      }
      if(!db.objectStoreNames.contains('appSettings')){
        db.createObjectStore('appSettings');
      }
    };
    req.onsuccess=(e)=>{_db=e.target.result;resolve(_db);};
    req.onerror=(e)=>reject(e.target.error);
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
        tx.onabort = () => reject(tx.error || new DOMException('Transaction aborted', 'AbortError'));
    });
}
