# Construction Field Hub コピーライト追加スキル

新しいツールやページを作成した際に、すべてのHTMLファイルにコピーライト表記を追加・確認するスキルです。

## 実行手順

### 1. 全HTMLファイルの一覧を取得

```bash
# Construction Field Hub 内のすべてのindex.htmlを検索
find "Construction Field Hub" -name "index.html" -type f
```

または Glob パターンで取得：
```
Construction Field Hub/**/index.html
```

### 2. 各ファイルのコピーライト確認

各HTMLファイルの**最初の行**を確認します：

```html
<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
```

このコメントが存在するかチェック。存在しない場合は追加が必要です。

### 3. コピーライトの追加

コピーライト表記がない場合、ファイルの先頭（DOCTYPE の前）に追加：

**変更前:**
```html
<!DOCTYPE html>
<html lang="ja">
```

**変更後:**
```html
<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
<!DOCTYPE html>
<html lang="ja">
```

### 4. 最終確認

全ファイルが以下の構成になっていることを確認：
- 1行目：コピーライトコメント
- 2行目以降：DOCTYPE と HTML 構造

## チェックリスト

### ファイル一覧（2026-05-22現在、12ファイル）

- [ ] `index.html` (ポータル)
- [ ] `Field_Checklists/index.html`
- [ ] `Hot water calc/index.html`
- [ ] `Equipment Replacement Simulation/index.html`
- [ ] `Fax Cover Sheet/index.html`
- [ ] `manual/index.html`
- [ ] `Showa Excel/index.html`
- [ ] `E888/index.html`
- [ ] `BtoB Price data base/index.html`
- [ ] `Construction photos/index.html`
- [ ] `Freeze Prevention/index.html`
- [ ] `maintenance-modes/index.html`

### 確認ポイント

- [ ] 全12ファイルのコピーライト表記を確認
- [ ] 新規ツール追加時に忘れずに実施
- [ ] コピーライト年号が現在年（2026）に合致しているか確認

## 使用方法

1. **新しいツールを作成した場合**
   - 新しいHTMLファイルの先頭に上記コメントを追加
   - このスキルの手順に従って確認

2. **定期的な確認**
   - 年号が変わった際（2027年等）にすべてのファイルの年号を更新
   - 新ファイル追加時に漏れがないか確認

## スクリプト自動化（オプション）

以下のスクリプトで一括確認が可能：

```bash
# コピーライト有無を確認
for file in $(find "Construction Field Hub" -name "index.html")
do
  if head -1 "$file" | grep -q "© 2026 Nozomi Sakurada"
  then
    echo "✓ $file"
  else
    echo "✗ $file (MISSING)"
  fi
done
```

## 参考リンク
- ドキュメント更新スキル: `Construction Field Hub/skills/update-documents.md`
- ポータルツール登録: `Construction Field Hub/js/tools.js`
