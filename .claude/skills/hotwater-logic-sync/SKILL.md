---
name: Hot Water Calc Logic Sync（給湯計算ロジック同期）
description: 給湯能力計算システムの計算ロジックに変更があった際に、計算ロジック.mdを最新状態に同期するためのスキル
---

# `hotwater_logic_sync` スキル

このスキルは、`Hot water capacity calculation/js/main.js` の計算ロジックに変更が加わった際に、  
`Hot water capacity calculation/計算ロジック.md` を正確・一貫した状態に保つためのガイドラインです。

## 1. 適用トリガー

以下のいずれかに該当する変更が `main.js` に加えられた場合、このスキルを実行してください。

- 計算式・係数・定数の変更（K値、号数換算、比熱値など）
- 同時使用率テーブルの変更（施設タイプ追加/削除、U値変更）
- 給湯方式ロジックの変更（calcMulti, calcPat3, calcPat4 関数の改修）
- ピーク継続時間テーブルの変更（PEAK_CONTINUATION_HOURS）
- 新しい給湯方式の追加

## 2. 更新対象ファイル

```
Hot water capacity calculation/計算ロジック.md
```

## 3. 更新手順

### 3-1. 変更内容の確認

まず、今回の変更が計算ロジックに影響するかを確認します。

```powershell
# 変更されたJS関数を対象に確認
Select-String -Path "js\main.js" -Pattern "function calc"
```

### 3-2. 該当セクションを特定

`計算ロジック.md` の以下のセクションと変更内容を照合してください。

| main.jsの関数 | 計算ロジック.mdのセクション |
|---|---|
| `calcMulti()` | § 3-1. 直圧給湯方式・給湯循環方式 |
| `calcPat3()` | § 3-2. 貯湯タンク方式 |
| `calcPat4()` | § 3-3. ろ過昇温方式 |
| `calcExpansionTank()` | § 4. 膨張タンク選定計算 |
| `K_PURPOSE` 定数 | § 1-2. 余裕係数 K |
| `PREFECTURE_TC_MAP` | § 1-3. 給水温度 tc |
| `PURPOSE_U_TABLE` / `SHASEBIZ_U_TABLE` | § 2. 同時使用率テーブル |
| `PEAK_CONTINUATION_HOURS` | § 3-2 ピーク継続時間テーブル |
### 3-3. md更新ルール

1. **数式の表記**: LaTeX形式（`$$...$$`）で記述
2. **テーブル変更**: 追加/変更セルに内容を正確に反映
3. **変更根拠を明記**: 変更内容に対応する「根拠」欄を更新
4. **バージョン履歴の追記**（`## 7. バージョン履歴`）に必ず1行追加

### 3-4. バージョン行フォーマット

```markdown
| **v{次バージョン}** | {YYYY-MM-DD} | {変更内容の要約（50文字以内）} |
```

### 3-5. 定数対応チートシート

以下の定数は `main.js` 冒頭付近で定義されています。変更があった際は参照してください。

| 定数名 | 説明 |
|---|---|
| `K_PURPOSE` | 余裕係数（デフォルト 1.1） |
| `PURPOSE_U_TABLE` | パーパス基準 同時使用率テーブル |
| `SHASEBIZ_U_TABLE` | 建備基準補完 同時使用率テーブル |
| `PEAK_CONTINUATION_HOURS` | ピーク継続時間 |
| `UNIT_INTERNAL_VOL` | 機器内容量（膨張タンク計算用） |
| `FIXTURE_PRESETS` | 器具別単位給湯量 Hq |
| `PREFECTURE_TC_MAP` | 都道府県別給水温度 tc |

## 4. 変更後のチェックリスト

- [ ] 変更した式・定数が `計算ロジック.md` に反映されているか
- [ ] バージョン履歴に変更を追記したか
- [ ] md内のテーブル列幅・マークダウン構文が正常か（パイプ `|` のズレなど）
- [ ] 削除された仕様（旧ASHRAE係数など）がmdから除去されているか

<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
