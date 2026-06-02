/* © 2026 Nozomi Sakurada. All rights reserved. */
/* Service Book - 半角全角正規化 / あいまい検索ユーティリティ */

/** 全角英数記号→半角（ASCII相当の全角 U+FF01–FF5E と全角スペース U+3000） */
function toHalfWidthAscii(str){
  return String(str||'')
    .replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0)-0xFEE0))
    .replace(/　/g,' ');
}

/** 半角カタカナ→全角カタカナ（濁点・半濁点を合成） */
function toFullWidthKana(str){
  const map={'ｶﾞ':'ガ','ｷﾞ':'ギ','ｸﾞ':'グ','ｹﾞ':'ゲ','ｺﾞ':'ゴ','ｻﾞ':'ザ','ｼﾞ':'ジ','ｽﾞ':'ズ','ｾﾞ':'ゼ','ｿﾞ':'ゾ','ﾀﾞ':'ダ','ﾁﾞ':'ヂ','ﾂﾞ':'ヅ','ﾃﾞ':'デ','ﾄﾞ':'ド','ﾊﾞ':'バ','ﾋﾞ':'ビ','ﾌﾞ':'ブ','ﾍﾞ':'ベ','ﾎﾞ':'ボ','ﾊﾟ':'パ','ﾋﾟ':'ピ','ﾌﾟ':'プ','ﾍﾟ':'ペ','ﾎﾟ':'ポ','ｳﾞ':'ヴ'};
  const single={'ｱ':'ア','ｲ':'イ','ｳ':'ウ','ｴ':'エ','ｵ':'オ','ｶ':'カ','ｷ':'キ','ｸ':'ク','ｹ':'ケ','ｺ':'コ','ｻ':'サ','ｼ':'シ','ｽ':'ス','ｾ':'セ','ｿ':'ソ','ﾀ':'タ','ﾁ':'チ','ﾂ':'ツ','ﾃ':'テ','ﾄ':'ト','ﾅ':'ナ','ﾆ':'ニ','ﾇ':'ヌ','ﾈ':'ネ','ﾉ':'ノ','ﾊ':'ハ','ﾋ':'ヒ','ﾌ':'フ','ﾍ':'ヘ','ﾎ':'ホ','ﾏ':'マ','ﾐ':'ミ','ﾑ':'ム','ﾒ':'メ','ﾓ':'モ','ﾔ':'ヤ','ﾕ':'ユ','ﾖ':'ヨ','ﾗ':'ラ','ﾘ':'リ','ﾙ':'ル','ﾚ':'レ','ﾛ':'ロ','ﾜ':'ワ','ｦ':'ヲ','ﾝ':'ン','ｧ':'ァ','ｨ':'ィ','ｩ':'ゥ','ｪ':'ェ','ｫ':'ォ','ｬ':'ャ','ｭ':'ュ','ｮ':'ョ','ｯ':'ッ','ｰ':'ー','｡':'。','｢':'「','｣':'」','､':'、','･':'・'};
  let s=String(str||'');
  Object.keys(map).forEach(k=>{ s=s.split(k).join(map[k]); });
  Object.keys(single).forEach(k=>{ s=s.split(k).join(single[k]); });
  return s;
}

/**
 * フィールド値の保存用正規化（自動変換）
 * - 英数記号は半角へ、半角カナは全角カナへ統一
 * - 前後の空白を除去
 */
function normalizeFieldValue(str){
  return toFullWidthKana(toHalfWidthAscii(str)).trim();
}

/**
 * 検索用キー（表記ゆれ吸収）
 * - 半角化＋全角カナ化のうえ、小文字化・空白/ハイフン除去
 */
function normalizeForSearch(str){
  let s = toFullWidthKana(toHalfWidthAscii(str)).toLowerCase();
  return s.replace(/[\s\-ー‐-―~～]/g,''); // 空白・各種ハイフン・長音・チルダを除去
}

/** あいまい一致: クエリ正規化キーが対象いずれかの正規化キーに部分一致 */
function fuzzyMatch(query, ...targets){
  const q = normalizeForSearch(query);
  if(!q) return true;
  return targets.some(t => normalizeForSearch(t).includes(q));
}

if (typeof window !== 'undefined') {
  window.normalizeFieldValue = normalizeFieldValue;
  window.normalizeForSearch = normalizeForSearch;
  window.fuzzyMatch = fuzzyMatch;
}
