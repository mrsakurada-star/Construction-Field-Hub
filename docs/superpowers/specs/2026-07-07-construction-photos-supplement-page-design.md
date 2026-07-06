# Construction photos — 工事報告補足入力 設計

## 背景

Construction photos（工事写真報告書作成ツール）の引継ぎメモ（2026-07-06）にある次回作業予定3件のうち、最後の1件「工事報告補足入力」の設計。工程管理機能・複数選択機能は実装済み。

## 要件

「工事内容」欄（`textarea`, 4行）は短文の概要を書く欄であるのに対し、「補足情報」欄は長文の詳細説明を書く欄として新設する。表紙タブの入力欄と、PDF/プレビュー出力での独立した新規ページの両方を追加する。

## データモデル

- `js/storage.js` の `getCoverData()` が返すオブジェクトに `supplement: string` フィールドを追加する。
- `saveToStorage()` は `photosMeta`/`processes` 等と同様、`getCoverData()` の返り値をそのまま `cover` として保存する（追加のシリアライズ処理は不要）。
- `loadFromStorage()` に `setVal('coverSupplement', c.supplement);` を追加して復元する。
- 後方互換性: 既存データ（`supplement` フィールドがない過去の保存データ）をロードした場合、`c.supplement` が `undefined` になるが、`setVal()` は値が `undefined` のときは何もしない実装（既存の他フィールドと同じ挙動）なので、`textarea` は空のままになる。追加のマイグレーション処理は不要。

## UI設計

### 表紙タブ

「工事内容」の `textarea`（`#coverWorkContent`）の直後、「工程一覧」の `section-title` の前に、以下を追加する。

- `section-title`「補足情報」
- 複数行 `textarea`（`id="coverSupplement"`, 4行程度、placeholder例: 「既設の配管を活用し...後日、完工検査を実施予定です」）
- 既存の他の表紙タブ入力欄と同様、`#tab-cover input, #tab-cover textarea` に対する共通の `input` イベントリスナー（`index.html` の `DOMContentLoaded` 内、既存のループ）で自動的に `saveToStorage()` が呼ばれる対象に含まれる（`#tab-cover` 内の要素であれば追加のイベント登録は不要）。

## PDF/プレビュー出力

### 独立ページとして挿入

- `js/renderer.js` に新規関数 `buildSupplementPage(cover)` を追加する。既存の `.report-page` クラスを使い、A4的なページレイアウトに以下を表示する:
  - 見出し「工事報告書 補足事項」
  - 本文: `cover.supplement` を改行対応で表示（既存の `.pre-line` クラスを使う。写真説明欄の複数行表示と同じ仕組み）
- `updatePreview()` で、`cover.supplement` が空文字列でない場合のみ、表紙ページ（`buildCoverPage`）の直後・写真ページ群の直前に補足ページを挿入する。空の場合は補足ページを作成しない（余計な白ページを出力しない）。

### ページ番号の整合性

現在の `buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName)` は、`pageNum`（0始まりの写真ページ番号）に対して `pageNum + 1` をフッターの分子として表示し、`totalPagesAll` は呼び出し側で `totalPages + 1`（表紙1ページ分を加算した値）として渡している。つまり現状は「表紙=1ページ目、写真ページ=2ページ目以降」という前提でページ番号を計算している。

補足ページが挿入される場合、「表紙=1ページ目、（補足ありなら）補足=2ページ目、写真ページ=以降」という前提に変える。具体的には:

- `updatePreview()` で `hasSupplement = !!(cover.supplement && cover.supplement.trim())` を判定し、`frontPageCount = 1 + (hasSupplement ? 1 : 0)`（表紙1ページ＋補足ページの有無）を求める。
- `buildReportPage` のシグネチャに `frontPageCount` を追加: `buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName, frontPageCount)`。関数内部のフッター行を `${pageNum + frontPageCount} / ${totalPagesAll} ページ` に変更する（現状の固定値 `pageNum + 1` を置き換える）。
- 呼び出し側で `totalPagesAll` は `totalPages + frontPageCount` として渡す。
- 補足ページ自体（`buildSupplementPage`）にはページ番号フッターを表示しない（表紙ページに現在ページ番号フッターがないのと同様の扱いとする）。

## 対象外（スコープ外）

- 補足情報の複数欄化（工事内容と統合した1つのリッチテキストにする等）は対象外。自由記述の単一 `textarea` のみ。
- 補足ページが1ページに収まらない場合の複数ページ分割は対象外（既存の表紙ページ・写真ページも同様にA4固定・自動改ページ機能はないため、既存の制約を踏襲する）。
