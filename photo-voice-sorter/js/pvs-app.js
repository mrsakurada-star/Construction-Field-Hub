// photo-voice-sorter/js/pvs-app.js
import { loadConfig, saveConfig } from './pvs-config.js';
import { isSpeechSupported, createRecognizer } from './pvs-speech.js';
import { isFileAccessSupported, pickImageDir, renameFile } from './pvs-files.js';
import { classifyPhoto } from './pvs-classify.js';
import { renderFileName, resolveCollision } from './pvs-naming.js';
import { buildExportJson, buildRenameCsv } from './pvs-export.js';

const $ = (id) => document.getElementById(id);
const status = (m) => { $('pvs-status').textContent = m; };

let cfg = loadConfig();
let dirHandle = null;
let files = [];
let photos = [];
let index = 0;
const usedNames = new Set();

function fillSettings() {
  $('cfg-proxy').value = cfg.proxyUrl;
  $('cfg-master').value = cfg.processMaster.join('\n');
  $('cfg-template').value = cfg.nameTemplate;
  $('pvs-process').innerHTML = cfg.processMaster.map((p) => `<option>${p}</option>`).join('');
}

function showCurrent() {
  if (index >= files.length) { status('全ての写真を処理しました。書き出してください。'); $('pvs-work').hidden = true; return; }
  $('pvs-work').hidden = false;
  $('pvs-photo').src = files[index].url;
  $('pvs-progress').textContent = `${index + 1} / ${files.length}`;
  $('pvs-spoken').textContent = '';
  $('pvs-title').value = '';
}

$('cfg-save').addEventListener('click', () => {
  cfg = { proxyUrl: $('cfg-proxy').value.trim(),
    processMaster: $('cfg-master').value.split('\n').map((s) => s.trim()).filter(Boolean),
    nameTemplate: $('cfg-template').value.trim() || '{工程}_{タイトル}_{連番}' };
  saveConfig(cfg); fillSettings(); status('設定を保存しました。');
});

$('pvs-pick').addEventListener('click', async () => {
  if (!isFileAccessSupported()) { status('この環境はフォルダ操作に未対応です（リネーム不可・CSVのみ）。'); return; }
  try {
    const picked = await pickImageDir();
    dirHandle = picked.dirHandle; files = picked.files;
    photos = []; index = 0; usedNames.clear();
    files.forEach((f) => usedNames.add(f.name));
    showCurrent();
  } catch (e) { status('フォルダ選択を中止しました。'); }
});

$('pvs-mic').addEventListener('click', () => {
  if (!isSpeechSupported()) { status('音声認識未対応。タイトルは手入力してください。'); return; }
  const rec = createRecognizer({
    onResult: async (text) => {
      $('pvs-spoken').textContent = text;
      if (!cfg.proxyUrl) { status('プロキシURL未設定。手入力で続行できます。'); return; }
      try {
        status('AI分類中…');
        const r = await classifyPhoto({ proxyUrl: cfg.proxyUrl, spokenText: text, processMaster: cfg.processMaster });
        $('pvs-title').value = r.title;
        if (r.process) $('pvs-process').value = r.process;
        status(r.process ? 'AI提案を反映しました。' : '工程はマスタ外のため手動選択してください。');
      } catch { status('AI分類に失敗。手入力で続行できます。'); }
    },
    onError: () => status('音声認識に失敗しました。もう一度お試しください。'),
  });
  rec.start(); status('聞き取り中…話してください。');
});

async function commit(confirmed) {
  const f = files[index];
  const seq = index + 1;
  let newName = f.name;
  if (confirmed) {
    const base = renderFileName({ template: cfg.nameTemplate,
      process: $('pvs-process').value, title: $('pvs-title').value, seq, ext: f.ext });
    newName = resolveCollision(base, usedNames);
    try { await renameFile(dirHandle, f.name, newName); usedNames.delete(f.name); usedNames.add(newName); }
    catch { status('リネーム失敗。CSV対応表で代替できます。'); newName = f.name; }
  }
  photos.push({ id: `photo_${String(seq).padStart(3, '0')}`, originalFileName: f.name,
    newFileName: newName, spokenText: $('pvs-spoken').textContent,
    title: $('pvs-title').value, process: confirmed ? $('pvs-process').value : null, confirmed });
  index += 1; showCurrent();
}

$('pvs-ok').addEventListener('click', () => commit(true));
$('pvs-skip').addEventListener('click', () => commit(false));

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

$('pvs-export-json').addEventListener('click', () => download('pvs-photos.json', buildExportJson(photos), 'application/json'));
$('pvs-export-csv').addEventListener('click', () => download('pvs-rename.csv', buildRenameCsv(photos), 'text/csv'));

fillSettings();
