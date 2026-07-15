# Construction photos 工程ごとの改ページ・reorder.html工程バッジ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construction photos の PDF/プレビュー出力を工程ごとに改ページさせ、並べ替え専用ページ（reorder.html）の各サムネイルカードに工程・前中後バッジと説明文を表示する。

**Architecture:** 2つの独立したサブ機能を1プランにまとめる（同一ツール内・関連は薄いが規模が小さいため）。(1) `js/renderer.js` の `updatePreview()` を、工程境界でグループ化してからページ化する方式に変更（新規ヘルパー関数 `buildPhotoPages()` を追加）。(2) `js/reorder.js` の `initReorder()`/`createCard()` を、`localStorage` に既に保存済みの `processes`/`desc`/`processId`/`phase` を読み込んで表示するように拡張する。ドラッグ&ドロップの並び替えロジック自体（`onDragStart`/`onDragOver`/`onDrop`/`onDragEnd`）は変更しない。

**Tech Stack:** Vanilla JS (ES6+), CSS custom properties。ビルドツール・テストランナーなし。検証は `python -m http.server` + `mcp__plugin_superpowers-chrome_chrome__use_browser`（Chrome CDPベースのブラウザ操作ツール）で行う。

## Global Constraints

- ビルドステップなし。全ファイルはブラウザに直接読み込まれる素の HTML/CSS/JS のまま。
- `buildReportPage()`（`js/renderer.js`）の関数シグネチャ・中身は変更しない。呼び出し側（`updatePreview()`）のページ分割ロジックのみ変更する。
- 印刷CSS（`css/style.css` の `.report-page { page-break-after: always }`）は変更しない。
- 工程内の前中後ソート順・1ページ3枚のレイアウトは現状維持。今回追加するのは「工程が変わる境界で必ず新しいページから始める」ロジックのみ。
- `js/reorder.js` のドラッグ&ドロップによる並び替え挙動（`onDragStart`/`onDragOver`/`onDrop`/`onDragEnd`、`photoItems` の位置入れ替え）は変更しない。工程をまたいで移動しても `processId`/`phase` は変更しない。
- `css/reorder.css` の既存ローカルトークン（`--accent2`, `--text2`, `--border` 等、`:root` で定義済み）のみを使う。新規のハードコード色は追加しない。
- 各タスク完了後、`python -m http.server <port>` を起動し、`mcp__plugin_superpowers-chrome_chrome__use_browser` の `navigate`/`eval`/`get_console_messages` で実際に動作確認する。コンソールエラーが出ないことを確認する。
- 仕様書: `docs/superpowers/specs/2026-07-15-construction-photos-process-pagebreak-and-reorder-badges-design.md`
- `STORAGE_KEY` は `'kojiReport_v1'`（`js/common.js:11`）。

---

## File Structure

| ファイル | 変更内容 |
|---|---|
| `Construction photos/js/renderer.js` | `updatePreview()` のページ分割ロジックを工程グループ単位に変更、新規関数 `buildPhotoPages()` を追加 |
| `Construction photos/js/reorder.js` | `photoItems` に `desc`/`processId`/`phase` を追加、新規グローバル `reorderProcesses`、新規ヘルパー `getProcessBadgeLabel()`、`createCard()` にバッジ・説明文表示を追加 |
| `Construction photos/css/reorder.css` | `.thumb-process-badge`・`.thumb-desc` のスタイルを追加 |

新規ファイルは作成しない。

---

### Task 1: PDF/プレビュー — 工程ごとの改ページ

**Files:**
- Modify: `Construction photos/js/renderer.js:37-69`（`updatePreview()` 関数）

**Interfaces:**
- Consumes: 既存の `getSortedPhotosForExport()`, `getProcessNameForPhoto(p)`, `buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName, frontPageCount)`, `buildCoverPage(cover)`, `buildSupplementPage(cover)`, `getCoverData()`, `saveToStorage()`
- Produces: `function buildPhotoPages(sortedPhotos): Array<{processName: string, photos: Array}>` — ソート済み写真配列を工程境界で改ページされるページ単位に分割する

- [ ] **Step 1: buildPhotoPages() を追加し、updatePreview() から呼び出す**

`Construction photos/js/renderer.js` の `getProcessNameForPhoto` 関数（30-35行目）の直後に以下を追加する。

```js
/**
 * ソート済み写真列（getSortedPhotosForExport の出力）を、工程が変わる境界で
 * 必ず新しいページから始まるようにページ単位（最大3枚）に分割する。
 * 各グループの先頭ページにのみ工程名を持たせ、続きのページは空文字にする。
 */
function buildPhotoPages(sortedPhotos) {
  const groups = [];
  let currentGroup = null;
  let currentName;
  sortedPhotos.forEach(p => {
    const name = getProcessNameForPhoto(p);
    if (!currentGroup || name !== currentName) {
      currentGroup = { name, photos: [] };
      groups.push(currentGroup);
      currentName = name;
    }
    currentGroup.photos.push(p);
  });
  if (groups.length === 0) {
    groups.push({ name: '', photos: [] });
  }

  const pages = [];
  groups.forEach(group => {
    const pageCount = Math.max(Math.ceil(group.photos.length / 3), 1);
    for (let i = 0; i < pageCount; i++) {
      pages.push({
        processName: i === 0 ? group.name : '',
        photos: group.photos.slice(i * 3, i * 3 + 3)
      });
    }
  });
  return pages;
}
```

次に、同ファイルの `updatePreview()` 関数内（現在58-68行目）にある、以下の写真ページ分割ブロックを置き換える。

置き換え前:
```js
  const sortedPhotos = getSortedPhotosForExport();
  const totalPages = Math.max(Math.ceil(sortedPhotos.length / 3), 1);
  let lastProcessName = null;
  for (let page = 0; page < totalPages; page++) {
    const pagePhotos = sortedPhotos.slice(page * 3, page * 3 + 3);
    const pageProcessName = pagePhotos.length ? getProcessNameForPhoto(pagePhotos[0]) : null;
    const showProcessName = pageProcessName !== null && pageProcessName !== lastProcessName;
    lastProcessName = pageProcessName !== null ? pageProcessName : lastProcessName;
    const reportPage = buildReportPage(cover, pagePhotos, page + 1, totalPages + frontPageCount, showProcessName ? pageProcessName : '', frontPageCount);
    area.appendChild(reportPage);
  }
```

置き換え後:
```js
  const sortedPhotos = getSortedPhotosForExport();
  const pages = buildPhotoPages(sortedPhotos);
  const totalPages = pages.length;
  pages.forEach((pg, idx) => {
    const reportPage = buildReportPage(cover, pg.photos, idx + 1, totalPages + frontPageCount, pg.processName, frontPageCount);
    area.appendChild(reportPage);
  });
```

- [ ] **Step 2: ブラウザで動作確認**

```bash
python -m http.server 8171 > /tmp/http171.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で以下を確認する:

1. `navigate` で `http://localhost:8171/Construction%20photos/index.html` を開く
2. `eval` で2つの工程・1つの未分類にまたがる写真データを直接注入し、`buildPhotoPages` を単体で検証する（工程1に4枚＝2ページ、工程2に2枚＝1ページ、未分類に1枚＝1ページ、合計4ページになるはず）:

```js
processes.push({ id: nextProcessId++, name: '基礎工事' });
processes.push({ id: nextProcessId++, name: '配管工事' });
const p1 = processes[0].id, p2 = processes[1].id;
const mk = (name, processId, phase) => ({
  id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  name, date: '2026-07-01', exifDate: null, title: '', desc: '', processId, phase
});
photos.push(
  mk('a.jpg', p1, 'before'), mk('b.jpg', p1, 'before'),
  mk('c.jpg', p1, 'during'), mk('d.jpg', p1, 'during'),
  mk('e.jpg', p2, 'before'), mk('f.jpg', p2, 'after'),
  mk('g.jpg', null, 'before')
);
const pages = buildPhotoPages(getSortedPhotosForExport());
pages.map(pg => ({ name: pg.processName, count: pg.photos.length }));
```

期待値: `[{"name":"基礎工事","count":3},{"name":"","count":1},{"name":"配管工事","count":2},{"name":"その他","count":1}]`

3. `eval` で `updatePreview()` を呼び、実際にレンダリングされた `.report-page` の枚数と、それぞれの「工　程」欄の表示内容を確認する:

```js
updatePreview();
const pages2 = Array.from(document.querySelectorAll('.report-page')).filter(el => el.dataset.page !== 'cover' && el.dataset.page !== 'supplement');
pages2.map(el => {
  const rows = Array.from(el.querySelectorAll('.header-info-table tr'));
  const processRow = rows.find(tr => tr.cells[0] && tr.cells[0].textContent.includes('工'));
  return processRow ? processRow.cells[1].textContent.trim() : '';
});
```

期待値: `["基礎工事", "", "配管工事", "その他"]`（4ページ、工程が変わる1・3・4ページ目にのみ工程名が表示される）

4. `eval` で、工程が0件（全て未分類）のケースでも従来通り3枚ずつページ化されることを確認する（回帰確認）:

```js
processes.length = 0;
photos.forEach(p => { p.processId = null; });
updatePreview();
const pages3 = Array.from(document.querySelectorAll('.report-page')).filter(el => el.dataset.page !== 'cover' && el.dataset.page !== 'supplement');
pages3.length; // 7枚 → 3ページ（3+3+1）になるはず
```

期待値: `3`

5. `get_console_messages` でエラーがないことを確認する

- [ ] **Step 3: Commit**

```bash
git add "Construction photos/js/renderer.js" && git commit -m "$(cat <<'EOF'
feat: force PDF/preview page break at each process boundary

updatePreview() now groups sorted photos by process before paginating,
so a page never mixes photos from two different processes.
EOF
)"
```

---

### Task 2: reorder.html — 工程・前中後バッジ + 説明文表示

**Files:**
- Modify: `Construction photos/js/reorder.js:13-14`（グローバル変数宣言）
- Modify: `Construction photos/js/reorder.js:20-69`（`initReorder()` 関数）
- Modify: `Construction photos/js/reorder.js:82-138`（`createCard()` 関数）
- Modify: `Construction photos/css/reorder.css:190-204`（`.order-badge` の直後）
- Modify: `Construction photos/css/reorder.css:247-253`（`.thumb-meta` の直後）

**Interfaces:**
- Consumes: 既存の `photoItems`, `createCard(item, idx)`, `STORAGE_KEY`（`js/common.js:11`）
- Produces:
  - グローバル `let reorderProcesses = [];`
  - `const PHASE_LABELS = { before: '前', during: '中', after: '後' };`
  - `function getProcessBadgeLabel(item): string` — 「工程名・前中後」または「未分類・前中後」を返す
  - `photoItems` の各要素に `desc: string`, `processId: number|null`, `phase: string` を追加
  - CSSクラス `.thumb-process-badge`, `.thumb-desc`

- [ ] **Step 1: グローバル変数と PHASE_LABELS を追加**

`Construction photos/js/reorder.js` の14行目（`let photoItems = []; // { id, src, title, name, date }`）を以下に置き換える。

```js
let photoItems = []; // { id, src, title, name, date, desc, processId, phase }

// 並べ替え対象の写真が属する工程一覧（localStorage から復元、id/name のみ）
let reorderProcesses = [];

const PHASE_LABELS = { before: '前', during: '中', after: '後' };

/** 写真1枚の「工程名・前中後」バッジ文字列を返す（未分類・削除済み工程は「未分類」） */
function getProcessBadgeLabel(item) {
  const phaseLabel = PHASE_LABELS[item.phase] || PHASE_LABELS.before;
  const pr = item.processId === null || item.processId === undefined
    ? null
    : reorderProcesses.find(p => p.id === item.processId);
  return `${pr ? pr.name : '未分類'}・${phaseLabel}`;
}
```

- [ ] **Step 2: initReorder() で processes を読み込み、photoItems に desc/processId/phase を追加**

`Construction photos/js/reorder.js` の `initReorder()` 関数内、以下の2箇所を変更する。

まず、`try` ブロック（現在32-40行目）を以下に置き換える。

```js
  let meta, order;
  try {
    const data = JSON.parse(raw);
    meta  = data.photosMeta  || [];
    order = data.photoOrder  || meta.map(m => m.id);
    reorderProcesses = data.processes || [];
  } catch (e) {
    showEmpty();
    return;
  }
```

次に、`photoItems` を構築する `.map()` の中身（現在56-62行目）を以下に置き換える。

```js
      return {
        id:    m.id,
        src:   srcMap.get(m.id) || null,
        title: m.title || '',
        name:  m.name  || '',
        date:  m.date  || '',
        desc:      m.desc || '',
        processId: m.processId ?? null,
        phase:     m.phase || 'before'
      };
```

- [ ] **Step 3: createCard() にバッジと説明文を追加**

`Construction photos/js/reorder.js` の `createCard()` 関数内、以下の2箇所を変更する。

まず、「順番バッジ」ブロック（現在89-92行目）の直後に工程バッジを追加する。

```js
  // 順番バッジ
  const badge = document.createElement('div');
  badge.className   = 'order-badge';
  badge.textContent = idx + 1;

  // 工程バッジ（工程名・前中後）
  const processBadge = document.createElement('div');
  processBadge.className   = 'thumb-process-badge';
  processBadge.textContent = getProcessBadgeLabel(item);
```

次に、`info.appendChild(metaEl);` の直後（現在124行目）に説明文の追加、および `card.appendChild(badge);` の直後（現在126行目）に工程バッジの追加を行う。現在の該当ブロック:

```js
  info.appendChild(titleEl);
  info.appendChild(metaEl);

  card.appendChild(badge);
  card.appendChild(imgWrap);
  card.appendChild(info);
```

これを以下に置き換える。

```js
  info.appendChild(titleEl);
  info.appendChild(metaEl);
  if (item.desc) {
    const descEl = document.createElement('div');
    descEl.className   = 'thumb-desc';
    descEl.textContent = item.desc;
    info.appendChild(descEl);
  }

  card.appendChild(badge);
  card.appendChild(processBadge);
  card.appendChild(imgWrap);
  card.appendChild(info);
```

- [ ] **Step 4: css/reorder.css にバッジ・説明文のスタイルを追加**

`Construction photos/css/reorder.css` の `.order-badge` ブロック（190-204行目）の直後に以下を追加する。

```css
/* 工程バッジ（右上）*/
.thumb-process-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--accent2);
  color: #fff;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  z-index: 5;
  line-height: 1.6;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  max-width: calc(100% - 16px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

続けて、`.thumb-meta` ブロック（247-253行目）の直後に以下を追加する。

```css
.thumb-desc {
  font-size: 11px;
  color: var(--text2);
  white-space: pre-line;
  line-height: 1.4;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 5: ブラウザで動作確認**

```bash
python -m http.server 8172 > /tmp/http172.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で以下を確認する:

1. `navigate` で `http://localhost:8172/Construction%20photos/index.html` を開く
2. `eval` で工程・写真データを注入し `saveToStorage()` を呼んで `localStorage` に永続化する（reorder.html は別ページなので `localStorage` 経由でデータを渡す必要がある）:

```js
processes.push({ id: nextProcessId++, name: '基礎工事' });
const p1 = processes[0].id;
photos.push(
  { id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', name: 'a.jpg', date: '2026-07-01', exifDate: null, title: 'タイトルA', desc: '外観確認済み\n特記事項なし', processId: p1, phase: 'during' },
  { id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', name: 'b.jpg', date: '2026-07-02', exifDate: null, title: '', desc: '', processId: null, phase: 'before' }
);
saveToStorage();
'saved';
```

期待値: `"saved"`

3. `navigate` で `http://localhost:8172/Construction%20photos/reorder.html` を開く
4. `eval` で、a.jpg のカードに工程バッジ「基礎工事・中」が、b.jpg のカードに「未分類・前」が表示されていることを確認する:

```js
Array.from(document.querySelectorAll('.thumb-card .thumb-process-badge')).map(el => el.textContent);
```

期待値: `["基礎工事・中", "未分類・前"]`（`photoOrder` の保存順に依存するため、`a.jpg, b.jpg` の追加順と一致するはず）

5. `eval` で、説明文がある a.jpg のカードには `.thumb-desc` が表示され、説明文が空の b.jpg のカードには `.thumb-desc` 要素自体が存在しないことを確認する:

```js
const cards = Array.from(document.querySelectorAll('.thumb-card'));
cards.map(c => {
  const descEl = c.querySelector('.thumb-desc');
  return descEl ? descEl.textContent : null;
});
```

期待値: `["外観確認済み\n特記事項なし", null]`

6. `get_console_messages` でエラーがないことを確認する

- [ ] **Step 6: Commit**

```bash
git add "Construction photos/js/reorder.js" "Construction photos/css/reorder.css" && git commit -m "$(cat <<'EOF'
feat: show process/phase badge and description on reorder.html cards

reorder.html already had processId/phase/desc available in localStorage
but discarded them. Cards now show a process+phase badge and the photo's
description text; drag-and-drop reorder behavior is unchanged.
EOF
)"
```

---

### Task 3: 統合確認・changelog更新

**Files:**
- Modify: `Construction photos/index.html`（更新内容コメント）

**Interfaces:**
- Consumes: Task 1〜2 の全機能
- Produces: なし（記録・実機での最終確認のみ）

- [ ] **Step 1: index.html の更新コメントに追記**

`Construction photos/index.html` の既存コメントブロックの末尾（2026-07-08の工程ドラッグ並べ替えコメントの直後）に以下を追加する。

```html
  <!--
    === 更新内容 (2026-07-15) ===
    - PDF/プレビュー: 工程ごとに必ず改ページするように変更
      （同一ページ内に複数工程の写真が混在しないようにした）
    - 並べ替えページ（reorder.html）: 各カードに工程・前中後バッジと
      説明文を表示するように変更（並べ替え自体の挙動は変更なし）
  -->
```

- [ ] **Step 2: フルフロー動作確認**

```bash
python -m http.server 8173 > /tmp/http173.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で以下を通しで確認する:

1. `navigate` で `http://localhost:8173/Construction%20photos/index.html` を開く
2. 表紙タブで工程を2つ追加（「基礎工事」「配管工事」）
3. 写真管理タブで `eval` により5〜7枚程度の写真を複数工程・未分類にまたがって注入し、`updatePreview()` を呼ぶ
4. `.report-page`（表紙・補足を除く）の枚数と、各ページの工程名表示が工程境界と一致していることを目視・DOM確認する
5. ヘッダーの「並べ替え」ボタン（`openReorderPage()`）に相当する `saveToStorage()` → `window.open('reorder.html', ...)` の代わりに、`navigate` で直接 `reorder.html` を開き、各カードに工程バッジ・説明文が表示され、ドラッグ&ドロップでの並べ替え（`onDragStart`/`onDrop`）が引き続き正しく動作すること（並べ替え後 `photoOrder` が更新されること）を確認する
6. `get_console_messages` で全体を通してエラーがないことを確認する

- [ ] **Step 3: サーバー停止**

```bash
pkill -f "http.server 817" 2>/dev/null; echo done
```

- [ ] **Step 4: Commit**

```bash
git add "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
docs: note process page-break and reorder badge features in index.html update log
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** 工程ごとの改ページ（Task 1）、reorder.html の工程・前中後バッジ表示（Task 2 Step 1-4）、説明文表示（Task 2 Step 3-4）、ドラッグ並び替え挙動の非変更確認（Task 2 Step5・Task3 Step5）、未分類・削除済み工程のフォールバック表示（Task 2 の `getProcessBadgeLabel`）、写真0枚・工程0件時の回帰確認（Task 1 Step2-4）を全てカバー。スコープ外とした「reorder.htmlのセクション分け表示」「工程をまたぐドラッグでのprocessId変更」「前中後単位の改ページ」「説明文の全文表示」は対象タスクなし（仕様書通り）。
- **Placeholder scan:** 全ステップに具体的なコード・コマンドを記載済み。TBD/TODOなし。
- **Type consistency:** `buildPhotoPages(sortedPhotos): Array<{processName, photos}>` の返り値の形は Task 1 内で一貫。`getProcessBadgeLabel(item): string` は Task 2 内で `item.processId`/`item.phase` を読む一貫したシグネチャ。`photoItems` の要素形状（`id, src, title, name, date, desc, processId, phase`）は Step 2 の構築と Step 3 の参照で一致。
