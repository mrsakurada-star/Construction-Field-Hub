# Construction photos — 工程ごとの改ページ（PDF/プレビュー）と reorder.html の工程バッジ表示 設計

## 背景

ユーザーから2件の改修依頼があった。

1. `Construction photos/index.html`（PDF/プレビュー出力）: 工程ごとに改ページしてほしい。
2. `Construction photos/reorder.html`（並べ替え専用ページ）: 工程ごとに写真を区別できるようにしてほしい。説明欄（`desc`）も見えるようにしてほしい。

現状調査の結果:

- PDF/プレビュー（`js/renderer.js` の `updatePreview()`）は、工程→前中後→元の相対順序でソート済みの写真列を、工程境界を無視して単純に3枚区切りでページ化している。そのため1ページに2工程の写真が混在することがある。
- `reorder.html`（`js/reorder.js`）は `localStorage` の `photosMeta` から `id`, `src`, `title`, `name`, `date` のみを読み込んでおり、`desc`・`processId`・`phase`・`processes` を一切利用していない（`photosMeta` 自体には既に保存されている）。カードには工程情報も説明文も表示されない。
- `reorder.html` のドラッグ&ドロップは「表示順」を並べ替えるが、PDF出力は工程→前中後を優先してソートするため、実際には**同一工程・同一前中後グループ内での微調整としてのみ**印刷結果に反映される（工程をまたぐドラッグは印刷順に影響しない）。

## 要件

### 1. PDF/プレビュー: 工程ごとの改ページ

- 工程が切り替わる境界で必ず新しいページから開始する。
- 同一工程内の前中後ソート順・1ページ3枚のレイアウトは現状維持。
- 未分類（`processId: null`）も1つの独立したグループとして扱い、他の工程と混在させない。
- 工程内の最終ページが3枚に満たない場合は、既存通り「（写真なし）」の空欄で埋める。
- 印刷CSS（`.report-page { page-break-after: always }`）は変更不要。ページを表す `.report-page` 要素の生成単位を工程グループ単位に揃えるだけで実現する。

### 2. reorder.html: 工程バッジ表示 + 説明欄表示

- 各サムネイルカードに、その写真が属する工程名＋前中後（例:「基礎工事・前」）、または「未分類」のバッジを表示する。
- 各サムネイルカードに説明文（`desc`）を表示する（複数行対応）。
- ドラッグ&ドロップによる並び替えの挙動（1列グリッド・自由な位置への移動）は変更しない。工程をまたいで移動しても `processId`/`phase` は変更しない（現状通り、位置の並び替えのみ）。

## データモデル

- 新規のデータ構造は不要。`localStorage` の `photosMeta`（`js/storage.js` の `saveToStorage()` が既に `desc`, `processId`, `phase` を保存済み）と `processes` をそのまま `reorder.js` 側でも読み込んで利用する。
- `js/renderer.js` 側もデータモデルの変更なし。既存の `getSortedPhotosForExport()` の出力（ソート済み配列）をページ化するロジックのみ変更する。

## 振る舞い

### PDF/プレビュー側（`js/renderer.js`）

`updatePreview()` 内のページ化ロジックを、以下の2段階に変更する。

1. **工程グループ分け**: `getSortedPhotosForExport()` の出力を先頭から走査し、`getProcessNameForPhoto(p)` の返り値が変わるたびに新しいグループを開始する（ソート済みなので同一工程の写真は必ず連続している）。写真が1枚もない場合は、既存の空ページ表示を維持するため、空グループを1つ用意する。
2. **グループ内ページ化**: 各グループを独立して3枚ずつのページに分割する（`Math.ceil(group.length / 3)`、最低1ページ）。グループの先頭ページにのみ工程名を表示し、同一グループの続きのページ（2ページ目以降）は工程名欄を空にする（現状の「前ページと工程名が同じなら省略」ロジックを、グループ単位の「先頭ページのみ表示」に置き換える。結果は同じだが、工程境界とページ境界が常に一致するため実装がシンプルになる）。

`buildReportPage()` のシグネチャ・中身は変更しない（呼び出し側のページ分割ロジックのみ変更）。ページ番号・総ページ数の算出は、グループ化後の総ページ数を使う点以外は現状と同じ。

### reorder.html 側（`js/reorder.js`, `css/reorder.css`）

- `initReorder()` で `localStorage` から `data.processes` も読み込み、グローバル変数（例: `reorderProcesses`）に保持する。
- `photoItems` 構築時に `meta.desc`, `meta.processId`, `meta.phase` を追加する。
- `createCard(item, idx)` に以下を追加する:
  - 工程バッジ: `item.processId` を `reorderProcesses` から名前解決し、「工程名・前/中/後」または「未分類・前/中/後」の文字列をバッジとして表示する（`photo.js` の `PHASE_LABELS`/`PHASE_ORDER` と同じ日本語表記「前/中/後」を使う）。
  - 説明文: `item.desc` があれば `.thumb-desc` として表示する（改行を保持、CSS `white-space: pre-line` 相当）。空なら要素ごと非表示（既存の「画像なし」的な空表示パターンに合わせる）。
- CSS: `.thumb-process-badge`（バッジ）と `.thumb-desc`（説明文）を `css/reorder.css` の既存ローカルトークン（`--accent2`, `--text2`, `--border` など）で追加する。新規のハードコード色は追加しない。長い説明文でグリッドの行が極端に崩れないよう、`.thumb-desc` は3行程度で `-webkit-line-clamp` により省略表示する。

## エラーハンドリング

- `reorderProcesses` に存在しない `processId`（工程が削除された後の残留データ等）が付いた写真は「未分類」表示にフォールバックする（`photo.js` の `getProcessNameForPhoto` と同じ考え方）。
- PDF/プレビュー側で `processes` が0件（全て未分類）の場合、全写真が1つのグループになり、従来通り3枚ずつページ化される（現状と挙動は変わらない）。

## 対象外（スコープ外）

- reorder.html でのセクション分け表示・工程をまたぐドラッグでの `processId`/`phase` 変更（バッジ表示のみとし、ドラッグの挙動は変更しない。ユーザー承認済み仕様）。
- PDF出力時の前中後（phase）単位での改ページ（今回は工程単位のみ）。
- `.thumb-desc` の全文表示（3行程度で省略表示する。全文を見たい場合は写真管理タブ側で確認する想定）。
