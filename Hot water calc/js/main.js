/* © 2026 Nozomi Sakurada. All rights reserved. */

// ===== 状態管理 =====
let state = {
  projectName: '',
  systems: [],
  currentSysId: null
};
let sysCounter = 0;
let fixtureCounter = 0;
let paramChangeDialogData = null;
let lastSavedState = null;  // 前回保存時の状態をメモリに保持


// ===== 追跡対象パラメータ（パラメータ変更検出用） =====
const TRACKED_PARAMS = {
  'common-tc': '往き温度',
  'common-k': 'K係数',
  'common-facility': '施設種別',
  'common-gastype': 'ガス種'
};

// ===== 詳細追跡対象パラメータ（基本条件全項目） =====
const DETAILED_TRACKED_PARAMS = {
  'common-name': '施設名称',
  'common-pref': '所在地',
  'common-tc': '往き温度',
  'common-k': 'K係数',
  'common-facility': '施設種別',
  'common-author': '作成者',
  'proj-date': '作成日',
  'proj-rev': '改訂番号',
  'common-memo': 'メモ',
  'gas-type': 'ガス種'
};

// ===== ページルーティング =====
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');

  const nav = document.getElementById('side-nav');
  if (name === 'top') {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
  }
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('nav-active', b.dataset.page === name);
  });
  if (name === 'systems') refreshSystemsGrid();
  if (name === 'report') {
    // 計算書出力時に未保存の変更をチェック
    const allChanges = detectAllChanges();
    if (allChanges && (allChanges.basic.length > 0 || allChanges.systems.length > 0)) {
      showUnsavedChangesDialog();
      return;  // ダイアログ表示後は処理を中断
    }
    generateReport();
  }

  // common ページ表示時に作成者欄を会社情報から自動入力
  if (name === 'common') {
    const authorField = document.getElementById('common-author');
    if (authorField && !authorField.value.trim()) {
      const co = getCompanyInfo();
      if (co.name) {
        authorField.value = co.dept ? `${co.name}　${co.dept}` : co.name;
      }
    }
    // 基本条件ページ表示時にリアルタイム変更検出を初期化
    initRealtimeChangeDetection();
  }
}

// ===== リアルタイム変更検出と表示 =====
function initRealtimeChangeDetection() {
  // 基本条件フォーム要素すべてにchangeイベントリスナーを追加
  const formFields = document.querySelectorAll(
    '#common-name, #common-pref, #common-tc, #common-k, #common-facility, ' +
    '#common-author, #proj-date, #proj-rev, #common-memo, input[name="gas-type"]'
  );

  formFields.forEach(field => {
    field.addEventListener('change', updateRealtimeChangeDisplay);
    field.addEventListener('input', updateRealtimeChangeDisplay);
  });
}

function updateRealtimeChangeDisplay() {
  if (!lastSavedState) return;

  const allChanges = detectAllChanges();

  // 変更内容表示エリアを取得または作成
  let changeDisplay = document.getElementById('realtime-change-display');
  if (!changeDisplay) {
    changeDisplay = document.createElement('div');
    changeDisplay.id = 'realtime-change-display';
    changeDisplay.style.cssText = `
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 12px 16px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.6;
    `;
    const firstSection = document.querySelector('.form-section');
    if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(changeDisplay, firstSection);
    }
  }

  // 変更内容をHTMLで構築
  if (allChanges && (allChanges.basic.length > 0 || allChanges.systems.length > 0)) {
    let html = '<strong style="color: #2e7d32;">📝 変更内容（自動検出）</strong><br>';

    if (allChanges.basic.length > 0) {
      html += '<div style="margin-top: 8px;">';
      allChanges.basic.forEach(c => {
        const text = generateDetailedChangeText(c.id, c.oldVal, c.newVal, c.label);
        html += `<div style="margin: 4px 0;">・${text}</div>`;
      });
      html += '</div>';
    }

    if (allChanges.systems.length > 0) {
      html += '<div style="margin-top: 8px;">';
      allChanges.systems.forEach(s => {
        const text = generateDetailedSystemChangeText(s);
        html += `<div style="margin: 4px 0;">・${text}</div>`;
      });
      html += '</div>';
    }

    changeDisplay.innerHTML = html;
    changeDisplay.style.display = 'block';
  } else {
    changeDisplay.style.display = 'none';
  }
}

// ===== 都道府県セレクト初期化 =====
function initPrefSelect() {
  const sel = document.getElementById('common-pref');
  Object.keys(PREFECTURE_TC_MAP).forEach(p => {
    const o = document.createElement('option');
    o.value = p; o.textContent = p;
    if (p === '東京都') o.selected = true;
    sel.appendChild(o);
  });
  onPrefChange();
}

function onPrefChange() {
  const pref = document.getElementById('common-pref').value;
  const tc = PREFECTURE_TC_MAP[pref] ?? 8;
  document.getElementById('common-tc').value = tc;
}

// ===== 日付初期セット =====
function initDate() {
  const el = document.getElementById('proj-date');
  if (el && !el.value) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    el.value = `${y}年${m}月${d}日`;
  }
}

// ===== 新規プロジェクト =====
function startNewProject() {
  state = {projectName:'', systems:[], currentSysId:null};
  sysCounter = 0; fixtureCounter = 0;
  document.getElementById('common-name').value = '';
  document.getElementById('common-pref').value = '東京都';
  onPrefChange();
  document.getElementById('common-k').value = DEFAULT_K;
  document.getElementById('common-facility').value = 'bizhotel';
  document.getElementById('common-author').value = '';
  document.getElementById('proj-date').value = '';
  initDate();
  document.getElementById('proj-rev').value = 'Rev.0';
  document.getElementById('common-memo').value = '';
  document.querySelector('input[name="gas-type"][value="13A"]').checked = true;
  document.getElementById('rev-history-tbody').innerHTML = '';

  localStorage.removeItem('hwv3_last_project');
  lastSavedState = null;  // 前回保存状態をクリア

  showPage('common');
}

// ===== 系統追加 =====
function addSystem() {
  sysCounter++;
  const facilityType = document.getElementById('common-facility')?.value || 'bizhotel';
  const sys = {
    id: sysCounter,
    name: `系統 ${sysCounter}`,
    pat: 'pat1',
    fixtures: [],
    p4params: {vol:10, qty:1, nfilter:6, dt2:5, dt1:10, tset:42, tfill:4, useQfill:false},
    p23params: {pipelen:0, losscoef:10, tankvol:1000},
    expansionParams: {enable:false, vsysPipe:0, unitModel:'GS-S3200GW'},
    multiParams: {
      facilityType,
      shower:  {qty:10, enabled:true},
      wash:    {qty:10, enabled:true},
      kitchen: {qty:0,  enabled:false},
      bath:    {vol:3000, fillMin:60, outdoor:false, enabled:false}
    },
    sliders: {},
    th: 60,
    unitcap: 32,
    result: null
  };
  fixtureCounter++;
  sys.fixtures.push({id:fixtureCounter, zone:'room', name:'洗面台（客室）', hq:7.6, hqTank:30.0, qty:1});
  fixtureCounter++;
  sys.fixtures.push({id:fixtureCounter, zone:'room', name:'シャワー（客室）', hq:114.0, hqTank:120.0, qty:0});
  state.systems.push(sys);
  state.currentSysId = sys.id;
  openSystemDetail(sys.id);
}

// ===== 系統詳細を開く =====
function openSystemDetail(id) {
  const sys = state.systems.find(s => s.id === id);
  if (!sys) return;
  state.currentSysId = id;

  document.getElementById('detail-name').value = sys.name;
  document.getElementById('detail-th').value = sys.th;
  document.getElementById('detail-unitcap').value = sys.unitcap;

  document.querySelectorAll('.pat-btn').forEach(b => {
    b.classList.toggle('pat-active', b.dataset.pat === sys.pat);
  });
  updatePatSections(sys.pat);

  const p = sys.p4params;
  document.getElementById('p4-vol').value = p.vol;
  document.getElementById('p4-qty').value = p.qty;
  document.getElementById('p4-nfilter').value = p.nfilter;
  document.getElementById('p4-dt2').value = p.dt2;
  document.getElementById('p4-dt1').value = p.dt1;
  document.getElementById('p4-tset').value = p.tset;
  document.getElementById('p4-tfill').value = p.tfill;
  document.getElementById('p4-useqfill').checked = p.useQfill;

  const pp = sys.p23params;
  document.getElementById('p23-pipelen').value = pp.pipelen;
  document.getElementById('p23-losscoef').value = pp.losscoef;
  document.getElementById('p23-tankvol').value = pp.tankvol;

  renderFixtures(sys);

  if (sys.multiParams) {
    document.getElementById('multi-shower-qty').value = sys.multiParams.shower.qty;
    document.getElementById('multi-shower-en').checked = sys.multiParams.shower.enabled;
    document.getElementById('multi-wash-qty').value = sys.multiParams.wash.qty;
    document.getElementById('multi-wash-en').checked = sys.multiParams.wash.enabled;
    document.getElementById('multi-kitchen-qty').value = sys.multiParams.kitchen.qty;
    document.getElementById('multi-kitchen-en').checked = sys.multiParams.kitchen.enabled;
    document.getElementById('multi-bath-vol').value = sys.multiParams.bath.vol;
    document.getElementById('multi-bath-fmin').value = sys.multiParams.bath.fillMin;
    document.getElementById('multi-bath-outdoor').checked = sys.multiParams.bath.outdoor;
    document.getElementById('multi-bath-en').checked = sys.multiParams.bath.enabled;
    if (sys.multiParams.facilityType) {
      document.getElementById('common-facility').value = sys.multiParams.facilityType;
    }
  }

  showPage('detail');
  window.updateFixtureGroupDisplay?.();
  setTimeout(() => { calcAndUpdate(); }, 0);
}

// ===== パターン切替 =====
function selectPat(btn, pat) {
  document.querySelectorAll('.pat-btn').forEach(b => b.classList.remove('pat-active'));
  btn.classList.add('pat-active');
  updatePatSections(pat);
  calcAndUpdate();
}

function updatePatSections(pat) {
  const show = id => document.getElementById(id)?.classList.remove('hidden');
  const hide = id => document.getElementById(id)?.classList.add('hidden');

  if (pat === 'pat1') {
    show('multi-area'); hide('fixtures-area'); hide('pat4-section');
    hide('pat23-section'); hide('p3-tank-area');
  } else if (pat === 'pat2') {
    show('multi-area'); hide('fixtures-area'); hide('pat4-section');
    show('pat23-section'); hide('p3-tank-area');
  } else if (pat === 'pat3') {
    hide('multi-area'); show('fixtures-area'); show('pat23-section');
    hide('pat4-section'); show('p3-tank-area');
  } else if (pat === 'pat4') {
    hide('multi-area'); hide('fixtures-area'); hide('pat23-section');
    show('pat4-section'); hide('p3-tank-area');
  }
}

// ===== 器具テーブル =====
function renderFixtures(sys) {
  const tbody = document.getElementById('fixture-tbody');
  tbody.innerHTML = '';
  sys.fixtures.forEach(f => {
    const opts = (FIXTURE_PRESETS[f.zone] || []).map(([name]) =>
      `<option value="${name}" ${name === f.name ? 'selected' : ''}>${name}</option>`).join('');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><select class="tbl-select" onchange="onFixtureNameChange(${f.id},this)">${opts}</select></td>
      <td class="text-center"><span class="zone-tag">${ZONE_LABELS[f.zone]}</span></td>
      <td class="num-cell" id="fhq-${f.id}">${f.hqTank}</td>
      <td><input type="number" value="${f.qty}" step="1" min="0" class="num-input" onchange="updateFixture(${f.id},'qty',this.value)"></td>
      <td class="text-center"><button onclick="removeFixture(${f.id})" class="del-btn">✕</button></td>`;
    tbody.appendChild(row);
  });
}

function onFixtureNameChange(fid, sel) {
  const sys = state.systems.find(s => s.id === state.currentSysId);
  if (!sys) return;
  const f = sys.fixtures.find(x => x.id === fid);
  if (!f) return;
  f.name = sel.value;
  const found = (FIXTURE_PRESETS[f.zone] || []).find(([n]) => n === sel.value);
  if (found) { f.hq = found[1]; f.hqTank = found[2]; }
  document.getElementById('fhq-' + fid).textContent = f.hqTank;
  calcAndUpdate();
}

function updateFixture(fid, key, val) {
  const sys = state.systems.find(s => s.id === state.currentSysId);
  if (!sys) return;
  const f = sys.fixtures.find(x => x.id === fid);
  if (f) f[key] = parseFloat(val) || 0;
  calcAndUpdate();
}

function removeFixture(fid) {
  const sys = state.systems.find(s => s.id === state.currentSysId);
  if (!sys) return;
  sys.fixtures = sys.fixtures.filter(f => f.id !== fid);
  renderFixtures(sys);
  calcAndUpdate();
}

function addFixtureRow(zone) {
  const sys = state.systems.find(s => s.id === state.currentSysId);
  if (!sys) return;
  const presets = FIXTURE_PRESETS[zone] || [];
  if (!presets.length) return;
  fixtureCounter++;
  sys.fixtures.push({id:fixtureCounter, zone, name:presets[0][0], hq:presets[0][1], hqTank:presets[0][2], qty:1});
  renderFixtures(sys);
  calcAndUpdate();
}

function getCurrentPat() {
  return document.querySelector('.pat-btn.pat-active')?.dataset.pat || 'pat1';
}

// ===== スライダー管理 =====
function initSlider(key, autoVal, sys) {
  const slider = document.getElementById(`slider-${key}`);
  const display = document.getElementById(`slider-val-${key}`);
  const badge = document.getElementById(`slider-badge-${key}`);
  const resetBtn = document.getElementById(`slider-reset-${key}`);
  if (!slider) return;

  const currentVal = (sys.sliders && sys.sliders[key] != null) ? sys.sliders[key] : autoVal;
  slider.value = currentVal;
  display.textContent = `${currentVal}%`;
  const isManual = sys.sliders && sys.sliders[key] != null;
  badge.classList.toggle('hidden', !isManual);
  resetBtn.classList.toggle('hidden', !isManual);

  slider.oninput = () => {
    const v = parseInt(slider.value);
    display.textContent = `${v}%`;
    if (!sys.sliders) sys.sliders = {};
    sys.sliders[key] = v;
    badge.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    calcAndUpdate();
  };
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (sys.sliders) delete sys.sliders[key];
      slider.value = autoVal;
      display.textContent = `${autoVal}%`;
      badge.classList.add('hidden');
      resetBtn.classList.add('hidden');
      calcAndUpdate();
    };
  }
}

function updateSliders(sys, r) {
  const ftype = sys.multiParams?.facilityType || 'bizhotel';

  if (r.isMulti) {
    const keys = {shower:'shower', wash:'wash', kitchen:'kitchen'};
    Object.entries(keys).forEach(([k]) => {
      const qty = sys.multiParams?.[k]?.qty || 0;
      const autoVal = getPurposeUsageRate(ftype, qty);
      initSlider(k, autoVal, sys);
    });
    ['shower','wash','kitchen'].forEach(k => {
      const el = document.getElementById(`slider-row-${k}`);
      if (el) {
        const enabled = sys.multiParams?.[k]?.enabled;
        const qty = sys.multiParams?.[k]?.qty || 0;
        el.classList.toggle('hidden', !enabled || qty === 0);
      }
    });
    const pat3Row = document.getElementById('slider-row-pat3');
    if (pat3Row) pat3Row.classList.add('hidden');
  } else if (r.isPat3) {
    const autoVal = r.autoU_percent || getPurposeUsageRate(sys.multiParams?.facilityType || 'hotel', r.totalQty);
    initSlider('pat3', autoVal, sys);
    const pat3Row = document.getElementById('slider-row-pat3');
    if (pat3Row) pat3Row.classList.remove('hidden');
    ['shower','wash','kitchen'].forEach(k => {
      const el = document.getElementById(`slider-row-${k}`);
      if (el) el.classList.add('hidden');
    });
  } else {
    ['shower','wash','kitchen','pat3'].forEach(k => {
      const el = document.getElementById(`slider-row-${k}`);
      if (el) el.classList.add('hidden');
    });
  }
}

// ===== 計算＆結果表示 =====
function calcAndUpdate() {
  const detailPage = document.getElementById('page-detail');
  if (detailPage && !detailPage.classList.contains('active')) return;
  const sys = state.systems.find(s => s.id === state.currentSysId);
  if (!sys) return;

  sys.name = document.getElementById('detail-name').value || sys.name;
  sys.pat = getCurrentPat();
  sys.th = parseFloat(document.getElementById('detail-th').value) || 60;
  sys.unitcap = parseFloat(document.getElementById('detail-unitcap').value) || 32;
  sys.p4params = {
    vol:       parseFloat(document.getElementById('p4-vol').value) || 10,
    qty:       parseFloat(document.getElementById('p4-qty').value) || 1,
    nfilter:   parseFloat(document.getElementById('p4-nfilter').value) || 6,
    dt2:       parseFloat(document.getElementById('p4-dt2').value) || 5,
    dt1:       parseFloat(document.getElementById('p4-dt1').value) || 10,
    tset:      parseFloat(document.getElementById('p4-tset').value) || 42,
    tfill:     parseFloat(document.getElementById('p4-tfill').value) || 4,
    useQfill:  document.getElementById('p4-useqfill').checked
  };
  sys.p23params = {
    pipelen:   parseFloat(document.getElementById('p23-pipelen').value) || 0,
    losscoef:  parseFloat(document.getElementById('p23-losscoef').value) || 10,
    tankvol:   parseFloat(document.getElementById('p23-tankvol').value) || 1000
  };
  sys.expansionParams = {
    enable:    document.getElementById('exp-enable')?.checked || false,
    vsysPipe:  parseFloat(document.getElementById('exp-vsys-pipe')?.value) || 0,
    unitModel: document.getElementById('exp-unit-model')?.value || 'GS-S3200GW'
  };

  const tc = parseFloat(document.getElementById('common-tc').value) || 8;
  const K = parseFloat(document.getElementById('common-k').value) || DEFAULT_K;
  const facilityType = document.getElementById('common-facility')?.value || 'hotel';

  if (sys.pat === 'pat1' || sys.pat === 'pat2') {
    sys.multiParams = {
      facilityType: document.getElementById('common-facility')?.value || 'bizhotel',
      shower:  {qty: parseInt(document.getElementById('multi-shower-qty')?.value || 10),  enabled: document.getElementById('multi-shower-en')?.checked !== false},
      wash:    {qty: parseInt(document.getElementById('multi-wash-qty')?.value || 10),    enabled: document.getElementById('multi-wash-en')?.checked !== false},
      kitchen: {qty: parseInt(document.getElementById('multi-kitchen-qty')?.value || 0),  enabled: document.getElementById('multi-kitchen-en')?.checked || false},
      bath:    {vol: parseFloat(document.getElementById('multi-bath-vol')?.value || 3000), fillMin: parseFloat(document.getElementById('multi-bath-fmin')?.value || 60), outdoor: document.getElementById('multi-bath-outdoor')?.checked || false, enabled: document.getElementById('multi-bath-en')?.checked || false}
    };
    sys.result = calcMulti(sys, tc, K);
    updateFixtureGroupDisplay();
  } else if (sys.pat === 'pat3') {
    sys.result = calcPat3(sys, tc, K, facilityType);
  } else if (sys.pat === 'pat4') {
    sys.result = calcPat4(sys, tc, K);
  }

  if (sys.expansionParams.enable) {
    const unitVol = UNIT_INTERNAL_VOL[sys.expansionParams.unitModel] || UNIT_INTERNAL_VOL.default;
    sys.result.expansionTank = calcExpansionTank(sys.expansionParams.vsysPipe, sys.th, sys.result.finalUnits, unitVol);
  } else {
    sys.result.expansionTank = null;
  }

  updateSliders(sys, sys.result);
  showResult(sys.result);
  refreshSummary();
}

// ===== 結果表示 =====
function showResult(r) {
  const sec = document.getElementById('detail-result');
  sec.classList.remove('hidden');

  if (r.isMulti) {
    document.getElementById('res-primary').textContent = `${Math.ceil(Math.max(r.gosuA, r.unitsB * r.unitcap))} 号`;
    document.getElementById('res-primary-label').textContent = '必要合計号数';
    document.getElementById('res-selection').textContent = `${r.unitcap}号機 × ${r.finalUnits}台`;
    document.getElementById('res-sub').textContent = '';
  } else {
    const kw = r.isPat4 ? r.Q_design : r.H_total;
    document.getElementById('res-primary').textContent = `${kw.toFixed(1)} kW`;
    document.getElementById('res-primary-label').textContent = r.isPat4 ? '設計熱源能力 Q_design' : '必要リカバリー加熱能力';
    document.getElementById('res-selection').textContent = `${r.unitcap}号機 × ${r.finalUnits}台`;
    document.getElementById('res-sub').textContent = `${(kw * 860).toLocaleString(undefined, {maximumFractionDigits:0})} kcal/h`;
  }

  // タンク容量
  const tankArea = document.getElementById('res-tank-area');
  if (tankArea) {
    tankArea.classList.toggle('hidden', !r.isPat3);
    if (r.isPat3) document.getElementById('res-tank').textContent = Math.round(r.reqTankVol).toLocaleString();
  }

  // 配管
  const pipeEl = document.getElementById('res-pipe');
  if (pipeEl && r.pipeInfo) {
    pipeEl.textContent = `給水 ${r.pipeInfo.kyusuiA} / 給湯往き ${r.pipeInfo.kyutoA}`;
    pipeEl.parentElement.classList.remove('hidden');
  } else if (pipeEl) {
    pipeEl.parentElement.classList.add('hidden');
  }

  // 補助情報
  let aux = '';
  if (r.waterDirect) {
    const cls = {ok:'aux-ok', warn:'aux-warn', ng:'aux-ng'}[r.waterDirect.status] || 'aux-warn';
    aux += `<div class="aux-row ${cls}"><strong>水道直結 ${r.waterDirect.label}</strong>　${r.waterDirect.message}</div>`;
  }
  if (r.gasKw70Alert) {
    aux += `<div class="aux-row aux-danger">⚠ ガス消費量70kW以上 — 火災予防条例に基づく届出が必要です</div>`;
  }
  if (r.tankControl) {
    aux += `<div class="aux-row aux-info">一次側ポンプ制御: ON ${r.tankControl.pumpOn}℃ / OFF ${r.tankControl.pumpOff}℃</div>`;
  }
  if (r.expansionTank) {
    const et = r.expansionTank;
    aux += `<div class="aux-row aux-neutral">膨張タンク: 計算値 ${et.vexp.toFixed(2)}L → 推奨 ${et.recommended}L 以上 （V_sys=${et.vsysTotal.toFixed(1)}L / S=${et.S.toFixed(4)}）</div>`;
  }
  document.getElementById('res-aux').innerHTML = aux;
}

function updateFixtureGroupDisplay() {
  ['shower','wash','kitchen','bath'].forEach(key => {
    const checkbox = document.getElementById(`multi-${key}-en`);
    const group = checkbox?.closest('.fixture-group');
    if (!group) return;
    const enabled = checkbox?.checked === true;
    const body = group.querySelector('.fixture-group-body');
    if (body) body.classList.toggle('hidden', !enabled);
    group.classList.toggle('enabled', enabled);
  });
}

function saveSystemAndBack() {
  calcAndUpdate();
  setTimeout(() => showPage('systems'), 50);
}

function deleteSystem(id) {
  if (!confirm('この系統を削除しますか？')) return;
  state.systems = state.systems.filter(s => s.id !== id);
  refreshSummary();
  refreshSystemsGrid();
}

// ===== 系統一覧 =====
function refreshSystemsGrid() {
  const grid = document.getElementById('systems-grid');
  grid.innerHTML = '';
  const PAT_LABELS_SHORT = {pat1:'直圧', pat2:'循環', pat3:'貯湯', pat4:'ろ過', multi:'マルチ'};

  state.systems.forEach(sys => {
    const r = sys.result;
    let kwStr = r ? (
      r.isMulti ? `${Math.ceil(Math.max(r.gosuA, r.unitsB * r.unitcap))} 号相当` :
      r.isPat4  ? `${r.Q_design.toFixed(1)} kW` :
                  `${r.H_total.toFixed(1)} kW`
    ) : '―';
    const card = document.createElement('div');
    card.className = 'sys-card';
    card.innerHTML = `
      <div class="sys-card-header">
        <span class="sys-pat-badge">${PAT_LABELS_SHORT[sys.pat] || sys.pat}</span>
        <div class="sys-card-actions">
          <button onclick="openSystemDetail(${sys.id})" title="編集">✎</button>
          <button onclick="deleteSystem(${sys.id})" title="削除" class="del">✕</button>
        </div>
      </div>
      <h3 class="sys-card-name">${sys.name}</h3>
      <div class="sys-card-meta">${sys.th}℃給湯</div>
      ${r ? `<div class="sys-card-result">
        <span class="sys-result-val">${kwStr}</span>
        <span class="sys-result-sel">${r.unitcap}号 × ${r.finalUnits}台</span>
      </div>` : '<div class="sys-card-uncalc">未計算</div>'}`;
    grid.appendChild(card);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'sys-add-btn';
  addBtn.onclick = addSystem;
  addBtn.innerHTML = `<span class="sys-add-icon">＋</span><span>新しい系統を設計</span>`;
  grid.appendChild(addBtn);
  refreshSummary();
}

function refreshSummary() {
  const calculated = state.systems.filter(s => s.result);
  const summaryEl = document.getElementById('systems-summary');
  if (!summaryEl) return;
  summaryEl.classList.toggle('hidden', calculated.length === 0);
  if (calculated.length === 0) return;
  const totalKw = calculated.reduce((s, sys) => {
    const r = sys.result;
    if (r.isMulti) return s;
    return s + (r.isPat4 ? r.Q_design : r.H_total);
  }, 0);
  document.getElementById('total-kw').textContent = `${totalKw.toFixed(1)} kW`;
}

// ===== 保存・読込 =====
function getCurrentParams() {
  const params = {};
  Object.keys(DETAILED_TRACKED_PARAMS).forEach(id => {
    if (id === 'gas-type') {
      // ガス種（radio button）を取得
      const gasRadio = document.querySelector('input[name="gas-type"]:checked');
      if (gasRadio) params[id] = gasRadio.value;
    } else {
      const elem = document.getElementById(id);
      if (elem) params[id] = elem.value || '';
    }
  });
  return params;
}

function getCurrentSystemsData() {
  return JSON.stringify(state.systems);
}

function detectBasicParamChanges() {
  const lastData = localStorage.getItem('hwv3_last_project');
  if (!lastData) return null;

  try {
    const parsed = JSON.parse(lastData);
    const lastParams = parsed.lastParams || {};
    const currentParams = getCurrentParams();
    const changes = [];

    Object.keys(DETAILED_TRACKED_PARAMS).forEach(id => {
      const oldVal = lastParams[id];
      const newVal = currentParams[id];
      if (oldVal !== undefined && oldVal !== newVal) {
        changes.push({id, label: DETAILED_TRACKED_PARAMS[id], oldVal, newVal});
      }
    });

    return changes.length > 0 ? changes : null;
  } catch(e) {
    return null;
  }
}

function detectSystemChanges() {
  const lastData = localStorage.getItem('hwv3_last_project');
  if (!lastData) return null;

  try {
    const parsed = JSON.parse(lastData);
    const lastSystemsJSON = parsed.lastSystemsJSON;
    if (!lastSystemsJSON) return null;

    const lastSystems = JSON.parse(lastSystemsJSON);
    const currentSystems = state.systems;
    const changes = [];

    // System 数の変更を検出
    if (lastSystems.length !== currentSystems.length) {
      const diff = currentSystems.length - lastSystems.length;
      if (diff > 0) {
        const newSys = currentSystems[currentSystems.length - 1];
        changes.push({
          type: 'addition',
          summary: `System ${newSys.id}（${newSys.name}）を新規追加`
        });
      } else {
        changes.push({type: 'deletion', summary: 'System が削除されました'});
      }
    }

    // 既存 System の変更を検出
    for (let i = 0; i < Math.min(lastSystems.length, currentSystems.length); i++) {
      const last = lastSystems[i];
      const curr = currentSystems[i];

      if (JSON.stringify(last) !== JSON.stringify(curr)) {
        const details = [];

        // 基本情報
        if (last.name !== curr.name) details.push(`系統名が${last.name}→${curr.name}に変更`);
        if (last.pat !== curr.pat) details.push(`パターンが${last.pat}→${curr.pat}に変更`);
        if (last.th !== curr.th) details.push(`給湯温度が${last.th}℃→${curr.th}℃に変更`);
        if (last.unitcap !== curr.unitcap) details.push(`機器が${last.unitcap}号→${curr.unitcap}号に変更`);

        // わかりやすい詳細比較
        const systemDetails = compareSystemDetails(last, curr);
        details.push(...systemDetails);

        if (details.length > 0) {
          changes.push({
            type: 'modified',
            systemId: curr.id,
            systemName: curr.name,
            details: details.join(' | ')
          });
        }
      }
    }

    return changes.length > 0 ? changes : null;
  } catch(e) {
    return null;
  }
}

function detectAllChanges() {
  const basicChanges = detectBasicParamChanges();
  const systemChanges = detectSystemChanges();

  if (!basicChanges && !systemChanges) return null;

  return {
    basic: basicChanges || [],
    systems: systemChanges || []
  };
}

// ===== パラメータラベル定義 =====
const PARAM_LABEL_MAP = {
  shower: 'シャワー・浴室カラン',
  wash: '手洗い（洗面）カラン',
  kitchen: '厨房カラン',
  bath: '浴槽',
  qty: '数量',
  enabled: 'ステータス',
  vol: '容量',
  nfilter: 'フィルタ数',
  dt1: 'dt1',
  dt2: 'dt2',
  tset: '設定温度',
  tfill: '充填温度',
  useQfill: '充填流量使用',
  pipelen: '配管長',
  losscoef: '損失係数',
  tankvol: 'タンク容量',
  hq: '流量',
  hqTank: 'タンク流量'
};

// ===== わかりやすい System パラメータ比較 =====
function compareSystemDetails(last, curr) {
  const details = [];

  // multiParams（器具グループ）の比較
  const lastMulti = last.multiParams || {};
  const currMulti = curr.multiParams || {};
  const typeLabels = {
    shower: 'シャワー・浴室カラン',
    wash: '手洗い（洗面）カラン',
    kitchen: '厨房カラン',
    bath: '浴槽'
  };

  Object.keys(typeLabels).forEach(type => {
    const lastType = lastMulti[type] || {};
    const currType = currMulti[type] || {};

    if (lastType.qty !== currType.qty) {
      details.push(`${typeLabels[type]}の数量が${lastType.qty}→${currType.qty}に変更`);
    }
    if (lastType.enabled !== currType.enabled) {
      const qty = currType.qty || 0;
      if (currType.enabled && !lastType.enabled) {
        // 無効 → 有効：追加
        details.push(`${typeLabels[type]}が${qty}個追加されました`);
      } else if (!currType.enabled && lastType.enabled) {
        // 有効 → 無効：削除
        details.push(`${typeLabels[type]}が${qty}個削除されました`);
      }
    }
    if (lastType.vol !== currType.vol) {
      details.push(`${typeLabels[type]}の容量が${lastType.vol}→${currType.vol}に変更`);
    }
    if (lastType.fillMin !== currType.fillMin) {
      details.push(`${typeLabels[type]}の充填時間が${lastType.fillMin}→${currType.fillMin}に変更`);
    }
  });

  // p4params（ろ過昇温）の比較
  const lastp4 = last.p4params || {};
  const currp4 = curr.p4params || {};

  if (lastp4.vol !== currp4.vol) {
    details.push(`ろ過昇温の容量が${lastp4.vol}→${currp4.vol}に変更`);
  }
  if (lastp4.qty !== currp4.qty) {
    details.push(`ろ過昇温の機器台数が${lastp4.qty}→${currp4.qty}に変更`);
  }
  if (lastp4.nfilter !== currp4.nfilter) {
    details.push(`ろ過昇温のフィルタ数が${lastp4.nfilter}→${currp4.nfilter}に変更`);
  }
  if (lastp4.dt1 !== currp4.dt1) {
    details.push(`ろ過昇温のdt1が${lastp4.dt1}→${currp4.dt1}に変更`);
  }
  if (lastp4.dt2 !== currp4.dt2) {
    details.push(`ろ過昇温のdt2が${lastp4.dt2}→${currp4.dt2}に変更`);
  }
  if (lastp4.tset !== currp4.tset) {
    details.push(`ろ過昇温の設定温度が${lastp4.tset}℃→${currp4.tset}℃に変更`);
  }
  if (lastp4.tfill !== currp4.tfill) {
    details.push(`ろ過昇温の充填温度が${lastp4.tfill}℃→${currp4.tfill}℃に変更`);
  }

  // p23params（循環配管）の比較
  const lastp23 = last.p23params || {};
  const currp23 = curr.p23params || {};

  if (lastp23.pipelen !== currp23.pipelen) {
    details.push(`循環配管の配管長が${lastp23.pipelen}→${currp23.pipelen}に変更`);
  }
  if (lastp23.losscoef !== currp23.losscoef) {
    details.push(`循環配管の損失係数が${lastp23.losscoef}→${currp23.losscoef}に変更`);
  }
  if (lastp23.tankvol !== currp23.tankvol) {
    details.push(`循環配管のタンク容量が${lastp23.tankvol}→${currp23.tankvol}に変更`);
  }

  // fixtures（給湯器具）の比較
  const lastFixtures = last.fixtures || [];
  const currFixtures = curr.fixtures || [];

  if (lastFixtures.length !== currFixtures.length) {
    details.push(`給湯器具の個数が${lastFixtures.length}→${currFixtures.length}に変更`);
  }

  for (let i = 0; i < Math.min(lastFixtures.length, currFixtures.length); i++) {
    const lastFix = lastFixtures[i];
    const currFix = currFixtures[i];

    if (lastFix.hq !== currFix.hq) {
      details.push(`器具「${currFix.name}」の流量が${lastFix.hq}→${currFix.hq}に変更`);
    }
    if (lastFix.qty !== currFix.qty) {
      details.push(`器具「${currFix.name}」の数量が${lastFix.qty}→${currFix.qty}に変更`);
    }
  }

  // expansionParams（膨張タンク）の比較
  const lastExpansion = last.expansionParams || {};
  const currExpansion = curr.expansionParams || {};

  if (lastExpansion.enable !== currExpansion.enable) {
    if (currExpansion.enable && !lastExpansion.enable) {
      // 無効 → 有効：追加
      details.push(`膨張タンクが1個追加されました`);
    } else if (!currExpansion.enable && lastExpansion.enable) {
      // 有効 → 無効：削除
      details.push(`膨張タンクが1個削除されました`);
    }
  }
  if (lastExpansion.unitModel !== currExpansion.unitModel) {
    details.push(`膨張タンクのモデルが${lastExpansion.unitModel}→${currExpansion.unitModel}に変更`);
  }

  return details;
}

// ===== 詳細な変更内容テキスト生成 =====
function generateDetailedChangeText(paramId, oldVal, newVal, label) {
  const unitMap = {
    'common-tc': '℃',
    'common-k': '',
    'common-facility': '',
    'gas-type': ''
  };

  const facilityMap = {
    'apartment': '共同住宅',
    'hotel': 'ホテル',
    'bizhotel': 'ビジネスホテル',
    'hospital': '病院',
    'school': '学校',
    'dorm': '寮',
    'office': 'オフィス'
  };

  const unit = unitMap[paramId] || '';
  let oldDisplay = oldVal, newDisplay = newVal;

  // 施設種別の場合はラベルに変換
  if (paramId === 'common-facility') {
    oldDisplay = facilityMap[oldVal] || oldVal;
    newDisplay = facilityMap[newVal] || newVal;
    return `${label}が「${oldDisplay}」から「${newDisplay}」に変更されました`;
  }

  // 施設名称や作成者などのテキスト項目
  if (['common-name', 'common-author', 'common-memo', 'common-pref'].includes(paramId)) {
    return `${label}が「${oldVal}」から「${newVal}」に変更されました`;
  }

  // 数値項目（往き温度、K係数など）
  if (['common-tc', 'common-k'].includes(paramId)) {
    return `${label}が${oldVal}${unit}から${newVal}${unit}に変更されました`;
  }

  // ガス種などその他の項目
  return `${label}が${oldVal}から${newVal}に変更されました`;
}

function generateDetailedSystemChangeText(change) {
  if (change.type === 'addition') {
    return `${change.summary}しました`;
  }
  if (change.type === 'deletion') {
    return `${change.summary}しました`;
  }

  // 修正の場合 - detailsは ' | ' で区切られている
  const details = change.details.split(' | ');
  const systemInfo = `System ${change.systemId}（${change.systemName}）`;

  if (details.length === 1) {
    return `${systemInfo}の${details[0]}を変更しました`;
  } else {
    const detailText = details.join('、');
    return `${systemInfo}の以下を変更しました：${detailText}`;
  }
}

function saveProject() {
  const projectName = document.getElementById('common-name').value || '給湯計算プロジェクト';
  const rev = document.getElementById('proj-rev').value || 'Rev.0';
  const dateStr = new Date().toISOString().split('T')[0];

  const data = {
    version: '3.0',
    savedAt: new Date().toISOString(),
    common: {
      name:     projectName,
      pref:     document.getElementById('common-pref').value,
      tc:       document.getElementById('common-tc').value,
      k:        document.getElementById('common-k').value,
      facility: document.getElementById('common-facility').value,
      author:   document.getElementById('common-author').value,
      date:     document.getElementById('proj-date').value,
      rev:      document.getElementById('proj-rev').value,
      memo:     document.getElementById('common-memo').value,
      gasType:  document.querySelector('input[name="gas-type"]:checked')?.value || '13A'
    },
    revHistory: getRevHistory(),
    systems: state.systems
  };

  // パラメータ変更を検出
  console.log('saveProject: Starting parameter change detection');
  const allChanges = detectAllChanges();
  console.log('saveProject: allChanges =', allChanges);

  if (allChanges && (allChanges.basic.length > 0 || allChanges.systems.length > 0)) {
    console.log('saveProject: Changes detected, showing dialog');
    showParamChangeDialog(allChanges, data, projectName, rev, dateStr);
    return;
  }

  // 変更がない場合、そのままダウンロード
  console.log('saveProject: No changes detected, downloading file');
  doDownloadProject(data, projectName, rev, dateStr);

  // 現在のデータを localStorage に保存（次回比較用）
  console.log('saveProject: Saving current params to localStorage');
  localStorage.setItem('hwv3_last_project', JSON.stringify({
    lastParams: getCurrentParams(),
    lastSystemsJSON: getCurrentSystemsData()
  }));
}

function doDownloadProject(data, projectName, rev, dateStr) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `計算書_${projectName}_${dateStr}_${rev}.json`.replace(/[\/\\?*:|"<>]/g, '_');
  a.click();

  // 現在のデータを localStorage に保存（次回比較用）
  const savedState = {
    lastParams: getCurrentParams(),
    lastSystemsJSON: getCurrentSystemsData()
  };
  localStorage.setItem('hwv3_last_project', JSON.stringify(savedState));

  // 前回保存時の状態をメモリに保存
  lastSavedState = savedState;
}

function showParamChangeDialog(allChanges, data, projectName, rev, dateStr) {
  const {basic, systems} = allChanges;

  let changeListHtml = '';
  let changeNotes = [];

  // 基本条件の変更を表示（詳細テキスト版）
  if (basic && basic.length > 0) {
    changeListHtml += '<div style="margin-bottom:12px"><strong>基本条件の変更：</strong></div>';
    const basicTexts = basic.map(c => {
      const detailedText = generateDetailedChangeText(c.id, c.oldVal, c.newVal, c.label);
      return `<div style="margin:6px 0 6px 16px">${detailedText}</div>`;
    });
    changeListHtml += basicTexts.join('');
    changeNotes.push(...basic.map(c => generateDetailedChangeText(c.id, c.oldVal, c.newVal, c.label)));
  }

  // System の変更を表示（詳細テキスト版）
  if (systems && systems.length > 0) {
    changeListHtml += '<div style="margin:12px 0 0 0; margin-bottom:12px"><strong>システムの変更：</strong></div>';
    const systemTexts = systems.map(s => {
      const detailedText = generateDetailedSystemChangeText(s);
      return `<div style="margin:6px 0 6px 16px">${detailedText}</div>`;
    });
    changeListHtml += systemTexts.join('');
    changeNotes.push(...systems.map(s => generateDetailedSystemChangeText(s)));
  }

  // データをグローバル変数に保存
  paramChangeDialogData = {data, projectName, rev, dateStr, changeNotes: changeNotes.join('\n')};

  const dialogHtml = `
    <div id="param-change-modal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title">パラメータの変更を検出しました</div>
          <button class="modal-close" onclick="closeParamChangeDialog()">×</button>
        </div>
        <div class="modal-body">
          <p style="margin:0 0 12px 0">以下の項目が変更されています。変更履歴に追加して保存しますか？</p>
          <div style="background:#f5f5f5; padding:12px; border-radius:4px; max-height:300px; overflow-y:auto; border:1px solid var(--border)">
            ${changeListHtml}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeParamChangeDialog()">キャンセル</button>
          <button class="btn-primary" onclick="confirmParamChanges()">変更履歴に追加して保存</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', dialogHtml);

  // モーダルの背景クリックで閉じる
  document.getElementById('param-change-modal').addEventListener('click', e => {
    if (e.target.id === 'param-change-modal') closeParamChangeDialog();
  });
}

function closeParamChangeDialog() {
  const modal = document.getElementById('param-change-modal');
  if (modal) modal.remove();
  paramChangeDialogData = null;
}

// ===== 計算書出力時の未保存ダイアログ =====
function showUnsavedChangesDialog() {
  const allChanges = detectAllChanges();
  const {basic, systems} = allChanges;

  let changeListHtml = '';

  // 基本条件の変更を表示
  if (basic && basic.length > 0) {
    changeListHtml += '<div style="margin-bottom:12px"><strong>基本条件の変更：</strong></div>';
    const basicTexts = basic.map(c => {
      const detailedText = generateDetailedChangeText(c.id, c.oldVal, c.newVal, c.label);
      return `<div style="margin:6px 0 6px 16px">${detailedText}</div>`;
    });
    changeListHtml += basicTexts.join('');
  }

  // System の変更を表示
  if (systems && systems.length > 0) {
    changeListHtml += '<div style="margin:12px 0 0 0; margin-bottom:12px"><strong>システムの変更：</strong></div>';
    const systemTexts = systems.map(s => {
      const detailedText = generateDetailedSystemChangeText(s);
      return `<div style="margin:6px 0 6px 16px">${detailedText}</div>`;
    });
    changeListHtml += systemTexts.join('');
  }

  const dialogHtml = `
    <div id="unsaved-modal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title">⚠️ 保存されていない変更があります</div>
          <button class="modal-close" onclick="closeUnsavedDialog()">×</button>
        </div>
        <div class="modal-body">
          <p style="margin:0 0 12px 0">以下の変更が検出されました：</p>
          <div style="background:#f5f5f5; padding:12px; border-radius:4px; max-height:300px; overflow-y:auto; border:1px solid var(--border)">
            ${changeListHtml}
          </div>
          <div style="background:#fff9e6; border-left: 3px solid #ffc107; padding: 12px; margin-top: 16px; border-radius: 4px; font-size: 12px; color: #333;">
            <strong>💡 どちらを選びますか？</strong><br>
            <strong>保存してから出力：</strong> 変更をプロジェクトに保存してから計算書を出力します。次回開いたときも変更が反映されます。<br>
            <strong>保存せずに出力：</strong> 変更を保存せずに計算書のみ出力します。計算書にはこれらの変更が反映されますが、プロジェクトファイルには保存されません。
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeUnsavedDialog()">キャンセル</button>
          <button class="btn-secondary" onclick="proceedWithoutSaving()">保存せずに出力</button>
          <button class="btn-primary" onclick="proceedWithSaving()">保存してから出力</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', dialogHtml);

  // モーダルの背景クリックで閉じる
  document.getElementById('unsaved-modal').addEventListener('click', e => {
    if (e.target.id === 'unsaved-modal') closeUnsavedDialog();
  });
}

function closeUnsavedDialog() {
  const modal = document.getElementById('unsaved-modal');
  if (modal) modal.remove();
}

function proceedWithoutSaving() {
  closeUnsavedDialog();
  generateReport();  // 変更を保存せずに計算書を出力
}

function proceedWithSaving() {
  closeUnsavedDialog();
  // プロジェクトを保存してから計算書を出力
  const projectName = document.getElementById('common-name').value || '給湯計算プロジェクト';
  const rev = document.getElementById('proj-rev').value || 'Rev.0';
  const dateStr = new Date().toISOString().split('T')[0];

  // データを構築
  const tc = parseFloat(document.getElementById('common-tc').value) || 8;
  const K = parseFloat(document.getElementById('common-k').value) || DEFAULT_K;

  const data = {
    version: '3.0',
    savedAt: new Date().toISOString(),
    common: {
      name: projectName,
      pref: document.getElementById('common-pref').value,
      tc: document.getElementById('common-tc').value,
      k: document.getElementById('common-k').value,
      facility: document.getElementById('common-facility').value,
      author: document.getElementById('common-author').value,
      date: document.getElementById('proj-date').value,
      rev: document.getElementById('proj-rev').value,
      memo: document.getElementById('common-memo').value,
      gasType: document.querySelector('input[name="gas-type"]:checked')?.value || '13A'
    },
    revHistory: getRevHistory(),
    systems: state.systems
  };

  // パラメータ変更を検出
  const allChanges = detectAllChanges();

  if (allChanges && (allChanges.basic.length > 0 || allChanges.systems.length > 0)) {
    // 変更内容を自動追加
    const today = new Date();
    const dateStr2 = `${today.getFullYear()}年${String(today.getMonth()+1).padStart(2,'0')}月${String(today.getDate()).padStart(2,'0')}日`;
    const tbody = document.getElementById('rev-history-tbody');
    const rows = tbody.querySelectorAll('tr');
    let nextRevNum = 0;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const lastRevInput = lastRow.querySelector('input');
      const lastRev = lastRevInput?.value || 'Rev.0';
      const match = lastRev.match(/\d+/);
      if (match) nextRevNum = parseInt(match[0]) + 1;
    }
    const nextRev = `Rev.${nextRevNum}`;

    const changeNotes = [];
    allChanges.basic.forEach(c => {
      changeNotes.push(generateDetailedChangeText(c.id, c.oldVal, c.newVal, c.label));
    });
    allChanges.systems.forEach(s => {
      changeNotes.push(generateDetailedSystemChangeText(s));
    });

    // 新しい行を追加
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${nextRev}" class="rev-cell-input" style="width:60px" readonly></td>
      <td><input type="text" value="${dateStr2}" class="rev-cell-input" style="width:120px"></td>
      <td><textarea class="change-note" placeholder="変更内容" style="width:100%; height:60px; padding:4px; font-family:inherit">${changeNotes.join('\n')}</textarea></td>
      <td><button onclick="this.closest('tr').remove()" class="del-btn">✕</button></td>`;
    tbody.appendChild(tr);

    // データを更新
    data.revHistory = getRevHistory();
    data.common.rev = nextRev;

    // ダウンロード
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `計算書_${projectName}_${dateStr}_${nextRev}.json`.replace(/[\/\\?*:|"<>]/g, '_');
    a.click();

    // 保存完了後、lastSavedStateを更新（以降はダイアログが出ない）
    lastSavedState = {
      lastParams: getCurrentParams(),
      lastSystemsJSON: getCurrentSystemsData()
    };
    localStorage.setItem('hwv3_last_project', JSON.stringify(lastSavedState));
  } else {
    // 変更がない場合もそのまま保存
    doDownloadProject(data, projectName, rev, dateStr);
  }

  // 保存完了後、計算書を出力
  generateReport();
}

function confirmParamChanges() {
  if (!paramChangeDialogData) {
    alert('エラー: データが見つかりません');
    return;
  }
  const {data, projectName, rev, dateStr, changeNotes} = paramChangeDialogData;

  // 新しい変更履歴行を自動追加
  const today = new Date();
  const dateStr2 = `${today.getFullYear()}年${String(today.getMonth()+1).padStart(2,'0')}月${String(today.getDate()).padStart(2,'0')}日`;

  const tbody = document.getElementById('rev-history-tbody');
  const rows = tbody.querySelectorAll('tr');
  let nextRevNum = 0;
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const lastRevInput = lastRow.querySelector('input');
    const lastRev = lastRevInput?.value || 'Rev.0';
    const match = lastRev.match(/\d+/);
    if (match) nextRevNum = parseInt(match[0]) + 1;
  }
  const nextRev = `Rev.${nextRevNum}`;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${nextRev}" class="rev-cell-input" style="width:60px" readonly></td>
    <td><input type="text" value="${dateStr2}" class="rev-cell-input" style="width:120px"></td>
    <td><textarea class="change-note" placeholder="変更内容" style="width:100%; height:60px; padding:4px; font-family:inherit">${changeNotes}</textarea></td>
    <td><button onclick="this.closest('tr').remove()" class="del-btn">✕</button></td>`;
  tbody.appendChild(tr);

  // 最新の基本条件でデータを更新
  const updatedProjectName = document.getElementById('common-name').value || '給湯計算プロジェクト';
  data.common = {
    name: updatedProjectName,
    pref: document.getElementById('common-pref').value,
    tc: document.getElementById('common-tc').value,
    k: document.getElementById('common-k').value,
    facility: document.getElementById('common-facility').value,
    author: document.getElementById('common-author').value,
    date: document.getElementById('proj-date').value,
    rev: nextRev,
    memo: document.getElementById('common-memo').value,
    gasType: document.querySelector('input[name="gas-type"]:checked')?.value || '13A'
  };
  data.revHistory = getRevHistory();

  // ダイアログを閉じてダウンロード（更新されたプロジェクト名と新しいRevで）
  closeParamChangeDialog();
  doDownloadProject(data, updatedProjectName, nextRev, dateStr);
}

function loadProject(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.common || !data.systems) throw new Error('フォーマット不正');
      const c = data.common;
      document.getElementById('common-name').value = c.name || '';
      if (c.pref) document.getElementById('common-pref').value = c.pref;
      document.getElementById('common-tc').value = c.tc || 8;
      document.getElementById('common-k').value = c.k || DEFAULT_K;
      if (c.facility) document.getElementById('common-facility').value = c.facility;
      document.getElementById('common-author').value = c.author || '';
      if (c.date) document.getElementById('proj-date').value = c.date;
      if (c.rev) document.getElementById('proj-rev').value = c.rev;
      if (c.memo) document.getElementById('common-memo').value = c.memo;
      if (c.gasType) {
        const r = document.querySelector(`input[name="gas-type"][value="${c.gasType}"]`);
        if (r) r.checked = true;
      }
      if (data.revHistory) loadRevHistory(data.revHistory);
      sysCounter = 0; fixtureCounter = 0;
      state.systems = data.systems || [];
      state.systems.forEach(s => { sysCounter = Math.max(sysCounter, s.id); if (!s.sliders) s.sliders = {}; });

      // 読込直後に全システムを計算
      const tc = parseFloat(c.tc) || 8;
      const K = parseFloat(c.k) || DEFAULT_K;
      state.systems.forEach(sys => {
        const ftype = sys.multiParams?.facilityType || 'hotel';
        if (sys.pat === 'pat4') sys.result = calcPat4(sys, tc, K);
        else if (sys.pat === 'pat3') sys.result = calcPat3(sys, tc, K, ftype);
        else sys.result = calcMulti(sys, tc, K);
      });

      // 現在のパラメータと System データを localStorage にキャッシュ（次回の変更検出用）
      localStorage.setItem('hwv3_last_project', JSON.stringify({
        lastParams: getCurrentParams(),
        lastSystemsJSON: getCurrentSystemsData()
      }));

      // 前回保存時の状態をメモリに保存
      lastSavedState = {
        lastParams: getCurrentParams(),
        lastSystemsJSON: getCurrentSystemsData()
      };

      showPage('systems');
    } catch(e) {
      alert('読込エラー: ' + e.message);
    }
  };
  reader.readAsText(file);
}

// ===== 変更履歴 =====
function addRevRow() {
  const tbody = document.getElementById('rev-history-tbody');
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${String(today.getMonth()+1).padStart(2,'0')}月${String(today.getDate()).padStart(2,'0')}日`;

  // 次のRev番号を自動生成
  let nextRevNum = 0;
  const rows = tbody.querySelectorAll('tr');
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const lastRevInput = lastRow.querySelector('input');
    const lastRev = lastRevInput?.value || 'Rev.0';
    const match = lastRev.match(/\d+/);
    if (match) nextRevNum = parseInt(match[0]) + 1;
  }
  const nextRev = `Rev.${nextRevNum}`;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${nextRev}" class="rev-cell-input" style="width:60px" readonly></td>
    <td><input type="text" value="${dateStr}" class="rev-cell-input" style="width:120px"></td>
    <td><textarea class="change-note" placeholder="変更内容" style="width:100%; height:60px; padding:4px; font-family:inherit"></textarea></td>
    <td><button onclick="this.closest('tr').remove()" class="del-btn">✕</button></td>`;
  tbody.appendChild(tr);
}

function loadRevHistory(history) {
  const tbody = document.getElementById('rev-history-tbody');
  tbody.innerHTML = '';
  history.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${row.rev}" class="rev-cell-input" style="width:60px" readonly></td>
      <td><input type="text" value="${row.date}" class="rev-cell-input" style="width:120px"></td>
      <td><textarea class="change-note" placeholder="変更内容" style="width:100%; height:60px; padding:4px; font-family:inherit">${row.note}</textarea></td>
      <td><button onclick="this.closest('tr').remove()" class="del-btn">✕</button></td>`;
    tbody.appendChild(tr);
  });
}

// ===== 会社情報設定 =====
function openCompanySettings() {
  const modal = document.getElementById('modal-company');
  modal.classList.remove('hidden');
  const co = getCompanyInfo();
  document.getElementById('co-name').value = co.name || '';
  document.getElementById('co-dept').value = co.dept || '';
  document.getElementById('co-address').value = co.address || '';
  document.getElementById('co-tel').value = co.tel || '';
  document.getElementById('co-fax').value = co.fax || '';
  if (co.logo) {
    document.getElementById('co-logo-preview').src = co.logo;
    document.getElementById('co-logo-preview').classList.remove('hidden');
  }
}

function saveCompanySettings() {
  const co = {
    name:    document.getElementById('co-name').value,
    dept:    document.getElementById('co-dept').value,
    address: document.getElementById('co-address').value,
    tel:     document.getElementById('co-tel').value,
    fax:     document.getElementById('co-fax').value,
    logo:    document.getElementById('co-logo-preview').src.startsWith('data:') ? document.getElementById('co-logo-preview').src : ''
  };
  localStorage.setItem('hwv3_company', JSON.stringify(co));
  document.getElementById('modal-company').classList.add('hidden');

  // 基本条件ページに遷移（showPage() 内で作成者欄が自動入力される）
  showPage('common');
}

function onLogoUpload(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('co-logo-preview').src = e.target.result;
    document.getElementById('co-logo-preview').classList.remove('hidden');
  };
  reader.readAsDataURL(input.files[0]);
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  initPrefSelect();
  initDate();
  showPage('top');
});
