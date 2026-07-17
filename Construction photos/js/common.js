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

/**
 * PDF/プレビュー出力用に「工程順 → phase順（前中後）→ 元の相対順」でソートした
 * photos のコピーを返す純関数（非破壊）。renderer.js（印刷）と reorder.js（並べ替え画面）で
 * 同一の並び順を保証するために共通化している。
 * @param {Array} photos
 * @param {Array} processes  工程マスター（配列の並び順が processRank になる）
 * @returns {Array} ソート済みの新配列
 */
function sortPhotosForExport(photos, processes) {
  if (!Array.isArray(photos)) return [];
  processes = processes || [];
  const phaseRank = { before: 0, during: 1, after: 2 };
  const processRank = new Map(processes.map((pr, idx) => [pr.id, idx]));
  const UNASSIGNED_RANK = processes.length; // 未分類は最後

  return photos
    .map((p, idx) => ({ p, idx })) // 元の相対順序を保持するためのタイブレーカー
    .sort((a, b) => {
      const pidA = a.p.processId ?? null;
      const pidB = b.p.processId ?? null;
      const rankA = pidA === null ? UNASSIGNED_RANK : (processRank.get(pidA) ?? UNASSIGNED_RANK);
      const rankB = pidB === null ? UNASSIGNED_RANK : (processRank.get(pidB) ?? UNASSIGNED_RANK);
      if (rankA !== rankB) return rankA - rankB;

      const phaseA = phaseRank[a.p.phase] ?? 0;
      const phaseB = phaseRank[b.p.phase] ?? 0;
      if (phaseA !== phaseB) return phaseA - phaseB;

      return a.idx - b.idx;
    })
    .map(entry => entry.p);
}

/** 写真1枚が属する工程名を返す（未分類/不明 processId は 'その他'）。renderer と reorder で共用。 */
function getProcessNameForPhoto(p, processes) {
  if (p.processId === null || p.processId === undefined) return 'その他';
  const pr = (processes || []).find(pr => pr.id === p.processId);
  return pr ? pr.name : 'その他';
}
