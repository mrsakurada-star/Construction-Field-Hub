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
      phase: 'before',
      label: ''
    };
    photos.push(photo);
  }
  renderPhotoList();
  applyAutoWorkDates(false);
  updatePreview();
  const countEl = document.getElementById('photoCount');
  if (countEl) countEl.textContent = photos.length;
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
  const countEl = document.getElementById('photoCount');
  if (countEl) countEl.textContent = photos.length;
}

/** 選択中の写真をまとめて別の工程へ移動する */
function bulkMoveSelected() {
  if (!selectedPhotoIds.size) return;

  const processSelect = document.getElementById('bulkMoveProcessSelect');
  const targetProcessId = processSelect.value === '' ? null : parseInt(processSelect.value);

  selectedPhotoIds.forEach(id => {
    const p = photos.find(x => x.id === id);
    if (p) {
      p.processId = targetProcessId;
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

  // グルーピング: processId -> photos[]
  // 並べ替え順（photoOrder）は既に photos 配列に反映されているので、そのまま使用
  const groups = new Map(); // processId(or null) -> photo[]
  processes.forEach(pr => groups.set(pr.id, []));
  photos.forEach(p => {
    const pid = p.processId ?? null;
    if (!groups.has(pid)) groups.set(pid, []);
    groups.get(pid).push(p);
  });

  // 表示順: processes の並び順 → 末尾に未分類
  const orderedGroupKeys = [...processes.map(pr => pr.id), null];

  orderedGroupKeys.forEach(pid => {
    const groupPhotos = groups.get(pid);
    if (pid === null && (!groupPhotos || !groupPhotos.length)) return; // 未分類は空なら非表示

    const group = document.createElement('div');
    group.className = 'process-group';
    group.dataset.processId = pid === null ? '' : String(pid);

    // グループヘッダー: 工程名・枚数・ページ数ヒント・操作ボタン
    const header = document.createElement('div');
    header.className = 'process-group-header';

    const processName = pid === null
      ? '未分類'
      : (processes.find(pr => pr.id === pid)?.name || '未分類');
    const photoCount = groupPhotos ? groupPhotos.length : 0;
    const pageCount = Math.max(Math.ceil(photoCount / 3), 1); // 3枚/ページルール

    const headerContent = document.createElement('div');
    headerContent.className = 'process-group-header-content';
    headerContent.innerHTML = `
      <div class="process-group-info">
        <span class="process-group-name">${escapeHtml(processName)}</span>
        <span class="process-group-stats">·&nbsp;${photoCount}枚&nbsp;·&nbsp;${pageCount}ページ</span>
      </div>
      ${pid !== null ? `
        <div class="process-group-actions">
          <button class="btn-icon" type="button" onclick="moveProcess(${pid}, -1)" title="上へ">
            <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button class="btn-icon" type="button" onclick="moveProcess(${pid}, 1)" title="下へ">
            <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <button class="btn-icon" type="button" onclick="removeProcess(${pid})" title="削除">
            <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      ` : ''}
    `;
    header.appendChild(headerContent);
    header.addEventListener('dragover', onProcessHeaderDragOver);
    header.addEventListener('dragleave', onProcessHeaderDragLeave);
    header.addEventListener('drop', e => onProcessHeaderDrop(e, pid, header));
    group.appendChild(header);

    // グリッド領域
    const grid = document.createElement('div');
    grid.className = 'photo-grid';
    grid.dataset.processId = pid === null ? '' : String(pid);
    if (!photoCount) {
      // 空工程: 破線ドロップゾーン
      grid.classList.add('empty-drop-zone');
      grid.innerHTML = '<div class="empty-drop-hint">ここに写真をドラッグ</div>';
    } else {
      // 写真をグリッドに配置
      groupPhotos.forEach((p, idx) => {
        // 3枚ごとにページ区切りマーカーを挿入
        if (idx > 0 && idx % 3 === 0) {
          const marker = document.createElement('div');
          marker.className = 'photo-grid-page-marker';
          const pageNum = Math.floor(idx / 3) + 1;
          marker.innerHTML = `<span>─ ページ ${pageNum} ─</span>`;
          grid.appendChild(marker);
        }
        grid.appendChild(buildPhotoCard(p));
      });
    }
    group.appendChild(grid);
    list.appendChild(group);
  });

  // 「＋工程を追加」ボタン
  const addButton = document.createElement('div');
  addButton.className = 'add-process-button-row';
  addButton.innerHTML = `
    <button class="btn btn-outline" type="button" onclick="showAddProcessDialog()">
      <i data-lucide="plus"></i>工程を追加
    </button>
  `;
  list.appendChild(addButton);
}

/** 1枚の写真タイル DOM を構築する（グリッド用） */
function buildPhotoCard(p) {
  const div = document.createElement('div');
  div.className = 'photo-tile';
  div.draggable = true;
  div.dataset.photoId = String(p.id);
  div.addEventListener('dragstart', onPhotoCardDragStart);
  div.addEventListener('dragend', onPhotoCardDragEnd);
  div.addEventListener('dragover', onPhotoCardDragOver);
  div.addEventListener('dragleave', onPhotoCardDragLeave);
  div.addEventListener('drop', onPhotoCardDrop);

  // ラベルチップ（未設定なら非表示）
  const labelChipHTML = (p.label && p.label.trim())
    ? `<div class="label-chip" title="${escapeAttr(p.label)}">${escapeHtml(p.label)}</div>`
    : '';

  div.innerHTML = `
    <div class="photo-tile-header">
      <input type="checkbox" class="photo-select-checkbox" data-photo-id="${p.id}" ${selectedPhotoIds.has(p.id) ? 'checked' : ''} onchange="togglePhotoSelection(${p.id}, this.checked)" aria-label="この写真を選択">
      <button class="photo-tile-thumb-btn" type="button" onclick="openLightbox(${p.id})" style="flex:1; border:none; background:none; padding:0; cursor:pointer;">
        <img class="photo-tile-thumb" src="${p.src}" alt="">
      </button>
      <div class="photo-tile-actions">
        <button class="btn-icon" type="button" onclick="removePhoto(${p.id})" title="削除">
          <svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    ${labelChipHTML}
    <div class="photo-tile-meta">
      <div class="photo-meta-row">
        <label>撮影日</label>
        <input type="date" value="${p.date || ''}" onchange="updatePhotoField(${p.id}, 'date', this.value)">
        ${p.exifDate ? '<svg class="icon-svg" viewBox="0 0 24 24" title="EXIF自動取得"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' : ''}
      </div>
      <div class="photo-meta-row">
        <label>タイトル</label>
        <input type="text" value="${escapeAttr(p.title)}" placeholder="作業前①" oninput="updatePhotoField(${p.id}, 'title', this.value)">
      </div>
      <div class="photo-meta-row">
        <label>説明</label>
        <textarea rows="1" placeholder="外観" oninput="updatePhotoField(${p.id}, 'desc', this.value)">${escapeHtml(p.desc)}</textarea>
      </div>
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

  const targetId = parseInt(this.dataset.photoId);
  if (dragPhotoId === null || dragPhotoId === targetId) return;

  const dragIdx = photos.findIndex(p => p.id === dragPhotoId);
  if (dragIdx === -1) return;
  if (!photos.some(p => p.id === targetId)) return; // ドロップ先が既に存在しない（古いDOM）場合は何もしない

  const [dragged] = photos.splice(dragIdx, 1);

  const target = photos.find(p => p.id === targetId);
  dragged.processId = target.processId;
  dragged.phase = target.phase;

  const targetIdx = photos.findIndex(p => p.id === targetId);
  const insertAt = isDragOverTopHalf(e, this) ? targetIdx : targetIdx + 1;
  photos.splice(insertAt, 0, dragged);

  saveToStorage();
  renderPhotoList();
  updatePreview();
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
  const countEl = document.getElementById('photoCount');
  if (countEl) countEl.textContent = photos.length;
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

/** 工程追加ダイアログを表示する（簡易版） */
function showAddProcessDialog() {
  const name = prompt('新しい工程名を入力してください:');
  if (name) {
    addProcess(name);
  }
}

// ライトボックス状態
let currentLightboxPhotoId = null;

/** ライトボックスを開く */
function openLightbox(photoId) {
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;

  currentLightboxPhotoId = photoId;
  const overlay = document.getElementById('lightboxOverlay');

  // 画像と情報を設定
  document.getElementById('lightboxImage').src = photo.src;
  document.getElementById('lightboxFilename').textContent = photo.name;
  const exifBadge = document.getElementById('lightboxExifBadge');
  exifBadge.style.display = photo.exifDate ? 'inline-block' : 'none';

  // フォーム値を反映
  document.getElementById('lightboxDate').value = photo.date || '';
  document.getElementById('lightboxTitle').value = photo.title || '';
  document.getElementById('lightboxDesc').value = photo.desc || '';
  document.getElementById('lightboxLabel').value = photo.label || '';

  // ナビボタンの disabled 状態を更新
  updateLightboxNavButtons();

  // オーバーレイを表示
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';

  // キーボードリスナー付与
  document.addEventListener('keydown', handleLightboxKeydown);
  // 背景クリックで閉じる
  overlay.addEventListener('click', handleLightboxBackgroundClick);
}

/** ライトボックスナビゲーション（前後送り） */
function lightboxNav(direction) {
  if (currentLightboxPhotoId === null) return;

  // 現在のインデックスを取得
  const currentIdx = photos.findIndex(p => p.id === currentLightboxPhotoId);
  if (currentIdx === -1) return;

  const nextIdx = currentIdx + direction;
  if (nextIdx < 0 || nextIdx >= photos.length) return; // 端で止める

  openLightbox(photos[nextIdx].id);
}

/** ライトボックスナビボタンの disabled 状態を更新 */
function updateLightboxNavButtons() {
  if (currentLightboxPhotoId === null) return;

  const currentIdx = photos.findIndex(p => p.id === currentLightboxPhotoId);
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');

  prevBtn.disabled = currentIdx <= 0;
  nextBtn.disabled = currentIdx >= photos.length - 1;
}

/** ライトボックスを閉じる */
function closeLightbox() {
  currentLightboxPhotoId = null;
  const overlay = document.getElementById('lightboxOverlay');
  overlay.hidden = true;
  document.body.style.overflow = 'auto';

  // キーボードリスナー削除
  document.removeEventListener('keydown', handleLightboxKeydown);
  overlay.removeEventListener('click', handleLightboxBackgroundClick);
}

/** ライトボックス内フィールド更新（その場編集がタイル側に反映） */
function updateLightboxField(field, value) {
  if (currentLightboxPhotoId === null) return;

  const photo = photos.find(p => p.id === currentLightboxPhotoId);
  if (!photo) return;

  photo[field] = value;
  saveToStorage();

  // タイル側のDOM を更新（該当タイルを再描画）
  const tileEl = document.querySelector(`[data-photo-id="${currentLightboxPhotoId}"]`);
  if (tileEl && field !== 'label') {
    // 日付/タイトル/説明の場合はタイル内 input 値を更新
    if (field === 'date') {
      const dateInput = tileEl.querySelector('input[type="date"]');
      if (dateInput) dateInput.value = value;
    } else if (field === 'title') {
      const titleInput = tileEl.querySelector('input[type="text"]');
      if (titleInput) titleInput.value = value;
    } else if (field === 'desc') {
      const descInput = tileEl.querySelector('textarea');
      if (descInput) descInput.value = value;
    }
  } else if (tileEl && field === 'label') {
    // ラベルの場合はchip を再描画
    renderPhotoList();
  }

  updatePreview();
}

/** ライトボックスキーボード操作ハンドラ */
function handleLightboxKeydown(e) {
  if (document.getElementById('lightboxOverlay').hidden) return;

  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    lightboxNav(-1);
  } else if (e.key === 'ArrowRight') {
    lightboxNav(1);
  } else if (e.key === 'Tab') {
    // フォーカストラップ
    const overlay = document.getElementById('lightboxOverlay');
    const focusableElements = overlay.querySelectorAll(
      'button, input, textarea, [tabindex]'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
}

/** ライトボックス背景クリックで閉じる */
function handleLightboxBackgroundClick(e) {
  if (e.target === document.getElementById('lightboxOverlay')) {
    closeLightbox();
  }
}

/** 写真の任意ラベルを更新する */
function updatePhotoLabel(id, label) {
  const p = photos.find(x => x.id === id);
  if (p) { p.label = label; }
  saveToStorage();
  renderPhotoList();
  updatePreview();
}