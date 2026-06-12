/* © 2026 Nozomi Sakurada. All rights reserved. */
document.addEventListener('DOMContentLoaded', () => {
    initPortal();
});

function initPortal() {
    renderTools();
    renderUpdates();
    updateToolCount();

    // Lucideアイコンの初期化（少し待機して要素のレンダリングを確実にする）
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.error('Lucide library not found.');
    }
}

function renderTools() {
    const sections = {
        'site-mgmt': {
            label: 'SITE MANAGEMENT',
            gridId: 'toolsGrid-siteManagement'
        },
        'calculation': {
            label: 'CALCULATION & SIMULATION',
            gridId: 'toolsGrid-calculation'
        },
        'maintenance': {
            label: 'MAINTENANCE & SALES',
            gridId: 'toolsGrid-maintenance'
        },
        'biz-tool': {
            label: 'BUSINESS TOOLS',
            gridId: 'toolsGrid-bizTools'
        }
    };

    // 各セクション別にレンダリング
    let globalIndex = 0;
    for (const [categoryId, section] of Object.entries(sections)) {
        const tools = PORTAL_TOOLS.filter(t => t.category === categoryId);
        const grid = document.getElementById(section.gridId);

        if (grid) {
            grid.innerHTML = '';
            tools.forEach((tool, index) => {
                const card = createToolCard(tool, globalIndex);
                grid.appendChild(card);
                globalIndex++;
            });
        }
    }

    // Add Placeholder（最後のセクション後に追加）
    const lastGrid = document.getElementById('toolsGrid-bizTools');
    if (lastGrid) {
        const addDelay = 0.04 + (globalIndex * 0.04);
        const addCard = document.createElement('div');
        addCard.className = 'tool-card-add';
        addCard.style.animationDelay = `${addDelay}s`;
        addCard.innerHTML = `
            <div class="tool-card-add-icon"><i data-lucide="plus"></i></div>
            <div class="tool-card-add-text">
                ツールを追加できます<br>
                <span style="font-size:11px;">js/tools.js に新しいツール情報を<br>追加するだけで自動生成されます</span>
            </div>
        `;
        lastGrid.appendChild(addCard);
    }
}

// 既存の createToolCard 関数
function createToolCard(tool, index) {
    const a = document.createElement('a');
    a.className = 'tool-card';
    a.href = tool.url;
    a.target = '_blank';
    a.style.animationDelay = `${0.04 + (index * 0.04)}s`;

    const tagHTML = tool.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('');

    a.innerHTML = `
        <div class="card-header">
            <div class="card-icon-wrap">
                <i data-lucide="${tool.icon}"></i>
            </div>
            <div class="card-title">${tool.title}</div>
        </div>
        <div class="card-desc">${tool.desc}</div>
        <div class="card-tags">${tagHTML}</div>
        <div class="card-footer">
            <span class="card-open-btn">開く</span>
            <span class="card-arrow">→</span>
        </div>
    `;

    return a;
}

function renderUpdates() {
    const list = document.getElementById('updatesList');
    if (!list || typeof PORTAL_UPDATES === 'undefined') return;

    // 最新順にソート
    const sorted = [...PORTAL_UPDATES].sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    sorted.forEach((upd, idx) => {
        const isOpen = idx === 0 ? 'open' : '';
        const delay = 0.4 + (idx * 0.1);
        
        html += `
            <details class="update-item" ${isOpen} style="animation-delay: ${delay}s">
                <summary class="update-summary">
                    <div class="update-header">
                        <span class="update-date">${upd.date.replace(/-/g, '.')}</span>
                        <span class="update-tool-badge">${upd.toolName}</span>
                        ${upd.version ? `<span class="update-version">${upd.version}</span>` : ''}
                    </div>
                    <i data-lucide="chevron-down" class="update-chevron"></i>
                </summary>
                <div class="update-content">
                    <ul class="update-changes">
                        ${upd.changes.map(change => `<li>${change}</li>`).join('')}
                    </ul>
                </div>
            </details>
        `;
    });

    list.innerHTML = html;
}

function updateToolCount() {
    const countEl = document.getElementById('toolCountNum');
    if (countEl) {
        countEl.textContent = PORTAL_TOOLS.length;
    }
}

function toggleGuide() {
    const btn = document.getElementById('guideToggle');
    const panel = document.getElementById('guidePanel');
    if(btn && panel) {
        btn.classList.toggle('open');
        panel.classList.toggle('open');
    }
}

function copyGuideCode(btn) {
    const code = btn.closest('.guide-code-block').querySelector('code');
    if (!code) return;
    navigator.clipboard.writeText(code.textContent.trim()).then(() => {
        btn.textContent = 'コピー済み';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = 'コピー';
            btn.classList.remove('copied');
        }, 2000);
    });
}
