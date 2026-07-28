/* © 2026 Nozomi Sakurada. All rights reserved. */
export function buildExportJson(photos, generatedAt = new Date().toISOString()) {
  return JSON.stringify({ generatedAt, photos }, null, 2);
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function buildRenameCsv(photos) {
  const header = 'original,new,process,title';
  const rows = photos.map((p) =>
    [p.originalFileName, p.newFileName, p.process, p.title].map(csvCell).join(',')
  );
  return [header, ...rows].join('\n') + '\n';
}
