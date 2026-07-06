/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * ストレージ管理モジュール
 * - メタ情報（日付・タイトル・説明等）→ localStorage
 * - 写真 src（Base64）                 → IndexedDB（db.js）
 * - 並べ替え順番（photoOrder）          → localStorage
 */

const STORAGE_KEY = 'kojiReport_v1';

// IndexedDB に保存済みの写真 id を追跡し、未変更の写真を毎回書き直さないようにする。
// photo.src はアップロード後に変更されない（差し替え機能が無い）ため、
// 一度保存した id は再保存不要。
const savedPhotoIds = new Set();

/**
 * 現在の状態を localStorage（メタ情報・順番）と
 * IndexedDB（画像 src）に保存する。
 */
function saveToStorage() {
  const data = getCoverData();

  // メタ情報のみ localStorage に保存（src は含めない）
  const photosMeta = photos.map(p => ({
    id: p.id, date: p.date, title: p.title,
    desc: p.desc, exifDate: p.exifDate, name: p.name
  }));

  // 並べ替え順番を id 配列として保存
  const photoOrder = photos.map(p => p.id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ cover: data, photosMeta, photoOrder }));

  // 画像 src は未保存の写真のみ IndexedDB に書き込む
  photos.forEach(p => {
    if (p.src && !savedPhotoIds.has(p.id)) {
      savePhotoSrc(p.id, p.src);
      savedPhotoIds.add(p.id);
    }
  });
}

/**
 * localStorage からメタ情報・順番を復元し、
 * IndexedDB から画像 src を復元して photos 配列を再構築する。
 * @returns {Promise<void>}
 */
async function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    // 表紙情報の復元
    if (data.cover) {
      const c = data.cover;
      setVal('coverDate',          c.date);
      setVal('coverManageNo',      c.manageNo);
      setVal('coverOurManageNo',   c.ourManageNo);
      setVal('coverAffiliation',   c.affiliation);
      setVal('coverAuthor',        c.author);
      setVal('coverSiteName',      c.siteName);
      setVal('coverAddress',       c.address);
      setVal('coverWorkContent',   c.workContent);
      setVal('coverWorkStartDate', c.workStartDate);
      setVal('coverWorkEndDate',   c.workEndDate);
    }

    // 写真メタ情報の復元
    if (data.photosMeta && data.photosMeta.length > 0) {
      // IndexedDB から全 src を取得
      const srcMap = await getAllPhotoSrcs();

      // photoOrder があれば順番通りに、なければ保存順で photos を構築
      const meta = data.photosMeta;
      const order = data.photoOrder || meta.map(m => m.id);

      // order に従って並べ替え
      const metaById = new Map(meta.map(m => [m.id, m]));
      photos = order
        .filter(id => metaById.has(id))
        .map(id => {
          const m = metaById.get(id);
          return {
            id:       m.id,
            src:      srcMap.get(m.id) || null,
            name:     m.name,
            date:     m.date,
            exifDate: m.exifDate,
            title:    m.title,
            desc:     m.desc,
            file:     null // リロード後はファイルオブジェクト無し
          };
        });

      // nextId を最大 id + 1 に設定して重複を防ぐ
      if (photos.length > 0) {
        nextId = Math.max(...photos.map(p => p.id)) + 1;
      }

      // IndexedDB から復元した写真は既に保存済みとして記録（再書き込み防止）
      photos.forEach(p => { if (p.src) savedPhotoIds.add(p.id); });

      renderPhotoList();
      document.getElementById('photoCount').textContent = photos.length;
    }

  } catch (e) {
    console.error('[storage] 読み込みエラー:', e);
  }
}

/**
 * 要素に値をセットするユーティリティ。
 */
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.value = val;
}

/**
 * localStorage と IndexedDB の両方をクリアする。
 */
async function clearStorage() {
  if (confirm('入力内容をすべてクリアしますか？')) {
    localStorage.removeItem(STORAGE_KEY);
    await clearAllPhotoSrcs();
    document.querySelectorAll('#tab-cover input, #tab-cover textarea').forEach(el => el.value = '');
    updatePreview();
  }
}

/**
 * 表紙フォームの現在値をオブジェクトで返す。
 */
function getCoverData() {
  return {
    date:          document.getElementById('coverDate').value,
    manageNo:      document.getElementById('coverManageNo').value,
    ourManageNo:   document.getElementById('coverOurManageNo').value,
    affiliation:   document.getElementById('coverAffiliation').value,
    author:        document.getElementById('coverAuthor').value,
    siteName:      document.getElementById('coverSiteName').value,
    address:       document.getElementById('coverAddress').value,
    workContent:   document.getElementById('coverWorkContent').value,
    workStartDate: document.getElementById('coverWorkStartDate').value,
    workEndDate:   document.getElementById('coverWorkEndDate').value
  };
}