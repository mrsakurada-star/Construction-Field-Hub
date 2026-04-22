---
name: SPA Button Type Enforcement
description: SPA（Single Page Application）における暗黙的なフォーム送信バグを防ぐため、すべてのbutton要素にtype属性（原則type="button"）を明記するスキル
---

# SPA Button Type Enforcement（SPAボタンタイプ明示化）

## 目的
HTMLの `<button>` タグは、`type` 属性を省略した場合、多くのブラウザでデフォルトとして `type="submit"` として解釈されます。
フォームを持たないSPA (Single Page Application)・動的なJavaScript主体のUIにおいて、この挙動が意図せぬページリロードや変数値の揮発を引き起こし、「ボタンをクリックしても画面が真っ白になる」「機能していないように見える」といった深刻なバグの原因となります。
このスキルは、新規ツールの開発や改修において、全ボタンに対する `type` 属性の明記を強制し、同様の問題を永続的に防ぐことを目的とします。

## ルール

1. **すべてのボタンに属性を付与する**
   HTML内に `<button>` タグを記述する際は、例外なく `type` 属性を付与すること。
   
2. **デフォルトの型は `type="button"`**
   純粋にJavaScriptのイベント（`onclick`など）を発火させるためだけのボタンには、必ず `type="button"` を指定すること。
   ```html
   <!-- ❌ NG -->
   <button onclick="saveData()">保存</button>
   
   <!-- ⭕ OK -->
   <button type="button" onclick="saveData()">保存</button>
   ```

3. **フォーム送信のみ `type="submit"` を使用**
   `<form>` タグを用いて意図的にサーバー（またはJavaScriptの`onsubmit`ハンドラ）へデータをSubmitする場合にのみ、`type="submit"` を指定すること。

4. **TailwindCSS プラグイン混在時の注意**
   `@tailwindcss/forms` などのプラグインを使用している場合、フォーム要素のデフォルトスタイルリセットが強力に作用しますが、HTMLのネイティブな挙動（送信アクション）までは無効化されません。スタイルに関わらず属性値での明示を優先してください。

## トラブルシューティング
過去の開発（例として「給湯能力計算システム」）において、系統を保存して一覧に戻る `saveSystemAndBack()` を呼び出すボタンが、特定の条件下でDOMリロードを走らせ機能停止するバグが発生しました。同様の症状（非同期処理の前に画面が切り替わる、リロードされる等）が発生した場合は、まず該当ボタンの `type` 属性の有無を確認してください。
