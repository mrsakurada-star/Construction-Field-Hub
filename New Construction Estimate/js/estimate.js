/* © 2026 Nozomi Sakurada. All rights reserved. */

// ===== 状態管理 =====
const state = {
  clientName: '',
  projectName: '',
  location: '',
  estimateDate: '',
  validUntil: '',
  estimateNumber: '',
  items: {
    equipment: [],
    relatedParts: [],
    workMaterials: [],
    works: []
  },
  discount: 0,
  taxRate: 10,
  savedId: null,
  createdAt: null
};

// ===== マスターデータ =====
let allEquipment = [];
let allMaterials = [];
let allWorks = [];

// ===== ピッカーモーダル状態 =====
let pickerCurrentCat = null;
let pickerSearchQuery = '';

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
  setDefaultDate();
  await loadAllData();
});

function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  document.getElementById('estimateDate').value = `${year}-${month}-${day}`;
}

async function loadAllData() {
  try {
    await initDB();
    allEquipment = await getEquipmentList();
    allMaterials = await getMaterialList();
    allWorks = await getWorkList();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ===== スクリーン遷移 =====
function proceedToEditor() {
  const clientName = document.getElementById('clientName').value.trim();
  const projectName = document.getElementById('projectName').value.trim();
  const location = document.getElementById('location').value.trim();

  if (!clientName || !projectName || !location) {
    alert('顧客名、物件名、所在地を入力してください');
    return;
  }

  state.clientName = clientName;
  state.projectName = projectName;
  state.location = location;
  state.estimateDate = document.getElementById('estimateDate').value;
  const validMonths = parseInt(document.getElementById('validPeriod').value) || 1;
  state.validUntil = computeValidUntil(state.estimateDate, validMonths);

  document.getElementById('editorProjectTitle').textContent =
    `${state.projectName} / ${state.clientName}`;

  showScreen('editor');
  renderAllCategories();
  renderTotals();
}

function backToInfo() {
  state.items = {
    equipment: [],
    relatedParts: [],
    workMaterials: [],
    works: []
  };
  state.discount = 0;
  state.savedId = null;
  showScreen('info');
}

function showScreen(name) {
  const infoScreen = document.getElementById('screen-info');
  const editorScreen = document.getElementById('screen-editor');

  if (name === 'info') {
    infoScreen.classList.remove('hidden');
    infoScreen.classList.add('active');
    editorScreen.classList.add('hidden');
    editorScreen.classList.remove('active');
  } else {
    infoScreen.classList.add('hidden');
    infoScreen.classList.remove('active');
    editorScreen.classList.remove('hidden');
    editorScreen.classList.add('active');
  }
}

// ===== ヘルパー関数 =====
function computeValidUntil(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function generateLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatYen(n) {
  const num = Math.round(n) || 0;
  return '¥' + num.toLocaleString('ja-JP');
}

// ===== カテゴリレンダリング =====
function renderAllCategories() {
  ['equipment', 'relatedParts', 'workMaterials', 'works'].forEach(renderCategory);
}

function renderCategory(cat) {
  const tbody = document.getElementById(`items-${cat}`);
  tbody.innerHTML = '';

  state.items[cat].forEach(line => {
    tbody.appendChild(buildLineRow(cat, line));
  });

  const subtotal = calcCategorySubtotal(cat);
  document.getElementById(`subtotal-${cat}`).textContent = '小計: ' + formatYen(subtotal);
}

function buildLineRow(cat, line) {
  const tr = document.createElement('tr');
  const amount = line.qty * line.unitPrice;

  tr.innerHTML = `
    <td>${line.code || ''}</td>
    <td>${line.name}</td>
    <td><input type="number" value="${line.qty}" min="1" onchange="updateLineQty('${cat}', '${line.lineId}', this.value)"></td>
    <td class="right">${formatYen(line.unitPrice)}</td>
    <td class="right">${formatYen(amount)}</td>
    <td class="action-buttons">
      <button class="btn btn-sm btn-secondary" onclick="removeLine('${cat}', '${line.lineId}')">削</button>
    </td>
  `;

  return tr;
}

// ===== 計算 =====
function calcCategorySubtotal(cat) {
  return state.items[cat].reduce((sum, line) => sum + (line.qty * line.unitPrice), 0);
}

function calcSubtotalAll() {
  return ['equipment', 'relatedParts', 'workMaterials', 'works']
    .reduce((sum, cat) => sum + calcCategorySubtotal(cat), 0);
}

function renderTotals() {
  const subtotal = calcSubtotalAll();
  const discount = state.discount;
  const taxable = subtotal - discount;
  const tax = Math.floor(taxable * state.taxRate / 100);
  const grand = taxable + tax;

  document.getElementById('total-subtotal').textContent = formatYen(subtotal);
  document.getElementById('total-discount').textContent = '-' + formatYen(discount);
  document.getElementById('total-tax').textContent = formatYen(tax);
  document.getElementById('total-grand').textContent = formatYen(grand);
}

function onDiscountChange() {
  state.discount = Math.max(0, parseInt(document.getElementById('discountInput').value) || 0);
  renderTotals();
}

// ===== 行操作 =====
function removeLine(cat, lineId) {
  state.items[cat] = state.items[cat].filter(line => line.lineId !== lineId);
  renderCategory(cat);
  renderTotals();
}

function updateLineQty(cat, lineId, rawVal) {
  const line = state.items[cat].find(l => l.lineId === lineId);
  if (!line) return;

  const newQty = Math.max(1, parseInt(rawVal) || 1);
  line.qty = newQty;
  line.amount = line.qty * line.unitPrice;

  renderCategory(cat);
  renderTotals();
}

function addLineToCategory(cat, fields) {
  state.items[cat].push({
    lineId: generateLineId(),
    sourceId: fields.sourceId || null,
    code: fields.code || '',
    name: fields.name,
    qty: fields.qty,
    unitPrice: fields.unitPrice,
    amount: fields.qty * fields.unitPrice
  });
}

// ===== ピッカーモーダル =====
function openPickerModal(cat) {
  pickerCurrentCat = cat;
  pickerSearchQuery = '';

  const catLabels = {
    'equipment': '機器',
    'relatedParts': '関連部材',
    'workMaterials': '工事部材',
    'works': '工事費'
  };

  document.getElementById('picker-title').textContent = 'アイテム追加 - ' + (catLabels[cat] || cat);
  document.getElementById('picker-search').value = '';

  pickerTab('master');
  renderPickerRows('');

  openModal('modal-picker');
}

function renderPickerRows(searchQuery) {
  const source = getPickerSource(pickerCurrentCat);
  const q = searchQuery.toLowerCase();
  const filtered = source.filter(item => {
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || (item.id || '').toLowerCase().includes(q);
  });

  const tbody = document.getElementById('picker-rows');
  tbody.innerHTML = '';

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="picker-check" value="${item.id}"></td>
      <td>${item.id || ''}</td>
      <td>${item.name}</td>
      <td class="right">${formatYen(item.unitPrice || 0)}</td>
      <td><input type="number" class="picker-qty" value="1" min="1"></td>
    `;
    tbody.appendChild(tr);
  });
}

function getPickerSource(cat) {
  if (cat === 'equipment') {
    return allEquipment.filter(e => e.isMainUnit);
  } else if (cat === 'relatedParts') {
    return allMaterials.filter(m => m.isOption);
  } else if (cat === 'workMaterials') {
    return allMaterials.filter(m => !m.isOption);
  } else if (cat === 'works') {
    return allWorks;
  }
  return [];
}

function onPickerSearch() {
  const q = document.getElementById('picker-search').value;
  renderPickerRows(q);
}

function pickerTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  if (tabName === 'master') {
    document.getElementById('picker-master').classList.add('active');
  } else {
    document.getElementById('picker-custom').classList.add('active');
  }
}

function confirmPickerSelection() {
  const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

  if (activeTab === 'master') {
    const rows = document.querySelectorAll('#picker-rows tr');
    const source = getPickerSource(pickerCurrentCat);

    rows.forEach(row => {
      const cb = row.querySelector('.picker-check');
      if (!cb.checked) return;

      const qtyInput = row.querySelector('.picker-qty');
      const sourceItem = source.find(item => item.id === cb.value);
      if (!sourceItem) return;

      addLineToCategory(pickerCurrentCat, {
        sourceId: sourceItem.id,
        code: sourceItem.id,
        name: sourceItem.name,
        qty: parseInt(qtyInput.value) || 1,
        unitPrice: sourceItem.unitPrice || 0
      });
    });
  } else {
    const name = document.getElementById('custom-name').value.trim();
    if (!name) {
      alert('品名を入力してください');
      return;
    }

    const code = document.getElementById('custom-code').value.trim();
    const price = parseInt(document.getElementById('custom-price').value) || 0;
    const qty = parseInt(document.getElementById('custom-qty').value) || 1;

    addLineToCategory(pickerCurrentCat, {
      sourceId: null,
      code,
      name,
      qty,
      unitPrice: price
    });

    document.getElementById('custom-code').value = '';
    document.getElementById('custom-name').value = '';
    document.getElementById('custom-price').value = '';
    document.getElementById('custom-qty').value = '1';
  }

  closeModal('modal-picker');
  renderAllCategories();
  renderTotals();
}

function closePickerModal() {
  closeModal('modal-picker');
}

// ===== テンプレート =====
async function openTemplateModal() {
  try {
    const templates = await getTemplateList();
    const container = document.getElementById('template-list-body');
    container.innerHTML = '';

    if (templates.length === 0) {
      container.innerHTML = '<p style="color: #999; text-align: center;">テンプレートがありません</p>';
    } else {
      templates.forEach(t => {
        const div = document.createElement('div');
        div.className = 'template-option';
        div.innerHTML = `
          <div>
            <div class="template-name">${t.name || '（名前なし）'}</div>
            <div class="template-desc">${t.description || ''}</div>
          </div>
          <button class="btn btn-primary" onclick="applyTemplate(${t.id})">読み込む</button>
        `;
        container.appendChild(div);
      });
    }

    openModal('modal-template');
  } catch (error) {
    console.error('Error loading templates:', error);
    alert('テンプレートの読み込みに失敗しました');
  }
}

async function applyTemplate(templateId) {
  try {
    const template = await getTemplate(templateId);
    if (!template || !template.items || template.items.length === 0) {
      alert('テンプレートにアイテムがありません');
      return;
    }

    // テンプレートのアイテムIDをすべてのマスターから解決
    const allItems = [...allEquipment, ...allMaterials, ...allWorks];

    template.items.forEach(itemId => {
      const masterItem = allItems.find(item => item.id === itemId);
      if (!masterItem) return;

      const cat = resolveCategoryForMaster(masterItem);
      addLineToCategory(cat, {
        sourceId: masterItem.id,
        code: masterItem.id,
        name: masterItem.name,
        qty: masterItem.qty || 1,
        unitPrice: masterItem.unitPrice || 0
      });
    });

    closeModal('modal-template');
    renderAllCategories();
    renderTotals();
  } catch (error) {
    console.error('Error applying template:', error);
    alert('テンプレートの適用に失敗しました');
  }
}

function resolveCategoryForMaster(item) {
  if (allEquipment.some(e => e.id === item.id)) return 'equipment';
  if (allWorks.some(w => w.id === item.id)) return 'works';
  return item.isOption ? 'relatedParts' : 'workMaterials';
}

function closeTemplateModal() {
  closeModal('modal-template');
}

// ===== 保存 =====
async function saveCurrentEstimate() {
  try {
    // 見積番号の生成
    if (!state.estimateNumber) {
      const dateStr = state.estimateDate.replace(/-/g, '');
      const estimateList = await getEstimateList();
      const seq = String(estimateList.length + 1).padStart(3, '0');
      state.estimateNumber = `EST-${dateStr}-${seq}`;
    }

    const payload = {
      estimateNumber: state.estimateNumber,
      clientName: state.clientName,
      projectName: state.projectName,
      location: state.location,
      estimateDate: state.estimateDate,
      validUntil: state.validUntil,
      items: state.items,
      discount: state.discount,
      taxRate: state.taxRate,
      updatedAt: new Date().toISOString()
    };

    if (state.savedId) {
      payload.id = state.savedId;
      payload.createdAt = state.createdAt;
      await saveEstimate(payload);
    } else {
      payload.createdAt = new Date().toISOString();
      state.savedId = await saveEstimate(payload);
      state.createdAt = payload.createdAt;
    }

    alert(`見積書を保存しました (${state.estimateNumber})`);
  } catch (error) {
    console.error('Error saving estimate:', error);
    alert('見積書の保存に失敗しました');
  }
}

// ===== 印刷 =====
function printEstimate() {
  buildPrintArea();
  window.print();
}

function buildPrintArea() {
  const subtotal = calcSubtotalAll();
  const discount = state.discount;
  const taxable = subtotal - discount;
  const tax = Math.floor(taxable * state.taxRate / 100);
  const grand = taxable + tax;

  const catDefs = [
    { key: 'equipment', label: '機器' },
    { key: 'relatedParts', label: '関連部材' },
    { key: 'workMaterials', label: '工事部材' },
    { key: 'works', label: '工事費' }
  ];

  let tablesHTML = '';
  catDefs.forEach(({ key, label }) => {
    if (state.items[key].length === 0) return;

    const catSubtotal = calcCategorySubtotal(key);
    tablesHTML += `
      <tr class="category-header-row">
        <td colspan="5">${label}</td>
      </tr>
    `;

    state.items[key].forEach(line => {
      const amount = line.qty * line.unitPrice;
      tablesHTML += `
        <tr>
          <td>${line.code || ''}</td>
          <td>${line.name}</td>
          <td class="right">${line.qty}</td>
          <td class="right">${formatYen(line.unitPrice)}</td>
          <td class="right">${formatYen(amount)}</td>
        </tr>
      `;
    });

    tablesHTML += `
      <tr class="subtotal-row">
        <td colspan="4" class="right">小計</td>
        <td class="right">${formatYen(catSubtotal)}</td>
      </tr>
    `;
  });

  const printArea = document.getElementById('print-area');
  printArea.innerHTML = `
    <div class="print-doc">
      <div class="print-company-header">
        <div class="co-name">建設設備ソリューション</div>
        <div class="co-address">TEL: 000-000-0000</div>
      </div>

      <h1 class="print-title">御見積書</h1>

      <div class="print-meta">
        <div class="print-meta-left">
          <div>${state.clientName} 御中</div>
          <div>物件名: ${state.projectName}</div>
          <div>所在地: ${state.location}</div>
        </div>
        <div class="print-meta-right">
          <div>見積番号: ${state.estimateNumber || '（未保存）'}</div>
          <div>見積日: ${state.estimateDate}</div>
          <div>有効期限: ${state.validUntil}</div>
          <div>合計金額: ${formatYen(grand)}（税込）</div>
        </div>
      </div>

      <table class="print-table">
        <thead>
          <tr>
            <th>品番</th>
            <th>品名</th>
            <th>数量</th>
            <th>単価</th>
            <th>金額</th>
          </tr>
        </thead>
        <tbody>${tablesHTML}</tbody>
      </table>

      <div class="print-totals">
        <div><span>小計</span><span>${formatYen(subtotal)}</span></div>
        <div><span>値引き</span><span>-${formatYen(discount)}</span></div>
        <div><span>消費税(${state.taxRate}%)</span><span>${formatYen(tax)}</span></div>
        <div class="total-line"><span>合計金額（税込）</span><span>${formatYen(grand)}</span></div>
      </div>

      <div class="print-validity">
        ※ 本見積書の有効期限は ${state.validUntil} までとなります。
      </div>

      <div class="print-signature">
        <div>担当者署名:</div>
        <div class="sig-line"></div>
      </div>
    </div>
  `;
}

// ===== モーダル操作 =====
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
