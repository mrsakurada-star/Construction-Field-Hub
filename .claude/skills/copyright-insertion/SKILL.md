---
name: copyright-insertion
description: 新規ファイルの作成時、既存ファイルの編集時、または既存HTML群のコピーライト表記を一括監査したいときに使用。統一形式のコピーライトコメントを適切な位置・形式で挿入する。
---

# `copyright_insertion` スキル

このスキルは、プロジェクト内で作成・改修される全てのソースコードファイルに対して、統一されたコピーライト（著作権）表記を付与するためのガイドラインです。

## 1. 標準的なコピーライト表記

以下の文字列を標準として使用します。

`© 2026 Nozomi Sakurada. All rights reserved.`

## 2. ファイル形式ごとの挿入位置と形式

各ファイルの**適切な位置**（先頭または末尾）に、適切なコメント形式で挿入します。

| ファイル形式 | コメントスタイル | 具体的な挿入例 |
| :--- | :--- | :--- |
| **HTML** | `<!-- ... -->` | `<!-- © 2026 Nozomi Sakurada. All rights reserved. -->` |
| **CSS / JavaScript** | `/* ... */` | `/* © 2026 Nozomi Sakurada. All rights reserved. */` |
| **Python / YAML** | `# ...` | `# © 2026 Nozomi Sakurada. All rights reserved.` |
| **Markdown** | `<!-- ... -->` | **ファイルの最下部**に挿入 |

## 3. 実装のガイドライン

1. **新規作成時**: ファイルを作成する際、必ず適切な位置（HTML/JS/CSSは1行目、Markdownは末尾）にこのコピーライトを記述してください。
2. **既存ファイルの編集時**: ファイルの先頭にコピーライトがない場合は、編集のタイミングで追加してください。
3. **既存の類似表記の統一**: すでに形式の異なるコピーライト（例：`<!-- コピーライト ... -->`）が存在する場合は、このスキルの標準形式に置き換えてください。
4. **文字コード**: © 記号が文字化けしないよう、必ず **UTF-8** で保存してください。

## 4. 既存ファイルの一括監査（プロジェクト全体チェック）

新規ツール追加時や定期確認のタイミングで、プロジェクト内の全 `index.html` にコピーライトが漏れなく入っているかを一括チェックする。

```bash
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

- 新しいツールフォルダの `index.html` を作成したら、このチェックリストに追記して漏れを防ぐ
- 年号が変わった際（2027年等）は全ファイルの年号を一括更新する

<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
