# 大規模現場工事指示書 作成ツール Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construction Field Hub ポータルに、複数業者対応の大規模現場工事指示書（現場概要1枚＋工事指示書1枚、A4横×2ページ）を作成・印刷/PDF出力できる新規ツール「Site Work Order」を追加する。

**Architecture:** 既存ツール（`Construction photos/`, `Field_Checklists/`）と同じ `index.html` + `css/style.css` + `js/*.js` 構成の単独フォルダとして `Construction Field Hub/Site Work Order/` に新規作成する。フォーム入力（業者・工程・チェックリスト・概要テキスト）は `localStorage` に、現場地図画像は `Construction photos/js/db.js` と同パターンの IndexedDB モジュールに保存する。工程表（ガントチャート）は業者一覧の入退場予定から自動描画し、セルクリックによる手動上書きにも対応する。印刷は `window.print()` + `@media print` で2ページ（A4横）構成にする。

**Tech Stack:** Vanilla HTML/CSS/JavaScript（フレームワーク無し）、Lucide icons（CDN）、`qrcode` CDNライブラリ（Google Maps QR生成）、`localStorage` + `IndexedDB`、ブラウザ標準印刷機能。

**テストについて:** このプロジェクトには自動テストランナー（Jest等）が導入されていないため（既存の `Construction photos/` 等も同様）、各タスクの「テスト」はブラウザのDevToolsコンソールで実行する手動アサーション、または `index.html` を開いての目視確認とする。各ステップに具体的な確認コマンド・期待結果を明記する。

---

## File Structure

```
Construction Field Hub/Site Work Order/
  index.html              UIの土台（タブ切替、両ページのDOMコンテナ）
  css/
    style.css             画面表示用スタイル
    print.css             @media print 用スタイル（A4横・2ページ分割・ガント）
  js/
    data.js               定数（時間帯7:00-18:00の列定義、共通チェックリスト初期値）
    db.js                 IndexedDB：現場地図画像の保存/取得（Construction photos/js/db.js を流用・改名）
    storage.js             localStorage：概要・業者・工程・チェックリストの保存/復元
    vendor.js              業者グループ・工程行のCRUDロジック
    gantt.js               工程表（ガントチャート）の自動描画・セルクリック手動上書き
    map.js                 Google Maps embed URL生成・QRコード生成
    checklist.js           共通チェックリスト・業者別チェックリストのレンダリング
    app.js                 初期化・イベント結線・印刷トリガー
```

---

## Task 1: フォルダ・骨格ファイルの作成とポータル登録

**Files:**
- Create: `Construction Field Hub/Site Work Order/index.html`
- Create: `Construction Field Hub/Site Work Order/css/style.css`
- Modify: `Construction Field Hub/js/tools.js`

- [ ] **Step 1: ツール用フォルダと最小限の `index.html` を作成する**

```html
<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>大規模現場工事指示書 作成ツール</title>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/print.css" media="print">
</head>
<body>
  <header class="app-header no-print">
    <div class="logo"><i data-lucide="clipboard-list"></i></div>
    <div><h1>大規模現場工事指示書 作成ツール</h1></div>
    <div class="header-actions">
      <button class="btn btn-secondary" type="button" id="btnClear">
        <i data-lucide="trash-2"></i>クリア
      </button>
      <button class="btn btn-success" type="button" id="btnPrint">
        <i data-lucide="printer"></i>印刷 / PDF出力
      </button>
    </div>
  </header>

  <main id="appRoot"></main>

  <div class="toast" id="toast"></div>

  <script src="js/data.js"></script>
  <script src="js/db.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/vendor.js"></script>
  <script src="js/map.js"></script>
  <script src="js/gantt.js"></script>
  <script src="js/checklist.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 最小限の `css/style.css` を作成する（ヘッダー・トースト・ボタン共通部分）**

```css
/* © 2026 Nozomi Sakurada. All rights reserved. */
* { box-sizing: border-box; }
body { margin: 0; font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif; background: #f5f5f7; color: #1d1d1f; }

.app-header {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; background: #ff9500; color: #fff;
}
.app-header h1 { font-size: 16px; margin: 0; }
.header-actions { margin-left: auto; display: flex; gap: 8px; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: none; border-radius: 6px;
  font-size: 13px; cursor: pointer;
}
.btn-success { background: #34c759; color: #fff; }
.btn-secondary { background: rgba(255,255,255,0.25); color: #fff; }

.toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px);
  background: #1d1d1f; color: #fff; padding: 10px 18px; border-radius: 6px;
  opacity: 0; pointer-events: none; transition: all .25s;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
```

- [ ] **Step 3: ブラウザで `index.html` を直接開いて確認する**

確認方法: `Construction Field Hub/Site Work Order/index.html` をブラウザで開く。
期待結果: オレンジ色のヘッダーに「大規模現場工事指示書 作成ツール」タイトルと「クリア」「印刷 / PDF出力」ボタンが表示される（コンソールエラーなし）。

- [ ] **Step 4: `js/tools.js` にツールエントリを追加する**

`Construction Field Hub/js/tools.js` の配列末尾（`btob_price` の次、閉じ `]` の前）に追加：

```javascript
    {
        id: "site_work_order",
        title: "大規模現場工事指示書 作成ツール",
        desc: "複数業者対応の現場概要・地図・工程表（ガントチャート）・持参品指示をまとめたA4横2ページの工事指示書を作成",
        category: "site-mgmt",
        tags: ["工事指示書", "複数業者", "工程表"],
        url: "Site Work Order/index.html",
        icon: "clipboard-list"
    },
```

- [ ] **Step 5: ポータル `index.html` を開いてツール一覧に表示されることを確認する**

確認方法: `Construction Field Hub/index.html` をブラウザで開き、ツール一覧に「大規模現場工事指示書 作成ツール」カードが表示されることを目視確認する。クリックして `Site Work Order/index.html` に遷移できることを確認する。

- [ ] **Step 6: コミット**

```bash
git add "Site Work Order/index.html" "Site Work Order/css/style.css" "js/tools.js"
git commit -m "feat: 大規模現場工事指示書ツールの骨格とポータル登録を追加"
```

---

## Task 2: データモデル定数とIndexedDBモジュール

**Files:**
- Create: `Construction Field Hub/Site Work Order/js/data.js`
- Create: `Construction Field Hub/Site Work Order/js/db.js`

- [ ] **Step 1: `js/data.js` に時間帯定義と共通チェックリスト初期値を書く**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

// 工程表の時間軸（7:00〜18:00、1時間刻み）
const GANTT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// 共通持参品・注意事項チェックリストの初期値
const DEFAULT_COMMON_CHECKLIST = [
  { id: "c1", text: "ヘルメット・安全靴", checked: false },
  { id: "c2", text: "作業記録書・身分証", checked: false },
  { id: "c3", text: "現場入退場ルールの確認", checked: false }
];
```

- [ ] **Step 2: コンソールで定数が読み込まれることを確認する**

確認方法: `index.html` に `<script src="js/data.js"></script>` を `js/db.js` の前に追加した状態でブラウザの開発者コンソールを開き、`GANTT_HOURS` と入力する。
期待結果: `[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]` が表示される。

- [ ] **Step 3: `js/db.js` を作成する（`Construction photos/js/db.js` の地図画像版）**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * IndexedDB 操作モジュール
 * 現場地図画像（Base64 DataURL）の永続化を担当する。
 */

const DB_NAME    = 'siteWorkOrderDB';
const DB_VERSION = 1;
const STORE_NAME = 'mapImages';
const MAP_IMAGE_ID = 'siteMap';

let swoDB = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
  return new Promise((resolve) => {
    if (!swoDB) { resolve(); return; }
    const tx = swoDB.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id: MAP_IMAGE_ID, src });
    tx.oncomplete = () => resolve();
  });
}

function getMapImage() {
  return new Promise((resolve) => {
    if (!swoDB) { resolve(null); return; }
    const req = swoDB
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .get(MAP_IMAGE_ID);
    req.onsuccess = (e) => resolve(e.target.result ? e.target.result.src : null);
    req.onerror   = () => resolve(null);
  });
}

function clearMapImage() {
  return new Promise((resolve) => {
    if (!swoDB) { resolve(); return; }
    const tx = swoDB.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(MAP_IMAGE_ID);
    tx.oncomplete = () => resolve();
  });
}
```

- [ ] **Step 4: コンソールでIndexedDBの保存・取得を確認する**

確認方法: `index.html` を開き、開発者コンソールで以下を実行する。

```javascript
await initDB();
await saveMapImage("data:image/png;base64,TEST");
await getMapImage();
```

期待結果: 最後の呼び出しが `"data:image/png;base64,TEST"` を返す。

- [ ] **Step 5: コミット**

```bash
git add "Site Work Order/js/data.js" "Site Work Order/js/db.js"
git commit -m "feat: 工程表定数とIndexedDB地図画像モジュールを追加"
```

---

## Task 3: 業者グループ・工程行データと localStorage 保存

**Files:**
- Create: `Construction Field Hub/Site Work Order/js/vendor.js`
- Create: `Construction Field Hub/Site Work Order/js/storage.js`

- [ ] **Step 1: `js/vendor.js` に業者グループ・工程行のCRUD関数を書く**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

// グローバル状態：業者グループの配列
// vendorGroups: [{ id, name, contactName, phone, processes: [{ id, work, startDateTime, endDateTime }], notes: [{id, text, checked}] }]
let vendorGroups = [];
let vendorIdSeq = 1;
let processIdSeq = 1;

function addVendorGroup() {
  const group = {
    id: vendorIdSeq++,
    name: "",
    contactName: "",
    phone: "",
    processes: [],
    notes: []
  };
  vendorGroups.push(group);
  return group;
}

function removeVendorGroup(vendorId) {
  vendorGroups = vendorGroups.filter(v => v.id !== vendorId);
}

function addProcess(vendorId) {
  const group = vendorGroups.find(v => v.id === vendorId);
  if (!group) return null;
  const process = {
    id: processIdSeq++,
    work: "",
    startDateTime: "",
    endDateTime: ""
  };
  group.processes.push(process);
  return process;
}

function removeProcess(vendorId, processId) {
  const group = vendorGroups.find(v => v.id === vendorId);
  if (!group) return;
  group.processes = group.processes.filter(p => p.id !== processId);
}

function getAllProcessesFlat() {
  // ガントチャート描画用：業者情報を持たせたフラットな工程一覧
  const flat = [];
  vendorGroups.forEach(v => {
    v.processes.forEach(p => {
      flat.push({ vendorId: v.id, vendorName: v.name, ...p });
    });
  });
  return flat;
}
```

- [ ] **Step 2: コンソールでCRUDロジックを確認する**

確認方法: `index.html` を開き、開発者コンソールで以下を実行する。

```javascript
const g = addVendorGroup();
g.name = "テスト電気工事";
const p = addProcess(g.id);
p.work = "配線";
p.startDateTime = "2026-07-01T08:00";
p.endDateTime = "2026-07-01T12:00";
getAllProcessesFlat();
```

期待結果: `[{ vendorId: 1, vendorName: "テスト電気工事", id: 1, work: "配線", startDateTime: "2026-07-01T08:00", endDateTime: "2026-07-01T12:00" }]` が返る。

- [ ] **Step 3: `js/storage.js` に localStorage 保存・復元処理を書く**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

const STORAGE_KEY = 'siteWorkOrderData';

// グローバル状態：現場概要
let overview = {
  manageNo: "",
  projectName: "",
  address: "",
  periodStart: "",
  periodEnd: "",
  meetingTime: "",
  orderer: "",
  siteManagerName: "",
  siteManagerPhone: "",
  createdBy: "",
  overviewText: "",
  buildingInfo: "",
  generalNotes: "",
  mapsUrlOverride: ""
};

let commonChecklist = JSON.parse(JSON.stringify(DEFAULT_COMMON_CHECKLIST));

function saveToStorage() {
  const data = { overview, vendorGroups, commonChecklist, vendorIdSeq, processIdSeq };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.overview) overview = data.overview;
    if (data.vendorGroups) vendorGroups = data.vendorGroups;
    if (data.commonChecklist) commonChecklist = data.commonChecklist;
    if (data.vendorIdSeq) vendorIdSeq = data.vendorIdSeq;
    if (data.processIdSeq) processIdSeq = data.processIdSeq;
  } catch (e) {
    console.error('[storage] 復元失敗:', e);
  }
}

async function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  await clearMapImage();
  overview = {
    manageNo: "", projectName: "", address: "", periodStart: "", periodEnd: "",
    meetingTime: "", orderer: "", siteManagerName: "", siteManagerPhone: "",
    createdBy: "", overviewText: "", buildingInfo: "", generalNotes: "", mapsUrlOverride: ""
  };
  vendorGroups = [];
  commonChecklist = JSON.parse(JSON.stringify(DEFAULT_COMMON_CHECKLIST));
}
```

- [ ] **Step 4: コンソールで保存・復元を確認する**

確認方法: 開発者コンソールで以下を実行する。

```javascript
overview.projectName = "テスト工事";
saveToStorage();
overview.projectName = "";
loadFromStorage();
overview.projectName;
```

期待結果: 最後の式が `"テスト工事"` を返す（`localStorage` 経由で復元されている）。

- [ ] **Step 5: コミット**

```bash
git add "Site Work Order/js/vendor.js" "Site Work Order/js/storage.js"
git commit -m "feat: 業者グループ・工程行のCRUDとlocalStorage保存を追加"
```

---

## Task 4: 現場概要ページ（1枚目）のDOM構築

**Files:**
- Modify: `Construction Field Hub/Site Work Order/index.html`
- Create: `Construction Field Hub/Site Work Order/js/map.js`
- Modify: `Construction Field Hub/Site Work Order/css/style.css`

- [ ] **Step 1: `index.html` の `<main id="appRoot">` 内に1枚目「現場概要」のDOMを追加する**

```html
  <main id="appRoot">
    <section class="page page-overview" id="pageOverview">
      <header class="page-header">
        <h2>現場概要</h2>
        <div class="page-header-meta">
          <label>文書 NO. <input type="text" id="ovManageNo" placeholder="000"></label>
          <label>発行日 <input type="date" id="ovIssueDate"></label>
        </div>
      </header>

      <div class="overview-grid">
        <div class="overview-left">
          <div class="form-group"><label>工事名</label><input type="text" id="ovProjectName" placeholder="工事名を入力してください"></div>
          <div class="form-group"><label>現場住所</label><input type="text" id="ovAddress" placeholder="住所を入力"></div>
          <div class="form-group">
            <label>工事日程</label>
            <div class="form-row">
              <input type="date" id="ovPeriodStart">
              <span>〜</span>
              <input type="date" id="ovPeriodEnd">
            </div>
          </div>
          <div class="form-group"><label>集合時間</label><input type="text" id="ovMeetingTime" placeholder="例: 08:00 — 現場集合"></div>
          <div class="form-group"><label>発注元</label><input type="text" id="ovOrderer"></div>
          <div class="form-row">
            <div class="form-group"><label>現場責任者名</label><input type="text" id="ovSiteManagerName"></div>
            <div class="form-group"><label>電話番号</label><input type="text" id="ovSiteManagerPhone"></div>
          </div>
        </div>

        <div class="overview-right" id="mapContainer">
          <!-- map.js が画面表示用iframe／印刷用QR・画像をここに描画する -->
        </div>
      </div>

      <div class="overview-bottom">
        <h3>現場概要</h3>
        <div class="form-group"><label>現場の概要・条件</label><textarea id="ovOverviewText" rows="2"></textarea></div>
        <div class="form-group"><label>建物種別・規模</label><textarea id="ovBuildingInfo" rows="2"></textarea></div>
        <div class="form-group"><label>全体注意事項・特記事項</label><textarea id="ovGeneralNotes" rows="3"></textarea></div>
      </div>
    </section>

    <section class="page page-order" id="pageOrder">
      <!-- Task 5/6 で工事指示書（業者一覧・工程表・持参品）を追加 -->
    </section>
  </main>
```

- [ ] **Step 2: `js/map.js` を作成する（Maps embed URL・QR生成・地図画像アップロード）**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

function getMapsEmbedUrl(address) {
  if (!address) return "";
  return "https://maps.google.com/maps?q=" + encodeURIComponent(address) + "&output=embed";
}

function getMapsLinkUrl(address) {
  if (!address) return "";
  return "https://maps.google.com/maps?q=" + encodeURIComponent(address);
}

async function renderMapContainer() {
  const container = document.getElementById('mapContainer');
  const address = overview.address || "";
  const mapImage = await getMapImage();

  let html = '<div class="map-screen no-print">';
  if (address) {
    html += '<iframe class="map-iframe" src="' + getMapsEmbedUrl(address) + '" loading="lazy"></iframe>';
  } else {
    html += '<div class="map-placeholder">住所を入力すると地図が表示されます</div>';
  }
  html += '</div>';

  html += '<div class="map-print only-print">';
  if (mapImage) {
    html += '<img class="map-print-image" src="' + mapImage + '" alt="現場地図">';
  } else if (address) {
    html += '<div class="map-qr" id="mapQrCanvas"></div>';
    html += '<div class="map-qr-label">QRコードからGoogle Mapsで現場を開く</div>';
  } else {
    html += '<div class="map-placeholder">地図画像未設定</div>';
  }
  html += '</div>';

  html += '<div class="map-upload no-print">';
  html += '<input type="file" id="mapImageInput" accept="image/*">';
  html += '<button type="button" class="btn btn-secondary" id="btnClearMapImage">地図画像を削除</button>';
  html += '</div>';

  container.innerHTML = html;

  if (!mapImage && address && document.getElementById('mapQrCanvas')) {
    QRCode.toCanvas(document.createElement('canvas'), getMapsLinkUrl(address), (err, canvas) => {
      if (!err) document.getElementById('mapQrCanvas').appendChild(canvas);
    });
  }

  document.getElementById('mapImageInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await saveMapImage(reader.result);
      renderMapContainer();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnClearMapImage').addEventListener('click', async () => {
    await clearMapImage();
    renderMapContainer();
  });
}
```

- [ ] **Step 3: `css/style.css` に1枚目レイアウト用スタイルを追記する**

```css
.page { background: #fff; max-width: 1400px; margin: 16px auto; padding: 20px; border-radius: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: center; background: #ff9500; color: #fff; padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 18px; }
.page-header-meta { display: flex; gap: 16px; font-size: 12px; }
.page-header-meta input { margin-left: 6px; }

.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.form-group { margin-bottom: 10px; }
.form-group label { display: block; font-size: 12px; color: #6e6e73; margin-bottom: 2px; }
.form-group input, .form-group textarea { width: 100%; padding: 6px 8px; border: 1px solid #d2d2d7; border-radius: 4px; font-size: 13px; }
.form-row { display: flex; gap: 8px; align-items: center; }

.map-iframe { width: 100%; height: 240px; border: 1px solid #d2d2d7; border-radius: 4px; }
.map-placeholder { display: flex; align-items: center; justify-content: center; height: 240px; background: #f5f5f7; color: #86868b; border-radius: 4px; }
.map-upload { margin-top: 8px; display: flex; gap: 8px; align-items: center; }

.overview-bottom { margin-top: 16px; border-top: 1px solid #d2d2d7; padding-top: 12px; }

.only-print { display: none; }
```

- [ ] **Step 4: `index.html` の `<head>` に `js/map.js` の読み込みを追加し、ブラウザで動作確認する**

`index.html` の `<script src="js/db.js"></script>` の後ろに以下を追加：

```html
  <script src="js/map.js"></script>
```

確認方法: `index.html` を開発者コンソールで以下を実行して描画する。

```javascript
await initDB();
loadFromStorage();
overview.address = "東京都千代田区1-1-1";
await renderMapContainer();
```

期待結果: `#mapContainer` 内に Google Maps の iframe が表示される。コンソールエラーがない。

- [ ] **Step 5: コミット**

```bash
git add "Site Work Order/index.html" "Site Work Order/js/map.js" "Site Work Order/css/style.css"
git commit -m "feat: 現場概要ページ（1枚目）のDOMと地図表示を追加"
```

---

## Task 5: 業者一覧（業者グループ＋工程行）UI

**Files:**
- Modify: `Construction Field Hub/Site Work Order/index.html`
- Create: `Construction Field Hub/Site Work Order/js/render_vendor_list.js`
- Modify: `Construction Field Hub/Site Work Order/css/style.css`

- [ ] **Step 1: `index.html` の `<section id="pageOrder">` 内に業者一覧の骨組みを追加する**

```html
    <section class="page page-order" id="pageOrder">
      <header class="page-header">
        <h2>工事指示書</h2>
        <div class="page-header-meta">
          <label>文書 NO. <span id="orderManageNoDisplay"></span></label>
          <label>発行日 <span id="orderIssueDateDisplay"></span></label>
        </div>
      </header>

      <div class="vendor-list-section">
        <div class="section-title-row">
          <h3>業者一覧</h3>
          <button class="btn btn-secondary no-print" type="button" id="btnAddVendor">
            <i data-lucide="plus"></i>業者を追加
          </button>
        </div>
        <div id="vendorListContainer"></div>
      </div>

      <div class="gantt-section" id="ganttSection">
        <!-- Task 6 で工程表を追加 -->
      </div>

      <div class="checklist-section" id="checklistSection">
        <!-- Task 7 で持参品・注意事項を追加 -->
      </div>
    </section>
```

- [ ] **Step 2: `js/render_vendor_list.js` を作成する**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

function renderVendorList() {
  const container = document.getElementById('vendorListContainer');
  container.innerHTML = vendorGroups.map(renderVendorGroupHtml).join('');
  attachVendorListEvents();
}

function renderVendorGroupHtml(group) {
  const processRows = group.processes.map(p => `
    <tr data-process-id="${p.id}">
      <td><input type="text" class="processWork" value="${escapeAttr(p.work)}" placeholder="作業内容（担当領域）"></td>
      <td><input type="datetime-local" class="processStart" value="${p.startDateTime}"></td>
      <td><input type="datetime-local" class="processEnd" value="${p.endDateTime}"></td>
      <td><button type="button" class="btn-icon removeProcess no-print" title="削除"><i data-lucide="x"></i></button></td>
    </tr>
  `).join('');

  return `
    <div class="vendor-group" data-vendor-id="${group.id}">
      <div class="vendor-group-header">
        <input type="text" class="vendorName" value="${escapeAttr(group.name)}" placeholder="業者名">
        <input type="text" class="vendorContact" value="${escapeAttr(group.contactName)}" placeholder="担当者名">
        <input type="text" class="vendorPhone" value="${escapeAttr(group.phone)}" placeholder="電話番号">
        <button type="button" class="btn-icon removeVendor no-print" title="業者を削除"><i data-lucide="trash-2"></i></button>
      </div>
      <table class="process-table">
        <thead><tr><th>作業内容</th><th>入場予定</th><th>退場予定</th><th class="no-print"></th></tr></thead>
        <tbody>${processRows}</tbody>
      </table>
      <button type="button" class="btn btn-secondary btn-sm addProcess no-print" data-vendor-id="${group.id}">
        <i data-lucide="plus"></i>工程を追加
      </button>
    </div>
  `;
}

function escapeAttr(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function attachVendorListEvents() {
  document.querySelectorAll('.vendor-group').forEach(el => {
    const vendorId = Number(el.dataset.vendorId);
    const group = vendorGroups.find(v => v.id === vendorId);

    el.querySelector('.vendorName').addEventListener('input', (e) => { group.name = e.target.value; saveAndRefresh(); });
    el.querySelector('.vendorContact').addEventListener('input', (e) => { group.contactName = e.target.value; saveAndRefresh(); });
    el.querySelector('.vendorPhone').addEventListener('input', (e) => { group.phone = e.target.value; saveAndRefresh(); });
    el.querySelector('.removeVendor').addEventListener('click', () => { removeVendorGroup(vendorId); renderVendorList(); renderGantt(); saveToStorage(); });
    el.querySelector('.addProcess').addEventListener('click', () => { addProcess(vendorId); renderVendorList(); renderGantt(); saveToStorage(); });

    el.querySelectorAll('tr[data-process-id]').forEach(row => {
      const processId = Number(row.dataset.processId);
      const process = group.processes.find(p => p.id === processId);
      row.querySelector('.processWork').addEventListener('input', (e) => { process.work = e.target.value; saveAndRefresh(); });
      row.querySelector('.processStart').addEventListener('input', (e) => { process.startDateTime = e.target.value; renderGantt(); saveToStorage(); });
      row.querySelector('.processEnd').addEventListener('input', (e) => { process.endDateTime = e.target.value; renderGantt(); saveToStorage(); });
      row.querySelector('.removeProcess').addEventListener('click', () => { removeProcess(vendorId, processId); renderVendorList(); renderGantt(); saveToStorage(); });
    });
  });

  document.getElementById('btnAddVendor').addEventListener('click', () => {
    addVendorGroup();
    renderVendorList();
    saveToStorage();
    lucide.createIcons();
  });

  lucide.createIcons();
}

function saveAndRefresh() {
  saveToStorage();
}
```

- [ ] **Step 3: `css/style.css` に業者一覧のスタイルを追記する**

```css
.section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.vendor-group { border: 1px solid #d2d2d7; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
.vendor-group-header { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; margin-bottom: 8px; }
.process-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
.process-table th, .process-table td { border: 1px solid #e5e5ea; padding: 4px 6px; font-size: 12px; }
.btn-icon { background: none; border: none; cursor: pointer; color: #86868b; }
.btn-sm { padding: 4px 10px; font-size: 12px; }
```

- [ ] **Step 4: `index.html` に `js/render_vendor_list.js` の読み込みを追加し、ブラウザで確認する**

`js/map.js` の後ろに追加：

```html
  <script src="js/render_vendor_list.js"></script>
```

確認方法: 開発者コンソールで以下を実行する。

```javascript
loadFromStorage();
addVendorGroup();
renderVendorList();
document.querySelectorAll('.vendor-group').length;
```

期待結果: `1` が返り、画面に業者名・担当者名・電話番号の入力行と「工程を追加」ボタンが表示される。「業者を追加」「工程を追加」ボタンをクリックして行が増えることを目視確認する。

- [ ] **Step 5: コミット**

```bash
git add "Site Work Order/index.html" "Site Work Order/js/render_vendor_list.js" "Site Work Order/css/style.css"
git commit -m "feat: 業者グループ＋工程行の一覧UIを追加"
```

---

## Task 6: 工程表（ガントチャート）の自動描画とセルクリック手動上書き

**Files:**
- Create: `Construction Field Hub/Site Work Order/js/gantt.js`
- Modify: `Construction Field Hub/Site Work Order/index.html`
- Modify: `Construction Field Hub/Site Work Order/css/style.css`

- [ ] **Step 1: `js/gantt.js` に日別カード生成とセル塗りつぶしロジックを書く**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

// 手動上書き: { "processId_YYYY-MM-DD_hour": true }
let ganttManualOverrides = {};

function getProcessDateRange(process) {
  if (!process.startDateTime || !process.endDateTime) return [];
  const start = new Date(process.startDateTime);
  const end = new Date(process.endDateTime);
  const days = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= lastDay) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function isProcessActiveAtHour(process, day, hour) {
  const overrideKey = process.id + "_" + day + "_" + hour;
  if (overrideKey in ganttManualOverrides) return ganttManualOverrides[overrideKey];

  if (!process.startDateTime || !process.endDateTime) return false;
  const slotStart = new Date(day + "T" + String(hour).padStart(2, "0") + ":00");
  const slotEnd = new Date(day + "T" + String(hour + 1).padStart(2, "0") + ":00");
  const start = new Date(process.startDateTime);
  const end = new Date(process.endDateTime);
  return start < slotEnd && end > slotStart;
}

function toggleGanttCell(processId, day, hour, currentlyActive) {
  const key = processId + "_" + day + "_" + hour;
  ganttManualOverrides[key] = !currentlyActive;
  renderGantt();
  saveToStorage();
}

function getAllGanttDays() {
  const daySet = new Set();
  getAllProcessesFlat().forEach(p => {
    getProcessDateRange(p).forEach(d => daySet.add(d));
  });
  return Array.from(daySet).sort();
}

function renderGantt() {
  const container = document.getElementById('ganttSection');
  const days = getAllGanttDays();
  const processes = getAllProcessesFlat();

  if (days.length === 0) {
    container.innerHTML = '<h3>工程表 — SCHEDULE</h3><p class="gantt-empty">業者一覧で入退場予定を入力すると工程表が表示されます。</p>';
    return;
  }

  const headerCells = GANTT_HOURS.map(h => `<th>${h}:00</th>`).join('');

  const cardsHtml = days.map(day => {
    const rows = processes.map(p => {
      const cells = GANTT_HOURS.map(h => {
        const active = isProcessActiveAtHour(p, day, h);
        return `<td class="gantt-cell ${active ? 'active' : ''}" data-process-id="${p.id}" data-day="${day}" data-hour="${h}" data-active="${active}"></td>`;
      }).join('');
      return `<tr><td class="gantt-vendor-label">${escapeAttr(p.vendorName)}（${escapeAttr(p.work)}）</td>${cells}</tr>`;
    }).join('');

    return `
      <div class="gantt-day-card">
        <div class="gantt-day-title">${day}</div>
        <table class="gantt-table">
          <thead><tr><th>業者</th>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join('');

  container.innerHTML = '<h3>工程表 — SCHEDULE <span class="gantt-hint no-print">セルをクリックで時間帯を塗りつぶし</span></h3>' + cardsHtml;

  container.querySelectorAll('.gantt-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const processId = Number(cell.dataset.processId);
      const day = cell.dataset.day;
      const hour = Number(cell.dataset.hour);
      const currentlyActive = cell.dataset.active === 'true';
      toggleGanttCell(processId, day, hour, currentlyActive);
    });
  });
}
```

- [ ] **Step 2: `css/style.css` にガントチャートのスタイルを追記する**

```css
.gantt-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; }
.gantt-table th, .gantt-table td { border: 1px solid #e5e5ea; text-align: center; font-size: 11px; padding: 4px; }
.gantt-vendor-label { text-align: left !important; white-space: nowrap; }
.gantt-cell { cursor: pointer; height: 24px; }
.gantt-cell.active { background: #ff9500; }
.gantt-day-card { break-inside: avoid; margin-bottom: 16px; }
.gantt-hint { font-size: 11px; color: #6e6e73; margin-left: 8px; }
.gantt-empty { color: #86868b; font-size: 13px; }
```

- [ ] **Step 3: `index.html` に `js/gantt.js` の読み込みを追加する**

`js/render_vendor_list.js` の後ろに追加：

```html
  <script src="js/gantt.js"></script>
```

- [ ] **Step 4: ブラウザで自動描画とセルクリックを確認する**

確認方法: 開発者コンソールで以下を実行する。

```javascript
loadFromStorage();
const g = addVendorGroup();
g.name = "電気工事業者A";
const p = addProcess(g.id);
p.work = "配線";
p.startDateTime = "2026-07-01T08:00";
p.endDateTime = "2026-07-01T10:00";
renderGantt();
```

期待結果: `#ganttSection` に「2026-07-01」の日付カードが表示され、8:00列・9:00列のセルがオレンジ色（`active`）になる。そのセルをクリックすると色が消え（`ganttManualOverrides` に上書きが記録される）、再クリックで戻ることを確認する。

- [ ] **Step 5: コミット**

```bash
git add "Site Work Order/js/gantt.js" "Site Work Order/index.html" "Site Work Order/css/style.css"
git commit -m "feat: 工程表（ガントチャート）の自動描画とセル手動上書きを追加"
```

---

## Task 7: 持参品・注意事項（共通＋業者別チェックリスト）

**Files:**
- Create: `Construction Field Hub/Site Work Order/js/checklist.js`
- Modify: `Construction Field Hub/Site Work Order/index.html`
- Modify: `Construction Field Hub/Site Work Order/css/style.css`

- [ ] **Step 1: `js/checklist.js` を作成する**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

let checklistIdSeq = 100;

function renderChecklistSection() {
  const container = document.getElementById('checklistSection');

  const commonHtml = commonChecklist.map(item => `
    <li data-id="${item.id}">
      <label><input type="checkbox" class="commonCheck" ${item.checked ? 'checked' : ''}> ${escapeAttr(item.text)}</label>
      <button type="button" class="btn-icon removeCommon no-print" title="削除"><i data-lucide="x"></i></button>
    </li>
  `).join('');

  const vendorSectionsHtml = vendorGroups.map(group => {
    const itemsHtml = group.notes.map(item => `
      <li data-id="${item.id}">
        <label><input type="checkbox" class="vendorCheck" ${item.checked ? 'checked' : ''}> ${escapeAttr(item.text)}</label>
        <button type="button" class="btn-icon removeVendorNote no-print" title="削除"><i data-lucide="x"></i></button>
      </li>
    `).join('');
    return `
      <div class="vendor-checklist" data-vendor-id="${group.id}">
        <h4>${escapeAttr(group.name) || '（業者名未設定）'} の持参指示・注意事項</h4>
        <ul class="checklist-ul">${itemsHtml}</ul>
        <button type="button" class="btn btn-secondary btn-sm addVendorNote no-print" data-vendor-id="${group.id}">
          <i data-lucide="plus"></i>項目を追加
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h3>持参品・注意事項</h3>
    <div class="common-checklist">
      <h4>共通チェックリスト</h4>
      <ul class="checklist-ul">${commonHtml}</ul>
      <button type="button" class="btn btn-secondary btn-sm" id="btnAddCommon"><i data-lucide="plus"></i>項目を追加</button>
    </div>
    <div class="vendor-checklists">${vendorSectionsHtml}</div>
  `;

  attachChecklistEvents();
  lucide.createIcons();
}

function attachChecklistEvents() {
  document.querySelectorAll('#checklistSection .common-checklist li').forEach(li => {
    const id = li.dataset.id;
    const item = commonChecklist.find(i => i.id === id);
    li.querySelector('.commonCheck').addEventListener('change', (e) => { item.checked = e.target.checked; saveToStorage(); });
    li.querySelector('.removeCommon').addEventListener('click', () => {
      commonChecklist = commonChecklist.filter(i => i.id !== id);
      renderChecklistSection(); saveToStorage();
    });
  });

  const btnAddCommon = document.getElementById('btnAddCommon');
  if (btnAddCommon) {
    btnAddCommon.addEventListener('click', () => {
      commonChecklist.push({ id: 'c' + (checklistIdSeq++), text: "新しい項目", checked: false });
      renderChecklistSection(); saveToStorage();
    });
  }

  document.querySelectorAll('.vendor-checklist').forEach(section => {
    const vendorId = Number(section.dataset.vendorId);
    const group = vendorGroups.find(v => v.id === vendorId);

    section.querySelectorAll('li').forEach(li => {
      const id = li.dataset.id;
      const item = group.notes.find(i => i.id === id);
      li.querySelector('.vendorCheck').addEventListener('change', (e) => { item.checked = e.target.checked; saveToStorage(); });
      li.querySelector('.removeVendorNote').addEventListener('click', () => {
        group.notes = group.notes.filter(i => i.id !== id);
        renderChecklistSection(); saveToStorage();
      });
    });

    section.querySelector('.addVendorNote').addEventListener('click', () => {
      group.notes.push({ id: 'v' + (checklistIdSeq++), text: "新しい項目", checked: false });
      renderChecklistSection(); saveToStorage();
    });
  });
}
```

- [ ] **Step 2: `css/style.css` にチェックリストのスタイルを追記する**

```css
.checklist-ul { list-style: none; padding: 0; margin: 0 0 8px 0; }
.checklist-ul li { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #f0f0f2; font-size: 13px; }
.vendor-checklist { margin-top: 12px; border-top: 1px dashed #d2d2d7; padding-top: 8px; }
```

- [ ] **Step 3: `index.html` に `js/checklist.js` の読み込みを追加する**

`js/gantt.js` の後ろに追加：

```html
  <script src="js/checklist.js"></script>
```

- [ ] **Step 4: ブラウザでチェックリストの追加・チェック・削除を確認する**

確認方法: 開発者コンソールで以下を実行する。

```javascript
loadFromStorage();
renderChecklistSection();
document.getElementById('btnAddCommon').click();
commonChecklist.length;
```

期待結果: 末尾に「新しい項目」が追加され、配列の長さが1増える。画面上でチェックボックスをクリックして `commonChecklist` の `checked` が更新されることを確認する。

- [ ] **Step 5: コミット**

```bash
git add "Site Work Order/js/checklist.js" "Site Work Order/index.html" "Site Work Order/css/style.css"
git commit -m "feat: 共通＋業者別の持参品・注意事項チェックリストを追加"
```

---

## Task 8: 印刷レイアウト（A4横・2ページ分割）

**Files:**
- Create: `Construction Field Hub/Site Work Order/css/print.css`
- Modify: `Construction Field Hub/Site Work Order/css/style.css`

- [ ] **Step 1: `css/print.css` を作成する（`a4_print_adjustment` スキルの方針に従う）**

```css
/* © 2026 Nozomi Sakurada. All rights reserved. */

@page {
  size: A4 landscape;
  margin: 8mm;
}

@media print {
  body { margin: 0; padding: 0; background: #fff; }
  .no-print { display: none !important; }
  .only-print { display: block !important; }

  .page {
    width: 277mm !important;
    height: 190mm !important;
    margin: 0 !important;
    padding: 6mm !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    page-break-after: always;
  }
  .page-order { page-break-after: auto; }

  .gantt-day-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .map-iframe { display: none; }
}
```

- [ ] **Step 2: `css/style.css` に `.only-print` の画面非表示ルールが既にあることを確認し、印刷時のページ間ギャップ等の調整を追記する**

```css
@media screen {
  .page + .page { margin-top: 24px; }
}
```

- [ ] **Step 3: ブラウザの印刷プレビューで2ページ構成を確認する**

確認方法: `index.html` を開き、開発者コンソールで以下を実行してダミーデータを入れてから `Ctrl+P` で印刷プレビューを開く。

```javascript
loadFromStorage();
overview.projectName = "○○ビル改修工事";
overview.address = "東京都千代田区1-1-1";
renderMapContainer();
const g = addVendorGroup();
g.name = "電気工事業者A";
const p = addProcess(g.id);
p.work = "配線";
p.startDateTime = "2026-07-01T08:00";
p.endDateTime = "2026-07-01T10:00";
renderVendorList();
renderGantt();
renderChecklistSection();
```

期待結果: 印刷プレビューがA4横向きで2ページ表示され、1ページ目に「現場概要」（地図はQRコード表示、iframeは非表示）、2ページ目に「工事指示書」（業者一覧・工程表・チェックリスト）が表示される。ボタン等の `no-print` 要素が印刷に出ない。

- [ ] **Step 4: コミット**

```bash
git add "Site Work Order/css/print.css" "Site Work Order/css/style.css"
git commit -m "feat: A4横2ページの印刷レイアウトを追加"
```

---

## Task 9: 初期化・イベント結線（app.js）とクリア機能

**Files:**
- Create: `Construction Field Hub/Site Work Order/js/app.js`

- [ ] **Step 1: `js/app.js` を作成する**

```javascript
/* © 2026 Nozomi Sakurada. All rights reserved. */

function bindOverviewInputs() {
  const map = {
    ovManageNo: 'manageNo', ovProjectName: 'projectName', ovAddress: 'address',
    ovPeriodStart: 'periodStart', ovPeriodEnd: 'periodEnd', ovMeetingTime: 'meetingTime',
    ovOrderer: 'orderer', ovSiteManagerName: 'siteManagerName', ovSiteManagerPhone: 'siteManagerPhone',
    ovOverviewText: 'overviewText', ovBuildingInfo: 'buildingInfo', ovGeneralNotes: 'generalNotes'
  };
  Object.keys(map).forEach(domId => {
    const el = document.getElementById(domId);
    if (!el) return;
    el.value = overview[map[domId]] || '';
    el.addEventListener('input', () => {
      overview[map[domId]] = el.value;
      saveToStorage();
      document.getElementById('orderManageNoDisplay').textContent = overview.manageNo;
      if (domId === 'ovAddress') renderMapContainer();
    });
  });

  const issueDateEl = document.getElementById('ovIssueDate');
  issueDateEl.value = overview.issueDate || new Date().toISOString().slice(0, 10);
  overview.issueDate = issueDateEl.value;
  issueDateEl.addEventListener('input', () => {
    overview.issueDate = issueDateEl.value;
    document.getElementById('orderIssueDateDisplay').textContent = overview.issueDate;
    saveToStorage();
  });

  document.getElementById('orderManageNoDisplay').textContent = overview.manageNo || '';
  document.getElementById('orderIssueDateDisplay').textContent = overview.issueDate || '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

async function renderAll() {
  bindOverviewInputs();
  await renderMapContainer();
  renderVendorList();
  renderGantt();
  renderChecklistSection();
  lucide.createIcons();
}

window.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  loadFromStorage();
  await renderAll();

  document.getElementById('btnPrint').addEventListener('click', () => window.print());

  document.getElementById('btnClear').addEventListener('click', async () => {
    if (!confirm('入力内容をすべて削除します。よろしいですか？')) return;
    await clearAllData();
    ganttManualOverrides = {};
    await renderAll();
    showToast('クリアしました');
  });

  lucide.createIcons();
});
```

- [ ] **Step 2: 全機能を通したブラウザ動作確認を行う**

確認方法: `Site Work Order/index.html` を直接開き、以下を一通り操作する。
1. 工事名・現場住所・工期等を入力 → リロードしても値が保持されることを確認（`loadFromStorage` 経由）。
2. 住所入力後、地図iframeが表示されることを確認。
3. 「業者を追加」→ 業者名・担当者・電話番号を入力 → 「工程を追加」→ 作業内容・入退場日時を入力。
4. 工程表セクションに該当日のガントカードが描かれ、入力した時間帯がオレンジ色になることを確認。
5. 共通チェックリスト・業者別チェックリストに項目を追加・チェックできることを確認。
6. 「印刷 / PDF出力」をクリックし、印刷プレビューがA4横2ページで構成されることを確認。
7. 「クリア」をクリックし、確認ダイアログ後に全データが初期化されることを確認。

期待結果: 上記すべてが正常に動作し、コンソールにエラーが出ないこと。

- [ ] **Step 3: コミット**

```bash
git add "Site Work Order/js/app.js"
git commit -m "feat: 初期化・イベント結線・クリア機能を追加"
```

---

## Task 10: ドキュメント同期（機能説明書・著作権・更新履歴）

**Files:**
- Modify: `Construction Field Hub/機能説明書.md`
- Modify: `Construction Field Hub/js/updates.js`

- [ ] **Step 1: `機能説明書.md` の「11. BtoB価格表作成ツール」の直後（区切り線`---`の後）に新規セクション「12. 大規模現場工事指示書 作成ツール」を追加する**

`機能説明書.md` の268行目付近、`---` の後に挿入：

```markdown
## 12. 大規模現場工事指示書 作成ツール

複数業者が同時入場する大規模現場向けに、現場概要・現場地図・業者別の工程・持参品・注意事項を一元化した工事指示書を作成し、A4横2ページで印刷・PDF出力するツールです。

### ■ 大規模現場工事指示書：主な機能

- **2ページ構成**: 1枚目「現場概要」（工事名・現場住所・工期・集合時間・現場地図・全体注意事項）と、2枚目「工事指示書」（業者一覧・工程表・持参品指示）を分けて出力します。
- **現場地図**: 住所を入力すると画面上にGoogle Mapsを埋め込み表示。印刷時はアップロードした地図画像、または画像が無い場合はGoogle MapsへのQRコードを印字します。
- **業者一覧（業者グループ＋工程行）**: 同一業者が複数日・複数工程を行うケースに対応し、業者ごとに複数の工程（作業内容・入場予定・退場予定）を登録できます。
- **工程表（ガントチャート）**: 業者一覧の入退場予定から、時刻単位（7:00〜18:00）のガントチャートを自動生成。複数日にわたる場合は日ごとにカードを分けて表示します。セルをクリックして手動で時間帯を塗り直すことも可能です。
- **持参品・注意事項**: 全業者共通のチェックリストと、業者ごとの個別の持参指示・注意事項を管理できます。
- **データ保存**: 入力内容はlocalStorageおよびIndexedDB（地図画像）にブラウザ内保存され、再訪問時も復元されます。

### ■ 大規模現場工事指示書：使用方法

1. **現場概要の入力**: 文書NO.・工事名・現場住所・工事日程・集合時間などを入力します。住所を入力すると地図が表示されます。
2. **業者一覧の登録**: 「業者を追加」で業者を登録し、「工程を追加」で各業者の作業内容・入退場予定日時を入力します。
3. **工程表の確認**: 入力した予定が工程表（ガントチャート）に自動反映されます。必要に応じてセルをクリックして手動調整します。
4. **持参品・注意事項の入力**: 共通チェックリストと業者別の個別指示を入力します。
5. **印刷・PDF保存**: 「印刷 / PDF出力」ボタンをクリックし、A4横2ページで出力します。

---
```

- [ ] **Step 2: `機能説明書.md` の最終更新行を更新する**

末尾付近（「最終更新: 2026年5月20日...」の行）を以下に変更：

```markdown
最終更新: 2026年6月16日（v1.4: 大規模現場工事指示書 作成ツールを追加）
```

- [ ] **Step 3: `js/updates.js` の構造を確認し、`portal_update_logging` スキルの形式に従って履歴エントリを追加する**

`Construction Field Hub/js/updates.js` を読み、既存のエントリと同じ形式（日付・対象ツール・内容）で以下を追加する：

```javascript
    {
        date: "2026-06-16",
        tool: "大規模現場工事指示書 作成ツール",
        summary: "複数業者対応の工事指示書（現場概要＋業者一覧・工程表・持参品指示のA4横2ページ）を新規追加"
    },
```

- [ ] **Step 4: ポータルを開いてアップデート履歴に表示されることを確認する**

確認方法: `Construction Field Hub/index.html` を開き、アップデート履歴セクションに上記エントリが表示されることを目視確認する。

- [ ] **Step 5: コミット**

```bash
git add "機能説明書.md" "js/updates.js"
git commit -m "docs: 大規模現場工事指示書ツールの機能説明書・更新履歴を追加"
```

---

## Self-Review Notes

- **spec 3.1（自社管理番号含む現場概要項目）**: Task 4 Step1・Task 9 Step1 でカバー。
- **spec 3.2（地図embed＋印刷時QR/画像）**: Task 4 Step2、Task 8 でカバー。
- **spec 3.3（業者グループ＋工程行）**: Task 3、Task 5 でカバー。
- **spec 3.4（工程表・時刻単位・複数日カード・自動＋手動）**: Task 6 でカバー。
- **spec 3.5（共通＋業者別持参品）**: Task 7 でカバー。
- **spec 3.6（全体注意事項）**: Task 4 Step1 の `ovGeneralNotes` でカバー。
- **spec 4（データ保存）**: Task 3（localStorage）、Task 2（IndexedDB地図画像）でカバー。
- **spec 5（A4横2ページ印刷）**: Task 8 でカバー。
- **spec 6（既存ツールとの整合性）**: Task 1（ポータル登録）、Task 10（機能説明書・更新履歴）でカバー。著作権表記は各ファイル冒頭に記載済み（`copyright_insertion` スキル準拠）。
- **spec 7（レイアウト仕様）**: Task 4・Task 6 のHTML/CSSがプロトタイプのヘッダー・工程表グリッドの構成を再現。
- **spec 8（スコープ外）**: Directions API・自動通知・複数現場一括管理は本計画に含めていない（意図的に対象外）。

<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
