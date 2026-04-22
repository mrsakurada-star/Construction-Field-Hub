document.addEventListener('DOMContentLoaded', () => {
    renderPages();
    setupEventListeners();
    lucide.createIcons(); // 初期描画時のアイコン作成
});

/**
 * データのレンダリング
 */
function renderPages() {
    const container = document.getElementById('pages-container');
    if (!container) return;

    container.innerHTML = '';

    FREEZE_PREVENTION_DATA.forEach(data => {
        const pageEl = document.createElement('section');
        pageEl.className = 'page';
        pageEl.id = `page-${data.id}`;

        let sectionsHtml = '';
        data.sections.forEach(section => {
            let listHtml = '';
            if (section.items) {
                listHtml = `<ul class="list-items">${section.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }

            let stepsHtml = '';
            if (section.steps) {
                stepsHtml = `
                    <div class="step-box">
                        ${section.steps.map((step, index) => `
                            <div class="step-item">
                                <span class="step-number">${index + 1}</span>
                                <span class="step-text">${step}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            let alertHtml = '';
            if (section.caution) {
                alertHtml = `
                    <div class="alert alert-warning">
                        <i data-lucide="alert-triangle" class="alert-icon"></i>
                        <span>${section.caution}</span>
                    </div>
                `;
            } else if (section.important) {
                alertHtml = `
                    <div class="alert alert-important">
                        <i data-lucide="info" class="alert-icon"></i>
                        <span>${section.important}</span>
                    </div>
                `;
            }

            sectionsHtml += `
                <div class="section">
                    <h2 class="section-heading">${section.heading}</h2>
                    <p class="section-content">${section.content}</p>
                    ${listHtml}
                    ${stepsHtml}
                    ${alertHtml}
                </div>
            `;
        });

        pageEl.innerHTML = `
            <div class="brand-banner">PURPOSE</div>
            <div class="page-header">
                <div class="title-area">
                    <h1 class="page-title">
                        <i data-lucide="${data.icon}"></i>
                        ${data.title}
                    </h1>
                    <div class="header-actions">
                        <span class="category-tag">凍結予防マニュアル</span>
                        <button class="btn btn-outline btn-sm no-print" onclick="printSinglePage('page-${data.id}')">
                            <i data-lucide="printer"></i>
                            このページを印刷
                        </button>
                    </div>
                </div>
                <p class="page-subtitle">${data.subtitle}</p>
            </div>
            
            <div class="page-body">
                ${sectionsHtml}
            </div>

            <div class="print-footer">
                <span>Construction Field Hub - 凍結予防資料</span>
                <span>&copy; 2026 Nozomi Sakurada. All rights reserved.</span>
            </div>
        `;

        container.appendChild(pageEl);
    });

    // 動的に追加した要素に対してもアイコンを適用
    lucide.createIcons();
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    const printBtn = document.getElementById('print-all');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

/**
 * 特定のページのみを印刷する
 * @param {string} pageId 
 */
function printSinglePage(pageId) {
    const allPages = document.querySelectorAll('.page');
    
    // 他のページを一時的に印刷対象外にする
    allPages.forEach(p => {
        if (p.id !== pageId) {
            p.classList.add('no-print-force');
        }
    });

    window.print();

    // 元に戻す
    allPages.forEach(p => {
        p.classList.remove('no-print-force');
    });
}
