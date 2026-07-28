/* © 2026 Nozomi Sakurada. All rights reserved. */
const KEY = 'pvs.config';

const DEFAULTS = {
  proxyUrl: '',
  processMaster: ['解体', '撤去', '配管', '電気配線', '据付', '接続', '試運転', '養生', '清掃', '完了検査'],
  nameTemplate: '{工程}_{タイトル}_{連番}',
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config));
}
