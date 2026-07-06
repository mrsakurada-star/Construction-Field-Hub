/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * PDF出力モジュール
 * html2canvas で各レポートページを画像化し、jsPDF で A4 PDF を生成する。
 */
async function exportPDF() {
  const pages = document.querySelectorAll('.report-page');
  if (!pages.length) {
    showToast('まず表紙情報を入力してプレビューを更新してください', false);
    return;
  }

  // プログレス表示開始
  const overlay  = document.getElementById('progressOverlay');
  const bar      = document.getElementById('progressBar');
  const label    = document.getElementById('progressLabel');
  overlay.classList.add('show');
  bar.style.width  = '0%';
  label.textContent = '準備中...';

  try {
    // A4 サイズ（mm）
    const A4_W = 210;
    const A4_H = 297;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];

      // プログレス更新
      const pct = Math.round((i / total) * 90);
      bar.style.width    = pct + '%';
      label.textContent  = `${i + 1} / ${total} ページを処理中...`;

      // .report-page を一時的にスクロール領域から切り離して絶対サイズで描画
      // （スクロールコンテナ内だと解像度がズレることがあるため）
      const canvas = await html2canvas(page, {
        scale:           2,           // 高解像度（Retina 相当）
        useCORS:         true,        // クロスオリジン画像を許可
        allowTaint:      false,
        backgroundColor: '#ffffff',
        logging:         false,
        // スクロールオフセットを補正
        scrollX:         0,
        scrollY:         -window.scrollY,
        // キャプチャ対象の幅・高さを .report-page の実際のサイズに固定
        windowWidth:     page.scrollWidth,
        windowHeight:    page.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // キャンバスのアスペクト比に合わせて PDF ページサイズを決定
      // （原則 A4 固定で収める）
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const ratio   = canvasH / canvasW;
      const pdfW    = A4_W;
      const pdfH    = pdfW * ratio; // A4幅に合わせた高さ

      // 2ページ目以降はページを追加
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // 画像を PDF ページいっぱいに貼り付け（高さが A4 を超える場合も A4 内に収める）
      const finalH = Math.min(pdfH, A4_H);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, finalH);
    }

    // 完了
    bar.style.width   = '100%';
    label.textContent = 'PDF を保存中...';

    // ファイル名を現場名から生成（使えない文字は除去）
    const siteName = document.getElementById('coverSiteName').value.replace(/\r?\n/g, ' ') || '工事写真報告書';
    const date     = document.getElementById('coverDate').value || '';
    const safeName = (siteName + (date ? '_' + date : '')).replace(/[\\/:*?"<>|]/g, '');
    pdf.save(safeName + '.pdf');

    setTimeout(() => {
      overlay.classList.remove('show');
      showToast('PDF を出力しました ✓');
    }, 500);

  } catch (err) {
    console.error('[PDF] 出力エラー:', err);
    overlay.classList.remove('show');
    showToast('PDF 出力に失敗しました: ' + err.message, false);
  }
}