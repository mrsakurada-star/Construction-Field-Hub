/* © 2026 Nozomi Sakurada. All rights reserved. */

// ===== 都道府県別給水温度（冬期最低値） =====
const PREFECTURE_TC_MAP = {
  "北海道":3,"青森県":4,"岩手県":4,"秋田県":4,"宮城県":5,"山形県":5,"福島県":5,
  "茨城県":7,"栃木県":7,"群馬県":7,"埼玉県":8,"千葉県":8,"東京都":8,"神奈川県":8,
  "新潟県":9,"長野県":9,"山梨県":9,"静岡県":9,"富山県":9,"石川県":9,"福井県":9,
  "愛知県":10,"岐阜県":10,"三重県":10,
  "大阪府":11,"京都府":11,"兵庫県":11,"奈良県":11,"滋賀県":11,"和歌山県":11,
  "鳥取県":11,"島根県":11,"岡山県":11,"広島県":11,"山口県":11,
  "徳島県":12,"香川県":12,"愛媛県":12,"高知県":12,
  "福岡県":13,"佐賀県":13,"長崎県":13,"熊本県":13,"大分県":13,
  "宮崎県":14,"鹿児島県":14,"沖縄県":18
};

// ===== 施設種別プリセット =====
const FACILITY_LABELS = {
  bizhotel:    "ビジネスホテル",
  leisurehotel:"レジャーホテル",
  hotel:       "ホテル・旅館",
  hospital:    "病院・医療施設",
  nursing:     "介護・老健施設",
  sports:      "スポーツ施設",
  school:      "学校・教育施設",
  factory:     "工場・作業場",
  apartment:   "集合住宅",
  office:      "オフィス"
};

// ===== 同時使用率テーブル（設計資料073-8 P.8 + 建備基準補完） =====
const PURPOSE_USAGE_RATE = {
  nursing:     {vals:[[3,90],[5,78],[10,60],[15,50],[20,43],[25,38],[30,35]],     cap:35, src:'設計資料073-8 P.8'},
  bizhotel:    {vals:[[3,90],[5,72],[10,55],[20,41],[40,29],[60,25],[80,23],[100,21],[120,20]], cap:20, src:'設計資料073-8 P.8'},
  leisurehotel:{vals:[[3,100],[5,100],[10,76],[20,53],[30,43],[40,38],[50,34]],   cap:34, src:'設計資料073-8 P.8'},
  sports:      {vals:[[3,100],[5,100],[10,100],[15,90],[20,85],[25,83],[30,80],[35,78],[40,76]], cap:76, src:'設計資料073-8 P.8'},
  hotel:       {vals:[[3,90],[5,72],[10,55],[20,41],[40,29],[60,25],[80,23],[100,21],[120,20]], cap:20, src:'建備付録'},
  hospital:    {vals:[[2,90],[5,80],[10,70],[20,60],[30,55],[50,50]],             cap:45, src:'建備付録'},
  school:      {vals:[[2,90],[5,80],[10,70],[20,65],[30,60],[50,55]],             cap:50, src:'建備付録'},
  factory:     {vals:[[2,90],[5,80],[10,65],[20,55],[30,50]],                     cap:45, src:'建備付録'},
  apartment:   {vals:[[2,90],[5,70],[10,50],[20,40],[30,35],[50,30]],             cap:25, src:'建備付録'},
  office:      {vals:[[2,90],[5,80],[10,65],[20,55],[30,50]],                     cap:45, src:'建備付録'}
};

// ===== 貯湯タンク方式向け ピーク継続時間（h） =====
const PEAK_CONTINUATION_HOURS = {
  bizhotel:2.0, leisurehotel:2.0, hotel:2.0, hospital:2.0,
  nursing:2.0, sports:2.0,
  school:1.0, factory:1.0, apartment:1.0, office:1.0,
  default:1.5
};

// ===== 器具別固定号数（設計資料073-8 P.7） =====
const MULTI_FIXTURE = {
  shower:  {gosu:15, flow:10, tempOut:42, label:'シャワー・浴室カラン'},
  wash:    {gosu:9,  flow:6,  tempOut:40, label:'手洗い（洗面）カラン'},
  kitchen: {gosu:25, flow:12, tempOut:60, label:'厨房カラン（60℃直供給）'},
  bath:    {gosu:null, flow:null, tempOut:44, label:'ふろ給湯（大浴場）', tempOutdoor:48}
};

// ===== 配管口径選定テーブル（設計資料073-8 P.9） =====
const PIPE_SIZE_TABLE = [
  {maxUnits:1,  kyusuiA:'20A', kyutoA:'20A', maxFlowTotal:18},
  {maxUnits:2,  kyusuiA:'25A', kyutoA:'25A', maxFlowTotal:36},
  {maxUnits:3,  kyusuiA:'32A', kyutoA:'32A', maxFlowTotal:53},
  {maxUnits:5,  kyusuiA:'40A', kyutoA:'40A', maxFlowTotal:89},
  {maxUnits:10, kyusuiA:'50A', kyutoA:'50A', maxFlowTotal:178},
  {maxUnits:15, kyusuiA:'65A', kyutoA:'65A', maxFlowTotal:267},
  {maxUnits:20, kyusuiA:'80A', kyutoA:'80A', maxFlowTotal:356}
];

// ===== 膨張タンク定数（パーパス業務用カタログ2021 P.93） =====
const EXPANSION_S = [{t:60, s:0.0151}, {t:70, s:0.0204}];
const EXPANSION_TANK_STEPS = [8,12,20,30,50,80,100,200,500,1000];
const UNIT_INTERNAL_VOL = {'GS-S3200GW':3.5, 'PG-H500W':5.0, 'default':4.0};

// ===== 機器仕様マスター =====
const UNIT_SPEC = {
  16:  {power:65,  gasType:'13A/LPG', conn:'15A'},
  20:  {power:80,  gasType:'13A/LPG', conn:'20A'},
  24:  {power:95,  gasType:'13A/LPG', conn:'20A'},
  32:  {power:105, gasType:'13A/LPG', conn:'20A'},
  50:  {power:140, gasType:'13A/LPG', conn:'25A'}
};

// ===== 器具プリセット [名称, Hq瞬間式(L/h), Hq貯湯式(L/h)] =====
const FIXTURE_PRESETS = {
  room: [
    ["洗面台（客室）",      7.6,   30.0],
    ["シャワー（客室）",   114.0, 120.0],
    ["浴槽（客室）",        76.0, 240.0],
    ["台所カラン（客室）", 208.0, 180.0]
  ],
  bath: [
    ["シャワー（大浴場）", 338.0, 120.0],
    ["洗面台（大浴場）",     7.6,  30.0],
    ["上がり湯（大浴場）",  84.0,  84.0]
  ],
  kitchen: [
    ["流し台カラン（厨房）",   208.0, 180.0],
    ["食洗機業務用100食",      760.0, 600.0],
    ["掃除流し",               139.0, 180.0]
  ]
};

const ZONE_LABELS = {room:"客室", bath:"大浴場", kitchen:"厨房"};
const DEFAULT_K = 1.1;
const GAS_70KW_THRESHOLD = 70;
