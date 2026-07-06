# Construction photos 工程管理機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construction photos に工程マスター管理・写真の工程/前中後（phase）割当・工程ごとにグルーピングした写真管理タブ表示・工程順にグルーピングしたPDF出力を追加する。

**Architecture:** 既存の vanilla JS グローバル関数構成（ビルドなし、`<script>` 直読み込み）を維持する。新規グローバル配列 `processes` を追加し、`photos[].processId` / `photos[].phase` で紐付ける。永続化は既存の `saveToStorage`/`loadFromStorage`（localStorage）を拡張する形で行う。IndexedDB（画像src保存）には変更を加えない。

**Tech Stack:** Vanilla JS (ES6+), HTML5 Drag and Drop API, CSS custom properties。テストランナー・ビルドツールなし。検証は `python3 -m http.server` + Playwright MCP でのブラウザ実操作による目視・DOM確認で行う（このプロジェクトに自動テストの仕組みはない）。

## Global Constraints

- ビルドステップなし。全ファイルはブラウザに直接読み込まれる素の HTML/CSS/JS のまま。
- 既存のデザイントークン（`css/style.css` の `:root` 内 `--paper`, `--surface`, `--surface2`, `--rule`, `--rule-soft`, `--ink`, `--ink2`, `--stamp`, `--stamp-soft`, `--ok`, `--ok-soft`）以外の新規カラー値をハードコードしない。
- インラインスタイル (`style="..."`) を新規追加しない。既存コミット `ce45277` の方針（no-inline-styles）を踏襲し、CSS クラスを使う。
- 既存データ（`processId`/`phase` を持たない過去の localStorage データ）を壊さない。ロード時にデフォルト値（`processId: null`, `phase: 'before'`）を補完する。
- 各タスック完了後、`python3 -m http.server <port> --directory "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub"` を起動し、Playwright MCP (`browser_navigate`, `browser_snapshot`, `browser_console_messages`) で実際に動作確認する。コンソールエラーが出ないことを確認する。
- 仕様書: `docs/superpowers/specs/2026-07-07-construction-photos-process-management-design.md`

---

## File Structure

| ファイル | 変更内容 |
|---|---|
| `Construction photos/index.html` | 表紙タブに工程一覧セクション追加、写真管理タブのグルーピングコンテナ追加 |
| `Construction photos/js/photo.js` | 写真オブジェクトに `processId`/`phase` 追加、`renderPhotoList` をグルーピング描画に変更、phase切替・D&D処理を追加 |
| `Construction photos/js/storage.js` | `processes`/`processOrder` の保存・復元、写真メタに `processId`/`phase` を含める |
| `Construction photos/js/renderer.js` | PDF用ソート関数追加、工程見出し行の描画追加 |
| `Construction photos/js/pdf_export.js` | 変更なし（`buildReportPage` の出力順序変更で対応済み） |
| `Construction photos/css/style.css` | 工程一覧セクション、グルーピング見出し、phaseタブ、ドロップ対象スタイルを追加 |

新規ファイルは作成しない（既存構成を維持）。

---

### Task 1: 工程マスターのデータモデルと永続化

**Files:**
- Modify: `Construction photos/js/storage.js`
- Modify: `Construction photos/index.html:155-157`（`<script>` 内のグローバル変数宣言部分）

**Interfaces:**
- Consumes: 既存の `STORAGE_KEY`（`js/common.js`）, 既存の `saveToStorage()`/`loadFromStorage()`
- Produces:
  - グローバル配列 `processes = [{id: number, name: string}]`
  - グローバル変数 `nextProcessId`（新規工程の id 採番用、初期値 `1`）
  - `function addProcess(name: string): void` — processes に追加し、保存・再描画
  - `function removeProcess(id: number): void` — processes から削除し、該当写真の `processId` を `null` に戻す
  - `function moveProcess(id: number, dir: number): void` — processes 内での並べ替え（`movePhoto` と同じロジック）
  - `saveToStorage()` は `{cover, photosMeta, photoOrder, processes, processOrder}` を保存する
  - `loadFromStorage()` は `processes`/`processOrder` を復元し、順序通りに `processes` を再構築する

- [ ] **Step 1: index.html にグローバル変数を追加**

`Construction photos/index.html` の156行目付近（`let photos = []; let nextId = 1;` の直後）に以下を追加する。

```js
    let photos = [];
    let nextId = 1;
    let processes = [];
    let nextProcessId = 1;
```

- [ ] **Step 2: js/storage.js の saveToStorage を拡張**

`Construction photos/js/storage.js` の `saveToStorage` 関数（21-42行目）を以下に置き換える。

```js
function saveToStorage() {
  const data = getCoverData();

  // メタ情報のみ localStorage に保存（src は含めない）
  const photosMeta = photos.map(p => ({
    id: p.id, date: p.date, title: p.title,
    desc: p.desc, exifDate: p.exifDate, name: p.name,
    processId: p.processId ?? null,
    phase: p.phase || 'before'
  }));

  // 並べ替え順番を id 配列として保存
  const photoOrder = photos.map(p => p.id);

  // 工程マスターの並び順を id 配列として保存
  const processOrder = processes.map(pr => pr.id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cover: data, photosMeta, photoOrder, processes, processOrder
  }));

  // 画像 src は未保存の写真のみ IndexedDB に書き込む
  photos.forEach(p => {
    if (p.src && !savedPhotoIds.has(p.id)) {
      savePhotoSrc(p.id, p.src);
      savedPhotoIds.add(p.id);
    }
  });
}
```

- [ ] **Step 3: js/storage.js の loadFromStorage を拡張**

`Construction photos/js/storage.js` の `loadFromStorage` 関数（49-112行目）を以下に置き換える。

```js
async function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    // 表紙情報の復元
    if (data.cover) {
      const c = data.cover;
      setVal('coverDate',          c.date);
      setVal('coverManageNo',      c.manageNo);
      setVal('coverOurManageNo',   c.ourManageNo);
      setVal('coverAffiliation',   c.affiliation);
      setVal('coverAuthor',        c.author);
      setVal('coverSiteName',      c.siteName);
      setVal('coverAddress',       c.address);
      setVal('coverWorkContent',   c.workContent);
      setVal('coverWorkStartDate', c.workStartDate);
      setVal('coverWorkEndDate',   c.workEndDate);
    }

    // 工程マスターの復元
    const rawProcesses = data.processes || [];
    const processOrder = data.processOrder || rawProcesses.map(p => p.id);
    const processById = new Map(rawProcesses.map(p => [p.id, p]));
    processes = processOrder
      .filter(id => processById.has(id))
      .map(id => processById.get(id));
    if (processes.length > 0) {
      nextProcessId = Math.max(...processes.map(p => p.id)) + 1;
    }

    // 写真メタ情報の復元
    if (data.photosMeta && data.photosMeta.length > 0) {
      // IndexedDB から全 src を取得
      const srcMap = await getAllPhotoSrcs();

      // photoOrder があれば順番通りに、なければ保存順で photos を構築
      const meta = data.photosMeta;
      const order = data.photoOrder || meta.map(m => m.id);

      // order に従って並べ替え
      const metaById = new Map(meta.map(m => [m.id, m]));
      photos = order
        .filter(id => metaById.has(id))
        .map(id => {
          const m = metaById.get(id);
          return {
            id:       m.id,
            src:      srcMap.get(m.id) || null,
            name:     m.name,
            date:     m.date,
            exifDate: m.exifDate,
            title:    m.title,
            desc:     m.desc,
            processId: m.processId ?? null,
            phase:     m.phase || 'before'
          };
        });

      // nextId を最大 id + 1 に設定して重複を防ぐ
      if (photos.length > 0) {
        nextId = Math.max(...photos.map(p => p.id)) + 1;
      }

      // IndexedDB から復元した写真は既に保存済みとして記録（再書き込み防止）
      photos.forEach(p => { if (p.src) savedPhotoIds.add(p.id); });

      renderPhotoList();
      document.getElementById('photoCount').textContent = photos.length;
    }

  } catch (e) {
    console.error('[storage] 読み込みエラー:', e);
  }
}
```

- [ ] **Step 4: 工程マスターの操作関数を追加**

`Construction photos/js/storage.js` の末尾（150行目、`getCoverData` 関数の後）に以下を追加する。

```js

/**
 * 工程を新規追加する。
 * @param {string} name
 */
function addProcess(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  processes.push({ id: nextProcessId++, name: trimmed });
  saveToStorage();
  renderProcessList();
  renderPhotoList();
}

/**
 * 工程を削除する。割り当てられていた写真は未分類（processId: null）に戻す。
 * @param {number} id
 */
function removeProcess(id) {
  processes = processes.filter(p => p.id !== id);
  photos.forEach(p => { if (p.processId === id) p.processId = null; });
  saveToStorage();
  renderProcessList();
  renderPhotoList();
}

/**
 * 工程の並び順を入れ替える。
 * @param {number} id
 * @param {number} dir -1 または 1
 */
function moveProcess(id, dir) {
  const idx = processes.findIndex(p => p.id === id);
  const newIdx = idx + dir;
  if (idx === -1 || newIdx < 0 || newIdx >= processes.length) return;
  [processes[idx], processes[newIdx]] = [processes[newIdx], processes[idx]];
  saveToStorage();
  renderProcessList();
}
```

- [ ] **Step 5: ブラウザで動作確認**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && python3 -m http.server 8123 > /tmp/http.log 2>&1 &
```

Playwright MCP で `http://localhost:8123/Construction%20photos/index.html` を開き、`browser_console_messages` で `favicon.ico` の404以外のエラーがないことを確認する（`renderProcessList` は Task 2 で定義するため、この時点ではまだ呼び出されていないコンソールエラーは出ないはず）。

- [ ] **Step 6: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/js/storage.js" "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
feat: add process master data model and persistence

工程マスター（processes配列）のCRUD関数と、localStorageへの永続化を追加。
写真メタ情報にprocessId/phaseを含めて保存・復元する（後方互換あり）。
EOF
)"
```

---

### Task 2: 表紙タブに工程一覧セクションを追加

**Files:**
- Modify: `Construction photos/index.html:70-97`（表紙タブ内、工事情報セクション）
- Modify: `Construction photos/css/style.css`（section-title 定義の近く、244行目付近に新規セクション追加）

**Interfaces:**
- Consumes: Task 1 の `processes`, `addProcess()`, `removeProcess()`, `moveProcess()`
- Produces: `function renderProcessList(): void` — `#processListInput`（新規工程名入力欄）と `#processList`（一覧表示コンテナ）を描画する。DOMContentLoaded 時と `addProcess`/`removeProcess`/`moveProcess` 呼び出し後に実行される。

- [ ] **Step 1: index.html に工程一覧セクションのマークアップを追加**

`Construction photos/index.html` の73行目（`<div class="form-group"><label>工事内容</label>...` の直後）と74行目（`<div class="form-group">` 工事日ブロックの開始）の間に以下を挿入する。

```html
          <div class="section-title">工程一覧</div>
          <div class="process-add-row">
            <input type="text" id="processNameInput" placeholder="例：基礎工事" aria-label="工程名">
            <button class="btn btn-outline" type="button" onclick="handleAddProcess()">
              <i data-lucide="plus"></i>追加
            </button>
          </div>
          <div class="process-list" id="processList"></div>
```

- [ ] **Step 2: index.html に handleAddProcess とレンダリング関数を追加**

`Construction photos/index.html` の `<script>` ブロック内、`openReorderPage` 関数（198-202行目）の直後に以下を追加する。

```js
    /** 工程追加ボタンのハンドラ。入力欄をクリアしてから追加する */
    function handleAddProcess() {
      const input = document.getElementById('processNameInput');
      addProcess(input.value);
      input.value = '';
    }

    /** 表紙タブの工程一覧を再描画する */
    function renderProcessList() {
      const list = document.getElementById('processList');
      list.innerHTML = '';
      processes.forEach((pr, idx) => {
        const row = document.createElement('div');
        row.className = 'process-row';
        row.innerHTML = `
          <span class="process-name">${escapeHtml(pr.name)}</span>
          <div class="process-row-actions">
            <button class="btn-icon" onclick="moveProcess(${pr.id}, -1)" title="上へ">
              <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button class="btn-icon" onclick="moveProcess(${pr.id}, 1)" title="下へ">
              <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <button class="btn-icon" onclick="removeProcess(${pr.id})" title="削除">
              <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;
        list.appendChild(row);
      });
    }
```

- [ ] **Step 3: DOMContentLoaded で renderProcessList を呼び出す**

`Construction photos/index.html` の `DOMContentLoaded` イベントリスナー（186-196行目）内、`await loadFromStorage();` の直後に1行追加する。

```js
      await initDB();
      await loadFromStorage();
      renderProcessList();
      initUpload();
```

- [ ] **Step 4: css/style.css に工程一覧のスタイルを追加**

`Construction photos/css/style.css` の `.cover-action-row` 定義（244-256行目）の直前に以下を追加する。

```css
    /* 工程一覧セクション */
    .process-add-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .process-add-row input {
      flex: 1;
      background: var(--surface);
      border: 1.5px solid var(--rule-soft);
      border-radius: 2px;
      padding: 8px 10px;
      color: var(--ink);
      font-size: 13px;
    }

    .process-add-row input:focus {
      outline: none;
      border-color: var(--stamp);
    }

    .process-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .process-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--surface2);
      border: 1.5px solid var(--rule-soft);
      border-radius: 2px;
      padding: 6px 10px;
    }

    .process-name {
      font-size: 13px;
      color: var(--ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .process-row-actions {
      display: flex;
      gap: 2px;
    }
```

- [ ] **Step 5: ブラウザで動作確認**

Playwright MCP で `http://localhost:8123/Construction%20photos/index.html` を開き、`processNameInput` に「基礎工事」と入力して追加ボタンをクリック（`browser_click`, `browser_type`）。`processList` に行が追加されることを `browser_snapshot` で確認する。ページをリロードして永続化されていることも確認する。コンソールエラーがないことを確認する。

- [ ] **Step 6: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/index.html" "Construction photos/css/style.css" && git commit -m "$(cat <<'EOF'
feat: add process list UI to cover tab

表紙タブに工程一覧セクションを追加。工程名の入力・追加・削除・並べ替えがUIから行えるようになる。
EOF
)"
```

---

### Task 3: 写真オブジェクトへの processId/phase 追加とグルーピング表示

**Files:**
- Modify: `Construction photos/js/photo.js:42-56`（`handleFiles` 内の photo オブジェクト生成）
- Modify: `Construction photos/js/photo.js:109-145`（`renderPhotoList` 関数全体を書き換え）
- Modify: `Construction photos/css/style.css`（`.photo-list`/`.photo-item` 定義の近く、309行目付近にグルーピング用スタイル追加）

**Interfaces:**
- Consumes: Task 1 の `processes`, Task 2 で確立した `escapeAttr`（`index.html`）
- Produces:
  - `photos[].processId: number | null`, `photos[].phase: 'before' | 'during' | 'after'`
  - `function setPhotoPhase(id: number, phase: string): void`
  - `function setPhotoProcess(id: number, processId: number | null): void`
  - `renderPhotoList()` は工程 × phase でグルーピングした DOM を構築する（既存の呼び出し元 `handleFiles`, `removePhoto`, `clearAllPhotos`, `loadFromStorage` は変更不要 — 関数シグネチャ・呼び出し方は変わらない）

- [ ] **Step 1: handleFiles で processId/phase の初期値を設定**

`Construction photos/js/photo.js` の43-49行目、`photo` オブジェクト生成部分を以下に置き換える。

```js
    const photo = {
      id: nextId++,
      src, name: file.name,
      date: fallbackDate,
      exifDate: exifDate,
      title: '',
      desc: '',
      processId: null,
      phase: 'before'
    };
```

- [ ] **Step 2: renderPhotoList をグルーピング描画に書き換え**

`Construction photos/js/photo.js` の `renderPhotoList` 関数（109-145行目）全体を以下に置き換える。写真カード自体の内部マークアップ（サムネ・上下移動・削除・撮影日・タイトル・説明）は既存のまま維持し、phase切替タブを追加する。

```js
const PHASE_LABELS = { before: '前', during: '中', after: '後' };
const PHASE_ORDER = ['before', 'during', 'after'];

function renderPhotoList() {
  const list = document.getElementById('photoList');
  list.innerHTML = '';

  // グルーピングキー: processId (null は '未分類'扱い) -> phase -> photos[]
  const groups = new Map(); // processId(or null) -> Map(phase -> photo[])
  photos.forEach(p => {
    const pid = p.processId ?? null;
    if (!groups.has(pid)) groups.set(pid, { before: [], during: [], after: [] });
    const phase = PHASE_ORDER.includes(p.phase) ? p.phase : 'before';
    groups.get(pid)[phase].push(p);
  });

  // 表示順: processes の並び順 → 末尾に未分類
  const orderedGroupKeys = [...processes.map(pr => pr.id), null];

  orderedGroupKeys.forEach(pid => {
    const group = groups.get(pid);
    if (!group) return; // この工程には写真が1枚もない

    const section = document.createElement('div');
    section.className = 'process-section';
    section.dataset.processId = pid === null ? '' : String(pid);

    const header = document.createElement('div');
    header.className = 'process-section-header';
    header.textContent = pid === null
      ? '未分類'
      : (processes.find(pr => pr.id === pid)?.name || '未分類');
    header.addEventListener('dragover', onProcessHeaderDragOver);
    header.addEventListener('dragleave', onProcessHeaderDragLeave);
    header.addEventListener('drop', e => onProcessHeaderDrop(e, pid));
    section.appendChild(header);

    PHASE_ORDER.forEach(phase => {
      const items = group[phase];
      if (!items.length) return;

      const phaseHeading = document.createElement('div');
      phaseHeading.className = 'phase-heading';
      phaseHeading.textContent = PHASE_LABELS[phase];
      section.appendChild(phaseHeading);

      items.forEach(p => section.appendChild(buildPhotoCard(p)));
    });

    list.appendChild(section);
  });
}

/** 1枚の写真カード DOM を構築する */
function buildPhotoCard(p) {
  const div = document.createElement('div');
  div.className = 'photo-item';
  div.draggable = true;
  div.dataset.photoId = String(p.id);
  div.addEventListener('dragstart', onPhotoCardDragStart);
  div.addEventListener('dragend', onPhotoCardDragEnd);

  const phaseTabsHTML = PHASE_ORDER.map(ph => `
    <button type="button"
      class="phase-tab-btn${(p.phase || 'before') === ph ? ' active' : ''}"
      onclick="setPhotoPhase(${p.id}, '${ph}')">${PHASE_LABELS[ph]}</button>
  `).join('');

  div.innerHTML = `
    <div class="photo-item-header">
      <img class="photo-thumb" src="${p.src}" alt="">
      <span class="photo-name" title="${p.name}">${p.name}</span>
      <div class="photo-actions">
        <button class="btn-icon up" onclick="movePhoto(${p.id}, -1)" title="上へ">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button class="btn-icon down" onclick="movePhoto(${p.id}, 1)" title="下へ">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button class="btn-icon" onclick="removePhoto(${p.id})" title="削除">
          <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    <div class="phase-tabs">${phaseTabsHTML}</div>
    <div class="photo-item-fields">
      <label>撮影日</label>
      <div class="photo-date-row">
        <input type="date" value="${p.date || ''}" onchange="updatePhotoField(${p.id}, 'date', this.value)" style="flex:1">
        ${p.exifDate ? '<span class="exif-badge"><svg class="icon-svg" style="width:1em;height:1em;margin-right:2px;" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>EXIF自動取得</span>' : ''}
      </div>
      <label>タイトル</label>
      <input type="text" value="${escapeAttr(p.title)}" placeholder="作業前①" oninput="updatePhotoField(${p.id}, 'title', this.value)">
      <label>説明</label>
      <textarea rows="2" placeholder="外観" oninput="updatePhotoField(${p.id}, 'desc', this.value)">${escapeHtml(p.desc)}</textarea>
    </div>
  `;
  return div;
}

/** 写真の phase（前/中/後）を切り替える */
function setPhotoPhase(id, phase) {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  p.phase = phase;
  saveToStorage();
  renderPhotoList();
  updatePreview();
}

/** 写真の所属工程を切り替える（D&D からも呼ばれる） */
function setPhotoProcess(id, processId) {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  p.processId = processId;
  saveToStorage();
  renderPhotoList();
  updatePreview();
}

// ======================== 工程セクションへの D&D ========================

let dragPhotoId = null;

function onPhotoCardDragStart(e) {
  dragPhotoId = parseInt(this.dataset.photoId);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragPhotoId));
}

function onPhotoCardDragEnd() {
  this.classList.remove('dragging');
  dragPhotoId = null;
}

function onProcessHeaderDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function onProcessHeaderDragLeave() {
  this.classList.remove('drag-over');
}

function onProcessHeaderDrop(e, processId) {
  e.preventDefault();
  this.classList.remove('drag-over');
  if (dragPhotoId === null) return;
  setPhotoProcess(dragPhotoId, processId);
}
```

- [ ] **Step 3: css/style.css にグルーピング・phaseタブ・ドロップ対象のスタイルを追加**

`Construction photos/css/style.css` の `.photo-list` 定義（310-314行目）の直前に以下を追加する。

```css
    /* 工程グルーピング セクション */
    .process-section {
      margin-bottom: 20px;
    }

    .process-section-header {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink);
      background: var(--surface2);
      border: 1.5px dashed var(--rule-soft);
      border-radius: 3px;
      padding: 8px 10px;
      margin-bottom: 8px;
      transition: background 0.15s, border-color 0.15s;
    }

    .process-section-header.drag-over {
      background: var(--stamp-soft);
      border-color: var(--stamp);
    }

    .phase-heading {
      font-size: 11px;
      font-weight: 700;
      color: var(--ink2);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 8px 0 6px 4px;
    }

    .phase-tabs {
      display: flex;
      gap: 4px;
    }

    .phase-tab-btn {
      flex: 1;
      background: var(--surface);
      border: 1.5px solid var(--rule-soft);
      border-radius: 2px;
      padding: 4px 0;
      font-size: 11px;
      color: var(--ink2);
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }

    .phase-tab-btn.active {
      background: var(--stamp);
      border-color: var(--stamp);
      color: #fff;
    }

    .photo-item.dragging {
      opacity: 0.4;
    }
```

- [ ] **Step 4: ブラウザで動作確認**

Playwright MCP で以下を確認する:
1. `http://localhost:8123/Construction%20photos/index.html` を開く
2. scratchpad に最小限のテスト用JPEGを生成し、アップロードして写真が「未分類」セクションに表示されることを確認
3. 表紙タブで工程を1つ追加し、写真管理タブに戻って phase タブ（前/中/後）をクリックし、active クラスが切り替わることを `browser_snapshot` で確認
4. 写真カードを工程セクション見出しへドラッグ&ドロップし、その工程のセクションに写真が移動することを確認
5. `browser_console_messages` でエラーがないことを確認

- [ ] **Step 5: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/js/photo.js" "Construction photos/css/style.css" && git commit -m "$(cat <<'EOF'
feat: group photo list by process and phase with drag-and-drop assignment

写真管理タブを工程×前中後でグルーピング表示に変更。写真カードのphase切替タブと、
工程見出しへのドラッグ&ドロップによる工程割当てを追加。
EOF
)"
```

---

### Task 4: PDF出力を工程順にグルーピング

**Files:**
- Modify: `Construction photos/js/renderer.js:1-23`（`updatePreview` 関数）
- Modify: `Construction photos/js/renderer.js:50-68`（`buildReportPage` のヘッダー部分）

**Interfaces:**
- Consumes: Task 1〜3 の `processes`, `photos[].processId`, `photos[].phase`
- Produces: `function getSortedPhotosForExport(): Array` — 工程順 → phase順（before→during→after）→ 元の相対順序でソートした photos のコピーを返す。`updatePreview()` はこれを使ってページ分割する。`buildReportPage` は現在の工程名を引数で受け取り、見出しに表示する。

- [ ] **Step 1: ソート関数を追加**

`Construction photos/js/renderer.js` の先頭（1行目、著作権コメントの直後）に以下を追加する。

```js

/**
 * PDF/プレビュー出力用に、工程順 → phase順（前中後）→ 元の相対順序でソートした
 * photos のコピーを返す。photos 本体（写真管理タブでの表示順）は変更しない。
 */
function getSortedPhotosForExport() {
  const phaseRank = { before: 0, during: 1, after: 2 };
  const processRank = new Map(processes.map((pr, idx) => [pr.id, idx]));
  const UNASSIGNED_RANK = processes.length; // 未分類は最後

  return photos
    .map((p, idx) => ({ p, idx })) // 元の相対順序を保持するためのタイブレーカー
    .sort((a, b) => {
      const pidA = a.p.processId ?? null;
      const pidB = b.p.processId ?? null;
      const rankA = pidA === null ? UNASSIGNED_RANK : (processRank.get(pidA) ?? UNASSIGNED_RANK);
      const rankB = pidB === null ? UNASSIGNED_RANK : (processRank.get(pidB) ?? UNASSIGNED_RANK);
      if (rankA !== rankB) return rankA - rankB;

      const phaseA = phaseRank[a.p.phase] ?? 0;
      const phaseB = phaseRank[b.p.phase] ?? 0;
      if (phaseA !== phaseB) return phaseA - phaseB;

      return a.idx - b.idx;
    })
    .map(entry => entry.p);
}

/** 写真1枚が属する工程名を返す（未分類は 'その他'） */
function getProcessNameForPhoto(p) {
  if (p.processId === null || p.processId === undefined) return 'その他';
  const pr = processes.find(pr => pr.id === p.processId);
  return pr ? pr.name : 'その他';
}
```

- [ ] **Step 2: updatePreview でソート済み配列を使うよう変更**

`Construction photos/js/renderer.js` の `updatePreview` 関数（元2-23行目、Step 1 でファイル先頭に追記した分だけ行番号がずれる点に注意し、`function updatePreview()` 本体を対象に置換）を以下に置き換える。

```js
function updatePreview() {
  saveToStorage();
  const area = document.getElementById('previewArea');
  const empty = document.getElementById('previewEmpty');
  const cover = getCoverData();

  area.querySelectorAll('.report-page').forEach(el => el.remove());

  const hasContent = cover.siteName || cover.workContent || photos.length > 0;
  empty.style.display = hasContent ? 'none' : 'flex';
  if (!hasContent) return;

  const coverPage = buildCoverPage(cover);
  area.appendChild(coverPage);

  const sortedPhotos = getSortedPhotosForExport();
  const totalPages = Math.max(Math.ceil(sortedPhotos.length / 3), 1);
  let lastProcessName = null;
  for (let page = 0; page < totalPages; page++) {
    const pagePhotos = sortedPhotos.slice(page * 3, page * 3 + 3);
    const pageProcessName = pagePhotos.length ? getProcessNameForPhoto(pagePhotos[0]) : null;
    const showProcessName = pageProcessName !== null && pageProcessName !== lastProcessName;
    lastProcessName = pageProcessName !== null ? pageProcessName : lastProcessName;
    const reportPage = buildReportPage(cover, pagePhotos, page + 1, totalPages + 1, showProcessName ? pageProcessName : '');
    area.appendChild(reportPage);
  }
}
```

- [ ] **Step 3: buildReportPage に工程名見出しを追加**

`Construction photos/js/renderer.js` の `buildReportPage` 関数シグネチャと `headerHTML` 部分（元50-68行目）を以下に置き換える。

```js
function buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName) {
  const page = document.createElement('div');
  page.className = 'report-page';
  page.setAttribute('data-page', pageNum);

  // 写真ページのヘッダーは工事名（現場名）のみ。詳細は表紙ページに集約し、
  // 重複していた工事内容行と、空欄だった承認欄（□）は削除した。
  const siteName = escapeHtml(cover.siteName || '');
  const processRow = processName
    ? `<tr><td>工　程</td><td>${escapeHtml(processName)}</td></tr>`
    : '';

  const headerHTML = `
    <div class="report-main-title">工事写真報告書</div>
    <div class="report-header">
      <div class="header-left">
        <table class="header-info-table">
          <tr><td>工　事　名</td><td class="pre-line">${siteName}</td></tr>
          ${processRow}
        </table>
      </div>
    </div>
  `;
```

- [ ] **Step 4: ブラウザで動作確認**

Playwright MCP で以下を確認する:
1. Task 3 で作成した工程・写真の割当て状態のまま `updatePreview()` が呼ばれるアクション（プレビュー更新ボタン）をクリック
2. `previewArea` 内の `.report-page[data-page]` 要素が工程順・phase順に並んでいることを `browser_snapshot` で確認
3. 各工程の最初のページに「工　程」行が表示され、2ページ目以降（同じ工程が続く場合）は表示されないことを確認
4. `browser_console_messages` でエラーがないことを確認

- [ ] **Step 5: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/js/renderer.js" && git commit -m "$(cat <<'EOF'
feat: group PDF report pages by process order

プレビュー/PDF出力の写真を工程順→前中後の順にソートし、
工程が切り替わるページに工程名見出しを表示するようにした。
EOF
)"
```

---

### Task 5: 統合確認とドキュメント更新

**Files:**
- Modify: `Construction photos/index.html:18-27`（更新コメント）

**Interfaces:**
- Consumes: Task 1〜4 の全機能
- Produces: なし（検証と記録のみ）

- [ ] **Step 1: index.html の更新コメントに今回の変更を追記**

`Construction photos/index.html` の18-27行目のコメントブロックの後に、以下のコメントを追加する。

```html
  <!--
    === 更新内容 (2026-07-07) ===
    - 工程管理機能: 工程マスター（表紙タブ）、写真への工程/前中後割当て
    - 写真管理タブ: 工程×前中後でグルーピング表示、ドラッグ&ドロップで工程割当て
    - PDF出力: 工程順→前中後順にソートし、工程名見出しを表示
  -->
```

- [ ] **Step 2: フルフロー動作確認**

Playwright MCP で以下のシナリオを通しで確認する:
1. `http://localhost:8123/Construction%20photos/index.html` を開く
2. 表紙タブで工程を2つ追加（例：「基礎工事」「配管工事」）
3. 写真管理タブでテスト用画像を3枚アップロード
4. 1枚目を「基礎工事」にドラッグ&ドロップ、phase を「前」に設定
5. 2枚目を「基礎工事」にドラッグ&ドロップ、phase を「後」に設定
6. 3枚目を「配管工事」にドラッグ&ドロップ、phase を「中」に設定
7. プレビュー更新ボタンをクリックし、プレビューエリアに工程順（基礎工事→配管工事）・phase順（前→後）で表示されることを確認
8. ページをリロードし、工程割当て・phase設定が永続化されていることを確認
9. `browser_console_messages` で全体を通してエラーがないことを確認

- [ ] **Step 3: サーバー停止**

```bash
pkill -f "http.server 8123" 2>/dev/null; echo done
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
docs: note process management feature in index.html update log
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** 工程マスター管理(Task 1-2)、前中後状態管理(Task 3)、D&D割当て(Task 3)、写真管理タブのグルーピング表示(Task 3)、PDF出力の工程グルーピング(Task 4)を全てカバー。reorder.html は仕様書で明示的にスコープ外としたため対象外。
- **Placeholder scan:** 全ステップに具体的なコード・コマンドを記載済み。TBD/TODOなし。
- **Type consistency:** `processId: number | null`, `phase: 'before'|'during'|'after'` の型はTask 1〜4を通して統一。関数名 `setPhotoPhase`/`setPhotoProcess`/`addProcess`/`removeProcess`/`moveProcess`/`getSortedPhotosForExport`/`getProcessNameForPhoto` はTask間で一貫して同名を使用。
