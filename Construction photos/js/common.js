/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * ページ共通ユーティリティ
 * index.html / reorder.html の両方で最初に読み込む。
 * 以前は storage.js と reorder.js に STORAGE_KEY が、
 * index.html と reorder.js に同一の日付整形関数が重複していたため集約した。
 */

// localStorage 保存キー（表紙メタ情報・写真メタ・並び順）
const STORAGE_KEY = 'kojiReport_v1';

// 日付文字列（YYYY-MM-DD）を「YYYY年M月D日」形式に変換
const formatDate = d => {
  if (!d) return '';
  const [y, m, d_] = d.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d_)}日`;
};
