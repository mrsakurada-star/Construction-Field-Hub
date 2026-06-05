# Construction Field Hub ドキュメント更新スキル

更新対象ツール（Field_Checklists, Hot Water Calc v3 など）のバージョン更新時に、機能説明書とアップデート情報を同期・管理するスキルです。

## 実行手順

### 1. ツール内のバージョン情報を更新
対象ツール内のデータファイル（js/general.js, js/kitchen.js など）の `version` フィールドを更新します。

**例：Field_Checklists の場合**
```javascript
// js/general.js
version: "Ver1.3",  // Ver1.2 から更新

// js/kitchen.js
version: "Ver1.3",

// js/maint.js
version: "Ver3.1",  // Ver3.0 から更新
```

### 2. 機能説明書（機能説明書.md）を更新

#### 対象ツール名・セクション番号を確認
ファイル内でツール名のセクションを検索（例：「## 2. 工事・メンテ用 統合チェック表」）

#### セクションタイトルにバージョンを付記
```markdown
## 2. 工事・メンテ用 統合チェック表（v1.3）
```

#### 「主な機能」セクションに新機能を追加
- (v新バージョン新機能) というプレフィックスで新機能を明記
- 既存機能の説明は補足程度に留める

#### 「使用方法」セクションを新バージョン用に更新
- 新しい操作フロー、新ボタン、新セクション等があれば反映
- ステップの順序が変わった場合は再整理

#### 最終更新日を更新
ファイル末尾の「最終更新」をアップデート日に変更し、主な改善内容を括弧内に記載

```markdown
最終更新: 2026年5月20日（v1.3: A4自動可変レイアウト、現場メモセクション追加）
```

### 3. js/updates.js のアップデート履歴を追加

#### 最新アップデートを配列の先頭に追加
```javascript
{
    toolId: "checklists",
    toolName: "統合チェック表",
    date: "2026-05-20",
    version: "v1.3",
    changes: [
        "主な改善1：簡潔に記載",
        "主な改善2：簡潔に記載",
        // ... 最大5項目程度
    ]
}
```

#### 記載ルール
- `date`: YYYY-MM-DD 形式
- `toolId`: js/tools.js 内の id と一致
- `toolName`: js/tools.js 内の title と一致
- `changes`: 最大5～7項目、1項目は簡潔に（40文字程度）

### 4. ポータル（index.html）の表示を確認
「最近のアップデート」セクションに新しいバージョン情報が表示されることを確認

## チェックリスト

- [ ] ツール内のバージョンフィールド更新
- [ ] 機能説明書のセクションタイトルにバージョン付記
- [ ] 機能説明書の「主な機能」セクション更新
- [ ] 機能説明書の「使用方法」セクション更新
- [ ] 機能説明書の「最終更新日」更新
- [ ] js/updates.js に新アップデート情報を追加（配列先頭）
- [ ] ポータルの「最近のアップデート」で表示確認

## よくある更新パターン

### Field_Checklists 更新時
1. `Field_Checklists/js/general.js` の version を更新
2. `Field_Checklists/js/kitchen.js` の version を更新
3. `Field_Checklists/js/maint.js` の version を更新
4. 機能説明書の「## 2. 工事・メンテ用 統合チェック表（vX.X）」セクション更新
5. `js/updates.js` に checklists エントリを追加

### Hot Water Calc v3 更新時
1. 該当ツール内のバージョンフィールド確認・更新
2. 機能説明書の「## 1. 給湯能力計算書 v3（...）」セクション更新
3. `js/updates.js` に hot_water_v3 エントリを追加

## 参考リンク
- 機能説明書: `Construction Field Hub/機能説明書.md`
- アップデート履歴: `Construction Field Hub/js/updates.js`
- ツール一覧: `Construction Field Hub/js/tools.js`
