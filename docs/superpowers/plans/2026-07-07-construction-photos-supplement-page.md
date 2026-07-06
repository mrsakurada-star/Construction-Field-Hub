# Construction photos 工事報告補足入力 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construction photos の表紙タブに「補足情報」入力欄を追加し、入力があった場合のみPDF/プレビュー出力で表紙ページと写真ページの間に独立した補足ページを挿入する。

**Architecture:** 既存の vanilla JS グローバル関数構成を維持する。`getCoverData()`/`loadFromStorage()`（`js/storage.js`）に `supplement` フィールドを追加し、`js/renderer.js` に `buildSupplementPage(cover)` を新設して `updatePreview()` から条件付きで呼び出す。既存の写真ページのページ番号計算（`buildReportPage` の `pageNum`/`totalPagesAll`）に補足ページ分のオフセットを反映する。

**Tech Stack:** Vanilla JS (ES6+), CSS custom properties。テストランナー・ビルドツールなし。検証は `python3 -m http.server` + Playwright MCP でのブラウザ実操作による目視・DOM確認で行う。

## Global Constraints

- ビルドステップなし。全ファイルはブラウザに直接読み込まれる素の HTML/CSS/JS のまま。
- 既存のデザイントークン（`css/style.css` の `:root` 内 `--paper`, `--surface`, `--surface2`, `--rule`, `--rule-soft`, `--ink`, `--ink2`, `--stamp`, `--stamp-soft`, `--ok`, `--ok-soft`）以外の新規カラー値をハードコードしない。
- インラインスタイル (`style="..."`) を新規追加しない。CSS クラスを使う。
- 補足情報が空文字列（またはトリム後に空）の場合、補足ページを作成しない。
- 既存データ（`supplement` フィールドがない過去の保存データ）は空欄として扱う。追加のマイグレーション処理は不要（`setVal()` は値が `undefined` のとき何もしない既存挙動に従う）。
- 各タスク完了後、`python3 -m http.server <port> --directory "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub"` を起動し、Playwright MCP (`browser_navigate`, `browser_snapshot`, `browser_evaluate`, `browser_console_messages`) で実際に動作確認する。コンソールエラーが出ないことを確認する（`favicon.ico` の404は許容）。
- 仕様書: `docs/superpowers/specs/2026-07-07-construction-photos-supplement-page-design.md`
- 前提: 工程管理機能・複数選択機能は実装済み（`getSortedPhotosForExport()`, `getProcessNameForPhoto()`, `buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName)` が `js/renderer.js` に既存）。

---

## File Structure

| ファイル | 変更内容 |
|---|---|
| `Construction photos/index.html` | 表紙タブに補足情報の `section-title`+`textarea` を追加 |
| `Construction photos/js/storage.js` | `getCoverData()`/`loadFromStorage()` に `supplement` フィールドを追加 |
| `Construction photos/js/renderer.js` | `buildSupplementPage(cover)` 新設、`updatePreview()`/`buildReportPage()` にページ番号オフセットを追加 |
| `Construction photos/css/style.css` | 補足ページ用のスタイル（既存の `.report-page` 系クラスを流用しつつ、見出し用クラスを追加） |

新規ファイルは作成しない。

---

### Task 1: 補足情報フィールドの追加（表紙タブUI＋永続化）

**Files:**
- Modify: `Construction photos/index.html:85-86`（「工事内容」`textarea` の直後、「工程一覧」の `section-title` の前）
- Modify: `Construction photos/js/storage.js:157-170`（`getCoverData()`）
- Modify: `Construction photos/js/storage.js:63-76`（`loadFromStorage()` 内の表紙情報復元ブロック）

**Interfaces:**
- Consumes: 既存の `#tab-cover input, #tab-cover textarea` への共通 `input` イベントリスナー（`index.html:216-218`）、既存の `setVal(id, val)`（`js/storage.js:137-140`）
- Produces:
  - `getCoverData()` の返り値に `supplement: string` フィールドが追加される
  - `loadFromStorage()` が `#coverSupplement` の値を復元する
  - `<textarea id="coverSupplement">` が表紙タブに存在する

- [ ] **Step 1: index.html に補足情報の入力欄を追加**

`Construction photos/index.html` の85行目（`<div class="form-group"><label>工事内容</label><textarea id="coverWorkContent" rows="4" placeholder="給湯器取替工事"></textarea></div>` の直後）と86行目（`<div class="section-title">工程一覧</div>`）の間に以下を挿入する。

```html
          <div class="section-title">補足情報</div>
          <div class="form-group"><label>補足情報</label><textarea id="coverSupplement" rows="4" placeholder="既設の配管を活用し...後日、完工検査を実施予定です"></textarea></div>
```

- [ ] **Step 2: getCoverData に supplement を追加**

`Construction photos/js/storage.js` の `getCoverData` 関数（157-170行目）を以下に置き換える。

```js
function getCoverData() {
  return {
    date:          document.getElementById('coverDate').value,
    manageNo:      document.getElementById('coverManageNo').value,
    ourManageNo:   document.getElementById('coverOurManageNo').value,
    affiliation:   document.getElementById('coverAffiliation').value,
    author:        document.getElementById('coverAuthor').value,
    siteName:      document.getElementById('coverSiteName').value,
    address:       document.getElementById('coverAddress').value,
    workContent:   document.getElementById('coverWorkContent').value,
    supplement:    document.getElementById('coverSupplement').value,
    workStartDate: document.getElementById('coverWorkStartDate').value,
    workEndDate:   document.getElementById('coverWorkEndDate').value
  };
}
```

- [ ] **Step 3: loadFromStorage で supplement を復元**

`Construction photos/js/storage.js` の `loadFromStorage` 関数内、表紙情報の復元ブロック（63-76行目）を以下に置き換える。

```js
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
      setVal('coverSupplement',    c.supplement);
      setVal('coverWorkStartDate', c.workStartDate);
      setVal('coverWorkEndDate',   c.workEndDate);
    }
```

- [ ] **Step 4: ブラウザで動作確認**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && python3 -m http.server 8170 > /tmp/http170.log 2>&1 &
```

Playwright MCP で `http://localhost:8170/Construction%20photos/index.html?cb=1` を開き（`?cb=1` はブラウザキャッシュ回避のため付与する）、以下を確認する:
1. 表紙タブに「補足情報」の見出しと `textarea`（`#coverSupplement`）が「工事内容」の直後・「工程一覧」の前に表示されていること
2. `browser_evaluate` で `document.getElementById('coverSupplement').value = 'テスト補足文\n2行目'; document.getElementById('coverSupplement').dispatchEvent(new Event('input', {bubbles:true}));` を実行後、`JSON.parse(localStorage.getItem(STORAGE_KEY)).cover.supplement` が `'テスト補足文\n2行目'` になっていることを確認
3. ページをリロードし、`#coverSupplement` の値が復元されていることを確認
4. `browser_console_messages` でエラーがないこと

- [ ] **Step 5: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/index.html" "Construction photos/js/storage.js" && git commit -m "$(cat <<'EOF'
feat: add supplement info field to cover tab

表紙タブに補足情報入力欄（複数行textarea）を追加し、
getCoverData/loadFromStorageで永続化するようにした。
EOF
)"
```

---

### Task 2: PDF/プレビュー出力への補足ページ挿入

**Files:**
- Modify: `Construction photos/js/renderer.js:37-63`（`updatePreview` 関数）
- Modify: `Construction photos/js/renderer.js:90-156`（`buildReportPage` 関数のフッター計算）
- Modify: `Construction photos/css/style.css`（`.cover-title` 定義の近くに補足ページ用の見出しクラスを追加）

**Interfaces:**
- Consumes: Task 1 の `cover.supplement`（`getCoverData()` の返り値経由）
- Produces:
  - `function buildSupplementPage(cover): HTMLElement` — `.report-page` クラスの補足ページDOMを返す
  - `buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName, frontPageCount)` — 第6引数 `frontPageCount` を追加（後方互換のためデフォルト値 `1` を持たせる）

- [ ] **Step 1: buildSupplementPage を追加**

`Construction photos/js/renderer.js` の `buildCoverPage` 関数（65-88行目）の直後に以下を追加する。

```js

/** 補足情報ページを構築する（cover.supplement が空なら呼び出し側でスキップする） */
function buildSupplementPage(cover) {
  const page = document.createElement('div');
  page.className = 'report-page';
  page.setAttribute('data-page', 'supplement');
  page.innerHTML = `
    <div class="cover-title supplement-title">工事報告書 補足事項</div>
    <div class="supplement-body pre-line">${escapeHtml(cover.supplement)}</div>
  `;
  return page;
}
```

- [ ] **Step 2: updatePreview を補足ページ挿入・ページ番号オフセット対応に変更**

`Construction photos/js/renderer.js` の `updatePreview` 関数（37-63行目）を以下に置き換える。

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

  const hasSupplement = !!(cover.supplement && cover.supplement.trim());
  if (hasSupplement) {
    area.appendChild(buildSupplementPage(cover));
  }
  const frontPageCount = 1 + (hasSupplement ? 1 : 0); // 表紙 + （あれば）補足ページ

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
}
```

- [ ] **Step 3: buildReportPage のフッター計算にオフセットを反映**

`Construction photos/js/renderer.js` の `buildReportPage` 関数シグネチャ（90行目）とフッター行（152行目）を以下に置き換える。

```js
function buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName, frontPageCount = 1) {
```

（関数本体の中身はそのまま変更しない。フッター行のみ以下に置き換える。）

```js
  const footerHTML = `<div class="report-footer">${pageNum + frontPageCount} / ${totalPagesAll} ページ</div>`;
```

- [ ] **Step 4: css/style.css に補足ページのスタイルを追加**

`Construction photos/css/style.css` を開き、`.cover-title` の定義を検索する。その定義ブロックの直後に以下を追加する。

```css
    .supplement-title {
      margin-bottom: 20px;
    }

    .supplement-body {
      font-size: 13px;
      line-height: 1.8;
      color: var(--ink);
    }
```

- [ ] **Step 5: ブラウザで動作確認**

Playwright MCP で以下を確認する:
1. `http://localhost:8170/Construction%20photos/index.html?cb=1` を開く
2. 補足情報を空のままにして、表紙情報（現場名等）と写真を1枚登録し、プレビュー更新をクリック → `document.querySelectorAll('.report-page[data-page="supplement"]').length` が `0` であること（補足ページが作られない）を確認
3. `#coverSupplement` に複数行テキストを入力し、`input` イベントを発火させてからプレビュー更新をクリック → `.report-page[data-page="supplement"]` が1件存在し、表紙ページ（`data-page="cover"`）の直後・最初の写真ページの直前に挿入されていることを DOM の順序で確認
4. 写真ページのフッター（`.report-footer`）のテキストを確認し、「3 / (総ページ数)」のように、表紙(1)+補足(1)を加味した番号になっていることを確認（例: 写真1ページのみなら「3 / 3 ページ」）
5. 補足情報を再度空にしてプレビュー更新 → 補足ページが消え、写真ページのフッターが「2 / 2 ページ」に戻ることを確認（表紙のみのオフセットに戻る）
6. `browser_console_messages` でエラーがないことを確認

- [ ] **Step 6: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/js/renderer.js" "Construction photos/css/style.css" && git commit -m "$(cat <<'EOF'
feat: insert supplement page between cover and photo pages in PDF output

補足情報が入力されている場合のみ、表紙ページの直後に独立した補足ページを
挿入し、写真ページのページ番号フッターにオフセットを反映するようにした。
EOF
)"
```

---

### Task 3: 統合確認

**Files:**
- Modify: `Construction photos/index.html:34-39`（更新コメント）

**Interfaces:**
- Consumes: Task 1〜2 の全機能
- Produces: なし（検証と記録のみ）

- [ ] **Step 1: index.html の更新コメントに今回の変更を追記**

`Construction photos/index.html` の既存コメントブロック（39行目、2026-07-07その2の複数選択機能コメントの直後）に以下を追加する。

```html
  <!--
    === 更新内容 (2026-07-07その3) ===
    - 工事報告補足入力: 表紙タブに「補足情報」textareaを追加
    - PDF/プレビュー出力: 補足情報が入力されている場合のみ、
      表紙ページと写真ページの間に独立した補足ページを挿入
    - 写真ページのページ番号フッターに補足ページ分のオフセットを反映
  -->
```

- [ ] **Step 2: フルフロー動作確認**

Playwright MCP で以下のシナリオを通しで確認する:
1. `http://localhost:8170/Construction%20photos/index.html?cb=1` を開く
2. 表紙タブで現場名・工事内容・補足情報（複数行）を入力
3. 写真管理タブで写真を4枚アップロード（1ページ3枚のため2ページに分かれる想定）
4. プレビュー更新をクリックし、ページ順序が「表紙 → 補足 → 写真ページ1 → 写真ページ2」になっていることを確認
5. 写真ページ1のフッターが「3 / 4 ページ」、写真ページ2のフッターが「4 / 4 ページ」になっていることを確認
6. 補足情報を空にしてプレビュー更新し、補足ページが消え、フッターが「2 / 3 ページ」「3 / 3 ページ」に更新されることを確認
7. ページをリロードし、補足情報・表紙情報が正しく復元されることを確認
8. `browser_console_messages` で全体を通してエラーがないことを確認

- [ ] **Step 3: サーバー停止**

```bash
pkill -f "http.server 8170" 2>/dev/null; echo done
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
docs: note supplement page feature in index.html update log
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** 補足情報のデータモデル・表紙タブUI(Task 1)、PDF独立ページとしての挿入・空欄時のスキップ・ページ番号整合性(Task 2)を全てカバー。スコープ外とした「複数欄化」「補足ページの複数ページ分割」は対象タスクなし（仕様書通り）。
- **Placeholder scan:** 全ステップに具体的なコード・コマンドを記載済み。TBD/TODOなし。
- **Type consistency:** `cover.supplement: string` の型はTask 1〜2で統一。`buildReportPage` の追加引数 `frontPageCount` はTask 2内で一貫（デフォルト値 `1` を持たせ、既存呼び出し箇所との後方互換を確保）。関数名 `buildSupplementPage` はTask 2〜3で一貫して使用。
