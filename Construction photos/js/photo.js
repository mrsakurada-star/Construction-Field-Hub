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

async function handleFiles(files) {
  for (const file of files) {
    const src = await readFileAsDataURL(file);
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
      file, src, name: file.name,
      date: fallbackDate,
      exifDate: exifDate,
      title: '',
      desc: ''
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

function renderPhotoList() {
  const list = document.getElementById('photoList');
  list.innerHTML = '';
  photos.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'photo-item';
    div.innerHTML = `
      <div class="photo-item-header">
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
    list.appendChild(div);
  });
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
  renderPhotoList();
  updatePreview();
  document.getElementById('photoCount').textContent = photos.length;
}

async function clearAllPhotos() {
  if (!photos.length || confirm('すべての写真を削除しますか？')) {
    photos = [];
    await clearAllPhotoSrcs(); // IndexedDB からも全削除
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