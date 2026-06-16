<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
# 大規模現場工事指示書 作成ツール 実装計画

> 作成日: 2026-06-16
> 設計書: `docs/superpowers/specs/2026-06-16-site-work-order-design.md`

## 0. 方針

既存ツール（`Construction photos/`, `Field_Checklists/`）と同じ構成パターンを踏襲する。
- ディレクトリ名: `Site Work Order/`
- データ保存: IndexedDB（地図画像）+ localStorage（フォーム入力全体）
- A4印刷: `.agents/skills/a4_print_adjustment/SKILL.md` の方針に従う
- 構造分割: `.agents/skills/structural_modularization/SKILL.md` の方針に従う（機能別JSファイル分割）

## 1. ディレクトリ・ファイル構成

```
Site Work Order/
├── index.html          画面入力UI（表紙・地図・業者一覧・持参品・特記事項の各セクション）
├── css/
│   └── style.css        画面用 + 印刷用（@media print）スタイル
└── js/
    ├── db.js             IndexedDB初期化・地図画像CRUD（db.js を流用したパターン）
    ├── storage.js        localStorage保存・復元（フォーム全体の状態）
    ├── contractors.js     業者一覧テーブルの行追加・削除・タブ/アコーディオン生成
    ├── map.js            住所→Google Maps embed iframe生成、QRコード生成（印刷用）
    ├── checklist.js      共通チェックリスト・業者別チェックリストの項目追加・削除
    └── renderer.js       印刷用プレビューHTML生成・ページ分割制御
```

すべてのHTML/JSファイル先頭に `<!-- © 2026 Nozomi Sakurada. All rights reserved. -->` / `/* © 2026 Nozomi Sakurada. All rights reserved. */` を付与する。

## 2. データモデル

```javascript
// localStorage に保存する全体state（storage.js が管理）
{
  siteInfo: {
    projectName: "",       // 工事名／現場名
    address: "",           // 現場住所
    periodStart: "",       // 工期開始日
    periodEnd: "",         // 工期終了日
    client: "",            // 発注元
    managerName: "",       // 現場責任者名
    managerPhone: "",      // 緊急連絡先
    createdDate: "",       // 作成日
    createdBy: ""          // 作成者
  },
  mapImageId: null,        // IndexedDBに保存した地図画像のid（未アップロード時はnull）
  notes: "",               // 全体注意事項・特記事項
  commonChecklist: [        // 共通チェックリスト項目
    { id, text, checked }
  ],
  contractors: [             // 業者一覧（行データ）
    {
      id,
      name: "",             // 業者名
      area: "",             // 担当領域
      contactName: "",      // 担当者名
      contactPhone: "",     // 電話番号
      schedules: [          // 同一業者の複数日・複数工程に対応
        { id, entryDateTime: "", exitDateTime: "", processName: "" }
      ],
      individualNotes: [    // 業者別の持参指示・注意事項
        { id, text, checked } // チェックリスト形式 or 自由記述(text)兼用
      ]
    }
  ]
}
```

IndexedDB（`db.js`、`Construction photos/js/db.js` と同じ自前Promiseパターン）：
- DB名: `siteWorkOrderDB`、ストア: `mapImages`、keyPath: `id`
- `saveMapImage(id, dataUrl)` / `getMapImage(id)` / `deleteMapImage(id)`

## 3. 画面実装ステップ

### Step 1: 基本骨格
- `index.html` を作成。既存ツールと同様、タブ or アンカーセクション切替で「現場概要」「工事指示書」の2ページ相当をひと続きの画面として編集可能にする。
- `js/storage.js`: ページロード時に localStorage から state 復元、入力変更時に自動保存（既存ツールの autosave パターンに合わせる）。

### Step 2: 現場概要セクション
- フォーム入力（工事名・住所・工期・発注元・責任者名・電話・作成日・作成者）をstateにバインド。

### Step 3: 現場地図セクション（`js/map.js`）
- 住所入力 → `https://maps.google.com/maps?q=<encoded>&output=embed` のiframeを画面表示。
- 画像アップロード枠（ドラッグ&ドロップ、`Construction photos/js/photo.js` の `handleFiles`/`readFileAsDataURL` パターンを流用）→ IndexedDBに保存。
- QRコード生成: 軽量なQRコード生成ライブラリをCDNから読込（例: `qrcode.js` 系、他ツールの外部CDN利用パターンに合わせる）。「Google Mapsで開く」リンクURL（`https://maps.google.com/maps?q=<encoded>`）をエンコードして印刷時にQR画像として表示。

### Step 4: 業者一覧テーブル（`js/contractors.js`）
- 業者グループ（行）の追加・削除UI。各業者グループ内に工程行（schedules配列）を追加・削除できるネスト構造。
- `renderContractorTable()`: state配列から動的にDOM生成（`Construction photos/js/photo.js` の `renderPhotoList()` と同様の配列駆動レンダリングパターン）。
- 入退場予定からガントチャート（業者×時間帯）を自動描画する関数 `renderGanttChart()`。セルクリックで手動塗りつぶしも可能にする（クリックイベントでstateのセル塗り状態を保持・再描画）。

### Step 5: 持参品・注意事項セクション（`js/checklist.js`）
- 共通チェックリスト: 項目の自由追加・削除（`renderChecklist(commonChecklist)`）。
- 業者別セクション: 業者一覧で登録済みの業者ごとにタブ or アコーディオンを動的生成し、個別の持参指示・注意事項入力欄を表示。

### Step 6: 全体注意事項
- 自由記述テキストエリア、stateにバインド。

### Step 7: 印刷・PDF出力（`js/renderer.js` + `css/style.css`）
- `@page { size: A4 portrait; margin: 10mm; }` を基本とする。
- 1ページ目: 現場概要＋地図（画像 or QRコード代替表示）。
- 2ページ目以降: 業者一覧・工程ガントチャート・持参品・注意事項・特記事項。業者数・項目数に応じて自動改ページ（`a4_print_adjustment` スキルの「Chromeマルチカラムバグ回避」方針に従い、`column-count` は使わず `flex-flow: column wrap` か単純な改ページ制御で対応）。
- 印刷時は地図iframeを `.no-print` で除外し、画像 or QRコードに切り替える表示ロジックを `renderer.js` に実装。
- ブラウザ標準の印刷機能（Ctrl+P）でPDF保存・印刷両対応とし、専用のPDF出力ライブラリ（html2canvas/jsPDF）は本ツールでは見送り（設計書のスコープに明記はないが、他ツール同様ブラウザ印刷で十分なため。必要になれば`pdf_export.js`パターンを追加）。

### Step 8: クリア機能
- 「クリア」ボタンで state を初期化し、localStorage・IndexedDBの該当データを削除する関数を `storage.js` に実装。

## 4. ポータル統合

- `js/tools.js` に以下のエントリを追加（12番目のツール）:
```javascript
{
    id: "site_work_order",
    title: "大規模現場工事指示書作成ツール",
    desc: "複数業者同時入場現場向け。現場概要・地図・業者別予定・持参品をA4指示書として出力",
    category: "site-mgmt",
    tags: ["工事指示書", "現場管理", "業者管理"],
    url: "Site Work Order/index.html",
    icon: "clipboard-list"
}
```
- `.agents/skills/portal_doc_sync/SKILL.md` の方針に従い、`機能説明書.md` に「12. 大規模現場工事指示書作成ツール」セクションを追加（主な機能／使用方法を既存ツールと同じフォーマットで記載、最終更新日を末尾に追記）。

## 5. 実装順序（推奨コミット単位）

1. ディレクトリ作成 + 骨格HTML + storage.js（自動保存の土台）
2. 現場概要セクション
3. 地図セクション（embed + 画像アップロード + QRコード）
4. 業者一覧テーブル（行追加削除 + 工程ネスト）
5. ガントチャート自動描画 + 手動塗りつぶし
6. 持参品・注意事項（共通＋業者別）
7. 印刷CSS・改ページ制御
8. ポータル統合（tools.js + 機能説明書.md）
9. クリア機能・最終調整

## 6. スコープ外（設計書を継承）

- Google Maps Directions APIによるルート案内
- 業者への自動通知（メール・SMS）
- 複数現場の一括管理
