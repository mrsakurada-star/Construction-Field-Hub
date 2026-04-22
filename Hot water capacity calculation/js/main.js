/* © 2026 Nozomi Sakurada. All rights reserved. */
// ===================== データ定数 =====================
const PREFECTURE_TC_MAP={"北海道":3,"青森県":4,"岩手県":4,"秋田県":4,"宮城県":5,"山形県":5,"福島県":5,"茨城県":7,"栃木県":7,"群馬県":7,"埼玉県":8,"千葉県":8,"東京都":8,"神奈川県":8,"新潟県":9,"長野県":9,"山梨県":9,"静岡県":9,"富山県":9,"石川県":9,"福井県":9,"愛知県":10,"岐阜県":10,"三重県":10,"大阪府":11,"京都府":11,"兵庫県":11,"奈良県":11,"滋賀県":11,"和歌山県":11,"鳥取県":11,"島根県":11,"岡山県":11,"広島県":11,"山口県":11,"徳島県":12,"香川県":12,"愛媛県":12,"高知県":12,"福岡県":13,"佐賀県":13,"長崎県":13,"熊本県":13,"大分県":13,"宮崎県":14,"鹿児島県":14,"沖縄県":18};
const FACILITY_PRESETS={hotel:{label:"ホテル・旅館",purposeKey:'hotel'},hospital:{label:"病院・医療施設",purposeKey:'hospital'},nursing:{label:"介護・老健施設",purposeKey:'nursing'},school:{label:"学校・教育施設",purposeKey:'school'},factory:{label:"工場・作業場",purposeKey:'factory'},apartment:{label:"集合住宅",purposeKey:'apartment'},office:{label:"オフィス",purposeKey:'office'}};

// ===== パーパス基準 台数別同時使用率テーブル（設計資料073-8 P.8 + 建備基準補完） =====
const PURPOSE_USAGE_RATE={
  // パーパス公式資料（設計資料073-8 P.8）
  nursing:     {vals:[[3,90],[5,78],[10,60],[15,50],[20,43],[25,38],[30,35]],cap:35,label:'老健施設（浴室設備）',src:'073-8'},
  bizhotel:    {vals:[[3,90],[5,72],[10,55],[20,41],[40,29],[60,25],[80,23],[100,21],[120,20]],cap:20,label:'ビジネスホテル（ユニットバス）',src:'073-8'},
  leisurehotel:{vals:[[3,100],[5,100],[10,76],[20,53],[30,43],[40,38],[50,34]],cap:34,label:'レジャーホテル',src:'073-8'},
  sports:      {vals:[[3,100],[5,100],[10,100],[15,90],[20,85],[25,83],[30,80],[35,78],[40,76]],cap:76,label:'スポーツ施設（シャワーユニット）',src:'073-8'},
  // 建備基準ベース補完（ASHRAE固定U廃止代替）
  hotel:       {vals:[[3,90],[5,72],[10,55],[20,41],[40,29],[60,25],[80,23],[100,21],[120,20]],cap:20,label:'ホテル・旅館',src:'建備'},
  hospital:    {vals:[[2,90],[5,80],[10,70],[20,60],[30,55],[50,50]],cap:45,label:'病院・医療施設',src:'建備'},
  school:      {vals:[[2,90],[5,80],[10,70],[20,65],[30,60],[50,55]],cap:50,label:'学校・教育施設',src:'建備'},
  factory:     {vals:[[2,90],[5,80],[10,65],[20,55],[30,50]],cap:45,label:'工場・作業場',src:'建備'},
  apartment:   {vals:[[2,90],[5,70],[10,50],[20,40],[30,35],[50,30]],cap:25,label:'集合住宅',src:'建備'},
  office:      {vals:[[2,90],[5,80],[10,65],[20,55],[30,50]],cap:45,label:'オフィス',src:'建備'}
};

// 余裕係数 K（パーパス基準 設計資料073-8 では1.1を推奨）
const DEFAULT_K = 1.1;

// 器具別固定号数（パーパス基準 設計資料073-8 P.7）
const MULTI_FIXTURE = {
  shower:  {gosu:15,flow:10,tempOut:42,label:'①シャワー・浴室カラン'},
  wash:    {gosu:9, flow:6, tempOut:40,label:'②手洗い（洗面）カラン'},
  kitchen: {gosu:25,flow:12,tempOut:60,label:'③厨房カラン（60℃直供給）'},
  bath:    {gosu:null,flow:null,tempOut:44,label:'④ふろ給湯（大浴場）',tempOutdoor:48}
};

// 配管口径選定テーブル（GS-S3200GW 60℃設定 入水15℃ 設計資料073-8 P.9）
const PIPE_SIZE_TABLE=[
  {maxUnits:1, kyusuiA:'20A',kyutoA:'20A',maxFlowTotal:18},
  {maxUnits:2, kyusuiA:'25A',kyutoA:'25A',maxFlowTotal:36},
  {maxUnits:3, kyusuiA:'32A',kyutoA:'32A',maxFlowTotal:53},
  {maxUnits:5, kyusuiA:'40A',kyutoA:'40A',maxFlowTotal:89},
  {maxUnits:10,kyusuiA:'50A',kyutoA:'50A',maxFlowTotal:178},
  {maxUnits:15,kyusuiA:'65A',kyutoA:'65A',maxFlowTotal:267},
  {maxUnits:20,kyusuiA:'80A',kyutoA:'80A',maxFlowTotal:356}
];

// 台数から同時使用率(%)を補間取得する関数
function getPurposeUsageRate(facilityKey, qty){
  const t=PURPOSE_USAGE_RATE[facilityKey];
  if(!t) return 100;
  const vals=t.vals;
  if(qty<=vals[0][0]) return vals[0][1];
  if(qty>=vals[vals.length-1][0]) return t.cap;
  for(let i=0;i<vals.length-1;i++){
    if(qty>=vals[i][0] && qty<=vals[i+1][0]){
      // 線形補間
      const ratio=(qty-vals[i][0])/(vals[i+1][0]-vals[i][0]);
      const rate=vals[i][1]+(vals[i+1][1]-vals[i][1])*ratio;
      return Math.round(rate);
    }
  }
  return t.cap;
}

// ===== 貯湯タンク方式向け ピーク継続時間（h） =====
const PEAK_CONTINUATION_HOURS = {
  bizhotel: 2.0, leisurehotel: 2.0, hotel: 2.0, hospital: 2.0,
  nursing: 2.0, sports: 2.0,
  school: 1.0, factory: 1.0, apartment: 1.0, office: 1.0,
  default: 1.5
};

// ===== 膨張タンク選定定数（パーパス業務用カタログ2021 P.93） =====
const EXPANSION_S=[{t:60,s:0.0151},{t:70,s:0.0204}];
const EXPANSION_TANK_STEPS=[8,12,20,30,50,80,100,200,500,1000];
const UNIT_INTERNAL_VOL={'GS-S3200GW':3.5,'PG-H500W':5.0,'default':4.0};
const GAS_70KW_THRESHOLD=70;

// 膨張係数S 線形補間
function getExpansionS(th){
  if(th<=EXPANSION_S[0].t) return EXPANSION_S[0].s;
  if(th>=EXPANSION_S[EXPANSION_S.length-1].t) return EXPANSION_S[EXPANSION_S.length-1].s;
  for(let i=0;i<EXPANSION_S.length-1;i++){
    if(th>=EXPANSION_S[i].t&&th<=EXPANSION_S[i+1].t){
      const r=(th-EXPANSION_S[i].t)/(EXPANSION_S[i+1].t-EXPANSION_S[i].t);
      return EXPANSION_S[i].s+(EXPANSION_S[i+1].s-EXPANSION_S[i].s)*r;
    }
  }
  return EXPANSION_S[EXPANSION_S.length-1].s;
}

// 水道直結可否判定
function getWaterDirectConnection(pat){
  if(pat==='pat1') return {status:'ok',  label:'直結可',  message:'瞬間式単管は通常水道直結可能です。'};
  if(pat==='pat2') return {status:'warn',label:'要確認',  message:'給湯循環は所轄水道局に要問い合わせ。'};
  if(pat==='pat3') return {status:'warn',label:'要確認',  message:'貯湯タンク循環は所轄水道局に要問い合わせ。'};
  if(pat==='pat4') return {status:'warn',label:'要確認',  message:'ろ過昇温は所轄水道局に要問い合わせ。'};
  if(pat==='multi')return {status:'ng',  label:'原則不可', message:'複数台マルチは原則不可。PU-6等ポンプユニットの使用を検討してください。'};
  return {status:'warn',label:'不明',message:'水道直結可否を確認してください。'};
}
// 台数から配管口径を返す関数
function getPipeSize(units){
  for(const row of PIPE_SIZE_TABLE){
    if(units<=row.maxUnits) return row;
  }
  return PIPE_SIZE_TABLE[PIPE_SIZE_TABLE.length-1];
}
// 器具プリセット [名称, Hq瞬間式(L/h), Hq貯湯式(L/h)]
const FIXTURE_PRESETS={
  room:[
    ["洗面台（客室）",7.6,30.0],["シャワー（客室）",114.0,120.0],
    ["浴槽（客室）",76.0,240.0],["台所カラン（客室）",208.0,180.0]
  ],
  bath:[
    ["シャワー（大浴場）",338.0,120.0],["洗面台（大浴場）",7.6,30.0],
    ["上がり湯（大浴場）",84.0,84.0]
  ],
  kitchen:[
    ["流し台カラン（厨房）",208.0,180.0],["食洗機業務用100食",760.0,600.0],
    ["掃除流し",139.0,180.0]
  ]
};
const ZONE_LABELS={room:"客室",bath:"大浴場",kitchen:"厨房"};

// ===================== 状態管理 =====================
let state={
  projectName:"",
  systems:[],          // {id,name,pat,fixtures=[],p4params={},p23params={},multiParams={},th,unitcap,unitflow,result}
  currentSysId:null
};
let sysCounter=0;
let fixtureCounter=0;

// ===================== ページルーティング =====================
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById('page-'+name);
  if(target) target.classList.add('active');
  const nav=document.getElementById('side-nav');
  if(name==='top' || name==='individual'){nav.classList.add('hidden');nav.classList.remove('flex');}
  else{nav.classList.remove('hidden');nav.classList.add('flex');}
  // サイドナビのアクティブ設定
  document.querySelectorAll('.side-nav-item').forEach(b=>{
    b.classList.remove('active');
    if(b.id==='nav-'+name) b.classList.add('active');
  });
  if(name==='systems') refreshSystemsGrid();
  if(name==='report') generateReport();
}

// ===================== 都道府県セレクト初期化 =====================
function initPrefSelect(){
  const sel=document.getElementById('common-pref');
  Object.keys(PREFECTURE_TC_MAP).forEach(p=>{
    const o=document.createElement('option');
    o.value=p; o.textContent=p;
    if(p==='東京都') o.selected=true;
    sel.appendChild(o);
  });
  onPrefChange();
}
function onPrefChange(){
  const pref=document.getElementById('common-pref').value;
  const tc=PREFECTURE_TC_MAP[pref]??8;
  document.getElementById('common-tc').value=tc;
}

// ===================== 新規プロジェクト =====================
function startNewProject(){
  state={projectName:'',systems:[],currentSysId:null};
  sysCounter=0; fixtureCounter=0;
  document.getElementById('common-name').value='';
  document.getElementById('common-author').value='';
  document.getElementById('side-project-name').textContent='新規プロジェクト';
  const modeNote=document.getElementById('side-mode-note');
  if(modeNote) modeNote.textContent='統合計算モード';
  showPage('common');
}

// ===================== 系統管理 =====================
function addSystem(){
  sysCounter++;
  const sys={
    id:sysCounter, name:`系統 ${sysCounter}`,
    pat:'pat1',
    fixtures:[],
    p4params:{vol:10,qty:1,nfilter:6,dt2:5,dt1:10,tset:42,tfill:4,useQfill:false},
    p23params:{pipelen:0,losscoef:10,tankvol:1000},
    expansionParams:{enable:false,vsysPipe:0,unitModel:'GS-S3200GW'},
    multiParams:{
      facilityType:'bizhotel',
      shower:{qty:10,enabled:true},
      wash:  {qty:10,enabled:true},
      kitchen:{qty:0,enabled:false},
      bath:  {vol:3000,fillMin:60,outdoor:false,enabled:false}
    },
    th:60,
    unitcap:32,
    result:null
  };
  // デフォルト器具を追加（U の初期値は動的算出のため 0.5 プレースホルダー）
  fixtureCounter++;
  sys.fixtures.push({id:fixtureCounter,zone:'room',name:'洗面台（客室）',hq:7.6,hqTank:30.0,u:0.5,qty:1});
  fixtureCounter++;
  sys.fixtures.push({id:fixtureCounter,zone:'room',name:'シャワー（客室）',hq:114.0,hqTank:120.0,u:0.5,qty:0});
  state.systems.push(sys);
  state.currentSysId=sys.id;
  openSystemDetail(sys.id);
}

function openSystemDetail(id){
  const sys=state.systems.find(s=>s.id===id);
  if(!sys) return;
  state.currentSysId=id;
  // 詳細画面に値をセット
  document.getElementById('detail-name').value=sys.name;
  document.getElementById('detail-th').value=sys.th;
  document.getElementById('detail-unitcap').value=sys.unitcap;
  // パターンボタン初期化
  document.querySelectorAll('.pat-btn').forEach(b=>{
    const isActive=b.dataset.pat===sys.pat;
    b.classList.toggle('active',isActive);
    b.querySelector('.material-symbols-outlined').textContent=isActive?'check_circle':'radio_button_unchecked';
  });
  updatePatSections(sys.pat);
  // Pat4パラメータ
  const p=sys.p4params;
  document.getElementById('p4-vol').value=p.vol;
  document.getElementById('p4-qty').value=p.qty;
  document.getElementById('p4-nfilter').value=p.nfilter;
  document.getElementById('p4-dt2').value=p.dt2;
  document.getElementById('p4-dt1').value=p.dt1;
  document.getElementById('p4-tset').value=p.tset;
  document.getElementById('p4-tfill').value=p.tfill || 4;
  document.getElementById('p4-useqfill').checked=p.useQfill || false;
  // Pat23パラメータ
  const pp=sys.p23params;
  document.getElementById('p23-pipelen').value=pp.pipelen;
  document.getElementById('p23-losscoef').value=pp.losscoef;
  document.getElementById('p23-tankvol').value=pp.tankvol;
  // 器具テーブル初期化
  renderFixtures(sys);
  
  if(sys.multiParams){
    document.getElementById('multi-shower-qty').value=sys.multiParams.shower.qty;
    document.getElementById('multi-shower-en').checked=sys.multiParams.shower.enabled;
    document.getElementById('multi-wash-qty').value=sys.multiParams.wash.qty;
    document.getElementById('multi-wash-en').checked=sys.multiParams.wash.enabled;
    document.getElementById('multi-kitchen-qty').value=sys.multiParams.kitchen.qty;
    document.getElementById('multi-kitchen-en').checked=sys.multiParams.kitchen.enabled;
    document.getElementById('multi-bath-vol').value=sys.multiParams.bath.vol;
    document.getElementById('multi-bath-fmin').value=sys.multiParams.bath.fillMin;
    document.getElementById('multi-bath-outdoor').checked=sys.multiParams.bath.outdoor;
    document.getElementById('multi-bath-en').checked=sys.multiParams.bath.enabled;
    if(sys.multiParams.facilityType) {
      document.getElementById('common-facility').value = sys.multiParams.facilityType;
    }
  }
  if(typeof updateMultiUsageDisplay === 'function') updateMultiUsageDisplay();

  // ページを先に表示してからDOM入力値を読み取る順序に変更
  showPage('detail');
  // nextTickで计算実行（showPageのDOM更新が完了してから）
  setTimeout(()=>{ calcAndUpdate(); }, 0);
}

// ===================== 動的使用率表示の更新 =====================
function updateMultiUsageDisplay() {
  const ftype = document.getElementById('common-facility')?.value || 'bizhotel';
  
  const sqty = parseInt(document.getElementById('multi-shower-qty')?.value||0);
  const su = getPurposeUsageRate(ftype, sqty);
  const sDisplay = document.getElementById('multi-shower-u-display');
  if(sDisplay) sDisplay.textContent = `同時使用率 ${su}%`;

  const wqty = parseInt(document.getElementById('multi-wash-qty')?.value||0);
  const wu = getPurposeUsageRate(ftype, wqty);
  const wDisplay = document.getElementById('multi-wash-u-display');
  if(wDisplay) wDisplay.textContent = `同時使用率 ${wu}%`;

  const kqty = parseInt(document.getElementById('multi-kitchen-qty')?.value||0);
  const ku = getPurposeUsageRate(ftype, kqty);
  const kDisplay = document.getElementById('multi-kitchen-u-display');
  if(kDisplay) kDisplay.textContent = `同時使用率 ${ku}%`;
}

function selectPat(btn, pat){
  document.querySelectorAll('.pat-btn').forEach(b=>{
    b.classList.remove('active');
    b.querySelector('.material-symbols-outlined').textContent='radio_button_unchecked';
  });
  btn.classList.add('active');
  btn.querySelector('.material-symbols-outlined').textContent='check_circle';
  updatePatSections(pat);
}

function updatePatSections(pat){
  const multiArea=document.getElementById('multi-area');
  const fixturesArea=document.getElementById('fixtures-area');
  const fixturesSec=document.getElementById('fixtures-section');
  const pat23Sec=document.getElementById('pat23-section');
  const pat4Sec=document.getElementById('pat4-section');
  const pipingGuide=document.getElementById('pat3-piping-guide');
  const p3TankArea=document.getElementById('p3-tank-area');
  
  if(p3TankArea) p3TankArea.classList.toggle('hidden', pat !== 'pat3');
  if(pat==='pat1' || pat==='pat2'){
    if(multiArea) multiArea.classList.remove('hidden');
    if(fixturesArea) fixturesArea.classList.add('hidden');
    if(fixturesSec) fixturesSec.classList.add('hidden');
    if(pat23Sec) pat23Sec.classList.toggle('hidden', pat==='pat1'); // pat2は循環ロス入力が必要
    if(pat4Sec) pat4Sec.classList.add('hidden');
    if(pipingGuide) pipingGuide.classList.add('hidden');
  } else if(pat==='pat3'){
    if(multiArea) multiArea.classList.add('hidden');
    if(fixturesArea) fixturesArea.classList.remove('hidden');
    if(fixturesSec) fixturesSec.classList.remove('hidden');
    if(pat23Sec) pat23Sec.classList.remove('hidden');
    if(pat4Sec) pat4Sec.classList.add('hidden');
    if(pipingGuide) pipingGuide.classList.remove('hidden');
  } else if(pat==='pat4'){
    if(multiArea) multiArea.classList.add('hidden');
    if(fixturesArea) fixturesArea.classList.add('hidden');
    if(fixturesSec) fixturesSec.classList.add('hidden');
    if(pat23Sec) pat23Sec.classList.add('hidden');
    if(pat4Sec) pat4Sec.classList.remove('hidden');
    if(pipingGuide) pipingGuide.classList.add('hidden');
  }
}

// ===================== 器具テーブル =====================
function renderFixtures(sys){
  const tbody=document.getElementById('fixture-tbody');
  tbody.innerHTML='';
  sys.fixtures.forEach(f=>{
    const opts=buildFixtureOptions(f.zone, f.name);
    const row=document.createElement('tr');
    row.className='hover:bg-slate-50/30 transition-colors';
    row.id='frow-'+f.id;
    row.innerHTML=`
      <td class="px-5 py-3">
        <select class="bg-transparent border-0 text-sm font-medium focus:ring-0 w-full" onchange="onFixtureNameChange(${f.id},this)">${opts}</select>
      </td>
      <td class="px-4 py-3 text-center">
        <span class="text-[10px] font-['Work_Sans'] bg-slate-100 text-slate-500 px-2 py-0.5">${ZONE_LABELS[f.zone]}</span>
      </td>
      <td class="px-4 py-3 text-center font-mono text-sm" id="fhq-${f.id}">${f.hqTank}</td>
      <td class="px-5 py-3">
        <input type="number" value="${f.qty}" step="1" min="0" class="w-20 ml-auto block text-sm text-right border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-secondary/20" onchange="updateFixture(${f.id},'qty',this.value)"/>
      </td>
      <td class="px-3 py-3 text-center">
        <button onclick="removeFixture(${f.id})" class="text-slate-300 hover:text-red-500 transition-colors"><span class="material-symbols-outlined text-base">delete_outline</span></button>
      </td>`;
    tbody.appendChild(row);
  });
}

function buildFixtureOptions(zone, selected){
  const presets=FIXTURE_PRESETS[zone]||[];
  return presets.map(([name])=>`<option value="${name}" ${name===selected?'selected':''}>${name}</option>`).join('');
}

function onFixtureNameChange(fid, sel){
  const sys=state.systems.find(s=>s.id===state.currentSysId);
  if(!sys) return;
  const f=sys.fixtures.find(x=>x.id===fid);
  if(!f) return;
  f.name=sel.value;
  // Hqを更新
  const presets=FIXTURE_PRESETS[f.zone]||[];
  const found=presets.find(([n])=>n===sel.value);
  if(found){ f.hq=found[1]; f.hqTank=found[2]; }
  const isPat3=getCurrentPat()==='pat3';
  document.getElementById('fhq-'+fid).textContent=isPat3?f.hqTank:f.hq;
  calcAndUpdate();
}

function updateFixture(fid, key, val){
  const sys=state.systems.find(s=>s.id===state.currentSysId);
  if(!sys) return;
  const f=sys.fixtures.find(x=>x.id===fid);
  if(f) f[key]=parseFloat(val)||0;
  calcAndUpdate();
}

function removeFixture(fid){
  const sys=state.systems.find(s=>s.id===state.currentSysId);
  if(!sys) return;
  sys.fixtures=sys.fixtures.filter(f=>f.id!==fid);
  renderFixtures(sys);
  calcAndUpdate();
}

function addFixtureRow(zone){
  const sys=state.systems.find(s=>s.id===state.currentSysId);
  if(!sys) return;
  const presets=FIXTURE_PRESETS[zone]||[];
  if(!presets.length) return;
  fixtureCounter++;
  sys.fixtures.push({id:fixtureCounter,zone,name:presets[0][0],hq:presets[0][1],hqTank:presets[0][2],u:0.5,qty:1});
  renderFixtures(sys);
  calcAndUpdate();
}

function getCurrentPat(){
  const active=document.querySelector('.pat-btn.active');
  return active?active.dataset.pat:'pat1';
}

// ===================== 計算ロジック =====================
function calcAndUpdate(){
  // ページが detail でなければスキップ（安全ガード）
  const detailPage = document.getElementById('page-detail');
  if(detailPage && !detailPage.classList.contains('active')) return;
  const sys=state.systems.find(s=>s.id===state.currentSysId);
  if(!sys) return;
  // 入力値を保存
  sys.name=document.getElementById('detail-name').value||sys.name;
  sys.pat=getCurrentPat();
  sys.th=parseFloat(document.getElementById('detail-th').value)||60;
  sys.unitcap=parseFloat(document.getElementById('detail-unitcap').value)||50;
  sys.p4params={vol:parseFloat(document.getElementById('p4-vol').value)||10,qty:parseFloat(document.getElementById('p4-qty').value)||1,nfilter:parseFloat(document.getElementById('p4-nfilter').value)||6,dt2:parseFloat(document.getElementById('p4-dt2').value)||5,dt1:parseFloat(document.getElementById('p4-dt1').value)||10,tset:parseFloat(document.getElementById('p4-tset').value)||42,tfill:parseFloat(document.getElementById('p4-tfill').value)||4,useQfill:document.getElementById('p4-useqfill').checked};
  sys.p23params={pipelen:parseFloat(document.getElementById('p23-pipelen').value)||100,losscoef:parseFloat(document.getElementById('p23-losscoef').value)||10,tankvol:parseFloat(document.getElementById('p23-tankvol').value)||1000};
  // 膨張タンクパラメータ
  sys.expansionParams={
    enable:document.getElementById('exp-enable')?.checked||false,
    vsysPipe:parseFloat(document.getElementById('exp-vsys-pipe')?.value)||0,
    unitModel:document.getElementById('exp-unit-model')?.value||'GS-S3200GW'
  };
  const tc=parseFloat(document.getElementById('common-tc').value)||8;
  const K=parseFloat(document.getElementById('common-k').value)||1.1;
  const facilityType=document.getElementById('common-facility')?.value||'hotel';
  let res;
  if(sys.pat==='pat1' || sys.pat==='pat2'){
    // 直圧式・循環式は業務用マルチモード入力パラメータを収集してA/B方式計算
    sys.multiParams={
      facilityType:document.getElementById('common-facility')?.value||'bizhotel',
      shower: {qty:parseInt(document.getElementById('multi-shower-qty')?.value||10), enabled:document.getElementById('multi-shower-en')?.checked!==false},
      wash:   {qty:parseInt(document.getElementById('multi-wash-qty')?.value||10),   enabled:document.getElementById('multi-wash-en')?.checked!==false},
      kitchen:{qty:parseInt(document.getElementById('multi-kitchen-qty')?.value||0),  enabled:document.getElementById('multi-kitchen-en')?.checked||false},
      bath:   {vol:parseFloat(document.getElementById('multi-bath-vol')?.value||3000),fillMin:parseFloat(document.getElementById('multi-bath-fmin')?.value||60),outdoor:document.getElementById('multi-bath-outdoor')?.checked||false,enabled:document.getElementById('multi-bath-en')?.checked||false}
    };
    sys.unitcap=parseFloat(document.getElementById('detail-unitcap')?.value)||32;
    res=calcMulti(sys,tc,K);
  } else if(sys.pat==='pat3'){
    // 貯湯タンク方式は器具テーブルからリカバリー計算
    res=calcPat3(sys,tc,K,facilityType);
  } else if(sys.pat==='pat4'){
    // ろ過昇温方式
    res=calcPat4(sys,tc,K);
  } else {
    // fallback
    res=calcMulti(sys,tc,K);
  }
  // 膨張タンク計算（任意）
  if(sys.expansionParams.enable){
    const unitVol=UNIT_INTERNAL_VOL[sys.expansionParams.unitModel]||UNIT_INTERNAL_VOL.default;
    res.expansionTank=calcExpansionTank(sys.expansionParams.vsysPipe,sys.th,res.finalUnits,unitVol);
  } else { res.expansionTank=null; }
  // 総放熱ロスの表示更新（Pat2, Pat3の場合）
  if(sys.pat === 'pat2' || sys.pat === 'pat3'){
    const lossSpan = document.getElementById('p23-loss-calc');
    if(lossSpan) {
      lossSpan.textContent = ((sys.p23params.pipelen * sys.p23params.losscoef) / 1000).toFixed(1);
    }
  }

  sys.result=res;
  showResult(res);
  refreshSummary();
}

function calcPat3(sys,tc,K,facilityType){
  const th=sys.th; const unitcap=sys.unitcap;
  const fkey=facilityType||'hotel';
  const peakHours = PEAK_CONTINUATION_HOURS[fkey] || PEAK_CONTINUATION_HOURS.default;
  
  const rows=sys.fixtures.map(f=>{
    const hq=f.hqTank;
    const nHq=f.qty*hq;
    return {...f,hq,nHq,design:nHq}; 
  });
  
  // 合計数量(qty)と合計1時間消費量を算出
  const totalQty=sys.fixtures.reduce((s,f)=>s+f.qty,0);
  const totalHourlyVol=rows.reduce((s,r)=>s+r.nHq,0);
  
  // パーパス基準の同時使用率 Uの取得
  const U_percent = getPurposeUsageRate(fkey, totalQty);
  const U = U_percent / 100;

  // ピーク時1時間需要量 (L/h)
  const peakHourlyDemand=totalHourlyVol*U; 

  // 必要リカバリー加熱量換算 (kW)
  const H_base=0.00116*K*peakHourlyDemand*(th-tc);
  
  let Qcirc=sys.p23params.pipelen*sys.p23params.losscoef/1000;
  const H_total=H_base+Qcirc;
  const reqGo=H_total*860/60/25;
  const heatUnits=Math.ceil(reqGo/unitcap);
  
  const finalUnits=heatUnits; 
  const pipeInfo=getPipeSize(finalUnits);
  const tankControl={pumpOn:th-15,pumpOff:th-10};
  const waterDirect=getWaterDirectConnection(sys.pat);
  const gasKw70Alert=H_total>=GAS_70KW_THRESHOLD;
  
  // 推奨される貯湯タンクの最低容量 (L) = 1時間需要量 × ピーク継続時間（h）
  const reqTankVol = peakHourlyDemand * peakHours;
  const purposeTableName=`パーパス基準設計・建備補完`;
  
  // Pat3の場合、totalQhm = peakHourlyDemand（ピーク需要量）を統一フィールドとしてセット
  const totalQhm = peakHourlyDemand;
  
  return {
    isPat4:false, isPat3:true, pat:sys.pat, lineName:sys.name,
    rows, totalHourlyVol, peakHourlyDemand, U, totalQty, peakHours,
    H_base, Qcirc, H_total, reqGo, heatUnits, finalUnits, unitcap,
    reqTankVol, totalQhm, tc, th, K, p23:sys.p23params, pipeInfo, tankControl,
    waterDirect, gasKw70Alert, facilityType:fkey, purposeTableName
  };
}

function calcPat4(sys,tc,K){
  const th=sys.th; const unitcap=sys.unitcap;
  const p=sys.p4params;
  const totalBathVol=p.vol*p.qty*1000; // m³→L
  const Q_filter=totalBathVol*p.nfilter/60;
  const Q_hex=Q_filter*p.dt2*4.186/60;
  const Q_fill=(totalBathVol*(p.tset-tc)*4.186)/(p.tfill*3600);
  const Q_primary=Q_hex*860/(p.dt1*60);
  const Q_design=p.useQfill?Math.max(Q_hex,Q_fill)*K:Q_hex*K;
  const reqGo=Q_design*860/60/25;
  const heatUnits=Math.ceil(reqGo/unitcap);
  const peakFlowMin=Q_primary;
  const finalUnits=Math.max(heatUnits,1);
  const theorMaxFlow=(unitcap*25/(th-tc))*finalUnits;
  const pipeInfo=getPipeSize(finalUnits);
  const waterDirect=getWaterDirectConnection('pat4');
  const gasKw70Alert=Q_design>=GAS_70KW_THRESHOLD;
  return {isPat4:true,pat:'pat4',lineName:sys.name,totalBathVol,Q_filter,Q_hex,Q_fill,Q_primary,Q_design,reqGo,heatUnits,peakFlowMin,finalUnits,unitcap,theorMaxFlow,tc,th,K,p,pipeInfo,waterDirect,gasKw70Alert};
}

// ===================== 業務用マルチ計算（パーパス基準 設計資料073-8） =====================
function calcMulti(sys,tc,K){
  const mp=sys.multiParams;
  const ftype=mp.facilityType;
  const unitcap=sys.unitcap;

  // 各グループの号数計算
  const groups=[];

  // ① シャワー・浴室カラン (42℃, 10L/min → 基準15号)
  if(mp.shower.enabled && mp.shower.qty>0){
    const u=getPurposeUsageRate(ftype,mp.shower.qty)/100;
    const gosu=mp.shower.qty*MULTI_FIXTURE.shower.gosu*u;
    groups.push({label:MULTI_FIXTURE.shower.label,qty:mp.shower.qty,gosuEach:MULTI_FIXTURE.shower.gosu,u,gosu});
  }
  // ② 手洗い（洗面）カラン (40℃, 6L/min → 基準9号)
  if(mp.wash.enabled && mp.wash.qty>0){
    const u=getPurposeUsageRate(ftype,mp.wash.qty)/100;
    const gosu=mp.wash.qty*MULTI_FIXTURE.wash.gosu*u;
    groups.push({label:MULTI_FIXTURE.wash.label,qty:mp.wash.qty,gosuEach:MULTI_FIXTURE.wash.gosu,u,gosu});
  }
  // ③ 厨房カラン (60℃, 10〜12L/min → 基準25号)
  if(mp.kitchen.enabled && mp.kitchen.qty>0){
    const u=getPurposeUsageRate(ftype,mp.kitchen.qty)/100;
    const gosu=mp.kitchen.qty*MULTI_FIXTURE.kitchen.gosu*u;
    groups.push({label:MULTI_FIXTURE.kitchen.label,qty:mp.kitchen.qty,gosuEach:MULTI_FIXTURE.kitchen.gosu,u,gosu});
  }

  // STEP1: 一般器具合計号数 × K
  const sumGosuA=groups.reduce((s,g)=>s+g.gosu,0);
  let gosuA=sumGosuA * K;
  
  // 循環配管放熱ロス (pat2のみ)
  let QcircKw = 0;
  let QcircGosu = 0;
  if(sys.pat === 'pat2'){
    QcircKw = sys.p23params.pipelen * sys.p23params.losscoef / 1000;
    QcircGosu = QcircKw * 860 / 60 / 25; // kW -> 号数変換
    gosuA += QcircGosu;
  }
  const unitsA=Math.ceil(gosuA/unitcap);

  // ④ ふろ給湯（大浴場）の号数計算 ※屋外は48℃、屋内は44℃
  // 給水温度tcは都道府県別（マルチも同様）
  let bathResult=null;
  let unitsB=0;
  let gosuB=0;
  if(mp.bath.enabled){
    const bathTemp=mp.bath.outdoor?MULTI_FIXTURE.bath.tempOutdoor:MULTI_FIXTURE.bath.tempOut;
    const flowBath=mp.bath.vol/mp.bath.fillMin;
    const gosuBath=flowBath*(bathTemp-tc)/25; // tc = 都道府県別給水温度
    gosuB=gosuBath * K;
    if(sys.pat === 'pat2') gosuB += QcircGosu; // ふろ単独充填時でも循環配管が生きている場合はロスを加味
    unitsB=Math.ceil(gosuB/unitcap);
    bathResult={vol:mp.bath.vol,fillMin:mp.bath.fillMin,outdoor:mp.bath.outdoor,bathTemp,flowBath,gosuBath,gosuB,unitsB};
  }

  // STEP3: MAX(A,B)
  const finalUnits=Math.max(unitsA,unitsB);
  const pipeInfo=getPipeSize(finalUnits);
  const waterDirect=getWaterDirectConnection(sys.pat); // multiではなく現在のpat判定で返すように修正
  const totalGosuEquiv=Math.max(gosuA,gosuB);
  const gasKw70Alert=(totalGosuEquiv*60*25/860)>=GAS_70KW_THRESHOLD;

  return {
    isMulti:true, pat:'multi', lineName:sys.name,
    groups, sumGosuA, gosuA, unitsA,
    bathResult, unitsB,
    finalUnits, unitcap,
    pipeInfo, ftype, tc, K,
    facilityLabel:(PURPOSE_USAGE_RATE[ftype]?.label||ftype),
    waterDirect, gasKw70Alert
  };
}

// ===================== 膨張タンク選定計算（パーパス業務用カタログ2021 P.93） =====================
function calcExpansionTank(vsysPipe, th, finalUnits, unitInternalVol){
  // システム内水量: 配管内水量 + 機器内水量（台数×単機容量）
  const vmachine=finalUnits*(unitInternalVol||4.0);
  const vsysTotal=vsysPipe+vmachine;
  const S=getExpansionS(th);
  const vexp=vsysTotal*S;
  // 市販品ステップに切り上げ
  const recommended=EXPANSION_TANK_STEPS.find(s=>s>=Math.ceil(vexp))||EXPANSION_TANK_STEPS[EXPANSION_TANK_STEPS.length-1];
  return {vsysPipe,vmachine,vsysTotal,S,vexp,recommended,th};
}

function showResult(r){
  const sec=document.getElementById('detail-result');
  sec.classList.remove('hidden');
  if(r.isMulti){
    // 業務用マルチモードの表示
    const totalGosu=Math.ceil(r.gosuA>r.unitsB*r.unitcap?r.gosuA:r.unitsB*r.unitcap);
    document.getElementById('res-kw').innerHTML=`<span class="text-base font-normal opacity-80">必要合計号数</span>`;
    document.getElementById('res-go').textContent=Math.ceil(Math.max(r.gosuA,r.unitsB*r.unitcap));
    document.getElementById('res-units').textContent=`${r.unitcap}号機 × ${r.finalUnits}台`;
    // 配管口径を結果エリア追加表示
    let pipeEl=document.getElementById('res-pipe-info');
    if(!pipeEl){
      pipeEl=document.createElement('div');
      pipeEl.id='res-pipe-info';
      pipeEl.className='mt-3 text-xs bg-white/10 rounded p-3 border border-white/10';
      document.getElementById('res-units').parentElement?.after(pipeEl);
    }
    if(r.pipeInfo) pipeEl.innerHTML=`<span class="opacity-70">推奨配管口径:</span> 給水 <strong>${r.pipeInfo.kyusuiA}</strong> / 給湯往き <strong>${r.pipeInfo.kyutoA}</strong>`;
  } else {
    const kw=r.isPat4?r.Q_design:r.H_total;
    document.getElementById('res-kw').innerHTML=kw.toFixed(1) + '<span class="text-base font-normal opacity-80 pl-2">(' + (kw*860).toLocaleString(undefined,{maximumFractionDigits:0}) + ' kcal/h)</span>';
    // Pat3/Pat4は計算済みのreqGoを表示、それ以外は概算
    const reqGoDisp = r.reqGo ? Math.ceil(r.reqGo) : Math.ceil(kw*860/60/25);
    document.getElementById('res-go').textContent = reqGoDisp;
    document.getElementById('res-units').textContent=`${r.unitcap}号機 × ${r.finalUnits}台`;
    
    // タンク容量表示制御
    const tankArea=document.getElementById('res-tank-area');
    if(tankArea){
      if(r.isPat3){
        tankArea.classList.remove('hidden');
        document.getElementById('res-tank').textContent=Math.round(r.reqTankVol).toLocaleString();
      } else {
        tankArea.classList.add('hidden');
      }
    }

    const pipeEl=document.getElementById('res-pipe-info');
    if(pipeEl) pipeEl.remove();
    // Pat1〜4: 配管口径表示
    if(r.pipeInfo){
      let pel=document.getElementById('res-pipe-pat123');
      if(!pel){pel=document.createElement('div');pel.id='res-pipe-pat123';pel.className='mt-3 text-xs bg-white/10 rounded p-3 border border-white/10 text-white';document.getElementById('res-units').parentElement?.after(pel);}
      pel.innerHTML=`<span class="opacity-70">推奨配管口径 (HASS 206):</span> 給水 <strong>${r.pipeInfo.kyusuiA}</strong> / 給湯往き <strong>${r.pipeInfo.kyutoA}</strong><span class="opacity-60 ml-2">（最大 ${r.pipeInfo.maxFlowTotal} L/min）</span>`;
    }
  }
  // === 共通補助情報エリア ===
  let commonEl=document.getElementById('res-common-info');
  if(!commonEl){
    commonEl=document.createElement('div');
    commonEl.id='res-common-info';
    commonEl.className='space-y-2 px-6 pb-5 pt-2';
    const detailResult=document.getElementById('detail-result');
    if(detailResult) detailResult.appendChild(commonEl);
  }
  let html='';
  if(r.waterDirect){
    const wdColor={ok:'bg-green-500',warn:'bg-amber-500',ng:'bg-red-500'}[r.waterDirect.status]||'bg-slate-400';
    html+=`<div class="flex items-start gap-2 text-xs"><span class="shrink-0 inline-block px-2 py-0.5 text-white text-[10px] font-bold ${wdColor}">水道直結 ${r.waterDirect.label}</span><span class="text-on-surface-variant">${r.waterDirect.message}</span></div>`;
  }
  if(r.gasKw70Alert){
    html+=`<div class="bg-red-50 border border-red-300 text-red-700 px-3 py-2 text-xs font-bold">⚠️ ガス消費量70kW以上 — 火災予防条例に基づく届出が必要です（所轄消防署に要確認）</div>`;
  }
  if(r.tankControl){
    html+=`<div class="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 text-xs">🔵 一次側ポンプ制御: ON ${r.tankControl.pumpOn}℃ / OFF ${r.tankControl.pumpOff}℃（パーパス GYOMU P.93）</div>`;
  }
  if(r.expansionTank){
    const et=r.expansionTank;
    html+=`<div class="bg-slate-50 border border-slate-200 px-3 py-2 text-xs space-y-0.5"><div class="font-bold text-slate-700">膨張タンク選定（V_exp = V_sys × S）</div><div class="text-slate-600">V_sys = ${et.vsysTotal.toFixed(1)}L（配管 ${et.vsysPipe}L + 機器 ${et.vmachine.toFixed(1)}L）/ S = ${et.S.toFixed(4)} @ ${et.th}℃</div><div class="text-slate-700 font-bold">計算値 ${et.vexp.toFixed(2)}L → <span class="text-secondary text-sm">推奨 ${et.recommended}L 以上</span></div></div>`;
  }
  if(r.purposeTableName&&r.zoneU){
    const zones=Object.entries(r.zoneU).map(([z,u])=>`${ZONE_LABELS[z]||z}: ${Math.round(u*100)}%`).join(' / ');
    html+=`<div class="text-[10px] text-on-surface-variant">同時使用率根拠: ${zones}（${r.purposeTableName} / K=${r.K}）</div>`;
  }
  commonEl.innerHTML=html;
}

function saveSystemAndBack(){
  // 現在の入力を保存してから一覧へ
  calcAndUpdate();
  // 非同期で安全にページ遷移（calcAndUpdateのDOM更新後）
  setTimeout(()=>{
    refreshSystemsGrid();
    showPage('systems');
  },50);
}

function deleteSystem(id){
  if(!confirm('この系統を削除しますか？')) return;
  state.systems=state.systems.filter(s=>s.id!==id);
  refreshSummary();
  refreshSystemsGrid();
}

// ===================== 系統一覧グリッド更新 =====================
const SYSTEM_ICONS={hotel:'hotel',hospital:'local_hospital',nursing:'elderly',school:'school',factory:'factory',apartment:'apartment',office:'business',default:'water_heater'};

function refreshSystemsGrid(){
  const grid=document.getElementById('systems-grid');
  const fkey=document.getElementById('common-facility').value||'hotel';
  const icon=SYSTEM_ICONS[fkey]||SYSTEM_ICONS.default;
  // 既存カードを削除（最後の追加ボタン以外）
  const addBtn=grid.querySelector('button[onclick="addSystem()"]');
  grid.innerHTML='';
  state.systems.forEach((sys,i)=>{
    const r=sys.result;
    const kwStr=r?(
      r.isPat4?r.Q_design.toFixed(1)+"kW ("+(r.Q_design*860).toLocaleString(undefined,{maximumFractionDigits:0})+"kcal/h)":
      r.isMulti?Math.ceil(Math.max(r.gosuA,r.unitsB*r.unitcap))+"号相当":
      r.H_total.toFixed(1)+"kW ("+(r.H_total*860).toLocaleString(undefined,{maximumFractionDigits:0})+"kcal/h)"
    ):'--';
    const lhrStr=r&&!r.isPat4&&!r.isMulti?Math.round(r.totalQhm).toLocaleString():'--';
    const patLabels={pat1:'直圧給湯方式',pat2:'給湯循環方式',pat3:'貯湯タンク方式',pat4:'ろ過昇温方式',multi:'業務用マルチ方式'};
    const card=document.createElement('div');
    card.className='bg-white p-5 shadow-sm border-b-2 border-transparent hover:border-secondary transition-all group';
    card.innerHTML=`
      <div class="flex justify-between items-start mb-5">
        <div class="p-2 bg-surface-container-low text-secondary">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <span class="text-[10px] font-['Work_Sans'] px-2 py-0.5 bg-slate-100 text-slate-500">ID: SYS-${String(sys.id).padStart(3,'0')}</span>
      </div>
      <h3 class="text-lg font-bold text-on-surface mb-1 tracking-tight leading-tight">${sys.name}</h3>
      <p class="text-sm text-on-surface-variant mb-5 opacity-80">${patLabels[sys.pat]||sys.pat} / ${sys.th}℃給湯</p>
      <div class="space-y-3 pt-4 border-t border-slate-100">
        ${r&&!r.isPat4?`<div class="flex justify-between items-end">
          <span class="text-[10px] font-['Work_Sans'] text-on-surface-variant uppercase">Qhm</span>
          <div class="text-right"><span class="text-2xl font-bold text-primary">${lhrStr}</span><span class="text-[10px] ml-1 text-on-surface-variant">L/hr</span></div>
        </div>`:''}
        <div class="flex justify-between items-end">
          <span class="text-[10px] font-['Work_Sans'] text-on-surface-variant uppercase">${r&&r.isPat4?'Q_design':'Heat Load'}</span>
          <div class="text-right"><span class="text-[11px] font-medium text-on-surface">${kwStr}</span></div>
        </div>
        ${r?`<div class="flex justify-between items-end">
          <span class="text-[10px] font-['Work_Sans'] text-on-surface-variant uppercase">Selection</span>
          <div class="text-right"><span class="text-sm font-bold text-secondary">${r.unitcap}号 × ${r.finalUnits}台</span></div>
        </div>`:'<p class="text-xs text-amber-500 italic">未計算 - 計算更新ボタンを押してください</p>'}
      </div>
      <div class="mt-5 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onclick="openSystemDetail(${sys.id})" class="p-2 text-on-surface-variant hover:text-secondary transition-colors">
          <span class="material-symbols-outlined">edit_note</span>
        </button>
        <button onclick="deleteSystem(${sys.id})" class="p-2 text-on-surface-variant hover:text-red-500 transition-colors">
          <span class="material-symbols-outlined">delete_outline</span>
        </button>
      </div>`;
    grid.appendChild(card);
  });
  // 追加ボタン
  const btn=document.createElement('button');
  btn.onclick=addSystem;
  btn.className='flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 bg-surface-container-low hover:bg-surface-container transition-colors group min-h-64';
  btn.innerHTML=`<div class="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm mb-3 group-hover:scale-110 transition-transform"><span class="material-symbols-outlined text-3xl">add_circle</span></div><span class="text-sm font-bold text-primary">新しい系統を設計</span><span class="text-[10px] font-['Work_Sans'] text-on-surface-variant mt-2">Click to start a new calculation</span>`;
  grid.appendChild(btn);
  refreshSummary();
}

function refreshSummary(){
  const calculated=state.systems.filter(s=>s.result);
  if(calculated.length===0){
    document.getElementById('systems-summary').classList.add('hidden');
    document.getElementById('systems-summary').classList.remove('flex');
    return;
  }
  document.getElementById('systems-summary').classList.remove('hidden');
  document.getElementById('systems-summary').classList.add('flex');
  const totalQhm=calculated.reduce((s,sys)=>{
    const r=sys.result;
    if(r.isPat4||r.isMulti) return s;
    return s+(r.totalQhm || r.totalHourlyVol || 0);
  },0);
  const totalKw=calculated.reduce((s,sys)=>{
    const r=sys.result;
    if(r.isMulti) return s; // マルチはkW換算しないため集計外
    return s+(r.isPat4?r.Q_design:r.H_total);
  },0);
  document.getElementById('total-qhm').textContent=Math.round(totalQhm).toLocaleString();
  document.getElementById('total-kw').innerHTML=totalKw.toFixed(1) + ' <span class="text-base font-normal text-on-surface-variant pl-2">(' + (totalKw*860).toLocaleString(undefined,{maximumFractionDigits:0}) + ' kcal/h)</span>';
}

// ===================== レポート生成 =====================
function generateReport(){
  const name=document.getElementById('common-name').value||'施設名称未入力';
  const pref=document.getElementById('common-pref').value;
  const tc=parseFloat(document.getElementById('common-tc').value)||8;
  const K=parseFloat(document.getElementById('common-k').value)||DEFAULT_K;
  const author=document.getElementById('common-author').value||'--';
  const today=new Date().toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit'});
  // 未計算系統を計算
  state.systems.forEach(sys=>{
    if(!sys.result){
      if(sys.pat==='pat4') sys.result=calcPat4(sys,tc,K);
      else if(sys.pat==='pat3') sys.result=calcPat3(sys,tc,K,sys.multiParams?.facilityType||'hotel');
      else sys.result=calcMulti(sys,tc,K);
    }
  });
  const fmt=v=>Math.round(v).toLocaleString();
  const totalKw=state.systems.reduce((s,sys)=>{const r=sys.result;return s+(r&&!r.isMulti?(r.isPat4?r.Q_design:r.H_total):0);},0);
  const totalQhm=state.systems.reduce((s,sys)=>{const r=sys.result;return s+(r&&!r.isPat4&&!r.isMulti?r.totalQhm:0);},0);
  const patLabels={pat1:'直圧給湯方式',pat2:'給湯循環方式',pat3:'貯湯タンク方式',pat4:'ろ過昇温方式',multi:'業務用マルチ方式'};
  // 表紙ページ
  let html=`<div class="report-page bg-white">
    <div style="margin-top:60px">
      <div class="text-sm font-['Work_Sans'] text-slate-500 tracking-[0.2em] mb-4">HOT WATER CAPACITY CALCULATION REPORT</div>
      <h1 class="text-5xl font-bold text-primary leading-tight mb-8">${name}<br/>給湯設備容量計算書</h1>
      <div class="grid grid-cols-2 gap-12 mt-20">
        <div class="space-y-5">
          <div><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider mb-1">Facility Name</p><p class="text-lg font-bold border-b border-slate-200 pb-2">${name}</p></div>
          <div><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider mb-1">Location</p><p class="text-lg border-b border-slate-200 pb-2">${pref}</p></div>
        </div>
        <div class="space-y-5">
          <div><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider mb-1">Date Created</p><p class="text-lg border-b border-slate-200 pb-2">${today}</p></div>
          <div><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider mb-1">Author</p><p class="text-lg border-b border-slate-200 pb-2">${author}</p></div>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-end border-t border-slate-200 pt-10 pb-6 mt-20">
      <div>
        <p class="text-xs text-slate-500">Calculated by 給湯能力計算システム v5.2 (logic) / v2.0 (UI)</p>
      </div>
    </div>
  </div>`;
  // 目次 + 共通条件ページ
  html+=`<div class="report-page bg-white page-break flex flex-col">
    <div class="flex-grow">
      <h2 class="text-2xl font-bold text-primary border-b-2 border-slate-200 pb-2 mb-6">目次</h2>
      <ul class="text-lg space-y-4 mb-10">`;
  state.systems.forEach((sys,i)=>{
    if(sys.result) html+=`<li><span class="font-bold mr-4">${i+2}.</span> 系統別計算：${sys.name} <span class="text-sm text-slate-500 ml-2">(${patLabels[sys.pat]||sys.pat})</span></li>`;
  });
  html+=`<li><span class="font-bold mr-4">${state.systems.length+2}.</span> 算出機器一覧（まとめ）</li>
      </ul>
    </div>
    <div class="mt-auto pt-8 border-t border-slate-200">
      <h2 class="text-xl font-bold text-primary border-l-4 border-secondary pl-4 mb-6">1. 共通計算条件</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-50 p-4"><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider">給水温度（冬期最低）</p><p class="text-xl font-bold mt-1">${tc} <span class="text-xs font-normal">℃</span></p></div>
        <div class="bg-slate-50 p-4"><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider">余裕係数 K</p><p class="text-xl font-bold mt-1">${K}</p></div>
      </div>
    </div>
  </div>`;

  state.systems.forEach((sys,i)=>{
    const r=sys.result;
    if(!r) return;
    html+=`<div class="report-page bg-white page-break">
      <h2 class="text-xl font-bold text-primary border-l-4 border-secondary pl-4 mb-5">${i+2}. 系統別計算：${sys.name}</h2>`;
    html+=`<p class="text-sm text-slate-500 mb-4">${patLabels[r.pat]||r.pat} / 給湯温度 ${sys.th}℃</p>`;
    
    // レジオネラ属菌の注意喚起
    if(r.pat !== 'pat1' && sys.th <= 60) {
      html+=`<div class="mb-5 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm flex gap-3 items-start">
        <span class="material-symbols-outlined text-red-500">warning</span>
        <div>
          <strong class="block mb-1">【重要】レジオネラ属菌に関する注意喚起</strong>
          直圧式を除き、貯湯・循環ラインの維持温度が60℃以下の場合、レジオネラ属菌が増殖する恐れがあります。衛生管理上、設定温度を60℃超へ引き上げるか、定期的な昇温殺菌等の対策を強く推奨します。
        </div>
      </div>`;
    }

    if(r.isMulti){
      // 業務用マルチ計算書
      html+=`<div class="mb-3 p-3 bg-amber-50 border border-amber-100 text-xs">パーパス基準または建備等補完式適用 / 施設タイプ: ${r.facilityLabel} / 余裕率 K=${r.K}</div>`;
      html+=`<div class="mb-4 overflow-hidden border border-slate-100">
        <table class="w-full text-sm text-left">
          <thead><tr class="bg-slate-50 text-slate-500 text-[10px] font-['Work_Sans'] uppercase">
            <th class="px-4 py-2">器具グループ</th><th class="px-4 py-2 text-right">台数</th>
            <th class="px-4 py-2 text-right">基準号数/台</th><th class="px-4 py-2 text-right">同時使用率</th><th class="px-4 py-2 text-right">必要号数</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100">
          ${r.groups.map(g=>`<tr><td class="px-4 py-2">${g.label}</td><td class="px-4 py-2 text-right font-mono">${g.qty}台</td>
            <td class="px-4 py-2 text-right font-mono">${g.gosuEach}号</td><td class="px-4 py-2 text-right font-mono">${(g.u*100).toFixed(0)}%</td>
            <td class="px-4 py-2 text-right font-mono font-bold">${g.gosu.toFixed(1)}号</td></tr>`).join('')}
          <tr class="bg-slate-50 font-bold"><td colspan="4" class="px-4 py-2">一般器具合計 × 予裕率 ${r.K}</td><td class="px-4 py-2 text-right font-mono">${r.gosuA.toFixed(1)}号 → ${r.unitsA}台</td></tr>
          ${r.bathResult?`<tr><td class="px-4 py-2">${MULTI_FIXTURE.bath.label}</td><td class="px-4 py-2 text-right font-mono">浴槽${r.bathResult.vol}L/${r.bathResult.fillMin}分</td>
            <td class="px-4 py-2 text-right font-mono">(${r.bathResult.bathTemp}℃屋${r.bathResult.outdoor?'外':'内'})</td>
            <td class="px-4 py-2 text-right font-mono">—</td>
            <td class="px-4 py-2 text-right font-mono font-bold">${r.bathResult.gosuBath.toFixed(1)}号 × ${r.K} = ${r.bathResult.gosuB.toFixed(1)}号 → ${r.bathResult.unitsB}台</td></tr>`:''}
          </tbody>
        </table>
      </div>`;
      html+=`<div class="mb-4 p-4 bg-slate-50 border border-slate-100 text-xs font-mono space-y-1">
        <p class="font-bold text-primary text-sm mb-2">【台数選定】</p>
        <p>STEP 1: 一般器具共計 × K = ${r.sumGosuA.toFixed(1)} × ${r.K} = <strong>${r.gosuA.toFixed(1)}号</strong> → <strong>${r.unitsA}台（A）</strong></p>
        ${r.bathResult?`<p>STEP 2: 大浴場 × K = ${r.bathResult.gosuBath.toFixed(1)} × ${r.K} = <strong>${r.bathResult.gosuB.toFixed(1)}号</strong> → <strong>${r.bathResult.unitsB}台（B）</strong></p>`:''}
        <p>STEP 3: MAX(A${r.bathResult?', B':''}) → <strong>採用台数 ${r.finalUnits}台</strong></p>
      </div>`;
      html+=`<div class="bg-primary text-white p-5 grid grid-cols-2 gap-6 mb-8">
        <div><p class="text-[10px] opacity-70 font-['Work_Sans'] uppercase tracking-widest mb-1">必要号数 (パーパス基準)</p>
          <div class="flex items-baseline gap-2"><span class="text-3xl font-bold">${Math.ceil(Math.max(r.gosuA,r.unitsB*r.unitcap))}</span><span>号</span></div></div>
        <div class="border-l border-white/20 pl-5">
          <p class="text-[10px] opacity-70 font-['Work_Sans'] uppercase tracking-widest mb-1">Equipment Selection</p>
          <p class="text-lg font-bold">${r.unitcap}号機 × ${r.finalUnits}台</p>
          ${r.pipeInfo?`<p class="text-sm opacity-80 mt-1">配管口径: 給水 ${r.pipeInfo.kyusuiA} / 給湯往き ${r.pipeInfo.kyutoA}</p>`:''}
        </div>
      </div>`;
    } else if(r.isPat3){
      html+=`<div class="mb-6 overflow-hidden border border-slate-100">
        <table class="w-full text-sm text-left">
          <thead><tr class="bg-slate-50 text-slate-500 text-[10px] font-['Work_Sans'] uppercase tracking-wider">
            <th class="px-4 py-2">ゾーン</th><th class="px-4 py-2">器具名</th><th class="px-4 py-2 text-right">数量</th><th class="px-4 py-2 text-right">Hq(貯湯用) [L/h]</th><th class="px-4 py-2 text-right">器具小計 [L/h]</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100">
            ${r.rows.map(row=>`<tr><td class="px-4 py-2">${ZONE_LABELS[row.zone]||row.zone}</td><td class="px-4 py-2">${row.name}</td><td class="px-4 py-2 text-right font-mono">${row.qty}</td><td class="px-4 py-2 text-right font-mono">${row.hq}</td><td class="px-4 py-2 text-right font-mono font-bold">${fmt(row.nHq)}</td></tr>`).join('')}
            <tr class="bg-slate-50 font-bold"><td colspan="4" class="px-4 py-2">合計 1時間消費量</td><td class="px-4 py-2 text-right font-mono">${fmt(r.totalHourlyVol)} L/h</td></tr>
          </tbody>
        </table>
      </div>
      <div class="mb-4 p-4 bg-slate-50 border border-slate-100 text-xs leading-relaxed space-y-2">
        <p class="font-bold text-primary text-sm mb-3">【ピークシフト・リカバリー詳細計算式】</p>
        <div class="font-mono">
          <p class="font-bold">▶ STEP 1　同時使用率 U の算出</p>
          <p class="pl-4">器具総台数 = <strong>${r.totalQty} 台</strong>　→　${r.purposeTableName}より補間取得</p>
          <p class="pl-4">同時使用率 U = <strong>${Math.round(r.U*100)} %</strong></p>
        </div>
        <div class="font-mono">
          <p class="font-bold">▶ STEP 2　ピーク時 1時間需要量 D_peak の算出</p>
          <p class="pl-4">D_peak = 合計1時間消費量 V_hourly × U</p>
          <p class="pl-4">= ${fmt(r.totalHourlyVol)} L/h × ${(r.U*100).toFixed(0)}% = <strong>${fmt(r.peakHourlyDemand)} L/h</strong></p>
        </div>
        <div class="font-mono">
          <p class="font-bold">▶ STEP 3　必要加熱能力 H_base の算出</p>
          <p class="pl-4 text-[10px] text-slate-500">H_base [kW] = 0.00116 [kW/(L/h·℃)] × K × D_peak [L/h] × (th − tc) [℃]</p>
          <p class="pl-4">= 0.00116 × ${r.K} × ${fmt(r.peakHourlyDemand)} × (${r.th}℃ − ${r.tc}℃)</p>
          <p class="pl-4">= <strong>${r.H_base.toFixed(2)} kW　（${(r.H_base*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h）</strong></p>
        </div>
        ${r.Qcirc>0?`
        <div class="font-mono">
          <p class="font-bold">▶ STEP 4　循環配管放熱ロス Qcirc の算出</p>
          <p class="pl-4">Qcirc = 配管全長 ${r.p23.pipelen} m × 単位損失 ${r.p23.losscoef} W/m ÷ 1000</p>
          <p class="pl-4">= <strong>${r.Qcirc.toFixed(2)} kW　（${(r.Qcirc*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h）</strong></p>
        </div>
        `:''}
        <div class="font-mono">
          <p class="font-bold">▶ STEP ${r.Qcirc>0?'5':'4'}　総必要リカバリー加熱能力 H_total</p>
          <p class="pl-4">H_total = H_base ${r.Qcirc>0?`+ Qcirc = ${r.H_base.toFixed(2)} + ${r.Qcirc.toFixed(2)}`:'（配管循環ロスなし）'}</p>
          <p class="pl-4">= <strong>${r.H_total.toFixed(2)} kW　（${(r.H_total*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h）</strong>${r.Qcirc===0?' <span class="text-slate-400 text-[10px]">← H_baseと同値</span>':''}</p>
        </div>
        <div class="font-mono">
          <p class="font-bold">▶ STEP ${r.Qcirc>0?'6':'5'}　必要号数および台数選定</p>
          <p class="pl-4 text-[10px] text-slate-500">号数 [号] = kW × 860 ÷ 60分 ÷ 25℃　（1号 = 1 L/min × 25℃昇温能力に相当）</p>
          <p class="pl-4">必要号数 = ${r.H_total.toFixed(2)} × 860 ÷ 60 ÷ 25 = <strong>${(r.reqGo).toFixed(1)} 号相当</strong></p>
          <p class="pl-4">台数 = ${(r.reqGo).toFixed(1)} 号 ÷ 単機能力 ${r.unitcap} 号 = 算定 ${r.heatUnits}台　→　<strong>採用 ${r.finalUnits} 台</strong></p>
        </div>
        <div class="font-mono bg-amber-50 border border-amber-200 p-3 mt-2">
          <p class="font-bold text-amber-800">▶ 推奨貯湯タンク容量の算定</p>
          <p class="pl-4 text-amber-700">V_tank = D_peak × ピーク継続時間 = ${fmt(r.peakHourlyDemand)} L/h × ${r.peakHours} h = <strong>${fmt(r.reqTankVol)} L 以上</strong></p>
          <p class="pl-4 text-[10px] text-amber-600">※ 設備設計としての推奨最低容量目安。タンク搭載有無・最適容量は現場条件に基づき判断してください。</p>
        </div>
      </div>`;
      html+=`<div class="bg-primary text-white p-5 grid grid-cols-2 gap-6 mb-3">
        <div><p class="text-[10px] opacity-70 font-['Work_Sans'] uppercase tracking-widest mb-1">Required Recovery Capacity</p><div class="flex items-baseline gap-2"><span class="text-3xl font-bold">${r.H_total.toFixed(1)}</span><span>kW</span><span class="text-sm opacity-80 ml-2">(${(r.H_total*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h)</span></div></div>
        <div class="border-l border-white/20 pl-5"><p class="text-[10px] opacity-70 font-['Work_Sans'] uppercase tracking-widest mb-1">Equipment Selection</p><p class="text-lg font-bold">熱源機: ${r.unitcap}号機 × ${r.finalUnits}台</p></div>
      </div>
      <div class="bg-secondary text-white p-4 flex items-center justify-between mb-8">
        <div>
          <p class="font-bold text-sm mb-1">推奨貯湯タンク容量</p>
          <p class="text-[10px] opacity-90 leading-tight">ピーク1時間需要量 × ピーク継続時間(${r.peakHours}h) <br/>※設備設計としての推奨最低容量目安（機器実装有無は別途確認）</p>
        </div>
        <p class="text-2xl font-bold font-mono tracking-wider">${fmt(r.reqTankVol)} L以上</p>
      </div>
    </div>`;
    } else {
      const p=r.p;
      html+=`<div class="grid grid-cols-2 md:grid-cols-4 gap-1 mb-5">
        <div class="bg-slate-50 p-3"><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider">浴槽総容量 V</p><p class="text-lg font-bold">${(r.totalBathVol/1000).toFixed(2)} <span class="text-xs">m³</span></p></div>
        <div class="bg-slate-50 p-3"><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider">ろ過循環回数 n</p><p class="text-lg font-bold">${p.nfilter} <span class="text-xs">回/h</span></p></div>
        <div class="bg-slate-50 p-3"><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider">二次側/一次側温度差</p><p class="text-lg font-bold">${p.dt2}/${p.dt1} <span class="text-xs">℃</span></p></div>
        <div class="bg-slate-50 p-3"><p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-wider">湯はり(${p.useQfill?'反映ON':'反映OFF'})</p><p class="text-lg font-bold">${p.tset}℃/${p.tfill}h</p></div>
      </div>
      <div class="mb-4 p-4 bg-slate-50 border border-slate-100 text-xs leading-relaxed font-mono space-y-1">
        <p class="font-bold text-primary text-sm mb-2">【ろ過昇温計算式】</p>
        <p>1. ろ過循環流量 Q_filter = 浴槽容量 V × 循環回数 n ÷ 60分 = ${r.totalBathVol.toLocaleString()} L × ${p.nfilter} 回/h ÷ 60分 = <strong>${r.Q_filter.toFixed(1)} L/min</strong></p>
        <p>2. 維持能力 Q_hex = 循環流量 Q_filter × 二次側温度差 ΔT₂ × 比熱 4.186 ÷ 60 = ${r.Q_filter.toFixed(1)} L/min × ${p.dt2}℃ × 4.186 ÷ 60 = <strong>${r.Q_hex.toFixed(2)} kW</strong></p>
        ${p.useQfill?`<p>3. 初期湯はり能力 Q_fill = (浴槽容量 V × (設定温度 T_set − 給水 tc) × 4.186) ÷ (時間 T_fill × 3600) = (${r.totalBathVol.toLocaleString()}L × (${p.tset}℃ − ${r.tc}℃) × 4.186) ÷ (${p.tfill}h × 3600) = <strong>${r.Q_fill.toFixed(2)} kW</strong></p>
        <p>4. 設計熱源能力 Q_design = max(Q_hex, Q_fill) × 余裕係数 K = ${Math.max(r.Q_hex,r.Q_fill).toFixed(2)} kW × ${r.K} = <strong>${r.Q_design.toFixed(1)} kW</strong></p>` : `<p>3. 設計熱源能力 Q_design = 維持能力 Q_hex × 余裕係数 K = ${r.Q_hex.toFixed(2)} kW × ${r.K} = <strong>${r.Q_design.toFixed(1)} kW</strong></p>`}
        <p>${p.useQfill?'5':'4'}. 一次側必要流量 Q_primary = 維持能力 Q_hex × 860 ÷ (一次側温度差 ΔT₁ × 60分) = ${r.Q_hex.toFixed(2)} kW × 860 ÷ (${p.dt1}℃ × 60) = <strong>${r.Q_primary.toFixed(1)} L/min</strong></p>
        <p>${p.useQfill?'6':'5'}. 熱源機選定基準号数 = 設計熱源能力 Q_design × 860 ÷ 60分 ÷ 25℃ = <strong>${r.reqGo.toFixed(1)} 号相当</strong></p>
        <p>${p.useQfill?'7':'6'}. 機器台数選定 = ${r.reqGo.toFixed(1)} 号 ÷ 機器能力 ${r.unitcap} 号 = 算定台数 ${r.heatUnits}台 → 最終選定: <strong>${r.finalUnits}台</strong></p>
      </div>
      <div class="bg-primary text-white p-5 grid grid-cols-2 gap-6 mb-8">
        <div><p class="text-[10px] opacity-70 font-['Work_Sans'] uppercase tracking-widest mb-1">Design Heating Capacity (Q_design)</p><div class="flex items-baseline gap-2"><span class="text-3xl font-bold">${r.Q_design.toFixed(1)}</span><span>kW</span><span class="text-sm opacity-80 ml-2">(${(r.Q_design*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h)</span></div></div>
        <div class="border-l border-white/20 pl-5"><p class="text-[10px] opacity-70 font-['Work_Sans'] uppercase tracking-widest mb-1">Equipment Selection</p><p class="text-lg font-bold">${r.unitcap}号機 × ${r.finalUnits}台</p></div>
      </div>
    </div>`;
    }
  });
  // 機器まとめ
  html+=`<div class="report-page bg-white page-break">
    <h2 class="text-xl font-bold text-primary border-l-4 border-secondary pl-4 mb-5">${state.systems.length+2}. 算出機器一覧（まとめ）</h2>
    <div class="space-y-3 mb-8">
      ${state.systems.filter(s=>s.result).map((sys,i)=>{
        const r=sys.result;
        let kwStr = "";
        if(r.isMulti) {
          kwStr = `${Math.ceil(Math.max(r.gosuA,r.unitsB*r.unitcap))} 号相当`;
        } else {
          const kw=r.isPat4?r.Q_design.toFixed(1):r.H_total.toFixed(1);
          kwStr = `${kw} kW <span class="text-xs font-normal text-slate-500 ml-1">(${(parseFloat(kw)*860).toLocaleString(undefined,{maximumFractionDigits:0})} kcal/h)</span>`;
        }
        return `<div class="flex items-center justify-between p-4 border border-slate-100 bg-white">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-primary-container text-secondary flex items-center justify-center font-bold text-sm">${i+1}</div>
            <div><p class="text-xs text-slate-400 uppercase">${patLabels[sys.pat]||sys.pat}</p><p class="font-bold text-primary">${sys.name} — ${r.unitcap}号機 × ${r.finalUnits}台</p></div>
          </div>
          <div class="text-right"><p class="text-sm font-bold">${kwStr}</p></div>
        </div>`;
      }).join('')}
    </div>
    <div class="p-5 border border-primary/10 mt-4">
      <p class="text-[10px] font-['Work_Sans'] text-slate-400 uppercase tracking-widest mb-1">Total Heat Load</p>
      <div class="flex items-center gap-3"><span class="text-3xl font-bold text-primary">${totalKw.toFixed(1)} <span class="text-sm font-normal text-slate-500">kW</span></span><span class="text-xl font-bold text-primary">(${(totalKw*860).toLocaleString(undefined,{maximumFractionDigits:0})} <span class="text-sm font-normal text-slate-500">kcal/h</span>)</span></div>
      ${totalQhm>0?`<p class="text-sm text-slate-500 mt-2">直圧・循環系統合計 Qhm: ${fmt(totalQhm)} L/h</p>`:''}
    </div>
    <div class="mt-8 p-5 border border-slate-200">
      <h3 class="font-bold text-primary mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-sm">info</span>設計上の注意</h3>
      <ul class="text-xs space-y-2 list-disc list-inside text-on-surface-variant">
        <li>本計算書はピーク時同時使用率を想定したものであり、実運用の負荷変動により差異が生じる場合があります。</li>
        <li>ガス供給配管径および給水・給湯配管径については、別途管径計算により決定してください。</li>
        <li>ろ過昇温系統については、熱交換器の一次側流量および温度設定が適切であることを確認してください。</li>
        <li>実際の機器選定・導入にあたっては専門の設備設計者・施工業者の確認を受けてください。</li>
      </ul>
    </div>
  </div>`;

  document.getElementById('report-content').innerHTML=html;
  refreshSummary();
}


// ===================== 保存・読込 =====================
function saveProject(){
  const projectName=document.getElementById('common-name').value||'給湯計算プロジェクト';
  const data={
    version:'2.0',
    savedAt:new Date().toISOString(),
    common:{
      name:projectName,
      pref:document.getElementById('common-pref').value,
      tc:document.getElementById('common-tc').value,
      k:document.getElementById('common-k').value,
      facility:document.getElementById('common-facility').value,
      author:document.getElementById('common-author').value,
      gasType:document.querySelector('input[name="gas-type"]:checked')?.value||'13A'
    },
    systems:state.systems
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${projectName.replace(/[\/\\?*:|"<>]/g,'_')}.json`;
  a.click();
}

function loadProject(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.common||!data.systems) throw new Error('フォーマット不正');
      const c=data.common;
      document.getElementById('common-name').value=c.name||'';
      if(c.pref) document.getElementById('common-pref').value=c.pref;
      document.getElementById('common-tc').value=c.tc||8;
      document.getElementById('common-k').value=c.k||DEFAULT_K;
      if(c.facility) document.getElementById('common-facility').value=c.facility;
      document.getElementById('common-author').value=c.author||'';
      const gasRadio=document.querySelector(`input[name="gas-type"][value="${c.gasType||'13A'}"]`);
      if(gasRadio){ gasRadio.checked=true; gasRadio.closest('label').className='flex-1 text-center py-2 px-3 rounded-sm text-sm cursor-pointer bg-white text-secondary font-bold shadow-sm'; }
      state.systems=data.systems||[];
      sysCounter=state.systems.reduce((m,s)=>Math.max(m,s.id),0);
      document.getElementById('side-project-name').textContent=c.name||'プロジェクト';
      showPage('systems');
      alert(`「${c.name}」を読み込みました。`);
    } catch(err){ alert('ファイルの読み込みに失敗しました: '+err.message); }
    event.target.value='';
  };
  reader.readAsText(file);
}

// ===================== 初期化 =====================
document.addEventListener('DOMContentLoaded',()=>{
  initPrefSelect();
  // Gasラジオボタンの見た目切り替え
  document.querySelectorAll('input[name="gas-type"]').forEach(radio=>{
    radio.addEventListener('change',function(){
      document.querySelectorAll('input[name="gas-type"]').forEach(r=>{
        const lbl=r.closest('label');
        if(r.checked) lbl.className='flex-1 text-center py-2 px-3 rounded-sm text-sm cursor-pointer bg-white text-secondary font-bold shadow-sm';
        else lbl.className='flex-1 text-center py-2 px-3 rounded-sm text-sm cursor-pointer text-slate-500 hover:bg-slate-200/50 transition-colors';
      });
    });
  });
});

// ===================== 単体給湯計算モード =====================
function showIndivTab(tabId) {
  document.querySelectorAll('.indiv-sec').forEach(el => el.classList.add('hidden'));
  document.getElementById('indiv-sec-' + tabId).classList.remove('hidden');
  
  document.querySelectorAll('#indiv-tabs button').forEach(btn => {
    btn.classList.remove('text-primary', 'border-secondary');
    btn.classList.add('text-slate-500', 'border-transparent');
  });
  const activeBtn = document.getElementById('indiv-tab-' + tabId);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-500', 'border-transparent');
    activeBtn.classList.add('text-primary', 'border-secondary');
  }
}

function calcIndivShower() {
  const tc = parseFloat(document.getElementById('indiv-sh-tcin').value) || 5;
  const th = parseFloat(document.getElementById('indiv-sh-thout').value) || 42;
  const flow = parseFloat(document.getElementById('indiv-sh-flow').value) || 10;
  
  const heat = (th - tc) * flow * 60; // kcal/h
  const cap = heat / 60 / 25;       // 号
  const kw = heat * 0.00116;        // kW

  document.getElementById('indiv-res-sh-cap').textContent = cap.toFixed(1);
  document.getElementById('indiv-res-sh-heat').textContent = heat.toLocaleString();
  document.getElementById('indiv-res-sh-kw').textContent = kw.toFixed(1);
  
  document.getElementById('indiv-formula-shower').innerHTML = 
    `【計算式】<br/>` +
    `1. 必要熱量 Q = (出湯 ${th}℃ - 給水 ${tc}℃) × 流量 ${flow}L/min × 60分 = ${heat.toLocaleString()} kcal/h<br/>` +
    `2. 必要号数 Cap = 必要熱量 ${heat.toLocaleString()} kcal/h ÷ 60分 ÷ 25℃ = ${cap.toFixed(2)} 号`;
  
  document.getElementById('indiv-res-shower').classList.remove('hidden');
}

function calcIndivMaxFlow() {
  const tc = parseFloat(document.getElementById('indiv-mf-tcin').value) || 5;
  const th = parseFloat(document.getElementById('indiv-mf-thout').value) || 42;
  const cap = parseFloat(document.getElementById('indiv-mf-cap').value) || 16;

  const maxFlow = cap * 25 / (th - tc);

  document.getElementById('indiv-res-mf-flow').textContent = maxFlow.toFixed(1);
  
  document.getElementById('indiv-formula-maxflow').innerHTML = 
    `【計算式】<br/>` +
    `1. 最大出湯量 F = 機器号数 ${cap}号 × 25℃ ÷ (出湯 ${th}℃ - 給水 ${tc}℃) = ${maxFlow.toFixed(2)} L/min`;

  document.getElementById('indiv-res-maxflow').classList.remove('hidden');
}

function calcIndivBath() {
  const tc = parseFloat(document.getElementById('indiv-ba-tcin').value) || 5;
  const th = parseFloat(document.getElementById('indiv-ba-thout').value) || 42;
  const vol = parseFloat(document.getElementById('indiv-ba-vol').value) || 200;
  const time = parseFloat(document.getElementById('indiv-ba-time').value) || 15;

  const heat = (th - tc) * vol; // kcal (1回分)
  const flowReq = vol / time;   // L/min
  const cap = flowReq * (th - tc) / 25; // 号

  document.getElementById('indiv-res-ba-cap').textContent = cap.toFixed(1);
  document.getElementById('indiv-res-ba-heat').textContent = heat.toLocaleString();

  document.getElementById('indiv-formula-bath').innerHTML = 
    `【計算式】<br/>` +
    `1. 必要流量 F = 浴槽容量 ${vol}L ÷ 時間 ${time}分 = ${flowReq.toFixed(1)} L/min<br/>` +
    `2. 湯はり熱量 Q = (湯はり ${th}℃ - 給水 ${tc}℃) × 浴槽容量 ${vol}L = ${heat.toLocaleString()} kcal<br/>` +
    `3. 必要号数 Cap = 必要流量 ${flowReq.toFixed(1)} L/min × (湯はり ${th}℃ - 給水 ${tc}℃) ÷ 25℃ = ${cap.toFixed(2)} 号`;

  document.getElementById('indiv-res-bath').classList.remove('hidden');
}

function calcIndivMixed() {
  const tc = parseFloat(document.getElementById('indiv-mx-tcin').value) || 5;
  const thSet = parseFloat(document.getElementById('indiv-mx-thset').value) || 60;
  const thMix = parseFloat(document.getElementById('indiv-mx-thmix').value) || 42;
  const cap = parseFloat(document.getElementById('indiv-mx-cap').value) || 16;

  const hotFlow = cap * 25 / (thSet - tc);
  const totalFlow = hotFlow * (thSet - tc) / (thMix - tc);
  const coldFlow = totalFlow - hotFlow;

  document.getElementById('indiv-res-mx-total').textContent = totalFlow.toFixed(1);
  document.getElementById('indiv-res-mx-hot').textContent = hotFlow.toFixed(1);
  document.getElementById('indiv-res-mx-cold').textContent = coldFlow.toFixed(1);

  document.getElementById('indiv-formula-mixed').innerHTML = 
    `【計算式】<br/>` +
    `1. 給湯器(${thSet}℃)の出湯量 F_hot = 設定号数 ${cap}号 × 25℃ ÷ (給湯 ${thSet}℃ - 給水 ${tc}℃) = ${hotFlow.toFixed(2)} L/min<br/>` +
    `2. 混合水(${thMix}℃)の総流量 F_total = 出湯量 ${hotFlow.toFixed(2)} L/min × (給湯 ${thSet}℃ - 給水 ${tc}℃) ÷ (混合 ${thMix}℃ - 給水 ${tc}℃) = ${totalFlow.toFixed(2)} L/min<br/>` +
    `3. 水使用量 F_cold = 総流量 ${totalFlow.toFixed(2)} L/min - 給湯量 ${hotFlow.toFixed(2)} L/min = ${coldFlow.toFixed(2)} L/min`;

  document.getElementById('indiv-res-mixed').classList.remove('hidden');
}


