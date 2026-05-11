/* © 2026 Nozomi Sakurada. All rights reserved. */

const PAT_LABELS = {
  pat1:'直圧給湯方式', pat2:'給湯循環方式',
  pat3:'貯湯タンク方式', pat4:'ろ過昇温方式', multi:'業務用マルチ方式'
};

// ===== 施設種別カバーイラスト =====
function getCoverIllustration(facilityType) {
  const A = 'fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const s = {
    hotel: `<svg viewBox="0 0 200 200" ${A}><circle cx="72" cy="100" r="52" stroke-width="12"/><circle cx="72" cy="100" r="18" stroke-width="8"/><line x1="124" y1="100" x2="190" y2="100" stroke-width="12"/><line x1="158" y1="100" x2="158" y2="126" stroke-width="10"/><line x1="178" y1="100" x2="178" y2="116" stroke-width="10"/></svg>`,
    bizhotel: `<svg viewBox="0 0 200 200" ${A}><rect x="72" y="12" width="56" height="58" rx="4" stroke-width="12"/><rect x="50" y="66" width="100" height="54" rx="4" stroke-width="12"/><rect x="22" y="116" width="156" height="72" rx="4" stroke-width="12"/><line x1="100" y1="12" x2="100" y2="2" stroke-width="8"/></svg>`,
    hospital: `<svg viewBox="0 0 200 200" ${A}><path d="M78 10 H122 V78 H190 V122 H122 V190 H78 V122 H10 V78 H78 Z" stroke-width="10" stroke-linejoin="round"/></svg>`,
    nursing: `<svg viewBox="0 0 200 200" ${A}><path d="M100 170 C55 145 5 105 5 62 C5 28 32 5 62 5 C78 5 92 14 100 25 C108 14 122 5 138 5 C168 5 195 28 195 62 C195 105 145 145 100 170 Z" stroke-width="12"/></svg>`,
    sports: `<svg viewBox="0 0 200 200" ${A}><circle cx="138" cy="28" r="20" stroke-width="10"/><line x1="130" y1="48" x2="88" y2="118" stroke-width="14"/><line x1="118" y1="72" x2="65" y2="95" stroke-width="12"/><line x1="120" y1="68" x2="155" y2="42" stroke-width="12"/><line x1="88" y1="118" x2="42" y2="178" stroke-width="14"/><path d="M88 118 Q130 148 155 140" stroke-width="14"/></svg>`,
    school: `<svg viewBox="0 0 200 200" ${A}><line x1="100" y1="28" x2="100" y2="172" stroke-width="10"/><line x1="100" y1="28" x2="15" y2="52" stroke-width="10"/><line x1="15" y1="52" x2="15" y2="162" stroke-width="10"/><line x1="15" y1="162" x2="100" y2="172" stroke-width="10"/><line x1="100" y1="28" x2="185" y2="52" stroke-width="10"/><line x1="185" y1="52" x2="185" y2="162" stroke-width="10"/><line x1="185" y1="162" x2="100" y2="172" stroke-width="10"/><line x1="26" y1="82" x2="90" y2="74" stroke-width="6" opacity="0.7"/><line x1="26" y1="102" x2="90" y2="96" stroke-width="6" opacity="0.7"/><line x1="26" y1="122" x2="90" y2="118" stroke-width="6" opacity="0.7"/><line x1="110" y1="74" x2="174" y2="82" stroke-width="6" opacity="0.7"/><line x1="110" y1="96" x2="174" y2="102" stroke-width="6" opacity="0.7"/><line x1="110" y1="118" x2="174" y2="122" stroke-width="6" opacity="0.7"/></svg>`,
    factory: `<svg viewBox="0 0 200 200" ${A}><rect x="18" y="128" width="164" height="64" rx="4" stroke-width="10"/><rect x="32" y="55" width="26" height="76" rx="3" stroke-width="10"/><rect x="87" y="68" width="26" height="63" rx="3" stroke-width="10"/><rect x="142" y="80" width="26" height="51" rx="3" stroke-width="10"/><path d="M35 48 Q45 30 58 48" stroke-width="7" stroke-dasharray="6 5"/><path d="M90 62 Q100 44 113 62" stroke-width="7" stroke-dasharray="6 5"/><path d="M145 74 Q155 56 168 74" stroke-width="7" stroke-dasharray="6 5"/></svg>`,
    apartment: `<svg viewBox="0 0 200 200" ${A}><polyline points="100,12 188,86 12,86" stroke-width="12" stroke-linejoin="round"/><rect x="18" y="82" width="164" height="110" rx="4" stroke-width="12"/><rect x="30" y="96" width="40" height="34" rx="3" stroke-width="9"/><rect x="130" y="96" width="40" height="34" rx="3" stroke-width="9"/><rect x="30" y="142" width="40" height="34" rx="3" stroke-width="9"/><rect x="130" y="142" width="40" height="34" rx="3" stroke-width="9"/><rect x="82" y="150" width="36" height="42" rx="6" stroke-width="9"/></svg>`,
    office: `<svg viewBox="0 0 200 200" ${A}><rect x="14" y="72" width="172" height="118" rx="10" stroke-width="12"/><path d="M68 72 C68 36 132 36 132 72" stroke-width="12"/><rect x="84" y="122" width="32" height="22" rx="4" stroke-width="9"/><line x1="14" y1="118" x2="186" y2="118" stroke-width="8" opacity="0.7"/></svg>`
  };
  const alias = { leisurehotel: 'hotel' };
  return s[alias[facilityType] || facilityType] || s.office;
}

function generateReport() {
  const co = getCompanyInfo();
  const proj = getProjectInfo();
  const tc = parseFloat(document.getElementById('common-tc').value) || 8;
  const K = parseFloat(document.getElementById('common-k').value) || DEFAULT_K;
  const memo = document.getElementById('common-memo')?.value?.trim() || '';
  const rev = document.getElementById('proj-rev')?.value?.trim() || 'Rev.0';
  const revHistory = getRevHistory();

  state.systems.forEach(sys => {
    if (!sys.result) {
      const ftype = sys.multiParams?.facilityType || 'hotel';
      if (sys.pat === 'pat4') sys.result = calcPat4(sys, tc, K);
      else if (sys.pat === 'pat3') sys.result = calcPat3(sys, tc, K, ftype);
      else sys.result = calcMulti(sys, tc, K);
    }
  });

  const totalKw = state.systems.reduce((s, sys) => {
    const r = sys.result;
    return s + (r && !r.isMulti ? (r.isPat4 ? r.Q_design : r.H_total) : 0);
  }, 0);

  const fmt = v => Math.round(v).toLocaleString();
  const logoSrc = co.logo || '';
  const facilityType = document.getElementById('common-facility')?.value || 'hotel';
  const coverIllustration = getCoverIllustration(facilityType);

  // ===== 表紙 =====
  let html = `<div class="report-page cover-page">
    <div class="cover-bg-illustration" aria-hidden="true">${coverIllustration}</div>

    <div class="cover-topbar">
      <span class="cover-topbar-co">${co.name || '―'}</span>
      <span class="cover-topbar-tag">HOT WATER CALCULATION</span>
    </div>

    <div class="cover-main">
      <div class="cover-en-lines">
        <span>HOT WATER</span>
        <span>CAPACITY</span>
        <span>CALCULATION</span>
        <span>REPORT</span>
      </div>
      <h1 class="cover-title-jp">給湯能力<br>計算書</h1>
    </div>

    <div class="cover-rule"></div>

    <div class="cover-project">
      <div class="cover-project-main">
        <div class="cover-project-name">${proj.name || '（施設名称未入力）'}</div>
        <div class="cover-project-detail">
          <span>${proj.pref || '―'}</span>
          <span>${proj.date || '―'}</span>
          <span>${proj.author || '―'}</span>
        </div>
      </div>
      <div class="cover-rev-display">${rev}</div>
    </div>

    <div class="cover-footer">
      ${logoSrc ? `<img src="${logoSrc}" alt="logo" class="cover-footer-logo">` : ''}
      <div class="cover-footer-info">
        <div class="cover-footer-name">${co.name || '―'}</div>
        ${co.dept ? `<div class="cover-footer-dept">${co.dept}</div>` : ''}
      </div>
    </div>

    ${revHistory.length > 0 ? `
    <div class="cover-rev-table-wrap">
      <table class="cover-rev-table">
        <thead><tr><th>Rev.</th><th>年月日</th><th>変更内容</th></tr></thead>
        <tbody>${revHistory.map(r => `<tr><td>${r.rev}</td><td>${r.date}</td><td>${r.note}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : ''}
  </div>`;

  // ===== 目次 + 共通条件 =====
  html += `<div class="report-page page-break">
    <h2 class="report-section-title">目 次</h2>
    <ol class="toc-list">
      <li>共通計算条件</li>
      ${state.systems.map((sys, i) => `<li>系統別計算：${sys.name}　<span class="toc-pat">${PAT_LABELS[sys.pat] || sys.pat}</span></li>`).join('')}
      <li>使用機器仕様一覧</li>
      ${memo ? '<li>特記事項</li>' : ''}
    </ol>

    <div class="section-block" style="margin-top:24px">
      <h3 class="report-sub-title">1. 共通計算条件</h3>
      <table class="data-table compact-table">
        <tbody>
          <tr><th>所在地</th><td>${proj.pref || '―'}</td><th>給水温度（冬期）</th><td><strong>${tc} ℃</strong></td></tr>
          <tr><th>施設種別</th><td>${FACILITY_LABELS[document.getElementById('common-facility')?.value] || '―'}</td><th>余裕係数 K</th><td><strong>${K}</strong></td></tr>
          <tr><th>ガス種別</th><td colspan="3">${document.querySelector('input[name="gas-type"]:checked')?.value || '―'}</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;

  // ===== 系統別計算 =====
  state.systems.forEach((sys, i) => {
    const r = sys.result;
    if (!r) return;
    const sysNo = i + 2;

    html += `<div class="report-page page-break">
      <h2 class="report-section-title">${sysNo}. 系統別計算：${sys.name}</h2>
      <div class="report-pat-badge">${PAT_LABELS[sys.pat] || sys.pat}　給湯温度 ${sys.th}℃</div>`;

    if (r.pat !== 'pat1' && sys.th <= 60) {
      html += `<div class="report-warning">
        <strong>【重要】レジオネラ属菌に関する注意喚起</strong><br>
        貯湯・循環ラインの維持温度が60℃以下の場合、レジオネラ属菌が増殖する恐れがあります。設定温度を60℃超へ引き上げるか、定期的な昇温殺菌等の対策を強く推奨します。
      </div>`;
    }

    if (r.isMulti) {
      html += buildMultiReport(r, sys, K);
    } else if (r.isPat3) {
      html += buildPat3Report(r, sys, fmt);
    } else if (r.isPat4) {
      html += buildPat4Report(r, sys);
    }

    if (r.waterDirect) {
      const badge = {ok:'badge-ok', warn:'badge-warn', ng:'badge-ng'}[r.waterDirect.status] || 'badge-warn';
      html += `<div class="report-info-row"><span class="badge ${badge}">水道直結 ${r.waterDirect.label}</span><span>${r.waterDirect.message}</span></div>`;
    }
    if (r.gasKw70Alert) {
      html += `<div class="report-alert">⚠ ガス消費量70kW以上 — 火災予防条例に基づく届出が必要です（所轄消防署に要確認）</div>`;
    }

    html += `</div>`;
  });

  // ===== 機器仕様表 =====
  html += buildEquipmentTable(state.systems, totalKw, fmt);

  // ===== 特記事項 =====
  if (memo) {
    html += `<div class="report-page page-break">
      <h2 class="report-section-title">特記事項・前提条件</h2>
      <div class="memo-block">${memo.replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  // ===== 署名・捺印欄 =====
  html += `<div class="signature-block no-page-break">
    <div class="signature-grid">
      <div class="signature-cell">
        <div class="sig-label">作 成 者</div>
        <div class="sig-space"></div>
        <div class="sig-stamp">(印)</div>
      </div>
      <div class="signature-cell">
        <div class="sig-label">確 認 者</div>
        <div class="sig-space"></div>
        <div class="sig-stamp">(印)</div>
      </div>
    </div>
    <div class="report-footer-note">本計算書は給湯能力計算システム v3 により作成。実際の機器選定・導入にあたっては専門の設備設計者・施工業者の確認を受けてください。</div>
  </div>`;

  document.getElementById('report-content').innerHTML = html;
}

// ----- 業務用マルチ レポート -----
function buildMultiReport(r, sys, K) {
  let html = `<div class="report-note">パーパス基準適用 / 施設タイプ: ${r.facilityLabel} / 余裕係数 K=${r.K}　（根拠: ${r.src}）</div>`;

  html += `<table class="data-table">
    <thead><tr><th>器具グループ</th><th>台数</th><th>基準号数/台</th><th>同時使用率</th><th>必要号数</th></tr></thead>
    <tbody>
      ${r.groups.map(g => `<tr>
        <td>${g.label}</td>
        <td class="num">${g.qty} 台</td>
        <td class="num">${g.gosuEach} 号</td>
        <td class="num">${(g.u * 100).toFixed(0)}%${g.isManual ? ' <span class="manual-badge">手動</span>' : ''}</td>
        <td class="num bold">${g.gosu.toFixed(1)} 号</td>
      </tr>`).join('')}
      <tr class="subtotal-row">
        <td colspan="4">一般器具合計 × 余裕係数 K = ${r.sumGosuA.toFixed(1)} × ${r.K}</td>
        <td class="num bold">${r.gosuA.toFixed(1)} 号 → ${r.unitsA} 台（A）</td>
      </tr>
      ${r.bathResult ? `<tr>
        <td>${MULTI_FIXTURE.bath.label}</td>
        <td class="num">浴槽 ${r.bathResult.vol}L / ${r.bathResult.fillMin}分</td>
        <td class="num">(${r.bathResult.bathTemp}℃ 屋${r.bathResult.outdoor ? '外' : '内'})</td>
        <td class="num">—</td>
        <td class="num bold">${r.bathResult.gosuBath.toFixed(1)} × ${r.K} = ${r.bathResult.gosuB.toFixed(1)} 号 → ${r.bathResult.unitsB} 台（B）</td>
      </tr>` : ''}
    </tbody>
  </table>`;

  const manualGroups = r.groups.filter(g => g.isManual);
  if (manualGroups.length > 0) {
    html += `<div class="report-note manual-note">※ 同時使用率について — ${manualGroups.map(g => `${g.label}: 自動値 ${(g.autoU*100).toFixed(0)}% → 設計者判断により ${(g.u*100).toFixed(0)}% に変更`).join('、')}</div>`;
  }

  html += `<div class="calc-box">
    <div class="calc-title">【台数選定】</div>
    <p>STEP 1: 一般器具合計 × K = ${r.sumGosuA.toFixed(1)} × ${r.K} = <strong>${r.gosuA.toFixed(1)} 号</strong> → <strong>${r.unitsA} 台（A）</strong></p>
    ${r.bathResult ? `<p>STEP 2: 大浴場 × K = ${r.bathResult.gosuBath.toFixed(1)} × ${r.K} = <strong>${r.bathResult.gosuB.toFixed(1)} 号</strong> → <strong>${r.bathResult.unitsB} 台（B）</strong></p>` : ''}
    <p>STEP ${r.bathResult ? '3' : '2'}: MAX(A${r.bathResult ? ', B' : ''}) → <strong class="result-val">採用台数 ${r.finalUnits} 台</strong></p>
  </div>`;

  html += buildResultBox([
    {label:'必要号数（パーパス基準）', value:`${Math.ceil(Math.max(r.gosuA, r.unitsB * r.unitcap))} 号`},
    {label:'機器選定', value:`${r.unitcap}号機 × ${r.finalUnits} 台`},
    r.pipeInfo ? {label:'推奨配管口径', value:`給水 ${r.pipeInfo.kyusuiA} / 給湯往き ${r.pipeInfo.kyutoA}`} : null
  ].filter(Boolean));

  return html;
}

// ----- Pat3 レポート -----
function buildPat3Report(r, sys, fmt) {
  let html = `<table class="data-table">
    <thead><tr><th>ゾーン</th><th>器具名</th><th>数量</th><th>Hq（貯湯） [L/h]</th><th>器具小計 [L/h]</th></tr></thead>
    <tbody>
      ${r.rows.map(row => `<tr>
        <td>${ZONE_LABELS[row.zone] || row.zone}</td>
        <td>${row.name}</td>
        <td class="num">${row.qty}</td>
        <td class="num">${row.hq}</td>
        <td class="num bold">${fmt(row.nHq)}</td>
      </tr>`).join('')}
      <tr class="subtotal-row">
        <td colspan="4">合計 1時間消費量</td>
        <td class="num bold">${fmt(r.totalHourlyVol)} L/h</td>
      </tr>
    </tbody>
  </table>`;

  if (r.isManualU) {
    html += `<div class="report-note manual-note">※ 同時使用率について — 自動値 ${r.autoU_percent}% → 設計者判断により ${r.U_percent}% に変更</div>`;
  }

  html += `<div class="calc-box">
    <div class="calc-title">【ピークシフト・リカバリー詳細計算式】（根拠: ${r.src}）</div>
    <p><strong>▶ STEP 1　同時使用率 U の算出</strong></p>
    <p class="pl">器具総台数 = ${r.totalQty} 台　→　同時使用率 U = <strong>${Math.round(r.U * 100)} %</strong>${r.isManualU ? ' <span class="manual-badge">手動調整</span>' : ''}</p>
    <p><strong>▶ STEP 2　ピーク時 1時間需要量 D_peak の算出</strong></p>
    <p class="pl">D_peak = V_hourly × U = ${fmt(r.totalHourlyVol)} × ${r.U_percent}% = <strong>${fmt(r.peakHourlyDemand)} L/h</strong></p>
    <p><strong>▶ STEP 3　必要加熱能力 H_base の算出</strong></p>
    <p class="pl calc-formula">H_base = 0.00116 × K × D_peak × (th − tc)</p>
    <p class="pl">= 0.00116 × ${r.K} × ${fmt(r.peakHourlyDemand)} × (${r.th}℃ − ${r.tc}℃) = <strong>${r.H_base.toFixed(2)} kW</strong></p>
    ${r.Qcirc > 0 ? `
    <p><strong>▶ STEP 4　循環配管放熱ロス Qcirc</strong></p>
    <p class="pl">Qcirc = ${r.p23.pipelen} m × ${r.p23.losscoef} W/m ÷ 1000 = <strong>${r.Qcirc.toFixed(2)} kW</strong></p>` : ''}
    <p><strong>▶ STEP ${r.Qcirc > 0 ? '5' : '4'}　総必要リカバリー加熱能力 H_total</strong></p>
    <p class="pl">H_total = ${r.H_base.toFixed(2)} ${r.Qcirc > 0 ? `+ ${r.Qcirc.toFixed(2)}` : ''} = <strong>${r.H_total.toFixed(2)} kW　（${(r.H_total * 860).toLocaleString(undefined, {maximumFractionDigits:0})} kcal/h）</strong></p>
    <p><strong>▶ STEP ${r.Qcirc > 0 ? '6' : '5'}　機器選定</strong></p>
    <p class="pl">必要号数 = ${r.H_total.toFixed(2)} × 860 ÷ 60 ÷ 25 = <strong>${r.reqGo.toFixed(1)} 号</strong>　→　<strong>${r.unitcap}号機 × ${r.finalUnits} 台</strong></p>
    <div class="tank-note">
      <strong>▶ 推奨貯湯タンク容量</strong><br>
      V_tank = D_peak × ピーク継続時間 = ${fmt(r.peakHourlyDemand)} L/h × ${r.peakHours} h = <strong>${fmt(r.reqTankVol)} L 以上</strong>
    </div>
  </div>`;

  html += buildResultBox([
    {label:'必要リカバリー加熱能力', value:`${r.H_total.toFixed(1)} kW　（${(r.H_total*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h）`},
    {label:'機器選定', value:`${r.unitcap}号機 × ${r.finalUnits} 台`},
    {label:'推奨貯湯タンク容量', value:`${fmt(r.reqTankVol)} L 以上`},
    r.pipeInfo ? {label:'推奨配管口径', value:`給水 ${r.pipeInfo.kyusuiA} / 給湯往き ${r.pipeInfo.kyutoA}`} : null,
    {label:'ポンプ制御', value:`ON ${r.tankControl.pumpOn}℃ / OFF ${r.tankControl.pumpOff}℃`}
  ].filter(Boolean));

  return html;
}

// ----- Pat4 レポート -----
function buildPat4Report(r, sys) {
  const p = r.p;
  let html = `<div class="calc-box">
    <div class="calc-title">【ろ過昇温計算式】</div>
    <p>1. ろ過循環流量 Q_filter = ${r.totalBathVol.toLocaleString()} L × ${p.nfilter} 回/h ÷ 60 = <strong>${r.Q_filter.toFixed(1)} L/min</strong></p>
    <p>2. 維持能力 Q_hex = ${r.Q_filter.toFixed(1)} × ${p.dt2}℃ × 4.186 ÷ 60 = <strong>${r.Q_hex.toFixed(2)} kW</strong></p>
    ${p.useQfill ? `<p>3. 初期湯はり能力 Q_fill = (${r.totalBathVol.toLocaleString()}L × (${p.tset}℃ − ${r.tc}℃) × 4.186) ÷ (${p.tfill}h × 3600) = <strong>${r.Q_fill.toFixed(2)} kW</strong></p>
    <p>4. 設計能力 Q_design = max(Q_hex, Q_fill) × K = ${Math.max(r.Q_hex, r.Q_fill).toFixed(2)} × ${r.K} = <strong>${r.Q_design.toFixed(1)} kW</strong></p>` :
    `<p>3. 設計能力 Q_design = Q_hex × K = ${r.Q_hex.toFixed(2)} × ${r.K} = <strong>${r.Q_design.toFixed(1)} kW</strong></p>`}
    <p>${p.useQfill ? '5' : '4'}. 一次側流量 Q_primary = ${r.Q_hex.toFixed(2)} × 860 ÷ (${p.dt1}℃ × 60) = <strong>${r.Q_primary.toFixed(1)} L/min</strong></p>
    <p>${p.useQfill ? '6' : '5'}. 必要号数 = ${r.Q_design.toFixed(1)} × 860 ÷ 60 ÷ 25 = <strong>${r.reqGo.toFixed(1)} 号</strong>　→　<strong>${r.unitcap}号機 × ${r.finalUnits} 台</strong></p>
  </div>`;

  html += buildResultBox([
    {label:'設計熱源能力 Q_design', value:`${r.Q_design.toFixed(1)} kW　（${(r.Q_design*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h）`},
    {label:'機器選定', value:`${r.unitcap}号機 × ${r.finalUnits} 台`},
    r.pipeInfo ? {label:'推奨配管口径', value:`給水 ${r.pipeInfo.kyusuiA} / 給湯往き ${r.pipeInfo.kyutoA}`} : null
  ].filter(Boolean));

  return html;
}

// ----- 結果ボックス共通 -----
function buildResultBox(items) {
  return `<div class="result-box">
    ${items.map(it => `<div class="result-row">
      <span class="result-label">${it.label}</span>
      <span class="result-value">${it.value}</span>
    </div>`).join('')}
  </div>`;
}

// ----- 機器仕様表 -----
function buildEquipmentTable(systems, totalKw, fmt) {
  const rows = systems.filter(s => s.result).map((sys, i) => {
    const r = sys.result;
    const spec = UNIT_SPEC[sys.unitcap] || {};
    let capacity = '';
    if (r.isMulti) capacity = `${Math.ceil(Math.max(r.gosuA, r.unitsB * r.unitcap))} 号相当`;
    else capacity = `${(r.isPat4 ? r.Q_design : r.H_total).toFixed(1)} kW`;

    return `<tr>
      <td class="num">${i + 1}</td>
      <td>${sys.name}</td>
      <td>${PAT_LABELS[sys.pat] || sys.pat}</td>
      <td class="num">${sys.unitcap} 号</td>
      <td class="num">${r.finalUnits} 台</td>
      <td class="num">${r.pipeInfo ? r.pipeInfo.kyusuiA : '―'}</td>
      <td class="num">${spec.power ? spec.power + ' W' : '―'}</td>
      <td>${capacity}</td>
    </tr>`;
  });

  return `<div class="report-page page-break">
    <h2 class="report-section-title">使用機器仕様一覧</h2>
    <table class="data-table">
      <thead>
        <tr><th>No.</th><th>系統名</th><th>方式</th><th>号数</th><th>台数</th><th>接続管径</th><th>消費電力</th><th>熱源能力</th></tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    ${totalKw > 0 ? `
    <div class="total-box">
      <span class="total-label">熱源合計（マルチ除く）</span>
      <span class="total-value">${totalKw.toFixed(1)} kW　（${(totalKw*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h）</span>
    </div>` : ''}
    <div class="design-notes">
      <div class="notes-title">設計上の注意</div>
      <ul>
        <li>本計算書はピーク時同時使用率を想定したものであり、実運用の負荷変動により差異が生じる場合があります。</li>
        <li>ガス供給配管径および給水・給湯配管径については、別途管径計算により決定してください。</li>
        <li>ろ過昇温系統については、熱交換器の一次側流量および温度設定が適切であることを確認してください。</li>
        <li>実際の機器選定・導入にあたっては専門の設備設計者・施工業者の確認を受けてください。</li>
      </ul>
    </div>
  </div>`;
}

// ----- ヘルパー：会社情報取得 -----
function getCompanyInfo() {
  try { return JSON.parse(localStorage.getItem('hwv3_company') || '{}'); } catch(e) { return {}; }
}

// ----- ヘルパー：プロジェクト情報取得 -----
function getProjectInfo() {
  return {
    name:   document.getElementById('common-name')?.value || '',
    pref:   document.getElementById('common-pref')?.value || '',
    date:   document.getElementById('proj-date')?.value || '',
    author: document.getElementById('common-author')?.value || ''
  };
}

// ----- ヘルパー：Rev履歴取得 -----
function getRevHistory() {
  const rows = document.querySelectorAll('#rev-history-tbody tr');
  const result = [];
  rows.forEach(row => {
    const tds = row.querySelectorAll('td input, td textarea');
    if (tds.length >= 3) {
      result.push({rev:tds[0].value, date:tds[1].value, note:tds[2].value});
    }
  });
  return result;
}
