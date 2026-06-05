/* © 2026 Nozomi Sakurada. All rights reserved. */
/**
 * 凍結予防方法まとめ - レンダリングロジック（完全版）
 *
 * カテゴリ別（普段・寒い日・不在時）にセクションを出し分ける。
 */

document.addEventListener('DOMContentLoaded', () => {
    renderPages();
    setupEventListeners();
    lucide.createIcons(); // 初期描画時のアイコン作成
    setupNavObserver();   // ナビゲーションのアクティブ切替
});

/* =====================================================
   カテゴリ設定（表示色・アイコン・ラベル）
===================================================== */
const CATEGORY_META = {
    normal: {
        label: '普段の凍結予防',
        icon: 'shield-check',
        colorClass: 'cat-normal'
    },
    cold: {
        label: '特に寒い日の凍結予防',
        icon: 'thermometer-snowflake',
        colorClass: 'cat-cold'
    },
    absent: {
        label: '不在時の凍結予防',
        icon: 'home-off',
        colorClass: 'cat-absent'
    }
};

/* =====================================================
   セクション内パーツのHTML生成（共通）
===================================================== */
function buildSectionHtml(section) {
    // 箇条書きリスト
    const listHtml = section.items
        ? `<ul class="list-items">${section.items.map(i => `<li>${i}</li>`).join('')}</ul>`
        : '';

    // ステップ（番号付き手順）
    const stepsHtml = section.steps
        ? `<div class="step-box">${section.steps.map((step, idx) => `
            <div class="step-item">
                <span class="step-number">${idx + 1}</span>
                <span class="step-text">${step}</span>
            </div>`).join('')}</div>`
        : '';

    // 注意・重要アラート
    let alertHtml = '';
    if (section.caution) {
        alertHtml = `
            <div class="alert alert-warning">
                <i data-lucide="alert-triangle" class="alert-icon"></i>
                <span>${section.caution}</span>
            </div>`;
    } else if (section.important) {
        alertHtml = `
            <div class="alert alert-important">
                <i data-lucide="info" class="alert-icon"></i>
                <span>${section.important}</span>
            </div>`;
    }

    return `
        <div class="section">
            <h3 class="section-heading">${section.heading}</h3>
            <p class="section-content">${section.content}</p>
            ${listHtml}
            ${stepsHtml}
            ${alertHtml}
        </div>`;
}

/* =====================================================
   ページのレンダリング
===================================================== */
function renderPages() {
    const container = document.getElementById('pages-container');
    if (!container) return;
    container.innerHTML = '';

    FREEZE_PREVENTION_DATA.forEach(data => {
        const pageEl = document.createElement('section');
        pageEl.className = 'page';
        pageEl.id = `page-${data.id}`;

        // ── カテゴリブロックのHTML ──
        let categoriesHtml = '';
        (data.categories || []).forEach(cat => {
            const meta = CATEGORY_META[cat.key] || { label: cat.title, icon: 'circle', colorClass: '' };
            const sectionsHtml = (cat.sections || []).map(buildSectionHtml).join('');
            const subtitleHtml = cat.subtitle
                ? `<span class="cat-subtitle">（${cat.subtitle}）</span>`
                : '';

            categoriesHtml += `
                <div class="category-block ${meta.colorClass}">
                    <div class="category-header">
                        <i data-lucide="${meta.icon}" class="cat-icon"></i>
                        <span class="cat-label">${meta.label}</span>
                        ${subtitleHtml}
                    </div>
                    <div class="category-body">
                        ${sectionsHtml}
                    </div>
                </div>`;
        });

        // ── ワンポイントアドバイス ──
        const tipHtml = data.tip ? `
            <div class="tip-box">
                <div class="tip-header">
                    <i data-lucide="lightbulb" class="tip-icon"></i>
                    <span class="tip-label">ワンポイントアドバイス</span>
                </div>
                <p class="tip-content">${data.tip}</p>
            </div>` : '';

        // ── ページ全体 ──
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
                        <button class="btn btn-outline btn-sm no-print" type="button" onclick="printSinglePage('page-${data.id}')">
                            <i data-lucide="printer"></i>
                            このページを印刷
                        </button>
                    </div>
                </div>
                <p class="page-subtitle">${data.subtitle}</p>
            </div>

            <div class="page-body">
                ${categoriesHtml}
                ${tipHtml}
            </div>

            <div class="print-footer">
                <span>Construction Field Hub - 凍結予防資料</span>
                <span>&copy; 2026 Nozomi Sakurada. All rights reserved.</span>
            </div>
        `;

        container.appendChild(pageEl);
    });

    // 動的に追加した要素にもアイコンを適用
    lucide.createIcons();
}

/* =====================================================
   イベントリスナー
===================================================== */
function setupEventListeners() {
    const printBtn = document.getElementById('print-all');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
}

/* =====================================================
   特定ページのみ印刷
===================================================== */
function printSinglePage(pageId) {
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => {
        if (p.id !== pageId) p.classList.add('no-print-force');
    });
    window.print();
    allPages.forEach(p => p.classList.remove('no-print-force'));
}

/* =====================================================
   ページ内ナビのアクティブ状態切替
   IntersectionObserver でスクロール位置を監視し、
   現在ビューポートにいちばん近いセクションのリンクを
   active クラスでハイライトする。
===================================================== */
function setupNavObserver() {
    const navLinks = document.querySelectorAll('.page-nav-link');
    if (!navLinks.length) return;

    // 交差率のしきい値を細かく設定してスムーズな切替を実現
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;
            navLinks.forEach(link => {
                const isActive = link.getAttribute('href') === `#${id}`;
                link.classList.toggle('active', isActive);
            });
        });
    }, {
        // ヘッダー(80px) + ナビ(48px) のオフセット分を rootMargin で補正
        rootMargin: '-128px 0px -60% 0px',
        threshold: 0
    });

    // レンダリング完了後にページ要素を監視対象に登録
    document.querySelectorAll('.page').forEach(page => observer.observe(page));

    // 初期表示時：一番上のリンクをアクティブに
    if (navLinks[0]) navLinks[0].classList.add('active');
}
