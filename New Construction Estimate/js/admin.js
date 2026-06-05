/* © 2026 Nozomi Sakurada. All rights reserved. */

let currentFormType = null;
let currentFormData = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
});

// ===== タブ切り替え =====
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');

  if (tabName === 'templates') {
    loadTemplatesList();
  } else if (tabName === 'relatedparts') {
    loadRelatedPartsTab();
  }
}

// ===== データロード =====
async function loadAllData() {
  await loadEquipmentList();
  await loadMaterialsList();
  await loadWorksList();
}

async function loadEquipmentList() {
  const equipment = await getEquipmentList();
  const tbody = document.getElementById('equipmentList');
  tbody.innerHTML = '';

  equipment.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.listPrice ? '¥' + item.listPrice.toLocaleString() : '-'}</td>
      <td>¥${item.unitPrice.toLocaleString()}</td>
      <td>${item.qty || 1}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="editEquipment('${item.id}')">編集</button>
        <button class="btn btn-danger" onclick="confirmDelete('equipment', '${item.id}')">削除</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function loadMaterialsList() {
  const materials = await getMaterialList();
  const tbody = document.getElementById('materialsList');
  tbody.innerHTML = '';

  materials.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.type || '-'}</td>
      <td>${item.listPrice ? '¥' + item.listPrice.toLocaleString() : '-'}</td>
      <td>¥${item.unitPrice.toLocaleString()}</td>
      <td>${item.qty || 1}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="editMaterial('${item.id}')">編集</button>
        <button class="btn btn-danger" onclick="confirmDelete('materials', '${item.id}')">削除</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function loadWorksList() {
  const works = await getWorkList();
  const tbody = document.getElementById('worksList');
  tbody.innerHTML = '';

  works.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.listPrice ? '¥' + item.listPrice.toLocaleString() : '-'}</td>
      <td>¥${item.unitPrice.toLocaleString()}</td>
      <td>${item.qty || 1}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="editWork('${item.id}')">編集</button>
        <button class="btn btn-danger" onclick="confirmDelete('works', '${item.id}')">削除</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ===== フォーム操作 =====
function openEquipmentForm() {
  currentFormType = 'equipment';
  currentFormData = null;
  document.getElementById('formTitle').textContent = '機器 - 新規追加';
  document.getElementById('typeGroup').style.display = 'none';
  document.getElementById('isMainUnitGroup').style.display = 'grid';
  document.getElementById('optionTemplateGroup').style.display = 'none';
  resetForm();

  // isMainUnitチェックボックスのイベントリスナー
  const isMainUnitCheckbox = document.getElementById('isMainUnit');
  isMainUnitCheckbox.onchange = function() {
    document.getElementById('optionTemplateGroup').style.display = this.checked ? 'grid' : 'none';
    if (this.checked) {
      document.getElementById('optionTemplateEditor').innerHTML = '';
    }
  };

  document.getElementById('formModal').classList.remove('hidden');
}

async function editEquipment(id) {
  currentFormType = 'equipment';
  const equipment = await getEquipmentList();
  const item = equipment.find(e => e.id === id);
  if (!item) return;

  currentFormData = item;
  document.getElementById('formTitle').textContent = '機器 - 編集';
  document.getElementById('itemId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemListPrice').value = item.listPrice || '';
  document.getElementById('itemPrice').value = item.unitPrice;
  document.getElementById('itemQty').value = item.qty || 1;
  document.getElementById('isMainUnit').checked = item.isMainUnit === true;
  document.getElementById('typeGroup').style.display = 'none';
  document.getElementById('isMainUnitGroup').style.display = 'grid';

  // isMainUnitチェックボックスのイベントリスナー
  const isMainUnitCheckbox = document.getElementById('isMainUnit');
  isMainUnitCheckbox.onchange = function() {
    document.getElementById('optionTemplateGroup').style.display = this.checked ? 'grid' : 'none';
    if (this.checked) {
      renderOptionTemplate(item.optionTemplate || {});
    }
  };

  // オプションテンプレートの表示
  if (item.isMainUnit === true) {
    document.getElementById('optionTemplateGroup').style.display = 'grid';
    await renderOptionTemplate(item.optionTemplate || {});
  } else {
    document.getElementById('optionTemplateGroup').style.display = 'none';
  }

  document.getElementById('formModal').classList.remove('hidden');
}

function openMaterialForm() {
  currentFormType = 'materials';
  currentFormData = null;
  document.getElementById('formTitle').textContent = '部材 - 新規追加';
  document.getElementById('typeGroup').style.display = 'grid';
  resetForm();
  document.getElementById('formModal').classList.remove('hidden');
}

async function editMaterial(id) {
  currentFormType = 'materials';
  const materials = await getMaterialList();
  const item = materials.find(e => e.id === id);
  if (!item) return;

  currentFormData = item;
  document.getElementById('formTitle').textContent = '部材 - 編集';
  document.getElementById('itemId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemType').value = item.type || '';
  document.getElementById('itemListPrice').value = item.listPrice || '';
  document.getElementById('itemPrice').value = item.unitPrice;
  document.getElementById('itemQty').value = item.qty || 1;
  document.getElementById('typeGroup').style.display = 'grid';
  document.getElementById('formModal').classList.remove('hidden');
}

function openWorkForm() {
  currentFormType = 'works';
  currentFormData = null;
  document.getElementById('formTitle').textContent = '工事 - 新規追加';
  document.getElementById('typeGroup').style.display = 'none';
  resetForm();
  document.getElementById('formModal').classList.remove('hidden');
}

async function editWork(id) {
  currentFormType = 'works';
  const works = await getWorkList();
  const item = works.find(e => e.id === id);
  if (!item) return;

  currentFormData = item;
  document.getElementById('formTitle').textContent = '工事 - 編集';
  document.getElementById('itemId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemListPrice').value = item.listPrice || '';
  document.getElementById('itemPrice').value = item.unitPrice;
  document.getElementById('itemQty').value = item.qty || 1;
  document.getElementById('typeGroup').style.display = 'none';
  document.getElementById('formModal').classList.remove('hidden');
}

function resetForm() {
  document.getElementById('dataForm').reset();
}

function closeForm() {
  document.getElementById('formModal').classList.add('hidden');
  currentFormType = null;
  currentFormData = null;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('itemId').value || `${Date.now()}-${Math.random()}`;
  const listPriceValue = document.getElementById('itemListPrice').value;
  const data = {
    id,
    name: document.getElementById('itemName').value,
    category: document.getElementById('itemCategory').value,
    type: document.getElementById('itemType').value || undefined,
    listPrice: listPriceValue ? parseInt(listPriceValue) : undefined,
    unitPrice: parseInt(document.getElementById('itemPrice').value),
    qty: parseInt(document.getElementById('itemQty').value) || 1
  };

  // 機器の場合、isMainUnitとoptionTemplateを追加
  if (currentFormType === 'equipment') {
    data.isMainUnit = document.getElementById('isMainUnit').checked === true;
    if (data.isMainUnit) {
      data.optionTemplate = getOptionTemplateFromEditor();
    }
  }

  try {
    if (currentFormData) {
      // 更新
      if (currentFormType === 'equipment') await updateEquipment(data);
      else if (currentFormType === 'materials') await updateMaterial(data);
      else if (currentFormType === 'works') await updateWork(data);
    } else {
      // 新規追加
      if (currentFormType === 'equipment') await addEquipment(data);
      else if (currentFormType === 'materials') await addMaterial(data);
      else if (currentFormType === 'works') await addWork(data);
    }

    closeForm();
    await loadAllData();
    alert('保存しました');
  } catch (error) {
    alert('エラーが発生しました: ' + error.message);
  }
}

async function confirmDelete(type, id) {
  if (!confirm('削除してよろしいですか？')) return;

  try {
    if (type === 'equipment') await deleteEquipment(id);
    else if (type === 'materials') await deleteMaterial(id);
    else if (type === 'works') await deleteWork(id);

    await loadAllData();
    alert('削除しました');
  } catch (error) {
    alert('エラーが発生しました: ' + error.message);
  }
}

// ===== オプションテンプレート編集 =====
async function renderOptionTemplate(optionTemplate) {
  const container = document.getElementById('optionTemplateEditor');
  container.innerHTML = '';

  const allMaterials = await getMaterialList();
  const allWorks = await getWorkList();
  const allItems = [...allMaterials, ...allWorks];

  Object.entries(optionTemplate).forEach(([optionId, qty], index) => {
    const item = allItems.find(i => i.id === optionId);
    const itemName = item ? item.name : optionId;

    const row = document.createElement('div');
    row.className = 'template-option-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 60px 30px';
    row.style.gap = '8px';
    row.style.marginBottom = '8px';
    row.style.alignItems = 'center';

    row.innerHTML = `
      <select class="option-select" data-index="${index}" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
        <option value="">選択してください</option>
        ${allItems.map(item => `<option value="${item.id}" ${item.id === optionId ? 'selected' : ''}>${item.name}</option>`).join('')}
      </select>
      <input type="number" class="option-qty" data-index="${index}" value="${qty}" min="0" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
      <button type="button" class="btn btn-danger" onclick="removeTemplateOption(${index})" style="padding: 6px 8px; font-size: 11px;">×</button>
    `;
    container.appendChild(row);
  });
}

function addTemplateOption() {
  const container = document.getElementById('optionTemplateEditor');
  const rows = container.querySelectorAll('.template-option-row');
  const newIndex = rows.length;

  const row = document.createElement('div');
  row.className = 'template-option-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1fr 60px 30px';
  row.style.gap = '8px';
  row.style.marginBottom = '8px';
  row.style.alignItems = 'center';

  row.innerHTML = `
    <select class="option-select" data-index="${newIndex}" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
      <option value="">選択してください</option>
    </select>
    <input type="number" class="option-qty" data-index="${newIndex}" value="1" min="0" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
    <button type="button" class="btn btn-danger" onclick="removeTemplateOption(${newIndex})" style="padding: 6px 8px; font-size: 11px;">×</button>
  `;
  container.appendChild(row);
}

function removeTemplateOption(index) {
  const container = document.getElementById('optionTemplateEditor');
  const rows = container.querySelectorAll('.template-option-row');
  if (rows[index]) {
    rows[index].remove();
  }
}

function getOptionTemplateFromEditor() {
  const container = document.getElementById('optionTemplateEditor');
  const rows = container.querySelectorAll('.template-option-row');
  const template = {};

  rows.forEach((row) => {
    const select = row.querySelector('.option-select');
    const qtyInput = row.querySelector('.option-qty');
    const optionId = select.value;
    const qty = parseInt(qtyInput.value) || 0;

    if (optionId && qty > 0) {
      template[optionId] = qty;
    }
  });

  return template;
}

// ===== 関連部材紐づけ管理 =====
let currentMainProduct = null;
let currentRelatedParts = {};

// switchTab時に関連部材タブをロード
function loadRelatedPartsTab() {
  loadMainProductsSelect();
}

async function loadMainProductsSelect() {
  const equipment = await getEquipmentList();
  const mainProducts = equipment.filter(e => e.isMainUnit === true);

  const select = document.getElementById('mainProductSelect');
  select.innerHTML = '<option value="">選択してください</option>';

  mainProducts.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    select.appendChild(option);
  });
}

async function onMainProductSelect() {
  const productId = document.getElementById('mainProductSelect').value;

  if (!productId) {
    document.getElementById('relatedPartsSection').style.display = 'none';
    return;
  }

  const equipment = await getEquipmentList();
  currentMainProduct = equipment.find(e => e.id === productId);

  if (!currentMainProduct) return;

  currentRelatedParts = { ...currentMainProduct.optionTemplate } || {};
  document.getElementById('relatedPartsSection').style.display = 'block';
  await renderRelatedPartsTable();
}

async function renderRelatedPartsTable() {
  const materials = await getMaterialList();
  const works = await getWorkList();
  const allItems = [...materials, ...works];

  const tbody = document.getElementById('relatedPartsList');
  tbody.innerHTML = '';

  Object.entries(currentRelatedParts).forEach(([itemId, qty], index) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td><input type="number" value="${qty}" min="0" onchange="updateRelatedPartQty('${itemId}', this.value)" style="width: 60px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px;"></td>
      <td class="actions">
        <button class="btn btn-danger" onclick="removeRelatedPart('${itemId}')">削除</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // 追加部材リストも更新
  const materials2 = await getMaterialList();
  const works2 = await getWorkList();
  const select = document.getElementById('partSelect');
  select.innerHTML = '<option value="">選択してください</option>';

  [...materials2, ...works2].forEach(item => {
    if (!currentRelatedParts[item.id]) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.name} (${item.category})`;
      select.appendChild(option);
    }
  });
}

function updateRelatedPartQty(itemId, qty) {
  const numQty = parseInt(qty) || 0;
  if (numQty > 0) {
    currentRelatedParts[itemId] = numQty;
  } else {
    delete currentRelatedParts[itemId];
  }
}

function removeRelatedPart(itemId) {
  if (confirm('この関連部材を削除してよろしいですか？')) {
    delete currentRelatedParts[itemId];
    renderRelatedPartsTable();
  }
}

function openAddRelatedPartModal() {
  document.getElementById('addRelatedPartModal').classList.remove('hidden');
  document.getElementById('partSelect').value = '';
  document.getElementById('partQty').value = '1';
}

function closeAddRelatedPartModal() {
  document.getElementById('addRelatedPartModal').classList.add('hidden');
}

async function handleAddRelatedPart(event) {
  event.preventDefault();

  const itemId = document.getElementById('partSelect').value;
  const qty = parseInt(document.getElementById('partQty').value) || 1;

  if (!itemId || qty <= 0) {
    alert('部材と数量を入力してください');
    return;
  }

  currentRelatedParts[itemId] = qty;
  closeAddRelatedPartModal();
  await renderRelatedPartsTable();
}

async function saveRelatedParts() {
  if (!currentMainProduct) {
    alert('主製品を選択してください');
    return;
  }

  try {
    const updated = { ...currentMainProduct };
    updated.optionTemplate = currentRelatedParts;
    await updateEquipment(updated);
    alert('関連部材の紐づけを保存しました');
  } catch (error) {
    alert('エラーが発生しました: ' + error.message);
  }
}

// ===== テンプレート管理 =====
async function loadTemplatesList() {
  const templates = await getTemplateList();
  const container = document.getElementById('templatesList');
  container.innerHTML = '';

  if (templates.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">テンプレートはまだ登録されていません</p>';
    return;
  }

  templates.forEach(template => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <h4>${template.name}</h4>
      <p>${template.description || ''}</p>
      <div class="items-count">含まれる項目: ${template.items ? template.items.length : 0}個</div>
      <div class="card-actions">
        <button class="btn btn-edit" onclick="editTemplate(${template.id})">編集</button>
        <button class="btn btn-danger" onclick="confirmDeleteTemplate(${template.id})">削除</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openTemplateForm() {
  document.getElementById('templateId').value = '';
  document.getElementById('templateName').value = '';
  document.getElementById('templateDesc').value = '';
  buildTemplateItemsCheckboxes();
  document.getElementById('templateModal').classList.remove('hidden');
}

async function editTemplate(id) {
  const template = await getTemplate(id);
  if (!template) return;

  document.getElementById('templateId').value = template.id;
  document.getElementById('templateName').value = template.name;
  document.getElementById('templateDesc').value = template.description || '';
  buildTemplateItemsCheckboxes(template.items || []);
  document.getElementById('templateModal').classList.remove('hidden');
}

async function buildTemplateItemsCheckboxes(selectedIds = []) {
  const equipment = await getEquipmentList();
  const materials = await getMaterialList();
  const works = await getWorkList();
  const allItems = [...equipment, ...materials, ...works];

  const container = document.getElementById('templateItems');
  container.innerHTML = '';

  allItems.forEach(item => {
    const checkbox = document.createElement('div');
    checkbox.className = 'template-item-check';
    checkbox.innerHTML = `
      <input type="checkbox" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
      <span>${item.name}</span>
    `;
    container.appendChild(checkbox);
  });
}

function closeTemplateForm() {
  document.getElementById('templateModal').classList.add('hidden');
}

async function handleTemplateSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('templateId').value || undefined;
  const selectedCheckboxes = document.querySelectorAll('#templateItems input[type="checkbox"]:checked');
  const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

  const templateData = {
    name: document.getElementById('templateName').value,
    description: document.getElementById('templateDesc').value,
    items: selectedIds,
    createdAt: new Date().toISOString()
  };

  if (id) {
    templateData.id = parseInt(id);
  }

  try {
    if (id) {
      await updateTemplate(templateData);
    } else {
      await saveTemplate(templateData);
    }

    closeTemplateForm();
    await loadTemplatesList();
    alert('テンプレートを保存しました');
  } catch (error) {
    alert('エラーが発生しました: ' + error.message);
  }
}

async function confirmDeleteTemplate(id) {
  if (!confirm('このテンプレートを削除してよろしいですか？')) return;

  try {
    await deleteTemplate(id);
    await loadTemplatesList();
    alert('削除しました');
  } catch (error) {
    alert('エラーが発生しました: ' + error.message);
  }
}
