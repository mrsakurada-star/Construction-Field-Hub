# Construction photos — 写真の複数選択機能 設計

## 背景

Construction photos（工事写真報告書作成ツール）の引継ぎメモ（2026-07-06）にある次回作業予定のうち、「写真の複数選択機能」の設計。工程管理機能（`docs/superpowers/specs/2026-07-07-construction-photos-process-management-design.md`）は実装済みで、写真管理タブは既に「工程×前中後」でグルーピング表示されている。

## 要件

- 各写真カードにチェックボックスを追加し、複数選択できるようにする。
- 選択した複数枚をまとめて削除できる。
- 選択した複数枚をまとめて別の工程/phaseへ一括移動できる（引継ぎメモの「まとめて並べ替え」は、グルーピング表示との整合性を踏まえてこの意味で扱う）。

## データモデル

- グローバル `Set<number> selectedPhotoIds` を新設する。写真の `id` を保持する。
- セッション内のみのUI状態であり、`localStorage`/IndexedDB には保存しない（ページリロードで選択状態はリセットされる）。
- 既存の `photos[]` 配列・写真オブジェクトの構造には変更を加えない。

## UI設計

### チェックボックス

- `buildPhotoCard(p)`（`js/photo.js`）が生成する `.photo-item-header` 内、サムネイル画像の左に `<input type="checkbox">` を常時表示する。
- チェック変更で `selectedPhotoIds` を更新し、フローティングツールバーの表示状態と件数表示を再計算する。

### フローティング一括操作バー

- `selectedPhotoIds.size > 0` のとき、写真リスト（`#photoList`）の直上に表示する。0件になったら非表示にする。
- 表示内容:
  - 「◯枚選択中」の件数表示
  - 「選択を解除」ボタン（`selectedPhotoIds` をクリアして再描画）
  - 「削除」ボタン
  - 「工程へ移動」用の工程プルダウン（登録済み工程一覧＋「未分類」）と phase プルダウン（前/中/後）、および「移動」確定ボタン

### まとめて削除

- 「削除」ボタン押下で確認ダイアログ（`confirm()`）を表示し、承認後に選択中の全 `id` について削除処理（`photos` からの除去、IndexedDB からの画像削除）を行う。既存の単体削除 `removePhoto` と同じ削除経路を、選択id配列に対してループ適用する形で実装する。
- 削除完了後、`selectedPhotoIds` をクリアし、`renderPhotoList()`・`updatePreview()`・写真件数表示を更新する。

### まとめて工程/phase移動

- 「移動」ボタン押下で、選択中の全写真の `processId`/`phase` を、プルダウンで選ばれた値に一括で上書きする（工程プルダウンで「未分類」が選ばれた場合は `processId: null`）。
- 実行後、`saveToStorage()` で永続化し、`selectedPhotoIds` をクリアして `renderPhotoList()`・`updatePreview()` を実行する。既存のグルーピング表示ロジック（`docs/superpowers/specs/2026-07-07-construction-photos-process-management-design.md` で確立済み）にそのまま反映される。

### 選択状態のクリアタイミング

- 一括削除・一括移動の実行完了後にのみ自動クリアする。
- タブ切り替え、ページリロード、個別操作（phase切替タブ、ドラッグ&ドロップでの単体工程移動、写真の新規アップロード、単体削除、上下移動）では選択状態を維持する。ただし、削除された写真の `id` が `selectedPhotoIds` に残っている場合に備え、`renderPhotoList()` 実行時に現存する `photos` の `id` 集合と `selectedPhotoIds` の積を取り、存在しない `id` を除去する防御的処理を入れる。

## 対象外（スコープ外）

- 「全選択」「工程単位の一括選択」などのショートカットは対象外（自由入力での引継ぎメモに明記がないため）。
- 並べ替えページ（reorder.html）への複数選択機能の追加は対象外。
- 選択状態の永続化（ページリロード後も選択を維持する）は対象外。
