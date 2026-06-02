/* © 2026 Nozomi Sakurada. All rights reserved. */
function navigateTo(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+pageId)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${pageId}"]`)?.classList.add('active');
  if(pageId==='customers') loadCustomers();
  if(pageId==='equipments') loadEquipments();
  if(pageId==='records') loadRecords();
  if(pageId==='intake') loadIntake();
}
function showToast(msg,type='success'){const t=document.getElementById('toast');t.textContent=msg;t.className=`toast toast-${type} show`;setTimeout(()=>t.classList.remove('show'),3000);}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function openModal(id){document.getElementById(id)?.classList.add('open');}
function closeModal(id){document.getElementById(id)?.classList.remove('open');}
function today(){return new Date().toISOString().slice(0,10);}
function fmtDate(s){
  if(!s) return '—';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return `${m[1]}/${m[2]}/${m[3]}`;
  const d = new Date(s);
  return isNaN(d) ? s : `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function fmtYen(n){if(n===null||n===undefined||n==='')return '¥0';return '¥'+Math.round(Number(n)).toLocaleString('ja-JP');}

// 後続タスクで本実装に差し替えるスタブ
function loadCustomers(){}
function loadEquipments(){}
function loadRecords(){}
function loadIntake(){}
function connectDataFolder(){}
function disconnectDataFolder(){}
function reconnectAllFiles(){}

window.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
    el.addEventListener('click',()=>navigateTo(el.dataset.page));
  });
  if(window.lucide) lucide.createIcons();
});
