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
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;

    let html = '';
    PORTAL_TOOLS.forEach((tool, index) => {
        const delay = 0.04 + (index * 0.04);
        html += `
            <a class="tool-card" href="${tool.url}" target="_blank" style="animation-delay: ${delay}s">
                <div class="card-icon-wrap"><i data-lucide="${tool.icon}"></i></div>
                <div class="card-title">${tool.title}</div>
                <div class="card-desc">${tool.desc}</div>
                <div class="card-tags">
                    ${tool.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="card-open-btn">開く</span>
                    <span class="card-arrow">›</span>
                </div>
            </a>
        `;
    });

    // Add Placeholder
    const addDelay = 0.04 + (PORTAL_TOOLS.length * 0.04);
    html += `
        <div class="tool-card-add" style="animation-delay: ${addDelay}s">
            <div class="tool-card-add-icon"><i data-lucide="plus"></i></div>
            <div class="tool-card-add-text">
                ツールを追加できます<br>
                <span style="font-size:11px;">js/tools.js に新しいツール情報を<br>追加するだけで自動生成されます</span>
            </div>
        </div>
    `;

    grid.innerHTML = html;
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
