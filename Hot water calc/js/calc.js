/* © 2026 Nozomi Sakurada. All rights reserved. */

// ===== 同時使用率補間取得 =====
function getPurposeUsageRate(facilityKey, qty) {
  const t = PURPOSE_USAGE_RATE[facilityKey];
  if (!t) return 100;
  const vals = t.vals;
  if (qty <= vals[0][0]) return vals[0][1];
  if (qty >= vals[vals.length - 1][0]) return t.cap;
  for (let i = 0; i < vals.length - 1; i++) {
    if (qty >= vals[i][0] && qty <= vals[i + 1][0]) {
      const ratio = (qty - vals[i][0]) / (vals[i + 1][0] - vals[i][0]);
      const rate = vals[i][1] + (vals[i + 1][1] - vals[i][1]) * ratio;
      return Math.round(rate);
    }
  }
  return t.cap;
}

// ===== 膨張係数S 線形補間 =====
function getExpansionS(th) {
  if (th <= EXPANSION_S[0].t) return EXPANSION_S[0].s;
  if (th >= EXPANSION_S[EXPANSION_S.length - 1].t) return EXPANSION_S[EXPANSION_S.length - 1].s;
  for (let i = 0; i < EXPANSION_S.length - 1; i++) {
    if (th >= EXPANSION_S[i].t && th <= EXPANSION_S[i + 1].t) {
      const r = (th - EXPANSION_S[i].t) / (EXPANSION_S[i + 1].t - EXPANSION_S[i].t);
      return EXPANSION_S[i].s + (EXPANSION_S[i + 1].s - EXPANSION_S[i].s) * r;
    }
  }
  return EXPANSION_S[EXPANSION_S.length - 1].s;
}

// ===== 水道直結可否判定 =====
function getWaterDirectConnection(pat) {
  if (pat === 'pat1') return {status:'ok',   label:'直結可',   message:'瞬間式単管は通常水道直結可能です。'};
  if (pat === 'pat2') return {status:'warn', label:'要確認',   message:'給湯循環は所轄水道局に要問い合わせ。'};
  if (pat === 'pat3') return {status:'warn', label:'要確認',   message:'貯湯タンク循環は所轄水道局に要問い合わせ。'};
  if (pat === 'pat4') return {status:'warn', label:'要確認',   message:'ろ過昇温は所轄水道局に要問い合わせ。'};
  if (pat === 'multi')return {status:'ng',   label:'原則不可', message:'複数台マルチは原則不可。PU-6等ポンプユニットの使用を検討してください。'};
  return {status:'warn', label:'不明', message:'水道直結可否を確認してください。'};
}

// ===== 配管口径選定 =====
function getPipeSize(units) {
  for (const row of PIPE_SIZE_TABLE) {
    if (units <= row.maxUnits) return row;
  }
  return PIPE_SIZE_TABLE[PIPE_SIZE_TABLE.length - 1];
}

// ===== 膨張タンク計算 =====
function calcExpansionTank(vsysPipe, th, finalUnits, unitInternalVol) {
  const vmachine = finalUnits * (unitInternalVol || 4.0);
  const vsysTotal = vsysPipe + vmachine;
  const S = getExpansionS(th);
  const vexp = vsysTotal * S;
  const recommended = EXPANSION_TANK_STEPS.find(s => s >= Math.ceil(vexp)) || EXPANSION_TANK_STEPS[EXPANSION_TANK_STEPS.length - 1];
  return {vsysPipe, vmachine, vsysTotal, S, vexp, recommended, th};
}

// ===== Pat1/2/Multi 計算（業務用マルチ A/B方式） =====
function calcMulti(sys, tc, K) {
  const mp = sys.multiParams;
  const ftype = mp.facilityType;
  const unitcap = sys.unitcap;
  const sliders = sys.sliders || {};

  const groups = [];

  if (mp.shower.enabled && mp.shower.qty > 0) {
    const autoU = getPurposeUsageRate(ftype, mp.shower.qty) / 100;
    const u = (sliders.shower != null) ? sliders.shower / 100 : autoU;
    const gosu = mp.shower.qty * MULTI_FIXTURE.shower.gosu * u;
    groups.push({
      key:'shower', label:MULTI_FIXTURE.shower.label,
      qty:mp.shower.qty, gosuEach:MULTI_FIXTURE.shower.gosu,
      u, autoU, isManual:(sliders.shower != null), gosu
    });
  }
  if (mp.wash.enabled && mp.wash.qty > 0) {
    const autoU = getPurposeUsageRate(ftype, mp.wash.qty) / 100;
    const u = (sliders.wash != null) ? sliders.wash / 100 : autoU;
    const gosu = mp.wash.qty * MULTI_FIXTURE.wash.gosu * u;
    groups.push({
      key:'wash', label:MULTI_FIXTURE.wash.label,
      qty:mp.wash.qty, gosuEach:MULTI_FIXTURE.wash.gosu,
      u, autoU, isManual:(sliders.wash != null), gosu
    });
  }
  if (mp.kitchen.enabled && mp.kitchen.qty > 0) {
    const autoU = getPurposeUsageRate(ftype, mp.kitchen.qty) / 100;
    const u = (sliders.kitchen != null) ? sliders.kitchen / 100 : autoU;
    const gosu = mp.kitchen.qty * MULTI_FIXTURE.kitchen.gosu * u;
    groups.push({
      key:'kitchen', label:MULTI_FIXTURE.kitchen.label,
      qty:mp.kitchen.qty, gosuEach:MULTI_FIXTURE.kitchen.gosu,
      u, autoU, isManual:(sliders.kitchen != null), gosu
    });
  }

  const sumGosuA = groups.reduce((s, g) => s + g.gosu, 0);
  let gosuA = sumGosuA * K;

  let QcircKw = 0, QcircGosu = 0;
  if (sys.pat === 'pat2') {
    QcircKw = sys.p23params.pipelen * sys.p23params.losscoef / 1000;
    QcircGosu = QcircKw * 860 / 60 / 25;
    gosuA += QcircGosu;
  }
  const unitsA = Math.ceil(gosuA / unitcap);

  let bathResult = null, unitsB = 0, gosuB = 0;
  if (mp.bath.enabled) {
    const bathTemp = mp.bath.outdoor ? MULTI_FIXTURE.bath.tempOutdoor : MULTI_FIXTURE.bath.tempOut;
    const flowBath = mp.bath.vol / mp.bath.fillMin;
    const gosuBath = flowBath * (bathTemp - tc) / 25;
    gosuB = gosuBath * K;
    if (sys.pat === 'pat2') gosuB += QcircGosu;
    unitsB = Math.ceil(gosuB / unitcap);
    bathResult = {vol:mp.bath.vol, fillMin:mp.bath.fillMin, outdoor:mp.bath.outdoor, bathTemp, flowBath, gosuBath, gosuB, unitsB};
  }

  const finalUnits = Math.max(unitsA, unitsB);
  const pipeInfo = getPipeSize(finalUnits);
  const waterDirect = getWaterDirectConnection(sys.pat === 'pat2' ? 'pat2' : 'multi');
  const totalGosuEquiv = Math.max(gosuA, gosuB);
  const gasKw70Alert = (totalGosuEquiv * 60 * 25 / 860) >= GAS_70KW_THRESHOLD;

  const facilityLabel = FACILITY_LABELS[ftype] || ftype;
  const src = PURPOSE_USAGE_RATE[ftype]?.src || '';

  return {
    isMulti:true, pat:'multi', lineName:sys.name,
    groups, sumGosuA, gosuA, unitsA,
    bathResult, unitsB, gosuB,
    finalUnits, unitcap,
    pipeInfo, ftype, facilityLabel, src,
    tc, K, waterDirect, gasKw70Alert,
    QcircKw, QcircGosu
  };
}

// ===== Pat3 計算（貯湯タンク方式） =====
function calcPat3(sys, tc, K, facilityType) {
  const th = sys.th;
  const unitcap = sys.unitcap;
  const fkey = facilityType || 'hotel';
  const peakHours = PEAK_CONTINUATION_HOURS[fkey] || PEAK_CONTINUATION_HOURS.default;
  const sliders = sys.sliders || {};

  const rows = sys.fixtures.map(f => ({...f, hq:f.hqTank, nHq:f.qty * f.hqTank, design:f.qty * f.hqTank}));
  const totalQty = sys.fixtures.reduce((s, f) => s + f.qty, 0);
  const totalHourlyVol = rows.reduce((s, r) => s + r.nHq, 0);

  const autoU_percent = getPurposeUsageRate(fkey, totalQty);
  const U_percent = (sliders.pat3 != null) ? sliders.pat3 : autoU_percent;
  const isManualU = sliders.pat3 != null;
  const U = U_percent / 100;

  const peakHourlyDemand = totalHourlyVol * U;
  const H_base = 0.00116 * K * peakHourlyDemand * (th - tc);
  const Qcirc = sys.p23params.pipelen * sys.p23params.losscoef / 1000;
  const H_total = H_base + Qcirc;
  const reqGo = H_total * 860 / 60 / 25;
  const heatUnits = Math.ceil(reqGo / unitcap);
  const finalUnits = heatUnits;
  const pipeInfo = getPipeSize(finalUnits);
  const tankControl = {pumpOn: th - 15, pumpOff: th - 10};
  const waterDirect = getWaterDirectConnection('pat3');
  const gasKw70Alert = H_total >= GAS_70KW_THRESHOLD;
  const reqTankVol = peakHourlyDemand * peakHours;
  const src = PURPOSE_USAGE_RATE[fkey]?.src || '建備付録';

  return {
    isPat3:true, pat:'pat3', lineName:sys.name,
    rows, totalHourlyVol, peakHourlyDemand,
    U, U_percent, autoU_percent, isManualU,
    totalQty, peakHours,
    H_base, Qcirc, H_total, reqGo, heatUnits, finalUnits, unitcap,
    reqTankVol, totalQhm:peakHourlyDemand,
    tc, th, K, p23:sys.p23params,
    pipeInfo, tankControl, waterDirect, gasKw70Alert,
    facilityType:fkey, src
  };
}

// ===== Pat4 計算（ろ過昇温方式） =====
function calcPat4(sys, tc, K) {
  const th = sys.th;
  const unitcap = sys.unitcap;
  const p = sys.p4params;

  const totalBathVol = p.vol * p.qty * 1000;
  const Q_filter = totalBathVol * p.nfilter / 60;
  const Q_hex = Q_filter * p.dt2 * 4.186 / 60;
  const Q_fill = (totalBathVol * (p.tset - tc) * 4.186) / (p.tfill * 3600);
  const Q_primary = Q_hex * 860 / (p.dt1 * 60);
  const Q_design = p.useQfill ? Math.max(Q_hex, Q_fill) * K : Q_hex * K;
  const reqGo = Q_design * 860 / 60 / 25;
  const heatUnits = Math.ceil(reqGo / unitcap);
  const finalUnits = Math.max(heatUnits, 1);
  const theorMaxFlow = (unitcap * 25 / (th - tc)) * finalUnits;
  const pipeInfo = getPipeSize(finalUnits);
  const waterDirect = getWaterDirectConnection('pat4');
  const gasKw70Alert = Q_design >= GAS_70KW_THRESHOLD;

  return {
    isPat4:true, pat:'pat4', lineName:sys.name,
    totalBathVol, Q_filter, Q_hex, Q_fill, Q_primary, Q_design,
    reqGo, heatUnits, finalUnits, unitcap,
    peakFlowMin:Q_primary, theorMaxFlow,
    tc, th, K, p, pipeInfo, waterDirect, gasKw70Alert
  };
}
