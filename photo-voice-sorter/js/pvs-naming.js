/* © 2026 Nozomi Sakurada. All rights reserved. */
const FORBIDDEN = /[\\/:*?"<>|]/g;

export function renderFileName({ template, process, title, seq, ext }) {
  const safe = (s) => String(s ?? '').replace(FORBIDDEN, '_');
  const seqStr = String(seq).padStart(3, '0');
  const base = template
    .replaceAll('{工程}', safe(process))
    .replaceAll('{タイトル}', safe(title))
    .replaceAll('{連番}', seqStr);
  return `${safe(base)}.${ext}`;
}

export function resolveCollision(name, existingSet) {
  if (!existingSet.has(name)) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot === -1 ? name : name.slice(0, dot);
  const ext = dot === -1 ? '' : name.slice(dot);
  let i = 2;
  let candidate = `${stem}-${i}${ext}`;
  while (existingSet.has(candidate)) {
    i += 1;
    candidate = `${stem}-${i}${ext}`;
  }
  return candidate;
}
