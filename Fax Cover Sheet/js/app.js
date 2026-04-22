/* © 2026 Nozomi Sakurada. All rights reserved. */
// Data binding
        const inputs = {
            docType: document.querySelectorAll('input[name="docType"]'),
            date: document.getElementById('input-date'),
            pages: document.getElementById('input-pages'),
            recipient: document.getElementById('input-recipient'),
            honorific: document.getElementById('input-honorific'),
            fax: document.getElementById('input-fax'),
            officeSelect: document.getElementById('input-office-select'),
            senderPerson: document.getElementById('input-sender-person'),
            subject: document.getElementById('input-subject'),
            message: document.getElementById('input-message'),
            enclosed: document.getElementById('input-enclosed')
        };

        const displays = {
            title: document.getElementById('display-title'),
            date: document.getElementById('display-date'),
            pages: document.getElementById('display-pages-count'),
            recipient: document.getElementById('display-recipient'),
            honorific: document.getElementById('display-honorific'),
            fax: document.getElementById('display-fax-number'),
            senderCompany: document.getElementById('display-sender-company'),
            senderOffice: document.getElementById('display-sender-office'),
            senderZip: document.getElementById('display-sender-zip'),
            senderAddress: document.getElementById('display-sender-address'),
            senderBuilding: document.getElementById('display-sender-building'),
            senderTel: document.getElementById('display-sender-tel'),
            senderFax: document.getElementById('display-sender-fax'),
            senderPerson: document.getElementById('display-sender-person'),
            subject: document.getElementById('display-subject'),
            message: document.getElementById('display-message'),
            enclosed: document.getElementById('display-enclosed'),
            enclosedSection: document.getElementById('enclosed-section'),
            faxRow: document.getElementById('display-fax-row'),
            pagesRow: document.getElementById('display-pages-row')
        };

        // Embedded Office Data Fallback (Used if LocalStorage DB is missing)
        const fallbackOfficeData = [
            { id: 'honbu', name: 'リビングソリューション本部', zip: '〒170-0013', address: '東京都豊島区東池袋1-18-1', building: 'Hareza Tower 12F', tel: '03-4221-3495', fax: '03-4221-3901' },
            { id: 'tokyo', name: 'リビングソリューション東京', zip: '〒170-0005', address: '東京都豊島区南大塚3-46-3', building: 'いちご大塚ビル7F', tel: '03-5977-3590', fax: '03-5977-3591' },
            { id: 'chiba', name: 'リビングソリューション千葉', zip: '〒275-0012', address: '千葉県習志野市本大久保4-19-18', building: '', tel: '047-455-7122', fax: '047-473-4050' },
            { id: 'kanagawa', name: 'リビングソリューション神奈川', zip: '〒224-0051', address: '神奈川県横浜市都筑区富士見が丘1-40-101', building: '', tel: '045-942-2334', fax: '045-943-0365' },
            { id: 'saitama', name: 'リビングソリューション埼玉', zip: '〒333-0861', address: '埼玉県川口市柳崎5-15-7', building: 'トミタビル1F', tel: '-', fax: '-' },
            { id: 'sapporo', name: 'リビングソリューション札幌', zip: '〒060-0035', address: '北海道札幌市中央区北5条東3-1-20', building: 'ライオンズ札幌クロスタウン101', tel: '011-221-8045', fax: '011-221-8046' },
            { id: 'akita', name: 'リビングソリューション北東北(秋田・青森)', zip: '〒010-0973', address: '秋田県秋田市八橋本町3-20-36', building: 'M2ビル1F', tel: '018-883-0866', fax: '018-864-3052' },
            { id: 'morioka', name: 'リビングソリューション北東北(盛岡・八戸)', zip: '〒020-0866', address: '岩手県盛岡市本宮1-6-16', building: '佐藤ビル1F', tel: '019-631-2133', fax: '019-635-4449' },
            { id: 'sendai', name: 'リビングソリューション仙台', zip: '〒984-0032', address: '宮城県仙台市若林区荒井字丑ノ頭101-1', building: '', tel: '022-288-3320', fax: '022-288-3314' },
            { id: 'niigata', name: 'リビングソリューション新潟', zip: '〒950-0823', address: '新潟県新潟市東区東中島2-7-30', building: 'マルヤビル1F2号', tel: '025-277-4081', fax: '025-277-4082' },
            { id: 'nagano', name: 'リビングソリューション長野', zip: '〒390-0821', address: '長野県松本市筑摩1-13-17', building: 'ビューティプラザ山田ビル', tel: '026-326-5593', fax: '026-326-5594' },
            { id: 'shizuoka', name: 'リビングソリューション静岡', zip: '〒417-0834', address: '静岡県富士市西柏原新田201', building: '', tel: '0545-33-3917', fax: '0545-33-4040' },
            { id: 'nagoya', name: 'リビングソリューション名古屋', zip: '〒454-0846', address: '愛知県名古屋市中川区上流町2-71', building: '', tel: '052-365-3247', fax: '052-363-1418' },
            { id: 'kanazawa', name: 'リビングソリューション金沢', zip: '〒921-8015', address: '石川県金沢市東力4-1-102', building: '', tel: '076-291-5521', fax: '076-291-5531' },
            { id: 'osaka', name: 'リビングソリューション大阪', zip: '〒564-0051', address: '大阪府吹田市豊津町13-24', building: '江坂リツエイビル6F', tel: '06-6386-8889', fax: '06-6339-3018' },
            { id: 'keiji', name: 'リビングソリューション京滋', zip: '〒601-1351', address: '京都府京都市伏見区醍醐和泉町12', building: '', tel: '075-572-3213', fax: '075-572-2871' },
            { id: 'hiroshima', name: 'リビングソリューション広島', zip: '〒731-0122', address: '広島県広島市安佐南区中筋3-28-13', building: '中筋駅前ビル4F', tel: '082-877-7753', fax: '082-877-7756' },
            { id: 'takamatsu', name: 'リビングソリューション高松', zip: '〒761-8071', address: '香川県高松市伏石町2017-26', building: '', tel: '087-867-1828', fax: '087-867-1838' },
            { id: 'matsuyama', name: 'リビングソリューション松山', zip: '〒790-0952', address: '愛媛県松山市朝生田町7-1-32', building: 'TAビル2F', tel: '089-947-3756', fax: '089-947-3754' },
            { id: 'fukuoka', name: 'リビングソリューション福岡', zip: '〒812-0895', address: '福岡県福岡市博多区竹下1-15-40', building: 'ラ・パルクステーション竹下公園通り1F', tel: '092-433-3780', fax: '092-433-3735' },
            { id: 'okinawa', name: 'リビングソリューション沖縄', zip: '〒903-0806', address: '沖縄県那覇市首里汀良町2-21', building: '', tel: '098-887-5150', fax: '050-3153-7764' },
            { id: 'aqua', name: 'アクア事業部門本部', zip: '〒170-0013', address: '東京都豊島区東池袋1-18-1', building: 'Hareza Tower 12F', tel: '03-5977-3570', fax: '050-3730-0367' },
        ];

        // Active office database
        let activeOfficeData = [...fallbackOfficeData];

        // Populate Office Select
        function initOfficeSelect(preserveSelection = false) {
            const currentVal = inputs.officeSelect.value;
            inputs.officeSelect.innerHTML = ''; // Clear options

            activeOfficeData.forEach((office, index) => {
                const opt = document.createElement('option');
                opt.value = office.id || `office_${index}`; // support scraped IDs
                opt.textContent = office.name;

                if (preserveSelection && currentVal === opt.value) {
                    opt.selected = true;
                } else if (!preserveSelection && office.id === 'akita') {
                    // Set default to Akita initially if no valid selection exists
                    opt.selected = true;
                }

                inputs.officeSelect.appendChild(opt);
            });
            updatePreview(); // refresh display
        }


        // Date Handling
        function getReiwaYear(year) {
            const reiwaBase = 2018;
            const reiwaYear = year - reiwaBase;
            if (reiwaYear === 1) return "元";
            return reiwaYear;
        }

        function formatJapaneseDate(dateStr) {
            if (!dateStr) return "";
            const d = new Date(dateStr);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const reiwa = getReiwaYear(year);

            return `令和${reiwa}年 ${month}月 ${day}日`;
        }

        // Persistence
        function saveToLocal() {
            const data = {
                office: inputs.officeSelect.value,
                pages: inputs.pages.value,
                recipient: inputs.recipient.value,
                honorific: inputs.honorific.value,
                fax: inputs.fax.value,
                senderPerson: inputs.senderPerson.value,
                subject: inputs.subject.value,
                message: inputs.message.value,
                enclosed: inputs.enclosed.value
            };
            localStorage.setItem('fax_sender_data', JSON.stringify(data));
        }

        function loadFromLocal() {
            const saved = localStorage.getItem('fax_sender_data');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.office) inputs.officeSelect.value = data.office;
                inputs.pages.value = data.pages || "";
                inputs.recipient.value = data.recipient || "";
                inputs.honorific.value = data.honorific || "様";
                inputs.fax.value = data.fax || "";
                inputs.senderPerson.value = data.senderPerson || "";
                inputs.subject.value = data.subject || "";
                inputs.message.value = data.message || "";
                inputs.enclosed.value = data.enclosed || "";
            }
        }

        function updatePreview() {
            // Title & Types
            let selectedType = "FAX送信票";
            inputs.docType.forEach(radio => {
                if (radio.checked) selectedType = radio.value;
            });
            displays.title.innerText = selectedType;

            if (selectedType === "書類送付状") {
                displays.faxRow.style.display = 'none';
                displays.pagesRow.style.display = 'none';
            } else {
                displays.faxRow.style.display = 'flex';
                displays.pagesRow.style.display = 'flex';
            }

            // Text values
            displays.date.innerText = formatJapaneseDate(inputs.date.value);
            displays.recipient.innerText = inputs.recipient.value || "（宛先未入力）";
            displays.honorific.innerText = inputs.honorific.value;
            displays.fax.innerText = inputs.fax.value;
            displays.senderPerson.innerText = inputs.senderPerson.value;
            displays.subject.innerText = inputs.subject.value ? "件名：" + inputs.subject.value : "（件名未入力）";
            displays.pages.innerText = (inputs.pages.value || "1") + " 枚 (本状を含む)";

            // Handle Office Display
            const selectedOfficeData = activeOfficeData.find(o => o.id === inputs.officeSelect.value) || activeOfficeData[6] || activeOfficeData[0]; // fallback
            displays.senderOffice.innerText = selectedOfficeData.name;
            displays.senderZip.innerText = selectedOfficeData.zip;
            displays.senderAddress.innerText = selectedOfficeData.address;
            displays.senderBuilding.innerText = selectedOfficeData.building || '';
            displays.senderBuilding.style.display = selectedOfficeData.building ? 'inline' : 'none';
            displays.senderTel.innerText = selectedOfficeData.tel;
            displays.senderFax.innerText = selectedOfficeData.fax;

            const msg = inputs.message.value;
            displays.message.innerText = msg || "拝啓\n\n時下ますますご清栄のこととお慶び申し上げます。平素は格別のご高配を賜り、厚く御礼申し上げます。\n\nさて、下記の通り書類を送付いたしましたので、ご査収のほどよろしくお願い申し上げます。\n何卒よろしくお願いいたします。\n\n敬具";

            if (inputs.enclosed.value.trim()) {
                displays.enclosedSection.style.display = 'block';
                displays.enclosed.innerText = inputs.enclosed.value;
            } else {
                displays.enclosedSection.style.display = 'none';
            }

            saveToLocal();
        }

        // Remote Fetch Logic (via CORS proxy)
        async function fetchOfficesOnline() {
            const btn = document.getElementById('btn-update-offices');
            const statusBox = document.getElementById('office-update-status');

            btn.disabled = true;
            btn.innerText = '取得中...';
            statusBox.style.display = 'block';
            statusBox.innerText = 'サーバーから最新データを抽出しています...';
            statusBox.style.color = '#666';

            try {
                // Use AllOrigins as a free public CORS proxy to circumvent browser file:// limits
                const url = 'https://www.purpose-ecotech.co.jp/company/office/';
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Network response failed');
                const data = await response.json();

                // Parse returned HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');

                const newOffices = [];
                // Target list items <li> that contain office chunks based on purposeful markup
                const listItems = doc.querySelectorAll('li');

                listItems.forEach((li, index) => {
                    const text = li.innerText;
                    // Extremely robust identifying heuristical markers
                    if (text.includes('〒') && (text.includes('TEL：') || text.includes('FAX：'))) {
                        // Attempt to extract lines
                        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                        if (lines.length < 3) return; // not enough data

                        const office = {
                            id: `scraped_${index}`,
                            name: lines[0] || '不明な事業所',
                            zip: '',
                            address: '',
                            building: '',
                            tel: '-',
                            fax: '-'
                        };

                        // Parse subsequent lines
                        for (let i = 1; i < lines.length; i++) {
                            const line = lines[i];
                            if (line.includes('〒')) {
                                office.zip = line.match(/(〒[0-9]{3}-[0-9]{4})/)?.[1] || line;
                            } else if (line.includes('TEL：')) {
                                office.tel = line.replace('TEL：', '').trim();
                            } else if (line.includes('FAX：')) {
                                office.fax = line.replace('FAX：', '').trim();
                            } else if (!line.includes('地図') && !line.includes('お問い合わせ') && line.length > 3) {
                                // Assume it's an address or building
                                if (!office.address) { office.address = line; }
                                else if (!office.building && !line.includes('〒')) { office.building = line; }
                            }
                        }

                        if (office.zip && office.address) {
                            newOffices.push(office);
                        }
                    }
                });

                if (newOffices.length > 0) {
                    activeOfficeData = newOffices;
                    // Save to local custom DB
                    localStorage.setItem('fax_office_db', JSON.stringify(newOffices));

                    initOfficeSelect(false); // rebuild options
                    statusBox.innerText = `成功：${newOffices.length}件の事業所データを最新に更新しました。`;
                    statusBox.style.color = '#2e7d32'; // green

                    setTimeout(() => { statusBox.style.display = 'none'; }, 5000);
                } else {
                    throw new Error('No offices could be parsed. Website structure may have changed.');
                }

            } catch (error) {
                console.error("Scraping failed:", error);
                statusBox.innerText = 'エラー：抽出に失敗しました。時間をおいて再試行してください。';
                statusBox.style.color = '#c62828'; // red
            } finally {
                btn.disabled = false;
                btn.innerText = '🔄 最新データ取得';
            }
        }

        // Initialize
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        inputs.date.value = `${yyyy}-${mm}-${dd}`;

        // Attempt to load scraped DB from localStorage first
        const savedDB = localStorage.getItem('fax_office_db');
        if (savedDB) {
            try {
                const parsedDB = JSON.parse(savedDB);
                if (parsedDB && parsedDB.length > 5) { // valid check
                    activeOfficeData = parsedDB;
                }
            } catch (e) { }
        }

        initOfficeSelect(true);
        loadFromLocal();

        // Add listeners
        Object.values(inputs).forEach(input => {
            if (input instanceof NodeList) {
                input.forEach(i => i.addEventListener('change', updatePreview));
            } else {
                input.addEventListener('input', updatePreview);
            }
        });

        // Initial update
        updatePreview();