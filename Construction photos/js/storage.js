/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * ストレージ管理モジュール
 * - メタ情報（日付・タイトル・説明等）→ localStorage
 * - 写真 src（Base64）                 → IndexedDB（db.js）
 * - 並べ替え順番（photoOrder）          → localStorage
 *
 * STORAGE_KEY は js/common.js で定義（reorder.js と共用）。
 */

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
    desc: p.desc, exifDate: p.exifDate, name: p.name,
    processId: p.processId ?? null,
    phase: p.phase || 'before',
    label: p.label || ''
  }));

  // 並べ替え順番を id 配列として保存
  const photoOrder = photos.map(p => p.id);

  // 工程マスターの並び順を id 配列として保存
  const processOrder = processes.map(pr => pr.id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cover: data, photosMeta, photoOrder, processes, processOrder
  }));

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
      setVal('coverSupplement',    c.supplement);
      setVal('coverWorkStartDate', c.workStartDate);
      setVal('coverWorkEndDate',   c.workEndDate);
    }

    // 工程マスターの復元
    const rawProcesses = data.processes || [];
    const processOrder = data.processOrder || rawProcesses.map(p => p.id);
    const processById = new Map(rawProcesses.map(p => [p.id, p]));
    processes = processOrder
      .filter(id => processById.has(id))
      .map(id => processById.get(id));
    if (processes.length > 0) {
      nextProcessId = Math.max(...processes.map(p => p.id)) + 1;
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
            processId: m.processId ?? null,
            phase:     m.phase || 'before',
            label:    m.label || ''
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
    supplement:    document.getElementById('coverSupplement').value,
    workStartDate: document.getElementById('coverWorkStartDate').value,
    workEndDate:   document.getElementById('coverWorkEndDate').value
  };
}

/**
 * 工程を新規追加する。
 * @param {string} name
 */
function addProcess(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  processes.push({ id: nextProcessId++, name: trimmed });
  saveToStorage();
  renderPhotoList();
}

/**
 * 工程を削除する。割り当てられていた写真は未分類（processId: null）に戻す。
 * @param {number} id
 */
function removeProcess(id) {
  processes = processes.filter(p => p.id !== id);
  photos.forEach(p => { if (p.processId === id) p.processId = null; });
  saveToStorage();
  renderProcessList();
  renderPhotoList();
}

/**
 * 工程の並び順を入れ替える。
 * @param {number} id
 * @param {number} dir -1 または 1
 */
function moveProcess(id, dir) {
  const idx = processes.findIndex(p => p.id === id);
  const newIdx = idx + dir;
  if (idx === -1 || newIdx < 0 || newIdx >= processes.length) return;
  [processes[idx], processes[newIdx]] = [processes[newIdx], processes[idx]];
  saveToStorage();
  renderProcessList();
}