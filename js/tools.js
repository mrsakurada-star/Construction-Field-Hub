/* © 2026 Nozomi Sakurada. All rights reserved. */
const PORTAL_TOOLS = [
    {
        id: "checklists",
        title: "工事・メンテ統合チェック表",
        desc: "給湯機器工事・キッチン・メンテナンス向けチェックリスト（PDF印刷対応）",
        category: "site-mgmt",
        tags: ["チェックリスト", "現場管理"],
        url: "Field_Checklists/index.html",
        icon: "check-square"
    },
    {
        id: "photos",
        title: "工事写真報告書作成ツール",
        desc: "工事写真のドラッグ&ドロップ並べ替えと高品質PDF出力",
        category: "site-mgmt",
        tags: ["写真管理", "PDF出力"],
        url: "Construction photos/index.html",
        icon: "image"
    },
    {
        id: "hot_water_v3",
        title: "給湯能力計算書 v3",
        desc: "パーパス基準v5.3対応。パラメータ変更の自動検出・記録、Rev管理、変更履歴の詳細自動記述対応",
        category: "calculation",
        tags: ["給湯計算", "計算書", "変更履歴管理"],
        url: "Hot water calc/index.html",
        icon: "flame"
    },
    {
        id: "fax",
        title: "FAX送信票・送付状作成",
        desc: "事業所最新データ自動取得で即座に作成・印刷可能",
        category: "maintenance",
        tags: ["送付状", "FAX"],
        url: "Fax Cover Sheet/index.html",
        icon: "printer"
    },
    {
        id: "manual",
        title: "簡易診断・アラーム一覧生成",
        desc: "パーパス給湯器のマニュアル・アラーム一覧を即座にPDF化",
        category: "maintenance",
        tags: ["マニュアル作成", "メンテ"],
        url: "manual/index.html",
        icon: "alert-triangle"
    },
    {
        id: "e888",
        title: "あんしん点検・888表示について",
        desc: "法定点検「あんしん点検」と「888」表示解除方法の案内",
        category: "maintenance",
        tags: ["点検", "メンテ"],
        url: "E888/index.html",
        icon: "shield-check"
    },
    {
        id: "maintenance_modes",
        title: "メーカー別メンテナンス情報表示方法",
        desc: "パーパス・ノーリツ・リンナイ・パロマのメンテナンスモード操作・表示内容を比較表示",
        category: "maintenance",
        tags: ["メンテナンス", "メーカー別"],
        url: "maintenance-modes/index.html",
        icon: "settings"
    },
    {
        id: "qvc",
        title: "Showa Excelレンジフード現地調査シート",
        desc: "Excel・地域絞込み対応の現地調査シート一括生成",
        category: "calculation",
        tags: ["Excel連携", "調査"],
        url: "Showa Excel/index.html",
        icon: "clipboard-list"
    },
    {
        id: "running_cost",
        title: "機器取替シミュレーション",
        desc: "ガス給湯器等のランニングコスト比較・年間削減額の可視化",
        category: "calculation",
        tags: ["コスト計算", "シミュレーション"],
        url: "Equipment Replacement Simulation/index.html",
        icon: "trending-down"
    },
    {
        id: "freeze_prevention",
        title: "凍結予防方法のまとめ資料",
        desc: "普段・寒冷時・不在時別の凍結対策を網羅した完全版資料",
        category: "maintenance",
        tags: ["凍結予防", "メンテ"],
        url: "Freeze Prevention/index.html",
        icon: "snowflake"
    },
    {
        id: "btob_price",
        title: "BtoB価格表作成ツール",
        desc: "取引先別卸価格表の作成・管理（フォルダ自動同期）",
        category: "biz-tool",
        tags: ["価格表", "BtoB"],
        url: "BtoB Price data base/index.html",
        icon: "file-spreadsheet"
    },
    {
        id: "ecotech_pmse",
        title: "Ecotech アフターサービスシステム",
        desc: "依頼受付・顧客管理・担当者割当・請求明細・レポート出力を統合管理。利用前に「ecotech-pmse-main」フォルダで npm run dev を起動してください（localhost:3000）",
        category: "biz-tool",
        tags: ["アフターサービス", "依頼管理", "請求"],
        url: "http://localhost:3000",
        icon: "layout-dashboard"
    },
    {
        id: "service_book",
        title: "サービス報告書・点検履歴台帳",
        desc: "顧客・機器ごとに点検/修理履歴を蓄積。フォルダ同期、横断あいまい検索、依頼票・サービス報告書のA4発行",
        category: "maintenance",
        tags: ["点検履歴", "サービス報告書", "台帳"],
        url: "Service Book/index.html",
        icon: "clipboard-list"
    }
];
