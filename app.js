
// Storage helpers
const LS_KEY = 'opendoor_deals_v1';
const $ = (s,e=document)=>e.querySelector(s);
const $$ = (s,e=document)=>Array.from(e.querySelectorAll(s));
const fmt = n => new Intl.NumberFormat('ru-RU').format(n)+' ₸';

function loadDeals(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }catch(e){ return []; }
}
function saveDeals(deals){
  localStorage.setItem(LS_KEY, JSON.stringify(deals));
}

let deals = loadDeals();
if(deals.length===0){
  deals = [
    {id:'DL-001', client:'Айжан Н.', phone:'+7 777 000 11 22', amount:420000, stage:'КП/Накладная', source:'Instagram', mgr:'Даурен'},
    {id:'DL-002', client:'Талгат К.', phone:'+7 705 222 33 44', amount:980000, stage:'Оплата', source:'2ГИС', mgr:'Айнур'}
  ];
  saveDeals(deals);
}

const SCREENS = {};

SCREENS.pipeline = () => {
  const root = document.createElement('div');
  const info = document.createElement('div'); info.className='kb'; info.textContent='Свайп вниз для обновления. Быстрые действия в карточке.';
  root.appendChild(info);

  deals.forEach(d => {
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div><h3>${d.client}</h3><div class="kb">${d.phone} • Источник: ${d.source}</div></div>
        <span class="badge">${d.stage}</span>
      </div>
      <div class="row" style="margin-top:6px">
        <div class="stage">Сумма: ${fmt(d.amount||0)}</div>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn" data-action="quote">📄 КП</button>
        <button class="btn">💬 WhatsApp</button>
        <button class="btn primary" data-open>Открыть</button>
      </div>
    `;
    card.querySelector('[data-open]').onclick = () => render('deal', d.id);
    root.appendChild(card);
  });
  return root;
};

SCREENS.deal = (id) => {
  const d = deals.find(x=>x.id===id) || deals[0];
  const el = document.createElement('div'); el.className='list';
  el.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <h3>${d.client}</h3><span class="badge ok">${d.stage}</span>
      </div>
      <div class="kb">${d.phone} • Источник: ${d.source} • ID: ${d.id}</div>
      <div class="row" style="gap:10px;margin-top:10px">
        <button class="btn primary">📄 КП</button>
        <button class="btn">📜 Счёт</button>
        <button class="btn">📝 Накладная</button>
      </div>
    </div>
    <div class="card">
      <h3>Сумма и этап</h3>
      <div class="row">
        <button class="btn" id="nextStage">Следующий этап</button>
        <div class="stage">Сумма: ${fmt(d.amount||0)}</div>
      </div>
    </div>
  `;
  el.querySelector('#nextStage').onclick = () => {
    const stages = ['Лид','Контакт','Консультация','КП/Накладная','Оплата','Доставка','Установка'];
    const idx = stages.indexOf(d.stage);
    d.stage = stages[Math.min(idx+1, stages.length-1)];
    saveDeals(deals);
    render('deal', d.id);
  };
  return el;
};

SCREENS.clients = () => {
  const el = document.createElement('div');
  el.innerHTML = `<div class="card"><h3>Клиенты</h3><div class="kb">Список формируется из сделок автоматически.</div></div>`;
  return el;
};

SCREENS.docs = () => {
  const el = document.createElement('div');
  el.innerHTML = `<div class="card"><h3>Документы</h3><div class="kb">Генерация PDF на следующем шаге.</div></div>`;
  return el;
};

['warehouse','tasks','reports','settings'].forEach(name=>{
  SCREENS[name] = () => {
    const el = document.createElement('div');
    el.innerHTML = `<div class="card"><h3>${name}</h3><div class="kb">В разработке.</div></div>`;
    return el;
  };
});

function render(screen='pipeline', data=null){
  const mount = document.getElementById('screen');
  mount.innerHTML = '';
  const node = SCREENS[screen](data);
  mount.appendChild(node);
}

$$('.tabs button').forEach(b=> b.addEventListener('click', ()=>{
  $$('.tabs button').forEach(x=> x.classList.remove('active'));
  b.classList.add('active');
  render(b.dataset.screen);
}));

// Add Deal Sheet logic
const sheet = document.getElementById('addSheet');
const backdrop = document.getElementById('sheetBackdrop');
const fab = document.getElementById('fab');
const addTop = document.getElementById('addDealTop');
const fName = document.getElementById('fName');
const fPhone = document.getElementById('fPhone');
const fSource = document.getElementById('fSource');
const fAmount = document.getElementById('fAmount');

function clearForm(){
  fName.value='';
  fPhone.value='';
  fSource.value='Instagram';
  fAmount.value='';
}

function openSheet(){
  clearForm(); // <<< всегда чистая форма
  sheet.setAttribute('aria-hidden','false');
  backdrop.classList.add('show');
  fName.focus();
}

function closeSheet(){
  sheet.setAttribute('aria-hidden','true');
  backdrop.classList.remove('show');
}

fab.addEventListener('click', openSheet);
addTop.addEventListener('click', openSheet);
document.getElementById('cancelAdd').addEventListener('click', closeSheet);
backdrop.addEventListener('click', closeSheet);

document.getElementById('saveAdd').addEventListener('click', ()=>{
  const client = fName.value.trim();
  if(!client){ fName.focus(); return; }
  const phone = fPhone.value.trim();
  const source = fSource.value;
  const amount = parseInt(fAmount.value || '0', 10);
  const id = 'DL-' + String(Date.now()).slice(-6);
  const deal = {id, client, phone, amount, stage:'Лид', source, mgr:'Менеджер'};
  deals.unshift(deal);
  saveDeals(deals);
  closeSheet();                 // авто‑закрытие
  render('pipeline');           // мгновенно обновить список без перезагрузки
});

// Service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js'));
}

render();
