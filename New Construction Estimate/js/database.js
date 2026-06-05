/* © 2026 Nozomi Sakurada. All rights reserved. */

// ===== IndexedDB 管理 =====
const DB_NAME = 'EstimateDB';
const DB_VERSION = 2;

let db = null;

// ===== DB初期化 =====
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('DB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('DB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      // equipment テーブル
      if (!db.objectStoreNames.contains('equipment')) {
        const equipmentStore = db.createObjectStore('equipment', { keyPath: 'id' });
        equipmentStore.createIndex('category', 'category', { unique: false });
      }

      // materials テーブル
      if (!db.objectStoreNames.contains('materials')) {
        const materialsStore = db.createObjectStore('materials', { keyPath: 'id' });
        materialsStore.createIndex('category', 'category', { unique: false });
      }

      // works テーブル
      if (!db.objectStoreNames.contains('works')) {
        const worksStore = db.createObjectStore('works', { keyPath: 'id' });
        worksStore.createIndex('category', 'category', { unique: false });
      }

      // templates テーブル
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id', autoIncrement: true });
      }

      // estimates テーブル
      if (!db.objectStoreNames.contains('estimates')) {
        const estimatesStore = db.createObjectStore('estimates', { keyPath: 'id', autoIncrement: true });
        estimatesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      console.log('Object stores created');
    };
  });
}

// ===== 機器関連の操作 =====
async function addEquipment(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['equipment'], 'readwrite');
    const store = transaction.objectStore('equipment');
    const request = store.add(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateEquipment(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['equipment'], 'readwrite');
    const store = transaction.objectStore('equipment');
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteEquipment(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['equipment'], 'readwrite');
    const store = transaction.objectStore('equipment');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getEquipmentList() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['equipment'], 'readonly');
    const store = transaction.objectStore('equipment');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== 部材関連の操作 =====
async function addMaterial(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['materials'], 'readwrite');
    const store = transaction.objectStore('materials');
    const request = store.add(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateMaterial(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['materials'], 'readwrite');
    const store = transaction.objectStore('materials');
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteMaterial(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['materials'], 'readwrite');
    const store = transaction.objectStore('materials');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getMaterialList() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['materials'], 'readonly');
    const store = transaction.objectStore('materials');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getMaterial(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['materials'], 'readonly');
    const store = transaction.objectStore('materials');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getMaterialsByCategory(category) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['materials'], 'readonly');
    const store = transaction.objectStore('materials');
    const index = store.index('category');
    const request = index.getAll(category);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== 工事関連の操作 =====
async function addWork(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['works'], 'readwrite');
    const store = transaction.objectStore('works');
    const request = store.add(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateWork(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['works'], 'readwrite');
    const store = transaction.objectStore('works');
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteWork(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['works'], 'readwrite');
    const store = transaction.objectStore('works');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getWorkList() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['works'], 'readonly');
    const store = transaction.objectStore('works');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getWork(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['works'], 'readonly');
    const store = transaction.objectStore('works');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getWorksByCategory(category) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['works'], 'readonly');
    const store = transaction.objectStore('works');
    const index = store.index('category');
    const request = index.getAll(category);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== テンプレート関連の操作 =====
async function saveTemplate(templateData) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['templates'], 'readwrite');
    const store = transaction.objectStore('templates');
    const request = store.add(templateData);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateTemplate(templateData) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['templates'], 'readwrite');
    const store = transaction.objectStore('templates');
    const request = store.put(templateData);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteTemplate(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['templates'], 'readwrite');
    const store = transaction.objectStore('templates');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getTemplateList() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['templates'], 'readonly');
    const store = transaction.objectStore('templates');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getTemplate(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['templates'], 'readonly');
    const store = transaction.objectStore('templates');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== 見積関連の操作 =====
async function saveEstimate(estimateData) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['estimates'], 'readwrite');
    const store = transaction.objectStore('estimates');
    const request = estimateData.id ? store.put(estimateData) : store.add(estimateData);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getEstimateList() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['estimates'], 'readonly');
    const store = transaction.objectStore('estimates');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result;
      // createdAt の降順でソート
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getEstimate(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['estimates'], 'readonly');
    const store = transaction.objectStore('estimates');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteEstimate(id) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['estimates'], 'readwrite');
    const store = transaction.objectStore('estimates');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ===== 初期データ投入 =====
async function initializeDefaultData() {
  const equipment = await getEquipmentList();
  if (equipment.length > 0) return; // 既に存在する場合はスキップ

  // デフォルト機器データ
  const defaultEquipment = [
    {
      id: 'GH-H2400ZW',
      name: 'GH-H2400ZW 給湯器',
      category: '給湯器',
      listPrice: 150000,
      unitPrice: 139000,
      qty: 1,
      isMainUnit: true,
      optionTemplate: {
        'ONSUI-CONSENT': 4,
        'PANEL-HEATER': 4,
        'KIKI-HEADER': 1
      }
    },
    {
      id: 'PH-2400',
      name: 'PH-2400 パネルヒーター',
      category: 'ルームヒーター',
      listPrice: 110000,
      unitPrice: 98000,
      qty: 1,
      isMainUnit: true,
      optionTemplate: {
        'TEMP-SENSOR': 1,
        'CONTROL-PANEL': 1,
        'THERMO-STAT': 2
      }
    },
    {
      id: 'SYS-3000',
      name: 'SYS-3000 複合システム',
      category: '複合システム',
      listPrice: 280000,
      unitPrice: 250000,
      qty: 1,
      isMainUnit: true,
      optionTemplate: {
        'ONSUI-CONSENT': 2,
        'PANEL-HEATER': 2,
        'TEMP-SENSOR': 2,
        'PIPE-JOINT-50': 3
      }
    },
    { id: 'TC-713E', name: 'TC-713E', category: '給湯器', unitPrice: 20000, qty: 1 },
    { id: 'HC-6534', name: 'HC-6534（配管カバーH650）', category: '給湯器', unitPrice: 4800, qty: 1 }
  ];

  const defaultMaterials = [
    { id: 'ONSUI-CONSENT', name: '温水コンセント　他部材', category: 'ルームヒーター', listPrice: 12000, unitPrice: 10000, qty: 1, isOption: true },
    { id: 'PANEL-HEATER', name: 'パネルヒーター', category: 'ルームヒーター', listPrice: 55000, unitPrice: 50000, qty: 1, isOption: true },
    { id: 'TEMP-SENSOR', name: '温度センサー', category: 'ルームヒーター', listPrice: 6000, unitPrice: 5000, qty: 1 },
    { id: 'CONTROL-PANEL', name: '制御パネル', category: 'ルームヒーター', listPrice: 10000, unitPrice: 8000, qty: 1 },
    { id: 'THERMO-STAT', name: 'サーモスタット', category: 'ルームヒーター', listPrice: 4500, unitPrice: 3500, qty: 1 },
    { id: 'PANEL-MOUNT', name: 'パネル取付金具', category: 'ルームヒーター', listPrice: 3000, unitPrice: 2000, qty: 1 },
    { id: 'CH-J20A0F', name: 'CH-J20A0F（クリップ付）', category: '給湯器', type: 'QFジョイント(3/4用)', unitPrice: 1100, qty: 2 },
    { id: 'CH-J15A0F', name: 'CH-J15A0F（クリップ付）', category: '給湯器', type: 'QFジョイント1/2用', unitPrice: 1705, qty: 1 },
    { id: 'WJ1A-2016C-S', name: 'WJ1A-2016C-S', category: '給湯器', type: 'ダブルロックジョイント', unitPrice: 1900, qty: 2 },
    { id: 'WJ18A2016C-S', name: 'WJ18A2016C-S', category: '給湯器', type: 'ダブルロックジョイント', unitPrice: 2300, qty: 2 },
    { id: 'TP-LH4', name: 'TP-LH4', category: '給湯器', type: 'Lヘッダー(5P)', unitPrice: 5100, qty: 2 },
    { id: 'PIPE-JOINT-50', name: '配管ジョイント50mm', category: '複合システム', unitPrice: 1200, qty: 1 },
    { id: 'FLEX-PIPE', name: 'フレキシブル配管', category: '複合システム', listPrice: 8000, unitPrice: 6500, qty: 1 }
  ];

  const defaultWorks = [
    { id: 'DREN-HOGO', name: 'ドレン配管保温部材', category: '給湯器', unitPrice: 3000, qty: 1 },
    { id: 'FUZUI-HOZON', name: '不凍液　他部材', category: '給湯器', unitPrice: 10000, qty: 1 },
    { id: 'KIKI-HEADER', name: '機器設置・ヘッダー組立', category: '給湯器', listPrice: 30000, unitPrice: 25000, qty: 1 },
    { id: 'PANEL-INSTALL', name: 'パネルヒーター設置・配線', category: 'ルームヒーター', listPrice: 18000, unitPrice: 15000, qty: 1 },
    { id: 'SENSOR-SETUP', name: 'センサー設置・調整', category: 'ルームヒーター', listPrice: 10000, unitPrice: 8000, qty: 1 },
    { id: 'THERMO-CALIB', name: 'サーモスタット調整', category: 'ルームヒーター', unitPrice: 5000, qty: 1 },
    { id: 'SYSTEM-CONNECT', name: 'システム接続・試運転', category: '複合システム', listPrice: 40000, unitPrice: 35000, qty: 1 },
    { id: 'MIXING-VALVE', name: '混合弁調整・設定', category: '複合システム', listPrice: 15000, unitPrice: 12000, qty: 1 },
    { id: 'PRESSURE-TEST', name: '圧力テスト・検査', category: '複合システム', unitPrice: 8000, qty: 1 }
  ];

  try {
    for (const item of defaultEquipment) await addEquipment(item);
    for (const item of defaultMaterials) await addMaterial(item);
    for (const item of defaultWorks) await addWork(item);
    console.log('Default data initialized');
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// ===== DB初期化と初期データ投入 =====
(async () => {
  try {
    await initDB();
    await initializeDefaultData();
  } catch (error) {
    console.error('DB initialization failed:', error);
  }
})();
