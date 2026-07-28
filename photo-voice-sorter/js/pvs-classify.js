/* © 2026 Nozomi Sakurada. All rights reserved. */
export function validateProcess(candidate, processMaster) {
  const c = String(candidate ?? '').trim();
  return processMaster.includes(c) ? c : null;
}

export async function classifyPhoto({ proxyUrl, spokenText, processMaster, fetchFn }) {
  const doFetch = fetchFn || globalThis.fetch;
  const res = await doFetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spokenText, processMaster }),
  });
  if (!res.ok) throw new Error(`classify_failed_${res.status}`);
  const data = await res.json();
  return {
    title: data.title || '',
    process: validateProcess(data.process, processMaster),
  };
}
