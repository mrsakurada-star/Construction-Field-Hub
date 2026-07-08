# Construction photos — 写真管理タブでのカード直接ドラッグ並び替え 設計

## 背景

引継ぎメモ（2026-07-06）にあった次回作業候補3件のうち、「複数選択削除/並び替え」（`docs/superpowers/specs/2026-07-07-construction-photos-multi-select-design.md`）と「カバー→補足フォーム挿入」（`docs/superpowers/specs/2026-07-07-construction-photos-supplement-page-design.md`）は実装済み。残る「写真の並び替え」は、別ページ（`reorder.html`）でのドラッグ&ドロップと、カードの上下矢印ボタン（`movePhoto`）でのみ対応済みで、写真管理タブ本体でカードを直接ドラッグして並び替える手段がなかった。本設計はこれを埋める。

## 要件

- 写真管理タブの `.photo-item` カードを直接ドラッグし、任意の位置にドロップして並び順を変更できる。
- ドロップ先が別の工程/phaseグループに属するカードだった場合、ドラッグ元の `processId`/`phase` をドロップ先に合わせて変更する（グループ間移動も1操作で完結させる。ユーザー承認済み仕様）。
- 工程セクションヘッダーへのドロップ（工程割当てのみ・位置指定なし）は既存のまま維持する。空グループ（写真0枚）への割当て手段として引き続き機能させる。

## データモデル

- 新規のデータ構造は不要。既存の `photos[]` 配列（`id`, `processId`, `phase` 等を持つ）をそのまま操作する。
- グルーピング表示（`renderPhotoList()`）は `processId × phase` で分類するが、同一グループ内の表示順序は配列内の相対順序と一致する。したがって「ドラッグ元を配列から取り出し、ドロップ先の隣に再挿入する」だけで、同一グループ内の並び替え・グループ間移動の両方が実現できる。

## 振る舞い

### イベント登録（`buildPhotoCard(p)` / `js/photo.js`）

各 `.photo-item` カードに以下を追加登録する（`dragstart`/`dragend` は既存の `onPhotoCardDragStart`/`onPhotoCardDragEnd` を流用）:

- `dragover`: カード矩形の中央より上半分にカーソルがあれば「上に挿入」、下半分なら「下に挿入」と判定し、他カードの挿入インジケータを解除したうえで `.drag-over-top` / `.drag-over-bottom` を付与する。
- `dragleave`: このカードのインジケータクラスを除去する。
- `drop`: インジケータクラスを除去し、下記の並び替え処理を実行する。

### 並び替え処理

1. `dragPhotoId`（ドラッグ中の写真id）とドロップ先カードの写真idが同一なら no-op で終了する。
2. `photos` 配列からドラッグ元の写真オブジェクトを `splice` で取り除く。
3. ドロップ先写真オブジェクトの `processId`/`phase` をドラッグ元にコピーする（グループ間移動）。
4. 取り除いた後の配列内でのドロップ先の位置を再計算し、`dragover` で判定した上/下に応じて直前 or 直後に `splice` で再挿入する。
5. `saveToStorage()` → `renderPhotoList()` → `updatePreview()` を呼び、永続化・再描画する。

### 既存動作の維持

- 工程セクションヘッダーへのドロップ（`onProcessHeaderDrop`）は変更しない。カード単位の位置指定より粗い「工程への割当てのみ」の手段として、特に空グループ（表示するカードが無い）への移動手段に使う。
- 上下矢印ボタン（`movePhoto`）・phaseタブボタン（`setPhotoPhase`）・複数選択の一括削除/移動は変更しない。

## UI/CSS

- `.photo-item.drag-over-top`: カード上端に `--stamp` トークン色の強調ボーダーを表示。
- `.photo-item.drag-over-bottom`: カード下端に同様の強調ボーダーを表示。
- 既存の `.process-section-header.drag-over` と統一感のあるスタイル（`--stamp`/`--stamp-soft` トークン、transition 0.15s）で実装する。

## エラーハンドリング

- 自分自身へのドロップは no-op（配列操作を行わない）。
- `dragPhotoId` が null（ドラッグ操作が正しく開始されていない）場合は no-op。

## 対象外（スコープ外）

- タッチデバイスでのドラッグ操作対応（既存の工程割当てD&Dも同様に非対応のため、今回も対象外）。
- 複数選択中のカードをまとめてドラッグして並び替える機能（「複数選択」機能は削除/移動専用として実装済み。ドラッグ並び替えは単体カード操作に限定する）。
- `reorder.html` 側の変更（対象外・現状のまま）。
