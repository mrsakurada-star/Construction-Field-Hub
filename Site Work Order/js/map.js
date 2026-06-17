/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * 現場地図セクション（現場住所欄の下に小さく表示）。
 * - 住所入力 → Google Maps 埋め込み（クラシック形式、APIキー不要）
 * - 印刷時用の画像アップロード（IndexedDB保存）
 * - 画像未アップロード時のQRコード代替表示
 */

function getMapsEmbedUrl(address) {
  if (!address) return '';
  return 'https://maps.google.com/maps?q=' + encodeURIComponent(address) + '&output=embed';
}

function getMapsLinkUrl(address) {
  if (!address) return '';
  return 'https://maps.google.com/maps?q=' + encodeURIComponent(address);
}

function renderMapEmbed() {
  const wrap = document.getElementById('mapEmbedWrap');
  if (!wrap) return;
  const address = state.address;
  if (!address) {
    wrap.innerHTML = '<p class="map-empty">住所を入力すると地図が表示されます</p>';
    return;
  }
  wrap.innerHTML = '<iframe src="' + getMapsEmbedUrl(address) + '" loading="lazy"></iframe>';
}

function initMapUpload() {
  const zone = document.getElementById('mapUploadZone');
  const input = document.getElementById('mapImageInput');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleMapImageFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', (e) => {
    if (e.target.files.length) handleMapImageFile(e.target.files[0]);
  });
}

function handleMapImageFile(file) {
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    saveMapImage(reader.result);
    state.hasMapImage = true;
    saveToStorage();
    renderMapImagePreview(reader.result);
    renderPrintMapBlock();
  };
  reader.readAsDataURL(file);
}

async function renderMapImagePreview(srcOverride) {
  const previewEl = document.getElementById('mapImagePreview');
  if (!previewEl) return;
  const src = srcOverride || (state.hasMapImage ? await getMapImage() : null);
  if (src) {
    previewEl.innerHTML = '<img class="map-image-thumb" src="' + src + '" alt="現場地図"><button type="button" class="map-image-remove" onclick="removeMapImage()">削除</button>';
  } else {
    previewEl.innerHTML = '';
  }
}

async function removeMapImage() {
  await deleteMapImage();
  state.hasMapImage = false;
  saveToStorage();
  renderMapImagePreview(null);
  renderPrintMapBlock();
}

/* 印刷時のみ表示する地図ブロック（画像 or QRコード代替） */
async function renderPrintMapBlock() {
  const el = document.getElementById('printMapBlock');
  if (!el) return;
  const src = state.hasMapImage ? await getMapImage() : null;

  if (src) {
    el.innerHTML = '<img src="' + src + '" alt="現場地図" style="max-width:100%;max-height:100%;object-fit:contain;">';
  } else if (state.address) {
    el.innerHTML = '<div id="printQrCanvas"></div>';
    if (typeof QRCode !== 'undefined') {
      document.getElementById('printQrCanvas').innerHTML = '';
      new QRCode(document.getElementById('printQrCanvas'), { text: getMapsLinkUrl(state.address), width: 40, height: 40 });
    }
  } else {
    el.innerHTML = '';
  }
}
