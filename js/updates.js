/* © 2026 Nozomi Sakurada. All rights reserved. */
/**
 * Construction Field Hub - Update History Data
 */
const PORTAL_UPDATES = [
    {
        toolId: "btob_price",
        toolName: "BtoB価格表作成ツール",
        date: "2026-04-21",
        version: "v1.0",
        changes: [
            "新規ツールをリリース：取引先・販売店の親子関係管理によるBtoB卸価格表作成ツール",
            "製品（定価あり）・工事（OPEN価格）のマスタ管理機能を搭載",
            "行ごとに卸価格の「掛け率(%)」または「金額」表示を切り替え可能",
            "有効期限管理（期限切れ・期限間近の警告表示）およびバージョン履歴管理に対応",
            "IndexedDBによる完全ローカル保存でブラウザ内に安全・一元管理"
        ]
    },
    {
        toolId: "running_cost",
        toolName: "機器取替シミュレーション",
        date: "2026-04-21",
        version: "v2.1",
        changes: [
            "現在使用中の機種（比較基準）を自動でロックし、誤操作による比較からの除外を防止",
            "グラフや表、印刷レポートにおいて、現在の機種が常に先頭に表示されるよう表示順を最適化"
        ]
    },
    {
        toolId: "qvc",
        toolName: "Showa Excel",
        date: "2026-04-21",
        version: "v1.1",
        changes: [
            "Excel内の「番組名」を列見出しから自動探索し、確実に抽出して表示する機能を追加",
            "受付日の表示フォーマットを「mm月dd日」形式の日本語表記に改善",
            "印刷プレビューで「番組名」などが消えてしまうレイアウトの不具合を修正"
        ]
    },
    {
        toolId: "hot_water",
        toolName: "給湯能力計算",
        date: "2026-04-18",
        version: "v5.3",
        changes: [
            "業務用マルチ・器具数・ろ過昇温方式のUIデザインを統一",
            "施設種別プリセットの一元化（全系統で共通参照）",
            "同時使用率のリアルタイム計算・表示機能の実装",
            "レジオネラ属菌増殖リスクに対する自動警告ロジックの追加"
        ]
    },
    {
        toolId: "photos",
        toolName: "工事写真報告書",
        date: "2026-04-18",
        version: "v2.1",
        changes: [
            "EXIFメタデータからの撮影日自動取得機能を搭載",
            "jsPDFとhtml2canvasを用いた高品質PDF出力エンジンへの刷新",
            "サイドバーUIの改善（データ一括削除と写真のみ削除の分離）"
        ]
    },
    {
        toolId: "checklists",
        toolName: "統合チェック表",
        date: "2026-04-15",
        version: "v1.2",
        changes: [
            "複数モード（給湯・キッチン・メンテ）間での進捗同期バグを修正",
            "A4印刷時に空白ページが発生する問題をCSSで解消",
            "工事ホワイトボード出力機能の安定性向上"
        ]
    },
    {
        toolId: "running_cost",
        toolName: "機器取替シミュレーション",
        date: "2026-04-06",
        version: "v2.0",
        changes: [
            "47都道府県別の給水温度・電力会社プランDBの統合",
            "CSS Gridを用いたA4横向き営業資料レイアウトの最適化",
            "Chart.jsによるコスト内訳のスタックグラフ表示に対応"
        ]
    },
    {
        toolId: "portal",
        toolName: "Portal Core",
        date: "2026-04-18",
        version: "v1.1",
        changes: [
            "ツール別アップデート履歴表示機能（What's New）の追加",
            "ツールカードの読み込み・アニメーション精度の向上"
        ]
    }
];
