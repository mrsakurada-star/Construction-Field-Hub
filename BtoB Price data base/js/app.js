/* © 2026 Nozomi Sakurada. All rights reserved. */
/* BtoB価格表作成ツール - アプリケーションロジック */

// =====================
// ユーティリティ
// =====================

/** 金額フォーマット */
function fmt(num) {
    if (num === null || num === undefined || num === '') return '—';
    return '¥' + Math.round(Number(num)).toLocaleString('ja-JP');
}

/** 日付フォーマット */
function fmtDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

/** 今日の日付文字列 YYYY-MM-DD */
function today() {
    return new Date().toISOString().slice(0, 10);
}

/** 期限状態判定 */
function expiryStatus(dateStr) {
    if (!dateStr) return 'none';
    const exp = new Date(dateStr);
    const now = new Date();
    const diff = (exp - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'expired';
    if (diff <= 30) return 'warning';
    return 'ok';
}

/** トースト通知 */
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

/** 確認ダイアログ */
function confirmDialog(msg) {
    return window.confirm(msg);
}

// =====================
// ページナビゲーション
// =====================
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    const nav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (nav) nav.classList.add('active');

    // 各ページの初期読み込み
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'customers') loadCustomers();
    if (pageId === 'products') loadProducts();
    if (pageId === 'constructions') loadConstructions();
    if (pageId === 'pricelists') loadPriceLists();
}

// =====================
// ダッシュボード
// =====================
async function loadDashboard() {
    const [pls, customers, products, constructions] = await Promise.all([
        dbGetAll('priceLists'),
        dbGetAll('customers'),
        dbGetAll('products'),
        dbGetAll('constructions')
    ]);

    const active = pls.filter(p => p.status === 'active');
    const expired = pls.filter(p => expiryStatus(p.expirationDate) === 'expired');
    const warning = pls.filter(p => expiryStatus(p.expirationDate) === 'warning');

    document.getElementById('stat-pricelists').textContent = active.length;
    document.getElementById('stat-customers').textContent = customers.length;
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-constructions').textContent = constructions.length;
    document.getElementById('stat-expired').textContent = expired.length;

    // 期限切れ警告バッジ
    const badge = document.getElementById('nav-badge-expired');
    badge.textContent = expired.length + warning.length;
    badge.style.display = (expired.length + warning.length) > 0 ? '' : 'none';

    // 最近の価格表一覧
    const sorted = [...pls].sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1).slice(0, 10);
    const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));
    const tbody = document.getElementById('dashboard-list');
    tbody.innerHTML = sorted.length === 0
        ? `<tr><td colspan="6" class="text-center" style="padding:32px;color:var(--text3)">価格表がまだ作成されていません</td></tr>`
        : sorted.map(pl => {
            const cust = customerMap[pl.customerId];
            const es = expiryStatus(pl.expirationDate);
            const expClass = es === 'expired' ? 'expiry-expired' : es === 'warning' ? 'expiry-warning' : 'expiry-ok';
            const statusBadge = pl.status === 'archived'
                ? `<span class="badge" style="background:#eee;color:#999">アーカイブ</span>`
                : es === 'expired' ? `<span class="badge badge-expired">期限切れ</span>`
                : es === 'warning' ? `<span class="badge badge-warning">期限間近</span>`
                : `<span class="badge badge-active">有効</span>`;
            return `<tr>
                <td><strong>${escHtml(pl.title||'—')}</strong><br><span style="font-size:11px;color:var(--text3)">v${pl.version||1}</span></td>
                <td>${cust ? escHtml(cust.name) : '—'}</td>
                <td class="${expClass}">${fmtDate(pl.expirationDate)}</td>
                <td>${statusBadge}</td>
                <td>${fmtDate(pl.createdAt)}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-xs btn-secondary btn-icon" type="button" onclick="openPriceListModal(${pl.id})" title="基本設定（有効期限など）"><i data-lucide="settings" style="width:12px;height:12px"></i></button>
                        <button class="btn btn-sm btn-secondary" type="button" onclick="openPriceListEdit(${pl.id})">${es === 'expired' ? '明細 (閲覧)' : '明細 (編集)'}</button>
                        <button class="btn btn-sm btn-primary" type="button" onclick="openPrintPreview(${pl.id})">印刷</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    
    // アイコンの再描画
    if (window.lucide) lucide.createIcons();
}

// =====================
// 顧客管理
// =====================
async function loadCustomers(filterText = '') {
    const all = await dbGetAll('customers');
    const q = filterText.toLowerCase();
    const filtered = q ? all.filter(c => c.name.toLowerCase().includes(q) || (c.kana||'').toLowerCase().includes(q)) : all;

    const clients = filtered.filter(c => c.type === 'client');
    const dealers = filtered.filter(c => c.type === 'dealer');
    const dealerMap = {};
    dealers.forEach(d => {
        if (!dealerMap[d.parentId]) dealerMap[d.parentId] = [];
        dealerMap[d.parentId].push(d);
    });

    const tbody = document.getElementById('customer-list');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:32px;color:var(--text3)">顧客が登録されていません</td></tr>`;
        return;
    }

    let html = '';
    clients.forEach(cl => {
        html += `<tr>
            <td>
                <span class="badge badge-client">取引先</span>
                <strong style="margin-left:8px; cursor:pointer; color:var(--info); text-decoration:underline;" onclick="showCustomerPriceLists(${cl.id})">${escHtml(cl.name)}</strong>
            </td>
            <td>${escHtml(cl.kana||'')}</td>
            <td>${escHtml(cl.contact||'')}</td>
            <td>${escHtml(cl.memo||'')}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-xs btn-secondary" type="button" onclick="openCustomerEdit(${cl.id})">編集</button>
                    <button class="btn btn-xs btn-danger" type="button" onclick="deleteCustomer(${cl.id})">削除</button>
                </div>
            </td>
        </tr>`;
        (dealerMap[cl.id] || []).forEach(dl => {
            html += `<tr style="background:#fcfcfc">
                <td style="padding-left:32px">
                    <span class="badge badge-dealer">販売店</span>
                    <strong style="margin-left:8px; cursor:pointer; color:var(--info); text-decoration:underline;" onclick="showCustomerPriceLists(${dl.id})">${escHtml(dl.name)}</strong>
                </td>
                <td>${escHtml(dl.kana||'')}</td>
                <td>${escHtml(dl.contact||'')}</td>
                <td>${escHtml(dl.memo||'')}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-xs btn-secondary" type="button" onclick="openCustomerEdit(${dl.id})">編集</button>
                        <button class="btn btn-xs btn-danger" type="button" onclick="deleteCustomer(${dl.id})">削除</button>
                    </div>
                </td>
            </tr>`;
        });
    });
    tbody.innerHTML = html;
}

/** 顧客追加・編集モーダルを開く */
async function openCustomerModal(id = null) {
    const allCustomers = await dbGetAll('customers');
    const clients = allCustomers.filter(c => c.type === 'client');
    let data = { type: 'client', name: '', kana: '', contact: '', memo: '', parentId: null };
    if (id) {
        const rec = await dbGet('customers', id);
        if (rec) data = rec;
    }

    document.getElementById('customer-modal-title').textContent = id ? '顧客を編集' : '顧客を追加';
    const typeSel = document.getElementById('customer-type');
    const parentGroup = document.getElementById('parent-customer-group');
    const parents = customers.filter(c => c.type === 'client' && c.id !== id);
    const parentSel = document.getElementById('customer-parentId');

    parentSel.innerHTML = `<option value="">— 親取引先を選択 —</option>` + parents.map(c => 
        `<option value="${c.id}" ${data.parentId == c.id ? 'selected' : ''}>${escHtml(c.name)}</option>`
    ).join('');

    typeSel.value = data.type || 'client';
    typeSel.onchange = () => {
        parentGroup.style.display = typeSel.value === 'dealer' ? 'block' : 'none';
    };
    typeSel.onchange(); // 初期表示

    document.getElementById('customer-id').value = id || '';
    document.getElementById('customer-name').value = data.name || '';
    document.getElementById('customer-phone').value = data.phone || '';
    document.getElementById('customer-address').value = data.address || '';
    document.getElementById('customer-memo').value = data.memo || '';
    
    openModal('customer-modal');
}
function openCustomerEdit(id) { openCustomerModal(id); }

async function saveCustomer() {
    const id = document.getElementById('customer-id').value;
    const name = document.getElementById('customer-name').value.trim();
    if (!name) { alert('顧客名を入力してください'); return; }

    const data = {
        type: document.getElementById('customer-type').value,
        name: document.getElementById('customer-name').value.trim(),
        parentId: parseInt(document.getElementById('customer-parentId').value) || null,
        phone: document.getElementById('customer-phone').value.trim(),
        address: document.getElementById('customer-address').value.trim(),
        memo: document.getElementById('customer-memo').value.trim()
    };
    if (id) { data.id = parseInt(id); await dbPut('customers', data); }
    else { await dbAdd('customers', data); }

    closeModal('customer-modal');
    await onDataChanged();
    showToast('顧客情報を保存しました');
    loadCustomers();
}

async function deleteCustomer(id) {
    if (!confirmDialog('この顧客を削除しますか？（関連する販売店の親紐付けも解除されます）')) return;
    await dbDelete('customers', id);
    await onDataChanged();
    showToast('削除しました', 'danger');
    loadCustomers();
}

// =====================
// 製品マスタ
// =====================
async function loadProducts(filterText = '') {
    const all = await dbGetAll('products');
    const q = filterText.toLowerCase();
    const filtered = q ? all.filter(p => p.name.toLowerCase().includes(q) || (p.code||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q)) : all;

    const tbody = document.getElementById('product-list');
    tbody.innerHTML = filtered.length === 0
        ? `<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--text3)">製品が登録されていません</td></tr>`
        : filtered.map(p => `<tr>
            <td><span style="font-size:11px;color:var(--text3)">${escHtml(p.code||'')}</span></td>
            <td><strong>${escHtml(p.name)}</strong><br><span style="font-size:11px;color:var(--text3)">${escHtml(p.description||'')}</span></td>
            <td>${escHtml(p.category||'')}</td>
            <td>${fmt(p.price)}</td>
            <td>${fmt(p.costPrice)}</td>
            <td>${escHtml(p.supplier||'')}</td>
            <td>${escHtml(p.remarks||'')}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-xs btn-secondary" type="button" onclick="openProductEdit(${p.id})">編集</button>
                    <button class="btn btn-xs btn-danger" type="button" onclick="deleteProduct(${p.id})">削除</button>
                </div>
            </td>
        </tr>`).join('');
}

async function openProductModal(id = null) {
    let data = { code: '', name: '', category: '', price: '', supplier: '', description: '', remarks: '' };
    if (id) { const rec = await dbGet('products', id); if (rec) data = rec; }
    document.getElementById('product-modal-title').textContent = id ? '製品を編集' : '製品を追加';
    document.getElementById('product-id').value = id || '';
    ['code','name','category','price','costPrice','supplier','description','remarks'].forEach(f => {
        document.getElementById('product-' + f).value = data[f] || '';
    });
    openModal('product-modal');
}
function openProductEdit(id) { openProductModal(id); }

async function saveProduct() {
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    if (!name) { alert('製品名を入力してください'); return; }
    const data = {
        code: document.getElementById('product-code').value.trim(),
        name,
        category: document.getElementById('product-category').value.trim(),
        price: parseFloat(document.getElementById('product-price').value) || 0,
        costPrice: parseFloat(document.getElementById('product-costPrice').value) || 0,
        supplier: document.getElementById('product-supplier').value.trim(),
        description: document.getElementById('product-description').value.trim(),
        remarks: document.getElementById('product-remarks').value.trim()
    };
    if (id) { data.id = parseInt(id); await dbPut('products', data); }
    else { await dbAdd('products', data); }
    closeModal('product-modal');
    await onDataChanged();
    showToast('製品情報を保存しました');
    loadProducts();
}

async function deleteProduct(id) {
    if (!confirmDialog('この製品を削除しますか？')) return;
    await dbDelete('products', id);
    await onDataChanged();
    showToast('削除しました', 'danger');
    loadProducts();
}

// =====================
// 工事マスタ
// =====================
async function loadConstructions(filterText = '') {
    const all = await dbGetAll('constructions');
    const q = filterText.toLowerCase();
    const filtered = q ? all.filter(c => c.name.toLowerCase().includes(q) || (c.code||'').toLowerCase().includes(q)) : all;

    const tbody = document.getElementById('construction-list');
    tbody.innerHTML = filtered.length === 0
        ? `<tr><td colspan="5" class="text-center" style="padding:32px;color:var(--text3)">工事が登録されていません</td></tr>`
        : filtered.map(c => `<tr>
            <td><span style="font-size:11px;color:var(--text3)">${escHtml(c.code||'')}</span></td>
            <td><strong>${escHtml(c.name)}</strong><br><span style="font-size:11px;color:var(--text3)">${escHtml(c.description||'')}</span></td>
            <td><span class="badge badge-open">OPEN</span></td>
            <td>${fmt(c.costPrice)}</td>
            <td>${escHtml(c.remarks||'')}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-xs btn-secondary" type="button" onclick="openConstructionEdit(${c.id})">編集</button>
                    <button class="btn btn-xs btn-danger" type="button" onclick="deleteConstruction(${c.id})">削除</button>
                </div>
            </td>
        </tr>`).join('');
}

async function openConstructionModal(id = null) {
    let data = { code: '', name: '', description: '', remarks: '' };
    if (id) { const rec = await dbGet('constructions', id); if (rec) data = rec; }
    document.getElementById('construction-modal-title').textContent = id ? '工事を編集' : '工事を追加';
    document.getElementById('construction-id').value = id || '';
    document.getElementById('construction-costPrice').value = data.costPrice || '';
    ['code','name','description','remarks'].forEach(f => {
        document.getElementById('construction-' + f).value = data[f] || '';
    });
    openModal('construction-modal');
}
function openConstructionEdit(id) { openConstructionModal(id); }

async function saveConstruction() {
    const id = document.getElementById('construction-id').value;
    const name = document.getElementById('construction-name').value.trim();
    if (!name) { alert('工事名を入力してください'); return; }
    const data = {
        code: document.getElementById('construction-code').value.trim(),
        name,
        costPrice: parseFloat(document.getElementById('construction-costPrice').value) || null,
        description: document.getElementById('construction-description').value.trim(),
        remarks: document.getElementById('construction-remarks').value.trim()
    };
    if (id) { data.id = parseInt(id); await dbPut('constructions', data); }
    else { await dbAdd('constructions', data); }
    closeModal('construction-modal');
    await onDataChanged();
    showToast('工事情報を保存しました');
    loadConstructions();
}

async function deleteConstruction(id) {
    if (!confirmDialog('この工事を削除しますか？')) return;
    await dbDelete('constructions', id);
    await onDataChanged();
    showToast('削除しました', 'danger');
    loadConstructions();
}

// =====================
// 価格表管理
// =====================
async function loadPriceLists(filterText = '') {
    const [pls, customers] = await Promise.all([dbGetAll('priceLists'), dbGetAll('customers')]);
    const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));
    const q = filterText.toLowerCase();

    const oldVersionIds = new Set(pls.map(p => p.originalId).filter(id => id !== null));

    let filtered = q ? pls.filter(p =>
        (p.title||'').toLowerCase().includes(q) ||
        (customerMap[p.customerId]?.name||'').toLowerCase().includes(q)
    ) : pls;

    // 最新版（originalIdとして参照されていないもの）のみをルートとして扱う
    const filteredRoots = filtered.filter(p => !oldVersionIds.has(p.id));

    const tbody = document.getElementById('pricelist-list');
    tbody.innerHTML = filteredRoots.length === 0
        ? `<tr><td colspan="6" class="text-center" style="padding:32px;color:var(--text3)">価格表がまだ作成されていません</td></tr>`
        : [...filteredRoots].sort((a,b) => (b.updatedAt||b.createdAt||'') > (a.updatedAt||a.createdAt||'') ? 1 : -1).map(pl => {
            
            // 履歴を辿る
            const lineage = [];
            let curr = pl.originalId;
            while(curr) {
                const p = pls.find(x => x.id === curr);
                if (!p) break;
                lineage.push(p);
                curr = p.originalId;
            }

            let rowsHtml = buildPlRow(pl, customerMap, lineage.length > 0);
            
            if (lineage.length > 0) {
                lineage.forEach((oldPl, idx) => {
                    rowsHtml += buildPlRow(oldPl, customerMap, false, pl.id, idx === lineage.length - 1);
                });
            }
            return rowsHtml;
        }).join('');

    if (window.lucide) lucide.createIcons();
}

function buildPlRow(pl, customerMap, hasHistory, parentId = null, isLastHistory = false) {
    const c = customerMap[pl.customerId];
    const es = expiryStatus(pl.expirationDate);
    const expClass = es === 'expired' ? 'expiry-expired' : es === 'warning' ? 'expiry-warning' : 'expiry-ok';
    const statusBadge = pl.status === 'archived'
        ? `<span class="badge" style="background:#eee;color:#999">アーカイブ</span>`
        : es === 'expired' ? `<span class="badge badge-expired">期限切れ</span>`
        : es === 'warning' ? `<span class="badge badge-warning">期限間近</span>`
        : `<span class="badge badge-active">有効</span>`;

    const isHistory = parentId !== null;
    const rowClass = isHistory ? `history-row history-of-${parentId}` : '';
    const style = isHistory ? 'display:none; background:#fbfbfb;' : '';
    const prefix = isHistory ? (isLastHistory ? '　　└ ' : '　　├ ') : '';
    const historyBtn = hasHistory ? `<button class="btn btn-xs btn-secondary" type="button" onclick="togglePlHistory(${pl.id})" style="margin-right:8px"><i data-lucide="history" style="width:12px;height:12px"></i> 過去バージョン</button>` : '';

    return `<tr class="${rowClass}" style="${style}">
        <td>
            ${prefix}<strong>${escHtml(pl.title||'—')}</strong>
            <span style="font-size:11px;color:var(--text3);margin-left:6px">v${pl.version||1}</span>
            ${isHistory ? '<span class="badge" style="background:#eee;color:#999;margin-left:4px">旧Ver</span>' : ''}
        </td>
        <td>${c ? `<span class="badge ${c.type === 'dealer' ? 'badge-dealer' : 'badge-client'}">${c.type === 'dealer' ? '販売店' : '取引先'}</span> <strong style="cursor:pointer;color:var(--info);text-decoration:underline;" onclick="showCustomerPriceLists(${c.id})">${escHtml(c.name)}</strong>` : '—'}</td>
        <td class="${expClass}">${fmtDate(pl.expirationDate)}</td>
        <td>${statusBadge}</td>
        <td>${fmtDate(pl.updatedAt||pl.createdAt)}</td>
        <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${historyBtn}
                <button class="btn btn-xs btn-secondary btn-icon" type="button" onclick="openPriceListModal(${pl.id})" title="基本設定（有効期限など）"><i data-lucide="settings" style="width:14px;height:14px"></i></button>
                <button class="btn btn-xs btn-secondary" type="button" onclick="openPriceListEdit(${pl.id})">${isHistory || es === 'expired' ? '明細 (閲覧)' : '明細 (編集)'}</button>
                <button class="btn btn-xs btn-primary" type="button" onclick="openPrintPreview(${pl.id})">印刷</button>
                ${!isHistory ? `<button class="btn btn-xs btn-secondary" type="button" onclick="duplicatePriceList(${pl.id})">新Ver</button>` : ''}
                <button class="btn btn-xs btn-danger" type="button" onclick="deletePriceList(${pl.id})">削除</button>
            </div>
        </td>
    </tr>`;
}

window.togglePlHistory = function(parentId) {
    const rows = document.querySelectorAll(`.history-of-${parentId}`);
    rows.forEach(r => {
        r.style.display = r.style.display === 'none' ? 'table-row' : 'none';
    });
};

async function openPriceListModal(id = null) {
    const customers = await dbGetAll('customers');
    let data = { title: '', customerId: null, expirationDate: '', version: 1, status: 'active', memo: '' };
    if (id) { const rec = await dbGet('priceLists', id); if (rec) data = rec; }

    document.getElementById('pl-modal-title').textContent = id ? '価格表を編集' : '価格表を新規作成';
    document.getElementById('pl-id').value = id || '';
    document.getElementById('pl-title').value = data.title || '';
    document.getElementById('pl-expiration').value = data.expirationDate || '';
    document.getElementById('pl-memo').value = data.memo || '';
    document.getElementById('pl-status').value = data.status || 'active';

    const customerSel = document.getElementById('pl-customer');
    customerSel.innerHTML = `<option value="">— 顧客を選択 —</option>` + customers.map(c =>
        `<option value="${c.id}" ${data.customerId === c.id ? 'selected' : ''}>${c.type === 'dealer' ? '　↳ ' : ''}${escHtml(c.name)}</option>`
    ).join('');

    // 有効期限切れの価格表は基本情報のみ編集可能とする（明細は不可）
    const isExpired = expiryStatus(data.expirationDate) === 'expired';
    if (isExpired && id) {
        document.getElementById('pl-modal-title').innerHTML = `価格表を編集 <span class="badge badge-expired" style="margin-left:8px">期限切れ・ロック中</span>`;
    }

    openModal('pl-header-modal');
}

async function savePriceListHeader() {
    const id = document.getElementById('pl-id').value;
    const title = document.getElementById('pl-title').value.trim();
    if (!title) { alert('価格表名を入力してください'); return; }
    const customerId = parseInt(document.getElementById('pl-customer').value) || null;

    if (id) {
        const existing = await dbGet('priceLists', parseInt(id));
        existing.title = title;
        existing.customerId = customerId;
        existing.expirationDate = document.getElementById('pl-expiration').value;
        existing.memo = document.getElementById('pl-memo').value.trim();
        existing.status = document.getElementById('pl-status').value;
        existing.updatedAt = today();
        await dbPut('priceLists', existing);
        closeModal('pl-header-modal');
        await onDataChanged();
        showToast('価格表情報を更新しました');
        loadPriceLists();
    } else {
        const newPl = {
            title, customerId,
            expirationDate: document.getElementById('pl-expiration').value,
            memo: document.getElementById('pl-memo').value.trim(),
            status: 'active',
            version: 1,
            originalId: null,
            createdAt: today(),
            updatedAt: today()
        };
        const newId = await dbAdd('priceLists', newPl);
        closeModal('pl-header-modal');
        await onDataChanged();
        showToast('価格表を作成しました');
        openPriceListEdit(newId);
    }
}

async function duplicatePriceList(id) {
    try {
        const pl = await dbGet('priceLists', id);
        if (!pl) return;
        const items = await dbGetByIndex('priceListItems', 'priceListId', id);

        const newPl = { ...pl };
        delete newPl.id; // 新規登録のためIDを削除
        newPl.title = pl.title + ' (新Ver)';
        newPl.version = (pl.version || 1) + 1;
        newPl.originalId = id;
        newPl.status = 'active';
        newPl.createdAt = today();
        newPl.updatedAt = today();

        const newPlId = await dbAdd('priceLists', newPl);
        
        for (const item of items) {
            const newItem = { ...item };
            delete newItem.id; // 新規登録のためIDを削除
            newItem.priceListId = newPlId;
            await dbAdd('priceListItems', newItem);
        }

        await onDataChanged();
        showToast('新しいバージョンを作成しました');
        loadPriceLists();
    } catch (err) {
        console.error('Duplicate failed:', err);
        alert('複製に失敗しました: ' + err.message);
    }
}

async function deletePriceList(id) {
    if (!confirmDialog('この価格表を削除しますか？明細も削除されます。')) return;
    await dbDelete('priceLists', id);
    await dbDeleteByIndex('priceListItems', 'priceListId', id);
    await onDataChanged();
    showToast('削除しました', 'danger');
    loadPriceLists();
}

// =====================
// 価格表 明細編集
// =====================
let _editPlId = null;
let _editItems = [];
let _isEditLocked = false;

async function openPriceListEdit(id) {
    const pl = await dbGet('priceLists', id);
    if (!pl) return;

    // 有効期限チェック
    const isExpired = expiryStatus(pl.expirationDate) === 'expired';
    _editPlId = id;
    _isEditLocked = isExpired;
    _editItems = await dbGetByIndex('priceListItems', 'priceListId', id);

    document.getElementById('edit-pl-title').textContent = pl.title || '価格表';
    document.getElementById('edit-pl-version').textContent = `Ver.${pl.version || 1}`;
    
    // 保存ボタンの制御
    const saveBtn = document.querySelector('#pl-edit-modal .btn-success');
    const addBtn = document.querySelector('button[onclick="openAddItemModal()"]');
    
    // 期限切れバッジのリセット対応
    const h3 = document.querySelector('#pl-edit-modal h3');
    const existingBadge = h3.querySelector('.badge-expired');
    if (existingBadge) existingBadge.remove();

    if (isExpired) {
        saveBtn.style.display = 'none';
        addBtn.style.display = 'none';
        h3.innerHTML += `<span class="badge badge-expired" style="margin-left:10px">期限切れのため編集不可</span>`;
    } else {
        saveBtn.style.display = '';
        addBtn.style.display = '';
    }

    await renderEditItems();
    openModal('pl-edit-modal');
}

async function renderEditItems() {
    const [products, constructions] = await Promise.all([
        dbGetAll('products'), dbGetAll('constructions')
    ]);
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));
    const constructionMap = Object.fromEntries(constructions.map(c => [c.id, c]));

    const tbody = document.getElementById('edit-items-tbody');
    if (_editItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px;color:var(--text3)">項目を追加してください</td></tr>`;
        return;
    }

    tbody.innerHTML = _editItems.map((item, idx) => {
        const isProduct = item.itemType === 'product';
        const master = isProduct ? productMap[item.itemId] : constructionMap[item.itemId];
        const itemName = master ? escHtml(master.name) : `（削除済 ID:${item.itemId}）`;
        const category = isProduct && master ? escHtml(master.category||'') : '—';
        const listPrice = isProduct && master ? master.price : null;

        // 卸価格の計算
        // 製品: specialPrice > 定価×掛け率 の優先順
        // 工事(OPEN): specialPrice が卸価格の直接入力。掛け率は参考値として保持。
        let sellingPrice = null;
        if (item.specialPrice !== null && item.specialPrice !== undefined && item.specialPrice !== '') {
            sellingPrice = parseFloat(item.specialPrice);
        } else if (isProduct && listPrice && item.rate) {
            sellingPrice = listPrice * (parseFloat(item.rate) / 100);
        }

        const displayMode = item.displayMode || 'pct';
        const ratePlaceholder = isProduct ? '掛け率%' : '参考%';
        const rateHint = !isProduct
            ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">印刷時は%で表示可</div>`
            : '';
        const specialHint = !isProduct
            ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">卸価格（円）を入力</div>`
            : '';

        let profitHtml = '<span style="color:var(--text3)">—</span>';
        if (sellingPrice !== null) {
            const costPrice = master ? master.costPrice : null;
            if (costPrice !== null && costPrice !== undefined && costPrice > 0) {
                const profitAmount = sellingPrice - costPrice;
                const profitRate = ((profitAmount / sellingPrice) * 100).toFixed(1);
                const profitColor = profitAmount >= 0 ? 'var(--info)' : 'var(--danger)';
                profitHtml = `
                    <div style="font-weight:600;color:var(--success)">${fmt(sellingPrice)}</div>
                    <div style="font-size:10px;color:${profitColor};margin-top:2px;font-weight:600">
                        粗利: ${fmt(profitAmount)} (${profitRate}%)
                    </div>
                `;
            } else {
                profitHtml = `<div style="font-weight:600;color:var(--success)">${fmt(sellingPrice)}</div>`;
            }
        }

        const disabledAttr = _isEditLocked ? 'disabled' : '';

        return `<tr>
            <td>
                <span class="badge ${isProduct ? 'badge-client' : 'badge-dealer'}">${isProduct ? '製品' : '工事'}</span>
                <div style="margin-top:4px;font-weight:600">${itemName}</div>
                ${isProduct ? `<div style="font-size:11px;color:var(--text3)">${category}</div>` : ''}
            </td>
            <td class="text-right">${isProduct && listPrice ? fmt(listPrice) : '<span class="badge badge-open">OPEN</span>'}</td>
            <td class="text-center">
                <input type="number" class="item-rate" value="${item.rate||''}" min="0" max="200" step="0.1"
                    onchange="updateItemField(${idx},'rate',this.value)"
                    style="width:75px" placeholder="${ratePlaceholder}" ${disabledAttr}>
                ${rateHint}
            </td>
            <td class="text-right">
                <input type="number" class="item-special" value="${item.specialPrice!==null&&item.specialPrice!==undefined?item.specialPrice:''}"
                    onchange="updateItemField(${idx},'specialPrice',this.value)"
                    style="width:100px" placeholder="${isProduct ? '特価（円）' : '卸値（円）'}" ${disabledAttr}>
                ${specialHint}
            </td>
            <td class="text-right">
                ${profitHtml}
            </td>
            <td>
                <div class="display-mode-toggle">
                    <button type="button" class="${displayMode==='pct'?'active':''}" ${!_isEditLocked ? `onclick="setDisplayMode(${idx},'pct')"` : 'disabled'}>%</button>
                    <button type="button" class="${displayMode==='amount'?'active':''}" ${!_isEditLocked ? `onclick="setDisplayMode(${idx},'amount')"` : 'disabled'}>金額</button>
                </div>
            </td>
            <td>
                ${!_isEditLocked ? `<button class="btn btn-xs btn-danger" type="button" onclick="removeEditItem(${idx})">削除</button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function updateItemField(idx, field, value) {
    if (field === 'rate') _editItems[idx].rate = value === '' ? null : parseFloat(value);
    if (field === 'specialPrice') _editItems[idx].specialPrice = value === '' ? null : parseFloat(value);
    renderEditItems();
}

function setDisplayMode(idx, mode) {
    _editItems[idx].displayMode = mode;
    renderEditItems();
}

function removeEditItem(idx) {
    _editItems.splice(idx, 1);
    renderEditItems();
}

async function openAddItemModal() {
    const [products, constructions] = await Promise.all([dbGetAll('products'), dbGetAll('constructions')]);
    const addList = document.getElementById('add-item-list');
    let html = '';

    // カテゴリごとにグループ化
    const catMap = {};
    products.forEach(p => {
        const cat = p.category || '未分類';
        if (!catMap[cat]) catMap[cat] = [];
        catMap[cat].push(p);
    });

    html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text3);margin-bottom:8px">製品</div>`;
    if (Object.keys(catMap).length === 0) {
        html += `<div style="color:var(--text3);font-size:13px;padding:8px">製品が登録されていません</div>`;
    } else {
        Object.entries(catMap).forEach(([cat, items]) => {
            html += `<div style="font-weight:600;font-size:12px;color:var(--text2);padding:6px 0 2px;border-top:1px solid var(--border);margin-top:4px">${escHtml(cat)}</div>`;
            items.forEach(p => {
                const already = _editItems.some(i => i.itemType === 'product' && i.itemId === p.id);
                html += `<label style="display:flex;align-items:center;gap:10px;padding:6px 4px;cursor:${already?'not-allowed':'pointer'};opacity:${already?0.5:1}">
                    <input type="checkbox" value="${p.id}" data-type="product" ${already ? 'disabled checked' : ''}>
                    <span>${escHtml(p.name)}</span>
                    <span style="margin-left:auto;font-size:11px;color:var(--text3)">${fmt(p.price)}</span>
                </label>`;
            });
        });
    }

    html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text3);margin:16px 0 8px;padding-top:12px;border-top:2px solid var(--border)">工事</div>`;
    if (constructions.length === 0) {
        html += `<div style="color:var(--text3);font-size:13px;padding:8px">工事が登録されていません</div>`;
    } else {
        const constructionsList = constructions;
        constructionsList.forEach(c => {
            const already = _editItems.some(i => i.itemType === 'construction' && i.itemId === c.id);
            html += `<label style="display:flex;align-items:center;gap:10px;padding:6px 4px;cursor:${already?'not-allowed':'pointer'};opacity:${already?0.5:1}">
                <input type="checkbox" value="${c.id}" data-type="construction" ${already ? 'disabled checked' : ''}>
                <span>${escHtml(c.name)}</span>
                <span class="badge badge-open" style="margin-left:auto">OPEN</span>
            </label>`;
        });
    }

    addList.innerHTML = html;
    openModal('add-item-modal');
}

function confirmAddItems() {
    const checked = document.querySelectorAll('#add-item-list input[type="checkbox"]:not(:disabled):checked');
    checked.forEach(cb => {
        _editItems.push({
            priceListId: _editPlId,
            itemType: cb.dataset.type,
            itemId: parseInt(cb.value),
            rate: null,
            specialPrice: null,
            displayMode: 'pct'
        });
    });
    closeModal('add-item-modal');
    renderEditItems();
}

async function savePriceListItems() {
    if (!_editPlId) return;
    try {
        // 既存を全削除してから再登録（シンプルな置換）
        await dbDeleteByIndex('priceListItems', 'priceListId', _editPlId);
        
        for (const item of _editItems) {
            const newItem = { ...item };
            delete newItem.id; // 新規登録のためIDを削除
            newItem.priceListId = _editPlId;
            await dbAdd('priceListItems', newItem);
        }

        // updatedAt更新
        const pl = await dbGet('priceLists', _editPlId);
        if (pl) { 
            pl.updatedAt = today(); 
            await dbPut('priceLists', pl); 
        }

        closeModal('pl-edit-modal');
        await onDataChanged();
        showToast('価格表の明細を保存しました');
        loadPriceLists();
        loadDashboard();
    } catch (err) {
        console.error('Save failed:', err);
        alert('保存に失敗しました: ' + err.message);
    }
}

// =====================
// 印刷プレビュー
// =====================
async function openPrintPreview(id) {
    const [pl, products, constructions, customers] = await Promise.all([
        dbGet('priceLists', id),
        dbGetAll('products'),
        dbGetAll('constructions'),
        dbGetAll('customers')
    ]);
    if (!pl) return;

    const items = await dbGetByIndex('priceListItems', 'priceListId', id);
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));
    const constructionMap = Object.fromEntries(constructions.map(c => [c.id, c]));
    const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));

    const cust = customerMap[pl.customerId];
    let addressName = cust ? cust.name : '';
    let subTitle = '';

    // 販売店の場合、親取引先をメインの宛先にし、販売店名をサブにする
    if (cust && cust.type === 'dealer' && cust.parentId) {
        const parent = customerMap[cust.parentId];
        if (parent) {
            addressName = parent.name;
            subTitle = `${cust.name} 様向け`;
        }
    }

    // カテゴリ別グループ化
    const catGroups = {};
    const constItems = [];
    items.forEach(item => {
        if (item.itemType === 'product') {
            const p = productMap[item.itemId];
            const cat = (p && p.category) ? p.category : '未分類';
            if (!catGroups[cat]) catGroups[cat] = [];
            catGroups[cat].push({ item, master: p });
        } else {
            constItems.push({ item, master: constructionMap[item.itemId] });
        }
    });

    let tableHtml = '';
    // 製品グループ
    Object.entries(catGroups).forEach(([cat, rows]) => {
        tableHtml += `<tr class="category-row"><td colspan="5">${escHtml(cat)}</td></tr>`;
        rows.forEach(({ item, master }) => {
            tableHtml += buildPrintRow(item, master, true);
        });
    });
    // 工事グループ
    if (constItems.length > 0) {
        tableHtml += `<tr class="category-row"><td colspan="5">工事</td></tr>`;
        constItems.forEach(({ item, master }) => {
            tableHtml += buildPrintRow(item, master, false);
        });
    }

    const container = document.getElementById('print-table-body');
    container.innerHTML = tableHtml;
    document.getElementById('print-pl-title').textContent = pl.title || '';
    document.getElementById('print-pl-customer').textContent = addressName;
    document.getElementById('print-pl-sub').textContent = subTitle;
    document.getElementById('print-pl-date').textContent = fmtDate(pl.expirationDate) ? `有効期限：${fmtDate(pl.expirationDate)}` : '';
    document.getElementById('print-pl-created').textContent = `作成日：${fmtDate(pl.createdAt)}`;

    navigateTo('print');
    document.getElementById('print-back-btn').onclick = () => navigateTo('pricelists');
}

function buildPrintRow(item, master, isProduct) {
    const listPrice = isProduct && master ? master.price : null;
    let sellingPrice = null;
    if (item.specialPrice !== null && item.specialPrice !== undefined && item.specialPrice !== '') {
        sellingPrice = parseFloat(item.specialPrice);
    } else if (isProduct && listPrice && item.rate) {
        sellingPrice = listPrice * (parseFloat(item.rate) / 100);
    }

    const displayMode = item.displayMode || 'pct';
    const name = master ? escHtml(master.name) : '—';
    const code = master ? escHtml(master.code || '') : '';
    const rateStr = item.rate ? `${parseFloat(item.rate).toFixed(1)}%` : '—';

    // 表示モードに応じた「表示」列の値
    // %表示: 製品→掛け率%, 工事→参考率%
    // 金額表示: 製品・工事ともに卸価格（円）
    let displayCol = '';
    if (displayMode === 'pct') {
        displayCol = rateStr;  // 製品も工事も掛け率/参考率を表示
    } else {
        displayCol = sellingPrice !== null ? fmt(sellingPrice) : '—';
    }

    // 定価列（工事はOPEN）
    const listPriceCol = isProduct
        ? `<td class="text-right">${listPrice ? fmt(listPrice) : '—'}</td>`
        : `<td class="text-center"><span class="badge badge-open">OPEN</span></td>`;

    // 特価併記ロジック (金額入力モードかつ製品かつ基準掛け率がある場合のみ二重表記)
    let displayHtml = '';
    if (item.displayMode === 'amount' && item.specialPrice && isProduct && item.rate) {
        const normalRatePrice = listPrice ? (listPrice * (item.rate || 0) / 100) : null;
        displayHtml = `
            <div style="font-size:9px;color:var(--text3);text-decoration:line-through">${fmt(normalRatePrice)}</div>
            <div style="font-weight:600">${fmt(sellingPrice)}</div>
        `;
    } else {
        displayHtml = `<div>${sellingPrice !== null ? fmt(sellingPrice) : '—'}</div>`;
    }

    return `<tr>
        <td style="font-size:10px;color:var(--text3);white-space:nowrap">${code}</td>
        <td>${name}</td>
        ${listPriceCol}
        <td class="text-right">${displayHtml}</td>
        <td class="text-center">${displayCol}</td>
    </tr>`;
}

async function showCustomerPriceLists(customerId) {
    const [c, rawPls] = await Promise.all([dbGet('customers', customerId), dbGetAll('priceLists')]);
    if (!c) return;
    
    document.getElementById('cust-pl-title').textContent = c.name;
    const pls = rawPls.filter(p => p.customerId === customerId)
                      .sort((a,b) => (b.updatedAt||b.createdAt||'') > (a.updatedAt||a.createdAt||'') ? 1 : -1);

    const tbody = document.getElementById('cust-pl-tbody');
    if (pls.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:24px;color:var(--text3)">履歴がありません</td></tr>`;
    } else {
        tbody.innerHTML = pls.map(p => {
            const es = expiryStatus(p.expirationDate);
            const expClass = es === 'expired' ? 'expiry-expired' : es === 'warning' ? 'expiry-warning' : 'expiry-ok';
            const statusBadge = p.status === 'archived'
                ? `<span class="badge" style="background:#eee;color:#999">アーカイブ</span>`
                : es === 'expired' ? `<span class="badge badge-expired">期限切れ</span>`
                : es === 'warning' ? `<span class="badge badge-warning">期限間近</span>`
                : `<span class="badge badge-active">有効</span>`;
            return `<tr>
                <td><strong>${escHtml(p.title||'—')}</strong></td>
                <td>${statusBadge}</td>
                <td>v${p.version||1}</td>
                <td>${fmtDate(p.updatedAt||p.createdAt)}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-xs btn-secondary btn-icon" type="button" onclick="closeModal('customer-pl-modal'); openPriceListModal(${p.id})" title="基本設定"><i data-lucide="settings" style="width:12px;height:12px"></i></button>
                        <button class="btn btn-xs btn-secondary" type="button" onclick="closeModal('customer-pl-modal'); openPriceListEdit(${p.id})">${es === 'expired' ? '明細(閲覧)' : '明細(編集)'}</button>
                        <button class="btn btn-xs btn-primary" type="button" onclick="closeModal('customer-pl-modal'); openPrintPreview(${p.id})">印刷</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }
    openModal('customer-pl-modal');

    // アイコンの再描画
    if (window.lucide) lucide.createIcons();
}

// =====================
// モーダル制御
// =====================
function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// =====================
// XSSエスケープ
// =====================
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =====================
// データ管理・外部ファイル連携
// =====================
let _syncFileHandle = null;

/**
 * データが変更された際に呼ばれるフック
 * 同期設定が有効な場合、自動的にファイルへ保存する
 */
async function onDataChanged() {
    if (_syncFileHandle) {
        await saveToLocalFile();
    }
}

/** 
 * ローカルファイルとの接続（同期開始）
 */
async function connectLocalFile(mode = 'open') {
    if (!('showOpenFilePicker' in window)) {
        alert('お使いのブラウザはFile System Access APIをサポートしていません。最新のChromeまたはEdgeを使用してください。');
        return;
    }

    try {
        let handle;
        if (mode === 'create') {
            handle = await window.showSaveFilePicker({
                suggestedName: 'btob_database.json',
                types: [{ description: 'JSONファイル', accept: { 'application/json': ['.json'] } }]
            });
        } else {
            const [h] = await window.showOpenFilePicker({
                types: [{ description: 'JSONファイル', accept: { 'application/json': ['.json'] } }],
                multiple: false
            });
            handle = h;
        }
        
        _syncFileHandle = handle;
        
        // 最初の読み込み・書き込み確認
        if (mode === 'create') {
            // 新規作成時は現在のデータを書き込む
            await saveToLocalFile();
            showToast('新規同期ファイルを作成しました');
        } else {
            // 既存ファイル時は読み込むか確認
            if (confirm('ファイルからデータを読み込みますか？（ブラウザ内の現在のデータは上書きされます）\n「キャンセル」を押すと現在のブラウザデータをファイルへ書き込みます。')) {
                await loadFromLocalFile();
                showToast('ファイルからデータを読み込みました');
            } else {
                await saveToLocalFile();
                showToast('現在のデータをファイルへ保存しました');
            }
        }

        // ハンドルをIndexedDBに保存（次回起動用）
        await dbPut('appSettings', _syncFileHandle, 'syncFileHandle');
        updateSyncStatus();
        
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            alert('接続に失敗しました: ' + err.message);
        }
    }
}

/** 
 * 同期解除
 */
async function disconnectLocalFile() {
    if (!confirm('同期を解除しますか？（ファイル自体は削除されません）')) return;
    _syncFileHandle = null;
    await dbDelete('appSettings', 'syncFileHandle');
    updateSyncStatus();
    showToast('同期を解除しました');
}

/** 
 * ファイルへ書き出し
 */
async function saveToLocalFile() {
    if (!_syncFileHandle) return;
    try {
        const data = await dbExport();
        const writable = await _syncFileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        console.log('File synced:', _syncFileHandle.name);
    } catch (err) {
        console.error('Save to file failed:', err);
        // パーミッションエラーなどの場合は再接続を促す
        if (err.name === 'NotAllowedError') {
            _syncFileHandle = null;
            updateSyncStatus();
        }
    }
}

/** 
 * ファイルから読み込み
 */
async function loadFromLocalFile() {
    if (!_syncFileHandle) return;
    try {
        const file = await _syncFileHandle.getFile();
        const text = await file.text();
        if (text.trim()) {
            const data = JSON.parse(text);
            await dbImport(data);
            // 画面更新
            if (document.getElementById('page-dashboard').classList.contains('active')) loadDashboard();
            if (document.getElementById('page-customers').classList.contains('active')) loadCustomers();
            if (document.getElementById('page-products').classList.contains('active')) loadProducts();
            if (document.getElementById('page-constructions').classList.contains('active')) loadConstructions();
            if (document.getElementById('page-pricelists').classList.contains('active')) loadPriceLists();
        }
    } catch (err) {
        console.error('Load from file failed:', err);
        alert('読み込みに失敗しました: ' + err.message);
    }
}

/** 
 * UI上の同期ステータス更新
 */
function updateSyncStatus() {
    const dot = document.getElementById('sync-status-dot');
    const text = document.getElementById('sync-status-text');
    const fname = document.getElementById('sync-filename');
    const btnDisc = document.getElementById('btn-disconnect-sync');

    if (_syncFileHandle) {
        dot.style.background = 'var(--success)';
        text.textContent = '同期中（自動保存有効）';
        text.style.color = 'var(--success)';
        fname.textContent = _syncFileHandle.name;
        btnDisc.style.display = '';
    } else {
        dot.style.background = '#ccc';
        text.textContent = '未接続';
        text.style.color = 'var(--text3)';
        fname.textContent = '—';
        btnDisc.style.display = 'none';
    }
}

/** 
 * 手動エクスポート（ダウンロード）
 */
async function exportDataManual() {
    const data = await dbExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `btob_price_db_backup_${today().replace(/-/g,'')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSONファイルをダウンロードしました');
}

/** 
 * 手動インポート（アップロード）
 */
async function importDataManual(input) {
    const file = input.files[0];
    if (!file) return;
    if (!confirm('データを復元しますか？現在のデータはすべて上書きされます。')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            await dbImport(data);
            showToast('データを復元しました');
            loadDashboard();
            input.value = ''; // Reset
        } catch (err) {
            alert('ファイルの解析に失敗しました: ' + err.message);
        }
    };
    reader.readAsText(file);
}

/** 
 * データベースリセット
 */
async function resetDatabase() {
    if (!confirm('【警告】すべてのデータを初期化しますか？この操作は取り消せません。')) return;
    if (!confirm('本当によろしいですか？バックアップがない場合、データは永久に失われます。')) return;

    _syncFileHandle = null;
    await dbDelete('appSettings', 'syncFileHandle');
    
    await dbImport({}); // 空データで上書き
    showToast('データベースを初期化しました', 'danger');
    location.reload();
}

/** 
 * 起動時の同期チェック
 */
async function checkAutoSync() {
    try {
        const handle = await dbGet('appSettings', 'syncFileHandle');
        if (handle) {
            // パーミッション確認
            if (await handle.queryPermission({ mode: 'readwrite' }) === 'granted') {
                _syncFileHandle = handle;
                await loadFromLocalFile();
                console.log('Auto-sync connected:', handle.name);
            } else {
                console.log('Sync file found but permission required');
                // ユーザーアクションが必要なため、ここでは何もしない（UIで「再接続」を促すなど）
            }
        }
    } catch (err) {
        console.warn('Auto-sync check failed:', err);
    }
    updateSyncStatus();
}

// =====================
// 初期化
// =====================
window.addEventListener('DOMContentLoaded', async () => {
    await openDB();
    await checkAutoSync();
    navigateTo('dashboard');

    // ナビゲーション
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.addEventListener('click', () => {
            navigateTo(el.dataset.page);
            if (el.dataset.page === 'data') updateSyncStatus();
        });
    });

    // 検索
    document.getElementById('product-search').addEventListener('input', e => loadProducts(e.target.value));
    document.getElementById('construction-search').addEventListener('input', e => loadConstructions(e.target.value));
    document.getElementById('customer-search').addEventListener('input', e => loadCustomers(e.target.value));
    document.getElementById('pricelist-search').addEventListener('input', e => loadPriceLists(e.target.value));
});
