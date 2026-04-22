/* © 2026 Nozomi Sakurada. All rights reserved. */
const nameInput = document.getElementById('company-name');
    const typeSelect = document.getElementById('manual-type');
    const dynamicNames = document.querySelectorAll('.dynamic-name');
    const manuals = document.querySelectorAll('.manual-content');

    nameInput.addEventListener('input', () => {
        const val = nameInput.value || '　　　　　　　　　';
        dynamicNames.forEach(el => el.textContent = val);
        document.title = val + '様向け_マニュアルツール';
    });

    typeSelect.addEventListener('change', () => {
        const target = 'manual-' + typeSelect.value;
        manuals.forEach(m => {
            m.classList.toggle('active', m.id === target);
        });
    });