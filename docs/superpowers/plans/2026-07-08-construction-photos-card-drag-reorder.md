# Construction photos 写真管理タブでのカード直接ドラッグ並び替え Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construction photos の写真管理タブで、`.photo-item` カードを直接ドラッグして任意の位置にドロップし、同一グループ内の並び替え・別の工程/phaseグループへの移動を1操作で行えるようにする。

**Architecture:** 既存の `photos[]` フラット配列を唯一の真実のソースとして扱う。グルーピング表示（`renderPhotoList()`）は配列の相対順序をそのまま group 内順序として使うため、「ドラッグ元を配列から取り出し、ドロップ先の隣に再挿入する」だけで並び替え・グループ間移動の両方が実現できる。既存の工程割当てD&D（`onProcessHeaderDragOver`/`onProcessHeaderDrop`、カードの `dragstart`/`dragend`）はそのまま維持し、カード同士のドラッグ用に `dragover`/`dragleave`/`drop` を追加登録する。

**Tech Stack:** Vanilla JS (ES6+), CSS custom properties。ビルドツール・テストランナーなし。検証は `python -m http.server` + `mcp__plugin_superpowers-chrome_chrome__use_browser`（Chrome CDPベースのブラウザ操作ツール）で行う。

## Global Constraints

- ビルドステップなし。全ファイルはブラウザに直接読み込まれる素の HTML/CSS/JS のまま。
- 既存のデザイントークン（`css/style.css` の `:root` 内 `--stamp`, `--stamp-soft`, `--rule-soft` 等）以外の新規カラー値をハードコードしない。
- インラインスタイルを新規追加しない。CSS クラスを使う。
- 工程セクションヘッダーへのドロップ（`onProcessHeaderDrop`）は変更しない。空グループへの割当て手段として維持する。
- 上下矢印ボタン（`movePhoto`）・phaseタブボタン（`setPhotoPhase`）・複数選択の一括削除/移動（`docs/superpowers/plans/2026-07-07-construction-photos-multi-select.md`）は変更しない。
- 自分自身へのドロップ、および `dragPhotoId === null` の場合は no-op とする。
- タッチデバイス対応・複数選択カードの一括ドラッグは対象外（仕様書 `docs/superpowers/specs/2026-07-08-construction-photos-card-drag-reorder-design.md` のスコープ外節を参照）。
- 各タスク完了後、`python -m http.server <port>` を起動し、`mcp__plugin_superpowers-chrome_chrome__use_browser` の `navigate`/`eval`/`drag_drop`/`get_console_messages` で実際に動作確認する。コンソールエラーが出ないことを確認する。
- 仕様書: `docs/superpowers/specs/2026-07-08-construction-photos-card-drag-reorder-design.md`

---

## File Structure

| ファイル | 変更内容 |
|---|---|
| `Construction photos/js/photo.js` | 挿入位置判定ヘルパー、`dragover`/`dragleave`/`drop` ハンドラ、`buildPhotoCard` への登録追加 |
| `Construction photos/css/style.css` | `.drag-over-top`/`.drag-over-bottom` インジケータスタイルを追加 |
| `Construction photos/index.html` | 更新内容コメントに追記 |

新規ファイルは作成しない。

---

### Task 1: 挿入位置インジケータ（CSS + dragover/dragleave）

**Files:**
- Modify: `Construction photos/css/style.css:416-418`（`.photo-item.dragging` の直後）
- Modify: `Construction photos/js/photo.js:254-260`（`buildPhotoCard` 冒頭のイベント登録）
- Modify: `Construction photos/js/photo.js:321-352`（「工程セクションへの D&D」セクション、`onPhotoCardDragEnd` の直後に追加）

**Interfaces:**
- Consumes: 既存の `dragPhotoId`（`js/photo.js:323`）, `onPhotoCardDragStart`/`onPhotoCardDragEnd`
- Produces:
  - `function isDragOverTopHalf(e, el): boolean` — カード矩形の上半分にカーソルがあるか判定する共通ヘルパー（Task 2 の `drop` 処理からも使う）
  - `function onPhotoCardDragOver(e): void` — 各カードの `dragover` に登録
  - `function onPhotoCardDragLeave(): void` — 各カードの `dragleave` に登録
  - `function onPhotoCardDrop(e): void` — 各カードの `drop` に登録するスタブ（本体は Task 2 で実装）
  - CSS クラス `.drag-over-top` / `.drag-over-bottom`

- [ ] **Step 1: css/style.css にインジケータスタイルを追加**

`Construction photos/css/style.css` の `.photo-item.dragging`（416-418行目）の直後に以下を追加する。

```css
    .photo-item.drag-over-top {
      border-top: 3px solid var(--stamp);
    }

    .photo-item.drag-over-bottom {
      border-bottom: 3px solid var(--stamp);
    }
```

- [ ] **Step 2: photo.js に isDragOverTopHalf ヘルパーと dragover/dragleave/drop(スタブ) ハンドラを追加**

`Construction photos/js/photo.js` の `onPhotoCardDragEnd` 関数（332-335行目）の直後に以下を追加する。

```js
/** カード矩形の上半分にカーソルがあるかを判定する（dragover のインジケータ表示・drop の挿入位置決定の両方から使う） */
function isDragOverTopHalf(e, el) {
  const rect = el.getBoundingClientRect();
  return (e.clientY - rect.top) < rect.height / 2;
}

function onPhotoCardDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (dragPhotoId === null || parseInt(this.dataset.photoId) === dragPhotoId) return;

  document.querySelectorAll('.photo-item.drag-over-top, .photo-item.drag-over-bottom').forEach(el => {
    if (el !== this) el.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  const topHalf = isDragOverTopHalf(e, this);
  this.classList.toggle('drag-over-top', topHalf);
  this.classList.toggle('drag-over-bottom', !topHalf);
}

function onPhotoCardDragLeave() {
  this.classList.remove('drag-over-top', 'drag-over-bottom');
}

function onPhotoCardDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over-top', 'drag-over-bottom');
  // Task 2 で並び替え本体を実装
}
```

- [ ] **Step 3: buildPhotoCard にイベント登録を追加**

`Construction photos/js/photo.js` の `buildPhotoCard` 関数冒頭（254-260行目）を以下に置き換える。

```js
function buildPhotoCard(p) {
  const div = document.createElement('div');
  div.className = 'photo-item';
  div.draggable = true;
  div.dataset.photoId = String(p.id);
  div.addEventListener('dragstart', onPhotoCardDragStart);
  div.addEventListener('dragend', onPhotoCardDragEnd);
  div.addEventListener('dragover', onPhotoCardDragOver);
  div.addEventListener('dragleave', onPhotoCardDragLeave);
  div.addEventListener('drop', onPhotoCardDrop);
```

- [ ] **Step 4: ブラウザで動作確認**

```bash
python -m http.server 8161 > /tmp/http161.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で以下を確認する:

1. `navigate` で `http://localhost:8161/Construction%20photos/index.html` を開く
2. `eval` で実際のアップロード処理を経由せず、テスト用の写真データを直接注入して描画する（ファイルアップロードのcanvas処理を避けるため）:

```js
photos.push(
  { id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', name: 'a.jpg', date: '2026-07-01', exifDate: null, title: '', desc: '', processId: null, phase: 'before' },
  { id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', name: 'b.jpg', date: '2026-07-02', exifDate: null, title: '', desc: '', processId: null, phase: 'before' },
  { id: nextId++, src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7', name: 'c.jpg', date: '2026-07-03', exifDate: null, title: '', desc: '', processId: null, phase: 'before' }
);
switchTab('photos', document.querySelectorAll('.tab-btn')[1]);
renderPhotoList();
photos.map(p => p.name);
```

期待値: `["a.jpg", "b.jpg", "c.jpg"]`

3. `eval` で `dragPhotoId` を1枚目に設定し、3枚目のカード上端付近への合成 `dragover` イベントでインジケータが立つことを確認する:

```js
dragPhotoId = photos[0].id;
const target = document.querySelector('[data-photo-id="' + photos[2].id + '"]');
const rect = target.getBoundingClientRect();
const evt = new DragEvent('dragover', { bubbles: true, cancelable: true, clientY: rect.top + 2, dataTransfer: new DataTransfer() });
target.dispatchEvent(evt);
[target.classList.contains('drag-over-top'), target.classList.contains('drag-over-bottom')];
```

期待値: `[true, false]`

4. 同じカードの下端付近に対して同様に発火し、`drag-over-bottom` に切り替わることを確認する:

```js
const evt2 = new DragEvent('dragover', { bubbles: true, cancelable: true, clientY: rect.bottom - 2, dataTransfer: new DataTransfer() });
target.dispatchEvent(evt2);
[target.classList.contains('drag-over-top'), target.classList.contains('drag-over-bottom')];
```

期待値: `[false, true]`

5. `dragleave` を発火してクラスが消えることを確認する:

```js
target.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));
[target.classList.contains('drag-over-top'), target.classList.contains('drag-over-bottom')];
```

期待値: `[false, false]`

6. `get_console_messages` でエラーがないことを確認する（`favicon.ico` の404は許容）

- [ ] **Step 5: Commit**

```bash
git add "Construction photos/js/photo.js" "Construction photos/css/style.css" && git commit -m "$(cat <<'EOF'
feat: add drag-over insertion indicator for photo cards

写真カードへのドラッグオーバー時に、上半分/下半分どちらに挿入されるかを
ボーダーで可視化するインジケータを追加。並び替え本体は次コミットで実装。
EOF
)"
```

---

### Task 2: ドロップ時の並び替え・グループ間移動ロジック

**Files:**
- Modify: `Construction photos/js/photo.js`（Task 1 の `onPhotoCardDrop` スタブを完全実装に置き換え）

**Interfaces:**
- Consumes: Task 1 の `isDragOverTopHalf(e, el)`, `dragPhotoId`, 既存の `photos[]`, `saveToStorage()`, `renderPhotoList()`, `updatePreview()`
- Produces: `function onPhotoCardDrop(e): void` — Task 1 のスタブを置き換える完全実装

- [ ] **Step 1: onPhotoCardDrop を完全実装に置き換え**

`Construction photos/js/photo.js` の `onPhotoCardDrop` スタブ（Task 1 の Step 2 で追加）を以下に置き換える。

```js
function onPhotoCardDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over-top', 'drag-over-bottom');

  const targetId = parseInt(this.dataset.photoId);
  if (dragPhotoId === null || dragPhotoId === targetId) return;

  const dragIdx = photos.findIndex(p => p.id === dragPhotoId);
  if (dragIdx === -1) return;
  const [dragged] = photos.splice(dragIdx, 1);

  const target = photos.find(p => p.id === targetId);
  if (!target) return; // ドラッグ元自身が対象だった場合は splice 済みで target が消えている

  dragged.processId = target.processId;
  dragged.phase = target.phase;

  const targetIdx = photos.findIndex(p => p.id === targetId);
  const insertAt = isDragOverTopHalf(e, this) ? targetIdx : targetIdx + 1;
  photos.splice(insertAt, 0, dragged);

  saveToStorage();
  renderPhotoList();
  updatePreview();
}
```

- [ ] **Step 2: ブラウザで動作確認**

```bash
python -m http.server 8162 > /tmp/http162.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で以下を確認する:

1. `navigate` で `http://localhost:8162/Construction%20photos/index.html` を開く
2. `eval` で Task 1 と同じ3枚のテスト用写真（`a.jpg`, `b.jpg`, `c.jpg`、全て `processId: null, phase: 'before'`）を注入し、`renderPhotoList()` を呼ぶ
3. `eval` で合成 `dragstart` → `drop` イベントにより「a.jpg を c.jpg の下半分にドロップ」を再現し、順序が `["b.jpg", "c.jpg", "a.jpg"]` になることを確認する:

```js
const a = photos.find(p => p.name === 'a.jpg');
const c = photos.find(p => p.name === 'c.jpg');
const aEl = document.querySelector('[data-photo-id="' + a.id + '"]');
const cEl = document.querySelector('[data-photo-id="' + c.id + '"]');
aEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
const rect = cEl.getBoundingClientRect();
cEl.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientY: rect.bottom - 2, dataTransfer: new DataTransfer() }));
photos.map(p => p.name);
```

期待値: `["b.jpg", "c.jpg", "a.jpg"]`

4. 表紙タブで工程を1つ追加（例: 「基礎工事」）してから写真管理タブへ戻り、`eval` で b.jpg を「基礎工事・中」グループの c.jpg（先に `setPhotoProcess`/`setPhotoPhase` 相当で c.jpg をそのグループへ移しておく）へドラッグ&ドロップし、b.jpg の `processId`/`phase` が c.jpg と一致することを確認する:

```js
const proc = processes[0];
c.processId = proc.id; c.phase = 'during';
renderPhotoList();
const bEl = document.querySelector('[data-photo-id="' + photos.find(p => p.name === 'b.jpg').id + '"]');
const cEl2 = document.querySelector('[data-photo-id="' + c.id + '"]');
bEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
const rect2 = cEl2.getBoundingClientRect();
cEl2.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientY: rect2.top + 2, dataTransfer: new DataTransfer() }));
const b = photos.find(p => p.name === 'b.jpg');
[b.processId === proc.id, b.phase === 'during'];
```

期待値: `[true, true]`

5. 自分自身へのドロップが no-op であることを確認する（ドラッグ元とドロップ先が同じ要素で `photos` の順序・件数が変化しない）
6. `get_console_messages` でエラーがないことを確認する

- [ ] **Step 3: Commit**

```bash
git add "Construction photos/js/photo.js" && git commit -m "$(cat <<'EOF'
feat: implement photo card drag-and-drop reordering

写真カードをドラッグしてドロップ先の前後に再挿入することで、同一グループ内の
並び替え・別の工程/phaseグループへの移動を1操作で行えるようにした。
EOF
)"
```

---

### Task 3: 統合確認・changelog更新

**Files:**
- Modify: `Construction photos/index.html:40-46`（更新内容コメント）

**Interfaces:**
- Consumes: Task 1〜2 の全機能
- Produces: なし（記録・実機での最終確認のみ）

- [ ] **Step 1: index.html の更新コメントに追記**

`Construction photos/index.html` の既存コメントブロック（40-46行目、2026-07-07その3のコメントの直後）に以下を追加する。

```html
  <!--
    === 更新内容 (2026-07-08) ===
    - 写真管理タブ: 写真カードを直接ドラッグして並び替えられるように変更
    - ドラッグ先が別の工程/前中後グループの場合、そのグループへ移動しつつ
      指定位置に挿入する（工程ヘッダーへのドロップによる割当てとは独立して機能）
  -->
```

- [ ] **Step 2: 実際のファイルアップロードを含むフルフロー確認**

```bash
python -m http.server 8163 > /tmp/http163.log 2>&1 &
```

`mcp__plugin_superpowers-chrome_chrome__use_browser` で以下を通しで確認する:

1. `navigate` で `http://localhost:8163/Construction%20photos/index.html` を開く
2. 表紙タブで工程を2つ追加（「基礎工事」「配管工事」）
3. 写真管理タブに切り替え、`file_upload` で `Construction photos/js` フォルダ内の任意の小さな画像ではなく、`Construction Field Hub` リポジトリ内の適当な既存画像（無ければ `eval` でCanvasから生成した小さなJPEG dataURLを `<input type="file">` に `File` オブジェクトとしてセットするのではなく）— 画像ファイルが手元に無い場合は Task 1/2 と同様に `eval` で `photos` に3〜4枚を直接注入して `renderPhotoList()` を呼ぶ簡易ルートで代替してよい
4. `drag_drop` アクション（`selector: '[data-photo-id="<id>"]'`, `payload: {target: '[data-photo-id="<別のid>"]'}`）で実際のネイティブD&D操作により1枚を別の位置へドラッグし、`eval` で `photos.map(p => p.name)` の順序が意図通りになったことを確認する
5. 同様に `drag_drop` で異なる工程グループの写真へドロップし、`processId`/`phase` が移動先に合わせて更新されたことを確認する
6. 上下矢印ボタン（`movePhoto`）・phaseタブ・複数選択の一括削除/移動を操作し、リグレッションがないことを確認する
7. `get_console_messages` で全体を通してエラーがないことを確認する

- [ ] **Step 3: サーバー停止**

```bash
pkill -f "http.server 816" 2>/dev/null; echo done
```

- [ ] **Step 4: Commit**

```bash
git add "Construction photos/index.html" && git commit -m "$(cat <<'EOF'
docs: note photo card drag-reorder feature in index.html update log
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** 挿入位置インジケータ(Task 1)、同一グループ内並び替え(Task 2 Step 2-3)、グループ間移動(Task 2 Step 4)、自分自身へのドロップ・`dragPhotoId === null` の no-op(Task 2 Step 5)、工程ヘッダードロップ/上下ボタン/phaseタブ/複数選択の非変更確認(Task 3 Step 2-6)を全てカバー。スコープ外とした「タッチ対応」「複数選択の一括ドラッグ」「reorder.html側の変更」は対象タスクなし（仕様書通り）。
- **Placeholder scan:** 全ステップに具体的なコード・コマンドを記載済み。TBD/TODOなし。
- **Type consistency:** `isDragOverTopHalf(e, el): boolean` の呼び出し方は Task 1（インジケータ表示）と Task 2（挿入位置決定）で同一シグネチャ。`onPhotoCardDrop(e)` は Task 1 でスタブ登録・Task 2 で完全実装に置き換えるのみで、関数名・登録先（`buildPhotoCard` 内の `div.addEventListener('drop', onPhotoCardDrop)`）は変更しない。
