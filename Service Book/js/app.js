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

// 後続タスクで本実装に差し替えるスタブ
function loadCustomers(){}
function loadEquipments(){}
function loadRecords(){}
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
  if(window.lucide) lucide.createIcons();
});
