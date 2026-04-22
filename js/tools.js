/* © 2026 Nozomi Sakurada. All rights reserved. */
const PORTAL_TOOLS = [
    {
        id: "checklists",
        title: "工事・メンテ用<br>統合チェック表",
        desc: "「給湯機器工事」「キッチン設備」「シンプロメンテ」の3種類の現場に対応した統合型チェックリスト。進捗バー進行・A4のPDF印刷に最適化済み。",
        url: "Field_Checklists/index.html",
        icon: "check-square",
        tags: ["チェックリスト", "統合版", "現場管理"]
    },
    {
        id: "photos",
        title: "工事写真報告書<br>作成ツール",
        desc: "IndexedDB採用で大量の写真に対応。専用ページでのドラッグ&ドロップ並べ替えや高品質なPDF出力機能を搭載。EXIF撮影日自動取得対応。",
        url: "Construction photos/index.html",
        icon: "image",
        tags: ["写真管理", "PDF出力", "IndexedDB"]
    },
    {
        id: "hot_water",
        title: "給湯能力計算<br>（大規模・単体）",
        desc: "パーパス最新設計基準（v5.3）に準拠。マルチ方式・貯湯タンク方式・膨張タンク選定に対応。算定書PDF出力・同時使用率自動計算。",
        url: "Hot water capacity calculation/index.html",
        icon: "flame",
        tags: ["給湯算定", "必要号数", "出湯量"]
    },
    {
        id: "fax",
        title: "FAX送信票・<br>送付状作成",
        desc: "FAX送信票や書類送付状を簡単に作成・印刷。最新の事業所データをオンラインで自動取得。",
        url: "Fax Cover Sheet/index.html",
        icon: "printer",
        tags: ["送付状", "FAX", "最新データ取得"]
    },
    {
        id: "manual",
        title: "簡易診断・<br>アラーム一覧生成",
        desc: "宛先会社名を自由に入力して、パーパス製給湯器の「簡易診断マニュアル」や「アラーム一覧」を即座に生成・PDF化。",
        url: "manual/index.html",
        icon: "alert-triangle",
        tags: ["マニュアル作成", "メンテナンス", "PDF出力"]
    },
    {
        id: "e888",
        title: "あんしん点検・<br>888表示について",
        desc: "パーパス製給湯器の法定点検「あんしん点検」の料金・時間や、リモコンの「888」表示の一時解除方法をまとめた案内。",
        url: "E888/index.html",
        icon: "shield-check",
        tags: ["あんしん点検", "888表示", "メンテナンス"]
    },
    {
        id: "qvc",
        title: "Showa Excel<br>レンジフード現地調査シート",
        desc: "Excelデータを読み込み、エリア絞込（地方・県・エリア）を経て、A4印刷用の現地調査シートを即座に一括生成。自動列探索による柔軟なデータ抽出機能付き。",
        url: "Showa Excel/index.html",
        icon: "clipboard-list",
        tags: ["Excel連携", "調査シート", "レンジフード"]
    },
    {
        id: "running_cost",
        title: "機器取替<br>シミュレーション",
        desc: "ガス給湯器・ハイブリッドなどのランニングコストを比較。現在機種の自動ロックや先頭固定表示で比較がより分かりやすく。年間削減額グラフ表示対応。",
        url: "Equipment Replacement Simulation/index.html",
        icon: "trending-down",
        tags: ["コスト計算", "比較シミュレーション", "エコジョーズ"]
    },
    {
        id: "freeze_prevention",
        title: "凍結予防方法の<br>まとめ資料",
        desc: "給湯器・風呂釜の凍結を防ぐ方法を4つのカテゴリ（単能機・ふろ給湯・暖房・風呂釜）ごとに解説。編ごとのA4印刷に対応。",
        url: "Freeze Prevention/index.html",
        icon: "snowflake",
        tags: ["凍結予防", "メンテナンス", "A4印刷"]
    },
    {
        id: "btob_price",
        title: "BtoB価格表<br>作成ツール",
        desc: "取引先・販売店の親子関係を管理し、製品・工事ごとの卸価格表を作成。行ごとに掛け率(%)または金額表示を切り替え可能。有効期限管理・バージョン管理対応。",
        url: "BtoB Price data base/index.html",
        icon: "file-spreadsheet",
        tags: ["価格表", "BtoB", "卸価格", "顧客管理"]
    }
];
