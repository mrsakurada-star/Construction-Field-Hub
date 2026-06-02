/* © 2026 Nozomi Sakurada. All rights reserved. */
function navigateTo(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+pageId)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${pageId}"]`)?.classList.add('active');
  if(pageId==='customers') loadCustomers();
  if(pageId==='equipments') loadEquipments();
  if(pageId==='records') loadRecords();
  if(pageId==='intake') loadIntake();
}
function showToast(msg,type='success'){const t=document.getElementById('toast');t.textContent=msg;t.className=`toast toast-${type} show`;setTimeout(()=>t.classList.remove('show'),3000);}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function openModal(id){document.getElementById(id)?.classList.add('open');}
function closeModal(id){document.getElementById(id)?.classList.remove('open');}
function today(){return new Date().toISOString().slice(0,10);}
function fmtDate(s){
  if(!s) return '—';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return `${m[1]}/${m[2]}/${m[3]}`;
  const d = new Date(s);
  return isNaN(d) ? s : `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function fmtYen(n){if(n===null||n===undefined||n==='')return '¥0';return '¥'+Math.round(Number(n)).toLocaleString('ja-JP');}

// === 顧客管理 ===
let _equipFilterCustomerId = null;
const CUSTOMER_FIELDS = ['name','kana','contact','address','dealerName','houseMaker','printNote','memo'];

async function loadCustomers(filterText=''){
  const all = await dbGetAll('customers');
  const filtered = filterText
    ? all.filter(c => fuzzyMatch(filterText, c.name, c.address, c.contact, c.kana, c.houseMaker, c.dealerName))
    : all;
  const tbody = document.getElementById('customer-list');
  tbody.innerHTML = filtered.length===0
    ? `<tr><td colspan="5" class="text-center" style="padding:32px;color:var(--text3)">顧客が登録されていません</td></tr>`
    : filtered.map(c=>`<tr>
        <td><strong style="cursor:pointer;color:var(--info);text-decoration:underline" onclick="goEquipmentsOf(${c.id})">${escHtml(c.name)}</strong>
            <div style="font-size:11px;color:var(--text3)">${escHtml(c.kana||'')}</div></td>
        <td>${escHtml(c.contact||'')}</td>
        <td>${escHtml(c.address||'')}</td>
        <td>${escHtml(c.houseMaker||'')}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-xs btn-secondary" type="button" onclick="openCustomerModal(${c.id})">編集</button>
          <button class="btn btn-xs btn-danger" type="button" onclick="deleteCustomer(${c.id})">削除</button>
        </div></td>
      </tr>`).join('');
}
function goEquipmentsOf(customerId){ _equipFilterCustomerId = customerId; navigateTo('equipments'); }

async function openCustomerModal(id=null){
  let data={};
  if(id){ data = await dbGet('customers', id) || {}; }
  document.getElementById('customer-modal-title').textContent = id?'顧客を編集':'顧客を追加';
  document.getElementById('customer-id').value = id || '';
  CUSTOMER_FIELDS.forEach(f=>{ document.getElementById('customer-'+f).value = data[f] || ''; });
  openModal('customer-modal');
}

async function saveCustomer(){
  const id = document.getElementById('customer-id').value;
  const name = normalizeFieldValue(document.getElementById('customer-name').value);
  if(!name){ alert('顧客名を入力してください'); return; }
  const data = {};
  CUSTOMER_FIELDS.forEach(f=>{ data[f] = normalizeFieldValue(document.getElementById('customer-'+f).value); });
  if(id){ data.id = parseInt(id); await dbPut('customers', data); }
  else { await dbAdd('customers', data); }
  closeModal('customer-modal');
  await onCustomersChanged();
  showToast('顧客情報を保存しました');
  loadCustomers(document.getElementById('customer-search').value);
}

async function deleteCustomer(id){
  if(!window.confirm('この顧客を削除しますか？（関連する機器・記録は残りますが紐付けが切れます）')) return;
  await dbDelete('customers', id);
  await onCustomersChanged();
  showToast('削除しました','danger');
  loadCustomers(document.getElementById('customer-search').value);
}

// === 機器管理 ===
let _recordFilterEquipmentId = null;
const EQUIP_TEXT_FIELDS = ['maker','modelNo','lotNo','category','gasType','usage','memo'];

async function loadEquipments(filterText=''){
  const [equips, customers] = await Promise.all([dbGetAll('equipments'), dbGetAll('customers')]);
  const cmap = Object.fromEntries(customers.map(c=>[c.id,c]));

  const fsel = document.getElementById('equipment-customer-filter');
  fsel.innerHTML = `<option value="">全顧客</option>` + customers.map(c=>
    `<option value="${c.id}" ${_equipFilterCustomerId==c.id?'selected':''}>${escHtml(c.name)}</option>`).join('');

  let list = equips;
  if(_equipFilterCustomerId) list = list.filter(e=>e.customerId==_equipFilterCustomerId);
  if(filterText) list = list.filter(e=>fuzzyMatch(filterText, e.modelNo, e.maker, e.usage, e.lotNo));

  const tbody = document.getElementById('equipment-list');
  tbody.innerHTML = list.length===0
    ? `<tr><td colspan="6" class="text-center" style="padding:32px;color:var(--text3)">機器が登録されていません</td></tr>`
    : list.map(e=>`<tr>
        <td>${cmap[e.customerId]?escHtml(cmap[e.customerId].name):'—'}</td>
        <td>${escHtml(e.maker||'')}<br><strong>${escHtml(e.modelNo||'')}</strong></td>
        <td>${escHtml(e.lotNo||'')}</td>
        <td>${escHtml(e.usage||'')}</td>
        <td>${fmtDate(e.installDate)}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-xs btn-secondary" type="button" onclick="goRecordsOf(${e.id})">記録</button>
          <button class="btn btn-xs btn-secondary" type="button" onclick="openEquipmentModal(${e.id})">編集</button>
          <button class="btn btn-xs btn-danger" type="button" onclick="deleteEquipment(${e.id})">削除</button>
        </div></td>
      </tr>`).join('');
}
function goRecordsOf(equipmentId){ _recordFilterEquipmentId = equipmentId; navigateTo('records'); }

async function openEquipmentModal(id=null){
  const customers = await dbGetAll('customers');
  let data = {};
  if(id){ data = await dbGet('equipments', id) || {}; }
  document.getElementById('equipment-modal-title').textContent = id?'機器を編集':'機器を追加';
  document.getElementById('equipment-id').value = id || '';
  const sel = document.getElementById('equipment-customerId');
  sel.innerHTML = `<option value="">— 顧客を選択 —</option>` + customers.map(c=>
    `<option value="${c.id}" ${data.customerId==c.id?'selected':''}>${escHtml(c.name)}</option>`).join('');
  if(!id && _equipFilterCustomerId) sel.value = _equipFilterCustomerId;
  EQUIP_TEXT_FIELDS.forEach(f=>{ document.getElementById('equipment-'+f).value = data[f]||''; });
  document.getElementById('equipment-installDate').value = data.installDate || '';
  openModal('equipment-modal');
}

async function saveEquipment(){
  const id = document.getElementById('equipment-id').value;
  const customerId = parseInt(document.getElementById('equipment-customerId').value) || null;
  if(!customerId){ alert('顧客を選択してください'); return; }
  const modelNo = normalizeFieldValue(document.getElementById('equipment-modelNo').value);
  if(!modelNo){ alert('型式を入力してください'); return; }
  const data = { customerId, installDate: document.getElementById('equipment-installDate').value };
  EQUIP_TEXT_FIELDS.forEach(f=>{ data[f] = normalizeFieldValue(document.getElementById('equipment-'+f).value); });
  if(id){ data.id = parseInt(id); await dbPut('equipments', data); }
  else { await dbAdd('equipments', data); }
  closeModal('equipment-modal');
  await onEquipmentsChanged();
  showToast('機器情報を保存しました');
  loadEquipments(document.getElementById('equipment-search').value);
}

async function deleteEquipment(id){
  if(!window.confirm('この機器を削除しますか？')) return;
  await dbDelete('equipments', id);
  await onEquipmentsChanged();
  showToast('削除しました','danger');
  loadEquipments(document.getElementById('equipment-search').value);
}

// === サービス記録 ===
const STALE_DAYS = 14; // 2週間。閾値はここで調整。
function staleDaysOf(rec){
  if(rec.status==='completed') return null;
  const base = rec.updatedAt || rec.createdAt;
  if(!base) return null;
  const days = Math.floor((Date.now() - new Date(base).getTime())/(1000*60*60*24));
  return days >= STALE_DAYS ? days : null;
}

async function loadRecords(){
  const [recs, equips, customers] = await Promise.all([
    dbGetAll('serviceRecords'), dbGetAll('equipments'), dbGetAll('customers')]);
  const emap = Object.fromEntries(equips.map(e=>[e.id,e]));
  const cmap = Object.fromEntries(customers.map(c=>[c.id,c]));

  const fsel = document.getElementById('record-equipment-filter');
  fsel.innerHTML = `<option value="">全機器</option>` + equips.map(e=>{
    const c = cmap[e.customerId];
    return `<option value="${e.id}" ${_recordFilterEquipmentId==e.id?'selected':''}>${escHtml((c?c.name+' / ':'')+(e.modelNo||''))}</option>`;
  }).join('');

  let list = [...recs];
  if(_recordFilterEquipmentId) list = list.filter(r=>r.equipmentId==_recordFilterEquipmentId);
  list.sort((a,b)=>(b.receivedDate||b.createdAt||'')>(a.receivedDate||a.createdAt||'')?1:-1);

  const staleCount = recs.filter(r=>staleDaysOf(r)!==null).length;
  const navBadge = document.getElementById('nav-badge-stale');
  navBadge.textContent = staleCount; navBadge.style.display = staleCount>0?'':'none';
  const sum = document.getElementById('stale-summary');
  sum.textContent = `放置案件 ${staleCount}件`; sum.style.display = staleCount>0?'':'none';

  const tbody = document.getElementById('record-list');
  tbody.innerHTML = list.length===0
    ? `<tr><td colspan="7" class="text-center" style="padding:32px;color:var(--text3)">記録がありません</td></tr>`
    : list.map(r=>{
        const e = emap[r.equipmentId];
        const c = e?cmap[e.customerId]:null;
        const stale = staleDaysOf(r);
        const rowStyle = stale!==null ? 'background:#fff1f0' : '';
        const statusBadge = r.status==='completed'
          ? `<span class="badge badge-active">完了</span>`
          : stale!==null
            ? `<span class="badge badge-expired">放置 ${stale}日</span>`
            : `<span class="badge badge-warning">進行中</span>`;
        return `<tr style="${rowStyle}">
          <td>${statusBadge}</td>
          <td>${fmtDate(r.receivedDate)}<br><span style="font-size:11px;color:var(--text3)">${fmtDate(r.serviceDate)}</span></td>
          <td>${escHtml(r.mgmtNo||'')}</td>
          <td>${c?escHtml(c.name):'—'}<br><span style="font-size:11px;color:var(--text3)">${e?escHtml(e.modelNo||''):''}</span></td>
          <td>${escHtml(r.workType||'')}</td>
          <td>${escHtml(r.staff||'')}</td>
          <td><div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-xs btn-secondary" type="button" onclick="openRecordModal(${r.id})">編集</button>
            <button class="btn btn-xs btn-primary" type="button" onclick="openPrint(${r.id})">報告書</button>
            <button class="btn btn-xs btn-danger" type="button" onclick="deleteRecord(${r.id})">削除</button>
          </div></td>
        </tr>`;
      }).join('');
}

let _partRows = [];
function renderParts(){
  const tbody = document.getElementById('record-parts');
  tbody.innerHTML = _partRows.map((p,i)=>`<tr>
    <td><input type="text" value="${escHtml(p.name||'')}" oninput="updatePart(${i},'name',this.value)"></td>
    <td><input type="number" value="${p.qty??''}" style="width:70px" oninput="updatePart(${i},'qty',this.value)"></td>
    <td><input type="number" value="${p.unitPrice??''}" style="width:100px" oninput="updatePart(${i},'unitPrice',this.value)"></td>
    <td><button class="btn btn-xs btn-danger" type="button" onclick="removePart(${i})">×</button></td>
  </tr>`).join('');
  recalcFee();
}
function addPartRow(){ _partRows.push({name:'',qty:1,unitPrice:0}); renderParts(); }
function updatePart(i,f,v){
  _partRows[i][f] = (f==='name')?v:(parseFloat(v)||0);
  if(f!=='name') recalcFee();
}
function removePart(i){ _partRows.splice(i,1); renderParts(); }
function recalcFee(){
  const partsFee = _partRows.reduce((s,p)=>s+(Number(p.qty)||0)*(Number(p.unitPrice)||0),0);
  const visit = parseFloat(document.getElementById('record-visitFee').value)||0;
  const labor = parseFloat(document.getElementById('record-laborFee').value)||0;
  document.getElementById('record-partsFee').textContent = fmtYen(partsFee);
  document.getElementById('record-total').textContent = fmtYen(visit+labor+partsFee);
}

async function nextMgmtNo(){
  const recs = await dbGetAll('serviceRecords');
  const prefix = 'SB-' + today().replace(/-/g,'') + '-';
  const todays = recs.filter(r=>(r.mgmtNo||'').startsWith(prefix));
  const seq = String(todays.length+1).padStart(2,'0');
  return prefix + seq;
}

async function openRecordModal(id=null){
  const equips = await dbGetAll('equipments');
  const customers = await dbGetAll('customers');
  const cmap = Object.fromEntries(customers.map(c=>[c.id,c]));
  let data = {};
  if(id){ data = await dbGet('serviceRecords', id) || {}; }
  document.getElementById('record-modal-title').textContent = id?'記録を編集':'記録を追加';
  document.getElementById('record-id').value = id || '';
  const sel = document.getElementById('record-equipmentId');
  sel.innerHTML = `<option value="">— 機器を選択 —</option>` + equips.map(e=>{
    const c=cmap[e.customerId]; return `<option value="${e.id}" ${data.equipmentId==e.id?'selected':''}>${escHtml((c?c.name+' / ':'')+(e.modelNo||''))}</option>`;
  }).join('');
  if(!id && _recordFilterEquipmentId) sel.value = _recordFilterEquipmentId;
  ['mgmtNo','receptionist','staff','callContent','remarks','customerReport'].forEach(f=>{
    document.getElementById('record-'+f).value = data[f]||''; });
  ['receivedDate','requestedDate','serviceDate','completionDate'].forEach(f=>{
    document.getElementById('record-'+f).value = data[f]||''; });
  document.getElementById('record-workType').value = data.workType || '定期点検';
  document.getElementById('record-visitFee').value = data.fee?.visitFee ?? '';
  document.getElementById('record-laborFee').value = data.fee?.laborFee ?? '';
  if(!data.mgmtNo && !id) document.getElementById('record-mgmtNo').value = await nextMgmtNo();
  _partRows = Array.isArray(data.parts) ? data.parts.map(p=>({...p})) : [];
  renderParts();
  openModal('record-modal');
}

async function saveRecord(){
  const id = document.getElementById('record-id').value;
  const equipmentId = parseInt(document.getElementById('record-equipmentId').value)||null;
  if(!equipmentId){ alert('機器を選択してください'); return; }
  const completionDate = document.getElementById('record-completionDate').value;
  const parts = _partRows.filter(p=>p.name||p.qty||p.unitPrice)
    .map(p=>({name:normalizeFieldValue(p.name), qty:Number(p.qty)||0, unitPrice:Number(p.unitPrice)||0}));
  const partsFee = parts.reduce((s,p)=>s+p.qty*p.unitPrice,0);
  const visitFee = parseFloat(document.getElementById('record-visitFee').value)||0;
  const laborFee = parseFloat(document.getElementById('record-laborFee').value)||0;
  const now = today();
  const base = id ? (await dbGet('serviceRecords', parseInt(id))) || {} : {};
  const data = {
    ...base,
    equipmentId,
    mgmtNo: normalizeFieldValue(document.getElementById('record-mgmtNo').value),
    receivedDate: document.getElementById('record-receivedDate').value,
    receptionist: normalizeFieldValue(document.getElementById('record-receptionist').value),
    requestedDate: document.getElementById('record-requestedDate').value,
    serviceDate: document.getElementById('record-serviceDate').value,
    completionDate,
    staff: normalizeFieldValue(document.getElementById('record-staff').value),
    workType: document.getElementById('record-workType').value,
    callContent: document.getElementById('record-callContent').value.trim(),
    remarks: document.getElementById('record-remarks').value.trim(),
    customerReport: document.getElementById('record-customerReport').value.trim(),
    parts,
    fee: { visitFee, laborFee, partsFee, total: visitFee+laborFee+partsFee },
    status: completionDate ? 'completed' : 'open',
    createdAt: base.createdAt || now,
    updatedAt: now
  };
  if(id){ data.id = parseInt(id); await dbPut('serviceRecords', data); }
  else { await dbAdd('serviceRecords', data); }
  closeModal('record-modal');
  await onRecordsChanged();
  showToast('記録を保存しました');
  loadRecords();
}

async function deleteRecord(id){
  if(!window.confirm('この記録を削除しますか？')) return;
  await dbDelete('serviceRecords', id);
  await onRecordsChanged();
  showToast('削除しました','danger');
  loadRecords();
}

function openPrint(){}

// 後続タスクで本実装に差し替えるスタブ
function loadIntake(){}

// =====================
// データ管理・外部ファイル連携 (フォルダ一括接続方式)
// =====================

const SYNC_CONFIG = {
  customers:  { filename: 'customers.json',       stores: ['customers'] },
  equipments: { filename: 'equipments.json',      stores: ['equipments'] },
  records:    { filename: 'service_records.json', stores: ['serviceRecords'] }
};

// ファイルハンドルキャッシュ
let _syncHandles = { customers: null, equipments: null, records: null };

// フォルダハンドル（showDirectoryPicker の結果）
let _dirHandle = null;

/**
 * データ変更時の自動保存トリガー
 */
async function onCustomersChanged()  { await saveToLocalFile('customers'); }
async function onEquipmentsChanged() { await saveToLocalFile('equipments'); }
async function onRecordsChanged()    { await saveToLocalFile('records'); }
// 複数ストアにまたがる操作のとき全ファイルを保存するユーティリティ
async function onDataChanged() {
  for (const k of Object.keys(SYNC_CONFIG)) await saveToLocalFile(k);
}

// =====================
// フォルダ選択・一括接続
// =====================

/**
 * dataフォルダを1回選択し、3ファイルを自動接続する
 */
async function connectDataFolder() {
  if (!('showDirectoryPicker' in window)) {
    alert('お使いのブラウザはDirectory Access APIをサポートしていません。\n最新のChrome / Edgeをご使用ください。');
    return;
  }
  try {
    const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
    await _initDirHandle(dir, true);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err);
      alert('フォルダの接続に失敗しました: ' + err.message);
    }
  }
}

/**
 * フォルダハンドルからファイルハンドルを取得・接続する共通処理
 * @param {FileSystemDirectoryHandle} dir
 * @param {boolean} interactive - trueならユーザーに読込/書込を確認する
 */
async function _initDirHandle(dir, interactive) {
  _dirHandle = dir;

  // ディレクトリハンドルをIndexedDBに永続化
  await dbPut('appSettings', dir, 'sync_dir');

  let loadCount = 0;
  const missing = [];

  for (const [dbKey, cfg] of Object.entries(SYNC_CONFIG)) {
    try {
      // ファイルが存在するか試みる
      const fh = await dir.getFileHandle(cfg.filename, { create: false });
      _syncHandles[dbKey] = fh;
      loadCount++;
    } catch (_) {
      // ファイルが存在しない場合は新規作成
      try {
        const fh = await dir.getFileHandle(cfg.filename, { create: true });
        _syncHandles[dbKey] = fh;
        missing.push(dbKey);
      } catch (e2) {
        console.warn(`Cannot access ${cfg.filename}:`, e2);
      }
    }
  }

  if (interactive) {
    if (missing.length === Object.keys(SYNC_CONFIG).length) {
      // 全て新規 → 現在のIndexedDBをファイルに書き出し
      for (const k of Object.keys(SYNC_CONFIG)) await saveToLocalFile(k);
      showToast('新しいデータファイルを作成しました');
    } else if (missing.length > 0) {
      // 一部新規
      for (const k of missing) await saveToLocalFile(k);
      const choice = confirm(
        `既存ファイルが見つかりました。\n` +
        `【OK】ファイルのデータをブラウザに読み込む\n` +
        `【キャンセル】現在のブラウザデータをファイルへ書き込む`
      );
      const existingKeys = Object.keys(SYNC_CONFIG).filter(k => !missing.includes(k));
      for (const k of existingKeys) {
        if (choice) await loadFromLocalFile(k);
        else await saveToLocalFile(k);
      }
      showToast(choice ? 'ファイルからデータを読み込みました' : 'データをファイルへ保存しました');
    } else {
      // 全て既存
      const choice = confirm(
        `dataフォルダ内の全ファイルを検出しました。\n\n` +
        `【OK】ファイルのデータをブラウザに読み込む\n` +
        `【キャンセル】現在のブラウザデータをファイルへ書き込む`
      );
      for (const k of Object.keys(SYNC_CONFIG)) {
        if (choice) await loadFromLocalFile(k);
        else await saveToLocalFile(k);
      }
      showToast(choice ? 'ファイルからデータを読み込みました' : 'データをファイルへ保存しました');
    }
  } else {
    // 非対話（起動時自動接続）: ファイルが存在するものだけ読み込む
    const existingKeys = Object.keys(SYNC_CONFIG).filter(k => !missing.includes(k));
    for (const k of existingKeys) await loadFromLocalFile(k);
    if (missing.length > 0) {
      for (const k of missing) await saveToLocalFile(k);
    }
  }

  updateSyncStatus();
  updateFolderStatus();
}

/**
 * フォルダ同期を解除する
 */
async function disconnectDataFolder() {
  if (!confirm('フォルダとの同期を解除しますか？\n（ファイル自体は削除されません）')) return;
  _dirHandle = null;
  for (const k of Object.keys(SYNC_CONFIG)) _syncHandles[k] = null;
  await dbDelete('appSettings', 'sync_dir');
  updateSyncStatus();
  updateFolderStatus();
  showToast('同期を解除しました');
}

// =====================
// ファイル読み書き
// =====================

/**
 * 指定キーのデータをファイルへ書き出す
 */
async function saveToLocalFile(dbKey) {
  const handle = _syncHandles[dbKey];
  if (!handle) return;
  try {
    const data = await dbExportPartial(SYNC_CONFIG[dbKey].stores);
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    console.log(`[sync] saved: ${SYNC_CONFIG[dbKey].filename}`);
  } catch (err) {
    console.error(`[sync] save failed [${dbKey}]:`, err);
    if (err.name === 'NotAllowedError') {
      showToast('ファイルへの書き込み権限がありません。フォルダを再接続してください。', 'danger');
      _dirHandle = null;
      for (const k of Object.keys(SYNC_CONFIG)) _syncHandles[k] = null;
      updateSyncStatus();
      updateFolderStatus();
    }
  }
}

/**
 * 指定キーのファイルからデータを読み込む
 */
async function loadFromLocalFile(dbKey) {
  const handle = _syncHandles[dbKey];
  if (!handle) return;
  try {
    const file = await handle.getFile();
    const text = await file.text();
    if (!text.trim()) return;
    const data = JSON.parse(text);
    await dbImportPartial(data, SYNC_CONFIG[dbKey].stores);
    // 表示中のページを更新
    const activePage = (id)=>{ const el=document.getElementById(id); return el && el.classList.contains('active'); };
    if(dbKey==='customers' && activePage('page-customers')) loadCustomers();
    if(dbKey==='equipments' && activePage('page-equipments')) loadEquipments();
    if(dbKey==='records' && activePage('page-records')) loadRecords();
  } catch (err) {
    console.error(`[sync] load failed [${dbKey}]:`, err);
  }
}

// =====================
// UI ステータス更新
// =====================

/**
 * フォルダ接続状態バナーを更新する
 */
function updateFolderStatus() {
  const connected = !!_dirHandle;

  // 接続済みバナー
  const banner = document.getElementById('folder-connected-banner');
  if (banner) banner.style.display = connected ? 'flex' : 'none';

  // 未接続バナー
  const noBanner = document.getElementById('folder-disconnected-banner');
  if (noBanner) noBanner.style.display = connected ? 'none' : 'flex';

  // フォルダ名表示
  const nameEl = document.getElementById('folder-connected-name');
  if (nameEl) nameEl.textContent = connected ? _dirHandle.name : '—';

  // ファイル一覧の接続状況
  Object.keys(SYNC_CONFIG).forEach(dbKey => {
    const dot   = document.getElementById(`sync-dot-${dbKey}`);
    const label = document.getElementById(`sync-label-${dbKey}`);
    if (!dot || !label) return;
    const ok = !!_syncHandles[dbKey];
    dot.style.background   = ok ? 'var(--success)' : '#ccc';
    label.textContent      = ok ? '接続済' : '—';
    label.style.color      = ok ? 'var(--success)' : 'var(--text3)';
  });
}

/**
 * 旧来の updateSyncStatus（旧UIとの互換のため残す）
 */
function updateSyncStatus() {
  updateFolderStatus();
}

/**
 * 起動時の自動同期チェック（フォルダハンドル方式）
 */
async function checkAutoSync() {
  try {
    const dir = await dbGet('appSettings', 'sync_dir');
    if (!dir) {
      // 旧方式のハンドル（個別ファイル）を移行チェック
      let foundOld = false;
      for (const dbKey of Object.keys(SYNC_CONFIG)) {
        const oldHandle = await dbGet('appSettings', `sync_${dbKey}`);
        if (oldHandle) { foundOld = true; break; }
      }
      const alertEl = document.getElementById('global-sync-alert');
      if (alertEl) alertEl.style.display = foundOld ? 'flex' : 'none';
      updateFolderStatus();
      return;
    }

    // パーミッションが自動で取れるか確認
    const perm = await dir.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      await _initDirHandle(dir, false);
      console.log('[sync] Auto-connected:', dir.name);
      const alertEl = document.getElementById('global-sync-alert');
      if (alertEl) alertEl.style.display = 'none';
    } else {
      // パーミッションが必要 → 再接続ボタンを表示
      _dirHandle = dir; // ハンドル自体は保持しておく
      const alertEl = document.getElementById('global-sync-alert');
      if (alertEl) alertEl.style.display = 'flex';
      console.log('[sync] Permission required for folder:', dir.name);
    }
  } catch (err) {
    console.warn('[sync] Auto-sync check failed:', err);
  }
  updateFolderStatus();
}

/**
 * 再接続ボタン押下（ユーザー操作によりパーミッションを要求）
 */
async function reconnectAllFiles() {
  try {
    const dir = _dirHandle || await dbGet('appSettings', 'sync_dir');
    if (!dir) {
      await connectDataFolder();
      return;
    }
    const perm = await dir.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      await _initDirHandle(dir, false);
      showToast('データフォルダへの接続が完了しました');
      const alertEl = document.getElementById('global-sync-alert');
      if (alertEl) alertEl.style.display = 'none';
    } else {
      showToast('アクセスが拒否されました', 'danger');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[sync] Reconnect failed:', err);
      showToast('再接続に失敗しました: ' + err.message, 'danger');
    }
  }
}

// =====================
// 初期化
// =====================
window.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  await checkAutoSync();
  updateFolderStatus();
  navigateTo('intake');

  document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
    el.addEventListener('click',()=>navigateTo(el.dataset.page));
  });
  document.getElementById('customer-search').addEventListener('input', e=>loadCustomers(e.target.value));
  document.getElementById('equipment-search').addEventListener('input', e=>loadEquipments(e.target.value));
  document.getElementById('equipment-customer-filter').addEventListener('change', e=>{ _equipFilterCustomerId = e.target.value?parseInt(e.target.value):null; loadEquipments(document.getElementById('equipment-search').value); });
  document.getElementById('record-visitFee').addEventListener('input', recalcFee);
  document.getElementById('record-laborFee').addEventListener('input', recalcFee);
  document.getElementById('record-equipment-filter').addEventListener('change', e=>{ _recordFilterEquipmentId = e.target.value?parseInt(e.target.value):null; loadRecords(); });
  if(window.lucide) lucide.createIcons();
});
