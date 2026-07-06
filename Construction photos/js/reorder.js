/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * 写真並べ替えページのロジック
 * - localStorage からメタ情報・順番を読み込む
 * - IndexedDB から画像 src を読み込む
 * - HTML5 Drag and Drop API で並べ替える
 * - 保存で photoOrder を localStorage に書き込む
 *
 * STORAGE_KEY・formatDate は js/common.js で定義（index 側と共用）。
 */

// 現在の並び順で管理する配列
let photoItems = []; // { id, src, title, name, date }

// ドラッグ状態
let dragSrcEl  = null;
let dragSrcIdx = null;

/** ページ初期化 */
async function initReorder() {
  // IndexedDB 初期化
  await initDB();

  // localStorage からメタ情報・順番を読み込む
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    showEmpty();
    return;
  }

  let meta, order;
  try {
    const data = JSON.parse(raw);
    meta  = data.photosMeta  || [];
    order = data.photoOrder  || meta.map(m => m.id);
  } catch (e) {
    showEmpty();
    return;
  }

  if (!meta.length) {
    showEmpty();
    return;
  }

  // IndexedDB から全 src を取得
  const srcMap = await getAllPhotoSrcs();

  // order 順に photoItems を構築
  const metaById = new Map(meta.map(m => [m.id, m]));
  photoItems = order
    .filter(id => metaById.has(id))
    .map(id => {
      const m = metaById.get(id);
      return {
        id:    m.id,
        src:   srcMap.get(m.id) || null,
        title: m.title || '',
        name:  m.name  || '',
        date:  m.date  || ''
      };
    });

  // カウント表示
  document.getElementById('photoCountBadge').textContent = photoItems.length + '枚';

  renderGrid();
}

/** グリッド再描画 */
function renderGrid() {
  const grid = document.getElementById('thumbGrid');
  grid.innerHTML = '';

  photoItems.forEach((item, idx) => {
    const card = createCard(item, idx);
    grid.appendChild(card);
  });
}

/** サムネイルカードを生成して返す */
function createCard(item, idx) {
  const card = document.createElement('div');
  card.className   = 'thumb-card';
  card.draggable   = true;
  card.dataset.idx = idx;

  // 順番バッジ
  const badge = document.createElement('div');
  badge.className   = 'order-badge';
  badge.textContent = idx + 1;

  // サムネイル画像エリア
  const imgWrap = document.createElement('div');
  imgWrap.className = 'thumb-img-wrap';

  if (item.src) {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title || item.name;
    img.draggable = false; // 画像ではなくカードをドラッグ
    imgWrap.appendChild(img);
  } else {
    const noImg = document.createElement('span');
    noImg.className   = 'no-img';
    noImg.textContent = '画像なし';
    imgWrap.appendChild(noImg);
  }

  // 情報エリア
  const info = document.createElement('div');
  info.className = 'thumb-info';

  const titleEl = document.createElement('div');
  titleEl.className   = 'thumb-title';
  titleEl.textContent = item.title || item.name || '（タイトルなし）';

  const metaEl = document.createElement('div');
  metaEl.className   = 'thumb-meta';
  metaEl.textContent = item.date ? formatDate(item.date) : '';

  info.appendChild(titleEl);
  info.appendChild(metaEl);

  card.appendChild(badge);
  card.appendChild(imgWrap);
  card.appendChild(info);

  // ドラッグイベントの登録
  card.addEventListener('dragstart',  onDragStart);
  card.addEventListener('dragover',   onDragOver);
  card.addEventListener('dragleave',  onDragLeave);
  card.addEventListener('drop',       onDrop);
  card.addEventListener('dragend',    onDragEnd);

  return card;
}

// ======================== Drag & Drop ========================

function onDragStart(e) {
  dragSrcEl  = this;
  dragSrcIdx = parseInt(this.dataset.idx);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcIdx); // Firefox 対応
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== dragSrcEl) {
    this.classList.add('drag-over');
  }
}

function onDragLeave() {
  this.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  const targetIdx = parseInt(this.dataset.idx);
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;

  // photoItems 配列を並べ替え
  const moved = photoItems.splice(dragSrcIdx, 1)[0];
  photoItems.splice(targetIdx, 0, moved);

  renderGrid();
}

function onDragEnd() {
  // すべてのカードからドラッグ中クラスを除去
  document.querySelectorAll('.thumb-card').forEach(c => {
    c.classList.remove('dragging', 'drag-over');
  });
  dragSrcEl  = null;
  dragSrcIdx = null;
}

// ======================== 保存処理 ========================

/** 並び順を localStorage に保存してトーストを表示 */
function saveOrder() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    data.photoOrder = photoItems.map(item => item.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast('並び順を保存しました ✓');
  } catch (e) {
    showToast('保存に失敗しました', false);
  }
}

/** 保存してメインページへ戻る */
function saveAndBack() {
  saveOrder();
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 900); // トースト表示後に遷移
}

// ======================== UI ヘルパー ========================

function showEmpty() {
  document.getElementById('thumbGrid').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('photoCountBadge').textContent = '0枚';
}

function showToast(msg, success = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show' + (success ? ' success' : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}
