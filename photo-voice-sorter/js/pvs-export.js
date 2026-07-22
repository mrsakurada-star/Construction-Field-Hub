export function buildExportJson(photos) {
  return JSON.stringify({ generatedAt: null, photos }, null, 2);
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
