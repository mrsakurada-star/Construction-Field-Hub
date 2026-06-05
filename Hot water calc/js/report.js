/* © 2026 Nozomi Sakurada. All rights reserved. */

const PAT_LABELS = {
  pat1:'直圧給湯方式', pat2:'給湯循環方式',
  pat3:'貯湯タンク方式', pat4:'ろ過昇温方式', multi:'業務用マルチ方式'
};

// ===== 施設種別カバーイラスト（PNG版） =====
function getCoverIllustration(facilityType) {
  const fileMap = {
    hotel: 'ホテル',
    bizhotel: 'ホテル',
    leisurehotel: 'ホテル',
    hospital: '病院',
    nursing: '介護施設',
    sports: 'スポーツ施設',
    school: '学校',
    factory: '工場',
    apartment: 'マンション',
    office: 'オフィスビル'
  };

  const filename = fileMap[facilityType] || 'ホテル';
  return encodeURI(`./media/${filename}.png`);
}

function generateReport() {
  const co = getCompanyInfo();
  const proj = getProjectInfo();
  const tc = parseFloat(document.getElementById('common-tc').value) || 8;
  const K = parseFloat(document.getElementById('common-k').value) || DEFAULT_K;
  const memo = document.getElementById('common-memo')?.value?.trim() || '';
  let rev = document.getElementById('proj-rev')?.value?.trim() || 'Rev.0';
  const revHistory = getRevHistory();

  // 現在の変更内容を検出（計算書出力時）
  const currentChanges = detectAllChanges();

  // 未保存の変更がある場合、表紙のRevを次のバージョンに更新
  if (currentChanges && (currentChanges.basic.length > 0 || currentChanges.systems.length > 0)) {
    const match = rev.match(/\d+/);
    const nextRevNum = match ? parseInt(match[0]) + 1 : 0;
    rev = `Rev.${nextRevNum}`;
  }

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
    <div class="cover-bg-illustration" aria-hidden="true" style="background-image: url('${coverIllustration}');"></div>

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

  </div>`;

  // ===== 変更履歴ページ =====
  // 未保存の変更を反映したバージョン履歴を生成
  let revHistoryWithCurrent = [...revHistory];
  if (currentChanges && (currentChanges.basic.length > 0 || currentChanges.systems.length > 0)) {
    // 次のRev番号を計算
    const match = rev.match(/\d+/);
    const nextRevNum = match ? parseInt(match[0]) : 0;
    const nextRev = `Rev.${nextRevNum}`;

    // 現在の日付
    const today = new Date();
    const dateStr = `${today.getFullYear()}年${String(today.getMonth()+1).padStart(2,'0')}月${String(today.getDate()).padStart(2,'0')}日`;

    // 変更内容を自動生成
    const changeNotes = [];
    currentChanges.basic.forEach(c => {
      changeNotes.push(generateDetailedChangeText(c.id, c.oldVal, c.newVal, c.label));
    });
    currentChanges.systems.forEach(s => {
      changeNotes.push(generateDetailedSystemChangeText(s));
    });

    revHistoryWithCurrent.push({
      rev: nextRev,
      date: dateStr,
      note: changeNotes.join('\n')
    });
  }

  html += `<div class="report-page page-break">
    <h2 class="report-section-title">変更履歴</h2>

    <div style="margin-bottom: 24px;">
      <h3 class="report-sub-title">バージョン履歴</h3>
      <table class="data-table">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="width: 80px;">Rev.</th>
            <th style="width: 120px;">年月日</th>
            <th>変更内容</th>
          </tr>
        </thead>
        <tbody>
          ${revHistoryWithCurrent.map((r, idx) => `
          <tr>
            <td style="text-align: center; font-weight: 600;">${r.rev}</td>
            <td style="text-align: center;">${r.date}</td>
            <td style="white-space: pre-wrap; word-wrap: break-word;">${r.note}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  // ===== 目次 + 共通条件 =====
  html += `<div class="report-page page-break">
    <h2 class="report-section-title">目 次</h2>
    <ol class="toc-list">
      <li>0. 変更履歴</li>
      <li>1. 共通計算条件</li>
      ${memo ? '<li>2. 特記事項・前提条件</li>' : ''}
      ${state.systems.map((sys, i) => `<li>${memo ? i + 3 : i + 2}. 系統別計算：${sys.name}　<span class="toc-pat">${PAT_LABELS[sys.pat] || sys.pat}</span></li>`).join('')}
      <li>${memo ? state.systems.length + 4 : state.systems.length + 3}. 使用機器仕様一覧</li>
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

  // ===== 特記事項（共通条件の直後） =====
  if (memo) {
    html += `<div class="report-page page-break">
      <h2 class="report-section-title">2. 特記事項・前提条件</h2>
      <div class="memo-block">${memo.replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  // ===== 系統別計算 =====
  state.systems.forEach((sys, i) => {
    const r = sys.result;
    if (!r) return;
    const sysNo = (memo ? 3 : 2) + i;

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
  const equipmentSectionNo = state.systems.length + (memo ? 3 : 2);
  html += buildEquipmentTable(state.systems, totalKw, fmt, equipmentSectionNo);

  // ===== 署名・捺印欄 =====
  const companyInfoLines = [];
  if (co.name) companyInfoLines.push(co.name);
  if (co.dept) companyInfoLines.push(co.dept);
  if (co.address) companyInfoLines.push(co.address);
  if (co.tel) companyInfoLines.push(`TEL: ${co.tel}`);
  if (co.fax) companyInfoLines.push(`FAX: ${co.fax}`);
  if (proj.author) companyInfoLines.push(proj.author);
  const companyInfoText = companyInfoLines.length > 0 ? companyInfoLines.join('<br>') : '―';

  html += `<div class="signature-block no-page-break">
    <div class="signature-grid">
      <div class="signature-cell">
        <div class="sig-label">作 成 者</div>
        <div class="sig-text">${companyInfoText}</div>
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

// ===== PDF ダウンロード =====
function downloadReportPDF() {
  const proj = getProjectInfo();
  const rev = document.getElementById('proj-rev')?.value?.trim() || 'Rev.0';

  const projectName = proj.name || '給湯計算書';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `給湯計算書_${projectName}_${dateStr}_${rev}`.replace(/[\/\\?*:|"<>]/g, '_');

  // ページタイトルを一時的に変更してブラウザの印刷ダイアログでいいファイル名を提案
  const originalTitle = document.title;
  document.title = filename;

  // 印刷ダイアログを開く
  window.print();

  // 印刷ダイアログを閉じた後、タイトルを戻す
  setTimeout(() => {
    document.title = originalTitle;
  }, 500);
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
function buildEquipmentTable(systems, totalKw, fmt, sectionNo) {
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
    <h2 class="report-section-title">${sectionNo}. 使用機器仕様一覧</h2>
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
  let author = document.getElementById('common-author')?.value || '';

  // 作成者欄が空の場合、会社情報から自動生成
  if (!author.trim()) {
    const co = getCompanyInfo();
    if (co.name) {
      author = co.dept ? `${co.name}　${co.dept}` : co.name;
    }
  }

  return {
    name:   document.getElementById('common-name')?.value || '',
    pref:   document.getElementById('common-pref')?.value || '',
    date:   document.getElementById('proj-date')?.value || '',
    author: author
  };
}

// ----- ヘルパー：Rev履歴取得 -----
function getRevHistory() {
  const rows = document.querySelectorAll('#rev-history-tbody tr');
  const result = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('td input');
    const textarea = row.querySelector('td textarea');
    if (inputs.length >= 2 && textarea) {
      result.push({rev:inputs[0].value, date:inputs[1].value, note:textarea.value});
    }
  });
  return result;
}
