/* © 2026 Nozomi Sakurada. All rights reserved. */
function updatePreview() {
  saveToStorage();
  const area = document.getElementById('previewArea');
  const empty = document.getElementById('previewEmpty');
  const cover = getCoverData();

  area.querySelectorAll('.report-page').forEach(el => el.remove());

  const hasContent = cover.siteName || cover.workContent || photos.length > 0;
  empty.style.display = hasContent ? 'none' : 'flex';
  if (!hasContent) return;

  const coverPage = buildCoverPage(cover);
  area.appendChild(coverPage);

  const totalPages = Math.ceil(photos.length / 3) || 1;
  for (let page = 0; page < Math.max(photos.length === 0 ? 1 : Math.ceil(photos.length / 3), 1); page++) {
    const pagePhotos = photos.slice(page * 3, page * 3 + 3);
    const reportPage = buildReportPage(cover, pagePhotos, page + 1, totalPages + 1);
    area.appendChild(reportPage);
  }
}

function buildCoverPage(cover) {
  const page = document.createElement('div');
  page.className = 'report-page';
  page.setAttribute('data-page', 'cover');
  page.innerHTML = `
    <div class="cover-our-manage-no">弊社管理No：${escapeHtml(cover.ourManageNo) || '　'}</div>
    <div class="cover-title">工事写真報告書</div>
    <table class="cover-table" style="margin-bottom:12px">
      <tr><td>作成日</td><td>${formatDate(cover.date) || '　'}</td></tr>
      <tr><td>管理番号/注文番号</td><td>${escapeHtml(cover.manageNo) || '　'}</td></tr>
    </table>
    <table class="cover-table" style="margin-bottom:12px">
      <tr><td>現場名</td><td>${escapeHtml(cover.siteName) || '　'}</td></tr>
      <tr><td>現場住所</td><td>${escapeHtml(cover.address) || '　'}</td></tr>
      <tr><td>工事内容</td><td class="pre-line">${escapeHtml(cover.workContent) || '　'}</td></tr>
      <tr><td>工事日</td><td>${formatWorkPeriod(cover.workStartDate, cover.workEndDate)}</td></tr>
    </table>
    <table class="cover-table">
      <tr><td>所属</td><td>${escapeHtml(cover.affiliation) || '　'}</td></tr>
      <tr><td>担当者</td><td>${escapeHtml(cover.author) || '　'}</td></tr>
    </table>
  `;
  return page;
}

function buildReportPage(cover, pagePhotos, pageNum, totalPagesAll) {
  const page = document.createElement('div');
  page.className = 'report-page';
  page.setAttribute('data-page', pageNum);

  const siteName = escapeHtml(cover.siteName || '');
  const address = escapeHtml(cover.address || '');
  const workContent = escapeHtml(cover.workContent || '');
  const rAff = escapeHtml(cover.affiliation || '');
  const rAuth = escapeHtml(cover.author || '');
  const rDate = formatDate(cover.date);

  const headerHTML = `
    <div class="report-main-title">工事写真報告書</div>
    <div class="report-header">
      <div class="header-left">
        <table class="header-info-table header-info-top">
          <tr><td>報　告　日</td><td>${rDate}</td></tr>
          <tr><td>報告者所属</td><td>${rAff}</td></tr>
          <tr><td>作　成　者</td><td>${rAuth}</td></tr>
        </table>
        <table class="header-info-table">
          <tr><td>工　事　名</td><td>${siteName}　${workContent}</td></tr>
          <tr><td>住　　　所</td><td>${address}</td></tr>
          <tr><td>工　事　内　容</td><td>${workContent}</td></tr>
          <tr><td>工　事　日</td><td>${formatWorkPeriod(cover.workStartDate, cover.workEndDate)}</td></tr>
        </table>
      </div>
      <div class="header-right">
        <table class="approval-grid">
          <tr><td></td><td></td><td></td></tr>
          <tr><td></td><td></td><td></td></tr>
        </table>
      </div>
    </div>
  `;

  let rowsHTML = '<div class="photo-rows">';
  for (let i = 0; i < 3; i++) {
    const p = pagePhotos[i];
    if (p) {
      rowsHTML += `
        <div class="photo-row">
          <div class="photo-img-cell">
            <img src="${p.src}" alt="${escapeAttr(p.title)}">
          </div>
          <div class="photo-meta-cell">
            <div class="meta-row">
              <span class="meta-label">撮影日</span>
              <span class="meta-value">${formatDate(p.date) || '　'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">タイトル</span>
              <span class="meta-value">${escapeHtml(p.title) || '　'}</span>
            </div>
            <div class="meta-row meta-desc">
              <span class="meta-label">説　明</span>
              <span class="meta-value">${escapeHtml(p.desc) || '　'}</span>
            </div>
          </div>
        </div>`;
    } else {
      rowsHTML += `
        <div class="photo-row">
          <div class="photo-img-cell"><span class="no-photo">（写真なし）</span></div>
          <div class="photo-meta-cell">
            <div class="meta-row"><span class="meta-label">撮影日</span><span class="meta-value">　</span></div>
            <div class="meta-row"><span class="meta-label">タイトル</span><span class="meta-value">　</span></div>
            <div class="meta-row meta-desc"><span class="meta-label">説　明</span><span class="meta-value">　</span></div>
          </div>
        </div>`;
    }
  }
  rowsHTML += '</div>';

  const footerHTML = `<div class="report-footer">${pageNum + 1} / ${totalPagesAll} ページ</div>`;

  page.innerHTML = headerHTML + rowsHTML + footerHTML;
  return page;
}