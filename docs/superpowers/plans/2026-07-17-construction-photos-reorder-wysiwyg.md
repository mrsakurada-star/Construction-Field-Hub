# Construction photos reorder.html を印刷WYSIWYG化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 並べ替え専用ページ reorder.html を、実際の印刷レイアウト（工程→前中後）そのままにグループ表示し、そこでの並べ替えが見たまま印刷に反映される WYSIWYG にする。

**Architecture:** 印刷ソートと並べ替え画面のソートを共通純関数 `sortPhotosForExport(photos, processes)`（`js/common.js`）に集約し、renderer.js と reorder.js が同一関数を使う。reorder.js は写真管理タブ（photo.js の grouped card drag、実績あり）を「大サムネイル・印刷順ミラー」として移植する。

**Tech Stack:** Vanilla JS (ES6+), CSS custom properties。ビルド/テストランナーなし。検証は `python -m http.server` + `mcp__plugin_superpowers-chrome_chrome__use_browser`。

## Global Constraints

- ビルドステップなし。素の HTML/CSS/JS。外部ライブラリ追加なし（SortableJS等使わない）。HTML5 native drag のまま（タッチ対応は今回しない）。
- `PHASE_LABELS` を `common.js` に移さないこと（`photo.js:193` と `reorder.js` で `const` 二重宣言済み。index.html は両方読むため移すと SyntaxError）。
- `js/photo.js` の写真管理タブ側の挙動、`js/storage.js` の `saveToStorage` スキーマ（`photoOrder`/`photosMeta`/`processes`/`processOrder`）は変えない。localStorage スキーマ互換を保つ（既存保存データが壊れないこと）。
- `renderer.js` の共通関数委譲は**出力が現行と完全に同一**であること（PDF/プレビューに回帰なし）。
- `css/reorder.css` は既存 `:root` トークン（`--border`/`--text`/`--text2`/`--accent`/`--accent2`/`--danger`/`--drop-over`/`--surface2`）のみ使用。新規ハードコード色を追加しない。
- 各タスク完了後、`python -m http.server <port>`（`/tmp` にログ redirect、Windowsバックスラッシュパスをbashの`>`に渡さない）+ `mcp__plugin_superpowers-chrome_chrome__use_browser` で実機確認。コンソールエラーが無いこと。レポートの検証エビデンスは実際に実行したコマンド/eval の**リテラル出力**のみ（捏造禁止）。
- 設計spec: 承認済みプラン（`~/.claude/plans/golden-wondering-shamir.md` 相当）。参照実装: `js/photo.js` の `onPhotoCardDrop`(367-391) / `isDragOverTopHalf`(343-347) / `onPhotoCardDragStart/End/Over/Leave`(328-365)。

---

## File Structure

| ファイル | 変更内容 |
|---|---|
| `Construction photos/js/common.js` | `sortPhotosForExport` / `getProcessNameForPhoto` を追加 |
| `Construction photos/js/renderer.js` | `getSortedPhotosForExport` を委譲に、ローカル `getProcessNameForPhoto` を削除し呼び出しを2引数化 |
| `Construction photos/js/reorder.js` | グループ表示・id ベースドロップ・保存拡張・離脱警告に書き換え |
| `Construction photos/reorder.html` | `#thumbGrid`→`#reorderRoot`、ヒント文言更新 |
| `Construction photos/css/reorder.css` | 工程/phase 見出し・ドロップインジケータのスタイル追加 |

---

### Task 1: 共通ソート関数の抽出（renderer 回帰ゼロ）

**Files:**
- Modify: `Construction photos/js/common.js`（末尾に追加）
- Modify: `Construction photos/js/renderer.js:7-35`, `:47`

**Interfaces:**
- Produces: `sortPhotosForExport(photos, processes)` — ソート済み新配列（非破壊）。`getProcessNameForPhoto(p, processes)` — 工程名（未分類/不明→'その他'）。
- Consumes: なし（純関数）。

- [ ] **Step 1: common.js に2関数を追加**

`Construction photos/js/common.js` の末尾（`formatDate` 定義の後）に以下を追加する。

```js
/**
 * PDF/プレビュー出力用に「工程順 → phase順（前中後）→ 元の相対順」でソートした
 * photos のコピーを返す純関数（非破壊）。renderer.js（印刷）と reorder.js（並べ替え画面）で
 * 同一の並び順を保証するために共通化している。
 * @param {Array} photos
 * @param {Array} processes  工程マスター（配列の並び順が processRank になる）
 * @returns {Array} ソート済みの新配列
 */
function sortPhotosForExport(photos, processes) {
  if (!Array.isArray(photos)) return [];
  processes = processes || [];
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

/** 写真1枚が属する工程名を返す（未分類/不明 processId は 'その他'）。renderer と reorder で共用。 */
function getProcessNameForPhoto(p, processes) {
  if (p.processId === null || p.processId === undefined) return 'その他';
  const pr = (processes || []).find(pr => pr.id === p.processId);
  return pr ? pr.name : 'その他';
}
```

- [ ] **Step 2: renderer.js を共通関数へ委譲**

`Construction photos/js/renderer.js` の 7-35 行（`getSortedPhotosForExport` と ローカル `getProcessNameForPhoto`）を以下に置き換える。

```js
function getSortedPhotosForExport() {
  return sortPhotosForExport(photos, processes);
}
```

（ローカルの `getProcessNameForPhoto(p)`（旧 30-35 行）は削除する。common.js の2引数版に一本化する。）

続いて `buildPhotoPages` 内の呼び出し（旧 47 行 `const name = getProcessNameForPhoto(p);`）を以下に変更する。

```js
    const name = getProcessNameForPhoto(p, processes);
```

- [ ] **Step 3: 他に getProcessNameForPhoto の呼び出しが無いか確認**

`Construction photos/` 配下を grep し、`getProcessNameForPhoto(` の呼び出しが `renderer.js`（buildPhotoPages, 上記で修正済み）以外に無いことを確認する。あれば全て2引数（`, processes`）に修正する。

- [ ] **Step 4: ブラウザで回帰ゼロを確認**

```bash
python -m http.server 8181 > /tmp/http181.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で:
1. `navigate` で `http://localhost:8181/Construction%20photos/index.html`
2. `eval` で工程2つ・未分類含む写真7枚を注入（下記スニペット）し、`getSortedPhotosForExport()` と `buildPhotoPages(...)` が例外なく動き、ページ構成が期待通りか確認:

```js
processes.push({ id: nextProcessId++, name: '基礎工事' }, { id: nextProcessId++, name: '配管工事' });
const p1 = processes[0].id, p2 = processes[1].id;
const mk = (name, processId, phase) => ({ id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', name, date: '2026-07-01', exifDate: null, title: '', desc: '', processId, phase });
photos.push(mk('a',p1,'before'),mk('b',p1,'before'),mk('c',p1,'during'),mk('d',p1,'during'),mk('e',p2,'before'),mk('f',p2,'after'),mk('g',null,'before'));
buildPhotoPages(getSortedPhotosForExport()).map(pg => ({ name: pg.processName, count: pg.photos.length }));
```

期待値: `[{"name":"基礎工事","count":3},{"name":"","count":1},{"name":"配管工事","count":2},{"name":"その他","count":1}]`

3. `eval` で `updatePreview()` を呼び、`.report-page`（cover/supplement除く）の各「工　程」欄が `["基礎工事","","配管工事","その他"]` になることを確認（この Construction photos は 2026-07-15 に工程改ページを実装済みで、この出力が現行仕様）。
4. `get_console_messages` でエラーなし。

- [ ] **Step 5: Commit**

```bash
git add "Construction photos/js/common.js" "Construction photos/js/renderer.js" && git commit -m "$(cat <<'EOF'
refactor: extract shared photo export sort into common.js

sortPhotosForExport() / getProcessNameForPhoto() are now pure functions in
common.js so renderer.js (print) and reorder.js (reorder screen) can share
the exact same ordering. Behavior of the PDF/preview output is unchanged.
EOF
)"
```

---

### Task 2: reorder.html グループ表示（印刷順ミラー・読み取り専用）

**Files:**
- Modify: `Construction photos/reorder.html:23`, `:52`
- Modify: `Construction photos/js/reorder.js`（`initReorder` 正規化・`renderGrid` グループ化・`createCard` 簡素化・`showEmpty`）
- Modify: `Construction photos/css/reorder.css`（見出しスタイル追加）

**Interfaces:**
- Consumes: Task 1 の `sortPhotosForExport` / `getProcessNameForPhoto`、既存 `PHASE_LABELS`。
- Produces: `#reorderRoot` 配下に「工程セクション→phase小見出し→`.thumb-grid`（カード）」のDOM。カードの順番バッジ = report 全体の通し番号。この Task ではドロップは既存挙動のままでも可（Task 3 で置換）。

- [ ] **Step 1: reorder.html の DOM とヒント文言を変更**

`Construction photos/reorder.html` の 23 行を:
```html
    <span class="header-hint">表示順＝印刷（PDF）順です。別の工程・状態へドラッグするとそのグループへ移動します</span>
```
52 行を:
```html
    <div id="reorderRoot"></div>
```

- [ ] **Step 2: reorder.js のグローバルと正規化を追加**

`Construction photos/js/reorder.js` の 13-32 行（`photoItems` 宣言〜`getProcessBadgeLabel`〜ドラッグ状態）を以下に置き換える。`getProcessBadgeLabel` は工程がセクション見出しに移るため削除する。

```js
// 現在の並び順で管理する配列（renderGrid 冒頭で常に印刷順へ正規化される）
let photoItems = []; // { id, src, title, name, date, desc, processId, phase }

// 並べ替え対象の写真が属する工程一覧（localStorage から復元、id/name のみ）
let reorderProcesses = [];

const PHASE_LABELS = { before: '前', during: '中', after: '後' };
const PHASE_ORDER = ['before', 'during', 'after'];

// ドラッグ状態（写真 id ベース。再ソートで index が変わるため id で追跡）
let dragPhotoId = null;

// 未保存フラグ（beforeunload 警告用）
let dirty = false;
```

- [ ] **Step 3: initReorder の item 構築を自己修復正規化に**

`Construction photos/js/reorder.js` の `initReorder` 内、`photoItems = order.filter(...).map(...)` ブロック（旧 66-81 行）を以下に置き換える。

```js
  const validProcessIds = new Set(reorderProcesses.map(p => p.id));
  const metaById = new Map(meta.map(m => [m.id, m]));
  photoItems = order
    .filter(id => metaById.has(id))
    .map(id => {
      const m = metaById.get(id);
      // 自己修復: 不明 processId は null、不正 phase は before に正規化
      let processId = m.processId ?? null;
      if (processId !== null && !validProcessIds.has(processId)) processId = null;
      let phase = m.phase || 'before';
      if (!PHASE_ORDER.includes(phase)) phase = 'before';
      return {
        id: m.id,
        src: srcMap.get(m.id) || null,
        title: m.title || '',
        name: m.name || '',
        date: m.date || '',
        desc: m.desc || '',
        processId,
        phase
      };
    });
```

- [ ] **Step 4: renderGrid をグループ描画に**

`Construction photos/js/reorder.js` の `renderGrid`（旧 90-98 行）を以下に置き換える。

```js
/** 印刷順に正規化してから、工程セクション→phase小見出し→カードグリッドで再描画する */
function renderGrid() {
  // photoItems 自身を常に印刷順（= 表示順）に正規化（不変条件の要）
  photoItems = sortPhotosForExport(photoItems, reorderProcesses);

  const root = document.getElementById('reorderRoot');
  root.innerHTML = '';

  if (!photoItems.length) { showEmpty(); return; }

  let displayNumber = 0;
  let currentProcessName = null;
  let currentPhase = null;
  let currentSection = null;
  let currentGrid = null;

  photoItems.forEach(item => {
    const procName = getProcessNameForPhoto(item, reorderProcesses);

    // 工程が変わったら新セクション + 見出し（見出しもドロップ対象）
    if (currentSection === null || procName !== currentProcessName) {
      currentSection = document.createElement('div');
      currentSection.className = 'process-section';
      const header = document.createElement('div');
      header.className = 'process-section-header';
      header.textContent = procName;
      header.addEventListener('dragover', onGroupDragOver);
      header.addEventListener('dragleave', onGroupDragLeave);
      header.addEventListener('drop', e => onGroupDrop(e, item.processId, 'before'));
      currentSection.appendChild(header);
      root.appendChild(currentSection);
      currentProcessName = procName;
      currentPhase = null;
    }

    // phase が変わったら小見出し + 新グリッド（グリッド余白もドロップ対象）
    if (item.phase !== currentPhase) {
      const phaseHeading = document.createElement('div');
      phaseHeading.className = 'phase-heading';
      phaseHeading.textContent = PHASE_LABELS[item.phase] || '前';
      currentSection.appendChild(phaseHeading);
      currentGrid = document.createElement('div');
      currentGrid.className = 'thumb-grid';
      currentGrid.addEventListener('dragover', onGroupDragOver);
      currentGrid.addEventListener('dragleave', onGroupDragLeave);
      currentGrid.addEventListener('drop', e => onGroupDrop(e, item.processId, item.phase));
      currentSection.appendChild(currentGrid);
      currentPhase = item.phase;
    }

    currentGrid.appendChild(createCard(item, displayNumber));
    displayNumber++;
  });
}
```

- [ ] **Step 5: createCard を簡素化（通し番号バッジ・工程バッジ削除・id ベース）**

`Construction photos/js/reorder.js` の `createCard`（旧 101-168 行）を以下に置き換える。

```js
/** サムネイルカードを生成して返す。displayNumber は report 全体の通し番号(0始まり) */
function createCard(item, displayNumber) {
  const card = document.createElement('div');
  card.className   = 'thumb-card';
  card.draggable   = true;
  card.dataset.photoId = String(item.id);

  // 通し番号バッジ（印刷順での位置 = 報告書の何枚目か）
  const badge = document.createElement('div');
  badge.className   = 'order-badge';
  badge.textContent = displayNumber + 1;

  // サムネイル画像エリア
  const imgWrap = document.createElement('div');
  imgWrap.className = 'thumb-img-wrap';
  if (item.src) {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title || item.name;
    img.draggable = false; // 画像ではなくカードをドラッグ
    imgWrap.appendChild(img);
  } else {
    const noImg = document.createElement('span');
    noImg.className   = 'no-img';
    noImg.textContent = '画像なし';
    imgWrap.appendChild(noImg);
  }

  // 情報エリア
  const info = document.createElement('div');
  info.className = 'thumb-info';
  const titleEl = document.createElement('div');
  titleEl.className   = 'thumb-title';
  titleEl.textContent = item.title || item.name || '（タイトルなし）';
  const metaEl = document.createElement('div');
  metaEl.className   = 'thumb-meta';
  metaEl.textContent = item.date ? formatDate(item.date) : '';
  info.appendChild(titleEl);
  info.appendChild(metaEl);
  if (item.desc) {
    const descEl = document.createElement('div');
    descEl.className   = 'thumb-desc';
    descEl.textContent = item.desc;
    info.appendChild(descEl);
  }

  card.appendChild(badge);
  card.appendChild(imgWrap);
  card.appendChild(info);

  card.addEventListener('dragstart', onCardDragStart);
  card.addEventListener('dragend',   onCardDragEnd);
  card.addEventListener('dragover',  onCardDragOver);
  card.addEventListener('dragleave', onCardDragLeave);
  card.addEventListener('drop',      onCardDrop);
  return card;
}
```

- [ ] **Step 6: showEmpty の参照先を #reorderRoot に**

`Construction photos/js/reorder.js` の `showEmpty`（旧 242-246 行）内、`document.getElementById('thumbGrid')` を `document.getElementById('reorderRoot')` に変更する。

- [ ] **Step 7: css/reorder.css に見出しスタイルを追加**

`Construction photos/css/reorder.css` の `.thumb-grid` ルール（149-153 行付近）の直前に以下を追加する。

```css
/* ===================== 工程/phase グループ見出し ===================== */
.process-section {
  margin-bottom: 24px;
}
.process-section-header {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  border-bottom: 2px solid var(--accent);
  padding: 6px 4px;
  margin-bottom: 10px;
}
.process-section-header.drag-over {
  background: var(--drop-over);
}
.phase-heading {
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  margin: 10px 0 6px 2px;
}
.thumb-grid.drag-over {
  outline: 2px dashed var(--accent2);
  outline-offset: 4px;
}
```

続いて `.thumb-card.dragging`（178-181 行付近）の直後に、上半分/下半分インジケータを追加する。

```css
.thumb-card.drag-over-top {
  box-shadow: inset 0 3px 0 var(--danger);
}
.thumb-card.drag-over-bottom {
  box-shadow: inset 0 -3px 0 var(--danger);
}
```

- [ ] **Step 8: ドラッグハンドラのスタブを追加（この Task では描画確認のため最小実装）**

この Task ではグループ描画の確認が主目的だが、`createCard`/`renderGrid` が参照する drag ハンドラが未定義だと ReferenceError になる。Task 3 で本実装に差し替える前提で、`Construction photos/js/reorder.js` の旧 Drag & Drop セクション（旧 170-213 行 `onDragStart`〜`onDragEnd`）を、まず以下の**最小スタブ**に置き換える（Task 3 で完全版へ）。

```js
// ======================== Drag & Drop（Task 3 で本実装） ========================
function onCardDragStart(e) {
  dragPhotoId = parseInt(this.dataset.photoId);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragPhotoId));
}
function onCardDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.thumb-card.drag-over-top, .thumb-card.drag-over-bottom, .drag-over')
    .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over'));
  dragPhotoId = null;
}
function onCardDragOver(e) { e.preventDefault(); }
function onCardDragLeave() {}
function onCardDrop(e) { e.preventDefault(); }
function onGroupDragOver(e) { e.preventDefault(); }
function onGroupDragLeave() {}
function onGroupDrop(e) { e.preventDefault(); }
```

- [ ] **Step 9: ブラウザで「表示順＝印刷順」を確認**

```bash
python -m http.server 8182 > /tmp/http182.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で:
1. `navigate` で index.html を開き、Task 1 Step 4 と同じ7枚+2工程を注入し `saveToStorage()` を呼ぶ。
2. `eval` で index 側の印刷順（id列）を取得: `sortPhotosForExport(photos, processes).map(p => p.name)` → 記録（例 `["a","b","c","d","e","f","g"]` 相当。実際の id/name 列を記録）。
3. `navigate` で `http://localhost:8182/Construction%20photos/reorder.html`
4. `eval` で reorder 側のカード表示順（通し番号順）を取得し、2 と完全一致することを確認:

```js
Array.from(document.querySelectorAll('#reorderRoot .thumb-card')).map(c => {
  const t = c.querySelector('.thumb-title'); return t ? t.textContent : '';
});
```
（index 側 `sortPhotosForExport` の name 列と一致すること。通し番号バッジが 1..N で連番であることも確認: `Array.from(document.querySelectorAll('.order-badge')).map(b=>b.textContent)`）

5. 工程セクション見出しが `基礎工事`/`配管工事`/`その他` の順、phase 小見出しが各工程内で 前→中→後 の順で出ていることを確認。
6. `get_console_messages` でエラーなし。

- [ ] **Step 10: Commit**

```bash
git add "Construction photos/reorder.html" "Construction photos/js/reorder.js" "Construction photos/css/reorder.css" && git commit -m "$(cat <<'EOF'
feat: group reorder.html by process/phase in exact print order

reorder.html now mirrors the PDF layout: photos are grouped under process
and 前中後 headings and numbered in the report's actual print sequence, so
the displayed order equals the printed order. Drag handlers are stubs here;
the drop semantics land in the next commit.
EOF
)"
```

---

### Task 3: ドロップの意味付け（同一グループ並べ替え＋別グループ移動）

**Files:**
- Modify: `Construction photos/js/reorder.js`（Task 2 Step 8 のスタブを本実装に置換）

**Interfaces:**
- Consumes: Task 2 の `photoItems`/`renderGrid`/`dragPhotoId`/`dirty`。
- Produces: `onCardDrop`（同一/別グループへ挿入）、`onGroupDrop`（空グループ/見出しへ末尾追加）、`isDragOverTopHalf`。photo.js `onPhotoCardDrop` と同型。

- [ ] **Step 1: Drag & Drop セクションを本実装に置換**

`Construction photos/js/reorder.js` の Task 2 Step 8 で入れた「Drag & Drop（Task 3 で本実装）」ブロック全体を以下に置き換える。

```js
// ======================== Drag & Drop ========================

function onCardDragStart(e) {
  dragPhotoId = parseInt(this.dataset.photoId);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragPhotoId));
}

function onCardDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.thumb-card.drag-over-top, .thumb-card.drag-over-bottom, .drag-over')
    .forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over'));
  dragPhotoId = null;
}

/** カード矩形の上半分にカーソルがあるか（挿入位置の判定）。photo.js と同一。 */
function isDragOverTopHalf(e, el) {
  const rect = el.getBoundingClientRect();
  return (e.clientY - rect.top) < rect.height / 2;
}

function onCardDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (dragPhotoId === null || parseInt(this.dataset.photoId) === dragPhotoId) return;
  document.querySelectorAll('.thumb-card.drag-over-top, .thumb-card.drag-over-bottom').forEach(el => {
    if (el !== this) el.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  const topHalf = isDragOverTopHalf(e, this);
  this.classList.toggle('drag-over-top', topHalf);
  this.classList.toggle('drag-over-bottom', !topHalf);
}

function onCardDragLeave() {
  this.classList.remove('drag-over-top', 'drag-over-bottom');
}

/** カードへのドロップ: 対象の工程/phase に合わせ、対象の前/後へ挿入する */
function onCardDrop(e) {
  e.preventDefault();
  e.stopPropagation(); // 親グリッド(onGroupDrop)への二重発火を防ぐ
  this.classList.remove('drag-over-top', 'drag-over-bottom');

  const targetId = parseInt(this.dataset.photoId);
  if (dragPhotoId === null || dragPhotoId === targetId) return;

  const dragIdx = photoItems.findIndex(p => p.id === dragPhotoId);
  if (dragIdx === -1) return;
  if (!photoItems.some(p => p.id === targetId)) return;

  const [dragged] = photoItems.splice(dragIdx, 1);
  const target = photoItems.find(p => p.id === targetId);
  dragged.processId = target.processId;
  dragged.phase = target.phase;

  const targetIdx = photoItems.findIndex(p => p.id === targetId);
  const insertAt = isDragOverTopHalf(e, this) ? targetIdx : targetIdx + 1;
  photoItems.splice(insertAt, 0, dragged);

  dirty = true;
  renderGrid();
}

// 工程見出し / phase グリッドの余白へのドロップ（そのグループの末尾へ追加）
function onGroupDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function onGroupDragLeave() {
  this.classList.remove('drag-over');
}

/** グループ(工程+phase)へのドロップ: そのグループに移動し末尾へ（renderGrid が再ソート） */
function onGroupDrop(e, processId, phase) {
  e.preventDefault();
  this.classList.remove('drag-over');
  if (dragPhotoId === null) return;
  const dragIdx = photoItems.findIndex(p => p.id === dragPhotoId);
  if (dragIdx === -1) return;
  const [dragged] = photoItems.splice(dragIdx, 1);
  dragged.processId = processId;
  dragged.phase = phase;
  photoItems.push(dragged); // 末尾に置くと再ソートでそのグループの末尾に収まる
  dirty = true;
  renderGrid();
}
```

- [ ] **Step 2: ブラウザで各ドロップを確認**

```bash
python -m http.server 8183 > /tmp/http183.log 2>&1 &
```

index.html で Task 1 と同じデータを注入し `saveToStorage()`、`reorder.html` を開いて以下を `mcp__plugin_superpowers-chrome_chrome__use_browser` で確認（合成 DragEvent を使う。`clientY` で上半分/下半分を指定）:
1. **同一グループ内並べ替え**: 基礎工事・前 の a を b の下半分へドロップ → その工程・phase 内で順序が入れ替わり、`photoItems` の該当2枚の順が反転。
2. **別工程へ移動**: 基礎工事の a を 配管工事のカード上へドロップ → a の `processId` が配管工事に変わり、表示が配管工事セクションへ移動。
3. **別phaseへ移動**: 基礎工事・前 の a を 基礎工事・中 のカードへドロップ → a.phase が during に。
4. **空グループ/見出しへドロップ**: 未分類(その他)セクション見出しへドロップ → processId=null に。
   各操作後、`renderGrid` 後の表示順（通し番号順の name 列）を記録し、`sortPhotosForExport` の不変条件通りに並ぶことを確認。
5. `get_console_messages` でエラーなし。各 eval の**リテラル出力**をレポートに貼る。

- [ ] **Step 3: Commit**

```bash
git add "Construction photos/js/reorder.js" && git commit -m "$(cat <<'EOF'
feat: make every reorder.html drag reflect the print output

Dropping a card reorders within its process/phase group or, when dropped on
another group's card or heading, reassigns the photo's processId/phase so the
move is reflected in the PDF. Mirrors the photo management tab's drop logic.
EOF
)"
```

---

### Task 4: 保存拡張＋離脱警告＋統合確認

**Files:**
- Modify: `Construction photos/js/reorder.js`（`saveOrder` 拡張・`beforeunload`）
- Modify: `Construction photos/index.html`（更新コメント）

**Interfaces:**
- Consumes: Task 2/3 の `photoItems`/`dirty`。
- Produces: `saveOrder`（photoOrder + photosMeta の processId/phase 書き戻し）、beforeunload 警告。

- [ ] **Step 1: saveOrder を processId/phase まで書き戻すよう拡張**

`Construction photos/js/reorder.js` の `saveOrder`（旧 217-230 行）を以下に置き換える。

```js
/** 並び順と工程/phase の変更を localStorage に保存してトーストを表示 */
function saveOrder() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    data.photoOrder = photoItems.map(item => item.id);
    // 工程/phase の変更を photosMeta に反映（title/desc/date 等は温存）
    const itemById = new Map(photoItems.map(it => [it.id, it]));
    (data.photosMeta || []).forEach(m => {
      const it = itemById.get(m.id);
      if (it) { m.processId = it.processId; m.phase = it.phase; }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dirty = false;
    showToast('並び順を保存しました ✓');
  } catch (e) {
    showToast('保存に失敗しました', false);
  }
}
```

- [ ] **Step 2: beforeunload 警告を追加**

`Construction photos/js/reorder.js` の末尾（`showToast` 定義の後）に以下を追加する。

```js
// 未保存の変更があるまま離脱しようとしたら警告する
window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});
```

（`saveOrder`/`saveAndBack` は保存時に `dirty=false` にするため、保存後の遷移では警告は出ない。）

- [ ] **Step 3: index.html の更新コメントに追記**

`Construction photos/index.html` の既存コメントブロック末尾（2026-07-15 のコメントの直後）に以下を追加する。

```html
  <!--
    === 更新内容 (2026-07-17) ===
    - 並べ替えページ(reorder.html)を印刷レイアウトそのままのWYSIWYG表示に変更
      * 工程→前中後でグループ表示し、印刷される通し番号順に並べる
      * ドラッグでの並べ替え・別工程/状態への移動がそのまま印刷に反映される
      * 印刷ソートと並べ替え画面のソートを common.js の共通関数に集約
    - 未保存のまま離脱しようとすると警告を表示
  -->
```

- [ ] **Step 4: 保存往復とフルフローを確認**

```bash
python -m http.server 8184 > /tmp/http184.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で:
1. index.html でデータ注入 `saveToStorage()` → reorder.html を開く。
2. 別工程へ1枚移動 + 同一グループ内で1枚並べ替え → 「この順番で保存」(`saveOrder()`) 実行。
3. `navigate` で index.html を**リロード**（`await initDB()`→`loadFromStorage()` 経由）し、`eval` で `sortPhotosForExport(photos, processes).map(p=>({name:p.name,pid:p.processId,ph:p.phase}))` を取得 → reorder で行った移動（processId/phase 変更と順序）が反映されていることを確認。
4. `eval` で移動した写真の `title`/`desc` が保存前と変わっていない（温存）ことを確認。
5. reorder.html を再度開き、表示順が保存内容と一致することを確認。
6. `dirty` 経路: reorder で1枚動かした後、保存せずに `beforeunload` が発火する状態か（`eval` で `dirty === true` を確認。実ダイアログはヘッドレスで抑止されるため、フラグ状態で代替検証）。保存後は `dirty === false`。
7. エッジ: 写真0枚（localStorage クリア）で `showEmpty` が出る、工程0件で単一「その他」セクション、を確認。
8. `get_console_messages` でエラーなし。リテラル出力をレポートに貼る。

- [ ] **Step 5: サーバー停止**

```bash
pkill -f "http.server 818" 2>/dev/null; echo done
```

- [ ] **Step 6: Commit**

```bash
git add "Construction photos/js/reorder.js" "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
feat: persist process/phase changes from reorder.html and warn on unsaved exit

saveOrder() now writes processId/phase back to photosMeta (title/desc/date
preserved) so cross-group moves survive a reload, and a beforeunload guard
warns when leaving with unsaved reordering.
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage**: 共通ソート抽出(T1)、グループ表示・通し番号・印刷順ミラー(T2)、同一/別グループのドロップ意味付け(T3)、保存拡張・離脱警告・往復確認(T4)、自己修復正規化(T2 initReorder)、エッジ(写真0/工程0/stale processId)をカバー。スコープ外（タッチ対応・photo.js「未分類」表記統一・自動保存化）はタスク無し。
- **不変条件**: `renderGrid` 冒頭で `photoItems = sortPhotosForExport(...)` により配列順=表示順=印刷順が常に成立。保存は `photoOrder = photoItems.map(id)`。同一グループ内は rank 同値→タイブレーカー(index)のみで順序決定→再ソートで表示順を完全再現。
- **二重宣言回避**: `PHASE_LABELS` は common.js に移さない（photo.js/reorder.js の const と衝突）。`getProcessNameForPhoto` は renderer.js のローカル定義を削除し common.js の2引数版に一本化。
- **型整合**: `sortPhotosForExport(photos, processes)` の戻り値は新配列。`getProcessNameForPhoto(p, processes)` は string。drag は id ベース（`dragPhotoId`）で T2/T3 一貫。`onCardDrop`/`onGroupDrop`/`isDragOverTopHalf` は T2 スタブ→T3 本実装で同名・同シグネチャ。
- **Placeholder scan**: 全ステップに具体コード・コマンド・期待値を記載。TBD/TODO なし（T2 Step 8 のスタブは T3 で本実装に置換する旨を明記）。
