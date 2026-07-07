---
name: a4-print-adjustment
description: HTMLを印刷時にA4用紙1枚に正しく収めるためのCSS調整ノウハウとバグ回避策
---

# A4印刷レイアウト調整スキル (a4-print-adjustment)

HTMLを印刷時にA4サイズ1枚に綺麗に収めたい場合に適用するCSSスキルです。
ブラウザ特有のバグ（特にChrome）を回避し、画面表示と印刷表示を完全に分離するモダンな設計を推奨します。

## 1. 画面(Screen)と印刷(Print)の完全分離

画面用のレスポンシブなCSSと、印刷用の固定A4枠CSSをメディアクエリで厳密に分割します。

```css
/* ===== 🖥️ SCREEN (画面表示用) ===== */
@media screen {
  /* 画面幅を活かした自然なレスポンシブ・広々とした文字サイズを設定 */
  .page {
    width: 100%; max-width: 1200px;
    height: auto; min-height: 1122px; 
    /* 画面ではoverflow: visibleにしてスクロールを許容する */
  }
}

/* ===== 🖨️ PRINT (印刷表示用) ===== */
@page {
  size: A4 portrait;
  margin: 10mm 10mm 15mm 10mm; /* ブラウザフッターを考慮 */
}

@media print {
  body { margin: 0; padding: 0; background: white; }
  .no-print { display: none !important; }

  .page {
    /* 物理的なA4有効領域にガチガチに固定する */
    width: 190mm !important;    
    height: 272mm !important;   
    margin: 0 !important; padding: 0 !important;
    overflow: hidden !important; /* 2ページ目への溢れを強制カット */
    border: none !important; box-shadow: none !important;
    position: relative;
    display: flex; flex-direction: column;
  }
}
```

## 2. Chromeの `column-count` 印刷バグについて ⚠️（最重要）

**【バグの概要】**
Chromeの印刷モードにおいて、**「コンテナに固定高さ（例：`height: 272mm`）と `overflow: hidden` を指定した状態で、内部の子要素に `column-count: 2`（マルチカラム）を適用する」**と、2列目に折り返されるはずのコンテンツの高さ計算が崩れ、コンテンツが完全に消失（脱落）する致命的なネイティブバグが存在します。

**【解決策（Flexbox段組みへの置換）】**
チェック表などの長いリストを印刷時に段組みしたい場合は、絶対に `column-count` を使わず、以下のように `flex-flow: column wrap` を使用して物理的に折り返しを強制してください。

```css
@media print {
  #sections {
    display: flex;
    flex-flow: column wrap;    /* 縦に並べ、溢れたら次の列へ */
    align-content: flex-start;
    height: 870px;             /* 列を折り返すための「安全な固定高さ」を明示 */
    column-gap: 6mm;
  }
  .section-card {
    width: calc(50% - 3mm);    /* 2列の幅を明示 */
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

※画面表示（`@media screen`）では `column-count: 2` は正常に動作するため、画面用には `column-count` を使用し、印刷用のみ Flex Wrap で上書きする形が最も綺麗です。

## 3. ページ下部のはみ出し（Margin-top: auto）

印刷時に要素をA4の「一番下」に配置したい場合（例：FAX送付状の同封物欄）、以下のように設定します。

```css
@media print {
  .page {
    display: flex !important;
    flex-direction: column !important;
    height: 272mm !important;
    overflow: hidden !important;
  }
  .bottom-element {
    margin-top: auto !important; /* 利用可能な余白をすべて押し出して最下部へ配置 */
  }
}
```

## 4. 全体縮小（Zoom / Transform）の使い分け

A4に文字が入り切らない場合、`font-size` の微調整で対応できない場合はCSSスケールを使用します。
ただし、`body { zoom }` は `@page` マージンを破壊するため使用禁止です。

### 【安全なスケーリング方法（Transform）】

```css
@media print {
  #page-content-wrapper {
    /* 例: 75%に縮小して1ページに押し込む場合 */
    width: 133.33% !important; /* 100/0.75 */
    transform: scale(0.75) !important;
    transform-origin: top left !important;
  }
}
```

## 💡 チェックリスト

1. 画面(Screen)と印刷(Print)のCSSはメディアクエリで完全に分離されているか？
2. 印刷用（`.page`等）は `190mm × 272mm` + `overflow: hidden` に固定されているか？
3. `body { margin: 0; padding: 0; }` が `@media print` に設定されているか？
4. **【重要】** 印刷時に `column-count` を使って段組みを作っていないか？（Flex Wrapを代替使用しているか）
5. フッター等の外側要素が `no-print` で適切に除外されているか？

<!-- © 2026 Nozomi Sakurada. All rights reserved. -->
