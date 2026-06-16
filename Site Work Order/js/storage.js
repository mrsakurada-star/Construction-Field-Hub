/* © 2026 Nozomi Sakurada. All rights reserved. */

/**
 * フォーム全体の state 管理と localStorage への自動保存・復元を担当する。
 * 地図画像本体（Base64）は db.js（IndexedDB）が担当する。
 */

const SWO_STORAGE_KEY = 'siteWorkOrderState';

let state = null;

function createInitialState() {
  return {
    docNo: '',
    issueDate: '',
    projectName: '',
    address: '',
    dateFrom: '',
    dateTo: '',
    gatherTime: '',
    overview: '',
    itemsList: '',
    commonInstructions: '',
    hasMapImage: false,
    schedule: {}, // "contractorId_hour" -> true（手動セル）
    contractors: [
      { id: 1, name: '', content: '', notes: '', items: '' },
      { id: 2, name: '', content: '', notes: '', items: '' },
      { id: 3, name: '', content: '', notes: '', items: '' },
      { id: 4, name: '', content: '', notes: '', items: '' }
    ],
    nextId: 5
  };
}

function saveToStorage() {
  localStorage.setItem(SWO_STORAGE_KEY, JSON.stringify(state));
}

async function loadFromStorage() {
  const raw = localStorage.getItem(SWO_STORAGE_KEY);
  const init = createInitialState();
  if (!raw) {
    state = init;
    const dt = new Date();
    state.issueDate = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    return state;
  }

  const d = JSON.parse(raw);
  state = Object.assign({}, init, d);
  if (!Array.isArray(state.contractors) || !state.contractors.length) state.contractors = init.contractors;
  if (typeof state.schedule !== 'object' || !state.schedule) state.schedule = {};
  if (typeof state.hasMapImage !== 'boolean') state.hasMapImage = false;
  if (typeof state.nextId !== 'number') state.nextId = init.nextId;

  return state;
}

async function clearStorage() {
  state = createInitialState();
  localStorage.removeItem(SWO_STORAGE_KEY);
  await deleteMapImage();
}
