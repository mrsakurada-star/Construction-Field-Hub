/* © 2026 Nozomi Sakurada. All rights reserved. */
function initUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  });
  input.addEventListener('change', e => {
    handleFiles(Array.from(e.target.files));
    input.value = '';
  });
}

// PDF出力時の html2canvas scale:2 でも十分な画質になる長辺サイズ（プレビュー幅794pxの2倍相当）
const PHOTO_MAX_EDGE = 1600;
const PHOTO_JPEG_QUALITY = 0.9;

async function handleFiles(files) {
  for (const file of files) {
    const src = await resizeImageToDataURL(file, PHOTO_MAX_EDGE, PHOTO_JPEG_QUALITY);
    let exifDate = null;

    try {
      const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate'] });
      if (exif && (exif.DateTimeOriginal || exif.CreateDate)) {
        const d = exif.DateTimeOriginal || exif.CreateDate;
        exifDate = toDateInputFormat(d);
      }
    } catch (e) { }

    let fallbackDate = exifDate;
    if (!fallbackDate) {
      const d = new Date(file.lastModified);
      fallbackDate = d.toISOString().slice(0, 10);
    }

    const photo = {
      id: nextId++,
      src, name: file.name,
      date: fallbackDate,
      exifDate: exifDate,
      title: '',
      desc: '',
      processId: null,
      phase: 'before'
    };
    photos.push(photo);
  }
  renderPhotoList();
  applyAutoWorkDates(false);
  updatePreview();
  document.getElementById('photoCount').textContent = photos.length;
}

function toDateInputFormat(d) {
  if (d instanceof Date) {
    return d.toISOString().slice(0, 10);
  }
  if (typeof d === 'string') {
    const parts = d.split(' ')[0].replace(/:/g, '-');
    return parts;
  }
  return null;
}

function readFileAsDataURL(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/**
 * 画像の長辺が maxEdge を超える場合のみ縮小し、JPEG DataURL として返す。
 * スマホ写真（4000px級）をそのまま保持すると保存・プレビュー再描画・PDF出力が
 * 全て重くなるため、印刷に必要な解像度まで先に落としておく。
 */
function resizeImageToDataURL(file, maxEdge, quality) {
  return new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      const longEdge = Math.max(width, height);
      if (longEdge > maxEdge) {
        const scale = maxEdge / longEdge;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      readFileAsDataURL(file).then(resolve); // リサイズ失敗時は元画像をそのまま使用
    };
    img.src = objectUrl;
  });
}

// 複数選択機能: セッション内のみ保持し、localStorage/IndexedDB には保存しない
const selectedPhotoIds = new Set();

/** チェックボックスの状態変化を selectedPhotoIds に反映する */
function togglePhotoSelection(id, checked) {
  if (checked) selectedPhotoIds.add(id);
  else selectedPhotoIds.delete(id);
  renderSelectionToolbar();
}

/** 選択状態に応じてフローティングツールバーの表示を更新する */
function renderSelectionToolbar() {
  const toolbar = document.getElementById('selectionToolbar');
  const count = selectedPhotoIds.size;

  if (count === 0) {
    toolbar.hidden = true;
    return;
  }

  toolbar.hidden = false;
  document.getElementById('selectionCount').textContent = `${count}枚選択中`;

  // 工程プルダウンを最新の processes 一覧で再構築する
  const processSelect = document.getElementById('bulkMoveProcessSelect');
  const currentValue = processSelect.value;
  processSelect.innerHTML = '<option value="">未分類</option>' +
    processes.map(pr => `<option value="${pr.id}">${escapeHtml(pr.name)}</option>`).join('');
  // 直前の選択値が引き続き有効なら復元する
  if ([...processSelect.options].some(o => o.value === currentValue)) {
    processSelect.value = currentValue;
  }
}

/** 選択をすべて解除する */
function clearSelection() {
  selectedPhotoIds.clear();
  renderPhotoList();
  renderSelectionToolbar();
}

/** 選択中の写真をまとめて削除する */
function bulkDeleteSelected() {
  if (!selectedPhotoIds.size) return;
  if (!confirm(`選択した${selectedPhotoIds.size}枚を削除しますか？`)) return;

  selectedPhotoIds.forEach(id => {
    photos = photos.filter(x => x.id !== id);
    deletePhotoSrc(id); // IndexedDB からも削除
    savedPhotoIds.delete(id);
  });
  selectedPhotoIds.clear();
  renderPhotoList();
  renderSelectionToolbar();
  updatePreview();
  document.getElementById('photoCount').textContent = photos.length;
}

/** 選択中の写真をまとめて別の工程/phaseへ移動する */
function bulkMoveSelected() {
  if (!selectedPhotoIds.size) return;

  const processSelect = document.getElementById('bulkMoveProcessSelect');
  const phaseSelect = document.getElementById('bulkMovePhaseSelect');
  const targetProcessId = processSelect.value === '' ? null : parseInt(processSelect.value);
  const targetPhase = phaseSelect.value;

  selectedPhotoIds.forEach(id => {
    const p = photos.find(x => x.id === id);
    if (p) {
      p.processId = targetProcessId;
      p.phase = targetPhase;
    }
  });

  selectedPhotoIds.clear();
  saveToStorage();
  renderPhotoList();
  renderSelectionToolbar();
  updatePreview();
}

const PHASE_LABELS = { before: '前', during: '中', after: '後' };
const PHASE_ORDER = ['before', 'during', 'after'];

function renderPhotoList() {
  const list = document.getElementById('photoList');
  list.innerHTML = '';

  // 削除済み写真の id が selectedPhotoIds に残らないようにする
  const existingIds = new Set(photos.map(p => p.id));
  Array.from(selectedPhotoIds).forEach(id => { if (!existingIds.has(id)) selectedPhotoIds.delete(id); });

  // グルーピングキー: processId (null は '未分類'扱い) -> phase -> photos[]
  // 工程セクションは写真が0枚でもD&Dのドロップ対象として常に表示する（未分類セクションは写真がある場合のみ表示）
  const groups = new Map(); // processId(or null) -> Map(phase -> photo[])
  processes.forEach(pr => groups.set(pr.id, { before: [], during: [], after: [] }));
  photos.forEach(p => {
    const pid = p.processId ?? null;
    if (!groups.has(pid)) groups.set(pid, { before: [], during: [], after: [] });
    const phase = PHASE_ORDER.includes(p.phase) ? p.phase : 'before';
    groups.get(pid)[phase].push(p);
  });

  // 表示順: processes の並び順 → 末尾に未分類
  const orderedGroupKeys = [...processes.map(pr => pr.id), null];

  orderedGroupKeys.forEach(pid => {
    const group = groups.get(pid);
    if (!group) return; // 未分類グループに写真が1枚もない場合のみここに該当
    if (pid === null && !Object.values(group).some(arr => arr.length)) return; // 未分類は空なら非表示

    const section = document.createElement('div');
    section.className = 'process-section';
    section.dataset.processId = pid === null ? '' : String(pid);

    const header = document.createElement('div');
    header.className = 'process-section-header';
    header.textContent = pid === null
      ? '未分類'
      : (processes.find(pr => pr.id === pid)?.name || '未分類');
    header.addEventListener('dragover', onProcessHeaderDragOver);
    header.addEventListener('dragleave', onProcessHeaderDragLeave);
    header.addEventListener('drop', e => onProcessHeaderDrop(e, pid, header));
    section.appendChild(header);

    PHASE_ORDER.forEach(phase => {
      const items = group[phase];
      if (!items.length) return;

      const phaseHeading = document.createElement('div');
      phaseHeading.className = 'phase-heading';
      phaseHeading.textContent = PHASE_LABELS[phase];
      section.appendChild(phaseHeading);

      items.forEach(p => section.appendChild(buildPhotoCard(p)));
    });

    list.appendChild(section);
  });
}

/** 1枚の写真カード DOM を構築する */
function buildPhotoCard(p) {
  const div = document.createElement('div');
  div.className = 'photo-item';
  div.draggable = true;
  div.dataset.photoId = String(p.id);
  div.addEventListener('dragstart', onPhotoCardDragStart);
  div.addEventListener('dragend', onPhotoCardDragEnd);
  div.addEventListener('dragover', onPhotoCardDragOver);
  div.addEventListener('dragleave', onPhotoCardDragLeave);
  div.addEventListener('drop', onPhotoCardDrop);

  const phaseTabsHTML = PHASE_ORDER.map(ph => `
    <button type="button"
      class="phase-tab-btn${(p.phase || 'before') === ph ? ' active' : ''}"
      onclick="setPhotoPhase(${p.id}, '${ph}')">${PHASE_LABELS[ph]}</button>
  `).join('');

  div.innerHTML = `
    <div class="photo-item-header">
      <input type="checkbox" class="photo-select-checkbox" data-photo-id="${p.id}" ${selectedPhotoIds.has(p.id) ? 'checked' : ''} onchange="togglePhotoSelection(${p.id}, this.checked)" aria-label="この写真を選択">
      <img class="photo-thumb" src="${p.src}" alt="">
      <span class="photo-name" title="${p.name}">${p.name}</span>
      <div class="photo-actions">
        <button class="btn-icon up" onclick="movePhoto(${p.id}, -1)" title="上へ">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button class="btn-icon down" onclick="movePhoto(${p.id}, 1)" title="下へ">
          <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button class="btn-icon" onclick="removePhoto(${p.id})" title="削除">
          <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    <div class="phase-tabs">${phaseTabsHTML}</div>
    <div class="photo-item-fields">
      <label>撮影日</label>
      <div class="photo-date-row">
        <input type="date" value="${p.date || ''}" onchange="updatePhotoField(${p.id}, 'date', this.value)" style="flex:1">
        ${p.exifDate ? '<span class="exif-badge"><svg class="icon-svg" style="width:1em;height:1em;margin-right:2px;" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>EXIF自動取得</span>' : ''}
      </div>
      <label>タイトル</label>
      <input type="text" value="${escapeAttr(p.title)}" placeholder="作業前①" oninput="updatePhotoField(${p.id}, 'title', this.value)">
      <label>説明</label>
      <textarea rows="2" placeholder="外観" oninput="updatePhotoField(${p.id}, 'desc', this.value)">${escapeHtml(p.desc)}</textarea>
    </div>
  `;
  return div;
}

/** 写真の phase（前/中/後）を切り替える */
function setPhotoPhase(id, phase) {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  p.phase = phase;
  saveToStorage();
  renderPhotoList();
  updatePreview();
}

/** 写真の所属工程を切り替える（D&D からも呼ばれる） */
function setPhotoProcess(id, processId) {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  p.processId = processId;
  saveToStorage();
  renderPhotoList();
  updatePreview();
}

// ======================== 工程セクションへの D&D ========================

let dragPhotoId = null;

function onPhotoCardDragStart(e) {
  dragPhotoId = parseInt(this.dataset.photoId);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragPhotoId));
}

function onPhotoCardDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.photo-item.drag-over-top, .photo-item.drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  dragPhotoId = null;
}

/** カード矩形の上半分にカーソルがあるかを判定する（dragover のインジケータ表示・drop の挿入位置決定の両方から使う） */
function isDragOverTopHalf(e, el) {
  const rect = el.getBoundingClientRect();
  return (e.clientY - rect.top) < rect.height / 2;
}

function onPhotoCardDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (dragPhotoId === null || parseInt(this.dataset.photoId) === dragPhotoId) return;

  document.querySelectorAll('.photo-item.drag-over-top, .photo-item.drag-over-bottom').forEach(el => {
    if (el !== this) el.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  const topHalf = isDragOverTopHalf(e, this);
  this.classList.toggle('drag-over-top', topHalf);
  this.classList.toggle('drag-over-bottom', !topHalf);
}

function onPhotoCardDragLeave() {
  this.classList.remove('drag-over-top', 'drag-over-bottom');
}

function onPhotoCardDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over-top', 'drag-over-bottom');
  // Task 2 で並び替え本体を実装
}

function onProcessHeaderDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function onProcessHeaderDragLeave() {
  this.classList.remove('drag-over');
}

function onProcessHeaderDrop(e, processId, headerEl) {
  e.preventDefault();
  (headerEl || e.currentTarget).classList.remove('drag-over');
  if (dragPhotoId === null) return;
  setPhotoProcess(dragPhotoId, processId);
}

function updatePhotoField(id, field, val) {
  const p = photos.find(x => x.id === id);
  if (p) { p[field] = val; }
  clearTimeout(window._previewTimer);
  window._previewTimer = setTimeout(updatePreview, 600);
}

function movePhoto(id, dir) {
  const idx = photos.findIndex(x => x.id === id);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= photos.length) return;
  [photos[idx], photos[newIdx]] = [photos[newIdx], photos[idx]];
  renderPhotoList();
  updatePreview();
}

function removePhoto(id) {
  photos = photos.filter(x => x.id !== id);
  deletePhotoSrc(id); // IndexedDB からも削除
  savedPhotoIds.delete(id);
  renderPhotoList();
  updatePreview();
  document.getElementById('photoCount').textContent = photos.length;
}

async function clearAllPhotos() {
  if (!photos.length || confirm('すべての写真を削除しますか？')) {
    photos = [];
    await clearAllPhotoSrcs(); // IndexedDB からも全削除
    savedPhotoIds.clear();
    renderPhotoList();
    updatePreview();
    document.getElementById('photoCount').textContent = 0;
  }
}

function applyAutoWorkDates(force = true) {
  if (!photos.length) return;
  const dates = photos.map(p => p.date).filter(d => d);
  if (!dates.length) return;
  dates.sort();
  const min = dates[0];
  const max = dates[dates.length - 1];

  const startEl = document.getElementById('coverWorkStartDate');
  const endEl = document.getElementById('coverWorkEndDate');

  if (force || !startEl.value) startEl.value = min;
  if (force || !endEl.value) endEl.value = max;
  saveToStorage();
  updatePreview();
}