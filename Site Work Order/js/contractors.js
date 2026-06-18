/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * 業者カード（横並び）と、業者×時間帯（7:00〜18:00）の工程表グリッドを管理する。
 * グリッドのセルはクリックで手動塗りつぶし（自動描画ではなく、デザイン通りの手動方式）。
 */

const SWO_GANTT_HOURS = ['7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
const SWO_MAX_PRINTABLE_CONTRACTORS = 12; // A4横1ページに収まる業者カードの上限（density-tiny時の実測値）

function addContractor() {
  const id = state.nextId;
  state.nextId = id + 1;
  state.contractors.push({ id, name: '', content: '', notes: '', items: '' });
  saveToStorage();
  renderContractorList();
  renderScheduleGrid();
  if (state.contractors.length === SWO_MAX_PRINTABLE_CONTRACTORS + 1) {
    alert('業者数が' + SWO_MAX_PRINTABLE_CONTRACTORS + '社を超えました。印刷時に右端のカードが表示されない可能性があります。複数枚に分けて発行することをご検討ください。');
  }
}

function removeContractor(id) {
  if (state.contractors.length <= 1) return;
  state.contractors = state.contractors.filter(c => c.id !== id);
  saveToStorage();
  renderContractorList();
  renderScheduleGrid();
}

function reorderContractor(draggedId, targetId) {
  if (draggedId === targetId) return;
  const fromIndex = state.contractors.findIndex(c => c.id === draggedId);
  const toIndex = state.contractors.findIndex(c => c.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [moved] = state.contractors.splice(fromIndex, 1);
  state.contractors.splice(toIndex, 0, moved);
  saveToStorage();
  renderContractorList();
  renderScheduleGrid();
}

let swoDraggedContractorId = null;

function handleContractorDragStart(ev, id) {
  swoDraggedContractorId = id;
  ev.dataTransfer.effectAllowed = 'move';
  ev.currentTarget.classList.add('dragging');
}

function handleContractorDragEnd(ev) {
  ev.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.c-col.drag-over').forEach(el => el.classList.remove('drag-over'));
  swoDraggedContractorId = null;
}

function handleContractorDragOver(ev, id) {
  ev.preventDefault();
  if (swoDraggedContractorId === null || swoDraggedContractorId === id) return;
  ev.currentTarget.classList.add('drag-over');
}

function handleContractorDragLeave(ev) {
  ev.currentTarget.classList.remove('drag-over');
}

function handleContractorDrop(ev, id) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  if (swoDraggedContractorId === null) return;
  reorderContractor(swoDraggedContractorId, id);
}

function updateContractorField(id, field, value) {
  const c = state.contractors.find(x => x.id === id);
  if (!c) return;
  c[field] = value;
  saveToStorage();
  if (field === 'name') renderScheduleGrid();
}

function updateScheduleCell(el, contractorId, hour) {
  const key = contractorId + '_' + hour;
  const value = el.value;
  if (value) {
    state.schedule[key] = value;
    el.parentElement.classList.add('on');
  } else {
    delete state.schedule[key];
    el.parentElement.classList.remove('on');
  }
  saveToStorage();
}

function renderContractorList() {
  const container = document.getElementById('contractorList');
  container.classList.remove('density-compact', 'density-tiny');
  if (state.contractors.length > 9) {
    container.classList.add('density-tiny');
  } else if (state.contractors.length > 6) {
    container.classList.add('density-compact');
  }
  container.innerHTML = state.contractors.map(c => `
    <div class="c-col" draggable="true"
      ondragstart="handleContractorDragStart(event,${c.id})"
      ondragend="handleContractorDragEnd(event)"
      ondragover="handleContractorDragOver(event,${c.id})"
      ondragleave="handleContractorDragLeave(event)"
      ondrop="handleContractorDrop(event,${c.id})">
      <div class="c-head">
        <span class="c-drag-handle" title="ドラッグして並べ替え">⠿</span>
        <input type="text" value="${escapeAttr(c.name)}" oninput="updateContractorField(${c.id},'name',this.value)" placeholder="業者名">
        <button type="button" class="c-remove" onclick="removeContractor(${c.id})">×</button>
      </div>
      <div class="c-section c-section-content">
        <div class="c-label">工事内容</div>
        <textarea oninput="updateContractorField(${c.id},'content',this.value)" placeholder="工事内容を記入">${escapeHtml(c.content)}</textarea>
      </div>
      <div class="c-section c-section-notes">
        <div class="c-label c-label-accent">注意点</div>
        <textarea oninput="updateContractorField(${c.id},'notes',this.value)" placeholder="安全・品質上の注意点">${escapeHtml(c.notes)}</textarea>
      </div>
      <div class="c-section c-section-items">
        <div class="c-label">持参品</div>
        <textarea oninput="updateContractorField(${c.id},'items',this.value)" placeholder="持参する工具・機材">${escapeHtml(c.items)}</textarea>
      </div>
    </div>
  `).join('');
}

function renderScheduleGrid() {
  const grid = document.getElementById('scheduleGrid');
  const hours = SWO_GANTT_HOURS;
  const n = state.contractors.length;
  const densityClass = n > 9 ? ' density-tiny' : (n > 6 ? ' density-compact' : '');

  let html = '<div class="sched-grid' + densityClass + '" style="grid-template-columns:56px repeat(' + hours.length + ',1fr);">';
  html += '<div class="sched-cell sched-head">業者</div>';
  hours.forEach(h => { html += '<div class="sched-cell sched-head sched-hour">' + h + ':00</div>'; });

  state.contractors.forEach(c => {
    html += '<div class="sched-cell sched-name">' + escapeHtml(c.name || ('業者' + c.id)) + '</div>';
    hours.forEach(h => {
      const raw = state.schedule[c.id + '_' + h];
      const value = typeof raw === 'string' ? raw : '';
      const on = !!raw;
      html += '<div class="sched-cell sched-slot' + (on ? ' on' : '') + '">' +
        '<input type="text" class="sched-slot-input" value="' + escapeAttr(value) +
        '" oninput="updateScheduleCell(this,' + c.id + ',\'' + h + '\')">' +
        '</div>';
    });
  });

  html += '</div>';
  grid.innerHTML = html;
}
