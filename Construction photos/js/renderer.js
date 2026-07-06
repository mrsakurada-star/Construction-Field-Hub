/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * PDF/プレビュー出力用に、工程順 → phase順（前中後）→ 元の相対順序でソートした
 * photos のコピーを返す。photos 本体（写真管理タブでの表示順）は変更しない。
 */
function getSortedPhotosForExport() {
  const phaseRank = { before: 0, during: 1, after: 2 };
  const processRank = new Map(processes.map((pr, idx) => [pr.id, idx]));
  const UNASSIGNED_RANK = processes.length; // 未分類は最後

  return photos
    .map((p, idx) => ({ p, idx })) // 元の相対順序を保持するためのタイブレーカー
    .sort((a, b) => {
      const pidA = a.p.processId ?? null;
      const pidB = b.p.processId ?? null;
      const rankA = pidA === null ? UNASSIGNED_RANK : (processRank.get(pidA) ?? UNASSIGNED_RANK);
      const rankB = pidB === null ? UNASSIGNED_RANK : (processRank.get(pidB) ?? UNASSIGNED_RANK);
      if (rankA !== rankB) return rankA - rankB;

      const phaseA = phaseRank[a.p.phase] ?? 0;
      const phaseB = phaseRank[b.p.phase] ?? 0;
      if (phaseA !== phaseB) return phaseA - phaseB;

      return a.idx - b.idx;
    })
    .map(entry => entry.p);
}

/** 写真1枚が属する工程名を返す（未分類は 'その他'） */
function getProcessNameForPhoto(p) {
  if (p.processId === null || p.processId === undefined) return 'その他';
  const pr = processes.find(pr => pr.id === p.processId);
  return pr ? pr.name : 'その他';
}

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

  const hasSupplement = !!(cover.supplement && cover.supplement.trim());
  if (hasSupplement) {
    area.appendChild(buildSupplementPage(cover));
  }
  const frontPageCount = 1 + (hasSupplement ? 1 : 0); // 表紙 + （あれば）補足ページ

  const sortedPhotos = getSortedPhotosForExport();
  const totalPages = Math.max(Math.ceil(sortedPhotos.length / 3), 1);
  let lastProcessName = null;
  for (let page = 0; page < totalPages; page++) {
    const pagePhotos = sortedPhotos.slice(page * 3, page * 3 + 3);
    const pageProcessName = pagePhotos.length ? getProcessNameForPhoto(pagePhotos[0]) : null;
    const showProcessName = pageProcessName !== null && pageProcessName !== lastProcessName;
    lastProcessName = pageProcessName !== null ? pageProcessName : lastProcessName;
    const reportPage = buildReportPage(cover, pagePhotos, page + 1, totalPages + frontPageCount, showProcessName ? pageProcessName : '', frontPageCount);
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
      <tr><td>現場名</td><td class="pre-line">${escapeHtml(cover.siteName) || '　'}</td></tr>
      <tr><td>現場住所</td><td class="pre-line">${escapeHtml(cover.address) || '　'}</td></tr>
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

/** 補足情報ページを構築する（cover.supplement が空なら呼び出し側でスキップする） */
function buildSupplementPage(cover) {
  const page = document.createElement('div');
  page.className = 'report-page';
  page.setAttribute('data-page', 'supplement');
  page.innerHTML = `
    <div class="cover-title supplement-title">工事報告書 補足事項</div>
    <div class="supplement-body pre-line">${escapeHtml(cover.supplement)}</div>
  `;
  return page;
}

function buildReportPage(cover, pagePhotos, pageNum, totalPagesAll, processName, frontPageCount = 1) {
  const page = document.createElement('div');
  page.className = 'report-page';
  page.setAttribute('data-page', pageNum);

  // 写真ページのヘッダーは工事名（現場名）のみ。詳細は表紙ページに集約し、
  // 重複していた工事内容行と、空欄だった承認欄（□）は削除した。
  const siteName = escapeHtml(cover.siteName || '');
  const processRow = processName
    ? `<tr><td>工　程</td><td>${escapeHtml(processName)}</td></tr>`
    : '';

  const headerHTML = `
    <div class="report-main-title">工事写真報告書</div>
    <div class="report-header">
      <div class="header-left">
        <table class="header-info-table">
          <tr><td>工　事　名</td><td class="pre-line">${siteName}</td></tr>
          ${processRow}
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
              <span class="meta-value pre-line">${escapeHtml(p.desc) || '　'}</span>
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
            <div class="meta-row meta-desc"><span class="meta-label">説　明</span><span class="meta-value pre-line">　</span></div>
          </div>
        </div>`;
    }
  }
  rowsHTML += '</div>';

  const footerHTML = `<div class="report-footer">${pageNum + frontPageCount} / ${totalPagesAll} ページ</div>`;

  page.innerHTML = headerHTML + rowsHTML + footerHTML;
  return page;
}