/* © 2026 Nozomi Sakurada. All rights reserved. */
// =================================================================
// 地方・エリア分類マスタ
// =================================================================
const REGION_MAP = {
  "北海道地方": ["北海道"],
  "東北地方": ["青森県","岩手県","宮城県","秋田県","山形県","福島県"],
  "関東地方": ["茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県"],
  "中部地方": ["新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県"],
  "近畿地方": ["三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県"],
  "中国地方": ["鳥取県","島根県","岡山県","広島県","山口県"],
  "四国地方": ["徳島県","香川県","愛媛県","高知県"],
  "九州・沖縄地方": ["福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]
};

// ... エリア辞書 ...
const AREA_DICT = {
  "北海道": {"石狩・空知・後志":["札幌","江別","千歳","恵庭","北広島","石狩","小樽","夕張","岩見沢","美唄","芦別","赤平","三笠","滝川","砂川","歌志内","深川"],"渡島・檜山":["函館","北斗"],"胆振・日高":["室蘭","苫小牧","登別","伊達"],"上川・留萌":["旭川","名寄","富良野","士別","留萌"],"宗谷・網走":["稚内","北見","網走","紋別"],"十勝・釧路・根室":["帯広","釧路","根室"]},
  "青森県": {"津軽":["青森市","弘前市","黒石市","五所川原市","つがる市","平川市"],"南部":["八戸市","十和田市","三沢市"],"下北":["むつ市"]},
  "岩手県": {"内陸":["盛岡","奥州","一関","花巻","北上"],"沿岸":["宮古","大船渡","釜石","陸前高田"]},
  "宮城県": {"仙台圏":["仙台","塩竈","名取","多賀城","岩沼"],"県北":["石巻","気仙沼","大崎","登米","栗原"],"県南":["白石","角田"]},
  "秋田県": {"県北":["能代","大館","鹿角"],"中央":["秋田市","男鹿","潟上"],"県南":["横手","大仙","湯沢","由利本荘"]},
  "山形県": {"村山":["山形市","天童","寒河江","上山","東根"],"最上":["新庄"],"置賜":["米沢","南陽","長井"],"庄内":["鶴岡","酒田"]},
  "福島県": {"中通り":["福島市","郡山","白河","二本松"],"浜通り":["いわき","相馬","南相馬"],"会津":["会津若松","喜多方"]},
  "茨城県": {"県北":["日立","ひたちなか"],"県央":["水戸","笠間","那珂"],"鹿行":["鹿嶋","潮来","神栖","鉾田"],"県南":["つくば","土浦","牛久","取手","守谷"],"県西":["古河","筑西","結城","常総"]},
  "栃木県": {"県央":["宇都宮","鹿沼"],"県南":["小山","栃木市","足利","佐野"],"県北":["那須塩原","大田原","日光","矢板"]},
  "群馬県": {"中毛":["前橋","伊勢崎"],"西毛":["高崎","藤岡","富岡","安中"],"東毛":["太田","桐生","館林","みどり"],"北毛":["沼田","渋川"]},
  "埼玉県": {"さいたま市":["さいたま市"],"南部":["川口","蕨","戸田","和光","朝霞","新座","志木"],"県央":["上尾","桶川","北本","鴻巣"],"南西部":["川越","所沢","狭山","入間","富士見"],"東部":["越谷","草加","春日部","三郷","吉川","八潮"],"北部":["熊谷","深谷","本庄"],"秩父":["秩父"]},
  "千葉県": {"千葉市":["千葉市"],"葛南":["市川","船橋","習志野","八千代","浦安"],"東葛飾":["松戸","柏","流山","野田","我孫子","鎌ケ谷"],"北総":["成田","佐倉","四街道","八街","印西"],"東総":["銚子","旭","匝瑳"],"九十九里":["茂原","東金"],"南房総":["木更津","君津","富津","袖ケ浦","館山","鴨川","市原"]},
  "東京都": {"23区":["千代田区","中央区","港区","新宿区","文京区","台東区","墨田区","江東区","品川区","目黒区","大田区","世田谷区","渋谷区","中野区","杉並区","豊島区","北区","荒川区","板橋区","練馬区","足立区","葛飾区","江戸川区"],"多摩東部":["武蔵野","三鷹","調布","狛江","西東京","小平","東村山","国分寺","国立","小金井","府中"],"多摩西部":["立川","昭島","東大和","武蔵村山","八王子","日野","町田","多摩","稲城","青梅","羽村","福生","あきる野"]},
  "神奈川県": {"横浜":["横浜市"],"川崎":["川崎市"],"相模原":["相模原市"],"横須賀三浦":["横須賀","鎌倉","逗子","三浦"],"湘南":["藤沢","平塚","茅ヶ崎","秦野","伊勢原"],"県央":["厚木","大和","海老名","座間","綾瀬"],"足柄":["小田原","南足柄"]},
  "新潟県": {"下越":["新潟市","新発田","村上","燕"],"中越":["長岡","三条","柏崎","魚沼"],"上越":["上越"],"佐渡":["佐渡"]},
  "富山県": {"呉東":["富山市","魚津","滑川","黒部"],"呉西":["高岡","射水","氷見","砺波"]},
  "石川県": {"加賀":["金沢","白山","小松"],"能登":["七尾","輪島","珠洲"]},
  "福井県": {"嶺北":["福井市","坂井","越前","鯖江"],"嶺南":["敦賀","小浜"]},
  "山梨県": {"中北":["甲府"],"峡東":["山梨","笛吹"],"峡南":["身延"],"富士・東部":["富士吉田","都留"]},
  "長野県": {"北信":["長野市"],"東信":["上田","佐久"],"中信":["松本","塩尻"],"南信":["飯田","伊那","諏訪"]},
  "岐阜県": {"岐阜":["岐阜市"],"西濃":["大垣"],"中濃":["関","可児"],"東濃":["多治見","中津川"],"飛騨":["高山","下呂"]},
  "静岡県": {"東部":["沼津","富士"],"伊豆":["熱海","伊東"],"中部":["静岡市","焼津"],"西部":["浜松","磐田"]},
  "愛知県": {"名古屋":["名古屋市"],"尾張":["一宮","春日井"],"海部":["津島"],"知多":["半田","東海"],"西三河":["岡崎","豊田"],"東三河":["豊橋","豊川"]},
  "三重県": {"北勢":["四日市","桑名","鈴鹿"],"中南勢":["津","松阪"],"伊勢志摩":["伊勢","鳥羽"],"伊賀":["名張"],"東紀州":["尾鷲"]},
  "滋賀県": {"大津":["大津"],"南部":["草津","守山"],"甲賀":["甲賀"],"東近江":["東近江"],"湖東":["彦根"],"湖北":["長浜"]},
  "京都府": {"京都市":["京都市"],"山城":["宇治"],"南丹":["亀岡"],"中丹・丹後":["福知山","舞鶴"]},
  "大阪府": {"大阪市":["大阪市"],"堺市":["堺市"],"豊能":["豊中","吹田"],"北河内":["枚方","寝屋川"],"中河内":["東大阪","八尾"],"南河内":["富田林","松原"],"泉州":["岸和田","泉佐野"]},
  "兵庫県": {"神戸":["神戸市"],"阪神":["尼崎","西宮","芦屋","伊丹","宝塚"],"播磨":["姫路","明石","加古川"],"但馬・丹波":["豊岡","丹波"],"淡路":["洲本","淡路"]},
  "奈良県": {"北部":["奈良市","生駒","大和高田","橿原"],"南部":["吉野"]},
  "和歌山県": {"紀北":["和歌山市","橋本"],"紀中・紀南":["御坊","田辺"]},
  "鳥取県": {"東部":["鳥取市"],"中部":["倉吉"],"西部":["米子","境港"]},
  "島根県": {"松江・出雲":["松江","出雲"],"石見":["浜田","益田"],"隠岐":["隠岐"]},
  "岡山県": {"備前":["岡山市","玉野"],"備中":["倉敷","総社"],"美作":["津山"]},
  "広島県": {"広島圏":["広島市","廿日市"],"呉・東広島":["呉","東広島"],"備後":["福山","尾道"],"備北":["三次"]},
  "山口県": {"周南・岩国":["周南","岩国"],"山口・防府":["山口市","防府"],"下関・宇部":["下関","宇部"],"長門・萩":["長門","萩"]},
  "徳島県": {"東部":["徳島市","鳴門"],"南部":["阿南"],"西部":["美馬"]},
  "香川県": {"東讃":["高松","さぬき"],"中讃":["丸亀","坂出"],"西讃":["観音寺"]},
  "愛媛県": {"中予":["松山"],"東予":["今治","新居浜"],"南予":["宇和島"]},
  "高知県": {"中部":["高知市","南国"],"東部":["室戸"],"西部":["四万十"]},
  "福岡県": {"福岡":["福岡市","春日","宗像"],"北九州":["北九州"],"筑豊":["飯塚","直方"],"筑後":["久留米","大牟田"]},
  "佐賀県": {"北部":["佐賀市","唐津"],"南部":["鹿島"]},
  "長崎県": {"長崎・県央":["長崎","諫早"],"県北":["佐世保"],"島原":["島原"],"離島":["五島","対馬"]},
  "熊本県": {"県北":["玉名","阿蘇"],"県央":["熊本市","宇城"],"県南":["八代","天草"]},
  "大分県": {"中部":["大分市","別府"],"北部":["中津"],"西部":["日田"],"南部":["佐伯"]},
  "宮崎県": {"県央":["宮崎"],"県北":["延岡"],"県南・県西":["都城"]},
  "鹿児島県": {"薩摩":["鹿児島","薩摩川内"],"大隅":["鹿屋","霧島"],"離島":["奄美"]},
  "沖縄県": {"本島中南部":["那覇","沖縄"],"本島北部":["名護"],"離島":["宮古島","石垣"]}
};

function getAreaHierarchical(address) {
  address = String(address || '').trim();
  const m = address.match(/^(.*?)(都|道|府|県)/);
  if (!m) return { Region: 'その他', Prefecture: '不明', SubArea: '' };
  const pref = m[0];
  let region = 'その他';
  for (const [r, prefs] of Object.entries(REGION_MAP)) {
    if (prefs.includes(pref)) { region = r; break; }
  }
  let subArea = '全域';
  if (AREA_DICT[pref]) {
    outer: for (const [sa, cities] of Object.entries(AREA_DICT[pref])) {
      for (const c of cities) {
        if (address.includes(c)) { subArea = sa; break outer; }
      }
    }
  }
  return { Region: region, Prefecture: pref, SubArea: subArea };
}

// 読み込む列インデックス（変更を反映する場合は調整）
const TARGET_COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

let allData = [];
// 複数選択用のSet（空の場合は「全て」とみなす）
let selR = new Set();
let selP = new Set();
let selS = new Set();
let hier = {};

// 複数選択のトグル関数
function toggleFilter(level, val) {
  let targetSet;
  if (level === 'R') {
    targetSet = selR;
    // 地方が変更されたら下位フィルターをリセット
    selP.clear();
    selS.clear();
  } else if (level === 'P') {
    targetSet = selP;
    // 都道府県が変更されたら下位フィルターをリセット
    selS.clear();
  } else if (level === 'S') {
    targetSet = selS;
  }
  
  if (targetSet.has(val)) targetSet.delete(val);
  else targetSet.add(val);
  
  renderFilters();
  renderSheets();
}

// 一括クリア
function clearFilters(level) {
  if (level === 'R') { selR.clear(); selP.clear(); selS.clear(); }
  if (level === 'P') { selP.clear(); selS.clear(); }
  if (level === 'S') { selS.clear(); }
  renderFilters();
  renderSheets();
}

function setProgress(pct, msg) {
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-msg').textContent = msg;
}

function processFile(file) {
  const pw = document.getElementById('progress-wrap');
  pw.style.display = 'block';
  setProgress(5, 'Excelファイルを読み込んでいます...');

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      setProgress(30, 'データを解析しています...');
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rows.length < 2) throw new Error('データがありません（2行以上必要）');

      const headerRow = rows[0];
      // 「番組名」という名前の列を自動探索
      const ciBangumi = headerRow.findIndex(h => h && String(h).includes('番組名'));
      
      setProgress(50, 'エリア分類を行っています...');

      allData = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const d = {};
        TARGET_COLS.forEach(ci => {
          let key = (headerRow[ci] != null && String(headerRow[ci]).trim() !== '') ? String(headerRow[ci]).trim() : `col_${ci}`;
          let val = row[ci] != null ? String(row[ci]) : '';
          d[key] = val;
        });

        // 番組名の特定（見つかった列、またはインデックス2を優先）
        let bVal = '';
        if (ciBangumi !== -1) {
          bVal = row[ciBangumi] != null ? String(row[ciBangumi]) : '';
        } else if (row[2] != null) {
          bVal = String(row[2]);
        }
        
        d['__col_c_val'] = bVal.substring(0, 15);
        d['__col_c_key'] = '番組名';

        const addr = d['届け先住所1'] || d['住所1'] || d['住所'] || '';
        if (!addr) continue; 
        Object.assign(d, getAreaHierarchical(addr));
        allData.push(d);
      }

      // ソート
      allData.sort((a, b) => {
        const cmp = (x, y) => x < y ? -1 : x > y ? 1 : 0;
        return cmp(a.Region, b.Region) || cmp(a.Prefecture, b.Prefecture)
          || cmp(a.SubArea, b.SubArea) || cmp(a['受付No.']||'', b['受付No.']||'');
      });

      setProgress(80, '階層データを構築しています...');
      buildHierarchy();

      setProgress(100, `✅ ${allData.length} 件を読み込みました`);
      clearFilters('R');

      document.getElementById('welcome').style.display = 'none';
      document.getElementById('sheet-wrap').style.display = 'flex';
      document.getElementById('print-btn').disabled = false;

    } catch(err) {
      setProgress(0, '❌ エラー: ' + err.message);
      alert('Excelの読み込みに失敗しました。\n\nエラー詳細:\n' + err.message
        + '\n\n【確認事項】\n・Excelのパスワードが解除されていますか？\n・正しいExcelファイルですか？');
    }
  };
  reader.readAsArrayBuffer(file);
}

function buildHierarchy() {
  hier = { '全エリア': { count: allData.length, prefs: {} } };
  for (const d of allData) {
    const r = d.Region || 'その他', p = d.Prefecture || '不明', s = d.SubArea || '全域';
    if (!hier[r]) hier[r] = { count: 0, prefs: {} };
    hier[r].count++;
    if (!hier[r].prefs[p]) hier[r].prefs[p] = { count: 0, subs: {} };
    hier[r].prefs[p].count++;
    if (!hier[r].prefs[p].subs[s]) hier[r].prefs[p].subs[s] = { count: 0 };
    hier[r].prefs[p].subs[s].count++;
  }
}

// =================================================================
// フィルタUI描画処理
// =================================================================
function makePill(label, cnt, isActive, isAllPill, onClick) {
  const el = document.createElement('div');
  el.className = 'pill' + (isActive ? ' active' : '') + (isAllPill ? ' all-pill' : '');
  el.innerHTML = `${label}<span class="cnt">(${cnt})</span>`;
  el.onclick = onClick;
  return el;
}

function renderFilters() {
  const rp = document.getElementById('r-pills');
  const pp = document.getElementById('p-pills');
  const sp = document.getElementById('s-pills');
  rp.innerHTML = ''; pp.innerHTML = ''; sp.innerHTML = '';

  // --- 地方 ---
  rp.appendChild(makePill('すべて', hier['全エリア'].count, selR.size === 0, true, () => clearFilters('R')));
  Object.keys(hier).filter(k => k !== '全エリア').sort().forEach(r => {
    rp.appendChild(makePill(r.replace('地方', ''), hier[r].count, selR.has(r), false, () => toggleFilter('R', r)));
  });

  // --- 都道府県 ---
  const prefRow = document.getElementById('pref-row');
  const subRow = document.getElementById('sub-row');

  // 地方が何か1つでも選択されていれば、該当地方の都道府県を表示
  if (selR.size > 0) {
    prefRow.style.display = 'block';
    let totalPrefCount = 0;
    let availablePrefs = new Map();

    selR.forEach(r => {
      if (hier[r]) {
        totalPrefCount += hier[r].count;
        Object.keys(hier[r].prefs).forEach(p => availablePrefs.set(p, hier[r].prefs[p].count));
      }
    });

    pp.appendChild(makePill('すべて', totalPrefCount, selP.size === 0, true, () => clearFilters('P')));
    Array.from(availablePrefs.keys()).sort().forEach(p => {
      pp.appendChild(makePill(p, availablePrefs.get(p), selP.has(p), false, () => toggleFilter('P', p)));
    });

    // --- 詳細エリア ---
    if (selP.size > 0) {
      let totalSubCount = 0;
      let availableSubs = new Map();
      let hasDistinctSubArea = false;

      selR.forEach(r => {
        if (!hier[r]) return;
        selP.forEach(p => {
          if (hier[r].prefs[p]) {
            totalSubCount += hier[r].prefs[p].count;
            const subs = hier[r].prefs[p].subs;
            if (Object.keys(subs).length > 1 || !subs['全域']) hasDistinctSubArea = true;
            Object.keys(subs).forEach(s => {
              availableSubs.set(s, (availableSubs.get(s) || 0) + subs[s].count);
            });
          }
        });
      });

      if (hasDistinctSubArea) {
        subRow.style.display = 'block';
        sp.appendChild(makePill('すべて', totalSubCount, selS.size === 0, true, () => clearFilters('S')));
        Array.from(availableSubs.keys()).sort().forEach(s => {
          sp.appendChild(makePill(s, availableSubs.get(s), selS.has(s), false, () => toggleFilter('S', s)));
        });
      } else {
        subRow.style.display = 'none';
      }
    } else {
      subRow.style.display = 'none';
    }
  } else {
    prefRow.style.display = 'none';
    subRow.style.display = 'none';
  }
}

// =================================================================
// シート生成（画像ベースに変更）
// =================================================================
function makeSheet(c) {
  const tag = [c.Prefecture, c.SubArea].filter(Boolean).join(' ');
  const addr = (c['届け先住所1'] || '') + (c['届け先住所2'] || '');
  
  let recvDate = c['受付日'] || '';
  if (recvDate) {
    const d = new Date(recvDate);
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      recvDate = `${mm}月${dd}日`;
    } else {
      // 変換失敗時は元の10文字を表示
      recvDate = recvDate.substring(0, 10);
    }
  }
  
  return `
<div class="sheet" style="display:flex; flex-direction:column;">
  <div class="area-badge">${tag}</div>
  <div class="sheet-header" style="position:relative;">
    レンジフード 現地調査シート
    <div style="position:absolute; right:0; bottom:2px; font-size:9pt; font-weight:normal; letter-spacing:0;">管理番号：<span style="display:inline-block; width:35mm; border-bottom:1px solid #333;"></span></div>
  </div>
  
  <div class="ticket-row">
    <span>${c['__col_c_key']}：</span><strong>${c['__col_c_val'] || '(空データ)'}</strong>
    <span>伝票番号：</span><strong>${c['伝票番号'] || ''}</strong>
    <span>受付No：</span><strong>${c['受付No.'] || ''}</strong>
    <span>受付日：</span><strong>${recvDate}</strong>
  </div>
  
  <table class="info-table">
    <tr class="tall"><th>お客様名</th><td>${c['届け先カナ氏名'] || ''}</td></tr>
    <tr class="tall"><th>郵便番号</th><td>${c['届け先郵便番号'] || ''}</td></tr>
    <tr class="tall"><th>住所</th><td style="font-size: 8.5pt;">${addr}</td></tr>
    <tr class="tall"><th>電話番号①</th><td>${c['届け先電話番号1'] || ''}</td></tr>
    <tr class="tall"><th>電話番号②</th><td>${c['届け先電話番号2'] || ''}</td></tr>
    <tr class="tall"><th>商品名(型番)</th><td>${c['型番'] || ''}</td></tr>
    <tr class="tall"><th>支払方法</th><td>${c['支払方法'] || ''}</td></tr>
    <tr><th>連絡事項</th><td style="min-height:22px; font-size:8pt;">${c['放送局情報'] || ''}</td></tr>
  </table>

  <!-- 追加要望：日程・既存情報手書き欄 -->
  <!-- 日付行：連絡簿・現地調査・工事予定を等幅にするため独立したテーブルにする -->
  <table style="width:100%; border-collapse: collapse; font-size: 8.5pt; table-layout: fixed;">
    <tr>
      <th style="width:11%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">連絡日</th>
      <td style="width:19%; border:1px solid #333; padding:4px; text-align:center; letter-spacing:0.05em;">月　日（ 　）</td>
      <th style="width:11%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">現地調査日</th>
      <td style="width:24%; border:1px solid #333; padding:4px; text-align:center; letter-spacing:0.02em;">
        月　日（ 　）<br><span style="letter-spacing: 0.8em;">　: 〜 :　</span>
      </td>
      <th style="width:11%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">工事予定日時</th>
      <td style="width:24%; border:1px solid #333; padding:4px; text-align:center; letter-spacing:0.02em;">
        月　日（ 　）<br><span style="letter-spacing: 0.8em;">　: 〜 :　</span>
      </td>
    </tr>
  </table>

  <!-- 工事候補日行 -->
  <table style="width:100%; border-collapse: collapse; margin-top: -1px; font-size: 8.5pt; table-layout: fixed;">
    <tr>
      <th style="width:11%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">工事候補日</th>
      <td style="width:89%; border:1px solid #333; padding:4px;"></td>
    </tr>
  </table>

  <!-- 既存情報行：型式欄を広く、年式欄を狭くする -->
  <table style="width:100%; border-collapse: collapse; margin-top: -1px; font-size: 8.5pt; table-layout: fixed;">
    <tr>
      <th style="width:11%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">既存メーカー</th>
      <td style="width:20%; border:1px solid #333; padding:4px;"></td>
      <th style="width:8%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">型式</th>
      <td style="width:45%; border:1px solid #333; padding:4px;"></td>
      <th style="width:8%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">年式</th>
      <td style="width:8%; border:1px solid #333; padding:4px;"></td>
    </tr>
  </table>

  <!-- 下地行 -->
  <table style="width:100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 10px; font-size: 8.5pt; table-layout: fixed;">
    <tr>
      <th style="width:11%; border:1px solid #333; background:#e8edf2; padding:4px; font-weight:700;">下地の有無</th>
      <td style="width:89%; border:1px solid #333; padding:4px;">
        <div style="display:flex; gap:24px; padding-left: 10px;">
          <label>□ あり</label>
          <label>□ なし</label>
          <label>□ 不明</label>
        </div>
      </td>
    </tr>
  </table>

  <!-- 画像として現場調査シート（参考画像）を配置 -->
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; overflow:hidden;">
    <img src="assets/レンジフード現場調査シート.png" alt="レンジフード現場調査シート" style="width:100%; max-height:150mm; object-fit:contain;">
  </div>
</div>`;
}

// =================================================================
// シート描画
// =================================================================
function renderSheets() {
  let data = allData;
  if (selR.size > 0) data = data.filter(d => selR.has(d.Region));
  if (selP.size > 0) data = data.filter(d => selP.has(d.Prefecture));
  if (selS.size > 0) data = data.filter(d => selS.has(d.SubArea));

  document.getElementById('stats-count').textContent = data.length;
  document.getElementById('stats-total').textContent = `全 ${allData.length} 件中`;
  document.getElementById('sheet-wrap').innerHTML = data.map(makeSheet).join('');
}

// =================================================================
// ファイル入力イベント
// =================================================================
const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileNameEl = document.getElementById('file-name');

fileInput.addEventListener('change', function() {
  if (this.files[0]) handleFile(this.files[0]);
});

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  fileNameEl.textContent = '📄 ' + file.name;
  processFile(file);
}
// Lucide初期化
lucide.createIcons();