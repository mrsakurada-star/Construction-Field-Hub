# Construction photos 写真の複数選択機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construction photos の写真管理タブに、チェックボックスによる複数選択・選択写真の一括削除・選択写真の一括工程/phase移動を追加する。

**Architecture:** 既存の vanilla JS グローバル関数構成を維持する。新規グローバル `Set` `selectedPhotoIds` で選択状態をセッション内のみ保持し（永続化しない）、`renderPhotoList()` 実行のたびに現存する写真 id との積を取って自動整合させる。一括操作は既存の単体操作関数（`removePhoto`, `setPhotoProcess`+`setPhotoPhase` 相当のロジック）と同じ副作用（IndexedDB削除、`saveToStorage`、再描画）を選択id配列に対してループ適用する形で実装する。

**Tech Stack:** Vanilla JS (ES6+), CSS custom properties。テストランナー・ビルドツールなし。検証は `python3 -m http.server` + Playwright MCP でのブラウザ実操作による目視・DOM確認で行う。

## Global Constraints

- ビルドステップなし。全ファイルはブラウザに直接読み込まれる素の HTML/CSS/JS のまま。
- 既存のデザイントークン（`css/style.css` の `:root` 内 `--paper`, `--surface`, `--surface2`, `--rule`, `--rule-soft`, `--ink`, `--ink2`, `--stamp`, `--stamp-soft`, `--ok`, `--ok-soft`）以外の新規カラー値をハードコードしない。
- インラインスタイル (`style="..."`) を新規追加しない。CSS クラスを使う。
- `selectedPhotoIds` は `localStorage`/IndexedDB に保存しない（セッション内のみ、ページリロードでリセットされる）。
- 一括削除・一括移動の実行完了後にのみ `selectedPhotoIds` を自動クリアする。タブ切替・個別操作（phase切替、D&D、写真追加、単体削除、上下移動）では選択状態を維持する。
- `renderPhotoList()` 実行時、`selectedPhotoIds` から現存しない写真 id を除去する防御的処理を必ず入れる（削除後の再描画で不整合が起きないようにするため）。
- 各タスク完了後、`python3 -m http.server <port> --directory "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub"` を起動し、Playwright MCP (`browser_navigate`, `browser_snapshot`, `browser_evaluate`, `browser_console_messages`) で実際に動作確認する。コンソールエラーが出ないことを確認する。
- 仕様書: `docs/superpowers/specs/2026-07-07-construction-photos-multi-select-design.md`
- 前提: 工程管理機能（`processes` 配列、`renderPhotoList()` のグルーピング表示、`buildPhotoCard(p)`、`setPhotoPhase`/`setPhotoProcess`）は実装済み（`docs/superpowers/plans/2026-07-07-construction-photos-process-management.md` 参照）。

---

## File Structure

| ファイル | 変更内容 |
|---|---|
| `Construction photos/js/photo.js` | `selectedPhotoIds` 追加、`buildPhotoCard` にチェックボックス追加、選択トグル関数、一括削除・一括移動関数、フローティングバー描画関数を追加 |
| `Construction photos/index.html` | 写真管理タブに一括操作バーのコンテナ（空div）を追加 |
| `Construction photos/css/style.css` | チェックボックス・フローティングバーのスタイルを追加 |

新規ファイルは作成しない。

---

### Task 1: 選択状態のデータモデルとチェックボックスUI

**Files:**
- Modify: `Construction photos/js/photo.js:111-165`（`PHASE_LABELS`/`PHASE_ORDER` 定義の前、`renderPhotoList` 関数）
- Modify: `Construction photos/js/photo.js:167-212`（`buildPhotoCard` 関数）
- Modify: `Construction photos/css/style.css`（`.photo-item-header` 定義の近く、326行目付近）

**Interfaces:**
- Consumes: 既存の `photos[]`, `renderPhotoList()`, `buildPhotoCard(p)`
- Produces:
  - グローバル `selectedPhotoIds = new Set()`
  - `function togglePhotoSelection(id: number, checked: boolean): void` — 選択状態を更新し、`renderSelectionToolbar()` を呼ぶ
  - `function renderSelectionToolbar(): void` — 選択件数に応じてツールバー表示を切り替える（Task 2 で本体を実装、この Task では空実装のスタブとして宣言してよい）
  - `buildPhotoCard(p)` はチェックボックス（`<input type="checkbox" class="photo-select-checkbox" data-photo-id="${p.id}">`、`checked` 属性は `selectedPhotoIds.has(p.id)` に応じて付与）を `photo-item-header` 内、サムネイルの直前に追加する

- [ ] **Step 1: selectedPhotoIds とチェックボックス関連関数を追加**

`Construction photos/js/photo.js` の111行目（`const PHASE_LABELS = ...` の直前）に以下を追加する。

```js
// 複数選択機能: セッション内のみ保持し、localStorage/IndexedDB には保存しない
const selectedPhotoIds = new Set();

/** チェックボックスの状態変化を selectedPhotoIds に反映する */
function togglePhotoSelection(id, checked) {
  if (checked) selectedPhotoIds.add(id);
  else selectedPhotoIds.delete(id);
  renderSelectionToolbar();
}

/** 選択状態に応じてフローティングツールバーの表示を更新する（本体は Task 2 で実装） */
function renderSelectionToolbar() {
  // Task 2 で実装
}

```

- [ ] **Step 2: renderPhotoList の先頭で selectedPhotoIds を現存写真と整合させる**

`Construction photos/js/photo.js` の `renderPhotoList` 関数冒頭（`const list = document.getElementById('photoList');` の直後）に1行追加する。

```js
function renderPhotoList() {
  const list = document.getElementById('photoList');
  list.innerHTML = '';

  // 削除済み写真の id が selectedPhotoIds に残らないようにする
  const existingIds = new Set(photos.map(p => p.id));
  Array.from(selectedPhotoIds).forEach(id => { if (!existingIds.has(id)) selectedPhotoIds.delete(id); });
```

（既存の2行 `const list = ...` と `list.innerHTML = '';` は残したまま、その直後に上記の防御的処理を挿入する。）

- [ ] **Step 3: buildPhotoCard にチェックボックスを追加**

`Construction photos/js/photo.js` の `buildPhotoCard` 関数内、`photo-item-header` の中身（182-197行目）を以下に置き換える。

```js
  div.innerHTML = `
    <div class="photo-item-header">
      <input type="checkbox" class="photo-select-checkbox" data-photo-id="${p.id}" ${selectedPhotoIds.has(p.id) ? 'checked' : ''} onchange="togglePhotoSelection(${p.id}, this.checked)" aria-label="この写真を選択">
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
```

- [ ] **Step 4: css/style.css にチェックボックスのスタイルを追加**

`Construction photos/css/style.css` の `.photo-item-header`（326-330行目）の直後に以下を追加する。

```css
    .photo-select-checkbox {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      cursor: pointer;
      accent-color: var(--stamp);
    }
```

- [ ] **Step 5: ブラウザで動作確認**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && python3 -m http.server 8150 > /tmp/http150.log 2>&1 &
```

Playwright MCP で `http://localhost:8150/Construction%20photos/index.html` を開き、`browser_evaluate` で以下を確認する:
1. 写真を1枚アップロードし（scratchpad に最小限のテスト用JPEGを生成して使う）、`.photo-select-checkbox` が写真カードのヘッダーに表示されていること
2. チェックボックスをクリックし、`selectedPhotoIds` に id が追加されること（`browser_evaluate` で `[...selectedPhotoIds]` を確認）
3. 再度クリックして解除すると `selectedPhotoIds` から除去されること
4. `browser_console_messages` でエラーがないこと（`favicon.ico` の404は許容）

- [ ] **Step 6: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/js/photo.js" "Construction photos/css/style.css" && git commit -m "$(cat <<'EOF'
feat: add photo selection checkboxes

写真カードにチェックボックスを追加し、selectedPhotoIds（セッション内のみ）で
複数選択状態を管理できるようにした。
EOF
)"
```

---

### Task 2: フローティング一括操作バー（削除・工程移動）

**Files:**
- Modify: `Construction photos/index.html:120-121`（`.photo-list` の直前に一括操作バーのコンテナを追加）
- Modify: `Construction photos/js/photo.js`（`renderSelectionToolbar` の実装、一括削除・一括移動関数を追加）
- Modify: `Construction photos/css/style.css`（フローティングバーのスタイルを追加）

**Interfaces:**
- Consumes: Task 1 の `selectedPhotoIds`, `togglePhotoSelection`, 既存の `processes`, `PHASE_LABELS`, `PHASE_ORDER`, `removePhoto`, `setPhotoProcess`, `setPhotoPhase`, `saveToStorage`, `renderPhotoList`, `updatePreview`
- Produces:
  - `function renderSelectionToolbar(): void` — Task 1 のスタブを置き換える完全実装
  - `function clearSelection(): void`
  - `function bulkDeleteSelected(): void`
  - `function bulkMoveSelected(): void` — `#bulkMoveProcessSelect`/`#bulkMovePhaseSelect` の値を読んで一括適用する

- [ ] **Step 1: index.html に一括操作バーのコンテナを追加**

`Construction photos/index.html` の120行目（`<div class="photo-list" id="photoList"></div>` の直前）に以下を追加する。

```html
          <div class="selection-toolbar" id="selectionToolbar" hidden>
            <span class="selection-count" id="selectionCount">0枚選択中</span>
            <button class="btn btn-outline" type="button" onclick="clearSelection()">選択を解除</button>
            <select id="bulkMoveProcessSelect" aria-label="移動先の工程"></select>
            <select id="bulkMovePhaseSelect" aria-label="移動先の状態">
              <option value="before">前</option>
              <option value="during">中</option>
              <option value="after">後</option>
            </select>
            <button class="btn btn-outline" type="button" onclick="bulkMoveSelected()">
              <i data-lucide="move"></i>移動
            </button>
            <button class="btn btn-danger" type="button" onclick="bulkDeleteSelected()">
              <i data-lucide="trash-2"></i>削除
            </button>
          </div>
          <div class="photo-list" id="photoList"></div>
```

- [ ] **Step 2: renderSelectionToolbar を完全実装に置き換え**

`Construction photos/js/photo.js` の `renderSelectionToolbar` スタブ（Task 1 の Step 1 で追加した空実装）を以下に置き換える。

```js
/** 選択状態に応じてフローティングツールバーの表示を更新する */
function renderSelectionToolbar() {
  const toolbar = document.getElementById('selectionToolbar');
  const count = selectedPhotoIds.size;

  if (count === 0) {
    toolbar.hidden = true;
    return;
  }

  toolbar.hidden = false;
  document.getElementById('selectionCount').textContent = `${count}枚選択中`;

  // 工程プルダウンを最新の processes 一覧で再構築する
  const processSelect = document.getElementById('bulkMoveProcessSelect');
  const currentValue = processSelect.value;
  processSelect.innerHTML = '<option value="">未分類</option>' +
    processes.map(pr => `<option value="${pr.id}">${escapeHtml(pr.name)}</option>`).join('');
  // 直前の選択値が引き続き有効なら復元する
  if ([...processSelect.options].some(o => o.value === currentValue)) {
    processSelect.value = currentValue;
  }
}

/** 選択をすべて解除する */
function clearSelection() {
  selectedPhotoIds.clear();
  renderPhotoList();
}

/** 選択中の写真をまとめて削除する */
function bulkDeleteSelected() {
  if (!selectedPhotoIds.size) return;
  if (!confirm(`選択した${selectedPhotoIds.size}枚を削除しますか？`)) return;

  selectedPhotoIds.forEach(id => {
    photos = photos.filter(x => x.id !== id);
    deletePhotoSrc(id); // IndexedDB からも削除
    savedPhotoIds.delete(id);
  });
  selectedPhotoIds.clear();
  renderPhotoList();
  updatePreview();
  document.getElementById('photoCount').textContent = photos.length;
}

/** 選択中の写真をまとめて別の工程/phaseへ移動する */
function bulkMoveSelected() {
  if (!selectedPhotoIds.size) return;

  const processSelect = document.getElementById('bulkMoveProcessSelect');
  const phaseSelect = document.getElementById('bulkMovePhaseSelect');
  const targetProcessId = processSelect.value === '' ? null : parseInt(processSelect.value);
  const targetPhase = phaseSelect.value;

  selectedPhotoIds.forEach(id => {
    const p = photos.find(x => x.id === id);
    if (p) {
      p.processId = targetProcessId;
      p.phase = targetPhase;
    }
  });

  selectedPhotoIds.clear();
  saveToStorage();
  renderPhotoList();
  updatePreview();
}
```

- [ ] **Step 3: css/style.css にフローティングバーのスタイルを追加**

`Construction photos/css/style.css` の `.photo-list`（310-314行目）の直前に以下を追加する。

```css
    /* 複数選択 一括操作バー */
    .selection-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      background: var(--stamp-soft);
      border: 1.5px solid var(--stamp);
      border-radius: 4px;
      padding: 10px 12px;
      margin-bottom: 12px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .selection-toolbar[hidden] {
      display: none;
    }

    .selection-count {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink);
      margin-right: auto;
    }

    .selection-toolbar select {
      background: var(--surface);
      border: 1.5px solid var(--rule-soft);
      border-radius: 2px;
      padding: 6px 8px;
      font-size: 12px;
      color: var(--ink);
    }

    .selection-toolbar .btn {
      font-size: 12px;
      padding: 6px 10px;
    }
```

- [ ] **Step 4: ブラウザで動作確認**

Playwright MCP で以下を確認する:
1. `http://localhost:8150/Construction%20photos/index.html` を開き、テスト用写真を2枚アップロード
2. 表紙タブで工程を1つ追加（例：「基礎工事」）してから写真管理タブに戻る
3. 2枚とも選択（チェックボックスON）し、`#selectionToolbar` が表示され「2枚選択中」と出ることを確認
4. `#bulkMoveProcessSelect` に「基礎工事」の `<option>` が存在することを確認し、それを選択、`#bulkMovePhaseSelect` で「中」を選択して「移動」ボタンをクリック
5. 2枚とも `processId`/`phase` が更新され、ツールバーが非表示に戻り（`selectedPhotoIds` が空になったこと）を `browser_evaluate` で確認
6. 再度2枚を選択し「削除」ボタンをクリック。`confirm()` のネイティブダイアログが出るので、Playwright MCP の `browser_handle_dialog` ツールで `{accept: true}` を渡して承認する。`photos` が空になり `selectionToolbar` が非表示に戻ることを確認
7. `browser_console_messages` でエラーがないことを確認

- [ ] **Step 5: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/index.html" "Construction photos/js/photo.js" "Construction photos/css/style.css" && git commit -m "$(cat <<'EOF'
feat: add bulk delete and bulk process/phase move for selected photos

選択中の写真をまとめて削除、またはまとめて別の工程/phaseへ移動できる
フローティングツールバーを追加。一括操作後は選択状態を自動クリアする。
EOF
)"
```

---

### Task 3: 統合確認

**Files:**
- Modify: `Construction photos/index.html:18-33`（更新コメント）

**Interfaces:**
- Consumes: Task 1〜2 の全機能
- Produces: なし（検証と記録のみ）

- [ ] **Step 1: index.html の更新コメントに今回の変更を追記**

`Construction photos/index.html` の既存コメントブロック（33行目、2026-07-07の工程管理機能コメントの直後）に以下を追加する。

```html
  <!--
    === 更新内容 (2026-07-07その2) ===
    - 複数選択機能: 写真カードにチェックボックスを追加
    - 一括削除・一括工程/phase移動用のフローティングツールバーを追加
    - 選択状態はセッション内のみ保持（一括操作実行後に自動クリア）
  -->
```

- [ ] **Step 2: フルフロー動作確認**

Playwright MCP で以下のシナリオを通しで確認する:
1. `http://localhost:8150/Construction%20photos/index.html` を開く
2. 表紙タブで工程を2つ追加（「基礎工事」「配管工事」）
3. 写真管理タブでテスト用画像を4枚アップロード
4. 4枚のうち2枚を選択し、「基礎工事」「前」へ一括移動 → 選択が自動解除され、`processId`/`phase` が正しく更新されていることを確認
5. 残り2枚を選択し、「削除」を実行（`browser_handle_dialog` で `{accept: true}` を渡して confirm を承認）→ `photos.length` が2になり、ツールバーが非表示に戻ることを確認
6. 個別操作（phase切替タブのクリック）を行った後も、別の写真を選択した状態が維持されることを確認（Task 1〜2 のスコープ通り、個別操作では選択をクリアしない）
7. ページをリロードし、`selectedPhotoIds` が空の状態（セッション内のみのため）で正常に再描画されることを確認
8. `browser_console_messages` で全体を通してエラーがないことを確認

- [ ] **Step 3: サーバー停止**

```bash
pkill -f "http.server 8150" 2>/dev/null; echo done
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/sakuradanozomi/Documents/GitHub/Construction-Field-Hub" && git add "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
docs: note multi-select feature in index.html update log
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** チェックボックス追加(Task 1)、一括削除(Task 2)、一括工程/phase移動(Task 2)、選択状態のセッション内保持と自動整合(Task 1)、一括操作後の自動クリア(Task 2)を全てカバー。スコープ外とした「全選択ショートカット」「reorder.htmlへの追加」「選択状態の永続化」は対象タスクなし（仕様書通り）。
- **Placeholder scan:** 全ステップに具体的なコード・コマンドを記載済み。TBD/TODOなし。
- **Type consistency:** `selectedPhotoIds: Set<number>` の型はTask 1〜2で統一。関数名 `togglePhotoSelection`/`renderSelectionToolbar`/`clearSelection`/`bulkDeleteSelected`/`bulkMoveSelected` はTask間で一貫して同名を使用。Task 1 で宣言する `renderSelectionToolbar` のスタブと Task 2 で実装する本体は同一シグネチャ（引数なし）。
