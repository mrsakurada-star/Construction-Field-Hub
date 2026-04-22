/* © 2026 Nozomi Sakurada. All rights reserved. */

let costChart = null;

const DATA = {
    householdEnergy: {
        "2": 3500000,
        "3": 5000000,
        "4": 6500000,
        "5": 8000000
    },
    efficiencies: {
        standard: 0.80,    // 従来型ガス
        ecojours: 0.95,    // エコジョーズ
        hybrid: 1.25,      // ハイブリッド (電気+ガス複合効率換算)
        ecocute: 3.5,      // エコキュート (COP)
        enefarm: 0.95,     // エネファーム (熱効率+発電による相殺換算)
        ecofeel: 0.95,     // エコフィール (高効率石油)
        oil: 0.85,         // 従来型石油
        electric: 0.90     // 電気温水器
    },
    calorificValue: {
        "13A": 11000,      // 都市ガス kcal/m3
        "LPG": 24000       // プロパン kcal/m3
    },
    colors: {
        standard: '#9e9e94',
        ecojours: '#6b6b60',
        oil: '#8b5a2b',
        electric: '#2b755f',
        hybrid: '#4a6741',
        ecocute: '#2b5f75',
        enefarm: '#8b7d3a',
        ecofeel: '#754b2b'
    },
    names: {
        standard: '従来型ガス',
        ecojours: 'エコジョーズ',
        oil: '従来型石油',
        electric: '電気温水器',
        hybrid: 'ハイブリッド',
        ecocute: 'エコキュート',
        enefarm: 'エネファーム',
        ecofeel: 'エコフィール'
    },
    averageCosts: {
        standard: 150000,
        ecojours: 250000,
        oil: 200000,
        electric: 350000,
        hybrid: 700000,
        ecocute: 550000,
        enefarm: 1400000,
        ecofeel: 300000
    },
    powerPrices: {
        hokkaido: { day: 36.0, night: 28.0 },
        tohoku: { day: 34.0, night: 26.0 },
        tepco: { day: 30.0, night: 25.0 },
        chubu: { day: 30.0, night: 24.0 },
        hokuriku: { day: 26.0, night: 20.0 },
        kansai: { day: 27.0, night: 21.0 },
        chugoku: { day: 31.0, night: 24.0 },
        shikoku: { day: 30.0, night: 24.0 },
        kyushu: { day: 25.0, night: 18.0 },
        okinawa: { day: 35.0, night: 30.0 }
    },
    prefToPowerCo: {
        hokkaido: "hokkaido",
        aomori:"tohoku", iwate:"tohoku", miyagi:"tohoku", akita:"tohoku", yamagata:"tohoku", fukushima:"tohoku", niigata:"tohoku",
        tochigi:"tepco", gunma:"tepco", ibaraki:"tepco", saitama:"tepco", chiba:"tepco", tokyo:"tepco", kanagawa:"tepco", yamanashi:"tepco", 
        toyama:"hokuriku", ishikawa:"hokuriku", fukui:"hokuriku",
        nagano:"chubu", gifu:"chubu", shizuoka:"chubu", aichi:"chubu", mie:"chubu",
        shiga:"kansai", kyoto:"kansai", osaka:"kansai", hyogo:"kansai", nara:"kansai", wakayama:"kansai",
        tottori:"chugoku", shimane:"chugoku", okayama:"chugoku", hiroshima:"chugoku", yamaguchi:"chugoku",
        tokushima:"shikoku", kagawa:"shikoku", ehime:"shikoku", kochi:"shikoku",
        fukuoka:"kyushu", saga:"kyushu", nagasaki:"kyushu", kumamoto:"kyushu", oita:"kyushu", miyazaki:"kyushu", kagoshima:"kyushu",
        okinawa:"okinawa"
    },
    climateFactor: {
        hokkaido: 1.5, aomori:1.4, iwate:1.4, miyagi:1.3, akita:1.4, yamagata:1.3, fukushima:1.3,
        niigata:1.3, toyama:1.2, ishikawa:1.2, fukui:1.1,
        nagano:1.3, yamanashi:1.2,
        okinawa: 0.7
    }
};

function updateAreaSettings() {
    const pref = document.getElementById('pref').value;
    const powerCo = DATA.prefToPowerCo[pref] || 'tepco';
    document.getElementById('powerCompany').value = powerCo;
    updatePowerPrice();
}

function fetchAveragePrices() {
    const pref = document.getElementById('pref').value;
    let gasPrice = 160;
    let oilPrice = 105;
    
    if (['hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'].includes(pref)) {
        gasPrice = 180; oilPrice = 110;
    } else if (['tokyo', 'kanagawa'].includes(pref)) {
        gasPrice = 145; oilPrice = 100;
    } else if (['chiba', 'saitama', 'ibaraki', 'tochigi', 'gunma'].includes(pref)) {
        gasPrice = 150; oilPrice = 105;
    } else if (['osaka', 'kyoto', 'hyogo', 'nara', 'wakayama', 'shiga'].includes(pref)) {
        gasPrice = 155; oilPrice = 100;
    } else if (['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'].includes(pref)) {
        gasPrice = 175; oilPrice = 115;
    } else {
        gasPrice = 160; oilPrice = 105;
    }
    
    document.getElementById('gasPrice').value = gasPrice;
    document.getElementById('oilPrice').value = oilPrice;
    calculate();
}

function updatePowerPrice() {
    const powerCo = document.getElementById('powerCompany').value;
    const plan = document.getElementById('powerPlan').value; // 'standard' or 'night'
    
    const prices = DATA.powerPrices[powerCo];
    if (plan === 'night') {
        document.getElementById('elecPriceDay').value = prices.day;
        document.getElementById('elecPriceNight').value = prices.night;
    } else {
        // Standard plan has single rate, we'll set both to day roughly.
        document.getElementById('elecPriceDay').value = prices.day;
        document.getElementById('elecPriceNight').value = prices.day;
    }
    calculate();
}

function calculate() {
    const pref = document.getElementById('pref').value;
    const baseEnergy = DATA.householdEnergy[document.getElementById('household').value];
    const cFactor = DATA.climateFactor[pref] || 1.0;
    const energy = baseEnergy * cFactor; // Adjusted energy required (kcal)

    const gasType = document.getElementById('gasType').value;
    const gasPrice = parseFloat(document.getElementById('gasPrice').value);
    const elecPriceDay = parseFloat(document.getElementById('elecPriceDay').value);
    const elecPriceNight = parseFloat(document.getElementById('elecPriceNight').value);
    const oilPrice = parseFloat(document.getElementById('oilPrice').value);
    const calValue = DATA.calorificValue[gasType];

    const currentType = document.getElementById('currentType').value;

    // 比較対象チェックボックスの同期とロック
    document.querySelectorAll('.target-select').forEach(cb => {
        if (cb.value === currentType) {
            cb.checked = true;
            cb.disabled = true;
        } else {
            cb.disabled = false;
        }
    });

    // Get selected targets
    const selectedTargets = Array.from(document.querySelectorAll('.target-select:checked')).map(el => el.value);

    function getCostData(targetId) {
        let gasCost = 0;
        let elecCost = 0;
        let oilCost = 0;
        
        switch (targetId) {
            case 'standard':
            case 'ecojours':
                gasCost = (energy / (DATA.efficiencies[targetId] * calValue)) * gasPrice;
                elecCost = 4000;
                break;
            case 'hybrid':
                const hGasEnergy = energy * 0.45;
                const hElecEnergy = (energy * 0.55) / 3.0 / 860;
                gasCost = (hGasEnergy / (DATA.efficiencies.ecojours * calValue)) * gasPrice;
                elecCost = hElecEnergy * elecPriceNight;
                break;
            case 'ecocute':
                const ecElecEnergy = energy / DATA.efficiencies.ecocute / 860;
                elecCost = ecElecEnergy * elecPriceNight;
                break;
            case 'enefarm':
                gasCost = (energy / (DATA.efficiencies.ecojours * calValue)) * gasPrice;
                const generatedElec = (energy / 6500000) * 1500;
                elecCost = -(generatedElec * elecPriceDay); 
                break;
            case 'ecofeel':
            case 'oil':
                oilCost = (energy / (DATA.efficiencies[targetId] * 8500)) * oilPrice;
                elecCost = 3000;
                break;
            case 'electric':
                const eElecEnergy = energy / DATA.efficiencies.electric / 860;
                elecCost = eElecEnergy * elecPriceNight;
                break;
        }

        // 計算式の文字列を生成
        let formula = "";
        const eStr = Math.round(energy).toLocaleString();
        const gP = gasPrice.toLocaleString();
        const dP = elecPriceDay.toLocaleString();
        const nP = elecPriceNight.toLocaleString();
        const oP = oilPrice.toLocaleString();

        if (targetId === 'standard' || targetId === 'ecojours') {
            const eff = DATA.efficiencies[targetId];
            formula = `ガス代: ${eStr}kcal ÷ (${eff} × ${calValue}) × ${gP}円 + 電気(待機等): 4,000円`;
        } else if (targetId === 'hybrid') {
            formula = `ガス(45%): (${eStr} × 0.45) ÷ (0.95 × ${calValue}) × ${gP}円 + 電気(55%): (${eStr} × 0.55) ÷ 3.0(COP) ÷ 860 × ${nP}円(夜間)`;
        } else if (targetId === 'ecocute') {
            formula = `電気代: ${eStr}kcal ÷ 3.5(COP) ÷ 860 × ${nP}円(夜間)`;
        } else if (targetId === 'enefarm') {
            formula = `ガス代: ${eStr}kcal ÷ (0.95 × ${calValue}) × ${gP}円 - 発電控除: (${eStr} ÷ 6.5M) × 1500kWh × ${dP}円`;
        } else if (targetId === 'ecofeel' || targetId === 'oil') {
            const eff = DATA.efficiencies[targetId];
            formula = `灯油代: ${eStr}kcal ÷ (${eff} × 8500) × ${oP}円 + 電気(待機等): 3,000円`;
        } else if (targetId === 'electric') {
            formula = `電気代: ${eStr}kcal ÷ 0.9(効率) ÷ 860 × ${nP}円(夜間)`;
        }

        return { 
            id: targetId, 
            name: targetId === currentType ? DATA.names[targetId] + ' (現在)' : DATA.names[targetId], 
            color: DATA.colors[targetId],
            gasCost, 
            elecCost,
            oilCost,
            total: gasCost + elecCost + oilCost,
            isCurrent: targetId === currentType,
            avgEqCost: DATA.averageCosts[targetId],
            formula: formula
        };
    }

    const currentTotalData = getCostData(currentType);
    let results = selectedTargets.map(targetId => getCostData(targetId));

    // 「現在」を常に先頭に配置する
    results.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return 0;
    });

    displayResults(results, currentTotalData);
    updateChart(results);
    updatePrintSummary(results, currentTotalData);
}

function updatePrintSummary(results, currentTotalData) {    const getSelectText = (id) => {
        const el = document.getElementById(id);
        return el.options[el.selectedIndex].text;
    };

    document.getElementById('print-pref').textContent = getSelectText('pref');
    document.getElementById('print-household').textContent = getSelectText('household');
    document.getElementById('print-power').textContent = getSelectText('powerCompany') + ' / ' + getSelectText('powerPlan');
    document.getElementById('print-gas').textContent = getSelectText('gasType');
    document.getElementById('print-gasPrice').textContent = document.getElementById('gasPrice').value + ' 円/m³';
    document.getElementById('print-elecPrice').textContent = document.getElementById('elecPriceDay').value + ' / ' + document.getElementById('elecPriceNight').value + ' 円/kWh';
    document.getElementById('print-oilPrice').textContent = document.getElementById('oilPrice').value + ' 円/L';
    document.getElementById('print-currentType').textContent = getSelectText('currentType');
    document.getElementById('print-target-info').textContent = getSelectText('pref') + ' ・ ' + getSelectText('household');
    document.getElementById('print-price-month').textContent = document.getElementById('priceRefMonth').value;

    const d = new Date();
    document.getElementById('currentDate').textContent = d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    if (!results || results.length === 0) return;

    // ヒーローカードの更新
    const currentTotal = currentTotalData.total;
    const minCostItem = results.reduce((prev, curr) => prev.total < curr.total ? prev : curr);
    let maxSaving = currentTotal - minCostItem.total;

    document.getElementById('print-hero-current').innerHTML = Math.round(currentTotal).toLocaleString() + '<span class="hero-unit">円</span>';
    document.getElementById('print-hero-best-name').textContent = minCostItem.name;
    document.getElementById('print-hero-best').innerHTML = Math.round(minCostItem.total).toLocaleString() + '<span class="hero-unit">円</span>';

    const sign = maxSaving >= 0 ? '▲ ' : '▼ ';
    document.getElementById('print-hero-savings-sign').textContent = sign;
    const savingsEl = document.getElementById('print-hero-savings');
    savingsEl.innerHTML = Math.abs(Math.round(maxSaving)).toLocaleString();
    
    if (maxSaving < 0) {
        savingsEl.style.color = '#e74c3c';
        document.getElementById('print-hero-savings-sign').style.color = '#e74c3c';
    } else {
        savingsEl.style.color = '';
        document.getElementById('print-hero-savings-sign').style.color = '';
    }

    // CSSバーチャートの生成
    const barsContainer = document.getElementById('print-css-bars');
    barsContainer.innerHTML = '';
    
    // 見た目のため「現在」を先頭にし、残りをコスト順にソート
    const sortedResults = [...results].sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return a.total - b.total;
    });
    const maxTotal = Math.max(...results.map(r => r.total), currentTotal);

    sortedResults.forEach(res => {
        const diff = currentTotal - res.total;
        const widthPct = Math.max(5, (res.total / maxTotal) * 100);
        const rowClass = res.isCurrent ? 'css-bar-row row-current' : 'css-bar-row';
        const diffText = diff >= 0 ? `▲${Math.round(diff).toLocaleString()}` : `▼${Math.abs(Math.round(diff)).toLocaleString()}`;
        const diffColor = diff >= 0 ? 'var(--success)' : '#e74c3c';
        
        barsContainer.innerHTML += `
            <div class="${rowClass}">
                <div class="css-bar-label">${res.name}</div>
                <div class="css-bar-track-wrapper">
                    <div class="css-bar-track">
                        <div class="css-bar-fill" style="width: ${widthPct}%; background: ${res.color};"></div>
                        <div class="css-bar-value">
                            <span class="css-bar-cost">¥${Math.round(res.total).toLocaleString()}</span>
                            <span class="css-bar-diff" style="color:${diffColor}">${diffText}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function displayResults(results, currentTotalData) {
    if (results.length === 0) {
        document.getElementById('currentCost').innerHTML = '-- <span class="summary-unit">円</span>';
        document.getElementById('hybridCost').innerHTML = '-- <span class="summary-unit">円</span>';
        document.getElementById('maxSaving').innerHTML = '-- <span class="summary-unit">円</span>';
        document.querySelector('#detailsTable tbody').innerHTML = '';
        return;
    }

    const currentTotal = currentTotalData.total;
    const minCostItem = results.reduce((prev, curr) => prev.total < curr.total ? prev : curr);
    
    let displayCompareCost = minCostItem.total;
    let maxSaving = currentTotal - minCostItem.total;
    
    document.getElementById('currentCost').innerHTML = Math.round(currentTotal).toLocaleString() + ' <span class="summary-unit">円</span>';
    document.getElementById('currentCost').previousElementSibling.textContent = "現在の年間コスト (" + currentTotalData.name + ")";
    
    document.getElementById('hybridCost').innerHTML = Math.round(displayCompareCost).toLocaleString() + ' <span class="summary-unit">円</span>';
    document.getElementById('hybridCost').previousElementSibling.innerHTML = "最安プラン導入時 (" + minCostItem.name + ")";
    
    document.getElementById('maxSaving').innerHTML = Math.round(maxSaving).toLocaleString() + ' <span class="summary-unit">円</span>';

    // Table updating
    const tbody = document.querySelector('#detailsTable tbody');
    tbody.innerHTML = '';
    
    results.forEach(res => {
        const row = document.createElement('tr');
        if (res.id === minCostItem.id) {
            row.classList.add('best-row');
        }
        if (res.isCurrent) {
            row.classList.add('current-row');
        }
        
        const diff = currentTotal - res.total;
        
        // Show minus values for electricity (Enefarm saving) cleanly
        const elecDisplay = res.elecCost < 0 
            ? `<span style="color:var(--success)">▲ ¥${Math.abs(Math.round(res.elecCost)).toLocaleString()}</span> (発電控除)`
            : `¥${Math.round(res.elecCost).toLocaleString()}`;
            
        let fuelCol = `¥${Math.round(res.gasCost).toLocaleString()}`;
        if(res.id === 'ecofeel' || res.id === 'oil') {
            fuelCol = `¥${Math.round(res.oilCost).toLocaleString()} <span style="font-size:10px;color:var(--text3)">(灯油)</span>`;
        }

        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <i data-lucide="chevron-right" class="formula-toggle-icon screen-only" style="width:14px; height:14px; cursor:pointer;"></i>
                    <strong style="color:${res.color}">${res.name}</strong>
                </div>
            </td>
            <td>¥${Math.round(res.avgEqCost).toLocaleString()}</td>
            <td>${fuelCol}</td>
            <td>${elecDisplay}</td>
            <td style="font-weight:700;">¥${Math.round(res.total).toLocaleString()}</td>
            <td style="color:${diff >= 0 ? 'var(--success)' : '#e74c3c'}; font-weight:600;">
                ${diff >= 0 ? '▲' : '▼'} ¥${Math.abs(Math.round(diff)).toLocaleString()}
            </td>
        `;
        tbody.appendChild(row);

        // 詳細（計算式）行を追加
        const formulaRow = document.createElement('tr');
        formulaRow.className = 'formula-row';
        formulaRow.innerHTML = `
            <td colspan="6">
                <div class="formula-content">
                    <strong>【計算式根拠】</strong><br>
                    ${res.formula}
                </div>
            </td>
        `;
        tbody.appendChild(formulaRow);

        // クリックイベントの追加 (画面用)
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            formulaRow.classList.toggle('active');
            const icon = row.querySelector('.formula-toggle-icon');
            if (icon) {
                icon.style.transform = formulaRow.classList.contains('active') ? 'rotate(90deg)' : 'rotate(0deg)';
            }
        });
    });
    lucide.createIcons();
}

function updateChart(results) {
    const ctx = document.getElementById('costChart').getContext('2d');
    
    if (costChart) {
        costChart.destroy();
    }

    if(results.length === 0) return;

    // Normalizing EneFarm negative electric cost in chart to not mess up stacked logic, 
    // we map them to two separate datasets for clarity if needed, or just let stacked handle negatives.
    // Chart.js handles stacked negatives by going below 0. That's actually correct!
    
    const datasets = [
        {
            label: '年間ガス代/灯油代',
            data: results.map(r => r.gasCost + r.oilCost),
            backgroundColor: results.map(r => r.color),
            borderColor: results.map(r => r.isCurrent ? '#000000' : 'transparent'),
            borderWidth: results.map(r => r.isCurrent ? {top: 2, right: 2, left: 2, bottom: 0} : 0),
            borderRadius: 4
        },
        {
            label: '年間電気代 (▲は発電控除)',
            data: results.map(r => r.elecCost),
            backgroundColor: '#c8c8c0',
            borderColor: results.map(r => r.isCurrent ? '#000000' : 'transparent'),
            borderWidth: results.map(r => r.isCurrent ? {top: 0, right: 2, left: 2, bottom: 0} : 0),
            borderRadius: 4
        }
    ];

    costChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.map(r => r.name),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Checkbox event listeners attachment
document.querySelectorAll('.target-select').forEach(cb => {
    cb.addEventListener('change', calculate);
});

// Input listeners
document.querySelectorAll('input[type="text"], input[type="number"], select').forEach(el => {
    el.addEventListener('change', () => {
        if(el.id === 'pref' || el.id === 'powerCompany' || el.id === 'powerPlan') return; // handled by specialized functions
        calculate();
    });
});

// Initial calculation
window.onload = () => {
    // Set initial region link
    updateAreaSettings();
    lucide.createIcons();
};
